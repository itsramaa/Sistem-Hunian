
# Maksimalisasi Business Process Document - SiHuni Platform

## Ringkasan

File `docs/business-process.md` saat ini hanya mendokumentasikan 5 proses dasar (onboarding, payment, expense, occupancy, room/invoice state machines) yang sudah sangat tertinggal dari implementasi aktual. Dokumen akan di-rewrite secara menyeluruh untuk mencakup **seluruh 20+ proses bisnis end-to-end** yang sudah berjalan di platform, termasuk financial workflows, escrow, subscription lifecycle, marketplace, dan automated operations.

---

## Perubahan yang Akan Dilakukan

### File: `docs/business-process.md` (Full Rewrite)

### 1. Introduction (Diperbarui)
- Update scope dari 5 proses menjadi 20+ proses
- Tambah referensi ke `api-specification.md` dan `backend-architecture.md`
- Tambah document versioning (v2.0)

### 2. Actors & Roles (Diperluas dari 5 menjadi 8 aktor)

| Actor | Deskripsi |
|-------|-----------|
| **Super Admin** | Platform owner, full access |
| **Admin** | Manage merchants, tenants, disputes, moderation |
| **Merchant (Pemilik Kos)** | Manage properties, contracts, invoices, escrow |
| **Tenant (Penyewa)** | Pay rent, maintenance requests, forum, AI chatbot |
| **Vendor** | Marketplace products, fulfill orders, maintenance jobs |
| **System (Cron)** | 12 automated daily jobs |
| **Xendit (Payment Gateway)** | Payment processing, webhooks, disbursement |
| **Resend (Email)** | 30+ transactional email templates |

### 3. Core Business Processes (20+ proses)

#### 3.1 User Registration & Bootstrap
- Registration flow per role (merchant/tenant/vendor)
- `ensure-user-bootstrap` edge function creates profile + role-specific records
- Admin 2FA (TOTP) setup via `validate-admin-secret`
- Mermaid: sequence diagram registration -> bootstrap -> role dashboard

#### 3.2 Merchant Verification Workflow
- Document submission (KTP, business docs)
- Admin review: approve / reject / request resubmission
- Status transitions: `pending` -> `verified` / `rejected`
- Resubmission counter and instructions
- Mermaid: state diagram verification lifecycle

#### 3.3 Tenant Invitation & Onboarding
- Merchant invites tenant via email (generates token)
- `get-tenant-invitation` validates token (public, no auth)
- Tenant registers -> `accept-tenant-invitation` creates:
  - Tenant profile
  - Contract (draft/active)
  - First invoice(s)
  - Unit status update
- Mermaid: sequence diagram invitation -> registration -> contract creation

#### 3.4 Property & Unit Management
- CRUD properties and units
- Unit status: vacant / occupied / maintenance / reserved
- Vacancy tracking via `vacancy-tracking-cron` (daily)
- Mermaid: state diagram unit lifecycle

#### 3.5 Contract Lifecycle
- Creation (draft -> pending_signature)
- Digital signature flow (merchant signs, tenant signs)
- Signature status: `unsigned` -> `merchant_signed` -> `fully_signed`
- Status transitions: `draft` -> `active` -> `notice` -> `completed` / `terminated`
- Early termination request + penalty calculation
- Move-out notice -> inspection -> deposit refund
- Mermaid: state diagram full contract lifecycle

#### 3.6 Invoice Generation & Billing Automation
- `auto-generate-invoices` (daily cron, checks billing_day)
- Invoice lifecycle: `draft` -> `pending` -> `sent` -> `paid` / `overdue` -> `cancelled`
- Grace period handling
- Late fee calculation (percentage or fixed based on contract)
- Mermaid: flowchart auto-generation logic + state diagram invoice lifecycle

#### 3.7 Payment Collection (Xendit Integration)
- Tenant initiates payment -> `xendit-create-invoice` creates Xendit invoice
- Tenant pays via VA/e-wallet/QRIS
- `xendit-webhook` receives callback (PAID/EXPIRED/FAILED)
- Fee calculation: Platform 1% + Gateway 2.5%
- Net amount deposited to merchant's escrow
- Idempotency check (prevents duplicate processing)
- Mermaid: sequence diagram tenant -> Xendit -> webhook -> escrow

