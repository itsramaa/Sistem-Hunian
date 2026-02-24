

# Audit & Fix: Property Navigation Flow

## Issues Found

### 1. UnitDetail back button goes to `/merchant/units` (standalone list) instead of parent property

**Problem:** `UnitDetail.tsx` line 111 navigates to `/merchant/units` -- a standalone "all units" page. But the natural flow is Property > Unit > Unit Detail, so back should return to the property. The unit already has `unit.property.id` loaded from its query.

**Current:** Back arrow -> `/merchant/units` (flat list of ALL units across all properties)
**Expected:** Back arrow -> `/merchant/properties/{property_id}#units`

Also line 84 (error state) links to `/merchant/units`.

**Fix in `src/pages/merchant/UnitDetail.tsx`:**
- Line 111: Change `navigate('/merchant/units')` to `navigate(`/merchant/properties/${unit.property?.id}#units`)`
- Line 84: Change `to="/merchant/units"` to `to="/merchant/properties"` (fallback since we don't have property context in error state)

---

### 2. Standalone `/merchant/units` page should not exist as a top-level destination

**Problem:** Units are contextual to a property. The standalone `/merchant/units` page shows ALL units across all properties with its own property filter dropdown. This violates the principle that units are nested under properties (Property > Unit flow). However, some merchants may want a cross-property unit view for bulk operations (import CSV, etc.).

**Fix:** Keep the route for backward compatibility but it should NOT be a destination from any navigation or back button. All unit navigation should flow through Property Detail's "Units" tab.

**Files to update:**
- `src/features/properties/components/UnitCard.tsx` -- Change `navigate(`/merchant/units/${unit.id}`)` to keep as-is (unit detail route stays)
- `src/features/properties/components/UnitsTable.tsx` -- Same, keep unit detail links
- `src/features/properties/components/UnitsManager.tsx` -- Same

No changes needed to these unit-detail links since `/merchant/units/:id` is the unit detail page route and that's fine. The issue is only the BACK navigation from unit detail.

---

### 3. Guardians tab in PropertyDetail shows ALL guardians, not filtered by property

**Problem:** `PropertyDetail.tsx` line 424 renders `<LazyGuardians />` which loads `Guardians.tsx`. That component uses `useGuardians(merchantId)` which fetches ALL guardians across all properties. When embedded in a property's tab, it should only show guardians for THAT property.

**Fix in `src/pages/merchant/Guardians.tsx`:**
- Accept optional `propertyId?: string` prop (same contextual pattern as Compliance and DataQuality)
- When `propertyId` is provided: use `useGuardiansByProperty(propertyId)` instead of `useGuardians(merchantId)`, hide property column, pre-select property in create form
- When not provided: keep current behavior (standalone page)

**Fix in `src/pages/merchant/PropertyDetail.tsx`:**
- Line 424: Change `<LazyGuardians />` to `<LazyGuardians propertyId={id} />`

---

### 4. Standalone `/merchant/compliance` and `/merchant/data-quality` routes are redundant

**Problem:** Both Compliance and DataQuality now accept `propertyId` props and are embedded in PropertyDetail. The standalone routes still exist and show their own property selectors. Since compliance/data-quality are always contextual to a property, the standalone routes should redirect to the properties list.

**Fix in `src/App.tsx`:**
- Change `compliance` route to redirect: `<Navigate to="/merchant/properties" replace />`
- Change `data-quality` route to redirect: `<Navigate to="/merchant/properties" replace />`
- Keep the lazy imports since they're still used as embedded components in PropertyDetail

---

### 5. Standalone `/merchant/guardians` route should redirect to properties

**Problem:** Same as above -- guardians are contextual to a property. The standalone page shows all guardians with no property context.

**Fix in `src/App.tsx`:**
- Change `guardians` route to redirect: `<Navigate to="/merchant/properties" replace />`

---

### 6. DSS readiness links referencing `/merchant/guardians` should use property detail hash

**Problem:** In `useDssReadiness.ts`, the "Penjaga aktif" item links to `/merchant/guardians` which will now redirect. Should link to property detail guardians tab.

**Fix in `src/features/dss/hooks/useDssReadiness.ts`:**
- Change guardians link from `/merchant/guardians` to `/merchant/properties/${propertyId}#guardians`

---

### 7. `navigation-config.ts` has `activePatterns` referencing removed standalone pages

**Problem:** The "Properti" nav item has `activePatterns: ["/merchant/units", "/merchant/guardians"]`. Since these are being redirected, the active pattern should still work for `/merchant/units/:id` (unit detail pages still exist under this path).

**Fix:** Keep `/merchant/units` in activePatterns (unit detail still uses `/merchant/units/:id`). Remove `/merchant/guardians` since it will redirect. Add patterns for compliance/data-quality if needed.

Actually, unit detail routes `/merchant/units/:id` will still match the `/merchant/units` pattern prefix, so no change needed for units. For guardians, since it redirects, it won't matter.

No changes needed to `navigation-config.ts`.

---

## Summary of File Changes

| File | Change |
|---|---|
| `src/pages/merchant/UnitDetail.tsx` | Back button navigates to `/merchant/properties/{property_id}#units` instead of `/merchant/units` |
| `src/pages/merchant/Guardians.tsx` | Accept optional `propertyId` prop; filter by property when provided; hide property selector/column |
| `src/pages/merchant/PropertyDetail.tsx` | Pass `propertyId={id}` to `<LazyGuardians propertyId={id} />` |
| `src/App.tsx` | Redirect `/merchant/compliance`, `/merchant/data-quality`, `/merchant/guardians` to `/merchant/properties`; remove standalone `MerchantUnits` route (keep `units/:id` for unit detail) |
| `src/features/dss/hooks/useDssReadiness.ts` | Update guardians link to point to property detail `#guardians` tab |

### Routes After Changes

```text
KEPT (functional pages):
/merchant/units/:id          -- Unit Detail (back -> parent property)
/merchant/properties         -- Properties list
/merchant/properties/:id     -- Property Detail (tabs: overview, units, tenants, financial, maintenance, guardians, compliance)

REDIRECTED to /merchant/properties:
/merchant/units              -- No longer needed as standalone
/merchant/guardians          -- Contextual to property
/merchant/compliance         -- Contextual to property  
/merchant/data-quality       -- Contextual to property

KEPT as-is (separate domain):
/merchant/move-outs          -- Accessed from Tenants page
/merchant/move-outs/:id      -- Move-out detail
/merchant/tenant-analytics   -- Accessed from InsightsHub
```

### Risk Assessment
- **Low risk**: All changes are backward-compatible via redirects
- **No data loss**: No database changes
- **Preserves unit detail**: `/merchant/units/:id` route stays, only the list page redirects
