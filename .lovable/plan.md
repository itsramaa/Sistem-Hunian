

# Restrukturisasi Sidebar Merchant: 25 Item menjadi 10 Item

## Pendekatan

Semua halaman dan fungsi yang ada **tidak dihapus**. Halaman-halaman yang terkait dikonsolidasikan ke dalam "hub pages" baru yang menggunakan **tab navigation** untuk menggabungkan beberapa modul dalam satu layar. Sidebar hanya menampilkan 10 item utama, tetapi semua fitur tetap bisa diakses.

## Pemetaan Konsolidasi

```text
SIDEBAR BARU (10 item)              HALAMAN YANG DIGABUNG
==========================          =======================
1. Utama
   - Dashboard                      Dashboard (tetap)

2. Manajemen Aset
   - Properti & Unit                Tab: Properti | Unit
   - Penyewa & Okupansi            Tab: Penyewa | Move-Outs | Tenant Analytics
   - Staf Operasional              Guardians (tetap, rename)

3. Keuangan
   - Transaksi & Tagihan           Tab: Tagihan | Pembayaran
   - Kontrak Sewa                  Contracts (tetap)

4. Operasional
   - Laporan Kerusakan             Maintenance (tetap)
   - Kepatuhan & Legalitas         Tab: Compliance | Data Quality

5. Wawasan Bisnis
   - Analitik Performa             Tab: Analytics Dashboard | Reports | Report Templates | Comparative Portfolio
   - Intelijen AI                  Tab: ML Analytics | DSS Advisor | Market Intelligence | Financial Risk | Tenant Quality

6. Bantuan
   - Pusat Bantuan                 Tab: Documents | OCR Tutorial | Support
```

## Detail Teknis

### 1. Update Navigation Config

**File:** `src/shared/components/layouts/navigation-config.ts`

Ganti `merchant.mainNav` dengan 6 grup baru berisi 10 item. Path untuk hub pages baru:
- `/merchant/assets` (Properti & Unit)
- `/merchant/occupancy` (Penyewa & Okupansi)
- `/merchant/transactions` (Transaksi & Tagihan)
- `/merchant/legal` (Kepatuhan & Legalitas)
- `/merchant/analytics` (Analitik Performa)
- `/merchant/ai-insights` (Intelijen AI)
- `/merchant/help` (Pusat Bantuan)

Item yang tidak berubah path-nya: Dashboard, Guardians, Contracts, Maintenance.

### 2. Buat Hub Pages (7 file baru)

Setiap hub page menggunakan `Tabs` component dengan konten yang mengimpor komponen dari halaman yang sudah ada.

| File Baru | Tab 1 | Tab 2 | Tab 3+ |
|-----------|-------|-------|--------|
| `src/pages/merchant/AssetsHub.tsx` | Properti (embed Properties content) | Unit (embed Units content) | - |
| `src/pages/merchant/OccupancyHub.tsx` | Penyewa (Tenants) | Move-Outs | Analitik Penyewa |
| `src/pages/merchant/TransactionsHub.tsx` | Tagihan (Invoices) | Pembayaran (Payments) | - |
| `src/pages/merchant/LegalHub.tsx` | Kepatuhan (Compliance) | Validasi Data (DataQuality) | - |
| `src/pages/merchant/AnalyticsHub.tsx` | Ringkasan (AnalyticsDashboard) | Laporan (Reports) | Template | Portfolio |
| `src/pages/merchant/AiInsightsHub.tsx` | Prediksi (ML Analytics) | Strategi (DSS Advisor) | Tren Pasar | Risiko | Skor Penyewa |
| `src/pages/merchant/HelpHub.tsx` | Dokumen (DocumentCenter) | Panduan OCR | Dukungan (Support) |

Setiap hub page akan:
- Menggunakan `PageHeader` dengan icon dan judul yang sesuai
- Menggunakan `Tabs` / `TabsList` / `TabsTrigger` / `TabsContent` dari Shadcn
- Mengimpor dan me-render konten dari halaman yang sudah ada sebagai komponen (bukan iframe)
- Mendukung URL hash (`#tab-name`) agar tab bisa di-deep-link

### 3. Refactor Halaman yang Ada

