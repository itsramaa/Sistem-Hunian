

# Implementasi 1.2: Konsolidasi Referral Data dari Merchants Table

## Ringkasan

Menghapus 3 kolom referral duplikat (`referred_by`, `referral_discount`, `referral_discount_months`) dari tabel `merchants` dan membuat view `merchant_referral_summary` sebagai pengganti.

## Status Audit

| Kolom | Digunakan di | Rencana |
|-------|-------------|---------|
| `referred_by` | `auth-webhook` (insert saat signup), `merchant.ts` type | Drop, simpan di `referrals` table |
| `referral_discount` | `auth-webhook` (insert saat signup), `merchant.ts` type | Drop, data sudah di `referral_rewards` |
| `referral_discount_months` | `auth-webhook` (insert saat signup), `merchant.ts` type | Drop, data sudah di `referral_commissions` |

Tidak ada frontend code yang **membaca** kolom-kolom ini dari merchants. Hanya `auth-webhook` yang **menulis** saat signup.

## Step-by-Step

### Step 1: Database Migration

1. Migrate existing `referred_by` data ke `referrals` table (untuk merchant yang punya referrer tapi belum ada record di referrals)
2. Drop 3 kolom: `referred_by`, `referral_discount`, `referral_discount_months`
3. Recreate `v_merchants_with_addresses` view tanpa kolom tersebut
4. Create view `merchant_referral_summary` (regular view, bukan materialized -- karena data berubah dan tidak perlu manual refresh)

```sql
-- Migrate referred_by data to referrals if not already tracked
INSERT INTO referrals (referrer_user_id, referee_user_id, referrer_role, status, created_at)
SELECT m.referred_by, m.user_id, 'merchant', 'completed', m.created_at
FROM merchants m
WHERE m.referred_by IS NOT NULL
AND NOT EXISTS (
  SELECT 1 FROM referrals r WHERE r.referee_user_id = m.user_id
);

-- Drop and recreate view without referral columns
DROP VIEW IF EXISTS v_merchants_with_addresses;

ALTER TABLE merchants DROP COLUMN IF EXISTS referred_by;
ALTER TABLE merchants DROP COLUMN IF EXISTS referral_discount;
ALTER TABLE merchants DROP COLUMN IF EXISTS referral_discount_months;

-- Recreate view (same as current minus 3 dropped columns)
CREATE VIEW v_merchants_with_addresses AS
SELECT m.id, m.user_id, m.business_name, m.business_type,
  m.address, m.city, m.province, m.postal_code,
  m.verification_status, m.created_at, m.updated_at,
  m.merchant_code, m.penalty_rate, m.verified_at, m.verified_by,
  m.rejected_at, m.rejected_by, m.rejection_details,
  m.resubmission_instructions, m.resubmission_count,
  m.verification_submitted_at, m.min_disbursement_amount,
  m.last_disbursement_date, m.total_disbursed, m.address_id,
  COALESCE(a.street_address, m.address) AS resolved_address,
  COALESCE(a.city, m.city::varchar) AS resolved_city,
  COALESCE(a.province, m.province::varchar) AS resolved_province,
  COALESCE(a.postal_code, m.postal_code::varchar) AS resolved_postal_code
FROM merchants m
LEFT JOIN addresses a ON m.address_id = a.id;

-- Create referral summary view
CREATE VIEW merchant_referral_summary AS
SELECT
  m.id AS merchant_id,
  r.referrer_user_id,
  r.referral_code,
  r.status AS referral_status,
  r.reward_amount,
  r.converted_at,
  COALESCE(SUM(rc.commission_amount), 0) AS total_commissions
FROM merchants m
LEFT JOIN referrals r ON m.user_id = r.referee_user_id
LEFT JOIN referral_commissions rc ON r.id = rc.referral_id
GROUP BY m.id, r.referrer_user_id, r.referral_code, r.status, r.reward_amount, r.converted_at;
```

### Step 2: Update `auth-webhook` Edge Function

Remove `referral_discount`, `referral_discount_months`, and `referred_by` from the merchant insert. The referral linkage is already handled separately in the webhook (it updates the `referrals` table with `referee_user_id`).

**Before:**
```ts
.insert({
  user_id,
  business_name: business_name || 'My Business',
  referral_discount: referralDiscount,
  referral_discount_months: referralDiscountMonths,
  referred_by: referrerInfo?.userId || null,
})
```

**After:**
```ts
.insert({
  user_id,
  business_name: business_name || 'My Business',
})
```

The `trialDays` and subscription logic (lines 173, 221-234) already correctly use `referrerInfo` to give extra trial days, so that's preserved.

### Step 3: Update TypeScript Type

Remove `referred_by`, `referral_discount`, `referral_discount_months` from `src/features/users/types/merchant.ts`.

### Step 4: Update Documentation

Update `old-docs/merchant_database_refactor.md` section 1.2 from "SKIP" to "DONE".

## Files yang Diubah

| File | Perubahan |
|------|-----------|
| Database migration | Migrate data, drop 3 columns, recreate view, create summary view |
| `supabase/functions/auth-webhook/index.ts` | Remove 3 fields from merchant insert |
| `src/features/users/types/merchant.ts` | Remove 3 fields from interface |
| `old-docs/merchant_database_refactor.md` | Mark 1.2 as DONE |

## Catatan Penting

- `vendors.referred_by` TIDAK terpengaruh (itu kolom terpisah di tabel `vendors`)
- `process-vendor-order-referral` edge function TIDAK terpengaruh
- Referral discount logic tetap berfungsi via `referrerInfo` check di auth-webhook (extra trial days)
- View menggunakan regular VIEW (bukan MATERIALIZED) agar selalu up-to-date tanpa manual refresh

