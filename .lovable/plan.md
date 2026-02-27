

# Revise UX Assessment: Remove Merchant Escrow & Update to Actual System

## Problem Statement

The current `UX_ASSESSMENT_AND_USER_JOURNEY.md` contains **outdated escrow references for merchants** that no longer reflect the actual system. A migration (`20260227084712`) explicitly removed merchant escrow, adding the comment: "Escrow account creation removed -- using direct payment model." The `merchant_activity_diagram.md` is also outdated (Diagram 8 still shows full merchant escrow flow).

## Evidence of Change

| Evidence | Source | Detail |
|----------|--------|--------|
| Migration removes escrow | `20260227084712_.sql` line 44 | "NOTE: Escrow account creation removed -- using direct payment model" |
| `create_merchant_escrow` trigger dropped | Same migration, line 86 | `DROP TRIGGER IF EXISTS create_merchant_escrow` |
| Dashboard uses `payment_transfers` | `merchantDashboardService.ts` line 78 | Queries `payment_transfers` table, NOT `escrow_accounts` |
| Dashboard comment confirms | `merchantDashboardService.ts` line 159 | "Process Financials (direct payment model -- no escrow)" |
| Dashboard balance hardcoded 0 | `merchantDashboardService.ts` line 207 | `balance: 0` -- no escrow balance |
| State machine label | `state-machines.ts` line 129 | "Section 13: Payment Transfer Lifecycle (Direct Payment Model)" |
| No `ESCROW_TRANSACTION_TRANSITIONS` | `state-machines.ts` | Does not exist -- removed |
| No merchant escrow nav item | `navigation-config.ts` | No `/merchant/escrow` in sidebar |
| No merchant escrow page | `src/pages/merchant/` | No `Escrow.tsx` file |
| Vendor earnings use `vendor_earnings` | `Earnings.tsx` line 62 | Vendor has own earning system, not escrow |
| Disbursement is vendor-only | `state-machines.ts` line 137 | "Section 13b: Vendor Disbursement Lifecycle" |
| Admin has `payment-transfers` page | `navigation-config.ts` line 218 | Label: "Transfer Dana" |

## Changes Required

### 1. Update Source Traceability Matrix (Row 8)

**Before**: Feature 8 = "Direct Payment (Escrow & Disbursement)" referencing `merchant_activity_diagram.md` Diagram 8

**After**: Feature 8 = "Direct Payment (Payment Transfers)" referencing `PAYMENT_TRANSFER_TRANSITIONS` in `state-machines.ts` lines 129-135 and `merchantDashboardService.ts` lines 76-81. Note that `merchant_activity_diagram.md` Diagram 8 is **outdated** and should be flagged.

### 2. Rewrite Feature 8 Section

Replace entire Feature 8 with corrected flow:

- **Documentation Source**: `state-machines.ts` Section 13 (Payment Transfer Lifecycle), `merchantDashboardService.ts`
- **Flow**: Payment confirmed -> `payment_transfers` table -> status: pending -> processing -> completed/failed
- Remove all references to: `escrow_accounts`, `escrow_transactions`, escrow balance, escrow page, scheduled-disbursement, xendit-disbursement, admin manual review for large disbursements
- Keep bank account management reference
- **State Machine**: `PAYMENT_TRANSFER_TRANSITIONS` (pending -> processing -> completed/failed, failed -> pending retry)
- Update UX Friction: Remove "escrow is invisible" friction; add "payment_transfers pending status unclear to merchant" friction
- Update Simplification: Remove "rename Escrow to Saldo Tertunda"

### 3. Fix Feature 1 (Onboarding) Reference

Line 156 says `ensure-user-bootstrap` "creates profiles, user_roles, merchants, escrow_accounts, merchant_subscriptions (free)". Remove `escrow_accounts` -- confirmed not created anymore per migration.

### 4. Fix Feature 7 (Payment & Verification) Reference

Line 649 in the activity diagram says "Masuk Escrow See Diagram 8". The UX doc itself doesn't directly reference this but the payment flow should reference `payment_transfers` instead. Check and update if needed.

### 5. Update Over-Complexity Detection (Section 5)

Remove or update any escrow-related complexity entries.

### 6. Update Appendix

- Remove `ESCROW_TRANSACTION_TRANSITIONS` from any count references
- Add `PAYMENT_TRANSFER_TRANSITIONS` to state machine count
- Total state machine count may change (verify: was 31, escrow removed but payment_transfer added -- net same or different)

### 7. Update Hallucination Self-Check (Section 8)

Add new discrepancy:
- `merchant_activity_diagram.md` Diagram 8 shows merchant escrow flow but system has migrated to direct payment model (`payment_transfers`)
- `merchant_activity_diagram.md` Diagram 1 references `escrow_accounts` creation in `handle_new_user()` trigger but this was removed
- `merchant_activity_diagram.md` Diagram 7 references "Masuk Escrow See Diagram 8" but escrow no longer applies to merchants

### 8. Update Onboarding Journey (Section 3A)

The merchant onboarding step note should reflect that no escrow account is created.

## State Machine Count Recount

Need to verify whether removing `ESCROW_TRANSACTION_TRANSITIONS` and keeping `PAYMENT_TRANSFER_TRANSITIONS` changes the total from 31. The state-machines.ts search showed `PAYMENT_TRANSFER_TRANSITIONS` exists at line 130 and `DISBURSEMENT_STATUS_TRANSITIONS` at line 138, but no `ESCROW_TRANSACTION_TRANSITIONS`. So the count of 31 may already be correct (escrow was already gone when we counted). No change needed if already accurate.

## Files Modified

| Action | File |
|--------|------|
| EDIT | `old-docs/UX_ASSESSMENT_AND_USER_JOURNEY.md` |

## Summary of All Edits

1. Traceability Matrix row 8: rename + update source references
2. Feature 1 flow table: remove `escrow_accounts` from bootstrap step
3. Feature 8: full rewrite to Direct Payment (Payment Transfers) model
4. Section 5 (Over-Complexity): remove escrow references if present
5. Section 8 (Hallucination Check): add 3 new diagram discrepancies about outdated escrow references in `merchant_activity_diagram.md`
6. Appendix: verify state machine counts still accurate
7. Any stray "escrow" references throughout the document -> update to `payment_transfers` or remove

