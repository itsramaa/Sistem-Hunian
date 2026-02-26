
# Implementasi 1.4: Normalisasi Verification Status

## Ringkasan

Menghapus 8 kolom snapshot verifikasi dari tabel `merchants` dan menjadikan `merchant_verification_history` sebagai single source of truth. Kolom `verification_status` dipertahankan di `merchants` tapi dijaga otomatis via database trigger -- ini memastikan backward compatibility tanpa perlu mengubah 30+ file yang membaca `verification_status`.

## Adaptasi dari Proposal Asli

Proposal asli menggunakan `latest_verification_id REFERENCES merchant_verifications(id)`, tapi ini tidak cocok karena `merchant_verifications` saat ini menyimpan data per-DOKUMEN (KTP, NPWP, dll), bukan status keseluruhan merchant. Pendekatan yang lebih bersih:

- `verification_status` tetap di `merchants` tapi **hanya diupdate via trigger** dari `merchant_verification_history`
- Semua detail (verified_at, rejected_by, rejection_details, dll) hanya ada di `merchant_verification_history`
- Code yang MENULIS status wajib insert ke history (trigger auto-sync ke merchants)
- Code yang MEMBACA status cukup baca `merchants.verification_status` (tidak perlu JOIN)

## Kolom yang Dihapus dari `merchants` (8 kolom)

| Kolom | Data tersedia di |
|-------|-----------------|
| `verified_at` | `merchant_verification_history.created_at` WHERE action='approved' |
| `verified_by` | `merchant_verification_history.performed_by` WHERE action='approved' |
| `rejected_at` | `merchant_verification_history.created_at` WHERE action='rejected' |
| `rejected_by` | `merchant_verification_history.performed_by` WHERE action='rejected' |
| `rejection_details` | `merchant_verification_history.rejection_details` |
| `resubmission_count` | `COUNT(*) FROM merchant_verification_history WHERE action='resubmitted'` |
| `resubmission_instructions` | `merchant_verification_history.resubmission_instructions` |
| `verification_submitted_at` | `merchant_verification_history.created_at` WHERE action='submitted' |

## Kolom yang DIPERTAHANKAN (trigger-maintained)

- `verification_status` -- auto-synced via trigger on `merchant_verification_history` INSERT

## Step-by-Step Implementation

### Step 1: Database Migration

```sql
-- 1. Create trigger function to sync verification_status
CREATE OR REPLACE FUNCTION sync_merchant_verification_status()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF NEW.new_status IS NOT NULL THEN
    UPDATE merchants SET verification_status = NEW.new_status WHERE id = NEW.merchant_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_sync_merchant_verification_status
AFTER INSERT ON merchant_verification_history
FOR EACH ROW EXECUTE FUNCTION sync_merchant_verification_status();

-- 2. Seed initial history entries for merchants without history
INSERT INTO merchant_verification_history (merchant_id, action, old_status, new_status, created_at)
SELECT m.id, 'submitted', NULL, m.verification_status, COALESCE(m.verification_submitted_at, m.created_at)
FROM merchants m
WHERE NOT EXISTS (
  SELECT 1 FROM merchant_verification_history h WHERE h.merchant_id = m.id
);

-- 3. Drop views that reference these columns
DROP VIEW IF EXISTS v_merchants_with_addresses;

-- 4. Drop 8 snapshot columns
ALTER TABLE merchants DROP COLUMN IF EXISTS verified_at;
ALTER TABLE merchants DROP COLUMN IF EXISTS verified_by;
ALTER TABLE merchants DROP COLUMN IF EXISTS rejected_at;
ALTER TABLE merchants DROP COLUMN IF EXISTS rejected_by;
ALTER TABLE merchants DROP COLUMN IF EXISTS rejection_details;
ALTER TABLE merchants DROP COLUMN IF EXISTS resubmission_count;
ALTER TABLE merchants DROP COLUMN IF EXISTS resubmission_instructions;
ALTER TABLE merchants DROP COLUMN IF EXISTS verification_submitted_at;

-- 5. Recreate view without dropped columns
CREATE VIEW v_merchants_with_addresses AS
SELECT m.*,
  a.street_address AS resolved_address,
  a.city AS resolved_city,
  a.province AS resolved_province,
  a.postal_code AS resolved_postal_code
FROM merchants m
LEFT JOIN addresses a ON m.headquarters_address_id = a.id;
```

