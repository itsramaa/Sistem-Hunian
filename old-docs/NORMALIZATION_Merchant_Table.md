# Normalization Refactor Plan: Merchant Table

Dokumen ini merinci langkah-langkah refactoring yang diperlukan untuk menghapus kolom denormalisasi (`subscription_tier`, `disbursement_schedule`, `billing_day`) dari tabel `merchants` dan memindahkannya ke sumber kebenaran tunggal (Single Source of Truth) di `merchant_subscriptions` dan `subscription_tiers`.

---

## 1. Database Migration (SQL) — ✅ DONE

Kolom `subscription_tier`, `disbursement_schedule`, dan `billing_day` sudah dihapus dari tabel `merchants`. Data sudah dimigrasikan ke `merchant_subscriptions`.

## 2. TypeScript Types Refactor — ✅ DONE

- `src/integrations/supabase/types.ts` — auto-generated, sudah tidak mengandung kolom lama.
- `src/features/users/types/merchant.ts` — bersih.
- `src/features/users/types/merchant-profile.ts` — bersih.
- `src/features/auth/types/auth.ts` — bersih.
- `src/features/users/types/admin-merchant.ts` — menggunakan join path `merchant_subscriptions.subscription_tiers.name`.

## 3. Services & Hooks Refactor — ✅ DONE

- `merchantService.ts` — sudah JOIN ke `merchant_subscriptions(tier_id, status, subscription_tiers(name))`.
- `useMerchantEscrow.ts` — sudah baca `disbursement_schedule` dari `merchant_subscriptions`.
- `subscriptionService.ts` — sudah menjadi mediator utama untuk data berlangganan.

## 4. UI Components Refactor — ✅ DONE

- `MerchantDetailsTab.tsx` — menggunakan `merchant.merchant_subscriptions?.[0]?.subscription_tiers?.name`.
- `SubscriptionPayment.tsx` — redundant update ke `merchants.subscription_tier` dihapus.
- `AdminMerchantsTable.tsx` — menampilkan tier melalui data subscription join.
- `Escrow.tsx` — membaca `disbursement_schedule` dari hook subscription.
- `DisbursementScheduleSettings.tsx` — mutasi menargetkan `merchant_subscriptions`.

## 5. Verification Plan — ✅ DONE

- [x] Tidak ada Linter/TS errors terkait missing `subscription_tier` pada `Merchant`.
- [x] Dashboard Merchant: tier ditampilkan via join path.
- [x] Escrow Settings: jadwal pencairan dibaca dari `merchant_subscriptions`.
- [x] Admin Panel: filter merchant berdasarkan tier via join data.

---

## Exhaustive Audit (39 File) — ✅ DONE

Semua 39 file yang teridentifikasi dalam audit telah di-refactor untuk menggunakan data dari `merchant_subscriptions` dan `subscription_tiers` alih-alih kolom denormalisasi langsung dari `merchants`.
