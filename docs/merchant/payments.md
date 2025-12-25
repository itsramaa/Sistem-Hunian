# Payments Management

## Overview
Manajemen pembayaran dari tenant.

## File Location
- `src/pages/merchant/Payments.tsx` - Halaman payments
- `src/components/merchant/PaymentPlanDialog.tsx` - Payment plan

## Database Tables
- `payments` - Data pembayaran
- `invoices` - Invoice terkait
- `xendit_transactions` - Transaksi Xendit
- `payment_plans` - Cicilan

## Features
- ✅ List payments
- ✅ View payment detail
- ✅ Payment status tracking
- ✅ Filter by status
- ✅ Create payment plan
- ✅ Manual payment entry
- ✅ Export payments

## Implementation Status
| Feature | Status |
|---------|--------|
| List | ✅ Complete |
| View Detail | ✅ Complete |
| Tracking | ✅ Complete |
| Filter | ✅ Complete |
| Payment Plan | ✅ Complete |

## Payment Status
- `pending` - Menunggu pembayaran
- `processing` - Sedang diproses
- `completed` - Selesai
- `failed` - Gagal
- `refunded` - Refund

## Payment Methods
- Virtual Account
- E-Wallet (OVO, GoPay, Dana)
- Credit Card
- Bank Transfer

## Related Components
- `PaymentPlanDialog`
- Xendit integration
