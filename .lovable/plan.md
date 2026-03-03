

# Create `old-docs/DSS-ML.md` — Comprehensive DSS & ML Documentation

## Overview
Create a single comprehensive markdown documentation file that catalogs every DSS, AI, and ML component in the SiHuni system, including edge functions, services, hooks, UI components, database tables, shared utilities, and page integrations.

## Document Structure

The file will be organized into these sections:

### 1. Architecture Overview
- AI Gateway: Lovable AI (`callLovableAI`) → Google Gemini 2.5 Pro (vision/prediction) + Flash (chatbot)
- Shared infrastructure: `supabase/functions/_shared/dss-utils.ts` (530 lines)
- Tier-gated access: free → starter → professional → enterprise
- Audit logging: `ml_model_runs` table

### 2. Edge Functions (22 functions using dss-utils)

**ML Prediction (10)**:
| Function | Tier Limits | Purpose |
|----------|------------|---------|
| `ml-revenue-forecast` | pro:5, ent:∞ | Monthly revenue prediction |
| `ml-tenant-risk-score` | start:3, pro:20, ent:∞ | Tenant risk 0-100 |
| `ml-churn-prediction` | pro only, ent:∞ | Churn probability |
| `ml-optimal-pricing` | pro only, ent:∞ | Unit price optimization |
| `ml-tenant-quality-scoring` | start:3, pro:15, ent:∞ | Quality grade A-F |
| `ml-financial-analytics` | pro:3, ent:∞ | ROI/NPV/IRR/Break-even |
| `ml-risk-assessment` | pro:3, ent:∞ | Disaster & insurance risk |
| `ml-price-intelligence` | pro:3, ent:∞ | Price segments & trends |
| `ml-occupancy-forecast` | pro:5, ent:∞ | Occupancy predictions |
| `ml-data-quality-check` | — | Data validation |

**DSS Advisors (4)**:
| Function | Purpose |
|----------|---------|
| `dss-pricing-advisor` | Pricing recommendations |
| `dss-collection-strategy` | Debt collection strategy |
| `dss-maintenance-priority` | Maintenance prioritization |
| `dss-investment-insight` | Investment analysis |

**OCR Processing (8)**:
| Function | Purpose |
|----------|---------|
| `ocr-ktp-extract` | KTP identity card |
| `ocr-payment-proof` | Payment receipts |
| `ocr-business-document` | NIB/SIUP/Akta/NPWP |
| `ocr-contract-document` | Contracts |
| `ocr-compliance-document` | IMB/PBB compliance |
| `ocr-expense-receipt` | Expense receipts |
| `ocr-maintenance-receipt` | Maintenance receipts |
| `ocr-asset-label` | Asset labels |

**AI Assistants (3)**:
| Function | Purpose |
|----------|---------|
| `merchant-ai-assistant` | Merchant contextual chatbot |
| `vendor-ai-assistant` | Vendor chatbot |
| `ai-chatbot` | General/tenant chatbot |

**ML Support**:
| Function | Purpose |
|----------|---------|
| `ml-ocr-correction-suggest` | AI correction suggestions |
| `compute-occupancy-snapshots` | Snapshot cron |
| `compute-tenant-payment-metrics` | Payment metric cron |
| `log-rls-access` | RLS audit logging |

### 3. Frontend Services (8 files)
All in `src/features/dss/services/`:
- `mlService.ts` — revenue forecast, risk score, churn, optimal pricing
- `dssAdvisorService.ts` — pricing, collection, maintenance, investment
- `financialRiskService.ts` — ROI/NPV/IRR + disaster risk types & invocations
- `marketIntelligenceService.ts` — price intelligence + occupancy forecast types
- `tenantQualityService.ts` — quality scoring A-F + screening
- `tenantAnalyticsService.ts` — demographics, occupancy metrics, payment profiles
- `ocrDocumentService.ts` — CRUD OCR results, signed URLs
- `ocrCorrectionService.ts` — AI correction suggestions

