

# Phase 0 Remaining: Steps 3 & 4

## Status Summary
- Step 1: Reset MASTER_IMPLEMENTATION_PLAN.md -- DONE
- Step 2: Create 7 missing DB tables -- DONE
- **Step 3: Verification Tiers -- NOT STARTED**
- **Step 4: Invoice State Machine Update -- NOT STARTED**

---

## Step 3: Verification Tiers

### 3a. Database Migration
Add `verification_tier` column to `merchants` table:

```sql
ALTER TABLE merchants
  ADD COLUMN verification_tier text NOT NULL DEFAULT 'quick';

COMMENT ON COLUMN merchants.verification_tier
  IS 'Verification tier: quick (email+phone), standard (+KTP+SIUP), premium (+site visit)';
```

### 3b. Update `handle_new_user()` Trigger
Replace the existing trigger function to include `verification_tier = 'quick'` when creating new merchant records. The current function already creates merchants in the `IF user_role = 'merchant'` block -- we just add the column with default (which the DEFAULT handles automatically, so no trigger change needed).

### 3c. Add Verification Tier State Machine
Add a new state machine constant to `src/shared/constants/state-machines.ts`:

```text
VERIFICATION_TIER_TRANSITIONS:
  quick -> standard
  standard -> premium
```

### 3d. Update Merchant Verification UI
Modify `src/pages/merchant/Profile.tsx` to display the current verification tier with a badge and show what's needed for upgrade (quick: email+phone done; standard: needs KTP+SIUP; premium: needs site visit).

### 3e. Update Admin Merchant Views
Update `src/features/users/components/admin/AdminMerchantsTable.tsx` and `MerchantDetailDialog.tsx` to display the verification tier column alongside verification_status.

### 3f. Update Types
Add `verification_tier` to `src/features/users/types/admin-merchant.ts` Merchant interface.

---

## Step 4: Invoice State Machine Update

### 4a. Update `state-machines.ts`
Current invoice transitions:
```text
draft -> sent, cancelled
sent -> paid, overdue, cancelled, partially_paid
overdue -> paid, cancelled
partially_paid -> paid, cancelled
pending -> paid, overdue, cancelled  (legacy)
```

Add `escalated` status for collections-level overdue:
```text
overdue -> paid, cancelled, escalated
escalated -> paid, cancelled
```

This connects with the existing `check-overdue-escalation` edge function which already handles day 15+ escalation and creates `collections_cases`.

### 4b. Create Edge Function `auto-transition-invoices`
A daily cron function that:
1. Finds invoices with `status = 'sent'` or `status = 'pending'` where `due_date < today` -- transitions to `overdue`
2. Finds invoices with `status = 'overdue'` where `days_overdue >= 15` -- transitions to `escalated`
3. Logs all transitions to `invoice_status_history` (existing trigger handles this automatically)

This complements the existing `check-overdue-escalation` function (which handles notifications/emails) by ensuring the invoice status itself is updated.

### 4c. Update MASTER_IMPLEMENTATION_PLAN.md Status
After completing Steps 3 and 4, update the `.lovable/plan.md` to reflect Phase 0 completion.

---

## Files to Create/Modify

| Action | File | Change |
|--------|------|--------|
| Migration | `supabase/migrations/...verification_tier.sql` | Add column to merchants |
| Edit | `src/shared/constants/state-machines.ts` | Add VERIFICATION_TIER_TRANSITIONS + update INVOICE_STATUS_TRANSITIONS |
| Edit | `src/features/users/types/admin-merchant.ts` | Add verification_tier field |
| Edit | `src/pages/merchant/Profile.tsx` | Show tier badge + upgrade path |
| Edit | `src/features/users/components/admin/AdminMerchantsTable.tsx` | Show tier column |
| Edit | `src/features/users/components/admin/MerchantDetailDialog.tsx` | Show tier info |
| Create | `supabase/functions/auto-transition-invoices/index.ts` | Daily batch invoice status updater |
| Edit | `.lovable/plan.md` | Mark Phase 0 complete |

## Execution Order (Waterfall)
1. Step 3a: DB migration (verification_tier column)
2. Step 3c-3f: State machine + types + UI updates (all depend on 3a)
3. Step 4a: Invoice state machine update in code
4. Step 4b: Create auto-transition-invoices edge function
5. Step 4c: Update status dashboard

