# PMS IMPLEMENTATION CHECKLIST
## Quick Reference for Phase-by-Phase Execution

---

## PHASE 0: FOUNDATION (Weeks 1-2)
**Focus**: Reduce adoption friction, prepare database

### 0.1 Merchant Verification Simplification
- [ ] 0.1.1 Define 3 verification tiers (Quick/Standard/Premium)
  - [ ] Tier 1: Email + phone OTP only (instant, <2 min)
  - [ ] Tier 2: Add KTP + SIUP (1-3 days)
  - [ ] Tier 3: Add business cert + call (3-5 days)
- [ ] 0.1.2 Redesign onboarding to <2 minutes for Tier 1
  - [ ] Email verification flow
  - [ ] Phone OTP verification
  - [ ] Minimal info collection (skip documents)
  - [ ] First login → quick tutorial (3 slides)
- [ ] Database changes:
  - [ ] merchants: Add `verification_tier` (ENUM)
  - [ ] merchants: Update `verification_status` values
  - [ ] merchant_verifications: Support auto-approval

### 0.2 Database Structure Audit & Additions
- [ ] 0.2.1 Review existing tables
  - [ ] Identify missing tables (expenses, waiting_list, etc)
  - [ ] Check denormalization for performance
- [ ] 0.2.2 Create missing tables
  - [ ] `expenses` (operating expenses, OCR support)
  - [ ] `waiting_list` (applicant queue)
  - [ ] `tenant_quality_scores` (scoring logic)
  - [ ] `lease_renewal_alerts` (automation tracking)
  - [ ] `dynamic_pricing_rules` (pricing strategy)
  - [ ] `occupancy_forecast` (predictions)
  - [ ] `payment_reminders_log` (audit trail)

### 0.3 API & State Machine Validation
- [ ] 0.3.1 Update invoice state machine
  - [ ] Remove `VERIFYING` status (was bottleneck)
  - [ ] Add auto transitions (ISSUED→DUE→OVERDUE→ESCALATED)
  - [ ] Remove manual invoice status changes
- [ ] 0.3.2 Update payment status lifecycle
  - [ ] PENDING → AUTO_VERIFIED (1h, known accounts)
  - [ ] PENDING → PENDING_REVIEW (24h SLA, new/unusual)
  - [ ] Smart matching logic for auto-verify

**Exit Criteria**:
- All 7 new tables created with indexes
- Verification tiers implemented & tested
- State machines updated in API
- <2 min onboarding flow working end-to-end

---

## PHASE 1: CRITICAL ADOPTION FIXES (Weeks 3-7)
**Focus**: Real-time visibility + cash flow + financial completeness

### 1.1 Collections Dashboard (2 weeks)
- [ ] 1.1.1 Create Collections Overview widgets
  - [ ] Widget: "Collections Today" (real-time amount, payment count)
  - [ ] Widget: "Outstanding by Age" (<7d, 7-14d, 14-30d, 30+d buckets)
  - [ ] Widget: "Expected This Week" (forecasted collections)
  - [ ] Widget: "Collection Rate This Month" (% success)
  - [ ] Color coding: yellow/<7d, orange/7-14d, red/14-30d, dark-red/30+d
  
- [ ] 1.1.2 Create drill-down views
  - [ ] Click aging bucket → see tenant list table
  - [ ] Table columns: Unit, Tenant, Amount, Days overdue, Last payment, Action
  - [ ] Quick actions: Send reminder, Create case, Mark disputed
  
- [ ] 1.1.3 Data aggregation logic
  - [ ] Create view: `v_outstanding_summary`
  - [ ] Calculation: outstanding = invoice.amount - matched_payments
  - [ ] Aging bucket assignment logic (based on due_date)
  - [ ] Real-time update on payment.verified
  - [ ] Daily batch for state transitions (ISSUED→DUE→OVERDUE)
  
- [ ] Database/Query:
  - [ ] Index: `(merchant_id, status, due_date DESC)` on invoices
  - [ ] Create materialized view for performance
  - [ ] Test query performance with 10k invoices

