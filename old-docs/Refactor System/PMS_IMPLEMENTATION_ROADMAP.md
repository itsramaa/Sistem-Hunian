# IMPLEMENTASI FIXES PMS AUDIT REPORT
## Phase-by-Phase Detailed Roadmap (Tanpa Escrow System)

**Target User**: Pemilik kosan 20-100 unit  
**Execution Period**: 12-16 minggu (MVP 6 minggu)  
**Database Reference**: merchant_database.md  
**Approach**: Fix gaps, simplify UX, prioritize adoption  

---

# PHASE 0: SIMPLIFICATION & VALIDATION (Weeks 1-2)

## 0.1 Merchant Verification Redesign
**Gap**: Verification terlalu strict (KTP + SIUP), adoption blocker  
**Status**: CRITICAL

### Task 0.1.1 - Redefine Verification Tiers
**Objective**: Buat 3 tier verifikasi yang sesuai kondisi Indonesia

#### Tier 1: Quick Signup (Minimal)
- **For**: Individual kosan owner (<50 unit), no SIUP
- **Requirements**:
  - Email verification only
  - Phone number OTP
  - Optional: Self-declaration form (nama, alamat, jumlah unit)
  - No document upload required
- **Activation**: Instant (< 2 menit)
- **Limitation**: 
  - Dashboard akses terbatas (view-only first 7 hari)
  - Feature lock: Collections automation, payment methods limited
  - Reporting: Basic only

**Database Changes**:
- `merchants.verification_status` → Add value: `QUICK_SIGNUP_VERIFIED`
- `merchants` → Add field: `verification_tier` (ENUM: quick, standard, premium)
- `merchant_verifications` → Status update: support multiple document types

#### Tier 2: Standard Verification (Moderate)
- **For**: Individual dengan SIUP or small corporate (50-300 unit)
- **Requirements**:
  - All Tier 1 + Document upload:
    - KTP + selfie (for identity check)
    - SIUP atau SPT Tahunan (business proof, optional)
    - Bank account for disbursement
  - Manual review by admin
- **Timeline**: 1-3 hari kerja
- **Unlock**:
  - Full dashboard access
  - All features available
  - Higher transaction limits

#### Tier 3: Premium Verification (Strict)
- **For**: Corporate/large operators (300+ unit), multi-property
- **Requirements**:
  - All Tier 2 + Additional:
    - Business registration certificate
    - Board resolution (untuk PT)
    - Financial statements (optional, for credit assessment)
  - Phone verification call with admin
- **Timeline**: 3-5 hari kerja
- **Benefits**:
  - Dedicated account manager
  - API access
  - Custom integrations
  - Priority support

### Task 0.1.2 - Simplified Onboarding Flow
**Objective**: Dari sign-up ke first login <2 menit untuk Tier 1

**Step 1: Email + Phone (0-2 menit)**
- Send email verification link
- Click link, redirect to phone verification
- Input WhatsApp/mobile number, receive OTP
- Verify OTP, mark account verified

**Step 2: Minimal Information (2-5 menit)**
- Ask: Nama lengkap, alamat properti, jumlah unit
- Optional: Profile photo
- Accept Terms & Conditions
- Skip all document uploads for Tier 1

**Step 3: First Login → Dashboard (5 menit)**
- Pre-fill: Basic info
- Show: Quick tutorial (3 screens, can skip)
  - Screen 1: Add first property
  - Screen 2: Add first tenant
  - Screen 3: Record first payment
- Auto-redirect to dashboard

**Database Workflow**:
- `merchants` record created with `verification_status = 'QUICK_SIGNUP_VERIFIED'`
- `merchant_verifications` entry created with `status = 'auto_approved'`
- `merchant_verification_history` log: action='auto_signup', status_change='pending→quick_signup_verified'

---

## 0.2 Database Structure Audit & Additions
**Objective**: Identify & add missing fields untuk support semua features

### Task 0.2.1 - Review Existing Tables for Gaps

**Tabel yang sudah ada**:
- ✅ `merchants`, `properties`, `units`, `contracts`, `invoices`, `payments`
- ✅ `payment_verifications`, `maintenance_requests`, `maintenance_expenses`
- ✅ `tenant_payment_metrics`, `collections_cases`
- ✅ `assets`, `facility_types`

**Gap Analysis**:
- ❌ No `expenses` table (untuk non-maintenance expenses: utility, insurance, etc)
- ❌ No `waiting_list` table (untuk applicant management)
- ❌ No `tenant_quality_scores` table (untuk scoring logic)
- ❌ No `lease_renewal_alerts` table (untuk automation)
- ❌ No `dynamic_pricing_rules` table (untuk pricing logic)
- ❌ No `occupancy_forecast` table (untuk prediction storage)
- ⚠️ `tenant_payment_metrics` mungkin incomplete untuk kolom tertentu

### Task 0.2.2 - Create Missing Tables

**Table: expenses** (General operating expenses)
```
Columns:
- id (UUID, PK)
- merchant_id (UUID, FK → merchants)
- property_id (UUID, FK → properties, nullable)
- unit_id (UUID, FK → units, nullable)
- expense_category (ENUM: utilities, maintenance, insurance, tax, 
                            marketing, other)
- category_detail (TEXT: e.g., "Electricity", "Water", "Property Tax")
- amount (DECIMAL 12,2)
- currency (VARCHAR: IDR, default)
- receipt_url (TEXT, nullable - for OCR)
- ocr_amount (DECIMAL 12,2, nullable - from OCR)
- ocr_confidence (FLOAT 0-1, nullable)
- description (TEXT)
- expense_date (DATE)
- payment_method (VARCHAR: cash, bank_transfer, card)
- paid_by (UUID, FK → users, nullable)
- status (ENUM: draft, submitted, verified, approved, rejected)
- created_at (TIMESTAMPTZ)
- updated_at (TIMESTAMPTZ)

Indexes:
- (merchant_id, expense_date)
- (property_id, expense_date)
- (status, created_at)
```

**Table: waiting_list** (Applicant queue untuk vacancies)
```
Columns:
- id (UUID, PK)
- merchant_id (UUID, FK → merchants)
- property_id (UUID, FK → properties)
- unit_id (UUID, FK → units, nullable - specific unit or general)
- applicant_name (VARCHAR 255)
- applicant_phone (VARCHAR 20)
- applicant_email (VARCHAR 255)
- move_in_date_preferred (DATE)
- application_status (ENUM: interested, applied, offered, 
                            rejected, waitlisted, accepted)
- application_priority (INT: 1-100, 1=highest)
- monthly_budget (DECIMAL 12,2)
- occupant_type (ENUM: student, professional, family, couple)
- duration_prefer (INT: months, -1 = flexible)
- special_needs (TEXT: pet, child, elderly care, etc)
- submitted_at (DATE)
- reviewed_at (DATE, nullable)
- reviewed_by (UUID, FK → users, nullable)
- rejection_reason (TEXT, nullable)
- notes (TEXT)
- created_at (TIMESTAMPTZ)
- updated_at (TIMESTAMPTZ)

Indexes:
- (merchant_id, unit_id, application_status)
- (property_id, application_status)
- (move_in_date_preferred)
```

**Table: tenant_quality_scores** (Scoring untuk tenant evaluation)
```
Columns:
- id (UUID, PK)
- merchant_id (UUID, FK → merchants)
- tenant_user_id (UUID, FK → users)
- contract_id (UUID, FK → contracts)
- payment_score (INT: 0-100, default 50)
  - Basis: on-time payment %, frequency of late payments
- maintenance_score (INT: 0-100, default 50)
  - Basis: maintenance request frequency, damage reports, response time
- compliance_score (INT: 0-100, default 50)
  - Basis: rule violations, complaints, disputes
- communication_score (INT: 0-100, default 50)
  - Basis: response time, problem resolution, feedback
- overall_quality_score (INT: 0-100, calculated)
  - Formula: (payment_score * 0.4 + maintenance_score * 0.2 + 
             compliance_score * 0.2 + communication_score * 0.2)
- risk_level (ENUM: low, medium, high, critical)
  - Mapping: overall_quality_score >= 80 → low, 60-79 → medium, 
            40-59 → high, <40 → critical
- recommendation (ENUM: high_priority_renew, renew_standard, monitor, 
                        do_not_renew)
- last_calculated_at (TIMESTAMPTZ)
- created_at (TIMESTAMPTZ)
- updated_at (TIMESTAMPTZ)

Indexes:
- (merchant_id, overall_quality_score)
- (tenant_user_id, contract_id)
```

