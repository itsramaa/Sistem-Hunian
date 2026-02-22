
# Audit & Maksimalkan Semua Merchant Pages

## Hasil Audit

Setelah membaca semua 21 halaman merchant dan skill terkait (ui-ux-designer, frontend-design, interaction-design, shadcn-ui, tailwind-css-patterns, page-cro, responsive-design, form-cro, accessibility-compliance), berikut temuan dan rencana peningkatan.

---

## Kategori Temuan

### A. Konsistensi Desain (Design System)

**Masalah:** Beberapa halaman memiliki pola header/stats/filter yang berbeda-beda:
- Dashboard: menggunakan Welcome message + 4 stat cards + progress bars
- Properties: menggunakan 3 stat cards dengan border-left accent + tooltips (sudah bagus)
- Contracts: header basic h1 + p + button
- Invoices: header basic h1 + p + button
- Payments: header responsive (flex-col sm:flex-row)
- Maintenance: tidak ada header, langsung stats
- Escrow: text-2xl header biasa
- Reports: header dengan export dropdown + date picker
- Billing: langsung render BillingDashboard tanpa header
- MoveOuts: tidak ada header, langsung filter
- Profile: tidak ada header, langsung tabs
- Settings: tidak ada header, langsung tabs
- Referrals: h1 header basic
- DssAdvisor: h1 header basic
- MlAnalytics: h1 header basic
- OcrTutorial: tidak ada header, langsung progress bar

**Solusi:** Buat pola page header yang konsisten dengan icon, title, description, dan action buttons.

### B. Loading States

**Masalah:** Inkonsistensi loading states:
- Dashboard: `MerchantDashboardSkeleton` (bagus)
- Properties: `PropertiesPageSkeleton` (bagus)
- Units: skeleton (sudah ada)
- PropertyDetail: `PropertyDetailSkeleton` (bagus)
- UnitDetail: custom skeleton (bagus)
- MaintenanceDetail: manual skeleton (bagus)
- Escrow: basic spinner `Loader2` (buruk)
- Billing: text "Loading..." (sangat buruk)
- Profile: `ProfileFormSkeleton` (bagus)
- Contracts, Invoices, Payments, Maintenance, MoveOuts, Reports: tidak ada page-level skeleton (bergantung pada tabel loading saja)

**Solusi:** Ganti semua spinner/text loading dengan skeleton screens yang konsisten.

### C. Empty States

**Masalah:** Beberapa halaman tidak punya empty state yang engaging:
- Contracts: tidak ada empty state khusus
- Invoices: tidak ada empty state khusus
- Payments: tidak ada empty state khusus
- Maintenance: bergantung pada tabel saja
- MoveOuts: bergantung pada tabel saja
- Reports: hanya loading spinner
- DssAdvisor: basic text "No recommendations yet"
- MlAnalytics: basic text "No risk scores yet"

**Solusi:** Tambah empty states yang informatif dengan icon, deskripsi, dan CTA.

### D. Halaman yang Perlu Peningkatan Signifikan

---

## Rencana Per-Halaman

### 1. Dashboard.tsx -- Perbaikan Minor
- Tambah page icon header yang konsisten (sudah ada Welcome message)
- Tambah hover card effects pada stat cards (transition-all hover:shadow-card-hover)
- Tambah staggered animation pada metric cards
- Property Overview: tambah klik navigasi ke property detail
- Financial Summary: tambah mini spark chart atau trend line

### 2. Contracts.tsx -- Perbaikan Sedang
- Tambah page icon header (FileText icon + border accent)
- Tambah skeleton loading saat initial load (bukan hanya di tabel)
- Tambah empty state per tab dengan ilustrasi berbeda
- Tambah badge count di tab headers (sudah ada angka, buat lebih visual)
- Tambah sort option pada filters

### 3. Invoices.tsx -- Perbaikan Sedang
- Tambah page icon header konsisten
- Tambah skeleton loading page-level
- Tambah empty state dengan CTA "Create first invoice"
- Tambah sort dropdown (by date, amount, status)
- Tambah active filter badges

### 4. Payments.tsx -- Perbaikan Minor
- Sudah cukup baik. Tambah page icon header konsisten
- Tambah skeleton loading
- Overdue tab: tambah visual urgency (red accent cards)

