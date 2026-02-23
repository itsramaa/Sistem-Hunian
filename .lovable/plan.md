

# Redesign Total: Properties, Units & Detail Pages -- "Warm Luxury Futurism"

Menerapkan aesthetic yang sama dengan login/register page (glassmorphism, modern layout, animated backgrounds) ke seluruh modul Properties & Units.

---

## Perubahan Global

### index.css -- Tambah utility baru
- `.glass-stat-card` -- card statistik dengan efek glass ringan, border halus, dan hover lift
- `.glass-table` -- table wrapper dengan glass background dan rounded corners
- `.section-header` -- header section dengan gradient underline accent
- Pastikan reuse `.glass-card`, `.gradient-orb` yang sudah ada

---

## 1. Properties Page (`src/pages/merchant/Properties.tsx`)

### Stats Cards -- Premium Glassmorphic
- Ganti `Card` biasa dengan `glass-card` styling: `bg-card/80 backdrop-blur-sm border border-border/50 rounded-2xl`
- Icon container: gradient background (`bg-gradient-to-br from-primary/20 to-primary/10`) dengan `rounded-xl`
- Hover effect: `hover:-translate-y-1 hover:shadow-lg transition-all duration-300`
- Angka statistik: tambah `font-display` untuk angka besar

### Empty State -- Visual Premium
- Background: gradient mesh halus (`from-primary/5 via-muted to-accent/5`)
- Icon container: lebih besar (`w-24 h-24`) dengan subtle gradient border
- Animasi icon: `animate-pulse` halus

### Grid/List Layout -- Spacing & Polish
- Grid gap: `gap-6` (dari `gap-4`)
- Card animation: `slide-in-from-bottom-4` (lebih dramatic dari `-2`)

---

## 2. PropertyCard (`src/features/properties/components/PropertyCard.tsx`)

### Card Redesign -- Glassmorphic Premium
- Base: `bg-card/90 backdrop-blur-sm border border-border/40 rounded-2xl shadow-sm`
- Hover: `hover:-translate-y-2 hover:shadow-[0_12px_40px_rgba(0,0,0,0.1)] hover:border-primary/30`
- Image section: `rounded-xl` (dari `rounded-lg`), height `h-32` (dari `h-24`), overlay gradient di bawah untuk text readability
- Icon container: gradient `bg-gradient-to-br from-primary/15 to-accent/10` dengan `rounded-xl`
- Status badge: pill style dengan `rounded-full` dan subtle glow saat active
- Occupancy bar: segmented bar (4 segments) seperti password strength meter, bukan single bar
- Amenity badges: `rounded-full` dengan subtle background tinting

---

## 3. PropertyTable (`src/features/properties/components/PropertyTable.tsx`)

### Table Redesign
- Wrapper: `rounded-2xl border border-border/50 bg-card/90 backdrop-blur-sm overflow-hidden`
- Header row: `bg-gradient-to-r from-muted/80 to-muted/40` dengan text `font-semibold text-xs uppercase tracking-wider`
- Row hover: `hover:bg-primary/5` (bukan `hover:bg-muted/50`)
- Thumbnail: `rounded-xl` dengan shadow
- Pagination: modern pill buttons, active page dengan gradient background

---

## 4. PropertyFilters (`src/features/properties/components/PropertyFilters.tsx`)

### Filter Bar -- Unified Glass Strip
- Wrapper: `bg-card/80 backdrop-blur-sm border border-border/40 rounded-2xl p-4`
- Search input: `bg-background/60 rounded-xl border-border/50` dengan icon prefix terintegrasi
- Select triggers: `rounded-xl bg-background/60`
- View toggle: pill style dengan `rounded-full bg-muted/30`, active `bg-primary text-primary-foreground`
- Active filter badges: `rounded-full` dengan colored dot indicator

---

## 5. PropertyDetail (`src/pages/merchant/PropertyDetail.tsx`)

### Hero Section -- Immersive
- Image carousel: height `h-64` (dari `h-48`), full-width dengan `rounded-2xl`
- Overlay gradient di bawah image: `bg-gradient-to-t from-background to-transparent`
- Header info overlaid pada image (di mobile, di bawah image)
- Back button: glassmorphic `bg-card/80 backdrop-blur-sm rounded-full`

### Stats Cards -- Grid Premium
- Same glassmorphic treatment: `bg-card/80 backdrop-blur-sm rounded-2xl border border-border/40`
- Icon: gradient circle background
- Hover lift: `hover:-translate-y-1 transition-all duration-300`

### Tabs -- Modern Pill Style
- TabsList: `bg-muted/30 rounded-full p-1`
- TabsTrigger active: `rounded-full bg-primary text-primary-foreground shadow-sm`
- TabsContent: smooth `animate-fade-in` transition

### Units Table (dalam tab)
- Row: clickable dengan hover `bg-primary/5` dan left border indicator pada hover
- Status badges: `rounded-full` pill style

### Sidebar -- Glassmorphic
- Cards: `bg-card/80 backdrop-blur-sm rounded-2xl border border-border/40`
- Property info items: subtle separator dengan spacing yang lebih baik

---

## 6. Units Page (`src/pages/merchant/Units.tsx`)

### Header -- Premium
- Icon container: gradient `bg-gradient-to-br from-primary/20 to-accent/10 rounded-2xl`
- CTA button: gradient style seperti auth page `gradient-cta`

---

## 7. UnitsStats (`src/features/properties/components/UnitsStats.tsx`)

