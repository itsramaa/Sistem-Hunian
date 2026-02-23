

# 2.1.1 Price Intelligence + 2.1.2 Occupancy & Demand Forecasting

## Ringkasan

Membuat halaman dashboard baru **"Market Intelligence"** yang menggabungkan Price Intelligence dan Occupancy Forecasting menjadi satu halaman analitik terintegrasi, plus 2 edge function AI baru untuk generate insight.

---

## Arsitektur

```text
[Frontend]                     [Edge Functions]              [AI Gateway]
MarketIntelligence.tsx  --->  ml-price-intelligence  --->  Gemini 2.5 Pro
                        --->  ml-occupancy-forecast  --->  Gemini 2.5 Pro
```

Tidak ada perubahan database -- semua data diambil dari tabel yang sudah ada (`units`, `contracts`, `invoices`, `occupancy_snapshots`, `properties`, `tenant_payment_metrics`). Hasil AI di-log ke `ml_model_runs`.

---

## 1. Edge Function: `ml-price-intelligence`

**File baru**: `supabase/functions/ml-price-intelligence/index.ts`

Mengcover BR-101 s/d BR-104:
- Input: `merchant_id` (dari auth), optional `property_id`
- Mengumpulkan data: semua unit merchant + unit di kota yang sama (via properties), contracts historis (harga sewa 12 bulan), occupancy rates
- AI menganalisis lalu return structured output via tool calling:

```text
Tool: analyze_pricing
Output:
{
  segments: [{ segment_name, avg_price, unit_count, occupancy_rate, price_range }],
  recommendations: [{ unit_id, current_price, optimal_price, reason, confidence }],
  price_trends: [{ month, avg_price, median_price, sample_count }],
  outliers: [{ unit_id, current_price, expected_range, anomaly_type, severity }],
  summary, market_context
}
```

- Tier limits: `{ free: 0, starter: 0, professional: 3, enterprise: -1 }`

### Data yang Di-fetch:
1. Semua `units` milik merchant (harga, tipe, amenities, status)
2. Semua `contracts` merchant 12 bulan terakhir (rent_amount historis)
3. `properties` merchant (lokasi, tipe, jumlah unit)
4. `occupancy_snapshots` untuk tren seasonal

---

## 2. Edge Function: `ml-occupancy-forecast`

**File baru**: `supabase/functions/ml-occupancy-forecast/index.ts`

Mengcover BR-201 s/d BR-204:
- Input: `merchant_id`, optional `property_id`, `forecast_months` (default 6)
- Mengumpulkan: occupancy_snapshots historis, contracts aktif/expired, move-in/move-out patterns, tenant_payment_metrics
- AI return:

```text
Tool: forecast_occupancy
Output:
{
  monthly_predictions: [{ month, predicted_occupancy_rate, confidence, move_ins, move_outs }],
  seasonal_patterns: [{ period, pattern_type, description, months_affected }],
  turnover_metrics: { current_rate, predicted_rate, avg_vacancy_days, trend },
  warnings: [{ type, severity, message, recommended_action }],
  summary
}
```

- Tier limits: `{ free: 0, starter: 0, professional: 5, enterprise: -1 }`

### Data yang Di-fetch:
1. `occupancy_snapshots` 12-24 bulan terakhir
2. `contracts` historis (start_date, end_date, actual_end_date)
3. `units` (status, tipe)
4. `tenant_payment_metrics` (untuk korelasi churn risk)

---

## 3. Frontend Service & Hooks

### `src/features/dss/services/marketIntelligenceService.ts`
```text
invokePriceIntelligence(propertyId?: string) -> supabase.functions.invoke("ml-price-intelligence")
invokeOccupancyForecast(forecastMonths?, propertyId?) -> supabase.functions.invoke("ml-occupancy-forecast")
```

### `src/features/dss/hooks/useMarketIntelligence.ts`
- `usePriceIntelligence()` -- mutation hook
- `useOccupancyForecast()` -- mutation hook

---

## 4. Halaman: Market Intelligence Dashboard

**File baru**: `src/pages/merchant/MarketIntelligence.tsx`

### Layout:
- PageHeader dengan icon TrendingUp dan badge "AI-Powered"
- Property selector (pilih properti atau "Semua")
- DSS Readiness Card (readiness check)
- TierGate wrapper

### 4 Tab:

**Tab 1: Price Comparison (BR-101)**
- Tabel segmen harga: nama segmen, avg harga, range, occupancy rate, jumlah unit
- Bar chart perbandingan harga per segmen

**Tab 2: Optimal Pricing (BR-102)**
- Generate button -> memanggil `ml-price-intelligence`
- Kartu per unit: harga saat ini vs harga optimal, alasan, confidence
- Summary + market context strip

**Tab 3: Price Trends (BR-103)**
- Line chart tren harga 6-12 bulan (avg + median)
- Data dari hasil AI atau langsung dari contracts historis

**Tab 4: Occupancy Forecast (BR-201 s/d BR-204)**
- Generate button -> memanggil `ml-occupancy-forecast`
- Line chart prediksi occupancy 3-6 bulan ke depan dengan confidence band
- Seasonal pattern cards (peak/low season identification - BR-202)
- Turnover metrics KPI strip (BR-203)
- Warning alerts jika occupancy trend menurun (BR-204), ditampilkan sebagai alert card dengan severity color

---

## 5. Navigasi

Update `navigation-config.ts`:
- Tambah item di grup "Analitik": `{ path: "/merchant/market-intelligence", icon: TrendingUp, label: "Market Intelligence" }`

Update `App.tsx`:
- Tambah route `/merchant/market-intelligence` -> lazy load `MarketIntelligence.tsx`

---

## Detail Teknis

### File Baru

| File | Deskripsi |
|------|-----------|
| `supabase/functions/ml-price-intelligence/index.ts` | AI price analysis edge function |
| `supabase/functions/ml-occupancy-forecast/index.ts` | AI occupancy forecasting edge function |
| `src/features/dss/services/marketIntelligenceService.ts` | Service invoke functions |
| `src/features/dss/hooks/useMarketIntelligence.ts` | React Query mutation hooks |
| `src/pages/merchant/MarketIntelligence.tsx` | Dashboard page |

### File yang Dimodifikasi

| File | Perubahan |
|------|-----------|
| `src/shared/components/layouts/navigation-config.ts` | Tambah menu Market Intelligence |
| `src/App.tsx` | Tambah route |

### Tidak Ada Perubahan Database

Semua data sudah tersedia di tabel existing. Edge functions hanya read data dan AI generates insight.

### Urutan Implementasi
1. Edge function `ml-price-intelligence`
2. Edge function `ml-occupancy-forecast`
3. Service + hooks frontend
4. Halaman `MarketIntelligence.tsx`
5. Update navigasi + routes