Halaman-halaman seperti `Properties.tsx`, `Units.tsx`, `Tenants.tsx`, dll. perlu di-refactor agar bisa digunakan sebagai **komponen embeddable** di dalam hub page:
- Export komponen utama (tanpa `PageHeader` sendiri) sebagai named export, misal `PropertiesContent`
- Halaman standalone tetap bisa diakses via route langsung (backward compatible)
- Hub page mengimpor `PropertiesContent` dan `UnitsContent` ke dalam tab

### 4. Update Routing di App.tsx

- Tambahkan route baru untuk setiap hub page (`/merchant/assets`, `/merchant/occupancy`, dll.)
- Route lama **tetap ada** untuk backward compatibility dan deep links (misal `/merchant/properties/:id` tetap bekerja)
- Redirect opsional dari route lama ke hub page bisa ditambahkan nanti

### 5. Update `isPathActive` Logic

Modifikasi `nav-main.tsx` atau `navigation-config.ts` agar hub items menyala (active) ketika user berada di sub-route terkait. Contoh: `/merchant/assets` aktif ketika pathname adalah `/merchant/properties/:id`.

Tambahkan field opsional `activePatterns` di `NavItem`:
```text
{ path: "/merchant/assets", activePatterns: ["/merchant/properties", "/merchant/units"], ... }
```

### Ringkasan File Changes

| File | Aksi |
|------|------|
| `src/shared/components/layouts/navigation-config.ts` | Modify - restructure merchant mainNav to 10 items |
| `src/pages/merchant/AssetsHub.tsx` | Create - Properti + Unit tabs |
| `src/pages/merchant/OccupancyHub.tsx` | Create - Penyewa + Move-Outs + Tenant Analytics tabs |
| `src/pages/merchant/TransactionsHub.tsx` | Create - Tagihan + Pembayaran tabs |
| `src/pages/merchant/LegalHub.tsx` | Create - Compliance + Data Quality tabs |
| `src/pages/merchant/AnalyticsHub.tsx` | Create - 4 analytics tabs |
| `src/pages/merchant/AiInsightsHub.tsx` | Create - 5 AI/DSS tabs |
| `src/pages/merchant/HelpHub.tsx` | Create - Documents + OCR + Support tabs |
| `src/pages/merchant/Properties.tsx` | Modify - extract `PropertiesContent` named export |
| `src/pages/merchant/Units.tsx` | Modify - extract `UnitsContent` named export |
| `src/pages/merchant/Tenants.tsx` | Modify - extract `TenantsContent` named export |
| `src/pages/merchant/MoveOuts.tsx` | Modify - extract `MoveOutsContent` named export |
| `src/pages/merchant/Invoices.tsx` | Modify - extract `InvoicesContent` named export |
| `src/pages/merchant/Payments.tsx` | Modify - extract `PaymentsContent` named export |
| `src/pages/merchant/PropertyCompliance.tsx` | Modify - extract content component |
| `src/pages/merchant/DataQualityHistory.tsx` | Modify - extract content component |
| `src/pages/merchant/AnalyticsDashboard.tsx` | Modify - extract content component |
| `src/pages/merchant/Reports.tsx` | Modify - extract content component |
| `src/pages/merchant/ReportTemplates.tsx` | Modify - extract content component |
| `src/pages/merchant/ComparativePortfolio.tsx` | Modify - extract content component |
| `src/pages/merchant/MlAnalytics.tsx` | Modify - extract content component |
| `src/pages/merchant/DssAdvisor.tsx` | Modify - extract content component |
| `src/pages/merchant/MarketIntelligence.tsx` | Modify - extract content component |
| `src/pages/merchant/FinancialRiskAnalytics.tsx` | Modify - extract content component |
| `src/pages/merchant/TenantQualityScoring.tsx` | Modify - extract content component |
| `src/pages/merchant/TenantAnalytics.tsx` | Modify - extract content component |
| `src/pages/merchant/DocumentCenter.tsx` | Modify - extract content component |
| `src/pages/merchant/OcrTutorial.tsx` | Modify - extract content component |
| `src/pages/merchant/Support.tsx` | Modify - extract content component |
| `src/App.tsx` | Modify - add 7 new hub routes |
| `src/shared/components/layouts/sidebar/nav-main.tsx` | Modify - support `activePatterns` for highlight logic |

