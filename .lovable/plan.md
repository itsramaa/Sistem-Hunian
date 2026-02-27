
# Implement Direct Payment Model -- Remove Merchant Escrow System

## Overview
Replace the escrow-based payment flow (Tenant -> Escrow -> Admin Verify -> Disbursement -> Merchant Bank) with a direct payment model (Tenant -> Xendit -> Auto-match Invoice -> Direct to Merchant Bank). Vendor escrow is RETAINED per existing business rules.

## Current State Analysis

**Files involved in merchant escrow (to be modified/removed):**
- `src/features/escrow/` -- entire feature folder (services, hooks, components, types, utils, constants)
- `src/pages/merchant/Escrow.tsx` -- merchant escrow page (NOT routed, NOT in nav -- already orphaned)
- `src/pages/admin/Escrow.tsx` -- admin escrow management page
- `supabase/functions/xendit-webhook/index.ts` -- lines 437-548 create escrow transactions on rent payment
- `supabase/functions/xendit-disbursement/index.ts` -- full EF for disbursement
- `supabase/functions/xendit-disbursement-webhook/index.ts` -- full EF for disbursement webhook
- `supabase/functions/scheduled-disbursement/index.ts` -- full EF for scheduled disbursement
- `src/shared/constants/state-machines.ts` -- ESCROW_TRANSACTION_TRANSITIONS, DISBURSEMENT_STATUS_TRANSITIONS
- `src/shared/components/layouts/navigation-config.ts` -- admin nav "Escrow" item
- `src/App.tsx` -- AdminEscrow route
- `src/shared/components/json-ld.tsx` -- "Escrow Payment" keyword
- `src/pages/merchant/Support.tsx` -- FAQ mentioning escrow
- `src/features/platform-config/components/FeesConfig.tsx` -- escrowFeePercent field
- DB trigger `handle_new_user()` -- auto-creates escrow_accounts for merchants
- DB trigger `create_merchant_escrow()` -- creates escrow on merchant insert

**Vendor escrow (RETAINED -- no changes):**
- `src/features/escrow/components/VendorEscrowWidget.tsx` -- stays, but will be moved to vendor feature
- Vendor earnings/disbursements via `vendor_earnings` and `disbursements` tables -- independent of merchant escrow

## Implementation Plan

### Phase 1: Database Migration -- New Direct Payment Tables

Create migration to:
1. Create `payment_transfers` table to track direct transfers to merchant bank accounts:
   - `id`, `payment_id` (FK payments), `merchant_id` (FK merchants), `amount`, `platform_fee`, `gateway_fee`, `net_amount`, `bank_account_id` (FK bank_accounts), `status` (pending/processing/completed/failed), `xendit_disbursement_id`, `external_reference`, `processed_at`, `completed_at`, `failure_reason`, `created_at`, `updated_at`
2. Add RLS policies for payment_transfers (merchant can read own, admin can read all)
3. Do NOT drop `escrow_accounts` or `escrow_transactions` tables yet (keep for historical data, soft deprecate)

### Phase 2: Rewrite xendit-webhook -- Direct Transfer on Payment

Modify `supabase/functions/xendit-webhook/index.ts`:
- **REMOVE** lines 437-548 (escrow transaction creation on rent payment)
- **REPLACE WITH** direct transfer logic:
  1. On successful rent payment, calculate fees (same 1% platform + 2.5% gateway)
  2. Get merchant's primary bank account
  3. Create `payment_transfers` record with status `pending`
  4. Auto-invoke `xendit-disbursement` to transfer net amount directly to merchant bank
  5. Update merchant notification: "Pembayaran Rp X diterima. Transfer Rp Y ke rekening Anda sedang diproses."

### Phase 3: Simplify Disbursement Edge Functions

**Modify `xendit-disbursement/index.ts`:**
- Keep the core Xendit API call logic
- Add support for `payment_transfer_id` parameter (in addition to existing `escrow_account_id` for vendor)
- When called with `payment_transfer_id`, update `payment_transfers` table instead of escrow tables

**Modify `xendit-disbursement-webhook/index.ts`:**
- Add handler for payment_transfer completion/failure
- On COMPLETED: update `payment_transfers.status = 'completed'`, notify merchant "Dana Rp X telah masuk ke rekening Anda"
- On FAILED: update `payment_transfers.status = 'failed'`, store failure_reason, notify merchant

**Remove `scheduled-disbursement/index.ts`:**
- No longer needed -- payments are auto-transferred immediately
- Delete the edge function

### Phase 4: Remove Merchant Escrow UI

1. **Delete** `src/pages/merchant/Escrow.tsx`
2. **Delete merchant-specific escrow components:**
   - `src/features/escrow/components/DisbursementDialog.tsx`
   - `src/features/escrow/components/EscrowBalanceCards.tsx`
   - `src/features/escrow/components/EscrowFilters.tsx`
   - `src/features/escrow/components/EscrowTransactionsTable.tsx`
3. **Delete merchant escrow hooks/services:**
   - `src/features/escrow/hooks/useMerchantEscrow.ts`
   - `src/features/escrow/services/escrowService.ts`
   - `src/features/escrow/constants/index.ts`
   - `src/features/escrow/utils/disbursement.ts`
   - `src/features/escrow/types/escrow.ts`