### 5. Maintenance.tsx -- Perbaikan Minor
- Tidak ada page header -- tambah header dengan icon Wrench
- Sudah komprehensif. Tambah quick link ke MaintenanceDetail dari tabel

### 6. MaintenanceDetail.tsx -- Baik
- Sudah lengkap dan well-structured. Minor: tambah breadcrumb (Dashboard > Maintenance > #{id})

### 7. Reports.tsx -- Perbaikan Minor
- Sudah sangat komprehensif
- Tambah skeleton loading untuk chart area saat loading
- Tambah responsive: chart height di mobile

### 8. Escrow.tsx -- Perbaikan Sedang
- GANTI spinner loading dengan skeleton screen
- Tambah page icon header
- Tambah hover effects pada balance cards
- Tambah animation pada balance amount (count-up)

### 9. Billing.tsx -- Perbaikan Signifikan
- GANTI text "Loading..." dengan skeleton
- Tambah page header (CreditCard icon)
- Bungkus dalam space-y-6 yang proper dengan header

### 10. Referrals.tsx -- Perbaikan Minor
- Tambah page icon header konsisten
- Sudah cukup bagus dengan gradient card

### 11. MoveOuts.tsx -- Perbaikan Sedang
- Tambah page header (DoorOpen icon + title + description)
- Tambah stats cards (upcoming count, completed count, early terminations, vacancy rate)
- Tambah skeleton loading per tab

### 12. Profile.tsx -- Perbaikan Minor
- Tambah page header (User icon)
- Sudah cukup lengkap. Minor: verification progress indicator (3/5 documents)

### 13. Settings.tsx -- Perbaikan Minor
- Tambah page header (Settings/Gear icon)
- Responsive: tab labels hidden on mobile (sudah partial)

### 14. DssAdvisor.tsx -- Perbaikan Sedang
- Tambah page icon header konsisten
- Recommendation cards: tambah hover effect
- Tambah skeleton loading per tab
- Confidence score: ubah jadi visual bar bukan text

### 15. MlAnalytics.tsx -- Perbaikan Sedang
- Tambah page icon header konsisten
- Risk scores: gunakan color-coded progress bar
- Churn prediction: tambah visual chart/gauge
- Skeleton loading per tab

### 16. OcrTutorial.tsx -- Perbaikan Minor
- Tambah page header (ScanText icon)
- Sudah cukup interaktif

### 17. Properties.tsx -- Sudah Dimaksimalkan
- Sudah sangat baik dari iterasi sebelumnya

### 18. PropertyDetail.tsx -- Sudah Dimaksimalkan
- Sudah baik. Minor: tambah breadcrumb yang lebih visual

### 19. Units.tsx -- Sudah Dimaksimalkan
- Sudah baik dari iterasi sebelumnya

### 20. UnitDetail.tsx -- Sudah Baik
- Sudah lengkap

### 21. Tenants.tsx -- Sudah Dimaksimalkan
- Sudah baik dari iterasi sebelumnya

---

## Implementasi Sistematis

### Phase 1: Shared Components (Pondasi)

**Buat `src/shared/components/ui/PageHeader.tsx`** (baru)
- Komponen header halaman yang konsisten: icon, title, description, actions
- Props: icon, title, description, children (untuk action buttons)
- Styling: flex items-center gap-3, icon dalam rounded-xl bg-primary/10

**Buat `src/shared/components/ui/StatCard.tsx`** (baru)
- Komponen stat card reusable dengan border-left accent, icon background, tooltip
- Props: title, value, subtitle, icon, accentColor, tooltip
- Termasuk hover effect (translateY + shadow)
- Termasuk count-up animation

**Buat `src/shared/components/ui/EmptyState.tsx`** (baru)
- Empty state komponen reusable
- Props: icon, title, description, action (CTA button)
- Gradient background, centered layout

**Buat `src/shared/components/ui/PageSkeleton.tsx`** (baru)
- Beberapa skeleton preset: `StatsRowSkeleton`, `TablePageSkeleton`, `TabsPageSkeleton`
- Reusable untuk semua halaman yang belum punya skeleton

### Phase 2: Update Halaman Per-Batch

**Batch 1: Halaman Finansial** (Contracts, Invoices, Payments, Escrow, Billing)
- Tambah PageHeader konsisten
- Ganti loading state dengan skeleton
- Tambah empty states
- Tambah sort/filter enhancements (active filter badges, reset)
- Escrow: ganti spinner, tambah hover effects
- Billing: ganti "Loading..." text, tambah proper header

**Batch 2: Halaman Operasional** (Maintenance, MoveOuts, Reports)
- Tambah PageHeader pada Maintenance dan MoveOuts
- MoveOuts: tambah stats cards row
- Reports: tambah chart skeleton loading
- Maintenance: minor enhancements

**Batch 3: Halaman Manajemen** (Profile, Settings, Referrals)
- Tambah PageHeader
- Minor UI polish

**Batch 4: Halaman AI/Tools** (DssAdvisor, MlAnalytics, OcrTutorial)
- Tambah PageHeader
- DSS: confidence score visual, skeleton loading
- ML: risk score visual bars, skeleton loading
- OCR: minor header

**Batch 5: Dashboard Enhancement**
- Stat cards hover effects
- Property list clickable rows
- Staggered animations
- Mini trend indicators

### Phase 3: Cross-cutting Enhancements

**Hover & Transition Effects**
- Semua Card komponen: `transition-all duration-200 hover:shadow-card-hover hover:-translate-y-0.5`
- Tabel row hover: `hover:bg-muted/50`
- Button hover states sudah di-handle oleh shadcn

**Staggered Animations**
- Pada stats cards dan content cards: animation-delay berdasarkan index
- CSS: `animate-fade-in` dengan `style={{ animationDelay: `${index * 100}ms` }}`

**Accessibility**
- Semua interactive elements: focus-visible ring
- Semua icon buttons: aria-label
- Heading hierarchy: h1 untuk page title, h2/h3 untuk sections
- Skip links sudah di MobileLayout

**Responsive Polish**
- Tabel: horizontal scroll dengan min-width
- Stats cards: responsive grid (1 col mobile, 2 tablet, 4 desktop)
- Filter bars: collapsible atau sheet di mobile
- Button groups: stack vertical di mobile

---

## File yang Dibuat/Diubah

### File Baru (4)
| File | Deskripsi |
|------|-----------|
| `src/shared/components/ui/PageHeader.tsx` | Header halaman konsisten |
| `src/shared/components/ui/StatCard.tsx` | Stat card reusable + animations |
| `src/shared/components/ui/EmptyState.tsx` | Empty state reusable |
| `src/shared/components/ui/PageSkeleton.tsx` | Skeleton presets reusable |

### File Update (16)
| File | Perubahan |
|------|-----------|
| `Dashboard.tsx` | Hover effects, staggered animations, clickable rows |
| `Contracts.tsx` | PageHeader, skeleton, empty states per tab, sort |
| `Invoices.tsx` | PageHeader, skeleton, empty state, sort, filter badges |
| `Payments.tsx` | PageHeader, skeleton |
| `Maintenance.tsx` | PageHeader |
| `MaintenanceDetail.tsx` | Breadcrumb |
| `Escrow.tsx` | Skeleton ganti spinner, PageHeader, hover effects |
| `Billing.tsx` | Skeleton ganti "Loading...", PageHeader |
| `Referrals.tsx` | PageHeader |
| `MoveOuts.tsx` | PageHeader, stats cards |
| `Profile.tsx` | PageHeader |
| `Settings.tsx` | PageHeader |
| `DssAdvisor.tsx` | PageHeader, skeleton, visual confidence bars |
| `MlAnalytics.tsx` | PageHeader, skeleton, visual risk bars |
| `OcrTutorial.tsx` | PageHeader |
| `Reports.tsx` | Chart skeleton loading |

---

## Urutan Implementasi

1. Buat 4 shared components (PageHeader, StatCard, EmptyState, PageSkeleton)
2. Batch 1: Contracts, Invoices, Payments, Escrow, Billing
3. Batch 2: Maintenance, MoveOuts, Reports
4. Batch 3: Profile, Settings, Referrals
5. Batch 4: DssAdvisor, MlAnalytics, OcrTutorial
6. Batch 5: Dashboard enhancements
7. Cross-cutting: hover effects, animations, accessibility pass
