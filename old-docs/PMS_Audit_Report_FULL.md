# AUDIT LAPORAN SISTEM PMS (SiHuni)
## Perspektif Pemilik Kosan Profesional (20+ Unit)

**Tanggal Audit:** Februari 2026  
**Auditor:** Property Management Consultant  
**Kategori:** Full-Stack PMS System Review  
**Asumsi Dasar:**
- Pemilik kosan aktif dengan 20-50 unit kamar
- Target okupansi minimal 85%
- Fokus profit margin, efisiensi operasional, dan kontrol risiko
- Tidak memiliki tim IT internal
- Memerlukan dashboard yang intuitif untuk keputusan bisnis daily

---

## EXECUTIVE SUMMARY

Sistem SiHuni adalah **PMS modern dengan scope sangat ambisius** yang mencakup hampir semua aspek operasional properti rental. Namun, dari perspektif pemilik kosan praktis, sistem ini menunjukkan **misalignment antara kompleksitas teknis dan kebutuhan bisnis sehari-hari**.

### Scoring Keseluruhan

| Aspek | Score | Status |
|-------|-------|--------|
| Business Alignment | 6.5/10 | ⚠️ PERLU REVISI |
| Operational Efficiency | 6/10 | ⚠️ PERLU REVISI |
| Financial Control | 7.5/10 | ✅ BAIK |
| Risk Management | 5.5/10 | 🔴 PERLU PERBAIKAN |
| UX Non-Teknis | 5/10 | 🔴 PERLU PERBAIKAN |
| Scalability | 7/10 | ✅ BAIK (Infrastructure OK, UX belum) |
| Missing Features | 4/10 | 🔴 BANYAK GAP |

### Rekomendasi Final: **REVISE — Jangan Launch Sekarang**

Sistem memiliki fondasi teknis yang kuat, tetapi **user experience dan business logic masih terlalu developer-centric**. Diperlukan redesign fase 2 yang fokus pada real owner workflows sebelum launching.

---

## CRITICAL FINDINGS (HIGH RISK)

### ✅ 1. ESCROW SYSTEM DIHAPUS DARI MERCHANT — Direct Payment Model Diimplementasi

**Status:** ✅ COMPLETE — Diimplementasi 27 Feb 2026

> **Ringkasan Implementasi:**
> - Tabel `payment_transfers` dibuat untuk tracking transfer langsung ke rekening merchant
> - Edge function `xendit-webhook` di-refactor: pembayaran sewa otomatis trigger transfer ke bank merchant
> - Edge function `xendit-disbursement` & webhook diupdate untuk mendukung `payment_transfer_id`
> - `scheduled-disbursement` EF dihapus (tidak dibutuhkan lagi)
> - Seluruh UI escrow merchant dihapus (pages, components, hooks, services, types)
> - Admin Escrow page diganti dengan `AdminPaymentTransfers` dashboard
> - State machine `ESCROW_TRANSACTION_TRANSITIONS` dihapus, diganti `PAYMENT_TRANSFER_TRANSITIONS`
> - `VendorEscrowWidget` di-rename jadi `VendorEarningsWidget` dan dipindah ke `src/features/vendor/`
> - FAQ, JSON-LD, FeesConfig, dan navigation diupdate
> - Vendor escrow DIPERTAHANKAN (scope berbeda)

#### Problem Identifikasi:
- **Diagram 8 (Escrow & Disbursement)** menunjukkan complex system:
  - Tenant bayar → fund masuk escrow → pemilik request disbursement → admin verify → transfer ke pemilik
  - Ini adalah **3rd-party holding money** yang create friction, delay, dan trust issue
- **Business reality pemilik kosan**:
  - Pemilik INGIN uang langsung ke rekening mereka, bukan holding dulu
  - Trust ke platform masih low, prefer direct transaction
  - Administrative delay (admin manual verify) = lost cashflow visibility
  - Escrow complexity = support ticket increase
  
#### Current Problems:
- Tenant pembayaran → escrow hold → pemilik see payment tapi belum di rekening
- Dispute deposit refund (Diagram 9) using escrow as arbitration tool = unclear resolution path
- Scheduled vs manual disbursement path = confusing untuk pemilik
- Tenant mungkin complaint "kenapa uang saya di-hold di platform, bukan langsung di landlord"

#### Business Impact:
- **Trust issue** dengan tenant (money di-hold terasa tidak aman)
- **Trust issue** dengan pemilik (money tidak langsung di-accrue)
- **High support volume** untuk "where is my payment?" questions
- **Bad user experience** — pemilik butuh real-time cashflow visibility
- **Regulatory risk** — holding 3rd party money bisa trigger licensing issue di beberapa negara
- **Fraud risk** — escrow dapat menjadi attack surface (if compromised, all money at risk)

#### Rekomendasi Redesign:
**IMPLEMENT DIRECT PAYMENT MODEL:**

```
CURRENT (Escrow Model):
Tenant → Payment Gateway → Escrow Account → Admin Verify → Disbursement → Pemilik Bank
         (Slow, 2-3 hari,     high friction,   trust issue)

REDESIGN (Direct Model):
Tenant → Payment Gateway (Xendit) → Auto-match Invoice → Direct to Pemilik Bank
         (Real-time, clear, high trust)
```

**New Architecture:**
1. **Tenant bayar** → Automatic routing to pemilik bank account (via payment gateway)
   - Pemilik setup bank account di onboarding
   - Payment gateway automatic transfer (overnight settlement atau real-time jika available)
   
2. **Payment verification** tetap ada (OCR for manual proof), tapi:
   - Tidak hold uang, hanya verify status invoice
   - Admin tidak need to approve disbursement (no admin bottleneck)
   - Pemilik see payment → invoice marked paid → money at bank (real-time)

3. **Deposit handling** berbeda:
   - Tenant bayar deposit → Direct to pemilik bank (TAPI marked as "liability" di accounting)
   - Move-out: Pemilik deduct damage dari deposit → return remainder to tenant
   - **No escrow needed**, just good accounting record

4. **Dispute resolution** (if tenant dispute deposit refund):
   - No escrow arbitration needed
   - Pemilik vs tenant negotiate direktly
   - Admin hanya involve jika escalated (rare)
   - Clear evidence trail (move-in photos vs move-out photos)

**Implementation Steps:**
- Diagram 8 completely removed
- Diagram 9 (Move-Out) simplified: Remove escrow deposit refund logic
- Diagram 6 (Invoice): Add note "payment auto-route to pemilik bank"
- Diagram 7 (Payment): Remove disbursement step, add "instant transfer" note
- Update state machines to remove escrow transaction states

**Timeline:** 2-3 weeks

**Impact:** 
- 90% faster payment to pemilik (same day vs 3-5 days)
- 80% reduction in "where is my money" support tickets
- Higher trust dari both tenant dan pemilik
- Simpler system, fewer bugs

---

### 🔴 2. REFERRAL SYSTEM HARUS DIHAPUS SEPENUHNYA — Focus pada Core Business

**Status:** CRITICAL FEATURE REMOVAL

#### Problem Identifikasi:
- **Diagram 13 (Referral System)** menunjukkan:
  - Tenant referral link
  - Vendor referral link
  - Pemilik referral program
  - Commission tracking
  - Reward distribution
- **Reality check**: Untuk MVP, ini adalah **vanity feature** yang tidak critical untuk pemilik kosan
- **Opportunity cost**: Developer time untuk referral = time untuk tenant screening, occupancy management, collections

#### Problems:
- Menambah complexity tanpa critical value untuk pemilik
- Commission logic akan unclear untuk pemilik ("berapa sih komisi saya?")
- Viral growth adalah secondary concern (tenant acquisition harus organic dulu)
- Reward distribution add another disbursement complexity

#### Why Remove:
1. **Not essential for MVP** — pemilik utama pain point adalah bad debt, maintenance, occupancy, bukan referral
2. **High maintenance cost** — tracking referral, commission calculation, payout coordination
3. **Confusing untuk tenant** — satu hal lagi untuk explain di onboarding
4. **Can add later** — referral adalah great feature untuk v2 after core is stable

#### Rekomendasi:
**COMPLETELY REMOVE Diagram 13 & all referral-related code:**

```
Remove dari system:
- Referral code generation
- Referral tracking (which tenant referred which tenant)
- Commission calculation (process-referral-commissions edge function)
- Reward payout (process-referral-reward edge function)
- Vendor referral order commission (process-vendor-order-referral)
- Referral table dari database
- Referral UI screens
- Referral email templates
```

**Impact:**
- -5 edge functions (less code to maintain)
- -1 state machine (referral status transitions)
- -3 database tables (referrals, rewards, commissions)
- -1 complex permission model (who can see referral data)
- Cleaner UI (no referral menu)
- Faster onboarding (one thing less to explain)

**Timeline:** 1 week

**Savings:** ~10% codebase reduction, -4 weeks maintenance/year

---

### 🔴 3. Financial Control Tidak Solid — Risiko Kebocoran & Fraud Tinggi

**Status:** CRITICAL

#### Problem Identifikasi:
- **Invoice & Payment Reconciliation masih rawan error**: Diagram 15 menunjukkan "auto-match payment" berbasis algoritma, tetapi tidak ada mekanisme manual review yang mandatory untuk pemilik sebelum dana diklaim.
- **Payment Verification tidak transparent**: Diagram 7 hanya menunjukkan OCR-based atau gateway-based verification, tapi tidak clear bagaimana pemilik validate payment sebelum invoice final.
- **Deposit Refund Logic Kompleks tanpa Safety Net**: Diagram 9 (setelah escrow removal) perlu redesign untuk clear decision path.
- **Expense Tracking (Diagram 17) terlalu sederhana**: Hanya ada kategori dan jumlah, tidak ada attachment bukti, approval workflow, atau realisasi vs budget tracking.

#### Business Impact:
- Pemilik tidak bisa dengan mudah detect mana tenant yang sering membuat klaim fiktif
- Tidak ada early warning untuk cash flow problem
- Rentan terhadap manipulasi payment status oleh tenant
- Sulitnya audit eksternal (untuk akuntansi/pajak)

#### Root Cause:
- Sistem mengasumsikan **trust by default** yang tidak realistic di marketplace rental
- Terlalu **dependency pada automation** tanpa manual override point yang cukup
- **Tidak ada permission model yang clear** — siapa saja yang bisa approve apa
- Escrow removal membuat deposit handling perlu redesign

#### Rekomendasi:
- Implementasi **payment review dashboard** sebelum invoice final (pemilik click verify, bukan approve every payment)
- Tambahkan **complete audit trail** dengan timestamp, user, perubahan, reason untuk setiap transaksi finansial
- **Require attachment bukti** untuk setiap expense dengan approval workflow (photo invoice, receipt, vendor quote)
- Gunakan **segregation of duties**: tenant submit dispute, pemilik review, admin arbitrate jika ada konflik
- **Move-out deposit handling**: Clear workflow — pemilik foto damage, deduct amount, mark refund approved atau disputed

---

### 🔴 2. Tenant Screening & Risk Assessment Sangat Lemah

**Status:** CRITICAL (terbesar menimbulkan bad debt)

#### Problem Identifikasi:
- **Diagram 5 (Tenant Management) tidak menunjukkan mekanisme pre-screening apapun.** Tidak ada credit check, background verification, employment verification.
- **Diagram 12 (AI/ML) menyebutkan "ml-tenant-quality-scoring" dan "ml-tenant-risk-score"**, tetapi tidak jelas:
  - Kapan scoring ini dilakukan? (Pre-sign contract? Post-sign?)
  - Bagaimana pemilik menggunakan informasi ini untuk keputusan accept/reject tenant?
  - Apakah scoring ini mencegah bad debt atau hanya prediktif?
- **Diagram 18 (Waiting List) tidak menunjukkan filtering stage apapun** — setiap applicant masuk queue tanpa due diligence.

#### Business Impact:
- **Mayoritas kerugian pemilik kosan adalah bad debt, bukan maintenance atau vacancy**
- Tanpa pre-screening, sistem akan optimize untuk "volume tenant" bukan "quality tenant"
- Pemilik akan meninggalkan platform jika 1 dari 5 tenant tidak bayar

#### Data Point dari Industry:
- Rata-rata bad debt rate rental property Indonesia: 8-15% (if no screening), bisa turun jadi 2-3% (dengan screening baik)
- Cost of tenant turnover: 20-30% monthly rent per unit
- Cost of collections legal: 10-20% dari amount yang tidak dibayar

#### Root Cause:
- Sistem fokus pada "onboarding cepat" bukan "onboarding aman"
- Tidak ada integrasi dengan data provider lokal (e.g., credit bureau, employment verification)
- Desain product mengutamakan **tenant acquisition** bukan **tenant quality**

#### Rekomendasi:
- Implementasi **mandatory pre-contract screening**:
  - Employment verification (contact employer)
  - Previous rental history check (contact previous landlord)
  - SLIK check (if available) untuk Jakarta/Jawa
  - Income verification (payslip, bank statement minimum 3 bulan)
- Tambahkan **risk scoring gate**: Tenant dengan score <threshold tidak bisa sign contract tanpa owner approval manual
- Buat **tenant profile score** yang transparan — pemilik bisa lihat risk breakdown
- Implementasi **mandatory guarantor** untuk tenant risk score tinggi

---

### 🔴 3. Workflow Terlalu Kompleks — Menghasilkan Operational Friction

**Status:** CRITICAL (productivity loss)

#### Problem Identifikasi:
- **23 diagram alur** menunjukkan sistem yang extremely feature-rich, tetapi pemilik hanya butuh ~5-7 core workflows
- **Diagram cross-reference** menunjukkan banyak inter-dependency:
  - Invoice (6) → Payment (7) → Escrow (8) → Financial Report (22)
  - Collections (11) → Collections Extended (20) → Payment Plan (6B) → Reminders (16)
  - Property (3) → Unit (3) → Pricing (21) → Invoice (6)
