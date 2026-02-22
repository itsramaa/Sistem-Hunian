

# Full Implementation Alignment: System Architecture + Backend + Security + Deployment + API Spec

## Gap Analysis Summary

After cross-referencing all 5 documentation files against the actual codebase, the following gaps were identified:

| Area | Documented | Implemented | Gap |
|------|-----------|-------------|-----|
| Edge Functions | 43 (31 core + 12 DSS) | 36 (31 core + 4 OCR + 1 extra) | **8 missing** (4 ML + 4 DSS Advisors) |
| config.toml verify_jwt | 4 functions = false | 9 functions = false | **5 OCR/RLS incorrectly set** |
| Secrets | 9 documented (incl ADMIN_SETUP_SECRET) | 4 configured (+ 5 auto-provisioned) | **ADMIN_SETUP_SECRET missing** |
| Frontend DSS hooks | ML + DSS advisor invocation hooks needed | Only OCR/health/RLS hooks exist | **8 hooks missing** |
| DSS feature modules | dss-ocr, dss-ml, dss-advisor (or unified dss/) | Single dss/ module | Structure OK, content gaps |

## Implementation Plan (22 Steps)

### Phase 1: Security Fixes (config.toml + Secret)

**Step 1:** Fix `supabase/config.toml` -- remove OCR functions from `verify_jwt = false`

The OCR functions already authenticate internally via `authenticateUser()`, and the docs specify only 4 functions should have `verify_jwt = false`. Remove these entries so they default to `true`:
- `ocr-ktp-extract`
- `ocr-payment-proof`
- `ocr-business-document`
- `ocr-maintenance-receipt`

Keep `log-rls-access` as `verify_jwt = false` (system utility function).

Result: config.toml matches security-architecture.md Section 8.2 (only 4 public functions).

**Step 2:** Request `ADMIN_SETUP_SECRET` -- documented in security-architecture.md Section 6.4 and Section 12.2 but not configured. Use `add_secret` tool.

---

### Phase 2: ML Predictive Analytics Edge Functions (4 functions)

All 4 ML functions follow the same pattern from `backend-architecture.md` Section 13 and `api-specification.md` Section 4.11:
1. Authenticate user via JWT
2. Verify merchant subscription tier
3. Aggregate historical data from database
4. Send context to Gemini 2.5 Pro via Lovable AI Gateway with tool calling
5. Store result in `ml_model_runs` (immutable audit)
6. Cache results where applicable
7. Return structured prediction

**Step 3:** Create `supabase/functions/ml-revenue-forecast/index.ts`
- Aggregates: 12 months payments, occupancy trends, contract renewals
- Output: Monthly predicted revenue with confidence intervals (3/6/12 month)
- Tier gate: Professional + Enterprise
- Tool calling schema: `forecast_revenue` with monthly predictions array

**Step 4:** Create `supabase/functions/ml-tenant-risk-score/index.ts`
- Aggregates: Payment history (late ratio), overdue count, contract compliance, collections
- Output: Score 0-100, risk_level, factors, recommended_actions
- Tier gate: Professional + Enterprise
- Side effects: Upsert `tenant_risk_scores`, notify merchant if score >= 76 (critical)
- Supports single tenant + batch (all merchant tenants)

**Step 5:** Create `supabase/functions/ml-churn-prediction/index.ts`
- Aggregates: Payment delay trends, maintenance complaints, contract end proximity, move-out notices
- Output: Churn probability 0-1, risk factors, retention suggestions per tenant
- Tier gate: Enterprise only
- Trigger: Probability > 0.6 creates merchant notification

**Step 6:** Create `supabase/functions/ml-optimal-pricing/index.ts`
- Aggregates: Unit amenities, location, occupancy history, comparable units, historical rent
- Output: Current vs suggested price, price range, justification, market comparison per unit
- Tier gate: Enterprise only

---

### Phase 3: DSS AI Advisor Edge Functions (4 functions)

