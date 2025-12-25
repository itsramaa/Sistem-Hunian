# Tenant Invoices

## Overview
View dan bayar invoice untuk tenant.

## File Location
- `src/pages/tenant/Invoices.tsx` - Halaman invoices

## Database Tables
- `invoices` - Data invoice
- `contracts` - Kontrak
- `payments` - Pembayaran

## Features
- ✅ View invoices
- ✅ Filter by status
- ✅ View invoice detail
- ✅ Download PDF
- ✅ Pay invoice
- ✅ View payment history

## Implementation Status
| Feature | Status |
|---------|--------|
| View | ✅ Complete |
| Filter | ⚠️ Needs Adding |
| Detail | ✅ Complete |
| PDF | ✅ Complete |
| Pay | ✅ Complete |

## Invoice Status
- `issued` - Diterbitkan
- `paid` - Lunas
- `overdue` - Lewat tempo
- `cancelled` - Dibatalkan

## Related Components
- `XenditPaymentModal`
- Payment integration
