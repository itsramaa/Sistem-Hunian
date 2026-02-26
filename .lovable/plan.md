

# Implementasi NORMALIZATION_Merchant_Table.md

## Status Audit Per Section

| Section | Status | Detail |
|---------|--------|--------|
| 1. Database Migration (SQL) | ✅ DONE | Kolom `subscription_tier`, `disbursement_schedule`, `billing_day` sudah tidak ada di tabel `merchants`. Data sudah dimigrasikan ke `merchant_subscriptions`. |
| 2. TypeScript Types Refactor | ✅ DONE | `merchant.ts`, `merchant-profile.ts`, `auth.ts` sudah tidak mengandung field-field ini. `types.ts` auto-generated sudah benar. |
| 3. Services & Hooks Refactor | ✅ DONE | `merchantService.ts` sudah JOIN ke `merchant_subscriptions(tier_id, status, subscription_tiers(name))`. `useMerchantEscrow.ts` sudah baca dari `merchant_subscriptions(disbursement_schedule)`. |
| 4. UI Components Refactor | ⏳ PARTIAL | 2 file masih menggunakan kolom lama (menyebabkan build error) |
| 5. Verification Plan | Belum diceklis |

## Yang Perlu Difix (2 File)

### Fix 1: `MerchantDetailsTab.tsx` (line 54-60)
- **Masalah**: `merchant.subscription_tier` tidak ada di type `Merchant`
- **Solusi**: Ganti dengan `merchant.merchant_subscriptions?.[0]?.subscription_tiers?.name || "free"`

### Fix 2: `SubscriptionPayment.tsx` (line 200-203)
- **Masalah**: Masih mencoba update `subscription_tier` pada tabel `merchants` (kolom sudah tidak ada)
- **Solusi**: Hapus baris tersebut. Data subscription sudah di-upsert ke `merchant_subscriptions` di baris sebelumnya (line 189-198).

## Step 3: Copy File + Update Checklist

Copy `NORMALIZATION_Merchant_Table.md` ke `old-docs/` dan update semua section dengan status:
- Section 1: ✅ DONE
- Section 2: ✅ DONE
- Section 3: ✅ DONE
- Section 4: ✅ DONE (setelah fix)
- Section 5: ✅ DONE (no linter errors, UI uses join path)

## Files yang Diubah

| File | Perubahan |
|------|-----------|
| `src/features/users/components/admin/MerchantDetailsTab.tsx` | Ganti `merchant.subscription_tier` dengan data dari `merchant_subscriptions` join |
| `src/features/subscriptions/components/SubscriptionPayment.tsx` | Hapus update ke `merchants.subscription_tier` (redundant) |
| `old-docs/NORMALIZATION_Merchant_Table.md` | Copy file + update checklist semua section |

