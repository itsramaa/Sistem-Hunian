

# Complete Phase 1 Partials + Phase 2 Implementation

## Phase 1 Remaining (Partial Items)

### 1A. Script 1D - Missing CHECK Constraints (5 constraints)

Database query confirmed 0 data violations, safe to add directly:

| Table | Constraint | Rule |
|-------|-----------|------|
| `merchants` | `check_penalty_rate` | `penalty_rate BETWEEN 0 AND 1` |
| `units` | `check_units_deposit_nonneg` | `deposit_amount >= 0` |
| `referral_commissions` | `check_commission_nonneg` | `commission_amount >= 0` |
| `payments` | `check_payment_amount_nonneg` | `amount >= 0` |
| `payments` | `payments_status_check` | `status IN ('pending','paid','completed','failed','refunded')` |

All using idempotent `DO $$ ... $$` blocks.

### 1B. Script 1E - Missing Columns + UNIQUE Constraints (3 columns)

These columns don't exist yet and need to be created:

| Table | Column | Generator | Format |
|-------|--------|-----------|--------|
| `properties` | `property_code` | Trigger function | `PROP-XXXXXX` |
| `contracts` | `contract_number` | Trigger function | `CTR-YYYYMM-XXXX` |
| `subscription_invoices` | `invoice_number` | Trigger function | `SINV-YYYYMM-XXXX` |

Each column will:
1. Be added as nullable TEXT
2. Have a generation trigger (similar to existing `generate_merchant_code`)
3. Backfill existing rows
4. Add UNIQUE constraint

---

## Phase 2: Normalization and Optimization

### 2A. Address Normalization

Create `addresses` table and add `address_id` FK to `merchants` and `properties`:

```text
addresses
  id              UUID PK
  street_address  TEXT
  city            VARCHAR(100) NOT NULL
  province        VARCHAR(100) NOT NULL
  postal_code     VARCHAR(20)
  latitude        NUMERIC(10,8)
  longitude       NUMERIC(11,8)
  created_at      TIMESTAMPTZ
```

- Add `address_id UUID` FK to `merchants` and `properties`
- Create backward-compatible views (`v_merchants_with_addresses`, `v_properties_with_addresses`)
- Migrate existing address data from both tables into `addresses` table
- Keep old columns for backward compatibility (don't drop yet)
- RLS: access through parent table's merchant_id

### 2B. Junction Tables - ADAPTED

The original plan proposed converting `amenities TEXT[]` and `images TEXT[]` to junction tables. However:

- **Amenities**: Already handled by 3-tier inventory system (`facility_types` + `facility_assignments` + `property_facilities`). The `amenities` array stores facility_type UUIDs and is resolved by `useFacilityTypeNames` hook across 17+ files. Converting would be a massive breaking change with no benefit. **SKIP - Already covered by inventory system.**

- **Images**: `properties.images` and `units.photos` store Storage bucket URLs as TEXT arrays. This pattern is standard for Supabase Storage. **SKIP - Arrays are appropriate for ordered URL lists.**

### 2C. Invoice Denormalization

Invoices already has `merchant_id` and `tenant_user_id`. Add cached columns for faster queries without JOINs:

- Add `property_id UUID`, `unit_id UUID`, `tenant_name TEXT`, `unit_number TEXT`
- Backfill from contracts/units/profiles
- Create trigger to auto-populate on INSERT
- Add compound index on `(merchant_id, due_date DESC)` filtered for unpaid

---

## Migration Execution Plan

### Migration 1: Phase 1 Completion
- 5 CHECK constraints (idempotent DO blocks)
- 3 new columns with generation triggers
- Backfill existing data
- 3 UNIQUE constraints

### Migration 2: Phase 2A - Addresses
- Create `addresses` table with indexes and RLS
- Add `address_id` FK to merchants and properties
- Migrate existing data
- Create backward-compatible views

### Migration 2B: Phase 2C - Invoice Denormalization
- Add denormalized columns to invoices
- Backfill from contracts/units
- Create auto-populate trigger
- Add performance index

### Code Changes
- Update `old-docs/merchant_database_upgrade.md` checklist:
  - Script 1D: PARTIAL -> DONE
  - Script 1E: PARTIAL -> DONE
  - Script 2A: unchecked -> DONE
  - Script 2B: unchecked -> SKIP (covered by inventory system)
  - Script 2C: unchecked -> DONE
  - Phase 2 overall: mark complete

---

## Updated Compliance Scorecard

| Dimension | Before | After |
|-----------|--------|-------|
| Constraints (UNIQUE/CHECK/NOT NULL) | ~75% | ~90% |
| Normalization (1NF/2NF/3NF) | 65% | ~80% |
| Overall Compliance | ~90% | ~93% |

## Files Changed

| File | Change |
|------|--------|
| Database migration (Phase 1 completion) | 5 CHECKs, 3 columns + triggers + UNIQUEs |
| Database migration (Phase 2A) | addresses table + data migration |
| Database migration (Phase 2C) | Invoice denormalization + trigger |
| `old-docs/merchant_database_upgrade.md` | Update all checklists |

