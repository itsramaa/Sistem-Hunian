# API Specification - SiHuni Platform

> **Sistem DSS Manajemen Kosan** — B2B cloud-based Decision Support System yang mengotomatisasi dan mengoptimalkan operasional properti kosan melalui digitalisasi dokumen (OCR), analitik prediktif (ML), dan decision support berbasis AI. Target: revenue per-unit +8-15%, risiko tunggakan -20-30%.

---

## Table of Contents

1. [Overview & Architecture](#1-overview--architecture)
2. [Authentication & Authorization](#2-authentication--authorization)
3. [Standard Response & Error Handling](#3-standard-response--error-handling)
4. [Edge Functions API](#4-edge-functions-api)
5. [Database-Driven API (Client SDK)](#5-database-driven-api-client-sdk)
6. [Data Models](#6-data-models)
7. [Webhooks](#7-webhooks)
8. [Cron Jobs](#8-cron-jobs)
9. [Security](#9-security)
10. [Integrations](#10-integrations)
11. [Fee Structure & Rate Limiting](#11-fee-structure--rate-limiting)

---

## 1. Overview & Architecture

### 1.1 General Info

| Key | Value |
|-----|-------|
| **Platform** | Lovable Cloud (Deno Edge Functions + PostgreSQL) |
| **Content-Type** | `application/json` (kecuali upload file: `multipart/form-data`) |
| **Date Format** | ISO 8601 (`YYYY-MM-DDTHH:mm:ssZ`) |
| **Currency** | IDR (Indonesian Rupiah) |
| **Payment Gateway** | Xendit |
| **Email Service** | Resend API |
| **AI Provider** | Lovable AI (Gemini 2.5 Pro — Vision + Reasoning for OCR/ML/DSS) |
| **Storage** | Supabase Storage |

### 1.2 Architecture

```
┌─────────────────────────────────────────────────────┐
│                   Client (React PWA)                │
│         Supabase JS SDK + React Query               │
└──────────┬──────────────────────┬───────────────────┘
           │ Direct CRUD (RLS)    │ invoke()
           ▼                      ▼
┌──────────────────┐   ┌─────────────────────────────┐
│   PostgreSQL DB  │   │  43 Deno Edge Functions      │
│   (46+ Tables)   │◄──│  (Auth, Payment, AI, Cron)  │
│   RLS Policies   │   │  Service Role Key            │
└──────────────────┘   └──────────┬──────────────────┘
                                  │
                    ┌─────────────┼─────────────┐
                    ▼             ▼             ▼
              ┌──────────┐ ┌──────────┐ ┌───────────────────────┐
              │  Xendit   │ │  Resend  │ │  Lovable AI           │
              │ Payment   │ │  Email   │ │  (Gemini 2.5 Pro)     │
              └──────────┘ └──────────┘ │  Vision + Reasoning   │
                                        │  OCR / ML / DSS       │
                                        └───────────────────────┘
```

### 1.4 DSS (Decision Support System) Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    DSS Layer (12 Edge Functions)             │
├─────────────────┬──────────────────┬────────────────────────┤
│   OCR Services  │  ML Predictive   │  AI Decision Support   │
│                 │  Analytics       │  (Advisors)            │
│  ┌────────────┐ │  ┌────────────┐  │  ┌──────────────────┐  │
│  │ KTP Extract│ │  │ Revenue    │  │  │ Pricing Advisor  │  │
│  │ Pay Proof  │ │  │ Forecast   │  │  │ Collection Strat │  │
│  │ Biz Docs   │ │  │ Tenant Risk│  │  │ Maint Priority   │  │
│  │ Maint Rcpt │ │  │ Churn Pred │  │  │ Investment Insgt │  │
│  │            │ │  │ Opt Pricing│  │  │                  │  │
│  └──────┬─────┘ │  └──────┬─────┘  │  └────────┬─────────┘  │
│         │       │         │        │           │             │
└─────────┼───────┴─────────┼────────┴───────────┼─────────────┘
          │                 │                    │
          ▼                 ▼                    ▼
┌──────────────────────────────────────────────────────────────┐
│          Lovable AI Gateway (Gemini 2.5 Pro)                 │
│   Multimodal Vision (OCR) + Contextual Reasoning (ML/DSS)    │
│   Tool Calling for Structured Output Extraction              │
└──────────────────────────────────────────────────────────────┘
          │
          ▼
┌──────────────────────────────────────────────────────────────┐
│              PostgreSQL (Historical Data Context)             │
│   payments, invoices, contracts, units, maintenance_requests  │
│   escrow_transactions, disbursements, collections_cases       │
│   → Aggregated + sent as context to Gemini for analysis       │
└──────────────────────────────────────────────────────────────┘
```

### 1.3 API Access Patterns

| Pattern | Description | Auth |
|---------|-------------|------|
| **Client SDK** | Direct CRUD via Supabase JS client, enforced by RLS | JWT (anon key + user token) |
| **Edge Functions** | Server-side logic (payments, AI, cron) via `supabase.functions.invoke()` | JWT / Webhook Token / Cron |
| **Webhooks** | External service callbacks (Xendit, Auth) | `x-callback-token` header |

---

## 2. Authentication & Authorization

### 2.1 Auth Flow

SiHuni menggunakan **Supabase Auth** dengan JWT-based authentication:

1. User register/login → Mendapat `access_token` + `refresh_token`
2. `access_token` dikirim via `Authorization: Bearer <token>` header
3. Token auto-refresh oleh Supabase JS SDK
4. Edge functions memvalidasi JWT via `supabase.auth.getUser()`

### 2.2 User Bootstrap Flow

Setelah register, `ensure-user-bootstrap` dipanggil untuk:
1. Membuat record `profiles` (email, full_name)
2. Membuat record `user_roles` (default: tenant)
3. Membuat record role-specific table (`tenants`, `merchants`, atau `vendors`)

```
POST /functions/v1/ensure-user-bootstrap
Authorization: Bearer <access_token>
Body: { "role": "tenant" | "merchant" | "vendor" }
```

### 2.3 RBAC (Role-Based Access Control)

Roles disimpan di tabel `user_roles` dan divalidasi via PostgreSQL function `has_role()`.

| Role | Code | Scope |
|------|------|-------|
| **Super Admin** | `super_admin` | Full platform access, tenant SaaS management |
| **Admin** | `admin` | Manage all merchants, subscriptions, disputes, moderation |
| **Moderator** | `moderator` | Forum moderation, content review |
| **Support** | `support` | Handle disputes, customer support |
| **Merchant** | `merchant` | Property management, billing, tenant operations |
| **Tenant** | `tenant` | Dashboard, payments, complaints, AI chatbot |
| **Vendor** | `vendor` | Marketplace products, orders, maintenance jobs |

### 2.4 Admin 2FA (TOTP)

Admin accounts support Two-Factor Authentication via TOTP:

- **Generate Secret**: Client-side via `OTPAuth` library
- **Enable 2FA**: Verify TOTP code → Store secret in `profiles.admin_2fa_secret`
- **Validate**: `validate-admin-secret` edge function untuk sensitive operations
- **Recovery Codes**: 8 one-time use codes generated at setup

### 2.5 Tenant Invitation Flow (Public, No JWT)

Merchants dapat mengundang tenant melalui link invitation:

1. Merchant create invitation → Generate unique `token`
2. Tenant menerima link → `GET /functions/v1/get-tenant-invitation` (no auth)
3. Tenant register/login → `POST /functions/v1/accept-tenant-invitation` (no auth, uses service role)
4. System creates: profile, user_role, tenant record, links to merchant

### 2.6 Security Headers

```
Authorization: Bearer <access_token>
Content-Type: application/json
x-callback-token: <webhook_token>       # Webhooks only
x-client-info: supabase-js/2.x         # Auto-added by SDK
```

### 2.7 CORS Configuration

```typescript
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-callback-token',
};
```

---

## 3. Standard Response & Error Handling

### 3.1 Success Response

```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... },
  "meta": {
    "page": 1,
    "limit": 10,
    "total_items": 50,
    "total_pages": 5
  }
}
```

### 3.2 Error Response

```json
{
  "success": false,
  "error": {
    "code": "ERR_RESOURCE_NOT_FOUND",
    "message": "Property with ID 123 not found",
    "details": []
  }
}
```

### 3.3 Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `ERR_AUTH_REQUIRED` | 401 | Missing or invalid authorization token |
| `ERR_FORBIDDEN` | 403 | Insufficient permissions for this operation |
| `ERR_RESOURCE_NOT_FOUND` | 404 | Requested resource does not exist |
| `ERR_INVALID_INPUT` | 400 | Request body validation failed |
| `ERR_DUPLICATE` | 409 | Resource already exists (e.g., duplicate email) |
| `ERR_RATE_LIMIT` | 429 | Too many requests, try again later |
| `ERR_AI_UNAVAILABLE` | 503 | AI service temporarily unavailable |
| `ERR_PAYMENT_FAILED` | 400 | Payment processing error |
| `ERR_WEBHOOK_INVALID` | 401 | Invalid webhook callback token |
| `ERR_INTERNAL` | 500 | Unexpected server error |

### 3.4 HTTP Status Code Mapping

| Status | Usage |
|--------|-------|
| `200` | Successful GET, PUT, PATCH, DELETE |
| `201` | Successful POST (resource created) |
| `400` | Validation errors, business rule violations |
| `401` | Authentication required or invalid token |
| `403` | Insufficient permissions |
| `404` | Resource not found |
| `409` | Conflict (duplicate resource) |
| `429` | Rate limit exceeded |
| `500` | Internal server error |
| `503` | Service unavailable (AI, payment gateway) |

### 3.5 Pagination (Offset-Based)

```
GET /resource?page=1&limit=10&sort=created_at&order=desc

Response meta:
{
  "page": 1,
  "limit": 10,
  "total_items": 150,
  "total_pages": 15
}
```

Supabase SDK uses `.range(from, to)` for pagination. Default limit: 1000 rows.

---

## 4. Edge Functions API

SiHuni memiliki **43 Edge Functions** yang di-deploy sebagai Deno serverless functions (31 core + 12 DSS).

### 4.1 Authentication & User Management

#### `ensure-user-bootstrap`
Bootstrap user profile, roles, and role-specific records after registration.

| Key | Value |
|-----|-------|
| **Method** | `POST` |
| **Auth** | JWT (via Authorization header) |
| **JWT Verification** | Disabled in config (`verify_jwt = false`) — validates internally |

**Request Body:**
```json
{
  "role": "tenant" | "merchant" | "vendor"  // default: "tenant"
}
```

**Response (200):**
```json
{
  "success": true,
  "user_id": "uuid",
  "role": "tenant",
  "message": "User bootstrap completed"
}
```

**Side Effects:**
- Creates `profiles` record (if not exists)
- Creates `user_roles` record (if not exists)
- Creates `tenants` record (if role = tenant)

---

#### `validate-admin-secret`
Validate admin secret key for sensitive admin operations (2FA setup, etc.).

| Key | Value |
|-----|-------|
| **Method** | `POST` |
| **Auth** | None |

**Request Body:**
```json
{
  "secretKey": "admin-setup-secret-key"
}
```

**Response (200):**
```json
{
  "valid": true
}
```

---

#### `auth-webhook`
Handle Supabase Auth webhook events (user creation, deletion).

| Key | Value |
|-----|-------|
| **Method** | `POST` |
| **Auth** | Webhook (internal Supabase trigger) |

---

### 4.2 Tenant Invitation

#### `get-tenant-invitation`
Validate invitation token and return invitation details. **Public endpoint** — no JWT required.

| Key | Value |
|-----|-------|
| **Method** | `POST` |
| **Auth** | None |
| **JWT Verification** | Disabled (`verify_jwt = false`) |

**Request Body:**
```json
{
  "token": "invitation-token-string"
}
```

**Response (200):**
```json
{
  "success": true,
  "invitation": {
    "id": "uuid",
    "status": "pending",
    "tenant_name": "John Doe",
    "tenant_email": "john@example.com",
    "unit": {
      "unit_number": "A-101",
      "rent_amount": 1500000,
      "deposit_amount": 3000000,
      "property": {
        "name": "Kos Harmoni",
        "address": "Jl. Sudirman No. 10"
      }
    },
    "expires_at": "2024-02-01T00:00:00Z"
  }
}
```

**Error Codes:**
- `INVITATION_NOT_FOUND` (404) — Token invalid
- `INVITATION_EXPIRED` (400) — Past expiry date
- `INVITATION_CANCELLED` (400) — Cancelled by merchant
- `INVITATION_ALREADY_ACCEPTED` (400) — Already used

---

#### `accept-tenant-invitation`
Accept invitation, create/link tenant profile. **Public endpoint** — no JWT required.

| Key | Value |
|-----|-------|
| **Method** | `POST` |
| **Auth** | None |
| **JWT Verification** | Disabled (`verify_jwt = false`) |

**Request Body:**
```json
{
  "token": "invitation-token-string",
  "user_id": "auth-user-uuid",
  "contract_duration_months": 12
}
```

**Response (200):**
```json
{
  "success": true,
  "unit_id": "uuid",
  "merchant_id": "uuid",
  "message": "Invitation accepted successfully. Merchant will create your contract."
}
```

**Side Effects:**
- Creates `profiles`, `user_roles`, `tenants` records (if missing)
- Updates invitation status to `accepted`
- Links tenant to merchant via `linked_merchant_id`
- Sets `current_unit_id` on tenant record
- **Note:** Contract is NOT auto-created — merchant creates it manually

---

### 4.3 Payment & Billing (Xendit Integration)

#### `xendit-create-invoice`
Create a Xendit payment invoice for rent, order, or subscription payment.

| Key | Value |
|-----|-------|
| **Method** | `POST` |
| **Auth** | JWT |
| **Secrets** | `XENDIT_SECRET_KEY` |

**Request Body:**
```json
{
  "payment_id": "uuid",         // optional
  "invoice_id": "uuid",         // optional
  "order_id": "uuid",           // optional
  "amount": 1500000,
  "description": "Rent payment for A-101",
  "payer_email": "tenant@example.com",
  "payer_name": "John Doe",
  "user_id": "auth-user-uuid",
  "payment_type": "rent" | "invoice" | "order",
  "preferred_method": "bank_transfer" | "ewallet" | "qris" | "credit_card"
}
```

**Response (200):**
```json
{
  "success": true,
  "transaction_id": "uuid",
  "payment_url": "https://checkout.xendit.co/...",
  "xendit_invoice_id": "xendit-inv-id",
  "expiry_date": "2024-01-15T00:00:00Z"
}
```

**Payment Methods:**
- `BANK_TRANSFER` — BCA, BNI, BRI, Mandiri, Permata
- `EWALLET` — OVO, DANA, GoPay, ShopeePay, LinkAja
- `QR_CODE` — QRIS
- `CREDIT_CARD` — Visa, Mastercard

**Side Effects:**
- Creates `xendit_transactions` record with status `pending`
- Generates unique `external_id`: `{payment_type}_{id}_{timestamp}`
- Invoice expires after 24 hours (`invoice_duration: 86400`)

---

#### `xendit-webhook`
Handle Xendit payment callbacks. Processes PAID, EXPIRED, and FAILED events.

| Key | Value |
|-----|-------|
| **Method** | `POST` |
| **Auth** | `x-callback-token` header (timing-safe comparison) |
| **Secrets** | `XENDIT_WEBHOOK_TOKEN`, `XENDIT_SECRET_KEY` |

**Payload (from Xendit):**
```json
{
  "id": "xendit-invoice-id",
  "external_id": "rent_uuid_timestamp",
  "status": "PAID" | "EXPIRED" | "FAILED",
  "payment_method": "BANK_TRANSFER",
  "payment_channel": "BCA",
  "paid_at": "2024-01-10T12:00:00Z",
  "paid_amount": 1500000
}
```

**Processing Logic by `external_id` prefix:**

| Prefix | Type | Actions on PAID |
|--------|------|-----------------|
| `rent_` / generic | Rent Payment | Update payment → Update invoice → Create escrow transaction (with fee deduction) → Notify merchant |
| `sub_` | Initial Subscription | Activate subscription → Set period → Notify merchant → Trigger referral reward |
| `subinv_` | Subscription Renewal | Pay subscription invoice → Reactivate subscription → Clear grace period → Notify merchant |
| `order_` | Marketplace Order | Confirm order → Create escrow transaction (with fee deduction) → Notify vendor |

**Fee Calculation (Rent/Order):**
```
Gross Amount = paid_amount
Platform Fee = gross × 1% (PLATFORM_FEE_RATE = 0.01)
Gateway Fee  = gross × 2.5% (GATEWAY_FEE_RATE = 0.025)
Net Amount   = gross - platformFee - gatewayFee
```

**Security:**
- Timing-safe token comparison (constant-time XOR)
- Idempotency check: Skip if transaction already in `paid` status
- Server-side verification: Confirms status with Xendit API

---

#### `xendit-disbursement`
Process disbursement (withdrawal) to merchant/vendor bank account.

| Key | Value |
|-----|-------|
| **Method** | `POST` |
| **Auth** | JWT |
| **Secrets** | `XENDIT_SECRET_KEY` |

**Request Body:**
```json
{
  "escrow_account_id": "uuid",
  "bank_account_id": "uuid",
  "amount": 5000000,
  "description": "Weekly disbursement"
}
```

**Side Effects:**
- Creates `disbursements` record
- Deducts from `escrow_accounts.balance`
- Calls Xendit Disbursement API
- If amount > threshold → `requires_manual_review = true`

---

#### `xendit-disbursement-webhook`
Handle Xendit disbursement status callbacks.

| Key | Value |
|-----|-------|
| **Method** | `POST` |
| **Auth** | `x-callback-token` header |
| **Events** | `COMPLETED`, `FAILED` |

**On COMPLETED:** Update disbursement status, increment `merchants.total_disbursed`
**On FAILED:** Update status, restore escrow balance, record `failure_reason`

---

#### `subscription-payment`
Create subscription payment via Xendit for tier upgrade/renewal.

| Key | Value |
|-----|-------|
| **Method** | `POST` |
| **Auth** | JWT |
| **JWT Verification** | Disabled (`verify_jwt = false`) — validates internally |

**Request Body:**
```json
{
  "merchant_id": "uuid",
  "tier_id": "uuid",
  "billing_period": "monthly" | "yearly"
}
```

---

#### `auto-pay-execute`
Execute automatic payment for tenants with `auto_pay_enabled = true`.

| Key | Value |
|-----|-------|
| **Method** | `POST` |
| **Auth** | Cron (service role) |

**Logic:**
1. Query tenants with `auto_pay_enabled = true`
2. Check for unpaid invoices due on `auto_pay_day`
3. Create Xendit invoice for each eligible payment
4. Send notification to tenant

---

### 4.4 Invoice & Billing Automation

#### `auto-generate-invoices`
Generate monthly rent invoices based on contract `billing_day`.

| Key | Value |
|-----|-------|
| **Method** | `POST` |
| **Auth** | Cron |

**Logic:**
1. Query active contracts where `billing_day = today`
2. Check for existing invoice this period (idempotency)
3. Create invoice with `status: 'pending'`, `invoice_number` auto-generated
4. Calculate `line_items` (rent + additional charges)
5. Send notification to tenant

---

#### `generate-invoice-pdf`
Generate PDF document for an invoice.

| Key | Value |
|-----|-------|
| **Method** | `POST` |
| **Auth** | JWT |

**Request Body:**
```json
{
  "invoice_id": "uuid"
}
```

**Response:** PDF file URL or base64 encoded PDF.

---

#### `send-payment-reminder`
Send payment reminders at configured intervals.

| Key | Value |
|-----|-------|
| **Method** | `POST` |
| **Auth** | Cron |

**Reminder Schedule:**
- 7 days before due date
- 3 days before due date
- On due date
- 1 day after due date (overdue warning)

**Channels:** Email (Resend) + In-app notification

---

#### `check-overdue-escalation`
Escalate overdue invoices with late fees and collections.

| Key | Value |
|-----|-------|
| **Method** | `POST` |
| **Auth** | Cron |

**Escalation Flow:**
1. **Grace Period** (1-7 days): `grace_period_active = true`, no fee
2. **Late Fee** (after grace): Calculate based on `late_fee_type` (percentage or fixed)
3. **Collections** (30+ days): Create `collections_cases` record with `escalation_level`

**Late Fee Calculation:**
```
if late_fee_type = 'percentage':
  late_fee = invoice.amount × contract.late_payment_penalty_rate × days_overdue
if late_fee_type = 'fixed':
  late_fee = contract.late_payment_penalty_rate
```

Creates `late_fee_records` for audit trail.

---

#### `check-payment-plan`
Monitor payment plan installments and auto-default.

| Key | Value |
|-----|-------|
| **Method** | `POST` |
| **Auth** | Cron |

**Logic:**
1. Query active `payment_plans` with missed installments
2. Count consecutive missed payments
3. If missed ≥ 2: Set `status = 'defaulted'`, `defaulted_at = now()`
4. Escalate to collections if needed

---

### 4.5 Subscription Management

#### `subscription-billing`
Check and create subscription invoices for merchants with due subscriptions.

| Key | Value |
|-----|-------|
| **Method** | `POST` |
| **Auth** | Cron |

**Logic:**
1. Query `merchant_subscriptions` where `next_billing_date <= today`
2. Create `subscription_invoices` record
3. Create Xendit payment invoice
4. Update `next_billing_date`

---

#### `subscription-renewal`
Auto-renew subscriptions at period end.

| Key | Value |
|-----|-------|
| **Method** | `POST` |
| **Auth** | Cron |

---

#### `subscription-grace-check`
Check grace period for overdue subscriptions, suspend or cancel.

| Key | Value |
|-----|-------|
| **Method** | `POST` |
| **Auth** | Cron |

**Grace Period Flow:**
1. `active` → `grace_period` (7 days after failed payment)
2. `grace_period` → `suspended` (after grace expires)
3. `suspended` → `canceled` (30 days after suspension)

---

### 4.6 Escrow & Disbursement

#### `scheduled-disbursement`
Auto-disburse escrow funds based on merchant's configured schedule.

| Key | Value |
|-----|-------|
| **Method** | `POST` |
| **Auth** | Cron |

**Disbursement Schedules:**

| Schedule | Fee Rate | Description |
|----------|----------|-------------|
| `daily` | 0.25% | Receive funds daily |
| `weekly` | Free | Every Monday |
| `monthly` | Free | 1st of each month |
| `on_demand` | 0.5% | Manual request |

**Eligibility:**
- `merchants.verification_status = 'verified'`
- `escrow_accounts.balance >= merchants.min_disbursement_amount`
- Has primary `bank_accounts` record

---

#### `process-deposit-refund`
Process tenant security deposit refund via Xendit disbursement.

| Key | Value |
|-----|-------|
| **Method** | `POST` |
| **Auth** | JWT |

**Request Body:**
```json
{
  "deposit_refund_id": "uuid"
}
```

**Flow:**
1. Validate `deposit_refunds` record
2. Check tenant bank details (bank_name, account_number, account_holder_name)
3. Create Xendit disbursement
4. Update status to `processing`

---

### 4.7 Referral Program

#### `process-referral-commissions`
Process eligible referral commissions (cron-triggered).

| Key | Value |
|-----|-------|
| **Method** | `POST` |
| **Auth** | Cron |

**Commission Types:**

| Referrer Role | Referee Action | Reward |
|---------------|---------------|--------|
| Merchant | New merchant subscribes | Subscription credit |
| Tenant | New tenant pays first rent | Cash reward |
| Vendor | New vendor gets first order | Order bonus |

---

#### `process-referral-reward`
Credit referral rewards to users (triggered by payment webhook).

| Key | Value |
|-----|-------|
| **Method** | `POST` |
| **Auth** | Service (internal call) |

**Request Body:**
```json
{
  "event_type": "subscription_paid" | "rent_paid" | "order_paid",
  "user_id": "uuid",
  "amount": 1500000,
  "subscription_tier": "professional"
}
```

**Side Effects:**
- Updates `referrals` record (status, reward_amount)
- Creates `referral_rewards` record
- Applies `referral_discount` on merchant's invoices

---

#### `process-vendor-order-referral`
Process vendor marketplace order referral bonuses.

| Key | Value |
|-----|-------|
| **Method** | `POST` |
| **Auth** | Service |

---

### 4.8 Notifications

#### `send-notification`
Send email notifications via Resend API. Supports 30+ notification types.

| Key | Value |
|-----|-------|
| **Method** | `POST` |
| **Auth** | Service (internal call via service role) |
| **Secrets** | `RESEND_API_KEY` |

**Request Body:**
```json
{
  "type": "payment_received" | "invoice_created" | "subscription_upgrade" | ...,
  "recipientEmail": "user@example.com",
  "recipientName": "John Doe",
  "data": { ... }
}
```

**Notification Types:**

| Category | Types |
|----------|-------|
| Payment | `payment_received`, `payment_reminder`, `payment_overdue`, `payment_failed` |
| Invoice | `invoice_created`, `invoice_paid`, `invoice_overdue` |
| Subscription | `subscription_upgrade`, `subscription_payment`, `subscription_expiring`, `subscription_suspended`, `subscription_canceled` |
| Contract | `contract_created`, `contract_signed`, `contract_expiring`, `move_out_notice` |
| Maintenance | `maintenance_created`, `maintenance_assigned`, `maintenance_completed`, `maintenance_review` |
| Tenant | `tenant_invitation`, `tenant_welcome`, `tenant_checkout` |
| Merchant | `merchant_verification_approved`, `merchant_verification_rejected` |
| Escrow | `disbursement_completed`, `disbursement_failed`, `escrow_deposit` |
| Referral | `referral_reward_credited`, `referral_converted` |
| Admin | `new_dispute`, `collections_escalation`, `fraud_alert` |

---

#### `whatsapp-notification`
Send WhatsApp message via Whatsmeow API.

| Key | Value |
|-----|-------|
| **Method** | `POST` |
| **Auth** | JWT |

**Request Body:**
```json
{
  "phone": "628123456789",
  "message": "Pembayaran sewa Anda berhasil.",
  "template": "payment_confirmation"
}
```

> **Note:** Currently running in mock mode. Production requires Whatsmeow API server.

---

### 4.9 AI & Chatbot

#### `ai-chatbot`
Multi-role AI chatbot with context-aware responses.

| Key | Value |
|-----|-------|
| **Method** | `POST` |
| **Auth** | JWT |
| **AI Model** | Lovable AI (Gemini) |

**Request Body:**
```json
{
  "message": "Bagaimana cara bayar sewa bulan ini?",
  "conversation_id": "uuid",
  "context": "tenant"
}
```

**Response (200):**
```json
{
  "reply": "Untuk membayar sewa, buka menu Pembayaran di dashboard Anda...",
  "conversation_id": "uuid",
  "sources": ["knowledge_base", "contract_data"]
}
```

**Features:**
- Context-aware per role (tenant sees own contract/payment data)
- Knowledge base from `chatbot_knowledge` table
- Conversation history stored in `chat_conversations` + `chat_messages`
- Analytics tracked in `chatbot_analytics`
- Input sanitization (AI prompt injection prevention)

---

#### `merchant-ai-assistant`
Merchant-specific AI with property and financial context.

| Key | Value |
|-----|-------|
| **Method** | `POST` |
| **Auth** | JWT |

**Context Data Injected:**
- Property occupancy rates
- Revenue trends
- Overdue invoices
- Maintenance request summary
- Tenant churn analysis

---

#### `vendor-ai-assistant`
Vendor-specific AI with order and product context.

| Key | Value |
|-----|-------|
| **Method** | `POST` |
| **Auth** | JWT |

**Context Data Injected:**
- Order history and trends
- Product performance
- Customer reviews
- Revenue analytics

---

### 4.10 Operations

#### `vacancy-tracking-cron`
Track vacant units, calculate vacancy days, and send alerts.

| Key | Value |
|-----|-------|
| **Method** | `POST` |
| **Auth** | Cron |

**Logic:**
1. Query units with `status = 'available'`
2. Calculate vacancy duration
3. Alert merchant if vacancy > 30 days
4. Update analytics for occupancy rate

---

#### `order-auto-reject`
Auto-reject marketplace orders not responded within 48 hours.

| Key | Value |
|-----|-------|
| **Method** | `POST` |
| **Auth** | Cron |

**Logic:**
1. Query orders with `status = 'pending'` and `created_at < 48 hours ago`
2. Update `status = 'rejected'`, `rejection_reason = 'auto_rejected_timeout'`
3. Notify buyer

---

### 4.10 OCR Services (DSS)

#### `ocr-ktp-extract`
Extract data from KTP (Indonesian National ID) photo using Gemini Vision.

| Key | Value |
|-----|-------|
| **Method** | `POST` |
| **Auth** | JWT |
| **AI Model** | Gemini 2.5 Pro (multimodal vision) |
| **Tier Gate** | Professional (10/bulan), Enterprise (Unlimited) |

**Request Body:**
```json
{
  "image_url": "verification-documents/tenant_uuid/ktp.jpg"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "nik": "3201234567890001",
    "full_name": "JOHN DOE",
    "date_of_birth": "1990-05-15",
    "place_of_birth": "JAKARTA",
    "gender": "LAKI-LAKI",
    "address": "JL. SUDIRMAN NO. 10 RT 001/002",
    "kelurahan": "MENTENG",
    "kecamatan": "MENTENG",
    "religion": "ISLAM",
    "marital_status": "BELUM KAWIN",
    "occupation": "KARYAWAN SWASTA",
    "nationality": "WNI",
    "valid_until": "SEUMUR HIDUP",
    "confidence_score": 0.92
  },
  "ocr_result_id": "uuid",
  "requires_review": false
}
```

**Implementation Pattern:**
```typescript
// Fetch image from Supabase Storage → base64 → Gemini Vision
const { data: imageData } = await supabaseAdmin.storage
  .from('verification-documents')
  .download(imagePath);

const base64 = btoa(String.fromCharCode(...new Uint8Array(await imageData.arrayBuffer())));

const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
  method: "POST",
  headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
  body: JSON.stringify({
    model: "google/gemini-2.5-pro",
    messages: [{
      role: "user",
      content: [
        { type: "text", text: "Extract all fields from this Indonesian KTP (National ID Card)..." },
        { type: "image_url", image_url: { url: `data:image/jpeg;base64,${base64}` } }
      ]
    }],
    tools: [{ type: "function", function: { name: "extract_ktp", parameters: ktpSchema } }],
    tool_choice: { type: "function", function: { name: "extract_ktp" } }
  })
});
```

**Business Rules:**
- Confidence ≥ 80%: Auto-fill tenant form fields
- Confidence < 80%: Flag `requires_review = true`, merchant must verify manually
- Image must be from private `verification-documents` bucket
- Stores result in `ocr_results` table with `document_type = 'ktp'`

**Side Effects:**
- Creates `ocr_results` record
- If confidence ≥ 80%: Auto-populates `tenants.ktp_number`, `tenants.gender`, `tenants.date_of_birth`
- Creates `audit_logs` entry

---

#### `ocr-payment-proof`
Extract data from payment proof / transfer receipt and auto-match with pending invoices.

| Key | Value |
|-----|-------|
| **Method** | `POST` |
| **Auth** | JWT |
| **AI Model** | Gemini 2.5 Pro (multimodal vision) |
| **Tier Gate** | Basic (5/bulan), Professional (50/bulan), Enterprise (Unlimited) |

**Request Body:**
```json
{
  "image_url": "verification-documents/tenant_uuid/payment_proof.jpg",
  "invoice_id": "uuid"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "amount": 1500000,
    "bank_name": "BCA",
    "sender_name": "JOHN DOE",
    "sender_account": "1234567890",
    "recipient_name": "KOS HARMONI",
    "recipient_account": "0987654321",
    "transaction_date": "2026-02-15",
    "reference_number": "TRF/2026/0215/12345",
    "confidence_score": 0.88
  },
  "matched_invoice": {
    "invoice_id": "uuid",
    "invoice_number": "INV2026020001",
    "match_confidence": 0.95,
    "amount_match": true,
    "date_within_range": true
  },
  "verification_id": "uuid"
}
```

**Matching Logic:**
- Amount tolerance: ±Rp 1.000 (fuzzy match)
- Date range: Within 7 days of invoice `due_date`
- If `invoice_id` provided: Direct match
- If `invoice_id` not provided: Scan all `pending`/`overdue` invoices for tenant's merchant

**Side Effects:**
- Creates `payment_verifications` record with `status = 'pending_review'`
- If high confidence (≥ 90%): Auto-suggest confirmation to merchant
- Creates `ocr_results` record with `document_type = 'payment_proof'`

---

#### `ocr-business-document`
Extract data from merchant business documents (NIB, SIUP, Akta, NPWP).

| Key | Value |
|-----|-------|
| **Method** | `POST` |
| **Auth** | JWT |
| **AI Model** | Gemini 2.5 Pro (multimodal vision) |
| **Tier Gate** | Professional, Enterprise |

**Request Body:**
```json
{
  "document_url": "verification-documents/merchant_uuid/nib.pdf",
  "document_type": "nib"
}
```

**Supported Document Types:**

| Type | Full Name | Fields Extracted |
|------|-----------|-----------------|
| `nib` | Nomor Induk Berusaha | nib_number, business_name, address, issue_date, kbli_codes |
| `siup` | Surat Izin Usaha Perdagangan | siup_number, business_name, business_type, capital_category, valid_until |
| `akta` | Akta Pendirian | akta_number, notary_name, establishment_date, founders, business_purpose |
| `npwp` | Nomor Pokok Wajib Pajak | npwp_number, taxpayer_name, address, registration_date, tax_office |

**Response (200):**
```json
{
  "success": true,
  "data": {
    "document_number": "1234567890123",
    "extracted_fields": {
      "nib_number": "1234567890123",
      "business_name": "PT Kos Harmoni",
      "address": "Jl. Sudirman No. 10",
      "issue_date": "2024-01-15",
      "kbli_codes": ["55901", "68110"]
    },
    "expiry_date": null,
    "confidence_score": 0.85
  },
  "ocr_result_id": "uuid"
}
```

**Side Effects:**
- Creates `ocr_results` record with corresponding `document_type`
- Auto-populates `merchant_verifications` document fields
- If confidence ≥ 85%: Updates `merchants.business_name` if different

---

#### `ocr-maintenance-receipt`
Extract cost data from maintenance receipts/invoices for expense tracking.

| Key | Value |
|-----|-------|
| **Method** | `POST` |
| **Auth** | JWT |
| **AI Model** | Gemini 2.5 Pro (multimodal vision) |
| **Tier Gate** | Professional, Enterprise |

**Request Body:**
```json
{
  "image_url": "maintenance-photos/receipt_uuid/nota.jpg",
  "maintenance_request_id": "uuid"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "vendor_name": "Toko Material Jaya",
    "items": [
      { "description": "Pipa PVC 3/4 inch", "quantity": 2, "unit_price": 25000, "amount": 50000 },
      { "description": "Lem pipa", "quantity": 1, "unit_price": 15000, "amount": 15000 },
      { "description": "Jasa tukang", "quantity": 1, "unit_price": 150000, "amount": 150000 }
    ],
    "subtotal": 215000,
    "tax": 0,
    "total": 215000,
    "receipt_date": "2026-02-10",
    "receipt_number": "NT/2026/0210/001",
    "confidence_score": 0.82
  },
  "expense_id": "uuid"
}
```

**Side Effects:**
- Creates `maintenance_expenses` record linked to `maintenance_request_id`
- Updates maintenance request with `actual_cost = total`
- Creates `ocr_results` record with `document_type = 'maintenance_receipt'`

---

### 4.11 ML Predictive Analytics (DSS)

#### `ml-revenue-forecast`
Predict revenue for 3-12 months based on historical data analysis.

| Key | Value |
|-----|-------|
| **Method** | `POST` |
| **Auth** | JWT (merchant/admin) |
| **AI Model** | Gemini 2.5 Pro (contextual reasoning) |
| **Tier Gate** | Professional, Enterprise |

**Request Body:**
```json
{
  "merchant_id": "uuid",
  "forecast_months": 6,
  "property_id": "uuid"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "forecasts": [
      {
        "month": "2026-03",
        "predicted_revenue": 15000000,
        "confidence_interval": { "lower": 13500000, "upper": 16500000 },
        "predicted_occupancy_rate": 0.85,
        "revenue_breakdown": {
          "rent_income": 14000000,
          "late_fees": 500000,
          "marketplace_income": 500000
        }
      }
    ],
    "trend": "stable_growth",
    "seasonality_factor": 1.05,
    "key_assumptions": [
      "Current occupancy rate maintained at 85%",
      "No significant contract expirations in forecast period",
      "Late payment rate continues at 12%"
    ],
    "risk_factors": [
      "3 contracts expiring in next 2 months",
      "1 unit in maintenance > 30 days"
    ]
  },
  "model_run_id": "uuid"
}
```

**Data Sources Aggregated:**
- `payments` — Last 12 months payment amounts and timing
- `contracts` — Active contracts, rent amounts, end dates
- `units` — Occupancy status, vacancy duration
- `invoices` — Collection rates, overdue patterns
- `escrow_transactions` — Net revenue after fees

**Implementation:** Historical data aggregated per month → sent as structured context to Gemini → tool calling for structured forecast output.

---

#### `ml-tenant-risk-score`
Calculate risk score (0-100) for tenant default probability.

| Key | Value |
|-----|-------|
| **Method** | `POST` |
| **Auth** | JWT (merchant/admin) |
| **AI Model** | Gemini 2.5 Pro (contextual reasoning) |
| **Tier Gate** | Professional, Enterprise |

**Request Body (single tenant):**
```json
{
  "tenant_user_id": "uuid"
}
```

**Request Body (batch — all merchant's tenants):**
```json
{
  "merchant_id": "uuid"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "risk_scores": [
      {
        "tenant_user_id": "uuid",
        "tenant_name": "John Doe",
        "unit_number": "A-101",
        "score": 72,
        "risk_level": "high",
        "factors": [
          "Late payment 4 of last 6 months (67%)",
          "Average days late: 8.5 days",
          "Active collections case",
          "Contract ends in 45 days, no renewal signal"
        ],
        "recommended_actions": [
          "Schedule personal meeting to discuss payment concerns",
          "Offer payment plan for outstanding balance",
          "Prepare move-out process if no improvement in 30 days"
        ],
        "payment_history": {
          "total_invoices": 12,
          "on_time": 5,
          "late": 6,
          "unpaid": 1,
          "avg_days_late": 8.5
        }
      }
    ],
    "summary": {
      "total_tenants": 15,
      "low_risk": 8,
      "medium_risk": 4,
      "high_risk": 2,
      "critical_risk": 1
    }
  },
  "model_run_id": "uuid"
}
```

**Risk Level Thresholds:**

| Score | Level | Description |
|-------|-------|-------------|
| 0-25 | `low` | Consistently on-time, stable tenant |
| 26-50 | `medium` | Occasional late payments, monitor |
| 51-75 | `high` | Frequent late, active issues, intervention needed |
| 76-100 | `critical` | Default imminent, escalate immediately |

**Data Sources:**
- `payments` — Payment timing vs due dates (late ratio)
- `invoices` — Overdue count, total outstanding
- `contracts` — Duration, renewal history, churn signals
- `collections_cases` — Active cases, escalation level
- `maintenance_requests` — Complaint frequency (churn signal)

**Side Effects:**
- Upserts `tenant_risk_scores` record (cached for 24h)
- If score ≥ 76 (critical): Creates notification to merchant
- Creates `ml_model_runs` audit record

---

#### `ml-churn-prediction`
Predict which tenants are likely to leave within 1-6 months.

| Key | Value |
|-----|-------|
| **Method** | `POST` |
| **Auth** | JWT (merchant/admin) |
| **AI Model** | Gemini 2.5 Pro |
| **Tier Gate** | Enterprise only |

**Request Body:**
```json
{
  "merchant_id": "uuid",
  "prediction_window_months": 3
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "predictions": [
      {
        "tenant_user_id": "uuid",
        "tenant_name": "Jane Smith",
        "unit_number": "B-203",
        "churn_probability": 0.78,
        "risk_factors": [
          "Contract ends in 60 days, no renewal discussion",
          "Payment delays increasing trend (avg 3d → 7d → 12d)",
          "Filed 3 maintenance complaints in last month",
          "Searching behavior detected (frequent login without payment)"
        ],
        "retention_suggestions": [
          "Offer 5% rent discount for 6-month renewal",
          "Address outstanding maintenance requests within 48 hours",
          "Schedule check-in meeting to understand tenant concerns",
          "Highlight property improvements planned"
        ],
        "estimated_revenue_at_risk": 18000000
      }
    ],
    "summary": {
      "total_analyzed": 20,
      "high_churn_risk": 3,
      "medium_churn_risk": 5,
      "total_revenue_at_risk": 54000000
    }
  },
  "model_run_id": "uuid"
}
```

**Data Sources:**
- `contracts` — End dates, renewal history
- `payments` — Payment delay trends (increasing/stable/decreasing)
- `maintenance_requests` — Complaint frequency and resolution time
- `move_out_notices` — Historical move-out patterns
- `forum_posts` / `chat_messages` — Sentiment signals (optional)

---

#### `ml-optimal-pricing`
Recommend optimal rental prices per unit based on data analysis.

| Key | Value |
|-----|-------|
| **Method** | `POST` |
| **Auth** | JWT (merchant) |
| **AI Model** | Gemini 2.5 Pro |
| **Tier Gate** | Enterprise only |

**Request Body:**
```json
{
  "property_id": "uuid"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "recommendations": [
      {
        "unit_id": "uuid",
        "unit_number": "A-101",
        "current_price": 1500000,
        "suggested_price": 1650000,
        "price_range": { "min": 1400000, "max": 1800000 },
        "adjustment_percentage": 10,
        "justification": "Unit A-101 has been consistently occupied for 18 months with zero vacancy. Current price is 15% below comparable units in the area. Amenities (AC, private bathroom) support higher pricing.",
        "market_comparison": {
          "area_average": 1700000,
          "similar_units_range": "Rp 1.400.000 - Rp 1.900.000",
          "data_source": "Historical contracts in same city/property_type"
        },
        "expected_impact": {
          "revenue_increase_monthly": 150000,
          "vacancy_risk": "low"
        }
      }
    ],
    "property_summary": {
      "current_monthly_revenue": 12000000,
      "optimized_monthly_revenue": 13200000,
      "potential_increase_percentage": 10
    }
  },
  "model_run_id": "uuid"
}
```

**Data Sources:**
- `units` — Amenities, size, type, current rent
- `properties` — Location, property type
- `contracts` — Historical rent amounts, vacancy periods
- `cities` — Area-level data

---

### 4.12 AI Decision Support Advisors (DSS)

#### `dss-pricing-advisor`
AI-powered pricing consultant combining ML optimal pricing with market context.

| Key | Value |
|-----|-------|
| **Method** | `POST` |
| **Auth** | JWT (merchant) |
| **AI Model** | Gemini 2.5 Pro |
| **Tier Gate** | Enterprise only |

**Request Body:**
```json
{
  "property_id": "uuid",
  "context": "I want to increase revenue but worried about tenants leaving"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "advice": "Based on your property's 95% occupancy rate and below-market pricing, a phased 8% increase is recommended. Start with vacant units and apply to renewals over 3 months to minimize churn risk.",
    "recommendations": [
      {
        "unit_id": "uuid",
        "unit_number": "A-101",
        "action": "Increase rent by Rp 120.000 at next renewal",
        "expected_impact": "+Rp 120.000/month, vacancy risk: low",
        "priority": "high",
        "timing": "Next contract renewal (2026-04-01)"
      }
    ],
    "market_insights": "Kos prices in Jakarta Selatan have increased 12% YoY. Properties with AC and private bathroom command 20% premium. Your property is currently priced 15% below market average.",
    "risk_assessment": "Low risk — high occupancy and tenant satisfaction scores suggest price elasticity tolerance of up to 15%."
  },
  "recommendation_id": "uuid"
}
```

**Side Effects:**
- Creates `dss_recommendations` record with `type = 'pricing'`, `status = 'pending'`
- Merchant can accept/dismiss recommendations (tracked for model improvement)

---

#### `dss-collection-strategy`
AI-recommended collection approach per tenant based on risk profile and payment patterns.

| Key | Value |
|-----|-------|
| **Method** | `POST` |
| **Auth** | JWT (merchant) |
| **AI Model** | Gemini 2.5 Pro |
| **Tier Gate** | Enterprise only |

**Request Body:**
```json
{
  "tenant_user_id": "uuid"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "strategy": "Empathetic Engagement — This tenant has a history of paying but with delays. Personal approach recommended over formal escalation.",
    "recommended_actions": [
      {
        "action": "Send personalized WhatsApp message",
        "timing": "Day 3 after due date",
        "channel": "whatsapp",
        "message_template": "Halo [name], kami notice pembayaran sewa bulan ini belum masuk. Apakah ada kendala? Kami bisa bantu atur cicilan jika diperlukan 🙏"
      },
      {
        "action": "Offer payment plan",
        "timing": "Day 7 if no response",
        "channel": "in_app",
        "message_template": "Kami menawarkan cicilan 2x untuk sewa bulan ini. Klik di sini untuk melihat opsi pembayaran."
      },
      {
        "action": "Formal reminder with late fee warning",
        "timing": "Day 14",
        "channel": "email",
        "message_template": null
      }
    ],
    "success_probability": 0.82,
    "alternative_approaches": [
      "Deposit deduction with written notice (if > 30 days overdue)",
      "Early termination offer with reduced penalty"
    ],
    "tenant_profile": {
      "risk_score": 58,
      "risk_level": "high",
      "total_outstanding": 3000000,
      "payment_pattern": "Pays between day 5-10 typically"
    }
  },
  "recommendation_id": "uuid"
}
```

---

#### `dss-maintenance-priority`
AI-prioritized maintenance queue based on impact analysis.

| Key | Value |
|-----|-------|
| **Method** | `POST` |
| **Auth** | JWT (merchant) |
| **AI Model** | Gemini 2.5 Pro |
| **Tier Gate** | Enterprise only |

**Request Body:**
```json
{
  "merchant_id": "uuid"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "prioritized_requests": [
      {
        "request_id": "uuid",
        "title": "Water leak in bathroom",
        "current_priority": "medium",
        "recommended_priority": "urgent",
        "priority_score": 95,
        "impact_analysis": "Water leak affects structural integrity. Tenant A-101 pays Rp 1.8M/month and has churn probability of 0.45. Delayed repair could increase churn risk to 0.72.",
        "recommended_vendor": {
          "vendor_id": "uuid",
          "business_name": "Tukang Ledeng Jaya",
          "rating": 4.8,
          "estimated_response_time": "2 hours"
        },
        "estimated_cost": 350000,
        "urgency_reason": "Safety concern + high-value tenant retention risk",
        "revenue_at_risk": 21600000
      }
    ],
    "summary": {
      "total_open_requests": 8,
      "urgent_recommended": 2,
      "total_estimated_cost": 2500000,
      "total_revenue_at_risk": 45000000
    }
  },
  "recommendation_id": "uuid"
}
```

**Prioritization Factors:**
1. Safety/habitability impact (weight: 40%)
2. Tenant revenue value (weight: 25%)
3. Tenant churn probability (weight: 20%)
4. SLA deadline proximity (weight: 15%)

---

#### `dss-investment-insight`
ROI analysis and improvement recommendations per property.

| Key | Value |
|-----|-------|
| **Method** | `POST` |
| **Auth** | JWT (merchant) |
| **AI Model** | Gemini 2.5 Pro |
| **Tier Gate** | Enterprise only |

**Request Body:**
```json
{
  "property_id": "uuid"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "roi_analysis": {
      "current_roi_annual": 0.12,
      "projected_roi_6m": 0.14,
      "projected_roi_12m": 0.15,
      "total_revenue_12m": 180000000,
      "total_expenses_12m": 45000000,
      "net_income_12m": 135000000,
      "occupancy_rate_avg": 0.87,
      "revenue_per_unit": 1500000,
      "expense_per_unit": 375000
    },
    "improvement_suggestions": [
      {
        "suggestion": "Add AC to 3 non-AC units",
        "estimated_cost": 12000000,
        "expected_revenue_increase_monthly": 600000,
        "payback_months": 20,
        "roi_impact": "+4% annual ROI",
        "confidence": "medium"
      },
      {
        "suggestion": "Renovate shared bathroom (Block B)",
        "estimated_cost": 8000000,
        "expected_revenue_increase_monthly": 200000,
        "payback_months": 40,
        "roi_impact": "+1.5% annual ROI",
        "confidence": "low"
      },
      {
        "suggestion": "Increase rent for 5 below-market units",
        "estimated_cost": 0,
        "expected_revenue_increase_monthly": 750000,
        "payback_months": 0,
        "roi_impact": "+5% annual ROI",
        "confidence": "high"
      }
    ],
    "risk_assessment": "Property has stable cash flow with diversified tenants. Main risk: 3 contracts expiring Q2 2026 (30% of revenue). Recommend proactive renewal outreach.",
    "benchmark_comparison": {
      "property_roi": 0.12,
      "area_average_roi": 0.10,
      "performance_rating": "Above Average"
    }
  },
  "recommendation_id": "uuid"
}
```

**Data Sources:**
- `escrow_transactions` — Revenue after fees
- `disbursements` — Outflows
- `maintenance_requests` — Maintenance costs (via `maintenance_expenses`)
- `units` — Per-unit metrics
- `contracts` — Lease terms, renewal patterns

---

## 5. Database-Driven API (Client SDK)

These operations are performed directly via the Supabase JS SDK client with RLS enforcement. No edge functions involved.

### 5.1 Properties Management

**Tables:** `properties`, `units`

| Operation | RLS Policy |
|-----------|-----------|
| Create property | Merchant (own `merchant_id`) |
| Read properties | Merchant (own), Admin (all) |
| Update property | Merchant (own), Admin (all) |
| Delete property | Merchant (own), Admin (all) |

**Properties Fields:**
```typescript
{
  name, property_type, address, city, province, postal_code,
  description, amenities[], images[], status,
  total_units, occupied_units
}
```

**Units Fields:**
```typescript
{
  property_id, unit_number, floor, unit_type,
  rent_amount, deposit_amount, size_sqm,
  amenities[], images[], status: 'available' | 'occupied' | 'maintenance'
}
```

---

### 5.2 Contract Management

**Tables:** `contracts`, `move_out_notices`, `move_out_inspections`, `move_out_tasks`, `early_termination_requests`, `deposit_refunds`, `deposit_disputes`

**Contract Status Flow:**
```
draft → active → (move_out_notice) → terminated
                → early_termination_request → terminated
