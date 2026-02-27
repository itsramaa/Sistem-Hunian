# UX Assessment & Merchant User Journey — Current System Only

> **Document Version**: 3.1 (Forensic Audit Revision)
> **Date**: 2026-02-27
> **Source Authority**: Code-level only — `navigation-config.ts`, `state-machines.ts`, merchant page files, service files, edge functions
> **Excluded Sources**: `merchant_activity_diagram.md` (outdated), PRD escrow sections (outdated)
> **Revision Summary**: Fixed edge function count (65→62), added 6 missing feature sections (F33-F38), added Source Traceability Matrix, added Hallucination Risk Self-Check, flagged referrals, added assumption markers, added missing edge function cross-references

---

## Section 0: Merchant System Scope (Current Version)

### What Merchant CAN Do (38 Features, 57 Pages)

| Domain | Features |
|--------|----------|
| Property & Unit | Property CRUD, unit management, occupancy board, facility/asset inventory |
| Tenant | Tenant list, invitation, screening, analytics, move-out management, waiting list |
| Contract | Contract CRUD, signature workflow, amendments, lease renewals |
| Finance | Invoice management, payment tracking, expense management, financial control, financial reports, reconciliation, collections, utility billing, dynamic pricing, subscription billing |
| Maintenance | Request management, preventive maintenance, vendor performance tracking |
| Intelligence | InsightsHub, analytics dashboard, ML predictions, DSS advisor, market intelligence, financial risk, tenant quality scoring, comparative portfolio |
| Administration | Staff management, document templates, document center, API integration, compliance, data quality, OCR |
| Account | Profile, billing, settings, support, feedback, alerts |

### What Merchant CANNOT Do

- **Escrow management** — Removed per migration `20260227084712`. `merchantDashboardService.ts` hardcodes `balance: 0`.
- **Direct bank disbursement scheduling** — Vendor-only feature
- **Vendor product management** — Vendor portal only
- **Tenant account creation** — Merchant can only invite; tenant self-registers via invitation link
- **Referral management** — ❌ Not Defined in Current System Documentation — database tables exist (`referrals`, `referral_rewards`, `referral_commissions`) but no merchant UI page found in `src/pages/merchant/`

### Vendor-Only Features

- Escrow & disbursement (`DISBURSEMENT_STATUS_TRANSITIONS` in `state-machines.ts` line 138)
- Product/order management (`/vendor/products`, `/vendor/orders`)
- Job acceptance (`VENDOR_JOB_STATUS_TRANSITIONS`)
- Earnings dashboard (`/vendor/earnings`)

### Admin-Only Features

- Merchant verification approval (`/admin/merchants`)
- Payment transfer monitoring (`/admin/payment-transfers`, label: "Transfer Dana")
- Dispute mediation (`/admin/disputes`)
- Subscription tier management (`/admin/subscriptions`)
- Platform configuration (`/admin/platform-config`)
- Forum moderation (`/admin/forum-moderation`)
- Audit logs (`/admin/audit-logs`)
- DSS health monitoring (`/admin/dss-health`)
- Launch readiness (`/admin/launch-readiness`)

### ⚠️ Escrow Confirmation

> **Escrow is NOT part of the merchant system.**
> - Migration `20260227084712` dropped `create_merchant_escrow` trigger with comment: "Escrow account creation removed — using direct payment model"
> - `merchantDashboardService.ts` line 207: `balance: 0` (hardcoded, no escrow query)
> - `merchantDashboardService.ts` line 77-81: queries `payment_transfers` table, NOT `escrow_accounts`
> - `state-machines.ts` line 129: "Section 13: Payment Transfer Lifecycle (Direct Payment Model)"
> - No `ESCROW_TRANSACTION_TRANSITIONS` exists in codebase
> - No `/merchant/escrow` in `navigation-config.ts`
> - No `Escrow.tsx` in `src/pages/merchant/`
> - Disbursement (`DISBURSEMENT_STATUS_TRANSITIONS`) is vendor-only (line 137-143)

---

## Section 0.5: Merchant Feature Source Traceability Matrix

Every feature must trace to a real source. Features without source reference are excluded from analysis.

| # | Feature Name | Found In (Document + Section) | Evidence Snippet | UX Section Reference |
|---|-------------|-------------------------------|------------------|---------------------|
| 1 | Dashboard | `navigation-config.ts` line 122 | `{ path: "/merchant", icon: LayoutDashboard, label: "Dashboard" }` | Feature 1 |
| 2 | Properties | `navigation-config.ts` line 123 | `{ path: "/merchant/properties", icon: Building2, label: "Properti" }` | Feature 2 |
| 3 | Units | `navigation-config.ts` line 123 (activePatterns) | `activePatterns: ["/merchant/units"]` | Feature 3 |
| 4 | Occupancy Board | `navigation-config.ts` line 124 | `{ path: "/merchant/occupancy-board", label: "Papan Okupansi" }` | Feature 4 |
| 5 | Tenants | `navigation-config.ts` line 130 | `{ path: "/merchant/tenants", label: "Penyewa" }` | Feature 5 |
| 6 | Tenant Screening | `navigation-config.ts` line 130 (activePatterns) | `activePatterns: ["/merchant/tenant-screening"]` | Feature 6 |
| 7 | Contracts | `navigation-config.ts` line 131 | `{ path: "/merchant/contracts", label: "Kontrak" }` | Feature 7 |
| 8 | Contract Amendments | `state-machines.ts` lines 217-227 | `AMENDMENT_STATUS_TRANSITIONS` (via Contract Detail page) | Feature 8 |
| 9 | Lease Renewals | `navigation-config.ts` line 131 (activePatterns) | `activePatterns: ["/merchant/lease-renewals"]` | Feature 9 |
| 10 | Maintenance | `navigation-config.ts` line 132 | `{ path: "/merchant/maintenance", label: "Maintenance" }` | Feature 10 |
| 11 | Preventive Maintenance | `navigation-config.ts` line 132 (activePatterns) | `activePatterns: ["/merchant/preventive-maintenance"]` | Feature 11 |
| 12 | Waiting List | `navigation-config.ts` line 133 | `{ path: "/merchant/waiting-list", label: "Daftar Tunggu" }` | Feature 12 |
| 13 | Financial Control | `navigation-config.ts` line 139 | `{ path: "/merchant/financial-control", label: "Kontrol Keuangan" }` | Feature 13 |
| 14 | Invoices | `navigation-config.ts` line 140 | `{ path: "/merchant/invoices", label: "Tagihan" }` | Feature 14 |
| 15 | Payments | `navigation-config.ts` line 141 | `{ path: "/merchant/payments", label: "Pembayaran" }` | Feature 15 |
| 16 | Direct Payment (Payment Transfers) | `merchantDashboardService.ts` lines 77-81 | queries `payment_transfers` table; `PAYMENT_TRANSFER_TRANSITIONS` line 130 | Feature 16 |
| 17 | Expenses | `navigation-config.ts` line 142 | `{ path: "/merchant/expenses", label: "Pengeluaran" }` | Feature 17 |
| 18 | Financial Reports | `navigation-config.ts` line 143 | `{ path: "/merchant/financial-reports", label: "Lap. Keuangan" }` | Feature 18 |
| 19 | Collections | `navigation-config.ts` line 153 | `{ path: "/merchant/collections", label: "Penagihan" }` | Feature 19 |
| 20 | Reconciliation | `navigation-config.ts` line 154 | `{ path: "/merchant/reconciliation", label: "Resolusi & Rekonsiliasi" }` | Feature 20 |
| 21 | Utility Billing | `navigation-config.ts` line 152 | `{ path: "/merchant/utility-billing", label: "Utilitas" }` | Feature 21 |
| 22 | Dynamic Pricing | `navigation-config.ts` line 155 | `{ path: "/merchant/dynamic-pricing", label: "Harga Dinamis" }` | Feature 22 |
| 23 | Move-Outs | `navigation-config.ts` line 130 (activePatterns) | `activePatterns: ["/merchant/move-outs"]` | Feature 23 |
| 24 | Inventory | `navigation-config.ts` line 149 | `{ path: "/merchant/inventory", label: "Inventori" }` | Feature 24 |
| 25 | Guardians (Staff On-Site) | `navigation-config.ts` line 150 | `{ path: "/merchant/guardians", label: "Penjaga" }` | Feature 25 |
| 26 | Vendor Performance | `navigation-config.ts` line 151 | `{ path: "/merchant/vendor-performance", label: "Performa Vendor" }` | Feature 26 |
| 27 | Reports | `navigation-config.ts` line 156 | `{ path: "/merchant/reports", label: "Laporan" }` | Feature 27 |
| 28 | Document Templates | `navigation-config.ts` line 157 | `{ path: "/merchant/document-templates", label: "Template Dokumen" }` | Feature 28 |
| 29 | InsightsHub (AI/ML) | `navigation-config.ts` line 158 | `{ path: "/merchant/insights", label: "Alat" }` | Feature 29 |
| 30 | Staff Management | `navigation-config.ts` line 160 | `{ path: "/merchant/staff", label: "Manajemen Staff" }` | Feature 30 |
| 31 | API & Integration | `navigation-config.ts` line 159 | `{ path: "/merchant/api-integration", label: "API & Integrasi" }` | Feature 31 |
| 32 | Tenant Analytics | `navigation-config.ts` line 130 (activePatterns) | `activePatterns: ["/merchant/tenant-analytics"]` | Feature 32 |
| 33 | Billing / Subscription | `navigation-config.ts` line 168 (bottomNav) → `Billing.tsx` | Page exists: `src/pages/merchant/Billing.tsx`; linked from Support page | Feature 33 |
| 34 | Profile | `navigation-config.ts` line 169 (bottomNav) | `{ path: "/merchant/profile", icon: User, label: "Profil" }` | Feature 34 |
| 35 | Alerts / Notifications | `navigation-config.ts` line 168 (bottomNav) | `{ path: "/merchant/alerts", icon: AlertTriangle, label: "Notifikasi" }` | Feature 35 |
| 36 | Dispute Resolution | `DisputeResolution.tsx` page file | Page exists: `src/pages/merchant/DisputeResolution.tsx`; nav label "Resolusi & Rekonsiliasi" line 154 | Feature 36 |
| 37 | Property Compliance | `PropertyCompliance.tsx` page file | Page exists: `src/pages/merchant/PropertyCompliance.tsx`; accessed via PropertyDetail tab | Feature 37 |
| 38 | Account & Support Utilities | Page files: `Settings.tsx`, `Support.tsx`, `Feedback.tsx`, `OcrTutorial.tsx` | 4 pages exist; linked from Support page sidebar and bottomNav Profile | Feature 38 |
| — | Referrals | ❌ Not Found | Database tables exist but NO `src/pages/merchant/Referral*.tsx` page found | NOT ANALYZED |

---

## Section 1: Merchant Feature Ground Truth (38 Features)

All features extracted from `navigation-config.ts` (lines 111-163), `state-machines.ts`, and `src/pages/merchant/` directory (57 files).

