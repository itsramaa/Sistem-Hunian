# Product Requirements Document (PRD)
## Sistem Pendukung Keputusan (DSS) Manajemen Kosan Terintegrasi OCR dan Machine Learning

**Versi:** 3.1 | **Status:** Aligned with Implementation | **Tanggal:** 22 Februari 2026  
**Platform:** SiHuni (Sistem Hunian) on Lovable Cloud  
**Scope Pilot:** 20 Kosan | **Timeline:** 6 Bulan | **Target Users:** 5-10 Active Users  
**Architecture:** Serverless Modular Monolith + AI-Powered DSS Layer  
**Edge Functions:** 31 Deployed + 12 DSS (Planned) = 43 Total

---

### Dokumen Referensi Teknis v3.0

| # | Dokumen | Versi | Deskripsi |
|---|---------|-------|-----------|
| 1 | `docs/api-specification.md` | 3.0 | 43 Edge Functions, endpoints, payloads, webhooks |
| 2 | `docs/backend-architecture.md` | 3.0 | Arsitektur serverless, 28 feature modules, DSS layer |
| 3 | `docs/business-process.md` | 3.0 | 25+ business workflows end-to-end |
| 4 | `docs/database-schema.md` | 3.0 | 72 tables, 215+ RLS policies, ER diagrams |
| 5 | `docs/deployment-infrastructure.md` | 3.0 | Lovable Cloud deployment, 2-environment model |
| 6 | `docs/development-standards.md` | 3.0 | Coding standards, patterns, testing |
| 7 | `docs/domain-state-machines.md` | 3.0 | 18 state machines, 16 cron jobs, cross-domain flows |
| 8 | `docs/marketing.md` | 3.0 | GTM strategy, pricing tiers, DSS positioning |
| 9 | `docs/project-roadmap.md` | 3.0 | Milestone timeline, sprint planning |
| 10 | `docs/security-architecture.md` | 3.0 | 7 RBAC roles, RLS-first security, audit trails |
| 11 | `docs/seo.md` | 3.0 | SEO strategy, meta tags, schema markup, programmatic SEO |
| 12 | `docs/system-architecture.md` | 3.0 | C4 diagrams, system context, container views |
| 13 | `docs/testing-strategy.md` | 3.0 | Test pyramid, DSS/AI testing, CUJs, security testing |
| 14 | `docs/UIUX_Design_Documentation_SiHuni.md` | 3.0 | Design system, component library, responsive patterns |
| 15 | `docs/PRD_DSS_Manajemen_Kosan_v2_Professional.md` | 3.1 | Dokumen ini (PRD) |

---

## EXECUTIVE SUMMARY

Sistem DSS Manajemen Kosan adalah platform B2B berbasis cloud yang mengotomatisasi dan mengoptimalkan operasional properti kosan melalui digitalisasi dokumen (OCR), analitik prediktif (ML), dan decision support berbasis AI. Sistem ini dirancang untuk meningkatkan revenue per-unit sebesar **8-15%** dan mengurangi risiko tunggakan pembayaran sebesar **20-30%** melalui data-driven insights.

### Target Business Outcomes

| Metrik | Target | Timeline |
|--------|--------|----------|
| Revenue Optimization | +8-15% per unit | Month 6 |
| Payment Default Risk Reduction | -20-30% | Month 4 |
| OCR Processing Time | <3 detik/dokumen (Gemini Vision) | Month 3 |
| ML Prediction Accuracy | MAPE <10% | Month 4 |
| User Adoption Rate | >80% | Month 5 |
| Admin Time Saved | ~75% reduction | Month 4 |

### Platform Overview

```
┌─────────────────────────────────────────────────────────────┐
│     SiHuni — Sistem DSS Manajemen Kosan (Web Platform)      │
│     Lovable Cloud · Serverless · AI-Powered                 │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐             │
│  │   OCR    │    │    ML    │    │ Decision │             │
│  │ Module   │───→│ Analytics│───→│ Support  │             │
│  │ (Layer 1)│    │(Layer 2) │    │(Layer 3) │             │
│  └──────────┘    └──────────┘    └──────────┘             │
│       ↓                ↓                ↓                   │
│  4 OCR Edge       5 ML Edge        4 DSS Advisor           │
│  Functions        Functions         Edge Functions          │
│  (Planned)        (Planned)         (Planned)               │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐ │
│  │    Data Layer (PostgreSQL 16 on Lovable Cloud)       │ │
│  │    72 Tables · 215+ RLS Policies · 7 RBAC Roles     │ │
│  │    UUID PKs · timestamptz · numeric for money        │ │
│  └──────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

---

## 1. PRODUCT VISION & CONTEXT

### 1.1 Problem Statement

**Masalah Operasional yang Dihadapi:**

1. **Dokumentasi Manual & Data Fragmentation**
   - **Current State:** Data penyewa tersimpan dalam dokumen kertas (KTP, kontrak, kuitansi)
   - **Impact:** Waktu pencarian dokumen rata-rata 15-30 menit per transaksi; hilang/rusak ~5% dokumen per tahun
   - **Cost:** Estimasi Rp 2-5 juta/tahun per kosan untuk administrative overhead

2. **Pricing Strategy Tidak Optimal**
   - **Current State:** Harga sewa ditetapkan intuitif berdasarkan harga kompetitor lokal
   - **Gap:** 40% pengelola tidak mempertimbangkan biaya operasional aktual dalam penetapan harga
   - **Opportunity:** Revenue gap 8-15% jika pricing berbasis data

3. **Prediksi Hunian Lemah**
   - **Current State:** Manajemen kapasitas bergantung pada pengalaman subjektif
   - **Pain Point:** Kosong bertubi-tubi (seasonal low) tidak terduga; overpricing di low-demand period
   - **Data Gap:** Tidak ada historical data hunian untuk trend analysis

4. **Risk Assessment Informal**
   - **Current State:** Seleksi penyewa hanya berdasarkan wawancara dan referral
   - **Risk:** Tunggakan pembayaran 15-25% per bulan; damage claim tidak terdokumentasi
   - **Need:** Scoring system berbasis data untuk meminimalkan default risk

### 1.2 Proposed Solution

Platform web terintegrasi yang menghubungkan tiga pilar utama, di-deploy sebagai serverless modular monolith di Lovable Cloud:

```
┌─────────────────────────────────────────────────────────────┐
│                   Client (React PWA)                        │
│           Supabase JS SDK + TanStack Query + Zustand        │
└──────────┬──────────────────────┬───────────────────────────┘
           │ Direct CRUD (RLS)    │ invoke()
           ▼                      ▼
┌──────────────────┐   ┌──────────────────────────────────────┐
│   PostgreSQL 16  │   │  43 Deno Edge Functions               │
│   (72 Tables)    │◄──│  31 Core + 12 DSS                    │
│   215+ RLS       │   │  Service Role Key                     │
└──────────────────┘   └──────────┬───────────────────────────┘
                                  │
                    ┌─────────────┼─────────────┐
                    ▼             ▼             ▼
              ┌──────────┐ ┌──────────┐ ┌───────────────────────┐
              │  Xendit   │ │  Resend  │ │  Lovable AI Gateway   │
              │ Payments  │ │  Email   │ │  (Gemini 2.5 Pro)     │
              │ VA/QRIS/  │ │  30+     │ │  Vision (OCR)         │
              │ e-wallet  │ │ templates│ │  Reasoning (ML/DSS)   │
              └──────────┘ └──────────┘ └───────────────────────┘
