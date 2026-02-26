

# Update merchant_sequence_diagram.md with All New Systems

## Overview
The current document covers 16 sequence diagrams (Registration through Suspend/Reactivate) plus 3 appendices. Phases 1-4 added 9 new subsystems that need their own sequence diagrams, plus updates to the Table of Contents, Appendix A (Edge Function Map), Appendix B (Cross-Diagram References), and Appendix C (Interaction Summary).

## New Sequence Diagrams to Add

### 17. Payment Reconciliation (Auto-Match)
- Actors: Merchant, reconciliationService, EF: auto-match-payment, Database
- Flows: Fetch unmatched payments, trigger auto-match (Tier 1 exact / Tier 2 partial / Tier 3 manual review), manual match by merchant, match history
- Source: `reconciliationService.ts`, `auto-match-payment/index.ts`

### 18. Automated Payment Reminders & Escalation
- Actors: Cron Scheduler, EF: queue-payment-reminders, Database, Merchant, Tenant
- Flows: Daily cron finds overdue invoices, matches merchant reminder config schedule, checks for duplicate reminders, logs reminder, auto-creates collections case at T+15 days, escalates invoice to 'escalated' status
- Source: `queue-payment-reminders/index.ts`

### 19. Expense Tracking
- Actors: Merchant, expenseService, Database
- Flows: Fetch summary (this month vs last month, by category), create expense, list expenses, delete expense
- Source: `expenseService.ts`

### 20. Waiting List & Applicant Management
- Actors: Merchant, waitingListService, Database
- Flows: Add applicant (status='interested'), update status via state machine (WAITING_LIST_TRANSITIONS), send offer (sets unit_id, offer_expires_at, transitions to 'offered'), filter by status/property
- Source: `waitingListService.ts`

### 21. Lease Renewal & Amendment
- Actors: Cron Scheduler, EF: send-renewal-alert, renewalService, Database, Merchant
- Flows: Daily cron checks contracts expiring in 60/30/7 days, creates alert records (deduplicated), merchant views alerts, creates amendment (draft), signs amendment, amendment history per contract
- State machine: AMENDMENT_STATUS_TRANSITIONS (draft -> sent -> signed)
- Source: `renewalService.ts`, `send-renewal-alert/index.ts`

### 22. Collections Case Management (Extended)
- Actors: Merchant, collectionsCaseService, Database
- Flows: Fetch cases with invoice joins, update case status via COLLECTIONS_CASE_TRANSITIONS (initiated -> in_progress -> resolved), create payment plan (inserts into payment_plans table with installment calculation), set resolution type
- Source: `collectionsCaseService.ts`

### 23. Dynamic Pricing Rules
- Actors: Merchant, dynamicPricingService, Database
- Flows: CRUD for dynamic_pricing_rules (occupancy/seasonal/demand/duration/loyalty types), toggle active/inactive, priority ordering
- Source: `dynamicPricingService.ts`

### 24. Financial Reports (P&L)
- Actors: Merchant, financialReportService, Database
- Flows: Fetch paid invoices + expenses for N months, aggregate monthly P&L, group revenue by property, group expenses by category
- Source: `financialReportService.ts`

### 25. Admin Launch Readiness
- Actors: Admin, launchReadinessService, Database
- Flows: Fetch counts from merchants, properties, units, contracts, invoices, payments, feature_flags; compute readiness checks (18 items across 5 categories); calculate weighted readiness score; display go/no-go criteria
- Source: `launchReadinessService.ts`

## Updates to Existing Sections

### Table of Contents
Add entries 17-25 with anchor links.

### Appendix A: Edge Function Invocation Map
Add 3 new entries:
| Edge Function | Sequence | Type |
|---|---|---|
| `auto-match-payment` | 17. Reconciliation | `supabase.functions.invoke()` |
| `queue-payment-reminders` | 18. Payment Reminders | Cron (daily 03:00 UTC) |
| `send-renewal-alert` | 21. Lease Renewal | Cron (daily 04:00 UTC) |

### Appendix B: Cross-Diagram References
Add connections:
- S7 (Invoice) -> S17 (Reconciliation): Paid payment triggers auto-match
- S17 -> S7: Auto-match updates invoice status
- S18 -> S13 (Collections): Auto-creates collections case at T+15
- S18 -> S7: Escalates invoice status
- S21 -> S5 (Contract): Amendment modifies contract terms
- S22 -> S7: Case resolution links to invoice payment
- S23 -> S4 (Property): Pricing rules reference properties
- S24 -> S7 + S19: Aggregates invoices + expenses

### Appendix C: Interaction Summary Table
Add 9 new rows with DB writes, notifications, edge functions, and external API counts.

## Technical Details

### File Modified
- `old-docs/merchant_sequence_diagram.md` — full rewrite with all 25 sequences + updated appendices

### Execution
1. Update Table of Contents (lines 13-30) to add entries 17-25
2. Append 9 new sequence diagram sections after section 16
3. Rewrite Appendix A with 3 new edge function entries
4. Rewrite Appendix B with new cross-references
5. Rewrite Appendix C with 9 new summary rows