#### 3.8 Overdue Escalation Process
- `check-overdue-escalation` (daily cron)
- 4-tier escalation:
  - Day 1-3: Grace period (daily reminders)
  - Day 4-7: Post-grace (email + in-app, merchant notified)
  - Day 8-14: Pre-collection (formal email with penalty)
  - Day 15+: Collection case created
- Mermaid: flowchart escalation tiers

#### 3.9 Payment Plan Management
- Merchant creates payment plan for overdue tenant
- Types: `installments` (split) or `deferred` (postpone)
- `check-payment-plan` (daily cron) monitors installments
- Auto-default if installment missed
- Mermaid: state diagram payment plan lifecycle

#### 3.10 Auto-Pay Execution
- Tenant enables auto-pay
- `auto-pay-execute` (cron) creates Xendit invoices for due invoices
- Automatic payment without tenant action
- Mermaid: flowchart auto-pay decision logic

#### 3.11 Escrow & Disbursement Engine
- Rent payments deposited to escrow (net after fees)
- `scheduled-disbursement` (configurable: daily/weekly/monthly)
- Fee rates: Daily 0.25%, Weekly/Monthly free
- Manual review for large amounts
- Admin approve/reject disbursement
- `xendit-disbursement` calls Xendit API
- `xendit-disbursement-webhook` confirms completion
- Mermaid: sequence diagram payment -> escrow -> disbursement -> bank

#### 3.12 Deposit Refund Process
- Move-out notice triggers deposit review
- Inspection and deduction calculation
- `process-deposit-refund` creates Xendit disbursement to tenant
- Status: `pending` -> `pending_bank_details` -> `processing` -> `refunded`
- Mermaid: flowchart deposit refund with deductions

#### 3.13 Merchant Subscription Lifecycle
- Tiers: Free, Basic, Pro, Enterprise (admin-managed)
- Trial period (configurable days per tier)
- `subscription-billing` (daily) creates subscription invoices
- Payment via Xendit (`subscription-payment`)
- `subscription-renewal` (daily) auto-renew at period end
- `subscription-grace-check` (daily): suspend after grace, cancel after extended grace
- Feature gating based on tier (max properties, units, tenants)
- Mermaid: state diagram subscription lifecycle (trial -> active -> past_due -> suspended -> cancelled)

#### 3.14 Marketplace & Order Management
- Vendor lists products (CRUD)
- Tenant places order
- Order status: `pending` -> `confirmed` -> `in_progress` -> `completed` / `canceled`
- `order-auto-reject` (daily, 48h timeout)
- Service fee calculation
- Tenant reviews vendor after completion
- Mermaid: state diagram order lifecycle

#### 3.15 Maintenance Request Workflow
- Tenant creates request (title, description, category, priority, images)
- Merchant acknowledges and assigns vendor
- Status: `pending` -> `acknowledged` -> `in_progress` -> `completed` / `cancelled`
- SLA deadline tracking
- Timeline entries for each status change
- Tenant reviews vendor after completion
- Mermaid: state diagram maintenance lifecycle

#### 3.16 Referral Program
- User generates referral code
- Referee registers with code
- Events that trigger rewards: `rent_paid`, `subscription_paid`, vendor order
- `process-referral-commissions` (daily cron)
- `process-referral-reward` credits reward to user
- `process-vendor-order-referral` for marketplace referrals
- Mermaid: flowchart referral -> registration -> payment -> reward

#### 3.17 Dispute Resolution
- Tenant/merchant creates dispute
- Admin reviews and resolves
- Status: `open` -> `in_review` -> `resolved` / `dismissed`
- Resolution notes and audit trail
- Mermaid: state diagram dispute lifecycle

#### 3.18 Forum & Community
- Tenant/merchant creates posts and comments
- Like system
- Report moderation (admin): `pending` -> `reviewed` -> `resolved` / `dismissed` / `action_taken`
- Content visibility toggle (hide/unhide)
- Post locking
- Mermaid: state diagram report moderation lifecycle