```

**Contract Fields:**
```typescript
{
  merchant_id, unit_id, tenant_user_id,
  start_date, end_date, rent_amount, deposit_amount,
  billing_day, grace_period_days, late_payment_penalty_rate,
  late_fee_type: 'percentage' | 'fixed',
  signature_status: 'pending' | 'tenant_signed' | 'fully_signed',
  tenant_signature_url, merchant_signature_url,
  notice_period_days, early_termination_penalty_rate,
  referral_bonus_applied, referral_bonus_amount
}
```

**Move-Out Flow:**
```
Notice → Inspection Scheduled → Inspection Completed → Deposit Calculated → Refund Processed
                                                      → Dispute (if tenant disagrees)
```

---

### 5.3 Invoice & Payment Management

**Tables:** `invoices`, `payments`, `payment_plans`, `late_fee_records`, `collections_cases`, `xendit_transactions`

**Invoice Status Flow:**
```
draft → pending → paid
                → overdue → (late_fee_applied) → collections
                → (payment_plan) → installments
```

**Payment Plan Types:**
- `installments` — Split into equal payments
- `deferred` — Push due date forward

---

### 5.4 Maintenance Management

**Tables:** `maintenance_requests`, `maintenance_updates`, `maintenance_timeline`, `maintenance_reviews`

**Status Flow:**
```
submitted → assigned → in_progress → completed → (review by tenant)
                     → accepted (by vendor)
