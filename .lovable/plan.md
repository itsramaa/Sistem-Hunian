
# Lanjutan Redesign: Komponen Properties & Units yang Belum Tercoverage

Menerapkan aesthetic "Warm Luxury Futurism" (glassmorphism, rounded-2xl, gradient accents, hover lift) ke 15 komponen yang belum diupdate.

---

## 1. CustomAmenities.tsx

- Badge default amenities: `rounded-full` pill style, selected menggunakan `bg-primary text-primary-foreground`, unselected `bg-background/60 border-border/50 hover:border-primary/40`
- Custom amenities section: border-t diganti subtle separator dengan `border-border/30`
- Remove button: `hover:bg-destructive/20 rounded-full` (sudah ada, polish saja)
- Input custom: `rounded-xl bg-background/60 border-border/50` -- konsisten dengan form style baru
- Add button: `rounded-xl` bukan default
- Helper text: tetap `text-xs text-muted-foreground`

## 2. DragDropPhotoReorder.tsx

- Photo items: `rounded-xl` (dari `rounded-lg`), border `border-border/40`
- Cover photo ring: `ring-primary/50 ring-offset-2`
- Cover label badge: `rounded-full bg-primary/90 backdrop-blur-sm`
- Order number badge: `bg-background/80 backdrop-blur-sm rounded-full`
- Hover overlay: `bg-black/40 backdrop-blur-sm` (lebih halus)
- Upload placeholder: `rounded-xl border-2 border-dashed border-border/40 hover:border-primary/50 hover:bg-primary/5`
- Empty state: `rounded-2xl border-2 border-dashed border-border/30`, icon container `w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/10 to-accent/5`

## 3. LocationPicker.tsx

- Search input: `rounded-xl bg-background/60 border-border/50 pl-10` (icon prefix terintegrasi)
- Search/Map buttons: `rounded-xl`
- Map container: `rounded-2xl border border-border/40 overflow-hidden shadow-sm`
- Helper text: tetap sama

## 4. MerchantPropertiesTab.tsx (Admin view)

- Property items: `rounded-2xl bg-card/80 backdrop-blur-sm border border-border/40 hover:border-primary/30 hover:-translate-y-0.5 transition-all duration-300`
- Icon container: `rounded-xl bg-gradient-to-br from-primary/15 to-accent/10`
- Status badge: `rounded-full`
- Loading skeleton: `rounded-2xl bg-card/60`
- Empty & error states: gradient mesh bg, larger icon container
- Footer stats: `rounded-xl bg-muted/30 p-3`

## 5. MoveOutInspectionForm.tsx

- DialogContent: `rounded-2xl`
- Checklist items: `rounded-xl border border-border/40 bg-card/80 backdrop-blur-sm`
- Radio group labels: colored dot before text for visual clarity
- Deposit calculation box: `rounded-2xl bg-gradient-to-br from-muted/50 to-muted/30 border border-border/40`
- Refund amount: larger font, gradient text for positive refund
- Signature pad container: `rounded-xl border border-border/40`
- Submit button: gradient CTA style (`gradient-cta`)
- Cancel button: `rounded-xl`

## 6. PropertySetupWizard.tsx

- Progress bar: `rounded-full h-2.5` with gradient fill
- Step indicators: modern connected dots style (match onboarding redesign):
  - Completed: `bg-success rounded-full w-10 h-10 shadow-sm`
  - Current: `border-primary bg-primary/10 rounded-full shadow-[0_0_8px_rgba(139,111,71,0.3)]`
  - Upcoming: `border-muted bg-muted/30 rounded-full`
  - Connector lines between dots
- Card: `rounded-2xl bg-card/90 backdrop-blur-sm border border-border/40`
- Input fields: `rounded-xl bg-background/60 border-border/50`
- Navigation buttons: Previous `rounded-xl`, Next/Create `gradient-cta rounded-xl`

## 7. ProvincesCitiesSelect.tsx

- SelectTrigger: `rounded-xl bg-background/60 border-border/50`
- Consistent with other form elements styling

## 8. RelistUnitDialog.tsx

- DialogContent: `rounded-2xl`
- Unit details box: `rounded-2xl bg-gradient-to-br from-muted/50 to-muted/30 border border-border/40`
- Input fields: `rounded-xl bg-background/60 border-border/50`
- Suggested rent button: `rounded-xl`
- Checkbox items: `rounded-xl border border-border/40 p-4` (promotion box)
- Publish button: `gradient-cta rounded-xl`

## 9. ScheduleInspectionDialog.tsx

- DialogContent: `rounded-2xl`
- Info box: `rounded-2xl bg-gradient-to-br from-muted/50 to-muted/30 border border-border/40`
- Date picker button: `rounded-xl`
- Time selector: `rounded-xl`
- Checklist preview: `rounded-2xl border border-border/40 bg-card/80`
- Submit button: `gradient-cta rounded-xl`

## 10. SoftDeleteManager.tsx (UndoToast)

