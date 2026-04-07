# AUDIT FINDINGS → IMPLEMENTATION TASK MAPPING
## Cross-reference guide for all gaps and their fixes

---

## CRITICAL FINDINGS (High Risk) → FIXES

### 1.1 Kompleksitas Sistem vs. Kebutuhan
**Audit Finding**: 14 diagrams, 60+ edge functions, 30+ state machines - overkill for SMB  
**Impact**: Adoption barrier, learning curve, operational errors

**Implementation Tasks**:
- ✅ **Phase 0.1**: Merchant Verification Redesign
  - Task 0.1.1: Redefine 3 verification tiers (Quick/Standard/Premium)
  - Task 0.1.2: Simplified onboarding flow (<2 minutes)
  - **Result**: Tier 1 users skip all complexity, get instant access
  
- ✅ **Phase 0.3**: API & State Machine Validation
  - Task 0.3.1: Update invoice state machines (remove manual steps)
  - Task 0.3.2: Update payment status lifecycle (auto-transitions)
  - **Result**: System automation reduces manual decision points

- ✅ **Phase 1.1 & 1.2**: Simplify UX with focused dashboard
  - Task 1.1.1: Collections dashboard (single view of key metrics)
  - Task 1.2.1: Auto-payment matching (remove manual review step)
  - **Result**: 80% of use cases covered by 5 key features (not 14 diagrams)

**Business Outcome**: Pemilik can use system within 2 min of signup, no training needed

---

### 1.2 Financial Control Gaps – Tidak Ada Real-time Cash Visibility
**Audit Finding**: Invoice aging, payment metrics, collections dashboard missing  
**Impact**: Can't see outstanding, cash flow delays, slow financial decisions

**Implementation Tasks**:

**A. Outstanding Visibility**:
- ✅ **Phase 1.1**: Collections Dashboard (Task 1.1.1, 1.1.2, 1.1.3)
  - Widget: "Outstanding (By Age)" with buckets <7d, 7-14d, 14-30d, 30+d
  - Calculation: outstanding_amount = invoice.amount - matched_payments
  - Drill-down: Click bucket → see list of tenants + amounts
  - **SLA**: Real-time update on payment verified
  - **Result**: Pemilik lihat dalam 10 seconds: total outstanding, breakdown, expected weekly

**B. Payment Performance Tracking**:
- ✅ **Phase 1.3**: Automated Payment Reminders (Task 1.3.1)
  - Escalation schedule: T+2, T+5, T+10, T+15
  - Track: Every reminder sent (success/failure)
  - **Result**: Clear audit trail of collection efforts

- ✅ **Phase 2.4**: Collections Case Management (Task 2.4.2)
  - Report: Collections performance (daily/weekly/monthly)
  - Metric: Collection rate %, aging at month-end, trend
  - **Result**: See which tenants are problem payers

**C. Cash Forecasting**:
- ✅ **Phase 1.1**: "Expected This Week" widget
  - Calculation: SUM(invoices due next 7 days)
  - **Result**: Know exact cash to expect this week

**D. Escrow & Deposit Tracking** (partially revised):
- ❌ Merchant deposit escrow: REMOVED (replaced with direct refund flow, no holding period)
- ✅ Vendor escrow: KEPT for maintenance vendor payment safety (48h auto-release, dispute handling)
- ⚠️ Deposit tracking: Use expenses table + direct bank transfer for tenant deposit refunds

**Business Outcome**: Pemilik with 30 units + Rp 300M/month revenue now knows:
- ✅ Total outstanding hari ini
- ✅ Breakdown by aging
- ✅ Expected collections this week
- ✅ Which tenants selalu telat
- ✅ Cash to budget for own obligations

---

### 1.3 Payment Verification Bottleneck – Manual Process Delays Cash
**Audit Finding**: PENDING → VERIFYING → VERIFIED takes 3-5 days, manual review  
**Impact**: Slow cash recognition, misalignment between tenant/owner perception

**Implementation Tasks**:

- ✅ **Phase 0.3**: Update Payment Status Lifecycle (Task 0.3.2)
  - Remove `VERIFYING` status (was the bottleneck)
  - New states: PENDING → AUTO_VERIFIED (1h) OR PENDING_REVIEW (24h SLA)
  
