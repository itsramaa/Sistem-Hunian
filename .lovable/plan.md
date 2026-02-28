

# Improvement 4: Inline Payment Matching on Collections Page

## Overview

Add inline payment matching capabilities to the OutstandingTable on the Collections page. Each overdue invoice row gets expanded quick actions and a "Process Payment" dialog that shows candidate unmatched payments ranked by match confidence, allowing one-click matching without navigating away.

## What Changes

### 1. New Component: `InlinePaymentMatchDialog.tsx`

**Location:** `src/features/collections/components/InlinePaymentMatchDialog.tsx`

A dialog triggered from each invoice row that:
- Shows invoice summary (number, amount, tenant, days overdue)
- Fetches candidate unmatched payments for the same tenant/contract using `reconciliationService` logic
- Displays top 3 candidates ranked by match score (exact match = 99%, close amount = 90%, partial = 70%)
- Each candidate has "Confirm Match" button that calls `reconciliationService.manualMatch()`
- Shows payment details: amount, date, method, reference, proof photo link
- After matching: shows success state, invalidates queries for real-time table update
- Alternative actions section: links to manual entry or payment plan (future)

### 2. New Hook: `useInvoiceCandidatePayments.ts`

**Location:** `src/features/collections/hooks/useInvoiceCandidatePayments.ts`

React Query hook that:
- Takes `invoiceId`, `tenantUserId`, `contractId`, `merchantId`, `invoiceAmount`
- Fetches unmatched/pending_review payments for the same tenant + contract
- Computes a simple match confidence score per payment:
  - Exact amount match = 0.99
  - Within 5% = 0.90
  - Within 20% = 0.70
  - Otherwise = 0.50
- Sorts by confidence descending, limits to top 5
- Returns typed `CandidatePayment[]`

### 3. Modified Component: `OutstandingTable.tsx`

Expand each invoice row's action column from a single "Ingatkan" button to a dropdown with:
- **Send Reminder** (existing functionality, preserved)
- **Process Payment** (opens `InlinePaymentMatchDialog`)
- **Call Tenant** (tel: link using tenant phone, if available)

Add a small badge on rows that have candidate payments available (e.g., "2 pembayaran cocok").

### 4. Update `old-docs/SYSTEM_AUDIT_REPORT.md`

Add Implementation Tracking for Improvement 4 with per-line status.

## Files Changed

| File | Action | Description |
|------|--------|-------------|
| `src/features/collections/hooks/useInvoiceCandidatePayments.ts` | CREATE | Hook to fetch + score candidate payments |
| `src/features/collections/components/InlinePaymentMatchDialog.tsx` | CREATE | Dialog for payment matching |
| `src/features/collections/components/OutstandingTable.tsx` | MODIFY | Add dropdown actions + dialog trigger |
| `old-docs/SYSTEM_AUDIT_REPORT.md` | UPDATE | Improvement 4 tracking |

## Technical Details

### Match Confidence Scoring (Client-Side)

```text
score = 1.0   if payment.amount == invoice.outstandingAmount (exact)
score = 0.95  if abs(payment.amount - invoice.outstandingAmount) / invoice.outstandingAmount < 0.05
score = 0.80  if abs(payment.amount - invoice.outstandingAmount) / invoice.outstandingAmount < 0.20
score = 0.50  otherwise (same tenant/contract but amount mismatch)
```

### Data Flow

1. User clicks "Process Payment" on invoice row
2. Dialog opens, `useInvoiceCandidatePayments` fires query
3. Query fetches from `payments` table where `tenant_user_id` + `contract_id` match and `reconciliation_status` in ('unmatched', 'pending_review')
4. Results scored and displayed
5. User clicks "Confirm Match" on a candidate
6. `reconciliationService.manualMatch()` is called (existing function -- creates match record, updates payment status, updates invoice status)
7. React Query invalidation triggers table refresh -- invoice disappears from outstanding list or shows "paid"

### Realtime Already Configured

The `useCollectionsDashboard` hook already subscribes to realtime changes on `invoices` and `payments` tables, so after matching, the table auto-refreshes without manual reload.

### No Database Changes

All required tables (`payments`, `payment_invoice_match`, `invoices`) and their RLS policies already exist. The `reconciliationService.manualMatch()` function handles the full matching workflow.

### No New Dependencies

Uses existing Dialog, Table, Badge, Button, DropdownMenu components from the design system.

