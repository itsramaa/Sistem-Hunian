# Merchant Billing

## Overview
Billing subscription merchant ke platform.

## File Location
- `src/pages/merchant/Billing.tsx` - Halaman billing
- `src/components/merchant/SubscriptionWidget.tsx` - Widget
- `src/components/merchant/SubscriptionPayment.tsx` - Payment
- `src/components/merchant/SubscriptionInvoiceHistory.tsx` - History

## Database Tables
- `merchant_subscriptions` - Subscription
- `subscription_tiers` - Tier
- `subscription_invoices` - Invoice subscription

## API/Edge Functions
- `supabase/functions/subscription-billing/index.ts`
- `supabase/functions/subscription-renewal/index.ts`
- `supabase/functions/subscription-payment/index.ts`

## Features
- ✅ View current subscription
- ✅ Upgrade/downgrade tier
- ✅ View invoice history
- ✅ Pay subscription
- ✅ Cancel subscription
- ✅ Trial tracking
- ✅ Grace period handling

## Implementation Status
| Feature | Status |
|---------|--------|
| View Subscription | ✅ Complete |
| Upgrade/Downgrade | ✅ Complete |
| Invoice History | ✅ Complete |
| Payment | ✅ Complete |
| Cancellation | ✅ Complete |

## Subscription Status
- `trialing` - Trial period
- `active` - Aktif
- `past_due` - Lewat jatuh tempo
- `grace_period` - Grace period
- `suspended` - Suspend
- `cancelled` - Dibatalkan

## Related Components
- `SubscriptionWidget`
- `SubscriptionPayment`
- `SubscriptionInvoiceHistory`
- `CancelSubscriptionDialog`
- `TrialCountdownWidget`
- `UpgradePromptModal`
