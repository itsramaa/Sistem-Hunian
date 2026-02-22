
# Maksimalkan UI/UX Halaman Properties Merchant

## Analisis Kondisi Saat Ini

Halaman Properties (`src/pages/merchant/Properties.tsx`) sudah berfungsi dengan fitur CRUD, filter, pagination, grid/list view, dan dialog foto. Namun ada beberapa area yang bisa ditingkatkan berdasarkan UIUX Design Documentation SiHuni v3.0 dan skill `.trae/skills` (frontend-design, interaction-design, responsive-design, ui-ux-designer, page-cro).

## Area Peningkatan

### 1. Stats Cards -- Tambah Visual & Trend Indicators
**Kondisi saat ini:** 3 stat card polos (Total Properties, Total Units, Occupancy Rate) tanpa trend/warna diferensiasi.

**Peningkatan:**
- Tambah stat ke-4: "Revenue Potential" (jumlah rent_amount dari units occupied)
- Tambah trend indicator (arrow up/down + persentase) sesuai UIUX doc Section 16.4
- Tambah subtle gradient/accent warna per card agar lebih informatif
- Tambah tooltip hover info pada setiap stat

### 2. Property Card -- Enhanced Visual Hierarchy
**Kondisi saat ini:** Card basic dengan icon placeholder jika tidak ada foto, amenity badges, occupancy bar.

**Peningkatan:**
- Tambah image placeholder/gradient jika tidak ada foto (bukan kosong)
- Tambah hover effect `translateY(-4px)` + shadow sesuai interaction-design skill
- Tambah quick action buttons visible on hover (tidak hanya di dropdown)
- Tambah occupancy color coding: hijau (>80%), kuning (50-80%), merah (<50%)
- Tambah badge "New" untuk properti yang baru dibuat (< 7 hari)
- Tambah revenue info per property (total rent dari occupied units)

### 3. Skeleton Loading State
**Kondisi saat ini:** Loading hanya spinner (`animate-spin`).

**Peningkatan:**
- Ganti spinner dengan skeleton screen yang menyerupai layout actual (3 stat skeleton + 9 card skeleton)
- Sesuai interaction-design skill Pattern 1: Skeleton Screens

### 4. Empty State -- Lebih Engaging
**Kondisi saat ini:** Icon + teks polos + tombol "Add Your First Property".

**Peningkatan:**
- Tambah ilustrasi/visual yang lebih inviting
- Tambah step-by-step hints ("1. Add property 2. Create units 3. Invite tenants")
- CTA lebih kuat dengan wording benefit-oriented sesuai page-cro skill

### 5. Filter Bar -- Tambah Status Filter + Sort + Active Filter Badges
**Kondisi saat ini:** Search + type filter + grid/list toggle.

**Peningkatan:**
- Tambah status filter (Active/Inactive/Maintenance) sesuai property.status
- Tambah sort option (Name A-Z, Occupancy, Newest, Oldest)
- Tampilkan active filter badges yang bisa di-dismiss
- Tambah "Reset filters" button saat ada filter aktif
- Mobile: filter collapsible/sheet

### 6. Property Table (List View) -- Enhanced Data Display
**Kondisi saat ini:** Basic table dengan kolom Property, Location, Units, Status, Actions.

**Peningkatan:**
- Tambah kolom Revenue (total rent dari occupied units)
- Tambah kolom amenities count
- Sortable columns (click header to sort)
- Row hover highlight
- Thumbnail image kecil di kolom Property (jika ada)

### 7. Pagination -- Improved UX
**Kondisi saat ini:** Previous/Next buttons dengan "Page X of Y".

**Peningkatan:**
- Tambah page number buttons (1, 2, 3...) untuk navigasi langsung
- Tambah items-per-page selector (9, 18, 27)
- Sticky pagination di bottom saat scroll

### 8. Delete Confirmation -- Dialog Proper
**Kondisi saat ini:** Menggunakan native `confirm()` dialog.