**Expected Output**: Pemilik lihat dalam 10 seconds: total outstanding, breakdown by age, expected weekly collections

### 1.2 Automated Payment Reconciliation (1 week)
- [ ] 1.2.1 Smart payment matching algorithm
  - [ ] Tier 1 (95%): Exact match (amount = invoice, known payer)
    - [ ] Logic: payment.amount == invoice.amount AND payer_whitelisted → AUTO_VERIFIED + AUTO_MATCHED
  - [ ] Tier 2 (3%): Amount mismatch scenarios
    - [ ] Overpayment: suggest apply to next / refund
    - [ ] Partial payment: mark as PARTIALLY_PAID, auto-reminder for remainder
    - [ ] Late payment: auto-assign to older overdue invoice
  - [ ] Tier 3 (2%): Manual review (new account, unusual amount)
    - [ ] Set status: PENDING_REVIEW
    - [ ] 24h SLA for pemilik review
  
- [ ] 1.2.2 Create matching UI
  - [ ] View: Collections dashboard → "Unmatched Payments"
  - [ ] List: Date, amount, payer, status, suggested invoices, action
  - [ ] For manual review: Show top 3 matching invoices
  - [ ] Actions: Select match, mark as other, initiate refund
  
- [ ] Database/API:
  - [ ] Create `payment_invoice_match` table (tracks matching)
  - [ ] Add field: payments.reconciliation_status
  - [ ] Edge function: auto_match_payment (Tier 1 & 2 logic)

**Expected Output**: 90%+ payments auto-matched to invoices within 2 hours, manual review only for edge cases

### 1.3 Automated Payment Reminders with Escalation (1 week)
- [ ] 1.3.1 Define escalation schedule
  - [ ] T+2 days: EMAIL (friendly reminder)
  - [ ] T+5 days: SMS (firmer tone)
  - [ ] T+10 days: WhatsApp + personal (urgent)
  - [ ] T+15 days: EMAIL notice + AUTO-CREATE collections case
  
- [ ] 1.3.2 Auto-generate collections cases
  - [ ] Trigger: invoice 15+ days overdue, no payment
  - [ ] Create `collections_cases` record automatically
  - [ ] Pemilik actions: View case, send legal notice, suspend unit, write-off
  
- [ ] 1.3.3 Reminder preferences control
  - [ ] Settings: Enable/disable, select channels, adjust timing
  - [ ] Data: `merchant_settings.collections_reminder_config` (JSONB)
  - [ ] Default: T+2,5,10,15 with all channels
  
- [ ] Database/API:
  - [ ] Create `payment_reminders_log` table
  - [ ] Edge function: queue_reminder (async scheduled job)
  - [ ] SMS/WhatsApp provider integration
  - [ ] Audit: Log all reminders sent (status, delivery proof)

**Expected Output**: Automated escalation chain, 70% reduction in manual follow-up effort, clear audit trail

### 1.4 Expense Tracking (2 weeks)
- [ ] 1.4.1 Expense entry & categorization
  - [ ] Categories: Utilities, Maintenance, Insurance, Taxes, Marketing, Admin, Payroll, Other
  - [ ] Entry methods:
    - [ ] Manual: Form (category, detail, amount, date, description, payment_method)
    - [ ] OCR: Receipt upload (auto-detect amount + date via OCR)
  - [ ] Validation: amount>0, date not future, category required
  - [ ] SLA: <5 min per entry
  
- [ ] 1.4.2 Expense aggregation & reporting
  - [ ] Dashboard widget: "Operating Expenses This Month"
  - [ ] Show: Total, breakdown by category (with %), vs last month trend
  - [ ] Detail drill-down: Click category → see list of expenses
  
- [ ] 1.4.3 Profit calculation
  - [ ] Formula: Net Profit = Actual Collections - Operating Expenses
  - [ ] Dashboard: Show revenue, expenses, net profit, profitability %
  - [ ] Alert: If profitability <60% or outstanding >15% of revenue
  
