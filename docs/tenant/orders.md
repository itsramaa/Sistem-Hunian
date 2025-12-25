# Tenant Orders

## Overview
Pesanan tenant dari marketplace.

## File Location
- `src/pages/tenant/Orders.tsx` - Halaman orders

## Database Tables
- `orders` - Data pesanan
- `order_items` - Item pesanan
- `vendors` - Vendor
- `products` - Produk

## Features
- ✅ View orders
- ✅ View order detail
- ✅ Track order status
- ✅ Cancel order
- ✅ Rate & review
- ✅ Reorder

## Implementation Status
| Feature | Status |
|---------|--------|
| View | ✅ Complete |
| Detail | ✅ Complete |
| Track | ✅ Complete |
| Cancel | ✅ Complete |
| Review | ✅ Complete |

## Order Status
- `pending` - Menunggu konfirmasi
- `confirmed` - Dikonfirmasi
- `processing` - Diproses
- `completed` - Selesai
- `cancelled` - Dibatalkan

## Related Components
- Order detail modal
- Review form
