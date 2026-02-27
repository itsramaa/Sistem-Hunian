# UX Assessment & User Journey — SiHuni Merchant Portal

> **Auditor Perspective**: Non-technical boarding house owner (Ibu Sari, 47, owns 3 kos-kosan with 30 units total in Yogyakarta, uses WhatsApp and basic banking apps)
>
> **Date**: 2026-02-27 (Revised)
>
> **Evidence Sources**: `state-machines.ts` (31 state machines), `navigation-config.ts` (4 nav groups, 24 sidebar items), `merchant_activity_diagram.md` (23 diagrams), `role-actions.ts` (5 primary merchant actions)

---

## Step 1: Source Traceability Matrix

Every feature analyzed in this document is mapped to its source documentation. Features without sources are excluded from analysis.

| # | Feature Name | Found In (Document + Section) | Evidence Snippet | UX Section |
|---|---|---|---|---|
| 1 | Onboarding & Verification | `merchant_activity_diagram.md` Diagram 1; `state-machines.ts` lines 159-164 | `MERCHANT_VERIFICATION_TRANSITIONS`: pending → verified / rejected | §2 Feature 1 |
| 2 | Subscription Management | `merchant_activity_diagram.md` Diagram 2; `state-machines.ts` lines 78-84 | `SUBSCRIPTION_STATUS_TRANSITIONS`: trialing → active → past_due → suspended → cancelled | §2 Feature 2 |
| 3 | Property & Unit Management | `merchant_activity_diagram.md` Diagram 3; `state-machines.ts` lines 32-36 | `UNIT_STATUS_TRANSITIONS`: available / occupied / maintenance | §2 Feature 3 |
| 4 | Contract Lifecycle | `merchant_activity_diagram.md` Diagram 4; `state-machines.ts` lines 12-29 | `CONTRACT_STATUS_TRANSITIONS` + `CONTRACT_SIGNATURE_TRANSITIONS` | §2 Feature 4 |
| 5 | Tenant Management | `merchant_activity_diagram.md` Diagram 5; `state-machines.ts` lines 189-193 | `TENANT_INVITATION_TRANSITIONS`: pending → accepted / expired | §2 Feature 5 |
| 6 | Invoice Management | `merchant_activity_diagram.md` Diagram 6, 6B; `state-machines.ts` lines 39-67 | `INVOICE_STATUS_TRANSITIONS` + `PAYMENT_PLAN_STATUS_TRANSITIONS` | §2 Feature 6 |
| 7 | Payment & Verification | `merchant_activity_diagram.md` Diagram 7; `state-machines.ts` lines 51-57, 247-252 | `PAYMENT_STATUS_TRANSITIONS` + `PAYMENT_VERIFICATION_TRANSITIONS` | §2 Feature 7 |
| 8 | Direct Payment (Escrow & Disbursement) | `merchant_activity_diagram.md` Diagram 8; `state-machines.ts` lines 138-143 | `DISBURSEMENT_STATUS_TRANSITIONS`: pending → processing → completed / failed | §2 Feature 8 |
| 9 | Move-Out & Deposit Refund | `merchant_activity_diagram.md` Diagram 9; `state-machines.ts` lines 87-108, 181-187 | 4 machines: MOVE_OUT_NOTICE, INSPECTION, EARLY_TERMINATION, DEPOSIT_REFUND | §2 Feature 9 |
| 10 | Maintenance Requests | `merchant_activity_diagram.md` Diagram 10; `state-machines.ts` lines 70-127 | `MAINTENANCE_STATUS_TRANSITIONS` + `VENDOR_JOB_STATUS_TRANSITIONS` | §2 Feature 10 |
| 11 | Collections & Billing Analytics | `merchant_activity_diagram.md` Diagrams 11, 20; `state-machines.ts` lines 196-204 | `COLLECTIONS_CASE_TRANSITIONS`: 7 states (initiated → resolved) | §2 Feature 11 |
| 12 | AI/ML & DSS Advisory | `merchant_activity_diagram.md` Diagram 12; `state-machines.ts` lines 272-278 | `DSS_RECOMMENDATION_TRANSITIONS`: generated → viewed → accepted → measured | §2 Feature 12 |
| 13 | Referral System | `merchant_activity_diagram.md` Diagram 13 | Referral flow described in diagram. `REFERRAL_STATUS_TRANSITIONS` ❌ Not found in `state-machines.ts` — states inferred from diagram only | §2 Feature 13 |
| 14 | Support, Feedback & Compliance | `merchant_activity_diagram.md` Diagram 14; `state-machines.ts` lines 173-178 | `DISPUTE_STATUS_TRANSITIONS`: open → in_progress → resolved / closed | §2 Feature 14 |
| 15 | Payment Reconciliation | `merchant_activity_diagram.md` Diagram 15 | 3-tier auto-match described in diagram. ❌ No explicit state machine in `state-machines.ts` — uses string values | §2 Feature 15 |
| 16 | Automated Payment Reminders | `merchant_activity_diagram.md` Diagram 16 | Cron-based reminder schedule. ❌ No explicit state machine — automated process | §2 Feature 16 |
| 17 | Expense Tracking | `merchant_activity_diagram.md` Diagram 17; `state-machines.ts` lines 264-270 | `EXPENSE_APPROVAL_TRANSITIONS`: submitted → pending_approval / approved → verified | §2 Feature 17 |
| 18 | Waiting List | `merchant_activity_diagram.md` Diagram 18; `state-machines.ts` lines 207-214 | `WAITING_LIST_TRANSITIONS`: interested → applied → waitlisted / offered → accepted | §2 Feature 18 |
| 19 | Lease Renewal & Amendment | `merchant_activity_diagram.md` Diagram 19; `state-machines.ts` lines 217-227 | `AMENDMENT_STATUS_TRANSITIONS`: 9 states. ⚠️ **Discrepancy**: Diagram 19 shows 5 simplified states; code has 9 states including tenant_reviewing, negotiating, agreed, signing | §2 Feature 19 |
| 20 | Dynamic Pricing | `merchant_activity_diagram.md` Diagram 21 | Rule-based pricing with 5 rule types. ❌ No explicit state machine — active/inactive boolean | §2 Feature 20 |
| 21 | Financial Reports (P&L) | `merchant_activity_diagram.md` Diagram 22 | Read-only reporting. ❌ No state machine — query-based | §2 Feature 21 |
| 22 | Financial Control Center | `role-actions.ts` line 23; `state-machines.ts` lines 264-270 | "Approve Pengeluaran — Setujui atau tolak pengeluaran ≥ Rp 500K". Uses `EXPENSE_APPROVAL_TRANSITIONS` | §2 Feature 22 |

| 23 | Occupancy Board | `navigation-config.ts` line 124; `OccupancyBoard.tsx` | Sidebar item "Papan Okupansi". Kanban board with 4 columns: occupied, available, maintenance, notice. Drag-and-drop status updates via `useOccupancyBoard` hook. `OccupancyFilters` for unitType/floor/property filtering | §2 Feature 23 |
| 24 | Inventory / Asset Management | `navigation-config.ts` line 149; `Inventory.tsx` | Sidebar "Inventori". 3-tab page: Tipe Fasilitas, Aset (with depreciation calc), Assignment. Uses `facility_types`, `assets`, `facility_assignments` tables. Tangible/intangible classification. Client-side depreciation: `(purchasePrice - salvageValue) / usefulLifeMonths * monthsElapsed` | §2 Feature 24 |
| 25 | Guardian Management | `navigation-config.ts` line 150; `Guardians.tsx` | Sidebar "Penjaga". CRUD for property guardians with roles (security, cleaner, manager, maintenance). Multi-property assignment via `guardian_property_assignments`. Salary tracking with frequency (monthly/weekly/daily) | §2 Feature 25 |
| 26 | Vendor Performance | `navigation-config.ts` line 151; `VendorPerformance.tsx` | Sidebar "Performa Vendor". 3-tab dashboard: Ringkasan (table), Perbandingan (bar chart), Riwayat. Uses `useVendorPerformance` hook. Toggle preferred vendor. Compare up to 3 vendors | §2 Feature 26 |
| 27 | Utility Billing | `navigation-config.ts` line 152; `UtilityBilling.tsx` | Sidebar "Utilitas". 3-tab page: Pengaturan (per utility type), Input Meter (readings), Tagihan (charge generation). Uses `useUtilityBilling` hooks. Property-scoped. Meter reading → charge generation workflow | §2 Feature 27 |
| 28 | Document Templates | `navigation-config.ts` line 157; `DocumentTemplates.tsx` | Sidebar "Template Dokumen". 7 categories: lease_contract, house_rules, move_in_checklist, inspection_report, eviction_notice, payment_reminder, other. System templates (read-only, dupable) vs merchant custom templates. Variable substitution. Editor + Fill/Preview dialogs | §2 Feature 28 |
| 29 | API & Integration | `navigation-config.ts` line 159; `ApiIntegration.tsx` | Sidebar "API & Integrasi". 3-tab page: API Keys (CRUD, hash-stored, prefix-visible, rate-limited 1000/hr), Webhooks (endpoint CRUD, 8 event types, failure auto-disable at 10 failures, delivery logs), Dokumentasi (inline REST docs). Uses `api_keys`, `webhooks`, `webhook_logs` tables | §2 Feature 29 |
| 30 | Staff Management | `navigation-config.ts` line 160; `StaffManagement.tsx` | Sidebar "Manajemen Staff". Full RBAC: 3 roles (caretaker, property_manager, accountant). 16 granular permissions across 4 groups (Unit, Maintenance, Keuangan, Operasional). Invite by email, per-staff permission toggle via `PermissionsDialog`. Uses `merchant_staff`, `staff_permissions` tables | §2 Feature 30 |
| 31 | InsightsHub (Analytics Landing) | `navigation-config.ts` line 158; `InsightsHub.tsx` | Sidebar "Alat". Card-based landing hub linking to 9 sub-tools: 3 Performance (Template Laporan, Portofolio Komparatif, Pusat Dokumen) + 6 Intelligence AI (Prediksi ML, Strategi DSS, Tren Pasar, Risiko Keuangan, Skor Penyewa, Kualitas Data). Tiered labels: "Standar" vs "Premium" | §2 Feature 31 |
| 32 | Tenant Screening | `TenantScreening.tsx`; `navigation-config.ts` activePattern | Dedicated page "Screening Penyewa". Pre-screening before contract. Grade system: Green/Yellow/Red. Status: pending → scored → approved/rejected. Form collects: occupation, employer, income, previous landlord, guarantor. `ScreeningScoreCard` + `ScreeningApprovalActions` components | §2 Feature 32 |

**Traceability Summary**: 32 features identified, all with document source references. 0 features without source.

---

## 1. Executive UX Summary

### 1.1 Is the System Understandable for a Non-Technical Merchant?

**Verdict: ⚠️ Partially — with significant learning curve**

**Evidence**:
- Navigation has **24 sidebar items** across 4 groups ("Utama", "Operasional", "Keuangan", "Lainnya") — source: `navigation-config.ts` lines 118-163
- The "Lainnya" group alone contains **12 items** including Inventori, Penjaga, Performa Vendor, Utilitas, Penagihan, Resolusi & Rekonsiliasi, Harga Dinamis, Laporan, Template Dokumen, Alat (InsightsHub), API & Integrasi, Manajemen Staff
- System uses **31 state machines** (`state-machines.ts`) governing entity lifecycles — a non-technical user must implicitly understand state transitions even though they're hidden behind UI
- `RoleActionGuide` (`role-actions.ts`) reduces visible actions to **5 primary** for merchants: Kelola Properti, Buat Tagihan, Approve Pengeluaran, Kirim Reminder, Lihat Laporan — this is the correct approach but doesn't cover the other 19+ pages

**Positive indicators**:
- Dashboard uses health badges (Green/Yellow/Red) for Occupancy, Revenue, Receivables — visual, not numeric
- Role Action Map limits initial cognitive load to 5 actions
- Indonesian language throughout — no English jargon in UI labels

**Negative indicators**:
- 24 sidebar items is excessive for a kos owner who primarily needs: Units, Tenants, Bills, Payments
- Terms like "Rekonsiliasi", "DSS", "Harga Dinamis", "API & Integrasi" are enterprise vocabulary
- "Kontrol Keuangan" page requires understanding of approval workflows with ≥ Rp 500K thresholds

### 1.2 Is the Flow Too Long or Too Complex?

**Verdict: ❌ Yes — critically over-engineered for target segment**

**Evidence — Onboarding to First Revenue** (from Diagram 1 → 2 → 3 → 5 → 4 → 6 → 7):

| Step | Action | Blocking? | Estimated Time |
|------|--------|-----------|----------------|
| 1 | Register account | No | 2 min |
| 2 | Complete merchant profile | No | 5 min |
| 3 | Set address (headquarters + billing) | No | 3 min |
| 4 | Upload verification docs (KTP, SIUP, NPWP) | **YES** | 10 min |
| 5 | OCR processing | Auto | 1 min |
| 6 | **Wait for admin approval** | **BLOCKING** | **Unknown** |
| 7 | Choose subscription tier | No | 2 min |
| 8 | Add property | No | 5 min |
| 9 | Add units | No | 3 min per unit |
| 10 | Invite tenant | No | 2 min |
| 11 | **Wait for tenant to accept** | **BLOCKING** | **Unknown** |
| 12 | Create contract | No | 5 min |
| 13 | **Both parties sign** | **BLOCKING** | **Unknown** |
| 14 | Create invoice | No | 3 min |
| 15 | **Wait for tenant payment** | **BLOCKING** | **Unknown** |
| 16 | Verify payment | No | 2 min |

