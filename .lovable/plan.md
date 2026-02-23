
# Redesign Total: Tenants, Contracts & Semua Komponen Terkait + Gallery/List View Units + Seed Data

Menerapkan aesthetic "Warm Luxury Futurism" (glassmorphism, rounded-2xl, gradient accents, hover lift) ke seluruh modul Tenants dan Contracts, menambahkan gallery/list view toggle pada Units, serta seeding dummy data agar semua fitur bisa dinavigasi.

---

## BAGIAN A: Unit Gallery/List View

Units saat ini hanya punya table view. Akan ditambahkan gallery view (card grid) seperti Properties.

### Units.tsx
- Tambahkan state `viewMode: 'gallery' | 'list'`
- Tambahkan toggle view di filter bar (pill-style LayoutGrid/List icons)
- Render `UnitCard` grid saat gallery, `UnitsTable` saat list

### UnitCard.tsx (File Baru)
- Glassmorphic card: `bg-card/90 backdrop-blur-sm border border-border/40 rounded-2xl`
- Photo section: `rounded-xl h-32` (atau placeholder gradient jika tidak ada foto)
- Status badge: `rounded-full` pill style
- Info: unit number, property name, rent amount, type
- Hover: `hover:-translate-y-2 hover:shadow-[0_12px_40px_rgba(0,0,0,0.1)] hover:border-primary/30`
- Amenity badges: `rounded-full` dengan subtle background tinting

---

## BAGIAN B: Redesign Tenants Module (Merchant Side)

### 1. Tenants.tsx (Main Page)
- Header: gradient icon box + `gradient-cta` button
- Tabs: pill-style `rounded-full` TabsList
- Empty states: glassmorphic dengan gradient mesh
- Delete dialog: `rounded-2xl`, gradient destructive button

### 2. TenantStats.tsx
- Cards: `glass-stat-card` utility class
- Icon container: `gradient-icon-box`
- Hover lift: `hover:-translate-y-1 hover:shadow-lg transition-all duration-300`

### 3. TenantsFilters.tsx
- Wrapper: `glass-filter-bar` utility
- Search input: `rounded-xl bg-background/60 border-border/50 pl-10`
- Select triggers: `rounded-xl bg-background/60`

### 4. TenantsTable.tsx (shared)
- Wrapper: `glass-table` (rounded-2xl, glass bg)
- Header row: `bg-gradient-to-r from-muted/80 to-muted/40`, uppercase tracking
- Row hover: `hover:bg-primary/5`
- Avatar: gradient ring
- Status badges: `rounded-full`
- Empty state: glassmorphic with gradient mesh
- Pagination: modern pill style

### 5. InvitationsTable.tsx
- Same `glass-table` treatment
- Status badges: `rounded-full` colored pill
- Pagination: pill style

### 6. TenantDetailsDialog.tsx
- DialogContent: `rounded-2xl`
- Avatar: larger, gradient ring
- Cards: `bg-card/80 backdrop-blur-sm rounded-2xl border border-border/40`
- Progress bar: gradient fill
- Financial cards: glass stat style

### 7. AddTenantDialog.tsx
- DialogContent: `rounded-2xl`
- Step indicator: connected dots stepper style
- Tenant list items: `rounded-xl bg-card/80 backdrop-blur-sm border border-border/40`
- Selected tenant: `bg-primary/10 border-primary/30`
- Input fields: `rounded-xl bg-background/60 border-border/50`
- CTA: `gradient-cta`

### 8. InviteTenantDialog.tsx
- DialogContent: `rounded-2xl`
- Input fields: `rounded-xl bg-background/60 border-border/50`
- Select triggers: `rounded-xl`
- Submit button: `gradient-cta`

---

## BAGIAN C: Redesign Contracts Module (Merchant Side)

### 9. Contracts.tsx (Main Page)
- PageHeader icon: `gradient-icon-box`
- CTA: `gradient-cta`
- Tabs: pill-style `rounded-full`