- [ ] Database:
  - [ ] Create `expenses` table (with all fields from spec)
  - [ ] OCR integration: expenses.ocr_amount, expenses.ocr_confidence
  - [ ] Workflow: draft → submitted → verified → approved → rejected
  - [ ] Index: (merchant_id, expense_date), (status, created_at)

**Expected Output**: Pemilik track all expenses in <5 min, see accurate profit calculation, monthly expense trends

### 1.5 Tenant Profile Consolidation (1.5 weeks)
- [ ] 1.5.1 Create unified tenant profile page
  - [ ] Header: Name, photo, unit number, property, current lease dates, status
  - [ ] Tabs:
    - [ ] Tab 1: Contract & Lease (contract number, dates, rent, lease renewal status, actions)
    - [ ] Tab 2: Payment History (12-month timeline chart, on-time %, avg late days, outstanding, recent payments table, download report)
    - [ ] Tab 3: Maintenance (last 6 months, total requests, cost, score 0-100)
    - [ ] Tab 4: Compliance (violations count, disputes, complaints, incidents)
    - [ ] Tab 5: Quality Score (overall 0-100, sub-scores, risk level, renewal recommendation)
  - [ ] Contact & notes section (email, phone, WhatsApp, emergency contact, internal notes, alerts)
  
- [ ] 1.5.2 Implement tenant quality scoring
  - [ ] Formula components:
    - [ ] Payment Score (40% weight): on-time % - late_day_penalty
    - [ ] Maintenance Score (20% weight): request_frequency - damage_penalty
    - [ ] Compliance Score (20% weight): violations - disputes_penalty
    - [ ] Communication Score (20% weight): response_time + resolution_rate
  - [ ] Overall = weighted_sum (0-100)
  - [ ] Risk level: >=80→LOW, 60-79→MEDIUM, 40-59→HIGH, <40→CRITICAL
  - [ ] Recommendation: HIGH_PRIORITY_RENEW, RENEW_STANDARD, MONITOR, DO_NOT_RENEW
  - [ ] Update frequency: Monthly (nightly batch)
  
- [ ] Database/Logic:
  - [ ] Create `tenant_quality_scores` table
  - [ ] Edge function: calculate_tenant_quality_score (monthly trigger)
  - [ ] Aggregate payment metrics from invoices + payments
  - [ ] Aggregate maintenance metrics from maintenance_requests
  - [ ] Query optimization: index (merchant_id, overall_quality_score)

**Expected Output**: Single page shows complete tenant profile, quality score guides renewal decision, updated monthly

---

## PHASE 2: CORE OPERATIONS (Weeks 8-12)
**Focus**: Tenant engagement + vacancy management + lease automation

### 2.1 Tenant Portal (3 weeks)
- [ ] 2.1.1 Design portal pages
  - [ ] Dashboard: next due invoice, quick actions (pay, view, maintain, message)
  - [ ] Invoices & Payments: list with download, payment history, filter
  - [ ] Make Payment flow: select invoice → payment method → proof upload → confirmation
  - [ ] Maintenance requests: list, [New Request] with category/description/priority, track status
  - [ ] Messages/Support: chat interface, FAQ, support tickets
  
- [ ] 2.1.2 Payment verification integration
  - [ ] Tenant upload proof / e-wallet payment
  - [ ] System auto-verify within 2h
  - [ ] Payment.status = VERIFIED
  - [ ] Invoice.status = PAID (if matched)
  - [ ] Tenant portal: "Payment confirmed"
  - [ ] Email: Receipt + confirmation
  
- [ ] 2.1.3 Security & access
  - [ ] Auth: Email + OTP (or existing account)
  - [ ] Multi-property support (if tenant rents multiple)
  - [ ] Data visibility: Only own invoices, maintenance, messages
  - [ ] Session: Logout after 15 min inactivity
  - [ ] HTTPS + encryption required
  
- [ ] Database/API:
  - [ ] Create tenant portal schema (separate from merchant dashboard)
  - [ ] Authentication: tenant_sessions table
  - [ ] Payment upload: payment.proof_url, payment.ocr_status

**Target Outcome**: 50% of payments via portal by week 12 end