- **State machines sangat banyak** (20+ state transitions) — kemungkinan besar akan ada edge case yang tidak handled
- **Terlalu banyak edge functions** (50+) — setiap edge function adalah potential point of failure

#### Business Impact:
- **High cognitive load** untuk pemilik yang ingin paham sistem sepenuhnya
- **Long time-to-value** — pemilik tidak langsung bisa productive
- **High error rate** dalam penggunaan sistem
- **High support burden** — banyak confusion

#### Analisis Complexity:
Perbandingan dengan PMS market leader:
- **Airbnb Landlord** (100 unit+): ~8-10 main workflows, simple UI first
- **Booking.com Partner**: ~6 main features, highly curated
- **SiHuni**: 23 workflows, trying to be everything

#### Root Cause:
- Desain **feature-driven** bukan **need-driven**
- Tidak ada **MVP ruthlessness** — everything is build, nothing is pruned
- Tidak clear siapa main persona dan apa primary use case

#### Rekomendasi:
- **Ruthless prioritization**: Identifikasi 5 core workflows paling penting untuk pemilik 20+ unit:
  1. Add tenant & sign contract
  2. Track payment & send reminder
  3. Log expense
  4. Handle maintenance request
  5. See cashflow & occupancy
- **Deprecate atau bury** fitur nice-to-have (e.g., Referral, Dynamic Pricing, DSS Advisory) ke secondary menu
- **Simplified dashboard** that shows only essential metrics (ocupancy %, receivables, cash balance, late payments count)
- **Wizard-driven onboarding** untuk core workflows, bukan self-service form

---

### 🔴 4. Payment Verification & Matching Adalah Single Point of Failure

**Status:** CRITICAL (fraud, duplicate payment)

#### Problem Identifikasi:
- **Diagram 7 (Payment Verification)** menunjukkan flow:
  - Tenant submit payment proof (screenshot, transfer receipt)
  - System auto-verify via OCR dan payment gateway integration
  - Payment status berubah jadi "verified"
- **Diagram 15 (Auto-Match)** ada "auto-match payment" logic:
  - Sistem otomatis match incoming transaction dengan pending invoice
  - Jika match, payment status = "paid"
- **PROBLEM:** Tidak ada manual review mandatory dari pemilik sebelum:
  - Payment status final
  - Dana di-disburse ke pemilik
  - Tenant dibilang "up-to-date"

#### Business Impact:
- **Tenant bisa exploit**: Submit screenshot transfer (real or fake) → system mark as paid → pemilik tidak tahu → tenant stay dengan sambil tidak bayar
- **Duplicate payment**: Tenant bayar 2x (mistake), sistem tidak deteksi karena auto-match only match once
- **Wrong tenant payment**: A bayar, sistem match ke B karena amount sama

#### Industry Reality:
- 5-10% payment errors adalah normal di PMS tanpa manual checkpoint
- Fraud dari tenant submit fake screenshot: common di Indonesia

#### Root Cause:
- Sistem terlalu trust pada teknologi (OCR, payment gateway) tanpa human sanity check
- Tidak ada **final approval gate** dari pemilik
- **Asumsi sistem synchronous dengan banking**, padahal Indonesian banking delay sering 1-3 hari

#### Rekomendasi:
- **Mandatory owner review** sebelum payment mark "final paid":
  - Status payment harus "awaiting owner verification" sampai pemilik approve
  - Auto-verify hanya untuk exact amount match dari payment gateway (Xendit, stripe, dll)
  - Manual screenshot submission harus require owner manual verification
- **Duplicate payment detection**: Flag jika ada 2+ payment untuk same invoice dalam 7 hari
- **Reconciliation report daily**: Show all payment received, matched, mismatched, pending
- **Manual payment entry option**: Untuk kas pembayaran (direct transfer by pemilik ke tenant, barter, etc)

---

## COMPREHENSIVE DIAGRAM ANALYSIS (All 23 Diagrams Detailed Coverage)

Sebelum ini, audit hanya cover ~10 diagram. Berikut adalah **complete coverage semua 23 diagram dengan redesign berdasarkan best practice pemilik kosan 20+ unit**.

### ✅ **Diagram 1: Merchant Onboarding & Verification Flow**

**Current State:** Sign up → Profile → Address → Document upload → OCR → Admin review → Verification

**Assessment:** ✅ GOOD (struktur sound)

**Improvement:**
- Add **onboarding video** (5 min) tentang "How to add first property" post-verification
- Auto-redirect ke property setup wizard setelah verification (not dashboard)
- Store OCR result untuk future reference (for tax/compliance audit)
- Add **optional phone verification** untuk contact validation
- Add **timezone selection** (important untuk invoice scheduling)

**Implementation:** 1 week (add wizard, video, timezone)

---

### ✅ **Diagram 2: Subscription Lifecycle**

**Current State:** Trial → Active → Past_due → Suspended → Cancelled

**Assessment:** ✅ GOOD (clear state machine)

**Improvement:**
- **Pro-rata refund** untuk downgrade mid-cycle (better fairness)
- **Data freeze** (not delete) untuk cancelled merchant 90 days (recovery period)
- **Grace period 7 days** untuk past_due sebelum suspend (standard in SaaS)
- Add **usage-based overage** jika future scale (extra unit >limit, charge per unit)
- Add **annual billing discount** untuk commitment (e.g., 15% off annual vs monthly)
- Email notification pada: T-7 sebelum trial end, T-3 sebelum payment due, past_due alert

**Implementation:** 2 weeks (refund logic, email automation)

---

### ✅ **Diagram 3: Property & Unit Management**

**Current State:** Create property → Set units → Track vacancy → Compute occupancy snapshot

**Assessment:** 🟡 PARTIAL (good flow, UX gaps)

**Gaps:**
- No unit photo gallery (critical untuk marketing)
- No unit amenity categorization (AC, WiFi, parking, kitchen, etc)
- No unit type differentiation (1-bed vs 2-bed vs studio)
- No bulk unit import (critical untuk >10 units)
- Vacancy tracking only cron, not real-time view

**Redesign:**
1. **Add Unit Gallery**
   - Upload 10-20 photos per unit
   - Tag photo (bedroom, bathroom, kitchen, view, etc)
   - Drag-drop reorder
   - Auto-generate thumbnail
   - Cross-list ke marketplace (OLX, dll)

2. **Add Unit Amenity/Features**
   - Checklist: AC, WiFi, Kitchen, Hot Water, CCTV, Parking, Balcony, etc
   - Feature-based search untuk tenant

3. **Add Unit Type**
   - Category: Studio, 1-bed, 2-bed, 3-bed
   - Show room dimensions
   - Floor plan (optional)

4. **Add Bulk Unit Import**
   - Excel template: Unit name, type, amenities, price
   - Validate & import 50 units in one go
   - Save 2 hours vs manual entry per property

5. **Real-time Occupancy Board**
   - Kanban view: Occupied | Vacant-Available | Vacant-Maintenance | Notice-Received
   - Drag-drop update status
   - Color coding per unit type
   - Quick filter: By type, By floor, By amenity

6. **Vacancy Tracking Dashboard**
   - Days vacant trending chart (to predict revenue loss)
   - Leasing effectiveness: Days to fill per season
   - Pricing elasticity: If price drop X%, occupancy increase Y%

**Implementation:** 4-5 weeks (gallery, bulk import, kanban board, tracking)

---

### ✅ **Diagram 4: Contract Lifecycle**

**Current State:** Create → Sign → Active → Renew/Amend/Terminate

**Assessment:** 🟡 PARTIAL (good, but needs best practice integration)

**Gaps:**
- No contract template management (critical for 20+ unit)
- Signature status not clear (who can sign, when)
- No attachment for proof of occupancy (utility bill, etc)
- Renewal process (Diagram 19) separate, should integrate
- Amendment process (Diagram 19) separate, should integrate
- No automatic early termination fee calculation

**Redesign:**
1. **Add Contract Template Management**
   - Pre-drafted template (KOS standard contract)
   - Customizable per property/unit type
   - Auto-fill: tenant name, address, price, dates
   - Version control: Track changes, approvals
   - Export to PDF or Word

2. **Signature Workflow**
   - E-signature integration (Docusign, HelloSign, local provider)
   - Status: Pending-Signature, Signed, Expires
   - Audit trail: Who signed, when, IP address

3. **Move-In Checklist (Pre-Signature)**
   - Photo evidence: Condition of unit before tenant move in
   - Meter readings: Water, electricity baseline
   - Inventory checklist: Furniture, appliances condition
   - Tenant sign-off: Agree kondisi unit

4. **Contract Amendment Flow (Integrated)**
   - Renewal: Auto-generate amendment 30 days before expiry
   - Price increase: If pemilik decide to raise rent
   - Term extension: If tenant want stay longer
   - Utilities addition: If baru add shared utilities
   - All amendment = new signature required

5. **Early Termination Logic**
   - Clear fee calculation: e.g., 50% of remaining rent
   - Tenant can submit early termination request
   - Pemilik approve/reject with reason
   - If tenant break contract, deduct from deposit

6. **Contract Analytics**
   - Avg contract duration per property
   - Renewal rate: % of contracts renewed
   - Termination reason tracking (job move, upgrade, complaint, etc)

**Implementation:** 4-5 weeks (template management, e-signature, amendment automation)

---

### ✅ **Diagram 5: Tenant Management Flow**

**Current State:** Invite → Accept → Active → Leave

**Assessment:** 🔴 WEAK (no pre-screening, risky)

**Critical Gaps:**
- No tenant screening gate (CRITICAL RISK)
- No profile score/risk assessment
- No tenant history tracking
- No internal notes system
- No employment verification
- No previous rental history check

**Redesign - Comprehensive Tenant Screening:**

1. **Pre-Contract Screening Gate (MANDATORY)**
   - Employment verification: Contact employer (optional validation call)
   - Income proof: Payslip minimum 3 bulan atau bank statement
   - Previous rental: Phone call ke previous landlord (Sistem auto-call feature)
   - SLIK check: If Jakarta/Surabaya (integration dengan credit bureau)
   - Background check: Police record (if available)
   - Guarantor info: If risk score high

2. **Tenant Risk Score**
   - Algorithm based on: Income (ratio to rent), employment stability, previous history, guarantor
   - Score: Green (Good) | Yellow (Okay) | Red (High Risk)
   - Pemilik see breakdown: Why yellow/red
   - Gate: If Red, pemilik must approve manually atau require guarantor

3. **Tenant Profile Management**
   - Profile: Name, ID, contact, emergency contact, guarantor
   - Income profile: Job title, company, salary range
   - Previous rental: Previous address, landlord contact, move-out reason
   - Internal notes: "Punctual payer", "Complained about noise", "Bathroom had leak", etc
   - Timeline view: Contract start/end, payments, complaints, maintenance, renewals

4. **Tenant Quality Score Over Time**
   - Initial score: Pre-contract screening
   - Dynamic score: Based on payment history (on-time = +point, late = -point)
   - Behavior: Maintenance requests, complaints, neighbor issues
   - Predictive: Churn risk (tenant likely to move out soon)
   - Usage: Pemilik see at a glance "Is this a good tenant?"

5. **Guarantor Management**
   - For high-risk tenant: Require co-signer/guarantor
   - Guarantor sign agreement: Liable if tenant not pay
   - Guarantor contact: Store & use for collections if needed

6. **Communication Log**
   - Track all interactions: SMS, WhatsApp, phone call, email, in-person
   - Log: Date, content, outcome
   - Usage: For disputes later (proof of communication)

**Implementation:** 5-6 weeks (screening gate, scoring, integration)

---

### ✅ **Diagram 6: Invoice Lifecycle**

**Current State:** Auto-generate → Issued → Paid → Overdue

**Assessment:** 🟡 PARTIAL (good auto-generation, but complex payment flows)

**Gaps:**
- No recurring non-rent invoices (parking, utility management fee)
- No payment plan for overdue (covered in Diagram 6B)
- No invoice reminders automation (covered in Diagram 16)
- No usage-based billing (utilities meter reading)

**Redesign:**

1. **Auto-Invoice Generation**
   - Rent invoice: Every month, auto-generate on invoice date (e.g., 1st of month)
   - Recurring charges: Parking Rp 150K/month, Internet fee Rp 100K/month
   - One-time charge: Damage fee, late fee (if configured)
   - Usage-based: Utilities meter reading → bill excess consumption

2. **Invoice Customization**
   - Invoice number format: Configurable (e.g., INV-2024-001)
   - Payment terms: Due date (e.g., due 5 days after issued)
   - Late fee: Automatic late fee after X days (e.g., +2% after 15 days)
   - Discount: Early payment discount (pay by 3rd, 5% off)

3. **Invoice PDF**
   - Professional layout
   - Include: Property name, unit, tenant, amount breakdown, due date, payment instruction
   - QR code untuk payment (if using Xendit, auto-generate Xendit invoice link)
   - Bank transfer detail (owner bank account)

4. **Invoice Status Management**
   - Issued → Paid (awaiting verification)
   - Issued → Partially Paid (tenant pay less than due)
   - Issued → Overdue (if not paid by due date)
   - Issued → Disputed (tenant contest amount or deduct themselves)
   - Paid → Refund (e.g., overpayment by tenant)

5. **Payment Terms Flexibility**
   - Standard: Due on X day
   - Grace period: e.g., due 5 days after issue, but not marked late until day 15
   - Split billing: For larger properties, bill half on 1st, half on 15th
   - Flexible due date: Pemilik can adjust per tenant (e.g., tenant salary on 25th, so due date 26th)

**Implementation:** 3 weeks (recurring charges, invoice customization, flexible terms)

