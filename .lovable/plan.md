
# 3.2.3 Data Extraction & Mapping + 3.3.1 Dashboard & Visualization

## Gap Analysis

### 3.2.3 Data Extraction & Mapping

| FR | Deskripsi | Status |
|----|-----------|--------|
| FR-601 | Extract data struktural dari OCR result | Sudah ada (5 OCR edge functions return structured `extracted_data` via AI tools) |
| FR-602 | Auto-map extracted data ke field yang sesuai | Sudah ada (auto-populate ke `profiles`, `merchant_verifications`, `compliance_documents`) |
| FR-603 | Store raw OCR text dan extracted structured data | Sudah ada (`ocr_results.extracted_data` jsonb menyimpan keduanya) |
| FR-604 | Suggest data correction via ML pattern matching | **Belum ada** -- perlu fitur suggestion di OcrResultEditor |

### 3.3.1 Dashboard & Visualization

| FR | Deskripsi | Status |
|----|-----------|--------|
| FR-701 | Interactive dashboard dengan key metrics | Sudah ada (`Reports.tsx` + `MlAnalytics.tsx`) |
| FR-702a | Price statistics (min, max, avg, median) | Sudah ada di `MarketIntelligence.tsx` (segmen harga) |
| FR-702b | Occupancy trend 6 bulan | Sudah ada sebagian (`Reports.tsx` occupancy by type, tapi bukan trend chart 6 bulan) |
| FR-702c | ROI distribution histogram | **Belum ada** |
| FR-702d | Risk heatmap (lokasi disaster risk) | **Belum ada** |
| FR-702e | Tenant quality distribution | **Belum ada** |
| FR-703 | Drill-down per kosan | **Belum ada** |
| FR-704 | Filter by segmen, lokasi, tahun pembangunan | **Belum ada** (hanya filter time range) |
| FR-705 | Export dashboard screenshot/PDF | Sudah ada sebagian (CSV/PDF text export, tapi bukan visual screenshot) |

---

## Yang Perlu Diimplementasi

### 1. FR-604: ML Correction Suggestion di OcrResultEditor

Menambahkan tombol "Sarankan Koreksi" di `OcrResultEditor.tsx` yang memanggil edge function baru `ml-ocr-correction-suggest`. Function ini menganalisis extracted data + raw text + document type, lalu menyarankan perbaikan untuk field yang memiliki confidence rendah atau inkonsisten.

**Edge function baru**: `supabase/functions/ml-ocr-correction-suggest/index.ts`

Input:
- `ocr_result_id` -- ID hasil OCR yang sudah ada
- Sistem akan fetch `extracted_data`, `document_type`, dan confidence scores

Output (via AI tool):
```text
{
  suggestions: [
    { field, current_value, suggested_value, reason, confidence }
  ],
  overall_assessment: string
}
```

Tier limits: `{ free: 0, starter: 5, professional: -1, enterprise: -1 }`

Update pada `OcrResultEditor.tsx`:
- Tombol "Saran AI" di header
- Suggestions ditampilkan sebagai inline badges di samping field yang relevan
- Klik suggestion untuk apply ke field

### 2. FR-702b s/d FR-702e + FR-703 + FR-704: Analytics Dashboard Enhancement

**File baru**: `src/pages/merchant/AnalyticsDashboard.tsx`

Halaman dashboard baru yang mengkonsolidasikan semua visualisasi yang diminta, terpisah dari `Reports.tsx` yang fokus pada operasional reporting.

Layout:
- PageHeader "Dashboard Analitik" dengan icon BarChart3
- Filter bar: property type, city, construction year range
- Grid layout 5 sections

**Section A: Price Statistics (FR-702a -- consolidated)**
- Cards: Min, Max, Average, Median rent_amount dari units
- Dihitung client-side dari query `units` joined `properties`

**Section B: Occupancy Trend 6 Bulan (FR-702b)**
- LineChart 6 bulan terakhir
- Data dari `contracts` (count active per bulan) / `units` count
- Dihitung client-side