- ✅ **Phase 1.2**: Smart Payment Matching (Task 1.2.1, 1.2.2)
  - **Tier 1 (95% of cases)**: Exact match (amount = invoice, known payer)
    - Logic: Automatic verification, mark as VERIFIED within 1 hour
    - Tenant sees immediately: "Payment confirmed"
  - **Tier 2 (3%)**: Amount mismatch (partial, overpayment, late)
    - Logic: Auto-suggest action (apply to next invoice, partial payment, refund)
    - Verification still within 2 hours
  - **Tier 3 (2%)**: Manual review (new account, unusual amount)
    - Logic: 24-hour SLA for pemilik review
  - **Target**: 95% auto-verified within 2 hours

**Business Outcome**: 
- ✅ Tenant transfers Rp 1.2M on day 25 → verified same day or within 2 hours
- ✅ Pemilik sees payment in dashboard immediately after verification
- ✅ Can do financial close without waiting 3-5 days
- ✅ Reconciliation automated (no manual matching)

---

### 1.4 Lack of Tenant Lifecycle Visibility
**Audit Finding**: Tenant info scattered (onboarding, contract, maintenance, payment, disputes)  
**Impact**: Can't make data-driven decisions on renewal, retention, or risk

**Implementation Tasks**:

- ✅ **Phase 1.5**: Tenant Profile Consolidation (Task 1.5.1, 1.5.2)
  - Single page with:
    - **Tab 1 - Contract**: Current lease dates, rent, renewal status
    - **Tab 2 - Payment**: 12-month timeline, on-time %, late days avg, outstanding, recent payments
    - **Tab 3 - Maintenance**: Request count, issue types, cost, maintenance score
    - **Tab 4 - Compliance**: Violations, disputes, complaints
    - **Tab 5 - Quality Score**: Overall 0-100, risk level, renewal recommendation
  - **Quality Score Formula** (Task 1.5.2):
    - Payment score (40%): on-time % minus late day penalty
    - Maintenance score (20%): request frequency minus damage penalty
    - Compliance score (20%): violations minus dispute penalty
    - Communication score (20%): response time + resolution rate
    - Overall = weighted sum (0-100)
    - Risk level: LOW (>=80), MEDIUM (60-79), HIGH (40-59), CRITICAL (<40)
    - Recommendation: RENEW_HIGH_PRIORITY, RENEW_STANDARD, MONITOR, DO_NOT_RENEW

- ✅ **Phase 2.3**: Lease Renewal Workflow (Task 2.3.1)
  - 60 days before expiry: Dashboard alert + show quality score
  - 30 days before: Auto-send renewal offer (based on recommendation)
  - 7 days before: Reminder if no response
  - Track: Tenant acceptance/rejection, create new contract
  - **Result**: Use quality score to decide renewal terms

**Business Outcome**: Pemilik answers in 10 seconds:
- ✅ Is this good tenant? (Risk level + quality score)
- ✅ Should I renew? (Recommendation)
- ✅ What are the issues? (Maintenance cost, late payment history, complaints)
- ✅ What terms should I offer? (Suggested price increase based on quality)

---

### 1.5 Lack of Operational Dashboard
**Audit Finding**: No collection dashboard, aging analysis, payment performance tracking  
**Impact**: Collections manual, slow to identify problem payers, can't forecast cash

**Implementation Tasks**:

- ✅ **Phase 1.1**: Collections Dashboard (Task 1.1.1, 1.1.2, 1.1.3)
  - Widget 1: "Collections Today" (amount, count)
  - Widget 2: "Outstanding (By Age)" (aging buckets with $)
  - Widget 3: "Expected This Week" (forecasted collections)
  - Widget 4: "Collection Rate This Month" (%)
  - Detail table: Unit, tenant, amount, days overdue, last payment, actions
  
- ✅ **Phase 2.4**: Collections Reporting (Task 2.4.2)
  - Report 1: Collections performance (daily/weekly/monthly totals, rates, trends)
  - Report 2: Per-tenant collection rate (sorted by on-time %)
  - Report 3: Collections cases (open, status breakdown, outcomes)