| # | Feature | Nav Path | Page File | State Machine | Edge Functions |
|---|---------|----------|-----------|---------------|----------------|
| 1 | Dashboard | `/merchant` | `Dashboard.tsx` | None | `ensure-user-bootstrap` |
| 2 | Properties | `/merchant/properties` | `Properties.tsx`, `PropertyDetail.tsx` | None | None |
| 3 | Units | `/merchant/units` (via Property) | `Units.tsx`, `UnitDetail.tsx` | `UNIT_STATUS_TRANSITIONS` | None |
| 4 | Occupancy Board | `/merchant/occupancy-board` | `OccupancyBoard.tsx` | None | `compute-occupancy-snapshots`, `vacancy-tracking-cron` |
| 5 | Tenants | `/merchant/tenants` | `Tenants.tsx`, `TenantDetail.tsx` | `TENANT_INVITATION_TRANSITIONS` | `create-tenant-account`, `accept-tenant-invitation`, `get-tenant-invitation` |
| 6 | Tenant Screening | `/merchant/tenant-screening` (via Tenants) | `TenantScreening.tsx` | `SCREENING_STATUS_TRANSITIONS` | `ml-tenant-risk-score`, `ml-tenant-quality-scoring` |
| 7 | Contracts | `/merchant/contracts` | `Contracts.tsx`, `ContractDetail.tsx` | `CONTRACT_STATUS_TRANSITIONS`, `CONTRACT_SIGNATURE_TRANSITIONS` | None |
| 8 | Contract Amendments | (via Contract Detail) | (inline) | `AMENDMENT_STATUS_TRANSITIONS` | None |
| 9 | Lease Renewals | `/merchant/lease-renewals` (via Contracts) | `LeaseRenewals.tsx` | None | `send-renewal-alert` |
| 10 | Maintenance | `/merchant/maintenance` | `Maintenance.tsx`, `MaintenanceDetail.tsx` | `MAINTENANCE_STATUS_TRANSITIONS` | None |
| 11 | Preventive Maintenance | `/merchant/preventive-maintenance` (via Maintenance) | `PreventiveMaintenance.tsx` | None | None |
| 12 | Waiting List | `/merchant/waiting-list` | `WaitingList.tsx` | `WAITING_LIST_TRANSITIONS` | None |
| 13 | Financial Control | `/merchant/financial-control` | `FinancialControl.tsx` | None | None |
| 14 | Invoices | `/merchant/invoices` | `Invoices.tsx`, `InvoiceDetail.tsx` | `INVOICE_STATUS_TRANSITIONS` | `auto-generate-invoices`, `auto-transition-invoices`, `generate-invoice-pdf`, `xendit-create-invoice`, `queue-payment-reminders`, `send-payment-reminder` |
| 15 | Payments | `/merchant/payments` | `Payments.tsx`, `PaymentDetail.tsx` | `PAYMENT_STATUS_TRANSITIONS`, `PAYMENT_VERIFICATION_TRANSITIONS` | `auto-match-payment`, `auto-pay-execute`, `xendit-webhook`, `ocr-payment-proof` |
| 16 | Direct Payment (Payment Transfers) | (Dashboard KPI) | (via `merchantDashboardService.ts`) | `PAYMENT_TRANSFER_TRANSITIONS` | None |
| 17 | Expenses | `/merchant/expenses` | `Expenses.tsx` | `EXPENSE_APPROVAL_TRANSITIONS` | `ocr-expense-receipt` |
| 18 | Financial Reports | `/merchant/financial-reports` | `FinancialReports.tsx` | None | None |
| 19 | Collections | `/merchant/collections` | `Collections.tsx` | `COLLECTIONS_CASE_TRANSITIONS` | `check-overdue-escalation`, `dss-collection-strategy`, `queue-payment-reminders`, `send-payment-reminder` |
| 20 | Reconciliation | `/merchant/reconciliation` | `Reconciliation.tsx` | None | None |
| 21 | Utility Billing | `/merchant/utility-billing` | `UtilityBilling.tsx` | None | None |
| 22 | Dynamic Pricing | `/merchant/dynamic-pricing` | `DynamicPricing.tsx` | None | `ml-optimal-pricing`, `dss-pricing-advisor` |
| 23 | Move-Outs | `/merchant/move-outs` (via Tenants) | `MoveOuts.tsx`, `MoveOutDetail.tsx` | `MOVE_OUT_NOTICE_TRANSITIONS`, `MOVE_OUT_INSPECTION_TRANSITIONS`, `EARLY_TERMINATION_TRANSITIONS`, `DEPOSIT_REFUND_TRANSITIONS` | `process-deposit-refund` |
| 24 | Inventory | `/merchant/inventory` | `Inventory.tsx` | None | `ocr-asset-label` |
| 25 | Guardians (Staff On-Site) | `/merchant/guardians` | `Guardians.tsx` | None | None |
| 26 | Vendor Performance | `/merchant/vendor-performance` | `VendorPerformance.tsx` | None | None |
| 27 | Reports | `/merchant/reports` | `Reports.tsx`, `ReportTemplates.tsx` | None | `data-export` |
| 28 | Document Templates | `/merchant/document-templates` | `DocumentTemplates.tsx` | None | None |
| 29 | InsightsHub (AI/ML) | `/merchant/insights` | `InsightsHub.tsx` + 9 sub-pages | `DSS_RECOMMENDATION_TRANSITIONS` | `ml-*` (11 functions), `dss-*` (4 functions) |
| 30 | Staff Management | `/merchant/staff` | `StaffManagement.tsx` | None | None |
| 31 | API & Integration | `/merchant/api-integration` | `ApiIntegration.tsx` | None | `merchant-api`, `webhook-dispatcher` |
| 32 | Tenant Analytics | `/merchant/tenant-analytics` (via Tenants) | `TenantAnalytics.tsx` | None | `compute-tenant-payment-metrics` |
| 33 | Billing / Subscription | `/merchant/billing` (linked from Support) | `Billing.tsx` | `SUBSCRIPTION_STATUS_TRANSITIONS` | `subscription-billing`, `subscription-grace-check`, `subscription-payment`, `subscription-renewal` |
| 34 | Profile | `/merchant/profile` (bottomNav) | `Profile.tsx` | `MERCHANT_VERIFICATION_TRANSITIONS`, `VERIFICATION_TIER_TRANSITIONS` | `ocr-ktp-extract`, `ocr-business-document` |
| 35 | Alerts / Notifications | `/merchant/alerts` (bottomNav) | `Alerts.tsx` | None | `send-notification`, `whatsapp-notification` |
| 36 | Dispute Resolution | `/merchant/reconciliation` (combined page) | `DisputeResolution.tsx` | `DISPUTE_STATUS_TRANSITIONS` | None |
| 37 | Property Compliance | (via PropertyDetail tab) | `PropertyCompliance.tsx` | None | `ocr-compliance-document` |
| 38 | Account & Support Utilities | (linked from Support/bottomNav) | `Settings.tsx`, `Support.tsx`, `Feedback.tsx`, `OcrTutorial.tsx` | None | `merchant-ai-assistant` |

**Total**: 38 features, 57 page files, 21 state machines applicable to merchant flows, 62 edge functions (many shared across roles)

**State machines applicable to merchant flows (21)**: `CONTRACT_STATUS_TRANSITIONS`, `CONTRACT_SIGNATURE_TRANSITIONS`, `UNIT_STATUS_TRANSITIONS`, `INVOICE_STATUS_TRANSITIONS`, `PAYMENT_STATUS_TRANSITIONS`, `PAYMENT_PLAN_STATUS_TRANSITIONS`, `MAINTENANCE_STATUS_TRANSITIONS`, `SUBSCRIPTION_STATUS_TRANSITIONS`, `MOVE_OUT_NOTICE_TRANSITIONS`, `MOVE_OUT_INSPECTION_TRANSITIONS`, `EARLY_TERMINATION_TRANSITIONS`, `DEPOSIT_REFUND_TRANSITIONS`, `TENANT_INVITATION_TRANSITIONS`, `COLLECTIONS_CASE_TRANSITIONS`, `WAITING_LIST_TRANSITIONS`, `AMENDMENT_STATUS_TRANSITIONS`, `PAYMENT_VERIFICATION_TRANSITIONS`, `SCREENING_STATUS_TRANSITIONS`, `EXPENSE_APPROVAL_TRANSITIONS`, `DSS_RECOMMENDATION_TRANSITIONS`, `PAYMENT_TRANSFER_TRANSITIONS`

**Additionally referenced in Profile (F34)**: `MERCHANT_VERIFICATION_TRANSITIONS`, `VERIFICATION_TIER_TRANSITIONS` — admin-triggered but visible to merchant.

**Dispute (F36)**: `DISPUTE_STATUS_TRANSITIONS` — merchant can view disputes but mediation is admin-only.

---

## Section 2: Full UX Assessment (38 Features)

### Feature 1: Dashboard

#### Documentation Source
- Navigation: `navigation-config.ts` line 122
- Page: `src/pages/merchant/Dashboard.tsx`
- State Machine: None
- Edge Functions: `ensure-user-bootstrap`
- Service: `merchantDashboardService.ts`

#### Actual Flow (Current Only)

| Role | Action | Page / Endpoint |
|------|--------|-----------------|
| Merchant | Login → auto-redirect | `/merchant` |
| System | `ensure-user-bootstrap` creates: profiles, user_roles, merchants, merchant_subscriptions (free tier) | Edge function |
| Merchant | View KPIs: properties, occupancy, revenue, tenants, alerts | Dashboard widgets |
| Merchant | Filter by property | Property dropdown |

> 🧩 Assumption (Low Confidence): Bootstrap output (profiles, user_roles, merchants, merchant_subscriptions) assumed from function name and database schema. Edge function code not read directly.

#### State Machine
> ❌ No Explicit State Machine Defined

#### UX Friction (Evidence-Based)
1. **10 parallel queries** on load (`merchantDashboardService.ts` lines 57-147) — potential slow initial render
2. `balance: 0` hardcoded (line 207) — merchant sees zero balance with no explanation of direct payment model
3. `pendingBalance` from `payment_transfers` (line 77-81) — label unclear, merchant may confuse with actual bank balance
4. Alert thresholds hardcoded: stale maintenance = 5 days, expiring contracts = 30 days — not configurable

#### Business Impact
Dashboard is the primary entry point. Slow load or confusing KPIs directly impact daily engagement and trust.

#### Simplification Opportunities
- Add caching layer or materialized views for KPI queries
- Replace `balance: 0` with clear "Direct Payment" label explaining funds go straight to bank
- Make alert thresholds configurable per merchant

---

### Feature 2: Properties

#### Documentation Source
- Navigation: `navigation-config.ts` line 123
- Page: `Properties.tsx`, `PropertyDetail.tsx`
- State Machine: None
- Edge Functions: None

#### Actual Flow (Current Only)

| Role | Action | Page / Endpoint |
|------|--------|-----------------|
| Merchant | View property list | `/merchant/properties` |
| Merchant | Create property (name, address, type) | Create form |
| Merchant | View property detail (5 tabs + "Lainnya" dropdown) | `/merchant/properties/:id` |
| Merchant | Navigate to units from property | Property Detail → Unit tab |

#### State Machine
> ❌ No Explicit State Machine Defined

#### UX Friction (Evidence-Based)
1. Property detail has 5 primary tabs + "Lainnya" dropdown (Staf, Kepatuhan) — progressive disclosure helps but new users may not discover hidden tabs
2. No property-level status machine — property can't be "archived" or "inactive" without manual workaround

#### Business Impact
Properties are the top-level entity. All operations cascade from here.

#### Simplification Opportunities
- Add property status (active/archived) for portfolio management
- Add onboarding checklist on property detail for new properties

---

### Feature 3: Units

#### Documentation Source
- Navigation: via Properties (`activePatterns: ["/merchant/units"]`, line 123)
- Page: `Units.tsx`, `UnitDetail.tsx`
- State Machine: `UNIT_STATUS_TRANSITIONS` (`state-machines.ts` lines 32-36)
- Edge Functions: None

