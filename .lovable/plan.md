

# Implementasi Sisa Item dari merchant_database_refactor.md

## Hasil Audit: Item yang Belum Terimplementasi

Setelah cross-check antara dokumen dan database aktual, ditemukan **4 CHECK constraint yang belum ada**:

| Constraint | Table | Rule | Data Violations |
|-----------|-------|------|-----------------|
| `check_trial_days_nonneg` | `subscription_tiers` | `trial_days >= 0` | 0 (aman) |
| `check_business_name_not_empty` | `merchants` | `LENGTH(TRIM(business_name)) > 0` | 0 (aman) |
| `invoices_status_check` | `invoices` | `status IN ('draft','sent','issued','paid','overdue','cancelled','partial')` | 0 (aman) |
| `check_due_date_after_created` | `invoices` | `due_date >= created_at::date` | **5 records** (perlu fix dulu) |

**Catatan**: 5 invoice memiliki `due_date` sebelum `created_at` karena data seed/test. Data akan di-fix sebelum constraint diterapkan.

## Rencana Implementasi

### Migration: Remaining CHECK Constraints

1. **Fix 5 invoice records** yang melanggar: set `created_at` ke timestamp sebelum `due_date`
2. **Add 4 CHECK constraints** (idempotent DO blocks):
   - `subscription_tiers.trial_days >= 0`
   - `merchants.business_name` not empty
   - `invoices.status` enum check
   - `invoices.due_date >= created_at::date`

### Update Checklist di File

Update `old-docs/merchant_database_refactor.md` dengan format emoji yang diminta:
- Checkmark = sudah done
- Clock emoji = partial + penjelasan
- Skip marker = skip + alasan
- Semua item yang sebelumnya "DONE" tetap, yang baru diimplementasikan ditambahkan

**Setelah migration ini, Section 3.1 CHECK constraints menjadi FULLY DONE (bukan partial lagi).**

---

## Detail Teknis

### SQL Migration

```sql
-- Fix 5 invoices where due_date < created_at
UPDATE invoices SET created_at = (due_date - INTERVAL '7 days')::timestamptz
WHERE due_date < created_at::date;

-- Add missing constraints (idempotent)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_trial_days_nonneg') THEN
    ALTER TABLE subscription_tiers ADD CONSTRAINT check_trial_days_nonneg CHECK (trial_days >= 0);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_business_name_not_empty') THEN
    ALTER TABLE merchants ADD CONSTRAINT check_business_name_not_empty 
      CHECK (business_name IS NOT NULL AND LENGTH(TRIM(business_name)) > 0);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'invoices_status_check') THEN
    ALTER TABLE invoices ADD CONSTRAINT invoices_status_check 
      CHECK (status IN ('draft','sent','issued','paid','overdue','cancelled','partial'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_due_date_after_created') THEN
    ALTER TABLE invoices ADD CONSTRAINT check_due_date_after_created 
      CHECK (due_date >= created_at::date);
  END IF;
END $$;
```

### File Changes

| File | Perubahan |
|------|-----------|
| Database migration | Fix 5 invoice records + 4 CHECK constraints |
| `old-docs/merchant_database_refactor.md` | Update checklist format: checkmark/clock/skip emoji, mark 3.1 as fully DONE |

## Status Setelah Implementasi

| Section | Sebelum | Sesudah |
|---------|---------|---------|
| 3.1 CHECK Constraints | Partial (beberapa missing) | DONE (semua constraint ada) |
| Overall Compliance | ~93% | ~95% |

Semua item lainnya sudah benar statusnya (DONE atau SKIP dengan alasan valid).