```

**Priority Levels:** `low`, `medium`, `high`, `urgent`

**Categories:** `plumbing`, `electrical`, `furniture`, `appliance`, `structural`, `pest_control`, `cleaning`, `other`

---

### 5.5 Merchant Management

**Tables:** `merchants`, `merchant_verifications`, `merchant_verification_history`, `bank_accounts`, `escrow_accounts`

**Verification Flow:**
```
unverified → pending_verification → verified
                                  → rejected → (resubmit) → pending_verification
```

**Verification Documents:**
- KTP (National ID)
- Business License (SIUP/NIB)
- NPWP (Tax ID)

---

### 5.6 Subscription Management

**Tables:** `subscription_tiers`, `merchant_subscriptions`, `subscription_invoices`, `cancellation_feedback`

**Subscription Status Flow:**
```
trial → active → (payment_failed) → grace_period → suspended → canceled
                → (merchant_cancels) → canceling → canceled
```

**Tier Structure:**
```typescript
{
  name, display_name, description,
  price_monthly, price_yearly,
  max_properties, max_units, max_tenants,
  features: JSON[], trial_days, is_active, sort_order
}
```

---

### 5.7 Vendor & Marketplace

**Tables:** `vendors`, `vendor_verifications`, `vendor_bank_accounts`, `products`, `orders`, `vendor_jobs`

**Order Status Flow:**
```
pending → confirmed → processing → shipped → delivered → completed
        → rejected (manual or auto after 48h)
        → cancelled (by buyer)