### 2.2 Waiting List & Applicant Management (2 weeks)
- [ ] 2.2.1 Setup waiting list
  - [ ] Data: applicant name, phone, email, preferred move-in, budget, occupant type, needs
  - [ ] Status: interested → applied → offered → rejected / waitlisted / accepted
  - [ ] Pemilik actions: View list, send offers, auto-reject inactive, manage priority
  
- [ ] 2.2.2 Automated offer workflow
  - [ ] Send offer: Auto-generate letter (unit details, rent, term, move-in, docs required)
  - [ ] Send via email with: Offer PDF, unit photos, building rules, application form link
  - [ ] Track: Offer sent date, email open, acceptance/rejection, response deadline (7 days)
  - [ ] Auto-reminder: SMS if no response after 5 days
  - [ ] On acceptance: Create contract draft, request documents, provide portal login
  
- [ ] 2.2.3 Vacancy automation
  - [ ] Trigger: Unit becomes vacant (move-out notice or contract end)
  - [ ] Action:
    1. [ ] Notify pemilik: "Unit X-05 vacant on {date}"
    2. [ ] Find top 3 matching candidates (by preferred date + budget)
    3. [ ] Suggest: "Send offer to these 3?"
    4. [ ] Auto-send if approved
    5. [ ] Wait for responses
    6. [ ] If acceptance: Auto-create contract
    7. [ ] If rejection: Try next candidate
    8. [ ] If no response: Auto-reject after 7 days
  
- [ ] 2.2.4 Applicant quality scoring
  - [ ] Score = (date_match * 0.4) + (budget_match * 0.3) + (reliability * 0.3)
  - [ ] Higher score = prioritize in offers
  
- [ ] Database:
  - [ ] Create `waiting_list` table (all fields from spec)
  - [ ] Index: (merchant_id, unit_id, application_status), (property_id, application_status), (move_in_date_preferred)

**Target Outcome**: Auto-fill vacancies, 70% reduction in vacancy downtime

### 2.3 Lease Renewal & Amendment (2 weeks)
- [ ] 2.3.1 Automated renewal alerts
  - [ ] 60 days before expiry: Email + dashboard notification to pemilik
    - [ ] Show: Tenant quality score, renewal recommendation
    - [ ] Actions: View profile, start renewal, plan move-out
  - [ ] 30 days before: Auto-send renewal offer to tenant
    - [ ] Pemilik compose: same/new terms, incentive, deadline (7 days)
    - [ ] Send via: Email + portal + SMS
  - [ ] 7 days before: SMS reminder if no response
  - [ ] End date: Auto-generate move-out notice if not renewed
  - [ ] After end date: Track overholding (>7 days → collections case)
  
- [ ] 2.3.2 Lease amendment workflow
  - [ ] Types: Rent adjustment, lease extension, term modification
  - [ ] Process:
    1. [ ] Pemilik select amendment type
    2. [ ] System generate amendment document (pre-filled with contract details)
    3. [ ] Send to tenant with explanation email
    4. [ ] Tenant e-sign
    5. [ ] System store signed amendment
    6. [ ] Update contract record
    7. [ ] Notify both: Amendment effective
  
- [ ] 2.3.3 Amendment tracking
  - [ ] Store all amendments in version control (contract_amendments table)
  - [ ] Display on tenant profile: Current + historical leases
  
- [ ] Database:
  - [ ] Create `lease_renewal_alerts` table (all fields from spec)
  - [ ] Create `contract_amendments` table (version control)
  - [ ] Index: (merchant_id, contract_end_date), (alert_60days_sent, contract_end_date)
  - [ ] Edge function: send_renewal_alert (60d, 30d, 7d triggers)

**Target Outcome**: 100% lease renewals managed via system, no missed deadlines

### 2.4 Collections Case Management (1 week)
- [ ] 2.4.1 Case lifecycle management
  - [ ] Creation: Auto at 15+ days overdue
  - [ ] Investigation: Pemilik review tenant profile, contact, payment history
  - [ ] Resolution options: Payment, payment plan, dispute, write-off, legal
  