4. **Move** `VendorEscrowWidget.tsx` to `src/features/vendor/components/VendorEarningsWidget.tsx` (rename away from "escrow" terminology)
5. **Rename** VendorEscrowWidget references: "Escrow Balance" -> "Saldo Pendapatan" / "Earnings Balance"

### Phase 5: Replace Admin Escrow with Payment Transfers Dashboard

Transform `src/pages/admin/Escrow.tsx` into `src/pages/admin/PaymentTransfers.tsx`:
- Show all payment transfers across merchants (replacing escrow accounts view)
- Show transfer status (pending/processing/completed/failed)
- Show failed transfers that need attention
- Remove disbursement approval flow (no longer needed -- transfers are automatic)
- Delete all admin escrow components in `src/features/escrow/components/admin/`

Create new admin components:
- `AdminPaymentTransfersTable.tsx` -- list of all transfers
- `AdminTransferStats.tsx` -- total transferred, pending, failed counts

Update routes and navigation:
- `src/App.tsx`: Replace `AdminEscrow` import/route with `AdminPaymentTransfers` at `/admin/payment-transfers`
- `navigation-config.ts`: Change admin nav item from "Escrow" to "Transfer Dana" with updated path

### Phase 6: Update State Machines and References

1. **Remove** from `state-machines.ts`:
   - `ESCROW_TRANSACTION_TRANSITIONS`
   - `DISBURSEMENT_STATUS_TRANSITIONS`
2. **Add** `PAYMENT_TRANSFER_TRANSITIONS`:
   ```
   pending -> processing
   processing -> completed | failed
   failed -> pending (retry)
   completed -> [] (terminal)
   ```
3. **Update** `json-ld.tsx`: "Escrow Payment" -> "Pembayaran Langsung" / "Direct Payment"
4. **Update** `Support.tsx` FAQ: Change escrow mention to direct payment explanation
5. **Update** `FeesConfig.tsx`: Remove `escrowFeePercent` field
6. **Remove** `create_merchant_escrow` trigger and escrow creation from `handle_new_user()` function

### Phase 7: Update process-deposit-refund

`process-deposit-refund/index.ts` does NOT use merchant escrow -- it transfers directly to tenant bank account. No changes needed, but update any comments that reference escrow.

### Phase 8: Update Audit Report

Update `old-docs/PMS_Audit_Report_FULL.md` with status:
- Mark item 1 (Escrow System removal) as **COMPLETE**

## Files Summary

| Action | File | Description |
|--------|------|-------------|
| CREATE | DB migration | `payment_transfers` table + RLS |
| MODIFY | `xendit-webhook/index.ts` | Replace escrow logic with direct transfer |
| MODIFY | `xendit-disbursement/index.ts` | Support payment_transfer_id |
| MODIFY | `xendit-disbursement-webhook/index.ts` | Handle payment_transfer status |
| DELETE | `scheduled-disbursement/index.ts` | No longer needed |
| DELETE | `src/pages/merchant/Escrow.tsx` | Merchant escrow page |
| DELETE | `src/features/escrow/components/DisbursementDialog.tsx` | |
| DELETE | `src/features/escrow/components/EscrowBalanceCards.tsx` | |
| DELETE | `src/features/escrow/components/EscrowFilters.tsx` | |
| DELETE | `src/features/escrow/components/EscrowTransactionsTable.tsx` | |
| DELETE | `src/features/escrow/hooks/useMerchantEscrow.ts` | |
| DELETE | `src/features/escrow/hooks/useEscrow.ts` | |
| DELETE | `src/features/escrow/services/escrowService.ts` | |
| DELETE | `src/features/escrow/constants/index.ts` | |
| DELETE | `src/features/escrow/utils/disbursement.ts` | |
| DELETE | `src/features/escrow/types/escrow.ts` | |
| DELETE | `src/features/escrow/types/index.ts` | |
| DELETE | `src/features/escrow/components/admin/*` (8 files) | Admin escrow components |
| DELETE | `src/pages/admin/Escrow.tsx` | Replaced by PaymentTransfers |
| CREATE | `src/pages/admin/PaymentTransfers.tsx` | New transfer monitoring |
| CREATE | `src/features/payments/components/admin/` | New admin transfer components |
| MOVE | `VendorEscrowWidget.tsx` -> `VendorEarningsWidget.tsx` | Rename |
| MODIFY | `src/App.tsx` | Update routes |
| MODIFY | `navigation-config.ts` | Update admin nav |
| MODIFY | `state-machines.ts` | Remove escrow, add transfer states |
| MODIFY | `json-ld.tsx` | Update keywords |
| MODIFY | `Support.tsx` | Update FAQ |
| MODIFY | `FeesConfig.tsx` | Remove escrow fee |
| MODIFY | DB function `handle_new_user()` | Remove escrow account creation |
| MODIFY | `old-docs/PMS_Audit_Report_FULL.md` | Mark as COMPLETE |

## Impact
- Payments reach merchant bank same-day (vs 3-5 days with escrow)
- No admin bottleneck for disbursement approval
- Simpler system, fewer edge functions
- Vendor escrow preserved (separate concern)
