

# Phase 2: Core Operations Implementation Plan

## Progress Tracker

| Step | Feature | Status | Notes |
|------|---------|--------|-------|
| 2.1 | Tenant Portal | ⏭️ SKIP | Already exists: 18 pages (Dashboard, Payments, Invoices, Maintenance, Contracts, Orders, Forum, Marketplace, Profile, etc.) with payment proof upload, Xendit integration, maintenance requests. Covers all checklist requirements. |
| 2.2 | Waiting List & Applicant Management | ⏳ NOT STARTED | DB table exists, needs service/hook/UI/route |
| 2.3 | Lease Renewal & Amendment | ⏳ NOT STARTED | `lease_renewal_alerts` table exists, needs `contract_amendments` table + edge function + UI |
| 2.4 | Collections Case Management | ⏳ NOT STARTED | `collections_cases` table exists, `payment_plans` table exists, needs UI + reporting |

---

## Step 2.1: Tenant Portal — SKIP

**Reason**: The tenant portal is already fully built with 18 pages covering:
- Dashboard with next-due invoice, quick actions
- Invoices & Payments with Xendit integration, proof upload, payment history
- Maintenance requests with create, track, cancel, photo upload
- Contracts with signing flow
- Forum, Marketplace, Orders, Referrals, Profile, Settings, Notifications

All checklist items (2.1.1 through 2.1.3) are satisfied by existing code.

---

## Step 2.2: Waiting List & Applicant Management

### 2.2a. Service Layer
Create `src/features/waiting-list/services/waitingListService.ts`:
- `fetchApplicants(merchantId, filters?)` - list with status/property filters
- `addApplicant(payload)` - create new applicant entry
- `updateApplicantStatus(id, status)` - transition status (interested -> applied -> offered -> accepted/rejected)
- `sendOffer(applicantId, unitId, terms)` - generate and send offer
- `getTopCandidates(unitId, limit)` - ranked by quality score (date_match * 0.4 + budget_match * 0.3 + reliability * 0.3)

### 2.2b. Hook Layer
Create `src/features/waiting-list/hooks/useWaitingList.ts`:
- `useMerchantWaitingList(merchantId)` - React Query for applicant list
- `useAddApplicant()` - mutation
- `useUpdateApplicantStatus()` - mutation with state machine validation
- `useSendOffer()` - mutation
- `useTopCandidates(unitId)` - query for vacancy matching

### 2.2c. Types
Create `src/features/waiting-list/types/index.ts`:
- `WaitingListApplicant` interface matching DB schema
- `ApplicantStatus` type union
- `CreateApplicantPayload`, `SendOfferPayload`

### 2.2d. State Machine
Add `WAITING_LIST_TRANSITIONS` to `state-machines.ts`:
```
interested -> applied, rejected
applied -> offered, rejected, waitlisted
offered -> accepted, rejected
waitlisted -> offered, rejected
accepted -> [] (terminal)
rejected -> [] (terminal)
```

### 2.2e. UI Components
Create `src/features/waiting-list/components/`:
1. **WaitingListTable.tsx** - Main table with columns: Name, Phone, Budget, Preferred Date, Status, Score, Actions
2. **AddApplicantDialog.tsx** - Form: name, phone, email, budget, preferred move-in, occupant type, needs
3. **SendOfferDialog.tsx** - Select unit, set terms (rent, duration, move-in date), preview & send
4. **ApplicantDetailDialog.tsx** - Full applicant info + action buttons

### 2.2f. Page & Route
- Create `src/pages/merchant/WaitingList.tsx` - main page with filters (by property, by status)
- Add lazy import + route `/merchant/waiting-list` in `App.tsx`
- Add nav item under "Operasional" group in `navigation-config.ts` (icon: `ClipboardList` or `Users`)

---

## Step 2.3: Lease Renewal & Amendment

### 2.3a. Database Migration
Create `contract_amendments` table:
- `id` UUID PK
- `contract_id` UUID FK -> contracts
- `merchant_id` UUID FK -> merchants
- `amendment_type` text (rent_adjustment, lease_extension, term_modification)
- `old_values` JSONB
- `new_values` JSONB
- `status` text (draft, sent, signed, rejected)
- `signed_at` timestamptz
- `created_at`, `updated_at` timestamptz

Add indexes on `lease_renewal_alerts(merchant_id, contract_id)` and `contract_amendments(contract_id)`.

### 2.3b. Edge Function
Create `supabase/functions/send-renewal-alert/index.ts`:
- Query contracts expiring in 60, 30, 7 days
- Check if alert already sent (avoid duplicates via `lease_renewal_alerts`)
- Create alert records
- Trigger notification (email via Resend)
- Include tenant quality score in 60-day alert

### 2.3c. Cron Job
Add daily cron (04:00 UTC) in `supabase/config.toml` for `send-renewal-alert`.

### 2.3d. Service & Hook
Create `src/features/contracts/services/renewalService.ts`:
- `fetchRenewalAlerts(merchantId)` - upcoming renewals with tenant info
- `createAmendment(payload)` - generate amendment
- `signAmendment(amendmentId)` - mark as signed, update contract
- `getContractAmendments(contractId)` - version history

