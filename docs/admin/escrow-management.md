# Escrow Management

## Overview
Manajemen escrow platform untuk semua merchant.

## File Location
- `src/pages/admin/Escrow.tsx` - Halaman manajemen escrow

## Database Tables
- `escrow_accounts` - Akun escrow per merchant
- `escrow_transactions` - Transaksi escrow
- `disbursements` - Pencairan dana

## Features
- ✅ View semua escrow accounts
- ✅ Total escrow balance
- ✅ Pending disbursements
- ✅ Transaction history
- ✅ Manual disbursement approval
- ✅ Disbursement review

## Implementation Status
| Feature | Status |
|---------|--------|
| List Accounts | ✅ Complete |
| Balance View | ✅ Complete |
| Transaction History | ✅ Complete |
| Disbursement Approval | ✅ Complete |

## Escrow Flow
1. Tenant bayar invoice
2. Dana masuk ke escrow merchant
3. Platform fee dipotong otomatis
4. Dana available untuk disbursement
5. Disbursement ke bank account merchant

## Transaction Types
- `deposit` - Dana masuk dari payment
- `withdrawal` - Pencairan ke merchant
- `fee` - Platform fee
- `refund` - Refund ke tenant

## Related Components
- `Disbursements` management
- Xendit integration