```

### 1.3 Edge Functions Status

#### 1.3.1 Deployed Edge Functions (31 — Production)

| # | Edge Function | Category | Status |
|---|--------------|----------|--------|
| 1 | `accept-tenant-invitation` | Tenant Onboarding | ✅ Deployed |
| 2 | `ai-chatbot` | AI Chatbot (Tenant) | ✅ Deployed |
| 3 | `auth-webhook` | Authentication | ✅ Deployed |
| 4 | `auto-generate-invoices` | Billing Cron | ✅ Deployed |
| 5 | `auto-pay-execute` | Payment Cron | ✅ Deployed |
| 6 | `check-overdue-escalation` | Collections Cron | ✅ Deployed |
| 7 | `check-payment-plan` | Payment Cron | ✅ Deployed |
| 8 | `ensure-user-bootstrap` | Auth Setup | ✅ Deployed |
| 9 | `generate-invoice-pdf` | Billing | ✅ Deployed |
| 10 | `get-tenant-invitation` | Tenant Onboarding | ✅ Deployed |
| 11 | `merchant-ai-assistant` | AI Chatbot (Merchant) | ✅ Deployed |
| 12 | `order-auto-reject` | Marketplace Cron | ✅ Deployed |
| 13 | `process-deposit-refund` | Move-Out Cron | ✅ Deployed |
| 14 | `process-referral-commissions` | Referral Cron | ✅ Deployed |
| 15 | `process-referral-reward` | Referral Cron | ✅ Deployed |
| 16 | `process-vendor-order-referral` | Referral | ✅ Deployed |
| 17 | `scheduled-disbursement` | Escrow Cron | ✅ Deployed |
| 18 | `send-notification` | Notification | ✅ Deployed |
| 19 | `send-payment-reminder` | Billing Cron | ✅ Deployed |
| 20 | `subscription-billing` | Subscription Cron | ✅ Deployed |
| 21 | `subscription-grace-check` | Subscription Cron | ✅ Deployed |
| 22 | `subscription-payment` | Subscription | ✅ Deployed |
| 23 | `subscription-renewal` | Subscription Cron | ✅ Deployed |
| 24 | `vacancy-tracking-cron` | Property Cron | ✅ Deployed |
| 25 | `validate-admin-secret` | Admin Auth | ✅ Deployed |
| 26 | `vendor-ai-assistant` | AI Chatbot (Vendor) | ✅ Deployed |
| 27 | `whatsapp-notification` | Notification | ✅ Deployed |
| 28 | `xendit-create-invoice` | Payment | ✅ Deployed |
| 29 | `xendit-disbursement-webhook` | Payment Webhook | ✅ Deployed |
| 30 | `xendit-disbursement` | Payment | ✅ Deployed |
| 31 | `xendit-webhook` | Payment Webhook | ✅ Deployed |

#### 1.3.2 DSS Edge Functions (12 — Planned, Not Yet Deployed)

> **Status:** Arsitektur dan spesifikasi sudah final. Implementasi dijadwalkan di Phase 3 roadmap.

| Layer | Edge Function | Purpose | Priority |
|-------|--------------|---------|----------|
| **OCR** | `ocr-ktp-extract` | Extract NIK, nama, TTL, alamat dari KTP | P0 |
| **OCR** | `ocr-payment-proof` | Extract amount, date, sender dari bukti transfer | P0 |
| **OCR** | `ocr-business-document` | Extract data dari SIUP, NPWP, akta usaha | P1 |
| **OCR** | `ocr-maintenance-receipt` | Extract vendor, amount, items dari kuitansi | P2 |
| **ML** | `ml-revenue-forecast` | Prediksi revenue 3-12 bulan ke depan | P0 |
| **ML** | `ml-tenant-risk-score` | Scoring risiko tenant (0-100) | P0 |
| **ML** | `ml-churn-prediction` | Prediksi probability churn per tenant | P1 |
| **ML** | `ml-optimal-pricing` | Rekomendasi harga sewa optimal | P1 |
| **ML** | `ml-daily-risk-scoring` | Cron: batch risk scoring harian | P1 |
| **ML** | `ml-weekly-forecast` | Cron: batch forecasting mingguan | P1 |
| **DSS** | `dss-pricing-advisor` | Advisor: strategi pricing berbasis data | P1 |
| **DSS** | `dss-collection-strategy` | Advisor: strategi penagihan per tenant | P1 |
| **DSS** | `dss-maintenance-priority` | Advisor: prioritas maintenance berbasis impact | P2 |
| **DSS** | `dss-investment-insight` | Advisor: insight investasi properti | P2 |

#### 1.3.3 AI Chatbot Implementation (Deployed)

Tiga AI chatbot role-specific sudah deployed menggunakan **Gemini 2.5 Flash** (bukan Pro, untuk optimasi latency dan cost):

| Function | Model | Target User | Context Data |
|----------|-------|-------------|-------------|
| `ai-chatbot` | `google/gemini-2.5-flash` | Tenant | Chatbot knowledge base, general FAQ |
| `merchant-ai-assistant` | `google/gemini-2.5-flash` | Merchant | Revenue, invoices, contracts, occupancy, predictions |
| `vendor-ai-assistant` | `google/gemini-2.5-flash` | Vendor | Products, orders, reviews, performance analytics |

> **Note:** DSS edge functions (OCR/ML/Advisor) akan menggunakan **Gemini 2.5 Pro** untuk akurasi lebih tinggi. Chatbots menggunakan Flash untuk balance cost/latency.

---

## 2. STAKEHOLDER ANALYSIS

### 2.1 Stakeholder Map

Diselaraskan dengan 7 roles aktual di tabel `user_roles` (enum `app_role`):

| Stakeholder | System Role | Needs | Impact |
|-------------|-------------|-------|--------|
| **Pemilik Kosan (Merchant)** | `merchant` | Revenue optimization, risk visibility, automated billing | High |
| **Penyewa (Tenant)** | `tenant` | Easy payment, maintenance requests, transparent invoicing | High |
| **Vendor/Supplier** | `vendor` | Product marketplace, job assignments, earnings tracking | Medium |
| **Platform Admin** | `admin` | System management, merchant verification, dispute resolution | High |
| **Super Admin** | `super_admin` | Strategic reports, system configuration, admin management | High |
| **Moderator** | `moderator` | Forum content moderation, review management | Medium |
| **Customer Support** | `support` | Dispute handling, customer assistance | Medium |

### 2.2 User Personas

**Persona 1: Hendra, 45 — Pemilik Kos / Merchant (10 tahun pengalaman)**
- Pain Point: Tidak tahu harga optimal; sering sepi musiman; manual bank reconciliation
- Goal: Maksimalkan ROI dengan minimal effort melalui AI insights
- Tech Proficiency: Sedang (bisa email, WhatsApp)
- Usage Pattern: 15-30 menit/hari untuk monitoring dashboard
- Key Features: DSS pricing advisor, revenue forecast, auto-billing, escrow

**Persona 2: Siti, 28 — Tenant Full-time**
- Pain Point: Bayar sewa ribet; maintenance lambat ditangani
- Goal: Bayar online, report masalah cepat, dapat transparansi
- Tech Proficiency: Tinggi (smartphone-native)
- Usage Pattern: 10-15 menit/minggu untuk payments & maintenance
- Key Features: Xendit payment (VA/QRIS), maintenance requests, AI chatbot

**Persona 3: Adi, 35 — Vendor/Supplier**
- Pain Point: Sulit dapat customer tetap; pembayaran tidak terstruktur
- Goal: Dapat order via marketplace, earnings tracking, job assignments
- Tech Proficiency: Sedang
- Usage Pattern: 1-2 jam/hari untuk order management
- Key Features: Product catalog, vendor dashboard, bank account management, AI assistant

**Persona 4: Admin Platform**
- Pain Point: Verifikasi merchant manual; dispute resolution lambat
- Goal: Manage platform secara efisien dengan oversight yang baik
- Tech Proficiency: Tinggi
- Usage Pattern: 4-6 jam/hari
- Key Features: Verification queue, escrow review, analytics, 2FA (TOTP)

---

## 3. REQUIREMENTS SPECIFICATION

### 3.1 Functional Requirements (FR)

#### FR-1: MODUL DIGITALISASI DOKUMEN (OCR)

**Implementasi Aktual:** 4 Deno Edge Functions menggunakan **Lovable AI Gateway (Gemini 2.5 Pro Vision)** untuk multimodal document processing. Hasil disimpan di tabel `ocr_results` dengan immutable audit di `ml_model_runs`.

**FR-1.1: Document Upload & Storage**
- **Requirement:** Sistem mendukung upload dokumen JPG, PNG, PDF via Supabase Storage
- **Acceptance Criteria:**
  - File upload via `EnhancedFileUpload` component dengan drag-and-drop
  - File tersimpan di Supabase Storage (private bucket, encrypted at rest)
  - Timestamp upload dan user ID tercatat di `ocr_results` table
  - Error handling: Reject file >10 MB dengan pesan jelas
  - Resumable upload untuk koneksi lambat via `useResumableUpload` hook

**FR-1.2: AI-Powered Document Processing (Gemini Vision)**
- **Requirement:** Gemini 2.5 Pro Vision melakukan klasifikasi + ekstraksi dalam satu API call multimodal
- **Acceptance Criteria:**
  - Single API call: image → classified + structured JSON output
  - Processing time: <3 detik per dokumen (vs 2 menit Tesseract)
  - Document types supported: KTP, bukti transfer, SIUP/NPWP, kuitansi maintenance
  - No preprocessing needed (unlike Tesseract yang butuh image cleanup)

**FR-1.3: Confidence Scoring & Human Review**
- **Requirement:** Setiap field memiliki confidence score untuk menentukan auto-accept vs manual review
- **Confidence Thresholds (dari `dss-helpers.ts`):**

  | Level | Score Range | Action |
  |-------|-----------|--------|
  | **High** | ≥ 0.85 | Auto-accept, no review needed |
  | **Medium** | 0.60 – 0.84 | Accept with yellow flag, optional review |
  | **Low** | 0.40 – 0.59 | Require manual review |
  | **Very Low** | < 0.40 | Reject, request re-upload |

- **Output Format (dari `ocr-ktp-extract`):**
  ```json
  {
    "success": true,
    "ocr_result_id": "uuid",
    "document_type": "ktp",
    "confidence_score": 0.92,
    "confidence_level": "high",
    "extracted_data": {
      "nik": "3271234567891234",
      "nama": "Ahmad Rizki",
      "tempat_lahir": "Jakarta",
      "tanggal_lahir": "1998-05-15",
      "alamat": "Jl. Raya Bogor No. 123",
      "rt_rw": "003/007",
      "kelurahan": "Cisalak",
      "kecamatan": "Sukmajaya",
      "agama": "Islam",
      "status_perkawinan": "Belum Kawin",
      "pekerjaan": "Mahasiswa",
      "kewarganegaraan": "WNI"
    },
    "processing_time_ms": 2847,
    "model_used": "gemini-2.5-pro-vision",
    "requires_review": false
  }
  ```

**FR-1.4: Payment Proof Verification**
- **Edge Function:** `ocr-payment-proof`
- **Requirement:** Extract amount, date, sender dari bukti transfer dan auto-match ke invoice
- **Acceptance Criteria:**
  - Extract: amount, transaction_date, sender_name, bank_name, reference_number
  - Auto-match ke `invoices` table berdasarkan amount ± tolerance (Rp 1.000) + merchant_id
  - Hasil disimpan di `payment_verifications` table
  - Match status: `matched`, `partial_match`, `no_match`
  - Match confidence score untuk audit trail

**FR-1.5: Manual Review & Correction Interface**
- **Requirement:** UI review untuk OCR results dengan confidence < 0.60
- **Acceptance Criteria:**
  - Komponen `OcrResultViewer` menampilkan extracted data side-by-side dengan dokumen asli
  - Highlight field dengan confidence rendah (warna kuning/merah)
  - Inline edit dengan validation
  - Save correction → update `ocr_results.extracted_data`
  - Correction history tracked via `audit_logs` table

---

#### FR-2: MODUL MACHINE LEARNING ANALYTICS

**Implementasi Aktual:** 4 ML Edge Functions + 2 Cron Jobs menggunakan **Lovable AI (Gemini 2.5 Pro Reasoning)** dengan structured prompts. Historical data dari PostgreSQL dikirim sebagai context ke Gemini untuk analisis. Hasil di-cache di `tenant_risk_scores` dan `dss_recommendations` tables. Semua runs di-audit di `ml_model_runs` (immutable).

**FR-2.1: Revenue Forecast Model**

**Edge Function:** `ml-revenue-forecast`
**Cron:** `ml-weekly-forecast` (setiap Minggu)

**Inputs (dari PostgreSQL context):**
```
Historical Data:
├─ contracts (rent_amount, start_date, end_date, status)
├─ invoices (amount, status, paid_at, due_date)
├─ payments (amount, paid_at, payment_type)
├─ units (price, status, property_id)
├─ properties (total_units, occupied_units)
├─ escrow_transactions (amount, type, processed_at)