**Total minimum steps**: 16
**Total blocking steps**: 4
**Time to first revenue**: Unknown calendar time (due to admin verification + tenant acceptance)

> ❌ **Not Defined in Current System Documentation**: Admin verification turnaround time is not specified anywhere in the system documentation.

### 1.3 Is the Merchant Overly Dependent on Admin Actions?

**Verdict: ⚠️ Moderate dependency**

| Admin-Dependent Action | Impact | Source |
|----------------------|--------|--------|
| Merchant verification (approve/reject) | **Blocks all operations** | Diagram 1, `MERCHANT_VERIFICATION_TRANSITIONS` |
| Large disbursement approval | Delays cash receipt | Diagram 8, `requires_manual_review` flag |
| Deposit dispute mediation | Blocks refund resolution | Diagram 9, `DEPOSIT_REFUND_TRANSITIONS` |
| Dispute resolution | Blocks conflict resolution | `DISPUTE_STATUS_TRANSITIONS` |

Non-admin-dependent (positive):
- Invoice creation — autonomous
- Payment verification — merchant confirms directly
- Maintenance assignment — merchant decides
- Contract creation — merchant initiates
- Expense tracking — no approval needed for < Rp 500K

### 1.4 Time to First Value

**First Insight**: After Step 8 (add property) → Dashboard shows occupancy = 0% with Red badge. Active setup time ~30 min if admin approves instantly.

**First Revenue**: After Step 16. Calendar time unknown due to 4 blocking steps.

> 🧩 **Assumption (Low Confidence)**: Competitors in Indonesian PMS market (e.g., Mamikos) typically allow property listing within minutes of registration without admin verification. No SiHuni competitor benchmark data exists in system documentation. This assumption is based on general SaaS industry knowledge and may not reflect actual Indonesian PMS market conditions.

---

## 2. Feature-by-Feature UX Assessment

---

### 🔹 Feature 1: Onboarding & Verification

#### Documentation Source
- **Document**: `merchant_activity_diagram.md` Diagram 1
- **Section**: Merchant Registration & Verification
- **Reference**: `MERCHANT_VERIFICATION_TRANSITIONS` in `state-machines.ts` lines 159-164

#### Current Flow (Actual)

| Role | Action | Page / Endpoint |
|------|--------|-----------------|
| 🏠 Merchant | Register account (email + password) | `/register` |
| 🏠 Merchant | Complete profile (business_name, business_type) | `/merchant/profile` |
| 🏠 Merchant | Set addresses (HQ + billing) | `/merchant/profile` |
| 🏠 Merchant | Upload KTP, SIUP, NPWP | `/merchant/profile` |
| System | OCR extraction via `ocr-ktp-extract`, `ocr-business-document` | Edge functions |
| System | `ensure-user-bootstrap` creates profiles, user_roles, merchants, escrow_accounts, merchant_subscriptions (free) | Edge function |
| 🛡️ Admin | Review documents, approve/reject | `/admin/merchants/:id` |
| 🏠 Merchant | View verification status | `/merchant/profile` |

#### State Machine

```
pending → verified → suspended
pending → rejected → pending (resubmit)
suspended → verified
```

Source: `MERCHANT_VERIFICATION_TRANSITIONS` in `state-machines.ts` lines 159-164

#### UX Friction Analysis

- **Blocking step**: Admin verification is a hard gate — merchant cannot do ANYTHING until approved (evidence: `MERCHANT_VERIFICATION_TRANSITIONS` has no bypass path from `pending`)
- **Too many documents**: KTP + SIUP + NPWP required upfront. Small kos owners may not have SIUP
- **No progress indicator**: After upload, merchant sees "PENDING" with no estimated wait time
- **Resubmission friction**: If rejected, merchant must re-upload (rejected → pending path exists in state machine)
- **No sandbox mode**: Cannot explore the system while waiting for verification

#### Business Impact

- **Delays monetization**: Unknown delay before merchant can use ANY feature
- **SIUP requirement excludes**: Many informal kos operations don't have SIUP

> 🧩 **Assumption (Low Confidence)**: Onboarding friction causing 40-60% churn is based on general SaaS onboarding benchmarks (not SiHuni-specific data). No SiHuni churn metrics exist in system documentation.

#### Simplification Opportunities

1. **Allow limited access during verification** — let merchant add properties and units while pending
2. **Make SIUP optional** for Quick tier verification (`VERIFICATION_TIER_TRANSITIONS`: quick → standard → premium)
3. **Show estimated wait time** based on admin queue length
4. **Progressive verification** — start with KTP only, request SIUP/NPWP later for premium features

---

### 🔹 Feature 2: Subscription Management

#### Documentation Source
- **Document**: `merchant_activity_diagram.md` Diagram 2
- **Section**: Subscription Lifecycle
- **Reference**: `SUBSCRIPTION_STATUS_TRANSITIONS` in `state-machines.ts` lines 78-84

#### Current Flow (Actual)

| Role | Action | Page / Endpoint |
|------|--------|-----------------|
| 🏠 Merchant | Choose subscription tier | `/merchant/subscription` |
| System | Start trial period | `merchant_subscriptions` table |
| System | Billing via `subscription-billing` edge function | Edge function |
| System | Payment via `subscription-payment` edge function | Edge function |
| System | Grace period check via `subscription-grace-check` | Edge function |
| 🏠 Merchant | Upgrade/downgrade tier | `/merchant/subscription` |
| 🏠 Merchant | Cancel with feedback | `/merchant/subscription` |

#### State Machine

```
trialing → active | cancelled
active → past_due | cancelled
past_due → active | suspended
suspended → active | cancelled
```

Source: `SUBSCRIPTION_STATUS_TRANSITIONS` in `state-machines.ts` lines 78-84

#### UX Friction Analysis

- **5-state lifecycle** is appropriate for a SaaS subscription — not over-complex
- **Grace period** prevents abrupt service loss — good UX
- **Cancellation feedback** (`cancellation_feedback` table) is standard practice
- **Edge function automation** means merchant doesn't manually manage billing — good

#### Business Impact

- Subscription is the revenue model — critical path
- Trial period de-risks adoption — positive
- Upgrade/downgrade flexibility reduces churn — positive

#### Simplification Opportunities

- Already well-designed for its purpose
- Could add: Visual subscription comparison chart on tier selection page

---

### 🔹 Feature 3: Property & Unit Management

#### Documentation Source
- **Document**: `merchant_activity_diagram.md` Diagram 3
- **Section**: Property & Unit Setup
- **Reference**: `UNIT_STATUS_TRANSITIONS` in `state-machines.ts` lines 32-36

#### Current Flow (Actual)

| Role | Action | Page / Endpoint |
|------|--------|-----------------|
| 🏠 Merchant | Add property (name, type) | `/merchant/properties` |
| 🏠 Merchant | Set property address | Property detail |
| 🏠 Merchant | Set nearby facilities | Property detail |
| 🏠 Merchant | Add units (number, type, floor, rent) | `/merchant/properties/:id` |
| 🏠 Merchant | Assign facility types | Property detail |
| 🏠 Merchant | Assign guardians | Property detail |
| 🏠 Merchant | Upload compliance docs | Property detail |
| 🏠 Merchant | Add insurance policies | Property detail |
| 🏠 Merchant | Set disaster risk profile | Property detail |
| System | Auto-update unit counts via `update_property_unit_counts()` trigger | Database trigger |
| System | Vacancy tracking via `vacancy-tracking-cron` + `compute-occupancy-snapshots` | Edge functions |

#### State Machine (Units)

```
available → occupied | maintenance
occupied → available | maintenance
maintenance → available | occupied
```

Source: `UNIT_STATUS_TRANSITIONS` in `state-machines.ts` lines 32-36

#### UX Friction Analysis

- **Too many optional setup steps**: Guardian, compliance, insurance, disaster risk — a kos owner just wants to add "Kamar 1, Rp 800K/bulan"
- **5 tabs on PropertyDetail** + "Lainnya" dropdown with Staf, Kepatuhan — excessive for property setup
- **Compliance documents** (SIUP, izin usaha per property) — relevant for large operations but friction for 5-unit kos
- **Disaster risk profiles** — enterprise-level feature completely unnecessary for typical kos

#### Business Impact

- Core feature — property setup is the foundation
- Over-complexity delays "ready to rent" state
- Good: Auto-triggers for unit counts reduce manual sync errors

#### Simplification Opportunities

1. **Quick-add mode**: Property name + address → Unit number + rent amount → Done (4 fields total)
2. **Hide compliance/insurance/disaster-risk** behind "Advanced" or progressive disclosure
3. **Bulk unit creation**: "Add 10 units, Rp 800K each" instead of one-by-one

---

### 🔹 Feature 4: Contract Lifecycle

#### Documentation Source
- **Document**: `merchant_activity_diagram.md` Diagram 4
- **Section**: Contract Creation & Signature
- **Reference**: `CONTRACT_STATUS_TRANSITIONS` lines 12-21, `CONTRACT_SIGNATURE_TRANSITIONS` lines 24-29

#### Current Flow (Actual)

| Role | Action | Page / Endpoint |
|------|--------|-----------------|
| 🏠 Merchant | Create contract (unit, tenant, dates, rent) | `/merchant/contracts` |
| System | Validate: unit has no active contract, tenant has no active contract | `contractService.validateContractCreation()` |
| 🏠 Merchant | Upload contract PDF (optional) | Contract detail |
| System | OCR contract document | `ocr-contract-document` edge function |
| 🏠 Merchant | Sign digitally | `/merchant/contracts/:id` |
| 🧑‍💼 Tenant | Sign digitally | `/tenant/contracts/:id` |
| System | Both signed → contract active, unit → occupied | Trigger |
| 🏠 Merchant | Issue move-out notice / early termination | Contract detail |

#### State Machine

```
Contract: draft → active | cancelled
         pending_signature → active | cancelled (legacy compat)
         active → notice | terminated | expired
         notice → completed

Signature: pending → merchant_signed | tenant_signed
          merchant_signed → fully_signed
          tenant_signed → fully_signed
```

Source: `CONTRACT_STATUS_TRANSITIONS` lines 12-21, `CONTRACT_SIGNATURE_TRANSITIONS` lines 24-29

#### UX Friction Analysis

- **Digital signature requirement** from both parties is a blocking step — many kos tenants may not be tech-savvy
- **Contract PDF upload + OCR** is overkill for typical kos — most use simple WhatsApp agreements
- **Dual validation** (unit no active contract + tenant no active contract) — good guard, but error message clarity matters
- **7 contract statuses** (draft, pending_signature, active, notice, terminated, expired, completed, cancelled) — appropriate for lifecycle but confusing for non-technical users

#### Business Impact

- Contract is the legal foundation — important feature
- Digital signature creates legal evidence — good
- BUT: Barrier to entry if tenant doesn't have app/email access

#### Simplification Opportunities

1. **One-click contract**: Select unit + select tenant → auto-generate contract with default terms → merchant signs → send WhatsApp link to tenant for signature
2. **Skip signature for informal agreements**: Allow "active without signature" for Quick tier
3. **Pre-fill from previous contracts**: Copy terms from last contract for same property

---

### 🔹 Feature 5: Tenant Management

#### Documentation Source
- **Document**: `merchant_activity_diagram.md` Diagram 5
- **Section**: Tenant Invitation & Onboarding
- **Reference**: `TENANT_INVITATION_TRANSITIONS` in `state-machines.ts` lines 189-193

#### Current Flow (Actual)

| Role | Action | Page / Endpoint |
|------|--------|-----------------|
| 🏠 Merchant | Invite tenant via email | `/merchant/tenants`, `/merchant/tenants/invite` |
| System | Create invitation | `tenant_invitations` table |
| 🧑‍💼 Tenant | Click email link, accept | `/tenant/invitation/:token` |
| System | Create account if needed | `create-tenant-account` edge function |
| System | Record history | `tenant_merchant_history` table |
| 🏠 Merchant | View tenant list, metrics, risk scores | `/merchant/tenants` |

#### State Machine

```
pending → accepted | expired
```

Source: `TENANT_INVITATION_TRANSITIONS` in `state-machines.ts` lines 189-193

#### UX Friction Analysis

- **Email-based invitation assumes tenants have email** — many Indonesian kos tenants communicate primarily via WhatsApp
- **AI scoring features** (ml-tenant-risk-score, ml-tenant-quality-scoring, compute-tenant-payment-metrics) — powerful but add UI complexity

> ⚠️ **Ambiguous in Documentation — Cannot Conclude**: The claim "no manual tenant creation" needs verification. The API contract (Section 5.1 in API specification) shows phone is optional, suggesting there may be alternative tenant creation paths. The invitation flow is the primary documented path, but manual creation capability cannot be confirmed or denied from current documentation.

#### Business Impact

- Tenant invitation is critical for bilateral contract flow
- Email dependency may cause friction — WhatsApp is more common in Indonesia
- Tenant analytics features (risk, quality) provide value for scaling merchants

#### Simplification Opportunities

1. **WhatsApp invitation link** instead of email-only
2. **Manual tenant creation** — merchant enters phone number, tenant self-registers later
3. **Hide scoring/analytics** until merchant has > 10 tenants

---

### 🔹 Feature 6: Invoice Management

#### Documentation Source
- **Document**: `merchant_activity_diagram.md` Diagrams 6, 6B
- **Section**: Invoice Lifecycle & Payment Plans
- **Reference**: `INVOICE_STATUS_TRANSITIONS` lines 39-48, `PAYMENT_PLAN_STATUS_TRANSITIONS` lines 60-67

#### Current Flow (Actual)

