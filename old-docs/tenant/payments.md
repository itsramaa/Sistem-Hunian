# Tenant Payments

## Overview
Pembayaran dan history untuk tenant.

## File Location
- `src/pages/tenant/Payments.tsx` - Halaman payments
- `src/components/payment/XenditPaymentModal.tsx` - Payment modal
- `src/components/tenant/PaymentPlanCard.tsx` - Payment plan

## Database Tables
- `payments` - Pembayaran
- `invoices` - Invoice
- `xendit_transactions` - Transaksi Xendit
- `payment_plans` - Cicilan

## Features
- ✅ Pay invoice
- ✅ Multiple payment methods
- ✅ Payment history
- ✅ View payment plan
- ✅ Auto-pay setup

## Implementation Status
| Feature | Status |
|---------|--------|
| Pay | ✅ Complete |
| Methods | ✅ Complete |
| History | ✅ Complete |
| Payment Plan | ✅ Complete |
| Auto-pay | ✅ Complete |

## Payment Methods
- Virtual Account (BCA, BNI, BRI, Mandiri)
- E-Wallet (OVO, GoPay, Dana, ShopeePay)
- Credit Card
- Retail (Alfamart, Indomaret)

## Related Components
- `XenditPaymentModal`
- `PaymentPlanCard`
