
# Full UI/UX Redesign: Properties, Units & Tenants (Production-Grade)

Complete visual and structural overhaul of Properties, Units, and Tenants modules -- pages, detail views, forms, tables, filters, cards, stats, skeletons, dialogs, and all related components.

---

## Design Principles Applied

- **Warm Luxury Futurism**: glassmorphism (`bg-card/90 backdrop-blur-sm`), `rounded-2xl`, `gradient-icon-box`, `gradient-cta`
- **Information Hierarchy**: Summary header with KPIs at top, then filters, then content
- **Pill Navigation**: `rounded-full` tabs with active gradient
- **Glass Tables**: `glass-table` wrapper with gradient header rows
- **Consistent Status System**: `rounded-full` badges with semantic colors
- **Mobile-First**: Responsive grids, collapsible sections, drawer-friendly dialogs

---

## PART A: Properties Page (`Properties.tsx`)

### Current Issues
- Header is flat (`div` with text + button), no icon or visual anchor
- Grid pagination uses unstyled `Button variant="outline"` instead of pill pagination
- Images dialog lacks glass treatment
- No PageHeader component used

### Changes
1. **Add PageHeader** with `Building2` icon, title "Properti Saya", description "Kelola properti dan unit Anda"
2. **Add Property button**: `gradient-cta rounded-xl` with `Plus` icon
3. **Stats cards**: Already have `glass-stat-card` -- add count-up animation class and hover lift (`hover:-translate-y-1 hover:shadow-lg transition-all duration-300`)
4. **Grid pagination**: Replace unstyled buttons with pill-style pagination matching `PropertyTable` pagination (gradient-cta active page, rounded-full buttons)
5. **Images Dialog**: Add `rounded-2xl` to DialogContent, `gradient-cta rounded-xl` to Save button, `rounded-xl` to Cancel button
6. **Error Alert**: Add `rounded-xl`
7. **Empty state**: Already glassmorphic -- improve step indicators to use `gradient-icon-box` mini circles

### Estimated Lines Changed: ~80

---

## PART B: Property Detail Page (`PropertyDetail.tsx`)

### Current Issues
- Cards use plain `rounded-2xl` without glass treatment
- Sidebar uses `glass-sidebar-card` but inconsistent with main content
- Activity tab is a dead-end placeholder

### Changes
1. **All Cards**: Add `bg-card/90 backdrop-blur-sm border border-border/40` consistently
2. **Image carousel**: Add subtle `rounded-2xl overflow-hidden` container wrapper with shadow
3. **Stats cards**: Add hover effect `hover:-translate-y-1 hover:shadow-lg transition-all duration-300`
4. **Overview cards** (Address, Description, Amenities): Add `bg-card/90 backdrop-blur-sm border border-border/40`
5. **Units table in detail**: Rows should navigate to `/merchant/units/:id` on click (add `cursor-pointer onClick`)
6. **Activity tab**: Improve placeholder with gradient icon box and better copy
7. **Sidebar cards**: Ensure consistent `bg-card/90 backdrop-blur-sm rounded-2xl border border-border/40` (replace `glass-sidebar-card` custom class for consistency)
8. **Edit button**: Should navigate to edit dialog, not just back to properties

### Estimated Lines Changed: ~50

---

## PART C: Units Page (`Units.tsx`)

### Current Issues
- Header is custom-built instead of using `PageHeader`
- View mode toggle has inconsistent styling with other pages
- Delete dialog uses native `confirm()` in UnitsManager but proper AlertDialog here

### Changes
1. **Use PageHeader** component with `DoorOpen` icon
2. **View mode toggle**: Move into filter bar, pill-style matching PropertyFilters
3. **Gallery empty state**: Already glassmorphic -- verify consistency
4. **Pagination**: Already pill-style -- ensure gradient-cta active state
5. **AlertDialog**: Already `rounded-2xl` -- add glass treatment to content

### Estimated Lines Changed: ~30

---

## PART D: Unit Detail Page (`UnitDetail.tsx`)

### Current Issues
- Cards use plain `Card` without glass treatment
- Contract cards lack hover interactivity
- Maintenance cards are flat

### Changes
1. **All Cards**: Add `bg-card/90 backdrop-blur-sm border border-border/40`
2. **Active tenant card**: Add avatar gradient ring `ring-2 ring-success/20`
3. **Contract cards**: Add `hover:border-primary/20 hover:shadow-sm transition-all cursor-pointer` and navigate to contract detail on click
4. **Maintenance cards**: Add `hover:border-primary/20 transition-all cursor-pointer` and navigate to maintenance detail
5. **Sidebar**: Replace `glass-sidebar-card` with consistent `bg-card/90 backdrop-blur-sm rounded-2xl border border-border/40`
6. **Empty states**: Add `gradient-icon-box` treatment to icons
7. **Edit button**: Wire to actual edit functionality (open UnitFormDialog or navigate)
8. **Breadcrumb**: Add glass pill style `px-3 py-1 rounded-full bg-card/80 backdrop-blur-sm border border-border/40`

### Estimated Lines Changed: ~60

---

## PART E: Tenants Page (`Tenants.tsx`)

### Current Issues
- No PageHeader used
- Header area has empty `<div />` placeholder
- TabsList uses inline grid styling instead of pill pattern