- Toast container: `rounded-2xl bg-card/95 backdrop-blur-xl border border-border/40 shadow-[0_8px_32px_rgba(0,0,0,0.15)]`
- Progress bar: `rounded-full` dengan gradient fill `bg-gradient-to-r from-primary to-accent`
- Undo button: `rounded-full`
- Icon styling: lebih prominent

## 11. UnitPhotoUpload.tsx

- Photo items: `rounded-xl` (dari `rounded-lg`), `border border-border/40`
- Remove button: `rounded-full bg-destructive/90 backdrop-blur-sm`
- Upload placeholder: `rounded-xl border-2 border-dashed border-border/40 hover:border-primary/50 hover:bg-primary/5 transition-all`

## 12. UnitsManager.tsx

- DialogContent: `rounded-2xl`
- Unit cards: `rounded-2xl bg-card/90 backdrop-blur-sm border border-border/40 hover:-translate-y-1 hover:shadow-lg hover:border-primary/30 transition-all duration-300`
- Icon container: `rounded-xl bg-gradient-to-br from-primary/15 to-accent/10`
- Status badge: `rounded-full`
- Empty state card: glassmorphic with gradient mesh
- Add button: `gradient-cta rounded-xl`
- Edit/Delete buttons: `rounded-lg`
- Loading spinner area: smooth skeleton instead of raw spinner

## 13. AdminPropertiesStats.tsx

- Cards: `glass-stat-card` utility class (sudah dibuat di index.css)
- Icon: `gradient-icon-box` treatment
- Stats number: `font-display text-3xl`
- Hover: `-translate-y-1 shadow-lg transition-all duration-300`

## 14. AdminPropertiesTable.tsx

- Table wrapper: `glass-table` utility (sudah ada di index.css)
- Header row: `bg-gradient-to-r from-muted/80 to-muted/40 text-xs uppercase tracking-wider`
- Row hover: `hover:bg-primary/5`
- Status badges: `rounded-full`
- Type badges: `rounded-full`
- Empty row: gradient mesh background

## 15. AdminPropertyFilters.tsx

- Filter wrapper: `glass-filter-bar` utility (sudah ada di index.css)
- Search input: `rounded-xl bg-background/60 border-border/50 pl-10` dengan icon terintegrasi
- Select triggers: `rounded-xl bg-background/60`
- Reset button: `rounded-full`

---

## Ringkasan File yang Diubah

| No | File | Perubahan Utama |
|----|------|----------------|
| 1 | `CustomAmenities.tsx` | Pill badges, rounded-xl input |
| 2 | `DragDropPhotoReorder.tsx` | Rounded-xl photos, glass overlay, premium empty state |
| 3 | `LocationPicker.tsx` | Rounded-xl inputs, rounded-2xl map |
| 4 | `MerchantPropertiesTab.tsx` | Glass cards, gradient icon, hover lift |
| 5 | `MoveOutInspectionForm.tsx` | Rounded-2xl dialog, glass checklist items, gradient CTA |
| 6 | `PropertySetupWizard.tsx` | Connected dots stepper, glass card, gradient CTA |
| 7 | `ProvincesCitiesSelect.tsx` | Rounded-xl selects |
| 8 | `RelistUnitDialog.tsx` | Rounded-2xl dialog, glass info box, gradient CTA |
| 9 | `ScheduleInspectionDialog.tsx` | Rounded-2xl dialog, glass info, gradient CTA |
| 10 | `SoftDeleteManager.tsx` | Glass toast, gradient progress bar |
| 11 | `UnitPhotoUpload.tsx` | Rounded-xl photos, glass upload placeholder |
| 12 | `UnitsManager.tsx` | Glass unit cards, gradient icon, hover lift, gradient CTA |
| 13 | `admin/AdminPropertiesStats.tsx` | glass-stat-card, gradient icon, font-display |
| 14 | `admin/AdminPropertiesTable.tsx` | glass-table, gradient header, rounded-full badges |
| 15 | `admin/AdminPropertyFilters.tsx` | glass-filter-bar, rounded-xl inputs/selects |

## Urutan Implementasi

1. `CustomAmenities.tsx` + `ProvincesCitiesSelect.tsx` + `LocationPicker.tsx` -- Form sub-components
2. `UnitPhotoUpload.tsx` + `DragDropPhotoReorder.tsx` -- Photo components
3. `PropertySetupWizard.tsx` -- Wizard (depends on sub-components above)
4. `UnitsManager.tsx` -- Unit management dialog
5. `MerchantPropertiesTab.tsx` -- Admin property list
6. `RelistUnitDialog.tsx` + `ScheduleInspectionDialog.tsx` + `MoveOutInspectionForm.tsx` -- Dialogs
7. `SoftDeleteManager.tsx` -- Undo toast
8. `admin/AdminPropertiesStats.tsx` + `AdminPropertiesTable.tsx` + `AdminPropertyFilters.tsx` -- Admin components
