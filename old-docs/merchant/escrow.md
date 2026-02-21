# Merchant Escrow

## Overview
Escrow account merchant untuk menyimpan dana dari pembayaran tenant.

## File Location
- `src/pages/merchant/Escrow.tsx` - Halaman escrow

## Database Tables
- `escrow_accounts` - Akun escrow
- `escrow_transactions` - Transaksi escrow
- `disbursements` - Pencairan

## API/Edge Functions
- `supabase/functions/xendit-disbursement/index.ts`
- `supabase/functions/scheduled-disbursement/index.ts`

## Features
- ✅ View balance
- ✅ View pending balance
- ✅ Transaction history
- ✅ Request disbursement
- ✅ Disbursement schedule settings
- ✅ Bank account management

## Implementation Status
| Feature | Status |
|---------|--------|
| Balance | ✅ Complete |
| History | ✅ Complete |
| Disbursement | ✅ Complete |
| Schedule | ✅ Complete |
| Bank Accounts | ✅ Complete |

## Escrow Flow
1. Tenant bayar invoice
2. Dana masuk ke pending balance
3. Setelah settlement, pindah ke available balance
4. Merchant request disbursement atau auto-disburse

## Related Components
- `BankAccountManager`
- `DisbursementScheduleSettings`
