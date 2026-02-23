
# Redesign Maintenance, MoveOuts, Contract Details (Page) + Seed Data

Menerapkan "Warm Luxury Futurism" ke seluruh modul Maintenance dan MoveOuts, refactor Contract Details dari dialog ke page, serta seeding dummy data.

---

## BAGIAN A: Refactor Contract Details -- Dialog ke Page

Saat ini `Contracts.tsx` masih menggunakan `ContractDetailsDialog` untuk melihat detail. `ContractDetail.tsx` page sudah ada tapi belum terhubung dari table. Akan direfactor agar:

### 1. ContractsTable.tsx
- Ubah `onView` handler agar navigate ke `/merchant/contracts/:id` bukan membuka dialog
- Row click juga navigate ke detail page
- Tambahkan `useNavigate` hook

### 2. Contracts.tsx (Merchant)
- Hapus `ContractDetailsDialog` dan `viewDialogOpen` state
- Hapus `openViewDialog` handler
- Hapus `EditTermsDialog` (akan dipindah ke detail page)
- Tetap pertahankan `CreateContractDialog`, `SignContractDialog`, dan `DeleteContractDialog`

### 3. ContractDetail.tsx (Merchant) -- Redesign
- Sudah ada tapi perlu: Edit Terms button, Sign button, Delete button
- Glassmorphic full redesign: semua section pakai `bg-card/90 backdrop-blur-sm rounded-2xl border border-border/40`
- Header: gradient icon box, back button `rounded-xl`
- Integrate `EditTermsDialog`, `SignContractDialog`, `DeleteContractDialog` ke page
- Actions sidebar: glassmorphic card dengan gradient CTA buttons

---

## BAGIAN B: Redesign Maintenance Pages

### 4. Maintenance.tsx (Merchant Main) -- Redesign
- PageHeader: sudah ada, tambahkan gradient styling
- Stats: sudah menggunakan `StatCard` -- verify glass
- Filters: belum glass -- apply `glass-filter-bar`
- Table: belum glass -- apply `glass-table`

### 5. MaintenanceFilters.tsx -- Redesign
- Wrapper: `glass-filter-bar` (bg-card/80 backdrop-blur-sm rounded-2xl border border-border/40 p-4)
- Search: `rounded-xl bg-background/60 border-border/50 pl-10`
- Select: `rounded-xl bg-background/60`

### 6. MaintenanceRequestTable.tsx -- Redesign
- Wrapper: `glass-table`
- Header: `bg-gradient-to-r from-muted/80 to-muted/40`, uppercase tracking
- Row: `hover:bg-primary/5 cursor-pointer` -- click navigates to detail
- Status/Priority/SLA badges: `rounded-full`
- Empty state: glassmorphic

### 7. MaintenanceStatusBadge.tsx -- Redesign
- All badges: `rounded-full` pill style

### 8. MaintenancePriorityBadge.tsx -- Redesign
- All badges: `rounded-full` pill style with color-coded backgrounds

### 9. SLABadge.tsx -- Redesign
- All badges: `rounded-full`

### 10. MaintenanceDetail.tsx (Merchant) -- Redesign
- Header: glassmorphic with gradient icon box, `rounded-xl` back button
- Request Details card: `bg-card/90 backdrop-blur-sm rounded-2xl border border-border/40`
- Photo gallery: `rounded-xl` with hover opacity
- Sidebar cards (Tenant, Unit, Status): all glassmorphic `rounded-2xl`
- Alert boxes: `rounded-xl`
- Status completion/cancellation box: glassmorphic with gradient accents
- CTA button: `gradient-cta`

### 11. UpdateMaintenanceDialog.tsx -- Redesign
- DialogContent: `rounded-2xl`
- Selects: `rounded-xl bg-background/60 border-border/50`
- Inputs: `rounded-xl bg-background/60`
- Textarea: `rounded-xl`
- CTA: `gradient-cta`

### 12. UpdateTimeline.tsx -- Redesign
- Card wrapper: `rounded-2xl bg-card/90 backdrop-blur-sm border border-border/40`
- Timeline dots: connected dots style with gradient fills
- Avatar: gradient ring
- Role badges: `rounded-full`
- Status badges: `rounded-full`
- Photo thumbnails: `rounded-xl`
- Empty state: glassmorphic

### 13. MaintenanceReplyForm.tsx -- Redesign
- Container: `rounded-2xl bg-card/80 backdrop-blur-sm border border-border/40 p-4`
- Textarea: `rounded-xl bg-background/60`
- Photo thumbnails: `rounded-xl`
- Select: `rounded-xl bg-background/60`
- Send button: `gradient-cta`

### 14. MaintenancePhotoUpload.tsx -- Redesign
- Photo grid items: `rounded-xl` with hover effects
- Remove button: `rounded-full`
- Upload area: glass treatment

### 15. MaintenanceReviewForm.tsx -- Redesign
- Card: `rounded-2xl bg-card/90 backdrop-blur-sm border border-border/40`
- Star buttons: larger hover scale, golden glow effect
- Textarea: `rounded-xl bg-background/60`
- CTA: `gradient-cta`

### 16. CompletionDialog.tsx -- Redesign
- DialogContent: `rounded-2xl`
- Textarea: `rounded-xl`
- Photo grid: `rounded-xl`
- CTA: `gradient-cta`

---

## BAGIAN C: Redesign Tenant Maintenance Pages

