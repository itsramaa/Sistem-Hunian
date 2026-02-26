
-- 1. Add address_type to addresses
ALTER TABLE addresses ADD COLUMN IF NOT EXISTS address_type text DEFAULT 'property';

-- 2. Migrate merchant addresses
INSERT INTO addresses (street_address, city, province, postal_code, address_type)
SELECT DISTINCT m.address, m.city, m.province, COALESCE(m.postal_code, ''), 'headquarters'
FROM merchants m
WHERE m.address IS NOT NULL AND m.address != ''
AND m.address_id IS NULL
AND NOT EXISTS (
  SELECT 1 FROM addresses a WHERE a.street_address = m.address AND a.city = m.city AND a.province = m.province
)
ON CONFLICT DO NOTHING;

UPDATE merchants m SET address_id = a.id
FROM addresses a
WHERE m.address_id IS NULL AND m.address IS NOT NULL AND m.address != ''
AND a.street_address = m.address AND a.city = m.city AND a.province = m.province;

-- 3. Migrate property addresses
INSERT INTO addresses (street_address, city, province, postal_code, latitude, longitude, address_type)
SELECT DISTINCT p.address, p.city, p.province, COALESCE(p.postal_code, ''), p.latitude, p.longitude, 'property'
FROM properties p
WHERE p.address IS NOT NULL AND p.address != ''
AND p.address_id IS NULL
AND NOT EXISTS (
  SELECT 1 FROM addresses a WHERE a.street_address = p.address AND a.city = p.city AND a.province = p.province
)
ON CONFLICT DO NOTHING;

UPDATE properties p SET address_id = a.id
FROM addresses a
WHERE p.address_id IS NULL AND p.address IS NOT NULL AND p.address != ''
AND a.street_address = p.address AND a.city = p.city AND a.province = p.province;

-- 4. Set address_type for merchant-linked records
UPDATE addresses SET address_type = 'headquarters'
WHERE id IN (SELECT address_id FROM merchants WHERE address_id IS NOT NULL);

-- 5. Drop trigger BEFORE dropping columns it depends on
DROP TRIGGER IF EXISTS trg_merchants_search_update ON merchants;

-- 6. Update search function (no longer references city/province)
CREATE OR REPLACE FUNCTION public.merchants_search_update()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
BEGIN
  NEW.search_vector := to_tsvector('simple',
    coalesce(NEW.business_name, '') || ' ' ||
    coalesce(NEW.merchant_code, '') || ' ' ||
    coalesce(NEW.business_type, '')
  );
  RETURN NEW;
END;
$$;

-- 7. Recreate trigger with updated function
CREATE TRIGGER trg_merchants_search_update
  BEFORE INSERT OR UPDATE ON merchants
  FOR EACH ROW EXECUTE FUNCTION merchants_search_update();

-- 8. Rename address_id -> headquarters_address_id, add billing_address_id
ALTER TABLE merchants RENAME COLUMN address_id TO headquarters_address_id;
ALTER TABLE merchants ADD COLUMN IF NOT EXISTS billing_address_id UUID REFERENCES addresses(id);

-- 9. Drop views
DROP VIEW IF EXISTS v_merchants_with_addresses;
DROP VIEW IF EXISTS v_properties_with_addresses;
DROP VIEW IF EXISTS merchant_property_summary;

-- 10. Drop old columns from merchants
ALTER TABLE merchants DROP COLUMN IF EXISTS address;
ALTER TABLE merchants DROP COLUMN IF EXISTS city;
ALTER TABLE merchants DROP COLUMN IF EXISTS province;
ALTER TABLE merchants DROP COLUMN IF EXISTS postal_code;

-- 11. Drop old columns from properties
ALTER TABLE properties DROP COLUMN IF EXISTS address;
ALTER TABLE properties DROP COLUMN IF EXISTS city;
ALTER TABLE properties DROP COLUMN IF EXISTS province;
ALTER TABLE properties DROP COLUMN IF EXISTS postal_code;
ALTER TABLE properties DROP COLUMN IF EXISTS latitude;
ALTER TABLE properties DROP COLUMN IF EXISTS longitude;

-- 12. Recreate views
CREATE VIEW v_merchants_with_addresses AS
SELECT m.*,
  a.street_address AS resolved_address,
  a.city AS resolved_city,
  a.province AS resolved_province,
  a.postal_code AS resolved_postal_code
FROM merchants m
LEFT JOIN addresses a ON m.headquarters_address_id = a.id;

CREATE VIEW v_properties_with_addresses AS
SELECT p.*,
  a.street_address AS resolved_address,
  a.city AS resolved_city,
  a.province AS resolved_province,
  a.postal_code AS resolved_postal_code,
  a.latitude AS resolved_latitude,
  a.longitude AS resolved_longitude
FROM properties p
LEFT JOIN addresses a ON p.address_id = a.id;

CREATE VIEW merchant_property_summary AS
SELECT m.id AS merchant_id, m.business_name, m.verification_status,
  st.name AS subscription_tier,
  count(DISTINCT p.id) AS property_count,
  count(DISTINCT u.id) AS unit_count,
  count(DISTINCT CASE WHEN u.status = 'occupied' THEN u.id END) AS occupied_units,
  count(DISTINCT c.id) FILTER (WHERE c.status = 'active') AS active_contracts,
  COALESCE(sum(i.amount) FILTER (WHERE i.status = 'paid'), 0) AS total_revenue
FROM merchants m
LEFT JOIN merchant_subscriptions ms ON ms.merchant_id = m.id AND ms.status = 'active'
LEFT JOIN subscription_tiers st ON st.id = ms.tier_id
LEFT JOIN properties p ON p.merchant_id = m.id
LEFT JOIN units u ON u.property_id = p.id
LEFT JOIN contracts c ON c.merchant_id = m.id
LEFT JOIN invoices i ON i.merchant_id = m.id
GROUP BY m.id, m.business_name, m.verification_status, st.name;

-- 13. Update RLS policies
DROP POLICY IF EXISTS "Addresses viewable by authenticated users" ON addresses;
DROP POLICY IF EXISTS "Addresses manageable by owner merchants" ON addresses;

CREATE POLICY "Addresses viewable by authenticated users" ON addresses FOR SELECT TO authenticated
USING (
  EXISTS (SELECT 1 FROM merchants m WHERE m.headquarters_address_id = addresses.id AND m.user_id = auth.uid())
  OR EXISTS (SELECT 1 FROM merchants m WHERE m.billing_address_id = addresses.id AND m.user_id = auth.uid())
  OR EXISTS (SELECT 1 FROM properties p JOIN merchants m ON p.merchant_id = m.id WHERE p.address_id = addresses.id AND m.user_id = auth.uid())
  OR has_role(auth.uid(), 'admin')
);

CREATE POLICY "Addresses manageable by owner merchants" ON addresses FOR ALL TO authenticated
USING (
  EXISTS (SELECT 1 FROM merchants m WHERE m.headquarters_address_id = addresses.id AND m.user_id = auth.uid())
  OR EXISTS (SELECT 1 FROM merchants m WHERE m.billing_address_id = addresses.id AND m.user_id = auth.uid())
  OR EXISTS (SELECT 1 FROM properties p JOIN merchants m ON p.merchant_id = m.id WHERE p.address_id = addresses.id AND m.user_id = auth.uid())
  OR has_role(auth.uid(), 'admin')
);
