

# Fix Remaining Items: PropertyImportDialog + Documentation

## Task 1: Update PropertyImportDialog Address Upsert

**File**: `src/features/properties/components/PropertyImportDialog.tsx`

The import currently inserts directly into `properties` with `address`, `city`, `province`, `postal_code` columns that no longer exist. Need to:

1. First insert into `addresses` table with `street_address`, `city`, `province`, `postal_code`, `address_type: 'property'`
2. Then insert into `properties` with `address_id` pointing to the new address record
3. Remove old column references (`address`, `city`, `province`, `postal_code`) from the properties insert

**Change in `handleImport` (lines 123-141)**:

Replace the direct properties insert with a two-step process:
```ts
// Step 1: Insert address
const { data: addr, error: addrErr } = await (supabase
  .from('addresses' as any)
  .insert({
    street_address: parsed.address,
    city: parsed.city,
    province: parsed.province,
    postal_code: parsed.postal_code || '',
    address_type: 'property',
  } as any)
  .select('id')
  .single() as any);

if (addrErr) { failed++; errors.push(...); continue; }

// Step 2: Insert property with address_id
const { error } = await supabase.from("properties").insert({
  merchant_id: merchant.id,
  name: parsed.name,
  property_type: parsed.property_type,
  address_id: addr.id,
  description: parsed.description || null,
});
```

## Task 2: Update Documentation

**File**: `old-docs/merchant_database_refactor.md`

Section 1.3 (line 138-139) already says "DONE" but the description still says only "Views sudah ada". Update to include the full normalization notes:

> Kolom address/city/province/postal_code dan latitude/longitude sudah di-drop dari merchants dan properties. Data dipusatkan ke tabel addresses dengan FK headquarters_address_id, billing_address_id (merchants) dan address_id (properties). Views v_merchants_with_addresses dan v_properties_with_addresses di-recreate dengan JOIN ke addresses. PropertyImportDialog, propertyService, merchantService, dan 5 edge functions sudah di-update.

## Files Changed

| File | Change |
|------|--------|
| `src/features/properties/components/PropertyImportDialog.tsx` | Insert to addresses first, then properties with address_id |
| `old-docs/merchant_database_refactor.md` | Update 1.3 description with full completion notes |