**Table: lease_renewal_alerts** (Tracking untuk lease renewal automation)
```
Columns:
- id (UUID, PK)
- merchant_id (UUID, FK → merchants)
- contract_id (UUID, FK → contracts)
- unit_id (UUID, FK → units)
- tenant_user_id (UUID, FK → users)
- contract_end_date (DATE)
- alert_60days_sent (BOOLEAN, default false)
- alert_60days_sent_at (TIMESTAMPTZ, nullable)
- alert_30days_sent (BOOLEAN, default false)
- alert_30days_sent_at (TIMESTAMPTZ, nullable)
- alert_7days_sent (BOOLEAN, default false)
- alert_7days_sent_at (TIMESTAMPTZ, nullable)
- renewal_action_taken (ENUM: pending, offer_sent, offer_accepted, 
                               offer_rejected, move_out_confirmed)
- renewal_action_taken_at (TIMESTAMPTZ, nullable)
- new_contract_id (UUID, FK → contracts, nullable)
- created_at (TIMESTAMPTZ)
- updated_at (TIMESTAMPTZ)

Indexes:
- (merchant_id, contract_end_date)
- (alert_60days_sent, contract_end_date)
```

**Table: dynamic_pricing_rules** (Rules untuk pricing strategy)
```
Columns:
- id (UUID, PK)
- merchant_id (UUID, FK → merchants)
- property_id (UUID, FK → properties, nullable - null = apply all properties)
- unit_category (VARCHAR: e.g., 'studio', 'bedroom_1', 'bedroom_2')
- base_monthly_rent (DECIMAL 12,2)
- market_rate_current (DECIMAL 12,2)
- occupancy_threshold_low (DECIMAL: 0-1, e.g., 0.6 = 60%)
- occupancy_threshold_high (DECIMAL: 0-1, e.g., 0.95)
- discount_low_occupancy (DECIMAL: 0-1, e.g., 0.1 = 10% discount)
- premium_high_occupancy (DECIMAL: 0-1, e.g., 0.05 = 5% premium)
- seasonal_adjustments (JSONB: {month: adjustment_percentage})
  - Example: {"12": 0.15, "1": 0.15} (Dec/Jan premium 15%)
- minimum_lease_months (INT, e.g., 3, 6, 12)
- price_per_duration (JSONB: {duration_months: price})
  - Example: {"3": 2500000, "6": 2400000, "12": 2300000}
- last_reviewed_at (TIMESTAMPTZ)
- next_review_date (DATE)
- status (ENUM: draft, active, archived)
- created_at (TIMESTAMPTZ)
- updated_at (TIMESTAMPTZ)

Indexes:
- (merchant_id, property_id, status)
```

**Table: occupancy_forecast** (Prediction results storage)
```
Columns:
- id (UUID, PK)
- merchant_id (UUID, FK → merchants)
- property_id (UUID, FK → properties, nullable)
- forecast_month (DATE, first day of month)
- predicted_occupancy_rate (DECIMAL: 0-1)
- predicted_move_outs (INT)
- predicted_move_ins (INT)
- expected_revenue (DECIMAL 12,2)
- confidence_score (DECIMAL: 0-1)
- model_version (VARCHAR: e.g., "v1.0", "v2.1")
- generated_at (TIMESTAMPTZ)
- created_at (TIMESTAMPTZ)

Indexes:
- (merchant_id, forecast_month DESC)
- (property_id, forecast_month)
```

**Table: payment_reminders_log** (Track automated reminders)
```
Columns:
- id (UUID, PK)
- merchant_id (UUID, FK → merchants)
- invoice_id (UUID, FK → invoices)
- tenant_user_id (UUID, FK → users)
- reminder_type (ENUM: email, sms, whatsapp, notice)
- reminder_number (INT: 1st, 2nd, 3rd reminder)
- days_overdue (INT)
- status (ENUM: queued, sent, failed, bounced)
- sent_at (TIMESTAMPTZ, nullable)
- delivery_status (TEXT: success, failed, bounced, etc)
- failure_reason (TEXT, nullable)
- contact_address (VARCHAR: email or phone used)
- message_template_used (VARCHAR)
- created_at (TIMESTAMPTZ)

Indexes:
- (invoice_id, reminder_type)
- (tenant_user_id, sent_at)
```

---

## 0.3 API & State Machine Validation
**Objective**: Ensure semua state transitions & edge functions ready

### Task 0.3.1 - Update Invoice State Machines

**Current State**: `INVOICE_STATUS_TRANSITIONS` ada tapi verification bottleneck

**Update**: Add automatic transitions & SLA tracking

**New States**:
- `DRAFT` → `ISSUED` (auto, immediate)
- `ISSUED` → `DUE` (auto, on due date)
- `DUE` → `OVERDUE` (auto, T+1 dari due date)
- `OVERDUE` → `OVERDUE_ESCALATED` (auto, after 15 days)
- `ISSUED` / `DUE` / `OVERDUE` → `PARTIALLY_PAID` (manual/automatic)
- `ISSUED` / `DUE` / `OVERDUE` / `PARTIALLY_PAID` → `PAID` (on payment match)
- `PAID` → `VERIFIED` (auto, immediate - no manual step)
- `ISSUED` / `DUE` → `CANCELLED` (manual, admin only)

**Key Changes**:
- ✅ Remove `VERIFYING` status (was bottleneck)
- ✅ Add automatic state transitions (no manual invoice status change)
- ✅ Mark payment as `VERIFIED` immediately saat payment received (bukan invoice)

### Task 0.3.2 - Update Payment Status Lifecycle

**Current Issue**: `PENDING → VERIFYING → VERIFIED` terlalu lambat

**New Payment Status Transitions**:
```
PENDING (payment uploaded)
  ├─→ AUTO_VERIFIED (1 hour) - Automatic path for known accounts
  │   └─→ RECONCILED (auto-match dengan invoice)
  │
  └─→ PENDING_REVIEW (if new account or unusual amount)
      ├─→ VERIFIED (manual review, 24h SLA)
      │   └─→ RECONCILED (auto-match dengan invoice)
      │
      └─→ REJECTED (fraud detected)
```

**Auto-Verification Logic**:
- Jika payer_account sudah di-whitelist untuk merchant: auto-verify
- Jika amount = invoice amount: auto-match
- Jika amount > invoice amount: show suggestion (refund / next invoice)
- Jika amount < invoice amount: show suggestion (partial payment confirmation)

---

# PHASE 1: CRITICAL ADOPTION FIXES (Weeks 3-7)

## 1.1 Collections Dashboard - Real-time Cash Visibility
**Gap**: Tidak ada dashboard untuk outstanding tracking  
**Status**: CRITICAL | **Impact**: Operations blocker

### Task 1.1.1 - Collections Overview Widget

**Objective**: Pemilik lihat dalam 10 detik:
- Total outstanding hari ini
- Total seharusnya terima minggu ini
- Collection rate bulan ini

**Widget Components**:

**1. "Collections Today" Card**
- Display: Rp X.XXX.XXX (jumlah sudah terima hari ini)
- Sub-text: "15 payments collected"
- Update: Real-time (setiap payment verified)
- Action: Click → Show list dari 15 payments hari ini

