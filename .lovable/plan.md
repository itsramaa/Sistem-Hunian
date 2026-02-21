

# Maksimalisasi API Specification - SiHuni Platform

## Ringkasan

File `docs/api-specification.md` saat ini hanya mencakup sebagian kecil dari fitur yang sudah diimplementasikan. Dokumen akan di-rewrite secara menyeluruh untuk mencerminkan **seluruh 32 edge functions**, **25+ feature modules**, dan **40+ database tables** yang ada di project. Struktur akan mengikuti best practices dari skills `api-design-principles`, `api-security-best-practices`, dan `payment-integration`.

---

## Perubahan yang Akan Dilakukan

### File: `docs/api-specification.md` (Full Rewrite)

Dokumen baru akan memiliki struktur berikut:

### 1. Overview & Architecture
- Base URL, content-type, date format, currency (IDR)
- Architecture diagram (Client -> Edge Functions -> Database)
- Environment: Lovable Cloud + Deno Edge Functions
- Payment Gateway: Xendit (bukan Midtrans)

### 2. Authentication & Authorization (Diperluas)
- Supabase Auth JWT-based authentication
- RBAC: `super_admin`, `admin`, `moderator`, `support`, `merchant`, `tenant`, `vendor`
- Security headers termasuk CORS policy
- Admin 2FA (TOTP) via `validate-admin-secret`
- User bootstrap flow via `ensure-user-bootstrap`
- Tenant invitation flow (public, no JWT required)

### 3. Standard Response & Error Handling (Diperbaiki)
- Error codes yang sudah diimplementasikan (`ERR_RATE_LIMIT`, `ERR_AI_UNAVAILABLE`, `ERR_INVALID_INPUT`, `ERR_AUTH_REQUIRED`, dll)
- HTTP status codes mapping
- Pagination format (offset-based)

### 4. Edge Functions API (32 Functions - BARU)

#### 4.1 Authentication & User Management
| Function | Method | Auth | Description |
|----------|--------|------|-------------|
| `ensure-user-bootstrap` | POST | JWT | Bootstrap user profile, roles, merchant/tenant/vendor records |
| `validate-admin-secret` | POST | None | Validate admin setup secret key |
| `auth-webhook` | POST | Webhook | Handle auth events from Supabase |

#### 4.2 Tenant Invitation
| Function | Method | Auth | Description |
|----------|--------|------|-------------|
| `get-tenant-invitation` | POST | None | Validate invitation token, return invitation details |
| `accept-tenant-invitation` | POST | None | Accept invitation, create tenant profile, contract, invoices |

#### 4.3 Payment & Billing (Xendit Integration)
| Function | Method | Auth | Description |
|----------|--------|------|-------------|
| `xendit-create-invoice` | POST | JWT | Create Xendit payment invoice for rent/order/subscription |
| `xendit-webhook` | POST | Webhook Token | Handle Xendit payment callbacks (paid, expired, failed) |
| `xendit-disbursement` | POST | JWT | Process disbursement to merchant/vendor bank account |
| `xendit-disbursement-webhook` | POST | Webhook Token | Handle disbursement status callbacks |
| `subscription-payment` | POST | JWT | Create subscription payment via Xendit |
| `auto-pay-execute` | POST | Cron | Execute auto-pay for tenants with auto-pay enabled |

#### 4.4 Invoice & Billing Automation
| Function | Method | Auth | Description |
|----------|--------|------|-------------|
| `auto-generate-invoices` | POST | Cron | Generate monthly rent invoices based on billing_day |
| `generate-invoice-pdf` | POST | JWT | Generate PDF for invoice with merchant/tenant details |
| `send-payment-reminder` | POST | Cron | Send reminders at 7 days, 3 days, and due date |
| `check-overdue-escalation` | POST | Cron | Escalate overdue invoices: late fees, collections |
| `check-payment-plan` | POST | Cron | Monitor payment plan installments, auto-default |

#### 4.5 Subscription Management
| Function | Method | Auth | Description |
|----------|--------|------|-------------|
| `subscription-billing` | POST | Cron | Check and create subscription invoices for due subscriptions |
| `subscription-renewal` | POST | Cron | Auto-renew subscriptions at period end |
| `subscription-grace-check` | POST | Cron | Check grace period, suspend/cancel overdue subscriptions |

#### 4.6 Escrow & Disbursement
| Function | Method | Auth | Description |
|----------|--------|------|-------------|
| `scheduled-disbursement` | POST | Cron | Auto-disburse escrow based on merchant schedule (daily/weekly/monthly) |
| `process-deposit-refund` | POST | JWT | Process tenant deposit refund via Xendit disbursement |

#### 4.7 Referral Program
| Function | Method | Auth | Description |
|----------|--------|------|-------------|
| `process-referral-commissions` | POST | Cron | Process eligible referral commissions |
| `process-referral-reward` | POST | Service | Credit referral rewards to users |
| `process-vendor-order-referral` | POST | Service | Process vendor order referral bonuses |

#### 4.8 Notifications
| Function | Method | Auth | Description |
|----------|--------|------|-------------|
| `send-notification` | POST | Service | Send email via Resend (30+ notification types) |
| `whatsapp-notification` | POST | JWT | Send WhatsApp message via Whatsmeow API |

#### 4.9 AI & Chatbot
| Function | Method | Auth | Description |
|----------|--------|------|-------------|
| `ai-chatbot` | POST | JWT | Multi-role AI chatbot (tenant context-aware) |
| `merchant-ai-assistant` | POST | JWT | Merchant-specific AI with property/financial context |
| `vendor-ai-assistant` | POST | JWT | Vendor-specific AI with order/product context |

