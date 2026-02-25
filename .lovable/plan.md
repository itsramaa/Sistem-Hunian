# Buat File merchant_database.md

Membuat file dokumentasi `old-docs/merchant_database.md` yang berisi Mermaid class diagram lengkap untuk semua tabel dan relasi yang terintegrasi dengan merchant.

## Tabel yang Akan Didokumentasikan

### Core Merchant

- `merchants` - Data utama merchant

### Verifikasi & Subscription

- `merchant_verifications`, `merchant_verification_history`
- `merchant_subscriptions`, `subscription_tiers`, `subscription_invoices`
- `cancellation_feedback`, `pending_subscription_changes`
- `merchant_feedback`

### Properti & Unit

- `properties`, `units`
- `property_guardians`, `guardian_property_assignments`
- `property_nearby_facilities`, `property_renovations`, `property_vendor_services`
- `property_data_versions`, `property_facilities` (legacy)
- `compliance_documents`, `disaster_risk_profiles`
- `security_incidents`, `insurance_policies`, `insurance_claims`

### Inventori (3-Tier)

- `facility_types`, `assets`, `facility_assignments`
- `facilities` (legacy)

### Peraturan

- `rule_types`, `rules`, `rule_acknowledgements`

### Kontrak & Tenant

- `contracts`, `tenant_invitations`, `tenant_merchant_history`
- `move_out_notices`, `move_out_inspections`, `move_out_tasks`, `move_out_timeline`
- `deposit_refunds`, `deposit_disputes`
- `early_termination_requests`, `disputes`

### Billing & Keuangan

- `invoices`, `payments`, `payment_plans`, `payment_plan_installments`
- `late_fee_records`, `collections_cases`
- `payment_verifications`
- `bank_accounts`, `disbursements`
- `escrow_accounts`, `escrow_transactions`

### Maintenance

- `maintenance_requests`, `maintenance_updates`, `maintenance_timeline`
- `maintenance_reviews`, `maintenance_expenses`

### Analytics & Metrics

- `occupancy_snapshots`, `tenant_payment_metrics`, `tenant_risk_scores`
- `data_quality_checks`, `dss_recommendations`
- `ml_model_runs`, `ocr_results`

### Vendor Integration

- `vendor_jobs`

### Lainnya

- `live_chat_conversations`, `referrals`, `referral_commissions`
- `rls_alert_settings`

## Output

Satu file markdown berisi Mermaid classDiagram dengan semua tabel dan relasi FK yang terhubung ke merchant, dikelompokkan per domain, make sure semuanya tercoverage jangan sampai ada integrasi atau fitur merchant yang terlewat.