```

---

### 5.8 Forum & Community

**Tables:** `forum_posts`, `forum_comments`, `forum_likes`, `forum_reports`

| Operation | RLS Policy |
|-----------|-----------|
| View posts | Anyone (if `is_visible = true`) |
| Create post | Authenticated users (`author_id = auth.uid()`) |
| Update post | Author only (if `is_locked = false`) |
| Delete post | Author or Admin |
| Report post | Any authenticated user |

**Moderation:** Admin can toggle `is_visible`, `is_locked`, `is_pinned`.

---

### 5.9 Referral Program

**Tables:** `referrals`, `referral_rewards`

**Referral Flow:**
```
Generate code → Share → Referee registers with code → Referee completes qualifying action → Commission processed → Reward credited
```

**Referral Fields:**
```typescript
{
  referrer_user_id, referee_user_id,
  referral_code, referrer_role, referee_role,
  status: 'pending' | 'converted' | 'completed' | 'expired',
  reward_amount, reward_paid,
  referee_subscription_tier, referee_monthly_payment
}
```

---

### 5.10 Notifications & Audit

**Tables:** `notifications`, `audit_logs`, `analytics_events`

**Notifications:**
```typescript
{
  user_id, title, message, type, link,
  is_read: boolean, created_at
}
```

**Audit Logs (Read-Only for Admin):**
```typescript
{
  user_id, action, entity_type, entity_id,
  old_data: JSON, new_data: JSON,
  metadata: JSON, ip_address, user_agent
}
```

**RLS:** Insert allowed for all (via `true` policy), Select only for admins.

---

## 6. Data Models

### 6.1 User & Auth

```typescript
interface Profile {
  id: string;               // UUID, PK
  user_id: string;           // FK → auth.users
  email: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  admin_2fa_enabled: boolean;
  admin_2fa_secret: string | null;
  created_at: string;
  updated_at: string;
}