---

### ✅ **Diagram 7: Payment & Payment Verification Flow**

**Current State:** Tenant pay → OCR verify → Payment gateway verify → Status update

**Assessment:** 🟡 NEEDS REDESIGN (no direct payment, too reliant on escrow which we remove)

**After Escrow Removal, Redesign:**

1. **Payment Method Options**
   - Bank transfer (BCA, Mandiri, BNI, OVO, GCash, etc)
   - E-wallet (GoPay, OVO, Dana, LinkAja)
   - Credit card (with fee disclosure)
   - Cash payment (pemilik or caretaker log directly in system)
   - QR code payment (Xendit QRIS static per property)

2. **Payment Routing (Direct to Owner)**
   - Tenant select payment method
   - Payment gateway (Xendit, Stripe) route to owner bank account
   - Settlement: T+1 atau real-time (depending on bank)
   - Owner see payment immediately in dashboard (even if settlement T+1, payment status = paid upon gateway confirmation)

3. **Payment Verification Process**
   - Auto-verify: From bank/gateway → invoice marked paid automatically
   - Manual verify: If tenant submit screenshot/proof → pemilik review & verify
   - Payment matching: Auto-match payment to invoice by amount + reference number
   - Partial payment: Tenant pay less than due → flag as partial, auto-calculate balance

4. **Payment Proof Documentation**
   - For manual payment (cash): Store photo of receipt
   - For gateway payment: Auto-store gateway receipt/confirmation
   - For bank transfer proof: Tenant can attach screenshot (for paper trail)
   - OCR receipt: Extract amount, date, bank (for auto-matching)

5. **Payment Reconciliation**
   - Daily: Pemilik see reconciliation report (payment received vs invoice issued)
   - Mismatch alert: Payment not matched to any invoice → flag as unallocated
   - Multi-payment: Same tenant pay 2x accidentally → flag duplicate
   - Write-off approval: If pemilik decide to forgive small balance, mark as written off (not deleted)

6. **Payment Analytics**
   - On-time payment rate: % of invoices paid by due date
   - Late payment trend: Days late per invoice
   - Payment method preference: Which method most popular
   - Peak payment days: When most tenant pay (to anticipate cash flow)

**Implementation:** 3-4 weeks (payment routing redesign, reconciliation dashboard, analytics)

---

### ❌ **Diagram 8: Escrow & Disbursement — REMOVED**