| Role | Action | Page / Endpoint |
|------|--------|-----------------|
| System | Auto-generate invoices from active contracts | `auto-generate-invoices` edge function |
| 🏠 Merchant | Create manual invoice | `/merchant/invoices/create` |
| System | Auto-denormalize (property_id, unit_id, tenant_name, unit_number) | Database trigger |
| System | Track status changes | `track_invoice_status_change()` trigger → `invoice_status_history` |
| 🏠 Merchant | Send invoice to tenant | Invoice detail |
| System | Generate PDF | `generate-invoice-pdf` edge function |
| System | Create Xendit payment link | `xendit-create-invoice` edge function |
| 🏠 Merchant | Manage overdue, negotiate payment plans | Invoice detail |

#### State Machine

```
Invoice: draft → sent | cancelled
         sent → paid | overdue | cancelled | partially_paid
         overdue → paid | cancelled | escalated
         partially_paid → paid | cancelled
         pending → paid | overdue | cancelled (legacy compat)
         escalated → paid | cancelled

Payment Plan: pending_acceptance → accepted | cancelled
             accepted → active
             active → completed | defaulted
```

Source: `INVOICE_STATUS_TRANSITIONS` lines 39-48, `PAYMENT_PLAN_STATUS_TRANSITIONS` lines 60-67

#### UX Friction Analysis

- **8 invoice statuses** (draft, sent, paid, overdue, escalated, partially_paid, pending, cancelled) — too many for a kos owner to mentally model
- **Late fee system** (late_fee_records table) adds complexity
- **Payment plan negotiation** (6-status sub-flow) — enterprise-level feature for a missed Rp 800K payment
- **Auto-generate + manual create** — dual paths may confuse: "Did the system already create this month's invoice?"

#### Business Impact

- **Revenue acceleration**: Auto-generate invoices ensures no missed billing — critical
- **Payment plan**: Useful for tenant retention but complex for small amounts
- **Escalation pipeline**: draft → sent → overdue → escalated → collections is a well-designed funnel

#### Simplification Opportunities

1. **Simplify visible statuses** to 4: Belum Bayar, Sudah Bayar, Terlambat, Dibatalkan
2. **Auto-send on creation** — skip draft stage for recurring invoices
3. **Remove payment plan UI** for invoices < Rp 2M (just remind + collect)
4. **Consolidate escalation** — overdue and escalated can be one status with a severity indicator

---

### 🔹 Feature 7: Payment & Verification

#### Documentation Source
- **Document**: `merchant_activity_diagram.md` Diagram 7
- **Section**: Payment Processing & Verification
- **Reference**: `PAYMENT_VERIFICATION_TRANSITIONS` lines 247-252, `PAYMENT_STATUS_TRANSITIONS` lines 51-57

#### Current Flow (Actual)

| Role | Action | Page / Endpoint |
|------|--------|-----------------|
| 🧑‍💼 Tenant | Choose payment method (manual transfer, Xendit, auto-pay) | `/tenant/invoices/:id/pay` |
| 🧑‍💼 Tenant | Upload proof of transfer | Tenant payment UI |
| System | OCR payment proof | `ocr-payment-proof` edge function |
| System | Auto-match attempt | `PAYMENT_VERIFICATION_TRANSITIONS` |
| 🏠 Merchant | Review & confirm/reject payment | `/merchant/payments`, `/merchant/payments/verify` |
| System | Record payment, update invoice | `payments` table |

#### State Machine

```
Payment Verification: pending → auto_matched | confirmed | rejected
                     auto_matched → confirmed | rejected

Payment Status: pending → paid | overdue | failed
               overdue → paid
```

Source: `PAYMENT_VERIFICATION_TRANSITIONS` lines 247-252, `PAYMENT_STATUS_TRANSITIONS` lines 51-57

#### UX Friction Analysis

- **3 payment methods** (manual, Xendit, auto-pay) — good optionality
- **OCR auto-match** reduces merchant workload — excellent UX
- **But merchant must still confirm auto-matched payments** — adds a manual step even when system is confident

> ❌ **Not Defined in Current System Documentation**: Whether push notifications are sent to merchant when payment needs verification. The `send-notification` edge function exists in `src/features/notifications/utils/notifications.ts` (invoking `supabase.functions.invoke("send-notification")`), confirming the notification infrastructure exists. However, automatic triggering on payment receipt is not documented in the payment verification flow.

#### Business Impact

- Payment verification is the revenue realization point — critical
- OCR + auto-match accelerates cash recognition — high value
- Manual confirmation creates a bottleneck at scale (100+ payments/month)

#### Simplification Opportunities

1. **Auto-confirm** when OCR confidence > 95% — skip merchant review
2. **Batch confirmation** — "Confirm all auto-matched this week" button

---

### 🔹 Feature 8: Direct Payment (Escrow & Disbursement)

#### Documentation Source
- **Document**: `merchant_activity_diagram.md` Diagram 8
- **Section**: Escrow & Disbursement
- **Reference**: `DISBURSEMENT_STATUS_TRANSITIONS` in `state-machines.ts` lines 138-143

#### Current Flow (Actual)

| Role | Action | Page / Endpoint |
|------|--------|-----------------|
| System | Create escrow transaction on payment confirmation | `escrow_transactions` table |
| System | Calculate fees (platform_fee, gateway_fee) | Escrow logic |
| System | Schedule disbursement | `scheduled-disbursement` edge function |
| 🛡️ Admin | Review large disbursements | `requires_manual_review` flag |
| System | Process via Xendit | `xendit-disbursement` edge function |
| System | Webhook callback | `xendit-disbursement-webhook` edge function |
| 🏠 Merchant | Manage bank accounts | `/merchant/bank-accounts` |
| 🏠 Merchant | View escrow balance, request payout | `/merchant/escrow` |

#### State Machine

```
Disbursement: pending → processing
             processing → completed | failed
             failed → pending (retry)
```

Source: `DISBURSEMENT_STATUS_TRANSITIONS` in `state-machines.ts` lines 138-143

#### UX Friction Analysis

- **Escrow is invisible to most kos owners** — they think "tenant pays me directly"
- **Bank account management** is an extra setup step
- **Manual review for large disbursements** creates delay for legitimate payouts
- **Fee deductions** (platform_fee, gateway_fee) may surprise merchants who expected full amount

#### Business Impact

- Escrow model enables platform monetization — business-critical for SiHuni
- But may confuse merchants used to direct bank transfers
- Retry mechanism for failed disbursements — good resilience

#### Simplification Opportunities

1. **Rename "Escrow" to "Saldo Tertunda"** — simpler Indonesian term
2. **Auto-disbursement by default** — only hold for flagged transactions
3. **Show net amount prominently** — "Anda akan menerima Rp X (setelah biaya platform Rp Y)"

---

### 🔹 Feature 9: Move-Out & Deposit Refund

#### Documentation Source
- **Document**: `merchant_activity_diagram.md` Diagram 9
- **Section**: Move-Out Process
- **Reference**: `state-machines.ts` lines 87-108 (notice, inspection, early termination), lines 181-187 (deposit refund)

#### Current Flow (Actual)

| Role | Action | Page / Endpoint |
|------|--------|-----------------|
| 🧑‍💼 Tenant / 🏠 Merchant | Initiate move-out (normal notice or early termination) | Move-out pages |
| 🏠 Merchant | Acknowledge/reject notice | `/merchant/move-outs/:id` |
| 🏠 Merchant | Schedule & conduct inspection | `move_out_inspections` table |
| 🏠 Merchant | Calculate deposit refund (minus deductions) | Deposit refund flow |
| System | Process refund via Xendit | Disbursement flow |
| 🧑‍💼 Tenant | Dispute deductions if disagree | `deposit_disputes` table |
| 🛡️ Admin | Mediate disputes | Admin dispute panel |

#### State Machine

```
Notice: submitted → acknowledged → approved → completed
        submitted → rejected

Inspection: scheduled → in_progress → completed

Early Termination: pending_approval → approved | denied | counter_offered
                  counter_offered → approved | denied

Deposit Refund: pending_processing → approved | rejected
               approved → processing → completed
```

Source: Lines 87-108 and 181-187 in `state-machines.ts`

#### UX Friction Analysis

- **4 separate state machines** for one business process (move-out) — extreme complexity
- **Counter-offer negotiation** for early termination — enterprise-level for a kos where tenant just says "Saya mau pindah bulan depan"
- **Formal inspection scheduling** — most kos owners just walk to the room and check
- **Deposit dispute + admin mediation** — overkill when deposit is typically Rp 800K-2M

#### Business Impact

- Move-out is emotionally charged — good to have structured process
- Deposit disputes without clear process cause bad reviews
- BUT: The 4-machine complexity will cause confusion and likely be bypassed (merchant just gives cash back)

#### Simplification Opportunities

1. **Merge into 2 states**: "Pindah Diajukan" → "Selesai" (with optional deduction input)
2. **Remove formal inspection scheduling** — replace with checklist + photo upload
3. **Auto-calculate refund** based on checklist (no damage = full refund)
4. **Skip dispute for amounts < Rp 500K** — just refund

---

### 🔹 Feature 10: Maintenance Requests

#### Documentation Source
- **Document**: `merchant_activity_diagram.md` Diagram 10
- **Section**: Maintenance Request Lifecycle
- **Reference**: `MAINTENANCE_STATUS_TRANSITIONS` lines 70-75, `VENDOR_JOB_STATUS_TRANSITIONS` lines 120-127

#### Current Flow (Actual)

| Role | Action | Page / Endpoint |
|------|--------|-----------------|
| 🧑‍💼 Tenant | Submit maintenance request (title, description, priority) | `/tenant/maintenance` |
| System | Set SLA deadline based on priority | Database trigger |
| 🏠 Merchant | Decide: handle self, assign vendor, or cancel | `/merchant/maintenance/:id` |
| 🏠 Merchant | Assign to vendor | Vendor job assignment |
| 🔧 Vendor | Accept/reject job | `/vendor/jobs` |
| 🔧 Vendor | Update progress, complete work | `/vendor/jobs/:id` |
| 🏠 Merchant | Track expenses + OCR receipt | `maintenance_expenses` + `ocr-maintenance-receipt` |
| 🧑‍💼 Tenant | Leave review after completion | `maintenance_reviews` |
| System | Update vendor avg rating | `update_vendor_maintenance_rating()` trigger |

#### State Machine

```
Maintenance: pending → in_progress | cancelled
            in_progress → completed | cancelled

Vendor Job: pending → accepted | rejected
           accepted → in_progress | cancelled
           in_progress → completed | cancelled
```

Source: `MAINTENANCE_STATUS_TRANSITIONS` lines 70-75, `VENDOR_JOB_STATUS_TRANSITIONS` lines 120-127

#### UX Friction Analysis

- **2 parallel state machines** (maintenance + vendor job) — complexity for merchant
- **SLA tracking** — nice for large operations, invisible friction for small kos
- **OCR receipt scanning** — impressive tech but unnecessary for most kos repairs
- **Vendor assignment flow** is well-designed for operations that use external vendors
- **Simple 2-status maintenance** (pending → completed) would suffice for 80% of cases

#### Business Impact

- Maintenance handling affects tenant satisfaction — important
- Vendor management is differentiating for larger operations
- Receipt OCR + expense tracking feeds into P&L reports — good data integration

#### Simplification Opportunities

1. **Quick resolve**: Tenant reports → Merchant marks "Selesai" → Done (skip vendor flow)
2. **Default to self-handled** unless merchant explicitly assigns vendor
3. **Remove OCR receipt** from default flow — make it optional "attach receipt" button

---

### 🔹 Feature 11: Collections & Billing Analytics

#### Documentation Source
- **Document**: `merchant_activity_diagram.md` Diagrams 11, 20
- **Section**: Collections Lifecycle & Overdue Escalation
- **Reference**: `COLLECTIONS_CASE_TRANSITIONS` in `state-machines.ts` lines 196-204

#### Current Flow (Actual)

| Role | Action | Page / Endpoint |
|------|--------|-----------------|
| System | Auto-scan overdue invoices via `check-overdue-escalation` | Edge function |
| System | Auto-create collections case at T+15 | Diagram 16 |
| 🏠 Merchant | View aging dashboard (Current, 1-30, 31-60, 61-90, 90+ days) | `/merchant/collections` |
| 🏠 Merchant | Drill-down outstanding invoices per bucket | Collections page |
| 🏠 Merchant | Contact tenant, choose strategy (reminder, WhatsApp, payment plan, escalate) | Collections page |
| System | DSS recommends collection strategy | `dss-collection-strategy` edge function |

#### State Machine

```
initiated → reminder_sent | in_progress
reminder_sent → follow_up | in_progress
follow_up → in_progress | escalated
in_progress → escalated | resolved
escalated → legal | resolved
legal → resolved
```

Source: `COLLECTIONS_CASE_TRANSITIONS` in `state-machines.ts` lines 196-204. **7 states total**: initiated, reminder_sent, follow_up, in_progress, escalated, legal, resolved.

#### UX Friction Analysis

- **7-state collections lifecycle** — enterprise debt collection workflow for a missed Rp 800K rent payment
- **Aging buckets** (Current, 1-30, 31-60, 61-90, 90+) — overkill when most kos have < 30 tenants
- **DSS collection strategy** — AI recommending collection tactics for informal kos relationships
- **4 resolution types** (paid_in_full, payment_plan, write_off, eviction) — "eviction" and "write_off" are heavy terms

#### Business Impact

- Collections visibility is valuable — knowing who hasn't paid is critical
- Auto-escalation at T+15 creates urgency — good
- BUT: The complexity may cause merchants to ignore the feature entirely

#### Simplification Opportunities