#### 3.19 AI Chatbot Operations
- 3 role-specific chatbots:
  - `ai-chatbot` (tenant): property info, payment status, maintenance
  - `merchant-ai-assistant`: financial analysis, tenant management
  - `vendor-ai-assistant`: order management, product optimization
- Context injection per role (property data, financial data, order data)
- Prompt injection sanitization
- Mermaid: flowchart chatbot context-loading -> AI response

#### 3.20 Notification System
- In-app notifications (stored in `notifications` table)
- Email via Resend (30+ templates)
- WhatsApp via Whatsmeow (mock, ready for production)
- Triggered by: payments, overdue, subscription, orders, maintenance, referrals
- Mermaid: flowchart notification routing (in-app + email + WhatsApp)

### 4. Data Lifecycle & State Machines (Diperluas dari 2 menjadi 10)

State machines baru yang akan didokumentasikan:
1. **Unit State**: Vacant -> Occupied -> Maintenance -> Reserved
2. **Contract State**: Draft -> Active -> Notice -> Completed/Terminated
3. **Invoice State**: Draft -> Pending -> Paid/Overdue -> Cancelled
4. **Payment State**: Pending -> Paid/Failed/Cancelled
5. **Order State**: Pending -> Confirmed -> In Progress -> Completed/Canceled
6. **Maintenance State**: Pending -> Acknowledged -> In Progress -> Completed/Cancelled
7. **Subscription State**: Trial -> Active -> Past Due -> Suspended -> Cancelled
8. **Disbursement State**: Pending -> Pending Review -> Approved -> Completed/Failed
9. **Dispute State**: Open -> In Review -> Resolved/Dismissed
10. **Forum Report State**: Pending -> Reviewed -> Resolved/Dismissed/Action Taken

### 5. Financial Rules & Fee Structure (Baru)
- Platform fee: 1% per transaction
- Gateway fee: 2.5% per transaction
- Disbursement fee: Daily 0.25%, Weekly/Monthly free
- Late fee: configurable per contract (percentage or fixed)
- Referral reward: Rp 50,000 default
- Subscription pricing per tier

### 6. Validation Rules & Business Constraints (Diperluas)
- Contract validations (dates, amounts, unit availability)
- Invoice validations (due date, amounts)
- Payment validations (amount matching, method)
- Phone number validation (Indonesian format)
- Email validation
- Status transition validations (using defined transition maps)

### 7. Cron Job Schedule (Baru)
Complete schedule of 12 daily automated jobs with timing and dependencies.

### 8. Integration Points (Diperbarui)
- Xendit: Invoice creation, webhooks, disbursement
- Resend: 30+ email templates
- Whatsmeow: WhatsApp notifications
- Lovable AI: Context-aware chatbot (Gemini models)
- Supabase Storage: Documents, signatures, images

### 9. Audit & Compliance (Baru)
- Immutable audit log for all financial actions
- Actor tracking (who did what, when)
- RLS-enforced data isolation
- Admin 2FA for sensitive operations

---

## Skills yang Digunakan

| Skill | Penerapan |
|-------|-----------|
| `billing-automation` | Invoice lifecycle, subscription billing, dunning, payment plan processes |
| `payment-integration` | Xendit webhook flow, idempotency, fee calculation, escrow deposit |
| `referral-program` | Multi-event referral trigger, commission processing, reward crediting |
| `api-security-best-practices` | Webhook verification, audit trails, RLS documentation |
| `pci-compliance` | Tokenized payment handling, no PAN storage |
| `security-auditor` | Immutable audit logs, financial action tracking |
| `workflow-patterns` | State machine documentation, escalation tiers |
| `architecture-patterns` | Event-driven cron job architecture |
| `database-design` | State transition maps, validation rules |
| `mermaid-visualizer` | 15+ diagrams (state, sequence, flowchart) |

---

## Hasil Akhir

Dokumen business process yang lengkap (~1200+ baris) mencakup 20+ proses bisnis end-to-end, 10 state machines, 15+ Mermaid diagrams, financial rules, validation constraints, dan cron job schedules yang mencerminkan implementasi aktual di platform SiHuni.