### 10. ContractStats.tsx
- Already uses `StatCard` -- akan diverifikasi apakah `StatCard` sudah menggunakan glass style

### 11. ContractsFilters.tsx
- Wrapper: `glass-filter-bar`
- Search: `rounded-xl bg-background/60 pl-10`
- Select: `rounded-xl bg-background/60`

### 12. ContractsTable.tsx
- Wrapper: `glass-table`
- Header: gradient bg, uppercase tracking
- Row hover: `hover:bg-primary/5`
- Status/Signature badges: `rounded-full`
- Pagination: pill style (sudah punya `TablePagination`)

### 13. ContractCard.tsx
- Card: `bg-card/90 backdrop-blur-sm rounded-2xl border border-border/40`
- Icon container: `gradient-icon-box`
- Hover: `hover:-translate-y-1 hover:shadow-lg`
- Badges: `rounded-full`

### 14. ContractDetailsDialog.tsx
- DialogContent: `rounded-2xl`
- Header icon: `gradient-icon-box`
- Info cards: `rounded-2xl bg-card/80 backdrop-blur-sm border border-border/40`
- Signature sections: glass containers
- Terms section: glass border

### 15. CreateContractDialog.tsx
- DialogContent: `rounded-2xl`
- Input/Select: `rounded-xl bg-background/60 border-border/50`
- CTA: `gradient-cta`

### 16. DeleteContractDialog.tsx
- Content: `rounded-2xl`
- Warning icon: animated pulse
- Delete button: gradient destructive

### 17. SignContractDialog.tsx
- DialogContent: `rounded-2xl`
- Contract info box: `rounded-2xl bg-gradient-to-br from-muted/50 to-muted/30`
- Signature pad container: `rounded-xl border border-border/40`
- Sign button: `gradient-cta`

### 18. EditTermsDialog.tsx
- DialogContent: `rounded-2xl`
- Contract info: glass card
- Textarea: `rounded-xl`
- CTA: `gradient-cta`

### 19. ContractStatusBadge.tsx
- All badges: `rounded-full` pill style

### 20. SignatureStatusBadge.tsx
- All badges: `rounded-full` pill style

### 21. ContractDocumentUpload.tsx
- Upload area: `rounded-xl border-2 border-dashed border-border/40 hover:border-primary/50`
- File preview: `rounded-xl bg-card/80 backdrop-blur-sm`
- Upload button: `gradient-cta`

### 22. ContractNoticePeriod.tsx
- Card: `bg-card/80 backdrop-blur-sm rounded-2xl border border-border/40`
- Contract items: `rounded-xl` with urgency border
- Dialog: `rounded-2xl`
- Reason buttons: `rounded-xl`

### 23. ContractTemplateManager.tsx
- Card: `bg-card/80 backdrop-blur-sm rounded-2xl`
- Template items: `rounded-xl bg-card/80 border border-border/40 hover:border-primary/30`
- Dialog: `rounded-2xl`
- CTA buttons: `gradient-cta`

### 24. ContractSigningFlow.tsx
- Card: `rounded-2xl bg-card/90 backdrop-blur-sm`
- Stepper: connected dots style
- Sections: glass containers
- Checkbox items: `rounded-xl border border-border/40`
- Signature container: `rounded-xl`

### 25. EarlyTerminationReviewDialog.tsx
- DialogContent: `rounded-2xl`
- Request details: `rounded-2xl bg-gradient-to-br from-muted/50 to-muted/30`
- Radio items: `rounded-xl border border-border/40 hover:bg-primary/5`
- Inputs: `rounded-xl`
- CTA: `gradient-cta`

### 26. EarlyTerminationsList.tsx
- Cards: `bg-card/90 backdrop-blur-sm rounded-2xl border border-border/40`
- Info boxes: glass stat style
- CTA: `gradient-cta`

### 27. DocumentLightbox.tsx
- Controls: `rounded-full bg-card/80 backdrop-blur-sm`
- Thumbnail strip: `rounded-xl`
- Navigation: glass buttons

---