interface UserRole {
  id: string;
  user_id: string;
  role: 'super_admin' | 'admin' | 'moderator' | 'support' | 'merchant' | 'tenant' | 'vendor';
  created_at: string;
}
```

### 6.2 Merchant

```typescript
interface Merchant {
  id: string;
  user_id: string;
  business_name: string;
  business_type: string | null;
  merchant_code: string | null;
  address: string | null;
  city: string | null;
  province: string | null;
  postal_code: string | null;
  verification_status: 'unverified' | 'pending' | 'verified' | 'rejected';
  subscription_tier: string | null;
  billing_day: number | null;           // Day of month for auto-invoicing
  disbursement_schedule: 'daily' | 'weekly' | 'monthly' | 'on_demand';
  min_disbursement_amount: number | null;
  total_disbursed: number | null;
  penalty_rate: number | null;
  referral_discount: number | null;
  referral_discount_months: number | null;
  referred_by: string | null;
  created_at: string;
  updated_at: string;
}
```

### 6.3 Tenant

```typescript
interface Tenant {
  id: string;
  user_id: string;
  linked_merchant_id: string | null;
  current_unit_id: string | null;
  ktp_number: string | null;
  ktp_photo_url: string | null;
  gender: string | null;
  date_of_birth: string | null;
  occupation: string | null;
  income_range: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  emergency_contact_relation: string | null;
  verification_status: 'pending' | 'verified' | 'rejected';
  auto_pay_enabled: boolean;
  auto_pay_day: number;
  notification_preferences: {
    payment_reminders: boolean;
    new_invoices: boolean;
    contract_updates: boolean;
    maintenance_updates: boolean;
  };
  notes: string | null;
  created_at: string;
  updated_at: string;
}
```

### 6.4 Vendor

```typescript
interface Vendor {
  id: string;
  user_id: string;
  business_name: string;
  service_category: string;
  description: string | null;
  service_area: string[];
  operating_hours: JSON | null;
  verification_status: 'pending' | 'verified' | 'rejected';
  rating_average: number;
  total_jobs: number;
  created_at: string;
  updated_at: string;
}
```

### 6.5 Property & Unit

```typescript
interface Property {
  id: string;
  merchant_id: string;
  name: string;
  property_type: string;
  address: string;
  city: string;
  province: string;
  postal_code: string | null;
  description: string | null;
  amenities: string[];
  images: string[];
  status: 'active' | 'inactive';
  total_units: number;
  occupied_units: number;
  created_at: string;
  updated_at: string;
}

