

# Improvement 3: Add Payment Transfer Status Page

## Overview

Add a "Status Transfer" tab to the existing Payments page (`/merchant/payments`) that shows real-time transfer status for fund disbursements from the payment gateway to the merchant's bank account. This resolves the P0 visibility gap identified in the audit.

## Prerequisites: Database Migration

The `payment_transfers` table does NOT exist yet in the database. Edge functions already reference it (via `as any` casts in `xendit-webhook`, `xendit-disbursement`, `xendit-disbursement-webhook`), so we need to create it.

### Table: `payment_transfers`

```text
Columns:
- id (uuid, PK, default gen_random_uuid())
- payment_id (uuid, FK -> payments.id)
- merchant_id (uuid, FK -> merchants.id, NOT NULL)
- amount (numeric, NOT NULL)
- platform_fee (numeric, default 0)
- gateway_fee (numeric, default 0)
- net_amount (numeric, NOT NULL)
- bank_account_id (uuid, FK -> bank_accounts.id, nullable)
- status (text, NOT NULL, default 'pending') -- pending, processing, completed, failed
- external_reference (text, nullable)
- xendit_disbursement_id (text, nullable)
- failure_reason (text, nullable)
- completed_at (timestamptz, nullable)
- created_at (timestamptz, default now())
- updated_at (timestamptz, default now())
```

RLS policies:
- Merchants can SELECT their own transfers (`merchant_id` matches via `merchants.user_id = auth.uid()`)
- No INSERT/UPDATE/DELETE for merchants (backend-only writes via service role)

Enable realtime for live status updates.

## New Files

### 1. `src/features/payments/hooks/usePaymentTransfers.ts`

React Query hook that:
- Fetches `payment_transfers` for the merchant, joined with `bank_accounts` (bank name, account number)
- Computes aggregate stats (pending total, completed this week, failed count, 7-day average)
- Subscribes to Supabase Realtime for live status updates
- Returns typed data

### 2. `src/features/payments/components/TransferStatusTab.tsx`

The new tab content with:
- **Aggregate metrics row** (4 StatCards): Pending Transfers, Completed This Week, Failed (Needs Attention), 7-Day Average
- **Transfer list** grouped by status section (Failed first for attention, then Processing, then Completed)
- Each transfer card shows: amount, net amount, bank destination, created date, completed/failed date, status badge, failure reason
- **Failed transfers**: "Retry" button that invokes the `xendit-disbursement` edge function
- **Empty state** when no transfers exist yet

### 3. Modify: `src/pages/merchant/Payments.tsx`

Add a third tab "Status Transfer" alongside "Riwayat Pembayaran" and "Tagihan Terlambat":
- Import `TransferStatusTab` and `usePaymentTransfers`
- Add tab trigger with badge showing failed transfer count (red) or processing count (yellow)
- Render `TransferStatusTab` in new `TabsContent`

### 4. Update: `old-docs/SYSTEM_AUDIT_REPORT.md`

Add Implementation Tracking section for Improvement 3 with per-line status tracking.

## Technical Details

### Realtime Subscription
Subscribe to `payment_transfers` changes filtered by `merchant_id` to update transfer status in real-time when webhooks arrive from Xendit.

### Retry Failed Transfers
The "Retry" button calls `supabase.functions.invoke('xendit-disbursement')` with the transfer's `payment_transfer_id` and `bank_account_id`. This reuses the existing edge function.

### Status Badges
Reuse the same badge patterns from the admin `PaymentTransfers.tsx` page:
- Completed: green with CheckCircle2
- Processing: secondary with Clock
- Pending: outline with Clock  
- Failed: destructive with XCircle

### No Navigation Changes
The transfer status is a tab within the existing Payments page, not a new page. No sidebar changes needed.

## Files Changed

| File | Action | Description |
|------|--------|-------------|
| Database migration | CREATE TABLE | `payment_transfers` table + RLS + realtime |
| `src/features/payments/hooks/usePaymentTransfers.ts` | CREATE | Hook for fetching + realtime subscription |
| `src/features/payments/components/TransferStatusTab.tsx` | CREATE | Transfer status tab UI |
| `src/pages/merchant/Payments.tsx` | MODIFY | Add third tab |
| `old-docs/SYSTEM_AUDIT_REPORT.md` | UPDATE | Tracking for Improvement 3 |

## Implementation Order

1. Create `payment_transfers` table (migration)
2. Create `usePaymentTransfers` hook
3. Create `TransferStatusTab` component
4. Add tab to Payments page
5. Update audit report