**2. "Outstanding (By Age)" Card - Aging Bucket Analysis**
```
Structure:
├─ <7 days overdue: Rp 50M (8 tenants)
├─ 7-14 days: Rp 30M (5 tenants)
├─ 14-30 days: Rp 20M (3 tenants)
└─ 30+ days: Rp 15M (2 tenants)

Total Outstanding: Rp 115M (18 tenants)
```
- Color code: <7 days = yellow, 7-14 = orange, 14-30 = red, 30+ = dark red
- Calculation Logic:
  ```
  For each invoice:
    IF status IN (ISSUED, DUE, OVERDUE, PARTIALLY_PAID):
      outstanding_amount = invoice.amount - COALESCE(sum(payments.matched_amount), 0)
      days_overdue = CASE
        WHEN invoice.due_date is NULL THEN 0
        ELSE GREATEST(0, CURRENT_DATE - invoice.due_date)
      END
      
      IF days_overdue = 0 AND invoice.status = ISSUED: bucket = "not_yet_due"
      ELSE IF days_overdue <= 7: bucket = "0-7_days"
      ELSE IF days_overdue <= 14: bucket = "7-14_days"
      ELSE IF days_overdue <= 30: bucket = "14-30_days"
      ELSE: bucket = "30_plus_days"
      
      Add to bucket
  ```

**3. "Expected This Week" Card**
- Display: Rp Y.YYY.YYY (expected collections 7 hari kedepan)
- Sub-text: "Z invoices due"
- Breakdown: 
  - Today (4 invoices, Rp 5M)
  - Tomorrow (2 invoices, Rp 3M)
  - Next 5 days (6 invoices, Rp 9M)
- Calculation:
  ```
  Expected = SUM(invoice.amount - matched_amount)
  WHERE invoice.due_date BETWEEN TODAY AND TODAY + 7 DAYS
    AND invoice.status IN (ISSUED, DUE, OVERDUE, PARTIALLY_PAID)
  ```

**4. "Collection Rate This Month" Card**
- Display: 85% (success rate)
- Sub-text: "Rp 500M collected of Rp 588M due"
- Formula:
  ```
  Collected_Amount = SUM(payment.amount)
  WHERE payment.status = VERIFIED
    AND MONTH(payment.verified_at) = CURRENT_MONTH
  
  Due_Amount = SUM(invoice.amount)
  WHERE invoice.issue_date >= FIRST_DAY_OF_MONTH
    AND invoice.due_date <= LAST_DAY_OF_MONTH
  
  Collection_Rate = (Collected_Amount / Due_Amount) * 100
  ```

### Task 1.1.2 - Tenant-level Drill-down View

**Objective**: Dari aging bucket, lihat detail per tenant

**View: "Outstanding Summary Table"**
```
Columns:
- Unit number (e.g., "A-12")
- Tenant name
- Invoice ID
- Amount due (Rp)
- Days overdue
- Last payment date
- Payment method available
- Action (send reminder)

Sorting: Days overdue DESC (oldest first)
Filters: By property, by aging bucket, by tenant name
```

**Detail Row Expansion**:
- Click row → Show:
  - Full invoice details (items, dates, amounts)
  - Payment history untuk invoice ini (partial payments, etc)
  - Contact info (email, phone, WhatsApp)
  - Quick actions:
    - Send WhatsApp reminder (pre-filled message)
    - Send SMS reminder
    - Mark as disputed (jika ada issue)
    - Create collections case

### Task 1.1.3 - Dashboard Data Aggregation Logic

**Calculation Timing**:
- Real-time untuk payment_verified (update collections immediately)
- Daily batch para state transitions (ISSUED → DUE → OVERDUE)
- Every 6 hours untuk aging bucket recalculation (days overdue changes)

**Query Optimization** (database):
- Create view: `v_outstanding_summary`
  ```
  SELECT
    invoice.id,
    invoice.merchant_id,
    invoice.tenant_user_id,
    invoice.amount,
    COALESCE(SUM(payment.amount), 0) as paid_amount,
    invoice.amount - COALESCE(SUM(payment.amount), 0) as outstanding_amount,
    invoice.due_date,
    CURRENT_DATE - invoice.due_date as days_overdue,
    invoice.status
  FROM invoices
  LEFT JOIN payments ON invoice.id = payments.invoice_id 
                    AND payment.status = 'VERIFIED'
  WHERE invoice.merchant_id = $1
    AND invoice.status IN ('ISSUED', 'DUE', 'OVERDUE', 'PARTIALLY_PAID')
  GROUP BY invoice.id
  HAVING outstanding_amount > 0
  ORDER BY days_overdue DESC
  ```

- Index: `(merchant_id, status, due_date DESC)` pada invoices table

---

## 1.2 Automated Payment Reconciliation
**Gap**: Manual verification step delays cash flow recognition  
**Status**: CRITICAL | **Impact**: Cash flow delay, financial close delay

### Task 1.2.1 - Smart Payment Matching Algorithm

**Objective**: Auto-match 90%+ payments to invoices without manual review

**Tier 1: Exact Match (95% of cases)**
```
IF payment.amount = invoice.amount
  AND payment.payer_account IN (whitelist untuk merchant ini)
  THEN
    payment.status = AUTO_VERIFIED
    payment_invoice_match.status = AUTO_MATCHED
    payment_invoice_match.match_confidence = 0.99
    EMIT event: payment_verified → trigger invoice status update
```

**Tier 2: Amount-based Match (3% of cases)**
```
IF payment.amount ≠ invoice.amount
  THEN check multiple scenarios:
  
  Scenario A: Amount > Invoice (Overpayment)
    matching_invoice = find invoice by (tenant, amount ≈ payment.amount)
    IF NOT found:
      payment.status = AUTO_VERIFIED
      payment_invoice_match.status = PENDING_ALLOCATION
      payment_invoice_match.note = "Overpayment, awaiting allocation"
      → Show pemilik UI: apply to next invoice or refund?
  
  Scenario B: Amount < Invoice (Partial payment)
    matching_invoice = find invoice (tenant, expected_amount, due_date recent)
    IF amount ≈ expected_amount * 0.5 (common pattern):
      payment.status = AUTO_VERIFIED
      payment_invoice_match.status = AUTO_MATCHED_PARTIAL
      payment_invoice_match.matched_amount = payment.amount
      remaining_amount = invoice.amount - payment.amount
      invoice.status = PARTIALLY_PAID
      → Auto-create reminder untuk sisa payment
  
  Scenario C: Delayed payment (wrong month/old invoice)
    matching_invoice = find invoice by tenant WHERE:
      - amount = payment.amount
      - status IN (DUE, OVERDUE)
      - due_date < payment_date
    IF found:
      payment.status = AUTO_VERIFIED
      payment_invoice_match.status = AUTO_MATCHED_LATE
      → Automatically calculate & log late payment fee jika applicable
```

**Tier 3: Context-based Match (2% of cases)**
```
IF Tier 1 & Tier 2 tidak match:
  payment.status = PENDING_REVIEW (manual)
  payment_invoice_match.status = AWAITING_MANUAL_REVIEW
  payment_invoice_match.match_confidence = 0.0
  → Notify pemilik: review in dashboard
  → Set 24-hour SLA untuk review
```

### Task 1.2.2 - Payment Reconciliation UI

**Where**: Collections dashboard → "Unmatched Payments" section

**List View**:
```
Columns:
- Payment date
- Payment method (bank transfer, etc)
- Amount (Rp)
- Payer name / account
- Status (Auto-verified, Pending review, Rejected)
- Matched invoice (if any)
- Action

For PENDING_REVIEW:
- Show: Suggested invoice list (top 3 matches by tenant & amount)
- Pemilik dapat: click to match, mark as other transaction, refund
```

**Workflow for Manual Review**:
1. Pemilik klik payment → show details
2. Display: Top 3 matching invoices (sorted by likelihood)
3. Pemilik select → system auto-match & update invoice status
4. Atau pemilik select "Other" → create bank reconciliation item (not invoice)
5. Atau pemilik select "Refund" → initiate refund flow

---

## 1.3 Automated Payment Reminders with Escalation
**Gap**: Tidak ada reminder automation, collections manual  
**Status**: CRITICAL | **Impact**: Manual workload, inconsistent collection

### Task 1.3.1 - Reminder Escalation Schedule

**Objective**: Auto-send reminders saat invoice overdue, escalate if not paid

