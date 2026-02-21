# Subscription Billing

## Overview
Sistem billing subscription untuk merchant.

## File Location
- `supabase/functions/subscription-billing/index.ts` - Billing
- `supabase/functions/subscription-renewal/index.ts` - Renewal
- `supabase/functions/subscription-payment/index.ts` - Payment
- `supabase/functions/subscription-grace-check/index.ts` - Grace period

## Database Tables
- `merchant_subscriptions` - Subscription
- `subscription_tiers` - Tier
- `subscription_invoices` - Invoice subscription

## Features
- ✅ Monthly billing
- ✅ Yearly billing (discount)
- ✅ Auto-renewal
- ✅ Grace period
- ✅ Failed payment retry
- ✅ Downgrade at period end
- ✅ Cancellation

## Implementation Status
| Feature | Status |
|---------|--------|
| Monthly | ✅ Complete |
| Yearly | ✅ Complete |
| Auto-renewal | ✅ Complete |
| Grace Period | ✅ Complete |
| Retry | ✅ Complete |
| Cancellation | ✅ Complete |

## Billing Cycle
1. Subscription created (trial or paid)
2. Trial ends / period ends
3. Generate invoice
4. Process payment
5. On success: extend period
6. On failure: retry or grace period

## Related Components
- Subscription components
- Billing page
