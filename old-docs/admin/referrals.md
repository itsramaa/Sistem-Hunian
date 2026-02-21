# Admin Referrals

## Overview
Manajemen program referral platform-wide.

## File Location
- `src/pages/admin/Referrals.tsx` - Halaman referrals admin

## Database Tables
- `referral_codes` - Kode referral
- `referral_rewards` - Reward referral
- `merchants` - referred_by tracking

## API/Edge Functions
- `supabase/functions/process-referral-reward/index.ts`
- `supabase/functions/process-referral-commissions/index.ts`

## Features
- ✅ View all referral codes
- ✅ View referral statistics
- ✅ Track referral conversions
- ✅ Manage reward payouts
- ✅ Configure referral rewards

## Implementation Status
| Feature | Status |
|---------|--------|
| View Codes | ✅ Complete |
| Statistics | ✅ Complete |
| Conversions | ✅ Complete |
| Payouts | ✅ Complete |

## Referral Metrics
- Total Referrals
- Successful Conversions
- Pending Rewards
- Total Paid Out

## Related Components
- `ReferralDashboard` component
- Role-specific referral pages
