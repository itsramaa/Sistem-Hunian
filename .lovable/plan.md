

# Maksimalisasi Domain State Machines & Workflows - SiHuni Platform

## Ringkasan

File `docs/domain-state-machines.md` saat ini mendeskripsikan state machines yang **100% tidak sesuai** dengan implementasi aktual:
- **Document Processing OCR** -- tidak ada fitur OCR di platform
- **ML Model Lifecycle (MLOps)** -- tidak ada ML/AI training pipeline
- **Temporal Workflows** -- tidak digunakan (Deno Edge Functions + cron)
- **xstate / NestJS State Pattern** -- tidak ada (status transitions via Supabase SDK)
- **Room status: RESERVED, DIRTY** -- status unit aktual: `available`, `occupied`, `maintenance`
- **Tenant: PROSPECT, SCREENING, BLACKLISTED** -- tidak ada status tenant berbasis risk scoring
- **Payment: WRITE_OFF, VERIFIED** -- status aktual berbeda (draft, sent, paid, overdue, cancelled, partially_paid)
- **PostgreSQL ENUMs** -- hanya `app_role` yang menggunakan enum; semua status lain menggunakan `text` columns

Platform sebenarnya memiliki **34 tabel dengan kolom status** dan **15+ distinct state machines** yang diimplementasikan via application-level transitions di Supabase SDK dan Edge Functions.

## Perubahan yang Akan Dilakukan

### File: `docs/domain-state-machines.md` (Full Rewrite)

### 1. Introduction (Diperbarui Total)
- Version 2.0
- Architecture: Status columns (`text`) with application-level transitions
- No xstate, no Temporal, no NestJS State Pattern
- Transitions enforced via: `VALID_STATUS_TRANSITIONS` maps in TypeScript, edge function logic, database triggers
- State persistence: PostgreSQL `text` columns with default values
- Audit: State changes logged to `audit_logs`, `maintenance_timeline`, `move_out_timeline`

### 2. Contract Lifecycle (Menggantikan Tenant Lifecycle + Room Occupancy)

**States (8):** `draft` -> `active` -> `pending` -> `notice` -> `completed` -> `terminated` -> `expired` -> `cancelled`

Default: `active`

State diagram (Mermaid):

```text
[*] --> draft (merchant creates contract)
draft --> active (both parties sign / merchant_signed + tenant_signed = fully_signed)
active --> notice (tenant submits move-out notice)
active --> terminated (early termination approved)
notice --> completed (move-out inspection done, deposit processed)
draft --> cancelled (merchant cancels before signing)
active --> expired (end_date passed without renewal)
```

Signature sub-states: `signature_status` column tracks `merchant_signed`, `tenant_signed`, `fully_signed`

Side effects:
- `update_unit_status_on_contract_sign()` trigger: unit.status -> `occupied` when contract signed
- Unit returns to `available` when contract completed/terminated

### 3. Unit Status (Menggantikan Room/Property Occupancy)

**States (3):** `available` | `occupied` | `maintenance`

Default: `available`

```text
[*] --> available
available --> occupied (contract fully signed -- via DB trigger)
occupied --> maintenance (maintenance request urgent)
occupied --> available (contract completed/terminated)
maintenance --> available (repair complete)
```

Key difference from old doc: No `RESERVED`, `DIRTY` states. No booking/check-in flow.

### 4. Invoice Lifecycle (Menggantikan Payment Transaction)

**States (7):** `draft` | `pending` | `sent` | `paid` | `overdue` | `cancelled` | `partially_paid`

Default: `draft`

Transition map (from `merchantInvoiceService.ts`):
```text
draft --> sent, cancelled
sent --> paid, overdue, cancelled
overdue --> paid, cancelled
paid --> (terminal)
cancelled --> (terminal)
```

Side effects:
- `auto-generate-invoices` cron: Creates invoices on billing_day -> `draft`
- `check-overdue-escalation` cron: `sent` -> `overdue` when past due_date
- Xendit webhook: `sent`/`overdue` -> `paid` on payment callback
- Late fee applied via `late_fee_records` table

### 5. Overdue Escalation (4-Tier) -- NEW

This is a sub-workflow of Invoice, implemented in `check-overdue-escalation` edge function:

```text
Day 1-3:   Grace Period (daily reminder notification)
Day 4-7:   Post-Grace (twice daily, stronger warnings)
Day 8-14:  Pre-Collection (escalate to merchant, admin notified)
Day 15+:   Collections (create/escalate collections_case)
```

**Collections Case States:** `initiated` -> escalation levels 1, 2, 3 based on days overdue:
- Level 1: 15-20 days overdue
- Level 2: 21-29 days overdue
- Level 3: 30+ days overdue

### 6. Payment Status

**States (5):** `pending` | `paid` | `overdue` | `cancelled` | `failed`

Default: `pending`

