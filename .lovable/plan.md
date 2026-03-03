

# Properties 2.1 — Remaining Gaps

## Already Complete (no work needed)
- ✅ Clear All Filters button + individual badges
- ✅ Import CSV + Tambah Properti grouped in header
- ✅ View mode persisted to localStorage
- ✅ Sort persisted to localStorage
- ✅ Pagination 9/25/50 + jump-to-page
- ✅ Operational Insights collapsible + persisted
- ✅ Empty state: filter mismatch vs no properties
- ✅ KPI cards (Properti, Unit, Hunian, Kosong)
- ✅ Active filter badges with X buttons

## Remaining Items (from 2.1.2 spec)

### Task 1: KPI Card Click Actions
The spec says:
- "Kosong" card click → filter to show properties with vacant units
- "Hunian" card click → sort by occupancy high

Currently KPI cards are static. Add `onClick` + `cursor-pointer` to:
- **Kosong card**: set `sortBy` to `occupancy-low` (surfaces high-vacancy properties first)
- **Hunian card**: set `sortBy` to `occupancy-high`

Both reset page to 1. Simple 2-line additions per card.

### Task 2: Help Tooltip on View Toggle
The spec mentions: `"Ubah tampilan preferensi Anda. Pilihan disimpan untuk sesi Anda."`

Add a small `Tooltip` wrapping the view toggle group in `PropertyFilters.tsx`.

### Task 3: Update AUDIT_MENU.md
Mark the KPI click actions and help tooltip as COMPLETE. Mark "All" pagination option as SKIP (virtual scrolling needed for 100+ items, deferred).

---

## Files

| File | Action |
|------|--------|
| `src/pages/merchant/Properties.tsx` | EDIT — add onClick to Hunian + Kosong KPI cards |
| `src/features/properties/components/PropertyFilters.tsx` | EDIT — add tooltip on view toggle group |
| `old-docs/AUDIT_MENU.md` | EDIT — update 2.1.2 interaction patterns status |