interface Unit {
  id: string;
  property_id: string;
  unit_number: string;
  floor: number | null;
  unit_type: string;
  rent_amount: number;
  deposit_amount: number | null;
  size_sqm: number | null;
  amenities: string[];
  images: string[];
  status: 'available' | 'occupied' | 'maintenance' | 'reserved';
  created_at: string;
  updated_at: string;
}
```

### 6.6 Financial

```typescript
interface Invoice {
  id: string;
  contract_id: string;
  merchant_id: string;
  tenant_user_id: string;
  invoice_number: string;
  description: string | null;
  amount: number;
  tax_amount: number;
  total_amount: number;
  line_items: JSON[];
  due_date: string;
  status: 'draft' | 'pending' | 'paid' | 'overdue' | 'cancelled';
  late_fee: number;
  original_amount: number | null;
  late_fee_applied_at: string | null;
  grace_period_active: boolean;
  overdue_since: string | null;
  payment_plan_id: string | null;
  issued_at: string | null;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
}

interface EscrowAccount {
  id: string;
  merchant_id: string;
  balance: number;
  pending_balance: number;
  created_at: string;
  updated_at: string;
}

interface EscrowTransaction {
  id: string;
  escrow_account_id: string;
  contract_id: string | null;
  amount: number;               // Net amount after fees
  gross_amount: number | null;   // Original payment amount
  platform_fee: number | null;   // 1%
  gateway_fee: number | null;    // 2.5%
  type: 'deposit' | 'withdrawal' | 'fee' | 'refund';
  status: 'pending' | 'completed' | 'failed';
  reference: string | null;
  description: string | null;
  processed_at: string | null;
  created_at: string;
}

