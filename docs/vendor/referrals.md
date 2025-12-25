# Vendor Referrals

## Overview
Program referral untuk vendor.

## File Location
- `src/pages/vendor/Referrals.tsx` - Halaman referrals
- `src/components/referral/ReferralDashboard.tsx` - Dashboard

## Database Tables
- `referral_codes` - Kode referral
- `referral_rewards` - Rewards
- `vendors` - referred_by

## API/Edge Functions
- `supabase/functions/process-vendor-order-referral/index.ts`

## Features
- ✅ View referral code
- ✅ Share referral link
- ✅ Track referrals
- ✅ View rewards
- ✅ Performance-based rewards

## Implementation Status
| Feature | Status |
|---------|--------|
| View Code | ✅ Complete |
| Share | ✅ Complete |
| Track | ✅ Complete |
| Rewards | ✅ Complete |

## Referral Criteria
- Minimum orders completed
- Minimum rating required
- Active status

## Related Components
- `ReferralDashboard`
