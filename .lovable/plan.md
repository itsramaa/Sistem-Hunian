

# 3.4 Comparative Analysis -- Benchmarking & Portfolio Analysis

## Gap Analysis

| FR | Deskripsi | Status |
|----|-----------|--------|
| FR-1101 | Bandingkan kosan dengan competitor | Sebagian ada (Benchmark tab di FinancialRiskAnalytics -- tapi hanya peer internal, bukan competitor eksternal) |
| FR-1102 | Generate competitor analysis report | **Belum ada** |
| FR-1103 | Price positioning (above/at/below market) | **Belum ada** |
| FR-1104 | Occupancy positioning | **Belum ada** |
| FR-1201 | Analyze portfolio multi-kosan | **Belum ada** |
| FR-1202 | Portfolio-level ROI dan cash flow | **Belum ada** |
| FR-1203 | Identify top/underperformer | **Belum ada** |
| FR-1204 | Recommend portfolio optimization | **Belum ada** |

## Yang Perlu Diimplementasi

### 1. Halaman: Comparative & Portfolio Analysis

Satu halaman baru `ComparativePortfolio.tsx` dengan 2 tab utama:

**Tab 1: Benchmarking & Positioning (FR-1101 s/d FR-1104)**

Menggunakan data internal merchant (properties + units) untuk:
- **Price Positioning**: Setiap properti dibandingkan terhadap rata-rata harga seluruh properti merchant. Tampilkan badge: "Di Atas Pasar" / "Sesuai Pasar" / "Di Bawah Pasar" (threshold +/- 10%)
- **Occupancy Positioning**: Sama -- bandingkan occupancy rate per properti vs rata-rata keseluruhan
- **Competitor Analysis Table**: Tabel semua properti dengan kolom: Nama, Avg Rent, Occupancy, Price Position, Occupancy Position, Overall Rating
- **Export**: Tombol "Export Laporan Kompetitor" yang generate PDF via existing `exportToPDF`

Catatan: Karena tidak ada database kompetitor eksternal, "competitor" didefinisikan sebagai properti lain di kota/segmen yang sama milik merchant (peer group internal). Ini konsisten dengan Benchmark tab yang sudah ada.

**Tab 2: Portfolio Analysis (FR-1201 s/d FR-1204)**

Analisis seluruh portofolio properti merchant:
- **Portfolio Summary Cards**: Total properti, total unit, total revenue bulanan, rata-rata occupancy, portfolio ROI
- **Portfolio Cash Flow Chart**: BarChart stacked -- revenue vs expenses per properti
- **Performance Ranking Table**: Tabel semua properti diurutkan berdasarkan skor komposit (occupancy * 0.4 + ROI * 0.3 + avg_rent_percentile * 0.3). Badge: "Top Performer" (hijau), "Average" (kuning), "Underperformer" (merah)
- **Optimization Recommendations**: Card list rekomendasi otomatis berdasarkan data:
  - Properti dengan occupancy < 50%: "Pertimbangkan penurunan harga atau renovasi"
  - Properti dengan rent di bawah 20% rata-rata: "Potensi kenaikan harga"
  - Properti dengan occupancy > 90% dan rent di bawah rata-rata: "Naikkan harga -- demand tinggi"
  - ROI negatif atau sangat rendah: "Evaluasi kelayakan investasi"

### 2. Service & Hooks

**Service**: `src/features/analytics/services/comparativePortfolioService.ts`
- `fetchPortfolioData(merchantId)` -- query properties, units, payments, maintenance_expenses
- Mengembalikan data terstruktur untuk kedua tab

**Hook**: `src/features/analytics/hooks/useComparativePortfolio.ts`
- `usePortfolioData(merchantId)` -- React Query wrapper

### 3. Navigasi

Tambah menu "Komparatif & Portfolio" di grup "Analitik" di `navigation-config.ts` dengan icon `Briefcase`.

---

## Arsitektur

```text
[Frontend]
ComparativePortfolio.tsx  ---->  Supabase client (properties, units, payments, maintenance_expenses)
  |-- Tab Benchmarking (price/occupancy positioning + competitor table)
  |-- Tab Portfolio (summary, cash flow chart, ranking, recommendations)
```

Tidak ada edge function baru. Tidak ada database migration. Semua data sudah tersedia di tabel existing.

---

## Detail Teknis

### File Baru

| File | Deskripsi |
|------|-----------|
| `src/pages/merchant/ComparativePortfolio.tsx` | Halaman utama dengan 2 tab |
| `src/features/analytics/services/comparativePortfolioService.ts` | Service fetch data portfolio |
| `src/features/analytics/hooks/useComparativePortfolio.ts` | React Query hook |

### File yang Dimodifikasi

| File | Perubahan |
|------|-----------|
| `src/shared/components/layouts/navigation-config.ts` | Tambah menu "Komparatif & Portfolio" |
| `src/App.tsx` | Tambah lazy import + route `comparative-portfolio` |

### Komponen yang Digunakan

- recharts: `BarChart` (stacked cash flow), `RadarChart` (positioning visual)
- Existing UI: `Card`, `Tabs`, `Badge`, `Table`, `PageHeader`, `Button`
- Existing utils: `formatRupiah`, `exportToPDF`

### Urutan Implementasi

1. Service `comparativePortfolioService.ts`
2. Hook `useComparativePortfolio.ts`
3. Halaman `ComparativePortfolio.tsx` (kedua tab)
4. Update navigasi + routes

