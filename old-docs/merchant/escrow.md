# Merchant Escrow — DEPRECATED

## ⚠️ Status: REMOVED

Merchant escrow telah dihapus dari sistem. Diganti dengan **Direct Payment Model** (payment transfers).

Per migration `20260227084712`:
- `create_merchant_escrow` trigger di-drop
- Comment: "Escrow account creation removed -- using direct payment model"
- Tabel `escrow_accounts` dan `escrow_transactions` masih ada di database tapi tidak digunakan untuk merchant

## Replacement

- **Merchant**: Menggunakan `payment_transfers` table. Dana langsung ditransfer ke rekening bank merchant via Xendit settlement.
- **Vendor**: Escrow masih dipertahankan untuk transaksi vendor maintenance (auto-release 48 jam) via `vendor_earnings` table.

## Current References

- `merchantDashboardService.ts` → queries `payment_transfers`, NOT `escrow_accounts`
- `state-machines.ts` Section 13 → `PAYMENT_TRANSFER_TRANSITIONS` (Direct Payment Model)
- `state-machines.ts` Section 13b → `DISBURSEMENT_STATUS_TRANSITIONS` (Vendor Disbursement only)
- Admin page: `/admin/payment-transfers` (label: "Transfer Dana")

## Old Features (No Longer Active for Merchant)

- ~~View balance~~
- ~~View pending balance~~
- ~~Transaction history~~
- ~~Request disbursement~~
- ~~Disbursement schedule settings~~
- ✅ Bank account management (still active, moved to direct payment flow)
