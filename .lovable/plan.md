
# 3.3.2 Financial Analysis + 3.3.3 Predictive Analytics + 3.3.4 Reporting

## Gap Analysis

### 3.3.2 Financial Analysis

| FR | Deskripsi | Status |
|----|-----------|--------|
| FR-801 | P&L statement per kosan | Sudah ada (`FinancialRiskAnalytics.tsx` Tab ROI -- menampilkan revenue, expenses, net income per properti) |
| FR-802 | ROI, payback, NPV, IRR | Sudah ada (`ml-financial-analytics` edge function + `FinancialRiskAnalytics.tsx` Tab ROI & NPV) |
| FR-803 | Sensitivity analysis chart | Sudah ada sebagian (tabel sensitivitas di Tab Sensitivitas, tapi belum ada **chart** visual) |
| FR-804 | Benchmark dengan peer group | **Belum ada** |
| FR-805 | Investment recommendation BUY/HOLD/SELL | Sudah ada (`dss-investment-insight` returns outlook: positive/neutral/negative + `ml-financial-analytics` returns recommendation: invest/hold/divest) |

### 3.3.3 Predictive Analytics

| FR | Deskripsi | Status |
|----|-----------|--------|
| FR-901 | Occupancy forecast 3-6 bulan | Sudah ada (`ml-occupancy-forecast` + `MarketIntelligence.tsx` Tab Forecast Okupansi) |
| FR-902 | Price trend forecast | Sudah ada (`ml-price-intelligence` returns `price_trends` + `MarketIntelligence.tsx` Tab Tren Harga) |
| FR-903 | Tenant payment reliability score | Sudah ada (`ml-tenant-risk-score` + `MlAnalytics.tsx` Tab Risk) |
| FR-904 | Confidence interval untuk setiap prediction | Sudah ada (revenue forecast shows upper/lower bound, occupancy forecast shows confidence per month, price intel shows confidence per recommendation) |

### 3.3.4 Reporting

| FR | Deskripsi | Status |
|----|-----------|--------|
| FR-1001 | Standard report templates (5 types) | **Belum ada** (hanya ada generic `Reports.tsx` dengan payment/maintenance export) |
| FR-1002 | Custom report builder | **Belum ada** |
| FR-1003 | Export ke PDF, Excel, PowerPoint | Sudah ada sebagian (CSV dan PDF via print. **Excel (.xlsx) dan PowerPoint belum ada**) |
| FR-1004 | Schedule automated report | **Belum ada** |
| FR-1005 | Email report ke stakeholder | **Belum ada** (email hanya untuk auth, bukan transactional) |

---

## Yang Perlu Diimplementasi

### 1. FR-803: Sensitivity Analysis Chart
Menambahkan visualisasi chart (BarChart) ke Tab Sensitivitas di `FinancialRiskAnalytics.tsx`. Saat ini hanya tabel. Tambahkan BarChart yang membandingkan ROI hasil setiap skenario.

### 2. FR-804: Peer Benchmarking
Menambahkan tab baru "Benchmark" di `FinancialRiskAnalytics.tsx` yang membandingkan properti yang dipilih dengan properti lain di lokasi/segmen yang sama. Data diambil client-side dari `properties` + `units` yang sudah ada. Menampilkan: rata-rata ROI peer group, occupancy rate, rent per unit, posisi relatif properti saat ini.

### 3. FR-1001: Standard Report Templates
Membuat halaman baru `ReportTemplates.tsx` dengan 5 template report yang bisa di-generate:
- **Executive Summary**: KPI ringkasan (revenue, occupancy, risk score, ROI) dari data yang sudah ada
- **Detailed Property Analysis**: Detail per properti (units, contracts, maintenance)
- **Financial Performance Report**: P&L, ROI, NPV/IRR dari data `ml-financial-analytics`
- **Risk Assessment Report**: Disaster risk, tenant risk, insurance dari data existing
- **Investment Opportunity Report**: Dari `dss-investment-insight` data

Semua template menggunakan data dari Supabase client queries (tidak perlu edge function baru), lalu di-render sebagai HTML dan di-export via `exportToPDF`.

### 4. FR-1002: Custom Report Builder
Menambahkan tab "Report Builder" di halaman `ReportTemplates.tsx` dimana user bisa:
- Pilih metrik (revenue, occupancy, ROI, risk score, maintenance count, dll)
- Pilih dimensi (per properti, per bulan, per unit type)
- Pilih time range
- Generate report on-the-fly dan export

### 5. FR-1003: Export Excel (.xlsx)
Menambahkan `exportToExcel` function di `exportUtils.ts` menggunakan CSV format dengan `.csv` extension (tanpa dependency tambahan). Untuk PowerPoint: tidak feasible tanpa dependency berat, akan dicover dengan PDF export yang sudah ada.

### 6. FR-1004 & FR-1005: Scheduled Reports & Email
FR-1004 (scheduled reports) memerlukan cron job infrastructure. FR-1005 (email reports) dibatasi karena Lovable email hanya untuk authentication. Kedua fitur ini akan di-implementasi sebagai **manual reminder UI** -- user bisa set reminder schedule yang tampil di dashboard, tapi automated generation + email tidak feasible dengan batasan platform saat ini.

