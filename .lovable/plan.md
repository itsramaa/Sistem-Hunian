
# Phase 1: Asset Management Consolidation

Merge "Staf Operasional" (Guardians) into the existing AssetsHub as a third tab, and redirect the standalone route.

## Changes

### 1. Update `src/pages/merchant/AssetsHub.tsx`
- Add `Guardians` as a third lazy-loaded tab alongside Properti and Unit
- Add `guardians` to `TAB_MAP`
- Add a third `TabsTrigger` labeled "Staf"
- Update `PageHeader` title to "Manajemen Aset" and description to "Kelola properti, unit, dan staf operasional Anda"

### 2. Update `src/shared/components/layouts/navigation-config.ts`
- Remove the standalone `{ path: "/merchant/guardians", icon: User, label: "Staf Operasional" }` item from "Manajemen Aset" group
- Rename the AssetsHub item label from "Properti & Unit" to "Manajemen Aset"
- Add `/merchant/guardians` to the `activePatterns` array of the assets item

### 3. Update `src/App.tsx`
- Replace `<Route path="guardians" element={<MerchantGuardians />} />` with a redirect: `<Route path="guardians" element={<Navigate to="/merchant/assets#guardians" replace />} />`
- Import `Navigate` from `react-router-dom` (likely already imported)

## Technical Details

### AssetsHub.tsx changes

```text
Before:
  TAB_MAP = { properties, units }
  Tabs: Properti | Unit

After:
  TAB_MAP = { properties, units, guardians }
  Tabs: Properti | Unit | Staf
```

The Guardians component is lazy-loaded identically to the existing Properties and Units imports:
```text
const MerchantGuardians = lazy(() => import("@/pages/merchant/Guardians"));
```

### Navigation Config changes

The "Manajemen Aset" group goes from 3 items to 2 items:

| Before | After |
|--------|-------|
| Properti & Unit | Manajemen Aset (with guardians in activePatterns) |
| Penyewa & Okupansi | Penyewa & Okupansi (unchanged) |
| Staf Operasional | (removed - merged into Manajemen Aset tab) |

### Route changes in App.tsx

The standalone `/merchant/guardians` route becomes a redirect to `/merchant/assets#guardians`, so bookmarks and any existing links still work.

### File Summary

| File | Action |
|------|--------|
| `src/pages/merchant/AssetsHub.tsx` | Modify - add Guardians as 3rd tab, update header |
| `src/shared/components/layouts/navigation-config.ts` | Modify - remove Guardians item, rename assets label, update activePatterns |
| `src/App.tsx` | Modify - replace guardians route with redirect |