- [ ] 2.4.2 Payment plans
  - [ ] Create installment agreement (frequency, amounts, dates)
  - [ ] Auto-reminders before each installment due
  - [ ] Track: On-time / late payments
  - [ ] If 2+ missed: Resume escalation
  
- [ ] 2.4.3 Collections reporting
  - [ ] Report 1: Collections performance (daily/weekly/monthly)
  - [ ] Report 2: Per-tenant collection rate (sorted by on-time %)
  - [ ] Report 3: Collections cases (open, status breakdown)
  
- [ ] Database:
  - [ ] Use existing `collections_cases` table (enhance with fields)
  - [ ] Create `payment_plans` table
  - [ ] Query: Collections dashboard reports

---

## PHASE 3: INTELLIGENCE & OPTIMIZATION (Weeks 13-16)
**Focus**: Pricing, forecasting, ROI, financial intelligence, AI/ML gated deployment, Referral MVP

### 3.0 AI/ML Infrastructure & Models (Parallel, Weeks 13-16)
- [ ] 3.0.1 Build A/B testing framework
  - [ ] Feature-flag system (per-merchant, per-feature granularity)
  - [ ] A/B test configuration (control vs treatment groups)
  - [ ] Monitoring dashboard (model performance, confidence scores)
- [ ] 3.0.2 Implement all 6 AI/ML models
  - [ ] dss-pricing-advisor (deploy at launch, 10% merchants)
  - [ ] ml-occupancy-forecast (gate: confidence >75%)
  - [ ] dss-collection-strategy (gate: data quality >80%)
  - [ ] dss-maintenance-priority (gate: >50 maintenance records)
  - [ ] ml-churn-prediction (gate: >1000 active merchants)
  - [ ] dss-investment-insight (gate: >500 properties)
- [ ] 3.0.3 Validation pipeline
  - [ ] Confidence threshold checks per model
  - [ ] Fallback logic (disable if below threshold)
  - [ ] Model versioning & rollback capability
- [ ] 3.0.4 Pricing advisor soft deploy (Week 16)
  - [ ] Enable for 10% of merchants (feature flag)
  - [ ] Monitor adoption rate & recommendation accuracy
  - [ ] Collect merchant feedback

### 3.0B Referral MVP (Weeks 13-14)
- [ ] 3.0B.1 Referral link generation
  - [ ] Unique referral code per merchant
  - [ ] Shareable link (copy to clipboard, email)
- [ ] 3.0B.2 Referral tracking
  - [ ] Track: referrer → referee signup → first payment
  - [ ] Dashboard: Show referral count, status, rewards
- [ ] 3.0B.3 Reward system (simple)
  - [ ] Reward: Rp 100K bonus (one-time, on referee first payment)
  - [ ] Manual payout (admin transfers)
  - [ ] No tiering, no complex commission logic
- [ ] 3.0B.4 Feature flag configuration
  - [ ] Feature flag = OFF at launch (not visible to merchants)
  - [ ] Admin toggle to enable/disable
  - [ ] Decision gate: Enable at Week 20 if demand >30%
- [ ] 3.1.1 Market rate tracking
  - [ ] Data: Aggregate comparable properties (location, category, occupancy >80%)
  - [ ] Dashboard: Show market rate, your rate, position, recommendation
  - [ ] Quarterly update: Recalculate market rate from listings
  
- [ ] 3.1.2 Dynamic pricing rules
  - [ ] Rule types:
    - [ ] Occupancy-based: +5% if 95% occupied, -10% if 60% occupied
    - [ ] Seasonal: +15% Dec, +10% Jan, etc (customizable)
    - [ ] Long-lease discount: -4% for 3mo, -6% for 6mo, -10% for 12mo
  - [ ] Apply: When new lease negotiated, show recommended price
  - [ ] Flexible: Pemilik can override
  - [ ] Track: Which rules applied to which lease
  
- [ ] Database:
  - [ ] Create `dynamic_pricing_rules` table (all fields from spec)
  - [ ] Index: (merchant_id, property_id, status)
  - [ ] Integration: When creating contract, apply rules → show recommended price

