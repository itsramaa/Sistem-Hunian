

# Implementasi 1.3: Full Address Normalization

## Ringkasan

Addresses table sudah ada tapi belum fully normalized - kolom address/city/province/postal_code masih ada di `merchants` dan `properties`. Plan ini akan:
1. Add `address_type` ke addresses table
2. Merchants: rename `address_id` → `headquarters_address_id`, add `billing_address_id`, drop old address columns
3. Properties: drop old address columns + lat/lng (data sudah di addresses), keep `address_id`
4. Update semua views, services, types, UI components, dan edge functions

## Current State

- `addresses` table: EXISTS (street_address, city, province, postal_code, latitude, longitude)
- `merchants`: has both `address_id` FK AND old columns (address, city, province, postal_code)
- `properties`: has both `address_id` FK AND old columns (address, city, province, postal_code, latitude, longitude)
- Views: use COALESCE fallback to old columns

## Impact Analysis

| Area | Files Affected | Change Type |
|------|---------------|-------------|
| Database | 1 migration | Schema + views |
| Merchant Types | `merchant.ts`, `admin-merchant.ts` | Remove address fields, add FK fields |
| Property Types | `types/index.ts`, `types/schema.ts` | Remove address fields |
| Merchant UI | `Profile.tsx`, `MerchantDetailsTab.tsx`, `AdminMerchantsTable.tsx`, `Merchants.tsx` | Read/write via addresses join |
| Property UI | `PropertyFormDialog.tsx`, `PropertySetupWizard.tsx`, `PropertyTable.tsx`, `PropertyCard.tsx`, `PropertyDetail.tsx`, `Properties.tsx`, `UnitDetail.tsx`, `MerchantPropertiesTab.tsx`, `PropertyImportDialog.tsx` | Read/write via addresses join |
| Property Services | `propertyService.ts`, `adminPropertyService.ts` | Upsert addresses, use JOIN |
| Edge Functions | `get-tenant-invitation`, `ml-price-intelligence`, `ml-data-quality-check`, `ai-chatbot`, `accept-tenant-invitation` | Update selects to JOIN addresses |

## Step-by-Step Implementation

### Step 1: Database Migration

```sql
-- 1. Add address_type to addresses
ALTER TABLE addresses ADD COLUMN IF NOT EXISTS address_type text DEFAULT 'property';

-- 2. Set address_type for existing records based on linkage
UPDATE addresses SET address_type = 'headquarters'
WHERE id IN (SELECT address_id FROM merchants WHERE address_id IS NOT NULL);

-- 3. Add unique constraint
ALTER TABLE addresses ADD CONSTRAINT uq_address_street_city_postal_type
  UNIQUE (street_address, city, postal_code, address_type);

-- 4. Merchants: rename address_id to headquarters_address_id, add billing_address_id
ALTER TABLE merchants RENAME COLUMN address_id TO headquarters_address_id;
ALTER TABLE merchants ADD COLUMN IF NOT EXISTS billing_address_id UUID REFERENCES addresses(id);

-- 5. Drop old views that reference these columns
DROP VIEW IF EXISTS v_merchants_with_addresses;
DROP VIEW IF EXISTS v_properties_with_addresses;
DROP VIEW IF EXISTS merchant_property_summary;

-- 6. Drop old address columns from merchants
ALTER TABLE merchants DROP COLUMN IF EXISTS address;
ALTER TABLE merchants DROP COLUMN IF EXISTS city;
ALTER TABLE merchants DROP COLUMN IF EXISTS province;
ALTER TABLE merchants DROP COLUMN IF EXISTS postal_code;

-- 7. Drop old address columns from properties
ALTER TABLE properties DROP COLUMN IF EXISTS address;
ALTER TABLE properties DROP COLUMN IF EXISTS city;
ALTER TABLE properties DROP COLUMN IF EXISTS province;
ALTER TABLE properties DROP COLUMN IF EXISTS postal_code;
ALTER TABLE properties DROP COLUMN IF EXISTS latitude;
ALTER TABLE properties DROP COLUMN IF EXISTS longitude;

-- 8. Recreate views using addresses table only
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

-- 9. Recreate merchant_property_summary
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

-- 10. Update search trigger (merchants_search_update) - remove city/province references
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

-- 11. Update RLS policies for addresses (add headquarters_address_id)
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
```

### Step 2: Update TypeScript Types

**`src/features/users/types/merchant.ts`**: Remove `address`, `city`, `province`, `postal_code`. Add `headquarters_address_id`, `billing_address_id`, optional `headquarters_address` object.

**`src/features/users/types/admin-merchant.ts`**: Same for Merchant interface. Remove address/city/province. Keep `MerchantProperty` as-is (it gets data from addresses join).

