

# Fix: Merchant UX Issues (7 Items)

## Issue 1: Duplicate/Dead URLs in Merchant Routes

Several legacy redirect routes still exist (e.g., `/merchant/legal` redirects to `/merchant/compliance`). While redirects work, some old URLs may be referenced in internal links. The routes themselves are functional redirects -- no duplicate pages exist after Phase B cleanup.

**Fix:** Audit all internal links and navigation references. Remove any references to old paths. The legacy redirects in `App.tsx` should stay for backward compatibility but ensure no UI element links to them directly.

No file changes needed -- redirects already work correctly. The user landed on `/merchant/legal` which correctly redirects to `/merchant/compliance`.

---

## Issue 2: Full-Screen Loading State

The previous fix set `refetchOnWindowFocus: false` and restructured Suspense boundaries. However, some pages still use their own full-screen loading patterns (e.g., `PropertyCompliance` line 36 shows a centered `Loader2` without sidebar/navbar context).

**Fix:** Ensure embedded components (LazyCompliance, LazyDataQuality inside PropertyDetail) don't render their own full-screen loaders when used contextually. They're already wrapped in `<Suspense fallback={<ContentSkeleton />}>` by PropertyDetail, so the internal loader should be minimal or removed when `propertyId` prop is provided.

### Files to modify:
- `src/pages/merchant/PropertyCompliance.tsx` -- When `propertyId` is provided, skip the full-page loader and use inline skeleton instead

---

## Issue 3: DataQualityHistory Needs Property Context

`DataQualityHistory` (embedded in PropertyDetail's Compliance tab via `<LazyDataQuality />`) still shows its own property selector, forcing users to pick a property they're already viewing.

**Fix:** Apply the same contextual pattern as `PropertyCompliance` -- accept optional `propertyId` prop. When provided, skip the selector and use the ID directly.

### Files to modify:
- `src/pages/merchant/DataQualityHistory.tsx` -- Add `propertyId?: string` prop, skip selector when provided
- `src/pages/merchant/PropertyDetail.tsx` -- Pass `propertyId={id}` to `<LazyDataQuality propertyId={id} />`

---

## Issue 4: Merchant-Initiated Maintenance Requests

Currently `maintenanceService.createRequest()` requires an active contract and a `tenant_user_id`. Merchants cannot create maintenance for common areas or vacant units.

**Fix:**
1. Make `tenant_user_id` nullable in `maintenance_requests` table (it's currently `NOT NULL`)
2. Create a new service method `createMerchantRequest()` that skips contract validation
3. Add a "Tambah Maintenance" button + dialog to the Maintenance page
4. The dialog lets merchant pick a property, unit, fill title/description/category/priority

### Database migration:
```sql
ALTER TABLE maintenance_requests ALTER COLUMN tenant_user_id DROP NOT NULL;
```

### Files to create:
- `src/features/maintenance/components/CreateMaintenanceDialog.tsx` -- Form dialog for merchant to create maintenance

### Files to modify:
- `src/features/maintenance/services/maintenanceService.ts` -- Add `createMerchantRequest()` method (skips contract check)
- `src/features/maintenance/hooks/useMaintenance.ts` -- Add `useCreateMerchantMaintenanceRequest` hook
- `src/pages/merchant/Maintenance.tsx` -- Add "Tambah" button in header + dialog state
- `src/features/maintenance/types/index.ts` -- Update `tenant_user_id` to optional in type

---

## Issue 5: Back Button on Deep Detail Pages

Most detail pages already have a back button (MaintenanceDetail, PropertyDetail). Need to verify all detail pages have one.

**Audit results:**
- `PropertyDetail.tsx` -- Has back button (line 183)
- `MaintenanceDetail.tsx` -- Has back button (line 99-101)
- `ContractDetail.tsx`, `InvoiceDetail.tsx`, `PaymentDetail.tsx`, `UnitDetail.tsx`, `MoveOutDetail.tsx` -- Need to verify

**Fix:** Ensure all detail pages have a consistent back button. Pages that are accessed from InsightsHub sub-pages (DssAdvisor, MlAnalytics, etc.) should also have back navigation.

### Files to audit and fix if missing:
- All `*Detail.tsx` pages under `src/pages/merchant/`
- InsightsHub sub-pages (analytics pages)

---

## Issue 6: Historical Renovation Costs

Currently `renovation_cost` is a single `numeric` column on `properties`. This only captures one value. Renovation is historical -- properties get renovated multiple times.

**Fix:**
1. Create a `property_renovations` table to store multiple renovation records (date, cost, description, photos)
2. Keep `renovation_cost` on properties as a computed total for backward compatibility
3. Add a renovation history UI in the Financial tab of PropertyDetail
4. Auto-sum renovation costs back to `properties.renovation_cost` via trigger or application logic

### Database migration:
```sql
CREATE TABLE property_renovations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  merchant_id uuid NOT NULL REFERENCES merchants(id),
  renovation_date date NOT NULL DEFAULT CURRENT_DATE,
  cost numeric NOT NULL DEFAULT 0,
  description text,
  category text DEFAULT 'general',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE property_renovations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Merchants can manage own renovations" ON property_renovations
  FOR ALL USING (
    merchant_id IN (SELECT id FROM merchants WHERE user_id = auth.uid())
  );

CREATE TRIGGER update_property_renovations_updated_at
  BEFORE UPDATE ON property_renovations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### Files to create:
- `src/features/properties/components/RenovationHistoryCard.tsx` -- CRUD UI for renovation entries
- `src/features/properties/hooks/useRenovations.ts` -- TanStack Query hooks for CRUD

### Files to modify:
- `src/features/properties/components/PropertyFinancialForm.tsx` -- Replace single `renovation_cost` input with link to renovation history
- `src/pages/merchant/PropertyDetail.tsx` -- Add RenovationHistoryCard to Financial tab
- `src/features/properties/components/PropertyFinancialMetrics.tsx` -- Sum from renovations table instead of single field

---

## Issue 7: Support Page Duplicates Sidebar/Navbar

`Support.tsx` (line 81) wraps content in its own `<DashboardLayout role="merchant">`. But it's already rendered inside `MerchantLayoutRoute` which provides `DashboardLayout`. This causes double sidebar and navbar.

**Fix:** Remove `<DashboardLayout>` wrapper from Support.tsx. Just render the content directly since MerchantLayoutRoute already provides the layout shell.

### Files to modify:
- `src/pages/merchant/Support.tsx` -- Remove `<DashboardLayout>` wrapper, keep only inner content

---

## Summary of All Changes

| # | Issue | Type | Files |
|---|---|---|---|
| 1 | Dead URLs | No change needed | Redirects already work |
| 2 | Full-screen loading | Code fix | PropertyCompliance.tsx |
| 3 | DataQuality property context | Code fix | DataQualityHistory.tsx, PropertyDetail.tsx |
| 4 | Merchant maintenance creation | DB + Code | Migration, 4 existing files, 1 new component |
| 5 | Back buttons | Code fix | Audit detail pages, add where missing |
| 6 | Historical renovation costs | DB + Code | Migration, 2 new files, 3 modified files |
| 7 | Support double layout | Code fix | Support.tsx |