**Timeline & Channel**:
```
T+2 days (2 hari after due date):
  Channel: EMAIL
  Tone: Mild, friendly
  Template: "Hi {tenant_name}, just a friendly reminder that 
            your invoice #{invoice_id} for Rp {amount} is due. 
            Please pay by {due_date}. Thank you!"
  Condition: IF invoice.status = DUE AND days_overdue >= 2
  
T+5 days:
  Channel: SMS
  Tone: Firmer
  Template: "{tenant_name}, Invoice #{invoice_id} Rp {amount} 
           belum dibayar. Mohon segera transfer. Hub {merchant_phone}"
  Condition: IF invoice.status = OVERDUE AND days_overdue >= 5 
             AND no payment received
  
T+10 days:
  Channel: WhatsApp + Personal message
  Tone: Urgent
  Template: "Ya {tenant_name}, invoice sudah {days_overdue} hari 
           belum dibayar. Tolong segera lunasi Rp {amount} agar 
           tidak ada tindakan lebih lanjut."
  Condition: IF days_overdue >= 10 AND no payment
  
T+15 days:
  Channel: Email + Notice
  Action: AUTO-CREATE collections case
  Tone: Legal notice
  Template: "Notice of overdue payment..."
  Condition: IF days_overdue >= 15 AND no payment
```

### Task 1.3.2 - Collections Case Auto-generation

**Trigger**: When invoice 15+ days overdue without payment

**Auto-Create `collections_cases` record**:
```
Fields:
- merchant_id = invoice.merchant_id
- invoice_id = invoice.id
- tenant_user_id = invoice.tenant_user_id
- status = "auto_generated"
- case_type = "overdue_payment"
- amount_outstanding = invoice.outstanding_amount
- days_overdue = CURRENT_DATE - invoice.due_date
- priority = IF days_overdue > 30 THEN "high" ELSE "medium"
- created_at = NOW()
```

**Pemilik Actions**:
- View case → See case details + payment history
- Actions available:
  - Send legal notice
  - Suspend unit (prevent new lease)
  - Write-off (if amount small, e.g., <Rp 100K)
  - Mark resolved (if payment received late)

### Task 1.3.3 - Reminder Preference Control

**Objective**: Pemilik dapat customize reminder schedule & channel

**Settings Location**: Merchant settings → Collections automation

**Customization Options**:
```
1. Enable/disable reminders
2. Select channels (email, SMS, WhatsApp, all)
3. Adjust timing (default T+2, T+5, T+10, T+15)
4. Select message template (default atau custom)
5. Escalation action at T+15 (auto-create case or manual)
```

**Data Model**:
- `merchant_settings` table (if not exists)
  - Add: `collections_reminder_config` (JSONB)
  - Example:
    ```json
    {
      "enabled": true,
      "channels": ["email", "sms", "whatsapp"],
      "escalations": [
        {"days": 2, "channel": "email", "template_id": "template_1"},
        {"days": 5, "channel": "sms", "template_id": "template_2"},
        {"days": 10, "channel": "whatsapp", "template_id": "template_3"},
        {"days": 15, "action": "create_case", "case_type": "overdue"}
      ]
    }
    ```

---

## 1.4 Expense Tracking - Financial Completeness
**Gap**: No expense tracking → profit calculation incomplete  
**Status**: CRITICAL | **Impact**: Financial blocker

### Task 1.4.1 - Expense Entry & Categorization

**Objective**: Pemilik dapat catat semua operating expenses dalam <5 menit

**Expense Categories** (hardcoded):
```
- Utilities: Electricity, Water, Internet
- Maintenance: Repair, Cleaning, Pest control
- Insurance: Property insurance, Liability
- Taxes: Property tax, Income tax, Other tax
- Marketing: Online ads, Brochure, Signage
- Administrative: Bank fees, Office supplies
- Payroll: Staff salary, Cleaning staff
- Other: Miscellaneous
```

**Entry Method 1: Manual Entry**
- Form fields:
  - Category (dropdown)
  - Detail (text field)
  - Amount (number)
  - Date (date picker)
  - Description (optional)
  - Payment method (cash / bank transfer)
  - Paid by (if multiple staff)
- Validation:
  - Amount > 0
  - Date not in future
  - Category selected
- SLA: Record dalam <3 menit

**Entry Method 2: Receipt OCR**
- Upload receipt image (JPG/PNG)
- System auto-detect:
  - Amount (via OCR)
  - Date (via OCR)
  - Vendor (if clear)
- Pemilik verify:
  - Amount correct? (show OCR confidence)
  - Category (suggest based on vendor)
  - Mark as verified
- If OCR fails:
  - Fall back to manual entry
  - Keep receipt image for audit

### Task 1.4.2 - Expense Aggregation & Reporting

**Where**: Dashboard → "Operating Expenses" widget

**Widget Display** (monthly):
```
Expenses This Month: Rp 45.234.567
├─ Utilities: Rp 8.5M (18.8%)
├─ Maintenance: Rp 15.2M (33.6%)
├─ Insurance: Rp 12.0M (26.5%)
├─ Payroll: Rp 7.0M (15.5%)
├─ Other: Rp 2.5M (5.5%)

vs Last Month: ↑ 12% (Rp 4.3M increase)
```

**Calculation Logic**:
```
Monthly_Expenses = SUM(expenses.amount)
WHERE merchant_id = $1
  AND MONTH(expense_date) = CURRENT_MONTH
  AND status = 'approved'

Per_Category = SUM(expenses.amount)
GROUP BY expense_category
WHERE same conditions

Percentage = (Category_Amount / Monthly_Expenses) * 100

Variance = Current_Month - Previous_Month
```

### Task 1.4.3 - Profit Calculation (Revenue - Expenses)

**Where**: Dashboard → "P&L Quick View"

**Calculation** (monthly):
```
Revenue = SUM(invoices.amount)
WHERE merchant_id = $1
  AND invoice.issued_date >= FIRST_DAY_OF_MONTH
  AND status != 'CANCELLED'

Actual_Collections = SUM(payments.amount)
WHERE payment.status = 'VERIFIED'
  AND MONTH(payment.verified_at) = CURRENT_MONTH

Operating_Expenses = (per Task 1.4.2)

Outstanding = Revenue - Actual_Collections

Net_Profit = Actual_Collections - Operating_Expenses

Profitability_Rate = (Net_Profit / Actual_Collections) * 100
```

**Dashboard Display**:
```
Revenue This Month: Rp 500M
Operating Expenses: -Rp 45M
Outstanding: Rp 50M (9%)
───────────────────────────
Net Profit (Collected): Rp 455M
Profitability: 91%
```

**Alert Conditions**:
- If Profitability < 60% → Show warning "Check expenses"
- If Outstanding > 15% of revenue → Show alert "High outstanding"

---

## 1.5 Tenant Profile Consolidation
**Gap**: Tenant info scattered across multiple modules  
**Status**: CRITICAL | **Impact**: Decision blocker

### Task 1.5.1 - Unified Tenant Profile View

**Objective**: Single page dengan semua tenant info

**Layout**:
```
Header:
├─ Tenant name + photo
├─ Unit number & property
├─ Current lease: {start_date} to {end_date}
├─ Status: Active / Move-out notice / Renewal pending

Tab 1: Contract & Lease
├─ Contract number
├─ Start date, end date
├─ Monthly rent amount
├─ Lease renewal status
├─ Move-out notice (if any)
├─ Action: Download contract, send renewal offer, create amendment

Tab 2: Payment History
├─ Timeline chart (payment status over 12 months):
    - Paid on time (green)
    - Paid late (yellow)
    - Not paid (red)
├─ Key metrics:
    - On-time payment %: 85%
    - Average late days: 3 days
    - Total paid: Rp 150M
    - Total outstanding: Rp 5M
├─ Recent payments (table):
    - Invoice date, amount, status, payment date
├─ Download: Payment history report

Tab 3: Maintenance
├─ Maintenance history (last 6 months):
    - Request date, issue, status, resolution date
├─ Total requests: 5
├─ Common issues: AC repair (2x), Lock repair (1x)
├─ Total cost: Rp 2.3M
├─ Maintenance score: 75/100

Tab 4: Compliance & Issues
├─ Rule violations: 1 (late payment)
├─ Disputes: None
├─ Complaints: 1 (neighbor noise)
├─ Incident reports: None

Tab 5: Tenant Quality Score
├─ Overall score: 80/100 → "Good tenant"
├─ Sub-scores breakdown:
    - Payment score: 85
    - Maintenance score: 75
    - Compliance: 85
    - Communication: 80
├─ Risk level: Low
├─ Recommendation: "Renew at standard terms"
├─ Recommendation notes: "Reliable, good payment history. Consider minor rent increase."

Contact & Notes:
├─ Email, phone, WhatsApp
├─ Emergency contact
├─ Internal notes (pemilik dapat update)
├─ Alerts: "Lease expires in 45 days"
```

