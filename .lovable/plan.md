

# Properties Page (2.1) — Implementation Plan

## Current State Assessment

The page already has most structural elements in place: KPI strip, Operational Insights, filters with individual clear badges, pagination with page numbers, grid/list toggle, empty states. Key gaps to fix:

## Tasks

### Task 1: Persist View Mode & Sort to localStorage
- Save `viewMode` to `localStorage` key `sihuni:propertyViewMode` on change, read on mount
- Save `sortBy` to `localStorage` key `sihuni:propertySortBy` on change, read on mount
- ~10 lines in `Properties.tsx`

### Task 2: Persist Operational Insights Collapse State
- Wrap Operational Insights section in a `Collapsible` with toggle button
- Persist open/closed to `localStorage` key `sihuni:propertyInsightsOpen` (default: open)
- ~15 lines change in the insights section

### Task 3: Group Action Buttons + Header Count
- Move "Import CSV" and "Tambah Properti" buttons together (both in header right)
- Change title from "Properti Saya" to "Properti ({count})" showing total count
- Already mostly grouped — just ensure they're visually adjacent

### Task 4: Pagination Improvements
- Add `25`, `50` options to items-per-page selector (currently only 9/18/27)
- Add "Jump to page" input when `totalPages > 5`
- Same change needed in both grid and table pagination sections

### Task 5: Improved Empty States
- Filter mismatch: Show "Tidak ada properti cocok dengan filter ini." + prominently show **Reset Filter** button + show which filters are active
- No properties: Already good (shows onboarding steps) — keep as-is

### Task 6: Update AUDIT_MENU.md
- Mark each sub-item in section 2.1 with appropriate status

---

## Files Summary

| File | Action |
|------|--------|
| `src/pages/merchant/Properties.tsx` | EDIT — localStorage persistence, collapsible insights, pagination improvements, header count, empty state refinement |
| `old-docs/AUDIT_MENU.md` | EDIT — update 2.1 status markers |

No database changes needed. No new files needed — all changes fit within existing component.