Context:
├─ Current occupancy rates per property
├─ Seasonal patterns (12-month rolling)
├─ Vacancy duration trends
├─ Late payment trends
```

**Algorithm:** Gemini 2.5 Pro Reasoning with structured prompt containing historical aggregates

**Acceptance Criteria:**
- MAPE < 10% untuk forecast 1-3 bulan
- MAPE < 15% untuk forecast 4-6 bulan
- Output includes confidence interval dan trend direction
- Results cached in `dss_recommendations` (type: `revenue_forecast`)
- Model run audited in `ml_model_runs`

**Output Format (dari `api-specification.md`):**
```json
{
  "success": true,
  "forecast": {
    "merchant_id": "uuid",
    "period": "2026-Q2",
    "predicted_revenue": 45000000,
    "confidence_interval": {
      "low": 40500000,
      "high": 49500000
    },
    "trend": "increasing",
    "trend_strength": "moderate",
    "monthly_breakdown": [
      {"month": "2026-04", "amount": 14200000, "occupancy_rate": 0.82},
      {"month": "2026-05", "amount": 15300000, "occupancy_rate": 0.85},
      {"month": "2026-06", "amount": 15500000, "occupancy_rate": 0.86}
    ],
    "risk_factors": [
      "2 contracts ending in April",
      "Seasonal dip expected in June-July"
    ],
    "model_confidence": 0.87,
    "model_run_id": "uuid"
  }
}
```

**FR-2.2: Tenant Risk Scoring Model**

**Edge Function:** `ml-tenant-risk-score`
**Cron:** `ml-daily-risk-scoring` (setiap hari)
**Table:** `tenant_risk_scores`

**Scoring Components:**

| Component | Weight | Data Source (Actual Tables) | Calculation |
|-----------|--------|---------------------------|-------------|
| Payment History | 35% | `payments`, `invoices`, `late_fee_records` | % on-time / total payments |
| Tenure Stability | 25% | `contracts` (start_date, end_date, status) | Avg duration; early termination count |
| Documentation Quality | 15% | `ocr_results`, `tenants` (ktp_number, verification_status) | KTP verified; confidence score |
| Complaint Record | 15% | `maintenance_requests`, `disputes` | Weighted complaint count |
| Financial Capacity | 10% | `tenants` (income_range), `contracts` (rent_amount) | Rent/income ratio |

**Scoring Formula:**
```
Risk Score = 100 - (
  0.35 × (on_time_payment_pct × 100) +
  0.25 × (min(tenure_months / 36, 1) × 100) +
  0.15 × (doc_quality_score × 100) +
  0.15 × (max(0, 100 - complaint_weighted_count × 5)) +
  0.10 × (min(monthly_rent / monthly_income, 0.5) × 100)
)

Risk Levels (dari riskLevelMapper utility):
- Score 0-25:  LOW RISK (GREEN)     → Approve readily
- Score 25-50: MODERATE RISK (YELLOW) → Approve with deposit guarantee
- Score 50-75: HIGH RISK (ORANGE)    → Require co-signer or higher deposit
- Score 75-100: CRITICAL RISK (RED)  → Recommend rejection or trial period
```

**Acceptance Criteria:**
- Scoring deterministic: same input → same score
- Fairness audit: no systematic bias per demographic
- Daily batch update via `ml-daily-risk-scoring` cron
- Historical backtesting: Score <40 → <5% default rate; Score >75 → >50% default rate
- Every score component explainable in `RiskScoreCard` component
- Result stored in `tenant_risk_scores` with `risk_factors` JSONB

**Output Format:**
```json
{
  "score_id": "uuid",
  "tenant_user_id": "uuid",
  "merchant_id": "uuid",
  "risk_score": 32,
  "risk_level": "moderate",
  "risk_factors": {
    "payment_history": {"score": 85, "detail": "28/30 on-time payments"},
    "tenure_stability": {"score": 78, "detail": "14 months avg stay"},
    "documentation_quality": {"score": 95, "detail": "KTP verified, OCR confidence 0.92"},
    "complaint_record": {"score": 92, "detail": "1 minor maintenance complaint"},
    "financial_capacity": {"score": 60, "detail": "Rent-to-income ratio 0.38"}
  },
  "recommendation": "Approve with 1x monthly deposit guarantee",
  "red_flags": [
    "Payment 3 days late in Dec 2025",
    "Income-to-rent ratio approaching threshold"
  ],
  "data_completeness": 0.95,
  "model_run_id": "uuid",
  "scored_at": "2026-02-21T14:30:00Z"
}
```

**FR-2.3: Churn Prediction Model**

**Edge Function:** `ml-churn-prediction`

**Requirement:** Predict probability tenant akan churn (tidak memperpanjang kontrak)

**Inputs:**
- Contract end date proximity
- Payment pattern trends (improving/degrading)
- Maintenance request frequency
- Complaint history
- Market rent comparison (current rent vs `ml-optimal-pricing` output)

**Output:** Churn probability (0-1), churn risk factors, recommended retention actions

**FR-2.4: Optimal Pricing Model**

**Edge Function:** `ml-optimal-pricing`

**Requirement:** Rekomendasi harga sewa optimal berdasarkan unit attributes dan market context

**Inputs (dari PostgreSQL):**
```
Unit Attributes:
├─ units (size_sqm, floor, type, amenities, price)
├─ properties (city, province, property_type, amenities)
├─ contracts (rent_amount — historical pricing data)