- ✅ **Phase 1.4**: Expense Tracking (Task 1.4.2, 1.4.3)
  - Dashboard: Operating expenses breakdown (by category with %)
  - P&L quick view: Revenue - Expenses = Profit
  - Profitability alerts (if <60% or outstanding >15%)

**Business Outcome**: Pemilik sees dashboard on login:
- ✅ "Collections Today": Rp 50M (15 payments)
- ✅ "Outstanding": Rp 115M (aging breakdown)
- ✅ "Expected This Week": Rp 250M
- ✅ "Collection Rate": 85%
- ✅ Problem units clearly visible → take action

---

### 1.6 Merchant Verification Too Strict
**Audit Finding**: KTP + SIUP required for all users, 3-5 day approval, adoption blocker  
**Impact**: High barrier to signup, high churn in month 1

**Implementation Tasks**:

- ✅ **Phase 0.1**: Verification Tier Redesign
  - **Tier 1 (Quick Signup)**: Email + phone OTP only, instant activation <2 min
    - For: Individual kosan owner <50 unit, no documents
    - Activation: Immediate
    - Feature limit: View-only first 7 days, limited payment methods
  - **Tier 2 (Standard)**: Tier 1 + KTP + SIUP (or SPT), 1-3 days review
    - For: Individual with SIUP or small corporate
    - Unlock: Full feature access
  - **Tier 3 (Premium)**: Tier 2 + business cert + phone call, 3-5 days review
    - For: Large corporate, multi-property
    - Benefit: Dedicated account manager, API access

- ✅ **Phase 0.1.2**: Simplified Onboarding (<2 minutes)
  - Step 1 (Email + Phone): 0-2 min
  - Step 2 (Basic info): 2-5 min (can skip for Tier 1)
  - Step 3 (First login): 5 min → dashboard + tutorial
  - **Result**: User is productive within 5 minutes

**Business Outcome**:
- Month 1: 80% signup rate (vs current 20% if strict)
- 7-day activation vs 3-5 day wait
- Can upgrade to Tier 2/3 later

---

## MAJOR FINDINGS (Medium Risk) → FIXES

### 2.1 No Tenant Portal
**Audit Finding**: Tenant payment, maintenance request, invoice view all manual (call/visit pemilik)  
**Impact**: Low payment adoption, high pemilik workload, tenant dissatisfaction

**Implementation Tasks**:

- ✅ **Phase 2.1**: Tenant Portal (Task 2.1.1, 2.1.2, 2.1.3)
  - Pages:
    - Dashboard: Next due invoice, action buttons
    - Invoices & Payments: View, download, payment history
    - Make Payment: Select invoice → payment method → upload proof → confirmation
    - Maintenance Requests: List open, [New request], track status
    - Messages/Support: Chat, FAQ, support tickets
  - Payment verification: Auto-verify within 2h of upload
  - Security: OTP login, session timeout 15 min, data isolation
  
- ✅ **Phase 1.2**: Payment Auto-verification (Task 1.2.1, 1.2.2)
  - Tenant upload proof → system verify <2h → tenant sees "Confirmed" in portal

**Target Outcome**: 50% of payments via portal by week 12

---

### 2.2 No Waiting List Management
**Audit Finding**: Vacancy = manual applicant tracking, slow fill time  
**Impact**: Vacancy downtime, lost revenue, poor unit utilization

**Implementation Tasks**:

- ✅ **Phase 2.2**: Waiting List & Applicant Management (Task 2.2.1, 2.2.2, 2.2.3)
  - Waiting list: Add applicant (name, phone, email, move-in date, budget, needs)
  - Offer workflow: Auto-generate offer letter, send via email with photos
  - Tracking: Acceptance deadline (7 days), auto-reminder at day 5, auto-reject if no response
  - Vacancy automation:
    1. Unit vacant → System finds top 3 matching candidates
    2. Suggest to pemilik: "Send offer to these 3?"
    3. Auto-send if approved
    4. Track responses
    5. If acceptance: Auto-create contract
    6. If rejection: Try next candidate
    7. If no response: Auto-reject, try next
  - Applicant quality scoring: Score by preferred date match + budget match + reliability

**Target Outcome**: 70% reduction in vacancy downtime, auto-fill vacancies