interface Disbursement {
  id: string;
  escrow_account_id: string | null;
  vendor_id: string | null;
  bank_account_id: string | null;
  amount: number;
  fee_amount: number | null;
  net_amount: number;
  type: 'scheduled' | 'on_demand' | 'deposit_refund';
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'pending_review';
  requires_manual_review: boolean;
  xendit_disbursement_id: string | null;
  xendit_reference: string | null;
  failure_reason: string | null;
  scheduled_for: string | null;
  processed_at: string | null;
  completed_at: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  review_notes: string | null;
  created_at: string;
  updated_at: string;
}

interface XenditTransaction {
  id: string;
  xendit_invoice_id: string | null;
  external_id: string;
  payment_id: string | null;
  invoice_id: string | null;
  order_id: string | null;
  user_id: string;
  amount: number;
  status: 'pending' | 'paid' | 'expired' | 'failed';
  payment_method: string | null;
  payment_channel: string | null;
  payment_url: string | null;
  paid_at: string | null;
  expired_at: string | null;
  callback_data: JSON | null;
  created_at: string;
  updated_at: string;
}
```

### 6.7 Subscription

```typescript
interface SubscriptionTier {
  id: string;
  name: string;
  display_name: string;
  description: string | null;
  price_monthly: number;
  price_yearly: number | null;
  max_properties: number;
  max_units: number;
  max_tenants: number;
  features: JSON[];
  trial_days: number;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

interface MerchantSubscription {
  id: string;
  merchant_id: string;
  tier_id: string;
  status: 'trial' | 'active' | 'grace_period' | 'suspended' | 'canceled';
  payment_status: 'paid' | 'pending' | 'failed';
  current_period_start: string;
  current_period_end: string;
  next_billing_date: string | null;
  trial_ends_at: string | null;
  grace_period_end: string | null;
  failed_attempts: number;
  canceled_at: string | null;
  cancellation_reason: string | null;
  cancellation_requested_at: string | null;
  cancellation_effective_date: string | null;
  payment_method: string | null;
  xendit_recurring_id: string | null;
  created_at: string;
  updated_at: string;
}
```

### 6.8 DSS Data Models

```typescript
// === OCR Models ===

interface OcrResult {
  id: string;
  user_id: string;
  merchant_id: string | null;
  document_type: 'ktp' | 'payment_proof' | 'nib' | 'siup' | 'akta' | 'npwp' | 'maintenance_receipt';
  source_url: string;                    // Storage path
  extracted_data: Record<string, any>;   // Structured output from Gemini
  confidence_score: number;              // 0-1
  requires_review: boolean;
  reviewed_by: string | null;
  reviewed_at: string | null;
  status: 'completed' | 'failed' | 'pending_review' | 'reviewed';
  error_message: string | null;
  processing_time_ms: number | null;
  created_at: string;
}

interface PaymentVerification {
  id: string;
  ocr_result_id: string;
  invoice_id: string | null;
  tenant_user_id: string;
  merchant_id: string;
  extracted_amount: number;
  extracted_date: string | null;
  extracted_reference: string | null;
  extracted_bank: string | null;
  match_confidence: number;               // 0-1
  amount_matches: boolean;
  date_within_range: boolean;
  status: 'pending_review' | 'confirmed' | 'rejected' | 'auto_confirmed';
  confirmed_by: string | null;
  confirmed_at: string | null;
  rejection_reason: string | null;
  created_at: string;
}

interface MaintenanceExpense {
  id: string;
  maintenance_request_id: string;
  ocr_result_id: string | null;
  merchant_id: string;
  vendor_name: string | null;
  items: {
    description: string;
    quantity: number;
    unit_price: number;
    amount: number;
  }[];
  subtotal: number;
  tax: number;
  total: number;
  receipt_date: string | null;
  receipt_number: string | null;
  receipt_url: string | null;
  status: 'draft' | 'confirmed' | 'disputed';
  created_at: string;
  updated_at: string;
}

// === ML Models ===

interface TenantRiskScore {
  id: string;
  tenant_user_id: string;
  merchant_id: string;
  score: number;                          // 0-100
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  factors: string[];
  recommended_actions: string[];
  payment_history_summary: {
    total_invoices: number;
    on_time: number;
    late: number;
    unpaid: number;
    avg_days_late: number;
  };
  model_run_id: string;
  valid_until: string;                    // Cache expiry (24h)
  created_at: string;
  updated_at: string;
}

interface DssRecommendation {
  id: string;
  merchant_id: string;
  type: 'pricing' | 'collection' | 'maintenance' | 'investment';
  property_id: string | null;
  tenant_user_id: string | null;
  recommendation_data: Record<string, any>;  // Full structured response
  status: 'pending' | 'accepted' | 'dismissed' | 'expired';
  accepted_at: string | null;
  dismissed_at: string | null;
  dismiss_reason: string | null;
  model_run_id: string;
  created_at: string;
  expires_at: string;
}

interface MlModelRun {
  id: string;
  function_name: string;                 // e.g., 'ml-tenant-risk-score'
  merchant_id: string;
  input_hash: string;                    // SHA256 of input for deduplication
  input_summary: Record<string, any>;    // Sanitized input metadata
  output_summary: Record<string, any>;   // Key output metrics
  model_version: string;                 // e.g., 'gemini-2.5-pro-2026-02'
  processing_time_ms: number;
  token_usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  } | null;
  status: 'completed' | 'failed' | 'timeout';
  error_message: string | null;
  created_at: string;
}
```

---

## 7. Webhooks

### 7.1 Xendit Payment Webhook

| Key | Value |
|-----|-------|
| **Endpoint** | `POST /functions/v1/xendit-webhook` |
| **Auth** | `x-callback-token` header |
| **Events** | `PAID`, `EXPIRED`, `FAILED` |

**Security Measures:**
1. **Timing-safe comparison** — Constant-time XOR comparison of callback token
2. **Idempotency** — Check `xendit_transactions.status` before processing
3. **Server-side verification** — Confirm status with Xendit API (`GET /v2/invoices/{id}`)
4. **Audit trail** — Full payload stored in `callback_data`

**Fee Deduction (on PAID):**
```
Platform Fee = 1% (PLATFORM_FEE_RATE)
Gateway Fee  = 2.5% (GATEWAY_FEE_RATE)
Net to Escrow = Gross - Platform - Gateway
```

### 7.2 Xendit Disbursement Webhook

| Key | Value |
|-----|-------|
| **Endpoint** | `POST /functions/v1/xendit-disbursement-webhook` |
| **Auth** | `x-callback-token` header |
| **Events** | `COMPLETED`, `FAILED` |

**On `COMPLETED`:**
- Update `disbursements.status = 'completed'`
- Update `merchants.total_disbursed`
- Send notification to merchant

**On `FAILED`:**
- Update `disbursements.status = 'failed'`
- Restore `escrow_accounts.balance`
- Record `failure_reason`

### 7.3 Auth Webhook

| Key | Value |
|-----|-------|
| **Endpoint** | `POST /functions/v1/auth-webhook` |
| **Auth** | Internal Supabase trigger |

Handles user lifecycle events from Supabase Auth.

---

## 8. Cron Jobs

All cron jobs are invoked via `POST` with service role authorization.

| Schedule | Function | Purpose |
|----------|----------|---------|
| Daily 00:00 | `auto-generate-invoices` | Generate rent invoices on billing day |
| Daily 08:00 | `send-payment-reminder` | Send reminders (7d, 3d, due date, 1d overdue) |
| Daily 01:00 | `check-overdue-escalation` | Apply late fees, create collections cases |
| Daily 02:00 | `check-payment-plan` | Check installments, auto-default missed plans |
| Daily 03:00 | `subscription-billing` | Generate subscription invoices for due subscriptions |
| Daily 04:00 | `subscription-renewal` | Auto-renew expiring subscriptions |
| Daily 05:00 | `subscription-grace-check` | Suspend/cancel overdue subscriptions |
| Configurable | `scheduled-disbursement` | Auto-disburse escrow (daily/weekly/monthly) |
| Daily 06:00 | `vacancy-tracking-cron` | Track vacant units, send alerts if >30 days |
| Daily 07:00 | `order-auto-reject` | Auto-reject unresponded orders after 48 hours |
| Daily 09:00 | `process-referral-commissions` | Process eligible referral commissions |
| Daily 10:00 | `auto-pay-execute` | Execute auto-pay for opted-in tenants |
| Daily 11:00 | `ml-daily-risk-scoring` | Batch tenant risk scoring for all active tenants |
| Weekly Mon 06:00 | `ml-weekly-forecast` | Revenue forecast update per merchant |

---

## 9. Security

### 9.1 Row-Level Security (RLS)

**All tables use restrictive mode** (`ALTER TABLE ... ENABLE ROW LEVEL SECURITY`).

| Pattern | Implementation |
|---------|---------------|
| Tenant isolation | `tenant_user_id = auth.uid()` |
| Merchant isolation | `EXISTS (SELECT 1 FROM merchants m WHERE m.id = table.merchant_id AND m.user_id = auth.uid())` |
| Admin access | `has_role(auth.uid(), 'admin'::app_role)` |
| Public read | `USING (true)` — for platform_settings, subscription_tiers, visible forum posts |

### 9.2 JWT Validation

- Edge functions validate JWT via `supabase.auth.getUser()`
- Service role key used only server-side (edge functions)
- Anon key exposed to client (safe, protected by RLS)

### 9.3 Webhook Security

- **Timing-safe token comparison** — Prevents timing attacks on `x-callback-token`
- **Server-side verification** — Double-check payment status with Xendit API
- **Idempotency** — Skip duplicate webhook deliveries

### 9.4 Input Sanitization

- **AI chatbot** — Prompt injection prevention via system prompt guardrails
- **Forum content** — DOMPurify for user-generated HTML content
- **File uploads** — Validated MIME types for images (KTP, signatures, receipts)
- **OCR inputs** — Images must originate from private Supabase Storage buckets (no external URLs)

### 9.5 DSS Security

- **OCR images** — Must be stored in private buckets (`verification-documents`, `contract-documents`, `maintenance-photos`)
- **ML/DSS results** — RLS enforced: merchant can only access own data via `merchant_id = auth.uid()` check
- **Audit trail** — All ML predictions logged in `ml_model_runs` (input hash, output summary, model version)
- **Tier enforcement** — DSS functions check `merchant_subscriptions.tier_id` against feature gate before processing
- **Rate limiting** — DSS functions respect per-tier usage quotas (tracked in `ocr_results` count per month)
- **Data minimization** — Only necessary fields sent to Gemini (no raw PII in prompts where avoidable)

### 9.5 Admin 2FA (TOTP)

- TOTP via `OTPAuth` library (SHA1, 6 digits, 30-second period)
- Secret stored encrypted in `profiles.admin_2fa_secret`
- 8 recovery codes generated at setup
- Audit log entry on enable/disable

### 9.6 Service Role Key Isolation

- `SUPABASE_SERVICE_ROLE_KEY` only accessible in edge functions (Deno.env)
- Never exposed to client-side code
- Used for: webhooks, cron jobs, cross-user operations

---

## 10. Integrations

### 10.1 Xendit (Payment Gateway)

| Feature | API |
|---------|-----|
| Invoice creation | `POST https://api.xendit.co/v2/invoices` |
| Invoice verification | `GET https://api.xendit.co/v2/invoices/{id}` |
| Disbursement | Xendit Disbursement API |
| Auth | `Basic {base64(SECRET_KEY:)}` |
| Webhook | `x-callback-token` header validation |

