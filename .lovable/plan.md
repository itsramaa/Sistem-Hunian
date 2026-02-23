
# Phase 3: Operations Unification

Merge "Laporan Kerusakan" (Maintenance) and "Kepatuhan & Legalitas" (LegalHub) into a single "Operasional" hub with 3 tabs.

## Changes

### 1. Create `src/pages/merchant/OperationsHub.tsx`

New hub page following the established pattern (identical to AssetsHub/FinanceHub):
- 3 lazy-loaded tabs: **Maintenance** | **Kepatuhan** | **Validasi Data**
- `TAB_MAP`: `{ maintenance, compliance, "data-quality" }`
- Default tab: `maintenance`
- `PageHeader`: icon `Wrench`, title "Operasional", description "Kelola pemeliharaan, kepatuhan, dan validasi data properti"
- Lazy imports reuse existing components:
  - `MerchantMaintenance` from `@/pages/merchant/Maintenance`
  - `MerchantCompliance` from `@/pages/merchant/PropertyCompliance`
  - `MerchantDataQuality` from `@/pages/merchant/DataQualityHistory`

### 2. Update `src/shared/components/layouts/navigation-config.ts`

Replace the "Operasional" group (currently 2 items) with a single item:

| Before | After |
|--------|-------|
| Laporan Kerusakan (`/merchant/maintenance`) | Operasional (`/merchant/operations`, activePatterns: `/merchant/maintenance`, `/merchant/legal`, `/merchant/compliance`, `/merchant/data-quality`) |
| Kepatuhan & Legalitas (`/merchant/legal`) | (removed - merged as tab) |

### 3. Update `src/App.tsx`

- Add new import: `MerchantOperationsHub` from `OperationsHub`
- Add hub route: `path="operations"` renders `MerchantOperationsHub`
- Replace standalone routes with redirects:
  - `maintenance` redirects to `/merchant/operations#maintenance`
  - `legal` redirects to `/merchant/operations#compliance`
- Keep detail route `maintenance/:id` unchanged (standalone detail page)
- Remove `MerchantLegalHub` import (no longer needed)

### 4. Delete `src/pages/merchant/LegalHub.tsx`

Fully replaced by OperationsHub. Its two lazy imports (PropertyCompliance, DataQualityHistory) are now loaded inside OperationsHub.

## Route Changes Summary

| Route | Before | After |
|-------|--------|-------|
| `operations` | (new) | `OperationsHub` component |
| `maintenance` | `MerchantMaintenance` | Redirect to `/merchant/operations#maintenance` |
| `maintenance/:id` | `MerchantMaintenanceDetail` | Unchanged |
| `legal` | `MerchantLegalHub` | Redirect to `/merchant/operations#compliance` |

## File Summary

| File | Action |
|------|--------|
| `src/pages/merchant/OperationsHub.tsx` | Create - 3-tab hub (Maintenance, Kepatuhan, Validasi Data) |
| `src/pages/merchant/LegalHub.tsx` | Delete (replaced by OperationsHub) |
| `src/shared/components/layouts/navigation-config.ts` | Modify - merge 2 items into 1 "Operasional" item |
| `src/App.tsx` | Modify - add operations route, redirect maintenance and legal |