1. **Simplify to 3 states**: Belum Bayar → Diingatkan → Selesai
2. **Replace aging buckets with simple list**: Sort by "days overdue" descending
3. **One-click WhatsApp reminder** instead of multi-step strategy selection
4. **Remove "legal" and "eviction" for Basic/Quick tier** — only show for Premium

---

### 🔹 Feature 12: AI/ML & DSS Advisory

#### Documentation Source
- **Document**: `merchant_activity_diagram.md` Diagram 12
- **Section**: ML Model Runs & DSS Recommendations
- **Reference**: `DSS_RECOMMENDATION_TRANSITIONS` in `state-machines.ts` lines 272-278

#### Current Flow (Actual)

| Role | Action | Page / Endpoint |
|------|--------|-----------------|
| System | Run ML models periodically | ML edge functions |
| System | Generate DSS recommendations | DSS edge functions |
| 🏠 Merchant | View recommendations | InsightsHub pages |
| 🏠 Merchant | Accept/reject recommendations | Recommendation detail |
| System | Measure impact of accepted recommendations | `measured_impact` field |

#### State Machine

```
generated → viewed | accepted | rejected
viewed → accepted | rejected
accepted → measured
```

Source: `DSS_RECOMMENDATION_TRANSITIONS` in `state-machines.ts` lines 272-278

#### UX Friction Analysis

- **InsightsHub** has 9 sub-pages accessible via cards — most merchants will never explore them
- **Recommendation accept/reject/measure lifecycle** — assumes merchant understands and acts on data-driven advice

> ⚠️ **Ambiguous in Documentation — Cannot Conclude**: The exact count of ML edge functions requires careful verification. Diagram 12 lists 10 ML + 4 DSS functions, but includes `ml-ocr-correction-suggest` which could be categorized as an OCR function rather than a pure ML function. The count should note that 7 of the ML functions are OCR-related. Total count is approximately 14 AI-related edge functions, with categorization boundaries being ambiguous.

#### Business Impact

- AI features are a marketing differentiator ("Smart PMS!")
- Practical value is limited for 5-20 unit operations
- Risk: Inaccurate AI recommendations erode trust

#### Simplification Opportunities

1. **Surface top 1 recommendation on Dashboard** — don't require navigation to InsightsHub
2. **Auto-implement low-risk recommendations** (e.g., send reminder to tenant overdue 7 days)
3. **Remove accept/reject flow** — just show insights, merchant decides internally
4. **Consolidate 9 InsightsHub pages into 1 dashboard** with key metrics

---

### 🔹 Feature 13: Referral System

#### Documentation Source
- **Document**: `merchant_activity_diagram.md` Diagram 13
- **Section**: Referral Program
- **Reference**: Diagram 13 flow. ❌ `REFERRAL_STATUS_TRANSITIONS` is **not defined** in `state-machines.ts`

#### Current Flow (Actual)

| Role | Action | Page / Endpoint |
|------|--------|-----------------|
| 🏠 Merchant | Generate referral code | `/merchant/referrals` |
| 🏠 Merchant | Share code to potential merchants | Manual sharing |
| New merchant | Register with referral code | Registration page |
| System | Track referral status | `referrals` table |
| System | Process commission on referee subscription | `process-referral-commissions` edge function |
| System | Apply reward (subscription discount) | `process-referral-reward` edge function |

#### State Machine

> 🧩 **Assumption (Low Confidence)**: States (pending → active → completed, pending → expired) are inferred from Diagram 13 description. No `REFERRAL_STATUS_TRANSITIONS` constant exists in `state-machines.ts`. The actual state management may differ from the diagram.

#### UX Friction Analysis

- **Well-designed for growth** — standard referral program
- **Commission + discount reward** — dual incentive is good
- **No in-app sharing** documented — merchant must manually copy code

#### Business Impact

- Growth mechanism — important for user acquisition
- Low operational burden — mostly automated
- Reward visibility motivates continued referrals

#### Simplification Opportunities

1. **WhatsApp share button** — one-tap share referral link
2. **Show earnings prominently** — "Anda sudah menghasilkan Rp X dari referral"

---

### 🔹 Feature 14: Support, Feedback & Compliance

#### Documentation Source
- **Document**: `merchant_activity_diagram.md` Diagram 14
- **Section**: Support & Compliance
- **Reference**: `DISPUTE_STATUS_TRANSITIONS` in `state-machines.ts` lines 173-178

#### Current Flow (Actual)

| Role | Action | Page / Endpoint |
|------|--------|-----------------|
| 🏠 Merchant | Chat with AI assistant | `/merchant/support` |
| 🏠 Merchant | Submit feedback (category, content, rating) | Feedback form |
| 🏠 Merchant | Upload compliance documents | `/merchant/compliance` |
| 🏠 Merchant | Manage insurance policies & claims | Insurance management |
| 🏠 Merchant | Create disputes | Dispute flow |
| System | OCR compliance documents | `ocr-compliance-document` edge function |
| System | Track document expiry, send renewal alerts | Compliance tracking |
| System | GDPR data export/deletion | `gdpr-data-request` edge function |

#### State Machine (Disputes)

```
open → in_progress → resolved | closed
```

Source: `DISPUTE_STATUS_TRANSITIONS` in `state-machines.ts` lines 173-178

#### UX Friction Analysis

- **AI chatbot** is a good first-line support — reduces admin load
- **Compliance document tracking with expiry alerts** — useful but secondary feature
- **Insurance management** (policies + claims) — enterprise feature for most kos operations
- **Disaster risk profiles** — completely unnecessary for typical urban kos
- **GDPR compliance** — required by regulation but adds technical complexity

#### Business Impact

- AI chatbot reduces support cost — high ROI
- Compliance tracking prevents legal issues — important for large operators
- Insurance/disaster risk — minimal value for 80% of merchants

#### Simplification Opportunities

1. **Keep AI chatbot visible** — it's the most useful support feature
2. **Hide compliance/insurance** behind "Kepatuhan & Legalitas" section (already done via Lainnya dropdown)
3. **Remove disaster risk profiles** for non-premium tiers

---

### 🔹 Feature 15: Payment Reconciliation

#### Documentation Source
- **Document**: `merchant_activity_diagram.md` Diagram 15
- **Section**: Payment Reconciliation
- **Reference**: Diagram 15 flow. ❌ No explicit state machine in `state-machines.ts`

#### Current Flow (Actual)

| Role | Action | Page / Endpoint |
|------|--------|-----------------|
| System | Auto-match payments via `auto-match-payment` edge function | Edge function |
| System | Tier 1: Exact match (amount = invoice total, same tenant + contract) | Auto-match logic |
| System | Tier 2: Partial/overpayment match | Auto-match logic |
| System | Tier 3: Manual review queue | `reconciliation_status = pending_review` |
| 🏠 Merchant | View 3 stat cards: Unmatched, Needs Review, Total Unmatched (IDR) | `/merchant/reconciliation` |
| 🏠 Merchant | Review payments with up to 3 suggested invoices | `UnmatchedPaymentsTable` |
| 🏠 Merchant | Manual-match from suggested invoices | `reconciliationService.manualMatch()` |

#### State Machine

> ❌ No Explicit State Machine Defined for reconciliation status — uses string values: `unmatched`, `pending_review`, `auto_matched`, `manually_matched`

#### UX Friction Analysis

- **3-tier matching** is sophisticated — good engineering
- **Suggested invoices** (up to 3) reduce manual work — good UX
- **But: "Reconciliation" is accounting jargon** — most kos owners think "siapa yang sudah bayar?"
- **Separate page** (`/merchant/reconciliation`) when this could be integrated into Payments page

#### Business Impact

- Reduces payment matching errors — critical for financial accuracy
- Auto-match saves time at scale — important for 50+ tenants
- Manual review queue prevents missed payments — good

#### Simplification Opportunities

1. **Rename to "Cocokkan Pembayaran"** — simpler term
2. **Integrate into Payments page** as a tab, not separate page
3. **Auto-match + auto-confirm for exact matches** — reduce merchant touch points

---

### 🔹 Feature 16: Automated Payment Reminders & Escalation

#### Documentation Source
- **Document**: `merchant_activity_diagram.md` Diagram 16
- **Section**: Automated Reminder System
- **Reference**: Diagram 16 flow. ❌ No explicit state machine — cron-driven process

#### Current Flow (Actual)

| Role | Action | Page / Endpoint |
|------|--------|-----------------|
| System | Daily cron scans overdue invoices via `queue-payment-reminders` | Edge function |
| System | Match reminder schedule based on `days_overdue` | `merchants.collections_reminder_config` JSONB |
| System | Send reminder via configured channel (email/SMS/WhatsApp) | Notification edge functions |
| System | Log each reminder | `payment_reminders_log` table |
| System | Auto-create collections case at T+15 | Collections case flow |
| System | Escalate invoice from `overdue` to `escalated` at T+15 | Invoice status update |
| 🏠 Merchant | Configure reminder schedule | `/merchant/settings/reminders` |

#### State Machine

> ❌ No Explicit State Machine Defined — automated process driven by cron schedule

#### UX Friction Analysis

- **Automation is excellent** — merchant configures once, system handles ongoing reminders
- **Multi-channel support** (email, SMS, WhatsApp) — matches Indonesian communication preferences
- **Deduplication logic** prevents spamming — good
- **T+15 auto-escalation** to collections is a smart default
- **Configuration UI** for reminder schedule may be confusing — "hari ke-1 friendly email, hari ke-7 firm SMS"

#### Business Impact

- **Highest ROI feature** — automated reminders directly accelerate cash collection
- Reduces merchant's daily "chase payment" burden
- WhatsApp channel matches tenant behavior

#### Simplification Opportunities

1. **Provide 3 preset templates** instead of custom configuration: "Santai" (less frequent), "Normal", "Tegas" (more frequent)
2. **One-click WhatsApp reminder** from invoice list — supplement automated flow

---

### 🔹 Feature 17: Expense Tracking

#### Documentation Source
- **Document**: `merchant_activity_diagram.md` Diagram 17
- **Section**: Expense Management
- **Reference**: `EXPENSE_APPROVAL_TRANSITIONS` in `state-machines.ts` lines 264-270

#### Current Flow (Actual)

| Role | Action | Page / Endpoint |
|------|--------|-----------------|
| 🏠 Merchant | View expense summary (this month vs last month, trend %, category breakdown) | `/merchant/expenses` |
| 🏠 Merchant | Add expense (category, amount, date, payment method, notes, recurring, tax_deductible) | Expense form |
| 🏠 Merchant | View expense list (ordered by date DESC, limit 50) | Expense list |
| 🏠 Merchant | Delete expense | Expense action |
| System | Auto-set `approval_status: submitted` on creation | `expenseService.createExpense()` |

#### State Machine

```
submitted → pending_approval (if ≥ 500K) | approved (if < 500K)
pending_approval → approved | rejected
approved → verified
rejected → submitted (re-submit)
```

Source: `EXPENSE_APPROVAL_TRANSITIONS` in `state-machines.ts` lines 264-270

#### UX Friction Analysis

- **8 expense categories** (utilities, maintenance, insurance, tax, marketing, admin, payroll, other) — good coverage
- **Approval workflow for ≥ Rp 500K** — who approves? The merchant themselves? Or staff?
- **Tax_deductible flag** — useful for tax season but most kos owners don't track deductions
- **Recurring expense flag** — nice for auto-creation of monthly utilities
- **Summary with trend %** — good at-a-glance view

#### Business Impact

- Feeds into P&L reports — critical for financial visibility
- Approval workflow ensures expense control for multi-staff operations
- Category breakdown helps identify cost drivers

#### Simplification Opportunities

1. **Remove approval workflow for single-owner operations** — they're approving their own expenses
2. **Quick-add**: Amount + category → Done (skip date, payment method, notes, recurring, tax)
3. **Recurring expenses auto-create monthly** — "Listrik Rp 500K/bulan" → auto-add every month

---

### 🔹 Feature 18: Waiting List

#### Documentation Source
- **Document**: `merchant_activity_diagram.md` Diagram 18
- **Section**: Waiting List Management
- **Reference**: `WAITING_LIST_TRANSITIONS` in `state-machines.ts` lines 207-214

#### Current Flow (Actual)

| Role | Action | Page / Endpoint |
|------|--------|-----------------|
| 🏠 Merchant | View applicant list | `/merchant/waiting-list` |
| 🏠 Merchant | Add applicant (name, phone, email, budget, preferred_move_in, special_needs) | `AddApplicantDialog` |
| 🏠 Merchant | Update status: interested → applied → waitlisted/offered | Status buttons |
| 🏠 Merchant | Send offer (select unit, 7-day expiry) | `SendOfferDialog` |
| 🏠 Merchant | Track applicant response (accept/reject) | Status tracking |
| System | Validate all transitions via `isValidTransition(WAITING_LIST_TRANSITIONS)` | Service layer |

#### State Machine

```
interested → applied | rejected
applied → offered | rejected | waitlisted
waitlisted → offered | rejected
offered → accepted | rejected
```

Source: `WAITING_LIST_TRANSITIONS` in `state-machines.ts` lines 207-214

#### UX Friction Analysis

- **6 states** for a waiting list — most kos owners use a WhatsApp group or notebook
- **Budget range** (min/max) — unnecessary formality for typical kos inquiries
- **7-day offer expiry** — good to prevent stale offers
- **Transition validation** prevents invalid moves — good data integrity but merchant won't understand why a button is disabled

#### Business Impact

- Reduces vacancy time — important for revenue
- Formalized process beats manual WhatsApp tracking at scale
- Quality scoring integration provides data for future analytics