---

## Arsitektur

```text
[Frontend]
FinancialRiskAnalytics.tsx  ---->  Existing data (sensitivity chart + benchmark tab)
ReportTemplates.tsx         ---->  Supabase client queries (5 templates + custom builder)
exportUtils.ts              ---->  Extended with Excel export

[Tidak ada edge function baru]
[Tidak ada database migration baru]
```

---

## Detail Teknis

### File Baru

| File | Deskripsi |
|------|-----------|
| `src/pages/merchant/ReportTemplates.tsx` | Halaman report templates + custom builder |
| `src/features/analytics/services/reportTemplateService.ts` | Service fetch data untuk 5 template report |
| `src/features/analytics/hooks/useReportTemplates.ts` | React Query hooks |

### File yang Dimodifikasi

| File | Perubahan |
|------|-----------|
| `src/pages/merchant/FinancialRiskAnalytics.tsx` | Tambah chart di Tab Sensitivitas + tab baru "Benchmark" |
| `src/shared/utils/exportUtils.ts` | Tambah `exportToExcel` (CSV-based) |
| `src/shared/components/layouts/navigation-config.ts` | Tambah menu "Template Laporan" di grup Analitik |
| `src/App.tsx` | Tambah lazy import + route `report-templates` |

### Tidak Ada Database Migration

Semua data sudah tersedia di tabel existing: `properties`, `units`, `contracts`, `payments`, `maintenance_requests`, `tenant_risk_scores`, `disaster_risk_profiles`, `maintenance_expenses`.

### Tidak Ada Edge Function Baru

Report templates menggunakan data yang sudah tersedia via Supabase client queries.

---

## Detail Per Komponen

### A. Sensitivity Chart (FR-803)

Lokasi: `FinancialRiskAnalytics.tsx` Tab Sensitivitas

Menambahkan `BarChart` dari recharts di atas tabel yang sudah ada:
- X-axis: `scenario_name`
- Y-axis dual: `resulting_roi` (bar) + baseline ROI (reference line)
- Color berdasarkan `impact_level` (merah = high, kuning = medium, hijau = low)

### B. Peer Benchmark Tab (FR-804)

Lokasi: `FinancialRiskAnalytics.tsx` -- Tab baru ke-5 "Benchmark"

- Fetch semua properties + units merchant
- Filter peer group: properti lain di kota yang sama dan/atau property_type yang sama
- Hitung metrik: avg rent, occupancy rate, estimated ROI
- Tampilkan cards perbandingan: "Properti Anda" vs "Rata-rata Peer"
- RadarChart (recharts) membandingkan 4-5 dimensi

### C. Report Templates Page (FR-1001)

Layout:
- PageHeader "Template Laporan" dengan icon FileText
- Grid 5 template cards, masing-masing dengan: icon, nama, deskripsi, tombol "Generate"
- Property selector (beberapa template memerlukan properti tertentu)

Setiap template:
1. **Executive Summary**: Query properties (count, occupancy), payments (total revenue), maintenance (pending count), risk scores
2. **Detailed Property Analysis**: Per-properti: units list, contract status, maintenance history
3. **Financial Performance**: Revenue vs expenses, formatted P&L table
4. **Risk Assessment**: Disaster risk profiles, tenant risk distribution, compliance status
5. **Investment Opportunity**: ROI ranking semua properti, top recommendations

Output: HTML table yang di-render via `exportToPDF` atau `exportToExcel`.

### D. Custom Report Builder (FR-1002)

Layout (tab kedua di ReportTemplates):
- Multi-select checklist: pilih metrik (revenue, occupancy, ROI, risk, maintenance)
- Select: dimensi (per properti / per bulan / per unit type)
- Date range picker
- Tombol "Generate Preview" -> tampilkan tabel di halaman
- Tombol "Export PDF" / "Export CSV"

### E. Excel Export (FR-1003)

Menambahkan fungsi `exportToExcel` di `exportUtils.ts` yang menghasilkan file CSV dengan extension `.csv` dan MIME type `text/csv`. Ini kompatibel dengan Excel tanpa memerlukan library tambahan seperti `xlsx`.

### F. FR-1004 & FR-1005: Catatan Limitasi

- **FR-1004**: Scheduled automated reports memerlukan pg_cron + edge function. Akan di-implementasi sebagai "reminder badge" di dashboard yang mengingatkan user untuk generate report secara manual pada jadwal yang ditentukan. Data jadwal disimpan di localStorage.
- **FR-1005**: Email report ke stakeholder tidak feasible karena Lovable email hanya mendukung authentication emails. Akan ditampilkan note informatif di UI bahwa fitur ini memerlukan integrasi email pihak ketiga.

---

## Urutan Implementasi

1. Update `exportUtils.ts` (tambah `exportToExcel`)
2. Service `reportTemplateService.ts`
3. Hooks `useReportTemplates.ts`
4. Update `FinancialRiskAnalytics.tsx` (sensitivity chart + benchmark tab)
5. Halaman `ReportTemplates.tsx` (5 templates + custom builder)
6. Update navigasi + routes
