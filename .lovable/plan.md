
# Implementation Plan — Status Dashboard

## Phase 0: Foundation — ✅ COMPLETE
All 7 DB tables, verification tiers, invoice state machine updates.

## Phase 1: Critical Adoption Fixes — ✅ COMPLETE
| Step | Feature | Status |
|------|---------|--------|
| 1.1 | Collections Dashboard | ✅ |
| 1.2 | Payment Reconciliation | ✅ |
| 1.3 | Payment Reminders & Escalation | ✅ |
| 1.4 | Expense Tracking | ✅ |
| 1.5 | Tenant Profile Consolidation | ✅ |

## Phase 2: Core Operations — ✅ COMPLETE
| Step | Feature | Status | Notes |
|------|---------|--------|-------|
| 2.1 | Tenant Portal | ⏭️ SKIP | Already exists (18 pages) |
| 2.2 | Waiting List & Applicant Mgmt | ✅ | State machine, service, hook, UI (table, add dialog, offer dialog), route /merchant/waiting-list |
| 2.3 | Lease Renewal & Amendment | ✅ | contract_amendments table, send-renewal-alert edge fn, cron 04:00 UTC, service, hook, UI, route /merchant/lease-renewals |
| 2.4 | Collections Case Management | ✅ | Service, hook, cases list, report widgets, Collections page extended with 3 tabs (Dashboard/Kasus/Laporan) |

## Phase 3: Intelligence & Optimization — ✅ COMPLETE
| Step | Feature | Status | Notes |
|------|---------|--------|-------|
| 3.1 | Feature Flags | ⏭️ SKIP | Already exists: DB table `feature_flags` + admin FeatureToggles UI in PlatformConfig |
| 3.2 | Dynamic Pricing Rules | ✅ | Service, hook, CRUD UI (table + create dialog), route /merchant/dynamic-pricing |
| 3.3 | Occupancy Forecasting | ⏭️ SKIP | Already exists: `occupancy_forecast` table, `ml-occupancy-forecast` edge fn, MarketIntelligence page Tab 4 |
| 3.4 | Financial Reports | ✅ | P&L service, hook, FinancialReports page with revenue/expense charts, route /merchant/financial-reports |
| 3.5 | Multi-Property Consolidation | ⏭️ SKIP | Already exists: ComparativePortfolio page with cross-property analysis |

### Phase 3 Details

#### 3.2 Dynamic Pricing Rules
- Service: `dynamicPricingService.ts` (CRUD + toggle)
- Hook: `useDynamicPricing.ts` (queries + mutations)
- UI: `PricingRulesTable`, `CreatePricingRuleDialog`
- Nav: "Harga Dinamis" under Keuangan

#### 3.4 Financial Reports
- Service: `financialReportService.ts` (aggregates invoices + expenses into monthly P&L)
- Hook: `useFinancialReports.ts`
- UI: Summary cards (Revenue, Expenses, Net Income, Margin) + 3 tabs (P&L trend, Revenue by Property pie, Expense by Category pie)
- Nav: "Lap. Keuangan" under Keuangan

## Next Phase
- Phase 4: Launch Preparation (Testing, QA, Status Updates)
