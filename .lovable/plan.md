

# Master Plan: Code Refactoring System Implementation

## Overview

Reset all "COMPLETE" statuses in MASTER_IMPLEMENTATION_PLAN.md (those were doc updates, not code), then create a new code-focused master plan based on a gap analysis between PMS_IMPLEMENTATION_CHECKLIST.md and the actual codebase.

## Gap Analysis Summary

After thorough codebase exploration, here's what already exists vs what needs building:

### Already Built (Can Skip or Verify Only)
| Feature | Evidence |
|---------|----------|
| All 6 AI/ML edge functions | `supabase/functions/dss-pricing-advisor/`, `ml-occupancy-forecast/`, etc. |
| Referral system | `src/features/referrals/` + 3 edge functions |
| Tenant portal (basic) | `src/pages/tenant/` (18 pages) |
| Payment plans | `payment_plans` table + `paymentPlanService.ts` |
| Collections cases | `collections_cases` table in DB |
| Tenant quality scoring | `TenantQualityScoring.tsx` + `tenantQualityService.ts` |
| DSS advisor pages | `DssAdvisor.tsx`, `MlAnalytics.tsx`, `MarketIntelligence.tsx` |
| Payment reminders | `send-payment-reminder` edge function |
| Vacancy tracking | `vacancy-tracking-cron` edge function |
| OCR (receipts, KTP, contracts) | 7+ OCR edge functions |
| Financial risk analytics | `FinancialRiskAnalytics.tsx` + service |

### Missing / Needs Building (Actual Work)
| Feature | Status |
|---------|--------|
| Verification tiers (Quick/Standard/Premium) | NOT EXISTS - only single-tier verification |
| `expenses` table (general operating expenses) | NOT EXISTS - only `maintenance_expenses` |
| `waiting_list` table + UI | NOT EXISTS |
| `lease_renewal_alerts` table + automation | NOT EXISTS |
| `dynamic_pricing_rules` table + UI | NOT EXISTS |
| `occupancy_forecast` table | NOT EXISTS (edge function exists, table missing) |
| `payment_reminders_log` table (audit trail) | NOT EXISTS |
| Collections Dashboard (aging buckets, drill-down) | NOT EXISTS as described |
| Auto payment reconciliation (smart matching) | NOT EXISTS |
| Expense tracking UI (entry, OCR, categorization) | NOT EXISTS |
| Waiting list & applicant management UI | NOT EXISTS |
| Lease renewal automation (60/30/7 day alerts) | NOT EXISTS |
| Multi-property consolidated dashboard | NOT EXISTS as described |
| Financial P&L reporting | PARTIAL (some analytics exist) |
| Feature-flag system for AI/ML gating | NOT EXISTS |
| A/B testing framework | NOT EXISTS |

## Implementation Plan

### Phase 0: Foundation (Reset + DB Schema + State Machines)

**Step 1: Reset MASTER_IMPLEMENTATION_PLAN.md**
- Replace all status checkmarks in the dashboard (lines 44-120) back to "NOT STARTED"
- Update all inline status markers throughout the document

**Step 2: Create Missing Database Tables**
Execute migrations for 7 missing tables:
1. `expenses` - general operating expenses with OCR support, categories, approval workflow
2. `waiting_list` - applicant queue with scoring, status tracking
3. `lease_renewal_alerts` - automated renewal tracking (60/30/7 day)
4. `dynamic_pricing_rules` - occupancy/seasonal/long-lease rules
5. `occupancy_forecast` - monthly predictions with confidence scores
6. `payment_reminders_log` - audit trail for all reminders sent
7. `feature_flags` - per-merchant, per-feature toggle system

Each table needs: proper indexes, RLS policies, and `updated_at` triggers.

**Step 3: Verification Tiers**
- Add `verification_tier` column to `merchants` table (text: 'quick', 'standard', 'premium')
- Update `handle_new_user()` trigger to set default tier = 'quick'
- Create Tier 1 onboarding flow (email + phone OTP, under 2 minutes)
- Update merchant verification UI to support 3-tier display

**Step 4: Invoice State Machine Update**
- Update `state-machines.ts` to add auto-transitions: ISSUED -> DUE -> OVERDUE -> ESCALATED
- Create edge function `auto-transition-invoices` for daily batch processing
- Remove manual VERIFYING status if present

### Phase 1: Critical Adoption Features

**Step 5: Collections Dashboard**
- Create `src/features/billing/components/CollectionsDashboard/` with:
  - Outstanding by age widget (color-coded buckets: <7d, 7-14d, 14-30d, 30+d)
  - Collections today widget (real-time)
  - Expected this week widget
  - Drill-down table (click bucket -> tenant list with actions)
- Create DB view `v_outstanding_summary` for performance
- Add to merchant dashboard or new route

