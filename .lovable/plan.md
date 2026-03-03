

# Dashboard Phase 2 — Direct Implementation Plan

## What's Already Done (P0)
- ✅ "Personalisasi Dasbor" button (redesigned, larger)
- ✅ Revenue SoT consolidated (Financial Summary shows Saldo/Piutang, not duplicate revenue)
- ✅ Scope Indicator when `selectedPropertyId` is set

## What Will Be Implemented Now

### Task 1: KPI Cards → Inline Drawers (replace `navigate()`)

Replace all 4 KPI card `onClick={() => navigate(...)}` with `onClick={() => setOpenDrawer('...')}`. Each drawer uses the existing `Sheet` component and renders scoped summary data from the already-loaded `stats` object — no new queries.

**New files (4 drawer components):**

| File | Content |
|------|---------|
| `src/features/dashboard/components/drawers/PropertySummaryDrawer.tsx` | Top 5 properties by occupancy + progress bars + "Lihat Semua" link |
| `src/features/dashboard/components/drawers/OccupancyDrawer.tsx` | Occupancy % + badge + top 5 property breakdown + trend text |
| `src/features/dashboard/components/drawers/TenantHealthDrawer.tsx` | Active count, growth %, tenant distribution summary |
| `src/features/dashboard/components/drawers/RevenueBreakdownDrawer.tsx` | Monthly revenue + growth + vs last month + "Lihat Laporan" link |

All drawers follow the same pattern:
```tsx
<Sheet open={open} onOpenChange={onOpenChange}>
  <SheetContent side="right">
    <SheetHeader>...</SheetHeader>
    {/* Summary data from stats prop */}
    <SheetFooter>
      <Button onClick={() => navigate('/merchant/...')}>Lihat Semua</Button>
    </SheetFooter>
  </SheetContent>
</Sheet>
```

**Dashboard.tsx changes:**
- Add state: `const [openDrawer, setOpenDrawer] = useState<string | null>(null)`
- Replace 4 `navigate()` calls in KPI cards with `setOpenDrawer('properties'|'occupancy'|'tenants'|'revenue')`
- Render 4 drawer components at bottom of JSX, controlled by `openDrawer` state

### Task 2: Property Overview Cap at 5

In the `property_overview` widget renderer:
- Change `stats?.properties.list.map(...)` → `stats?.properties.list.slice(0, 5).map(...)`
- Add conditional footer when `list.length > 5`:
  ```tsx
  <Button variant="link" onClick={() => navigate('/merchant/properties')}>
    Lihat Semua ({stats.properties.list.length} properti)
  </Button>
  ```

### Task 3: Merge Mobile/Desktop Components

Remove `MobileMerchantDashboard.tsx` and the `if (isMobile) return <MobileMerchantDashboard />` branch. Instead, make the existing desktop layout responsive:

- KPI grid: already uses `grid-cols-2 md:grid-cols-4` — works on mobile
- Quick Actions grid: change to `grid-cols-2` on mobile (already does this)
- Below sections: single-column on mobile via existing `md:grid-cols-2` patterns
- Mobile-specific features from `MobileMerchantDashboard` that are unique (Quick Expense sheet, Critical Alerts card, Upcoming Events) — these are already covered by existing widgets (CashFlowWidget, AlertsEventsWidget, ActionItemsWidget)
- Add `pb-20` on mobile for bottom nav clearance via `${isMobile ? 'pb-20' : 'pb-8'}`
- Delete `MobileMerchantDashboard.tsx`

### Task 4: LazyWidget Wrapper for Below-Fold Widgets

**New file:** `src/features/dashboard/components/LazyWidget.tsx`

Uses `IntersectionObserver` with `rootMargin="200px"`. Shows `Skeleton` placeholder until visible. Once rendered, never unmounts.

**Dashboard.tsx changes — wrap below-fold widgets:**
- Eager (no wrapper): `cash_flow`, `action_items`, `kpi_strip`, `quick_actions`
- Lazy (wrapped): `charts`, `property_overview`, `vacancy`, `occupancy_forecast`, `alerts_events`

### Task 5: Consistent Empty States + Help Tooltip

- Standardize all empty state messages to use the same pattern: icon + message + action button
- Add tooltip on "Personalisasi Dasbor" button: `"Atur urutan dan visibilitas widget sesuai kebutuhan Anda"`

---

## Files Summary

| File | Action |
|------|--------|
| `src/features/dashboard/components/drawers/PropertySummaryDrawer.tsx` | CREATE |
| `src/features/dashboard/components/drawers/OccupancyDrawer.tsx` | CREATE |
| `src/features/dashboard/components/drawers/TenantHealthDrawer.tsx` | CREATE |
| `src/features/dashboard/components/drawers/RevenueBreakdownDrawer.tsx` | CREATE |
| `src/features/dashboard/components/LazyWidget.tsx` | CREATE |
| `src/pages/merchant/Dashboard.tsx` | EDIT (KPI drawers, property cap, remove mobile branch, lazy wrappers) |
| `src/features/dashboard/components/MobileMerchantDashboard.tsx` | DELETE |

No database or backend changes needed. All drawer data comes from existing `useMerchantDashboardStats()`.

