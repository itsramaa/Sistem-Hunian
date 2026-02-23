

# 2.1.3 Financial Analytics + 2.1.4 Risk Assessment

## Ringkasan

Membuat 2 edge function AI baru dan 1 halaman dashboard baru **"Financial & Risk Analytics"** yang menggabungkan Financial Analytics (BR-301 s/d BR-304) dan Risk Assessment (BR-401 s/d BR-404).

---

## Arsitektur

```text
[Frontend]                          [Edge Functions]               [AI Gateway]
FinancialRiskAnalytics.tsx  --->  ml-financial-analytics  --->  Gemini 2.5 Pro
                            --->  ml-risk-assessment      --->  Gemini 2.5 Pro
```

Tidak ada perubahan database. Semua data diambil dari tabel existing (`properties`, `units`, `contracts`, `invoices`, `maintenance_expenses`, `occupancy_snapshots`, `disaster_risk_profiles`, `insurance_policies`, `compliance_documents`, `security_incidents`). Hasil AI di-log ke `ml_model_runs` dan `dss_recommendations`.

---

## 1. Edge Function: `ml-financial-analytics`

**File baru**: `supabase/functions/ml-financial-analytics/index.ts`

Mengcover BR-301 s/d BR-304:
- Input: `property_id` (wajib), optional `discount_rate` (default 12%)
- Pattern: sama persis dengan `ml-price-intelligence` dan `dss-investment-insight`
- Tier limits: `{ free: 0, starter: 0, professional: 3, enterprise: -1 }`

### Data yang Di-fetch:
1. `properties` -- detail properti termasuk construction_cost, renovation_cost, monthly_amortization, monthly_maintenance_cost, avg_annual_unexpected_cost
2. `units` -- semua unit properti (rent_amount, status)
3. `contracts` -- historis 24 bulan (rent_amount, start_date, end_date)
4. `invoices` -- 24 bulan (amount, status, paid_at, due_date, late_fee)
5. `maintenance_expenses` -- 24 bulan (total_amount)
6. `occupancy_snapshots` -- historis (occupancy_rate)

### AI Tool Output:
```text
Tool: financial_analysis
Output:
{
  roi_analysis: {
    total_investment, annual_revenue, annual_expenses,
    net_annual_income, roi_percentage, payback_period_years
  },
  npv_irr: {
    npv, irr, discount_rate_used, cash_flows: [{ year, revenue, expenses, net }],
    recommendation  // "invest" | "hold" | "divest"
  },
  sensitivity: [
    { scenario_name, variable_changed, change_percentage,
      resulting_roi, resulting_npv, impact_level }
  ],
  break_even: {
    monthly_fixed_costs, variable_cost_per_unit,
    avg_revenue_per_unit, break_even_units,
    break_even_occupancy_rate, months_to_break_even
  },
  summary, confidence
}
```

---

## 2. Edge Function: `ml-risk-assessment`

**File baru**: `supabase/functions/ml-risk-assessment/index.ts`

Mengcover BR-401 s/d BR-404:
- Input: `property_id` (wajib)
- Tier limits: `{ free: 0, starter: 0, professional: 3, enterprise: -1 }`

### Data yang Di-fetch:
1. `properties` -- detail properti (lokasi, tipe, construction_year, building_condition)
2. `disaster_risk_profiles` -- profil risiko existing
3. `insurance_policies` -- polis aktif
4. `compliance_documents` -- status dokumen
5. `security_incidents` -- riwayat insiden
6. `maintenance_requests` -- riwayat maintenance (untuk preventive patterns)
7. `maintenance_expenses` -- biaya historis
8. `units` -- jumlah unit, status, rent_amount (untuk loss estimation)

### AI Tool Output:
```text
Tool: risk_assessment
Output:
{
  disaster_risk_score: {
    overall_score, risk_level,  // "low" | "medium" | "high" | "critical"
    factors: [{ factor, score, description, weight }]
  },
  preventive_maintenance: [
    { strategy, priority, estimated_cost, frequency,
      risk_reduction_percentage, description }
  ],
  potential_loss_estimate: {
    scenarios: [{ disaster_type, probability, estimated_damage_cost,
      estimated_revenue_loss_months, total_potential_loss }],
    annual_expected_loss, worst_case_loss
  },
  insurance_recommendations: [
    { coverage_type, recommended_coverage_amount,
      estimated_premium, reason, priority, gap_identified }
  ],
  summary, confidence
}
```