## BAGIAN D: Redesign MoveOuts Module

### 28. MoveOuts.tsx (Main Page)
- PageHeader: `gradient-icon-box`
- Stats: already uses `StatCard`
- Tabs: pill-style
- Filters: `glass-filter-bar`

### 29. MoveOutsTable.tsx
- `glass-table` treatment
- Header: gradient bg
- Row hover: `hover:bg-primary/5`
- Badges: `rounded-full`

### 30. MoveOutsFilters.tsx
- `glass-filter-bar`
- Search: `rounded-xl bg-background/60 pl-10`

### 31. MoveOutsList.tsx
- Cards: `bg-card/90 backdrop-blur-sm rounded-2xl border border-border/40`
- Info boxes: glass stat cards
- Buttons: `gradient-cta`

### 32. MoveOutNoticeDialog.tsx
- DialogContent: `rounded-2xl`
- Contract info: `rounded-2xl bg-gradient-to-br from-muted/50 to-muted/30`
- Calendar container: `rounded-xl`
- Warning/success boxes: `rounded-2xl`
- CTA: `gradient-cta`

### 33. MoveOutDashboard.tsx
- Timeline: modern connected dots style
- Task cards: `rounded-xl bg-card/80 backdrop-blur-sm`
- Progress: gradient fill

### 34. MoveOutStatusBadge.tsx
- All badges: `rounded-full`

### 35. MoveOutPenaltyWarning.tsx
- Card: `rounded-2xl`
- Alerts: `rounded-xl`
- Penalty box: `rounded-2xl bg-destructive/10`

---

## BAGIAN E: Redesign Tenant-Side Pages

### 36. tenant/Contracts.tsx
- Current contract card: `bg-card/90 backdrop-blur-sm rounded-2xl border border-border/40`
- Info boxes: glass stat style with `rounded-2xl`
- Badges: `rounded-full`
- Buttons: `gradient-cta` for primary actions
- History cards: `rounded-2xl bg-card/80`

### 37. tenant/SignContract.tsx
- Contract details card: `rounded-2xl bg-card/90 backdrop-blur-sm`
- Info boxes: `rounded-2xl bg-card/80 backdrop-blur-sm`
- Signature pad: `rounded-xl border border-border/40`
- CTA: `gradient-cta`

---

## BAGIAN F: Admin Tenant Components

### 38. admin/AdminTenantStats.tsx
- `glass-stat-card` utility
- `gradient-icon-box` for icons
- Hover lift

### 39. admin/AdminTenantsTable.tsx
- `glass-table` wrapper
- Gradient header
- `rounded-full` badges
- Pill pagination

### 40. admin/AdminTenantFilters.tsx
- `glass-filter-bar`
- `rounded-xl` inputs/selects

### 41. admin/TenantDetailsDialog.tsx (admin version)
- `rounded-2xl` dialog
- Glass cards
- Gradient icon

---

## BAGIAN G: Seed Dummy Data

Akan dibuat migration SQL yang menyisipkan data dummy menggunakan ID user dan merchant yang sudah ada:
- Merchant: `ed59d094-ba2e-4520-bf97-d76444ae45d1` (user: `3ec48cd9-7f02-4696-9ef5-f6fe2fbf82cd`)
- Tenant: user `c6335a8d-e264-4bfb-a209-34a7676af712`
- Tenant 2: user `b030ae7f-dbb5-4d0c-b776-2b8c30e3927c`
- Existing property: `ee91fa84-fcb4-4a01-a9d6-b26afc30e75e`

### Data yang akan di-seed:
1. **2 additional properties** (Kost Modern Menteng, Apartemen Sudirman Residence) masing-masing dengan 4-6 units
2. **10+ units** total dengan variasi status (available, occupied, maintenance)
3. **3 active contracts** untuk tenant yang ada
4. **2 past contracts** (expired/terminated)
5. **1 draft contract**
6. **2 tenant invitations** (1 pending, 1 accepted)
7. **1 move-out notice** with timeline entries and tasks
8. **1 early termination request**