---

### 2.3 No Lease Renewal Workflow
**Audit Finding**: Lease renewals forgotten, manual follow-up, tenant uncertainty  
**Impact**: Tenant churn, lease gaps, compliance risk

**Implementation Tasks**:

- ✅ **Phase 2.3**: Lease Renewal & Amendment (Task 2.3.1, 2.3.2)
  - Alert schedule:
    - 60 days before expiry: Dashboard alert to pemilik, show quality score
    - 30 days before: Auto-send renewal offer (email + portal + SMS)
    - 7 days before: SMS reminder if no response
    - End date: Auto-generate move-out notice if not renewed
  - Amendment workflow:
    - Types: Rent adjustment, lease extension, term modification
    - Process: Generate document → send to tenant → e-sign → store → notify
  - Tracking: Move-out notice, overholding detection (>7 days → collections case)

**Target Outcome**: 100% lease renewals managed via system, no missed deadlines

---

### 2.4 No Waiting List & Occupancy Forecasting
**Audit Finding**: No visibility into future vacancies, no occupancy planning  
**Impact**: Overstaffing/understaffing, poor marketing timing, lost revenue

**Implementation Tasks**:

- ✅ **Phase 3.2**: Occupancy Forecasting (Task 3.2.1, 3.2.2)
  - Model:
    1. Calculate historical moveout rate (last 12 months)
    2. Predict next month moveouts = rate * units
    3. Count confirmed moveouts (from contracts)
    4. Estimate movein from waiting list (70% conversion)
    5. Calculate predicted occupancy
    6. Set confidence (50%-85% based on data availability)
  - Output: "Unit X will be vacant on date Y" (30 days warning)
  - Automation:
    - Notify pemilik 30 days before
    - Recommend: Start marketing
    - Check waiting list for matches
    - Mark unit "Pre-vacant" for cleaning/repair

**Target Outcome**: 
- Minimize vacancy downtime
- Proactive marketing (not reactive after move-out)
- Forecast accuracy >80% for next-month occupancy

---

### 2.5 No Dynamic Pricing
**Audit Finding**: Fixed pricing, missing revenue opportunities (peak season premium, low occupancy discount)  
**Impact**: Suboptimal revenue, can't compete with market, poor occupancy response

**Implementation Tasks**:

- ✅ **Phase 3.1**: Dynamic Pricing Strategy (Task 3.1.1, 3.1.2)
  - Market tracking:
    - Dashboard: Show market rate (avg of comparables), your rate, position (% above/below)
    - Recommendation: Increase, maintain, or decrease
    - Quarterly update: Recalculate from market data
  - Rule types:
    - Occupancy-based: +5% at 95% occupancy, -10% at 60%
    - Seasonal: +15% Dec/Jan, customizable
    - Long-lease discount: -4% for 3mo, -6% for 6mo, -10% for 12mo
  - Apply: When new lease negotiated, show recommended price
  - Track: Which rules applied to which lease

**Target Outcome**: 
- 30%+ of operators adopt pricing recommendations
- Revenue increase from optimal pricing (vs fixed)

---

### 2.6 No Maintenance ROI Tracking
**Audit Finding**: Maintenance costs unclear, no preventive vs reactive analysis  
**Impact**: Over/under-maintenance, poor cost control, reactive emergencies

**Implementation Tasks**:

- ✅ **Phase 3.3**: Maintenance ROI Analytics (Task 3.3.1, 3.3.2, 3.3.3)
  - Cost tracking:
    - By category: AC, plumbing, electrical, cleaning, other
    - Preventive vs reactive breakdown
  - Unit economics: Monthly rent - maintenance cost = net profit
  - Maintenance as % of rent (alert if >10%)
  - Cost breakdown: Which item costs most, where to optimize
  - Asset lifecycle:
    - Depreciation schedule
    - Expected lifespan tracking
    - Replacement planning (3-year maintenance plan with budget)

**Target Outcome**:
- Clear visibility on maintenance spend
- Recommendation: Increase preventive (cheaper than reactive)
- 3-year asset replacement plan with budget allocation

---

### 2.7 Limited Financial Reporting
**Audit Finding**: No P&L, weak expense tracking, no tax compliance prep, limited unit economics  
**Impact**: Difficult to assess profitability, tax preparation slow, business decisions guesswork

