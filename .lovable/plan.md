
# Phase 1 Implementation: Database Upgrade (ON DELETE + Indexes + Constraints + Data Types)

## Analisis Status Saat Ini

Setelah audit database, berikut temuan aktual:

### ON DELETE Constraints (Script 1A)
- **Sebagian besar FK sudah memiliki ON DELETE** (CASCADE/SET NULL/RESTRICT) dari upgrade sebelumnya
- **14 FK masih NO ACTION** yang perlu diperbaiki:
  - `dss_recommendations.ml_model_run_id` -> SET NULL
  - `live_chat_conversations.merchant_id` -> CASCADE
  - `maintenance_expenses.ocr_result_id` -> SET NULL
  - `maintenance_requests.tenant_user_id` -> SET NULL
  - `occupancy_snapshots.property_id` -> CASCADE
  - `occupancy_snapshots.merchant_id` -> CASCADE
  - `ocr_results.ml_model_run_id` -> SET NULL
  - `property_renovations.merchant_id` -> CASCADE
  - `tenant_payment_metrics.merchant_id` -> CASCADE
  - `tenant_risk_scores.ml_model_run_id` -> SET NULL
  - `unit_assets.merchant_id` -> CASCADE
  - 3 FK ke `auth.users` (tidak bisa diubah - Supabase reserved schema)
- **Checklist: PARTIAL** (sebagian besar sudah done, hanya 11 yang perlu difix, 3 skip karena auth.users)

### ENUM Types (Script 1B) -- SKIP
- Konvensi proyek ini secara eksplisit menyatakan: "Status columns use text with CHECK constraints, NOT native Postgres Enums (except app_role)"
- **CHECK constraints sudah ada** untuk: merchants.verification_status, properties.status, units.status, contracts.status, merchant_subscriptions.status, dll
- **Script 1B akan di-SKIP** karena melanggar konvensi arsitektur yang sudah ditetapkan
- **Checklist: SKIP** (by design, replaced by CHECK constraints)

### Indexes (Script 1C) -- FULLY IMPLEMENT
- **FK indexes**: Beberapa sudah ada (dari migrasi sebelumnya), banyak yang belum
- **Compound indexes**: Hampir semuanya belum ada
- Akan dibuat menggunakan `CREATE INDEX IF NOT EXISTS` (idempotent, aman)

### CHECK Constraints (Script 1D) -- PARTIAL
- Status CHECK sudah ada untuk sebagian besar tabel
- **Yang belum ada**: numeric constraints (penalty_rate, rent_amount, deposit, size_sqm, total_units, latitude, longitude, price, amount, commission)
- Perlu validasi data sebelum add constraint agar tidak gagal

### UNIQUE Constraints (Script 1E) -- PARTIAL
- `merchants.merchant_code` - sudah ada
- `referrals.referral_code` - sudah ada
- `properties.property_code` - kolom TIDAK ADA, skip
- `subscription_invoices.invoice_number` - kolom TIDAK ADA, skip
- `contracts.contract_number` - kolom TIDAK ADA, skip

### Data Types (Script 1F) -- IMPLEMENT
- `properties.latitude` dan `longitude` masih `double precision` (float8), perlu diubah ke `numeric(10,8)` dan `numeric(11,8)`

---

## Rencana Implementasi

### Step 1: Copy File ke old-docs/
Copy `merchant_database_upgrade.md` ke `old-docs/`

### Step 2: Migration - Fix Remaining NO ACTION FKs (11 FKs)
Untuk setiap FK: DROP constraint lama, ADD constraint baru dengan ON DELETE yang tepat.

### Step 3: Migration - Create All Indexes (30+ indexes)
Semua indexes dari Script 1C menggunakan `CREATE INDEX IF NOT EXISTS` -- aman dan idempotent.

### Step 4: Migration - Add Numeric CHECK Constraints
Tambah CHECK constraints untuk numeric columns. Menggunakan `DO $$ ... $$` block untuk idempotent (cek sebelum add).

Perlu data validation dulu -- jika ada data yang melanggar constraint, fix dulu.

### Step 5: Migration - Fix Coordinate Data Types
Ubah `latitude` dari `double precision` ke `numeric(10,8)` dan `longitude` ke `numeric(11,8)`.

### Step 6: Update Checklist di File
Update checklist di `old-docs/merchant_database_upgrade.md` dengan status aktual:
- Script 1A: Partially done (11/14 fixed, 3 skip auth.users)
- Script 1B: SKIP (by design convention)
- Script 1C: DONE
- Script 1D: Partially done (numeric only, status already exists)
- Script 1E: Partially done (2/5 already exist, 3 columns don't exist)
- Script 1F: DONE

### Step 7: Update Compliance Scorecard
Update scorecard di file:
- Foreign Keys (ON DELETE): 0% -> ~95% (3 auth.users FK cannot be changed)
- Foreign Key Indexes: 0% -> 100%
- Constraints: 40% -> ~75%
- Indexing Strategy: 0% -> 100%

---

## File yang Diubah

| File | Perubahan |
|------|-----------|
| `old-docs/merchant_database_upgrade.md` | Copy file + update checklist |
| Database migration | Fix 11 NO ACTION FKs, 30+ indexes, numeric CHECK constraints, coordinate data types |

## Catatan Penting

- **ENUM types TIDAK diimplementasikan** karena melanggar konvensi proyek (gunakan text + CHECK constraint)
- 3 FK ke `auth.users` tidak bisa diubah (reserved schema Supabase)
- `property_code`, `contract_number`, `subscription_invoices.invoice_number` tidak ada di schema -- UNIQUE constraint di-skip
- Phase 2 dan 3 TIDAK diimplementasikan di step ini (sesuai instruksi phase-gate)