#### 4.10 Operations
| Function | Method | Auth | Description |
|----------|--------|------|-------------|
| `vacancy-tracking-cron` | POST | Cron | Track vacant units, calculate vacancy days, send alerts |
| `order-auto-reject` | POST | Cron | Auto-reject orders not responded within 48 hours |

### 5. Database-Driven API (Supabase Client)

Documenting all CRUD operations performed via Supabase client SDK (not edge functions):

#### 5.1 Properties Management
- CRUD operations on `properties` table
- CRUD operations on `units` table
- RLS: merchant sees own, admin sees all

#### 5.2 Contract Management
- Create/update/terminate contracts
- Move-out notices, inspections, tasks
- Early termination requests
- Deposit refunds and disputes

#### 5.3 Invoice & Payment Management
- Invoice CRUD with status transitions
- Payment plans (installments, deferred)
- Late fee records and collections cases

#### 5.4 Maintenance Management
- Create/update maintenance requests
- Assign vendors, track timeline
- Tenant reviews

#### 5.5 Merchant Management
- Verification workflow (submit/approve/reject)
- Bank account management
- Escrow account overview

#### 5.6 Subscription Management
- Subscription tiers (CRUD by admin)
- Merchant subscriptions lifecycle
- Cancellation feedback

#### 5.7 Vendor & Marketplace
- Vendor registration and verification
- Product CRUD
- Order management with status workflow

#### 5.8 Forum & Community
- Posts, comments, likes
- Report moderation (admin)
- Content visibility toggle

#### 5.9 Referral Program
- Referral code generation
- Tracking and commission management

#### 5.10 Notifications & Audit
- In-app notifications
- Audit logs (read-only for admin)
- Analytics events

### 6. Data Models (Diperbaiki sesuai implementasi aktual)

Semua TypeScript interfaces akan di-update sesuai database schema yang sebenarnya:
- `Profile`, `Merchant`, `Tenant`, `Vendor`
- `Property`, `Unit`, `Contract`
- `Invoice`, `Payment`, `PaymentPlan`
- `EscrowAccount`, `EscrowTransaction`, `Disbursement`
- `MaintenanceRequest`, `MoveOutNotice`
- `SubscriptionTier`, `MerchantSubscription`
- `ForumPost`, `ForumComment`, `ForumReport`
- `Referral`, `ReferralReward`
- `Order`, `Product`, `VendorJob`
- `Notification`, `AuditLog`

### 7. Webhooks (BARU)

#### Xendit Payment Webhook
- Endpoint: `xendit-webhook`
- Auth: `x-callback-token` header (timing-safe comparison)
- Events: `PAID`, `EXPIRED`, `FAILED`
- Fee calculation: Platform 1% + Gateway 2.5%

#### Xendit Disbursement Webhook
- Endpoint: `xendit-disbursement-webhook`
- Events: `COMPLETED`, `FAILED`

#### Auth Webhook
- Endpoint: `auth-webhook`
- Handles user creation/deletion events

### 8. Cron Jobs (BARU)

| Schedule | Function | Purpose |
|----------|----------|---------|
| Daily | `auto-generate-invoices` | Generate rent invoices on billing day |
| Daily | `send-payment-reminder` | Send payment reminders (7d, 3d, due) |
| Daily | `check-overdue-escalation` | Apply late fees, escalate to collections |
| Daily | `check-payment-plan` | Check installment status, auto-default |
| Daily | `subscription-billing` | Generate subscription invoices |
| Daily | `subscription-renewal` | Renew expiring subscriptions |
| Daily | `subscription-grace-check` | Suspend/cancel overdue subscriptions |
| Configurable | `scheduled-disbursement` | Auto-disburse escrow funds |
| Daily | `vacancy-tracking-cron` | Track and alert vacant units |
| Daily | `order-auto-reject` | Auto-reject unresponded orders (48h) |
| Daily | `process-referral-commissions` | Process eligible commissions |

### 9. Security (BARU - dari `api-security-best-practices` skill)

- RLS policies on all tables (restrictive mode)
- JWT validation on authenticated endpoints
- Webhook signature verification (timing-safe)
- Input sanitization (AI prompt injection prevention)
- CORS configuration
- Service role key isolation (server-side only)
- Admin 2FA TOTP

### 10. Integrations (Diperbaiki)

- **Payment Gateway**: Xendit (invoice creation, disbursement, webhook)
- **Email**: Resend API (30+ notification templates)
- **WhatsApp**: Whatsmeow API (mock, ready for production)
- **AI**: Lovable AI (Gemini models for chatbot)
- **Storage**: Supabase Storage (KTP photos, signatures, documents)

### 11. Rate Limiting & Fees (BARU - dari `payment-integration` skill)

- Platform fee: 1% per transaction
- Gateway fee: 2.5% per transaction
- Disbursement fees by schedule:
  - Daily: 0.25%
  - Weekly: 0.2%
  - Bi-weekly: 0.15%
  - Monthly: 0.1%

---

## Skills yang Digunakan

| Skill | Penerapan |
|-------|-----------|
| `api-design-principles` | RESTful resource naming, pagination pattern, error handling, HTTP status codes |
| `api-security-best-practices` | JWT auth, input validation, webhook security, RBAC documentation |
| `payment-integration` | Xendit webhook idempotency, PCI compliance notes, fee structure |
| `billing-automation` | Cron job documentation, invoice lifecycle, subscription billing |
| `referral-program` | Referral commission flow, multi-tier reward system |
| `database-design` | Data model documentation, foreign key relationships |
| `supabase-postgres-best-practices` | RLS policy documentation, query patterns |

---

## Hasil Akhir

Dokumen API specification yang lengkap (~800-1000 baris) mencakup seluruh 32 edge functions, 40+ database tables, webhook flows, cron jobs, security model, dan fee structure yang sudah diimplementasikan di project SiHuni.