**Implementation Tasks**:

- ✅ **Phase 1.4**: Expense Tracking (Task 1.4.1, 1.4.2, 1.4.3)
  - Entry: Manual or OCR receipt upload
  - Categories: Utilities, maintenance, insurance, taxes, marketing, admin, payroll, other
  - Aggregation: Monthly total, % by category, trend vs last month
  - Profit calculation: Revenue - Expenses = Profit %
  
- ✅ **Phase 3.4**: Financial Reporting (Task 3.4.1, 3.4.2, 3.4.3)
  - Monthly P&L: Revenue, collections, expenses, profit margin
  - Unit economics: Per-unit monthly rent, occupancy, annual profit, ROI %
  - Tax compliance: PBB (property tax), PPh (income tax), SIUP/NPWP tracking
  - Drill-down: Click category → detail → transactions
  
- ✅ **Phase 3.5**: Multi-property Consolidation (Task 3.5.1, 3.5.2)
  - Cross-property P&L (consolidated)
  - Identify top/bottom performer properties
  - Bulk operations (rent increase, maintenance scheduling)

**Target Outcome**:
- Pemilik generate month-end P&L in <10 minutes
- Clear unit profitability (ROI per unit)
- Tax filing data ready (no manual compilation)
- Business decisions data-driven (not gut feel)

---

### 2.8 No Collections Automation
**Audit Finding**: Payment reminders manual, escalation unclear, collections effort high  
**Impact**: High write-offs, staff workload, inconsistent collection rates

**Implementation Tasks**:

- ✅ **Phase 1.3**: Automated Reminders with Escalation (Task 1.3.1, 1.3.2, 1.3.3)
  - Schedule:
    - T+2 days: EMAIL (friendly reminder)
    - T+5 days: SMS (firmer)
    - T+10 days: WhatsApp + personal (urgent)
    - T+15 days: EMAIL notice + AUTO-CREATE collections case
  - Collections case:
    - Auto-generated at 15+ days overdue
    - Pemilik actions: Review, contact, payment plan, dispute, write-off
  - Audit trail: All reminders logged (sent, delivery status, failure reason)
  - Preferences: Pemilik customize (enable/disable, channels, timing)

- ✅ **Phase 2.4**: Collections Case Management (Task 2.4.1, 2.4.2)
  - Case lifecycle: Creation → investigation → resolution
  - Payment plans: Installment agreements with tracking
  - Reporting: Collections performance, per-tenant rates, case statuses

**Target Outcome**:
- 70% reduction in manual follow-up effort
- Automated escalation chain (no missed reminders)
- 85%+ collection rate (vs 70% manual)

---

## MEDIUM FINDINGS (Lower Risk) → FIXES

### 3.1 Poor Notification Preferences
**Audit Finding**: Users can't customize notifications, receiving unwanted messages  
**Impact**: User annoyance, feature disabling

**Implementation Tasks**:

- ✅ **Phase 1.3.3**: Reminder Preference Control
  - Settings: Enable/disable reminders
  - Channels: Email, SMS, WhatsApp (select which)
  - Timing: Adjust default schedule (T+2, T+5, T+10, T+15)
  - Templates: Default or custom message template
  - Escalation: Choose auto-create case or manual

**Result**: Pemilik has full control over reminders

---

### 3.2 No Performance Benchmarking
**Audit Finding**: No comparison to market/peers, can't assess if doing well  
**Impact**: No market intelligence, poor pricing decisions

**Implementation Tasks**:

- ✅ **Phase 3.1.1**: Market Rate Tracking
  - Dashboard: Compare your price to market average
  - Data: Aggregated from market listings + platform historical data
  - Recommendation: Increase, maintain, decrease
  - Quarterly update

**Result**: Pemilik knows if over/under priced vs market

---

### 3.3 Subscription Model Unclear
**Audit Finding**: Value alignment weak, pricing doesn't match feature set for SMB  
**Impact**: Difficult to sell, customer confusion

**Implementation Tasks**:

