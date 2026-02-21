# Vendor Orders

## Overview
Manajemen pesanan dari tenant.

## File Location
- `src/pages/vendor/Orders.tsx` - Halaman orders

## Database Tables
- `orders` - Data pesanan
- `order_items` - Item pesanan
- `tenants` - Data tenant

## API/Edge Functions
- `supabase/functions/order-auto-reject/index.ts` - Auto reject

## Features
- ✅ View orders
- ✅ Accept order
- ✅ Reject order
- ✅ Update status
- ✅ View order detail
- ✅ Contact tenant
- ✅ Auto-reject expired

## Implementation Status
| Feature | Status |
|---------|--------|
| View | ✅ Complete |
| Accept | ✅ Complete |
| Reject | ✅ Complete |
| Status Update | ✅ Complete |
| Auto-reject | ✅ Complete |

## Order Status
- `pending` - Menunggu konfirmasi
- `confirmed` - Dikonfirmasi
- `processing` - Diproses
- `completed` - Selesai
- `cancelled` - Dibatalkan

## Related Components
- Order management actions