```text
[*] --> pending
pending --> paid (Xendit callback / manual entry)
pending --> overdue (due_date passed)
pending --> failed (payment gateway failure)
overdue --> paid (late payment received)
paid --> (terminal)
cancelled --> (terminal)
```

### 7. Payment Plan Lifecycle -- NEW

**States (6):** `pending_acceptance` | `active` | `accepted` | `completed` | `defaulted` | `cancelled`

Default: `pending_acceptance`

```text
[*] --> pending_acceptance (merchant creates plan)
pending_acceptance --> accepted (tenant accepts)
accepted --> active (first installment period begins)
active --> completed (all installments paid)
active --> defaulted (installment overdue beyond threshold)
pending_acceptance --> cancelled (merchant/tenant cancels)
```

**Installment sub-states (4):** `pending` | `paid` | `overdue` | `cancelled`

### 8. Maintenance Request Lifecycle (Diperbarui Total)

**States (4):** `pending` | `in_progress` | `completed` | `cancelled`

Default: `pending`

Transition map (from `UpdateMaintenanceDialog.tsx`):
```text
pending --> in_progress, cancelled
in_progress --> completed, cancelled
completed --> (terminal)
cancelled --> (terminal)
```

Guard conditions:
- `completed` requires `notes` (completion notes mandatory)
- Vendor assignment validated against `service_categories`
- SLA deadline auto-calculated via `calculate_sla_deadline()` trigger

Timeline tracking: `maintenance_timeline` table logs every status change with `actor_id`, `actor_role`, `message`

### 9. Merchant Subscription Lifecycle -- NEW

**States (5):** `trialing` | `active` | `suspended` | `cancelled` | (implicit: `past_due`)

Default: `trialing`

```text
[*] --> trialing (merchant onboards with free trial)
trialing --> active (trial ends + payment method provided)
trialing --> active (downgraded to free tier if no payment)
active --> suspended (subscription invoice overdue)
suspended --> active (payment received within grace period)
suspended --> cancelled (grace period expired -- 7 days)
active --> cancelled (cancellation_effective_date reached)
```

Cron functions:
- `subscription-renewal`: Handles trial expiry and period renewal
- `subscription-grace-check`: Manages 7-day grace period, suspension, cancellation
- `subscription-billing`: Generates subscription invoices

### 10. Move-Out Workflow -- NEW

Three connected state machines:

#### 10.1 Move-Out Notice
**States:** `submitted` | `acknowledged` | `approved` | `rejected` | `completed`

Default: `submitted`

```text
[*] --> submitted (tenant submits notice)
submitted --> acknowledged (merchant reviews)
acknowledged --> approved (merchant approves)
approved --> completed (inspection done, deposit processed)
submitted --> rejected (merchant rejects)
```

#### 10.2 Move-Out Inspection
**States (3):** `scheduled` | `completed` | `pending`

Default: `scheduled`

```text
[*] --> scheduled (auto-created with move-out notice)
scheduled --> completed (inspector submits inspection_report JSONB)
```

#### 10.3 Early Termination Request
**States:** `pending_approval` | `approved` | `denied` | `counter_offered`

Default: `pending_approval`

```text
[*] --> pending_approval (tenant requests early termination)
pending_approval --> approved (merchant accepts, penalty applied)
pending_approval --> denied (merchant denies with reason)
pending_approval --> counter_offered (merchant proposes different amount)
counter_offered --> approved (tenant accepts counter)
counter_offered --> denied (tenant rejects counter)
```

### 11. Order Lifecycle (Marketplace) -- NEW

**States (5):** `pending` | `confirmed` | `in_progress` | `completed` | `canceled`

Default: `pending`

```text
[*] --> pending (tenant places order)
pending --> confirmed (vendor confirms)
pending --> canceled (auto-reject after 48h via order-auto-reject cron)
confirmed --> in_progress (vendor starts work)
in_progress --> completed (vendor marks done)
confirmed --> canceled (vendor/tenant cancels)
```

### 12. Vendor Job Lifecycle -- NEW

**States:** `pending` | `accepted` | `in_progress` | `completed` | `rejected` | `cancelled`

Default: `pending`

### 13. Disbursement Lifecycle -- NEW

**States:** `pending` | `approved` | `rejected` | `processing` | `completed` | `failed`

Default: `pending`

```text
[*] --> pending (scheduled-disbursement cron creates)
pending --> approved (admin reviews, or auto-approved if !requires_manual_review)
pending --> rejected (admin rejects with notes)
approved --> processing (xendit-disbursement sends to bank)
processing --> completed (xendit-disbursement-webhook confirms)
processing --> failed (xendit reports failure)
```

### 14. Tenant Invitation Lifecycle -- NEW

**States (3):** `pending` | `accepted` | `expired`

Default: `pending`

```text
[*] --> pending (merchant sends invitation with 7-day token)
pending --> accepted (tenant clicks link + accepts)
pending --> expired (7 days passed without acceptance)
```