### 3.2 Occupancy Forecasting (2 weeks)
- [ ] 3.2.1 Forecast model
  - [ ] Inputs: Historical move-outs (12mo), contract end dates (90d), waiting list, seasonal patterns
  - [ ] Logic:
    1. [ ] Calculate moveout_rate from last 12 months
    2. [ ] Predict next month moveouts = rate * total_units
    3. [ ] Count confirmed moveouts from contracts
    4. [ ] Estimate move-ins from waiting list (70% conversion)
    5. [ ] Calculate predicted_occupancy
    6. [ ] Set confidence based on data availability (6mo→70%, 12mo→85%)
  
- [ ] 3.2.2 Vacancy management automation
  - [ ] When vacancy predicted:
    - [ ] Notify pemilik 30 days before
    - [ ] Recommend: Start marketing
    - [ ] Suggest: Check waiting list
    - [ ] Unit status: "Pre-vacant"
  - [ ] On move-out: Capture photos, schedule repair
  - [ ] On ready: Update photos, activate in marketplace
  
- [ ] Database:
  - [ ] Create `occupancy_forecast` table (all fields from spec)
  - [ ] Edge function: generate_forecast (monthly trigger, Day 1 of month)
  - [ ] Index: (merchant_id, forecast_month DESC)

### 3.3 Maintenance ROI Analytics (1.5 weeks)
- [ ] 3.3.1 Cost tracking & analysis
  - [ ] Track: Preventive vs reactive maintenance
  - [ ] Report: Cost per unit (monthly), cost by category, trend analysis
  
- [ ] 3.3.2 Unit economics report
  - [ ] Show per-unit & per-property:
    - [ ] Monthly rent - maintenance cost = net profit
    - [ ] Maintenance as % of rent
    - [ ] Cost breakdown by category
    - [ ] Preventive vs reactive (recommend increase preventive)
  
- [ ] 3.3.3 Asset lifecycle management
  - [ ] Track: Depreciation, expected lifespan, replacement schedule
  - [ ] Report: 3-year maintenance plan (replace AC, water heater, etc)
  - [ ] Budget planning: Allocate monthly savings for replacements
  
- [ ] Database:
  - [ ] Use existing `assets` + `maintenance_expenses` tables
  - [ ] Query optimization: Cost aggregation by category, date range

### 3.4 Financial Reporting & Tax Compliance (2 weeks)
- [ ] 3.4.1 Monthly P&L statement
  - [ ] Sections: Revenue, collection %, expenses, profitability
  - [ ] Drill-down: Click category → detail breakdown → individual transactions
  - [ ] Compare: Current month vs last month, vs year-to-date
  
- [ ] 3.4.2 Unit economics analysis
  - [ ] Per-unit report: Monthly rent, occupancy %, annual revenue, annual expenses, annual profit, ROI %
  - [ ] Comparison: Rank units by ROI, identify problem units
  - [ ] Recommendation: Why Unit A profitable, Unit B not
  
- [ ] 3.4.3 Tax compliance report
  - [ ] Indonesia context:
    - [ ] PBB (Property tax): Property ID, assessed value, tax amount
    - [ ] PPh (Income tax): Gross revenue, deductions, taxable income, tax rate, tax due
    - [ ] SIUP & NPWP status
    - [ ] Audit log: All changes tracked
  
- [ ] Database/API:
  - [ ] Query: Revenue + expenses aggregation by date range
  - [ ] Report generation: PDF export capability

### 3.5 Multi-Property Consolidation (1 week)
- [ ] 3.5.1 Cross-property dashboard
  - [ ] Selection: All properties vs single property
  - [ ] Consolidated metrics: Units, occupancy, revenue, collections, profitability, maintenance
  - [ ] Breakdown: By property, identify top/bottom performer
  
- [ ] 3.5.2 Bulk operations
  - [ ] Actions: Message all tenants, batch invoice, bulk rent increase, bulk maintenance scheduling
  - [ ] Impact preview: Show effect (e.g., rent +100K → revenue +9M)
  
