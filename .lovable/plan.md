

# Maksimalisasi Database Schema Documentation - SiHuni Platform

## Ringkasan

File `docs/database-schema.md` saat ini berisi schema lama yang tidak sesuai dengan implementasi aktual. Dokumen mendeskripsikan tabel `users`, `rooms`, `leases`, `transactions`, `documents`, `ml_predictions` yang **tidak ada** di database sebenarnya. Database aktual memiliki **66 tabel**, **18 database functions**, **191 RLS policies**, dan **1 custom enum type** (`app_role`).

Dokumen akan di-rewrite total untuk mencerminkan schema PostgreSQL yang sebenarnya di Lovable Cloud.

---

## Perubahan yang Akan Dilakukan

### File: `docs/database-schema.md` (Full Rewrite)

### 1. Executive Summary (Diperbarui)
- Update dari design doc menjadi living documentation of actual schema
- PostgreSQL 16 on Lovable Cloud (bukan AWS RDS)
- 66 public tables, 18 functions, 191 RLS policies
- UUID v4 (`gen_random_uuid()`) bukan v7
- `timestamptz` untuk semua timestamps
- No ORM -- Supabase SDK client direct access
- Currency: IDR (Indonesian Rupiah)

### 2. ERD (Full Rewrite -- 9 Domain Groups)

Mermaid ER diagram baru yang mencakup:
1. **Identity & Access**: `profiles`, `user_roles`, `merchants`, `tenants`, `vendors`
2. **Property**: `properties`, `units`, `unit_listings`
3. **Contract**: `contracts`, `move_out_notices`, `move_out_inspections`, `move_out_tasks`, `move_out_timeline`, `early_termination_requests`
4. **Billing**: `invoices`, `payments`, `payment_plans`, `payment_plan_installments`, `late_fee_records`, `collections_cases`
5. **Financial**: `escrow_accounts`, `escrow_transactions`, `disbursements`, `bank_accounts`, `xendit_transactions`, `deposit_refunds`, `deposit_disputes`
6. **Subscription**: `subscription_tiers`, `merchant_subscriptions`, `subscription_invoices`, `pending_subscription_changes`, `cancellation_feedback`
7. **Marketplace**: `products`, `orders`, `order_reviews`, `vendor_bank_accounts`, `vendor_verifications`, `vendor_jobs`, `vendor_earnings`, `vouchers`
8. **Community**: `forum_posts`, `forum_comments`, `forum_likes`, `forum_reports`, `chat_conversations`, `chat_messages`, `chatbot_knowledge`, `chatbot_analytics`
9. **System**: `notifications`, `audit_logs`, `analytics_events`, `platform_settings`, `referrals`, `referral_rewards`, `referral_commissions`, `provinces`, `cities`, `tenant_invitations`, `tenant_merchant_history`, `merchant_verifications`, `merchant_verification_history`, `maintenance_requests`, `maintenance_updates`, `maintenance_timeline`, `maintenance_reviews`, `disputes`

### 3. Detailed Table Definitions (66 Tables)

Setiap tabel akan didokumentasikan dengan format:

```text
Table: [name]
Purpose: [description]
+------------------+---------------+----------+------------------+
| Column           | Type          | Nullable | Default          |
+------------------+---------------+----------+------------------+
| id               | uuid          | NO       | gen_random_uuid()|
| ...              | ...           | ...      | ...              |
+------------------+---------------+----------+------------------+
Indexes: [list]
RLS: [summary of policies]
```

Dikelompokkan per domain:

#### 3.1 Identity & Access Management
- `profiles` (8 cols) -- user profiles linked to `auth.users`
- `user_roles` (4 cols) -- RBAC with `app_role` enum (admin, merchant, tenant, vendor)
- `merchants` (30 cols) -- merchant business data, verification, billing config
- `tenants` (21 cols) -- tenant profile, KTP, emergency contact, auto-pay settings
- `vendors` (19 cols) -- vendor business data, ratings, verification

#### 3.2 Property & Units
- `properties` (16 cols) -- property master data with amenities, images
- `units` (16 cols) -- individual units with status tracking, vacancy days
- `unit_listings` -- public listing for vacant units

#### 3.3 Contracts & Move-Out
- `contracts` (31 cols) -- rental contracts with signature, billing, termination config
- `move_out_notices` -- tenant move-out intentions
- `move_out_inspections` (16 cols) -- inspection with deductions, signatures, photos
- `move_out_tasks` -- checklist items for move-out
- `move_out_timeline` -- timeline events during move-out
- `early_termination_requests` -- penalty calculation, counter-offers

