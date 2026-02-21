# Subscription Tiers

## Overview
Manajemen tier subscription untuk merchant.

## File Location
- `src/pages/admin/SubscriptionTiers.tsx` - Halaman manajemen tier
- `src/pages/admin/Subscriptions.tsx` - Halaman subscriptions

## Database Tables
- `subscription_tiers` - Tier subscription
- `merchant_subscriptions` - Subscription merchant

## Features
- ✅ List subscription tiers
- ✅ Create new tier
- ✅ Edit tier
- ✅ Set pricing (monthly/yearly)
- ✅ Set limits (properties, units, tenants)
- ✅ Feature toggles per tier
- ✅ Trial days configuration

## Implementation Status
| Feature | Status |
|---------|--------|
| List Tiers | ✅ Complete |
| Create Tier | ✅ Complete |
| Edit Tier | ✅ Complete |
| Pricing | ✅ Complete |
| Limits | ✅ Complete |
| Features | ✅ Complete |

## Default Tiers
1. **Free** - 1 property, 5 units
2. **Basic** - 3 properties, 20 units
3. **Professional** - 10 properties, 100 units
4. **Enterprise** - Unlimited

## Tier Properties
- `name` - Nama tier
- `price_monthly` - Harga bulanan
- `price_yearly` - Harga tahunan
- `max_properties` - Limit properti
- `max_units` - Limit unit
- `max_tenants` - Limit tenant
- `features` - Array fitur
- `trial_days` - Hari trial

## Related Components
- `Subscriptions` page
- `SubscriptionWidget` component