**Peningkatan:**
- Ganti dengan AlertDialog dari shadcn/ui (sudah terinstall @radix-ui/react-alert-dialog)
- Tampilkan info property yang akan dihapus (nama, jumlah units)
- Warning jika ada units occupied

### 9. Mobile Responsiveness
**Kondisi saat ini:** Grid responsif (1/2/3 kolom), tapi filter layout bisa lebih baik.

**Peningkatan:**
- Filter bar: gunakan Sheet/Drawer di mobile untuk advanced filters
- Stats card: horizontal scroll di mobile (bukan stack vertical)
- Swipe gesture hints pada card di mobile
- Touch-friendly action buttons (min 44px)

### 10. Micro-animations & Transitions
**Peningkatan:**
- Staggered fade-in saat cards muncul (CSS animation-delay)
- Smooth transition saat switch grid/list view
- Progress bar animated on mount
- Stats counter animation (count up effect)

## Komponen yang Diubah

| File | Perubahan |
|------|-----------|
| `src/pages/merchant/Properties.tsx` | Skeleton loading, delete dialog, sort state, stats enhancement, items-per-page |
| `src/features/properties/components/PropertyCard.tsx` | Hover effects, image placeholder, color-coded occupancy, quick actions, "New" badge |
| `src/features/properties/components/PropertyFilters.tsx` | Status filter, sort dropdown, active filter badges, reset button |
| `src/features/properties/components/PropertyTable.tsx` | Revenue kolom, sortable headers, thumbnail, row hover |
| `src/features/properties/components/PropertySkeleton.tsx` (baru) | Skeleton loading component untuk stats + cards |
| `src/features/properties/components/DeletePropertyDialog.tsx` (baru) | AlertDialog pengganti native confirm() |

## Detail Teknis

### PropertySkeleton.tsx (baru)
```text
StatsSkeleton: 3 skeleton cards (h-24, rounded-lg, animate-pulse)
CardsSkeleton: 9 skeleton cards matching PropertyCard layout
  - image area (h-24)
  - title line (h-4 w-2/3)
  - subtitle line (h-3 w-1/2)
  - badge area (h-5 w-16)
  - progress bar (h-2)
```

### DeletePropertyDialog.tsx (baru)
```text
Props: open, onOpenChange, property, onConfirm, isLoading
Content:
  - AlertDialog wrapper
  - Property name + type display
  - Unit count warning
  - Destructive confirm button with loading state
```

### PropertyFilters.tsx (update)
```text
Tambah props:
  - statusFilter, onStatusFilterChange
  - sortBy, onSortByChange
  - onResetFilters
  - activeFilterCount
Tambah komponen:
  - Status Select (All/Active/Inactive/Maintenance)
  - Sort Select (Name A-Z, Occupancy High-Low, Newest, Oldest)
  - Badge count filter aktif
  - Reset button
```

### PropertyCard.tsx (update)
```text
Tambah:
  - Image placeholder gradient jika images kosong
  - Hover transform: translateY(-2px) + shadow
  - Occupancy bar warna dinamis (success/warning/destructive)
  - "Baru" badge jika created_at < 7 hari
  - Quick action icon buttons pada hover (Edit, Units, Photos)
```

### Properties.tsx (update)
```text
Tambah state:
  - statusFilter, sortBy, itemsPerPage
  - deleteDialogProperty (ganti confirm())
Tambah logic:
  - Sort filteredProperties berdasarkan sortBy
  - Skeleton loading (PropertySkeleton) ganti spinner
  - DeletePropertyDialog ganti confirm()
  - Stats: occupancy color, trend indicator
```

## Urutan Implementasi

1. Buat `PropertySkeleton.tsx` -- komponen skeleton loading
2. Buat `DeletePropertyDialog.tsx` -- AlertDialog untuk delete
3. Update `PropertyFilters.tsx` -- status filter + sort + reset
4. Update `PropertyCard.tsx` -- visual enhancements
5. Update `PropertyTable.tsx` -- sortable + thumbnail + revenue
6. Update `Properties.tsx` -- integrate semua perubahan + stats enhancement
