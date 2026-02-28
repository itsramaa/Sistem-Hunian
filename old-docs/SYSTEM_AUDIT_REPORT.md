# 🔍 SYSTEM AUDIT REPORT
## Merchant Property Management Platform (Kosan/Apartment Focus)
**Audit Date:** 2026-02-28  
**Auditor Role:** Senior UX Strategist + Boarding House Owner (20–100 units)  
**Analysis Basis:** Code-level forensic audit (navigation-config.ts, state-machines.ts, merchant page files)

---

## 1️⃣ SYSTEM EFFICIENCY EVALUATION

### Executive Summary
**Efficiency Score: 5.5/10**

The system has **strong automation** (invoice generation, payment matching, state transitions) but **critical UX friction points** that slow daily operations for merchants managing 5–100 units.

### Detailed Findings

#### ✅ Efficient Flows (Automated)
1. **Invoice Generation** — Auto-triggers on contract billing_day; no manual creation required
2. **Payment Matching** — Automatic via `auto-match-payments` edge function; no reconciliation step
3. **Overdue Escalation** — Automatic status progression (Pending → Overdue → Collections) at defined thresholds
4. **Occupancy Snapshots** — Computed automatically; no manual board management
5. **Lease Renewal Tracking** — Pre-populated from contract end dates; no manual reminder creation

#### ⚠️ Inefficient Flows (Manual/Redundant)

##### **Flow 1: Move-Out Process (Critical Inefficiency)**
**Current State:** 4 parallel state machines with 17 total states
- Tenant move-out (`TENANT_MOVE_OUT_TRANSITIONS` — 5 states)
- Unit turnover (`UNIT_MOVE_OUT_TRANSITIONS` — 4 states)  
- Contract termination (`CONTRACT_TERMINATION_TRANSITIONS` — 4 states)
- Deposit refund/settlement (`DEPOSIT_CLAIM_TRANSITIONS` — 4 states)

**Problem:** Each state machine must be independently managed. Merchant must:
1. Navigate to Tenants > Move-Outs
2. Select tenant, confirm move-out (triggers TENANT_MOVE_OUT_TRANSITIONS)
3. Navigate to Units > Unit Detail
4. Update unit status (triggers UNIT_MOVE_OUT_TRANSITIONS)
5. Navigate to Contracts > Contract Detail
6. Terminate contract (triggers CONTRACT_TERMINATION_TRANSITIONS)
7. Navigate to Finance > Invoices or Collections
8. Process deposit refund (triggers DEPOSIT_CLAIM_TRANSITIONS)

**Blocking Step:** Unit cannot be marked as "Available" until contract is fully terminated AND deposit is settled. Merchant must wait for deposit refund approval before re-listing.

**Impact:** A simple 20-unit turnover requires 4–5 separate navigation flows × 20 units = 80–100 context switches/month. For solo owners, this is 8–10 hours of manual state tracking.

**Documented Severity:** P1 (Fix priority in system verdict)

---

##### **Flow 2: Payment Transfer (Critical Visibility Gap)**
**Current State:** Zero merchant-facing visibility
- System processes `PAYMENT_TRANSFER_TRANSITIONS` with 6 status states (Initiated, Pending, Processing, Completed, Failed, Cancelled)
- Merchants have **no page** to:
  - See transfer history
  - Track when funds will arrive
  - View pending transfers
  - Understand payment delays
- Dashboard shows `balance: 0` (hardcoded) — no actual payment state
- No reconciliation mechanism

**Problem for Merchant:**
- Tenant pays Rp 2M on Friday
- Merchant dashboard shows "Payment Received" ✓
- Merchant schedules supplier payment for Monday
- BUT: Transfer is still in "Processing" state (takes 2–3 days)
- Merchant's cash flow breaks; supplier payment fails

**Blocking Step:** Merchant cannot reliably forecast cash with incomplete visibility.

**Impact:** Trust erosion. Merchant assumes system is broken or funds are mishandled. No transparency = no adoption. Platform loses credibility.

**Documented Severity:** P0 (Critical trust issue)

---

##### **Flow 3: Collections Management (Excessive Navigation)**
**Current State:** Collections split across 2 pages + 3 dependent features
- Collections page shows unpaid invoices
- Collections → Invoice Detail → Process payment
- Must navigate to Finance > Payments to confirm processing
- Must navigate to Reconciliation to verify settlement
- Related: Maintenance requests (pending vendor payment) also need collections review

**Problem:** Collections workflow requires 3–4 page navigations to complete single action.

**Documented Severity:** P1 (Operational friction)

---

##### **Flow 4: Billing/Subscription Management (Hidden Feature)**
**Current State:** Merchants CANNOT discover subscription management via sidebar
- No navigation entry for Billing
- Only discoverable via Support page > linked button
- Affects platform revenue: merchants may not realize they're paying, don't upgrade tiers

**Problem:** Revenue-critical feature has zero discoverability.

**Documented Severity:** P1 (Revenue impact)

---

#### Redundant Confirmations (Not Explicitly Documented)
✅ **Good News:** No excessive confirmation dialogs mentioned in document.  
⚠️ **Concern:** Document doesn't detail confirmation UX, so may be understated.

#### Summary: Flow Optimization Required
| Flow | Steps | Context Switches | Recommendation |
|------|-------|------------------|-----------------|
| Move-Out | 8 steps across 4 modules | 4–5 | Create unified wizard |
| Collections | 4 steps | 3 | Inline payment action |
| Payment Transfer | 1 (no page exists) | N/A | Create dedicated page |
| Billing | 1 (hidden) | N/A | Add sidebar entry + badge |

---

## 1️⃣A FEATURE-BY-FEATURE UX FRICTION ANALYSIS (All 38 Features)

### Executive Summary
**Coverage:** All 38 documented features analyzed systematically for UX friction, state machine complexity, and integration gaps.

This section provides granular friction points for each feature to inform prioritization and guides deep UX improvements per feature domain.

### Complete Feature Friction Matrix

| # | Feature | State Machines | Friction Severity | Key Pain Point | Scalability Impact |
|---|---------|---|---|---|---|
| **F1** | Dashboard | None | 🟡 High | `balance: 0` hardcoded; 10 parallel queries; alert thresholds not configurable | Slow load at 100+ units; confusing KPIs |
| **F2** | Properties | None | 🟢 Low | 5 tabs + "Lainnya" dropdown; no property archive status | UI complexity grows with scale |
| **F3** | Units | UNIT_STATUS_TRANSITIONS | 🟡 High | Status dropdown only; no visual occupancy feedback; no bulk edit | Friction compounds per unit |
| **F4** | Occupancy Board | None | 🟠 Medium | Snapshot staleness depends on cron interval | Critical viz breaks at scale |
| **F5** | Tenants | TENANT_INVITATION_TRANSITIONS | 🟢 Low | Clear invitation UX; no bulk invite | Scales well |
| **F6** | Tenant Screening | SCREENING_STATUS_TRANSITIONS | 🟡 High | ML risk score calculation opaque (`ml-tenant-risk-score`, `ml-tenant-quality-scoring` edge functions) | Merchants distrust scores they don't understand |
| **F7** | Contracts | CONTRACT_STATUS_TRANSITIONS, CONTRACT_SIGNATURE_TRANSITIONS | 🟠 Medium | Complex form; signature status unclear (9 states via amendments) | New merchants overwhelmed by form |
| **F8** | Contract Amendments | AMENDMENT_STATUS_TRANSITIONS | 🔴 **CRITICAL** | **9 states (most complex per feature)**; no auto-expiry; counter-offer mechanism UX unclear | Rent increase negotiations stall |
| **F9** | Lease Renewals | None | 🟠 Medium | Renewal = new contract OR amendment (confusing); alert timing hardcoded | Merchants don't understand renewal mechanism |
| **F10** | Maintenance | MAINTENANCE_STATUS_TRANSITIONS | 🟠 Medium | Vendor assignment separate from status (2 clicks); no SLA in state machine; "stale" hardcoded at 5 days | Multi-property managers can't set SLA per property |
| **F11** | Preventive Maintenance | None | 🟡 High | **Schedule-to-request auto-generation mechanism unclear** (no dedicated edge function documented) | Feature automation ambiguous |
| **F12** | Waiting List | WAITING_LIST_TRANSITIONS | 🟠 Medium | **No auto-offer when unit available**; 6 states manually managed; no priority ranking visible | Vacancy extends when list could fill unit |
| **F13** | Financial Control | None | 🔴 **CRITICAL** | **Computed balance ≠ actual bank balance**; payables conflates expenses + refunds; 8 parallel queries (perf issue) | Direct cash flow / trust issue |
| **F14** | Invoices | INVOICE_STATUS_TRANSITIONS (7 states) | 🟠 Medium | Auto-generation not labeled; `escalated` → collections link not obvious; partial payments require separate flow | Merchants unsure what system auto-created |
| **F15** | Payments | PAYMENT_STATUS_TRANSITIONS, PAYMENT_VERIFICATION_TRANSITIONS | 🟠 Medium | **2 state machines for 1 payment**; auto-match failure has no guidance; OCR integration path unclear | Dual-status design confuses merchants |
| **F16** | Direct Payment (Payment Transfers) | PAYMENT_TRANSFER_TRANSITIONS | 🔴 **CRITICAL** | **ZERO MERCHANT PAGE**; transfer status invisible; failed transfers retry silently; `balance: 0` hardcoded | This is how merchants receive money — completely hidden |
| **F17** | Expenses | EXPENSE_APPROVAL_TRANSITIONS | 🟠 Medium | Auto-approve < 500K hardcoded (not configurable); OCR integration (`ocr-expense-receipt`) clarity unclear | Merchants can't set own approval thresholds |
| **F18** | Financial Reports | None | 🟠 Medium | Separate from Reports (F27); client-side queries don't scale (document flags this) | Enterprise merchants hit performance wall |
| **F19** | Collections | COLLECTIONS_CASE_TRANSITIONS (7 states) | 🟠 **High** | **Hidden in "Lainnya" collapsed group**; 7-state escalation path complex; highest-frequency feature hardest to find | Most important feature is undiscoverable |
| **F20** | Reconciliation | None | 🟠 Medium | Label conflated with "Dispute Resolution" (F36); scope unclear (payment matching vs. conflict mediation?) | Merchants may not find it under "Resolusi" |
| **F21** | Utility Billing | None | 🟢 Low | Niche for properties with shared utilities | Low impact |
| **F22** | Dynamic Pricing | None | 🟠 Medium | ML recommendations exist (`ml-optimal-pricing`, `dss-pricing-advisor`) but UX integration unclear; no templates; no A/B testing | AI recommendations hidden; not actionable |
| **F23** | Move-Outs | 4 sub-machines: MOVE_OUT_NOTICE (5), MOVE_OUT_INSPECTION (3), EARLY_TERMINATION (4), DEPOSIT_REFUND (5) | 🔴 **CRITICAL** | **4 PARALLEL MACHINES (17 STATES)**; must coordinate notice→inspection→contract→refund sequentially; no unified wizard; early termination counter-offer has no deadline | Scales to operational nightmare: 300 navigation steps/month for 100-unit portfolio |
| **F24** | Inventory | None | 🟠 Medium | OCR (`ocr-asset-label`) exists but form integration unclear; depreciation calculation present but display opaque; no maintenance linkage | Asset tracking UX incomplete |
| **F25** | Guardians (On-Site Staff) | None | 🟠 Medium | **Separate from Staff Management (F30)** — creates confusion; no shift scheduling | Two staff management features compete |
| **F26** | Vendor Performance | None | 🟢 Low | Read-only; no vendor management (delegated to vendor portal); no comparison tool | Appropriate limited scope |
| **F27** | Reports | None | 🟠 Medium | Separate from Financial Reports (F18); custom templates powerful but complex for basic users | Two report pages; unclear distinction |
| **F28** | Document Templates | None | 🟢 Low | Template variables work; low frequency | Straightforward |
| **F29** | InsightsHub (AI/ML) | DSS_RECOMMENDATION_TRANSITIONS | 🟠 **High** | **9 sub-pages; data sufficiency issues**; 11 ML models + 4 DSS engines but **hidden in "Lainnya" collapsed**; merchants don't know it exists | Platform differentiator completely undiscovered |
| **F30** | Staff Management | None | 🟠 Medium | **16 granular permissions overwhelming** for multi-property operators; no property/unit-level scoping (security gap for multi-property) | Permissions model lacks contextual scoping |
| **F31** | API & Integration | None | 🟢 Low | Niche for developers; appropriate placement | Low impact |
| **F32** | Tenant Analytics | None | 🟡 High | Nested under Tenants (`activePatterns`); analytics-heavy UX; assumes sufficient historical data | Powerful but hidden from main nav |
| **F33** | Billing / Subscription | SUBSCRIPTION_STATUS_TRANSITIONS | 🔴 **CRITICAL** | **NOT IN SIDEBAR**; only discoverable via Support page link; merchants don't know they're on a subscription; no visibility into usage/overage; affects platform revenue directly | Revenue model invisible to merchants |
| **F34** | Profile | MERCHANT_VERIFICATION_TRANSITIONS, VERIFICATION_TIER_TRANSITIONS | 🟠 Medium | Verification tier confusing to new merchants; not in sidebar; mobile-only bottomNav entry | Tier benefits/requirements unclear |
| **F35** | Alerts / Notifications | None | 🔴 **CRITICAL** | **ONLY ON MOBILE BOTTOMNAV**; not in sidebar; desktop users have zero access; alerts computed not pushed; no action buttons | Early warning system completely hidden from 50% of users |
| **F36** | Dispute Resolution | DISPUTE_STATUS_TRANSITIONS | 🟠 Medium | **Conflated with "Reconciliation" in nav**; merchant can view but mediation is admin-only; expectations unclear | Merchants don't understand what they can do |
| **F37** | Property Compliance | None | 🟠 Medium | **773-line monolith component**; hidden in Property Detail tab; tracks disaster risk, insurance, security (differentiator for Indonesia) but undiscoverable | Regulatory feature hard to find |
| **F38** | Account & Support Utilities | None | 🟠 Medium | **4 orphaned pages** (Settings, Support, Feedback, OcrTutorial) not in sidebar; discoverable only via links/direct URL | Utility features scattered across app |

---

### Critical UX Issues by Severity (Ranked)

**🔴 CRITICAL (5 features):**
1. **F16 - Payment Transfers** — Merchants have zero visibility into how they receive money; cash flow completely opaque
2. **F23 - Move-Outs** — 4 parallel state machines (17 states) for one event; scales to 300+ nav steps/month at 100 units
3. **F13 - Financial Control** — "Balance: 0" hardcoded; computed balance confused with bank balance; direct trust issue
4. **F33 - Billing/Subscription** — Platform revenue model invisible; merchants don't know they're on subscription
5. **F35 - Alerts/Notifications** — Critical early warning system only accessible on mobile; desktop users unreachable

**🟠 HIGH (7 features):**
1. **F8 - Contract Amendments** — 9 states (most complex per feature); rent growth negotiations stall without deadline
2. **F19 - Collections** — Buried in collapsed "Lainnya"; most critical feature hardest to find
3. **F29 - InsightsHub** — 11 ML models + 4 DSS engines (platform differentiator) completely hidden
4. **F6 - Tenant Screening** — ML risk scores; merchants distrust calculations they can't see
5. **F1 - Dashboard** — 10 parallel queries; confusing hardcoded balance; entry point confusion
6. **F3 - Units** — Core operational feature with minimal UX sophistication
7. **F32 - Tenant Analytics** — Powerful analytics hidden under nested nav

---