### Step 2: Update `merchantService.ts` (MAJOR)

This is the most critical file. Changes:

**`verifyMerchant()`**: Remove direct `merchants` update for verification_status. Instead, only insert into `merchant_verification_history` -- the trigger will auto-sync `verification_status` on merchants.

Before:
```ts
const updateData = { verification_status: status, verified_at: ..., verified_by: ... };
await supabase.from('merchants').update(updateData).eq('id', merchant.id);
await supabase.from('merchant_verification_history').insert({...});
```

After:
```ts
// Single write to history -- trigger auto-syncs merchants.verification_status
await supabase.from('merchant_verification_history').insert({
  merchant_id: merchant.id,
  action: status === 'verified' ? 'approved' : 'rejected',
  performed_by: adminId,
  approval_notes, rejection_reason, rejection_details, resubmission_instructions,
  old_status: currentStatus,
  new_status: status,
});
```

**`suspendMerchant()`**: Same pattern -- insert history, trigger syncs.

**`bulkApprove()`**: Same pattern -- insert history entries, trigger syncs per row.

### Step 3: Update TypeScript Types (3 files)

**`src/features/users/types/merchant.ts`**: Remove `verified_at`, `verified_by`, `rejected_at`, `rejected_by`, `rejection_details`, `resubmission_count`, `resubmission_instructions`, `verification_submitted_at`.

**`src/features/users/types/admin-merchant.ts`**: Remove `verified_at`, `verified_by`, `rejected_at` from Merchant interface.

**`src/features/auth/types/auth.ts`**: No change needed (MerchantProfile only has `verification_status`).

### Step 4: Update Edge Functions (2 files)

**`supabase/functions/ensure-user-bootstrap/index.ts`**: Currently sets `verification_status: 'pending'` -- this still works since the column exists.

**`supabase/functions/scheduled-disbursement/index.ts`**: Filters by `.eq('verification_status', 'verified')` -- no change needed.

### Step 5: Update `MerchantDetailDialog.tsx`

The dialog footer currently shows Approve/Reject based on `merchant.verification_status !== 'verified'`. This still works. But any display of `verified_at` or `rejected_at` (if used in details tab) needs to query from history instead.

### Step 6: Update Documentation

Mark section 1.4 in `old-docs/merchant_database_refactor.md` as DONE.

## Files yang Diubah

| File | Perubahan |
|------|-----------|
| Database migration | Create trigger, seed history, drop 8 columns, recreate view |
| `src/features/users/services/merchantService.ts` | Remove direct merchants update in verifyMerchant/suspendMerchant/bulkApprove -- write to history only |
| `src/features/users/types/merchant.ts` | Remove 8 snapshot fields |
| `src/features/users/types/admin-merchant.ts` | Remove verified_at, verified_by, rejected_at |
| `src/features/escrow/hooks/useMerchantEscrow.ts` | No change (reads verification_status only) |
| `old-docs/merchant_database_refactor.md` | Mark 1.4 as DONE |

## Impak Minimal

Karena `verification_status` tetap di `merchants` (trigger-maintained), file-file berikut **TIDAK perlu diubah**:
- `AdminMerchantsTable.tsx` (reads verification_status)
- `MerchantDetailsTab.tsx` (reads verification_status)
- `Merchants.tsx` (filters by verification_status)
- `Profile.tsx` (reads verification_status)
- `useMerchantEscrow.ts` (reads verification_status)
- `escrowService.ts` (reads verification_status)
- All edge functions that filter by verification_status
- `auth.ts` types
- `state-machines.ts`
- `merchant.ts` constants

Total perubahan: **~4 files** instead of 30+, karena trigger approach.
