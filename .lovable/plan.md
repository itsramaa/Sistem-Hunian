

# Update merchant_database.md dengan Schema Terkini

## Ringkasan

File `old-docs/merchant_database.md` masih menampilkan schema lama (sebelum refactoring Section 1.1-1.7). Perlu di-update agar mencerminkan state database yang sebenarnya sekarang, termasuk:

1. **merchants** -- kolom `address`, `city`, `province`, `postal_code`, `subscription_tier`, `disbursement_schedule`, `billing_day`, `referred_by`, `referral_discount`, `referral_discount_months`, `verification_submitted_at`, `verified_at`, `verified_by`, `rejected_at`, `rejected_by`, `rejection_details`, `resubmission_count`, `resubmission_instructions` sudah di-drop. Kolom baru: `headquarters_address_id`, `billing_address_id`, `search_vector`.

2. **properties** -- kolom `address`, `city`, `province`, `postal_code`, `latitude`, `longitude` sudah di-drop. Kolom baru: `address_id`, `nearby_facilities` (JSONB).

3. **Tabel baru**: `addresses`, `subscription_changes` (menggantikan `pending_subscription_changes`), plus views dan materialized views.

4. **invoices** -- kolom `payment_plan_id` sudah di-drop. Kolom baru: `property_id`, `unit_id`, `tenant_name`, `unit_number` (denormalisasi).

5. **Relasi** -- Update semua relationship arrows untuk mencerminkan perubahan di atas.

6. **Ringkasan Tabel** -- Update jumlah dan daftar tabel per domain.

7. **Index Section** -- Tambah section baru yang mendokumentasikan semua custom indexes yang ada di database (273+ indexes).

8. **Views & Materialized Views** -- Tambah section yang mendokumentasikan 5 views dan 1 materialized view.

9. **Triggers** -- Tambah section yang mendokumentasikan semua triggers.

## Detail Perubahan

### Mermaid Class Diagram Updates

- **merchants class**: Hapus 14 kolom lama, tambah `headquarters_address_id`, `billing_address_id`, `search_vector`
- **properties class**: Hapus 6 kolom lama, tambah `address_id`, `nearby_facilities`
- **Rename** `pending_subscription_changes` -> `subscription_changes` dengan kolom baru (`from_tier_id`, `to_tier_id`, `cancelled_at`, `cancellation_reason`, `requested_by`, `reason`)
- **invoices class**: Hapus `payment_plan_id`, tambah `property_id`, `unit_id`, `tenant_name`, `unit_number`
- **Tambah** `addresses` class
- **Update relasi**: `merchants --> subscription_changes`, bukan `pending_subscription_changes`; hapus `invoices --> payment_plans : "payment_plan_id"`

### Section Baru

1. **Database Objects**: Views, Materialized Views, Triggers
2. **Index Strategy**: Daftar semua custom indexes per domain
3. **Refactoring History**: Ringkasan refactoring yang sudah dilakukan (1.1-1.7)

## File yang Diubah

| File | Perubahan |
|------|-----------|
| `old-docs/merchant_database.md` | Full rewrite untuk mencerminkan schema terkini |

