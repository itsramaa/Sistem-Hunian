

# Remove Referral System Completely

## Overview
Remove all referral-related code from the entire system -- UI pages, components, hooks, services, types, edge functions, state machines, navigation, routes, and database objects. The `referrals`, `referral_commissions`, `referral_rewards` tables and `merchant_referral_summary` view will be dropped. The `generate_referral_code` trigger/function will also be removed.

## Files to DELETE (complete removal)

### Edge Functions (3)
- `supabase/functions/process-referral-reward/index.ts`
- `supabase/functions/process-referral-commissions/index.ts`
- `supabase/functions/process-vendor-order-referral/index.ts`

### Feature Module (entire `src/features/referrals/`)
- `src/features/referrals/components/ReferralDashboard.tsx`
- `src/features/referrals/components/ReferralHistoryTable.tsx`
- `src/features/referrals/components/ReferralLeaderboard.tsx`
- `src/features/referrals/components/ReferralLinkCopy.tsx`
- `src/features/referrals/components/ReferralRewardsTable.tsx`
- `src/features/referrals/components/admin/AdminReferralFilters.tsx`
- `src/features/referrals/components/admin/AdminReferralPayoutDialog.tsx`
- `src/features/referrals/components/admin/AdminReferralStats.tsx`
- `src/features/referrals/components/admin/AdminReferralsTable.tsx`
- `src/features/referrals/hooks/useReferrals.ts`
- `src/features/referrals/services/referralService.ts`
- `src/features/referrals/types/referrals.ts`
- `src/features/referrals/types/index.ts`

### Pages (5)
- `src/pages/admin/Referrals.tsx`
- `src/pages/merchant/Referrals.tsx`
- `src/pages/tenant/Referrals.tsx`
- `src/pages/vendor/Referrals.tsx`
- `src/pages/ReferralInvite.tsx`

## Files to MODIFY

### 1. `src/App.tsx`
- Remove imports: `ReferralInvite`, `AdminReferrals`, `MerchantReferrals`, `TenantReferrals`, `VendorReferrals`
- Remove routes: `/referral`, `/admin/referrals`, `referrals` (merchant), `/tenant/referrals`, `/vendor/referrals`

### 2. `src/shared/components/layouts/navigation-config.ts`
- Remove referral nav items from all 4 roles (tenant, merchant, vendor, admin)

### 3. `src/shared/constants/state-machines.ts`
- Remove `REFERRAL_STATUS_TRANSITIONS` (lines 145-151)

### 4. `src/shared/utils/auditLog.ts`
- Remove `"referral"` from entity type union and `logPayout` type

### 5. `src/shared/utils/analytics.ts`
- Remove `REFERRAL_LINK_COPIED` and `REFERRAL_LINK_SHARED` event constants

### 6. `src/shared/utils/validations/auth.ts`
- Remove `referralCodeSchema` export

### 7. `src/shared/utils/breadcrumbUtils.ts`
- Remove `'referrals': 'Referral'` entry

### 8. `src/features/auth/components/AuthForm.tsx`
- Remove `referralService` import
- Remove `initialReferralCode` variable and all referral-related state (`referrerInfo`)
- Remove referral sessionStorage logic (2 useEffects)
- Remove referral validation useEffect
- Remove `referral_code` from signup metadata
- Remove `sessionStorage.removeItem('referral_code')`
- Remove referral banner UI block

### 9. `src/features/auth/utils/auth-errors.ts`
- Remove `REFERRAL_ERROR_MESSAGES` export

### 10. `supabase/functions/xendit-webhook/index.ts`
- Remove 3 blocks that call `process-referral-reward`:
  - Lines ~246-264 (subscription renewal referral)
  - Lines ~367-385 (initial subscription referral)
  - Lines ~606-625 (tenant rent payment referral)

### 11. `src/pages/tenant/Dashboard.tsx`
- Remove referral promo banner (id: 3, "Ajak Teman, Dapat Bonus")
- Remove referral quick action item (`/tenant/referrals`)

## Database Migration

Drop referral-related objects:
```sql
DROP VIEW IF EXISTS merchant_referral_summary CASCADE;
DROP TABLE IF EXISTS referral_commissions CASCADE;
DROP TABLE IF EXISTS referral_rewards CASCADE;
DROP TABLE IF EXISTS referrals CASCADE;
DROP TRIGGER IF EXISTS generate_referral_code_trigger ON referrals;
DROP FUNCTION IF EXISTS generate_referral_code();
```

Note: `referred_by` columns on `merchants` and `vendors` tables will be left in place (nullable, no FK to referrals table) -- they are harmless and may be useful for historical tracking. `referral_bonus_amount`/`referral_bonus_applied` on `contracts` will also remain (nullable, no dependencies).

## Audit Report Update

Update `old-docs/PMS_Audit_Report_FULL.md` section 2:
- Change status from `CRITICAL FEATURE REMOVAL` to `COMPLETE`
- Add implementation summary noting all removed items

## Technical Notes
- `supabase/config.toml` has `verify_jwt = false` entries for the 3 referral edge functions -- these will auto-clean when the functions are deleted
- The `merchant_referral_summary` view appears in many FK relationship entries in `types.ts` -- this file auto-regenerates after migration, no manual edit needed
- No other services or components import from `src/features/referrals/` besides the files listed above

