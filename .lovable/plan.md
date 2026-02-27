

# Maximize User Journeys in merchant_activity_diagram.md

## Overview
After cross-referencing all 23 sections against actual source code (`services/*.ts`, `state-machines.ts`, edge functions), I found several discrepancies where the documentation doesn't match the real system. This update will fix inaccuracies and enrich user journey narratives with actual code behavior.

## Discrepancies Found & Fixes

### Section 18: Waiting List -- Missing `waitlisted` State
**Problem**: The current diagram and state machine table show only `interested -> applied -> offered -> accepted/rejected`. But `WAITING_LIST_TRANSITIONS` in code also has a `waitlisted` state: `applied -> waitlisted`, `waitlisted -> offered/rejected`.
**Fix**: Add `waitlisted` node in the flowchart between `applied` and `offered`, update the state machine table, and update the user journey narrative to describe the waitlisting scenario.

### Section 19: Amendment -- Missing `cancelled` and `rejected` States
**Problem**: The diagram shows only `draft -> sent -> signed`. But `AMENDMENT_STATUS_TRANSITIONS` in code has: `draft -> sent/cancelled`, `sent -> signed/rejected`, plus `rejected` and `cancelled` as terminal states.
**Fix**: Add `cancelled` and `rejected` branches in the flowchart, update the state machine reference table, and update user journey to describe rejection and cancellation scenarios.

### Section 11: Collections -- Missing Aging Analytics
**Problem**: The diagram references `check-overdue-escalation` EF and DSS strategy but doesn't mention `collectionsService.ts` which provides aging bucket summaries via `v_outstanding_summary` view, collection rate calculations, and outstanding invoice drill-down.
**Fix**: Add a sub-flow or subgraph for "Collections Analytics Dashboard" showing aging buckets (Current, 1-30, 31-60, 61-90, 90+), collection rate %, and outstanding drill-down. Update user journey to describe the merchant's analytics experience.

### Section 15: Reconciliation -- Missing Suggested Invoices Detail
**Problem**: The diagram shows auto-match tiers but doesn't detail that `reconciliationService.fetchUnmatchedPayments` enriches each payment with `suggestedInvoices` (up to 3 matching invoices by tenant + contract).
**Fix**: Add suggested invoices detail in the manual review flow and update user journey to mention the merchant sees suggested matches.

### Section 22: Financial Reports -- Verify Data Source Fields  
**Problem**: The diagram says it fetches `paid invoices` but `financialReportService.ts` specifically selects `amount, paid_at, property_id` from invoices (uses `amount` not `total_amount`). Also groups revenue by property using `properties` name mapping.
**Fix**: Update the technical reference to accurately reflect the fields used.

### Lampiran: State Machines Summary
**Problem**: Missing `waitlisted` in waiting list states, missing `cancelled`/`rejected` in amendment states.
**Fix**: Update both entries to reflect actual code.

## Enhanced User Journey Narratives

For each section, I will review and strengthen the "Perjalanan Pengguna" paragraph to:
- Describe the **complete** end-to-end flow the user actually experiences
- Reference actual service method names and UI actions
- Mention error/fallback paths that exist in code (e.g., `renewalService.fetchAlerts` has a fallback query when `lease_renewal_alerts` table fails)

## Specific Edits

### Files Modified
- `old-docs/merchant_activity_diagram.md`

### Execution Order
1. Fix Section 18 Waiting List: add `waitlisted` state to diagram, state machine table, and narrative
2. Fix Section 19 Amendment: add `cancelled`/`rejected` states to diagram, state machine table, and narrative
3. Fix Section 11 Collections: add aging analytics subgraph and updated narrative referencing `collectionsService.ts` and `v_outstanding_summary`
4. Fix Section 15 Reconciliation: add suggested invoices detail in manual review flow
5. Fix Section 22 Financial Reports: correct field references in technical details
6. Update Lampiran State Machines Summary with correct transitions
7. Review and strengthen all 23 "Perjalanan Pengguna" narratives for accuracy against actual code

### What Will NOT Change
- No sections deleted
- No diagrams removed
- All existing role perspective tables preserved
- All appendices (Cross-Reference, Edge Functions) remain intact
- Collapsible `<details>` structure stays as-is