Create `src/features/contracts/hooks/useLeaseRenewal.ts`:
- `useRenewalAlerts(merchantId)` - query
- `useCreateAmendment()` - mutation
- `useSignAmendment()` - mutation

### 2.3e. State Machine
Add `AMENDMENT_STATUS_TRANSITIONS` to `state-machines.ts`:
```
draft -> sent, cancelled
sent -> signed, rejected
signed -> [] (terminal)
rejected -> [] (terminal)
cancelled -> [] (terminal)
```

### 2.3f. UI Components
Create `src/features/contracts/components/renewal/`:
1. **RenewalAlertsWidget.tsx** - Dashboard widget showing upcoming expirations (color-coded by urgency)
2. **RenewalAlertsList.tsx** - Full list with tenant quality score + recommended action
3. **CreateAmendmentDialog.tsx** - Form: amendment type, new terms, effective date
4. **AmendmentHistoryTable.tsx** - Version control display for a contract

### 2.3g. Page & Route
- Create `src/pages/merchant/LeaseRenewals.tsx`
- Add route `/merchant/lease-renewals` in `App.tsx`
- Add nav item under "Operasional" group

---

## Step 2.4: Collections Case Management

### 2.4a. Service Layer
Create `src/features/collections/services/collectionsCaseService.ts`:
- `fetchCases(merchantId, filters?)` - list cases with tenant/invoice info
- `getCaseDetail(caseId)` - full case with timeline
- `updateCaseStatus(caseId, status, resolution?)` - status transitions
- `createPaymentPlanFromCase(caseId, planPayload)` - link payment plan to case

### 2.4b. Hook Layer
Create `src/features/collections/hooks/useCollectionsCases.ts`:
- `useMerchantCollectionsCases(merchantId)` - query
- `useCollectionsCaseDetail(caseId)` - query
- `useUpdateCaseStatus()` - mutation
- `useCreateCasePaymentPlan()` - mutation

### 2.4c. UI Components
Create `src/features/collections/components/cases/`:
1. **CollectionsCasesList.tsx** - Table: Case#, Tenant, Invoice, Amount, Status, Days Open, Actions
2. **CaseDetailDialog.tsx** - Full case view: tenant profile summary, invoice info, payment history, action buttons (resolve, create payment plan, write-off)
3. **CreatePaymentPlanDialog.tsx** - Form: installment count, frequency, amounts, start date, terms
4. **CollectionsReportWidgets.tsx** - 3 report widgets: daily performance, per-tenant rate, case breakdown

### 2.4d. Page Integration
- Extend existing `src/pages/merchant/Collections.tsx` with a Tabs layout:
  - Tab 1: "Dashboard" (existing aging buckets + summary)
  - Tab 2: "Kasus" (collections cases list)
  - Tab 3: "Laporan" (collections reporting)

---

## Files to Create/Modify Summary

| Action | File |
|--------|------|
| Create | `src/features/waiting-list/types/index.ts` |
| Create | `src/features/waiting-list/services/waitingListService.ts` |
| Create | `src/features/waiting-list/hooks/useWaitingList.ts` |
| Create | `src/features/waiting-list/components/WaitingListTable.tsx` |
| Create | `src/features/waiting-list/components/AddApplicantDialog.tsx` |
| Create | `src/features/waiting-list/components/SendOfferDialog.tsx` |
| Create | `src/pages/merchant/WaitingList.tsx` |
| Migration | `contract_amendments` table + indexes |
| Create | `supabase/functions/send-renewal-alert/index.ts` |
| Create | `src/features/contracts/services/renewalService.ts` |
| Create | `src/features/contracts/hooks/useLeaseRenewal.ts` |
| Create | `src/features/contracts/components/renewal/RenewalAlertsWidget.tsx` |
| Create | `src/features/contracts/components/renewal/RenewalAlertsList.tsx` |
| Create | `src/features/contracts/components/renewal/CreateAmendmentDialog.tsx` |
| Create | `src/pages/merchant/LeaseRenewals.tsx` |
| Create | `src/features/collections/services/collectionsCaseService.ts` |
| Create | `src/features/collections/hooks/useCollectionsCases.ts` |
| Create | `src/features/collections/components/cases/CollectionsCasesList.tsx` |
| Create | `src/features/collections/components/cases/CaseDetailDialog.tsx` |
| Create | `src/features/collections/components/cases/CreatePaymentPlanDialog.tsx` |
| Create | `src/features/collections/components/cases/CollectionsReportWidgets.tsx` |
| Edit | `src/pages/merchant/Collections.tsx` (add tabs for cases + reports) |
| Edit | `src/shared/constants/state-machines.ts` (add 2 new state machines) |
| Edit | `src/App.tsx` (add 2 routes) |
| Edit | `src/shared/components/layouts/navigation-config.ts` (add 2 nav items) |
| Edit | `supabase/config.toml` (add cron for renewal alerts) |
| Edit | `.lovable/plan.md` (update status) |

## Execution Order (Waterfall Strict)
1. Step 2.2: Waiting List (state machine -> types -> service -> hook -> UI -> route)
2. Step 2.3: Lease Renewal (migration -> edge function -> cron -> service -> hook -> UI -> route)
3. Step 2.4: Collections Cases (service -> hook -> UI -> extend Collections page)
4. Update `.lovable/plan.md` status dashboard

