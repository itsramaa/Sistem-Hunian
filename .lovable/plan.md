

# Update API Specification untuk DSS Features — File 1 of 8

## Ringkasan

Update `docs/api-specification.md` untuk menambahkan spesifikasi API lengkap untuk fitur DSS baru: OCR (4 use cases), ML Predictive Analytics (4 models), dan AI Decision Support (4 recommendation engines). Ini akan menambahkan **12+ edge functions baru** ke spesifikasi yang sudah ada (31 functions).

---

## Fitur DSS yang Ditambahkan ke API Spec

### Bagian Baru: DSS Edge Functions

#### A. OCR Services (4 New Edge Functions)

**1. `ocr-ktp-extract`**
- Method: POST
- Auth: JWT
- Input: `{ image_url: string }` (dari Supabase Storage)
- Output: `{ nik, full_name, date_of_birth, address, gender, confidence_score }`
- Implementation: Lovable AI (Gemini 2.5 Pro — multimodal vision) untuk extract data dari foto KTP
- Side Effects: Auto-populate tenant form fields, log ke `ocr_results` table
- Confidence threshold: >= 80% untuk auto-fill, < 80% memerlukan manual review

**2. `ocr-payment-proof`**
- Method: POST
- Auth: JWT
- Input: `{ image_url: string, invoice_id?: string }`
- Output: `{ amount, bank_name, date, reference_number, matched_invoice_id, confidence_score }`
- Implementation: Gemini vision extract data dari bukti transfer
- Side Effects: Auto-match dengan invoice pending, create `payment_verifications` record
- Business logic: Fuzzy match amount (tolerance +/- Rp 1000), date within 7 days of due_date

**3. `ocr-business-document`**
- Method: POST
- Auth: JWT
- Input: `{ document_url: string, document_type: 'nib' | 'siup' | 'akta' | 'npwp' }`
- Output: `{ extracted_fields: Record<string, string>, document_number, expiry_date, confidence_score }`
- Implementation: Gemini vision + structured extraction per document type
- Side Effects: Auto-populate merchant verification form, update `merchant_verifications`

**4. `ocr-maintenance-receipt`**
- Method: POST
- Auth: JWT
- Input: `{ image_url: string, maintenance_request_id?: string }`
- Output: `{ vendor_name, items: [{description, quantity, amount}], total, date }`
- Implementation: Gemini vision extract from receipts/invoices
- Side Effects: Create `maintenance_expenses` record, link to maintenance request

#### B. ML Predictive Analytics (4 New Edge Functions)

**5. `ml-revenue-forecast`**
- Method: POST
- Auth: JWT (merchant/admin)
- Input: `{ merchant_id: string, forecast_months: 3|6|12, property_id?: string }`
- Output: `{ forecasts: [{ month, predicted_revenue, confidence_interval, occupancy_rate }], trend, seasonality_factor }`
- Implementation: Gemini 2.5 Pro with historical data context (payments, contracts, occupancy from last 12 months)
- Data Sources: `payments`, `contracts`, `units` tables aggregated per month

**6. `ml-tenant-risk-score`**
- Method: POST
- Auth: JWT (merchant/admin)
- Input: `{ tenant_user_id: string }` or `{ merchant_id: string }` (batch all tenants)
- Output: `{ risk_scores: [{ tenant_id, score: 0-100, risk_level: 'low'|'medium'|'high'|'critical', factors: string[], recommended_actions: string[] }] }`
- Implementation: Gemini analisis berdasarkan payment history, overdue frequency, contract compliance
- Data Sources: `payments` (late ratio), `invoices` (overdue count), `contracts` (churn history), `collections_cases`
- Side Effects: Store ke `tenant_risk_scores` table, trigger notifications untuk high/critical

**7. `ml-churn-prediction`**
- Method: POST
- Auth: JWT (merchant/admin)
- Input: `{ merchant_id: string, prediction_window_months: 1|3|6 }`
- Output: `{ predictions: [{ tenant_id, churn_probability: 0-1, risk_factors: string[], retention_suggestions: string[] }] }`
- Implementation: Gemini analisis pattern: payment delays increasing, maintenance complaints, contract nearing end
- Data Sources: `contracts`, `payments`, `maintenance_requests`, `move_out_notices`