Market Context:
├─ Current occupancy rate (properties.occupied_units / total_units)
├─ Vacancy duration (dari vacancy-tracking-cron)
├─ Seasonal patterns (invoice/payment data)
├─ Competitor reference (if available)
```

**Output Format:**
```json
{
  "unit_id": "uuid",
  "current_price": 1500000,
  "recommended_price": 1750000,
  "price_range": {
    "minimum": 1550000,
    "maximum": 1950000,
    "confidence_interval_95": [1650000, 1850000]
  },
  "pricing_factors": {
    "unit_quality_premium": "+10%",
    "location_factor": "+15%",
    "occupancy_pressure": "-5%",
    "seasonal_adjustment": "+8%"
  },
  "price_change_recommended": "+16.7%",
  "model_confidence": 0.87,
  "recommendation_validity_days": 30
}
```

**FR-2.5: Model Monitoring & Audit Trail**

**Requirement:** Immutable audit trail untuk semua ML model runs

**Implementation:**
- **Table:** `ml_model_runs` (immutable — no UPDATE/DELETE RLS policies)
- **Fields:** `function_name`, `model_used`, `input_hash`, `output_data`, `processing_time_ms`, `tokens_used`, `merchant_id`
- **Cron Jobs:** 2 automated batch jobs:
  - `ml-daily-risk-scoring`: Daily batch risk score update untuk semua active tenants
  - `ml-weekly-forecast`: Weekly revenue forecast refresh per merchant
- **Monitoring:** Edge function logs + `ml_model_runs` query analytics

---

#### FR-3: MODUL INTERPRETASI AI (DSS ADVISOR LAYER)

**Implementasi Aktual:** 4 DSS Advisor Edge Functions menggunakan **Lovable AI Gateway (Gemini 2.5 Pro Reasoning)**. Combines ML outputs + historical context untuk generate actionable recommendations. Hasil disimpan di `dss_recommendations` table.

**FR-3.1: Pricing Advisor**

**Edge Function:** `dss-pricing-advisor`

**Requirement:** Generate pricing strategy recommendations berdasarkan ML optimal pricing + market context

**Features:**
- Combines `ml-optimal-pricing` output dengan occupancy trends
- What-if scenario analysis: "What if I raise price 10%?"
- Competitor benchmarking context
- Seasonal adjustment recommendations
- Output: Natural language recommendation + structured data

**FR-3.2: Collection Strategy Advisor**

**Edge Function:** `dss-collection-strategy`

**Requirement:** Generate optimal collection strategy per overdue tenant

**Input Context:**
- Tenant risk score (from `tenant_risk_scores`)
- Payment history (from `payments`, `invoices`)
- Days overdue (from `collections_cases`)
- Escalation level (from `collections_cases.escalation_level`)
- Contract terms (grace period, penalty rate)

**Output:** Personalized strategy per tenant:
```json
{
  "tenant_user_id": "uuid",
  "strategy": {
    "approach": "empathetic_firm",
    "actions": [
      {"day": 1, "action": "Send reminder notification", "channel": "in-app"},
      {"day": 3, "action": "Send email reminder with payment link", "channel": "email"},
      {"day": 7, "action": "Phone call — offer payment plan", "channel": "phone"},
      {"day": 14, "action": "Formal notice — escalate to collections", "channel": "email"}
    ],
    "payment_plan_suggestion": {
      "installments": 3,
      "frequency": "bi-weekly",
      "late_fee_waiver": false
    },
    "expected_recovery_rate": 0.82,
    "risk_of_escalation": 0.25
  }
}
```

**FR-3.3: Maintenance Priority Advisor**

**Edge Function:** `dss-maintenance-priority`

**Requirement:** Prioritize maintenance requests berdasarkan impact analysis

**Input:** Active `maintenance_requests` dengan context unit value, tenant risk score, SLA deadline

**Output:** Priority-ranked list dengan rationale + estimated cost impact

**FR-3.4: Investment Insight Advisor**

**Edge Function:** `dss-investment-insight`

**Requirement:** Generate property investment insights (ROI analysis, expansion recommendations)

**Input:** Portfolio-wide data (revenue, occupancy, expenses, market trends)

**Output:** Investment recommendations dengan ROI projections

**FR-3.5: Automated Report Generation (via Advisors)**

**Requirement:** Generate narasi laporan bulanan dalam bahasa Indonesia natural

**Output Types:**
1. **Executive Summary (500 words):** Performa bulanan, key recommendations, risks
2. **Pricing Analysis Report:** Price movement recommendations per unit, justification
3. **Tenant Risk Alert:** High-risk tenants, recommended actions
4. **Revenue Forecast Brief:** Next quarter prediction, growth opportunities

**Acceptance Criteria:**
- Report generation time: <5 detik (Gemini Reasoning)
- Readability: Non-technical user paham 80% content
- Factual accuracy: 100% cite dari real data (no hallucination — context from PostgreSQL)
- Actionability: Minimum 3 priority-ranked recommendations per report
- Bahasa Indonesia natural

---

#### FR-4: DASHBOARD & REPORTING

**Implementasi Aktual:** Role-specific dashboards built dengan React 18 + Recharts + shadcn/ui. Data fetched via TanStack Query dengan stale-while-revalidate caching.

**FR-4.1: Merchant Dashboard**

**Layout & Components (Actual Implementation):**

```
┌─────────────────────────────────────────────────────────────┐
│ 🏠 DASHBOARD - [Property Name]          [📅 Period Select]  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌───────────┬───────────┬───────────┬──────────────────┐ │
│  │ Hunian    │ Pendapatan│ Tenant    │ Avg Rating       │ │
│  │ 76% ↓     │ 21.6M ✓   │ Risk Med  │ 4.2/5 ⭐        │ │
│  │ (-4% MTM) │ (-4% MTM) │ 48       │ (+0.3 MTM)      │ │
│  └───────────┴───────────┴───────────┴──────────────────┘ │
│                                                             │
│  ┌──────────────────────┐   ┌──────────────────────────┐  │
│  │ Revenue Trend        │   │ Occupancy per Unit       │  │
│  │ [Recharts LineChart] │   │ [Recharts BarChart]      │  │
│  │ Target vs Actual     │   │ Vacant / Occupied / Maint│  │
│  │ + ML Forecast line   │   │                         │  │
│  └──────────────────────┘   └──────────────────────────┘  │
│                                                             │
│  ┌──────────────────┐   ┌────────────────────────────────┐│
│  │ DSS ALERTS       │   │ UPCOMING (Next 30 Days)        ││
│  ├──────────────────┤   ├────────────────────────────────┤│
│  │ 🔴 HIGH          │   │ • 2 contracts ending           ││
│  │ - Tenant D2:     │   │ • 1 payment overdue (+12 days) ││
│  │   Risk Score 72  │   │ • ML forecast: occupancy ↑ 6%  ││
│  │ 🟡 MEDIUM        │   │ • Pricing advisor: ↑5% Unit A3 ││
│  │ - Unit A3: vakum │   │                                ││
│  │   3 bulan        │   │ [See Full Calendar]            ││
│  └──────────────────┘   └────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

**Dashboard Components:**

| Component | Technology | Data Source | Refresh |
|-----------|-----------|------------|---------|
| KPI Cards | shadcn/ui Card | TanStack Query | 5 min stale |
| Revenue Chart | Recharts LineChart | `invoices`, `payments` | Daily |
| Occupancy Chart | Recharts BarChart | `units`, `properties` | Realtime (Supabase) |
| Risk Alerts | Custom component | `tenant_risk_scores` | Daily (cron) |
| DSS Recommendations | `RecommendationCard` | `dss_recommendations` | On-demand |
| Payment Status | shadcn/ui Table | `invoices`, `payments` | Realtime |

**FR-4.2: Role-Specific Dashboards**

| Role | Dashboard Features |
|------|--------------------|
| **Admin** | Merchant verification queue, platform analytics, escrow review, dispute management |
| **Merchant** | Property KPIs, billing overview, tenant risk scores, DSS advisors, revenue forecast |
| **Tenant** | Payment status, invoice history, maintenance requests, AI chatbot |
| **Vendor** | Order management, earnings tracker, product catalog, job assignments |

**Acceptance Criteria:**
- First Contentful Paint: <3 detik (Vite code splitting + lazy loading)
- Realtime updates via Supabase Realtime subscriptions
- Responsive: Desktop (1920px), Tablet (iPad), Mobile (iPhone 12+)
- WCAG 2.1 AA compliance (color contrast ≥4.5:1, keyboard nav, ARIA labels)
- Dark mode via CSS custom properties (automatic)

---

#### FR-5: DATA MANAGEMENT & MASTER DATA

**Implementasi Aktual:** 72 tables di PostgreSQL 16 dengan 215+ RLS policies. Direct CRUD via Supabase SDK enforced by RLS. File storage di Supabase Storage (private buckets).

**FR-5.1: Database Design Principles**

*Skill: `database-design` — Schema design, UUID PKs, relationships*

| Principle | Implementation |
|-----------|---------------|
| **Primary Keys** | UUID v4 (`gen_random_uuid()`) — semua 72 tables |
| **Timestamps** | `timestamptz` (timezone-aware) — `created_at DEFAULT now()`, `updated_at` via trigger |
| **Money** | `numeric` type (exact precision, bukan `float`) |
| **Status Columns** | `text` with application-level validation (no DB enums kecuali `app_role`) |
| **Arrays** | `text[]` untuk photos, tags, keywords |
| **Flexible Data** | `jsonb` untuk configurations, metadata, feature flags |
| **Soft Deletes** | Not used — no `deleted_at` columns |
| **FK Strategy** | Application-level via Supabase SDK `.select()` joins |

**FR-5.2: Table Groups (72 Tables)**

| Group | Tables | Count |
|-------|--------|-------|
| Core Identity | `profiles`, `user_roles`, `merchants`, `tenants`, `vendors` | 5 |
| Property Mgmt | `properties`, `units` | 2 |
| Contract Lifecycle | `contracts`, `move_out_notices`, `move_out_inspections`, `move_out_tasks`, `deposit_refunds`, `deposit_disputes`, `early_termination_requests` | 7 |
| Financial | `invoices`, `payments`, `xendit_transactions`, `payment_plans`, `late_fee_records`, `collections_cases`, `escrow_accounts`, `escrow_transactions`, `disbursements` | 9 |
| Subscription | `subscription_tiers`, `merchant_subscriptions`, `subscription_invoices`, `cancellation_feedback` | 4 |
| Marketplace | `products`, `orders`, `order_items`, `order_reviews` | 4 |
| Maintenance | `maintenance_requests`, `maintenance_updates`, `maintenance_timeline`, `maintenance_reviews` | 4 |
| Community | `forum_posts`, `forum_comments`, `forum_likes`, `forum_reports` | 4 |
| Referral | `referrals`, `referral_rewards` | 2 |
| Chatbot | `chat_conversations`, `chat_messages`, `chatbot_knowledge`, `chatbot_analytics` | 4 |
| Vendor Extended | `vendor_verifications`, `vendor_bank_accounts`, `vendor_jobs`, `vendor_earnings` | 4 |
| System | `audit_logs`, `analytics_events`, `notifications`, `platform_settings`, `provinces`, `cities`, `tenant_invitations`, `pending_subscription_changes`, `tenant_merchant_history` | 9+ |
| **DSS (NEW)** | `ocr_results`, `payment_verifications`, `maintenance_expenses`, `tenant_risk_scores`, `dss_recommendations`, `ml_model_runs` | **6** |

**FR-5.3: Document Storage**
- **Storage:** Supabase Storage (private buckets, encrypted at rest)
- **Buckets:** `ktp-photos`, `signatures`, `property-images`, `maintenance-photos`, `documents`
- **Access:** RLS policies on storage objects — users access own files only
- **Audit:** All access tracked in `audit_logs` table

---

### 3.2 Non-Functional Requirements (NFR)

#### NFR-1: PERFORMANCE

*Skill: `performance-engineer` — Edge function latency targets, caching strategy*

| Metric | Target | Measurement |
|--------|--------|------------|
| First Contentful Paint | <3 detik | Lighthouse (Vite code splitting) |
| Edge Function Response (p95) | <500 ms (core), <5 sec (DSS) | Edge function logs |
| OCR Processing | <3 detik/dokumen | `ml_model_runs.processing_time_ms` |
| ML Prediction | <5 detik per prediction | `ml_model_runs.processing_time_ms` |
| Direct DB Query (p95) | <100 ms | Supabase analytics |
| Concurrent Users | 50 active | Lovable Cloud auto-scaling |
| TanStack Query Cache | 5 min stale time | Client-side SWR |

**Caching Strategy:**
- TanStack Query: `staleTime: 5 min`, `gcTime: 30 min` for non-realtime data
- Supabase Realtime: For payments, invoices, notifications (instant updates)
- DSS results: Cached in `dss_recommendations` table (refreshed by cron)
- Risk scores: Cached in `tenant_risk_scores` (refreshed daily by cron)

