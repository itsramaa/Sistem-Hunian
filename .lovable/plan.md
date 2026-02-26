

# Implementasi 1.6: Invoice & Payment Relationship Cleanup

## Ringkasan

Menghapus kolom redundan `payment_plan_id` dari tabel `invoices`, karena relasi sudah tersedia dari arah sebaliknya (`payment_plans.invoice_id`). Semua query yang sebelumnya membaca/menulis `invoices.payment_plan_id` akan diubah untuk menggunakan `payment_plans.invoice_id` sebagai sumber kebenaran.

Menambahkan index performa untuk clear hierarchy: `contracts -> invoices -> payments/payment_plans/collections_cases`.

## Apa yang Berubah di Database

- **Drop** kolom `payment_plan_id` dari tabel `invoices` (beserta FK constraint `invoices_payment_plan_id_fkey`)
- **Tambah** index pada `invoices(merchant_id, due_date)` dan `invoices(status, due_date)` untuk query pattern yang sering dipakai
- **Tambah** index pada `payment_plans(invoice_id)` untuk reverse lookup yang menggantikan `invoices.payment_plan_id`

## Dampak pada Code

### Masalah Utama

3 tempat menulis `invoices.payment_plan_id`:
1. `paymentPlanService.ts` -- `.update({ payment_plan_id: plan.id })` saat buat plan
2. `check-payment-plan/index.ts` -- `.update({ payment_plan_id: null })` saat plan defaulted

3 tempat membaca `invoices.payment_plan_id` (filter `.is('payment_plan_id', null)`):
1. `useMerchantPayments.ts` -- overdue invoices tanpa payment plan
2. `check-overdue-escalation/index.ts` -- same filter
3. `auto-generate-invoices/index.ts` -- same filter

### Solusi

**Untuk WRITE**: Hapus update ke `invoices.payment_plan_id` -- tidak perlu lagi karena `payment_plans.invoice_id` sudah menyimpan relasi ini.

**Untuk READ (`.is('payment_plan_id', null)`)**: Ganti dengan LEFT JOIN + filter. Query overdue invoices yang **tidak punya** active payment plan:
- Fetch semua invoice overdue, lalu filter client-side dengan subquery ke `payment_plans`
- Atau: buat database function `get_overdue_invoices_without_plan(merchant_id)` untuk performa

Pendekatan yang dipilih: **two-step query** -- fetch overdue invoices, lalu fetch active payment plan invoice_ids, lalu filter client-side. Ini paling sederhana dan tidak butuh RPC baru.

## Files yang Diubah

| File | Perubahan |
|------|-----------|
| **Database migration** | Drop `payment_plan_id` dari invoices, add indexes |
| `src/features/payments/services/paymentPlanService.ts` | Remove `.update({ payment_plan_id: plan.id })` di `createPaymentPlan` |
| `src/features/payments/hooks/useMerchantPayments.ts` | Replace `.is('payment_plan_id', null)` dengan two-step query |
| `src/features/payments/types/index.ts` | Remove `payment_plan_id` dari Invoice interface |
| `supabase/functions/check-payment-plan/index.ts` | Remove `.update({ payment_plan_id: null })` saat plan defaulted |
| `supabase/functions/check-overdue-escalation/index.ts` | Replace `.is('payment_plan_id', null)` dengan subquery |
| `supabase/functions/auto-generate-invoices/index.ts` | Replace `.is('payment_plan_id', null)` dengan subquery |
| `old-docs/merchant_database_refactor.md` | Mark 1.6 as DONE |

## Detail Perubahan per File

### Database Migration
```sql
-- Drop redundant FK
ALTER TABLE invoices DROP COLUMN IF EXISTS payment_plan_id;

-- Performance indexes for clear hierarchy
CREATE INDEX IF NOT EXISTS idx_invoices_merchant_due ON invoices (merchant_id, due_date);
CREATE INDEX IF NOT EXISTS idx_invoices_status_due ON invoices (status, due_date);
CREATE INDEX IF NOT EXISTS idx_payment_plans_invoice ON payment_plans (invoice_id);
```

### `paymentPlanService.ts`
Remove lines 55-59 (the `invoices.update({ payment_plan_id })` call). The relationship is already stored in `payment_plans.invoice_id`.

### `useMerchantPayments.ts`
Replace single query with two-step:
1. Fetch overdue invoices (without `payment_plan_id` filter)
2. Fetch active payment plan `invoice_id`s for this merchant
3. Filter out invoices that have active plans client-side

### `check-payment-plan/index.ts` (Edge Function)
Remove lines 150-157 where it sets `payment_plan_id: null` on the invoice when plan defaults. Keep the `status: 'pending'` update.

### `check-overdue-escalation/index.ts` (Edge Function)
Replace `.is('payment_plan_id', null)` with a two-step approach:
1. Fetch overdue invoices
2. Fetch active payment plan invoice_ids
3. Filter in code

### `auto-generate-invoices/index.ts` (Edge Function)
Same pattern as above -- replace `.is('payment_plan_id', null)` with subquery filter.

### `src/features/payments/types/index.ts`
Remove `payment_plan_id?: string | null` from Invoice interface.

## Files yang TIDAK perlu diubah
- `paymentPlanService.ts` query (`getTenantPaymentPlans`) -- already queries `payment_plans` table with `invoice:invoices(invoice_number)`, no change needed
- `PaymentPlanDialog.tsx` -- uses `payment_plan_id` only for `Omit<PaymentPlanInstallment, 'id' | 'payment_plan_id'>` which is the installments table, not invoices
- All other invoice queries that don't reference `payment_plan_id`