### Update existing data:
- Update profiles `full_name` yang masih kosong agar lebih readable
- Update units yang ada agar lebih realistis (nama, harga, amenities)

---

## Ringkasan File yang Diubah/Dibuat

| No | File | Perubahan |
|----|------|-----------|
| 1 | `UnitCard.tsx` (BARU) | Gallery card untuk units |
| 2 | `Units.tsx` | Gallery/list toggle |
| 3 | `Tenants.tsx` | Glass styling, pill tabs, gradient CTA |
| 4 | `TenantStats.tsx` | glass-stat-card |
| 5 | `TenantsFilters.tsx` | glass-filter-bar |
| 6 | `TenantsTable.tsx` | glass-table |
| 7 | `InvitationsTable.tsx` | glass-table |
| 8 | `TenantDetailsDialog.tsx` | rounded-2xl, glass cards |
| 9 | `AddTenantDialog.tsx` | connected dots stepper, glass inputs |
| 10 | `InviteTenantDialog.tsx` | rounded-2xl, gradient CTA |
| 11 | `Contracts.tsx` | pill tabs, gradient CTA |
| 12 | `ContractsFilters.tsx` | glass-filter-bar |
| 13 | `ContractsTable.tsx` | glass-table |
| 14 | `ContractCard.tsx` | glassmorphic card |
| 15 | `ContractDetailsDialog.tsx` | glass info cards |
| 16 | `CreateContractDialog.tsx` | rounded inputs, gradient CTA |
| 17 | `DeleteContractDialog.tsx` | gradient destructive |
| 18 | `SignContractDialog.tsx` | glass info, gradient CTA |
| 19 | `EditTermsDialog.tsx` | glass card, gradient CTA |
| 20 | `ContractStatusBadge.tsx` | rounded-full pills |
| 21 | `SignatureStatusBadge.tsx` | rounded-full pills |
| 22 | `ContractDocumentUpload.tsx` | glass upload area |
| 23 | `ContractNoticePeriod.tsx` | glass cards |
| 24 | `ContractTemplateManager.tsx` | glass template items |
| 25 | `ContractSigningFlow.tsx` | connected dots stepper |
| 26 | `EarlyTerminationReviewDialog.tsx` | glass details, gradient CTA |
| 27 | `EarlyTerminationsList.tsx` | glass cards |
| 28 | `DocumentLightbox.tsx` | glass controls |
| 29 | `MoveOuts.tsx` | pill tabs |
| 30 | `MoveOutsTable.tsx` | glass-table |
| 31 | `MoveOutsFilters.tsx` | glass-filter-bar |
| 32 | `MoveOutsList.tsx` | glass cards |
| 33 | `MoveOutNoticeDialog.tsx` | glass info, gradient CTA |
| 34 | `MoveOutDashboard.tsx` | connected dots timeline |
| 35 | `MoveOutStatusBadge.tsx` | rounded-full |
| 36 | `MoveOutPenaltyWarning.tsx` | rounded-2xl |
| 37 | `tenant/Contracts.tsx` | glass cards |
| 38 | `tenant/SignContract.tsx` | glass cards, gradient CTA |
| 39 | `admin/AdminTenantStats.tsx` | glass-stat-card |
| 40 | `admin/AdminTenantsTable.tsx` | glass-table |
| 41 | `admin/AdminTenantFilters.tsx` | glass-filter-bar |
| 42 | `admin/TenantDetailsDialog.tsx` | glass dialog |
| 43 | DB Migration | Seed dummy data |

## Urutan Implementasi

1. Seed data (DB migration) -- data dulu agar bisa test visual
2. `UnitCard.tsx` + `Units.tsx` -- gallery view baru
3. Tenant components (Stats, Filters, Tables, Dialogs)
4. Contract components (Stats, Filters, Tables, Cards, Dialogs)
5. MoveOut components
6. Tenant-side pages
7. Admin tenant components
8. Badge components (StatusBadge, SignatureBadge, MoveOutBadge)