#### 3.4 Invoices & Payments
- `invoices` (21 cols) -- rent invoices with late fee, grace period, payment plan link
- `payments` (13 cols) -- payment records per contract
- `payment_plans` (18 cols) -- installment/deferred plans
- `payment_plan_installments` -- individual installment tracking
- `late_fee_records` -- late fee application history
- `collections_cases` (15 cols) -- escalated overdue cases

#### 3.5 Financial & Escrow
- `escrow_accounts` -- per-merchant escrow balance
- `escrow_transactions` (13 cols) -- deposits/withdrawals with fee breakdown
- `disbursements` (18 cols) -- payout to bank with review workflow
- `bank_accounts` (8 cols) -- merchant bank details
- `xendit_transactions` (18 cols) -- payment gateway records
- `deposit_refunds` (17 cols) -- tenant deposit return with deductions
- `deposit_disputes` (14 cols) -- disputed deductions

#### 3.6 Subscriptions
- `subscription_tiers` (15 cols) -- plan definitions with limits
- `merchant_subscriptions` -- active subscriptions per merchant
- `subscription_invoices` (17 cols) -- subscription billing records
- `pending_subscription_changes` -- queued plan changes
- `cancellation_feedback` (7 cols) -- churn feedback

#### 3.7 Marketplace
- `products` -- vendor product catalog
- `orders` -- order records with status workflow
- `order_reviews` -- tenant reviews for vendor orders
- `vendor_bank_accounts` (9 cols) -- vendor payout details
- `vendor_verifications` (9 cols) -- vendor document verification
- `vendor_jobs` -- maintenance job assignments
- `vendor_earnings` -- earning tracking per vendor
- `vouchers` -- discount/promo codes

#### 3.8 Community & AI
- `forum_posts` (14 cols) -- community posts with photos, tags
- `forum_comments` -- post comments
- `forum_likes` -- like system
- `forum_reports` -- content moderation reports
- `chat_conversations` (7 cols) -- AI chatbot conversations
- `chat_messages` -- conversation messages
- `chatbot_knowledge` (8 cols) -- FAQ knowledge base
- `chatbot_analytics` (10 cols) -- chatbot usage tracking

#### 3.9 System & Operations
- `notifications` -- in-app notification system
- `audit_logs` (11 cols) -- immutable action logs
- `analytics_events` (7 cols) -- frontend event tracking
- `platform_settings` (6 cols) -- global config (key-value JSONB)
- `referrals` (19 cols) -- referral tracking
- `referral_rewards` (11 cols) -- reward management
- `referral_commissions` -- commission processing
- `provinces` / `cities` -- Indonesian geography reference
- `tenant_invitations` -- invitation tokens
- `tenant_merchant_history` -- tenant transfer history
- `merchant_verifications` -- verification documents
- `merchant_verification_history` (11 cols) -- verification audit trail
- `maintenance_requests` -- maintenance ticket system
- `maintenance_updates` -- status update entries
- `maintenance_timeline` -- timeline tracking
- `maintenance_reviews` -- vendor reviews from maintenance
- `disputes` (13 cols) -- general dispute resolution

### 4. Custom Enum Type

```sql
CREATE TYPE app_role AS ENUM ('admin', 'merchant', 'tenant', 'vendor');
```

Used in `user_roles.role` column and `has_role()` function.

### 5. Database Functions (18 Functions)

| Function | Returns | Description |
|----------|---------|-------------|
| `has_role(user_id, role)` | boolean | Check if user has specific role (used in RLS) |
| `get_user_role(user_id)` | app_role | Get user's primary role |
| `handle_new_user()` | trigger | Auto-create profile on auth signup |
| `generate_merchant_code()` | text | Generate unique merchant code |
| `set_merchant_code()` | trigger | Auto-set merchant code on insert |
| `create_merchant_escrow()` | trigger | Auto-create escrow account for new merchant |
| `generate_invoice_number()` | trigger | Auto-generate invoice numbers |
| `generate_order_number()` | trigger | Auto-generate order numbers |
| `generate_referral_code()` | trigger | Auto-generate referral codes |
| `generate_voucher_code()` | text | Generate unique voucher code |
| `update_updated_at_column()` | trigger | Auto-update `updated_at` timestamp |
| `update_property_unit_counts()` | trigger | Sync property total/occupied counts |
| `update_unit_status_on_contract_sign()` | trigger | Mark unit occupied on contract sign |
| `calculate_sla_deadline()` | timestamptz | Calculate maintenance SLA deadline |
| `set_maintenance_sla_deadline()` | trigger | Auto-set SLA deadline on request create |
| `update_vendor_maintenance_rating()` | trigger | Recalculate vendor rating on review |
| `set_cancellation_effective_date()` | trigger | Auto-set subscription cancellation date |
| `check_phone_unique_per_role()` | boolean | Validate phone uniqueness per role |