All 4 DSS Advisors follow the pattern from `backend-architecture.md` Section 14 and `api-specification.md` Section 4.12. They combine ML outputs + business context and generate actionable recommendations stored in `dss_recommendations`.

**Step 7:** Create `supabase/functions/dss-pricing-advisor/index.ts`
- Combines: `ml-optimal-pricing` output + occupancy trends + market context
- Output: Strategic pricing advice, per-unit recommendations with expected revenue impact
- Tier gate: Enterprise only
- Side effect: Creates `dss_recommendations` with `type = 'pricing'`

**Step 8:** Create `supabase/functions/dss-collection-strategy/index.ts`
- Combines: Risk score + payment history + escalation data
- Output: Per-tenant collection approach, timing, channel, message templates
- Tier gate: Enterprise only
- Side effect: Creates `dss_recommendations` with `type = 'collection'`

**Step 9:** Create `supabase/functions/dss-maintenance-priority/index.ts`
- Combines: Open requests + tenant satisfaction impact + unit revenue impact
- Output: Prioritized maintenance queue with impact analysis and vendor suggestions
- Tier gate: Enterprise only (Professional for basic priority)
- Side effect: Creates `dss_recommendations` with `type = 'maintenance'`

**Step 10:** Create `supabase/functions/dss-investment-insight/index.ts`
- Combines: P&L per property + occupancy trends + maintenance costs
- Output: ROI analysis, improvement suggestions with payback period
- Tier gate: Enterprise only
- Side effect: Creates `dss_recommendations` with `type = 'investment'`

---

### Phase 4: Frontend Hooks for ML + DSS (Service + Hook layer)

**Step 11:** Create `src/features/dss/services/mlService.ts`
- `invokeRevenueForcast(merchantId, forecastMonths, propertyId?)`
- `invokeTenantRiskScore(tenantUserId?, merchantId?)`
- `invokeChurnPrediction(merchantId, windowMonths)`
- `invokeOptimalPricing(propertyId)`
- All use `supabase.functions.invoke()` pattern

**Step 12:** Create `src/features/dss/services/dssAdvisorService.ts`
- `invokePricingAdvisor(propertyId, context?)`
- `invokeCollectionStrategy(tenantUserId)`
- `invokeMaintenancePriority(merchantId)`
- `invokeInvestmentInsight(propertyId)`
- All use `supabase.functions.invoke()` pattern

**Step 13:** Create `src/features/dss/hooks/useMlAnalytics.ts`
- `useRevenueForcast(merchantId, months)` -- React Query mutation
- `useTenantRiskScores(merchantId)` -- query cached scores from `tenant_risk_scores`
- `useRefreshRiskScore(tenantUserId)` -- mutation to trigger recalculation
- `useChurnPrediction(merchantId)` -- mutation
- `useOptimalPricing(propertyId)` -- mutation

**Step 14:** Create `src/features/dss/hooks/useDssAdvisors.ts`
- `usePricingAdvisor()` -- mutation
- `useCollectionStrategy()` -- mutation
- `useMaintenancePriority()` -- mutation
- `useInvestmentInsight()` -- mutation
- `useDssRecommendations(merchantId, type?)` -- query from `dss_recommendations`
- `useUpdateRecommendation()` -- mutation for accept/dismiss

---

### Phase 5: Frontend Pages for ML + DSS Dashboards

**Step 15:** Create `src/pages/merchant/MlAnalytics.tsx`
- Revenue Forecast section: chart (LineChart with confidence interval area), trigger button, last run info
- Tenant Risk Scores section: table with scores, risk level badges, refresh button
- Churn Prediction section: tenant list with churn probability, retention suggestions
- Optimal Pricing section: per-unit comparison table (current vs suggested)
- Tier-gated sections using `useMerchantTier` hook