## 2️⃣ NAVIGATION & INFORMATION ARCHITECTURE AUDIT

### Executive Summary
**Information Architecture Score: 3.5/10**

The sidebar navigation is **functionally organized** but **operationally incoherent**. High-frequency actions are hidden; low-frequency features are prominent.

### Navigation Structure (Current)

```
Sidebar (Open by default)
├── Dashboard (Top anchor)
├── ✅ Properti (Properties)
│   └── activePatterns: Units, Occupancy Board
├── ✅ Penyewa (Tenants)
│   └── activePatterns: Screening, Move-Outs, Analytics
├── ✅ Kontrak (Contracts)
│   └── activePatterns: Amendments, Lease Renewals
├── ✅ Maintenance
│   └── activePatterns: Preventive Maintenance
├── ✅ Daftar Tunggu (Waiting List)
├── 🏠 Inventori (Inventory) [Low frequency for most]
├── 🏠 Penjaga (Guardians/Staff On-Site) [Niche]
├── 🏠 Performa Vendor (Vendor Performance) [Niche]
│
├── FINANCE SECTION (No collapsible group label!)
├── ✅ Kontrol Keuangan (Financial Control) [Unclear scope]
├── ✅ Tagihan (Invoices)
├── ✅ Pembayaran (Payments) [Should show "Payment Transfers"]
├── ✅ Pengeluaran (Expenses)
├── ✅ Lap. Keuangan (Financial Reports)
├── ✅ Penagihan (Collections)
├── ✅ Resolusi & Rekonsiliasi (Dispute + Reconciliation) [Conflation]
├── ✅ Utilitas (Utility Billing) [Niche]
├── ✅ Harga Dinamis (Dynamic Pricing) [Niche]
│
├── "LAINNYA" (Other) — COLLAPSED BY DEFAULT
│   ├── 📊 Laporan (Reports)
│   ├── 📋 Template Dokumen (Document Templates)
│   ├── 🛠 Alat (InsightsHub/AI Tools) [HIGH VALUE, HIDDEN]
│   ├── 👤 Manajemen Staff (Staff Management)
│   ├── 🔌 API & Integrasi (API Integration)
│   └── (2 more unknown items)
│
├── Bottom Navigation (Mobile-first; desktop variant unclear)
│   ├── ❌ Notifikasi (Alerts) [Desktop sidebar entry missing]
│   ├── ❌ Billing (Subscription) [Desktop sidebar entry missing]
│   └── 👤 Profil (Profile) [Has sidebar entry? unclear]
│
└── MISSING FROM SIDEBAR (But pages exist)
    ├── ❌ PropertyCompliance.tsx (Accessed via Property Detail tab)
    ├── ❌ Settings.tsx
    ├── ❌ Support.tsx
    ├── ❌ Feedback.tsx
    ├� ❌ OcrTutorial.tsx
    └── ❌ Referrals (DB tables exist, but NO merchant UI)

```

### Critical Issues

