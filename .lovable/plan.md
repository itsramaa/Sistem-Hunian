
# Phase 2: Financial & Contract Consolidation

Merge "Kontrak Sewa" into TransactionsHub, rename to FinanceHub, and redirect legacy routes.

## Changes

### 1. Rename & Update `src/pages/merchant/TransactionsHub.tsx` to `FinanceHub.tsx`

Create new file `src/pages/merchant/FinanceHub.tsx` (replacing TransactionsHub):
- Add `MerchantContracts` as a third lazy-loaded tab
- Update `TAB_MAP` to `{ invoices, payments, contracts }`
- Add "Kontrak" `TabsTrigger`
- Update `PageHeader` title to "Keuangan" and description to "Kelola tagihan, pembayaran, dan kontrak sewa"

### 2. Update `src/shared/components/layouts/navigation-config.ts`

- Remove standalone `{ path: "/merchant/contracts", icon: ClipboardList, label: "Kontrak Sewa" }` item
- Rename "Transaksi & Tagihan" to "Keuangan"
- Change path from `/merchant/transactions` to `/merchant/finance`
- Update `activePatterns` to include `/merchant/contracts`

### 3. Update `src/App.tsx`

- Replace `MerchantTransactionsHub` import with new `MerchantFinanceHub` import
- Change hub route: `path="transactions"` becomes `path="finance"` using `MerchantFinanceHub`
- Add redirects for legacy routes:
  - `path="transactions"` redirects to `/merchant/finance`
  - `path="contracts"` redirects to `/merchant/finance#contracts`
  - `path="invoices"` redirects to `/merchant/finance#invoices`
  - `path="payments"` redirects to `/merchant/finance#payments`
- Keep detail routes intact (`contracts/:contractId`, `invoices/:invoiceId`, `payments/:paymentId`) since those are standalone detail pages

## Technical Details

### FinanceHub.tsx structure

```text
TAB_MAP = { invoices, payments, contracts }
Tabs: Tagihan | Pembayaran | Kontrak
Lazy imports: Invoices, Payments, Contracts
```

### Navigation Config changes

The "Keuangan" group goes from 2 items to 1:

| Before | After |
|--------|-------|
| Transaksi & Tagihan (path: /merchant/transactions) | Keuangan (path: /merchant/finance, activePatterns includes /merchant/contracts) |
| Kontrak Sewa (standalone) | (removed - merged as tab) |

### Route changes in App.tsx

| Route | Before | After |
|-------|--------|-------|
| `finance` | (new) | `FinanceHub` component |
| `transactions` | `TransactionsHub` | Redirect to `/merchant/finance` |
| `contracts` | `MerchantContracts` | Redirect to `/merchant/finance#contracts` |
| `invoices` | `MerchantInvoices` | Redirect to `/merchant/finance#invoices` |
| `payments` | `MerchantPayments` | Redirect to `/merchant/finance#payments` |
| `contracts/:contractId` | `MerchantContractDetail` | Unchanged (detail page) |
| `invoices/:invoiceId` | `MerchantInvoiceDetail` | Unchanged (detail page) |
| `payments/:paymentId` | `MerchantPaymentDetail` | Unchanged (detail page) |

### File Summary

| File | Action |
|------|--------|
| `src/pages/merchant/FinanceHub.tsx` | Create - 3-tab hub (Tagihan, Pembayaran, Kontrak) |
| `src/pages/merchant/TransactionsHub.tsx` | Delete (replaced by FinanceHub) |
| `src/shared/components/layouts/navigation-config.ts` | Modify - remove Contracts item, rename to Keuangan, update path and activePatterns |
| `src/App.tsx` | Modify - add finance route, redirect transactions/contracts/invoices/payments to finance hub |