**Step 16:** Create `src/pages/merchant/DssAdvisor.tsx`
- Tab-based UI: Pricing / Collection / Maintenance / Investment
- Each tab shows:
  - "Generate" button to invoke the advisor
  - List of past recommendations from `dss_recommendations`
  - Accept/Dismiss actions per recommendation
  - Status badges (pending, accepted, dismissed, expired)
- Tier-gated per advisor type

**Step 17:** Add routes and navigation
- Add `/merchant/ml-analytics` route in `App.tsx`
- Add `/merchant/dss-advisor` route in `App.tsx`
- Add navigation items in `navigation-config.ts` under Merchant menu group "DSS Intelligence"

---

### Phase 6: Update Shared DSS Utils

**Step 18:** Update `supabase/functions/_shared/dss-utils.ts`
- Add `callLovableAIText()` helper for text-only context (ML/DSS functions don't need image_url)
- Add `createDssRecommendation()` helper to insert into `dss_recommendations`
- Add `upsertRiskScore()` helper to upsert `tenant_risk_scores`
- Add `aggregatePaymentHistory()`, `aggregateOccupancyData()`, `aggregateMaintenanceData()` data aggregation helpers

---

### Phase 7: Deploy and Update Docs Alignment

**Step 19:** Deploy all 8 new edge functions

**Step 20:** Update `src/features/dss/components/index.ts` -- add exports for any new components

**Step 21:** Verify all 43 edge functions are present and deployed

**Step 22:** Final checklist verification against all 5 docs

---

## Alignment Verification Matrix

| Doc | Section | Gap | Fixed By |
|-----|---------|-----|----------|
| system-architecture.md | 1.2 Scope: "12 DSS Edge Functions" | Only 4 OCR exist | Steps 3-10 |
| system-architecture.md | 7.1: 43 functions listed | 36 exist | Steps 3-10 |
| backend-architecture.md | 13: ML Predictive Analytics | 0 of 4 ML functions | Steps 3-6 |
| backend-architecture.md | 14: AI Decision Support | 0 of 4 DSS functions | Steps 7-10 |
| backend-architecture.md | 14.4: DSS Feature Gating | Tier limits defined in docs | Steps 3-10 (TIER_LIMITS) |
| security-architecture.md | 8.2: only 4 verify_jwt=false | 9 currently set | Step 1 |
| security-architecture.md | 6.4: ADMIN_SETUP_SECRET | Not in secrets | Step 2 |
| security-architecture.md | 9.6: Tier-Gated DSS Access | OCR has it, ML/DSS missing | Steps 3-10 |
| deployment-infrastructure.md | 6.2: 43 functions | 36 deployed | Steps 3-10, 19 |
| deployment-infrastructure.md | 10.2: 14 cron jobs incl DSS | ml-daily-risk-scoring, ml-weekly-forecast missing | Steps 4, 3 (cron support) |
| api-specification.md | 4.11: ML endpoints | Not implemented | Steps 3-6 |
| api-specification.md | 4.12: DSS endpoints | Not implemented | Steps 7-10 |

## Technical Notes

- All 8 new functions reuse the existing `_shared/dss-utils.ts` infrastructure (auth, tier checking, AI gateway, model run logging)
- The `callLovableAI` helper already supports text-only mode (just pass text content without image_url)
- DSS Advisor functions will internally call the database for context (not call ML functions as sub-invocations) to avoid cascading edge function calls
- Tier limits follow the exact matrix from `backend-architecture.md` Section 14.4
- All functions produce `ml_model_runs` audit records (immutable)
- DSS Advisor functions additionally create `dss_recommendations` records

## Estimated Scope

- 8 new edge function files (~200-350 lines each)
- 1 shared utils update (~100 lines added)
- 4 new frontend files (2 services, 2 hooks)
- 2 new pages
- 2 file updates (App.tsx, navigation-config.ts)
- 1 config fix (config.toml)
- 1 secret request (ADMIN_SETUP_SECRET)