**Section C: ROI Distribution Histogram (FR-702c)**
- BarChart histogram ROI per properti
- ROI dihitung dari: `(total_rent_revenue_annual / (construction_cost + renovation_cost)) * 100`
- Data: properties + units (rent_amount) + construction/renovation costs
- Bucket: 0-5%, 5-10%, 10-15%, 15-20%, 20%+

**Section D: Risk Heatmap (FR-702d)**
- Leaflet map (sudah ada dependency `react-leaflet`) menampilkan markers per properti
- Warna marker berdasarkan `disaster_risk_level` dari tabel `properties` dan/atau `disaster_risk_profiles`
- Hijau = rendah, kuning = sedang, merah = tinggi
- Klik marker untuk lihat detail properti (drill-down FR-703)

**Section E: Tenant Quality Distribution (FR-702e)**
- PieChart distribusi grade (A/B/C/D/F) dari `tenant_risk_scores` atau data scoring
- Dihitung client-side dari `tenant_risk_scores` table

**Drill-down (FR-703):**
- Klik properti di tabel/chart -> navigasi ke `/merchant/properties/:id`
- Atau buka Sheet/Dialog detail per properti di dashboard

**Filter (FR-704):**
- Dropdown: property_type, city
- Range slider: construction_year
- Semua filter apply ke seluruh sections

### 3. FR-705: Export Dashboard sebagai PDF

Menambahkan tombol "Export PDF" di `AnalyticsDashboard.tsx` yang menggunakan `window.print()` dengan CSS `@media print` styling, atau menggunakan existing `exportToPDF` utility untuk generate report teks. Screenshot capture (html2canvas) memerlukan dependency baru, jadi kita gunakan pendekatan print-to-PDF yang sudah tersedia.

---

## Arsitektur

```text
[Frontend]
AnalyticsDashboard.tsx  ---->  Supabase client (properties, units, contracts, tenant_risk_scores, disaster_risk_profiles)
OcrResultEditor.tsx     ---->  ml-ocr-correction-suggest edge function ---> Gemini 2.5 Flash

[Existing dependencies used]
- react-leaflet (risk heatmap)
- recharts (charts)
- exportUtils (PDF export)
```

---

## Detail Teknis

### File Baru

| File | Deskripsi |
|------|-----------|
| `supabase/functions/ml-ocr-correction-suggest/index.ts` | AI correction suggestions for OCR results |
| `src/features/dss/services/ocrCorrectionService.ts` | Service invoke edge function |
| `src/features/dss/hooks/useOcrCorrection.ts` | React Query mutation hook |
| `src/features/analytics/services/analyticsDashboardService.ts` | Service fetch data untuk dashboard |
| `src/features/analytics/hooks/useAnalyticsDashboard.ts` | React Query hooks untuk semua dashboard data |
| `src/pages/merchant/AnalyticsDashboard.tsx` | Dashboard page baru |

### File yang Dimodifikasi

| File | Perubahan |
|------|-----------|
| `src/features/dss/components/OcrResultEditor.tsx` | Tambah tombol "Saran AI" + suggestion display |
| `src/shared/components/layouts/navigation-config.ts` | Tambah menu "Dashboard Analitik" |
| `src/App.tsx` | Tambah lazy import + route `analytics-dashboard` |

### Tidak Ada Perubahan Database

Semua data sudah tersedia di tabel existing:
- `properties` (lat, lng, disaster_risk_level, construction_cost, renovation_cost, property_type, city, construction_year)
- `units` (rent_amount, status)
- `contracts` (status, created_at)
- `tenant_risk_scores` (risk_score, risk_level)
- `disaster_risk_profiles` (overall_risk_score, flood_risk, earthquake_risk, dll)
- `ocr_results` (extracted_data, confidence_score, document_type)

### Urutan Implementasi
1. Edge function `ml-ocr-correction-suggest`
2. Service + hook OCR correction
3. Update `OcrResultEditor.tsx` dengan suggestion UI
4. Service + hooks analytics dashboard
5. Halaman `AnalyticsDashboard.tsx` (charts + map + filters)
6. Update navigasi + routes
