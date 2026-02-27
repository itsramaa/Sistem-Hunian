# Escrow Management — DEPRECATED (Merchant)

## ⚠️ Status: Merchant escrow REMOVED, Vendor escrow RETAINED

Per migration `20260227084712`, merchant escrow dihapus. Diganti dengan Direct Payment Model.

## Current System

### Merchant (Direct Payment)
- **Page**: `/admin/payment-transfers` (label: "Transfer Dana")
- **File**: `src/pages/admin/PaymentTransfers.tsx`
- **Table**: `payment_transfers`
- **Flow**: Payment confirmed → `payment_transfers` record → pending → processing → completed/failed
- Admin monitors transfer status, no manual approval needed

### Vendor (Escrow Retained)
- Escrow masih digunakan untuk vendor maintenance transactions
- Auto-release 48 jam setelah job completed
- `vendor_earnings` table untuk tracking

## Old Features (No Longer Active for Merchant)
- ~~`src/pages/admin/Escrow.tsx`~~ — No longer exists
- ~~`escrow_accounts` per merchant~~ — Not created on registration
- ~~Manual disbursement approval~~ — Removed
- ~~`scheduled-disbursement` for merchants~~ — Vendor-only now
- ~~`xendit-disbursement` for merchants~~ — Vendor-only now