- **Phase 4.1**: Launch Strategy (post-implementation)
  - Tiered pricing:
    - LITE (free): Basic tenant + payment tracking (for first 5 units)
    - STANDARD (Rp 100K/month): All features except analytics (for 5-50 units)
    - PRO (Rp 300K/month): All features + API + dedicated support (for 50+ units)
  - 30-day free trial for all tiers
  - Clear feature matrix showing what unlocks at each tier

**Result**: Obvious value per tier, easy decision for pemilik

---

## IMPLEMENTATION PRIORITY MATRIX

```
┌─────────────────────────────────────────────────────────────┐
│                    IMPLEMENTATION PRIORITY                   │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│ CRITICAL PATH (Weeks 1-7, Phase 0-1):                       │
│ =====================================                        │
│ 1. Phase 0.1 - Merchant verification simplification         │
│    → Without this: No users → Can't test anything           │
│                                                               │
│ 2. Phase 0.2 - Database structure audit                      │
│    → Without this: Features will fail or be slow             │
│                                                               │
│ 3. Phase 1.1 - Collections dashboard                         │
│    → Without this: Pemilik can't see key metrics             │
│                                                               │
│ 4. Phase 1.2 - Payment auto-reconciliation                   │
│    → Without this: Payment verification bottleneck remains   │
│                                                               │
│ 5. Phase 1.4 - Expense tracking                              │
│    → Without this: Profit calculation incomplete             │
│                                                               │
│ 6. Phase 1.5 - Tenant profile consolidation                  │
│    → Without this: Can't make renewal decisions              │
│                                                               │
│ SUCCESS CHECKPOINT (Week 4):                                 │
│ All CRITICAL features working, ready for Phase 2             │
│                                                               │
│ OPERATIONAL UNLOCK (Weeks 8-12, Phase 2):                    │
│ =======================================                       │
│ 7. Phase 2.1 - Tenant portal                                 │
│    → Unlocks: 50% of payments via self-service              │
│                                                               │
│ 8. Phase 2.2 - Waiting list & vacancy automation             │
│    → Unlocks: Auto-fill vacancies, reduce downtime           │
│                                                               │
│ 9. Phase 2.3 - Lease renewal automation                      │
│    → Unlocks: Never miss renewal deadline                    │
│                                                               │
│ INTELLIGENCE & OPTIMIZATION (Weeks 13-16, Phase 3):          │
│ =================================================             │
│ 10. Phase 3.1 - Dynamic pricing                              │
│ 11. Phase 3.2 - Occupancy forecasting                        │
│ 12. Phase 3.3 - Maintenance ROI analytics                    │
│ 13. Phase 3.4 - Financial reporting                          │
│ 14. Phase 3.5 - Multi-property consolidation                 │
│ 15. Phase 3.6 - AI/ML: Build all 6 models (gated deploy)    │
│     → Pricing advisor live at launch (10%), 5 post-launch    │
│ 16. Phase 3.7 - Referral MVP (feature-flag OFF at launch)    │
│     → Enable week 20+ if demand >30%                         │
│     → These unlock revenue optimization & advanced insights  │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## DEPENDENCY GRAPH

```
Phase 0: FOUNDATION
├─ 0.1 Verification simplification (independent)
├─ 0.2 Database audit & additions (independent)
└─ 0.3 State machine validation (independent)
    ↓↓↓ (all must complete before Phase 1)

Phase 1: CRITICAL ADOPTION (parallel safe)
├─ 1.1 Collections dashboard
│  ├─ depends: invoices, payments tables
│  ├─ required by: 1.2, 1.3, 2.4, 3.4
├─ 1.2 Payment auto-reconciliation
│  ├─ depends: 1.1, payment matching logic
│  ├─ required by: 1.3, 2.1
├─ 1.3 Payment reminders & escalation
│  ├─ depends: 1.2
│  ├─ required by: 2.4
├─ 1.4 Expense tracking
│  ├─ independent
│  ├─ required by: 1.5 (profit calc), 3.4
├─ 1.5 Tenant profile consolidation
│  ├─ depends: 1.1 (payment history), 1.4 (expenses)
│  ├─ required by: 2.3 (renewal decisions)
    ↓↓↓ (SUCCESS CHECKPOINT: Week 4)

