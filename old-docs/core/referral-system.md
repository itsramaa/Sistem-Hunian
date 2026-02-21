# Referral System

## Overview
Sistem referral untuk semua role (Merchant, Tenant, Vendor).

## File Location
- `src/components/referral/ReferralDashboard.tsx` - Dashboard
- `src/pages/ReferralInvite.tsx` - Invite page
- `supabase/functions/process-referral-reward/index.ts` - Process reward
- `supabase/functions/process-referral-commissions/index.ts` - Commissions
- `supabase/functions/process-vendor-order-referral/index.ts` - Vendor

## Database Tables
- `referral_codes` - Kode referral
- `referral_rewards` - Rewards
- Various tables with referred_by field

## Features
- ✅ Generate referral code
- ✅ Track referrals
- ✅ Calculate rewards
- ✅ Process payouts
- ✅ Multi-tier rewards
- ✅ Role-specific rewards

## Implementation Status
| Feature | Status |
|---------|--------|
| Generate Code | ✅ Complete |
| Tracking | ✅ Complete |
| Rewards | ✅ Complete |
| Payouts | ✅ Complete |

## Reward Types
- Subscription discount (Merchant)
- Rent discount (Tenant)
- Commission bonus (Vendor)

## Related Components
- `ReferralDashboard`
- Referral pages per role