#### NFR-2: RELIABILITY & AVAILABILITY

| Aspect | Target | Details |
|--------|--------|---------|
| Uptime SLA | 99.5% | Lovable Cloud managed infrastructure |
| Mean Time To Recovery | <15 min | Serverless auto-recovery |
| Data Durability | 99.999999999% | PostgreSQL on managed cloud |
| Backup | Automatic daily | Lovable Cloud managed |
| Edge Function Restart | Automatic | Stateless serverless — auto-restart on failure |

#### NFR-3: SECURITY

*Skill: `security-auditor` — RLS policies, RBAC, data encryption, audit trails*

**RLS-First Security Architecture:**

| Layer | Implementation |
|-------|---------------|
| **Database** | 215+ RLS policies across 72 tables — every query filtered by `auth.uid()` |
| **RBAC** | 7 roles via `app_role` enum + `has_role()` PostgreSQL function |
| **Auth** | Supabase Auth (JWT) — email/password + optional TOTP 2FA for admin |
| **Transport** | TLS 1.3 (all connections) |
| **Storage** | Encrypted at rest (Lovable Cloud managed) |
| **Audit** | `audit_logs` table — immutable (INSERT only, no UPDATE/DELETE policies) |
| **ML Audit** | `ml_model_runs` table — immutable trail for all AI/ML operations |
| **Webhook** | Timing-safe token comparison for Xendit callbacks |
| **API Keys** | `XENDIT_SECRET_KEY`, `RESEND_API_KEY` stored as Lovable Cloud secrets |
| **CORS** | Configured per edge function with proper headers |

**RBAC Matrix (7 Roles):**

| Permission | `super_admin` | `admin` | `moderator` | `support` | `merchant` | `tenant` | `vendor` |
|-----------|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| Platform settings | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Merchant verification | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Escrow review | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Forum moderation | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Dispute handling | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ |
| Property management | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| Billing & invoicing | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| DSS advisors | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| Pay rent | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |
| Maintenance requests | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |
| Product catalog | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Fulfill orders | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |

#### NFR-4: SCALABILITY

*Skill: `architecture-patterns` — Serverless modular monolith*

**Serverless Auto-Scaling:**
- Edge Functions: Stateless, auto-scale to zero, unlimited concurrency on Lovable Cloud
- Database: PostgreSQL connection pooling via Supabase
- Storage: Auto-scaling object storage
- No manual scaling configuration needed (unlike EC2 auto-scaling groups)

**Growth Projections:**

| Metric | Month 3 | Month 6 | Month 12 |
|--------|---------|---------|----------|
| Properties | 20 | 50 | 200 |
| Tenants | 300 | 750 | 3,000 |
| Documents (OCR) | 1,200 | 3,000 | 12,000 |
| Daily Edge Function Calls | 5k | 15k | 50k |
| Database Size | ~500 MB | ~2 GB | ~10 GB |

#### NFR-5: USABILITY & ACCESSIBILITY

*Skill: `accessibility-compliance` — WCAG 2.1 AA*

**Usability:**
- Task completion time: Primary workflows <5 minutes
- Error rate (trained users): <2%
- SUS (System Usability Scale): ≥70
- Integrated help via AI chatbot (3 role-specific assistants)

**Accessibility (WCAG 2.1 AA — shadcn/ui compliant):**
- Color contrast ratio: ≥4.5:1 (enforced via CSS custom properties)
- Keyboard navigation: All functions accessible
- Screen reader: Semantic HTML + ARIA labels (shadcn/ui Radix primitives)
- Touch targets: Minimum 44×44px on mobile
- Font: Scalable (Inter body, Plus Jakarta Sans headings)
- Dark mode: Automatic via CSS variables

#### NFR-6: MAINTAINABILITY

*Skill: `clean-architecture` — Feature-based modules, separation of concerns*

**Code Quality:**
- **Language:** TypeScript strict (no `any` allowed)
- **Architecture:** 28 feature modules with Clean Architecture layers
- **Components:** 54 shadcn/ui primitives + feature-specific components
- **Testing:** Vitest (frontend), Deno test (edge functions)
- **Linting:** ESLint + TypeScript strict mode
- **Type Safety:** Auto-generated Supabase types (`src/integrations/supabase/types.ts`)

**Module Structure:**
```
src/features/{module}/
├── components/     # UI (Presentational + Container)
├── hooks/          # Custom hooks (use cases)
├── services/       # Data access (Supabase queries)
├── types/          # TypeScript interfaces
└── utils/          # Pure utility functions
```

**Rules:**
- Cross-feature imports MUST go through `@/shared/`
- Page components are thin wrappers composing feature components
- 80+ pages, all lazy-loaded via `React.lazy()`

#### NFR-7: COST

*Skill: `startup-financial-modeling` — Lovable Cloud pricing model*

**Infrastructure Cost (Lovable Cloud):**

| Component | Monthly Cost | Notes |
|-----------|-------------|-------|
| Lovable Cloud (all-inclusive) | Included in plan | Hosting, DB, edge functions, storage |
| Xendit Transaction Fees | ~Rp 3-5M | 2.5% gateway + 1% platform per transaction |
| Resend Email | ~Rp 150k | ~3,000 emails/month (100 free/day) |
| Lovable AI (DSS) | Included | Gemini 2.5 Pro via Lovable AI Gateway |
| **Total Infrastructure** | **~Rp 3-5M/month** | **vs ~Rp 2M/month (AWS v2)** |

**Per-Property Cost:** ~Rp 150-250k/bulan (at 20 properties scale)

**Key Advantage vs v2 (AWS):**
- No EC2 instance management
- No RDS provisioning
- No S3 lifecycle configuration
- No Lambda function management
- No Airflow DAG maintenance
- Zero DevOps FTE needed

---

## 4. TECHNOLOGY STACK & ARCHITECTURE

### 4.1 Actual Technology Stack

*Skill: `architecture-patterns` — Serverless modular monolith*

| Layer | Technology | Version | Usage |
|-------|------------|---------|-------|
| **Frontend** | React | 18.3.x | Hooks, Context, Lazy Loading |
| **Build** | Vite | 5.4.x | HMR, SWC, Code Splitting, Compression |
| **Styling** | Tailwind CSS + shadcn/ui | 3.4+ / 54 components | Utility-first + semantic tokens |
| **State (Server)** | TanStack React Query | 5.x | Cache-first SWR data fetching |
| **State (Client)** | Zustand | 5.x | Persistent UI state (sidebar, theme) |
| **Forms** | React Hook Form + Zod | 7.x / 3.x | Schema-based validation |
| **Routing** | React Router | 6.x | SPA routing + role-based guards |
| **Charts** | Recharts | 2.x | Dashboard visualizations |
| **Maps** | React Leaflet | 4.2.x | Property location mapping |
| **Backend** | Deno Edge Functions | Latest | 43 serverless functions on Lovable Cloud |
| **Database** | PostgreSQL 16 (Supabase) | 16.x | 72 tables, 215+ RLS, 16 functions, 45+ triggers |
| **ORM** | Supabase JS SDK | 2.89+ | Type-safe queries, realtime, auth, storage |
| **Auth** | Supabase Auth (JWT) | — | RBAC via `user_roles` + `has_role()` + TOTP 2FA |
| **AI (OCR)** | Lovable AI (Gemini 2.5 Pro Vision) | — | Multimodal document processing (planned) |
| **AI (ML/DSS)** | Lovable AI (Gemini 2.5 Pro Reasoning) | — | Predictions + advisors (planned) |
| **AI (Chatbot)** | Lovable AI (Gemini 2.5 Flash) | — | 3 role-specific assistants (deployed) |
| **Payments** | Xendit | — | VA, QRIS, e-wallet, credit card, disbursement |
| **Email** | Resend | — | 30+ transactional email templates |
| **Storage** | Supabase Storage | — | KTP, signatures, photos, documents |

### 4.2 Architecture Diagram

```
┌─────────────────────────────────────────────────────┐
│                   Client (React PWA)                │
│     React 18 · Vite · Tailwind · shadcn/ui         │
│     TanStack Query · Zustand · React Router 6      │
│     Recharts · React Leaflet · React Hook Form      │
└──────────┬──────────────────────┬───────────────────┘
           │ Supabase SDK         │ invoke()
           │ (Direct CRUD + RLS)  │
           ▼                      ▼
┌──────────────────┐   ┌──────────────────────────────┐
│  PostgreSQL 16   │   │  43 Deno Edge Functions       │
│  72 Tables       │◄──│  (Service Role Key)           │
│  215+ RLS        │   ├──────────────────────────────┤
│  16 Functions    │   │  CORE (31 — DEPLOYED):        │
│  45+ Triggers    │   │  Auth, Payment, Billing,      │
│                  │   │  Notification, Subscription,  │
│                  │   │  Cron (14 jobs), 3 AI Chatbots│
│                  │   ├──────────────────────────────┤
│                  │   │  DSS (12 — PLANNED):         │
│                  │   │  4 OCR + 5 ML + 4 Advisor     │
│                  │   │  (incl. 2 ML cron jobs)       │
└──────────────────┘   └──────────┬───────────────────┘
                                  │
                    ┌─────────────┼─────────────┐
                    ▼             ▼             ▼
              ┌──────────┐ ┌──────────┐ ┌──────────────────┐
              │  Xendit   │ │  Resend  │ │  Lovable AI      │
              │  Payment  │ │  Email   │ │  Gateway         │
              │  Gateway  │ │  Service │ │  (Gemini 2.5 Pro)│
              │           │ │          │ │  Vision + Reason │
              └──────────┘ └──────────┘ └──────────────────┘
```

### 4.3 API Access Patterns