### 4. Hooks (13 files)
All in `src/features/dss/hooks/`:
- `useMlAnalytics.ts` — useRevenueForecast, useTenantRiskScores, useRefreshRiskScore, useChurnPrediction, useOptimalPricing, useModelRunHistory
- `useDssAdvisors.ts` — usePricingAdvisor, useCollectionStrategy, useMaintenancePriority, useInvestmentInsight, useDssRecommendations, useUpdateRecommendation
- `useDssReadiness.ts` — 4-level checklist (24 items), overall score
- `useDssHealthMetrics.ts` — OCR stats, model run stats, validation stats (30-day window, 30s polling)
- `useMerchantTier.ts` — tier detection + feature access matrix
- `useFinancialRisk.ts` — useFinancialAnalytics, useRiskAssessment
- `useMarketIntelligence.ts` — usePriceIntelligence, useOccupancyForecast
- `useTenantQuality.ts` — useTenantQualityScoring
- `useTenantAnalytics.ts` — useTenantDemographics, useOccupancyMetrics, useTenantPaymentProfiles
- `useOcrDocuments.ts` — useOcrResults, useOcrResultDetail, useUpdateOcrResult
- `useOcrCorrection.ts` — useOcrCorrectionSuggestions
- `useRlsMonitor.ts` — RLS denial monitoring (30s polling)
- `useRlsAlertSettings.ts` — alert threshold config

### 5. UI Components

**Feature Components** (`src/features/dss/components/`):
- `DssReadinessCard.tsx` — Progress card with 4-level readiness
- `DssReadinessChecklist.tsx` — Expandable checklist per level
- `OcrUploadCard.tsx` — Document upload with type selector
- `OcrDocumentViewer.tsx` — PDF/image preview with highlighting
- `OcrResultEditor.tsx` — Manual correction editor
- `RiskDashboardWidgets.tsx` — Risk score dashboard widgets
- `RecommendationList.tsx` — List of DSS recommendations
- `TierGate.tsx` — Combined tier + readiness gate

**Shared DSS Components** (`src/shared/components/dss/`):
- `ConfidenceBadge.tsx` — Color-coded confidence 0-100%
- `RiskScoreIndicator.tsx` — Progress bar risk meter
- `ExtractedField.tsx` — OCR field with confidence badge
- `TierGatedFeature.tsx` — Blur overlay for locked features
- `RecommendationCard.tsx` — Action card (accept/defer/reject)

**Chatbot Components** (`src/features/chatbot/components/`):
- `MerchantChatbot.tsx` — Merchant AI assistant with quick actions
- `VendorChatbot.tsx` — Vendor-specific chatbot
- `ChatbotWidget.tsx` — Floating widget trigger
- `ChatbotDialog.tsx` — Dialog wrapper
- `ChatMessageRenderer.tsx` — Message bubble renderer
- `FaqTab.tsx` — FAQ display
- `LiveChatTab.tsx` — Live chat interface
- `admin/KnowledgeDialog.tsx` — Knowledge CRUD dialog
- `admin/KnowledgeFilters.tsx` — Search/filter for knowledge
- `admin/KnowledgeStats.tsx` — Knowledge base stats
- `admin/KnowledgeTable.tsx` — Knowledge entry table

### 6. Page Integrations (8 pages)
- `MlAnalytics.tsx` — All ML model dashboard
- `DssAdvisor.tsx` — DSS recommendations
- `MarketIntelligence.tsx` — Price intelligence + occupancy forecast
- `FinancialRiskAnalytics.tsx` — Financial + risk assessment
- `TenantQualityScoring.tsx` — Tenant quality A-F
- `TenantAnalytics.tsx` — Demographics + payment profiles
- `DocumentCenter.tsx` — OCR document management
- `PropertyDetail.tsx` — DSS readiness card integration

### 7. Validation & Utils
- `src/features/dss/utils/dss-validation.ts` — Zod schemas (KTP, payment proof, business doc, maintenance receipt), state machine transitions, validation logging

### 8. Database Tables
`ml_model_runs`, `ocr_results`, `dss_recommendations`, `dss_validation_logs`, `tenant_risk_scores`, `rls_access_logs`, `rls_alert_settings`, `chatbot_knowledge`, `occupancy_snapshots`, `tenant_payment_metrics`

### 9. Shared Infrastructure (`dss-utils.ts`)
Full listing of exported functions: `createServiceClient`, `createUserClient`, `authenticateUser`, `checkTierLimit`, `getMerchantId`, `downloadImageAsBase64`, `callLovableAI`, `AiGatewayError`, `logModelRun`, `createOcrResult`, `createDssRecommendation`, `upsertRiskScore`, `aggregatePaymentHistory`, `aggregateOccupancyData`, `aggregateMaintenanceData`, `errorResponse`, `successResponse`

## Files to Create/Edit

| File | Action |
|------|--------|
| `old-docs/DSS-ML.md` | **CREATE** — Full documentation |