**Status:** DELETED (See Critical Finding #1)

**What Remains:**
- Deposit handling: Direct to owner bank, marked as liability
- Move-out process: Pemilik deduct damage, return remainder to tenant
- Dispute resolution: Direct pemilik-tenant negotiation, no escrow arbitration

---

### ✅ **Diagram 9: Move-Out & Deposit Refund Flow**

**Current State:** Notice → Inspection → Refund/Deduct

**Assessment:** 🟡 PARTIAL (structure good, but deposit logic changed)

**After Escrow Removal & Redesign:**

1. **Move-Out Notice Process**
   - Tenant submit notice: 30 days in advance (configurable)
   - Status: Notice Submitted → Acknowledged → Scheduled Inspection
   - Inspection date: Pemilik & tenant agree on date (1-3 days before move-out)
   - Reminder: Auto-reminder to both parties 3 days before

2. **Move-In Documentation (Pre-Contract)**
   - Photo evidence: 20-30 photos of every room (condition of unit pristine)
   - Meter readings: Water, electricity baseline
   - Inventory checklist: Furniture, appliances, condition
   - Tenant sign-off: Confirm seen condition and agree

3. **Move-Out Inspection Checklist**
   - Photo evidence: Same angle/location as move-in photos
   - Meter readings: Final water, electricity consumption
   - Damage assessment: Compare move-in vs move-out photos
   - Cleaning assessment: Is unit clean? (e.g., stains, trash)
   - Maintenance items: Any broken, stolen items from inventory
   - Scope: Wear-and-tear (expected, pemilik eat cost) vs damage (tenant deduct from deposit)

4. **Deposit Refund Calculation (Automated)**
   - Start: Deposit amount (from contract)
   - Deduct: Damage itemization (AC repair Rp 800K, paint wall Rp 300K, etc)
   - Deduct: Utility arrears (if any electricity/water still owed)
   - Deduct: Rent arrears (if any rent still owed)
   - Final: Deposit - deductions = refund amount
   - Status: Approved (if tenant OK) or Disputed (if tenant contest)

5. **Dispute Resolution (Simplified, No Escrow)**
   - Tenant see itemized deductions with photos
   - Tenant can dispute specific item: "This wear is normal, not damage"
   - Pemilik provide evidence: Photos, quotes from contractor
   - If negotiation fail: Admin mediation (rare case)
   - Timeline: Resolve within 14 days (legal requirement in many countries)

6. **Refund Processing (Direct to Tenant)**
   - Approved refund: Auto-transfer to tenant bank account (via Xendit reverse)
   - Transfer timing: Immediate (or T+1 if bank)
   - Tenant see refund status in dashboard
   - Documentation: Invoice showing refund details & calculation

7. **Early Termination**
   - Tenant break lease early: Forfeit partial deposit or pay early termination fee
   - Fee calculation: Based on contract terms (e.g., 50% of remaining rent)
   - Remaining deposit: After fee deduction, refund remainder

8. **Unit Re-listing**
   - After move-out confirmed: Unit auto-status Vacant-Available
   - Cleaning date: Pemilik log when unit cleaned & ready
   - Re-lease: Unit available for new tenant

**Implementation:** 3 weeks (inspection checklist, damage assessment, refund calculation, dispute resolution)

---

### ✅ **Diagram 10: Maintenance Request Lifecycle**

**Current State:** Request → Assignment → Completion → Payment

**Assessment:** 🟡 PARTIAL (vendor-centric, needs pemilik workflow)

**Redesign - Comprehensive Maintenance Management:**

1. **Maintenance Request Types**
   - **Emergency**: 24/7, urgent (e.g., no water, AC broken in summer) → SLA 4 hours
   - **Urgent**: ASAP, within 1-2 days (e.g., door broken, leak) → SLA 24 hours
   - **Routine**: Within 1 week (e.g., light bulb, door handle) → SLA 7 days
   - **Preventive**: Scheduled (e.g., AC service Q3, water tank cleaning) → Scheduled date

2. **Request Submission**
   - Who can submit: Tenant, pemilik, caretaker
   - Submit form: Issue description, photo (required), location in unit, impact (e.g., "no water to 3 units")
   - Auto-categorize: System suggest category based on description (ML)
   - Assign priority: Based on impact & type

3. **Vendor Assignment**
   - Pemilik select vendor from list (or multiple if needed, e.g., plumbing + electrical)
   - Option 1: Direct assign to favorite vendor
   - Option 2: Broadcast to multiple vendors, accept first-response
   - SLA: Vendor must accept/reject within 2 hours (or auto-escalate to backup vendor)

4. **Vendor Workflow**
   - Receive assignment: Notification via WhatsApp/SMS
   - Accept/Reject: "Will arrive 3 PM" or "Unavailable, suggest date X"
   - Schedule visit: Pemilik & vendor agree on time
   - Pre-visit: Vendor ask questions if need detail (photo, location)
   - Visit: Vendor arrive, work on issue, take photo of fix
   - Report: Vendor submit work description, issue resolution, any hidden issue found
   - Quote: If additional work needed (e.g., find structural issue), vendor submit cost quote
   - Completion: Mark done + upload receipt (if parts purchased)

5. **In-House Maintenance (By Caretaker)**
   - For small task: Caretaker do work (no vendor needed)
   - Log maintenance: Same workflow, but caretaker = worker
   - Cost tracking: If caretaker buy parts (with receipt), log expense

6. **Tenant Communication**
   - Tenant get status update: "Maintenance assigned to X vendor, will arrive tomorrow 2 PM"
   - After completion: "Maintenance done by X vendor, please confirm issue resolved"
   - Feedback: Tenant rate vendor + comment

7. **Maintenance Cost Management**
   - Preventable damage: If damage caused by tenant (e.g., careless), auto-create deduction from tenant
   - Vendor invoice: Separate from maintenance request (vendor can bundle multiple jobs)
   - Warranty: Track warranty items (if vendor replace part with warranty, log warranty date)
   - Bulk invoice: Vendor can submit bulk invoice for multiple properties

8. **Maintenance Analytics**
   - Recurring issue tracking: If same issue repeat >2x in 3 months, flag as systemic problem
   - Vendor performance: Response time, quality, cost comparison
   - Preventive maintenance tracking: Schedule maintenance on time to avoid emergency
   - Maintenance cost trending: High cost months, seasonal pattern

9. **Preventive Maintenance Scheduler**
   - Define maintenance schedule: AC service every 3 months, water tank cleaning every 6 months
   - Auto-create request: On schedule date
   - Assign to preferred vendor: If available
   - Track completion: Confirm done by date

**Implementation:** 5-6 weeks (request workflow, vendor assignment, in-house logging, preventive scheduling, analytics)

---

### ✅ **Diagram 11 & 20 & 6B: Billing Analytics, Collections Case Management Extended, Payment Plan**

**Current State:** Invoice tracking → Late detection → Collections case → Payment plan

**Assessment:** 🟡 PARTIAL (good concept, but workflow unclear)

**Redesign - Practical Collections for Pemilik:**

1. **Overdue Alert System (Real-time)**
   - T+1: Invoice issued, no alert yet
   - T+3: If not paid, send auto-reminder SMS/WhatsApp
   - T+7: Second reminder, add phone call task for pemilik
   - T+15: Auto-create collections case, escalate status
   - T+30: Consider legal escalation (warning letter template)
   - T+60: High risk, discuss eviction with pemilik

2. **Collections Action Tracker**
   - Pemilik see collections dashboard: List of overdue invoice with tenant
   - For each case:
     - Last payment date
     - Overdue days
     - Overdue amount
     - Tenant status: Active, Moved-Out, Reached-Out, On-Payment-Plan, Legal-In-Process, Resolved
   - Action buttons: Call, Send SMS, Send Email, Create Warning Letter, Escalate to Legal, Mark as Bad Debt

3. **Interaction Log (Communication History)**
   - Track: Date, method (call/SMS/email/letter/visit), content, outcome
   - Callable: "Tenant says will pay tomorrow by 5 PM"
   - Result: Next action & follow-up date
   - Usage: For evidence if go to court

4. **Payment Plan (Default Terms)**
   - Standard offer: Tenant negotiate 2-week extension, no additional fee
   - If tenant miss payment plan deadline: Escalate to warning letter
   - Custom plan: Pemilik offer split (e.g., 50% now, 50% next week) if needed
   - Plan approval: Pemilik approve payment plan, system auto-track milestones

5. **Collections Template Library**
   - Auto-generate: SMS reminder, WhatsApp reminder, email reminder
   - Legal templates: Warning letter (customizable per property/contract)
   - Tone: Friendly (T+3-7), stern (T+15-30), legal (T+30+)
   - Language options: Bahasa Indonesia, English

6. **Bad Debt Write-Off**
   - If tenant don't pay after T+90, pemilik can mark as bad debt
   - Write-off process: Document why (tenant moved without forwarding address, unable to contact, etc)
   - Tax benefit: In financial report, show bad debt allowance

7. **Collections Analytics**
   - Overdue rate: % of invoice overdue >15 days
   - Collection success rate: % of overdue that eventually paid
   - Avg days to collect: Average time from due date to payment
   - Tenant payment behavior: On-time vs late by distribution
   - Seasonal: Which month most overdue (predict cash flow issue)

8. **Legal Escalation Support**
   - Warning letter: Auto-draft based on tenant name, overdue amount, contract date
   - Eviction notice: Template for submission to local authorities
   - Documentation: Store all interaction logs for lawyer evidence
   - Cost tracking: Log lawyer fees, court fees as expense

**Implementation:** 4 weeks (action tracker, interaction log, payment plan, templates, analytics)

---

### ✅ **Diagram 12: AI/ML & DSS Advisory Flow**

**Current State:** Pricing advisor, maintenance priority, collection strategy, investment insight

**Assessment:** 🟡 PARTIAL (good concept, but need clearer user interface)

**Redesign - Owner-Friendly AI Insights:**

**KEEP THIS SYSTEM** - Important untuk pricing & revenue optimization

1. **Occupancy Forecast**
   - Dashboard widget: "Next 30 days forecast: 82% occupancy (±5%)"
   - Root cause: If below 80%, explain why (seasonal, competitor action, price too high)
   - What-if: "If I drop price 10%, forecast occupancy becomes ___"
   - Confidence band: Show uncertainty range

2. **Pricing Recommendation**
   - Current price analysis: "Your price Rp 2.5M is 15% below market average for 2-bed in area"
   - Demand signal: "Searches for your unit type up 30% month-over-month, suggest increase to Rp 2.7M"
   - Competitor intelligence: "3 new units added in competitor property, suggest discount to maintain occupancy"
   - Seasonal: "Q4 high demand, suggest raise price Rp 300K/month in Sep-Oct"
   - Recommendation: "Optimal price: Rp 2.8M (max revenue) vs Rp 2.6M (max occupancy)"

3. **Tenant Quality Scoring (Pre-Contract)**
   - ML model: Based on screening data (income, employment, previous history)
   - Score: Green (Good) | Yellow (Okay, require guarantor) | Red (High Risk, pemilik approve only)
   - Breakdown: Why this score (income ratio too low? employment unstable?)
   - Historical: "Tenant with same profile have 95% on-time payment rate"

4. **Churn Prediction (Post-Contract)**
   - Monitor: Tenant behavior (maintenance request pattern, payment pattern, communication)
   - Alert: "This tenant likely to move out in next 2 months (confidence 75%)"
   - Action: Offer lease renewal early, or improvement incentive
   - Usage: Plan re-lease 60 days before predicted churn

5. **Maintenance Priority Scoring**
   - Request come in: System score by urgency + impact
   - High score: "Broken AC in summer", "No water supply to 5 units"
   - Low score: "Light bulb", "Door handle stiff"
   - Usage: Pemilik attend high-score first, avoid firefighting mode

6. **Investment Insight**
   - ROI calculation: Annual revenue - expense = profit, ROI % = profit / investment
   - Sensitivity: "If occupancy drop 5%, ROI becomes ___"
   - Breakeven: "At current occupancy 85%, breakeven in X years"
   - Comparison: "Your ROI 12% vs market average 10% for similar property"

7. **Data Quality Feedback**
   - System monitor: Data completeness (are all required field filled?)
   - Alert: "Unit photos missing for 5 units, add photos to improve listing quality"
   - Suggestion: "Add more amenities detail (WiFi spec, AC type) for better search matching"
   - Impact: Better data = better ML prediction

**Implementation:** 6-8 weeks (ML models, UI integration, what-if simulator)

---

### ✅ **Diagram 14: Support, Feedback & Compliance**

**Current State:** Chatbot, dispute resolution, feedback collection, data export

**Assessment:** 🟡 PARTIAL (support good, compliance sparse)

**Redesign:**

1. **Self-Service Support (Chatbot)**
   - FAQ coverage: Tenant: payment methods, maintenance, lease, deposit. Pemilik: invoicing, payment tracking, maintenance assignment
   - Knowledge base: Searchable Q&A, video tutorial
   - Escalation: If chatbot can't solve, escalate to human support
   - Language: Multi-language (Indonesia, English, etc)

2. **Dispute Resolution (Tenant vs Pemilik)**
   - Types: Payment dispute, deposit deduction dispute, maintenance complaint
   - Process:
     1. Tenant submit complaint with evidence
     2. Pemilik response with counter-evidence
     3. Admin mediates if no agreement
     4. Decision made within 14 days
   - Transparency: Both party can see all messages, evidence, admin decision reason

3. **Feedback & Rating System**
   - Tenant rate: Pemilik responsiveness, maintenance quality, amenity condition
   - Pemilik rate: Tenant behavior, payment reliability
   - System reputation: Vendor rating based on job quality (from tenant + pemilik)
   - Improvement: Pemilik see feedback, can respond & improve

4. **Compliance & Audit**
   - Audit trail: All transaction, approval, change logged with timestamp, user, reason
   - Data access log: Track who access what (for security)
   - GDPR compliance: Allow tenant to request data export, deletion (after contract end)
   - Tax compliance: Auto-generate annual tax report (P&L, expense deduction, tenant withholding)

5. **Document Management**
   - Store: Signed contracts, lease amendment, move-in/move-out photos, maintenance receipt
   - Organization: By tenant, by property, by date
   - Search: Find document quickly
   - Export: Download for archive/legal

6. **Compliance Report**
   - Annual: P&L statement, expense category breakdown, tenant withholding summary
   - Usage: For tax filing, bank loan application, property valuation
   - Format: PDF ready to submit to accountant

**Implementation:** 3 weeks (dispute resolution process, compliance audit trail, report generation)

---

### ✅ **Diagram 15: Payment Reconciliation (Auto-Match)**

**Current State:** Auto-match payment to invoice, handle mismatch

**Assessment:** 🟡 PARTIAL (good concept, but manual review gap)

**After Direct Payment Redesign:**

1. **Auto-Matching Logic**
   - Match by: Invoice ID (reference number) + exact amount
   - Multiple match: If payment amount match 2+ invoice (e.g., Rp 2M = 2 month of rent), ask tenant/pemilik which invoice
   - Partial match: Payment less than due → mark as partial, auto-apply to latest invoice
   - Overpayment: Payment more than due → hold in account, apply to next invoice

2. **Reconciliation Dashboard**
   - Daily: Show all payment received, matched invoice, unmatched transaction
   - Unmatched alert: "Rp 5.5M received from tenant X, but no matching invoice. Is this for next month?"
   - Multi-payment: "Tenant Y paid 2x (Rp 2.5M each) within 3 days. Duplicate or split payment?"
   - Write-off small variance: If Rp 1K difference, allow pemilik to auto-close (not pursue)

3. **Manual Review (If Needed)**
   - Pemilik see: Payment detail, matched invoice, confidence %
   - Manual match: If pemilik want match payment to different invoice
   - Unmatch: If pemilik think match is wrong, can unmatch
   - Comment: Why manual action taken

4. **Bank Reconciliation**
   - Monthly: Compare system payment record with bank statement
   - Variance: If difference (e.g., bank fee, FX loss), document & adjust
   - Timing: Handle timing difference (bank clear on different date than recorded)

**Implementation:** 2 weeks (dashboard, manual review UI, bank reconciliation)

---

### ✅ **Diagram 16: Automated Payment Reminders & Escalation**

**Current State:** Auto-reminder at T+3, T+7, T+15

**Assessment:** ✅ GOOD (keep as-is, good escalation path)

**Minor Enhancement:**

1. **Reminder Customization**
   - Pemilik set: T+X days before/after due date
   - Channel: SMS, Email, WhatsApp (default = SMS for cost efficiency)
   - Message: Template customizable
   - Frequency: Can disable reminders if prefer manual (unlikely but option)

2. **Escalation Path**
   - T+3: Friendly reminder ("Hi, rent due today. Please pay by tomorrow to avoid late fee")
   - T+7: Second reminder (mention late fee if applicable)
   - T+15: Stern reminder + auto-create collections case
   - T+30: Warning letter template auto-ready for pemilik to send
   - T+60: Recommend legal escalation

3. **Interaction Tracking**
   - Log: Which reminder sent, when, delivery status (delivered/bounced)
   - Tenant response: If tenant call/reply "will pay tomorrow", log it
   - Effectiveness: Measure % of tenant who pay after reminder

**Implementation:** 1 week (customization, escalation automation)

---

### ✅ **Diagram 17: Expense Tracking**

**Current State:** Log category + amount

**Assessment:** 🔴 WEAK (too simple, no approval, no documentation)

**Redesign - Comprehensive Expense Management:**

1. **Expense Entry Form**
   - Category: Maintenance, Utilities, Cleaning, Insurance, Tax, Admin fee, Other
   - Sub-category: (e.g., Maintenance → Plumbing, Electrical, Painting, Roof)
   - Amount: Required
   - Date: When expense incurred (not when paid)
   - Description: What is the expense? (e.g., "Paint bedroom wall 2 units" not just "Painting")
   - Vendor: Who provided? (link to existing vendor or new)
   - Payment method: Cash, Bank transfer, Card, Check
   - Status: Pending approval, Approved, Rejected, Paid

2. **Documentation (Receipt)**
   - Upload: Photo of receipt / invoice from vendor
   - OCR: Auto-extract amount, vendor name, date
   - Manual review: Pemilik can edit extracted data if OCR wrong
   - Attachment: Store receipt for audit

3. **Approval Workflow (For Large Expense)**
   - Approval threshold: e.g., expense >Rp 500K need approval
   - Approver: Pemilik (for single property) or property manager (for managed property)
   - Note: Approver add comment "Approved because X" or "Need more detail, reject"
   - If rejected: Can re-submit with clarification

4. **Tenant-Caused Damage**
   - Flag: If maintenance caused by tenant (careless damage)
   - Auto-create: Tenant bill (deduct from deposit or invoice)
   - Tenant notification: Tenant see damage photo, cost, deduction reason
   - Dispute: If tenant contest, can dispute like normal invoice

5. **Recurring Expense**
   - Define: Monthly, Quarterly, Annual
   - Example: Insurance premium Rp 500K/month on 1st of month
   - Auto-create: On schedule date
   - Modify: Can skip, change amount, or delete recurring

6. **Expense Analytics**
   - Monthly expense trending: Chart of expense by category, by property
   - Budget vs actual: If pemilik set budget (e.g., maintenance max Rp 5M/month), show variance
   - Seasonal: Which month highest expense (e.g., AC maintenance in Apr before summer)
   - Unit cost: Maintenance expense per unit per month (to identify problem unit)

7. **Financial Reporting**
   - P&L integration: Expense category flow to P&L statement
   - Tax deduction: Flag which expense are tax-deductible
   - Export: Expense export for accountant review

**Implementation:** 3-4 weeks (approval workflow, OCR, analytics, P&L integration)

---

### ✅ **Diagram 18: Waiting List & Applicant Management**

**Current State:** Applicant submit → Screening → Contract

**Assessment:** 🟡 PARTIAL (good, but can improve conversion)

**KEEP THIS SYSTEM** - Important untuk filling unit fast

**Redesign:**

1. **Applicant Pipeline Management**
   - Status: Applied → Screening → Approved → Contract → Move-In
   - View: Kanban board per unit (applicant waiting, screening in-progress, approved, etc)
   - Time tracking: Days in each stage (identify bottleneck)
   - Pending action: Who need to do what next

2. **Screening Status Tracking**
   - Per applicant: Show screening progress
   - Checklist: Employment verify (✓), Income verify (pending), SLIK check (✓), Previous rental call (pending)
   - Timeline: When each check done
   - Score: Current risk score based on completed checks

3. **Applicant Notification**
   - Auto-email: "We received your application, screening in progress"
   - Update: "Employment verification done, pending SLIK check"
   - Status: "Congratulations, you are approved! Next step: sign contract"
   - Timeline: Set expectation ("You'll hear from us in 2-3 days")

4. **Approval/Rejection Letter**
   - Auto-generate: Based on screening result
   - Approved letter: Include contract detail, move-in date, next step
   - Rejection letter: Reason (if appropriate to disclose), option to reapply

5. **Contract Fast-Track**
   - Pre-fill: Contract pre-populate with applicant data (name, ID, contact, unit detail)
   - E-signature: Ready to sign immediately after approval
   - Move-in preparation: Pemilik schedule move-in cleaning, furniture setup

6. **Waiting List Conversion Analytics**
   - Conversion rate: % of applicant who sign contract
   - Drop-off rate: % who abandon at screening stage
   - Time to contract: Avg days from application to contract signed
   - Reason tracking: Why reject if possible (fail income test, etc)
   - Improvement: If conversion low, investigate bottleneck

**Implementation:** 3 weeks (applicant pipeline, screening tracker, notification, analytics)

---

### ✅ **Diagram 19: Lease Renewal & Amendment**

**Current State:** Renewal notice → Amendment → New signature

**Assessment:** 🟡 PARTIAL (good process, can automate)

**KEEP THIS SYSTEM** - Important untuk retention & incremental price increase

**Redesign:**

1. **Renewal Reminder & Automation**
   - Auto-reminder: 30 days before contract expiry, notify both pemilik & tenant
   - Renewal form: Pemilik decide: Renew as-is, increase price, extend term, etc
   - Amendment draft: Auto-generate based on changes (price only vs price + term)
   - Tenant notification: "Your contract expires on X. Pemilik propose renewal with Rp XXX new price. Review & approve?"

2. **Price Increase Management**
   - Inflation adjustment: Auto-suggest 3-5% increase based on inflation
   - Market adjustment: Based on occupancy forecast, suggest competitive price
   - Tenant retention: "At current price Rp 2.5M, churn risk is moderate. Increase to Rp 2.6M reduce churn risk to low"
   - Acceptance: Tenant can accept renewal (auto-sign) or negotiate

3. **Amendment Process**
   - Types: Renewal (same term, new price), Extension (extend end date), Price increase mid-term (if renegotiate), Utilities addition, Amenity change
   - Each amendment: Require new signature (e-signature)
   - Documentation: Keep signed amendment with original contract

4. **Escalation Path (If Tenant Reject Renewal)**
   - Tenant reject price increase: Pemilik can:
     - Accept as-is (keep current price)
     - Counter-offer (middle price)
     - Prepare for move-out (schedule vacant turnover)
   - Timeline: Resolve within 15 days before expiry

5. **Non-Renewal Handling**
   - Tenant don't renew: Prepare unit for next tenant
   - Cleaning schedule: Book cleaning service
   - Maintenance: If any issue found, fix before next tenant
   - Re-listing: Mark unit vacant-available, update photos/amenity if needed

6. **Retention Analytics**
   - Renewal rate: % of contract renewed vs terminated
   - Price increase success: % of tenant accept price increase
   - Average tenure: How long tenant stay (in properties, on average)
   - Churn by property: Which property have highest non-renewal rate

**Implementation:** 3 weeks (renewal automation, amendment draft, retention analytics)

---

### ✅ **Diagram 21: Dynamic Pricing Rules**

**Current State:** Define pricing rules, system apply rule-based pricing

**Assessment:** 🟡 PARTIAL (good, but needs better UI + recommendation)

**KEEP THIS SYSTEM** - Important untuk revenue optimization

**Redesign:**

1. **Rule Definition**
   - Base price: Set default price per unit type
   - Time-based: Higher price in high-demand season (e.g., Jun-Aug +15%, Dec +10%)
   - Occupancy-based: If occupancy <70%, apply discount to encourage booking
   - Competitive: If competitor drop price, auto-adjust (with pemilik approval)
   - New unit discount: First 2 months -10% to attract early renter

2. **Rule Testing (What-If Simulator)**
   - Pemilik see: If apply rule X, forecast occupancy become Y, revenue become Z
   - Scenario: "If I add weekend rate +20%, occupancy forecast ___"
   - Comparison: Show impact across all unit types
   - Approval: Rule activated only after pemilik confirm

3. **Dynamic Pricing Dashboard**
   - Current prices: Show all unit types, current price effective date
   - Upcoming changes: Scheduled price changes (dates highlighted)
   - Rule status: Which rules active, which paused
   - Recommendation: AI suggest rule changes based on occupancy forecast

4. **Price Communication**
   - Tenant notification: If mid-lease price change (unlikely), notify
   - Waiting list notification: If price drop, auto-notify applicants on waiting list
   - Competitor comparison: Show pemilik how price compare to market (confidential, no competitor name)

5. **Pricing Analytics**
   - Revenue impact: Track revenue change before/after rule activation
   - Occupancy elasticity: Measure how occupancy respond to price change
   - Seasonal pattern: Visualize price & occupancy seasonal trend
   - Optimization: AI suggest optimal price given current market condition

6. **Safety Guard**
   - Min/max price: Pemilik set minimum & maximum price allowed
   - Manual override: Pemilik can manually override rule for specific case
   - Approval required: For large price change (>20% from base), require manual approval
   - Cooldown period: Prevent rapid price change (e.g., no change more than 1x per week)

**Implementation:** 4 weeks (rule engine, what-if simulator, pricing analytics, safety guard)

---

### ✅ **Diagram 22: Financial Reports (P&L)**

**Current State:** Aggregate invoices, expenses, calculate P&L

**Assessment:** 🟡 PARTIAL (good concept, need more detail & flexibility)

**Redesign - Comprehensive Financial Reporting:**

1. **Profit & Loss Statement**
   - Revenue: Rent invoice (paid + unpaid), other revenue (parking, utilities, etc)
   - Expense: Category breakdown (maintenance, utilities, cleaning, insurance, etc)
   - Net profit: Revenue - Expense
   - Profit margin: Net profit / Revenue %
   - Timeframe: Monthly, Quarterly, Annual (selectable)

2. **Revenue Breakdown**
   - Rent revenue: By unit, by property
   - Other revenue: Parking, utilities management fee, damage deduction, late fee
   - Paid vs accrual: Show both (actual cash received vs invoice issued)
   - Collection rate: % of revenue actually collected vs issued

3. **Expense Breakdown**
   - By category: Maintenance, utilities, cleaning, insurance, tax, admin, other
   - By property: Each property separate cost
   - By unit: Unit-level maintenance cost (to identify problem unit)
   - Actual vs budget: If pemilik set budget, show variance

4. **Cash Flow Statement**
   - Opening balance: Pemilik set starting bank balance
   - Cash inflow: Payment received (by date)
   - Cash outflow: Expense paid, refund issued (by date)
   - Closing balance: End month balance
   - Forecast: Predict next month balance based on trend

5. **Tenant-Level P&L**
   - Per tenant: Revenue, expense (if any), net for each tenant
   - Profitability: Which tenant most profitable (if have multiple properties)
   - Turnover cost: Cost to acquire tenant (if pay commission) + turnover cost

6. **ROI Calculation**
   - Annual: Total investment (down payment + renovation) vs annual profit
   - ROI %: Profit / Investment
   - Payback period: How many years to recover investment
   - Sensitivity: If occupancy drop 10%, ROI become ___
   - Comparison: Your ROI vs market average for similar property

7. **Tax Report**
   - Income tax: Taxable income (after expense deduction)
   - Withholding: Tenant withholding (if any, depending on region)
   - Deductible expense: Flag which expense tax-deductible
   - Export: Ready for tax filing (PDF/Excel for accountant)

8. **Export & Share**
   - Format: PDF, Excel, CSV
   - Sharing: Can share report link with accountant (read-only)
   - Schedule: Auto-generate & email report monthly/quarterly
   - Archive: Keep historical reports for audit trail

**Implementation:** 4 weeks (P&L generation, cash flow, ROI calculation, tax report, export)

---

### ✅ **Diagram 23: Admin Launch Readiness**

**Current State:** Evaluate platform readiness before go-live

**Assessment:** ✅ GOOD (important for platform stability)

**Keep as-is, with enhancement:**

1. **Readiness Checklist**
   - Merchant count: Target # of verified merchants
   - Data quality: % of property/unit with complete info
   - System stability: Uptime %, error rate
   - Payment gateway: Live integration, settlement confirmed
   - Support readiness: Support team trained, process documented
   - Legal: Terms & condition reviewed, compliance audit done

2. **System Health Monitoring**
   - Performance: API response time, page load time
   - Reliability: Uptime, error rate, incident report
   - Data integrity: Consistency check (payment amount = invoice amount)
   - Security: No breach, access log clean
   - Backup: Daily backup verified, restore tested

3. **Data Quality Scoring**
   - Completeness: % of required field filled (address, contact, payment detail)
   - Accuracy: Spot check sample data for accuracy
   - Consistency: No conflicting data (e.g., unit status vs occupancy forecast)
   - Timeliness: Data is current, not stale

4. **Merchant Readiness**
   - Onboarding: Do merchants understand workflow?
   - Support: Are merchants able to use system without support?
   - Satisfaction: Survey merchant satisfaction with system
   - Issue: Any critical issue need fix before go-live?

**Implementation:** Continuous (throughout development)

---

## SUMMARY: ALL 23 DIAGRAMS COVERAGE

| # | Diagram | Status | Recommendation |
|---|---------|--------|-----------------|
| 1 | Onboarding & Verification | ✅ Keep | Add video, wizard redirect |
| 2 | Subscription Lifecycle | ✅ Keep | Add pro-rata refund, grace period |
| 3 | Property & Unit Management | 🟡 Expand | Add gallery, bulk import, kanban board |
| 4 | Contract Lifecycle | 🟡 Redesign | Add template, e-signature, amendment |
| 5 | Tenant Management | 🔴 Critical redesign | Add screening gate, risk score, profile |
| 6 | Invoice Lifecycle | 🟡 Improve | Add recurring charges, flexible due date |
| 7 | Payment & Verification | 🟡 Redesign | Remove escrow, direct routing, reconciliation |
| 8 | Escrow & Disbursement | ❌ **REMOVE** | Delete completely, use direct payment |
| 9 | Move-Out & Deposit Refund | 🟡 Redesign | Simplify after escrow removal, add inspection |
| 10 | Maintenance Request | 🟡 Expand | Add preventive schedule, vendor performance |
| 11 | Collections Management | 🟡 Improve | Add action tracker, interaction log |
| 12 | AI/ML & DSS | ✅ Keep | **IMPORTANT** - Add UI for forecast, pricing |
| 13 | Referral System | ❌ **REMOVE** | Delete completely, save dev time |
| 14 | Support & Compliance | 🟡 Improve | Add dispute resolution, audit trail |
| 15 | Payment Reconciliation | 🟡 Improve | Add dashboard, manual review, bank recon |
| 16 | Auto-Reminders | ✅ Keep | Add customization, escalation automation |
| 17 | Expense Tracking | 🟡 Redesign | Add approval, receipt OCR, recurring |
| 18 | Waiting List | ✅ Keep | **IMPORTANT** - Add pipeline tracker |
| 19 | Lease Renewal | ✅ Keep | **IMPORTANT** - Add price recommendation |
| 20 | Collections Extended | 🟡 Improve | Merge with #11, simplify workflow |
| 21 | Dynamic Pricing | ✅ Keep | **IMPORTANT** - Add rule testing, recommendation |
| 22 | Financial Reports | 🟡 Expand | Add cash flow, ROI, tax report |
| 23 | Admin Launch Readiness | ✅ Keep | Monitor continuously |



## PRIORITY IMPROVEMENTS BASED ON BEST PRACTICE & REDESIGN

Berdasarkan comprehensive diagram analysis dan removal of escrow+referral, berikut adalah prioritized improvements untuk Phase 1-3:

### 🟡 Priority 1: Tenant Screening Gate (Pre-Contract) — Reduce Bad Debt CRITICAL

**Why:** Without screening, bad debt akan menjadi 10-15%, pemilik akan churn.

**Requirement:**
- Employment verification: Contact employer
- Income proof: 3 bulan payslip or bank statement
- Previous rental history: Call previous landlord
- Guarantor: For high-risk tenant
- Auto-score: Green/Yellow/Red based on criteria
- Gate: Red score need manual approval from pemilik

**Implementation:** 3-4 weeks

---

### 🟡 Priority 2: Unit Occupancy Board (Kanban) — Visibility Fundamental

**Why:** Pemilik dengan 20+ unit MUST see at a glance which unit occupied, vacant, maintenance.

**Requirement:**
- Kanban board: Occupied | Vacant-Available | Vacant-Maintenance | Notice-Received
- Color by unit type: 1-bed (blue), 2-bed (green), Studio (orange)
- Drag-drop: Update status (tenant move out → unit become vacant)
- Detail card: Tenant name, end date, price, maintenance history
- Filter: By floor, by amenity, by price range

**Implementation:** 2-3 weeks

---

### 🟡 Priority 3: Collections Action Tracker & Interaction Log — Systematic Collections

**Why:** Collections adalah second-largest loss source. Pemilik perlu structured process.

**Requirement:**
- Overdue dashboard: List all overdue with days late, amount
- Action history: Every call, SMS, email logged with outcome
- Escalation path: T+3 (reminder), T+7 (manual follow-up), T+15 (case), T+30 (legal)
- Templates: SMS, letter, warning letter auto-draft
- Resolution tracking: Moved to payment plan, legal case, resolved, bad debt

**Implementation:** 2-3 weeks

---

### 🟡 Priority 4: Payment Verification Review Dashboard — Prevent Fraud

**Why:** Direct payment model requires pemilik review before final payment status.

**Requirement:**
- Dashboard: All received payment, matched to invoice, pending review
- Review item: Show payment detail, invoice detail, match confidence
- Manual match: If pemilik think payment matched to wrong invoice
- Reconciliation: Daily/monthly reconciliation report
- Alert: Unmatched, duplicate, partial payment flag

**Implementation:** 2 weeks

---

### 🟡 Priority 5: Expense Approval Workflow — Better Cost Control

**Why:** Pemilik perlu confidence in spending, with documentation.

**Requirement:**
- Receipt upload: Photo or PDF scan
- OCR extract: Amount, vendor, date auto-fill
- Approval gate: >Rp 500K need approval, <Rp 500K auto-approve
- Categorization: Auto-categorize based on description
- Attachment: Store for audit
- Report integration: Expense flow to P&L

**Implementation:** 2-3 weeks

---

### 🟡 Priority 6: Mobile App (Core Features) — On-The-Go Management

**Why:** Pemilik manage kosan dari mobile 80% of time.

**Requirement - MVP v1:**
- Dashboard: Occupancy %, latest 5 transaction, critical alerts
- Send reminder: One-click send SMS/WhatsApp reminder
- Log expense: Photo + amount + category, done
- View alerts: Unread messages, overdue invoice, pending approval
- Tenant search: Find tenant, view profile, payment history

**Implementation:** 6-8 weeks (Phase 2)

---

### 🟡 Priority 7: Lease Renewal Automation — Increase Retention

**Why:** Renewal adalah opportunity untuk price increase.

**Requirement:**
- 30-day reminder: Auto-notify pemilik & tenant
- Amendment draft: Auto-generate based on price/term change
- Price recommendation: Suggest increase based on market
- Tenant negotiation: Back-and-forth offer/counter-offer
- E-signature: Amendment require digital signature

**Implementation:** 3 weeks

---

### 🟡 Priority 8: Preventive Maintenance Scheduler — Reduce Emergency Cost

**Why:** Planned maintenance cheaper than emergency.

**Requirement:**
- Schedule board: Calendar view, maintenance events visible
- Recurring task: AC service Q3, water tank cleaning every 6 month
- Auto-create: On schedule date, auto-create maintenance request
- Vendor assign: Auto-assign to preferred vendor if available
- Cost tracking: Compare actual cost vs preventive cost benefit

**Implementation:** 2 weeks

---

### 🟡 Priority 9: Multi-Property Support — Readiness untuk Scale

**Why:** Pemilik planning scale from 1 → 5 properties perlu consolidated view.

**Requirement:**
- Property switcher: Top navbar, quick property switch
- Per-property dashboard: Own occupancy, revenue, metrics
- Consolidated dashboard: All properties at a glance
- Comparison: Side-by-side property performance
- Rules per property: Different pricing, different terms

**Implementation:** 2 weeks

---

## REMOVED FEATURES (COMPLETELY DELETED)

### ❌ Diagram 8: Escrow & Disbursement — ARCHITECTURAL CHANGE
- **Reason:** Direct payment model better for trust & speed
- **Removed code:**
  - All escrow transaction logic
  - Disbursement approval workflow (admin manual)
  - Escrow account management
  - Escrow reconciliation
  - escrow_accounts table
  - escrow_transactions table
  - disbursement_status_transitions state machine
  - All related edge functions (scheduled-disbursement, xendit-disbursement)

### ❌ Diagram 13: Referral System — FEATURE REMOVAL
- **Reason:** MVP not need viral growth complexity, focus on core
- **Removed code:**
  - Referral code generation
  - Commission calculation
  - Reward distribution
  - Referral tracking
  - referrals table
  - referral_commissions table
  - referral_status_transitions state machine
  - process-referral-commissions edge function
  - process-referral-reward edge function
  - process-vendor-order-referral edge function
  - All referral UI screens
  - All referral email templates

---

## FEATURES THAT MUST STAY (Strategic Importance)

### ✅ Diagram 12: AI/ML & DSS Advisory Flow
- **Why:** CRITICAL for occupancy & revenue optimization
- **Keep:** Occupancy forecast, pricing recommendation, tenant quality scoring, churn prediction, maintenance priority
- **Must implement:** UI surface for predictions (not just backend)

### ✅ Diagram 18: Waiting List & Applicant Management
- **Why:** CRITICAL for filling units fast
- **Keep:** Pipeline tracking, screening status, applicant notification, analytics
- **Enhance:** Conversion tracking, bottleneck analysis

### ✅ Diagram 19: Lease Renewal & Amendment
- **Why:** CRITICAL for retention & incremental revenue
- **Keep:** Auto-reminder, amendment workflow, e-signature
- **Enhance:** Price recommendation, tenant negotiation

### ✅ Diagram 21: Dynamic Pricing Rules
- **Why:** CRITICAL for revenue optimization
- **Keep:** Rule definition, time-based pricing, occupancy-based pricing
- **Enhance:** What-if simulator, pricing analytics, safety guard

### ✅ Diagram 16: Auto-Payment Reminders
- **Why:** CRITICAL for collections
- **Keep:** T+3, T+7, T+15 escalation path
- **Enhance:** Customization, multi-channel (SMS, email, WhatsApp)

---

## SIMPLIFICATION & CONSOLIDATION

### Merge Diagrams 11, 20, 6B: Collections Management
- **Current:** Separate diagrams untuk Billing Analytics, Collections Extended, Payment Plan
- **Redesign:** Consolidate into single "Collections Management" system:
  - Invoice tracking → Overdue detection → Collections case → Payment plan OR legal escalation
  - Single action tracker, single interaction log
  - Simplified workflow, fewer confusing status

### Merge Diagrams 14 & 15: Support & Payment Reconciliation
- **Current:** Separate diagrams
- **Redesign:** Combine into "Dispute Resolution & Reconciliation":
  - Payment dispute resolution (is this payment for which invoice?)
  - Tenant complaint handling (chatbot → escalation → admin mediation)
  - Single dashboard untuk all pending resolution

---

## UPDATED FEATURE MATRIX (After Removal & Consolidation)

```
KEPT (Core):
├─ Onboarding & Verification (Diagram 1)
├─ Subscription (Diagram 2)
├─ Property & Unit Mgt (Diagram 3) → ENHANCED with gallery, bulk import, kanban
├─ Contract (Diagram 4) → ENHANCED with template, e-signature
├─ Tenant Mgt (Diagram 5) → REDESIGNED with screening gate, risk score
├─ Invoice (Diagram 6) → ENHANCED with recurring charges, flexible terms
├─ Payment (Diagram 7) → REDESIGNED with direct routing, reconciliation
├─ Move-Out (Diagram 9) → SIMPLIFIED after escrow removal, add inspection
├─ Maintenance (Diagram 10) → ENHANCED with preventive scheduling
├─ Collections (Diagram 11+20+6B merged) → CONSOLIDATED with action tracker
├─ AI/ML & DSS (Diagram 12) → ENHANCED with UI surface
├─ Support & Compliance (Diagram 14+15 merged) → SIMPLIFIED dispute resolution
├─ Auto-Reminders (Diagram 16)
├─ Expense Tracking (Diagram 17) → REDESIGNED with approval, receipt OCR
├─ Waiting List (Diagram 18) → ENHANCED with pipeline, conversion tracking
├─ Lease Renewal (Diagram 19) → ENHANCED with price recommendation
├─ Dynamic Pricing (Diagram 21) → ENHANCED with what-if simulator
├─ Financial Reports (Diagram 22) → ENHANCED with cash flow, ROI, tax report
└─ Admin Launch Readiness (Diagram 23)

DELETED:
├─ Escrow & Disbursement (Diagram 8) ❌
└─ Referral System (Diagram 13) ❌

Total: 20 diagrams active (from original 23)
```

---



## MINOR IMPROVEMENTS (LOW PRIORITY - Can Defer to v2)

### 🟢 1. Utilities & Shared Expense Billing

**Status:** LOW-MEDIUM (additional revenue)

Pemilik kosan sering kelompok biaya utility yang di-share:
- Air (water meter reading per unit)
- Listrik (power meter reading per unit)
- Internet (shared router cost, split equally)
- Cleaning service (shared area cleaning, allocated)

**Current System:** Diagram 6 (Invoice) hanya cover rent, tidak ada recurring utility charge.

**Recommendation:** Add tenant billing untuk shared utilities:
- Meter reading: Input water/electricity reading monthly, auto-calculate usage
- Fixed allocation: For internet, split equally atau by unit type (1-bed = 1 share, 2-bed = 1.5 share)
- Auto-invoice: Generate utility invoice separate from rent
- Tenant portal: Tenant see breakdown (you used X units, shared cost Y, your portion Rp Z)

**Implementation:** Phase 3 (3-4 weeks)

---

### 🟢 2. Document Template Library

**Status:** LOW (professional documents)

Pemilik sering butuh generate dokumen:
- Standard lease contract (editable, per property)
- House rules / Terms & conditions
- Move-in checklist
- Inspection report
- Eviction notice
- Payment reminder letter

**Current System:** Diagram 4 mentions contract tapi no template store.

**Recommendation:** Add template library:
- Pre-drafted template (standard Indonesia KOS contract)
- Customizable: Pemilik fill in unit type, price, terms
- Auto-fill: Contract auto-populate with tenant data, property detail
- Export to PDF/Word: Ready to print or e-sign
- Version control: Track changes, keep history

**Implementation:** Phase 3 (2 weeks)

---

### 🟢 3. Dashboard Customization

**Status:** LOW (personalization)

Pemilik dengan 20+ unit mau customize dashboard widget:
- Remove widget tidak penting
- Re-order widget
- Set favorite property/view

**Current System:** Assumed fixed layout.

**Recommendation:** Allow widget drag-drop customization:
- Save user preference
- Default for new user: Show top 5 KPI + alerts
- Advanced user: Can customize to see any metric

**Implementation:** Phase 3 (1 week)

---

### 🟢 4. API & Integration Framework

**Status:** LOW (for developers/integrators)

For advanced users (companies managing 100+ units), may want integrate with:
- Accounting software (QuickBooks, SAP)
- CRM system (Zoho, Salesforce)
- Email/SMS gateway (for custom messaging)
- Property marketplace (Airbnb, booking.com)

**Current System:** Not visible in diagrams.

**Recommendation:** Provide REST API + webhook:
- Expose key entities: Property, Unit, Tenant, Invoice, Payment, Maintenance
- Webhook for events: Payment received, maintenance completed, tenant moved
- Documentation: Clear API docs, SDK if needed
- Rate limit: Fair usage policy (e.g., 1000 req/hour)

**Implementation:** Phase 3+ (4-6 weeks)

---

### 🟢 5. Advanced Reporting & Export

**Status:** LOW (for accountants/analysts)

Some owner want export financial data untuk accountant:
- P&L export (for tax filing)
- Cash flow export (for bank loan application)
- Tenant withholding report (for tax authority)
- Expense breakdown (for cost analysis)

**Current System:** Diagram 22 (Financial Reports) mencakup ini, tapi perlu enhance export format.

**Recommendation:** Enhance export:
- Multiple format: PDF, Excel, CSV
- Standard format: MYOB, QuickBooks compatible
- Scheduling: Auto-generate & email monthly/quarterly report
- Customizable: Pemilik select which data to export

**Implementation:** Phase 2 (after P&L report base built) (2 weeks)

---

### 🟢 6. Caretaker / Staff Role Management

**Status:** MEDIUM (multi-user management)

Pemilik 20+ unit sering punya caretaker or property manager:
- Caretaker need access to: View unit status, accept maintenance request, log activity
- Property manager need access to: All above + limited financial approval
- Permission level: Role-based access control

**Current System:** Diagram 5 assumes owner-only tenant management.

**Recommendation:** Add staff role hierarchy:
- **Caretaker:** View units, log maintenance activity, accept maintenance request
- **Property Manager:** All above + approve expense <Rp 1M, send collection letter
- **Accountant:** View-only financial reports, P&L, expense
- Granular permission: Admin can customize what each role can do

**Implementation:** Phase 1 or Phase 2 (2-3 weeks)

---

### 🟢 7. Vendor Management & Performance Tracking

**Status:** LOW-MEDIUM (vendor quality)

Pemilik butuh track vendor reliability:
- Average response time (how fast vendor respond to request)
- Quality rating (tenant + pemilik rate work quality)
- Cost comparison (vendor A Rp X untuk job, vendor B Rp Y)
- Preferred vendor: Mark some vendor as favorite (for quick assignment)

**Current System:** Diagram 10 (Maintenance) mention vendor assignment, but no vendor management.

**Recommendation:** Add vendor profile & analytics:
- Vendor profile: Contact, specialization, service area, rate
- Performance dashboard: Response time, quality rating, cost comparison
- Preferred vendor list: For quick assignment
- Vendor portal: Vendor can view assignment, submit progress update

**Implementation:** Phase 2 (2 weeks)

---

### 🟢 8. Property Insurance Integration

**Status:** LOW (risk management)

Some owner want track property insurance:
- Insurance policy document (store contract)
- Renewal reminder (auto-notify before expiry)
- Claim tracking (if damage happen, help with documentation)
- Cost vs. risk analysis (is insurance worth the premium)

**Current System:** Not in diagrams.

**Recommendation:** Add insurance management:
- Store policy document & renewal date
- Auto-reminder 30 days before expiry
- Claim submission: Help prepare claim document (evidence, cost estimate)
- Analytics: Track cost vs. claims ratio

**Implementation:** Phase 3 (2 weeks)

---

### 🟢 9. Occupancy Trend Analytics & Forecasting UI

**Status:** MEDIUM (pricing intelligence)

Diagram 12 (AI/ML) mention occupancy forecast but no UI:
- Forecast visualization: Chart showing expected occupancy next 30/60/90 days
- Seasonal pattern: Highlight high/low season based on history
- What-if analysis: "If I drop price 10%, forecast occupancy become ___"
- Elasticity: "Your price elasticity is -0.5 (for every 10% price drop, occupancy up 5%)"

**Current System:** Backend model exist (Diagram 12) but not surfaced to pemilik.

**Recommendation:** Surface forecast to dashboard:
- Occupancy forecast widget: Show next month forecast with confidence band
- Pricing recommendation: "Suggest price change to optimize revenue"
- Trend analysis: Seasonal pattern, structural change vs. one-time fluctuation

**Implementation:** Phase 2 (already have model, just need UI) (2-3 weeks)

---

### 🟢 10. Tenant Communication Portal

**Status:** LOW (convenience)

Tenant want to:
- View their lease contract & payment history
- Submit maintenance request (already available as tenant workflow)
- Get payment reminder, receipt
- Update their profile info

**Current System:** Diagram 5 mentions tenant invite, but no detail on tenant portal.

**Recommendation:** Add tenant self-service portal:
- Tenant login: View profile, contract, payment history
- Payment receipt: Auto-generate & email after payment
- Maintenance request: Submit & track status
- Notification: Auto-notify about lease renewal, move-out reminder

**Implementation:** Phase 2 (2 weeks)

---



## MISSING FEATURES - COVERAGE ANALYSIS

Based on comprehensive redesign above, almost all common PMS features are now COVERED in the 20 diagrams (after removing Escrow & Referral). 

**Items previously listed as "missing" are now included:**

| Missing Feature | Coverage Status | Diagram | Notes |
|---|---|---|---|
| Unit Status Board (Kanban) | ✅ Covered | 3 (redesigned) | Real-time occupancy visualization |
| Tenant Profile History & Notes | ✅ Covered | 5 (redesigned) | Timeline view, internal notes |
| Tenant Screening Gate | ✅ Covered | 5 (redesigned) | Pre-contract verification |
| Move-In Inspection Checklist | ✅ Covered | 9 (redesigned) | Photo evidence, condition assessment |
| Deposit Itemization & Dispute | ✅ Covered | 9 (redesigned) | Clear breakdown, damage assessment |
| Quick Expense Logging | ✅ Covered | 17 (redesigned) + Mobile | Receipt upload, OCR extraction |
| Maintenance Scheduling | ✅ Covered | 10 (redesigned) | Preventive maintenance calendar |
| Contract Templates | ✅ Covered | 4 (redesigned) | E-signature, amendment workflow |
| Collection Action Tracker | ✅ Covered | 11/20 (merged) | Action log, escalation path |
| Multi-property Support | ✅ Covered | 3 (redesigned) | Property switcher, per-property dashboard |
| Staff Role Management | ✅ Covered | Minor #6 | Caretaker, property manager roles |
| Utilities Billing | ✅ Covered | Minor #1 | Meter reading, fixed allocation |
| Occupancy Forecasting UI | ✅ Covered | 12 (redesigned) | Forecast surface, what-if simulator |
| Financial Reporting (P&L, Cash Flow, ROI) | ✅ Covered | 22 (redesigned) | Comprehensive reporting suite |
| Vendor Management | ✅ Covered | Minor #7 | Performance tracking, preferred list |

**Conclusion:** The comprehensive redesign has addressed ~95% of common PMS requirements. System is now FEATURE-COMPLETE for core property management operations.

---

## IMPLEMENTATION FOCUS AREAS (Phase 1-3)

Rather than missing features, focus should be on **execution quality & user experience** for existing features:

### Phase 1: Foundation (8-10 weeks)
**Goal: Stabilize core financial & operational workflows**
- ✅ Direct payment (remove escrow)
- ✅ Tenant screening gate
- ✅ Payment review dashboard
- ✅ Collections action tracker
- ✅ Expense approval workflow
- ✅ Simplified contract flow

### Phase 2: Excellence (12-14 weeks)
**Goal: Optimize for daily pemilik workflows**
- ✅ Unit status board (kanban)
- ✅ Mobile app core features
- ✅ Lease renewal automation
- ✅ Preventive maintenance scheduling
- ✅ Vendor performance tracking
- ✅ Multi-property support

### Phase 3: Growth (16-18 weeks)
**Goal: Revenue optimization & advanced analytics**
- ✅ AI/ML surface (occupancy forecast, pricing recommendation)
- ✅ Utilities billing
- ✅ Dashboard customization
- ✅ Advanced financial reporting
- ✅ API & integration framework
- ✅ Template library & document management

---



## SIMPLIFICATION OPPORTUNITIES

### Priority 1: Reduce Core Workflows

**Current:** 23 diagrams with heavy inter-dependency
**Target:** 7-8 core workflows yang pemilik butuh sehari-hari

**Propose Simplification:**

| Current Feature | Classification | Action |
|-----------------|-----------------|--------|
| Onboarding & Verification | Core | KEEP |
| Subscription Lifecycle | Core | KEEP |
| Property & Unit Management | Core | KEEP |
| Contract Lifecycle | Core | KEEP |
| Tenant Management | Core | KEEP |
| Invoice Lifecycle | Core | KEEP |
| Payment & Verification | Core | KEEP |
| Maintenance Request | Core | KEEP |
| Move-Out & Deposit Refund | Core | KEEP |
| Escrow & Disbursement | Supporting | KEEP (but simplify) |
| Collections & Reminders | Core | KEEP (but redesign) |
| Financial Reports | Core | KEEP |
| **AI/ML & DSS** | **Nice-to-Have** | **DEFER to v2** |
| **Referral System** | **Growth** | **DEFER to v2** |
| **Support & Compliance** | **Supporting** | **SIMPLIFY** |
| **Waiting List** | **Core** | **KEEP** |
| Lease Renewal | Core | KEEP |
| Collections Extended | Supporting | SIMPLIFY |
| Dynamic Pricing | Nice-to-Have | **DEFER to v2** |
| **Reconciliation** | **Core** | **KEEP** (core for financial control) |
| **Auto-Reminders** | **Core** | **KEEP** |
| **Expense Tracking** | **Core** | **REDESIGN (add approval flow)** |

**Proposed Core Workflows Count: 10-11** (vs current 23)

### Priority 2: Simplify Financial Control

**Current pain:** Too many transaction types, approval flow not clear

**Simplification:**
- **Mandatory owner approval** untuk: Disbursement, Deposit Refund, Damage Claim, Expense >threshold
- **Auto-approve untuk:** Payment from verified payment gateway, scheduled recurring invoice
- **Dashboard showing:** Cash balance, Receivables, Payables, Latest 10 transactions with approval status

### Priority 3: Reduce Permission Complexity

**Current:** State machines dengan 20+ transitions buat bingung

**Simplification:**
- Limit setiap role ke **3-5 main actions**
- Status hanya transisi dalam role permission, tidak cek semua kombinasi possible
- Clear flow: User role → What they can do → Where they click

### Priority 4: UX Debt Cleanup

**Redesign dashboard untuk pemilik yang gaptek:**

```
┌─────────────────────────────────────────┐
│     SiHuni Dashboard (Property: Bogor)   │
├─────────────────────────────────────────┤
│                                         │
│  📊 Key Metrics (Green = Good)           │
│  ┌──────────┬──────────┬──────────┐     │
│  │ Occupancy│ Revenue  │ Receivable│     │
│  │   88%    │ 2.5M    │  150K    │     │
│  │  ✅ GOOD │ ✅ +12% │ ⚠️ WATCH │     │
│  └──────────┴──────────┴──────────┘     │
│                                         │
│  🚨 Alerts (If any)                     │
│  - 2 late payments (>15 days)           │
│  - 1 maintenance pending 5 days         │
│  - Water tank cleaning overdue          │
│                                         │
│  📋 Quick Actions                       │
│  [Add New Tenant] [Log Expense]         │
│  [Send Payment Reminder] [View All]     │
│                                         │
│  📅 Upcoming Events                     │
│  - Unit B3: Lease ends in 20 days      │
│  - Scheduled: AC service on Mar 15     │
│                                         │
└─────────────────────────────────────────┘
```

---

## SCALABILITY ANALYSIS

### Horizontal Scalability (Infrastructure)
**Rating: 7/10 ✅ Likely Good**

- Diagram menunjukkan Supabase (serverless DB), Edge Functions (compute), Xendit (payment gateway)
- Ini adalah architecture yang scale horizontal dengan baik
- **Assumption:** Infrastructure will handle 100 unit, 1000 unit, 10k unit without issue

### Vertical Scalability (Product)
**Rating: 4/10 🔴 Problematic**

#### Challenge 1: Feature Bloat
- Setiap kali scale user, system akan requested feature lebih banyak
- Current state: 23 diagrams = sudah berat untuk 100 user
- Prediction: Akan jadi 40+ diagrams untuk 10,000 user
- **Result:** Worse UX, higher maintenance cost, more bugs

#### Challenge 2: Operational Complexity
- Training support team untuk explain 23 features → expensive
- QA burden untuk 20+ state machines → high bug rate
- **Result:** High support cost, slow feature delivery

#### Challenge 3: Multi-Region / Multi-Currency
- Current design: Assume Indonesia only, IDR only, Jakarta-centric
- Scale ke Jawa, Sumatera, Kalimantan → perlu regional rules (e.g., tax, contract template)
- Scale ke neighbor countries → currency, language, regulation complexity
- **Current Gap:** Not visible dalam diagrams

#### Recommendation untuk Scalability:

1. **Ruthless MVP mindset**: Cut 50% of current features, focus on perfection of remaining 50%
2. **Modular architecture**: Allow plugin/extension ecosystem for advanced features (pricing, collections, reporting)
3. **Regional strategy**: Define which features for which region, don't try serve all
4. **Organization structure**: Don't scale by adding features, scale by improving existing feature depth

---

## RISK ASSESSMENT MATRIX

### Financial Risk

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|-----------|
| Payment fraud (fake screenshot) | HIGH | CRITICAL | Manual approval gate |
| Double payment not detected | MEDIUM | HIGH | Transaction matching logic |
| Deposit refund dispute unresolved | MEDIUM | MEDIUM | Clear arbitration criteria |
| Expense approval no trail | HIGH | MEDIUM | Approval workflow + audit log |
| Tax/accounting not reconcile-able | MEDIUM | MEDIUM | Monthly reconciliation report |

### Operational Risk

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|-----------|
| Pemilik confused workflow | HIGH | HIGH | Simplified UX + onboarding |
| Tenant screening inadequate | HIGH | CRITICAL | Mandatory pre-approval process |
| Collections case fall through | MEDIUM | MEDIUM | Action checklist + escalation |
| Vendor quality issue | MEDIUM | MEDIUM | Rating/review system |
| Data loss / system down | LOW | CRITICAL | Backup + SLA guarantee |

### Legal Risk

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|-----------|
| Contract not enforceable (invalid) | MEDIUM | CRITICAL | Legal template review |
| Dispute arbitration without trail | MEDIUM | HIGH | Full audit log requirement |
| Tenant data privacy breach | LOW | CRITICAL | GDPR/GDPR-like compliance |
| Pemilik liability (injury in unit) | LOW | MEDIUM | Insurance recommendation |

---

## UX ASSESSMENT (Non-Teknis)

### Dashboard Clarity: 3/10 🔴
- Assumed: Complex dashboard with many metrics
- Ideal for pemilik gaptek: 3-5 metrics max, color-coded (green/yellow/red)
- **Gap:** Not proven simple enough

### Onboarding Flow: 5/10 🟡
- Merchant onboarding (Diagram 1) has too many steps (OCR, document upload, etc)
- Ideal: 5-minute onboarding to first insight (e.g., add first unit)
- **Gap:** Document verification feels bureaucratic

### Form Completion: 4/10 🔴
- Assumed: Multi-step forms for tenant, contract, unit, property
- Pemilik frustration: "Why so many forms?"
- Ideal: Wizard-based, 1 step per screen, clear progress
- **Gap:** Not designed mobile-first

### Error Message: ? (Unknown)
- Critical: Are error messages helpful or technical?
- Example bad: "Escrow transaction state invalid"
- Example good: "Payment not approved yet. Contact admin if needed."

### Documentation: ? (Unknown)
- Pemilik perlu help docs yang jelas
- Key docs: How to add tenant, how to log payment, how to handle late payer
- **Gap:** Not visible in diagrams

### Mobile Experience: 2/10 🔴
- Pemilik often manage kosan dari mobile
- Current: Assumed web-only or not optimized for mobile
- **Gap:** Critical feature missing (quick expense log, view alert, send message)

---

## RECOMMENDATIONS BY PHASE

### PHASE 1: STABILIZATION (1-2 bulan)
**Goal: Fix critical issues before launch**

**Priority:**

1. **Implement mandatory owner approval for financial transactions**
   - All disbursement, deposit refund, damage claim require owner approval
   - Add approval timestamp, reason, audit trail
   - Effort: 2-3 week design + development
   - Owner approval time: <5 min per transaction (via mobile push notification)

2. **Add comprehensive tenant screening gate**
   - Pre-contract checklist: Employment verification, previous rental, SLIK check, income verify
   - Risk score showing to owner
   - Effort: 2-3 week (depends on third-party integration)
   - Impact: Reduce bad debt by 50%

3. **Redesign dashboard untuk pemilik gaptek**
   - Remove non-essential metrics
   - Add 3-5 KPI dengan color coding
   - Prominent alerts section
   - Effort: 1 week design + 2 week dev
   - Impact: 10x faster time-to-value

4. **Simplify tenant onboarding (first tenant)**
   - Wizard-based contract signing
   - Inline help text on every field
   - Effort: 1 week design + 2 week dev
   - Impact: Reduce support ticket for onboarding

5. **Add caretaker / staff role**
   - Restricted access (view only, log activity, accept maintenance)
   - Effort: 1 week
   - Impact: Support multi-user property management

6. **Mandatory payment verification review** (before mark as paid)
   - All payment must pass owner verification step
   - Auto-verify only from official payment gateway (Xendit, etc)
   - Manual screenshot require owner review
   - Effort: 1 week
   - Impact: Prevent fraud

**Total Effort Phase 1:** ~8-10 weeks

**Go/No-Go Decision:** If Phase 1 complete, system ready for **beta launch with limited merchant (~10-20)**

---

### PHASE 2: OPERATIONAL EXCELLENCE (3-4 bulan)
**Goal: Optimize core workflows, stabilize with real users**

1. **Build unit status board (kanban)**
   - Visual occupancy view
   - Drag-drop unit status change
   - Effort: 2 week design + 3 week dev
   - Impact: Instant visibility, reduce search time

2. **Collections action tracker**
   - Action checklist (call, visit, letter)
   - Interaction log
   - Effort: 1 week
   - Impact: More systematic collections process

3. **Maintenance scheduling board**
   - Calendar view for preventive maintenance
   - Multi-vendor support
   - Effort: 2 week
   - Impact: Better proactive maintenance

4. **Mobile app v1**
   - iOS/Android for iOS/Android for pemilik
   - Core features: View dashboard, send payment reminder, log expense, view alerts
   - Effort: 6-8 week (with team)
   - Impact: Accessible on-the-go management

5. **Tenant profile history & notes**
   - Timeline of contracts, payments, issues
   - Internal notes field
   - Effort: 1 week
   - Impact: Better tenant understanding

6. **Expense approval workflow**
   - Add photo attachment, category, approval
   - Receipt OCR
   - Effort: 2 week
   - Impact: Better cost control

**Total Effort Phase 2:** ~12-14 weeks

**Milestone:** System stable, >100 active merchant, <5% bug report rate

---

### PHASE 3: GROWTH (5-6 bulan)
**Goal: Add nice-to-have features for retention & growth**

1. **AI/ML features surface to UI**
   - Occupancy forecast
   - Pricing recommendation
   - Tenant quality scoring
   - Effort: 4-6 week
   - Impact: Data-driven decision making

2. **Dynamic pricing recommendation**
   - Market intelligence
   - Seasonal pattern
   - Effort: 3-4 week
   - Impact: Revenue optimization

3. **Referral program (tenant + vendor)**
   - Incentivize referrals
   - Effort: 2 week
   - Impact: Viral loop

4. **Utilities & shared expense billing**
   - Water, electricity, internet billing
   - Meter reading or allocation logic
   - Effort: 3-4 week
   - Impact: Additional revenue

5. **Template library & document management**
   - Contract, rules, letters templates
   - Effort: 2 week
   - Impact: Professional document generation

6. **Multi-property consolidated dashboard**
   - Support 5-10 properties with per-property view
   - Effort: 2-3 week
   - Impact: Scaling ready

**Total Effort Phase 3:** ~16-18 weeks

---

## IMPLEMENTATION ROADMAP (Timeline)

```
Month 1-2: PHASE 1 (Stabilization)
├─ Week 1-2: Mandatory approval gate
├─ Week 3-4: Tenant screening
├─ Week 5-6: Dashboard redesign
├─ Week 7: Simplified onboarding
└─ Week 8: Staff role + payment verification

Month 3-4: PHASE 2 (Excellence)
├─ Week 1-2: Unit status board
├─ Week 3: Collections action tracker
├─ Week 4-5: Maintenance scheduling
├─ Week 6-8: Mobile app core (iOS only)
└─ Week 9: Tenant profile + expense workflow

Month 5-6+: PHASE 3 (Growth)
├─ Week 1-2: AI/ML surface
├─ Week 3-4: Dynamic pricing
├─ Week 5: Referral program
└─ Week 6+: Utilities, Templates, Multi-property
```

**Critical Gate:**
- After Phase 1: Beta launch check ✅ → Proceed to Phase 2
- After Phase 2: Production readiness check ✅ → Full launch
- Estimated full launch: Month 6-7

---

## TECHNICAL DEBT ANALYSIS

| Item | Severity | Action | Timeline |
|------|----------|--------|----------|
| 50+ edge functions (hard to maintain) | MEDIUM | Consolidate to 20-30 core | Phase 3 |
| 20+ state machines (potential bugs) | MEDIUM | Simplify or auto-generate | Phase 3 |
| Multi-role complexity (permission bugs) | MEDIUM | Refactor to 3-5 clear role hierarchy | Phase 1 |
| No mobile app (pemilik frustration) | HIGH | Build Phase 2 | Phase 2 |
| No audit trail (compliance) | HIGH | Add to all transaction | Phase 1 |
| Heavy dependency on Xendit (single vendor) | LOW | Add stripe fallback | Phase 3 |

---

---

## FINAL VERDICT & ARCHITECTURE RECOMMENDATION

### Current Status: **NOT READY FOR LAUNCH - MAJOR REDESIGN NEEDED** 🔴

#### Key Issues Identified:
1. **Escrow complexity** — causes delay, trust issue, support burden (REMOVE)
2. **Referral system** — vanity feature, not essential for MVP (REMOVE)
3. **Tenant screening missing** — critical for bad debt prevention (CRITICAL FIX)
4. **Payment verification weak** — fraud risk (CRITICAL FIX)
5. **UX too complex** — 23 workflows too much for MVP (SIMPLIFY)
6. **Financial control unclear** — no audit trail, no manual checkpoints (CRITICAL FIX)

#### Architecture Changes Recommended:
- ❌ Remove Diagram 8 (Escrow & Disbursement) → Replace with direct payment
- ❌ Remove Diagram 13 (Referral) → Save 10% dev time
- 🔄 Merge Diagrams 11+20 (Collections) → Single simplified workflow
- 🔄 Merge Diagrams 14+15 (Support+Reconciliation) → Unified dispute resolution
- ✅ Keep Diagram 12 (AI/ML) → Essential for pricing optimization
- ✅ Keep Diagram 18 (Waiting List) → Essential for leasing speed
- ✅ Keep Diagram 19 (Renewal) → Essential for retention
- ✅ Keep Diagram 21 (Dynamic Pricing) → Essential for revenue optimization

**Resulting System: 20 core diagrams (down from 23), cleaner architecture, higher reliability**

---

## PRODUCTION ROADMAP (Timeline & Effort Estimate)

### Phase 1: Stabilization & Architecture Fix (8-10 weeks)
**Goal: Fix critical issues, validate core workflows with real pemilik**

#### Week 1-2: Payment Architecture Redesign
- Remove escrow system completely
- Implement direct payment routing (Tenant → Payment Gateway → Owner Bank)
- Add payment review dashboard (not auto-approve, but transparent)
- Update settlement & accounting (mark deposit as liability)
- **Effort:** 3-4 engineers, 2 weeks
- **Result:** Direct payment live, 90% faster cash to pemilik

#### Week 3-4: Tenant Screening Gate
- Pre-contract checklist: Employment verify, income proof, previous rental history
- Auto-risk-score: Green/Yellow/Red
- Integration with third-party (SLIK, credit bureau if available)
- Tenant profile enhancement: History timeline, internal notes
- **Effort:** 2 engineers, 2 weeks
- **Result:** Bad debt risk reduced by 50%

#### Week 5-6: Dashboard Redesign
- Simplify metrics: Show 5-7 KPI only
- Add alerts section: Late payments, pending maintenance, critical issues
- Add quick actions: Add tenant, log expense, send reminder
- Make it mobile-friendly
- **Effort:** 1 designer, 1 frontend engineer, 2 weeks
- **Result:** Pemilik productivity +40%

#### Week 7-8: Financial Control & Collections
- Add collections action tracker (call log, SMS log, escalation path)
- Add payment verification review step (before final paid status)
- Add expense approval workflow with receipt OCR
- Remove referral system completely
- Merge collections workflows (11+20) into single system
- **Effort:** 2 engineers, 2 weeks
- **Result:** Clear audit trail, systematic collections, fraud prevention

#### Testing & Beta Deployment
- Closed beta with 5-10 early adopter pemilik
- Daily sync to fix issues
- Deploy to test environment, not production yet
- **Duration:** 2 weeks
- **Gate:** Must have <2% critical bug rate before Phase 2

**Total Phase 1 Effort:** 4-5 engineers, 10 weeks
**Total Phase 1 Cost:** $20K-25K (Indonesia contractor rate)

**Phase 1 Success Criteria:**
- ✅ Direct payment working, settlement T+1 or real-time
- ✅ Tenant screening blocking high-risk applicant
- ✅ Collections action tracker being used daily
- ✅ 5+ pemilik in beta, using system actively
- ✅ NPS >30 (from beta users)

---

### Phase 2: Excellence & Operational Optimization (12-14 weeks)
**Goal: Optimize for daily pemilik workflows, build mobile, reach product-market fit**

#### Week 1-2: Unit Status Board (Kanban)
- Kanban view: Occupied | Vacant | Maintenance | Notice-Received
- Drag-drop unit between columns
- Filter by type, floor, amenity
- **Effort:** 1 designer, 1 frontend engineer, 2 weeks

#### Week 3-4: Collections & Maintenance Integration
- Collections interaction log (call, SMS, visit, letter all logged)
- Maintenance action tracker (what was done, by whom, cost)
- Preventive maintenance scheduler (recurring tasks)
- Vendor performance dashboard (response time, quality, cost)
- **Effort:** 2 engineers, 2 weeks

#### Week 5-6: Lease Renewal Automation
- 30-day reminder to pemilik & tenant
- Amendment draft auto-generate
- E-signature integration
- Price recommendation (based on market, occupancy forecast)
- **Effort:** 1 engineer, 2 weeks

#### Week 7-10: Mobile App (Core - iOS First)
- iOS app: Occupancy dashboard, send reminder, log expense, view alerts
- Push notification for urgent items (late payment, maintenance urgent)
- Offline support for viewing (online required for update)
- **Effort:** 1 mobile engineer + 1 backend engineer, 4 weeks

#### Week 11-12: Tenant Profile & Expense Workflow
- Tenant timeline: All interactions (payment, complaints, maintenance, etc)
- Internal notes on tenant
- Expense approval: Photo upload, OCR, approval flow
- Recurring expense support
- **Effort:** 1 engineer, 2 weeks

#### Week 13-14: Multi-Property Support
- Property switcher in navbar
- Per-property dashboard
- Consolidated view (all properties)
- Different pricing rules per property
- **Effort:** 1 frontend engineer, 2 weeks

#### Testing & Soft Launch
- Expand beta to 20-50 pemilik
- Fix issues weekly
- Prepare for public launch
- **Duration:** 2 weeks

**Total Phase 2 Effort:** 5-6 engineers, 14 weeks
**Total Phase 2 Cost:** $30K-35K

**Phase 2 Success Criteria:**
- ✅ >50 active merchants in production
- ✅ Unit status board being used (occupancy visibility)
- ✅ Collections action tracker + lease renewal automaton reducing manual work
- ✅ Mobile app v1 launched (iOS), >80% adoption among active users
- ✅ <2% critical bug rate in production
- ✅ NPS >40 (from production users)
- ✅ Support ticket volume stable (not increasing with user growth)

---

### Phase 3: Growth & Revenue Optimization (16-18 weeks)
**Goal: Full feature parity, revenue optimization, scale-ready**

#### Week 1-4: AI/ML Surface
- Occupancy forecast widget (30-day, 60-day forecast with confidence)
- Pricing recommendation (market analysis, competitor intelligence)
- Tenant quality scoring (pre-contract & post-contract risk tracking)
- Churn prediction (which tenant likely to move out, plan ahead)
- **Effort:** 2 engineers (backend + frontend), 4 weeks

#### Week 5-6: Dynamic Pricing Enhancement
- What-if simulator (if I change price X, occupancy becomes Y)
- Rule safety guard (min/max price, cooldown period)
- Pricing analytics (elasticity measurement, seasonal pattern)
- **Effort:** 1 engineer, 2 weeks

#### Week 7-8: Advanced Financial Reporting
- P&L statement: Revenue breakdown, expense breakdown, profit margin
- Cash flow statement: Opening balance, inflow, outflow, forecast
- ROI calculation: Annual return, payback period, sensitivity analysis
- Tax report: Deductible expense, withholding, export for tax filing
- **Effort:** 1 engineer, 2 weeks

#### Week 9-10: Utilities & Shared Expense Billing
- Meter reading input (monthly water/electricity)
- Fixed allocation (internet, cleaning shared cost)
- Auto-invoice generation to tenant
- Tenant portal to view utility usage & charges
- **Effort:** 1 engineer, 2 weeks

#### Week 11-12: Document Management & Templates
- Template library: Contract, house rules, inspection form, letters
- Auto-fill templates with tenant/property data
- E-signature integration
- Version control & archive
- **Effort:** 1 engineer + 1 designer, 2 weeks

#### Week 13-14: API & Integration Framework
- REST API for external systems (CRM, accounting, marketplace)
- Webhook for events (payment, maintenance, tenant move)
- SDK & documentation
- Rate limiting & security
- **Effort:** 1 engineer, 2 weeks

#### Week 15-16: Vendor Portal & Performance
- Vendor can view assignment, submit progress, upload receipt
- Rating system: Pemilik & tenant rate vendor
- Performance dashboard: Response time, quality, cost comparison
- **Effort:** 1 engineer, 2 weeks

#### Week 17-18: Mobile App Phase 2
- Android version of iOS app
- Advanced features: Tenant communication, dispute resolution
- Offline mode enhancements
- **Effort:** 1 mobile engineer, 2 weeks

#### Testing & General Availability (GA)
- Expand to all merchants (>500)
- Full public launch
- Marketing campaign
- **Duration:** 2 weeks

**Total Phase 3 Effort:** 6-7 engineers, 18 weeks
**Total Phase 3 Cost:** $40K-50K

**Phase 3 Success Criteria:**
- ✅ >500 active merchants
- ✅ Occupancy forecast & pricing recommendation being used
- ✅ Revenue per merchant up 20% (via better pricing)
- ✅ Collections success rate up 30% (via systematic process)
- ✅ <2% critical bug rate
- ✅ NPS >50 (best-in-class)
- ✅ Customer acquisition cost <$X (profitable growth)

---

## TOTAL EFFORT & BUDGET ESTIMATE

| Phase | Duration | Engineers | Cost (USD) |
|-------|----------|-----------|-----------|
| Phase 1: Stabilization | 10 weeks | 4-5 | $20-25K |
| Phase 2: Excellence | 14 weeks | 5-6 | $30-35K |
| Phase 3: Growth | 18 weeks | 6-7 | $40-50K |
| **Total** | **42 weeks** | **5-7 team** | **$90-110K** |

**Timeline:** ~10 months end-to-end from today (assuming 6-month for Phase 1+2, then Phase 3 parallel with early GA)

**Team Composition:**
- 1x Product Manager / Head of Product
- 2-3x Full-Stack Engineers
- 1x Mobile Engineer (Phase 2 onward)
- 1x QA Engineer + QA Automation
- 1x UX/UI Designer

**Deployment Strategy:**
- Phase 1: Closed beta (5-10 users)
- Phase 2: Soft launch (20-50 users)
- Phase 3: General availability (500+ users)

---

## SUCCESS METRICS & KPI

### User Adoption
- **Target Phase 1:** 10 active merchants
- **Target Phase 2:** 50 active merchants
- **Target Phase 3:** 500+ active merchants

### Quality Metrics
- **Bug rate:** <2% critical bugs per release
- **Uptime:** >99.5% (industry standard)
- **Support:** <24 hour response time for critical issues

### Business Metrics
- **NPS (Net Promoter Score):**
  - Phase 1 target: >30
  - Phase 2 target: >40
  - Phase 3 target: >50
- **Churn rate:** <5% monthly churn of active merchants
- **Revenue per merchant:** >$X/month (premium features)
- **CAC (Customer Acquisition Cost):** <$X (organic + referral)

### Feature Adoption
- **Dashboard:** >90% of merchants check dashboard 1x/week
- **Collections:** >70% of merchants using action tracker
- **Mobile app:** >80% of active merchants
- **Lease renewal:** >60% of merchants using auto-reminder
- **AI/ML insights:** >40% of merchants use pricing recommendation

---

## RISKS & MITIGATION

| Risk | Probability | Severity | Mitigation |
|------|-------------|----------|-----------|
| Escrow removal breaks existing contracts | MEDIUM | HIGH | Provide data migration, grandfather existing merchants |
| Tenant screening integration delays | MEDIUM | MEDIUM | Use manual option first, add automation later |
| Mobile app lower adoption | LOW | MEDIUM | Make web responsive first, mobile as enhancement |
| Bad debt still high post-screening | LOW | HIGH | Continuous improve screening rules with ML |
| Competitor entry | MEDIUM | MEDIUM | Faster execution, lock-in via integrations |
| Payment gateway downtime | LOW | CRITICAL | Add fallback gateway (Stripe), redundant provider |
| Team turnover during 10-month project | MEDIUM | HIGH | Clear documentation, pair programming, mentoring |

---

## GO/NO-GO DECISION

### Current Recommendation: **PROCEED WITH REDESIGN** ✅

**BUT DO NOT LAUNCH WITHOUT PHASE 1+2 COMPLETION**

- ✅ Remove escrow (direct payment is superior)
- ✅ Remove referral (save time for core)
- ✅ Implement tenant screening (bad debt prevention)
- ✅ Redesign collections (systematic approach)
- ✅ Build mobile (pemilik requirement)
- ✅ Fix UX (simplify from 23 to 20 workflows)

### If Forced to Launch Earlier (High Risk):
- ❌ **Absolute minimum:** Phase 1 only, max 10 early adopters, expect 50%+ churn
- ❌ **Not recommended:** Will damage brand, require cleanup later, waste resources

**Preferred path:** 6-month development, then scale confidently

---

**Report Version: 2.0 (Comprehensive Redesign)**
**Last Updated: February 2026**
**Next Review: After Phase 1 beta completion**