#### Simplification Opportunities

1. **Reduce to 3 states**: Menunggu → Ditawari → Diterima/Ditolak
2. **Quick-add**: Name + phone number → Done (skip email, budget, special_needs)
3. **Auto-link to contract creation** when accepted

---

### 🔹 Feature 19: Lease Renewal & Amendment

#### Documentation Source
- **Document**: `merchant_activity_diagram.md` Diagram 19; `state-machines.ts` lines 217-227
- **Section**: Contract Amendment Lifecycle
- **Reference**: `AMENDMENT_STATUS_TRANSITIONS` lines 217-227; `send-renewal-alert` edge function (`supabase/functions/send-renewal-alert/index.ts`)
- **⚠️ Discrepancy Detected**: Diagram 19 shows a simplified 5-state flow (draft, sent, signed, rejected, cancelled). Code implements a full **9-state** negotiation flow including tenant_reviewing, negotiating, agreed, signing. The code is the source of truth.

#### Current Flow (Actual)

| Role | Action | Page / Endpoint |
|------|--------|-----------------|
| System | Auto-scan contracts expiring in 60/30/7 days | `send-renewal-alert` edge function |
| System | Create alerts in `lease_renewal_alerts` table | Alert creation |
| 🏠 Merchant | View renewal alerts (with fallback to direct contract query) | `/merchant/renewals` |
| 🏠 Merchant | Create amendment (old_values, new_values JSON) | Amendment form |
| 🏠 Merchant | Send amendment to tenant | Amendment detail |
| 🧑‍💼 Tenant | Review, counter-offer, or agree | `/tenant/amendments/:id` |
| System | Track negotiation (offer/counter-offer) | `merchant_offer`, `tenant_counter_offer` fields in `contract_amendments` table |
| 🏠 Merchant + 🧑‍💼 Tenant | Both sign agreed amendment | Digital signatures |
| System | Update contract terms on signed amendment | Contract update |

#### State Machine

```
draft → sent | cancelled
sent → tenant_reviewing | rejected | cancelled
tenant_reviewing → negotiating | agreed | rejected
negotiating → agreed | rejected | cancelled
agreed → signing
signing → signed
```

**9 states total**: draft, sent, tenant_reviewing, negotiating, agreed, signing, signed, rejected, cancelled

Source: `AMENDMENT_STATUS_TRANSITIONS` in `state-machines.ts` lines 217-227

#### UX Friction Analysis

- **9 amendment states** — enterprise contract negotiation flow for what is typically "Pak, sewa naik jadi Rp 900K ya" — "Ok"
- **Negotiation flow** (offer → counter-offer → agreed) — suited for commercial leases, not kos
- **Dual signature** required for amendments — same friction as original contract
- **Automatic alerts at H-60, H-30, H-7** — excellent proactive feature (verified in `send-renewal-alert` edge function: alerts array with days 60, 30, 7)
- **Fallback query** when `lease_renewal_alerts` table fails — good resilience

#### Business Impact

- Renewal alerts prevent unexpected vacancies — high value
- Amendment process ensures price adjustments are documented — good
- BUT: The negotiation complexity will cause most merchants to just create a new contract instead

#### Simplification Opportunities

1. **One-click renewal**: "Perpanjang 1 tahun, harga sama" → auto-create new contract
2. **Simple price change**: "Naik ke Rp 900K" → create amendment, send WhatsApp, tenant clicks "Setuju"
3. **Remove negotiation flow** for Basic tier — just accept/reject

---

### 🔹 Feature 20: Dynamic Pricing

#### Documentation Source
- **Document**: `merchant_activity_diagram.md` Diagram 21
- **Section**: Dynamic Pricing Rules
- **Reference**: `dynamic_pricing_rules` table in database schema. ❌ No explicit state machine — rules use `is_active` boolean toggle

#### Current Flow (Actual)

| Role | Action | Page / Endpoint |
|------|--------|-----------------|
| 🏠 Merchant | View pricing rules (sorted by priority) | `/merchant/dynamic-pricing` |
| 🏠 Merchant | Create rule (type, adjustment, conditions, priority, min/max price) | Rule form |
| 🏠 Merchant | Edit/delete/toggle rules | Rule actions |

#### State Machine

> ❌ No Explicit State Machine Defined — rules are active/inactive (boolean toggle)

#### UX Friction Analysis

- **5 rule types** (occupancy, seasonal, demand, duration, loyalty) — enterprise revenue management
- **Priority-based rule evaluation** — requires understanding of rule precedence
- **Conditions as JSON** — technical implementation detail
- **Most kos owners set price once**: "Kamar biasa Rp 800K, kamar AC Rp 1.2M" — done

#### Business Impact

- Revenue optimization for sophisticated operators — niche value
- For 5-unit kos: zero practical value
- For 100-unit apartment complex: high value

#### Simplification Opportunities

1. **Hide for < 20 units** — show only when scale justifies complexity
2. **Replace with "Seasonal Price"**: Toggle between "Normal" and "Peak Season" pricing per unit
3. **AI auto-suggest**: Instead of rules, show "Based on occupancy, we suggest increasing Unit 5 to Rp 850K"

---

### 🔹 Feature 21: Financial Reports (P&L)

#### Documentation Source
- **Document**: `merchant_activity_diagram.md` Diagram 22
- **Section**: Financial Reporting
- **Reference**: Diagram 22 flow. ❌ No state machine — read-only reporting

#### Current Flow (Actual)

| Role | Action | Page / Endpoint |
|------|--------|-----------------|
| 🏠 Merchant | Open financial dashboard, select period (default 6 months) | `/merchant/financial-reports` |
| System | Parallel queries: paid invoices, expenses, properties | `financialReportService.fetchFinancialSummary()` |
| System | Aggregate monthly P&L (revenue - expenses = net income) | Service logic |
| System | Group revenue by property, expenses by category | Service logic |
| 🏠 Merchant | View charts: monthly P&L bar chart, revenue pie by property, expense pie by category | Recharts components |

#### State Machine

> ❌ No Explicit State Machine Defined — read-only reporting feature

#### UX Friction Analysis

- **3 chart types** (bar, 2 pies) — appropriate, not overwhelming
- **Period selector** (default 6 months) — good default
- **Property breakdown** with default "Lainnya" for unmapped — handles edge case

#### Business Impact

- Financial visibility is critical for business decisions
- P&L report is the minimum viable financial feature
- Data from invoices + expenses gives accurate picture

#### Simplification Opportunities

- Already well-designed — one of the simpler features
- Could add: Export to PDF for tax purposes
- Could add: "Ringkasan Bulan Ini" card on Dashboard

---

### 🔹 Feature 22: Financial Control Center

#### Documentation Source
- **Document**: `role-actions.ts` line 23
- **Section**: Expense Approval
- **Reference**: "Approve Pengeluaran — Setujui atau tolak pengeluaran ≥ Rp 500K". Uses `EXPENSE_APPROVAL_TRANSITIONS` (same as Feature 17)

#### Current Flow (Actual)

| Role | Action | Page / Endpoint |
|------|--------|-----------------|
| 🏠 Merchant | View financial overview | `/merchant/financial-control` |
| 🏠 Merchant | Approve/reject expenses ≥ Rp 500K | Approval queue |
| 🏠 Merchant | View deposit refund approvals | Deposit refund section |
| System | Audit trail for all approvals | `auditLog.ts` |

#### State Machine

Uses `EXPENSE_APPROVAL_TRANSITIONS` (same as Feature 17)

#### UX Friction Analysis

- **"Kontrol Keuangan"** is a powerful hub page — but the name is intimidating
- **Rp 500K threshold** for approval — appropriate for most kos budgets
- **Deposit refund approvals** in same page — good consolidation
- **Audit trail** adds accountability for multi-staff operations

#### Business Impact

- Prevents unauthorized spending — important for delegated operations
- Single-owner operations don't need approval workflows (they're approving themselves)

#### Simplification Opportunities

1. **Skip for single-user operations** — detect if merchant has staff, show only if yes
2. **Rename to "Persetujuan"** (Approvals) — simpler
3. **Badge on sidebar** showing pending approvals count

---

### 🔹 Feature 23: Occupancy Board

#### Documentation Source
- **Document**: `navigation-config.ts` line 124; `OccupancyBoard.tsx`; `useOccupancyBoard.ts`
- **Section**: Sidebar item "Papan Okupansi"
- **Reference**: No activity diagram exists for this feature. Source evidence is from page implementation and navigation config.

#### Current Flow (Actual)

| Role | Action | Page / Endpoint |
|------|--------|-----------------|
| 🏠 Merchant | Navigate to Occupancy Board | `/merchant/occupancy-board` |
| 🏠 Merchant | View 4 Kanban columns: Terisi, Kosong-Tersedia, Kosong-Maintenance, Notice Diterima | Board page |
| 🏠 Merchant | Filter by unit type, floor, property, max price | `OccupancyFilters` component |
| 🏠 Merchant | View stats strip (total, occupied, available, maintenance, notice counts) | `OccupancyStats` component |
| 🏠 Merchant | Drag unit card to different column | Drag-and-drop |
| System | Show confirmation dialog | `AlertDialog` |
| 🏠 Merchant | Confirm status change | Dialog button |
| System | Update unit status via `unitService.updateUnit()` | Supabase |
| System | Invalidate `occupancy-board` query cache | React Query |

#### State Machine

Uses `UNIT_STATUS_TRANSITIONS` (same as Feature 3): `available ↔ occupied ↔ maintenance`

The "notice" column is read-only (derived from contracts with `status = 'notice'`); units cannot be dragged INTO the notice column.

#### UX Friction Analysis

- **Positive**: Visual Kanban board is intuitive for at-a-glance occupancy — matches mental model of "which rooms are full/empty"
- **Drag-and-drop confirmation dialog** adds a safety step but slows quick operations
- **Notice column is read-only** — well-designed because notice status comes from contract lifecycle, not manual override
- **Filtering is comprehensive** (type, floor, property, price) — useful for multi-property merchants
- **Data enrichment**: Each card shows tenant name, contract end date, maintenance count — high information density

#### Business Impact

- Quick visual assessment replaces mental tracking of "which room is which"
- Drag-and-drop for maintenance marking is faster than navigating to unit detail

#### Simplification Opportunities

1. **Optional confirmation**: For repeated users, allow "skip confirmation" preference
2. **Mobile optimization**: Kanban columns may not work well on mobile — consider list view fallback

---

### 🔹 Feature 24: Inventory / Asset Management

#### Documentation Source
- **Document**: `navigation-config.ts` line 149; `Inventory.tsx`
- **Section**: Sidebar item "Inventori"
- **Reference**: Also referenced in `merchant_activity_diagram.md` Diagram 3 as property setup subgraph (asset tracking, OCR label, depreciation)

#### Current Flow (Actual)

| Role | Action | Page / Endpoint |
|------|--------|-----------------|
| 🏠 Merchant | Navigate to Inventory page | `/merchant/inventory` |
| 🏠 Merchant | Tab 1: Create facility types (name, scope, nature, asset_type) | Tipe Fasilitas tab |
| 🏠 Merchant | Tab 2: Add assets (link to facility type, brand, serial, price, salvage, useful life) | Aset tab via `AddAssetForm` |
| 🏠 Merchant | View depreciation (client-side straight-line calc) | Asset table "Nilai Buku" column |
| 🏠 Merchant | Click asset row → Detail panel | `AssetDetailPanel` component |
| 🏠 Merchant | Tab 3: Assign intangible facilities to properties/units | Assignment tab via `AddAssignmentForm` |
| System | Query `facility_types`, `assets`, `facility_assignments` tables | Supabase |

#### State Machine

Assets have `status`: available | in_use | maintenance and `condition`: good | damaged | lost.

> ❌ No explicit state machine defined in `state-machines.ts` for asset status transitions. Values are set directly.

#### UX Friction Analysis

- **3-tab structure** (Types → Assets → Assignments) is logical but requires understanding the hierarchy: define types first, then add assets, then assign
- **Depreciation calculation is client-side** — formula: `(purchasePrice - salvageValue) / usefulLifeMonths * monthsElapsed`. Good for visibility but may diverge from accounting standards
- **Tangible/intangible distinction** adds conceptual complexity — a kos owner thinks "AC" not "tangible asset with depreciation schedule"
- **No bulk import** for initial asset registration — tedious for existing properties with 50+ items

#### Business Impact

- Asset tracking enables insurance claims and replacement planning
- Depreciation data feeds into financial reports
- For small kos (5-10 rooms, minimal assets), this is significant over-engineering

#### Simplification Opportunities

1. **Quick-add mode**: "Add AC to Room 3" — 3 fields (type, room, price) instead of 8+
2. **Hide depreciation** behind "Advanced" toggle — most kos owners don't care about salvage value
3. **Pre-populated facility types** — common items (AC, bed, desk, wardrobe) ready out of box

---

### 🔹 Feature 25: Guardian Management

#### Documentation Source
- **Document**: `navigation-config.ts` line 150; `Guardians.tsx`
- **Section**: Sidebar item "Penjaga"
- **Reference**: Also referenced in `merchant_activity_diagram.md` Diagram 3 as optional property setup step

#### Current Flow (Actual)

| Role | Action | Page / Endpoint |
|------|--------|-----------------|
| 🏠 Merchant | Navigate to Guardians page | `/merchant/guardians` |
| 🏠 Merchant | View stats: total guardians, active count, total active salary | Stats cards |
| 🏠 Merchant | Filter by name search + role (security/cleaner/manager/maintenance) | Filter bar |
| 🏠 Merchant | Add guardian: name, phone, role, salary, salary_frequency, status | `GuardianFormDialog` |
| 🏠 Merchant | Edit guardian details | Edit button → Form |
| 🏠 Merchant | Assign guardian to multiple properties (primary/backup role) | Assign dialog |
| 🏠 Merchant | View current property assignments per guardian | Assignment list in dialog |
| 🏠 Merchant | Remove guardian assignment from property | X button in assignment |
| 🏠 Merchant | Deactivate/delete guardian | Action buttons |

