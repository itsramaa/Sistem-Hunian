# Xendit Integration

## Overview
Integrasi payment gateway Xendit untuk semua pembayaran.

## File Location
- `src/components/payment/XenditPaymentModal.tsx` - Payment modal
- `supabase/functions/xendit-webhook/index.ts` - Webhook
- `supabase/functions/xendit-create-invoice/index.ts` - Create invoice
- `supabase/functions/xendit-disbursement/index.ts` - Disbursement
- `supabase/functions/xendit-disbursement-webhook/index.ts` - Disbursement webhook

## Database Tables
- `xendit_transactions` - Transaksi
- `payments` - Pembayaran
- `disbursements` - Pencairan

## Environment Variables
- `XENDIT_API_KEY` - API Key Xendit

## Features
- ✅ Create invoice
- ✅ Virtual Account payment
- ✅ E-Wallet payment
- ✅ Credit Card payment
- ✅ Retail payment
- ✅ Webhook handling
- ✅ Disbursement

## Implementation Status
| Feature | Status |
|---------|--------|
| Create Invoice | ✅ Complete |
| VA Payment | ✅ Complete |
| E-Wallet | ✅ Complete |
| Credit Card | ✅ Complete |
| Webhook | ✅ Complete |
| Disbursement | ✅ Complete |

## Payment Flow
1. Create invoice via edge function
2. User redirected to Xendit payment page
3. User completes payment
4. Xendit sends webhook
5. System updates payment status
6. Redirect to success/failed page

## Webhook Events
- `invoice.paid`
- `invoice.expired`
- `disbursement.completed`
- `disbursement.failed`

## Related Components
- `XenditPaymentModal`
- Success/Failed pages