Token-based validation (no JWT required for `get-tenant-invitation` and `accept-tenant-invitation` edge functions).

### 15. Referral Lifecycle -- NEW

**States:** `pending` | `active` | `completed` | `expired`

Default: `pending`

```text
[*] --> pending (referee signs up via referral code)
pending --> active (referee completes onboarding)
active --> completed (referee makes first payment / meets criteria)
pending --> expired (no action within period)
```

### 16. Verification Workflows -- NEW

#### 16.1 Merchant Verification
**States:** `pending` | `approved` | `rejected`

Default: `pending`

With audit trail in `merchant_verification_history` table.

#### 16.2 Vendor Verification
**States:** `pending` | `approved` | `rejected`

Default: `pending`

### 17. Dispute Lifecycle

**States:** `open` | `in_progress` | `resolved` | `closed`

Default: `open`

### 18. Deposit Refund Lifecycle -- NEW

**States:** `pending_processing` | `approved` | `processing` | `completed` | `rejected`

Default: `pending_processing`

With linked `deposit_disputes` (status: `pending` | `resolved` | `rejected`)

### 19. Escrow Transaction Lifecycle -- NEW

**States:** `pending` | `completed` | `failed`

Default: `pending`

### 20. UI State-Color Mapping (Actual Implementation)

Centralized in `src/shared/utils/statusColors.ts`:

| Status | Badge Variant | Text Class | Background Class |
|--------|--------------|------------|-----------------|
| `pending` | `secondary` | `text-warning` | `bg-warning/10` |
| `active` | `outline` | `text-primary` | `bg-primary/10` |
| `in_progress` | `default` | `text-primary` | `bg-primary/10` |
| `completed` | `outline` | `text-success` | `bg-success/10` |
| `paid` | `outline` | `text-success` | `bg-success/10` |
| `cancelled` | `destructive` | `text-destructive` | `bg-destructive/10` |
| `rejected` | `destructive` | `text-destructive` | `bg-destructive/10` |
| `overdue` | `destructive` | `text-destructive` | `bg-destructive/10` |
| `terminated` | `destructive` | `text-destructive` | `bg-destructive/10` |
| `suspended` | `destructive` | `text-destructive` | `bg-destructive/10` |
| `draft` | `secondary` | `text-muted-foreground` | `bg-muted` |
| `expired` | `default` | `text-muted-foreground` | `bg-muted` |
| `trialing` | `default` | `text-primary` | `bg-primary/10` |
| `verified` | `outline` | `text-success` | `bg-success/10` |

### 21. Implementation Guidelines (Diperbarui Total)

- **No PostgreSQL enums for status** (except `app_role`): All status columns use `text` type with application-level validation
- **Transition enforcement pattern**: `VALID_STATUS_TRANSITIONS` maps in TypeScript service files
- **No xstate/state library**: Simple object maps + if/switch guards
- **Audit logging**: `createAuditLog()` utility for tracking state changes with `old_data`/`new_data`
- **Timeline tables**: `maintenance_timeline`, `move_out_timeline` for detailed state change history
- **Trigger-based automation**: Database triggers for unit status sync, SLA calculation, vendor rating updates
- **Cron-based transitions**: 12 daily edge functions for time-based state changes (overdue escalation, auto-reject, subscription grace)

---

## Skills yang Digunakan

| Skill | Penerapan |
|-------|-----------|
| `workflow-patterns` | State machine design, transition guards, side effects |
| `workflow-orchestration-patterns` | Cron-based orchestration, idempotent job design |
| `architecture-patterns` | Application-level vs DB-level state enforcement |
| `database-design` | text vs enum for status columns, timeline/history tables |
| `supabase-postgres-best-practices` | Trigger-based automation, RLS-aware state changes |
| `billing-automation` | Invoice lifecycle, overdue escalation tiers, payment plans |
| `payment-integration` | Xendit webhook-driven state transitions, idempotency |
| `security-auditor` | Audit log patterns for state change tracking |
| `design-system-patterns` | Status-to-color mapping, badge variant system |
| `tailwind-patterns` | Semantic color tokens for status visualization |

---

## Hasil Akhir

Dokumen domain state machines lengkap (~1000+ baris) mencakup **15+ state machines** aktual dari 34 tabel dengan status columns: Contract (8 states), Unit (3 states), Invoice (7 states), Payment (5 states), Overdue Escalation (4 tiers), Payment Plan (6 states), Maintenance (4 states), Subscription (5 states), Move-Out (3 sub-workflows), Order (5 states), Disbursement (6 states), Tenant Invitation (3 states), Referral (4 states), Verification (3 states), Dispute (4 states), Deposit Refund (5 states), dan Escrow Transaction (3 states) -- menggantikan seluruh referensi OCR/ML/Temporal/xstate yang tidak relevan.