| Pattern | Description | Auth | Example |
|---------|-------------|------|---------|
| **Client SDK** | Direct CRUD via Supabase JS, enforced by RLS | JWT (anon key + user token) | `supabase.from('invoices').select()` |
| **Edge Functions** | Server-side logic via `supabase.functions.invoke()` | JWT / Webhook Token / Cron | `invoke('ml-tenant-risk-score', { body })` |
| **Webhooks** | External callbacks (Xendit) | `x-callback-token` header | `POST /xendit-webhook` |
| **Cron Jobs** | Scheduled tasks (14 core + 2 DSS) | Service role (internal) | `auto-generate-invoices` daily |

### 4.4 Cron Jobs (14 Core + 2 DSS)

| Cron Job | Schedule | Purpose |
|----------|----------|---------|
| `auto-generate-invoices` | Daily | Generate invoices on billing_day |
| `check-overdue-escalation` | Daily | 4-tier overdue escalation |
| `process-auto-payments` | Daily | Execute auto-pay for tenants |
| `scheduled-disbursement` | Daily | Process merchant payouts |
| `vacancy-tracking-cron` | Daily | Track unit vacancy duration |
| `check-subscription-expiry` | Daily | Subscription status check |
| `process-subscription-billing` | Daily | Bill active subscriptions |
| `check-subscription-trial-expiry` | Daily | Trial → paid conversion |
| `check-move-out-deadlines` | Daily | Move-out deadline alerts |
| `process-deposit-refund` | Daily | Execute deposit refunds via Xendit |
| `update-collections-status` | Daily | Update collections case status |
| `send-payment-reminders` | Daily | Send payment due reminders |
| `sync-referral-status` | Daily | Update referral conversion status |
| `process-referral-rewards` | Daily | Calculate and credit referral rewards |
| **`ml-daily-risk-scoring`** | **Daily** | **DSS: Batch tenant risk scoring** |
| **`ml-weekly-forecast`** | **Weekly** | **DSS: Revenue forecast refresh** |

---

## 5. ML MODEL SPECIFICATIONS

### 5.1 Implementation Architecture

**v2 (Old):** Python libraries (Scikit-learn, XGBoost, ARIMA) + Airflow DAGs + monthly retraining + S3 model storage

**v3.0 (Current):** Gemini 2.5 Pro Reasoning via Lovable AI Gateway + structured prompts + cached results in PostgreSQL + 2 cron jobs + `ml_model_runs` immutable audit

*Skill: `prompt-engineering-patterns` — Gemini prompt design for ML/DSS*

### 5.2 Why Gemini Reasoning vs Traditional ML

| Aspect | Traditional ML (v2) | Gemini Reasoning (v3.0) |
|--------|-------------------|------------------------|
| **Training Data** | Requires 500+ samples per model | Works with any dataset size (few-shot) |
| **Feature Engineering** | Manual (Python) | Automatic (contextual understanding) |
| **Retraining** | Monthly via Airflow DAG | No retraining needed (model improves with context) |
| **Model Storage** | S3 pickle files | No model files (API-based) |
| **Infrastructure** | GPU instances for training | Zero infrastructure (Lovable AI Gateway) |
| **Interpretability** | SHAP values (separate computation) | Natural language explanation included |
| **Cold Start** | Need historical data for initial training | Works immediately with current data |
| **Cost** | $20/month GPU + Airflow hosting | Included in Lovable Cloud |

### 5.3 Prompt Engineering Patterns

**Pattern: Structured Context → Structured Output**

```
System: You are a property management analytics engine for Indonesian kos-kosan.
Analyze the provided historical data and generate predictions.

Context (from PostgreSQL):
- Payment history: [aggregated data]
- Occupancy trends: [12-month data]
- Contract data: [active/ending contracts]
- Market reference: [unit pricing data]

Task: Generate revenue forecast for next 3 months.

Output format: JSON with fields:
{
  "predicted_revenue": number,
  "confidence_interval": { "low": number, "high": number },
  "trend": "increasing" | "decreasing" | "stable",
  "risk_factors": string[],
  "recommendations": string[]
}
```

### 5.4 Model Monitoring

**v3.0 Monitoring (via `ml_model_runs`):**

```sql
-- Weekly accuracy check
SELECT 
  function_name,
  AVG(processing_time_ms) as avg_latency,
  COUNT(*) as total_runs,
  AVG((output_data->>'model_confidence')::numeric) as avg_confidence
FROM ml_model_runs
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY function_name;
```

**Monitoring Metrics:**
- `ml_model_runs.processing_time_ms` — latency tracking
- `ml_model_runs.tokens_used` — cost tracking
- `output_data.model_confidence` — accuracy proxy
- Manual spot-checks: Compare predictions vs actuals monthly

### 5.5 Scoring Formulas (Business Logic — Preserved from v2)

All scoring formulas from v2 remain valid as business logic. The difference is implementation:
- **v2:** Computed in Python code with trained model weights
- **v3.0:** Computed by Gemini Reasoning with the formula provided as prompt context + historical data

The scoring formula for tenant risk (Section FR-2.2) and the risk level thresholds are the authoritative reference for both the Gemini prompts and the `riskLevelMapper` utility function.

---

## 6. DATA PRIVACY & COMPLIANCE

### 6.1 Data Protection

*Skill: `gdpr-data-handling` — Data retention, PII handling, consent management*

**Personal Data Classification:**

| Data Type | Classification | Storage | Access (RLS) |
|-----------|---------------|---------|-------------|
| Tenant Name | PII | `profiles.full_name` | Own data + admin + linked merchant |
| KTP Number | Sensitive PII | `tenants.ktp_number` | Own data + admin only |
| KTP Photo | Sensitive PII | Supabase Storage (private bucket) | Own data + admin only |
| Phone Number | PII | `profiles.phone` | Own data + admin |
| Payment Amount | Financial | `invoices.amount`, `payments.amount` | Merchant + tenant + admin |
| Bank Account | Sensitive Financial | `bank_accounts.*` | Merchant own + admin |
| Risk Score | Derived PII | `tenant_risk_scores.*` | Merchant + admin (tenant cannot see) |
| OCR Results | Contains PII | `ocr_results.extracted_data` | Creator + admin |

**Data Retention Policy:**

| Data Type | Retention | Method | Table |
|-----------|-----------|--------|-------|
| Tenant Personal Info | 7 years after contract end | Application-level anonymization | `tenants`, `profiles` |
| Transaction Records | 10 years | Archive (retained in DB) | `payments`, `invoices`, `escrow_transactions` |
| OCR Documents | 5 years | Storage bucket lifecycle | Supabase Storage |
| Audit Logs | Indefinite (immutable) | No deletion | `audit_logs` |
| ML Model Runs | Indefinite (immutable) | No deletion | `ml_model_runs` |
| DSS Recommendations | 2 years | Soft archive | `dss_recommendations` |
| Risk Scores | 2 years after tenant departure | Application-level cleanup | `tenant_risk_scores` |

### 6.2 RBAC & Access Control

**v2 (Old):** 3 roles (Admin, Manager, Surveyor) with application-level filtering  
**v3.0 (Current):** 7 roles enforced at database level via 215+ RLS policies

```sql
-- Core RLS check function (actual implementation)
CREATE FUNCTION public.has_role(user_id uuid, role app_role)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = $1 AND user_roles.role = $2
  );
$$ LANGUAGE sql SECURITY DEFINER;
```

### 6.3 Audit Trail

**Dual Audit System:**

1. **`audit_logs`** — General system audit
   - All CRUD operations logged
   - Fields: `user_id`, `action`, `entity_type`, `entity_id`, `old_data`, `new_data`, `ip_address`
   - RLS: INSERT only (immutable) — admins can read

2. **`ml_model_runs`** — AI/ML-specific audit
   - Every OCR, ML, and DSS function call logged
   - Fields: `function_name`, `model_used`, `input_hash`, `output_data`, `processing_time_ms`, `tokens_used`
   - RLS: INSERT only (immutable) — admins + merchant (own data) can read

### 6.4 Compliance Standards

**Indonesia Regulations:**
- **UU PDP (Perlindungan Data Pribadi):** Consent management, data subject rights, breach notification
- **UU No. 8/1997 (Consumer Protection):** Tenant rights, dispute resolution
- **OJK Regulations:** Payment gateway compliance via Xendit (PCI DSS certified)

**Within-App Compliance Features:**
- Consent checkbox during tenant registration
- Data export capability (JSON) for data subject requests
- Formal deletion request workflow (30-day review)
- Privacy policy displayed in-app

---

## 7. PRODUCT ROADMAP & TIMELINE

### 7.1 Lovable Cloud Accelerated Development

*Skill: `deployment-pipeline-design` — CI/CD via Lovable Cloud*

**v2 (Old):** 6-phase waterfall, 6 months, 14 FTE, manual AWS infrastructure  
**v3.0 (Current):** Sprint-based with Lovable AI acceleration, significantly faster development velocity