**Secrets Required:**
- `XENDIT_SECRET_KEY` — API authentication
- `XENDIT_WEBHOOK_TOKEN` — Webhook callback verification

### 10.2 Resend (Email)

| Feature | Details |
|---------|---------|
| API | Resend REST API |
| Templates | 30+ notification types (see Section 4.8) |
| From | `noreply@sihuni.com` (configurable) |

**Secret Required:** `RESEND_API_KEY`

### 10.3 Lovable AI (Chatbot + OCR + ML + DSS)

| Feature | Details |
|---------|---------|
| Models | Gemini 2.5 Pro (via Lovable AI gateway) |
| No API Key Required | Built-in to Lovable Cloud (`LOVABLE_API_KEY` auto-provisioned) |
| Vision (OCR) | Multimodal image analysis for KTP, receipts, business docs |
| Reasoning (ML) | Contextual data analysis for risk scoring, forecasting, pricing |
| Decision Support | AI advisory combining ML outputs with business context |
| Use Cases | Tenant chatbot, Merchant assistant, Vendor assistant, OCR, ML analytics, DSS advisors |
| Tool Calling | Structured output extraction via function calling |

### 10.4 Supabase Storage

| Bucket | Content | Access |
|--------|---------|--------|
| KTP photos | Tenant identity documents | Private (owner + admin) |
| Signatures | Contract digital signatures | Private (parties + admin) |
| Property images | Property and unit photos | Public read |
| Maintenance photos | Issue and completion evidence | Private (parties) |
| Verification docs | Merchant/vendor business documents | Private (owner + admin) |

### 10.5 WhatsApp (Whatsmeow)

| Feature | Details |
|---------|---------|
| Status | Mock mode (ready for production) |
| API | Whatsmeow self-hosted gateway |
| Use Cases | Payment reminders, urgent notifications |

---

## 11. Fee Structure & Rate Limiting

### 11.1 Transaction Fees

| Fee Type | Rate | Applied On |
|----------|------|-----------|
| Platform Fee | 1% | All rent and order payments |
| Gateway Fee | 2.5% | All Xendit transactions |
| **Total** | **3.5%** | Deducted before escrow deposit |

**Example:**
```
Tenant pays:    Rp 1,500,000
Platform Fee:   Rp    15,000 (1%)
Gateway Fee:    Rp    37,500 (2.5%)
Net to Escrow:  Rp 1,447,500
```

### 11.2 Disbursement Fees

| Schedule | Fee Rate | Description |
|----------|----------|-------------|
| Daily | 0.25% | Fastest, small fee per disbursement |
| Weekly | Free | Every Monday, no fee |
| Monthly | Free | 1st of each month, no fee |
| On Demand | 0.5% | Manual request, highest fee |

### 11.3 Subscription Pricing

Managed via `subscription_tiers` table. Configurable by admin.

**Default Tiers:**

| Tier | Monthly | Yearly | Properties | Units | Tenants | Trial |
|------|---------|--------|-----------|-------|---------|-------|
| Free | Rp 0 | Rp 0 | 1 | 5 | 5 | 14 days |
| Basic | Rp 99.000 | Rp 990.000 | 3 | 25 | 25 | 14 days |
| Professional | Rp 249.000 | Rp 2.490.000 | 10 | 100 | 100 | 14 days |
| Enterprise | Rp 599.000 | Rp 5.990.000 | Unlimited | Unlimited | Unlimited | 30 days |

### 11.4 DSS Feature Gating per Tier

| Feature | Free | Basic | Professional | Enterprise |
|---------|------|-------|-------------|-----------|
| OCR KTP Extract | — | — | 10/bulan | Unlimited |
| OCR Payment Proof | — | 5/bulan | 50/bulan | Unlimited |
| OCR Business Document | — | — | 10/bulan | Unlimited |
| OCR Maintenance Receipt | — | — | 20/bulan | Unlimited |
| ML Revenue Forecast | — | — | ✓ | ✓ |
| ML Tenant Risk Score | — | — | ✓ | ✓ |
| ML Churn Prediction | — | — | — | ✓ |
| ML Optimal Pricing | — | — | — | ✓ |
| DSS Pricing Advisor | — | — | — | ✓ |
| DSS Collection Strategy | — | — | — | ✓ |
| DSS Maintenance Priority | — | — | — | ✓ |
| DSS Investment Insight | — | — | — | ✓ |

### 11.5 Rate Limiting

- Edge functions: Default Deno Deploy limits
- AI Chatbot: Rate limited per user (configurable)
- Xendit API: Subject to Xendit rate limits
- Supabase queries: Default 1000 row limit per query

---

## Appendix: Edge Function Configuration

Functions with JWT verification disabled (handled internally):

```toml
# supabase/config.toml
[functions.get-tenant-invitation]
verify_jwt = false

[functions.accept-tenant-invitation]
verify_jwt = false

[functions.ensure-user-bootstrap]
verify_jwt = false

[functions.subscription-payment]
verify_jwt = false
```

All other functions use default JWT verification (`verify_jwt = true`).

---

## Appendix: Environment Variables

| Variable | Source | Usage |
|----------|--------|-------|
| `SUPABASE_URL` | Auto-configured | Database & function calls |
| `SUPABASE_ANON_KEY` | Auto-configured | Client-side SDK |
| `SUPABASE_SERVICE_ROLE_KEY` | Auto-configured | Edge functions (server-side only) |
| `XENDIT_SECRET_KEY` | Manual secret | Xendit API calls |
| `XENDIT_WEBHOOK_TOKEN` | Manual secret | Webhook verification |
| `RESEND_API_KEY` | Manual secret | Email sending |

---

> **Document Version:** 3.0 (DSS Update)
> **Last Updated:** 2026-02-21
> **Total Edge Functions:** 43 (31 core + 12 DSS)
> **Total Database Tables:** 46+ (40 core + 6 DSS)
> **DSS Functions:** 4 OCR + 4 ML + 4 AI Advisors
> **AI Provider:** Lovable AI (Gemini 2.5 Pro — Vision + Reasoning)
> **Skills Applied:** `api-design-principles`, `api-security-best-practices`, `payment-integration`, `billing-automation`, `referral-program`, `database-design`, `supabase-postgres-best-practices`, `ocr-document-processing`, `ml-predictive-analytics`, `decision-support-systems`