---

## 3. Frontend Service & Hooks

### `src/features/dss/services/financialRiskService.ts`
- `invokeFinancialAnalytics(propertyId, discountRate?)` -- invoke `ml-financial-analytics`
- `invokeRiskAssessment(propertyId)` -- invoke `ml-risk-assessment`
- Type interfaces untuk kedua result

### `src/features/dss/hooks/useFinancialRisk.ts`
- `useFinancialAnalytics()` -- mutation hook
- `useRiskAssessment()` -- mutation hook

---

## 4. Halaman: Financial & Risk Analytics Dashboard

**File baru**: `src/pages/merchant/FinancialRiskAnalytics.tsx`

### Layout:
- PageHeader dengan icon Calculator dan badge "AI-Powered"
- Property selector (wajib pilih 1 properti, bukan "Semua")
- TierGate wrapper

### 4 Tab:

**Tab 1: ROI & Payback (BR-301)**
- Generate button -> memanggil `ml-financial-analytics`
- KPI cards: Total Investment, Annual Revenue, Annual Expenses, Net Income, ROI %, Payback Period
- Summary card

**Tab 2: NPV & IRR (BR-302)**
- Cash flow table per tahun (revenue, expenses, net)
- KPI strip: NPV, IRR, Discount Rate, Recommendation badge
- Area chart cash flow projection

**Tab 3: Sensitivity Analysis (BR-303)**
- Tabel skenario: nama, variabel, % perubahan, resulting ROI, resulting NPV, impact level
- Color-coded impact badges (low/medium/high)

**Tab 4: Risk Assessment (BR-401 s/d BR-404)**
- Generate button -> memanggil `ml-risk-assessment`
- **Risk Score Card**: overall score gauge, risk level badge, factor breakdown
- **Preventive Maintenance**: cards per strategi dengan priority, cost, frequency
- **Potential Loss**: tabel skenario bencana (tipe, probability, estimated damage, revenue loss)
- **Insurance Recommendations**: cards per coverage type dengan gap identified badge
- Break-even info card (BR-304) ditampilkan di bawah tab ROI atau sebagai section terpisah

---

## 5. Navigasi

Update `navigation-config.ts`:
- Tambah item di grup "Analitik": `{ path: "/merchant/financial-risk", icon: Calculator, label: "Financial & Risk" }`

Update `App.tsx`:
- Import lazy: `const MerchantFinancialRisk = lazy(() => import("@/pages/merchant/FinancialRiskAnalytics"))`
- Tambah route: `<Route path="financial-risk" element={<MerchantFinancialRisk />} />`

---

## Detail Teknis

### File Baru

| File | Deskripsi |
|------|-----------|
| `supabase/functions/ml-financial-analytics/index.ts` | AI financial analysis edge function |
| `supabase/functions/ml-risk-assessment/index.ts` | AI risk assessment edge function |
| `src/features/dss/services/financialRiskService.ts` | Service invoke functions + types |
| `src/features/dss/hooks/useFinancialRisk.ts` | React Query mutation hooks |
| `src/pages/merchant/FinancialRiskAnalytics.tsx` | Dashboard page |

### File yang Dimodifikasi

| File | Perubahan |
|------|-----------|
| `src/shared/components/layouts/navigation-config.ts` | Tambah menu + import Calculator icon |
| `src/App.tsx` | Tambah lazy import + route |

### Tidak Ada Perubahan Database

Semua data sudah tersedia di tabel existing.

### Urutan Implementasi
1. Edge function `ml-financial-analytics`
2. Edge function `ml-risk-assessment`
3. Service + hooks frontend
4. Halaman `FinancialRiskAnalytics.tsx`
5. Update navigasi + routes

