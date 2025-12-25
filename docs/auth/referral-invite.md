# Referral Invite

## Overview
Sistem referral untuk mengundang pengguna baru dengan bonus/diskon.

## File Location
- `src/pages/ReferralInvite.tsx` - Halaman referral invite
- `src/components/referral/ReferralDashboard.tsx` - Dashboard referral

## Database Tables
- `referral_codes` - Kode referral
- `referral_rewards` - Reward dari referral
- `merchants` - referred_by field

## API/Edge Functions
- `supabase/functions/process-referral-reward/index.ts`
- `supabase/functions/process-referral-commissions/index.ts`

## Features
- ✅ Generate referral code
- ✅ Share referral link
- ✅ Track referral signups
- ✅ Calculate referral rewards
- ✅ Apply referral discounts

## Implementation Status
| Feature | Status |
|---------|--------|
| Generate Code | ✅ Complete |
| Share Link | ✅ Complete |
| Track Signups | ✅ Complete |
| Rewards | ✅ Complete |
| Discounts | ✅ Complete |

## Referral Types
1. **Merchant Referral** - Merchant refer merchant lain
2. **Tenant Referral** - Tenant refer tenant lain
3. **Vendor Referral** - Vendor refer vendor lain

## Reward Structure
- Referrer: Diskon subscription / bonus
- Referee: Diskon pertama kali

## Related Components
- `ReferralDashboard` - Referral statistics
- Various referral pages per role
