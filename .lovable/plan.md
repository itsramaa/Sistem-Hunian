

# Bulk Operations for Properties Page

## What We're Building
Add checkbox multi-select to properties (both grid and list views) with a floating "Bulk Actions" toolbar that appears when items are selected. Actions: **Delete Selected**, **Change Status** (active/inactive/maintenance).

## Implementation

### 1. State in `Properties.tsx`
- Add `selectedIds: Set<string>` state
- Add `selectAll` toggle (selects all on current page)
- Add `handleBulkDelete` — loops through selected, calls `deleteProperty` for each, shows toast with count
- Add `handleBulkStatusChange(status)` — loops through selected, calls `updateProperty` for each
- Clear selection after bulk action completes

### 2. Floating Bulk Actions Bar (in `Properties.tsx`)
When `selectedIds.size > 0`, render a sticky bottom bar:
```text
┌──────────────────────────────────────────────────────┐
│ ☑ 3 properti dipilih    [Ubah Status ▾]  [🗑 Hapus]  │  
└──────────────────────────────────────────────────────┘
```
- "Ubah Status" → DropdownMenu with 3 options (Aktif, Nonaktif, Pemeliharaan)
- "Hapus" → ConfirmDialog before executing
- Shows count of selected items

### 3. Grid View — Checkbox on `PropertyCard`
- Add `selected` and `onSelect` props to `PropertyCard`
- Render a `Checkbox` in the top-left corner of the card (always visible when in selection mode, or on hover)
- Clicking checkbox toggles selection without navigating

### 4. List View — Checkbox column in `PropertyTable`
- Add checkbox column as first `<TableHead>` with select-all checkbox
- Each row gets a `<Checkbox>` in first `<TableCell>`
- Add `selectedIds`, `onSelectId`, `onSelectAll` props

### 5. Select All in header area
- Add a "Select All" checkbox near the results counter that toggles all items on the current page

### 6. Update AUDIT_MENU.md
- Mark bulk operations as ✅ COMPLETE

## Files

| File | Action |
|------|--------|
| `src/pages/merchant/Properties.tsx` | EDIT — selection state, bulk handlers, floating bar, select-all, pass props |
| `src/features/properties/components/PropertyCard.tsx` | EDIT — add `selected`/`onSelect` props, render checkbox |
| `src/features/properties/components/PropertyTable.tsx` | EDIT — add checkbox column, select-all header, selection props |
| `old-docs/AUDIT_MENU.md` | EDIT — mark bulk operations complete |