- [ ] Database/API:
  - [ ] Aggregation queries across properties (merchant_id level)
  - [ ] Bulk operation endpoints (validation + batch processing)

---

## PHASE 4: LAUNCH & ITERATION (Weeks 17-18)

### 4.1 Beta Launch
- [ ] Week 16: Final QA
  - [ ] All critical features tested end-to-end
  - [ ] AI/ML pricing advisor validated (10% merchants)
  - [ ] Referral MVP tested (flag OFF, ready to enable)
  - [ ] Performance tested (10k invoices, 1k payments/day)
  - [ ] Data integrity validated (no loss, correct calculations)
  - [ ] Create quick-start guides
  - [ ] Train support team
  
- [ ] Week 17: Soft launch
  - [ ] 500 early adopters (free access)
  - [ ] Daily monitoring: System stability, data integrity, engagement
  - [ ] Feedback collection: Onboarding, confusion areas, feature requests
  - [ ] Focus: Critical path only (login → property → tenant → payment)
  - [ ] AI: Pricing advisor live for 10% merchants
  - [ ] Referral: Hidden (feature-flag OFF)
  
- [ ] Week 18: Full public launch
  - [ ] Open to all
  - [ ] Marketing campaign
  - [ ] Target: 5,000 signups month 1

### 4.2 Success Criteria (Go/No-Go Checkpoint)
**Must-have at Week 4 (Phase 1 end)**:
- [ ] Activation time <2 minutes
- [ ] Collections dashboard outstanding amount correct
- [ ] Profit calculation matches manual verification
- [ ] 80% payments auto-matched
- [ ] User NPS >50

**If miss any**: Delay launch, fix in Phase 2

---

## POST-LAUNCH: DEPLOYMENT GATES (Weeks 19-26)

### AI/ML Staggered Deployment
- [ ] Week 19: Deploy ml-occupancy-forecast
  - [ ] Verify confidence >75% on real data
  - [ ] Gradual rollout: 10% → 50% → 100%
  - [ ] Monitor: Forecast accuracy vs actual
- [ ] Week 21: Deploy dss-collection-strategy
  - [ ] Verify data quality >80%
  - [ ] Verify >100 collections cases exist
- [ ] Week 23: Deploy dss-maintenance-priority
  - [ ] Verify >50 maintenance records per merchant
- [ ] Week 25: Deploy ml-churn-prediction
  - [ ] Verify >1000 active merchants
  - [ ] Verify >6 months historical data
- [ ] Week 26: Deploy dss-investment-insight
  - [ ] Verify >500 properties with financial data

### Referral Decision Gate (Week 20)
- [ ] Measure organic demand signal
  - [ ] If >30% merchants asking for referral → Enable feature flag
  - [ ] If <30% → Keep hidden, reassess Week 26
- [ ] Monitor post-enable (if enabled):
  - [ ] Referral conversion rate
  - [ ] Payout accuracy
  - [ ] Target: 5% new merchants via referral within 30 days

---

## KEY DEPENDENCIES & ORDERING

```
CRITICAL PATH (Must finish before next phase):
Phase 0 → Phase 1 → Phase 2 → Phase 3 → Phase 4

Within Phase 1 (parallel safe):
- 1.1 Collections dashboard (depends on invoices/payments tables)
- 1.2 Payment reconciliation (depends on 1.1 + smart matching logic)
- 1.3 Reminders (depends on 1.2 working)
- 1.4 Expense tracking (independent, parallel)
- 1.5 Tenant profiles (depends on payment + maintenance history available)

Within Phase 2 (sequence):
- 2.1 Tenant portal (can start parallel to Phase 1)
- 2.2 Waiting list (depends on tenant portal working)
- 2.3 Lease renewal (depends on 2.2 applicant flow)
- 2.4 Collections cases (depends on 1.3 from Phase 1)

Within Phase 3 (all parallel):
- 3.0 AI/ML infrastructure + 6 models (parallel build, gated deploy)
- 3.0B Referral MVP (2 weeks, feature-flag OFF)
- 3.1 Pricing (independent)
- 3.2 Forecasting (depends on occupancy history)
- 3.3 Maintenance analytics (independent)
- 3.4 Financial reporting (depends on 1.4 expenses + invoices/payments)
- 3.5 Multi-property (depends on all above features working)

Post-Launch (Weeks 19-26):
- AI/ML staggered deployment (confidence-gated)
- Referral decision gate (Week 20, demand >30%)
```

