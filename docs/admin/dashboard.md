# Admin Dashboard

## Overview
Dashboard utama untuk admin dengan overview seluruh platform.

## File Location
- `src/pages/admin/Dashboard.tsx` - Halaman dashboard admin
- `src/components/layouts/AdminLayout.tsx` - Layout admin

## Database Tables
- `merchants` - Data merchant
- `vendors` - Data vendor
- `tenants` - Data tenant
- `invoices` - Data invoice
- `escrow_accounts` - Saldo escrow

## Features
- ✅ Total merchants count
- ✅ Total vendors count
- ✅ Total tenants count
- ✅ Revenue overview
- ✅ Pending verifications count
- ✅ Active subscriptions count
- ✅ Recent activity feed

## Implementation Status
| Feature | Status |
|---------|--------|
| Stats Cards | ✅ Complete |
| Revenue Chart | ✅ Complete |
| Activity Feed | ✅ Complete |
| Quick Actions | ✅ Complete |

## Metrics Displayed
- Total Merchants (verified/pending)
- Total Vendors (verified/pending)
- Total Revenue
- Active Subscriptions
- Pending Disputes
- Escrow Balance

## Related Components
- `RealTimeAnalytics` - Real-time stats
- Various admin pages
