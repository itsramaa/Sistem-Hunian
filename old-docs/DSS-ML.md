# DSS & ML — Dokumentasi Komprehensif SiHuni

> Dokumen ini mencatat seluruh komponen Decision Support System (DSS), Artificial Intelligence (AI), dan Machine Learning (ML) dalam sistem SiHuni.

---

## Daftar Isi

1. [Arsitektur Overview](#1-arsitektur-overview)
2. [Edge Functions](#2-edge-functions)
3. [Frontend Services](#3-frontend-services)
4. [Hooks](#4-hooks)
5. [UI Components](#5-ui-components)
6. [Integrasi Halaman](#6-integrasi-halaman)
7. [Validasi & Utils](#7-validasi--utils)
8. [Tabel Database](#8-tabel-database)
9. [Shared Infrastructure — dss-utils.ts](#9-shared-infrastructure--dss-utilsts)

---

## 1. Arsitektur Overview

### AI Gateway

```
Frontend (React) 
  → supabase.functions.invoke("ml-*" / "dss-*" / "ocr-*")
    → Edge Function
      → callLovableAI({ model, systemPrompt, userContent })
        → Google Gemini 2.5 Pro  (vision, prediction, OCR)
        → Google Gemini 2.5 Flash (chatbot, ringan)
```

### Komponen Inti

| Komponen | Lokasi | Deskripsi |
|----------|--------|-----------|
| AI Gateway | `supabase/functions/_shared/dss-utils.ts` | Fungsi `callLovableAI` — abstraksi panggilan ke Lovable AI |
| Tier System | `useMerchantTier.ts` + `checkTierLimit()` | Akses fitur berdasarkan paket: free → starter → professional → enterprise |
| Audit Log | Tabel `ml_model_runs` | Setiap eksekusi model dicatat otomatis |
| Data Readiness | `useDssReadiness.ts` | Checklist 4 level (24 item) sebelum fitur ML aktif |

### Alur Data

```
User Action → Hook (React Query) → Service Function → Edge Function
  → authenticateUser() → checkTierLimit() → getMerchantId()
  → Aggregate Data → callLovableAI() → logModelRun()
  → Response → Frontend State Update → UI Render
```

---

## 2. Edge Functions

Semua edge function DSS/ML berada di `supabase/functions/` dan mengimpor utilitas dari `supabase/functions/_shared/dss-utils.ts`.

### 2.1 ML Prediction (10 fungsi)

| # | Function | File | Tier Limits | Model AI | Purpose |
|---|----------|------|-------------|----------|---------|
| 1 | `ml-revenue-forecast` | `supabase/functions/ml-revenue-forecast/index.ts` | pro:5/hari, ent:∞ | Gemini 2.5 Pro | Prediksi pendapatan bulanan |
| 2 | `ml-tenant-risk-score` | `supabase/functions/ml-tenant-risk-score/index.ts` | start:3, pro:20, ent:∞ | Gemini 2.5 Pro | Skor risiko penyewa 0-100 |
| 3 | `ml-churn-prediction` | `supabase/functions/ml-churn-prediction/index.ts` | pro only, ent:∞ | Gemini 2.5 Pro | Probabilitas churn penyewa |
| 4 | `ml-optimal-pricing` | `supabase/functions/ml-optimal-pricing/index.ts` | pro only, ent:∞ | Gemini 2.5 Pro | Optimasi harga unit |
| 5 | `ml-tenant-quality-scoring` | `supabase/functions/ml-tenant-quality-scoring/index.ts` | start:3, pro:15, ent:∞ | Gemini 2.5 Pro | Grading kualitas penyewa A-F |
| 6 | `ml-financial-analytics` | `supabase/functions/ml-financial-analytics/index.ts` | pro:3, ent:∞ | Gemini 2.5 Pro | ROI, NPV, IRR, Break-even |
| 7 | `ml-risk-assessment` | `supabase/functions/ml-risk-assessment/index.ts` | pro:3, ent:∞ | Gemini 2.5 Pro | Risiko bencana & asuransi |
| 8 | `ml-price-intelligence` | `supabase/functions/ml-price-intelligence/index.ts` | pro:3, ent:∞ | Gemini 2.5 Pro | Segmen harga & tren pasar |
| 9 | `ml-occupancy-forecast` | `supabase/functions/ml-occupancy-forecast/index.ts` | pro:5, ent:∞ | Gemini 2.5 Pro | Prediksi okupansi |
| 10 | `ml-data-quality-check` | `supabase/functions/ml-data-quality-check/index.ts` | — (semua tier) | Gemini 2.5 Pro | Validasi kualitas data |

### 2.2 DSS Advisors (4 fungsi)

| # | Function | File | Purpose |
|---|----------|------|---------|
| 1 | `dss-pricing-advisor` | `supabase/functions/dss-pricing-advisor/index.ts` | Rekomendasi penetapan harga unit |
| 2 | `dss-collection-strategy` | `supabase/functions/dss-collection-strategy/index.ts` | Strategi penagihan piutang |
| 3 | `dss-maintenance-priority` | `supabase/functions/dss-maintenance-priority/index.ts` | Prioritisasi pekerjaan maintenance |
| 4 | `dss-investment-insight` | `supabase/functions/dss-investment-insight/index.ts` | Analisis investasi properti |

### 2.3 OCR Processing (8 fungsi)

| # | Function | File | Dokumen Target |
|---|----------|------|----------------|
| 1 | `ocr-ktp-extract` | `supabase/functions/ocr-ktp-extract/index.ts` | KTP / Kartu Identitas |
| 2 | `ocr-payment-proof` | `supabase/functions/ocr-payment-proof/index.ts` | Bukti pembayaran / transfer |
| 3 | `ocr-business-document` | `supabase/functions/ocr-business-document/index.ts` | NIB, SIUP, Akta, NPWP |
| 4 | `ocr-contract-document` | `supabase/functions/ocr-contract-document/index.ts` | Kontrak sewa fisik |
| 5 | `ocr-compliance-document` | `supabase/functions/ocr-compliance-document/index.ts` | IMB, PBB, dokumen kepatuhan |
| 6 | `ocr-expense-receipt` | `supabase/functions/ocr-expense-receipt/index.ts` | Struk pengeluaran |
| 7 | `ocr-maintenance-receipt` | `supabase/functions/ocr-maintenance-receipt/index.ts` | Struk maintenance |
| 8 | `ocr-asset-label` | `supabase/functions/ocr-asset-label/index.ts` | Label inventaris aset |

**Alur OCR:**
```
Upload Gambar → Edge Function → downloadImageAsBase64()
  → callLovableAI({ model: "gemini-2.5-pro", vision: true })
  → createOcrResult() → Response dengan extracted_data + confidence
```

### 2.4 AI Assistants (3 fungsi)

| # | Function | File | Target User | Model AI |
|---|----------|------|-------------|----------|
| 1 | `merchant-ai-assistant` | `supabase/functions/merchant-ai-assistant/index.ts` | Merchant/Pemilik | Gemini 2.5 Flash |
| 2 | `vendor-ai-assistant` | `supabase/functions/vendor-ai-assistant/index.ts` | Vendor/Supplier | Gemini 2.5 Flash |
| 3 | `ai-chatbot` | `supabase/functions/ai-chatbot/index.ts` | Tenant/Umum | Gemini 2.5 Flash |

### 2.5 ML Support Functions (4 fungsi)

| # | Function | File | Purpose |
|---|----------|------|---------|
| 1 | `ml-ocr-correction-suggest` | `supabase/functions/ml-ocr-correction-suggest/index.ts` | Saran koreksi AI untuk field OCR akurasi rendah |
| 2 | `compute-occupancy-snapshots` | `supabase/functions/compute-occupancy-snapshots/index.ts` | Cron: snapshot okupansi harian |
| 3 | `compute-tenant-payment-metrics` | `supabase/functions/compute-tenant-payment-metrics/index.ts` | Cron: metrik pembayaran penyewa |
| 4 | `log-rls-access` | `supabase/functions/log-rls-access/index.ts` | Audit logging akses RLS |

---

## 3. Frontend Services

Semua file berada di `src/features/dss/services/`.

### 3.1 `mlService.ts`

| Fungsi | Parameter | Edge Function | Return |
|--------|-----------|---------------|--------|
| `invokeRevenueForecast` | `forecastMonths`, `propertyId?` | `ml-revenue-forecast` | Prediksi pendapatan per bulan |
| `invokeTenantRiskScore` | `tenantUserId?`, `batch` | `ml-tenant-risk-score` | Skor risiko 0-100 |
| `invokeChurnPrediction` | `windowMonths` | `ml-churn-prediction` | Probabilitas churn |
| `invokeOptimalPricing` | `propertyId` | `ml-optimal-pricing` | Harga optimal per unit |

### 3.2 `dssAdvisorService.ts`

| Fungsi | Parameter | Edge Function |
|--------|-----------|---------------|
| `invokePricingAdvisor` | `propertyId`, `context?` | `dss-pricing-advisor` |
| `invokeCollectionStrategy` | `tenantUserId` | `dss-collection-strategy` |
| `invokeMaintenancePriority` | — | `dss-maintenance-priority` |
| `invokeInvestmentInsight` | `propertyId` | `dss-investment-insight` |

### 3.3 `financialRiskService.ts`

| Fungsi | Parameter | Edge Function |
|--------|-----------|---------------|
| `invokeFinancialAnalytics` | `propertyId` | `ml-financial-analytics` |
| `invokeRiskAssessment` | `propertyId` | `ml-risk-assessment` |

**Types yang diekspor:** `FinancialAnalyticsResult`, `RiskAssessmentResult`, `DisasterRiskProfile`, `InsuranceRecommendation`

### 3.4 `marketIntelligenceService.ts`

| Fungsi | Parameter | Edge Function |
|--------|-----------|---------------|
| `invokePriceIntelligence` | `propertyId` | `ml-price-intelligence` |
| `invokeOccupancyForecast` | `propertyId`, `months?` | `ml-occupancy-forecast` |

**Types yang diekspor:** `PriceSegment`, `MarketTrend`, `OccupancyPrediction`

### 3.5 `tenantQualityService.ts`

| Fungsi | Parameter | Edge Function |
|--------|-----------|---------------|
| `invokeTenantQualityScoring` | `tenant_user_id?`, `screening_data?`, `batch?` | `ml-tenant-quality-scoring` |

**Types yang diekspor:** `TenantQualityResult`, `PaymentReliability`, `RiskProfile`, `RiskFlag`, `ScreeningRecommendation`, `BehavioralInsight`, `BatchTenantResult`, `ScreeningData`

### 3.6 `tenantAnalyticsService.ts`

| Fungsi | Parameter | Edge Function |
|--------|-----------|---------------|
| `fetchTenantDemographics` | `merchantId` | — (query langsung) |
| `fetchOccupancyMetrics` | `merchantId` | — (query langsung) |
| `fetchTenantPaymentProfiles` | `merchantId` | — (query langsung) |

### 3.7 `ocrDocumentService.ts`

| Fungsi | Parameter | Deskripsi |
|--------|-----------|-----------|
| `fetchOcrResults` | `merchantId`, `filters?` | Ambil semua hasil OCR dengan filter |
| `fetchOcrResultById` | `id` | Detail satu hasil OCR |
| `updateOcrResult` | `id`, `updates` | Update data ekstraksi / status / review |
| `getDocumentPreviewUrl` | `documentUrl` | Generate signed URL untuk preview |

**Filter interface:** `OcrResultFilters { documentType?, status?, requiresReview? }`

### 3.8 `ocrCorrectionService.ts`

| Fungsi | Parameter | Edge Function |
|--------|-----------|---------------|
| `invokeOcrCorrectionSuggest` | `ocrResultId` | `ml-ocr-correction-suggest` |

---

## 4. Hooks

Semua file berada di `src/features/dss/hooks/`.

### 4.1 `useMlAnalytics.ts`

| Hook | Query Key | Service | Enabled |
|------|-----------|---------|---------|
| `useRevenueForecast` | `["revenue-forecast"]` | `invokeRevenueForecast` | Manual trigger |
| `useTenantRiskScores` | `["tenant-risk-scores"]` | `invokeTenantRiskScore(batch)` | Manual trigger |
| `useRefreshRiskScore` | — (mutation) | `invokeTenantRiskScore(id)` | On-demand |
| `useChurnPrediction` | `["churn-prediction"]` | `invokeChurnPrediction` | Manual trigger |
| `useOptimalPricing` | `["optimal-pricing"]` | `invokeOptimalPricing` | Manual trigger |
| `useModelRunHistory` | `["model-run-history"]` | Query `ml_model_runs` | Auto |

### 4.2 `useDssAdvisors.ts`

| Hook | Type | Service |
|------|------|---------|
| `usePricingAdvisor` | Mutation | `invokePricingAdvisor` |
| `useCollectionStrategy` | Mutation | `invokeCollectionStrategy` |
| `useMaintenancePriority` | Mutation | `invokeMaintenancePriority` |
| `useInvestmentInsight` | Mutation | `invokeInvestmentInsight` |
| `useDssRecommendations` | Query | Tabel `dss_recommendations` |
| `useUpdateRecommendation` | Mutation | Update status rekomendasi |

### 4.3 `useDssReadiness.ts`

Checklist kesiapan data 4 level dengan 24 item total:

| Level | Nama | Item Contoh |
|-------|------|-------------|
| 1 | Data Dasar | Properti ≥1, Unit ≥1, Penyewa ≥1 |
| 2 | Data Finansial | Kontrak aktif, Invoice terbit, Pembayaran tercatat |
| 3 | Data Operasional | Maintenance request, Vendor terdaftar |
| 4 | Data Lanjutan | Dokumen OCR, Risk score, Model run history |

**Return:** `{ levels, overallScore, isReady, checklistByLevel }`

### 4.4 `useDssHealthMetrics.ts`

Monitoring kesehatan sistem DSS dengan polling 30 detik:

| Metrik | Sumber | Window |
|--------|--------|--------|
| OCR Stats | `ocr_results` | 30 hari |
| Model Run Stats | `ml_model_runs` | 30 hari |
| Validation Stats | `dss_validation_logs` | 30 hari |
| Recommendation Stats | `dss_recommendations` | Aktif |

### 4.5 `useMerchantTier.ts`

**Feature Access Matrix:**

| Feature Key | Minimum Tier |
|-------------|-------------|
| `ocr_basic` | starter |
| `ocr_advanced` | professional |
| `risk_score` | starter |
| `risk_dashboard` | professional |
| `ai_recommendations` | professional |
| `revenue_forecast` | enterprise |
| `custom_models` | enterprise |
| `bulk_ocr` | enterprise |
| `api_access` | professional |
| `priority_support` | enterprise |

**Return:** `{ tier, tierName, canAccess(feature), isLoading }`

### 4.6 `useFinancialRisk.ts`

| Hook | Service |
|------|---------|
| `useFinancialAnalytics` | `invokeFinancialAnalytics` |
| `useRiskAssessment` | `invokeRiskAssessment` |

### 4.7 `useMarketIntelligence.ts`

| Hook | Service |
|------|---------|
| `usePriceIntelligence` | `invokePriceIntelligence` |
| `useOccupancyForecast` | `invokeOccupancyForecast` |

### 4.8 `useTenantQuality.ts`

| Hook | Service |
|------|---------|
| `useTenantQualityScoring` | `invokeTenantQualityScoring` |

### 4.9 `useTenantAnalytics.ts`

| Hook | Service |
|------|---------|
| `useTenantDemographics` | `fetchTenantDemographics` |
| `useOccupancyMetrics` | `fetchOccupancyMetrics` |
| `useTenantPaymentProfiles` | `fetchTenantPaymentProfiles` |

### 4.10 `useOcrDocuments.ts`

| Hook | Service |
|------|---------|
| `useOcrResults` | `fetchOcrResults` |
| `useOcrResultDetail` | `fetchOcrResultById` |
| `useUpdateOcrResult` | `updateOcrResult` |

### 4.11 `useOcrCorrection.ts`

| Hook | Service |
|------|---------|
| `useOcrCorrectionSuggestions` | `invokeOcrCorrectionSuggest` |

### 4.12 `useRlsMonitor.ts`

Monitoring penolakan RLS dengan polling 30 detik.

| Return | Deskripsi |
|--------|-----------|
| `denials` | Array log akses yang ditolak |
| `totalDenials` | Jumlah total |
| `recentDenials` | 24 jam terakhir |

### 4.13 `useRlsAlertSettings.ts`

| Return | Deskripsi |
|--------|-----------|
| `settings` | Konfigurasi threshold alert |
| `updateSettings` | Mutation update threshold |

---

## 5. UI Components

### 5.1 Feature Components — `src/features/dss/components/`

| File | Komponen | Deskripsi |
|------|----------|-----------|
| `DssReadinessCard.tsx` | `DssReadinessCard` | Card progress dengan 4 level kesiapan data, progress bar, overall score |
| `DssReadinessChecklist.tsx` | `DssReadinessChecklist` | Checklist expandable per level dengan status per item |
| `OcrUploadCard.tsx` | `OcrUploadCard` | Upload dokumen dengan pemilih tipe dokumen, support kamera/galeri/webcam |
| `OcrDocumentViewer.tsx` | `OcrDocumentViewer` | Preview PDF/gambar dengan highlighting pada teks yang diekstrak |
| `OcrResultEditor.tsx` | `OcrResultEditor` | Editor koreksi manual untuk field hasil OCR |
| `RiskDashboardWidgets.tsx` | `RiskDashboardWidgets` | Widget dashboard skor risiko (gauge, chart, summary) |
| `RecommendationList.tsx` | `RecommendationList` | Daftar rekomendasi DSS dengan filter status |
| `TierGate.tsx` | `TierGate` | Kombinasi gate tier + readiness, blur overlay untuk fitur terkunci |

**Barrel export:** `src/features/dss/components/index.ts`
```ts
export { OcrUploadCard } from "./OcrUploadCard";
export { RiskDashboardWidgets } from "./RiskDashboardWidgets";
export { RecommendationList } from "./RecommendationList";
```

### 5.2 Shared DSS Components — `src/shared/components/dss/`

| File | Komponen | Props | Deskripsi |
|------|----------|-------|-----------|
| `ConfidenceBadge.tsx` | `ConfidenceBadge` | `confidence: 0-100`, `size`, `showLabel` | Badge warna: ≥90 hijau, ≥70 kuning, ≥50 oranye, <50 merah |
| `RiskScoreIndicator.tsx` | `RiskScoreIndicator` | `score: 0-100`, `size`, `showLabel` | Progress bar risiko: ≤25 rendah, ≤50 sedang, ≤75 tinggi, >75 kritis |
| `ExtractedField.tsx` | `ExtractedField` | `label`, `value`, `confidence`, `isVerified?`, `originalText?` | Field OCR dengan badge confidence, highlight review jika <70% |
| `TierGatedFeature.tsx` | `TierGatedFeature` | `requiredTier`, `currentTier`, `featureName?`, `onUpgrade?` | Blur overlay + lock icon + tombol upgrade untuk fitur terkunci |
| `RecommendationCard.tsx` | `RecommendationCard` | — | Card aksi rekomendasi (accept/defer/reject) |

### 5.3 Chatbot Components — `src/features/chatbot/components/`

| File | Komponen | Deskripsi |
|------|----------|-----------|
| `MerchantChatbot.tsx` | `MerchantChatbot` | Asisten AI merchant dengan quick actions kontekstual |
| `VendorChatbot.tsx` | `VendorChatbot` | Chatbot khusus vendor |
| `ChatbotWidget.tsx` | `ChatbotWidget` | Floating trigger button (FAB) |
| `ChatbotDialog.tsx` | `ChatbotDialog` | Dialog wrapper untuk chatbot |
| `ChatMessageRenderer.tsx` | `ChatMessageRenderer` | Renderer bubble pesan (user/AI) |
| `FaqTab.tsx` | `FaqTab` | Tab FAQ dari knowledge base |
| `LiveChatTab.tsx` | `LiveChatTab` | Tab live chat |

### 5.4 Chatbot Admin Components — `src/features/chatbot/components/admin/`

| File | Komponen | Deskripsi |
|------|----------|-----------|
| `KnowledgeDialog.tsx` | `KnowledgeDialog` | Dialog CRUD knowledge base |
| `KnowledgeFilters.tsx` | `KnowledgeFilters` | Pencarian dan filter knowledge |
| `KnowledgeStats.tsx` | `KnowledgeStats` | Statistik knowledge base |
| `KnowledgeTable.tsx` | `KnowledgeTable` | Tabel entri knowledge |

---

## 6. Integrasi Halaman

| # | Halaman | File | Hooks yang Digunakan | Komponen DSS |
|---|---------|------|---------------------|--------------|
| 1 | ML Analytics | `src/pages/merchant/MlAnalytics.tsx` | `useMlAnalytics`, `useMerchantTier`, `useDssReadiness` | RiskDashboardWidgets, TierGate |
| 2 | DSS Advisor | `src/pages/merchant/DssAdvisor.tsx` | `useDssAdvisors`, `useMerchantTier` | RecommendationList, RecommendationCard |
| 3 | Market Intelligence | `src/pages/merchant/MarketIntelligence.tsx` | `useMarketIntelligence`, `useMerchantTier` | TierGatedFeature |
| 4 | Financial Risk Analytics | `src/pages/merchant/FinancialRiskAnalytics.tsx` | `useFinancialRisk`, `useMerchantTier` | RiskScoreIndicator, TierGatedFeature |
| 5 | Tenant Quality Scoring | `src/pages/merchant/TenantQualityScoring.tsx` | `useTenantQuality`, `useMerchantTier` | ConfidenceBadge, TierGatedFeature |
| 6 | Tenant Analytics | `src/pages/merchant/TenantAnalytics.tsx` | `useTenantAnalytics` | — |
| 7 | Document Center | `src/pages/merchant/DocumentCenter.tsx` | `useOcrDocuments`, `useOcrCorrection` | OcrUploadCard, OcrDocumentViewer, OcrResultEditor, ExtractedField, ConfidenceBadge |
| 8 | Property Detail | `src/pages/merchant/PropertyDetail.tsx` | `useDssReadiness` | DssReadinessCard, DssReadinessChecklist |

---

## 7. Validasi & Utils

### `src/features/dss/utils/dss-validation.ts`

| Export | Tipe | Deskripsi |
|--------|------|-----------|
| `ktpSchema` | Zod Schema | Validasi field KTP (NIK 16 digit, nama, TTL, alamat) |
| `paymentProofSchema` | Zod Schema | Validasi bukti pembayaran (nominal, tanggal, bank) |
| `businessDocSchema` | Zod Schema | Validasi dokumen bisnis (NPWP, NIB, dll) |
| `maintenanceReceiptSchema` | Zod Schema | Validasi struk maintenance |
| `STATE_TRANSITIONS` | Object | State machine transisi status OCR: `pending → processing → extracted → reviewed → verified` |
| `validateTransition` | Function | Validasi perpindahan state |
| `logValidation` | Function | Catat log validasi ke `dss_validation_logs` |

---

## 8. Tabel Database

### 8.1 `ml_model_runs`

Audit log eksekusi model ML.

| Kolom | Tipe | Deskripsi |
|-------|------|-----------|
| `id` | uuid | Primary key |
| `merchant_id` | uuid | FK → merchants |
| `model_name` | text | Nama model (e.g., `revenue-forecast`) |
| `input_data` | jsonb | Data input |
| `output_data` | jsonb | Hasil prediksi |
| `execution_time_ms` | integer | Waktu eksekusi |
| `status` | text | `success` / `error` |
| `error_message` | text | Pesan error jika gagal |
| `tier` | text | Tier merchant saat eksekusi |
| `created_at` | timestamptz | Waktu eksekusi |

### 8.2 `ocr_results`

Hasil ekstraksi OCR dari dokumen.

| Kolom | Tipe | Deskripsi |
|-------|------|-----------|
| `id` | uuid | Primary key |
| `merchant_id` | uuid | FK → merchants |
| `document_type` | text | Tipe dokumen (ktp, payment_proof, dll) |
| `document_url` | text | Path file di storage |
| `extracted_data` | jsonb | Data hasil ekstraksi |
| `confidence_score` | numeric | Skor kepercayaan keseluruhan |
| `status` | text | `pending → processing → extracted → reviewed → verified` |
| `requires_review` | boolean | Perlu review manual |
| `review_notes` | text | Catatan reviewer |
| `reviewed_by` | uuid | User yang mereview |
| `reviewed_at` | timestamptz | Waktu review |
| `created_at` | timestamptz | Waktu upload |

### 8.3 `dss_recommendations`

Rekomendasi yang dihasilkan sistem DSS.

| Kolom | Tipe | Deskripsi |
|-------|------|-----------|
| `id` | uuid | Primary key |
| `merchant_id` | uuid | FK → merchants |
| `type` | text | Tipe (pricing, collection, maintenance, investment) |
| `title` | text | Judul rekomendasi |
| `description` | text | Deskripsi detail |
| `status` | text | `pending → accepted / rejected / deferred` |
| `confidence_score` | numeric | Skor kepercayaan |
| `impact_estimate` | jsonb | Estimasi dampak |
| `measured_impact` | jsonb | Dampak terukur (setelah implementasi) |
| `recommendation_data` | jsonb | Data detail rekomendasi |
| `ml_model_run_id` | uuid | FK → ml_model_runs |
| `accepted_at` | timestamptz | Waktu diterima |
| `rejected_at` | timestamptz | Waktu ditolak |
| `rejection_reason` | text | Alasan penolakan |
| `expires_at` | timestamptz | Masa berlaku |

### 8.4 `dss_validation_logs`

Log validasi data DSS.

| Kolom | Tipe | Deskripsi |
|-------|------|-----------|
| `id` | uuid | Primary key |
| `entity_type` | text | Tipe entitas (ocr_result, risk_score, dll) |
| `entity_id` | uuid | ID entitas |
| `validation_type` | text | Tipe validasi |
| `validation_result` | text | Hasil (pass/fail/warning) |
| `validation_details` | jsonb | Detail validasi |
| `old_state` | text | State sebelumnya |
| `new_state` | text | State baru |
| `performed_by` | uuid | User yang melakukan |
| `created_at` | timestamptz | Waktu validasi |

### 8.5 `tenant_risk_scores`

Skor risiko penyewa yang tersimpan.

| Kolom | Tipe | Deskripsi |
|-------|------|-----------|
| `id` | uuid | Primary key |
| `merchant_id` | uuid | FK → merchants |
| `tenant_user_id` | uuid | FK → auth.users |
| `risk_score` | numeric | Skor 0-100 |
| `risk_factors` | jsonb | Faktor-faktor risiko |
| `model_run_id` | uuid | FK → ml_model_runs |
| `created_at` | timestamptz | Waktu kalkulasi |

### 8.6 `rls_access_logs`

Log akses RLS untuk monitoring keamanan.

| Kolom | Tipe | Deskripsi |
|-------|------|-----------|
| `id` | uuid | Primary key |
| `user_id` | uuid | User yang mengakses |
| `table_name` | text | Tabel yang diakses |
| `operation` | text | SELECT/INSERT/UPDATE/DELETE |
| `denied` | boolean | Apakah ditolak |
| `created_at` | timestamptz | Waktu akses |

### 8.7 `rls_alert_settings`

Konfigurasi alert threshold RLS.

### 8.8 `chatbot_knowledge`

Knowledge base untuk AI chatbot.

| Kolom | Tipe | Deskripsi |
|-------|------|-----------|
| `id` | uuid | Primary key |
| `question` | text | Pertanyaan |
| `answer` | text | Jawaban |
| `category` | text | Kategori |
| `keywords` | text[] | Kata kunci pencarian |
| `is_active` | boolean | Status aktif |
| `created_at` | timestamptz | Waktu dibuat |
| `updated_at` | timestamptz | Waktu diperbarui |

### 8.9 `occupancy_snapshots`

Snapshot okupansi harian (diisi oleh cron `compute-occupancy-snapshots`).

### 8.10 `tenant_payment_metrics`

Metrik pembayaran penyewa (diisi oleh cron `compute-tenant-payment-metrics`).

---

## 9. Shared Infrastructure — `dss-utils.ts`

File: `supabase/functions/_shared/dss-utils.ts` (~530 baris)

### Fungsi yang Diekspor

| Fungsi | Kategori | Deskripsi |
|--------|----------|-----------|
| `createServiceClient()` | Auth | Buat Supabase client dengan service role |
| `createUserClient(authHeader)` | Auth | Buat Supabase client dengan token user |
| `authenticateUser(req)` | Auth | Ekstrak & validasi user dari request |
| `checkTierLimit(supabase, merchantId, model, limits)` | Tier | Cek batas penggunaan per tier per hari |
| `getMerchantId(supabase, userId)` | Data | Ambil merchant ID dari user ID |
| `downloadImageAsBase64(supabase, bucket, path)` | OCR | Download gambar dari storage → base64 |
| `callLovableAI({ model, systemPrompt, userContent })` | AI | Panggil Lovable AI Gateway |
| `AiGatewayError` | AI | Custom error class untuk AI gateway |
| `logModelRun(supabase, params)` | Audit | Catat eksekusi model ke `ml_model_runs` |
| `createOcrResult(supabase, params)` | OCR | Buat record di `ocr_results` |
| `createDssRecommendation(supabase, params)` | DSS | Buat record di `dss_recommendations` |
| `upsertRiskScore(supabase, params)` | ML | Upsert ke `tenant_risk_scores` |
| `aggregatePaymentHistory(supabase, merchantId, tenantId?)` | Data | Agregasi riwayat pembayaran |
| `aggregateOccupancyData(supabase, merchantId, propertyId?)` | Data | Agregasi data okupansi |
| `aggregateMaintenanceData(supabase, merchantId)` | Data | Agregasi data maintenance |
| `errorResponse(message, status?)` | HTTP | Response error standar |
| `successResponse(data)` | HTTP | Response sukses standar |

### Pola Penggunaan dalam Edge Function

```typescript
import {
  createServiceClient,
  authenticateUser,
  checkTierLimit,
  getMerchantId,
  callLovableAI,
  logModelRun,
  aggregatePaymentHistory,
  errorResponse,
  successResponse,
} from "../_shared/dss-utils.ts";

Deno.serve(async (req) => {
  // 1. Auth
  const { user, supabase } = await authenticateUser(req);

  // 2. Merchant & Tier
  const merchantId = await getMerchantId(supabase, user.id);
  await checkTierLimit(supabase, merchantId, "model-name", {
    starter: 3, professional: 20, enterprise: Infinity
  });

  // 3. Aggregate Data
  const paymentData = await aggregatePaymentHistory(supabase, merchantId);

  // 4. Call AI
  const result = await callLovableAI({
    model: "google/gemini-2.5-pro",
    systemPrompt: "You are a financial analyst...",
    userContent: JSON.stringify(paymentData),
  });

  // 5. Log & Respond
  await logModelRun(supabase, {
    merchantId, modelName: "model-name",
    inputData: paymentData, outputData: result,
    executionTimeMs: Date.now() - start, status: "success",
  });

  return successResponse(result);
});
```

---

## Ringkasan Angka

| Kategori | Jumlah |
|----------|--------|
| Edge Functions (DSS/ML/OCR/AI) | 29 |
| Frontend Services | 8 |
| Custom Hooks | 13 |
| UI Components (Feature) | 8 |
| UI Components (Shared DSS) | 5 |
| UI Components (Chatbot) | 11 |
| Page Integrations | 8 |
| Database Tables | 10 |
| Zod Validation Schemas | 4 |
| Exported Utility Functions | 17 |

---

*Dokumen ini di-generate berdasarkan audit kode aktual pada Maret 2026.*