**Step 6: Auto Payment Reconciliation**
- Create `src/features/payments/services/reconciliationService.ts`
- Implement 3-tier matching: exact match (auto), amount mismatch (suggest), manual review
- Create UI for unmatched payments review
- Edge function `auto-match-payment` for Tier 1 & 2 logic

**Step 7: Payment Reminders with Escalation**
- Create escalation schedule config (T+2 email, T+5 SMS, T+10 WhatsApp, T+15 collections case)
- Use existing `send-payment-reminder` edge function, extend with escalation logic
- Create `payment_reminders_log` entries for audit trail
- Auto-create collections case at T+15
- Merchant settings UI for reminder preferences

**Step 8: Expense Tracking**
- Create `src/features/billing/components/ExpenseTracking/` with:
  - Manual expense entry form (category, amount, date, payment method)
  - OCR receipt upload (using existing OCR infrastructure)
  - Expense dashboard widget (monthly total, category breakdown, trend)
  - Profit calculation: Net Profit = Collections - Expenses
- Connect to existing `ocr-maintenance-receipt` or create `ocr-expense-receipt`

**Step 9: Tenant Profile Consolidation**
- Enhance `src/pages/merchant/TenantDetail.tsx` with 5-tab layout:
  - Contract & Lease tab
  - Payment History tab (12-month chart, on-time %)
  - Maintenance tab (requests, cost, score)
  - Compliance tab (violations, disputes)
  - Quality Score tab (0-100, risk level, renewal recommendation)
- Use existing `tenantQualityService.ts`, ensure monthly batch calculation

### Phase 2: Core Operations

**Step 10: Waiting List & Applicant Management**
- Create `src/features/properties/components/WaitingList/` with:
  - Applicant form (name, phone, budget, preferred move-in, needs)
  - Status workflow: interested -> applied -> offered -> accepted/rejected
  - Auto-offer workflow when vacancy detected
  - Applicant quality scoring
- New merchant page route `/merchant/waiting-list`

**Step 11: Lease Renewal Automation**
- Create `src/features/contracts/services/renewalService.ts`
- Edge function `send-renewal-alert` with 60/30/7 day triggers
- Lease amendment workflow (generate document, e-sign, update contract)
- Create `contract_amendments` table for version control
- Dashboard notifications for upcoming renewals

**Step 12: Collections Case Management UI**
- Create UI for existing `collections_cases` table
- Case lifecycle: open -> investigation -> resolution
- Payment plan creation within case
- Collections reporting (daily/weekly/monthly performance)

### Phase 3: Intelligence & Optimization

**Step 13: Feature Flag System**
- Create `src/features/platform-config/services/featureFlagService.ts`
- Admin UI for toggling features per merchant
- Use `feature_flags` table for persistence
- Integrate with AI/ML edge functions for gated deployment

**Step 14: Dynamic Pricing Rules UI**
- Create UI for `dynamic_pricing_rules` table
- Rule types: occupancy-based, seasonal, long-lease discount
- Show recommended price when creating contracts
- Connect to existing `dss-pricing-advisor` edge function

**Step 15: Occupancy Forecasting UI**
- Create dashboard widgets for forecast visualization
- Connect to existing `ml-occupancy-forecast` edge function
- Store results in `occupancy_forecast` table
- Vacancy management automation (notify 30 days before predicted vacancy)

**Step 16: Financial Reporting**
- Monthly P&L statement (revenue - expenses = profit)
- Unit economics analysis (per-unit ROI ranking)
- Tax compliance report (PBB, PPh context)
- PDF export capability

**Step 17: Multi-Property Consolidation**
- Cross-property dashboard (all properties vs single)
- Consolidated metrics with per-property breakdown
- Bulk operations (batch invoice, bulk rent increase)

### Phase 4: Launch Preparation

**Step 18: Integration Testing & QA**
- End-to-end test critical flows
- Validate AI/ML pricing advisor with 10% merchants
- Verify referral MVP (flag OFF but functional)
- Performance testing (10k invoices, 1k payments/day)

**Step 19: Update MASTER_IMPLEMENTATION_PLAN.md Status**
- Mark each completed phase in status dashboard
- Document any deviations or decisions made

## Technical Considerations

- All new tables use UUID PKs, `timestamptz` for temporal data, `numeric` for money
- RLS policies required for all new tables (merchant-scoped access)
- Follow existing feature module pattern: `src/features/[domain]/`
- No modifications to auto-generated files (`client.ts`, `types.ts`, `.env`)
- Edge functions deploy automatically
- Validation triggers instead of CHECK constraints for time-based rules

## Execution Approach

This is approximately **18 weeks of development work** compressed into the checklist. Each step above maps to 1-2 weeks of real work. Implementation will proceed in strict waterfall order (Phase 0 -> 1 -> 2 -> 3 -> 4), starting with Phase 0 database foundations.

**First action after approval**: Reset MASTER_IMPLEMENTATION_PLAN.md statuses, then start Phase 0 Step 2 (create missing DB tables).

