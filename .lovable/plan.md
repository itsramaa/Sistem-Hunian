

# Update merchant_activity_diagram.md with All New Systems

## Overview
The current document has 14 activity diagrams (Onboarding through Support/Compliance) plus 3 appendices. Phases 1-4 added 9 new subsystems that need their own activity diagrams. The document will be updated from 14 to 23 diagrams, plus updated appendices.

## New Activity Diagrams to Add

### 15. Payment Reconciliation (Auto-Match)
- Flowchart: Payment recorded -> check reconciliation_status -> Tier 1 (exact match: amount + tenant + date) -> Tier 2 (partial match: amount only) -> Tier 3 (manual review) -> merchant manual match -> update invoice status
- State references: reconciliation_status values (unmatched, pending_review, auto_matched, manually_matched)
- Source: `reconciliationService.ts`, `auto-match-payment` EF

### 16. Automated Payment Reminders & Escalation
- Flowchart: Cron daily -> scan overdue invoices -> group by merchant -> check reminder config -> match schedule by days_overdue -> deduplicate -> log reminder -> auto-create collections case at T+15 -> escalate invoice status
- Source: `queue-payment-reminders/index.ts`

### 17. Expense Tracking
- Flowchart: Merchant add expense -> set category/amount/date -> save -> summary view (this month vs last, by category, trend %) -> delete expense
- Source: `expenseService.ts`

### 18. Waiting List & Applicant Management
- Flowchart covering WAITING_LIST_TRANSITIONS state machine: interested -> applied -> offered -> accepted/rejected, with sendOffer sub-flow (set unit_id, offer_expires_at), filter by status/property
- Source: `waitingListService.ts`

### 19. Lease Renewal & Amendment
- Flowchart: Cron daily -> check contracts expiring in 60/30/7 days -> create deduplicated alerts -> merchant views alerts -> create amendment (draft) -> send -> sign -> update contract
- State machine: AMENDMENT_STATUS_TRANSITIONS (draft -> sent -> signed)
- Source: `renewalService.ts`, `send-renewal-alert/index.ts`

### 20. Collections Case Management (Extended)
- Flowchart: Overdue invoice -> create case (initiated) -> contact tenant (in_progress) -> strategy (payment plan / escalate / write-off / eviction) -> resolved
- Sub-flow: Create payment plan with installment calculation
- Source: `collectionsCaseService.ts`

### 21. Dynamic Pricing Rules
- Flowchart: Merchant CRUD pricing rules -> select type (occupancy/seasonal/demand/duration/loyalty) -> set adjustment (% or fixed) -> set conditions/priority -> toggle active/inactive
- Source: `dynamicPricingService.ts`

### 22. Financial Reports (P&L)
- Flowchart: Select period (N months) -> fetch paid invoices + expenses -> aggregate monthly P&L -> group revenue by property -> group expenses by category -> display charts
- Source: `financialReportService.ts`

### 23. Admin Launch Readiness
- Flowchart: Admin opens dashboard -> fetch all system counts -> compute 18 readiness checks across 5 categories -> calculate weighted score -> display go/no-go criteria
- Source: `launchReadinessService.ts`

## Updates to Existing Sections

### Table of Contents
Add entries 15-23 with anchor links.

### Existing Diagram 6 (Invoice)
Add `escalated` status to the Invoice state machine table (already in code: `overdue -> escalated`).

### Existing Diagram 11 (Collections)
Add cross-reference to new Diagram 20 (extended case management) and Diagram 16 (auto-reminders).

### Lampiran: Cross-Reference Matrix
Add connections:
- D7 (Payment) -> D15 (Reconciliation): Payment triggers auto-match
- D15 -> D6 (Invoice): Match updates invoice status
- D16 (Reminders) -> D11/D20 (Collections): Auto-creates case at T+15
- D16 -> D6: Escalates invoice status
- D19 (Renewal) -> D4 (Contract): Amendment modifies contract
- D20 (Collections Extended) -> D6B (Payment Plan): Creates plans
- D21 (Pricing) -> D3 (Property): Rules reference properties
- D22 (Financial) -> D6 + D17: Aggregates invoices + expenses
- D23 (Launch) -> All: Reads all system tables

### Lampiran: Edge Functions Summary
Add 3 new entries:
| `auto-match-payment` | Reconciliation | 15 |
| `queue-payment-reminders` | Reminders | 16 |
| `send-renewal-alert` | Lease Renewal | 19 |

### Lampiran: State Machines Summary
Add 2 new entries:
| Waiting List | `WAITING_LIST_TRANSITIONS` | 18 |
| Contract Amendment | `AMENDMENT_STATUS_TRANSITIONS` | 19 |

## Technical Details

### File Modified
- `old-docs/merchant_activity_diagram.md` -- full update with all 23 diagrams + updated appendices

### Execution Order
1. Update Table of Contents (add entries 15-23)
2. Update Diagram 6 Invoice state machine table to include `escalated` status
3. Append 9 new activity diagram sections after section 14
4. Rewrite Cross-Reference Matrix with new connections
5. Rewrite Edge Functions Summary with 3 new entries
6. Rewrite State Machines Summary with 2 new entries

