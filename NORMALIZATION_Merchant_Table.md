# Normalization Refactor Plan: Merchant Table

Dokumen ini merinci langkah-langkah refactoring yang diperlukan untuk menghapus kolom denormalisasi (`subscription_tier`, `disbursement_schedule`, `billing_day`) dari tabel `merchants` dan memindahkannya ke sumber kebenaran tunggal (Single Source of Truth) di `merchant_subscriptions` dan `subscription_tiers`.

## 1. Database Migration (SQL)

Eksekusi migrasi berikut di Supabase SQL Editor:

```sql
-- Step 1: Ensure all merchants have a record in merchant_subscriptions
INSERT INTO merchant_subscriptions (merchant_id, tier_id, status, created_at)
SELECT id, COALESCE(subscription_tier, (SELECT id FROM subscription_tiers WHERE name = 'free' LIMIT 1)), 'active', NOW()
FROM merchants 
WHERE id NOT IN (SELECT merchant_id FROM merchant_subscriptions);

-- Step 2: Verify data consistency
SELECT m.id, m.subscription_tier, ms.tier_id 
FROM merchants m
LEFT JOIN merchant_subscriptions ms ON m.id = ms.merchant_id
WHERE m.subscription_tier != ms.tier_id;

-- Step 3: Remove redundant columns
ALTER TABLE merchants DROP COLUMN subscription_tier CASCADE;
ALTER TABLE merchants DROP COLUMN disbursement_schedule CASCADE;
ALTER TABLE merchants DROP COLUMN billing_day CASCADE;
```

## 2. TypeScript Types Refactor

Update tipe data berikut untuk menghapus field yang akan di-drop:

- **[integrations/supabase/types.ts](file:///f:/Coding/React/Sistem-Hunian/src/integrations/supabase/types.ts)**: Jalankan `npx supabase gen types typescript` atau hapus manual kolom tersebut dari definisi tabel `merchants`.
- **[features/users/types/merchant.ts](file:///f:/Coding/React/Sistem-Hunian/src/features/users/types/merchant.ts)**: Hapus dari interface `Merchant`.
- **[features/users/types/merchant-profile.ts](file:///f:/Coding/React/Sistem-Hunian/src/features/users/types/merchant-profile.ts)**: Hapus dari interface `MerchantProfile`.
- **[features/auth/types/auth.ts](file:///f:/Coding/React/Sistem-Hunian/src/features/auth/types/auth.ts)**: Hapus dari tipe user/session context.

## 3. Services & Hooks Refactor

Update logika pengambilan data untuk melakukan JOIN ke `merchant_subscriptions`:

- **[merchantService.ts](file:///f:/Coding/React/Sistem-Hunian/src/features/users/services/merchantService.ts)**:
  - Update `fetchMerchants` untuk mengambil `tier` melalui JOIN ke `merchant_subscriptions`.
  - Filter `subscription_tier` harus diubah menjadi filter pada tabel terkait.
- **[useMerchantEscrow.ts](file:///f:/Coding/React/Sistem-Hunian/src/features/escrow/hooks/useMerchantEscrow.ts)**:
  - Ambil `disbursement_schedule` dari `merchant_subscriptions` (atau join ke `subscription_tiers` jika level tier menentukan jadwal).
- **[subscriptionService.ts](file:///f:/Coding/React/Sistem-Hunian/src/features/subscriptions/services/subscriptionService.ts)**:
  - Pastikan service ini menjadi mediator utama untuk data berlangganan.

## 4. UI Components Refactor

Update komponen yang menampilkan atau mengubah data tersebut:

- **[DisbursementScheduleSettings.tsx](file:///f:/Coding/React/Sistem-Hunian/src/features/payments/components/DisbursementScheduleSettings.tsx)**:
  - Update `onSubmit` dan `initialData` untuk berinteraksi dengan tabel `merchant_subscriptions`.
- **[Escrow.tsx](file:///f:/Coding/React/Sistem-Hunian/src/pages/merchant/Escrow.tsx)**:
  - Ganti `merchantData.disbursement_schedule` dengan data dari hook subscription.
- **[AdminMerchantsTable.tsx](file:///f:/Coding/React/Sistem-Hunian/src/features/users/components/admin/AdminMerchantsTable.tsx)**:
  - Tampilkan tier melalui data subscription.

## 5. Verification Plan

- [ ] Pastikan tidak ada `Linter Errors` di VS Code terkait missing properties pada `Merchant`.
- [ ] Test Dashboard Merchant: Verifikasi status tier muncul dengan benar.
- [ ] Test Escrow Settings: Verifikasi perubahan jadwal pencairan tersimpan ke tabel yang benar.
- [ ] Test Admin Panel: Verifikasi filter merchant berdasarkan tier tetap berfungsi.
