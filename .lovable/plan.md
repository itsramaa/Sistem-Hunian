

# Fix DSS "Lengkapi" Links + Auto-Generate Missing Metrics

## Problems

### A. "Lengkapi" links don't navigate to the right place

Every DSS checklist item links to a generic page (e.g., `/merchant/properties/{id}`) without specifying which tab or form to open. Users click "Lengkapi" and land on the property overview -- they have no idea where to find the specific field (e.g., "Biaya pembangunan" is in the Keuangan tab, "Kondisi bangunan" is in the Edit dialog step 2).

### B. Two Level 4 datasets have no way to populate them

`occupancy_snapshots` and `tenant_payment_metrics` are required for DSS but nothing writes to them. These are computable from existing data (units, invoices, contracts).

---

## Solution

### Part 1: Make PropertyDetail read URL hash for initial tab

Currently `<Tabs defaultValue="overview">`. Change to read `window.location.hash` so links like `/merchant/properties/{id}#financial` open the correct tab directly.

**File: `src/pages/merchant/PropertyDetail.tsx`**
- Read hash on mount to set initial tab value (e.g., `#financial` sets tab to `financial`)
- Use controlled `<Tabs value={activeTab} onValueChange={setActiveTab}>` instead of uncontrolled `defaultValue`

### Part 2: Update DSS checklist links to target specific tabs/forms

**File: `src/features/dss/hooks/useDssReadiness.ts`**

Map each item to the correct deep link:

| Item | Current Link | New Link |
|---|---|---|
| Nama properti | `/merchant/properties/{id}` | `/merchant/properties/{id}?edit=true` |
| Tipe properti | `/merchant/properties/{id}` | `/merchant/properties/{id}?edit=true` |
| Alamat lengkap | `/merchant/properties/{id}` | `/merchant/properties/{id}?edit=true` |
| Minimal 1 unit | `/merchant/properties/{id}` | `/merchant/properties/{id}#units` |
| Fasilitas | `/merchant/properties/{id}` | `/merchant/properties/{id}?edit=true&step=3` |
| Foto properti | `/merchant/properties/{id}` | `/merchant/properties/{id}?edit=true&step=3` |
| Penjaga aktif | `/merchant/guardians` | `/merchant/guardians` (keep) |
| Deskripsi | `/merchant/properties/{id}` | `/merchant/properties/{id}?edit=true` |
| Jumlah lantai | `/merchant/properties/{id}` | `/merchant/properties/{id}?edit=true&step=2` |
| Kondisi bangunan | `/merchant/properties/{id}` | `/merchant/properties/{id}?edit=true&step=2` |
| All Level 3 financial fields | `/merchant/properties/{id}` | `/merchant/properties/{id}#financial` |
| Disaster risk | `/merchant/compliance` | `/merchant/properties/{id}#compliance` |
| Insurance | `/merchant/compliance` | `/merchant/properties/{id}#compliance` |
| IMB/PBG | `/merchant/compliance` | `/merchant/properties/{id}#compliance` |
| PBB | `/merchant/compliance` | `/merchant/properties/{id}#compliance` |
| Occupancy | `/merchant/properties/{id}` | auto-generate button |
| Tenant metrics | `/merchant/tenant-analytics` | auto-generate button |

### Part 3: Handle `?edit=true` in PropertyDetail

**File: `src/pages/merchant/PropertyDetail.tsx`**
- Read `?edit=true` and `?step=N` from URL search params on mount
- If present, auto-open `PropertyFormDialog` at the specified step
- Requires adding `PropertyFormDialog` import and state management to PropertyDetail (currently only in Properties list page)

### Part 4: Add "action" type to checklist items for auto-compute

**File: `src/features/dss/hooks/useDssReadiness.ts`**
- Add optional `action?: 'auto-generate'` field to `ChecklistItem` interface
- Mark `occupancy` and `tenant_metrics` items with `action: 'auto-generate'`

**File: `src/features/dss/components/DssReadinessChecklist.tsx`**
- For items with `action: 'auto-generate'`, show a "Generate" button instead of a "Lengkapi" link
- Button calls the edge functions to compute the data

### Part 5: Create edge functions for auto-computable data

**File: `supabase/functions/compute-occupancy-snapshots/index.ts`**
- JWT auth, extract merchant_id from user profile
- Query all properties for the merchant, count units by status per property
- Calculate occupancy rate, average rent from units
- Count move-ins/move-outs from contracts starting/ending this month
- Upsert into `occupancy_snapshots` (keyed on property_id + snapshot_month)

**File: `supabase/functions/compute-tenant-payment-metrics/index.ts`**
- JWT auth, extract merchant_id
- Query invoices + payments for tenants in this merchant's properties
- Per tenant: count total invoices, paid on time, late, unpaid
- Calculate average days late, payment score (0-100), streaks
- Upsert into `tenant_payment_metrics`

---

## Technical Details

### Files to create
1. `supabase/functions/compute-occupancy-snapshots/index.ts`
2. `supabase/functions/compute-tenant-payment-metrics/index.ts`

### Files to modify
1. `src/pages/merchant/PropertyDetail.tsx` -- Read URL hash for tab, read `?edit=true` for auto-open edit dialog
2. `src/features/dss/hooks/useDssReadiness.ts` -- Update all links with hash/query params, add `action` field
3. `src/features/dss/components/DssReadinessChecklist.tsx` -- Render "Generate" button for auto-compute items, call edge functions
4. `src/features/dss/components/DssReadinessCard.tsx` -- No changes needed (delegates to checklist)

### Security
- Both edge functions require JWT (default in config.toml)
- Data access scoped to authenticated merchant only via service role + merchant_id filter
- Uses shared CORS utility from `_shared/cors.ts`

### No database changes needed
Both `occupancy_snapshots` and `tenant_payment_metrics` tables already exist with the correct schema.