#### State Machine

Guardians have `status`: active | inactive.

> ❌ No explicit state machine defined in `state-machines.ts`. Status is toggled directly.

#### UX Friction Analysis

- **Well-structured for its purpose** — CRUD with multi-property assignment is clean
- **Salary tracking** (monthly/weekly/daily frequency) is useful for payroll planning
- **Multi-property assignment** with primary/backup roles is a good model for kos chains
- **Role labels** are clear and in Indonesian (Keamanan, Kebersihan, Manajer, Pemeliharaan)
- **For small kos**: Having a dedicated Guardian page for 1 security guard is excessive — this info could be a property detail field

#### Business Impact

- Useful for kos chains with 3+ properties and shared staff
- Salary aggregation helps monthly expense planning
- For single-property kos, this is unnecessary overhead

#### Simplification Opportunities

1. **Merge into Property Detail** for merchants with ≤2 properties
2. **Show standalone page only** when merchant has 3+ properties or 3+ guardians

---

### 🔹 Feature 26: Vendor Performance

#### Documentation Source
- **Document**: `navigation-config.ts` line 151; `VendorPerformance.tsx`
- **Section**: Sidebar item "Performa Vendor"
- **Reference**: Also referenced in `merchant_activity_diagram.md` Diagram 10 (vendor rating after maintenance completion)

#### Current Flow (Actual)

| Role | Action | Page / Endpoint |
|------|--------|-----------------|
| 🏠 Merchant | Navigate to Vendor Performance | `/merchant/vendor-performance` |
| 🏠 Merchant | View stats: total vendors, avg rating, avg response time, total spend | Stats strip |
| 🏠 Merchant | Tab "Ringkasan": table with vendor name, specialization, rating, job count, response time, total cost, favorite toggle | Summary table |
| 🏠 Merchant | Tab "Perbandingan": select 2-3 vendors, view bar chart comparing response time + rating | Compare tab |
| 🏠 Merchant | Tab "Riwayat": select vendor, view job history (title, status, cost, rating, date) | History tab |
| 🏠 Merchant | Toggle "favorite" vendor | Star button per vendor |

#### State Machine

> ❌ No explicit state machine defined. Vendor performance is read-only analytics derived from `vendor_jobs` data.

#### UX Friction Analysis

- **Good analytical dashboard** — bar chart comparison is a clear differentiator feature
- **Favorite toggle** is simple and useful for quick vendor selection during maintenance
- **3-tab layout** (Summary/Compare/History) is well-organized
- **Prerequisite**: Requires vendor_jobs data to exist — new merchants with no maintenance history see empty dashboard
- **Compare feature** requires selecting vendors manually — could auto-suggest top performers

#### Business Impact

- Helps select best vendor for maintenance jobs — directly reduces cost and improves quality
- Favorite marking speeds up vendor selection in maintenance workflow
- Only useful after 10+ vendor jobs — early-stage merchants get no value

#### Simplification Opportunities

1. **Auto-rank vendors** on first visit instead of requiring manual comparison setup
2. **Show "No data yet"** state with guidance on how vendor data gets populated (via maintenance requests)

---

### 🔹 Feature 27: Utility Billing

#### Documentation Source
- **Document**: `navigation-config.ts` line 152; `UtilityBilling.tsx`; `useUtilityBilling.ts`
- **Section**: Sidebar item "Utilitas"
- **Reference**: No activity diagram exists. Implementation in page file and hooks.

#### Current Flow (Actual)

| Role | Action | Page / Endpoint |
|------|--------|-----------------|
| 🏠 Merchant | Navigate to Utility Billing | `/merchant/utility-billing` |
| 🏠 Merchant | Select property from dropdown | Property selector |
| 🏠 Merchant | Tab "Pengaturan": Configure utility types (water, electricity, internet, common charges) with rates | `UtilitySettingsForm` |
| 🏠 Merchant | Tab "Input Meter": Select period, enter meter readings per unit | `MeterReadingForm` |
| System | Fetch last readings for delta calculation | `getLastReadings()` |
| 🏠 Merchant | Submit meter readings | Save button |
| 🏠 Merchant | Tab "Tagihan": Generate utility charges for period | `UtilityChargeGenerator` |
| System | Calculate charges: (current - previous reading) × rate per unit | `generateCharges()` |
| System | Create invoice line items for utility charges | Supabase |

#### State Machine

> ❌ No explicit state machine defined. Utility billing follows a linear workflow: Settings → Readings → Charges.

#### UX Friction Analysis

- **3-step linear workflow** (configure → input readings → generate charges) is logical and sequential
- **Property-scoped**: Must select property first — appropriate for multi-property merchants
- **Meter reading input** requires unit-by-unit entry — tedious for 30+ units
- **Period selection** is manual — no auto-suggestion for current billing period
- **No photo/OCR for meter readings** — manual number entry only
- **Dependency**: Settings must be configured before readings and charges work — not clear to new users

#### Business Impact

- Enables fair utility billing (usage-based vs flat-rate) — reduces tenant disputes
- Monthly data entry requirement creates operational overhead
- Missing: No automatic invoice integration — charges generated but not auto-attached to rent invoices

> ⚠️ **Ambiguous in Documentation**: Whether utility charges auto-link to rent invoices or require manual consolidation is not clear from the page code.

#### Simplification Opportunities

1. **Bulk meter input**: Photo/OCR of meter readings instead of manual entry
2. **Auto-suggest period**: Default to current month's billing period
3. **Flat-rate shortcut**: "All units pay Rp 100K for water" — skip meter readings entirely
4. **Auto-attach to invoices**: Utility charges should auto-appear on next month's rent invoice

---

### 🔹 Feature 28: Document Templates

#### Documentation Source
- **Document**: `navigation-config.ts` line 157; `DocumentTemplates.tsx`
- **Section**: Sidebar item "Template Dokumen"
- **Reference**: Uses `document_templates` table. 7 categories defined in `TEMPLATE_CATEGORIES`.

#### Current Flow (Actual)

| Role | Action | Page / Endpoint |
|------|--------|-----------------|
| 🏠 Merchant | Navigate to Document Templates | `/merchant/document-templates` |
| 🏠 Merchant | Filter by category (7 categories: lease_contract, house_rules, move_in_checklist, inspection_report, eviction_notice, payment_reminder, other) | Category dropdown |
| 🏠 Merchant | View templates grouped by category with version + last update date | Template grid |
| 🏠 Merchant | Create custom template: name, description, category, content, variables | Editor dialog (`DocumentTemplateEditor`) |
| 🏠 Merchant | Edit custom template | Edit action |
| 🏠 Merchant | Duplicate system template to create merchant-specific version | Duplicate action |
| 🏠 Merchant | Use/fill template: substitute variables with actual values | `DocumentFillDialog` |
| 🏠 Merchant | Delete custom template | Delete action |

#### State Machine

> ❌ No explicit state machine defined. Templates are simple CRUD with `is_system` flag (system templates are read-only, merchant templates are editable).

#### UX Friction Analysis

- **System vs custom templates** is a good pattern — system templates provide starting points
- **Variable substitution** enables mail-merge-like document generation
- **7 categories** is comprehensive but may overwhelm — a typical kos owner uses 2-3 at most (lease contract, house rules, payment reminder)
- **No PDF export** visible in current code — generated documents are in-app only
- **Version tracking** (`version` field, `updated_at` display) adds unnecessary complexity for most users

#### Business Impact

- Standardizes legal documents — reduces risk from ad-hoc contracts
- Reduces time to create recurring documents (payment reminders, inspection reports)
- For kos owners who use handwritten contracts, this is a significant upgrade

#### Simplification Opportunities

1. **Pre-filled templates** ready to use out of box (e.g., standard kos contract in Indonesian)
2. **One-click PDF export** for offline printing/sharing
3. **Hide version tracking** — show only "terakhir diperbarui" without version number

---

### 🔹 Feature 29: API & Integration

#### Documentation Source
- **Document**: `navigation-config.ts` line 159; `ApiIntegration.tsx`
- **Section**: Sidebar item "API & Integrasi"
- **Reference**: Uses `api_keys`, `webhooks`, `webhook_logs` tables. 8 webhook event types in `WEBHOOK_EVENTS`.

#### Current Flow (Actual)

| Role | Action | Page / Endpoint |
|------|--------|-----------------|
| 🏠 Merchant | Navigate to API & Integration | `/merchant/api-integration` |
| 🏠 Merchant | Tab "API Keys": Create key (name, scopes) → receive plain key (shown once) | API Keys tab |
| System | Hash key, store prefix only | `api_keys` table |
| 🏠 Merchant | Copy key immediately (warning: not shown again) | Copy button |
| 🏠 Merchant | Revoke existing key | Trash button |
| 🏠 Merchant | Tab "Webhooks": Add endpoint URL + select events | Webhooks tab |
| System | Send HMAC-SHA256 signed payloads to URL | Webhook delivery |
| System | Auto-disable endpoint after 10 delivery failures | `failure_count` threshold |
| 🏠 Merchant | View delivery logs per webhook | Eye button |
| 🏠 Merchant | Tab "Dokumentasi": Inline REST API docs (8 endpoints, format, rate limit) | Docs tab |

#### State Machine

API keys have `is_active` boolean (active → revoked). Webhooks have implicit active/disabled based on `failure_count`.

> ❌ No explicit state machine defined in `state-machines.ts`.

#### UX Friction Analysis

- **Developer-oriented feature** — entirely inappropriate for target user (Ibu Sari, 47, kos owner)
- **Key shown once** pattern is security-correct but confusing for non-technical users
- **HMAC-SHA256 signature** in docs — enterprise terminology
- **Rate limiting (1000/hr)** — irrelevant information for kos owners
- **Inline docs** are a good practice for developers but wasted on kos target segment
- **8 REST endpoints documented** with JSON response format examples

#### Business Impact

- Zero revenue impact for typical kos owner
- Enables third-party integrations for tech-savvy property managers or accounting software integration
- This is a power-user/developer feature that belongs behind "Advanced" settings

#### Simplification Opportunities

1. **Hide entirely** from sidebar for merchants without developer profile or without any API keys
2. **Move to Settings** as a sub-section, not a top-level navigation item
3. **Pre-built integrations** (e.g., "Connect to Jurnal.id") instead of raw API key management

---

### 🔹 Feature 30: Staff Management

#### Documentation Source
- **Document**: `navigation-config.ts` line 160; `StaffManagement.tsx`; `permissions.ts`
- **Section**: Sidebar item "Manajemen Staff"
- **Reference**: Uses `merchant_staff`, `staff_permissions` tables. 3 roles defined in `STAFF_ROLE_LABELS`. 16 permissions in `PERMISSION_KEYS` across 4 groups in `PERMISSION_GROUPS`.

#### Current Flow (Actual)

| Role | Action | Page / Endpoint |
|------|--------|-----------------|
| 🏠 Merchant | Navigate to Staff Management | `/merchant/staff` |
| 🏠 Merchant | View staff cards (name, role badge, email, phone, active status, property count) | Card grid |
| 🏠 Merchant | Click "Undang Staff" → Fill: name, email, phone (optional), role (caretaker/property_manager/accountant) | Invite dialog |
| System | Create staff record with default permissions for role | `DEFAULT_PERMISSIONS` mapping |
| 🏠 Merchant | Click "Izin" on staff card → Toggle 16 individual permissions across 4 groups | `PermissionsDialog` |
| 🏠 Merchant | Save granular permissions | Save button |
| 🏠 Merchant | Deactivate staff | "Nonaktifkan" button |

#### Permission Model (from `permissions.ts`)

- **3 Roles**: Caretaker (6 default perms), Property Manager (15 default perms), Accountant (4 default perms)
- **4 Permission Groups**: Unit (2), Maintenance (4), Keuangan (6), Operasional (4)
- **16 Total Permissions**: `units.view`, `units.edit_status`, `maintenance.view`, `maintenance.accept`, `maintenance.assign_vendor`, `maintenance.log_activity`, `expenses.view`, `expenses.create`, `expenses.approve`, `invoices.view`, `invoices.create`, `collections.send_letter`, `financial_reports.view`, `tenants.view`, `contracts.view`, `settings.view`

#### State Machine

Staff have `is_active` boolean.

> ❌ No explicit state machine defined in `state-machines.ts`.

#### UX Friction Analysis

- **Well-designed RBAC** for multi-staff operations — role defaults + granular overrides is the right pattern
- **16 permissions across 4 groups** is manageable via collapsible sections with switches
- **Invite flow uses placeholder `user_id`** (line 58: `crypto.randomUUID()`) — ⚠️ this suggests email-based lookup is not yet implemented; current invite may not actually connect to a real user account
- **Default permissions per role** reduce setup time — most merchants won't touch individual toggles
- **For single-owner kos**: This entire page is irrelevant — there's no staff to manage

> ⚠️ **Ambiguous in Documentation**: The invite flow uses `crypto.randomUUID()` as placeholder user_id (StaffManagement.tsx line 58). It's unclear whether the production flow looks up users by email or creates stub accounts. The comment "should lookup by email" confirms this is incomplete.

#### Business Impact

- Essential for kos chains with caretakers at each property
- Prevents unauthorized financial actions via permission controls
- For single-owner operations, this is unused overhead