### Task 1.5.2 - Tenant Quality Scoring Logic

**Objective**: Objektif assessment untuk lease renewal decision

**Scoring Framework**:

**1. Payment Score (40% weight)**
```
on_time_payment_rate = (on_time_payments / total_invoices) * 100

IF on_time_rate >= 95%: score = 95 + bonus_points
ELSE IF on_time_rate >= 85%: score = 85 + (on_time_rate - 85)
ELSE IF on_time_rate >= 70%: score = 70
ELSE IF on_time_rate >= 50%: score = 50
ELSE: score = 30

late_payment_penalty = (avg_days_late / 30) * 10  [max 10 points]
payment_score = MAXIMUM(0, score - late_payment_penalty)
```

**2. Maintenance Score (20% weight)**
```
request_frequency_per_month = total_requests / lease_months

IF request_frequency <= 0.2: score = 90
ELSE IF request_frequency <= 0.5: score = 80
ELSE IF request_frequency <= 1: score = 70
ELSE IF request_frequency <= 2: score = 50
ELSE: score = 30

damage_incidents = count of damage reports
damage_penalty = damage_incidents * 15  [max 30 points]

maintenance_score = MAXIMUM(0, score - damage_penalty)
```

**3. Compliance Score (20% weight)**
```
violations = count of rule violations

IF violations = 0: score = 100
ELSE IF violations = 1: score = 80
ELSE IF violations = 2-3: score = 60
ELSE IF violations >= 4: score = 40

disputes = count of disputes
dispute_penalty = disputes * 20  [max 40 points]

compliance_score = MAXIMUM(0, score - dispute_penalty)
```

**4. Communication Score (20% weight)**
```
response_time_avg = average time to respond to merchant messages

IF response_time < 1 hour: score = 95
ELSE IF response_time < 6 hours: score = 85
ELSE IF response_time < 24 hours: score = 70
ELSE IF response_time > 24 hours: score = 40

problem_resolution_rate = (problems_resolved / total_issues) * 100
IF resolution_rate >= 90%: bonus = 10
ELSE IF resolution_rate >= 70%: bonus = 5

communication_score = score + bonus
```

**Overall Score Calculation**:
```
overall_quality_score = (
  payment_score * 0.4 +
  maintenance_score * 0.2 +
  compliance_score * 0.2 +
  communication_score * 0.2
)

Risk Level Assignment:
IF overall_quality_score >= 80: risk_level = "LOW"
ELSE IF overall_quality_score >= 60: risk_level = "MEDIUM"
ELSE IF overall_quality_score >= 40: risk_level = "HIGH"
ELSE: risk_level = "CRITICAL"

Recommendation Logic:
IF risk_level = "LOW" AND on_time_rate >= 90%:
  recommendation = "HIGH_PRIORITY_RENEW"
  notes = "Excellent tenant, consider minor rent increase"
ELSE IF risk_level = "LOW":
  recommendation = "RENEW_STANDARD"
  notes = "Good tenant, renew at current or slight increase"
ELSE IF risk_level = "MEDIUM":
  recommendation = "MONITOR"
  notes = "Monitor for {reason}, renewal conditional on improvement"
ELSE:
  recommendation = "DO_NOT_RENEW"
  notes = "{reason}, consider non-renewal"
```

**Update Frequency**: Monthly (nightly batch process)

---

## 1.6 Real-time Financial Visibility - Summary
**Where**: Main dashboard

**Widgets Layout**:
```
Row 1:
├─ Collections Today (Rp X.XXX.XXX)
├─ Outstanding (aging breakdown)
├─ Expected This Week

Row 2:
├─ Revenue This Month
├─ Operating Expenses
├─ Net Profit (bottom line)

Row 3:
├─ Collection Rate (%)
├─ Profitability (%)
├─ Outstanding Rate (% of revenue)
```

---

# PHASE 2: CORE OPERATIONS UNLOCK (Weeks 8-12)

## 2.1 Tenant Portal - Self-service Payment & Management

### Task 2.1.1 - Portal Interface Design

**Objective**: Tenants dapat bayar invoice, lihat history, request maintenance tanpa contacting pemilik

**Portal Pages**:

**1. Dashboard (Home)**
- Quick overview:
  - Next invoice due date: {date}
  - Amount: Rp {amount}
  - Status: [Due soon / Overdue / Already paid]
- Action buttons:
  - [Pay Now] - Quick payment
  - [View invoices] - Full history
  - [Request Maintenance]
  - [Messages to landlord]

**2. Invoices & Payments Page**
- List:
  ```
  Invoice ID | Month | Amount | Due Date | Status | Action
  INV-001    | Jan   | Rp 2M  | Jan 10   | PAID   | [Download]
  INV-002    | Feb   | Rp 2M  | Feb 10   | DUE    | [Pay Now]
  INV-003    | Mar   | Rp 2M  | Mar 10   | DUE    | [Pay Now]
  ```
- Filter: By month, by status, by payment method
- Download: Invoice as PDF
- Payment history per invoice

**3. Make Payment Flow**
```
Step 1: Select invoice(s) to pay
  - Show: Invoice amount, due date, status
  - Checkbox to select multiple invoices
  
Step 2: Payment method selection
  - Bank transfer (provide account details)
  - E-wallet (show integration options: GCash, Dana, OVO, etc)
  - Credit card (if enabled)
  
Step 3: Upload proof (if bank transfer)
  - Photo of receipt / bank confirmation
  - System auto-verify within 1 hour
  
Step 4: Confirmation
  - Show: Total amount, method, expected verification time
  - Send confirmation email
```

**4. Maintenance Request Page**
- List of open requests (status, date, description)
- [New Request] button:
  - Category: AC, Plumbing, Electrical, Cleaning, Other
  - Issue description (text + photo)
  - Priority: Low / Medium / Urgent
  - Preferred resolution date
  - Submit
- Request tracking:
  - Status updates: Submitted → Assigned → In Progress → Completed
  - View assigned vendor
  - Add comments / photos during resolution
  - Rate maintenance quality (1-5 stars)

**5. Messages / Support**
- Chat interface dengan pemilik
- FAQ section
- Support ticket creation

### Task 2.1.2 - Payment Verification Integration

**Objective**: Tenant payment immediately reflected in tenant portal

**Flow**:
1. Tenant upload proof / complete e-wallet payment
2. System: Auto-verify payment (AI/OCR or e-wallet API)
3. Payment.status = VERIFIED
4. Invoice.status = PAID (if amount matches)
5. Tenant portal: Show "Payment confirmed"
6. Tenant email: Confirmation receipt

**SLA**: <2 hours dari upload → verification

### Task 2.1.3 - Portal Security & Access Control

**Authentication**:
- Tenant login: Email + OTP (atau existing tenant account)
- Multi-property: Jika tenant rent multiple units → see all in one portal
- Logout after inactivity (15 menit)

**Data Visibility**:
- Tenant hanya lihat: Own invoices, own maintenance requests, own messages
- Tidak akses: Other tenants' data, unit photos, pemilik contact details

---

## 2.2 Waiting List & Applicant Management

### Task 2.2.1 - Waiting List Setup

**Objective**: Manage applicants & fill vacancies efficiently

**Waiting List Features**:

**1. Add to Waiting List**
- Pemilik dapat add manually atau applicant self-submit
- Form fields:
  - Applicant name, phone, email
  - Preferred move-in date
  - Unit preference (if specific) atau flexible
  - Budget range
  - Occupant type: Student / Professional / Family
  - Special requirements: Pet, disabled, etc
- Status: `interested` (default)

**2. Manage Applicants**
- View list sorted by:
  - Preferred move-in date (earliest first)
  - Application priority (manually set)
  - Status
- Bulk actions:
  - Send offer to top 3 candidates
  - Auto-reject if move-in date passed
  - Auto-delete if inactive 30 days