```
┌─────────────────────────────────────────────────────────────────┐
│  PHASE 1: FOUNDATION (Week 1-4)                                │
├─────────────────────────────────────────────────────────────────┤
│ ✓ Lovable Cloud setup (automatic — no AWS provisioning)        │
│ ✓ Database schema design (72 tables + 215 RLS policies)        │
│ ✓ Auth system (Supabase Auth + 7 roles + TOTP 2FA)            │
│ ✓ Core feature modules (auth, properties, contracts, billing)  │
│ ✓ Xendit payment integration (edge functions + webhooks)       │
│                                                                │
│ Deliverables: Working MVP with auth, properties, basic billing │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│  PHASE 2: CORE PLATFORM (Week 5-10)                            │
├─────────────────────────────────────────────────────────────────┤
│ ✓ Invoice automation (auto-generate-invoices cron)             │
│ ✓ Escrow & disbursement engine                                 │
│ ✓ Contract lifecycle (signatures, move-out, deposits)          │
│ ✓ Maintenance workflow (tenant → merchant → vendor)            │
│ ✓ Vendor marketplace                                           │
│ ✓ Subscription billing (3-tier: Basic/Pro/Enterprise)          │
│ ✓ Referral program                                             │
│ ✓ 14 cron jobs (billing, overdue, reminders, disbursement)     │
│ ✓ Notification system (in-app + email via Resend)              │
│                                                                │
│ Deliverables: Full operational platform (31 core edge functions)│
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│  PHASE 3: DSS LAYER (Week 11-16)                               │
├─────────────────────────────────────────────────────────────────┤
│ ✓ OCR module (4 edge functions: KTP, payment, biz docs, maint) │
│ ✓ ML module (4 edge functions + 2 cron jobs)                   │
│ ✓ DSS advisor module (4 edge functions)                        │
│ ✓ 6 DSS database tables                                       │
│ ✓ 3 DSS frontend feature modules (dss-ocr, dss-ml, dss-advisor)│
│ ✓ DSS dashboard components (RiskScoreCard, ForecastChart, etc.)│
│ ✓ AI chatbot (3 role-specific assistants)                      │
│                                                                │
│ Deliverables: Full DSS capability (12 DSS edge functions)      │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│  PHASE 4: TESTING & LAUNCH (Week 17-24)                        │
├─────────────────────────────────────────────────────────────────┤
│ ✓ Integration testing (E2E: OCR → ML → DSS → Dashboard)       │
│ ✓ Security audit (RLS policies, RBAC, data access)             │
│ ✓ Performance testing (50 concurrent users)                    │
│ ✓ UAT with pilot kosans                                        │
│ ✓ Pilot rollout (5 → 20 kosans)                               │
│ ✓ User training & onboarding                                  │
│ ✓ Monitoring & iteration                                      │
│                                                                │
│ Deliverables: Production system, 20 active kosans, feedback    │
└─────────────────────────────────────────────────────────────────┘
```

### 7.2 Milestone Schedule

| Milestone | Date | Gate Criteria |
|-----------|------|--------------|
| M1: Foundation Ready | Week 4 | Auth + properties + basic billing working |
| M2: Core Platform | Week 10 | 31 edge functions, 14 crons, full billing |
| M3: DSS Complete | Week 16 | 12 DSS functions, ML crons, dashboard |
| M4: UAT Passed | Week 20 | 80% test cases pass, zero critical bugs |
| M5: Pilot Launch | Week 22 | 5 kosans live, stable |
| M6: Full Rollout | Week 24 | 20 kosans, >80% adoption |

---

## 8. RESOURCE PLAN & BUDGET

### 8.1 Team Composition (Lovable-Assisted)

*Skill: `startup-financial-modeling` — Lovable-assisted development*

**v2 (Old):** 14 FTE (PM, Tech Lead, 3 Backend, 2 Frontend, Data Engineer, Domain Expert, 2 QA, DevOps, 5 Surveyors)

**v3.0 (Current):** Lovable AI handles significant development workload

```
┌─────────────────────────────────────────────────────────────────┐
│ TEAM STRUCTURE v3.0 (Lovable-Assisted)                         │
├─────────────────────────────────────────────────────────────────┤

CORE TEAM (3-4 people)
├─ 1 × Product Owner / Project Manager
│  Role: Requirements, stakeholder comms, UAT coordination
│
├─ 1 × Technical Lead
│  Role: Architecture decisions, code review, Lovable AI guidance
│  Skills: React, TypeScript, Supabase, edge functions
│
├─ 1 × Full-Stack Developer
│  Role: Feature development, testing, integration
│  Skills: React, TypeScript, Tailwind, Supabase SDK
│
└─ 1 × Domain Expert / Business Analyst (Part-time)
   Role: Business rules, data validation, user training

LOVABLE AI HANDLES:
├─ Frontend scaffolding & component development
├─ Edge function creation & deployment
├─ Database schema design & migrations
├─ RLS policy generation
├─ UI/UX implementation with shadcn/ui
├─ Code refactoring & optimization
└─ Documentation generation

NOT NEEDED (vs v2):
├─ ❌ ML Engineer (Gemini Reasoning replaces Scikit-learn)
├─ ❌ Data Engineer (no Airflow/ETL pipeline)
├─ ❌ DevOps Engineer (Lovable Cloud zero-config)
├─ ❌ Automation QA (Lovable AI assists testing)
├─ ❌ 5 Field Surveyors (OCR digitizes documents in-place)

TOTAL: 3-4 FTE (vs 14 FTE in v2)
```

### 8.2 Budget Estimate

*Skill: `startup-financial-modeling` — Per-property cost, breakeven*

**Development Costs (6-month pilot):**

| Category | Monthly | 6-Month |
|----------|---------|---------|
| **Personnel** | | |
| PM + Tech Lead (2 FTE) | Rp 40M | Rp 240M |
| Full-Stack Developer (1 FTE) | Rp 20M | Rp 120M |
| Domain Expert (0.5 FTE) | Rp 10M | Rp 60M |
| **Subtotal Personnel** | **Rp 70M** | **Rp 420M** |
| **Platform & Infrastructure** | | |
| Lovable Cloud (hosting, DB, functions) | Included | Included |
| Xendit Transaction Fees | Rp 3M | Rp 18M |
| Resend Email Service | Rp 150k | Rp 900k |
| Lovable AI (OCR/ML/DSS) | Included | Included |
| **Subtotal Infrastructure** | **~Rp 3.15M** | **~Rp 18.9M** |
| **Miscellaneous** | | |
| Training & Documentation | — | Rp 5M |
| Contingency (10%) | — | Rp 44.4M |
| **Subtotal Misc** | | **Rp 49.4M** |
| **TOTAL** | | **~Rp 488M** |

**Comparison v2 vs v3.0:**

| Metric | v2 (AWS) | v3.0 (Lovable Cloud) | Savings |
|--------|----------|---------------------|---------|
| Team Size | 14 FTE | 3.5 FTE | -75% |
| 6-Month Budget | Rp 1,434M | Rp 488M | -66% |
| Per-Property Cost (pilot) | Rp 71.7M | Rp 24.4M | -66% |
| Monthly Infrastructure | Rp 2M (AWS) | ~Rp 3.15M (mainly Xendit fees) | Comparable |
| Time-to-Market | 6 months | 4-5 months | -20-30% |

**Production Scale (100 properties):**
- Infrastructure: ~Rp 5-8M/month (mostly Xendit transaction fees)
- Cost per property: ~Rp 50-80k/month
- Revenue target per property: Rp 800k-1.5M/month (subscription)
- **ROI breakeven: 4-6 months** (vs 8-10 months in v2)

---

## 9. RISK MANAGEMENT

### 9.1 Risk Register (v3.0 — Lovable Cloud)

| # | Risk | Probability | Impact | Mitigation |
|---|------|-------------|--------|-----------|
| R1 | AI model quality (Gemini hallucination) | MEDIUM | HIGH | Structured prompts with PostgreSQL context; confidence thresholds; manual review for low-confidence; `ml_model_runs` audit trail |
| R2 | OCR accuracy below threshold | LOW | MEDIUM | Gemini Vision significantly better than Tesseract; confidence scoring with human-in-the-loop; re-upload option |
| R3 | User adoption resistance | MEDIUM | HIGH | Early user involvement; AI chatbot for help; gradual rollout (5→20 kosans); training sessions |
| R4 | Data breach / PII exposure | LOW | CRITICAL | 215+ RLS policies; encrypted storage; audit logs; RBAC with 7 roles; no direct DB access |
| R5 | Lovable AI rate limits | LOW | MEDIUM | DSS results cached in DB (cron-refreshed); graceful degradation; manual fallback |
| R6 | Xendit payment failure | LOW | HIGH | Retry logic in webhooks; idempotency checks; escrow reconciliation; error notifications |
| R7 | Scope creep | MEDIUM | MEDIUM | Strict feature gating by subscription tier; prioritize by business impact |
| R8 | Lovable Cloud service interruption | LOW | HIGH | Serverless auto-recovery; realtime reconnection; client-side caching via TanStack Query |
| R9 | Regulatory/compliance changes | LOW | MEDIUM | UU PDP readiness; consent management; data export capability |
| R10 | Key person dependency | MEDIUM | HIGH | Comprehensive documentation (8 docs); Lovable AI enables onboarding |

### 9.2 Contingency Plans

**Scenario 1: AI Predictions Not Meeting Quality Targets**
- Trigger: Model confidence consistently <0.70
- Action: Enrich context data sent to Gemini; refine structured prompts; add few-shot examples; fallback to rule-based scoring
- Timeline impact: 1-2 week refinement

**Scenario 2: OCR Accuracy Below Threshold**
- Trigger: >20% of documents require manual correction
- Action: Refine document-specific prompts; add preprocessing (image quality check); provide re-upload guidance
- Timeline impact: Minimal (prompt iteration, not code rewrite)

**Scenario 3: Security Vulnerability Discovered**
- Trigger: Unauthorized data access detected
- Action: Activate incident response; review RLS policies; audit `audit_logs`; patch within 24h
- Timeline impact: 1-3 day fix + post-mortem

---

## 10. SUCCESS METRICS & KPI

### 10.1 Business KPIs

*Skill: `startup-metrics-framework` — Business KPIs, unit economics*