#### Simplification Opportunities

1. **Auto-hide** when merchant has no staff (show only after first staff invite)
2. **Fix invite flow** — implement email-based user lookup or invitation email
3. **Role-only mode** for simple setups — skip granular permissions, just assign role with defaults

---

### 🔹 Feature 31: InsightsHub (Analytics Landing)

#### Documentation Source
- **Document**: `navigation-config.ts` line 158; `InsightsHub.tsx`
- **Section**: Sidebar item "Alat"
- **Reference**: No activity diagram. Card-based hub linking to 9 sub-tools.

#### Current Flow (Actual)

| Role | Action | Page / Endpoint |
|------|--------|-----------------|
| 🏠 Merchant | Navigate to InsightsHub | `/merchant/insights` |
| 🏠 Merchant | View "Performa" section (3 cards): Template Laporan, Portofolio Komparatif, Pusat Dokumen | Performance cards |
| 🏠 Merchant | View "Intelijen AI" section (6 cards): Prediksi ML, Strategi DSS, Tren Pasar, Risiko Keuangan, Skor Penyewa, Kualitas Data | Intelligence cards |
| 🏠 Merchant | Click any card → Navigate to specific tool page | `useNavigate()` |

#### State Machine

> ❌ No state machine. This is a navigation hub — stateless landing page.

#### UX Friction Analysis

- **Card-based navigation hub** is a clean information architecture pattern — groups related tools visually
- **"Standar" vs "Premium" tier badges** clearly indicate feature availability
- **9 linked sub-tools** from a single page — potential for "click and get lost" navigation
- **No breadcrumb back** to InsightsHub from sub-tool pages
- **Naming**: "Alat" (Tools) is vague as a sidebar label — "Alat & Intelijen" is the page title but sidebar says "Alat"
- **Overwhelming for non-tech merchants**: "Prediksi ML", "Strategi DSS", "Risiko Keuangan" are enterprise/academic terminology

#### Business Impact

- Good organizing principle for advanced analytics features
- Tiered badging prepares for subscription upsell
- For kos owners, only 1-2 of the 9 tools may ever be used (reports, maybe comparative)

#### Simplification Opportunities

1. **Show only tier-appropriate tools** — hide Premium tools for non-Premium subscribers
2. **Rename to simpler labels**: "Prediksi ML" → "Prediksi Pendapatan", "Strategi DSS" → "Saran Otomatis"
3. **Add breadcrumb navigation** to sub-tool pages for easy return to hub

---

### 🔹 Feature 32: Tenant Screening

#### Documentation Source
- **Document**: `TenantScreening.tsx`; `navigation-config.ts` (activePattern linked from Tenants section)
- **Section**: Dedicated page linked from tenant-related navigation
- **Reference**: Uses `tenant_screenings` table (inferred from `useScreenings` hook). Grade system: green/yellow/red. Status: pending/scored/approved/rejected.

#### Current Flow (Actual)

| Role | Action | Page / Endpoint |
|------|--------|-----------------|
| 🏠 Merchant | Navigate to Tenant Screening | `/merchant/tenant-screening` |
| 🏠 Merchant | Filter by grade (Green/Yellow/Red) and status (Menunggu/Dinilai/Disetujui/Ditolak) | Filter dropdowns |
| 🏠 Merchant | Click "Screening Baru" → Fill form: candidate name, phone, occupation, employer, income, previous landlord info, guarantor info | `TenantScreeningForm` |
| System | Score candidate → assign grade (green/yellow/red) | Scoring logic |
| 🏠 Merchant | View screening result: score card with grade | `ScreeningScoreCard` |
| 🏠 Merchant | Approve or reject screened tenant | `ScreeningApprovalActions` |
| 🏠 Merchant | View detail: occupation, employer, income, previous landlord, guarantor, rental notes | Detail dialog |

#### State Machine

Implicit 4-state flow: `pending → scored → approved | rejected`

> ❌ No explicit state machine defined in `state-machines.ts`. States are string values on the `status` field.

#### UX Friction Analysis

- **Green/Yellow/Red grading** is intuitive — visual traffic-light system matches mental model
- **Pre-screening before contract** is a good safety net — prevents problematic tenancies
- **Form is comprehensive** but lengthy: candidate info + employment + previous landlord + guarantor = 10+ fields
- **Scoring algorithm** is opaque — merchant sees grade but not the scoring criteria
- **For informal kos**: "I'll just interview them" — formal screening is over-process
- **No integration with contract creation** — approved screening doesn't auto-populate contract tenant data

#### Business Impact

- Reduces bad tenant risk — prevents payment defaults and property damage
- Data-driven decision replaces gut feeling — valuable for remote property management
- For owner-occupied kos who personally interview tenants, this adds bureaucracy

#### Simplification Opportunities

1. **Quick screen mode**: Just candidate name + income + previous landlord → auto-grade
2. **Show scoring criteria** — transparency builds trust in the grade
3. **Link to contract creation** — "Approved → Create Contract" button auto-fills tenant data

---

## 3. End-to-End Merchant Journeys

### A. Onboarding Journey

| Step | Action | Page | Time | Blocking? |
|------|--------|------|------|-----------|
| 1 | Register | `/register` | 2 min | No |
| 2 | Complete profile | `/merchant/profile` | 5 min | No |
| 3 | Set addresses | `/merchant/profile` | 3 min | No |
| 4 | Upload docs (KTP, SIUP, NPWP) | `/merchant/profile` | 10 min | No |
| 5 | OCR processing | Auto | 1 min | No |
| 6 | **Wait for admin verification** | — | **Unknown** | **YES** |
| 7 | Choose subscription | `/merchant/subscription` | 2 min | No |
| 8 | Add property | `/merchant/properties` | 5 min | No |
| 9 | Set property address | Property detail | 3 min | No |
| 10 | Add units | Property detail | 2 min/unit | No |
| 11 | Invite tenant | `/merchant/tenants/invite` | 2 min | No |
| 12 | **Wait for tenant acceptance** | — | **Unknown** | **YES** |
| 13 | Create contract | `/merchant/contracts` | 5 min | No |
| 14 | Sign contract | Contract detail | 2 min | No |
| 15 | **Wait for tenant signature** | — | **Unknown** | **YES** |
| 16 | Create invoice | `/merchant/invoices` | 3 min | No |
| 17 | Send invoice | Invoice detail | 1 min | No |
| 18 | **Wait for tenant payment** | — | **Unknown** | **YES** |
| 19 | Verify payment | `/merchant/payments` | 2 min | No |

**Total Steps**: 19
**Blocking Steps**: 4 (Admin verification, tenant acceptance, tenant signature, tenant payment)
**Active Merchant Time**: ~50 minutes

> ❌ **Not Defined in Current System Documentation**: Calendar time to first revenue cannot be calculated because admin verification turnaround time, tenant acceptance time, tenant signature time, and tenant payment time are all undefined in system documentation.

**Assessment**: ⚠️ The 4 blocking steps create a poor first-run experience. The merchant invests 50+ minutes of active setup time across multiple sessions before seeing any financial return.

### B. Daily Operational Journey

A typical merchant's daily routine requires touching these pages:

| # | Action | Page | Clicks from Dashboard |
|---|--------|------|-----------------------|
| 1 | Check dashboard overview | `/merchant` | 0 |
| 2 | Check overdue alerts | Dashboard alerts widget | 0 |
| 3 | Verify new payments | `/merchant/payments` | 1 |
| 4 | Send overdue reminders | `/merchant/invoices` (or auto) | 1-2 |
| 5 | Check maintenance requests | `/merchant/maintenance` | 1 |
| 6 | Check occupancy board | `/merchant/occupancy-board` | 1 |

**Minimum daily pages**: 4-5 (Dashboard, Payments, Invoices, Maintenance, Occupancy)
**Total clicks**: 4-5 from Dashboard

**Assessment**: ✅ Acceptable — the dashboard consolidates alerts, and the sidebar provides 1-click access to all daily pages.

> 🧩 **Assumption (Low Confidence)**: The claim that `merchantDashboardService.ts` uses "10 parallel queries" was stated in the original document but has not been verified against the actual source code in this revision. The number of parallel queries may differ.

**But**: If automated reminders are configured (Feature 16), step 4 is eliminated. If OCR auto-match works (Feature 15), step 3 becomes a quick confirmation. **The automation features genuinely reduce daily workload.**

### C. Critical Scenario Journeys

#### Scenario 1: Tenant Payment (Happy Path)

| Step | Actor | Action | Friction |
|------|-------|--------|----------|
| 1 | System | Auto-generate invoice | None |
| 2 | System | Send to tenant | None |
| 3 | Tenant | Transfer + upload proof | Requires tenant action |
| 4 | System | OCR + auto-match | None |
| 5 | Merchant | Confirm payment | 1 click |
| 6 | System | Update invoice → paid | None |

**Assessment**: ✅ Good — 1 merchant click required. Auto-match does the heavy lifting.

#### Scenario 2: Late Payment

| Step | Actor | Action | Friction |
|------|-------|--------|----------|
| 1 | System | Invoice overdue (past due date) | None |
| 2 | System | Day 1: Send friendly email | Auto |
| 3 | System | Day 7: Send firm SMS | Auto |
| 4 | System | Day 15: Send urgent WhatsApp | Auto |
| 5 | System | Day 15: Create collections case | Auto |
| 6 | System | Escalate invoice to `escalated` | Auto |
| 7 | Merchant | Open collections, contact tenant | Manual |
| 8 | Merchant | Choose strategy (plan/write-off/escalate) | Manual |

**Assessment**: ✅ Good automation — merchant only intervenes at day 15+ when personal contact is needed. The automated escalation ladder handles 80% of cases.

#### Scenario 3: Tenant Complaint (Maintenance)

| Step | Actor | Action | Friction |
|------|-------|--------|----------|
| 1 | Tenant | Submit maintenance request | App/web |
| 2 | Merchant | Receive notification | — |
| 3 | Merchant | Decide: self-handle or assign vendor | 2-3 clicks |
| 4a | Merchant | Self-handle → mark completed | 1 click |
| 4b | Vendor | Accept job → work → complete | Multi-step |
| 5 | Tenant | Leave review | 1 click |

**Assessment**: ✅ Good for self-handled. ⚠️ Complex for vendor-assigned (vendor must accept, update progress, complete — 3+ steps before merchant can close).

#### Scenario 4: Full Occupancy (Waiting List)

| Step | Actor | Action | Friction |
|------|-------|--------|----------|
| 1 | Prospect | Inquires about room | Phone/WhatsApp (outside system) |
| 2 | Merchant | Add to waiting list | 5 fields minimum |
| 3 | Merchant | Update status: interested → applied | 1 click |
| 4 | — | Wait for vacancy | — |
| 5 | Merchant | Send offer (select unit, 7-day expiry) | 2-3 clicks |
| 6 | Prospect | Accept offer | Outside system (manual update) |
| 7 | Merchant | Create contract | See Scenario: Onboarding |

**Assessment**: ⚠️ The waiting list adds formality to what's usually a WhatsApp conversation. The 6-state machine (interested → applied → waitlisted → offered → accepted → rejected) over-formalizes an informal process.

#### Scenario 5: Merchant Expanding (Adding Units)

| Step | Actor | Action | Friction |
|------|-------|--------|----------|
| 1 | Merchant | Navigate to property detail | 1 click |
| 2 | Merchant | Click "Add Unit" | 1 click |
| 3 | Merchant | Fill: number, type, floor, rent | 4 fields |
| 4 | System | Auto-update property unit counts | Trigger |
| 5 | System | Update occupancy metrics | Auto |

**Assessment**: ✅ Simple and fast — 2 clicks + 4 fields. Auto-triggers handle the rest.

---

## 4. UX Risk Map

### 🔴 High Risk (Frustration, Confusion, Revenue Loss)

| Risk | Feature | Impact | Evidence |
|------|---------|--------|----------|
| Admin verification blocks all operations | Onboarding | Revenue loss during wait | Diagram 1: pending → verified requires admin action |
| 24 sidebar items overwhelm new users | Navigation | Feature abandonment | `navigation-config.ts`: 4 groups, 24 items |
| Payment verification bottleneck at scale | Payments | Revenue recognition delay | Diagram 7: merchant must confirm every payment |
| 7-state collections lifecycle confuses merchants | Collections | Ignored feature, uncollected revenue | `COLLECTIONS_CASE_TRANSITIONS`: 7 states |
| 4 state machines for move-out process | Move-Out | Merchants bypass system, do offline | 4 machines in `state-machines.ts` |

### 🟡 Medium Risk

| Risk | Feature | Impact | Evidence |
|------|---------|--------|----------|
| Email-only tenant invitation | Tenants | Failed invitations (no email) | Diagram 5: email-based flow |
| 9 amendment states for contract changes | Renewals | Feature avoidance | `AMENDMENT_STATUS_TRANSITIONS`: 9 states |
| Reconciliation jargon | Payments | Confusion | Page name: "Resolusi & Rekonsiliasi" |
| Expense approval for single-owner ops | Expenses | Unnecessary clicks | `EXPENSE_APPROVAL_TRANSITIONS` |
| Dynamic pricing complexity | Pricing | Feature never used | 5 rule types + priority ordering |

### 🟢 Low Risk

| Risk | Feature | Impact | Evidence |
|------|---------|--------|----------|
| Unit status transitions | Properties | 3 states, clear logic | `UNIT_STATUS_TRANSITIONS`: available/occupied/maintenance |
| Financial reports | Reports | Simple read-only view | 3 charts |
| Automated reminders | Reminders | Set-and-forget configuration | Cron-based, auto-escalation |
| AI chatbot support | Support | Self-service, no merchant burden | AI-driven responses |
| Dashboard health badges | Dashboard | At-a-glance understanding | Green/Yellow/Red system |