**3. Send Lease Offer**
- Select applicant → click "Send Offer"
- Auto-generate offer letter:
  - Unit details
  - Monthly rent amount
  - Lease term (3/6/12 months)
  - Move-in date
  - Required documents (ID, deposit)
- Send via email with:
  - Offer letter (PDF)
  - Unit photos
  - Building rules
  - Application form link
- Status: `offered` (waiting for applicant response)

**4. Applicant Response Tracking**
- Dashboard shows:
  - Offer sent date
  - Email open status
  - Applicant acceptance / rejection
  - Deadline for response (auto-set to 7 days)
- Auto-reminder: If no response after 5 days → Send SMS reminder
- If acceptance:
  - Change status to `accepted`
  - Auto-create contract draft
  - Request documents (ID, deposit payment)
  - Provide portal login credentials
  - Send move-in instructions

**5. Waiting List Automation**
- Trigger: Unit becomes vacant (move-out notice or contract end)
- Action:
  1. Notify pemilik: "Unit X-05 will be vacant on {date}"
  2. Auto-find top 3 candidates from waiting list (match preferred date + budget)
  3. Show pemilik: "Send offer to these 3?"
  4. Pemilik approve → Auto-send offers
  5. Wait for responses
  6. If acceptance: Auto-create contract
  7. If rejection: Move to next candidate
  8. If no response: Auto-reject after 7 days, try next candidate

### Task 2.2.2 - Applicant Quality Assessment

**Data Captured**:
- Move-in date preference (early, on-time, flexible)
- Budget (strict, flexible, can negotiate)
- Occupant type (reflects lease duration likelihood)
- Special needs (affects maintenance expectations)

**Scoring Logic** (simple):
```
Fit_Score = 
  (date_match * 0.4) +  // 1.0 if preferred date available, 0.5 if flexible
  (budget_match * 0.3) + // 1.0 if budget >= unit rent
  (reliability * 0.3)    // 0.5 default for new applicant

Higher score = prioritize in offers
```

---

## 2.3 Lease Renewal & Amendment Workflow

### Task 2.3.1 - Automated Renewal Alerts

**Objective**: Never miss lease renewal deadline, pro-active engagement

**Alert Timeline** (from contract end date):

**60 days before**:
- Alert type: Email + dashboard notification
- Recipient: Pemilik
- Message: "Lease for {tenant_name} @ unit {unit} expires in 60 days ({date}). 
            Review tenant quality score and plan renewal."
- Action: Pemilik can:
  - [View tenant profile]
  - [Start renewal process]
  - [Plan move-out]
  - Dismiss alert

**30 days before**:
- Send renewal offer to tenant
- Pemilik compose offer:
  - Same terms or new terms (rent adjustment, duration)
  - Renewal incentive (discount, upgrade, etc)
  - Lease start date (should match current end date)
- Send to tenant via:
  - Email
  - Tenant portal notification
  - SMS
- Tenant response deadline: 7 days

**7 days before**:
- If no response from tenant: Send SMS reminder
- If tenant rejected: Auto-notif pemilik "Tenant declined renewal"
  - Trigger: Add to waiting list for next tenant
  - Pemilik prepare move-out

**Contract end date**:
- Auto-generate move-out notice if not renewed
- Lock unit status (no new booking until move-out confirmed)

**After end date**:
- Track: Tenant still occupying? (overholding)
- If overholding > 7 days: Generate collections case

### Task 2.3.2 - Lease Amendment Workflow

**Objective**: Handle mid-lease changes (rent increase, term extension, etc)

**Amendment Types**:

**1. Rent Adjustment**
- Trigger: Pemilik initiates "Adjust rent"
- Form:
  - Current rent: Rp 2.5M
  - New rent: Rp [input]
  - Effective date: [date picker]
  - Reason: [optional note to tenant]
- System:
  - Calculate impact: New monthly amount vs old
  - Generate amendment document
  - Send to tenant with explanation
  - Require tenant signature
  - Update contract record

**2. Lease Extension**
- Same as renewal but within active lease
- Example: Tenant wants to extend 6 months early
- Process: Same as renewal offer workflow

**3. Term Modification**
- Change lease duration: 12 months → 6 months
- Change occupancy rules: Pet added, subletting allowed
- Process: Generate amendment, require signatures

**Amendment Workflow**:
1. Pemilik select amendment type
2. System generate amendment document (pre-filled with contract details)
3. Send to tenant with:
   - Amendment document (PDF)
   - Explanation email
   - E-signature request
4. Tenant review & sign (e-signature)
5. System stores signed amendment
6. Update contract record
7. Notify both parties: Amendment effective date

---

## 2.4 Collections Automation - Advanced

### Task 2.4.1 - Collections Case Management

**Objective**: Track overdue payment escalation & resolution

**Collections Case Lifecycle**:

**1. Case Auto-creation** (Task 1.3.2 already covered)
- Trigger: 15+ days overdue
- Auto-assign: To pemilik (can reassign to staff)

**2. Case Investigation**
- Pemilik actions:
  - [View tenant profile]
  - [Contact tenant] (pre-fill WhatsApp/SMS)
  - [Review payment history]
  - [Check for disputes]
- Tenant might have:
  - Legitimate reason (sick, accident, delayed salary)
  - System issue (payment failed, account problem)
  - Dispute (disagree with charge)

**3. Case Resolution**
- Options:
  a) Payment received → Case closed, mark as resolved
  b) Payment plan agreed → Create payment_plan record
  c) Dispute → Link to disputes module, pause collections
  d) Write-off → Mark as uncollectible (small amounts only)
  e) Legal action → Generate legal notice (future feature)

**4. Payment Plans**
- For struggling tenants: Create installment agreement
- Fields:
  - Total amount: Rp {outstanding}
  - Installment frequency: Weekly / Bi-weekly / Monthly
  - Number of installments: {n}
  - Installment amount: {amount}
  - Start date: {date}
  - End date: {date}
- Tenant commitment: Acknowledge + sign
- System tracking:
  - Auto-remind before each installment due date
  - Track payment: On-time / Late
  - If missed 2 installments: Resume collections escalation

### Task 2.4.2 - Collections Dashboard Reports

**Where**: Collections section → Reports

**Report 1: Collections Performance**
```
Daily Summary:
- Payments received today: Rp 50M (15 transactions)
- Collection rate today: 95% (15 of 16 due invoices)
- Successful reminders sent: 8 (email, SMS, WhatsApp)
- Failed reminders: 1 (invalid phone)

Weekly Summary:
- Total collected: Rp 250M
- Collection rate: 92%
- Average days to collect: 5 days (vs target 2)
- Overdue cases created: 3

Monthly Summary:
- Collection rate: 85%
- Aging at month-end:
  - <7 days: Rp 20M
  - 7-14 days: Rp 15M
  - 14-30 days: Rp 10M
  - 30+ days: Rp 5M
```

**Report 2: Per-Tenant Collection Rate**
```
Table:
Tenant Name | On-time % | Avg Late (days) | Total Paid | Outstanding
John Doe    | 90%       | 2               | Rp 150M    | Rp 0
Jane Smith  | 70%       | 10              | Rp 100M    | Rp 5M
Bob Johnson | 100%      | 0               | Rp 200M    | Rp 0

Sorted by: On-time %, ascending (worst first)
```

**Report 3: Collections Cases**
```
Open Cases: 5
├─ 30+ days overdue: 2 (Rp 10M)
├─ 15-30 days: 3 (Rp 8M)

Case Status Breakdown:
├─ Investigating: 2
├─ Payment plan in progress: 1
├─ Awaiting tenant response: 2
├─ Resolved (this month): 8
```

---

# PHASE 3: INTELLIGENCE & OPTIMIZATION (Weeks 13-16)

## 3.1 Dynamic Pricing Strategy

### Task 3.1.1 - Market Rate Tracking

**Objective**: Help pemilik stay competitive dengan market

**Features**:

**1. Market Rate Dashboard**
```
Your Units:
├─ Studio: Current Rp 2.0M/month
│  ├─ Market rate: Rp 2.1M - 2.3M
│  ├─ Your position: Below market (5% lower)
│  ├─ Recommendation: Consider price increase
│
├─ 1-Bedroom: Current Rp 2.8M/month
│  ├─ Market rate: Rp 2.7M - 2.9M
│  ├─ Your position: Aligned with market (exactly average)
│  ├─ Recommendation: Competitive
│
└─ 2-Bedroom: Current Rp 4.0M/month
   ├─ Market rate: Rp 3.8M - 4.2M
   ├─ Your position: At high end (97th percentile)
   ├─ Recommendation: Risk overpricing, monitor occupancy
```

**Data Source**:
- Aggregate market data dari:
  - Published listings (properti.com, Travelio, etc)
  - Historical data from platform
  - Nearby similar properties (radius 2km, same category)

**Calculation** (quarterly update):
```
Market_Rate_Avg = MEDIAN(comparable_properties.price)
  WHERE location = same_area
    AND unit_type = same_type
    AND occupancy > 80% (exclude distressed)
    AND last_updated <= 90 days

Your_Price_Position = (your_price / market_rate_avg) * 100

IF your_price < market_rate_avg * 0.95: recommendation = "INCREASE"
ELSE IF your_price > market_rate_avg * 1.05: recommendation = "DECREASE"
ELSE: recommendation = "MAINTAIN"
```

### Task 3.1.2 - Dynamic Pricing Rules

**Objective**: Auto-adjust prices based on occupancy & demand

**Rule Types**:

**1. Occupancy-based Pricing**
```
Base rent: Rp 2.5M

IF current_occupancy >= 95%:
  Apply premium: +5% → Rp 2.625M
  (for new tenants / renewals)
  
IF current_occupancy <= 60%:
  Apply discount: -10% → Rp 2.25M
  (to fill vacancies)
  
IF 60% < occupancy < 95%:
  Keep base price
```

**2. Seasonal Adjustment**
```
Base rent: Rp 2.5M

Seasonal premium (tourism season):
- December: +15% (holidays) → Rp 2.875M
- January: +10% (school holidays) → Rp 2.75M
- Others: Base price

Defined by: pemilik in pricing rules settings
```

**3. Long-lease Discount**
```
1-month lease: Rp 2.5M/month
3-month lease: Rp 2.4M/month (-4%)
6-month lease: Rp 2.35M/month (-6%)
12-month lease: Rp 2.25M/month (-10%)

Benefits: Stable tenants, predictable revenue
```

**Implementation**:
- Store rules in `dynamic_pricing_rules` table
- When new lease negotiated: Apply rules → Show recommended price
- Pemilik can override (flexibility)
- Track: Which rules applied to which lease

---

## 3.2 Occupancy Forecasting

### Task 3.2.1 - Forecast Model

**Objective**: Predict next month's occupancy, plan for vacancies

**Data Inputs**:
- Historical move-outs (last 12 months)
- Contract end dates (next 90 days)
- Waiting list size
- Seasonal patterns
- Market demand indicators

**Simple Forecasting Logic** (no ML required initially):

```
Step 1: Calculate historical move-out rate
last_12_months_moveouts = COUNT(contracts)
  WHERE end_date BETWEEN (TODAY - 365 days) AND TODAY
  AND status = 'expired'

moveout_rate = last_12_months_moveouts / (avg_units * 12)
// Example: 20 move-outs / (40 units * 12) = 4.1% per month

Step 2: Predict move-outs next month
predicted_moveouts = moveout_rate * total_units
// 4.1% * 40 = 1.64 ≈ 2 units

Step 3: Count confirmed move-outs
confirmed_moveouts = COUNT(contracts)
  WHERE end_date BETWEEN (TODAY) AND (END_OF_NEXT_MONTH)

total_predicted_moveouts = confirmed_moveouts + 
                          predicted_moveouts

Step 4: Estimate move-ins from waiting list
waiting_list_size = COUNT(applicants)
  WHERE status = 'accepted'
    AND expected_movein <= END_OF_NEXT_MONTH
    
matched_candidates = waiting_list_size * fill_rate
// Assume 70% of accepted applications convert

predicted_movein = matched_candidates

Step 5: Calculate predicted occupancy
predicted_occupied = current_occupied - predicted_moveouts + predicted_movein
predicted_occupancy = (predicted_occupied / total_units) * 100

Step 6: Confidence score
IF data available >= 12 months: confidence = 0.85
ELSE IF data available >= 6 months: confidence = 0.70
ELSE: confidence = 0.50
```

**Output**:
```
Forecast for {month_name}:
- Current occupancy: 92% (37/40 units)
- Predicted move-outs: 2 units
- Predicted move-ins: 1 unit
- Predicted occupancy: 87.5% (35/40 units)
- Confidence: 85%

Action recommendations:
- 2 units will be vacant → Start marketing
- Expected vacancy cost: Rp 5M/month
- Marketing budget recommendation: Rp 2M
```

### Task 3.2.2 - Vacancy Management Automation

**Objective**: Minimize vacancy period

**Workflow**:

**When vacancy predicted**:
1. System notifies: "Unit X-05 expected vacant on {date}"
2. Recommend: Start marketing 30 days before
3. Auto-suggest: Check waiting list, send offers
4. Unit status: Mark as "Pre-vacant" (can prepare, clean, repair)

**On move-out date**:
1. Capture move-out photos
2. Schedule inspections & repairs (if any)
3. Update unit status: "Vacant - Under preparation"

**On ready-to-lease**:
1. Update photos in portal
2. Change status: "Available"
3. Send notification: To waiting list applicants
4. Activate unit in search / marketplace

---

## 3.3 Maintenance ROI Analytics

### Task 3.3.1 - Maintenance Cost Tracking

**Objective**: Understand maintenance cost patterns, prevent over-maintenance

**Tracking Fields** (in `maintenance_expenses`):
- Maintenance request ID (link to original request)
- Vendor ID
- Parts cost
- Labor cost
- Total cost
- Category (preventive vs reactive)

**Preventive vs Reactive**:
```
Preventive: Scheduled maintenance (regular cleaning, AC service)
- Expected cost: Fixed
- Benefit: Extend asset life, prevent emergencies

Reactive: Emergency repairs (AC broken, pipe burst)
- Cost: Often higher (emergency surcharge, overtime)
- Impact: Tenant dissatisfaction, vacancy risk
```

### Task 3.3.2 - Unit Economics Report

**Where**: Dashboard → Analytics → Unit Maintenance

**Report Content**:

**1. Cost Analysis**
```
Per Unit (monthly):
├─ Monthly rent: Rp 2.5M
├─ Maintenance cost (avg): Rp 200K
├─ Net profit: Rp 2.3M
├─ Maintenance as % of rent: 8%

Property Total (monthly):
├─ Total rent: Rp 100M (40 units)
├─ Total maintenance: Rp 8M
├─ Maintenance trend: ↑ 12% vs last month
```

**2. Cost by Category**
```
AC repairs: Rp 4.2M (50%)
Plumbing: Rp 2.0M (25%)
Cleaning: Rp 1.2M (15%)
Electrical: Rp 0.6M (10%)

Highest cost items:
- AC compressor replacement: Rp 2.0M x 2
- Pipe burst repair: Rp 1.5M
```

**3. Preventive vs Reactive**
```
Preventive: Rp 3M (35% of total)
- Scheduled AC service: Rp 1.8M
- Deep cleaning: Rp 1.2M

Reactive: Rp 5M (65% of total) ← Higher cost!
- Emergency AC repair: Rp 2.8M
- Urgent plumbing: Rp 2.2M

Recommendation: Increase preventive maintenance
to reduce reactive emergencies
```

### Task 3.3.3 - Asset Lifecycle Management

**Objective**: Plan for major replacements (AC, water heater, etc)

**Tracked Assets** (in `assets` table):
- Asset name, category
- Location (unit/property)
- Purchase date, cost
- Warranty period
- Expected lifespan
- Maintenance history
- Current condition

**Depreciation & Replacement Tracking**:
```
AC Unit (Unit A-01):
- Purchased: 2019 (5 years old)
- Expected lifespan: 7 years
- Remaining: 2 years
- Current condition: Fair (maintenance costs increasing)
- Recommended action: Plan replacement in 2027
- Budget allocated: Rp 3M/month savings
```