**8. `ml-optimal-pricing`**
- Method: POST
- Auth: JWT (merchant)
- Input: `{ unit_id: string }` or `{ property_id: string }` (all units)
- Output: `{ recommendations: [{ unit_id, current_price, suggested_price, price_range: {min, max}, justification, market_comparison }] }`
- Implementation: Gemini analisis berdasarkan unit amenities, lokasi, occupancy history, comparable units
- Data Sources: `units`, `properties`, `contracts` (historical rent amounts), `cities`

#### C. AI Decision Support (4 New Edge Functions)

**9. `dss-pricing-advisor`**
- Method: POST
- Auth: JWT (merchant)
- Input: `{ property_id: string, context?: string }`
- Output: `{ advice: string, recommendations: [{ unit_id, action, expected_impact, priority }], market_insights: string }`
- Implementation: Gemini 2.5 Pro sebagai pricing consultant
- Combines: `ml-optimal-pricing` output + market context + merchant goals

**10. `dss-collection-strategy`**
- Method: POST
- Auth: JWT (merchant)
- Input: `{ tenant_user_id: string }` or `{ invoice_id: string }`
- Output: `{ strategy: string, recommended_actions: [{action, timing, channel, message_template}], success_probability, alternative_approaches: string[] }`
- Implementation: Gemini analisis tenant risk score + payment pattern + optimal collection approach
- Combines: `ml-tenant-risk-score` + payment history + overdue escalation data

**11. `dss-maintenance-priority`**
- Method: POST
- Auth: JWT (merchant)
- Input: `{ merchant_id: string }`
- Output: `{ prioritized_requests: [{ request_id, priority_score, impact_analysis, recommended_vendor, estimated_cost, urgency_reason }] }`
- Implementation: Gemini prioritas berdasarkan tenant satisfaction impact, unit revenue impact, safety concerns
- Data Sources: `maintenance_requests`, `units`, `contracts`, `tenants`

**12. `dss-investment-insight`**
- Method: POST
- Auth: JWT (merchant)
- Input: `{ property_id: string }`
- Output: `{ roi_analysis: { current_roi, projected_roi_6m, projected_roi_12m }, improvement_suggestions: [{ suggestion, estimated_cost, expected_revenue_increase, payback_months }], risk_assessment: string }`
- Implementation: Gemini analisis P&L per property, occupancy trends, maintenance costs, market context
- Data Sources: `escrow_transactions`, `disbursements`, `maintenance_requests`, `units`, `contracts`

### Bagian Baru: DSS Database Tables

Spesifikasi untuk tabel baru yang dibutuhkan:

| Table | Purpose |
|-------|---------|
| `ocr_results` | Store OCR extraction results with confidence scores |
| `payment_verifications` | OCR-matched payment proofs linked to invoices |
| `maintenance_expenses` | Cost tracking dari receipt OCR |
| `tenant_risk_scores` | Cached risk scores per tenant (updated daily/on-demand) |
| `dss_recommendations` | Stored AI recommendations dengan status tracking |
| `ml_model_runs` | Audit log untuk ML predictions (input hash, output, model version) |

### Bagian Baru: DSS Data Models

TypeScript interfaces untuk semua request/response DTOs dari 12 edge functions di atas.

### Bagian Update: Cron Jobs

2 cron jobs baru:
- `ml-daily-risk-scoring` — Daily batch tenant risk scoring untuk semua active tenants
- `ml-weekly-forecast` — Weekly revenue forecast update per merchant

### Bagian Update: Overview Architecture Diagram

Update diagram arsitektur untuk menambahkan DSS Layer:

```text
Client (React PWA)
  |
  +-- Direct CRUD (RLS) --> PostgreSQL DB
  |
  +-- invoke() --> 31 Existing Edge Functions
  |                    |
  |                    +-- Xendit / Resend / Lovable AI
  |
  +-- invoke() --> 12 NEW DSS Edge Functions
                       |
                       +-- Lovable AI (Gemini 2.5 Pro — Vision + Reasoning)
                       +-- PostgreSQL (Historical Data Aggregation)
```

### Bagian Update: Fee Structure

Tidak ada fee tambahan untuk DSS — fitur DSS di-gate per subscription tier:

| Feature | Free | Basic | Professional | Enterprise |
|---------|------|-------|-------------|-----------|
| OCR KTP | -- | -- | 10/bulan | Unlimited |
| OCR Payment Proof | -- | 5/bulan | 50/bulan | Unlimited |
| Revenue Forecast | -- | -- | Yes | Yes |
| Tenant Risk Score | -- | -- | Yes | Yes |
| Churn Prediction | -- | -- | -- | Yes |
| Optimal Pricing | -- | -- | -- | Yes |
| All DSS Advisors | -- | -- | -- | Yes |

### Bagian Update: Security

- OCR images harus di private storage bucket (`verification-documents`, `contract-documents`)
- ML/DSS results disimpan dengan RLS (merchant hanya lihat data sendiri)
- Audit semua DSS predictions di `ml_model_runs` untuk compliance

---

## Detail Teknis Implementasi

### OCR Implementation Pattern

Semua OCR functions menggunakan Lovable AI (Gemini 2.5 Pro) dengan multimodal vision capability:

```typescript
// Pattern: Fetch image from Supabase Storage, send to Gemini via base64
const { data: imageData } = await supabase.storage
  .from('verification-documents')
  .download(imagePath);

const base64Image = btoa(String.fromCharCode(...new Uint8Array(await imageData.arrayBuffer())));

const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${LOVABLE_API_KEY}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    model: "google/gemini-2.5-pro",
    messages: [{
      role: "user",
      content: [
        { type: "text", text: "Extract the following fields from this KTP..." },
        { type: "image_url", image_url: { url: `data:image/jpeg;base64,${base64Image}` } }
      ]
    }],
    tools: [{ type: "function", function: { name: "extract_ktp", parameters: ktpSchema } }],
    tool_choice: { type: "function", function: { name: "extract_ktp" } }
  })
});
```

### ML Implementation Pattern

ML predictions menggunakan Gemini sebagai reasoning engine dengan historical data context:

```typescript
// Pattern: Aggregate data, send as context to Gemini for analysis
const paymentHistory = await supabase.from('payments')
  .select('amount, status, due_date, paid_at')
  .eq('tenant_user_id', tenantId)
  .order('created_at', { ascending: false })
  .limit(100);

const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
  body: JSON.stringify({
    model: "google/gemini-2.5-pro",
    messages: [{
      role: "system",
      content: "You are a property management risk analyst..."
    }, {
      role: "user",
      content: `Analyze tenant risk based on: ${JSON.stringify(paymentHistory.data)}`
    }],
    tools: [{ type: "function", function: { name: "score_tenant_risk", parameters: riskSchema } }],
    tool_choice: { type: "function", function: { name: "score_tenant_risk" } }
  })
});
```

---

## Perubahan pada File

### `docs/api-specification.md`

1. **Section 1.1 General Info** — Update AI Provider dari "Lovable AI (Gemini models)" menjadi "Lovable AI (Gemini 2.5 Pro — Vision + Reasoning for OCR/ML/DSS)"
2. **Section 1.2 Architecture** — Tambahkan DSS Layer ke diagram
3. **Section 4** — Tambahkan section 4.10 (OCR Services), 4.11 (ML Analytics), 4.12 (DSS Advisors) dengan full endpoint specs
4. **Section 6** — Tambahkan Data Models untuk semua DSS request/response DTOs
5. **Section 8** — Tambahkan 2 cron jobs baru (risk scoring, forecast)
6. **Section 11** — Update fee structure untuk DSS feature gating per tier

Total perkiraan: ~400 baris baru ditambahkan ke dokumen yang sudah ada (1731 baris).

