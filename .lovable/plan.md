
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

### Phase 2 Details

#### 2.2 Waiting List
- State machine: `WAITING_LIST_TRANSITIONS` (interested→applied→offered→accepted/rejected)
- Service: `waitingListService.ts` (CRUD + sendOffer)
- Hook: `useWaitingList.ts` (queries + mutations)
- UI: `WaitingListTable`, `AddApplicantDialog`, `SendOfferDialog`
- Nav: "Daftar Tunggu" under Operasional

#### 2.3 Lease Renewal
- DB: `contract_amendments` table with RLS
- Edge: `send-renewal-alert` (60/30/7 day alerts)
- Cron: Daily 04:00 UTC
- State machine: `AMENDMENT_STATUS_TRANSITIONS`
- Service: `renewalService.ts` (alerts, amendments CRUD)
- UI: `RenewalAlertsList`, `CreateAmendmentDialog`
- Nav: linked via /merchant/lease-renewals

#### 2.4 Collections Cases
- Service: `collectionsCaseService.ts` (cases CRUD, payment plan creation)
- Hook: `useCollectionsCases.ts`
- UI: `CollectionsCasesList`, `CollectionsReportWidgets`
- Collections page now has 3 tabs: Dashboard, Kasus, Laporan

## Next Phase
- Phase 3: Intelligence & Optimization (Pricing, Forecasting, ROI, Financial Reports, Multi-Property)