**Report: "Asset Replacement Schedule"**
```
Next 3 Years Maintenance Plan:
- 2026: Replace AC (5 units) - Rp 15M
- 2026: Replace water heater (8 units) - Rp 8M
- 2027: Replace AC (8 units) - Rp 24M
- 2027: Paint building exterior - Rp 30M
Total estimated: Rp 77M over 3 years (Rp 2.1M/month budget)
```

---

## 3.4 Financial Reporting & Tax Compliance

### Task 3.4.1 - Monthly P&L Statement

**Objective**: Pemilik dapat track profitability per unit, per property

**Report: Monthly Profit & Loss**

```
REVENUE SECTION:
================
Rental income (invoices issued): Rp 500M
Miscellaneous income: Rp 5M
─────────────────────────────
Total Revenue: Rp 505M

COLLECTION SECTION:
====================
Cash collected (verified): Rp 485M
Outstanding (not yet paid): Rp 20M
Collection rate: 96%

EXPENSES SECTION:
=================
Operating expenses:
├─ Utilities (electric, water): Rp 45M
├─ Maintenance & repairs: Rp 30M
├─ Insurance: Rp 8M
├─ Payroll: Rp 20M
├─ Taxes: Rp 5M
├─ Marketing: Rp 3M
└─ Other: Rp 2M
─────────────────────────────
Total Operating Expenses: Rp 113M

PROFITABILITY:
================
Net Profit (collected - expenses): Rp 372M
Profit Margin: 73.7%

Outstanding Impact:
If outstanding collected: +Rp 20M → Total Rp 392M
If outstanding never collected: -Rp 20M → Total Rp 352M
```

**Drill-down Capability**:
- Click on any expense category → See detail breakdown
- Click on expense detail → See individual transactions
- Filter: By property, by unit, by date range

### Task 3.4.2 - Unit Economics Analysis

**Report: Per-Unit Profitability**

```
Unit A-01 (Studio):
- Monthly rent: Rp 2.5M
- Occupancy: 100% (12 months/year)
- Annual rental income: Rp 30M
- Annual maintenance: Rp 2.4M (8%)
- Annual utilities: Rp 1.8M (6%)
- Annual net profit: Rp 25.8M
- ROI: 25.8%

Unit A-02 (Studio):
- Monthly rent: Rp 2.5M
- Occupancy: 75% (9 months occupied, 3 months vacant)
- Annual rental income: Rp 22.5M
- Annual maintenance: Rp 3.0M (13% - higher due to damage)
- Annual utilities: Rp 1.8M (8%)
- Annual net profit: Rp 17.7M
- ROI: 17.7%

Comparison:
- Unit A-01 is more profitable (higher occupancy, lower maintenance)
- Unit A-02 risk factors: High vacancy, high maintenance cost
- Recommendation: Investigate vacancy causes, improve maintenance quality
```

### Task 3.4.3 - Tax Compliance Report

**Objective**: Prepare data untuk tax filing (PBB, PPh)

**Report: Tax Preparation Data** (Indonesia context)

```
Property Tax (PBB) Data:
├─ Property ID, address
├─ Building value (assessed)
├─ Tax year
├─ Tax ID
├─ Amount due
├─ Payment status

Income Tax (PPh) Data:
├─ Annual gross revenue: Rp X (all rental income)
├─ Allowable deductions: Rp Y (operating expenses, depreciation)
├─ Taxable income: Rp X - Y
├─ Tax rate: 25% (corporate) or 50% x 25% = 12.5% (individual)
├─ Tax due: Rp (X-Y) * 12.5%
├─ Tax paid YTD
├─ Balance due

Other compliance:
├─ Business registration (SIUP) status
├─ Tax ID (NPWP) status
├─ Audit log of all changes (for audit trail)
```

---

## 3.5 Multi-Property Consolidation

### Task 3.5.1 - Cross-Property Dashboard

**Objective**: For pemilik dengan >1 property, see consolidated view

**Dashboard Structure**:

**Selection**: Dropdown to select:
- All properties (consolidated)
- Property A
- Property B
- Property C

**Consolidated Metrics** (when "All properties" selected):

```
Total Portfolio:
├─ Total units: 120 (Property A: 40, B: 50, C: 30)
├─ Total occupied: 110 units (92% occupancy)
├─ Total revenue: Rp 500M/month

Collections:
├─ Total outstanding: Rp 50M
├─ Collection rate: 90%
├─ Top problem property: Property C (80% collection rate)

Profitability:
├─ Monthly profit: Rp 372M
├─ Profit by property:
│  ├─ Property A: Rp 140M (28%)
│  ├─ Property B: Rp 185M (37%)
│  └─ Property C: Rp 47M (9%)
├─ Highest margin: Property B (81%)
└─ Lowest margin: Property C (62%)

Maintenance:
├─ Total cost: Rp 30M
├─ Average per unit: Rp 250K
├─ Highest cost property: Property B (Rp 15M)
└─ Most maintained unit: C-05 (Rp 500K/month)
```

### Task 3.5.2 - Bulk Operations

**Objective**: Manage multiple units/properties efficiently

**Bulk Actions**:
- **Message**: Send announcement to all tenants across all properties
- **Invoice**: Generate invoices for all units (batch)
- **Rent Increase**: Apply rent increase across selected units
- **Maintenance**: Schedule bulk maintenance (e.g., AC service all units)
- **Reports**: Generate consolidated reports (P&L, tax, etc)

**Example: Bulk Rent Increase**
```
Select units: All units in Property A + B (90 units)
Increase amount: Rp 100K
Effective date: 2026-03-01
Notification: 30 days notice (send email to all 90 tenants)
Impact: Monthly revenue +Rp 9M
```

---

# PHASE 4: LAUNCH & ITERATION (Weeks 17-18)

## 4.1 Beta Launch

**Week 16 (Preparation)**:
- Final QA testing
- Create quick-start guides
- Prepare support team

**Week 17 (Soft Launch)**:
- 500 early adopters
- Focus on critical path: login → create property → add tenant → record payment
- Daily monitoring: System stability, data integrity, user engagement
- Collect feedback on: Onboarding complexity, confusion areas, feature requests

**Week 18 (Full Launch)**:
- Open to public
- Marketing campaign
- Target: 5,000 signups month 1

---

## 4.2 Success Metrics (Go/No-Go Checkpoint)

**MUST-HAVE** (Week 4 checkpoint):
- ✅ Activation time <2 minutes (email only, no document)
- ✅ Collections dashboard shows correct outstanding amount
- ✅ Profit calculation matches manual calculation
- ✅ 80% payments auto-matched to invoice
- ✅ User NPS >50

**IF MISS**: Delay launch, fix in Phase 2

---

# SUMMARY TABLE: GAP-TO-FIX MAPPING

| Gap from Audit | Phase | Week | Primary Owner | Status |
|--|--|--|--|--|
| Merchant verification bottleneck | 0 | 1-2 | Product | CRITICAL |
| Collections dashboard missing | 1 | 3-4 | Backend | CRITICAL |
| Payment verification manual | 1 | 4-5 | Backend | CRITICAL |
| Expense tracking missing | 1 | 5-6 | Backend | CRITICAL |
| Tenant profile scattered | 1 | 6-7 | Frontend | CRITICAL |
| Tenant portal missing | 2 | 8-9 | Frontend | MAJOR |
| Waiting list missing | 2 | 9-10 | Backend | MAJOR |
| Lease renewal workflow | 2 | 10-11 | Backend | MAJOR |
| Dynamic pricing missing | 3 | 12-13 | Analytics | MAJOR |
| Occupancy forecasting | 3 | 13-14 | Analytics | MAJOR |
| Maintenance ROI analytics | 3 | 14-15 | Analytics | MAJOR |
| Financial reporting weak | 3 | 15-16 | Analytics | MEDIUM |
| Multi-property consolidation | 3 | 16 | Frontend | MEDIUM |

---

**Document Version**: 1.0  
**Last Updated**: 2026-02-26  
**Prepared for**: PMS Development Team  
**Next Review**: Weekly sprint planning