---

## 5. Over-Complexity Detection

### Enterprise-Level Processes Unnecessary for Small Boarding Houses

| Process | Complexity | Why Over-Engineered | Target Appropriate At |
|---------|-----------|--------------------|-----------------------|
| 31 state machines across entities | Very High | A 10-room kos needs at most 5 state concepts (vacant, occupied, payment pending, payment received, maintenance) | 100+ units, commercial leases |
| 7-state collections escalation | High | For a missed Rp 800K payment, "kirim WhatsApp" is the entire process | 50+ units with payment issues |
| 4 state machines for move-out | High | Kos owner walks to room, checks damage, gives cash back | Formal apartment complexes |
| 9-state amendment negotiation | High | "Pak, sewa naik jadi Rp 900K ya" — "Ok" | Commercial lease negotiations |
| 3-tier payment reconciliation | High | Manual bank transfer matching for < 30 payments/month | 100+ payments/month |
| ~14 AI/ML edge functions | Very High | Occupancy forecast for a 10-room kos with 90% occupancy year-round | Portfolio investors |
| 5-type dynamic pricing engine | High | Most kos: fixed price per room type | Hotels, seasonal properties |
| Insurance policies + claims module | Medium | Most kos owners have property-level insurance, not unit-level | Large commercial properties |
| Disaster risk profiles | Medium | Risk zone assessment for a kos in a residential neighborhood | Properties in flood zones |
| Expense approval workflow | Medium | Owner approving their own expense | Multi-staff operations |

### Flows That Add No Revenue But Increase Cognitive Load

| Flow | Cognitive Cost | Revenue Impact |
|------|---------------|----------------|
| Viewing DSS recommendations → accept → measure | 5+ clicks | Zero direct revenue |
| Managing dynamic pricing rules | 10+ fields per rule | Negligible for small operations |
| Reconciliation manual matching | 3-4 clicks per payment | Zero — same payment gets recorded either way |
| Data quality checks | Read-only, no action needed | Zero |
| API & Integration page | Developer-focused | Zero for kos owner |

---

## 6. Scalability UX Check

### 5 Units (Typical Ibu Kos)

| Feature | UX Assessment | Verdict |
|---------|--------------|---------|
| Dashboard | Shows occupancy for 1 property, 5 units — simple | ✅ Good |
| Navigation | 24 sidebar items — 19 are irrelevant | ❌ Overwhelming |
| Invoices | 5 invoices/month — manageable | ✅ Good |
| Payments | 5 verifications/month — quick | ✅ Good |
| Collections | Rarely needed — 0-1 cases | ⚠️ Feature bloat |
| Reconciliation | Auto-match handles everything | ✅ Good |
| Maintenance | 1-2 requests/month — simple | ✅ Good |
| Financial Reports | 1 property, clear P&L | ✅ Good |
| Dynamic Pricing | Unnecessary | ❌ Feature bloat |
| AI/DSS | Not enough data for meaningful insights | ❌ Feature bloat |
| Waiting List | "I'll text them on WhatsApp" | ⚠️ Unnecessary |

**Overall at 5 units**: ⚠️ System works but 60% of features are irrelevant. Core features (dashboard, invoices, payments, maintenance) are solid. The rest creates noise.

### 20 Units (Growing Kos Operation)

| Feature | UX Assessment | Verdict |
|---------|--------------|---------|
| Dashboard | Multi-property view becomes valuable | ✅ Good |
| Navigation | Start using Operasional + Keuangan groups | ✅ Acceptable |
| Invoices | 20 invoices/month — auto-generate critical | ✅ Essential |
| Payments | 20 verifications — batch confirmation needed | ⚠️ Needs batch UI |
| Collections | 2-3 cases/month — collections page useful | ✅ Good |
| Reconciliation | Manual review for 2-3 mismatches — OK | ✅ Good |
| Maintenance | 3-5 requests/month — vendor assignment valuable | ✅ Good |
| Financial Reports | Revenue by property comparison — valuable | ✅ Essential |
| Dynamic Pricing | Starting to make sense | ⚠️ Optional |
| AI/DSS | Churn prediction becoming useful | ⚠️ Nice-to-have |
| Waiting List | Useful if in high-demand area | ✅ Useful |

**Overall at 20 units**: ✅ System shines here. Most features become relevant. The complexity matches the operational need.

### 100 Units (Professional Property Management)

| Feature | UX Assessment | Verdict |
|---------|--------------|---------|
| Dashboard | High-level aggregates only | ⚠️ Needs per-property drill-down |
| Navigation | All 24 items relevant, may need role-based customization | ⚠️ Needs filtering |
| Invoices | 100 invoices/month — bulk operations critical | ⚠️ Needs bulk actions |
| Payments | 100 verifications — auto-confirm essential | ❌ Manual confirm doesn't scale |
| Collections | 10-15 cases — formal workflow justified | ✅ Essential |
| Reconciliation | 3-tier matching fully utilized | ✅ Essential |
| Maintenance | 15-20 requests/month — vendor management critical | ✅ Essential |
| Financial Reports | Multi-property portfolio analysis — essential | ✅ Essential |
| Dynamic Pricing | Revenue optimization at scale — justified | ✅ Valuable |
| AI/DSS | Sufficient data for ML models — predictions useful | ✅ Valuable |
| Waiting List | High occupancy = active waiting list | ✅ Essential |

**Overall at 100 units**: ⚠️ System has the features but **lacks bulk operation UI** (batch invoice send, batch payment confirm, bulk unit management). The one-by-one flow breaks at scale.

---

## 7. Final UX Verdict

### ⚠️ Needs Refinement — UX Over-Engineered for Primary Target, Under-Equipped for Scale

**Reasoning**:

1. **Target user mismatch**: The system is built with enterprise-grade workflows (31 state machines, ~14 AI edge functions, 3-tier reconciliation) targeting a user base of non-technical boarding house owners who think in terms of "siapa yang belum bayar?" The cognitive load ratio is inverted — the simplest operations (collect rent, track occupancy) are embedded in the most complex processes.

2. **Core features are solid**: Dashboard with health badges, automated reminders, auto-match payments, financial reports — these 4 features alone would satisfy 80% of merchant needs. They work well and are properly integrated.

3. **Bloat suppresses core value**: The excellent core is buried under 24 sidebar items and features like dynamic pricing, DSS advisory, disaster risk profiles, and API integration that a typical Ibu Kos will never use.

4. **Onboarding is a critical bottleneck**: Admin verification blocking prevents any value delivery for an unknown duration. This is the single highest churn risk in the system.

5. **Automation saves the UX**: The automated reminder system (Feature 16), auto-match payments (Feature 15), and auto-generate invoices (Feature 6) are the best UX decisions in the system. They reduce daily merchant workload significantly.

6. **Scale readiness**: At 100 units, the system has all the features but lacks bulk operations. The one-by-one confirmation, creation, and management flows don't scale without batch processing UI.

### Recommended Priority Actions

| Priority | Action | Impact | Effort |
|----------|--------|--------|--------|
| P0 | Allow limited access during admin verification | Prevents onboarding churn | Medium |
| P0 | Add WhatsApp-based tenant invitation | Matches Indonesian communication norms | Low |
| P1 | Reduce visible sidebar to 8 items for < 20 unit merchants | Reduces cognitive overload | Low |
| P1 | Auto-confirm payments with high OCR confidence | Eliminates manual bottleneck | Low |
| P2 | Add bulk operations (batch confirm, batch send) | Enables 100+ unit scale | Medium |
| P2 | Create "Quick Start" wizard: Property → Unit → Tenant → Contract → Invoice | Reduces onboarding from 19 steps to 5 | Medium |
| P3 | Hide advanced features (Dynamic Pricing, DSS, API) behind Progressive Disclosure | Reduces feature bloat for small operators | Low |

---

## 8. Hallucination Risk Self-Check

### Audit Integrity Check

| Metric | Value |
|--------|-------|
| Total Features Identified from Documentation | **32** (22 from Diagrams 1-22 in `merchant_activity_diagram.md` + `role-actions.ts`; 10 from `navigation-config.ts` sidebar items + page implementations) |
| Total Features Analyzed | **32** |
| Features Without Source Reference | **0** |
| Features from Activity Diagrams | 22 (Features 1-22) |
| Features from Navigation/Page Code Only | 10 (Features 23-32) — no activity diagrams exist for these |
| Audit Integrity | ✅ All features have traceable sources |

### Assumptions Used

| # | Assumption | Confidence | Context |
|---|-----------|------------|---------|
| 1 | Onboarding churn rate "40-60%" | 🧩 Low | Based on general SaaS benchmarks, not SiHuni data |
| 2 | Mamikos PMS competitor benchmark | 🧩 Low | No competitor documentation exists in system |
| 3 | "10 parallel queries" in merchantDashboardService | 🧩 Low | Stated in original document, not re-verified against source code |
| 4 | Referral state machine (pending → active → completed) | 🧩 Low | Inferred from Diagram 13; no `REFERRAL_STATUS_TRANSITIONS` in code |

### Items Marked "Not Defined in Current System Documentation"

| # | Item | Section |
|---|------|---------|
| 1 | Admin verification turnaround time | §1.2, §3A Step 6 |
| 2 | Calendar time to first revenue | §3A |
| 3 | Push notification auto-trigger on payment receipt | §2 Feature 7 |

### Items Marked "Ambiguous in Documentation"

| # | Item | Section |
|---|------|---------|
| 1 | Manual tenant creation capability | §2 Feature 5 |
| 2 | ML edge function exact count (10 vs 11, OCR categorization) | §2 Feature 12 |
| 3 | Utility charges auto-linking to rent invoices | §2 Feature 27 |
| 4 | Staff invite email-based user lookup vs stub account creation | §2 Feature 30 |

### Documentation Discrepancies Found

| # | Discrepancy | Documents | Details |
|---|-------------|-----------|---------|
| 1 | Lease Amendment states: Diagram vs Code | `merchant_activity_diagram.md` Diagram 19 vs `state-machines.ts` `AMENDMENT_STATUS_TRANSITIONS` | Diagram shows 5 simplified states; code implements 9 states including tenant_reviewing, negotiating, agreed, signing |
| 2 | Collections Case: Diagram 11 reference vs Code | `merchant_activity_diagram.md` Diagram 11 reference table vs `state-machines.ts` `COLLECTIONS_CASE_TRANSITIONS` | Some diagram references show simplified 3-state; code has 7 states (initiated, reminder_sent, follow_up, in_progress, escalated, legal, resolved) |
| 3 | Staff invite uses placeholder user_id | `StaffManagement.tsx` line 58 | `crypto.randomUUID()` used as placeholder. Comment states "should lookup by email". Production invite flow is incomplete |

### Coverage Note

Features 23-32 do not have activity diagrams in `merchant_activity_diagram.md` (which covers Diagrams 1-23, where Diagram 23 is admin-only). Their documentation source is `navigation-config.ts` sidebar entries + actual page implementations in `src/pages/merchant/*.tsx`. Flow tables for these features are derived from reading the page source code directly, not from specification documents.

---

## Appendix: Corrected Feature Count Summary

| Category | Count | Source | Verification Status |
|----------|-------|--------|---------------------|
| Sidebar navigation items (merchant) | **24** | `navigation-config.ts` lines 118-163 (3+4+5+12) | ✅ Verified |
| State machines | **31** | `state-machines.ts` — all exported `*_TRANSITIONS` constants | ✅ Verified (counted individually) |
| Features assessed in this document | **32** | 22 from activity diagrams + 10 from navigation/page code | ✅ Complete |
| Amendment states | **9** | `AMENDMENT_STATUS_TRANSITIONS` lines 217-227 | ✅ Verified |
| Collections Case states | **7** | `COLLECTIONS_CASE_TRANSITIONS` lines 196-204 | ✅ Verified |
| ML/AI edge functions | **~14** | Diagram 12 (10 ML + 4 DSS, with OCR overlap) | ⚠️ Approximate — categorization boundaries ambiguous |
| OCR-related functions | **7** | Diagram 12 (7 document types) | ⚠️ Per diagram, not independently verified |
| Activity diagrams | **23** | `merchant_activity_diagram.md` | ✅ Per document |
| Primary merchant actions | **5** | `role-actions.ts` | ✅ Verified |
| Staff permissions | **16** | `permissions.ts` `PERMISSION_KEYS` | ✅ Verified |
| Staff roles | **3** | `permissions.ts` `STAFF_ROLE_LABELS` | ✅ Verified |
| Document template categories | **7** | `DocumentTemplates.tsx` `TEMPLATE_CATEGORIES` | ✅ Verified |
| Webhook event types | **8** | `ApiIntegration.tsx` `WEBHOOK_EVENTS` | ✅ Verified |
| InsightsHub sub-tools | **9** | `InsightsHub.tsx` (3 performance + 6 intelligence) | ✅ Verified |
| Expense categories | **8** | Diagram 17 | ⚠️ Per diagram |
| Dynamic pricing rule types | **5** | Diagram 21 | ⚠️ Per diagram |
| Collections resolution types | **4** | Diagram 20 (paid_in_full, payment_plan, write_off, eviction) | ⚠️ Per diagram |

---

*Document revised with strict source traceability. All 32 features mapped to exact documentation sources (22 from activity diagrams, 10 from navigation config + page implementations). 4 assumptions explicitly labeled with low confidence. 3 items marked as "Not Defined". 4 items marked as "Ambiguous". 3 documentation discrepancies flagged. 0 features without source reference.*