### 17. tenant/Maintenance.tsx -- Redesign
- Filters: glass-filter-bar style (rounded-xl inputs, bg-background/60)
- Request cards: `bg-card/90 backdrop-blur-sm rounded-2xl border border-border/40`
- Card hover: `hover:-translate-y-1 hover:shadow-lg hover:border-primary/30`
- Badges: `rounded-full`
- Empty state: glassmorphic
- Create dialog: `rounded-2xl`, inputs `rounded-xl bg-background/60`, CTA `gradient-cta`
- Cancel dialog: `rounded-2xl`, destructive gradient button
- No contract card: glassmorphic with gradient mesh

### 18. tenant/MaintenanceDetail.tsx -- Redesign
- Layout cards: `bg-card/90 backdrop-blur-sm rounded-2xl border border-border/40`
- Status badges: `rounded-full` with icons
- Priority badges: `rounded-full` color-coded
- Info sections: glass cards
- Photo gallery: `rounded-xl` with hover
- Back button: `rounded-xl`
- Review card: `rounded-2xl bg-card/90 backdrop-blur-sm`

---

## BAGIAN D: MoveOuts Detail Page (BARU) + Redesign

### 19. MoveOutDetail.tsx (BARU) -- `src/pages/merchant/MoveOutDetail.tsx`
- Route: `/merchant/move-outs/:noticeId`
- Fetch move-out notice by ID with contract, unit, property relations
- Fetch inspection, timeline, tasks, deposit refund, early termination
- Layout: 2-column (main + sidebar)
- Main: Notice info, Inspection details, Timeline (connected dots), Deposit calculation
- Sidebar: Tenant info, Unit info, Quick Actions (Schedule Inspection, Conduct Inspection)
- All sections: glassmorphic `rounded-2xl`
- CTA buttons: `gradient-cta`

### 20. Route Update -- App.tsx
- Tambahkan route: `/merchant/move-outs/:noticeId` -> `MoveOutDetail`

### 21. MoveOutsTable.tsx -- Update
- Row click: navigate to `/merchant/move-outs/:id`
- Tambahkan cursor-pointer dan navigate handler

### 22. MoveOuts.tsx -- Verify
- Already has pill tabs, glassmorphic filters -- should be good

---

## BAGIAN E: Seed Dummy Data

Menggunakan data yang sudah ada:
- Contract 1: `dff3fd8a` (tenant: `c6335a8d`, unit: `9a81b6cd`, merchant: `ed59d094`)
- Contract 2: `2af5f956` (tenant: `b030ae7f`, unit: `e119ff05`, merchant: `ed59d094`)

### Data yang di-seed:
1. **4 maintenance_requests** -- variasi status (pending, in_progress, completed, cancelled) dan priority (urgent, high, medium, low)
2. **6 maintenance_updates** -- timeline entries untuk requests di atas
3. **4 maintenance_timeline** -- initial submission entries
4. **1 maintenance_review** -- untuk completed request
5. **1 move_out_notice** -- status pending, intended 30 hari ke depan
6. **5 move_out_timeline** entries -- connected to notice
7. **4 move_out_tasks** -- checklist items
8. **1 move_out_inspection** -- scheduled

---

## Ringkasan File yang Diubah/Dibuat

| No | File | Tipe | Perubahan |
|----|------|------|-----------|
| 1 | `ContractsTable.tsx` | EDIT | Navigate to detail page |
| 2 | `Contracts.tsx` (merchant) | EDIT | Remove detail dialog |
| 3 | `ContractDetail.tsx` (merchant) | EDIT | Full glassmorphic redesign + actions |
| 4 | `Maintenance.tsx` (merchant) | EDIT | Glassmorphic styling |
| 5 | `MaintenanceFilters.tsx` | EDIT | glass-filter-bar |
| 6 | `MaintenanceRequestTable.tsx` | EDIT | glass-table, row click navigate |
| 7 | `MaintenanceStatusBadge.tsx` | EDIT | rounded-full pills |
| 8 | `MaintenancePriorityBadge.tsx` | EDIT | rounded-full pills |
| 9 | `SLABadge.tsx` | EDIT | rounded-full |
| 10 | `MaintenanceDetail.tsx` (merchant) | EDIT | Full glassmorphic redesign |
| 11 | `UpdateMaintenanceDialog.tsx` | EDIT | rounded-2xl, gradient CTA |
| 12 | `UpdateTimeline.tsx` | EDIT | Connected dots, glass cards |
| 13 | `MaintenanceReplyForm.tsx` | EDIT | Glass container, gradient CTA |
| 14 | `MaintenancePhotoUpload.tsx` | EDIT | rounded-xl, glass treatment |
| 15 | `MaintenanceReviewForm.tsx` | EDIT | Glass card, gradient CTA |
| 16 | `CompletionDialog.tsx` | EDIT | rounded-2xl, gradient CTA |
| 17 | `tenant/Maintenance.tsx` | EDIT | Glass cards, gradient CTA |
| 18 | `tenant/MaintenanceDetail.tsx` | EDIT | Glass cards, redesign |
| 19 | `MoveOutDetail.tsx` (merchant) | BARU | Full-page move-out detail |
| 20 | `App.tsx` | EDIT | Add move-out detail route |
| 21 | `MoveOutsTable.tsx` | EDIT | Row click navigate |
| 22 | DB Migration | SQL | Seed maintenance + move-out data |

## Urutan Implementasi

1. Seed data (DB migration) -- agar semua page bisa menampilkan konten
2. Contract refactor (ContractsTable navigate, Contracts.tsx remove dialog, ContractDetail.tsx redesign)
3. Maintenance components (Filters, Table, Badges, Stats)
4. Maintenance detail pages (merchant + tenant)
5. Maintenance dialogs & forms (UpdateDialog, Timeline, ReplyForm, ReviewForm, CompletionDialog)
6. MoveOut detail page (baru) + route + table update
7. Tenant maintenance pages