---

## EFFORT ESTIMATION

| Phase | Tasks | Effort | Risk |
|-------|-------|--------|------|
| 0 | DB audit, verification redesign, state machines | 2 weeks | Low |
| 1 | Dashboard, payments, reminders, expenses, profiles | 5 weeks | Medium (volume of features) |
| 2 | Portal, waiting list, renewals, cases | 5 weeks | Medium (automation complexity) |
| 3 | Pricing, forecast, ROI, reports, consolidation, **AI/ML (6 models), Referral MVP** | 4 weeks | Medium (analytics + parallel AI/ML) |
| 4 | QA, launch, iteration | 2 weeks | Low |
| **Post** | **AI/ML deploy gates, Referral decision** | **8 weeks** | **Low (gated)** |
| **Total** | | **18 weeks to launch + 8 weeks post-launch pipeline** | |

---

## CRITICAL SUCCESS FACTORS

1. **Database**: All new tables created FIRST (Week 1-2)
   - Dont start building features until schema ready
   
2. **Phase 1 is gates all others**: Collections + payments + expenses must work before Phase 2
   - These are foundation for all reporting
   
3. **Activation <2 min is HARD requirement**: Dont launch Phase 2 until Tier 1 onboarding <2 min
   - Measure actual user time (not theoretical)
   
4. **80% auto-match is hard requirement**: If manual review >20%, go back to Phase 1
   - Payment bottleneck = cash flow bottleneck
   
5. **Quality scoring must be accurate**: Test with 20 sample tenants manually first
   - Wrong recommendation damages trust
   
6. **Forecasting confidence improves over time**: Dont expect 95% accuracy Month 1
   - Month 1: 60% confidence is OK
   - Month 3: 80% confidence expected

---

## TESTING CHECKLIST BY PHASE

### Phase 0
- [ ] Tier 1 onboarding: 5 test users, measure time, must be <2 min
- [ ] Tier 2 verification: Upload documents, verify auto-approval flow
- [ ] Database: Create test data (100 merchants, 1000 invoices, 500 payments)
- [ ] State transitions: Verify auto-transitions work (ISSUED→DUE→OVERDUE)
- [ ] Payment matching: Test all 3 tiers with sample payments

### Phase 1
- [ ] Dashboard: Verify outstanding calculation matches manual sum
- [ ] Aging buckets: Test 100 invoices, verify correct aging assignment
- [ ] Auto-verify: 50 test payments, verify 80%+ tier 1 match
- [ ] Reminders: Send test reminders, verify delivery (email, SMS)
- [ ] Expense OCR: Test 10 receipt images, verify OCR accuracy >95%
- [ ] Profit calc: Manual calculation vs system, must match exactly
- [ ] Quality score: 20 sample tenants, manual validation vs system calculation

### Phase 2
- [ ] Portal login: 5 tenants, verify MFA + session timeout
- [ ] Payment via portal: 10 test payments, verify verification <2h
- [ ] Waiting list: 20 applicants, test auto-send offers, auto-reject inactive
- [ ] Lease renewal: Test 5 contracts near expiry, verify alerts at 60/30/7 days
- [ ] Amendment: Create & sign 3 amendments, verify versioning

### Phase 3
- [ ] Pricing: Compare recommended price vs manual market research
- [ ] Forecast: Predict Month 2 occupancy, compare actual vs forecast
- [ ] Maintenance ROI: Validate cost aggregation vs manual receipts
- [ ] P&L report: Match P&L vs manual accounting
- [ ] Multi-property: Consolidate 3 properties, verify math

---

**Document prepared for**: PMS Development Team  
**Version**: 1.0  
**Last updated**: 2026-02-26