### Changes
1. **Add PageHeader** with `Users` icon, title "Manajemen Tenant", description "Kelola tenant aktif dan undangan"
2. **Action buttons in PageHeader children**: Move "Kirim Undangan" and "Tambah Langsung" into PageHeader
3. **TabsList**: Use `pill-tab-list` class pattern instead of inline grid
4. **TabsTrigger**: Use `pill-tab-trigger` class
5. **AlertDialog**: Already `rounded-2xl` -- add glass backdrop treatment

### Estimated Lines Changed: ~30

---

## PART F: Component Enhancements

### F1. PropertyCard.tsx
- Already well-styled with glassmorphism, hover lift, image overlay
- **Minor**: Add `rounded-xl` to dropdown content
- No major changes needed

### F2. PropertyTable.tsx
- Already uses `glass-table`, gradient headers, pill pagination
- **Minor**: Add `rounded-xl` to DropdownMenuContent
- No major changes needed

### F3. PropertyFilters.tsx
- Already uses `glass-filter-bar`, pill view toggle, rounded-xl inputs
- No changes needed

### F4. UnitCard.tsx
- Already well-styled with glassmorphism, hover lift
- **Minor**: Add `rounded-xl` to DropdownMenuContent
- No major changes needed

### F5. UnitFilters.tsx
- Already uses `glass-filter-bar`, rounded-xl inputs
- No changes needed

### F6. UnitsTable.tsx
- Already uses `glass-table`, gradient headers, pill pagination
- No changes needed

### F7. UnitsStats.tsx
- Already uses `glass-stat-card`, `gradient-icon-box`, segmented bars
- **Minor**: Add hover lift to all cards (`hover:-translate-y-1 hover:shadow-lg transition-all duration-300`)

### F8. TenantStats.tsx
- Already uses `glass-stat-card`, `gradient-icon-box`
- Already has hover lift
- No changes needed

### F9. TenantsFilters.tsx
- Already uses `glass-filter-bar`, rounded-xl inputs
- No changes needed

### F10. TenantsTable.tsx
- Already uses `glass-table`, gradient headers, avatar colors, pill pagination
- **Minor**: Add `rounded-xl` to DropdownMenuContent
- No changes needed

### F11. InvitationsTable.tsx
- Already uses `glass-table`, gradient headers, pill pagination
- No changes needed

### F12. TenantDetailsDialog.tsx
- Already uses glass cards, gradient avatars, progress bars
- **Minor**: Enhance close button to `gradient-cta rounded-xl` for primary action
- No major changes needed

### F13. InviteTenantDialog.tsx
- Already uses `rounded-2xl` dialog, `rounded-xl` inputs, gradient submit button
- No changes needed

### F14. AddTenantDialog.tsx
- Already uses stepper, `rounded-2xl` dialog, glass treatment
- No changes needed

### F15. UnitFormDialog.tsx
- Already uses stepper, `rounded-2xl` dialog, gradient-cta buttons
- No changes needed

### F16. PropertyFormDialog.tsx
- Already uses stepper, `rounded-2xl` dialog, gradient-cta buttons
- No changes needed

### F17. DeletePropertyDialog.tsx
- Already uses `rounded-2xl`, gradient destructive button, glass info box
- No changes needed

### F18. UnitsManager.tsx
- Uses `rounded-2xl` dialog, glass cards
- **Changes**: Replace native `confirm()` in `handleDelete` with proper AlertDialog
- Add `rounded-xl` to action buttons in card
- Add glass treatment to subscription limit alert

### F19. PropertySkeleton.tsx / PropertyDetailSkeleton.tsx
- Already styled with glass-stat-card, rounded-2xl
- No changes needed

---

## Summary of Files Modified

| No | File | Changes |
|----|------|---------|
| 1 | `Properties.tsx` | PageHeader, pill pagination, glass images dialog |
| 2 | `PropertyDetail.tsx` | Glass cards, hover effects, clickable rows, sidebar consistency |
| 3 | `Units.tsx` | PageHeader, view toggle into filter bar |
| 4 | `UnitDetail.tsx` | Glass cards, clickable contracts/maintenance, breadcrumb pill |
| 5 | `Tenants.tsx` | PageHeader, pill tabs, action buttons in header |
| 6 | `UnitsManager.tsx` | Replace confirm() with AlertDialog, rounded-xl buttons |
| 7 | `UnitsStats.tsx` | Add hover lift to stat cards |
| 8 | `TenantsTable.tsx` | DropdownMenuContent rounded-xl |
| 9 | `PropertyTable.tsx` | DropdownMenuContent rounded-xl |
| 10 | `UnitCard.tsx` | DropdownMenuContent rounded-xl |

## Implementation Order

1. `Properties.tsx` -- main page with PageHeader + pagination upgrade
2. `PropertyDetail.tsx` -- glass cards + interactive rows
3. `Units.tsx` -- PageHeader integration
4. `UnitDetail.tsx` -- glass cards + clickable entities
5. `Tenants.tsx` -- PageHeader + pill tabs
6. `UnitsManager.tsx` -- AlertDialog replacement
7. Minor component enhancements (UnitsStats, tables, cards -- dropdown rounding)