#### Actual Flow (Current Only)

| Role | Action | Page / Endpoint |
|------|--------|-----------------|
| Merchant | View units list (from property) | `/merchant/units` |
| Merchant | Create unit (number, type, rent, facilities) | Create form |
| Merchant | Change unit status | Status dropdown |

#### State Machine
```
available ─→ occupied ─→ available
    │            │            ↑
    └→ maintenance ←──────────┘
         │
         └→ available
         └→ occupied
```
3 states, bidirectional transitions. No terminal states.

#### UX Friction (Evidence-Based)
1. Unit status changes are manual — no auto-transition when contract is signed (contract signature triggers `occupied` via DB trigger, but UX doesn't reflect this clearly)
2. `maintenance` status blocks occupancy but no ETA or maintenance ticket linkage visible

#### Business Impact
Unit availability directly affects revenue. Incorrect status = missed bookings or double-occupancy.

#### Simplification Opportunities
- Auto-link unit status to contract lifecycle (fully_signed → occupied, completed → available)
- Show maintenance ticket on unit when status = maintenance

---

### Feature 4: Occupancy Board

#### Documentation Source
- Navigation: `navigation-config.ts` line 124
- Page: `OccupancyBoard.tsx`
- State Machine: None
- Edge Functions: `compute-occupancy-snapshots`, `vacancy-tracking-cron`

#### Actual Flow (Current Only)

| Role | Action | Page / Endpoint |
|------|--------|-----------------|
| Merchant | View visual occupancy grid | `/merchant/occupancy-board` |
| Merchant | See vacancy duration tracking | Board view |

#### UX Friction (Evidence-Based)
1. Snapshot-based (cron) — data may be stale up to cron interval
   > 🧩 Assumption (Low Confidence): Cron interval not verified in edge function code. Staleness depends on scheduler configuration.
2. No inline action to convert vacancy to waiting list entry

#### Business Impact
Occupancy visibility is critical for revenue optimization. Stale data = delayed action on vacancies.

#### Simplification Opportunities
- Add "Add to Waiting List" action directly from vacant unit cells
- Show real-time data with fallback to snapshot

---

### Feature 5: Tenants

#### Documentation Source
- Navigation: `navigation-config.ts` line 130
- Page: `Tenants.tsx`, `TenantDetail.tsx`
- State Machine: `TENANT_INVITATION_TRANSITIONS` (`state-machines.ts` lines 189-193)
- Edge Functions: `create-tenant-account`, `accept-tenant-invitation`, `get-tenant-invitation`

#### Actual Flow (Current Only)

| Role | Action | Page / Endpoint |
|------|--------|-----------------|
| Merchant | View tenant list | `/merchant/tenants` |
| Merchant | Invite tenant (email) | Invitation form |
| System | Send invitation link | `send-notification` edge function |
| Tenant | Accept invitation → self-register | `/accept-invitation?token=X` |
| Merchant | View tenant detail | `/merchant/tenants/:id` |

#### State Machine
```
pending ─→ accepted (terminal)
   │
   └→ expired (terminal)
```

#### UX Friction (Evidence-Based)
1. **Merchant cannot create tenant directly** — must invite and wait for acceptance. This is a deliberate design (tenant owns their own account) but creates waiting friction.
2. No visibility on invitation delivery status (email bounce, spam)
3. Expired invitations require manual re-send

#### Business Impact
Tenant onboarding speed directly affects time-to-first-invoice. Blocked invitation = blocked revenue.

#### Simplification Opportunities
- Show invitation delivery status
- Auto-resend on expiry with merchant confirmation
- Add bulk invitation capability

---

### Feature 6: Tenant Screening

#### Documentation Source
- Navigation: via Tenants (`activePatterns: ["/merchant/tenant-screening"]`, line 130)
- Page: `TenantScreening.tsx`
- State Machine: `SCREENING_STATUS_TRANSITIONS` (`state-machines.ts` lines 256-261)
- Edge Functions: `ml-tenant-risk-score`, `ml-tenant-quality-scoring`

#### Actual Flow (Current Only)

| Role | Action | Page / Endpoint |
|------|--------|-----------------|
| Merchant | Initiate screening for prospective tenant | `/merchant/tenant-screening` |
| System | ML model computes risk score | `ml-tenant-risk-score` |
| Merchant | Review score, approve/reject | Screening detail |

#### State Machine
```
pending ─→ scored ─→ approved (terminal)
                │
                └→ rejected ─→ pending (re-screen)
```

#### UX Friction (Evidence-Based)
1. ML scoring depends on external data availability — may return low-confidence scores for new tenants
2. No clear explanation of scoring criteria to merchant
3. Rejection allows re-screening but no guidance on what changed

#### Business Impact
Screening quality directly affects tenant default risk. Poor screening = higher collections cases.

#### Simplification Opportunities
- Show score breakdown with contributing factors
- Add minimum data requirements before allowing screening

---

### Feature 7: Contracts

#### Documentation Source
- Navigation: `navigation-config.ts` line 131
- Page: `Contracts.tsx`, `ContractDetail.tsx`
- State Machine: `CONTRACT_STATUS_TRANSITIONS` (lines 12-21), `CONTRACT_SIGNATURE_TRANSITIONS` (lines 24-29)
- Edge Functions: None

#### Actual Flow (Current Only)

| Role | Action | Page / Endpoint |
|------|--------|-----------------|
| Merchant | Create contract (unit, tenant, dates, rent, deposit, terms) | Create form |
| Merchant | Sign contract | Signature pad |
| Tenant | Sign contract | Tenant portal signature |
| System | `fully_signed` → contract `active`, unit → `occupied` | DB trigger |
| Merchant | View/manage active contracts | `/merchant/contracts` |

#### State Machine — Contract Status
```
draft ─→ active ─→ notice ─→ completed (terminal)
  │         │
  │         ├→ terminated (terminal)
  │         └→ expired (terminal)
  └→ cancelled (terminal)
```

#### State Machine — Signature Status
```
pending ─→ merchant_signed ─→ fully_signed (terminal)
   │                              ↑
   └→ tenant_signed ──────────────┘
```

#### UX Friction (Evidence-Based)
1. **Dual-signature requirement** — merchant must sign first OR tenant must sign first, but both must sign. No clear UI indication of who needs to act next.
2. Contract creation has many fields (rent, deposit, billing_day, grace_period, penalty_rate, notice_period) — overwhelming for first-time users
3. No contract template system for repeat configurations (though `document-templates` exists separately)

#### Business Impact
Contract is the legal backbone. Incomplete signatures block the entire revenue chain (no invoices, no payments).

#### Simplification Opportunities
- Add "who needs to sign next" status indicator
- Pre-fill from previous contracts for same property type
- Link contract creation to document templates

---

### Feature 8: Contract Amendments

#### Documentation Source
- Navigation: via Contract Detail
- State Machine: `AMENDMENT_STATUS_TRANSITIONS` (`state-machines.ts` lines 217-227)
- Edge Functions: None

#### Actual Flow (Current Only)

| Role | Action | Page / Endpoint |
|------|--------|-----------------|
| Merchant | Create amendment (rent change, term extension, etc.) | Contract detail |
| Merchant | Send to tenant | Status: draft → sent |
| Tenant | Review amendment | Tenant portal |
| Tenant | Accept/negotiate/reject | Status transitions |
| Both | Sign if agreed | signing → signed |

#### State Machine
```
draft ─→ sent ─→ tenant_reviewing ─→ negotiating ─→ agreed ─→ signing ─→ signed (terminal)
  │        │           │                  │
  │        │           └→ rejected (t)    └→ rejected (t)
  │        └→ rejected (terminal)         └→ cancelled (t)
  └→ cancelled (terminal)
```
9 states — the most complex merchant-facing state machine.

#### UX Friction (Evidence-Based)
1. **9-state negotiation flow** — most complex merchant workflow. Small landlords may find back-and-forth overwhelming.
2. No deadline/expiry on tenant review — amendment can sit indefinitely in `tenant_reviewing`
3. Counter-offer mechanism exists in schema (`tenant_counter_offer` column) but UX clarity of offer/counter-offer is unclear

#### Business Impact
Amendments handle rent increases, the primary revenue growth mechanism. Friction here = stale rents.

#### Simplification Opportunities
- Add auto-expiry timer on tenant review (e.g., 7 days)
- Simplify for common case: rent increase → streamlined 3-step flow (send → accept → sign)
- Show amendment history timeline

---

### Feature 9: Lease Renewals

#### Documentation Source
- Navigation: via Contracts (`activePatterns: ["/merchant/lease-renewals"]`, line 131)
- Page: `LeaseRenewals.tsx`
- State Machine: None
- Edge Functions: `send-renewal-alert`

#### Actual Flow (Current Only)

| Role | Action | Page / Endpoint |
|------|--------|-----------------|
| System | Detect contracts nearing end date | `send-renewal-alert` cron |
| Merchant | View renewal candidates | `/merchant/lease-renewals` |
| Merchant | Initiate renewal (creates new contract or amendment) | Action button |

#### UX Friction (Evidence-Based)
1. No explicit renewal state machine — renewal is either a new contract or an amendment, which may confuse merchants
2. Alert timing not configurable (edge function determines)

#### Business Impact
Missed renewals = vacancy = revenue loss. Proactive alerts are critical.

#### Simplification Opportunities
- Add configurable alert windows (30/60/90 days)
- One-click "renew with same terms" shortcut

---

### Feature 10: Maintenance

#### Documentation Source
- Navigation: `navigation-config.ts` line 132
- Page: `Maintenance.tsx`, `MaintenanceDetail.tsx`
- State Machine: `MAINTENANCE_STATUS_TRANSITIONS` (`state-machines.ts` lines 70-75)
- Edge Functions: None

#### Actual Flow (Current Only)

| Role | Action | Page / Endpoint |
|------|--------|-----------------|
| Tenant | Submit maintenance request | Tenant portal |
| Merchant | View request | `/merchant/maintenance` |
| Merchant | Assign vendor / accept | Status: pending → in_progress |
| Vendor | Complete work | Vendor portal |
| Merchant | Confirm completion | Status: in_progress → completed |

#### State Machine
```
pending ─→ in_progress ─→ completed (terminal)
   │            │
   └→ cancelled └→ cancelled (terminal)
```

#### UX Friction (Evidence-Based)
1. Simple 4-state machine but no priority/urgency classification in state machine (may exist in UI fields)
2. No SLA tracking built into state transitions — "stale maintenance" only tracked via dashboard alert (5-day threshold)
3. Vendor assignment is a separate action from status change — two clicks instead of one

#### Business Impact
Maintenance responsiveness directly affects tenant satisfaction and retention.

#### Simplification Opportunities
- Add urgency levels that auto-set SLA deadlines
- Combine vendor assignment with status transition to `in_progress`
- Add tenant satisfaction rating after completion

---

### Feature 11: Preventive Maintenance

#### Documentation Source
- Navigation: via Maintenance (`activePatterns: ["/merchant/preventive-maintenance"]`, line 132)
- Page: `PreventiveMaintenance.tsx`
- State Machine: None
- Edge Functions: None

#### Actual Flow (Current Only)

| Role | Action | Page / Endpoint |
|------|--------|-----------------|
| Merchant | Create preventive schedule (asset, frequency, next date) | `/merchant/preventive-maintenance` |
| System | Generate maintenance requests on schedule | TBD |

#### UX Friction (Evidence-Based)
1. No dedicated state machine — relies on general maintenance flow once request is generated
2. Schedule-to-request generation mechanism unclear (no dedicated edge function found)
   > ⚠ Ambiguous in Documentation – Cannot Conclude whether schedules auto-generate maintenance requests or require manual creation

#### Business Impact
Preventive maintenance reduces emergency repairs and extends asset life.

#### Simplification Opportunities
- Add auto-generation of maintenance requests from schedules
- Link to inventory/asset records

---

### Feature 12: Waiting List

#### Documentation Source
- Navigation: `navigation-config.ts` line 133
- Page: `WaitingList.tsx`
- State Machine: `WAITING_LIST_TRANSITIONS` (`state-machines.ts` lines 207-214)
- Edge Functions: None

#### Actual Flow (Current Only)

| Role | Action | Page / Endpoint |
|------|--------|-----------------|
| Prospective Tenant | Express interest | Public form or merchant-entered |
| Merchant | Review applicants | `/merchant/waiting-list` |
| Merchant | Offer unit to applicant | Status: applied → offered |
| Applicant | Accept/reject offer | Notification link |

#### State Machine
```
interested ─→ applied ─→ offered ─→ accepted (terminal)
                │           │
                │           └→ rejected (terminal)
                ├→ waitlisted ─→ offered
                │               └→ rejected (terminal)
                └→ rejected (terminal)
```
6 states with waitlist queue mechanism.

#### UX Friction (Evidence-Based)
1. No auto-offer when unit becomes available — merchant must manually check waiting list
2. `waitlisted` → `offered` transition requires manual merchant action per applicant
3. No priority ranking visible in list

#### Business Impact
Efficient waiting list reduces vacancy duration. Manual process = missed opportunities.

#### Simplification Opportunities
- Auto-notify merchant when unit status changes to `available` with matching waiting list entries
- Add priority scoring (date applied, screening score)

---

### Feature 13: Financial Control

#### Documentation Source
- Navigation: `navigation-config.ts` line 139
- Page: `FinancialControl.tsx`
- Service: `financialControlService.ts`
- State Machine: None
- Edge Functions: None

#### Actual Flow (Current Only)

| Role | Action | Page / Endpoint |
|------|--------|-----------------|
| Merchant | View financial overview (cash balance, receivables, payables) | `/merchant/financial-control` |
| Merchant | Review pending approvals (expenses, deposit refunds, move-outs) | Approval list |
| Merchant | Approve/reject items | Action buttons |
| Merchant | View recent transactions (payments + expenses merged) | Transaction list |

#### UX Friction (Evidence-Based)
1. Cash balance = revenue - expenses (computed client-side from 8 parallel queries, `financialControlService.ts` lines 30-56) — not a real bank balance, may confuse merchants
2. Payables combines pending expenses + pending refunds — two different approval workflows merged into one number
3. 8 parallel Supabase queries on page load — performance concern for large portfolios

#### Business Impact
Financial control is the merchant's "command center" for approvals. Confusion between computed balance vs. actual bank balance erodes trust.

#### Simplification Opportunities
- Label clearly as "Estimated Balance" not "Cash Balance"
- Separate expense approvals from deposit refund approvals visually
- Add server-side aggregation to reduce query count

---

### Feature 14: Invoices

#### Documentation Source
- Navigation: `navigation-config.ts` line 140
- Page: `Invoices.tsx`, `InvoiceDetail.tsx`
- State Machine: `INVOICE_STATUS_TRANSITIONS` (`state-machines.ts` lines 39-48)
- Edge Functions: `auto-generate-invoices`, `auto-transition-invoices`, `generate-invoice-pdf`, `xendit-create-invoice`, `queue-payment-reminders`, `send-payment-reminder`

#### Actual Flow (Current Only)

| Role | Action | Page / Endpoint |
|------|--------|-----------------|
| System | Auto-generate invoices per contract billing_day | `auto-generate-invoices` cron |
| Merchant | View/edit invoices | `/merchant/invoices` |
| Merchant | Send invoice to tenant | Status: draft → sent |
| System | Auto-transition overdue invoices | `auto-transition-invoices` cron |
| System | Escalate 15+ day overdue | Status: overdue → escalated |
| System | Queue and send payment reminders | `queue-payment-reminders`, `send-payment-reminder` |
| Tenant | Pay invoice | Xendit payment link |
| System | Webhook confirms payment | `xendit-webhook` → status: paid |

> 🧩 Assumption (Low Confidence): Auto-generation trigger mechanism assumed from function name `auto-generate-invoices`. Actual trigger (cron schedule, database trigger, or manual invocation) not verified in edge function code.

> 🧩 Assumption (Low Confidence): "15+ day overdue to escalated" threshold assumed from state machine comment `escalated: ['paid', 'cancelled'],  // collections-level overdue (15+ days)`. Actual threshold not verified in `auto-transition-invoices` edge function code.

#### State Machine
```
draft ─→ sent ─→ paid (terminal)
           │
           ├→ overdue ─→ paid (terminal)
           │     │
           │     └→ escalated ─→ paid (terminal)
           │           │
           │           └→ cancelled (terminal)
           ├→ partially_paid ─→ paid (terminal)
           │       │
           │       └→ cancelled (terminal)
           └→ cancelled (terminal)
```
7 states including `escalated` for collections-level overdue.

#### UX Friction (Evidence-Based)
1. Auto-generation + auto-transition means merchant may see invoices they didn't create — need clear "auto-generated" label
2. `escalated` status exists but link to collections module may not be obvious
3. Partial payment tracking exists but payment plan creation is a separate flow (`PAYMENT_PLAN_STATUS_TRANSITIONS`)

#### Business Impact
Invoices are the primary revenue instrument. Auto-generation reduces manual work but requires trust in the automation.

#### Simplification Opportunities
- Add "auto-generated" badge on invoices
- Deep-link escalated invoices to collections case
- Inline payment plan creation from overdue invoice

---

### Feature 15: Payments

#### Documentation Source
- Navigation: `navigation-config.ts` line 141
- Page: `Payments.tsx`, `PaymentDetail.tsx`
- State Machine: `PAYMENT_STATUS_TRANSITIONS` (lines 51-57), `PAYMENT_VERIFICATION_TRANSITIONS` (lines 247-252)
- Edge Functions: `auto-match-payment`, `auto-pay-execute`, `xendit-webhook`, `ocr-payment-proof`

#### Actual Flow (Current Only)

| Role | Action | Page / Endpoint |
|------|--------|-----------------|
| Tenant | Make payment (Xendit or bank transfer) | Payment link |
| System | Auto-match payment to invoice | `auto-match-payment` |
| System | Payment verification | `PAYMENT_VERIFICATION_TRANSITIONS`: pending → auto_matched → confirmed |
| Merchant | View payment list | `/merchant/payments` |
| Merchant | Manual verify if auto-match fails | Payment detail |

#### State Machine — Payment Status
```
pending ─→ paid (terminal)
   │
   ├→ overdue ─→ paid (terminal)
   └→ failed (terminal)
```

#### State Machine — Payment Verification
```
pending ─→ auto_matched ─→ confirmed (terminal)
   │            │
   │            └→ rejected (terminal)
   └→ confirmed (terminal)
   └→ rejected (terminal)
```

#### UX Friction (Evidence-Based)
1. Two separate state machines (payment status + verification) — merchant sees two statuses for one payment
2. Auto-match failure requires manual intervention — no guidance on how to match
3. Payment proof OCR exists (`ocr-payment-proof` edge function) — can assist auto-matching but integration flow unclear

#### Business Impact
Payment confirmation speed affects cash flow visibility. Manual verification delays = uncertain revenue status.

#### Simplification Opportunities
- Unify payment status and verification into single merchant-facing status
- Add OCR-assisted matching suggestions for manual verification
- Show expected vs. received amount clearly

---

### Feature 16: Direct Payment (Payment Transfers)

#### Documentation Source
- Service: `merchantDashboardService.ts` lines 77-81
- State Machine: `PAYMENT_TRANSFER_TRANSITIONS` (`state-machines.ts` lines 130-135)
- Edge Functions: None (admin-monitored via `/admin/payment-transfers`)

#### Actual Flow (Current Only)

| Role | Action | Page / Endpoint |
|------|--------|-----------------|
| System | Payment confirmed → create payment_transfer record | DB trigger / service |
| System | Process transfer to merchant bank account | Status: pending → processing |
| System | Transfer completed via Xendit settlement | Status: processing → completed |
| Admin | Monitor transfers | `/admin/payment-transfers` |

#### State Machine
```
pending ─→ processing ─→ completed (terminal)
              │
              └→ failed ─→ pending (retry)
```

#### UX Friction (Evidence-Based)
1. **Merchant has NO dedicated page for payment transfers** — only visible as `pendingBalance` on Dashboard
2. Transfer status (pending/processing/completed/failed) not visible to merchant — only admin sees full status
3. `balance: 0` hardcoded in dashboard — merchant doesn't understand what this means
4. Failed transfers retry automatically but merchant is not notified

#### Business Impact
This is how merchants actually receive money. Zero visibility into transfer status creates anxiety about "where is my money?"

#### Simplification Opportunities
- Add merchant-facing payment transfer history page
- Show transfer timeline: payment received → transfer initiated → completed
- Send notification on transfer completion and failure

---

### Feature 17: Expenses

#### Documentation Source
- Navigation: `navigation-config.ts` line 142
- Page: `Expenses.tsx`
- State Machine: `EXPENSE_APPROVAL_TRANSITIONS` (`state-machines.ts` lines 264-270)
- Edge Functions: `ocr-expense-receipt`

#### Actual Flow (Current Only)

| Role | Action | Page / Endpoint |
|------|--------|-----------------|
| Merchant/Staff | Submit expense (amount, category, receipt) | `/merchant/expenses` |
| System | Auto-approve if < Rp 500K | Status: submitted → approved |
| Merchant | Approve if ≥ Rp 500K | Status: pending_approval → approved |
| Merchant | Verify expense | Status: approved → verified |

#### State Machine
```
submitted ─→ pending_approval ─→ approved ─→ verified (terminal)
    │              │
    │              └→ rejected ─→ submitted (re-submit)
    └→ approved (auto, < 500K)
```

#### UX Friction (Evidence-Based)
1. Auto-approve threshold (Rp 500K) not visible to user — staff don't know which expenses need owner approval
2. `verified` as final state adds an extra step beyond `approved` — may feel bureaucratic for small operations
3. Receipt OCR exists (`ocr-expense-receipt`) — can auto-extract receipt data but linkage to expense creation flow unclear

#### Business Impact
Expense tracking accuracy affects P&L reporting and tax compliance.

#### Simplification Opportunities
- Show auto-approve threshold in expense form
- Make `verified` optional for non-premium tiers
- Auto-extract receipt data via OCR into expense form

---

### Feature 18: Financial Reports

#### Documentation Source
- Navigation: `navigation-config.ts` line 143
- Page: `FinancialReports.tsx`
- State Machine: None
- Edge Functions: None

#### Actual Flow (Current Only)

| Role | Action | Page / Endpoint |
|------|--------|-----------------|
| Merchant | View financial summaries (revenue, expenses, P&L) | `/merchant/financial-reports` |
| Merchant | Filter by date range, property | Filter controls |
| Merchant | Export report | Export button |

#### UX Friction (Evidence-Based)
1. Client-side computation from multiple tables — large portfolios may timeout
2. No scheduled/automated report delivery

#### Business Impact
Financial reports are needed for tax, investor, and compliance purposes.

#### Simplification Opportunities
- Add server-side report generation for large datasets
- Scheduled monthly report email

---

### Feature 19: Collections

#### Documentation Source
- Navigation: `navigation-config.ts` line 153 (Lainnya group)
- Page: `Collections.tsx`
- State Machine: `COLLECTIONS_CASE_TRANSITIONS` (`state-machines.ts` lines 196-204)
- Edge Functions: `check-overdue-escalation`, `dss-collection-strategy`, `queue-payment-reminders`, `send-payment-reminder`

#### Actual Flow (Current Only)

| Role | Action | Page / Endpoint |
|------|--------|-----------------|
| System | Auto-create case when invoice escalated | `check-overdue-escalation` cron |
| Merchant | View collection cases | `/merchant/collections` |
| Merchant | Send reminder/follow-up | Interaction log |
| System | Queue and send payment reminders | `queue-payment-reminders`, `send-payment-reminder` |
| Merchant | Escalate to legal if needed | Status: escalated → legal |
| Merchant | Resolve case | Status: → resolved (with resolution_type) |

#### State Machine
```
initiated ─→ reminder_sent ─→ follow_up ─→ in_progress ─→ escalated ─→ legal ─→ resolved (terminal)
                │                              │              │
                └→ in_progress                 └→ resolved    └→ resolved
```
7 states with structured escalation. Resolution types: `paid_in_full`, `payment_plan`, `write_off`, `eviction`, `bad_debt`.

#### UX Friction (Evidence-Based)
1. **Most complex operational flow** — 7 states with non-linear transitions
2. Hidden in "Lainnya" group — late payment is high-priority but low-visibility in nav
3. DSS collection strategy exists but recommendation → action linkage unclear
4. Staff permission `collections.send_letter` exists but integration with interaction log unclear

#### Business Impact
Collections directly recover revenue. Delayed escalation = higher bad debt rate.

#### Simplification Opportunities
- Promote collections to main "Keuangan" group when active cases exist (dynamic nav)
- Add guided escalation wizard with DSS recommendations inline
- Auto-schedule follow-ups based on DSS strategy

---

### Feature 20: Reconciliation

#### Documentation Source
- Navigation: `navigation-config.ts` line 154
- Page: `Reconciliation.tsx`
- State Machine: None
- Edge Functions: None

#### Actual Flow (Current Only)

| Role | Action | Page / Endpoint |
|------|--------|-----------------|
| Merchant | View payment vs. invoice matching | `/merchant/reconciliation` |
| Merchant | Resolve mismatches | Action buttons |

#### UX Friction (Evidence-Based)
1. Manual reconciliation UI — no auto-suggestions for common mismatches
2. Overlaps with payment verification (`PAYMENT_VERIFICATION_TRANSITIONS`) — unclear when to use which

#### Business Impact
Reconciliation ensures accurate financial records. Errors compound over time.

#### Simplification Opportunities
- Auto-suggest matches based on amount + date proximity
- Clarify distinction from payment verification

---

### Feature 21: Utility Billing

#### Documentation Source
- Navigation: `navigation-config.ts` line 152
- Page: `UtilityBilling.tsx`
- State Machine: None
- Edge Functions: None

#### Actual Flow (Current Only)

| Role | Action | Page / Endpoint |
|------|--------|-----------------|
| Merchant | Record utility meter readings | `/merchant/utility-billing` |
| Merchant | Generate utility charges | Calculation form |
| System | Add charges to next invoice | Invoice line items |

#### UX Friction (Evidence-Based)
1. No state machine — manual process from reading to invoice
2. No photo/OCR for meter reading capture (OCR functions exist but not linked)

#### Business Impact
Utility billing is a common additional revenue source and tenant responsibility.

#### Simplification Opportunities
- Add OCR meter reading capture
- Auto-generate utility invoices on schedule

---

### Feature 22: Dynamic Pricing

#### Documentation Source
- Navigation: `navigation-config.ts` line 155
- Page: `DynamicPricing.tsx`
- State Machine: None
- Edge Functions: `ml-optimal-pricing`, `dss-pricing-advisor`

#### Actual Flow (Current Only)

| Role | Action | Page / Endpoint |
|------|--------|-----------------|
| Merchant | View pricing rules | `/merchant/dynamic-pricing` |
| Merchant | Create rules (conditions, adjustment type, min/max) | Rule form |
| System | ML suggests optimal pricing | `ml-optimal-pricing` |
| System | DSS advises on strategy | `dss-pricing-advisor` |

#### UX Friction (Evidence-Based)
1. Complex rule configuration (conditions JSON, adjustment types) — advanced feature for sophisticated users
2. ML suggestions may conflict with manual rules — no conflict detection
3. No A/B testing capability for pricing strategies

#### Business Impact
Pricing optimization directly affects revenue per unit.

#### Simplification Opportunities
- Add pre-built rule templates (seasonal, occupancy-based)
- Show ML recommendation alongside current pricing with diff view

---

### Feature 23: Move-Outs

#### Documentation Source
- Navigation: via Tenants (`activePatterns: ["/merchant/move-outs"]`, line 130)
- Page: `MoveOuts.tsx`, `MoveOutDetail.tsx`
- State Machine: 4 sub-machines:
  - `MOVE_OUT_NOTICE_TRANSITIONS` (lines 87-93)
  - `MOVE_OUT_INSPECTION_TRANSITIONS` (lines 96-100)
  - `EARLY_TERMINATION_TRANSITIONS` (lines 103-108)
  - `DEPOSIT_REFUND_TRANSITIONS` (lines 181-187)
- Edge Functions: `process-deposit-refund`

#### Actual Flow (Current Only)

| Role | Action | Page / Endpoint |
|------|--------|-----------------|
| Tenant | Submit move-out notice | Tenant portal |
| Merchant | Acknowledge notice | Status: submitted → acknowledged |
| Merchant | Approve move-out | Status: acknowledged → approved |
| Merchant | Schedule inspection | Inspection: scheduled |
| Merchant | Conduct inspection | Inspection: in_progress → completed |
| Merchant | Process deposit refund (deductions, bank details) | Refund form |
| System | Execute refund via Xendit | `process-deposit-refund` |

#### State Machines (4 sub-machines)

**Move-Out Notice:**
```
submitted ─→ acknowledged ─→ approved ─→ completed (terminal)
   │
   └→ rejected (terminal)
```

**Move-Out Inspection:**
```
scheduled ─→ in_progress ─→ completed (terminal)
```

**Early Termination:**
```
pending_approval ─→ approved (terminal)
       │
       ├→ denied (terminal)
       └→ counter_offered ─→ approved (terminal)
                    │
                    └→ denied (terminal)
```

**Deposit Refund:**
```
pending_processing ─→ approved ─→ processing ─→ completed (terminal)
         │
         └→ rejected (terminal)
```

#### UX Friction (Evidence-Based)
1. **4 parallel sub-machines** for one move-out event — the most complex merchant workflow by state count
2. Merchant must coordinate: notice approval → inspection → refund calculation → refund execution — all sequential with no skip
3. Early termination has counter-offer but no negotiation timeline
4. Deposit refund requires manual bank detail entry from tenant — no pre-filled from contract

#### Business Impact
Move-out process quality affects tenant satisfaction (for referrals), deposit refund timeliness (legal compliance), and unit turnaround speed.

#### Simplification Opportunities
- Unified move-out wizard that progresses through all 4 sub-machines sequentially
- Pre-fill tenant bank details from contract/profile
- Auto-schedule inspection on approval
- Show move-out checklist with progress indicator

---

### Feature 24: Inventory

#### Documentation Source
- Navigation: `navigation-config.ts` line 149
- Page: `Inventory.tsx`
- State Machine: None
- Edge Functions: `ocr-asset-label`

#### Actual Flow (Current Only)

| Role | Action | Page / Endpoint |
|------|--------|-----------------|
| Merchant | View asset inventory (by property/unit) | `/merchant/inventory` |
| Merchant | Add/edit assets (facility type, brand, condition, purchase info) | Asset form |
| Merchant | Track depreciation (useful_life_months, salvage_value) | Asset detail |

#### UX Friction (Evidence-Based)
1. OCR-based asset registration possible via `ocr-asset-label` but integration to inventory form unclear
2. Depreciation calculation exists in schema but display unclear
3. No linkage to maintenance — damaged asset doesn't auto-create maintenance request

#### Business Impact
Asset tracking affects insurance claims, tax depreciation, and maintenance planning.

#### Simplification Opportunities
- Link asset condition changes to maintenance requests
- Add OCR-based asset registration
- Show depreciation schedule visually

---

### Feature 25: Guardians (On-Site Staff)

#### Documentation Source
- Navigation: `navigation-config.ts` line 150
- Page: `Guardians.tsx`
- State Machine: None
- Edge Functions: None

#### Actual Flow (Current Only)

| Role | Action | Page / Endpoint |
|------|--------|-----------------|
| Merchant | View property guardians/caretakers | `/merchant/guardians` |
| Merchant | Assign guardian to property | Assignment form |

#### UX Friction (Evidence-Based)
1. Separate from Staff Management — potential confusion about where to manage on-site staff
2. No shift scheduling or attendance tracking

#### Business Impact
On-site staff are the merchant's eyes on the ground. Assignment tracking is essential for multi-property operations.

#### Simplification Opportunities
- Merge with Staff Management or add clear cross-link
- Add basic shift/schedule tracking

---

### Feature 26: Vendor Performance

#### Documentation Source
- Navigation: `navigation-config.ts` line 151
- Page: `VendorPerformance.tsx`
- State Machine: None
- Edge Functions: None

#### Actual Flow (Current Only)

| Role | Action | Page / Endpoint |
|------|--------|-----------------|
| Merchant | View vendor ratings and job history | `/merchant/vendor-performance` |
| Merchant | Rate vendor after job completion | Rating form |

#### UX Friction (Evidence-Based)
1. Read-only view — merchant cannot manage vendors directly (vendor has own portal)
2. No vendor comparison tool for same service category

#### Business Impact
Vendor quality directly affects maintenance satisfaction and cost.

#### Simplification Opportunities
- Add vendor comparison within service category
- Link to maintenance history per vendor

---

### Feature 27: Reports

#### Documentation Source
- Navigation: `navigation-config.ts` line 156
- Page: `Reports.tsx`, `ReportTemplates.tsx`
- State Machine: None
- Edge Functions: `data-export`

#### Actual Flow (Current Only)

| Role | Action | Page / Endpoint |
|------|--------|-----------------|
| Merchant | View pre-built reports | `/merchant/reports` |
| Merchant | Create custom report templates | `/merchant/report-templates` |
| Merchant | Export data | `data-export` edge function |

#### UX Friction (Evidence-Based)
1. Separate from Financial Reports (`/merchant/financial-reports`) — two report pages with unclear distinction
2. Report templates are powerful but complex for basic users

#### Business Impact
Reporting supports decision-making, tax compliance, and investor communication.

#### Simplification Opportunities
- Merge with Financial Reports or add clear distinction labels
- Add "Quick Reports" presets (monthly summary, tax report, occupancy report)

---

### Feature 28: Document Templates

#### Documentation Source
- Navigation: `navigation-config.ts` line 157
- Page: `DocumentTemplates.tsx`
- State Machine: None
- Edge Functions: None

#### Actual Flow (Current Only)

| Role | Action | Page / Endpoint |
|------|--------|-----------------|
| Merchant | View/create document templates | `/merchant/document-templates` |
| Merchant | Use template variables for contracts, letters, etc. | Template editor |

#### UX Friction (Evidence-Based)
1. Template variable system requires understanding of available variables
2. No preview with actual data before sending

#### Business Impact
Templates standardize communication and reduce manual document creation.

#### Simplification Opportunities
- Add live preview with sample data
- Pre-built templates for common documents (surat kontrak, surat peringatan, kwitansi)

---

### Feature 29: InsightsHub (AI/ML Analytics)

#### Documentation Source
- Navigation: `navigation-config.ts` line 158
- Page: `InsightsHub.tsx` + 9 sub-pages:
  - `AnalyticsDashboard.tsx`, `ComparativePortfolio.tsx`, `MlAnalytics.tsx`
  - `DssAdvisor.tsx`, `MarketIntelligence.tsx`, `FinancialRiskAnalytics.tsx`
  - `TenantQualityScoring.tsx`, `DataQualityHistory.tsx`, `DocumentCenter.tsx`
- State Machine: `DSS_RECOMMENDATION_TRANSITIONS` (`state-machines.ts` lines 272-278)
- Edge Functions: `ml-churn-prediction`, `ml-financial-analytics`, `ml-occupancy-forecast`, `ml-optimal-pricing`, `ml-price-intelligence`, `ml-revenue-forecast`, `ml-risk-assessment`, `ml-tenant-quality-scoring`, `ml-tenant-risk-score`, `ml-data-quality-check`, `ml-ocr-correction-suggest`, `dss-collection-strategy`, `dss-investment-insight`, `dss-maintenance-priority`, `dss-pricing-advisor`

#### Actual Flow (Current Only)

| Role | Action | Page / Endpoint |
|------|--------|-----------------|
| Merchant | View InsightsHub card grid | `/merchant/insights` |
| Merchant | Navigate to specific analytics page | Sub-page links |
| System | ML models generate predictions/scores | `ml-*` edge functions |
| System | DSS generates recommendations | `dss-*` edge functions |
| Merchant | Accept/reject DSS recommendations | Recommendation cards |

#### State Machine — DSS Recommendations
```
generated ─→ viewed ─→ accepted ─→ measured (terminal)
   │            │
   │            └→ rejected (terminal)
   └→ accepted
   └→ rejected (terminal)
```

#### UX Friction (Evidence-Based)
1. **9 sub-pages** behind a single nav item — information overload for non-analytical users
2. ML model results depend on data volume — new merchants get low-quality predictions
3. DSS recommendations lack clear ROI projections
4. `measured` state exists but measurement criteria not clear to merchant
5. Hidden in "Lainnya" group — advanced analytics buried

#### Business Impact
AI/ML features are a key differentiator but only valuable for merchants with sufficient data history.

#### Simplification Opportunities
- Show data sufficiency indicator per ML feature
- Surface top 3 actionable recommendations on Dashboard
- Gate advanced analytics behind subscription tier
- Add "minimum data required" notice for each ML model

---

### Feature 30: Staff Management

#### Documentation Source
- Navigation: `navigation-config.ts` line 160
- Page: `StaffManagement.tsx`
- Permissions: `permissions.ts` — 16 permissions, 3 roles, 4 groups
- State Machine: None
- Edge Functions: None

#### Actual Flow (Current Only)

| Role | Action | Page / Endpoint |
|------|--------|-----------------|
| Merchant | View staff list | `/merchant/staff` |
| Merchant | Add staff member (email, role, property assignment) | Staff form |
| Merchant | Assign permissions | Permission checkboxes |

#### Staff Roles & Default Permissions
| Role | Default Permissions |
|------|-------------------|
| Caretaker | units.view, units.edit_status, maintenance.view, maintenance.accept, maintenance.log_activity, tenants.view (6) |
| Property Manager | All of caretaker + maintenance.assign_vendor, expenses.*, invoices.*, collections.send_letter, financial_reports.view, contracts.view (14) |
| Accountant | expenses.view, invoices.view, financial_reports.view, contracts.view (4) |

#### UX Friction (Evidence-Based)
1. 16 individual permissions across 4 groups — granular but overwhelming for small operations
2. Default permissions help but customization requires understanding each permission
3. No activity log per staff member — merchant can't audit staff actions
4. Hidden in "Lainnya" group — staff management is important for multi-property operations

#### Business Impact
Delegation is critical for scaling operations. Permission errors = data exposure or operational blockage.

#### Simplification Opportunities
- Add role-only mode (hide individual permissions) for simple operations
- Add staff activity log
- Show which pages/features each role can access in human-readable format

---

### Feature 31: API & Integration

#### Documentation Source
- Navigation: `navigation-config.ts` line 159
- Page: `ApiIntegration.tsx`
- State Machine: None
- Edge Functions: `merchant-api`, `webhook-dispatcher`

#### Actual Flow (Current Only)

| Role | Action | Page / Endpoint |
|------|--------|-----------------|
| Merchant | View API keys | `/merchant/api-integration` |
| Merchant | Generate new API key (name, scopes, rate limit) | API key form |
| Merchant | View API documentation | Documentation section |

#### UX Friction (Evidence-Based)
1. Advanced feature for technical users — most small landlords won't use this
2. Scopes configuration requires understanding of available API endpoints
3. `webhook-dispatcher` edge function exists but no webhook configuration UI found on this page

#### Business Impact
API enables property management system integration — important for enterprise merchants.

#### Simplification Opportunities
- Gate behind premium subscription tier
- Add pre-built integration templates (Google Sheets sync, accounting software)
- Add webhook configuration UI

---

### Feature 32: Tenant Analytics

#### Documentation Source
- Navigation: via Tenants (`activePatterns: ["/merchant/tenant-analytics"]`, line 130)
- Page: `TenantAnalytics.tsx`
- State Machine: None
- Edge Functions: `compute-tenant-payment-metrics`

#### Actual Flow (Current Only)

| Role | Action | Page / Endpoint |
|------|--------|-----------------|
| Merchant | View tenant payment behavior analytics | `/merchant/tenant-analytics` |
| Merchant | See payment reliability scores | Score cards |

#### UX Friction (Evidence-Based)
1. Separate from tenant list — requires navigation to see analytics
2. Computed metrics may be stale (cron-based)

#### Business Impact
Tenant analytics informs renewal decisions and risk management.

#### Simplification Opportunities
- Show key metrics inline on tenant list/detail pages
- Real-time computation for small portfolios

---

### Feature 33: Billing / Subscription

#### Documentation Source
- Page: `src/pages/merchant/Billing.tsx`
- Components: `BillingDashboard`, `DisbursementScheduleSettings`
- State Machine: `SUBSCRIPTION_STATUS_TRANSITIONS` (`state-machines.ts` lines 78-84)
- Edge Functions: `subscription-billing`, `subscription-grace-check`, `subscription-payment`, `subscription-renewal`
- Navigation: Not in sidebar; accessed via Support page links or direct URL `/merchant/billing`

#### Actual Flow (Current Only)

| Role | Action | Page / Endpoint |
|------|--------|-----------------|
| Merchant | View subscription status and plan details | `/merchant/billing` → `BillingDashboard` |
| Merchant | View/change disbursement schedule settings | `/merchant/billing` → `DisbursementScheduleSettings` |
| System | Process subscription billing cycle | `subscription-billing` cron |
| System | Check grace period for past-due subscriptions | `subscription-grace-check` cron |
| System | Process subscription payment | `subscription-payment` |
| System | Handle subscription renewal | `subscription-renewal` |

#### State Machine
```
trialing ─→ active ─→ past_due ─→ active (retry success)
   │           │          │
   │           │          └→ suspended ─→ active (reactivate)
   │           │                  │
   │           │                  └→ cancelled (terminal)
   │           └→ cancelled (terminal)
   └→ cancelled (terminal)
```
5 states. `trialing` → `active` on first payment. `past_due` allows retry. `suspended` requires manual reactivation.

#### UX Friction (Evidence-Based)
1. **Not in sidebar navigation** — merchant must discover via Support page links or Settings
2. `SuspensionWarningBanner` component exists (imported in `Billing.tsx`) but merchant may not understand the grace period timeline
3. Disbursement settings on same page as subscription billing — two unrelated concerns
4. No upgrade/downgrade comparison view showing feature differences between tiers

#### Business Impact
Subscription is the platform's revenue model. Difficulty finding billing page = delayed upgrades and missed renewals.

#### Simplification Opportunities
- Add billing link to sidebar (at least in "Lainnya" group)
- Separate subscription management from disbursement settings
- Add tier comparison table with current plan highlighted
- Show grace period countdown when past_due

---

### Feature 34: Profile

#### Documentation Source
- Navigation: `navigation-config.ts` line 169 (bottomNav only)
- Page: `src/pages/merchant/Profile.tsx` (456 lines)
- State Machine: `MERCHANT_VERIFICATION_TRANSITIONS` (lines 159-164), `VERIFICATION_TIER_TRANSITIONS` (lines 146-150)
- Edge Functions: `ocr-ktp-extract`, `ocr-business-document` (for document upload verification)

#### Actual Flow (Current Only)

| Role | Action | Page / Endpoint |
|------|--------|-----------------|
| Merchant | View/edit business profile (name, type, address) | `/merchant/profile` → Business tab |
| Merchant | View/edit contact info (name, phone, email) | `/merchant/profile` → Business tab |
| Merchant | Copy merchant code (for tenant sharing) | Merchant code card |
| Merchant | Upload verification documents (KTP, NPWP, SIUP, etc.) | `/merchant/profile` → Verification tab |
| Merchant | View verification status per document | Verification document list |
| Merchant | Change password | `/merchant/profile` → Security tab |

Profile page has 3 tabs: **Bisnis** (business info + contact), **Verifikasi** (document uploads + tier display), **Keamanan** (password change).

#### State Machine — Merchant Verification
```
pending ─→ verified ─→ suspended
   │                      │
   └→ rejected ─→ pending └→ verified
```
Note: Verification approval/rejection is admin-triggered. Merchant can only upload documents and view status.

#### State Machine — Verification Tier
```
quick ─→ standard ─→ premium (terminal)
```
Tier progression based on document completeness and admin approval.

#### UX Friction (Evidence-Based)
1. **Not in sidebar** — only accessible via bottomNav (mobile) or direct URL. Desktop users may not find it easily.
2. Verification document types are hardcoded in frontend (6 types: KTP, NPWP, surat_kepemilikan, SIUP, akta_perusahaan, proof_of_address) — no guidance on which documents are required for each tier
3. Merchant code sharing relies on manual copy — no QR code or share link
4. Password change verifies current password first (good security) but error messages may be unclear
5. Address update creates/updates `addresses` table record with upsert logic — potential confusion if merchant has multiple addresses

#### Business Impact
Profile completeness affects verification tier, which affects merchant credibility and potentially feature access.

#### Simplification Opportunities
- Add to sidebar navigation or make Profile accessible from header avatar
- Add required document checklist per verification tier
- Add QR code for merchant code sharing
- Show verification progress bar (documents uploaded vs. required)

---

### Feature 35: Alerts / Notifications

#### Documentation Source
- Navigation: `navigation-config.ts` line 168 (bottomNav only)
- Page: `src/pages/merchant/Alerts.tsx` (202 lines)
- State Machine: None
- Edge Functions: `send-notification`, `whatsapp-notification`

#### Actual Flow (Current Only)

| Role | Action | Page / Endpoint |
|------|--------|-----------------|
| Merchant | View aggregated alerts from multiple sources | `/merchant/alerts` |
| Merchant | Click alert to navigate to relevant page | Alert card → deep link |

Alert types (computed from live queries, not stored):
1. **Overdue invoices** — queries `invoices` where status in `['overdue', 'escalated']`, limit 20
2. **Pending expense approvals** — queries `expenses` where `approval_status = 'pending_approval'`, limit 10
3. **Urgent maintenance** — queries `maintenance_requests` where priority in `['urgent', 'high']` and status in `['pending', 'in_progress']`, limit 10
4. **Expiring contracts** — queries `contracts` where `status = 'active'` and `end_date` within 30 days, limit 10
5. **Overdue preventive maintenance** — queries `preventive_maintenance_schedules` where `next_scheduled_date < today`, limit 10

Alerts are sorted by severity (high → medium → low).

#### UX Friction (Evidence-Based)
1. **Not in sidebar** — only accessible via bottomNav (mobile). Desktop users have no sidebar link.
2. Alerts are computed on-page-load via 5 separate queries — not push notifications
3. No notification history — alerts disappear once the underlying issue is resolved
4. No notification preferences on this page (preferences are in Settings)
5. `staleTime: 60_000` (60 seconds) — alerts may be stale for up to 1 minute

#### Business Impact
Alerts are the merchant's early warning system. Missing them = delayed action on overdue payments, expired contracts, and stale maintenance.

#### Simplification Opportunities
- Add to sidebar (at least as a badge count on Dashboard)
- Implement push notifications for high-severity alerts
- Add notification history/log
- Cross-link to Settings for notification preferences

---

### Feature 36: Dispute Resolution

#### Documentation Source
- Page: `src/pages/merchant/DisputeResolution.tsx` (198 lines)
- Navigation: `navigation-config.ts` line 154 (label: "Resolusi & Rekonsiliasi") — same nav item as Reconciliation
- State Machine: `DISPUTE_STATUS_TRANSITIONS` (`state-machines.ts` lines 173-178)
- Edge Functions: None

#### Actual Flow (Current Only)

| Role | Action | Page / Endpoint |
|------|--------|-----------------|
| Merchant | View combined dashboard (reconciliation + complaints + disputes) | `/merchant/reconciliation` |
| Merchant | Review unmatched payments and manually match | Reconciliation tab |
| Merchant | View tenant complaints (support tickets) | Complaints tab |
| Merchant | View disputes | Disputes tab |

The `DisputeResolution.tsx` page combines 3 concerns:
1. **Reconciliation** — unmatched payments, manual matching, match history, reports
2. **Tenant Complaints** — queries `support_tickets` table
3. **Disputes** — queries `disputes` table

#### State Machine — Disputes
```
open ─→ in_progress ─→ resolved (terminal)
                  │
                  └→ closed (terminal)
```
Note: Dispute mediation/resolution is admin-triggered. Merchant can view disputes but cannot change status.

#### UX Friction (Evidence-Based)
1. **Three unrelated concerns on one page** — reconciliation, complaints, and disputes are distinct workflows combined for convenience
2. Merchant can view disputes but has no action buttons — dispute resolution is admin-only
3. Support ticket data relies on `support_tickets` table which may not exist in all environments (cast to `any`)
4. KPI cards show combined "Total Pending" across all 3 types — may inflate perceived urgency

#### Business Impact
Dispute resolution affects tenant retention and legal compliance. Combining with reconciliation reduces page count but may confuse merchants about where to handle each type.

#### Simplification Opportunities
- Separate disputes from reconciliation if dispute volume is significant
- Add merchant response capability for disputes (currently view-only)
- Link complaints to relevant contracts/tenants for context

---

### Feature 37: Property Compliance

#### Documentation Source
- Page: `src/pages/merchant/PropertyCompliance.tsx` (773 lines)
- Navigation: Accessed via PropertyDetail tab (not in sidebar)
- State Machine: None
- Edge Functions: `ocr-compliance-document`

#### Actual Flow (Current Only)

| Role | Action | Page / Endpoint |
|------|--------|-----------------|
| Merchant | Select property from dropdown | `/merchant/property-compliance` or PropertyDetail tab |
| Merchant | View/edit disaster risk profile (flood, earthquake, landslide, fire) | Risk tab |
| Merchant | Manage insurance policies (create, upload documents, file claims) | Insurance tab |
| Merchant | Manage compliance documents (upload, track expiry) | Documents tab |
| Merchant | Track security incidents | Security tab |
| System | Auto-calculate risk score from risk levels | Client-side weighted formula |

4 tabs: **Risiko Bencana** (disaster risk), **Asuransi** (insurance), **Dokumen** (compliance documents), **Keamanan** (security incidents)

KPIs: Risk score (/100), active policies, expired docs, open incidents.

#### UX Friction (Evidence-Based)
1. **773 lines in a single page file** — the most complex single page in the merchant portal. Contains 5+ sub-components inline.
2. Not in sidebar — only accessible via PropertyDetail tab. Merchants may not discover compliance management exists.
3. Risk score auto-calculated client-side with hardcoded weights (risk_zone: 0.30, flood: 0.25, earthquake: 0.20, landslide: 0.15, fire: 0.10) — not configurable
4. Insurance claim workflow exists but claim status tracking is basic (submitted → reviewing → approved/rejected → paid)
5. OCR compliance document extraction available but integration flow from camera to form unclear
6. Insurance renewal alerts implemented with urgency levels (critical/warning/info) — good proactive UX

#### Business Impact
Compliance is legally required for property operations. Missing document expiry tracking = legal liability.

#### Simplification Opportunities
- Add to sidebar or surface compliance alerts on Dashboard
- Break 773-line page into separate sub-components
- Add compliance checklist per property type (kos vs. apartment)
- Auto-notify on document expiry approaching

---

### Feature 38: Account & Support Utilities

#### Documentation Source
- Pages: `Settings.tsx`, `Support.tsx`, `Feedback.tsx`, `OcrTutorial.tsx`
- Navigation: Not in sidebar. Linked from Support page sidebar and bottomNav Profile.
- State Machine: None
- Edge Functions: `merchant-ai-assistant`

#### Grouped Features

**Settings** (`Settings.tsx`):
- 3 tabs: Notifikasi, Perbankan, Pencairan
- Notification preferences via `MerchantNotificationSettings`
- Bank account management via `BankAccountManager`
- Disbursement schedule settings via `DisbursementScheduleSettings`
- Query param support (`?tab=notifications`)

**Support** (`Support.tsx`):
- FAQ accordion with 5 categories (Properti, Kontrak, Pembayaran, Maintenance, Keamanan)
- AI Assistant CTA (dispatches `open-chatbot` custom event)
- Useful links sidebar (Settings, Billing, Profile, Feedback)
- System status display (API, Database, Payment Gateway)

**Feedback** (`Feedback.tsx`):
- Feedback form: category, star rating, message, screenshot upload
- Submits to `merchant_feedback` table
- Feedback history with status tracking (pending → reviewed → resolved)
- Admin response display

**OCR Tutorial** (`OcrTutorial.tsx`):
- 4-step tutorial: choose document type → upload → AI processes → review & confirm
- 4 OCR types: KTP, bukti transfer, dokumen bisnis, nota pemeliharaan
- Describes available `ocr-*` edge functions in user-friendly format

#### UX Friction (Evidence-Based)
1. **None of these 4 pages are in sidebar** — all require discovery via Support links or direct URL
2. Settings has disbursement settings that also appear on Billing page — duplication
3. Support page AI assistant trigger uses custom DOM event (`open-chatbot`) — may fail if chatbot component not loaded
4. Feedback table (`merchant_feedback`) uses `supabase as any` cast — table may not be in TypeScript types

#### Business Impact
Support utilities affect merchant self-service capability and satisfaction. Hidden pages = more direct support requests.

#### Simplification Opportunities
- Add Settings to sidebar
- Remove disbursement settings duplication (keep in one place)
- Make OCR tutorial discoverable from relevant pages (e.g., expense form, verification upload)

---

## Section 3: End-to-End Merchant Journeys

### A. Onboarding Journey (Current System)

```
1. Register (email/password)
2. ensure-user-bootstrap creates: profiles, user_roles, merchants, merchant_subscriptions (free tier)
   ⚠ NO escrow_accounts created
3. Complete profile (business_name, business_type, address)
4. ⏸ BLOCKING: Admin verification (pending → verified)
   Verification tiers: quick → standard → premium
5. Create first property
6. Create units within property
7. Invite tenant (email)
8. ⏸ BLOCKING: Tenant accepts invitation (pending → accepted)
9. Create contract (unit + tenant + terms)
10. ⏸ BLOCKING: Both parties sign (pending → fully_signed)
11. System auto-generates first invoice
12. ⏸ BLOCKING: Tenant pays first invoice
13. Payment confirmed → payment_transfer created (Direct Payment Model)
```

**Time to First Value**: 4 blocking steps (admin verification, tenant acceptance, dual signature, tenant payment).

**Estimated minimum**: 3-7 days assuming responsive participants.

### B. Daily Operational Journey

```
Morning:
1. Dashboard → Review KPIs (occupancy, revenue, alerts)
2. Check overdue invoices alert → Navigate to Invoices
3. Check stale maintenance alert → Navigate to Maintenance

Mid-day:
4. Review pending expense approvals → Financial Control
5. Process maintenance requests → Assign vendors
6. Check payment status → Payments page

Weekly:
7. Review collections cases (if any)
8. Check lease renewal alerts
9. Review financial reports

Monthly:
10. Generate/review financial reports
11. Check occupancy trends
12. Review ML/DSS recommendations (if sufficient data)
```

### C. Critical Scenarios

#### C1. Late Payment Scenario
```
Invoice overdue (auto-transition) →
  System creates collections case (initiated) →
    Merchant sends reminder (reminder_sent) →
      System queues payment reminders (queue-payment-reminders, send-payment-reminder) →
        Follow-up (follow_up) →
          Active handling (in_progress) →
            Escalation (escalated) →
              Legal action (legal) →
                Resolution (resolved)
Resolution types: paid_in_full, payment_plan, write_off, eviction, bad_debt
```
**State Machine**: `COLLECTIONS_CASE_TRANSITIONS` (7 states)

#### C2. Move-Out Scenario
```
Tenant submits notice →
  Merchant acknowledges (submitted → acknowledged) →
    Merchant approves (acknowledged → approved) →
      Schedule inspection (scheduled) →
        Conduct inspection (in_progress → completed) →
          Calculate deposit refund (deductions) →
            Process refund (pending_processing → approved → processing → completed)
```
**State Machines**: 4 sub-machines (notice: 5 states, inspection: 3 states, early termination: 4 states, deposit refund: 5 states)

#### C3. Vacancy Scenario
```
Contract completed/terminated →
  Unit status → available →
    Check waiting list →
      Offer to waitlisted applicant (waitlisted → offered) →
        Applicant accepts (offered → accepted) →
          Create new contract → [Onboarding from step 9]
```
**State Machine**: `WAITING_LIST_TRANSITIONS` (6 states)

#### C4. Tenant Complaint / Maintenance
```
Tenant submits request →
  Merchant views (pending) →
    Assigns vendor / starts work (in_progress) →
      Work completed (completed)
```
**State Machine**: `MAINTENANCE_STATUS_TRANSITIONS` (4 states)

#### C5. Expansion (New Property)
```
Add property → Add units → Set pricing (optional: dynamic pricing rules) →
  Invite tenants → Create contracts → [Revenue generation begins]
```
No dedicated state machine — operational workflow.

#### C6. Subscription Lifecycle
```
Register → free tier (trialing) →
  First payment → active →
    Missed payment → past_due →
      Grace period check (subscription-grace-check) →
        Payment retry (subscription-payment) →
          Success → active / Failure → suspended →
            Manual reactivation or → cancelled (terminal)
```
**State Machine**: `SUBSCRIPTION_STATUS_TRANSITIONS` (5 states)

---

## Section 4: UX Risk Map

| Severity | Feature | Risk | Target User Match |
|----------|---------|------|-------------------|
| 🔴 Critical | Payment Transfers (F16) | Zero merchant visibility into how they get paid | All merchants |
| 🔴 Critical | Move-Outs (F23) | 4 parallel state machines, 17 total states | Small landlords |
| 🟠 High | Contract Amendments (F8) | 9-state negotiation, no expiry | All merchants |
| 🟠 High | Collections (F19) | 7-state escalation, hidden in Lainnya | All merchants with overdue |
| 🟠 High | Financial Control (F13) | Computed balance ≠ real balance confusion | All merchants |
| 🟠 High | Billing/Subscription (F33) | Not in sidebar, hard to discover | All merchants |
| 🟡 Medium | Dashboard (F1) | 10 parallel queries, confusing balance KPI | All merchants |
| 🟡 Medium | Contracts (F7) | Complex form, unclear signature status | New merchants |
| 🟡 Medium | Staff Management (F30) | 16 permissions overwhelming | Multi-property |
| 🟡 Medium | InsightsHub (F29) | 9 sub-pages, data sufficiency issues | Data-rich merchants |
| 🟡 Medium | Alerts (F35) | Not in sidebar, computed not pushed | All merchants |
| 🟡 Medium | Profile (F34) | Not in sidebar, verification tier unclear | New merchants |
| 🟡 Medium | Property Compliance (F37) | 773-line monolith, hidden in tab | Regulated properties |
| 🟢 Low | Properties (F2) | Straightforward CRUD | All |
| 🟢 Low | Tenants (F5) | Clear invitation flow | All |
| 🟢 Low | Invoices (F14) | Well-automated with crons | All |
| 🟢 Low | Support (F38) | Clear FAQ + AI assistant | All |

---

## Section 5: Scalability UX Check

### Navigation Structure (24 Sidebar Items + 5 BottomNav)

| Group | Items | Count |
|-------|-------|-------|
| Utama | Dashboard, Properti, Papan Okupansi | 3 |
| Operasional | Penyewa, Kontrak, Maintenance, Daftar Tunggu | 4 |
| Keuangan | Kontrol Keuangan, Tagihan, Pembayaran, Pengeluaran, Lap. Keuangan | 5 |
| Lainnya (collapsible) | Inventori, Penjaga, Performa Vendor, Utilitas, Penagihan, Resolusi & Rekonsiliasi, Harga Dinamis, Laporan, Template Dokumen, Alat, API & Integrasi, Manajemen Staff | 12 |

**BottomNav (mobile)**: Dashboard, Properti, Tagihan, Notifikasi, Profil (5 items)

**Pages NOT in any nav**: Billing, Settings, Support, Feedback, OcrTutorial, PropertyCompliance (6 pages accessible only via links/direct URL)

**Assessment**:
- **12 items in Lainnya** — too many. Some are high-priority (Collections, Staff) buried alongside niche features (API Integration, Dynamic Pricing).
- **Mobile bottom nav**: 5 items (Dashboard, Properti, Tagihan, Notifikasi, Profil) — good prioritization.
- **Missing from bottom nav**: Payments, Maintenance — two high-frequency actions not accessible from mobile bottom nav.
- **6 "hidden" pages** — Billing, Settings, Support, Feedback, OcrTutorial, PropertyCompliance have no sidebar entry. These require discovery via other pages or direct URL.

**Recommendations**:
1. Split "Lainnya" into "Lanjutan" (advanced: dynamic pricing, API, ML) and "Operasional Lainnya" (collections, reconciliation, staff)
2. Add Maintenance to mobile bottom nav (replace Notifikasi or add as 6th item)
3. Add Billing and Settings to sidebar
4. Dynamic promotion: show Collections in main nav when active cases exist

---

## Section 6: System Alignment Verification

```
✅ Escrow references found in this document: 0 (mentioned only in exclusion statements)
✅ merchant_activity_diagram.md references found: 0
✅ Outdated diagram references found: 0
✅ Total merchant features analyzed: 38
✅ All features verified against: navigation-config.ts, state-machines.ts, page files
✅ All state machines sourced from: src/shared/constants/state-machines.ts (31 total, 21 merchant-applicable)
✅ All edge functions sourced from: supabase/functions/ directory listing (62 functions + _shared/)
✅ All page files sourced from: src/pages/merchant/ directory listing (57 files)

⚠ PRD conflicts noted:
  - PRD Section 2.2 references escrow for merchant → OUTDATED vs. production code
  - PRD Section 5.2 references escrow dashboard → OUTDATED vs. production code

⚠ API Contract conflicts noted:
  - API Section 6 references escrow_balance → OUTDATED vs. production code

Sources used (exhaustive):
  - src/shared/components/layouts/navigation-config.ts (lines 111-163)
  - src/shared/constants/state-machines.ts (all 31 state machines)
  - src/pages/merchant/ (57 files)
  - src/features/dashboard/services/merchantDashboardService.ts
  - src/features/finance/services/financialControlService.ts
  - src/features/staff/constants/permissions.ts (16 permissions, 3 roles, 4 groups)
  - supabase/functions/ (62 functions + _shared/)

Sources NOT used:
  - old-docs/merchant_activity_diagram.md (EXCLUDED — outdated)
  - sihuni_prd.md escrow sections (EXCLUDED — contradicts production)
  - Any diagram not aligned with current code
```

---

## Section 6.5: Hallucination Risk Self-Check

```
Total Features Identified from Documentation: 39 (38 analyzed + 1 excluded)
Total Features Analyzed: 38
Features Without Source Reference: 0

Feature Excluded (with reason):
  - Referrals: ❌ Not Defined in Current System Documentation — database tables exist
    (referrals, referral_rewards, referral_commissions) but no merchant UI page found
    in src/pages/merchant/. NOT ANALYZED.

Assumptions Used (4):

1. 🧩 Assumption (Low Confidence): ensure-user-bootstrap creates profiles, user_roles,
   merchants, merchant_subscriptions
   Reason: Assumed from function name and database schema. Edge function code not read directly.
   Location: Feature 1 (Dashboard), Section 3A (Onboarding)

2. 🧩 Assumption (Low Confidence): auto-generate-invoices triggers per contract billing_day
   Reason: Assumed from function name. Actual trigger mechanism (cron schedule, database
   trigger, or manual invocation) not verified in edge function code.
   Location: Feature 14 (Invoices)

3. 🧩 Assumption (Low Confidence): 15+ day overdue threshold triggers escalated status
   Reason: Assumed from state machine comment "collections-level overdue (15+ days)".
   Actual threshold not verified in auto-transition-invoices edge function code.
   Location: Feature 14 (Invoices)

4. 🧩 Assumption (Low Confidence): Occupancy snapshot cron interval
   Reason: compute-occupancy-snapshots exists as edge function but cron interval/schedule
   not verified. Staleness depends on scheduler configuration.
   Location: Feature 4 (Occupancy Board)

🚨 Audit Integrity: MAINTAINED — All 38 analyzed features have source references.
   No features were analyzed without documentation backing.
```

---

## Section 7: Final UX Verdict

### Overall Assessment

The merchant system provides **comprehensive property management** with 38 features across 57 pages, supported by 21 applicable state machines and 62 edge functions. The system is **functionally complete** for the target use case (Indonesian property owners managing kos/apartments).

### Top 5 Critical Issues

1. **Payment Transfer Invisibility (F16)**: Merchants have zero visibility into how they receive money. The direct payment model works technically (`PAYMENT_TRANSFER_TRANSITIONS`) but the UX provides no merchant-facing page, no transfer history, no status tracking. `balance: 0` on dashboard is misleading. **Fix priority: P0**.

2. **Move-Out Complexity (F23)**: 4 parallel state machines with 17 total states for one event. Small landlords managing 5-10 units will find this overwhelming. A unified wizard is needed. **Fix priority: P1**.

3. **Navigation Overload (Lainnya group)**: 12 items in a single collapsible group hides high-priority features (Collections, Staff) alongside niche features (API, Dynamic Pricing). Additionally, 6 pages (Billing, Settings, Support, Feedback, OcrTutorial, PropertyCompliance) have no sidebar entry at all. **Fix priority: P1**.

4. **Billing Page Discovery (F33)**: Subscription management is the platform's revenue model but has no sidebar entry. Merchants must discover it via Support page links. **Fix priority: P1**.

5. **Alerts Not in Sidebar (F35)**: The merchant's early warning system (overdue invoices, expiring contracts, stale maintenance) is only accessible via mobile bottomNav. Desktop users have no sidebar link. **Fix priority: P2**.

### Strengths

1. **Strong automation**: Auto-invoice generation, auto-payment matching, auto-overdue escalation, subscription lifecycle management reduce manual work significantly
2. **Comprehensive state machines**: 31 defined state machines (21 merchant-applicable) prevent invalid transitions and provide clear lifecycle management
3. **AI/ML integration**: 11 ML models + 4 DSS engines provide advanced analytics — strong differentiator
4. **Staff delegation model**: 16 granular permissions with 3 role presets enables scaling from solo owner to property management company
5. **Progressive disclosure**: "Lainnya" group + Property Detail tab dropdown prevent initial overwhelm
6. **Compliance management**: Property compliance with disaster risk, insurance, and security incident tracking is a differentiator for regulated markets

### Target User Fit

| Segment | Fit | Notes |
|---------|-----|-------|
| Solo owner (1-3 properties) | 🟡 Medium | Core features good, but complexity of amendments/move-outs/collections may overwhelm. 6 hidden pages reduce discoverability. |
| Property manager (4-20 properties) | 🟢 Good | Full feature set matches operational needs, staff delegation works. Compliance features add value. |
| Enterprise (20+ properties) | 🟡 Medium | API integration helps, but client-side query model may not scale. Financial reports need server-side processing. |

### Recommended Priority Actions

| Priority | Action | Impact |
|----------|--------|--------|
| P0 | Add merchant-facing payment transfer page | Trust & transparency |
| P1 | Create unified move-out wizard | Reduce operational friction |
| P1 | Restructure "Lainnya" nav group + add hidden pages to sidebar | Feature discoverability |
| P1 | Add Billing to sidebar navigation | Platform revenue |
| P2 | Add Alerts link to sidebar with badge count | Proactive issue management |
| P2 | Add configurable alert thresholds | Personalization |
| P2 | Surface top DSS recommendations on Dashboard | AI value delivery |
| P3 | Server-side report generation | Enterprise scalability |
| P3 | One-click lease renewal | Reduce vacancy risk |
| P3 | Break PropertyCompliance into sub-components | Code maintainability |

---

*Document generated from code-level analysis only. No legacy diagrams, no outdated PRD sections, no escrow references for merchant. Forensic audit v3.1: 4 assumptions flagged, 1 feature excluded (referrals — no UI), edge function count corrected to 62.*
