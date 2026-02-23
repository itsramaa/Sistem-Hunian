

# 3.5 Machine Learning Models -- Price Prediction & Occupancy Forecasting

## Gap Analysis

| FR | Deskripsi | Status |
|----|-----------|--------|
| FR-1301 | ML model untuk predict optimal rental price | Sudah ada (`ml-optimal-pricing` + `ml-price-intelligence`) |
| FR-1302 | Input: lokasi, fasilitas, luas, kondisi bangunan, kompetitor | Sebagian -- lokasi, fasilitas, unit_type sudah dikirim. **`building_condition` belum** dimasukkan ke context. Kolom `luas` (floor area) tidak ada di database. |
| FR-1303 | Output: recommended price range + confidence | Sudah ada (kedua function return `price_range` + `confidence`) |
| FR-1304 | Model retrain berkala dengan data baru | **Belum ada** -- perlu UI "Refresh Model" dengan tracking kapan terakhir dijalankan |
| FR-1401 | ML model untuk forecast occupancy | Sudah ada (`ml-occupancy-forecast`) |
| FR-1402 | Input: historical, seasonal, location, segment | Sudah ada (snapshots, contracts, units, properties) |
| FR-1403 | Output: forecast per bulan + confidence interval | Sudah ada (monthly_predictions dengan confidence per bulan) |
| FR-1404 | Detect anomali (unusual pattern) | Sebagian -- price outlier sudah ada di `ml-price-intelligence`. **Occupancy anomaly detection belum ada** di output `ml-occupancy-forecast` |

## Yang Perlu Diimplementasi

Karena sebagian besar sudah ada, hanya perlu 3 enhancement minor:

### 1. FR-1302: Tambah `building_condition` ke Input Pricing Models

Update `ml-optimal-pricing/index.ts` -- tambah `building_condition` dari tabel `properties` ke context yang dikirim ke AI. Kolom ini sudah ada di database tapi belum di-select.

Update `ml-price-intelligence/index.ts` -- tambah `building_condition` ke property select query.

Catatan: Kolom `luas` (floor area) tidak ada di database schema saat ini. Sebagai pengganti, `unit_type` dan `amenities` sudah mencakup informasi serupa. Tidak perlu database migration.

### 2. FR-1304: Model Refresh Tracking UI

Tambahkan section "Model Status" di halaman `MlAnalytics.tsx` yang menampilkan:
- Kapan terakhir setiap model dijalankan (dari `ml_model_runs` table)
- Tombol "Refresh" per model
- Badge status: "Terkini" (< 24 jam), "Perlu Update" (> 7 hari), "Kadaluarsa" (> 30 hari)

Tambah hook `useModelRunHistory` yang query `ml_model_runs` grouped by `function_name` untuk mendapatkan latest run per model.

### 3. FR-1404: Occupancy Anomaly Detection

Update `ml-occupancy-forecast/index.ts` -- tambahkan field `anomalies` ke AI tool schema agar model juga mendeteksi pola anomali (lonjakan/penurunan drastis, occupancy tidak sesuai musim). Ini hanya perubahan pada tool definition dan system prompt.

Update `MarketIntelligence.tsx` -- tampilkan anomali yang terdeteksi di Tab Forecast Okupansi sebagai alert cards.

Update `marketIntelligenceService.ts` -- tambah type `OccupancyAnomaly` dan update `OccupancyForecastResult`.

---

## Detail Teknis

### File yang Dimodifikasi

| File | Perubahan |
|------|-----------|
| `supabase/functions/ml-optimal-pricing/index.ts` | Tambah `building_condition` ke property select |
| `supabase/functions/ml-price-intelligence/index.ts` | Tambah `building_condition` ke property select |
| `supabase/functions/ml-occupancy-forecast/index.ts` | Tambah `anomalies` field ke tool schema + system prompt |
| `src/features/dss/services/marketIntelligenceService.ts` | Tambah `OccupancyAnomaly` type + update `OccupancyForecastResult` |
| `src/pages/merchant/MarketIntelligence.tsx` | Tampilkan anomali di Tab Forecast Okupansi |
| `src/pages/merchant/MlAnalytics.tsx` | Tambah section "Status Model" dengan last run + refresh |
| `src/features/dss/hooks/useMlAnalytics.ts` | Tambah `useModelRunHistory` hook |

### File Baru

Tidak ada file baru. Semua perubahan adalah enhancement pada file existing.

### Tidak Ada Database Migration

Semua kolom yang dibutuhkan (`building_condition`, `ml_model_runs`) sudah ada.

### Urutan Implementasi

1. Update `ml-optimal-pricing` dan `ml-price-intelligence` (tambah `building_condition`)
2. Update `ml-occupancy-forecast` (tambah anomaly detection ke schema)
3. Update `marketIntelligenceService.ts` (tambah types)
4. Update `MarketIntelligence.tsx` (tampilkan anomali)
5. Tambah `useModelRunHistory` hook di `useMlAnalytics.ts`
6. Update `MlAnalytics.tsx` (section status model + refresh tracking)

