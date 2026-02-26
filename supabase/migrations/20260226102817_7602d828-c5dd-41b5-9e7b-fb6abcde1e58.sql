
-- 1. Create trigger function to sync verification_status
CREATE OR REPLACE FUNCTION sync_merchant_verification_status()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF NEW.new_status IS NOT NULL THEN
    UPDATE merchants SET verification_status = NEW.new_status WHERE id = NEW.merchant_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_sync_merchant_verification_status
AFTER INSERT ON merchant_verification_history
FOR EACH ROW EXECUTE FUNCTION sync_merchant_verification_status();

-- 2. Seed initial history entries for merchants without history
INSERT INTO merchant_verification_history (merchant_id, action, old_status, new_status, created_at)
SELECT m.id, 'submitted', NULL, m.verification_status, COALESCE(m.verification_submitted_at, m.created_at)
FROM merchants m
WHERE NOT EXISTS (
  SELECT 1 FROM merchant_verification_history h WHERE h.merchant_id = m.id
);

-- 3. Drop views that reference these columns
DROP VIEW IF EXISTS v_merchants_with_addresses;

-- 4. Drop 8 snapshot columns
ALTER TABLE merchants DROP COLUMN IF EXISTS verified_at;
ALTER TABLE merchants DROP COLUMN IF EXISTS verified_by;
ALTER TABLE merchants DROP COLUMN IF EXISTS rejected_at;
ALTER TABLE merchants DROP COLUMN IF EXISTS rejected_by;
ALTER TABLE merchants DROP COLUMN IF EXISTS rejection_details;
ALTER TABLE merchants DROP COLUMN IF EXISTS resubmission_count;
ALTER TABLE merchants DROP COLUMN IF EXISTS resubmission_instructions;
ALTER TABLE merchants DROP COLUMN IF EXISTS verification_submitted_at;

-- 5. Recreate view without dropped columns
CREATE VIEW v_merchants_with_addresses AS
SELECT m.*,
  a.street_address AS resolved_address,
  a.city AS resolved_city,
  a.province AS resolved_province,
  a.postal_code AS resolved_postal_code
FROM merchants m
LEFT JOIN addresses a ON m.headquarters_address_id = a.id;