### Stats Grid -- Glassmorphic
- Cards: `bg-card/80 backdrop-blur-sm rounded-2xl border border-border/40`
- Border-left: gradient instead of solid (`border-image: linear-gradient(...)`)
- Icon container: `rounded-xl` dengan gradient bg
- Hover: `hover:-translate-y-1 hover:shadow-lg transition-all duration-300`
- Occupancy bar: segmented 4-segment style

---

## 8. UnitsTable (`src/features/properties/components/UnitsTable.tsx`)

### Table Redesign
- Same treatment as PropertyTable
- Wrapper: `rounded-2xl border border-border/50 bg-card/90 backdrop-blur-sm`
- Header: gradient background, uppercase tracking
- Empty state: larger icon, gradient background mesh
- Pagination: modern pill style

---

## 9. UnitFilters (`src/features/properties/components/UnitFilters.tsx`)

### Filter Bar -- Glass Strip
- Same unified glass strip treatment as PropertyFilters
- `bg-card/80 backdrop-blur-sm border border-border/40 rounded-2xl p-4`

---

## 10. UnitDetail (`src/pages/merchant/UnitDetail.tsx`)

### Breadcrumb -- Modern
- Separator: chevron icon bukan "/"
- Active item: `text-primary font-semibold`

### Hero Photos -- Immersive
- Carousel: `h-56` (dari `h-48`), `rounded-2xl`
- Empty state: gradient mesh dengan animated subtle pulse

### Stats Cards -- Premium
- Glassmorphic with gradient left border
- Same hover lift treatment

### Tabs -- Pill Style
- Same pill tab treatment as PropertyDetail

### Contract Cards -- Enhanced
- Active contract: subtle glow border `shadow-[0_0_0_1px_hsl(var(--success)/0.3)]`
- Tenant avatar: gradient ring

### Sidebar -- Glassmorphic
- Same glass treatment

---

## 11. Form Dialogs -- Premium Styling

### PropertyFormDialog (`PropertyFormDialog.tsx`)
- DialogContent: `rounded-2xl`
- Step indicator: modern connected dots (like onboarding redesign)
- Input fields: `rounded-xl bg-background/60 border-border/50`
- Labels: `font-medium text-sm` dengan transition saat focus
- CTA: gradient button style

### UnitFormDialog (`UnitFormDialog.tsx`)
- Same treatment as PropertyFormDialog
- Step indicator: connected dots style
- Input fields: rounded-xl with integrated icons where relevant

---

## 12. DeletePropertyDialog (`DeletePropertyDialog.tsx`)

### Dialog Redesign
- Content: `rounded-2xl`
- Warning icon: larger, animated pulse
- Property preview card: glassmorphic `bg-muted/30 backdrop-blur-sm rounded-xl`
- Delete button: gradient destructive `bg-gradient-to-r from-destructive to-destructive/80`

---

## 13. Skeletons -- Premium Loading

### PropertySkeleton & PropertyDetailSkeleton
- Skeleton items: `rounded-2xl` (dari `rounded-lg/md`)
- Shimmer effect yang lebih halus
- Layout match dengan redesigned components

---

## Ringkasan File yang Diubah

| File | Perubahan |
|------|-----------|
| `src/index.css` | Utility classes baru (glass-stat-card, glass-table) |
| `src/pages/merchant/Properties.tsx` | Stats glassmorphic, empty state premium, spacing |
| `src/pages/merchant/PropertyDetail.tsx` | Hero immersive, pill tabs, glass sidebar, stats premium |
| `src/pages/merchant/Units.tsx` | Header premium, gradient CTA |
| `src/pages/merchant/UnitDetail.tsx` | Breadcrumb modern, glass stats, pill tabs, enhanced contracts |
| `src/features/properties/components/PropertyCard.tsx` | Glass card, taller image, segmented occupancy, premium hover |
| `src/features/properties/components/PropertyTable.tsx` | Glass wrapper, gradient header, modern pagination |
| `src/features/properties/components/PropertyFilters.tsx` | Unified glass strip, pill toggles |
| `src/features/properties/components/UnitsStats.tsx` | Glass cards, gradient borders, hover lift |
| `src/features/properties/components/UnitsTable.tsx` | Glass wrapper, gradient header, modern pagination |
| `src/features/properties/components/UnitFilters.tsx` | Glass strip filter bar |
| `src/features/properties/components/PropertyFormDialog.tsx` | Rounded-2xl, dot stepper, rounded inputs, gradient CTA |
| `src/features/properties/components/UnitFormDialog.tsx` | Same form polish |
| `src/features/properties/components/DeletePropertyDialog.tsx` | Glass preview, gradient delete button |
| `src/features/properties/components/PropertySkeleton.tsx` | Rounded-2xl skeletons |
| `src/features/properties/components/PropertyDetailSkeleton.tsx` | Match new layout |

## Urutan Implementasi

1. `index.css` -- CSS utility tambahan
2. `PropertyCard.tsx` + `PropertyTable.tsx` -- Core listing components
3. `PropertyFilters.tsx` + `UnitFilters.tsx` -- Filter bars
4. `Properties.tsx` -- Main page with stats
5. `PropertyDetail.tsx` -- Detail page
6. `UnitsStats.tsx` + `UnitsTable.tsx` -- Unit listing components
7. `Units.tsx` + `UnitDetail.tsx` -- Unit pages
8. `PropertyFormDialog.tsx` + `UnitFormDialog.tsx` -- Form dialogs
9. `DeletePropertyDialog.tsx` -- Delete dialog
10. Skeletons -- Loading states