**`src/features/properties/types/index.ts`**: Remove `address`, `city`, `province`, `postal_code`, `latitude`, `longitude` from Property. Add `address_id` as required field. Add optional `addresses` nested object for JOIN data.

**`src/features/properties/types/schema.ts`**: Replace `address`, `city`, `province`, `postal_code` fields in propertySchema with address sub-fields that will be used to upsert into addresses table.

### Step 3: Update Property Services

**`propertyService.ts`**: 
- `createProperty`: First upsert into `addresses` table, then insert property with `address_id`
- `updateProperty`: Upsert address, then update property
- `fetchProperties` / `fetchPropertyById`: JOIN with `addresses` table to include address data

### Step 4: Update Merchant Profile Page

**`src/pages/merchant/Profile.tsx`**: 
- Query merchant with `addresses` JOIN (via `headquarters_address_id`)
- On save: upsert into `addresses` table first, then update merchant's `headquarters_address_id`

### Step 5: Update Admin Merchant Components

**`MerchantDetailsTab.tsx`**: Read address from joined addresses data
**`AdminMerchantsTable.tsx`**: Read city/province from joined addresses data  
**`Merchants.tsx`**: Update search filter and CSV export to use addresses data

### Step 6: Update Property UI Components

All 9 property UI files that display `property.address`, `property.city` etc. will read from the nested `addresses` object returned by the JOIN in services.

### Step 7: Update Edge Functions

5 edge functions need to update their SELECT queries to JOIN with addresses table instead of reading property.address/city directly.

### Step 8: Update Documentation

Mark section 1.3 in `old-docs/merchant_database_refactor.md` as fully DONE.

## Files yang Diubah

| File | Perubahan |
|------|-----------|
| Database migration | Add address_type, rename FK, drop old columns, recreate views, update RLS |
| `src/features/users/types/merchant.ts` | Remove address fields, add headquarters_address_id |
| `src/features/users/types/admin-merchant.ts` | Remove address/city/province |
| `src/features/properties/types/index.ts` | Remove address/city/province/postal_code/lat/lng, add addresses join type |
| `src/features/properties/types/schema.ts` | Keep address fields in form schema (they go to addresses table) |
| `src/features/properties/services/propertyService.ts` | Upsert addresses, JOIN on fetch |
| `src/features/properties/services/adminPropertyService.ts` | JOIN addresses |
| `src/pages/merchant/Profile.tsx` | Upsert addresses on save, JOIN on fetch |
| `src/features/users/components/admin/MerchantDetailsTab.tsx` | Read from addresses join |
| `src/features/users/components/admin/AdminMerchantsTable.tsx` | Read from addresses join |
| `src/pages/admin/Merchants.tsx` | Update search/CSV to use addresses |
| `src/features/users/services/merchantService.ts` | Add addresses JOIN to fetchMerchants |
| `src/features/properties/components/PropertyFormDialog.tsx` | Unchanged form fields, service handles addresses |
| `src/features/properties/components/PropertySetupWizard.tsx` | Same |
| `src/features/properties/components/PropertyTable.tsx` | Read from addresses join |
| `src/features/properties/components/PropertyCard.tsx` | Read from addresses join |
| `src/features/properties/components/MerchantPropertiesTab.tsx` | Read from addresses join |
| `src/features/properties/components/PropertyImportDialog.tsx` | Service handles addresses |
| `src/pages/merchant/PropertyDetail.tsx` | Read from addresses join |
| `src/pages/merchant/Properties.tsx` | Read from addresses join |
| `src/pages/merchant/UnitDetail.tsx` | Read from addresses join |
| `src/features/properties/components/admin/AdminPropertiesTable.tsx` | Read from addresses join |
| `supabase/functions/get-tenant-invitation/index.ts` | JOIN addresses |
| `supabase/functions/ml-price-intelligence/index.ts` | JOIN addresses |
| `supabase/functions/ml-data-quality-check/index.ts` | JOIN addresses |
| `supabase/functions/ai-chatbot/index.ts` | JOIN addresses |
| `supabase/functions/accept-tenant-invitation/index.ts` | JOIN addresses |
| `old-docs/merchant_database_refactor.md` | Mark 1.3 DONE |

## Strategy: Minimize UI Changes

Untuk meminimalkan perubahan di UI components, services akan mengembalikan data dengan shape yang sama (flat `address`, `city`, `province`, `postal_code` fields) dari JOIN query. Ini berarti:
- **Property type** tetap punya `address`, `city`, `province`, `postal_code` sebagai computed fields dari JOIN
- **Merchant type** tetap punya `address`, `city`, `province` dari JOIN
- Services yang fetch data akan map addresses JOIN ke flat fields
- Hanya services yang CREATE/UPDATE perlu di-refactor untuk upsert ke addresses table dulu

Ini mengurangi jumlah perubahan UI dari ~15 file menjadi hanya file yang melakukan write operations.