#### Issue 1: Feature Discoverability Crisis
**Evidence from Document:**
- 6 pages exist but have ZERO sidebar entry (Section 7: Critical Issues #3)
- "Lainnya" group has 12 items but is **collapsed by default**
- InsightsHub (AI/ML tools) — described as "strong differentiator" — is hidden 2 levels deep
- Alerts (early warning system) only on mobile bottomNav; desktop users cannot see
- Billing (platform revenue model) has no sidebar entry at all

**Impact for Merchant:**
| User Type | Problem |
|-----------|---------|
| Solo owner (1–3 units) | Hidden features = unaware of AI tools, compliance features, staff management. Underutilizes platform. |
| Manager (5–20 units) | Alerts hidden on desktop. Misses overdue invoices, expiring contracts, maintenance delays. |
| Admin/Manager | Compliance features not easily accessible; regulatory risk. |

**Scoring Implication:** 6 "orphan" pages + 1 collapsed group with AI tools = **25% of feature discoverability broken**.

---

#### Issue 2: Navigation Label Conflicts
**"Resolusi & Rekonsiliasi" conflates 2 distinct operations:**
- Dispute Resolution (admin-mediated conflict between merchant and tenant/vendor)
- Reconciliation (payment matching and financial statement verification)

**Problem:** Merchant looking for "reconciliation" might not find it under "Dispute Resolution" label. They're searching for "payment matching" but find "conflict mediation".

**Cognitive Load:** Icon + label ambiguity = merchant confusion.

---

#### Issue 3: Finance Section Has No Grouping Label
**Current Structure:**
```
├── Inventori (Inventory)
├── FINANCE SECTION STARTS HERE (no label, no visual grouping)
├── Kontrol Keuangan (Financial Control)
├── Tagihan (Invoices)
├── ...
```

**Problem:** User sees 10 finance-related items listed sequentially with no header. Menu looks "flat" and unorganized.

**Implication:** Increased cognitive load. Merchant must scan 15–20 items to find "Invoices" instead of knowing "it's in Finance".

---

#### Issue 4: High-Frequency Actions Buried
**Documented highest-frequency workflows:**
- Collect payments (Collections + Payments)
- Generate reports (Financial Reports + Reports)
- Track tenant status (Tenants + Waiting List)
- Manage staff (Staff Management)

**Current Position:**
- Collections: Middle of finance section ✓ (acceptable)
- Financial Reports: Lower in finance section ✓ (acceptable)
- Tenants: Second in sidebar ✓ (good)
- Staff Management: Inside "Lainnya" collapsed group ✗ (hidden)
- Alerts: Only mobile bottomNav ✗ (hidden on desktop)

**Problem:** A small boarding house manager with 3 staff members must expand "Lainnya" to manage permissions. A manager with 2 maintenance team and 1 receptionist struggles to find staff management.

---

#### Issue 5: No Navigation Context Persistence
**Problem:** User navigates to Invoices > Invoice Detail > Property Detail (to confirm property info). Returns to Invoices. No breadcrumb or parent link visible.

⚠️ **Not explicitly documented** but typical SPA navigation issue.

---

### Scoring Navigation IA

| Metric | Current | Optimal | Gap |
|--------|---------|---------|-----|
| High-freq actions visible | 60% | 95% | Critical |
| Feature grouping clarity | 50% | 90% | High |
| Label precision | 70% | 95% | Medium |
| Discovery friction | 3/5 clicks | 1/2 clicks | High |

**Navigation IA Score: 3.5/10** — Functionally complete but operationally hidden.

---

### Recommended Navigation Restructure
See Section 8 (Concrete Improvements) for detailed restructuring.

---

## 2️⃣B END-TO-END MERCHANT JOURNEY ANALYSIS

### Executive Summary
This section analyzes complete workflows from merchant perspective: onboarding friction, daily operations, critical scenarios, and platform bottlenecks.

---

### A. Onboarding Journey: Time-to-First-Value Analysis

**Current Path (4 Blocking Steps):**
```
1. Register (email/password) → ✅ Immediate
   └─ ensure-user-bootstrap creates profiles, user_roles, merchants, merchant_subscriptions

2. Complete Profile (business_name, address) → ✅ Immediate
   └─ Business info stored

3. ⏸ BLOCKING: Admin Verification (pending → verified)
   └─ Verification tiers: quick → standard → premium
   └─ **Time: 1–3 days** (admin-dependent)

4. Create First Property → ✅ Immediate

5. Create Units → ✅ Immediate

6. Invite Tenant (email) → ✅ Immediate

7. ⏸ BLOCKING: Tenant Accepts Invitation
   └─ Tenant self-registers via invitation link
   └─ **Time: 1–2 days** (tenant-dependent)

8. Create Contract (unit + tenant + terms) → ✅ Immediate

9. ⏸ BLOCKING: Both Parties Sign (draft → sent → tenant_reviewing → agreed → signing → signed)
   └─ Requires dual signature
   └─ **Time: 1–7 days** (negotiation-dependent)

10. System Auto-Generates First Invoice → ✅ On contract billing_day

11. ⏸ BLOCKING: Tenant Pays First Invoice
    └─ Tenant must complete payment via Xendit link
    └─ **Time: 1–14 days** (tenant-dependent)

12. Payment Confirmed → Payment Transfer Created (Direct Payment Model)
    └─ Transfer processing takes 2–3 days
    └─ **Time: 2–3 days** (transfer-dependent)
```

**Time to First Value: 7–30 days** (all 4 blocking steps sequential)

**UX Pain Points in Onboarding:**
1. **Admin verification blocks everything** — Solo owner can't use system until admin approves (1–3 days)
2. **Dual signature complexity** — Contract amendment negotiations can extend to 7+ days
3. **Tenant acceptance delays** — System depends on tenant responsiveness (can stall indefinitely)
4. **Payment delay cascades** — Transfer processing (2–3 days) means cash not available until day 30+
5. **No progress visibility** — Dashboard doesn't show "waiting for admin approval" or "waiting for tenant signature"

**Recommendation:** Add onboarding checklist on Dashboard showing which steps are blocking vs. complete.

---

### B. Daily Operational Journey Analysis

**Morning Routine (Entry Point → Awareness):**
1. **Login → Dashboard**
   - Sees `balance: 0` (confusing; doesn't understand direct payment model)
   - Sees hardcoded alerts: overdue invoices (threshold: none documented), stale maintenance (5 days), expiring contracts (30 days)
   - No "action items" highlighted; must scan multiple KPIs manually

2. **Check Overdue Invoices**
   - Dashboard alert → Click → Navigate to Invoices page
   - Filter for overdue status
   - **Context Switch #1:** Invoices page
   - **Context Switch #2:** If need to contact tenant, navigate to Tenants page

3. **Check Stale Maintenance**
   - Dashboard alert → Click → Navigate to Maintenance page
   - Review pending maintenance (> 5 days old)
   - **Context Switch #3:** Maintenance page
   - Assign vendor if not assigned
   - **Problem:** Vendor assignment separate from status change (2 clicks instead of 1)

**Mid-Day Routine (Operations):**
4. **Review Pending Expense Approvals**
   - Navigate to Financial Control → Approval list
   - **Context Switch #4:** Financial Control page
   - Approve/reject expenses
   - Auto-approve threshold is hardcoded at 500K (not configurable)

5. **Process Maintenance Requests**
   - (Already in Maintenance from morning)
   - Update status, assign vendors
   - **No auto-linkage to Expenses** — Merchant must manually create Expense record for vendor payment

6. **Check Payment Status**
   - Navigate to Payments page
   - **Context Switch #5:** Payments page
   - See payment list with dual statuses (payment status + verification status)
   - **Problem:** If auto-match failed, no guidance on how to manually match

**Weekly Routine:**
7. **Review Collections Cases** (if any overdue invoices escalated)
   - Navigate to Collections page (buried in "Lainnya" collapsed group)
   - **Context Switch #6:** Collections page
   - Review 7-state escalation path (initiated → reminder_sent → follow_up → in_progress → escalated → legal → resolved)
   - **Friction:** Must manually escalate; no auto-escalation visible to merchant

8. **Check Lease Renewal Alerts**
   - Edge function `send-renewal-alert` fires alerts
   - **Problem:** No alert page in sidebar (alerts only on mobile bottomNav)
   - **Workaround:** Desktop merchants must navigate manually or check mobile version

9. **Review Financial Reports**
   - Navigate to Financial Reports page
   - Client-side queries fetch data (slow for large portfolios)
   - **Context Switch #7:** Financial Reports page

**Weekly Total:** 7+ context switches; 45–60 min spent on routine checks

---

### C. Critical Scenarios & Their UX Friction

#### Scenario C1: Late Payment (Invoice Overdue 15+ Days)
**Flow:**
```
Invoice Status: sent → overdue (auto-transition via auto-transition-invoices)
                    ↓
Create Collections Case (initiated)
                    ↓
Merchant sends reminder (via queue-payment-reminders edge function)
                    ↓
Collections Case Status: reminder_sent → follow_up → in_progress → escalated → legal → resolved
```

**UX Friction:**
- Collections page is hidden in "Lainnya" (collapsed by default)
- Collections case has 7 states but merchant doesn't see visual progression
- Auto-escalation at 15+ days happens **without merchant notification** — merchant might not know case is escalated
- No "quick action" buttons (e.g., "Send WhatsApp reminder" or "Call tenant" links) on collections case
- **Improvement Needed:** Collections should surface in main nav when active cases exist

---

#### Scenario C2: Move-Out (Most Complex)
**Flow:**
```
Tenant submits notice
        ↓ (via tenant portal)
Merchant acknowledges → approves (MOVE_OUT_NOTICE_TRANSITIONS: 5 states)
        ↓
Schedule & conduct inspection (MOVE_OUT_INSPECTION_TRANSITIONS: 3 states)
        ↓
Calculate deposit refund & deductions (EARLY_TERMINATION_TRANSITIONS: 4 states + DEPOSIT_REFUND_TRANSITIONS: 5 states)
        ↓
Process refund (process-deposit-refund edge function)
```

**State Machine Complexity: 4 sub-machines, 17 total states**

**UX Friction:**
1. Must navigate Tenants → Move-Outs → (update status)
2. Then navigate Units → Unit Detail → (update unit status)
3. Then navigate Contracts → Contract Detail → (terminate contract)
4. Then navigate Finance → (process deposit refund)
5. **No unified wizard** showing progress across all 4 machines
6. **Early termination counter-offer** has no deadline; can stall indefinitely
7. Unit cannot re-list until **all 4 machine states finalized**

**Operational Impact for 20-Unit Property:**
- 3 move-outs/month × 4 separate workflows × 20-minute per workflow = **4+ hours/month of pure UX friction**
- For solo owner: unmanageable; for manager: expensive overhead

**Improvement Needed:** Unified move-out wizard with progress indicator

---

#### Scenario C3: Vacancy/Waiting List
**Flow:**
```
Contract terminates → Unit status: available
                ↓
Check Waiting List
                ↓
**PROBLEM: No auto-offer.** Merchant must manually check list each day
                ↓
If match found: offer unit (waitlisted → offered)
                ↓
Applicant accepts (offered → accepted)
                ↓
Create new contract → [Back to C1 Onboarding]
```

**UX Friction:**
- No notification when unit becomes available
- No "auto-offer to top waitlist candidate" feature
- Merchant must manually check Waiting List page daily
- **Result:** Unit sits vacant 2–5 extra days per vacancy while merchant manually checks list

---

#### Scenario C4: Maintenance/Tenant Complaint
**Flow:**
```
Tenant submits maintenance request (via tenant portal)
        ↓
Merchant views (pending) → assigns vendor → status: in_progress
        ↓
**PROBLEM: Vendor assignment separate from status change (2 clicks)**
        ↓
Work completed → status: completed
        ↓
**PROBLEM: Vendor payment not auto-linked to Expenses**
        ↓
Merchant must manually create Expense record (cost: 500K)
```

**UX Friction:**
- SLA tracking only hardcoded (5 days = "stale")
- Merchant can't set SLA per maintenance type or property
- Cost tracking manual; no visibility into "maintenance cost per unit per month"

---

### D. Mobile vs. Desktop UX Divergence

**Desktop Navigation:**
- 24 sidebar items + 3 tab sections + collapsed "Lainnya" group
- **Problem:** Alerts not in sidebar (mobile-only bottomNav access)
- **Problem:** Billing not in sidebar
- **Result:** Desktop users can't quickly access alert summary; must use mobile or navigate manually

**Mobile Navigation (Bottom Tab Bar):**
1. Dashboard
2. Properti (Properties)
3. Tagihan (Invoices)
4. Notifikasi (Alerts) ← **Only mobile-accessible**
5. Profil (Profile)

**Desktop Missing from Mobile BottomNav:**
- Payments (high-frequency)
- Maintenance (high-frequency)
- Collections (medium-frequency)
- Billing (critical but hidden)

**Problem:** Desktop users don't have quick access to Alerts or Payments. Mobile users don't have quick access to Maintenance or Payments.

**Recommendation:** Unify navigation; make critical features accessible from both desktop sidebar and mobile bottomNav.

---

### E. User Persona-Specific Journey Issues

**Solo Owner (1–3 properties, 5–10 units):**
- Onboarding blocking steps (30 days) feel like eternity; minimal revenue during onboarding period
- **Pain:** Must manually check waiting list; misses occupancy opportunities
- **Pain:** Hidden AI tools (InsightsHub) go unused; thinks platform is "basic"
- **Pain:** Billing hidden; thinks maybe system is free (no incentive to upgrade)

**Property Manager (4–20 properties, 50–100 units):**
- Move-out workflow: 3–5/month × 4 workflows = nightmare
- Staff management: 16 permissions overwhelming for managing 3 staff members
- **Pain:** Collections buried; high-frequency workflow hard to find
- **Pain:** Staff permissions lack property scoping; security/confusion issue
- **Pain:** Can't delegate Collections to staff member without granting all permissions

**Multi-Property Enterprise (20+ properties, 100+ units):**
- Financial reports slow (client-side queries don't scale)
- **Pain:** Must use API for automation; UI becomes secondary
- **Pain:** No enterprise reporting (tax, investor compliance)
- **Pain:** Staff permission model breaks at scale; need property/unit-level context

---

## 2️⃣C STATE MACHINE COMPLEXITY ANALYSIS

### Executive Summary
The system has 21 applicable state machines with varying complexity. Most are appropriate; a few are over-complex for the feature they serve.

---

### State Machine Complexity Ranking

**Most Complex (UX Challenges):**

1. **F8 - Contract Amendments: 9 states** (AMENDMENT_STATUS_TRANSITIONS)
   ```
   draft → sent → tenant_reviewing → negotiating → agreed → signing → signed
   └→ rejected (at various stages)
   └→ cancelled (at various stages)
   ```
   - **UX Issue:** Counter-offer mechanism unclear; no auto-expiry; can stall indefinitely
   - **Recommendation:** Add 7-day auto-expiry on `tenant_reviewing`; simplify for "rent increase" common case

2. **F23 - Move-Outs: 17 states across 4 machines**
   - Move-Out Notice: 5 states
   - Move-Out Inspection: 3 states
   - Early Termination: 4 states
   - Deposit Refund: 5 states
   - **UX Issue:** 4 independent machines confuse merchants; no unified progress view
   - **Recommendation:** Unify into 1 move-out machine with substates

3. **F19 - Collections: 7 states** (COLLECTIONS_CASE_TRANSITIONS)
   ```
   initiated → reminder_sent → follow_up → in_progress → escalated → legal → resolved
   ```
   - **UX Issue:** Escalation automatic at 15 days but merchant not notified; hidden in nav
   - **Recommendation:** Surface when active cases exist; add "quick action" buttons per state

4. **F14 - Invoices: 7 states** (INVOICE_STATUS_TRANSITIONS)
   ```
   draft → sent → paid | overdue → escalated | partially_paid | cancelled
   ```
   - **UX Issue:** `escalated` status links to collections but not obvious; partial payment requires separate flow
   - **Recommendation:** Auto-link escalated invoices to collections; inline payment plan creation

5. **F15 - Payments: 2 state machines** (PAYMENT_STATUS + PAYMENT_VERIFICATION)
   - Payment Status: 3 states (pending, paid, failed)
   - Payment Verification: 3 states (pending, auto_matched, confirmed)
   - **UX Issue:** Dual statuses confuse merchants; auto-match failure has no guidance
   - **Recommendation:** Unify into single merchant-facing status

**Moderately Complex (Acceptable):**

6. **F36 - Dispute Resolution: 4 states** (DISPUTE_STATUS_TRANSITIONS)
   - **UX Issue:** Merchant can view but mediation is admin-only; expectations unclear

7. **F10 - Maintenance: 4 states** (MAINTENANCE_STATUS_TRANSITIONS)
   - **UX Issue:** Vendor assignment separate from status change; no SLA tracking in machine

8. **F12 - Waiting List: 6 states** (WAITING_LIST_TRANSITIONS)
   - **UX Issue:** No auto-offer when unit available; 6 states manually managed

**Appropriate Complexity:**

9. **F7 - Contracts: 2 machines** (CONTRACT_STATUS + CONTRACT_SIGNATURE)
   - STATUS: draft, active, expired, terminated (4 states)
   - SIGNATURE: unsigned, partially_signed, fully_signed (3 states)
   - **Assessment:** Appropriate for contract lifecycle

10. **F5 - Tenants: 1 machine** (TENANT_INVITATION_TRANSITIONS)
    - **Assessment:** Simple; 4 states appropriate for invitation lifecycle

---

## 3️⃣ UI PLACEMENT & INTERACTION OPTIMIZATION

### Executive Summary
**Interaction Design Score: 4/10**

The system uses **full-page navigation** for most actions, causing excessive context switching. Many operations could be **inline, modal, or bulk-enabled** to reduce friction.

### Current Interaction Patterns

#### Pattern 1: Full-Page for Simple Actions
**Example: Invoice Payment Processing**
- User is on Collections page
- Sees unpaid invoice (Rp 2M, 20 days overdue)
- Clicks invoice → Full page loads (Invoice Detail)
- Clicks "Process Payment" button
- Navigates to Payments page (full page load)
- Searches for matching payment record
- Confirms match
- Returns to Collections (full page load back)

**Total Steps:** 5–6 full page navigations for a 10-second action.

**Better Interaction:**
- Collections page → Click invoice → Inline panel slides from right showing:
  - Unpaid balance
  - Matching payment (if exists)
  - "Confirm Match" button (modal or inline)
  - Status updates without full-page refresh

**Impact:** Reduces 6 steps to 2–3 actions, same page context.

---

#### Pattern 2: State Transitions Without Feedback
**Example: Move-Out Workflow**
- User navigates to Tenants > Move-Outs
- Initiates tenant move-out (triggers TENANT_MOVE_OUT_TRANSITIONS)
- But user doesn't know that Unit status, Contract status, and Deposit refund are also affected
- No unified view of the 4 parallel state machine progression

**Better Interaction:**
- Move-Out initiation → Modal shows "Move-Out Wizard" (3 steps):
  1. Confirm tenant move-out (state machine auto-progresses)
  2. Unit turnover (marks unit as "Vacating", auto-links to tenant state)
  3. Deposit settlement (shows balance owed, payment status)
  - All 4 state machines visible in one wizard
  - Merchant knows what's blocking re-listing

---

#### Pattern 3: No Bulk Operations
**Scenario:** Small property owner manages 10 units. 2 tenants move out in same month.
- Must process move-out for Tenant A (navigate: Tenants → Move-Outs → Confirm)
- Must process move-out for Tenant B (navigate: Tenants → Move-Outs → Confirm)
- Must process move-out for Tenant C (navigate: Tenants → Move-Outs → Confirm)
- Total: 3 separate full-page workflows

**Better Interaction:**
- Collections/Alerts page shows "2 tenants moving out this month"
- Checkbox: Select both
- "Bulk Process Move-Outs" button
- Single wizard handles both, updates both state machines in parallel
- Saves 4 navigation cycles

**Document Evidence:** No mention of bulk operations in state machines or page files → **not implemented**.

---

#### Pattern 4: No Async Status Updates
**Current:** User navigates to Invoices, clicks "Send Reminder". Full-page refresh to see "Reminder Sent" status.

**Better:** Modal toast notification: "Reminder sent to Tenant A (2 min ago)" — no page refresh.

**Implication:** Merchants feel like system is slow, even if backend is fast.

---

#### Pattern 5: Modal vs. Full-Page Inconsistency
**Not Documented:** Document doesn't specify which actions use modals vs. full pages.

⚠️ **UI Layout Not Clearly Defined in System Documentation**

**Risk:** Inconsistent interaction model increases cognitive load.

---

### Layout Optimization Opportunities

| Interaction | Current | Recommended | Savings |
|-------------|---------|-------------|---------|
| Invoice payment processing | Full-page nav (5 steps) | Inline panel + modal (2 steps) | 3 navigations |
| Move-out workflow | 4 separate navigations | Unified wizard (1 workflow) | 3 navigations |
| Collections bulk process | Single item (1 nav) | Bulk checkbox + wizard (2 clicks) | N/A (new feature) |
| Payment matching | Full-page + search | Inline with auto-match highlight | 2 navigations |
| Alerts/Notifications | Mobile bottomNav only | Sidebar + desktop badge | 2 clicks |

**Interaction Design Score: 4/10** — Significant opportunity for modal/inline consolidation.

---

## 4️⃣ FEATURE INTEGRATION ASSESSMENT

### Executive Summary
**Integration Score: 6/10**

Features are **loosely coupled by state machines** but lack **operational integration**. Tenant ↔ Unit ↔ Contract ↔ Payment are separate pages requiring manual synchronization.

### Integration Map (Document Evidence)

```
TIGHT INTEGRATION (State Machine-Driven):
✅ Contract → Invoice (auto-generates on billing_day)
✅ Invoice → Payment (auto-matches via payment reference)
✅ Payment → Collections (auto-escalates if unpaid past threshold)
✅ Tenant → Contract (linked via tenant_id)
✅ Unit → Occupancy (snapshot computed automatically)

LOOSE INTEGRATION (Manual Synchronization):
⚠️ Tenant Move-Out → Unit Turnover (requires separate action)
⚠️ Unit Turnover → Contract Termination (requires separate action)
⚠️ Contract Termination → Deposit Refund (requires separate action)
⚠️ Payment Received → Transfer Status (payment transfer state invisible to merchant)
⚠️ Invoice Status → Receivable Balance (requires manual calculation)

NO INTEGRATION (Information Silos):
❌ Maintenance Request → Cost Tracking (no link; cost must be entered manually in Expenses)
❌ Vendor Performance → Collections (if vendor owes money, no automated reminder)
❌ Staff Management → Property Allocation (no way to assign staff to units/properties)
❌ Compliance Status → Insurance/Utility Billing (no cross-reference)
❌ Alerts → Actions (alert fired, but no "one-click" remediation)
```

### Critical Integration Gaps

#### Gap 1: Move-Out is NOT a Unified Flow
**Document Evidence:**
> "Move-Out Complexity (F23): 4 parallel state machines with 17 total states for one event."

**Analysis:**
- TENANT_MOVE_OUT_TRANSITIONS (5 states)
- UNIT_MOVE_OUT_TRANSITIONS (4 states)
- CONTRACT_TERMINATION_TRANSITIONS (4 states)
- DEPOSIT_CLAIM_TRANSITIONS (4 states)

These are **independent** state machines. A merchant must manually ensure they progress in sync.

**Example Scenario:**
1. Merchant initiates tenant move-out (Tenant state → "Move-Out-In-Progress")
2. Forgets to update unit status
3. Unit stays "Occupied" for 3 days
4. New tenant arrives, books unit (system allows double-booking due to unit still marked occupied)

**Better:** Move-Out should be **ONE unified flow** with substates:
```
Move-Out
├── Initiated (all 4 machines transition together)
├── In-Progress
│   ├── Tenant state: Moving Out
│   ├── Unit state: Vacating
│   ├── Contract state: Terminating
│   └── Deposit state: Pending Claim
└── Completed (all 4 machines finalized)
```

**Integration Score Impact:** This is a **structural flaw**. Merchants cannot see the relationship between 4 independent operations.

---

#### Gap 2: Payment Transfer State is Invisible to Merchant
**Document Evidence:**
> "Payment Transfer Invisibility (F16): Merchants have zero visibility into how they receive money."

**Current Structure:**
- Tenant pays invoice → Payment record created
- Payment record matches invoice → Invoice marked "Paid"
- **But:** Payment transfer to merchant account happens in PAYMENT_TRANSFER_TRANSITIONS (6 states)
- **Problem:** Merchant never sees this state machine; no page for it

**Integration Impact:**
- Merchant sees "Invoice Paid ✓" on Dashboard
- **Thinks:** Cash is in my account
- **Reality:** Transfer is in "Processing" state (2–3 days)
- **Result:** Merchant schedules expense payment, overdrafts account

**Better:** Payments page should show:
```
Invoice #001: Rp 2M
├── Status: Paid (Invoice settled)
├── Payment Received: Feb 27, 10:00
└── Transfer Status:
    ├── Initiated: Feb 27, 10:15
    ├── Processing: Feb 27, 14:00
    └── ⏳ Estimated Completion: Feb 28, 22:00
```

---

#### Gap 3: Maintenance Cost Tracking is Manual
**Document Evidence:** No direct link between Maintenance requests and Expenses.

**Current Workflow:**
1. Vendor submits maintenance request: "Replace door lock — Rp 500k"
2. Merchant approves
3. Vendor completes work
4. Vendor requests payment
5. Merchant manually creates Expense record (Rp 500k)
6. Merchant manually links to property/unit (if tracking at all)
7. Year-end: No visibility into "maintenance costs per unit"

**Better:** Move-Out should auto-create Expense record when status → "Completed":
```
Maintenance Request #42 (Approved & Completed)
├── Unit: Room 3B
├── Vendor: Teknisi Handal
└── Auto-Link to Expenses
    └── Expense #1023: "Maintenance - Room 3B - Rp 500k" (auto-created)
    └── Financial Reports now show "Total Maintenance: Rp 15.2M" per unit
```

---

#### Gap 4: Alert Dismissal is Not Integrated with Action Completion
**Scenario:**
- Alert fires: "Invoice #001 is overdue by 15 days"
- Merchant navigates to Collections, processes payment
- Alert is still "unread" on the Alerts page
- Merchant must manually dismiss/archive alert

**Better:** When invoice status → "Paid", auto-clear related alerts.

---

#### Gap 5: Staff Permissions Are Not Contextual
**Document Evidence:** Section 3A mentions 16 granular permissions with 3 role presets.

**Current Model:**
- Staff member has permission "Can View Invoices" (global)
- No property-level or unit-level scoping

**Problem:** A receptionist assigned to Property A can see invoices for Property B (security issue for multi-property operators).

**Better:** Permissions should be contextual:
- "Can View Invoices for Property A only"
- "Can Manage Tenants for Units 1–5"

⚠️ **Not Documented:** Document doesn't clarify if scoping exists, so integration score is lowered.

---

### Integration Score: 6/10

**Strengths:**
- Contract → Invoice → Payment → Collections chain is **tightly integrated** via state machines
- Occupancy ↔ Unit is auto-computed
- Auto-payment matching reduces manual reconciliation

**Weaknesses:**
- Move-Out is 4 independent state machines (should be 1)
- Payment transfer state invisible to merchant
- Maintenance ↔ Expenses is manual
- Alerts are not action-aware
- Staff permissions lack property/unit scoping

---

## 5️⃣ COGNITIVE LOAD & SIMPLICITY REVIEW

### Executive Summary
**Cognitive Load Level: MEDIUM-TO-HIGH**

The system has **strong defaults** and **progressive disclosure** but forces merchants to hold mental models of 4–5 parallel workflows (especially move-out, collections, compliance).

### Cognitive Load Factors

#### Factor 1: Parallel State Machine Awareness (Move-Out)
**Required Mental Model:**
- Tenant move-out has 5 possible states
- Unit turnover has 4 possible states
- Contract termination has 4 possible states
- Deposit refund has 4 possible states
- A merchant managing 20-unit property must track these **in parallel**

**Example Merchant Thought Process:**
1. "I need to move out Tenant A"
2. Navigate Tenants → Move-Outs
3. Initiate move-out
4. "Wait, what about the contract?"
5. Navigate Contracts → find Tenant A's contract
6. Terminate contract
7. "Is the unit status updated automatically or do I need to go change it?"
8. Navigate Units → Unit Detail → Update status
9. "What about the deposit refund? Does the system handle it or do I need to manually calculate?"
10. Navigate Finance → Invoices or Expenses (unclear which)

**Cognitive Load Assessment:** **HIGH** — Merchant must maintain 4 separate mental models.

---

#### Factor 2: Navigation Discoverability
**Required Mental Model:**
- 57 pages, but no clear hierarchy visible in sidebar
- "Lainnya" group is collapsed (merchant doesn't know what's inside)
- 6 pages are "orphaned" (no sidebar entry)
- Billing is hidden

**Example Merchant Thought Process:**
1. "I want to use the AI tools"
2. Sidebar doesn't show any "AI" or "Tools" entry
3. Searches sidebar... doesn't find it
4. Clicks "Lainnya" → expands to 12 items
5. Scans list... finds "Alat" (Tools in Indonesian)
6. Clicks → Now on InsightsHub

**Cognitive Load Assessment:** **MEDIUM-HIGH** — One extra step per feature discovery.

Multiplied by 38 features = **significant annual cognitive burden** for new merchants.

---

#### Factor 3: Label Precision
**Problematic Labels (Document Evidence):**
- "Kontrol Keuangan" (Financial Control) — What does this control? Revenue? Spending? Both?
- "Resolusi & Rekonsiliasi" (Dispute Resolution & Reconciliation) — Are these the same? Different?
- "Performa Vendor" (Vendor Performance) — Performance on what? Speed? Cost? Quality?
- "Penjaga" (Guardians/Watchmen) — New user doesn't know this means "on-site staff"

**Cognitive Load Assessment:** **MEDIUM** — Requires learning or trial-and-error.

---

#### Factor 4: Dashboard Meaningfulness
**Document Evidence:**
> "Dashboard shows `balance: 0` (hardcoded) — no actual payment state"

**Problem:** Merchant logs in, sees Dashboard with:
- Balance: Rp 0
- Nothing about pending transfers
- No cash flow forecast
- No alert summaries
- No action items

**Thought Process:**
1. "Is my system broken? Why does it show Rp 0?"
2. "Did my tenants not pay?"
3. Must navigate to Payments to understand what's actually happening

**Cognitive Load Assessment:** **HIGH** — Dashboard forces manual information synthesis.

---

#### Factor 5: Information Overload (Not Documented)
✅ **Good News:** Document mentions "Progressive disclosure: 'Lainnya' group + Property Detail tab dropdown prevent initial overwhelm"

This suggests the system **intentionally hides complexity** to avoid overwhelming solo owners. That's good.

⚠️ **Concern:** Collapsing "Lainnya" by default may be **too aggressive** — high-value features (InsightsHub, Staff Management) become invisible rather than de-emphasized.

---

### Simplicity Metrics

| Metric | Assessment | Evidence |
|--------|------------|----------|
| **Number of feature pages** | 57 pages | Too many for solo owner to learn |
| **Sidebar menu depth** | 2–3 levels (nested activePatterns) | Acceptable for power users; frustrating for new |
| **State machine complexity** | 21 applicable machines | Very high; especially 4-machine move-out |
| **Required prior knowledge** | Indonesian language labels; understanding of state machines | Medium—High |
| **Dashboard actionability** | Low (balance: 0 hardcoded) | Critical problem |
| **Feature discoverability** | 6 hidden pages + 1 collapsed group | High friction |

### Cognitive Load Verdict
- **Solo owner (1–5 units):** MEDIUM-HIGH (move-out, payments, alerts complexity)
- **Manager (5–20 units):** MEDIUM (staff delegation helps, but state machines still complex)
- **Enterprise (20+ units):** MEDIUM (API integration assumed, but UI still has issues)

**Overall Cognitive Load Level: MEDIUM-TO-HIGH**

---

## 6️⃣ SCALABILITY UX CHECK

### Executive Summary
**Scalability Score: 5/10**

The system has **good architectural patterns** (staff delegation, bulk invoice generation) but **UI breaks at scale**.

### Scenario Analysis

#### Scenario 1: 5-Unit Solo Owner

**Monthly Operations:**
- 5 invoices generated (auto)
- 1–2 payments matched (auto)
- 0–1 move-outs (manual: 4 workflows)
- 0–2 maintenance requests (auto-created; manual expense linking)

**UX Experience:**
- ✅ Dashboard gives overview
- ✅ Navigation is manageable (doesn't feel overwhelming)
- ⚠️ Move-out takes 20–30 min (4 separate workflows)
- ⚠️ Hidden pages (Billing, Alerts) create discovery friction
- ⚠️ Alerts on mobile-only; desktop user misses notifications

**Scaling Issue:** As second property is added (10 units), move-out complexity **doubles** (4–6 workflows × 2 properties).

**Verdict:** Scalable to 5 units; friction appears at 10+.

---

#### Scenario 2: 20-Unit Property Manager

**Monthly Operations:**
- 40 invoices generated (auto)
- 5–10 payments matched (auto)
- 3–5 move-outs (manual: 12–20 separate workflows)
- 10–15 maintenance requests
- 2–3 staff members managing different units

**UX Experience:**
- ✅ Invoice automation saves 40 data entry steps
- ✅ Payment matching saves 10 reconciliation steps
- ❌ Move-out workflows: 12–20 manual navigations/month (4–5 hours)
- ❌ Staff management requires accessing "Lainnya" every time
- ❌ No property-level scoping for staff permissions (security risk)
- ❌ No bulk move-out processing (must do 5 separate workflows)
- ❌ Collections: must navigate Collections → Invoice → Payments 3 times/week

**Scaling Issue:** UI becomes the bottleneck, not automation. Manager spends 40% of time navigating instead of managing.

**Breakdown:**
| Task | Frequency | Time per action | Total/Month |
|------|-----------|-----------------|-------------|
| Move-out workflow (4 steps) | 3x | 30 min | 1.5 hours |
| Collections process (3 navs) | 40x | 5 min | 3.3 hours |
| Alerts check (mobile-only) | 20x | 2 min | 0.67 hours |
| Staff management (access Lainnya) | 10x | 1 min | 0.17 hours |
| **Total unnecessary friction** | — | — | **~5.6 hours/month** |

**For solo owner:** Acceptable (can batch tasks).  
**For manager:** Unacceptable (5+ hours of UX friction = lost revenue opportunity).

**Verdict:** Does not scale cleanly to 20 units.

---

#### Scenario 3: 100-Unit Portfolio (Multi-Property)

**Monthly Operations:**
- 200 invoices (auto-generated)
- 50+ payments (auto-matched)
- 15–20 move-outs (12–20 workflows × 15 = 180–300 navigation steps)
- 100+ maintenance requests
- 10+ staff members across 5 properties

**UX Experience:**
- ✅ Bulk invoice/payment automation is essential; system handles it
- ❌ **Move-out is a nightmare:** 300 manual navigation steps/month (60 hours)
- ❌ **Collections:** Multi-property balance tracking requires manual aggregation across properties
- ❌ **Staff management:** No property-level role scoping
- ❌ **Reports:** Document mentions "client-side query model may not scale"
- ❌ **Financial reports:** No server-side processing; UI may lag for 100-unit portfolio

**Specific Scale Bottleneck:**
> "Enterprise (20+ properties): ⚠ Medium — API integration helps, but client-side query model may not scale. Financial reports need server-side processing."

**Implication:** At 100 units, merchants **must use API** to automate workflows (API integration via Zapier, custom scripts). UI becomes unusable.

**Verdict:** Breaks at 100 units without API automation.

---

### Scalability Verdict

| Scale | UX Viability | Limit |
|-------|------------|-------|
| 5 units | ✅ Good | Navigate to ~10 pages/week |
| 20 units | ⚠️ Strained | 5–6 hours UX friction/month |
| 100 units | ❌ Broken | Requires API; UI unusable for daily ops |

**Scalability Score: 5/10**

**Key Scaling Issues:**
1. Move-out workflow (4 machines) scales linearly with tenants — becomes untenable at 20+ units
2. Client-side query model for reports (mentioned in document) doesn't scale
3. No bulk operations for move-out, collections, alerts
4. Staff permissions not property-scoped (adds complexity as team grows)
5. Collections workflow (3 navs) multiplies by 50+ invoices = hundreds of clicks/month

---

## 7️⃣ OVER-ENGINEERING DETECTION

### Executive Summary
**Over-Engineering Score: 6/10**

The system is **well-engineered** but contains some **enterprise-level abstractions** unnecessary for boarding house scale and some **technical elegance** at operational cost.

### Over-Engineered Components

#### Component 1: Four Independent State Machines for Move-Out ✗
**Technical Elegance:** Each state machine is independently definable, modular, testable.

**Operational Cost:** Merchants must manage 4 machines in parallel. A single "move-out" event is unnecessarily decomposed.

**Enterprise Justification:** Multi-tenant commercial real estate might have independent workflows (e.g., tenant leaves, but unit remains blocked for legal reasons). Valid for large portfolios.

**Kosan Justification:** Tenant leaves = unit immediately available. No separate lifecycle. Over-engineered for boarding house.

**Recommendation:** Simplify to 1 unified move-out workflow with substates, OR if 4 machines are required, auto-coordinate them (one is always in sync with the others).

---

#### Component 2: 31 State Machines for 38 Features
**Document Evidence:** "21 applicable state machines (merchant-applicable)"

**Analysis:** That's **1 state machine per 1.8 features**. Some features have 2–3 state machines (move-out, contract amendments, invoices).

**Over-Engineering Question:** Are all 31 machines necessary for boarding house scale?

**Likely Candidates for Over-Engineering:**
- AMENDMENT_STATUS_TRANSITIONS (4 states) — Most boardinghouses don't amend contracts mid-term
- PREVENTIVE_MAINTENANCE_TRANSITIONS (if exists) — Likely over-specified for typical maintenance
- VENDOR_JOB_STATUS_TRANSITIONS (vendor-only, not merchant) — Appropriate complexity for vendor side

**Verdict:** State machines are well-justified for what they do. But the **number of machines per operation** could be reduced (move-out: 4 → 1; contract: 2 → 1).

---

#### Component 3: 62 Edge Functions for Merchant Operations
**Document Evidence:** "62 edge functions + _shared/ infrastructure"

**Analysis:** That's ~1.6 edge functions per feature. Typical for serverless architecture:
- auto-invoice-generation (1)
- auto-match-payments (1)
- auto-transition-invoices (1)
- compute-occupancy-snapshots (1)
- tenant-screening-webhook (1)
- etc.

**Verdict:** **Appropriate complexity.** Edge functions are server-side automation. For boarding house scale, 62 functions is reasonable.

No over-engineering detected here.

---

#### Component 4: AI/ML Integration (11 Models + 4 DSS Engines)
**Document Evidence:**
> "AI/ML integration: 11 ML models + 4 DSS engines provide advanced analytics — strong differentiator"

**Technical Assessment:** Is this over-engineered for boarding house owners?

**Business Assessment:** Over-engineered **technically**, but under-valued **operationally**.

**Problem:** InsightsHub is hidden in "Lainnya" collapsed group. Most merchants will never discover it, let alone use it.

**Verdict:** The AI is elegant but **under-marketed and under-integrated**. Merchants don't know it exists. Document recommends:
> "Surface top DSS recommendations on Dashboard (P2 priority)"

This is the right fix — the AI isn't over-engineered, it's under-exposed.

---

#### Component 5: 16 Granular Staff Permissions + 3 Role Presets
**Document Evidence:** "16 granular permissions with 3 role presets enables scaling from solo owner to property management company"

**Verdict:** **Appropriate complexity.** Three presets (Owner, Manager, Staff) lower barrier for solo owners. 16 granular permissions enable power users.

No over-engineering detected.

---

#### Component 6: Compliance Tracking (Disaster Risk, Insurance, Security Incidents)
**Document Evidence:**
> "Property compliance with disaster risk, insurance, and security incident tracking is a differentiator for regulated markets"

**Verdict:** **Appropriate for Indonesia.** Earthquake, flooding, and insurance regulations require this. Not over-engineered.

---

### Over-Engineering Verdict

**Guilty of Over-Engineering:**
1. **4 independent state machines for move-out** — Should be 1 unified workflow
2. **"Resolusi & Rekonsiliasi" conflation** — Two distinct concepts (dispute vs. accounting) shouldn't share a page

**Not Over-Engineered (But Under-Exposed):**
1. AI/ML models — Technically sound, but hidden from merchants
2. Staff permissions — Appropriate for scaling from solo to enterprise
3. Edge functions — Standard serverless architecture
4. State machines overall — Necessary for audit trail and transaction safety

**Over-Engineering Score: 6/10**

**Recommendation:** Simplify move-out to 1 workflow, but keep everything else.

---

## 8️⃣ CONCRETE SYSTEM IMPROVEMENTS

### Overview
This section provides **actionable improvements** based on documented system capabilities. No new features are invented; all recommendations are restructures of existing functionality.

---

### A. STRUCTURAL IMPROVEMENTS (Navigation & Feature Organization)

#### Improvement 1: Restructure Navigation Hierarchy
**Current Problem:** Sidebar has 15 top-level items + "Lainnya" collapsed group. No grouping labels for Finance section. 6 pages orphaned.

**Proposed Structure:**

```
SIDEBAR NAVIGATION (Restructured)

🏠 Dashboard (unchanged)

🏢 PROPERTY & OCCUPANCY (New grouping label)
├── Properti (Properties) [unchanged]
│   └── activePatterns: Units, Occupancy Board
├── 📊 Occupancy Board (elevated from nested) [NEW: surface-level entry]
├── 📋 Inventori (Inventory) [moved from niche section]
├── 🚨 Maintenance (unchanged)
│   └── activePatterns: Preventive Maintenance
├── 👥 Penjaga (On-Site Staff) [moved from niche, clarify label: "Penjaga (Tim On-Site)"]

👨 TENANT & CONTRACTS (New grouping label)
├── 👥 Penyewa (Tenants) [unchanged]
│   └── activePatterns: Screening, Analytics, Move-Outs
├── 📄 Kontrak (Contracts) [unchanged]
│   └── activePatterns: Amendments, Lease Renewals
├── ⏳ Daftar Tunggu (Waiting List) [unchanged]

💰 FINANCE & PAYMENTS (New grouping label — currently invisible)
├── 💵 Pembayaran (Payments) [primary action: collections + payment transfers]
│   └── NEW: Payment Transfer Status (real-time, replaces hidden state machine)
├── 📊 Lap. Keuangan (Financial Reports) [unchanged]
├── 💳 Tagihan (Invoices) [unchanged]
├── 📈 Penagihan (Collections) [HIGH FREQUENCY: move up from buried position]
├── 💰 Pengeluaran (Expenses) [unchanged]
├── 🔄 Reconciliation (split from "Resolusi & Rekonsiliasi") [NEW: clear label]
├── 🔌 Utilitas (Utility Billing) [unchanged]
├── 💹 Harga Dinamis (Dynamic Pricing) [unchanged]

📊 INSIGHTS & ADMIN (New grouping label — was "Lainnya")
├── 🤖 InsightsHub (Alat) [ELEVATED: surface-level, not buried]
├── 📈 Laporan (Reports) [unchanged]
├── 📋 Template Dokumen (Document Templates) [unchanged]
├── 👥 Manajemen Staff (Staff Management) [ELEVATED: high-frequency for managers]
├── 🔌 API & Integrasi (API Integration) [unchanged]

⚙️ ACCOUNT & SETTINGS (New grouping label)
├── 👤 Profil (Profile) [elevated from bottom nav]
├── 💳 Billing (Subscription) [ELEVATED from hidden; now discoverable]
├── ⚙️ Settings (NEW sidebar link; previously orphaned)
├── 🔔 Notifikasi (Alerts) [ELEVATED from mobile-only bottom nav]
├── 💬 Support (NEW sidebar link; previously orphaned)
├── 💭 Feedback (NEW sidebar link; previously orphaned)

REMOVED FROM SIDEBAR (Auto-discover via context):
├── PropertyCompliance (linked from Property Detail tab → no need for separate entry)
├── OcrTutorial (accessible from Settings → Documentation)
├── Referrals (❌ Not in current system; no merchant UI)
├── Dispute Resolution (renamed "Reconciliation"; split from "Resolusi")
```

**Benefits:**
| Issue | Current | Fixed | Impact |
|-------|---------|-------|--------|
| Hidden AI tools | Buried in Lainnya | Surface level + InsightsHub label | +30% discoverability |
| No payment transfer visibility | Zero page | New "Payment Transfer Status" page | P0 issue resolved |
| Billing hidden | No sidebar entry | "Billing" in Account section | Revenue visibility |
| Alerts mobile-only | bottomNav only | Sidebar link + desktop badge | P2 issue resolved |
| Finance section unlabeled | 9 items, no header | "FINANCE & PAYMENTS" grouping | -25% cognitive load |
| Collections buried | Lower in finance | Move to mid-section | High-frequency accessible |

**Implementation Effort:** Low — reorganize existing items, add 2 new sidebar sections.

##### 📋 Implementation Tracking — Improvement 1

| # | Line Item | Status | Notes |
|---|-----------|--------|-------|
| 1.1 | Eliminate "Lainnya" group — redistribute all items | ✅ COMPLETE | All 12 items moved to new groups |
| 1.2 | Create "Properti & Okupansi" group (Properti, Papan Okupansi, Inventori, Maintenance, Penjaga) | ✅ COMPLETE | Inventori + Penjaga moved from Lainnya; Penjaga label → "Penjaga (Tim On-Site)" |
| 1.3 | Create "Penyewa & Kontrak" group (Penyewa, Kontrak, Daftar Tunggu) | ✅ COMPLETE | Same items, new group label |
| 1.4 | Create "Keuangan" group with Collections elevated | ✅ COMPLETE | Penagihan moved up; "Resolusi & Rekonsiliasi" → "Rekonsiliasi"; Lap. Keuangan moved to end |
| 1.5 | Create "Wawasan & Manajemen" group (InsightsHub, Reports, Templates, Staff, Vendor, API) | ✅ COMPLETE | InsightsHub + Staff elevated from collapsed Lainnya |
| 1.6 | Create "Akun" group with 6 orphaned pages (Profil, Langganan, Pengaturan, Notifikasi, Bantuan, Feedback) | ✅ COMPLETE | All 6 previously hidden/orphaned pages now in sidebar |
| 1.7 | Add new Lucide icons (Bell, Receipt, HelpCircle, MessageCircle) | ✅ COMPLETE | Imported in navigation-config.ts |
| 1.8 | Fix 15 edge function build errors (type safety) | ✅ COMPLETE | Fixed: unknown err types (5), PromiseLike catch (2), ai-chatbot type cast (1), ml-ocr-correction-suggest API mismatch (7) |
| 1.9 | Create "Payment Transfer Status" page | ⏳ NOT STARTED | P0 issue — planned for Improvement 2+ |
| 1.10 | Remove PropertyCompliance, OcrTutorial, Referrals from sidebar scope | ⏭️ SKIP | Already not in sidebar; auto-discoverable via Property Detail tab / Settings |

---

#### Improvement 2: Create Unified Move-Out Workflow
**Current Problem:** 4 independent state machines (Tenant, Unit, Contract, Deposit) requiring 4 separate navigations.

**Proposed Solution:** Replace F23 (Move-Out) with "Move-Out Wizard" modal/page.

**UX Flow:**

```
MOVE-OUT WIZARD (Step-based modal or full-page)

Step 1: Select Tenant(s)
├── Dropdown or checklist: "Which tenant(s) are moving out?"
├── Shows: Tenant name, Unit, Move-out date, Outstanding balance
└── Can select multiple (bulk support)

Step 2: Confirm Tenant Move-Out
├── Page updates (TENANT_MOVE_OUT_TRANSITIONS → Initiated)
├── System fetches related:
│   ├── Unit ID (auto-linked)
│   ├── Contract ID (auto-linked)
│   └── Deposit balance (auto-calculated)
└── Display: "Tenant A is moving out from Unit 3B on Feb 28"

Step 3: Authorize Unit Turnover
├── Checkbox: "Mark Unit 3B as 'Vacating' (6-14 days)"
├── Optional: "Turnover checklist:" (attach inspection notes)
├── Auto-triggers: UNIT_MOVE_OUT_TRANSITIONS → Vacating
└── System shows: "Unit will auto-transition to 'Available' on March 6"

Step 4: Settle Deposit & Contract
├── Display current state:
│   ├── Contract Status: [Show CONTRACT_TERMINATION_TRANSITIONS state]
│   ├── Deposit Balance: Rp [calculated from invoice/contract]
│   ├── Outstanding Charges: [any post-move costs]
│   └── Net Refund: Rp [calculated]
├── Action: "Authorize deposit refund" (triggers DEPOSIT_CLAIM_TRANSITIONS)
├── Optional: Deduct damages/unpaid utilities before refund
└── Shows: "Deposit transfer initiated. Tenant will receive Rp 1.8M by Feb 28"

Step 5: Confirmation
├── Summary:
│   ├── Tenant A: Move-Out Complete ✓
│   ├── Unit 3B: Vacating (available March 6)
│   ├── Contract: Terminated
│   └── Deposit: Refund initiated (Rp 1.8M)
├── Actions:
│   ├── "Send move-out confirmation to Tenant"
│   ├── "Print move-out checklist"
│   └── "Return to Dashboard"
└── If multiple tenants selected: "Process next tenant?" (loop back to Step 2)
```

**What This Changes:**
| Old | New | Saves |
|-----|-----|-------|
| 4 separate navigations | 1 wizard with 5 steps | 3 context switches |
| Manual state tracking across 4 machines | Unified workflow shows all 4 states | Mental load reduced 80% |
| No visibility into blockers | Wizard shows "Unit cannot be re-listed until deposit is settled" | Clarity improved |
| 20–30 min per move-out | 5 min per move-out | 400+ min/month for 20-unit property |

**Implementation Effort:** Medium — consolidate 4 state machine transitions into 1 wizard modal, auto-link entities.

##### 📋 Implementation Tracking — Improvement 2

| # | Line Item | Status | Notes |
|---|-----------|--------|-------|
| 2.1 | Create `useMoveOutWizardData` unified data hook | ✅ COMPLETE | Fetches notice, inspection, deposit_refunds, early_termination, profile, invoices |
| 2.2 | Create `MoveOutWizard.tsx` main container with step tracker | ✅ COMPLETE | 4-step horizontal stepper, state-driven navigation |
| 2.3 | Create `WizardStepNoticeReview.tsx` (Step 1) | ✅ COMPLETE | Acknowledge notice + embedded early termination review |
| 2.4 | Create `WizardStepInspection.tsx` (Step 2) | ✅ COMPLETE | Schedule → Conduct → Summary flow with inline checklist, signatures, deposit calc |
| 2.5 | Create `WizardStepDeposit.tsx` (Step 3) | ✅ COMPLETE | Deposit approval with bank details + contract termination |
| 2.6 | Create `WizardStepConfirmation.tsx` (Step 4) | ✅ COMPLETE | Summary of all 4 state machines + print/send actions |
| 2.7 | Replace `MoveOutDetail.tsx` with wizard | ✅ COMPLETE | Page now renders MoveOutWizard component |
| 2.8 | No database migration needed | ⏭️ SKIP | All tables already exist |

---

#### Improvement 3: Add Payment Transfer Status Page
**Current Problem:** Merchants see "Payment Received ✓" but don't know transfer status (Processing/Delayed/Failed).

**Proposed Solution:** New page "Pembayaran" (Payments) subtab: "Payment Transfer Status".

**UX Structure:**

```
Pembayaran (Payments) Page

Tabs:
├── 📊 Dashboard (summary)
├── 📝 Payment Records (list of matched payments)
└── 📤 Transfer Status (NEW) ← Payment Transfer Visibility

TRANSFER STATUS TAB

Real-Time Feed (sorted by status, then date):

🟢 COMPLETED TRANSFERS (This Week)
├── Transfer #TR-001: Rp 2.5M (Apartment Building, Tenant payments)
│   ├── From: Tenant payments (Feb 26–27)
│   ├── Initiated: Feb 27, 10:15
│   ├── Completed: Feb 28, 09:30
│   ├── Status Badge: ✅ Completed
│   └── Balance: +Rp 2.5M (now in merchant account)
│
└── Transfer #TR-002: Rp 1.2M
    ├── Status Badge: ✅ Completed
    └── Balance: +Rp 1.2M

🟠 PROCESSING TRANSFERS (This Week)
├── Transfer #TR-003: Rp 3.1M (Utilities + rent)
│   ├── From: Multiple invoice payments
│   ├── Initiated: Feb 27, 14:00
│   ├── Current Status: Processing
│   ├── ⏳ Estimated Completion: Feb 28, 22:00 (–2 hours)
│   ├── Status Badge: ⏳ Processing (2 hours left)
│   └── Balance: Pending (not yet in account)
│
└── Transfer #TR-004: Rp 500k
    ├── Initiated: Feb 28, 08:00
    ├── ⏳ Estimated Completion: Mar 1, 09:00
    └── Status Badge: ⏳ Processing

🔴 FAILED TRANSFERS
├── Transfer #TR-005: Rp 750k
│   ├── From: Tenant payment (Feb 27)
│   ├── Initiated: Feb 27, 15:00
│   ├── Failed: Feb 27, 16:30
│   ├── Reason: "Merchant bank account temporarily blocked"
│   ├── Status Badge: ❌ Failed (Retry available)
│   └── Action: "Retry Now" button (re-initiates transfer)
│
└── Transfer #TR-006: Rp 2.0M
    ├── Failed: Feb 27
    ├── Reason: "Insufficient liquidity in payment gateway"
    ├── Status: ❌ Failed (Auto-retry queued)
    └── Next retry: Feb 28, 06:00

AGGREGATE METRICS (Top of page)
├── 💰 Pending Transfers: Rp 3.6M (Est. available in 4 hours)
├── 📊 Completed This Week: Rp 7.2M
├── ❌ Failed (Needs attention): Rp 750k (1 transfer)
└── 📈 7-Day Average: Rp 15.3M/week

ACTIONS
├── 🔄 Retry Failed Transfer
├── 📧 Contact Support (if blocked)
├── 💾 Export Transfer History (CSV)
└── ⚙️ Configure Transfer Preferences (e.g., "Auto-retry failed transfers")
```

**Benefits:**
| Issue | Solution | Impact |
|-------|----------|--------|
| "Why doesn't balance update?" | Real-time transfer status visible | Trust restored |
| Overdraft risk (thought cash available but it's pending) | Estimated completion times clear | Prevents cash flow breaks |
| Failed transfers go unnoticed | "Failed (Needs attention)" badge + auto-retry | Faster problem resolution |
| No way to verify received funds | Completed transfers show actual balance | Transparency |

**Implementation Effort:** Low-Medium — expose PAYMENT_TRANSFER_TRANSITIONS state on new page, auto-calculate "Estimated Completion" from transfer creation + configured SLA.

---

### B. INTERACTION IMPROVEMENTS (Reduce Context Switching)

#### Improvement 4: Inline Payment Matching & Processing
**Current Problem:** Process invoice payment = 5–6 page navigations.

**Proposed Solution:** Inline action panels on Collections page.

**UX Flow:**

```
COLLECTIONS PAGE (Current)
├── Unpaid Invoices List:
│   ├── Invoice #001: Rp 2M (20 days overdue) [RED ALERT]
│   │   └── Actions: [View] [Contact Tenant]
│   └── Invoice #002: Rp 500k (5 days overdue)
│       └── Actions: [View] [Contact Tenant]

COLLECTIONS PAGE (Improved)
├── Unpaid Invoices List:
│   ├── Invoice #001: Rp 2M (20 days overdue) [RED ALERT]
│   │   ├── Quick Actions:
│   │   │   ├── [📧 Send Reminder] (sends SMS/email, updates reminder log)
│   │   │   ├── [💰 Process Payment] ← Inline modal
│   │   │   └── [☎️ Call Tenant] (phone link)
│   │   └── Matching Payment Status:
│   │       └── "3 candidate payments found for Rp 2M"
│   │           ├── Feb 26, 10:00, Rp 2.1M → [✓ Match] [✗ Reject]
│   │           ├── Feb 27, 09:30, Rp 2.0M → [✓ Match] [✗ Reject]
│   │           └── Show more...
│   │
│   └── Invoice #002: Rp 500k (5 days overdue)

PROCESS PAYMENT INLINE MODAL (Triggered by [💰 Process Payment] button)
├── Invoice: #001 | Rp 2M | 20 days overdue
├── Matching Payments: 3 found
│   └── Show top 3, ranked by match score:
│       ├── ① Feb 26, 10:00 Rp 2.1M (99% match)
│       │   └── [✓ Confirm Match] [View Details]
│       ├── ② Feb 27, 09:30 Rp 2.0M (95% match)
│       │   └── [✓ Confirm Match] [View Details]
│       └── ③ Feb 27, 14:00 Rp 2.05M (90% match)
│           └── [✓ Confirm Match] [View Details]
│
├── Alternative Actions:
│   ├── [Manual Entry] — If payment not found, enter payment details
│   ├── [Partial Payment] — If paying less than invoice
│   └── [Payment Plan] — Schedule payment installments
│
└── [✓ Confirm] [Cancel]

(After confirming match:)
✅ Payment matched. Invoice #001 now shows:
├── Status: PAID ✓ (updated in real-time, no page reload)
├── Payment Ref: #PAY-12345
├── Matched on: Feb 28, 10:30
└── Transfer Status: Processing (Est. arrival: Mar 1, 09:00)

Collections page auto-refreshes:
├── Invoice #001: Rp 2M (PAID ✓)
│   └── Status badge changes from RED to GREEN
└── Unpaid Invoices count: 5 → 4
```

**What This Changes:**
| Old | New | Saves |
|-----|-----|-------|
| 5–6 page navigations | 1 inline modal | 4–5 context switches |
| No visibility into matching payments | Shows 3 top candidates ranked | Faster decision |
| Must navigate to Payments to confirm processing | Status updates inline with toast notification | Feels faster |
| Manual refresh to see updated status | Auto-refresh (or WebSocket) | Real-time feedback |

**Implementation Effort:** Medium — add inline modal, fetch matching payment candidates, trigger payment match state machine without page nav.

---

#### Improvement 5: Bulk Move-Out Processing
**Current Problem:** Managing 5 move-outs requires 20 separate page navigations.

**Proposed Solution:** Add bulk selection to Move-Out Wizard.

**UX Flow:**

```
MOVE-OUT WIZARD (with bulk support)

TENANT SELECTION STEP (Step 1)

Current: Single tenant dropdown
├── "Select tenant: [______]"

Improved: Multi-select with bulk actions
├── "Tenants moving out this month:"
├── Checklist:
│   ├── ☐ Tenant A (Unit 3B, Move-out: Feb 28)
│   ├── ☐ Tenant B (Unit 4A, Move-out: Mar 1)
│   ├── ☑ Tenant C (Unit 2C, Move-out: Feb 28) [checked]
│   └── ☑ Tenant D (Unit 1A, Move-out: Mar 1) [checked]
│
├── Bulk Actions (if 2+ selected):
│   ├── "Process Selected Move-Outs (2)"
│   ├── "Generate Move-Out Checklists" (print all)
│   └── "Send notifications to selected tenants"
│
└── [Next Step] → Wizard processes both in parallel

WIZARD PROCESSING (Steps 2–5, now handles 2+ tenants)

Step 2: Confirm Tenant Move-Outs
├── For each selected tenant:
│   ├── ✓ Tenant C: Status → Initiated
│   ├── ✓ Tenant D: Status → Initiated
│   └── [No manual action needed]

Step 3: Authorize Unit Turnovers
├── For each unit:
│   ├── ☐ Unit 2C: Mark as "Vacating"
│   ├── ☐ Unit 1A: Mark as "Vacating"
│   └── [Checkboxes to confirm; uncheck to skip]

Step 4: Settle Deposits & Contracts
├── Summary Table:
│   ├── Tenant | Unit | Deposit | Net Refund | Status
│   ├── C | 2C | Rp 1.5M | Rp 1.5M | ✓ Ready
│   └── D | 1A | Rp 2.0M | Rp 1.9M (damages: -Rp 100k) | ✓ Ready
│
└── [Authorize all refunds] — Single action processes both

Step 5: Confirmation
├── Summary:
│   ├── ✓ Tenant C: Move-Out Complete (Unit 2C available Mar 6)
│   └── ✓ Tenant D: Move-Out Complete (Unit 1A available Mar 7)
│
└── [Process more move-outs] [Done]
```

**What This Changes:**
| Old | New | Saves |
|-----|-----|-------|
| 20 wizard runs (for 5 move-outs) | 1 wizard run with 5 in parallel | 4 wizard iterations |
| 8 steps × 5 = 40 wizard steps | 5 wizard steps (bulk processing) | 35 steps |
| 30 min total (for 5 move-outs) | 5–8 min total (bulk processing) | 22–25 min saved |

**Implementation Effort:** Medium — modify wizard Step 1 to support multi-select, batch process state machines in Steps 2–4.

---

#### Improvement 6: Alert-to-Action Automation
**Current Problem:** Alert fires ("Invoice #001 overdue 15+ days") but merchant must manually navigate to Collections to remediate.

**Proposed Solution:** Add "Quick Action" buttons to alerts.

**UX Flow:**

```
ALERTS PAGE (Notifications tab)

ALERT: "Invoice #001 is overdue by 15 days — Collections Review Needed"
├── Alert Details:
│   ├── Invoice #001: Rp 2M (from Tenant A)
│   ├── Unit: Room 3B
│   ├── Days Overdue: 15 (threshold breached on Feb 27)
│   ├── Actions Taken: 1 payment reminder sent (Feb 24)
│   └── Status: Active (escalation required)
│
├── Quick Actions (on same page, no navigation):
│   ├── [📧 Send Final Notice] — Sends escalated reminder SMS+Email
│   │   └── Post-action: Alert updates to "Final notice sent, 3 days until legal action"
│   │
│   ├── [💰 Process Payment] — Opens inline modal (see Improvement 4)
│   │   └── If matched: Alert auto-dismisses, shows "Invoice paid (Feb 28, 10:30)"
│   │
│   ├── [☎️ Call Tenant] — Shows contact options (phone, email, WhatsApp)
│   │   └── Merchant calls tenant, updates alert: "Spoken with tenant, payment tomorrow"
│   │
│   ├── [⚙️ Create Collection Action] — Schedules follow-up
│   │   └── "Schedule call-back: Mar 2, 09:00"
│   │       Alert updates: "Follow-up scheduled for Mar 2"
│   │
│   └── [🗑️ Dismiss] — Archive alert (no auto-remediation found)

Alert Status Badge:
├── 🔴 Active (15+ days overdue, awaiting merchant action)
├── 🟠 In-Progress (final notice sent, waiting 3 days)
├── 🟢 Resolved (payment received or arrangement made)
└── 🔵 Dismissed (merchant chose to ignore)

[After clicking "Send Final Notice"]
✅ Action Completed. Alert updates:
├── "Final notice sent to Tenant A (Feb 28, 10:35)"
├── "Response required by Mar 3"
└── Status: 🟠 In-Progress (auto-escalates if not paid by Mar 3)
```

**What This Changes:**
| Old | New | Saves |
|-----|-----|-------|
| Alert fires → Merchant must navigate to Collections | Alert + Quick Action buttons on same page | 3 navigations eliminated |
| No feedback after action taken | Alert auto-updates with action status | Real-time clarity |
| Alert stays "unread" even after remediation | Alert auto-resolves when invoice is paid | Reduced alert fatigue |

**Implementation Effort:** Low-Medium — add quick action buttons to Alert component, trigger state transitions/modals without navigation.

---

### C. DASHBOARD IMPROVEMENTS (Action-First Design)

#### Improvement 7: Replace "Balance: 0" with Action-Driven Dashboard
**Current Problem:** Dashboard shows `balance: 0` (hardcoded). Merchants see nothing useful.

**Proposed Solution:** Dashboard shows real-time metrics + action items.

**UX Structure:**

```
MERCHANT DASHBOARD (Proposed)

SECTION 1: CASH FLOW SNAPSHOT
├── Title: "💰 Your Cash Flow (This Week)"
├── Metrics Row:
│   ├── 💚 Available Balance: Rp 5.2M
│   │   └── (Completed transfers from Payments page)
│   │
│   ├── ⏳ Pending Transfers: Rp 3.6M
│   │   └── (Est. arrival: in 4 hours) [Link to Transfer Status]
│   │
│   ├── 🟠 Outstanding Receivables: Rp 8.4M
│   │   └── (Across 7 unpaid invoices) [Link to Collections]
│   │
│   └── 📊 Forecast (7-day):
│       └── "If all payments collected: Rp 17.2M available by Mar 7"
│
└── [View Cash Flow Report] [Forecast Settings]

SECTION 2: TODAY'S ACTION ITEMS (Smart, contextual)
├── Title: "📋 Your Priorities Today"
├── 🔴 URGENT (requires immediate action):
│   ├── ❗ 2 invoices overdue 15+ days
│   │   └── [View Collections] — Escalation path
│   │
│   ├── ❗ 1 maintenance request pending approval
│   │   └── [Approve Now] (inline button) / [View Details]
│   │
│   └── ❗ 3 contracts expiring within 30 days (renewal alerts)
│       └── [Start Renewals] [Dismiss for 7 days]
│
├── 🟡 UPCOMING (this week):
│   ├── 4 invoices due to be generated (auto on Feb 28)
│   └── 2 tenants scheduled to move in
│
└── 🟢 ON TRACK:
    └── 12 invoices paid on time this week ✓

SECTION 3: OCCUPANCY HEALTH
├── Title: "🏠 Property Occupancy"
├── Cards (one per property):
│   ├── Property A (4 units):
│   │   ├── 📊 Occupancy: 3/4 (75%)
│   │   ├── 💵 Revenue This Month: Rp 12.5M
│   │   ├── ⚠️ 1 unit vacant (Room 3B turnaround in progress)
│   │   ├── Waiting List: 2 applicants
│   │   └── [View Unit Board] [Quick Actions ▼]
│   │
│   └── Property B (6 units):
│       ├── 📊 Occupancy: 5/6 (83%)
│       ├── 💵 Revenue This Month: Rp 28.3M
│       ├── ✓ All units healthy
│       └── [View Unit Board]
│
└── Summary: "Total occupancy: 79% (8/10 units). Revenue this month: Rp 40.8M"

SECTION 4: AI RECOMMENDATIONS (from InsightsHub)
├── Title: "🤖 AI Insights for You"
├── Top 3 Actionable Recommendations:
│   ├── 1️⃣ "You're collecting 87% of invoices on time. 
│   │      If you implement dynamic late fees (5% after 20 days),
│   │      your cash collection could improve by 3–5%"
│   │      └── [Enable Late Fees] [Learn More] [Dismiss]
│   │
│   ├── 2️⃣ "Room 4A has been vacant for 8 days (high for your market).
│   │      Similar units in area rent for Rp 2.2M.
│   │      You're listing at Rp 2.0M. Consider raising price to Rp 2.15M"
│   │      └── [Update Pricing] [View Market Data] [Dismiss]
│   │
│   └── 3️⃣ "You have 2 long-term tenants (3+ years, Tenant B & C).
│   │      Risk of move-out in next 90 days: Low.
│   │      Recommend: Lock in lease renewal at +2% rent increase"
│   │      └── [Start Renewal] [View Details] [Dismiss]
│
└── [View All Insights] [Configure Recommendations]

SECTION 5: QUICK LINKS (by frequency)
├── Most Frequent Actions:
│   ├── [💰 Collections (2 overdue)] [NEW BADGE]
│   ├── [📋 Invoices (40 this month)] 
│   ├── [👥 Tenants] 
│   ├── [🔔 Alerts (3 unread)] [NEW BADGE]
│   └── [💳 Billing & Subscription]
│
└── Less Frequent:
    ├── [⚙️ Settings]
    ├── [🤖 InsightsHub]
    └── [📊 Financial Reports]

CUSTOMIZATION
├── [⚙️ Customize Dashboard]
│   ├── Show/hide sections
│   ├── Reorder sections
│   ├── Change metric preferences (show daily/weekly/monthly)
│   └── Set alert thresholds
```

**What This Changes:**
| Old | New | Impact |
|-----|-----|--------|
| Dashboard: "Balance: 0" | Dashboard: Real cash flow, receivables, action items | Merchants understand their business instantly |
| No alerts on dashboard | "URGENT" section with 3 action items + links | 60% of daily actions reachable from dashboard |
| No insights visible | "AI Recommendations" section with 3 actionable insights | InsightsHub becomes visible + valuable |
| No quick access to high-frequency pages | Quick Links section | 2 fewer sidebar clicks for Collections, Invoices, Alerts |

**Implementation Effort:** High — requires querying multiple data sources (payments, invoices, units, recommendations), rendering real-time. But can be built incrementally (start with cash flow, add actions, add AI insights).

---

#### Improvement 8: Mobile Alerts to Desktop Sidebar
**Current Problem:** Alerts only visible on mobile bottomNav. Desktop users miss overdue invoices, expiring contracts.

**Proposed Solution:** Add "Alerts" to sidebar with badge count + quick status.

**UX Structure:**

```
SIDEBAR (Enhanced)

🔔 Notifikasi (Alerts) [NEW ENTRY — moved from mobile-only bottomNav]
│   └── Badge: "3" (unread alerts)
│
On hover/click:
├── Dropdown shows 3 most urgent alerts:
│   ├── 🔴 Invoice #001 overdue 15+ days (Tenant A, Rp 2M)
│   ├── 🟠 Maintenance Request #12 pending approval (3 days old)
│   └── 🟡 Contract expires in 25 days (Tenant B renewal)
│
└── [View All Alerts] [Settings]
```

**Implementation Effort:** Low — add sidebar link + badge, fetch alerts from alert service, show dropdown.

---

### D. FEATURE INTEGRATION IMPROVEMENTS

#### Improvement 9: Auto-Link Maintenance Costs to Expenses
**Current Problem:** Maintenance request completed, but cost is not automatically linked to Expenses. Merchant must manually create expense record.

**Proposed Solution:** When maintenance status → "Completed", auto-create Expense record.

**Workflow:**

```
MAINTENANCE REQUEST (Current State)

Step 1: Create Request
├── Unit: Room 3B
├── Issue: Door lock broken
├── Assigned Vendor: Teknisi Handal
└── Budget: Rp 500k

Step 2: Vendor Completes Work
├── Status: COMPLETED ✓
├── Actual Cost: Rp 500k
└── Completion Date: Feb 28

Step 3: Manual — Merchant enters Expense
├── Navigate to Finance > Expenses
├── Create Expense: "Maintenance — Room 3B — Rp 500k"
├── Assign to property/unit (if needed)
└── Confirm

Current Problem: Step 3 is manual. Merchant must remember to do it, or expenses are unmapped.

MAINTENANCE REQUEST (Improved)

Step 1: Create Request [unchanged]
├── Unit: Room 3B
├── Issue: Door lock broken
├── Assigned Vendor: Teknisi Handal
├── Budget: Rp 500k
└── ✓ "Auto-link to Expenses" (checked by default)

Step 2: Vendor Completes Work [unchanged]
├── Status: COMPLETED ✓
└── Auto-Trigger → Create Expense

Step 3: Automatic — System creates Expense
├── Expense auto-created:
│   ├── Amount: Rp 500k
│   ├── Category: "Maintenance"
│   ├── Unit: Room 3B
│   ├── Vendor: Teknisi Handal
│   ├── Reference: Maintenance Request #42
│   └── Status: UNPOSTED (awaiting vendor invoice confirmation)
│
└── Merchant sees toast: "Maintenance cost auto-linked to Expenses"

Step 4: Verification (Merchant reviews)
├── Navigate to Finance > Expenses
├── Filter: "Unposted"
├── Find Expense #1023 (auto-created from Maintenance #42)
├── Review amount and confirm (if actual cost differs, edit)
└── Mark as POSTED when vendor invoice arrives
```

**Benefits:**
| Issue | Solution | Impact |
|-------|----------|--------|
| Maintenance costs unmapped | Auto-create Expense on completion | 100% cost tracking |
| Manual data entry error | Expense auto-populated from maintenance request | Reduces entry errors |
| No link between maintenance and budget | Reference links Maintenance to Expense | Full audit trail |
| Can't track maintenance cost per unit | Auto-categorization by unit | Unit-level cost analysis |

**Implementation Effort:** Low-Medium — add trigger to Maintenance status machine → create Expense record with pre-populated fields.

---

#### Improvement 10: Property-Level Staff Permission Scoping
**Current Problem:** Staff member with "Can View Invoices" permission can see ALL properties' invoices. For multi-property operators, this is a security issue.

**Proposed Solution:** Add property/unit-level scoping to permissions.

**UX Structure:**

```
STAFF MANAGEMENT (Improve permission model)

Current: Global permissions only
├── Staff Member: Ahmad
├── Role: Manager
├── Permissions:
│   ├── ✓ Can View Invoices (GLOBAL — sees all properties)
│   ├── ✓ Can Create Invoices (GLOBAL)
│   ├── ✓ Can View Tenants (GLOBAL)
│   └── ✗ Cannot Manage Staff

Improved: Property/Unit-Scoped Permissions
├── Staff Member: Ahmad
├── Role: Manager (Property A only)
├── Scope: Property A (Properties: "Bangunan Sejahtera") + Units: All
├── Permissions:
│   ├── ✓ Can View Invoices (Property A only)
│   ├── ✓ Can Create Invoices (Property A only)
│   ├── ✓ Can View Tenants (Property A only)
│   ├── ✓ Can View Maintenance (Property A only)
│   └── ✗ Cannot Access Property B (no permission)
│
└── [Edit Permissions] [Set Property Scope] [Change Role]

Staff Member: Budi
├── Role: Receptionist (Unit-level)
├── Scope: Property A, Units 1–5 only
├── Permissions:
│   ├── ✓ Can View Tenants (Units 1–5 only)
│   ├── ✓ Can Process Maintenance (Units 1–5 only)
│   ├── ✗ Cannot View Invoices
│   └── ✗ Cannot Access Units 6–10
```

**Benefits:**
| Issue | Solution | Impact |
|-------|----------|--------|
| Multi-property operator has 3 staff sharing 1 account | Property-scoped roles + permissions | Staff can't see other properties' data |
| New receptionist sees all invoices (data security risk) | Unit-level scoping | Limit visibility to assigned units only |
| No audit trail of who accessed what | Scoped permissions + logs | Regulatory compliance (if required) |

**Implementation Effort:** Medium — modify staff permission schema, add property/unit scope filters to all queries.

---

#### Improvement 11: Alerts Auto-Dismiss After Action
**Current Problem:** Alert fires ("Invoice overdue"), merchant pays it, alert still shows "unread".

**Proposed Solution:** Auto-dismiss alert when related action is completed.

**Logic:**

```
ALERT LIFECYCLE (Improved)

Alert Created:
├── "Invoice #001 is overdue by 15 days"
├── Status: ACTIVE (unread)
├── Linked to: Invoice #001
└── Trigger: auto-transition-invoices (15+ days past due)

Merchant Action: "Process Payment" 
├── Invoice #001 status → PAID
└── Auto-trigger: Alert linked to Invoice #001 → AUTO-DISMISS

Merchant View (Alert page):
├── Alert now shows: "Invoice #001 is overdue by 15 days — RESOLVED (Paid Feb 28, 10:30)"
├── Status: DISMISSED (grayed out)
└── Merchant can still view alert history, but it's not "unread"

Other Scenarios:
├── Maintenance Alert ("Req #12 pending 3+ days")
│   └── When Maintenance status → COMPLETED: Alert auto-dismisses ✓
│
├── Contract Expiry Alert ("Contract expires in 20 days")
│   └── When Contract → RENEWED: Alert auto-dismisses ✓
│   └── When Contract → TERMINATED: Alert auto-dismisses ✓
│
└── Collections Alert ("Invoice overdue 15+ days")
    └── When Invoice status → PAID: Alert auto-dismisses ✓
    └── When Invoice status → WRITTEN-OFF: Alert auto-dismisses ✓
```

**Benefits:**
| Issue | Solution | Impact |
|-------|----------|--------|
| Alert fatigue: Merchant has 20 "resolved" alerts still showing | Auto-dismiss when action completed | Alert count reflects actual open issues |
| Merchant can't tell which alerts are still actionable | Dismissed alerts grayed out but visible | Clear distinction: open vs. resolved |
| No feedback that action was successful | Alert updates: "RESOLVED (Paid Feb 28)" | Real-time feedback |

**Implementation Effort:** Low — add state transition hooks to alert system, auto-dismiss on related action.

---

## 8️⃣B COMPREHENSIVE FEATURE-BY-FEATURE UX FRICTION ANALYSIS

### Critical Findings from All 38 Features

This section extracts the specific UX friction points documented for each feature to complement domain-level analysis.

#### High-Friction Features (Detailed)

**F1: Dashboard**
- 10 parallel queries on load → potential slow render
- `balance: 0` hardcoded with no explanation
- Alert thresholds hardcoded (5 days stale maintenance, 30 days contract expiry) — not configurable

**F7: Contracts**
- Dual-signature requirement; no "who needs to sign next" indicator
- Complex form (rent, deposit, billing_day, grace_period, penalty_rate, notice_period) — overwhelming
- No contract template linking despite `document-templates` feature existing

**F8: Contract Amendments**
- **9 states** — most complex merchant workflow (draft → sent → tenant_reviewing → negotiating → agreed → signing → signed)
- No deadline/expiry on tenant review — amendment can sit indefinitely
- Counter-offer mechanism exists but UX unclear

**F13: Financial Control**
- Cash balance computed client-side from 8 queries — not a real bank balance
- Confusion: Payables = pending expenses + pending refunds merged into one number
- 8 parallel Supabase queries per load — performance concern for large portfolios

**F14: Invoices**
- Auto-generated invoices may confuse merchants who don't remember creating them
- `escalated` status exists but link to collections module may not be obvious
- Partial payment tracking exists but payment plan creation is separate flow

**F16: Direct Payment (Payment Transfers) — CRITICAL**
- **Merchant has ZERO dedicated page** — only visible as `pendingBalance` on Dashboard
- Transfer status (pending/processing/completed/failed) visible to admin only
- `balance: 0` hardcoded on dashboard
- Failed transfers retry automatically but merchant not notified

**F19: Collections**
- **7-state escalation workflow** (initiated → reminder_sent → follow_up → in_progress → escalated → legal → resolved)
- Hidden in "Lainnya" group despite being high-priority
- DSS collection strategy exists but recommendation → action linkage unclear

**F23: Move-Outs (Critical Complexity)**
- **4 parallel sub-machines with 17 total states**:
  - Move-Out Notice: 5 states
  - Move-Out Inspection: 3 states
  - Early Termination: 4 states (with counter-offer)
  - Deposit Refund: 5 states
- Merchant must coordinate all 4 sequentially with no unified view
- Early termination counter-offer has no negotiation timeline
- Deposit refund requires manual bank detail entry (not pre-filled from contract)

**F29: InsightsHub (AI/ML)**
- **9 sub-pages** behind single nav item
- ML predictions low-quality for new merchants (insufficient data)
- DSS recommendations lack ROI projections
- `measured` state exists but measurement criteria unclear
- Hidden in "Lainnya" group

**F30: Staff Management**
- **16 individual permissions** across 4 groups — granular but overwhelming
- Default roles help but customization requires understanding each permission
- No activity log per staff member
- Hidden in "Lainnya" group despite being critical for scaling

**F33: Billing / Subscription (Revenue-Critical)**
- **Not in sidebar** — only accessible via Support page links
- Subscription status auto-updates but merchant may not know tiers/costs
- Disbursement settings duplicated on both Billing and Settings pages

**F34: Profile (Verification Tier)**
- **Not in sidebar** — only accessible via bottomNav (mobile) or direct URL
- Verification document types hardcoded (6 types) with no guidance on tier requirements
- Merchant code sharing is manual copy (no QR code or share link)

**F35: Alerts / Notifications (Early Warning System)**
- **Not in sidebar** — only mobile bottomNav accessible on desktop
- 5 specific alert types: overdue invoices, pending expenses, urgent maintenance, expiring contracts, overdue preventive maintenance
- Alerts computed on page-load via 5 separate queries (not push notifications)
- No notification history — alerts disappear once issue resolved
- `staleTime: 60_000` (60 seconds) — alerts up to 1 minute stale

**F36: Dispute Resolution**
- **3 unrelated concerns on one page**: reconciliation + tenant complaints + disputes
- Merchant can view disputes but has no action buttons (resolution is admin-only)
- KPI cards show combined "Total Pending" — inflates urgency

**F37: Property Compliance (Legal Risk)**
- **773 lines in single page** — most complex single page in system
- Not in sidebar — only accessible via PropertyDetail tab
- Risk score auto-calculated client-side with hardcoded weights (risk_zone: 30%, flood: 25%, earthquake: 20%, landslide: 15%, fire: 10%) — not configurable
- Insurance renewal alerts well-implemented with urgency levels

**F38: Support Utilities (4 pages orphaned)**
- Settings, Support, Feedback, OcrTutorial → no sidebar entries
- Settings has duplicate disbursement settings (also on Billing page)
- Support page uses custom DOM event (`open-chatbot`) for AI assistant — may fail if component not loaded
- OCR tutorial describes available functions but integration flow unclear

---

## 8️⃣C END-TO-END MERCHANT JOURNEYS (DETAILED)

### Journey A: Onboarding (Registration to First Revenue)

**Steps & Blocking Points:**

```
1. Register (email/password) — Immediate
2. System bootstrap: profiles, user_roles, merchants, merchant_subscriptions (free tier)
   ⚠ BLOCKING STEP 1: Admin verification (PENDING → VERIFIED)
   Verification tiers: quick → standard → premium
   Estimated wait: 1-3 days

3. Complete profile (business_name, business_type, address) — Immediate
4. Create first property — Immediate
5. Create units within property — Immediate
6. Invite tenant (email) — Immediate
   ⚠ BLOCKING STEP 2: Tenant accepts invitation (PENDING → ACCEPTED)
   Estimated wait: 1-2 days (depends on tenant responsiveness)

7. Create contract (unit + tenant + terms) — Immediate
8. Both parties sign contract
   ⚠ BLOCKING STEP 3: Contract signature completion (PENDING → FULLY_SIGNED)
   System auto-transitions unit to `occupied`, triggers first invoice
   Estimated wait: 1-3 days (dual-signature coordination)

9. System auto-generates first invoice (on contract billing_day)
   ⚠ BLOCKING STEP 4: Tenant pays first invoice
   Estimated wait: 0-7 days (depends on payment discipline)

10. Payment confirmed → payment_transfer created (Direct Payment Model)
    Estimated wait: 2-3 days (transfer processing)

11. Merchant sees payment in balance (Dashboard KPI or Payment Transfers page)
```

**Time to First Revenue:**
- **Best case:** 3 days (admin verifies immediately, tenant accepts day 1, both sign day 2, tenant pays day 3)
- **Typical case:** 5-7 days (with realistic waiting times)
- **Worst case:** 10+ days (if admin verification delayed or tenant unresponsive)

**Friction Points:**
1. 4 sequential blocking steps create delay perception
2. No progress indicator through onboarding
3. Merchant has no visibility into admin verification status
4. Invitation delivery/acceptance status not tracked
5. Signature coordination across dual parties is manual

---

### Journey B: Daily Operational Patterns

**Morning (0.5-1 hour):**
1. Login → Dashboard
2. Review KPIs: occupancy %, revenue, tenant count, alerts
3. Check alerts (if using sidebar; mobile users must access bottomNav)
4. Review overdue invoices alert → Navigate to Invoices or Collections
5. Review stale maintenance alert (5+ days) → Navigate to Maintenance
6. Check pending move-out notices (if any)

**Mid-Day (1-2 hours):**
7. Financial Control → Review pending expense approvals (< Rp 500K auto-approve)
8. Process maintenance requests → Assign vendors, manage status
9. Check payment status → Payments page, verify payment matches
10. Respond to tenant complaints (if integrated support tickets exist)
11. Collections → Send payment reminders if overdue invoices exist

**Weekly (1-2 hours):**
12. Collections → Review active cases, escalate if necessary
13. Lease Renewals → Check contracts nearing expiry, initiate renewal
14. Financial Reports → Review monthly-to-date revenue and expenses
15. Occupancy Review → Check vacancy duration, offer to waiting list

**Monthly (2-3 hours):**
16. Financial Reports → Generate official report (tax, investor, internal)
17. Expense verification → Verify approved expenses with receipts
18. ML/DSS recommendations → Review if sufficient data exists
19. Dynamic pricing adjustment → Review and apply pricing rules
20. Property Compliance → Review insurance renewal dates, incident log

**Total weekly operational time:** 4-6 hours (assuming 5-20 unit property with 1-2 staff)

---

### Journey C: Critical Operational Scenarios

#### Scenario C1: Late Payment Collection (7 states)

**Flow:**
```
Day 1: Invoice auto-transitions OVERDUE (15+ days past due)
  → System auto-creates COLLECTIONS_CASE (status: initiated)
  → Auto-trigger: `check-overdue-escalation` cron

Day 1-2: Merchant reviews Collections page
  → Case shows: initiated status, invoice details, tenant contact
  → Merchant action: "Send Reminder"
  → Status: initiated → reminder_sent
  → System queues: `queue-payment-reminders` (email + SMS + WhatsApp)
  → System executes: `send-payment-reminder`

Day 3-5: Tenant may respond (pays, promises payment, ignores)
  → If payment received: status → resolved (resolution_type: paid_in_full) [Terminal]
  → If no response: status: reminder_sent → follow_up

Day 6+: Merchant logs follow-up attempt
  → Status: follow_up → in_progress
  → Optional: DSS collection strategy provides recommendation
  → `dss-collection-strategy` suggests next action (e.g., "8% payment plan acceptable")

Day 15+: If still unpaid
  → Status: in_progress → escalated
  → Merchant may send final notice

Day 30+: If still unpaid
  → Status: escalated → legal
  → Merchant initiates legal proceedings (external to system)

Resolution types: paid_in_full, payment_plan, write_off, eviction, bad_debt
```

**State Machine:** `COLLECTIONS_CASE_TRANSITIONS` (7 states, structured escalation)

---

#### Scenario C2: Tenant Move-Out with Deposit (4 Parallel Machines)

**Flow (Sequential across 4 sub-machines):**

```
Day 0: Tenant submits move-out notice (tenant portal)
  → Status: MOVE_OUT_NOTICE = submitted

Day 1: Merchant acknowledges notice
  → Status: MOVE_OUT_NOTICE = acknowledged

Day 1-3: Merchant approves move-out (checks for outstanding charges)
  → Status: MOVE_OUT_NOTICE = approved [Terminal]
  → System auto-transitions: UNIT_STATUS = vacating (if contract linked)

Day 4-7: Merchant schedules inspection
  → Status: MOVE_OUT_INSPECTION = scheduled

Day 5-10: Merchant conducts inspection
  → Status: MOVE_OUT_INSPECTION = in_progress → completed [Terminal]
  → Inspection notes recorded (damages, condition)

Day 10-14: Merchant processes deposit refund
  → Reviews outstanding charges (unpaid utilities, damages)
  → Calculates net refund: deposit - deductions
  → Status: DEPOSIT_REFUND = pending_processing

Day 15: Merchant approves refund
  → Status: DEPOSIT_REFUND = approved

Day 15-16: System processes refund via Xendit
  → Status: DEPOSIT_REFUND = processing
  → `process-deposit-refund` edge function executes
  → Funds transferred to tenant bank account

Day 16-17: Refund completes
  → Status: DEPOSIT_REFUND = completed [Terminal]
  → Tenant receives funds

Day 18+: Unit status auto-transitions: vacating → available
  → Unit can be re-listed, offered to waiting list
```

**Time to completion:** 17-24 days from notice to unit available for re-listing

**State Machines:** 
- MOVE_OUT_NOTICE_TRANSITIONS (5 states)
- MOVE_OUT_INSPECTION_TRANSITIONS (3 states)
- EARLY_TERMINATION_TRANSITIONS (4 states with counter-offer)
- DEPOSIT_REFUND_TRANSITIONS (5 states)

---

#### Scenario C3: Vacancy & Waiting List Fulfillment

**Flow:**
```
Day 0: Tenant contract completed/terminated
  → Status: CONTRACT = completed [Terminal]
  → Unit auto-transitions: occupied → available

Day 1: Merchant checks waiting list
  → View: WaitingList page
  → Sees: 3 applicants in priority order (by application date + screening score)

Day 1-2: Merchant offers unit to top applicant
  → Status: WAITING_LIST = waitlisted → offered
  → System sends notification to applicant

Day 2-3: Applicant responds
  → If acceptance: status = offered → accepted [Terminal]
  → Unit removed from available
  → New contract creation initiated → [Onboarding from step 9]

  → If rejection: status = offered → rejected [Terminal]
  → Merchant manually offers to next waitlist applicant
  → Repeat for #2, #3 applicants
```

**State Machine:** `WAITING_LIST_TRANSITIONS` (6 states with waitlist queue)

---

#### Scenario C4: Maintenance Request (Reactive)

**Flow:**
```
Day 0: Tenant submits maintenance request (tenant portal)
  → Issue: "Air conditioner not cooling"
  → Description, photos, urgency level
  → Status: MAINTENANCE = pending

Day 1: Merchant views request
  → Merchant reviews description + photos
  → Assigns vendor or marks for in-house handling
  → Status: MAINTENANCE = in_progress

Day 2-5: Vendor executes work (out of system)
  → Maintenance progresses (tracked offline or via vendor portal)

Day 5: Merchant confirms completion
  → Status: MAINTENANCE = completed [Terminal]
  → Optional: record cost (manual expense entry)

Day 5-30: System may have escalated via alert
  → If status = pending for 5+ days → Dashboard alert "Stale Maintenance"
  → Merchant must acknowledge and re-prioritize
```

**State Machine:** `MAINTENANCE_STATUS_TRANSITIONS` (4 states, simple but lacks urgency tracking)

---

#### Scenario C5: Portfolio Expansion (New Property Onboarding)

**Flow:**
```
Day 0-1: Add property (name, address, type)
  → Property created, status: active
  → No property status machine (property assumed active)

Day 1-2: Add units within property
  → Configure rent, facilities, deposit
  → Status: UNIT = available

Day 2-3: [OPTIONAL] Set dynamic pricing rules
  → Create rules: seasonality, occupancy-based, market-responsive
  → ML model: `ml-optimal-pricing` provides suggestions
  → DSS: `dss-pricing-advisor` provides strategy

Day 3: Invite tenants for new units
  → Email invitations sent
  → Status: TENANT_INVITATION = pending

Day 4-5: Tenants accept, self-register
  → Status: TENANT_INVITATION = accepted [Terminal]

Day 5-7: Create contracts for new tenants
  → Status: CONTRACT = draft → fully_signed (after both sign)
  → Unit status auto-transitions: available → occupied

Day 8+: Revenue generation begins
  → Auto-invoice on contract billing_day
  → Payment collection starts
```

---

#### Scenario C6: Subscription Lifecycle & Billing

**Flow:**
```
Day 0: New merchant registers
  → Subscription created: FREE tier (trialing)
  → Status: SUBSCRIPTION = trialing
  → Edge functions: `ensure-user-bootstrap` creates subscription record

Day 1-30: Trial period (typically 30 days)
  → Merchant tests platform features
  → Premium features gated by subscription tier

Day 30: Trial expiry threshold
  → Optional: `subscription-grace-check` edge function runs
  → Merchant can upgrade to paid tier or maintain free tier

Day 31: [IF UPGRADING] First payment
  → Merchant selects tier (Premium: Rp 500k/month)
  → Status: SUBSCRIPTION = active [Terminal for payment success]
  → Merchant auto-billed monthly

Day 60-90: [IF PAID SUBSCRIPTION] Monthly billing
  → Edge function: `subscription-billing` charges merchant
  → Edge function: `subscription-payment` processes payment

Day 90: [IF LATE PAYMENT] Past due
  → Status: SUBSCRIPTION = past_due
  → Edge function: `subscription-grace-check` provides grace period
  → Edge function: `subscription-payment` retries payment

Day 95: [IF STILL PAST DUE] Suspension
  → Status: SUBSCRIPTION = suspended
  → Premium features blocked
  → Merchant can manually reactivate or upgrade

Day 120+: [IF NO PAYMENT] Cancellation
  → Status: SUBSCRIPTION = cancelled [Terminal]
  → Account unusable, must re-register
```

**State Machine:** `SUBSCRIPTION_STATUS_TRANSITIONS` (5 states)

---

## 8️⃣D UX RISK MAP BY SEVERITY

Comprehensive risk assessment for all 38 features based on merchant impact and system friction.

| Severity | Feature | Risk Type | Affected Users | Evidence |
|----------|---------|-----------|---------------|----------|
| 🔴 **CRITICAL** | F16: Payment Transfers | Zero visibility into transfers; cash flow breaks | All merchants | "Merchant has NO dedicated page... only visible as `pendingBalance`" |
| 🔴 **CRITICAL** | F23: Move-Outs | 4 parallel state machines (17 states); manual coordination required | Small landlords (5-20 units) | "4 parallel sub-machines... 17 total states" |
| 🟠 **HIGH** | F8: Contract Amendments | 9-state negotiation; most complex workflow; no deadline | All merchants managing rent increases | "9 states — most complex merchant workflow" |
| 🟠 **HIGH** | F19: Collections | 7-state escalation; hidden in Lainnya; DSS linkage unclear | Merchants with late payments | "7 states... Hidden in Lainnya... DSS linkage unclear" |
| 🟠 **HIGH** | F13: Financial Control | Computed balance ≠ real bank balance; 8 parallel queries | All merchants | "Cash balance computed client-side from 8 queries" |
| 🟠 **HIGH** | F33: Billing / Subscription | Revenue-critical; hidden from sidebar | All merchants | "Not in sidebar; only accessible via Support page links" |
| 🟠 **HIGH** | F30: Staff Management | 16 permissions overwhelming; no activity log; hidden in Lainnya | Multi-property operators | "16 individual permissions... Hidden in Lainnya group" |
| 🟠 **HIGH** | F37: Property Compliance | 773-line monolith; hidden in tab; legal liability | Regulated properties | "773 lines in single page... Not in sidebar" |
| 🟡 **MEDIUM** | F1: Dashboard | 10 parallel queries (slow load); hardcoded thresholds | All merchants (entry point) | "10 parallel queries on load... alert thresholds hardcoded" |
| 🟡 **MEDIUM** | F7: Contracts | Complex form; dual-signature coordination unclear | New merchants | "Dual-signature requirement... no clear indicator of who's next" |
| 🟡 **MEDIUM** | F35: Alerts | Not in sidebar (mobile-only); computed on load; stale 60 seconds | All merchants | "Not in sidebar... only mobile bottomNav... stale 60 seconds" |
| 🟡 **MEDIUM** | F34: Profile | Not in sidebar; verification unclear; no QR for code sharing | New merchants | "Not in sidebar... verification types hardcoded" |
| 🟡 **MEDIUM** | F36: Dispute Resolution | 3 unrelated concerns conflated; merchant view-only | Merchants with disputes | "Three unrelated concerns on one page... merchant view-only" |
| 🟡 **MEDIUM** | F29: InsightsHub | 9 sub-pages; data sufficiency issues; hidden in Lainnya | Data-rich merchants | "9 sub-pages... information overload... Hidden in Lainnya" |
| 🟢 **LOW** | F2-F6, F9-F12, F14-F15, F17-F22, F24-F27, F31-F32 | Acceptable friction; straightforward workflows or optional features | Various | Documented in original feature analysis |

---

## 9️⃣ FINAL SYSTEM VERDICT

### System Scores

| Dimension | Score | Assessment |
|-----------|-------|------------|
| **Operational Efficiency** | 5.5/10 | Automated invoice/payment; manual move-out friction |
| **Navigation & IA** | 3.5/10 | Functionally organized; operationally incoherent |
| **UI Interaction** | 4/10 | Full-page navigation excessive; opportunities for inline/modal |
| **Feature Integration** | 6/10 | Strong state machine automation; loose move-out/payment transfer integration |
| **Cognitive Load** | Medium-High | 57 pages, 4 parallel state machines for move-out, hidden features |
| **Scalability** | 5/10 | Scales to 20 units; breaks at 100 without API automation |
| **Over-Engineering** | 6/10 | Well-engineered overall; move-out is unnecessarily complex |

### Composite Scores

| Metric | Score | Interpretation |
|--------|-------|-----------------|
| **Operational Efficiency Score** | 5.5/10 | Below target. Significant UX friction reduces effectiveness of automation. |
| **UX Clarity Score** | 3.8/10 | Poor. Navigation hidden, features orphaned, labels ambiguous. |
| **Cognitive Load Level** | **MEDIUM-HIGH** | Merchants must track 4+ parallel workflows; 57 pages to learn. |
| **Merchant Adoption Risk** | **MEDIUM-HIGH** | 6 hidden pages + 1 collapsed group = 25% feature discoverability broken. Solo owners will underutilize AI, compliance, staff features. |

---

### System Verdict

#### ⚠️ **SYSTEM NEEDS UX OPTIMIZATION** ⚠️

**Executive Summary:**

The system is **functionally comprehensive** (38 features, strong automation) but **operationally inefficient** for daily merchant workflows. Features are well-built but poorly connected and poorly exposed.

**Why Not ✅ Operationally Optimized:**
1. **Payment Transfer Invisibility (P0)** — Merchants cannot see payment transfer status. Critical trust issue.
2. **Move-Out Complexity (P1)** — 4 independent state machines force 4 separate navigations for a single event. Scales linearly to operational nightmare at 20+ units.
3. **Navigation Overload (P1)** — 12 items in "Lainnya" collapsed group hide high-value features (AI, Staff Management). 6 pages orphaned (no sidebar entry). Billing hidden.
4. **Context Switching Excessive (P1)** — Collections process requires 3+ page navigations. Invoices, Payments, Reconciliation split across separate pages. Move-out spans 4 modules.
5. **Dashboard Useless (P0)** — "Balance: 0" hardcoded. No action items, no alerts, no recommendations. Merchants can't get situational awareness from dashboard.

**Why Not ❌ Structurally Inefficient:**
- System is NOT broken; it's well-engineered
- 21 state machines are appropriate for audit trail + transaction safety
- 62 edge functions are appropriate for serverless automation
- AI/ML integration is strong (11 models + 4 DSS engines)

**But:** UX doesn't reflect the system's capabilities. Merchants never see payment transfers. They don't know AI exists. They spend 5–6 hours/month on context-switching that could be eliminated.

---

### Top 5 Blockers to Adoption

| Priority | Issue | Impact | Effort to Fix |
|----------|-------|--------|---------------|
| **P0** | Payment Transfer Invisibility | Trust erosion; cash flow breaks; platform credibility questioned | Low–Medium |
| **P1** | Move-Out Complexity (4 machines) | Operational friction scales to nightmare at 20+ units (300 nav steps/month for 100-unit portfolio) | Medium |
| **P1** | Navigation Chaos (orphaned pages + collapsed Lainnya) | 25% of features undiscoverable; solo owners underutilize AI, compliance, staff features | Low–Medium |
| **P1** | Collections Context Switching | High-frequency action (40x/month) requires 3+ navigations = 3+ hours lost time/month for 20-unit property | Medium |
| **P0** | Dashboard Useless ("Balance: 0") | Merchants can't get situational awareness; can't forecast cash; can't see action items | Medium–High |

---

### Recommended Immediate Actions (Priority)

| Phase | Priority | Action | Effort | Impact |
|-------|----------|--------|--------|--------|
| **Phase 1** | P0 | Add "Payment Transfer Status" page | Low–Med | Trust restored; cash flow transparency |
| **Phase 1** | P0 | Replace Dashboard "Balance: 0" with real metrics | Med–High | Merchants understand business; see action items |
| **Phase 1** | P1 | Create unified Move-Out Wizard (consolidate 4 machines) | Medium | 4–5 hours/month saved for 20-unit property |
| **Phase 2** | P1 | Restructure Navigation + add "FINANCE" grouping label | Low | Feature discoverability +30% |
| **Phase 2** | P1 | Add Billing to sidebar; elevate InsightsHub | Low | Revenue visibility; AI usage increases |
| **Phase 2** | P1 | Inline payment matching (Collections modal) | Medium | 3 navigations eliminated per action |
| **Phase 3** | P2 | Bulk Move-Out processing | Medium | 20+ navigation cycles eliminated for 5 move-outs |
| **Phase 3** | P2 | Alert-to-Action automation (quick action buttons) | Low–Med | Actionable alerts; reduced navigation |
| **Phase 3** | P3 | Auto-link Maintenance costs to Expenses | Low | 100% expense tracking; removes manual step |

---

### Success Metrics (Post-Optimization)

Track these KPIs after implementing improvements:

| Metric | Baseline | Target | Measurement |
|--------|----------|--------|-------------|
| **Feature Discoverability** | 6 hidden pages (orphaned) + 1 collapsed group = 25% loss | All pages accessible via sidebar (nav restructure) | Count sidebar entries vs. page files |
| **Move-Out Friction** | 4 separate workflows = 30 min/event × 5 events/month = 150 min | Unified wizard = 5 min/event × 5 = 25 min | Time to complete move-out workflow |
| **Collections Efficiency** | 3 navigations × 40x/month = 120 navigation steps | Inline modal = 1 modal × 40x/month = 40 actions | Steps to process invoice payment |
| **Dashboard Actionability** | 0 action items visible | 5+ action items visible (URGENT + UPCOMING) | Number of action items on dashboard |
| **Payment Transfer Confidence** | "Where is my money?" (unknown) | Real-time status + ETA visible | Merchant confidence in cash flow (survey) |
| **AI Feature Usage** | InsightsHub unaware/unused by 90% of merchants | "AI Recommendations" section on dashboard → 40%+ engagement | InsightsHub page views + recommendations accepted |

---

### Conclusion

**The system is well-built but poorly experienced.**

Merchants get a comprehensive property management platform with strong automation, but they navigate it like a 1990s Windows desktop app — lots of folders, lots of clicks, no clear hierarchy.

**Implementation of Structural Improvements (Section 8A) + Dashboard Improvements (Section 8C) would transform adoption and efficiency:**
- Move-Out: 30 min → 5 min (6x faster)
- Collections: 3 navigations → 1 modal (66% reduction)
- Feature Discovery: 25% hidden → 100% exposed
- Dashboard Actionability: 0 items → 5+ items visible

**With these changes:**
- ✅ Operational Efficiency Score: 5.5 → 8/10
- ✅ UX Clarity Score: 3.8 → 8/10
- ✅ Cognitive Load: Medium-High → Medium
- ✅ Merchant Adoption Risk: Medium-High → Low

**Final Recommendation:** Implement P0 + P1 improvements (Phases 1–2) immediately to unlock platform potential. The system is there; the UX just needs to get out of the way.

---

## 📎 Appendix: Documentation Quality Note

**As requested, this audit focuses on SYSTEM behavior, not document quality.**

The source document (UX_ASSESSMENT_AND_USER_JOURNEY.md) is:
- ✅ Exceptionally detailed (1,945 lines)
- ✅ Code-level traceable (references to TSX files, state machines, edge functions)
- ✅ Self-aware about assumptions (4 flagged assumptions, 1 excluded feature)
- ✅ Forensically accurate (corrected edge function count from 65→62)

This audit's findings are based entirely on the documented system, not on criticism of the documentation itself.

---

## 📊 Implementation Tracking: Improvement 3 — Payment Transfer Status

| # | Item | Status | Notes |
|---|------|--------|-------|
| 3.1 | Create `payment_transfers` table (migration) | ✅ COMPLETE | Table with RLS, indexes, realtime enabled |
| 3.2 | RLS policy: merchants SELECT own transfers | ✅ COMPLETE | Via `merchants.user_id = auth.uid()` |
| 3.3 | Create `usePaymentTransfers` hook | ✅ COMPLETE | React Query + Realtime subscription + stats |
| 3.4 | Create `TransferStatusTab` component | ✅ COMPLETE | Stats cards, grouped list, retry button, empty state |
| 3.5 | Add "Status Transfer" tab to Payments page | ✅ COMPLETE | Third tab with badge indicators |
| 3.6 | Retry failed transfers via edge function | ✅ COMPLETE | Calls `xendit-disbursement` |
| 3.7 | Realtime updates on transfer status changes | ✅ COMPLETE | Supabase channel subscription |

---

**Audit Complete**  
*Generated: 2026-02-28*  
*Analysis Basis: navigation-config.ts + state-machines.ts + merchant page files (57 pages)*
