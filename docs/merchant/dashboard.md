# Merchant Dashboard

## Overview
Dashboard utama merchant dengan overview properti, tenant, dan revenue.

## File Location
- `src/pages/merchant/Dashboard.tsx` - Halaman dashboard
- `src/components/layouts/MerchantLayout.tsx` - Layout merchant

## Database Tables
- `properties` - Properti merchant
- `units` - Unit dalam properti
- `tenants` - Tenant merchant
- `contracts` - Kontrak aktif
- `invoices` - Invoice pending
- `escrow_accounts` - Saldo escrow

## Features
- ✅ Property count
- ✅ Unit occupancy rate
- ✅ Tenant count
- ✅ Revenue overview
- ✅ Pending payments
- ✅ Pending maintenance
- ✅ Subscription status
- ✅ Quick actions

## Implementation Status
| Feature | Status |
|---------|--------|
| Stats Cards | ✅ Complete |
| Occupancy Chart | ✅ Complete |
| Revenue Chart | ✅ Complete |
| Quick Actions | ✅ Complete |
| Subscription Widget | ✅ Complete |

## Dashboard Cards
- Total Properties
- Total Units (occupied/vacant)
- Total Tenants
- Monthly Revenue
- Escrow Balance
- Pending Invoices

## Related Components
- `SubscriptionWidget`
- `TrialCountdownWidget`
- `VacancyDashboard`
- `MerchantChatbot`