Phase 2: OPERATIONS UNLOCK (sequence)
├─ 2.1 Tenant portal
│  ├─ independent (can start parallel to Phase 1)
│  ├─ required by: 2.2, 2.3
├─ 2.2 Waiting list & applicant management
│  ├─ depends: 2.1 (optional, portal shows applicants)
│  ├─ required by: 2.3
├─ 2.3 Lease renewal & amendment
│  ├─ depends: 1.5 (quality scores), 2.2 (applicants)
├─ 2.4 Collections case management
│  ├─ depends: 1.3 (auto-cases)
│  ├─ required by: 3.4 (reporting)

Phase 3: INTELLIGENCE + AI/ML + REFERRAL (all parallel)
├─ 3.1 Dynamic pricing (independent)
├─ 3.2 Occupancy forecasting
│  ├─ depends: occupancy history (2-3 months data)
├─ 3.3 Maintenance ROI analytics
│  ├─ depends: maintenance_expenses table
├─ 3.4 Financial reporting
│  ├─ depends: 1.4 (expenses), invoices, payments, 2.4 (cases)
├─ 3.5 Multi-property consolidation
│  ├─ depends: all above features working
├─ 3.6 AI/ML: Build all 6 models (parallel)
│  ├─ Infrastructure: A/B testing, feature-flags, monitoring
│  ├─ Deploy: pricing advisor to 10% at launch
│  └─ Gate: remaining 5 for post-launch (confidence thresholds)
├─ 3.7 Referral MVP (2 weeks)
│  ├─ Simple link + email + tracking + Rp 100K bonus
│  ├─ Feature-flag OFF at launch
│  └─ Enable week 20+ if demand >30%

Phase 4: LAUNCH
├─ Week 16: Final QA
├─ Week 17: Soft launch (500 early adopters)
└─ Week 18: Full launch (public)
    ├─ 1 AI live (pricing advisor, 10% merchants)
    └─ Referral hidden (feature-flag OFF)

Phase 5: POST-LAUNCH (Weeks 19-26)
├─ Week 19: Deploy occupancy forecast if >75% confidence
├─ Week 20: Referral decision gate (>30% demand = enable)
├─ Weeks 21-26: Staggered AI deployment (confidence-gated)
└─ Fallback: Keep built but disabled if thresholds not met
```

---

## TESTING STRATEGY BY PHASE

| Phase | Test Focus | Criteria | Owner |
|-------|-----------|----------|-------|
| 0 | Database integrity, state machine transitions, onboarding flow | All tables created, <2 min onboarding, auto-transitions work | Backend |
| 1 | Dashboard accuracy, payment matching, calculations | Outstanding correct, 80% auto-match, profit = manual calc | Backend + QA |
| 2 | Portal UX, automation workflows, lease renewal SLA | <2 min payment, 70% adoption, 100% renewals tracked | Frontend + QA |
| 3 | Forecast accuracy, pricing recommendations, report generation | Forecast 80% accurate, pricing matched to market, P&L <10 min | Analytics + QA |
| 4 | End-to-end workflows, user acceptance, system stability | All features work, NPS >50, no data loss | QA + Product |

---

## BUSINESS METRICS (Post-Launch)

| Metric | Target | How Measured | Owner |
|--------|--------|--------------|-------|
| Activation time | <2 min | Measure from signup email click to first login | Product |
| Collections dashboard accuracy | 100% | Verify outstanding = manual sum | Finance |
| Payment auto-match rate | 80%+ | Count matched / total | Product |
| User NPS | >50 | Post-signup survey | Product |
| Portal adoption | 50% of payments | Track payment.source = portal | Product |
| Lease renewal completion | 100% of cases | Track auto-reminders sent & renewals completed | Operations |
| Occupancy forecast accuracy | 80% | Compare predicted vs actual next month | Analytics |
| Collection rate improvement | +10% | Compare vs baseline (pre-automation) | Finance |
| Financial reporting time | <10 min / month | Time to generate P&L | Product |
| Premium feature adoption | 20% | % of users upgrading to STANDARD/PRO | Product |

---

**Document prepared for**: PMS Development Team  
**Version**: 1.0  
**Last updated**: 2026-02-26  
**Audience**: Project managers, developers, QA, product managers