### 6. Indexing Strategy (Actual Indexes)

Document all existing indexes grouped by purpose:
- **Primary keys**: All 66 tables have UUID PKs
- **Lookup indexes**: `idx_audit_logs_user_id`, `idx_contracts_merchant_id`, etc.
- **Status filters**: `idx_collections_cases_status`, `idx_deposit_refunds_status`
- **Partial indexes**: `idx_contracts_move_out` (WHERE move_out_notice_given = true), `idx_disbursements_pending_review` (WHERE requires_manual_review = true)
- **Composite indexes**: Various multi-column indexes for dashboard queries
- **Unique constraints**: `profiles(user_id)`, `merchants(user_id)`, etc.

### 7. RLS Policy Summary (191 Policies)

Grouped by access pattern:
- **Admin full access**: `has_role(auth.uid(), 'admin')` on most tables
- **Merchant own-data**: via `merchants.user_id = auth.uid()` join pattern
- **Tenant own-data**: `tenant_user_id = auth.uid()` direct or join
- **Vendor own-data**: `vendors.user_id = auth.uid()` join pattern
- **Public read**: `platform_settings`, `subscription_tiers` (active), `forum_posts` (visible)
- **System insert**: `audit_logs`, `xendit_transactions` (with_check = true)

### 8. Key Relationships

Document all foreign key-like relationships (enforced at application level via Supabase SDK `.select()` joins):
- `profiles.user_id` -> `auth.users.id`
- `merchants.user_id` -> `auth.users.id`
- `contracts.merchant_id` -> `merchants.id`
- `contracts.unit_id` -> `units.id`
- `units.property_id` -> `properties.id`
- `invoices.contract_id` -> `contracts.id`
- `escrow_transactions.escrow_account_id` -> `escrow_accounts.id`
- And 40+ more application-level relationships

### 9. JSONB Column Patterns

Document all JSONB columns and their expected structure:
- `tenants.notification_preferences` -- notification toggle flags
- `move_out_inspections.inspection_report` -- inspection findings
- `move_out_inspections.deduction_details` -- itemized deductions
- `chat_conversations.context` -- AI chatbot context
- `analytics_events.event_data` -- frontend event payload
- `platform_settings.setting_value` -- dynamic config values
- `audit_logs.metadata` -- action metadata
- `subscription_tiers.features` -- feature list per tier

### 10. Data Migration & Conventions

- All PKs: `uuid DEFAULT gen_random_uuid()`
- All timestamps: `timestamptz` (with timezone)
- All `created_at`: `DEFAULT now()`
- All `updated_at`: auto-updated via `update_updated_at_column()` trigger
- Status columns: `text` with application-level validation (not DB enums, except `app_role`)
- Monetary values: `numeric` (not float)
- Arrays: `text[]` for photos, tags, keywords
- No soft deletes (no `deleted_at` columns in actual schema)

---

## Skills yang Digunakan

| Skill | Penerapan |
|-------|-----------|
| `database-design` | Normalization analysis, PK strategy, relationship types, timestamp strategy |
| `database-schema-designer` | Table documentation format, ERD design |
| `supabase-postgres-best-practices` | Data types (text vs varchar, bigint, timestamptz, numeric), PK strategy, RLS patterns, index types, JSONB indexing |
| `sql-optimization-patterns` | Index analysis, query pattern documentation |
| `security-auditor` | RLS policy audit, data access patterns |
| `pci-compliance` | Financial data handling (numeric for money, no PAN storage) |
| `database-optimizer` | Partial indexes, composite indexes, covering indexes |

---

## Hasil Akhir

Dokumen database schema lengkap (~1500+ baris) yang mencakup seluruh 66 tabel dengan kolom, tipe data, default values, 18 database functions, 191 RLS policies, indexing strategy, JSONB patterns, dan relationship maps yang mencerminkan database aktual di Lovable Cloud.