| KPI | Baseline | Target | Timeline | Measurement |
|-----|----------|--------|----------|------------|
| **Revenue Uplift** | Rp 0 | +8-15% per property | Month 6 | Total revenue (20 kosans) vs forecast |
| **Occupancy Rate** | 74% | 78%+ | Month 6 | `properties.occupied_units / total_units` |
| **Payment Default Rate** | 18% | <8% | Month 6 | Overdue invoices / total invoices |
| **User Adoption Rate** | 0% | >80% | Month 5 | Active daily users / total registered |
| **Time Saved (Admin)** | ~2 hrs/week | ~0.5 hrs/week | Month 4 | User survey |
| **Subscription Revenue** | Rp 0 | Rp 16M/month | Month 6 | `subscription_invoices` sum |

### 10.2 Technical KPIs

| KPI | Target | Measurement |
|-----|--------|-------------|
| **System Uptime** | 99.5% | Lovable Cloud monitoring |
| **Edge Function p95 Latency** | <500ms (core), <5s (DSS) | Edge function logs |
| **OCR Confidence** | >85% average | `ocr_results.confidence_score` avg |
| **ML Model Confidence** | >80% average | `ml_model_runs.output_data.model_confidence` avg |
| **Page Load (FCP)** | <3 sec | Lighthouse |
| **Database Query p95** | <100ms | Supabase analytics |
| **Cron Job Success Rate** | >99% | Edge function logs |

### 10.3 DSS-Specific KPIs

| KPI | Target | Measurement |
|-----|--------|-------------|
| **OCR Documents Processed** | 1,000+/month | `ocr_results` count |
| **Payment Auto-Match Rate** | >70% | `payment_verifications.match_status = 'matched'` |
| **Risk Score Coverage** | 100% active tenants | `tenant_risk_scores` vs active contracts |
| **DSS Recommendation Adoption** | >50% | `dss_recommendations.status = 'accepted'` |
| **Forecast Accuracy (MAPE)** | <10% (3-month) | Predicted vs actual revenue comparison |
| **Collection Recovery Rate** | >75% | Resolved collections / total collections |

### 10.4 User Experience KPIs

| KPI | Target | Measurement |
|-----|--------|-------------|
| **Task Completion Time** | <5 minutes | User testing |
| **Error Rate (trained users)** | <2% | Analytics events |
| **CSAT** | ≥4.0/5.0 | Post-task surveys |
| **NPS** | >40 | Monthly survey |
| **AI Chatbot Satisfaction** | >70% | `chatbot_analytics.user_satisfied` |

---

## 11. GLOSSARY & DEFINITIONS

| Term | Definition |
|------|-----------|
| **SiHuni** | Sistem Hunian — nama platform |
| **Kosan** | Boarding house / student housing property (Indonesia) |
| **DSS** | Decision Support System — software yang mendukung pengambilan keputusan |
| **OCR** | Optical Character Recognition — konversi dokumen scan ke data digital |
| **ML** | Machine Learning — algoritma yang belajar pola dari data |
| **Lovable Cloud** | Platform hosting serverless (Deno Edge Functions + PostgreSQL + Storage) |
| **Edge Function** | Serverless function yang berjalan di Deno runtime |
| **RLS** | Row Level Security — kebijakan akses data di level database |
| **RBAC** | Role-Based Access Control — sistem permission berbasis role |
| **Gemini 2.5 Pro** | AI model dari Google (Vision untuk OCR, Reasoning untuk ML/DSS) |
| **Lovable AI Gateway** | API gateway untuk mengakses Gemini tanpa API key terpisah |
| **TanStack Query** | Library React untuk server-state caching (stale-while-revalidate) |
| **Zustand** | Lightweight client-state management library |
| **shadcn/ui** | Component library berbasis Radix UI + Tailwind CSS |
| **Xendit** | Payment gateway Indonesia (VA, QRIS, e-wallet, credit card) |
| **Resend** | Email service untuk transactional emails |
| **MAPE** | Mean Absolute Percentage Error — metrik akurasi prediksi |
| **JWT** | JSON Web Token — format token autentikasi |
| **TOTP** | Time-based One-Time Password — 2FA via authenticator app |
| **Escrow** | Rekening perantara untuk menahan dana sebelum disbursement |
| **Disbursement** | Pencairan dana dari escrow ke rekening merchant |
| **Cron Job** | Scheduled task yang berjalan otomatis (daily/weekly) |
| **SWR** | Stale-While-Revalidate — caching strategy |
| **UAT** | User Acceptance Testing |
| **SUS** | System Usability Scale |
| **FCP** | First Contentful Paint — metrik performa web |

---

## 12. APPENDIX & REFERENCES

### 12.1 Cross-References ke Dokumen Teknis v3.0

| Dokumen | Konten Utama | Kapan Dibaca |
|---------|-------------|-------------|
| `api-specification.md` | 43 edge function endpoints, payloads, webhooks, cron jobs | Saat development API |
| `backend-architecture.md` | System architecture, data flow, DSS layer detail | Saat architecture review |
| `business-process.md` | 25+ workflow diagrams, state machines, sequence diagrams | Saat business logic development |
| `database-schema.md` | 72 table definitions, ER diagrams, RLS policies, indexes | Saat database design |
| `deployment-infrastructure.md` | Lovable Cloud deployment, 2-environment model (Test/Prod) | Saat deployment planning |
| `development-standards.md` | Coding standards, patterns, module structure, testing | Saat daily development |
| `domain-state-machines.md` | 18 state machines, 16 cron jobs, cross-domain workflows | Saat business logic validation |
| `marketing.md` | GTM strategy, pricing tiers, DSS feature gating | Saat go-to-market planning |
| `project-roadmap.md` | Milestone timeline, sprint backlog, deliverables | Saat project planning |
| `security-architecture.md` | RBAC matrix, RLS policies, audit trail specs | Saat security review |
| `seo.md` | SEO strategy, meta tags, schema markup, programmatic SEO | Saat content & marketing |
| `system-architecture.md` | C4 diagrams, system context, container, component views | Saat architecture overview |
| `testing-strategy.md` | Test pyramid, Vitest/Deno testing, DSS/AI testing, 17 CUJs | Saat QA planning |
| `UIUX_Design_Documentation_SiHuni.md` | Design system, component library, responsive patterns | Saat UI development |

### 12.2 Tools & Software (Actual Stack)

```
Development:
├─ Lovable AI (primary development tool)
├─ VS Code (supplementary editor)
├─ Git / GitHub (version control)
└─ Postman / curl (API testing)

Frontend:
├─ React 18 + TypeScript
├─ Vite (build tool)
├─ Tailwind CSS + shadcn/ui (54 components)
├─ TanStack Query v5 (server state)
├─ Zustand v5 (client state)
├─ React Hook Form + Zod (forms)
├─ Recharts (charts)
├─ React Leaflet (maps)
└─ React Router v6 (routing)

Backend:
├─ Deno Edge Functions (43 functions)
├─ PostgreSQL 16 (72 tables)
├─ Supabase SDK v2 (ORM)
├─ Supabase Auth (JWT + TOTP)
└─ Supabase Storage (files)

External Services:
├─ Xendit (payment gateway)
├─ Resend (transactional email)
└─ Lovable AI Gateway (Gemini 2.5 Pro)

Monitoring:
├─ Edge function logs (Lovable Cloud)
├─ ml_model_runs table (AI audit)
├─ audit_logs table (system audit)
└─ analytics_events table (user analytics)
```

### 12.3 Skills Applied in This Document

*Dari `.trae/skills/` repository:*

| Skill | Application in PRD |
|-------|-------------------|
| `database-design` | Schema principles (UUID PKs, JSONB, numeric for money, timestamptz) |
| `architecture-patterns` | Serverless modular monolith, feature-based architecture |
| `api-design-principles` | Edge function API design, RLS-first approach |
| `security-auditor` | 215+ RLS policies, 7 RBAC roles, immutable audit trails |
| `accessibility-compliance` | WCAG 2.1 AA via shadcn/ui Radix primitives |
| `performance-engineer` | Edge function latency targets, TanStack Query caching |
| `startup-metrics-framework` | Business KPIs, unit economics, ROI calculations |
| `startup-financial-modeling` | Budget rewrite, per-property cost, breakeven analysis |
| `pricing-strategy` | Subscription tier gating for DSS features |
| `gdpr-data-handling` | Data retention, PII handling, UU PDP compliance |
| `deployment-pipeline-design` | CI/CD via Lovable Cloud, 16 cron jobs |
| `clean-architecture` | 28 feature modules, separation of concerns |
| `web-performance-optimization` | FCP targets, code splitting, lazy loading |
| `responsive-design` | Mobile-first dashboard, 44px touch targets |
| `prompt-engineering-patterns` | Gemini prompt design for OCR/ML/DSS |
| `e2e-testing-patterns` | DSS function testing, UAT criteria |
| `market-sizing-analysis` | Indonesia kosan market sizing |
| `competitive-landscape` | USP comparison with actual DSS capabilities |

### 12.4 Further Reading

- **Lovable Cloud Documentation:** https://docs.lovable.dev
- **Supabase RLS Guide:** https://supabase.com/docs/guides/database/postgres/row-level-security
- **Gemini 2.5 Pro:** Google AI multimodal model (Vision + Reasoning)
- **shadcn/ui:** https://ui.shadcn.com — Accessible component library
- **TanStack Query:** https://tanstack.com/query — Server state management
- **Xendit API:** https://docs.xendit.co — Indonesia payment gateway
- **UU PDP Indonesia:** Undang-Undang Perlindungan Data Pribadi

---

**END OF DOCUMENT**

**Document Status:** ✅ v3.1 — Aligned with Implementation  
**Last Updated:** 22 Februari 2026  
**Architecture Alignment:** 100% synced with actual codebase (31 deployed + 12 planned edge functions)  
**Documentation Suite:** 15 documents, all at v3.0+  
**Next Review:** Month 3 (Mei 2026) — Post-pilot assessment  
**Approval Sign-Off:** [Awaiting stakeholder review]
