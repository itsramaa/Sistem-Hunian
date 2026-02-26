

# Implementasi 1.1: Drop Data Duplikasi dari Merchants Table

## Ringkasan

Menghapus 3 kolom duplikat (`subscription_tier`, `disbursement_schedule`, `billing_day`) dari tabel `merchants` dan memigrasikan semua referensi ke `merchant_subscriptions`.

## Status Audit

| Kolom | Masih digunakan di | Rencana |
|-------|-------------------|---------|
| `subscription_tier` | **Tidak ada** - semua code sudah pakai `merchant_subscriptions.subscription_tiers.name` | Langsung drop |
| `disbursement_schedule` | 2 file: `scheduled-disbursement` edge function + `DisbursementScheduleSettings.tsx` (fallback) | Migrate ke `merchant_subscriptions`, update code, drop |
| `billing_day` | 2 file: `auto-generate-invoices` edge function + `DisbursementScheduleSettings.tsx` (fallback) | Migrate ke `merchant_subscriptions`, update code, drop |

## Step-by-Step Implementation

### Step 1: Database Migration

1. **Add columns** `disbursement_schedule` (text, default 'weekly') dan `billing_day` (integer, default 1) ke `merchant_subscriptions`
2. **Migrate data** dari `merchants` ke `merchant_subscriptions` (untuk yang sudah punya subscription)
3. **Drop 3 columns** dari `merchants`: `subscription_tier`, `disbursement_schedule`, `billing_day`

```sql
-- Add columns to merchant_subscriptions
ALTER TABLE merchant_subscriptions 
  ADD COLUMN IF NOT EXISTS disbursement_schedule text DEFAULT 'weekly',
  ADD COLUMN IF NOT EXISTS billing_day integer DEFAULT 1;

-- Migrate existing data
UPDATE merchant_subscriptions ms
SET 
  disbursement_schedule = COALESCE(m.disbursement_schedule, 'weekly'),
  billing_day = COALESCE(m.billing_day, 1)
FROM merchants m
WHERE ms.merchant_id = m.id;

-- Drop redundant columns
ALTER TABLE merchants DROP COLUMN IF EXISTS subscription_tier;
ALTER TABLE merchants DROP COLUMN IF EXISTS disbursement_schedule;
ALTER TABLE merchants DROP COLUMN IF EXISTS billing_day;
```

### Step 2: Update Edge Function - `scheduled-disbursement`

**Perubahan**: Query `merchant_subscriptions` untuk `disbursement_schedule` instead of `merchants` directly.

- Update SQL query untuk JOIN `merchant_subscriptions`
- Update `MerchantWithEscrow` interface
- Update references ke `merchant.disbursement_schedule` menjadi `merchant.merchant_subscriptions[0].disbursement_schedule`

### Step 3: Update Edge Function - `auto-generate-invoices`

**Perubahan**: Query `merchant_subscriptions` untuk `billing_day` instead of `merchants.billing_day`.

- Update SELECT query dari `merchant:merchants(billing_day)` menjadi `merchant:merchants(merchant_subscriptions(billing_day))`
- Update data access path

### Step 4: Update Frontend - `DisbursementScheduleSettings.tsx`

**Perubahan**: Remove `(merchant as any).disbursement_schedule` dan `(merchant as any).billing_day` fallbacks karena data sekarang 100% di `merchant_subscriptions`.

### Step 5: Update Checklist

Update `old-docs/merchant_database_refactor.md` section 1.1 dari "SKIP" menjadi "DONE".

## Files yang Diubah

| File | Perubahan |
|------|-----------|
| Database migration | Add columns to `merchant_subscriptions`, migrate data, drop from `merchants` |
| `supabase/functions/scheduled-disbursement/index.ts` | Query `merchant_subscriptions.disbursement_schedule` instead of `merchants.disbursement_schedule` |
| `supabase/functions/auto-generate-invoices/index.ts` | Query `merchant_subscriptions.billing_day` instead of `merchants.billing_day` |
| `src/features/payments/components/DisbursementScheduleSettings.tsx` | Remove `(merchant as any)` fallbacks |
| `old-docs/merchant_database_refactor.md` | Mark 1.1 as DONE |

## Risiko & Mitigasi

- **Data loss**: Mitigasi dengan migrate data SEBELUM drop columns (dalam satu migration)
- **Edge functions**: Deploy setelah migration berhasil - edge functions baru akan query kolom baru di `merchant_subscriptions`
- **Backward compat**: `DisbursementScheduleSettings.tsx` sudah mengupdate `merchant_subscriptions` (bukan `merchants`) untuk schedule/billing_day, jadi mutation code sudah benar

