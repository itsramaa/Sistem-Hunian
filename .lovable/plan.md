

# Implementasi merchant_database_refactor.md

## Analisis Status: Apa yang Sudah vs Belum Dilakukan

Berdasarkan audit database saat ini dan migrasi sebelumnya (merchant_database_upgrade.md), berikut status tiap item:

### SUDAH SELESAI (dari upgrade sebelumnya)
| Item | Status | Keterangan |
|------|--------|------------|
| 1.3 Address normalization | DONE | `addresses` table sudah ada, views sudah dibuat |
| 2.1 FK Indexes | DONE | 273 indexes sudah ada |
| 2.12 CASCADE strategies | DONE | ~95% FK sudah punya ON DELETE |
| 3.1 CHECK constraints (sebagian) | DONE | penalty_rate, rent, deposit, size, amount sudah ada |
| 3.2 Referential integrity (sebagian) | DONE | Mayoritas FK sudah benar |

### TIDAK BISA DILAKUKAN di Supabase
| Item | Alasan |
|------|--------|
| 2.3 Table partitioning | Supabase managed Postgres tidak mendukung partitioning |
| 2.9 Connection pool config | Dikelola otomatis oleh Supabase |
| 2.10 Statistics/ANALYZE | Dijalankan otomatis oleh Supabase |
| 3.2 FK ke auth.users | Schema reserved, tidak bisa dimodifikasi |

### SKIP - Butuh Refactor Code Masif (26+ file)
| Item | Alasan |
|------|--------|
| 1.1 Drop subscription_tier/billing_day/disbursement_schedule | Digunakan di 26+ file TypeScript. Dropping akan break seluruh app. Perlu refactor code terpisah. |
| 1.2 Drop referral fields | Direferensikan di types. Perlu code refactor terpisah. |
| 1.4 Verification status refactor | Mengubah arsitektur verifikasi butuh perubahan code besar. |
| 1.5 Pending subscription changes refactor | Butuh code changes di subscription flow. |

### AKAN DIIMPLEMENTASIKAN (Aman, Non-Breaking)

---

## Rencana Implementasi Step-by-Step

### Migration 1: Performance Indexes (GIN + Text Search + JSONB)

**Section 2.4 - Text Search Indexes:**
- `idx_merchants_business_name_btree` pada `merchants(business_name)`
- `idx_properties_name_btree` pada `properties(name)`
- `idx_invoices_invoice_number_btree` pada `invoices(invoice_number)`
- `idx_contracts_contract_number_btree` pada `contracts(contract_number)`

**Section 2.5 - Array GIN Indexes:**
- `idx_properties_amenities_gin` pada `properties` USING GIN(`amenities`)
- `idx_properties_images_gin` pada `properties` USING GIN(`images`)
- `idx_units_amenities_gin` pada `units` USING GIN(`amenities`)
- `idx_units_photos_gin` pada `units` USING GIN(`photos`)

**Section 2.6 - JSONB GIN Indexes:**
- `idx_subscription_features_gin` pada `subscription_tiers` USING GIN(`features`)
- `idx_unit_additional_costs_gin` pada `units` USING GIN(`additional_costs`)

**Section 2.4 - Full-Text Search:**
- Tambah kolom `search_vector TSVECTOR` pada `merchants`
- Trigger `merchants_search_update()` untuk auto-populate
- GIN index `idx_merchants_search_gin` pada `search_vector`
- Backfill existing rows

### Migration 2: Additional CHECK Constraints

**Section 3.1 - Missing constraints:**
- `subscription_tiers`: `check_trial_days_nonneg` (trial_days >= 0), `check_max_properties_positive` (max_properties > 0)
- `merchants`: `check_resubmission_count_nonneg` (resubmission_count >= 0)

### Migration 3: Optimized Views and Summary Tables

**Section 2.2 - N+1 Prevention Views:**
- `merchant_property_summary` VIEW - merchant with property/unit/contract/revenue counts

**Section 2.8 - Materialized View for Analytics:**
- `merchant_occupancy_analysis` MATERIALIZED VIEW - occupancy rates, revenue, dashboard data
- Index on merchant_id untuk fast lookup
- Dapat di-refresh via scheduled function

**Section 2.7 - Analytics Summary Table:**
- `merchant_analytics_summary` table - pre-computed dashboard metrics
- Trigger/function untuk refresh

**Section 2.11 - Status Audit Trail:**
- `invoice_status_history` table - track semua status changes pada invoices
- Trigger `track_invoice_status_change()` pada invoices UPDATE
- RLS policy mengikuti merchant_id

### Migration 4: Maintenance Expenses Cleanup (Section 1.7)

- Buat view `v_maintenance_expenses_with_merchant` yang derive merchant_id dari maintenance_requests
- Dokumentasikan bahwa `maintenance_expenses.merchant_id` adalah redundant (keep untuk backward compat + RLS)

### Step 5: Copy File + Update Checklist

Copy `merchant_database_refactor.md` ke `old-docs/` dan update checklist:

```text
Phase 1: Quick Wins
- [x] Add foreign key indexes (DONE - previous upgrade)
- [x] Add composite indexes for common queries (DONE - previous upgrade)
- [x] Add CHECK constraints for business rules (DONE)
- [x] Fix missing referential integrity (DONE - ~95%)
- [x] Add TIMESTAMPTZ default values (DONE - already in schema)

Phase 2: Normalization
- [ ] Remove subscription_tier, billing_day from merchants (SKIP - 26+ files depend on it)
- [ ] Remove referral fields from merchants (SKIP - needs code refactor)
- [x] Create address table (DONE - previous upgrade)
- [ ] Fix verification status duplication (SKIP - massive code change)
- [ ] Normalize unit_amenities (SKIP - handled by facility_types system)
- [ ] Refactor subscription_changes table (SKIP - needs code refactor)

Phase 3: Performance
- [ ] Implement table partitioning (SKIP - Supabase managed DB)
- [x] Create materialized views for analytics (DONE)
- [x] Create views to prevent N+1 queries (DONE)
- [ ] Implement soft deletes (SKIP - project convention explicitly avoids deleted_at)
- [ ] Set up statistics & monitoring (SKIP - Supabase auto-manages)
- [ ] Create connection pool configuration (SKIP - Supabase managed)

Phase 4: Monitoring
- [ ] Set up slow query logging (Supabase provides this)
- [ ] Create performance dashboards (future)
- [ ] Monthly ANALYZE & REINDEX (Supabase auto-manages)
- [ ] Backup & recovery testing (Supabase managed)
```

---

## Files yang Akan Diubah

| File | Perubahan |
|------|-----------|
| `old-docs/merchant_database_refactor.md` | Copy file + update checklist |
| Database migration 1 | GIN indexes (array + JSONB), text search indexes, full-text search |
| Database migration 2 | Additional CHECK constraints |
| Database migration 3 | Views, materialized view, analytics summary, invoice status history |
| Database migration 4 | Maintenance expenses view |

## Catatan Penting

- **Column dropping (1.1, 1.2, 1.4, 1.5)** di-SKIP karena 26+ file TypeScript bergantung pada kolom-kolom ini. Ini membutuhkan refactoring code terpisah yang sangat besar.
- **Partitioning (2.3)** tidak bisa dilakukan di Supabase managed Postgres.
- **Soft deletes** di-SKIP karena konvensi project secara eksplisit menghindari `deleted_at` columns.
- **Full-text search** menggunakan config `simple` (bukan `indonesian`) karena `indonesian` text search config mungkin tidak tersedia di Supabase.

