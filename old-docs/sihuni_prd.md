# Product Requirements Document (PRD)
## SiHuni.com - B2B2C SaaS Platform Manajemen Hunian

**Versi:** 2.0  
**Tanggal:** 22 Desember 2025  
**Target Launch MVP:** Q2 2026 (6 bulan)  
**Business Model:** B2B2C SaaS with Escrow & Marketplace

---

## 1. Executive Summary

**SiHuni.com** adalah platform SaaS B2B2C untuk manajemen properti hunian (gudang, ruko, kosan, apartemen) yang menghubungkan **Admin** (SaaS provider), **Merchant** (pemilik properti yang subscribe), **Tenant** (penyewa yang didaftarkan merchant), dan **Vendor** (penyedia jasa/produk untuk tenant).

### Key Differentiators:
- **Escrow Payment System:** Payment tenant mengalir via SiHuni untuk keamanan dan otomasi
- **Multi-Revenue Stream:** Subscription + Transaction fees + Disbursement fees
- **Vendor Marketplace:** Unlimited vendor orders untuk semua tier (revenue source)
- **Referral System:** 3-tier viral growth mechanism
- **Verification System:** Trust & safety dengan verified badges

### Target Tahun 1:
- **Merchant:** 100-150 merchants (paid subscribers)
- **Properties:** 200-300 properties managed
- **Tenants:** 1.000+ active tenants
- **Vendors:** 50-100 verified vendors
- **GMV (Sewa):** Rp 1.5 miliar/bulan (Rp 18 miliar/tahun)
- **GMV (Vendor):** Rp 150 juta/bulan (Rp 1.8 miliar/tahun)

---

## 2. Business Model

### 2.1 Revenue Streams

**Primary Revenue (80%):**

| Stream | Model | Rate | Estimated Revenue (Year 1) |
|--------|-------|------|---------------------------|
| **Subscription** | Recurring monthly | Rp 149k-999k/merchant | Rp 432 juta/year (100 merchants avg Rp 360k) |
| **Transaction Fee (Sewa)** | Per transaction | 3.5% (1% platform + 2.5% Xendit) | Rp 180 juta/year (1% × Rp 18M GMV) |
| **Transaction Fee (Vendor)** | Per transaction | 5.5% (3% platform + 2.5% Xendit) | Rp 54 juta/year (3% × Rp 1.8M GMV) |

**Secondary Revenue (20%):**

| Stream | Model | Rate | Estimated Revenue (Year 1) |
|--------|-------|------|---------------------------|
| **Disbursement Fee (Daily)** | Optional | 0.25% | Rp 27 juta/year (15% merchant pilih daily) |
| **Disbursement Fee (On-Demand)** | Optional | 0.5% | Rp 9 juta/year (occasional use) |

**Total Projected Revenue Year 1:** Rp 702 juta (~$45k USD)

**Gross Margin:** ~65% (after Xendit fees, server costs, AI API)

---

### 2.2 Payment Flow Architecture

#### **Sewa Tenant → Merchant (via Escrow)**

```
1. Tenant bayar Rp 1.500.000 via Xendit
   ↓
2. Uang masuk SiHuni Escrow Account
   ↓
3. Deduct fees:
   - Platform fee: 1% (Rp 15.000)
   - Xendit fee: ~2.5% (Rp 37.500)
   - Total: Rp 52.500
   ↓
4. Merchant balance: Rp 1.447.500
   ↓
5. Disbursement (merchant pilih schedule):
   - Daily (0.25% fee): Rp 1.447.500 - Rp 3.619 = Rp 1.443.881
   - Weekly (FREE): Rp 1.447.500
   - Monthly (FREE): Rp 1.447.500
   - On-demand (0.5% fee): Rp 1.447.500 - Rp 7.238 = Rp 1.440.262
```

#### **Order Tenant → Vendor (via Escrow)**

```
1. Tenant order laundry Rp 50.000
   ↓
2. Uang masuk SiHuni Escrow Account
   ↓
3. Tenant confirm order completed
   ↓
4. Deduct fees:
   - Platform fee: 3% (Rp 1.500)
   - Xendit fee: ~2.5% (Rp 1.250)
   - Total: Rp 2.750
   ↓
5. Vendor balance: Rp 47.250
   ↓
6. Disbursement (same schedule options as merchant)
```

#### **Subscription Merchant → Admin**

```
1. Merchant bayar subscription Rp 149k/349k/999k
   ↓
2. Direct payment ke SiHuni (no escrow)
   ↓
3. Xendit fee ditanggung SiHuni
   ↓
4. Auto-renewal setiap bulan (atau annual)
```

---

### 2.3 Subscription Tiers

| Tier | Price | Trial | Target Market |
|------|-------|-------|---------------|
| **Free** | Rp 0 | Forever | Testing, 1-5 kamar |
| **Basic** | Rp 149k/mo (Rp 1.49jt/yr) | 14 hari | Kosan 10-50 kamar |
| **Pro** | Rp 349k/mo (Rp 3.49jt/yr) | 7 hari | Apartemen/Kosan 50-200 kamar |
| **Enterprise** | Rp 999k/mo (custom) | 3 hari | Property management >200 unit |

**Annual Discount:** Save 17% (contoh: Basic Rp 1.49jt/year vs Rp 1.788jt if monthly)

**Trial Policy:**
- Semua fitur paid tier available selama trial
- Setelah trial expired → auto downgrade ke Free
- Data tetap tersimpan (tidak hilang)
- Bisa re-subscribe kapan saja (no trial lagi)

---

## 3. Problem Statement

### Pain Points (Before SiHuni)

**Merchant (Property Owner):**
- ❌ Manual payment tracking (tenant transfer bank, screenshot, confirm manual)
- ❌ Sulit monitoring pembayaran real-time
- ❌ Reminder tagihan manual via WhatsApp (time-consuming)
- ❌ Tidak ada backup data (buku kas manual/Excel)
- ❌ Sulit scale ke multiple properties
- ❌ No analytics (occupancy rate, revenue trends)

**Tenant:**
- ❌ Bayar sewa ribet (transfer bank, WhatsApp bukti transfer)
- ❌ No receipt digital (hanya screenshot chat)
- ❌ Sulit cari vendor terpercaya (laundry, food, repair)
- ❌ Tidak ada komunitas (isolasi sosial)
- ❌ Komplain maintenance via chat (slow response)

**Vendor:**
- ❌ Sulit dapat customer baru (marketing cost tinggi)
- ❌ No payment guarantee (tenant bisa cancel tanpa konsekuensi)
- ❌ Sulit build trust dengan tenant baru

**Admin (SiHuni):**
- 💡 Market gap: Tidak ada SaaS multi-tenant untuk property management Indonesia dengan escrow + marketplace terintegrasi

---

### Solution (SiHuni Value Proposition)

**For Merchant:**
- ✅ Auto payment collection via Xendit (reduce manual work 80%)
- ✅ Real-time payment dashboard & analytics
- ✅ Auto invoice generation & reminder (email + WhatsApp)
- ✅ Daily backup + cloud storage (99.9% uptime)
- ✅ Multi-property management (1 account, unlimited properties*)
- ✅ Advanced analytics (revenue forecasting, churn prediction)
- ✅ Referral income (earn 20% commission)

**For Tenant:**
- ✅ Bayar sewa 1-click (VA/QRIS/E-Wallet/CC)
- ✅ Digital receipt & payment history
- ✅ Trusted vendor marketplace (verified badges)
- ✅ Community forum (global + per-property)
- ✅ AI chatbot 24/7 (FAQ, vendor recommendations)
- ✅ Maintenance tracking real-time

**For Vendor:**
- ✅ Instant access to 1000+ potential customers
- ✅ Payment guaranteed via escrow (reduce risk)
- ✅ Verified badge system (build trust)
- ✅ Analytics dashboard (sales trends, customer insights)
- ✅ Referral income (earn Rp 50k-150k per referral)

---

## 4. User Personas

### 4.1 Admin (SiHuni Team)

**Profile:**
- Role: SaaS provider & platform operator
- Responsibility: Merchant onboarding, vendor verification, platform maintenance
- Goals: Grow merchant base, ensure platform stability, maximize revenue

**Key Tasks:**
- Approve/reject merchant & vendor verification
- Monitor escrow transactions & disbursements
- Handle disputes (merchant-tenant, tenant-vendor)
- Manage subscription billing & upgrades
- Analyze platform metrics (churn, revenue, engagement)

---

### 4.2 Merchant (Property Owner)

**Profile:**
- Age: 30-55 tahun
- Occupation: Property owner/manager (kosan, ruko, gudang, apartemen)
- Properties: 1-10 properties, 10-200 units total
- Tech Savvy: Medium (bisa pakai smartphone, WhatsApp, Excel)

**Pain Points:**
- Waktu terbuang untuk reminder pembayaran manual (2-3 jam/hari)
- Sulit tracking tenant mana yang belum bayar
- Excel spreadsheet error-prone (salah input, data hilang)
- Sulit cari replacement tenant (no marketing channel)

**Goals:**
- Reduce admin work 50%+ (automate payment tracking)
- Real-time visibility of cash flow
- Increase occupancy rate >90%
- Scale ke multiple properties tanpa hire staff

**Subscription Decision Factors:**
1. ROI jelas (save time = save cost)
2. Easy onboarding (<1 jam setup)
3. Responsive support (critical untuk payment issues)
4. Competitive pricing (Rp 149k acceptable untuk 20+ units)

---

### 4.3 Tenant (Penyewa)

**Profile:**
- Age: 20-40 tahun
- Occupation: Mahasiswa, pekerja kantoran, freelancer
- Tech Savvy: High (mobile-first, digital payment natives)
- Income: Rp 3-10 juta/bulan

**Pain Points:**
- Bayar sewa ribet (harus screenshot transfer, konfirmasi manual)
- Sulit cari laundry/food/repair service terpercaya
- Isolasi sosial (tidak kenal sesama tenant)
- Komplain maintenance lambat direspon

**Goals:**
- Convenience (bayar sewa 1-click)
- Access to trusted services (vendor verified)
- Community (connect with other tenants)
- Fast response to issues (maintenance request tracking)

**Behavior:**
- Mobile-first (90% akses via smartphone)
- Prefer digital payment (VA/QRIS/E-Wallet > bank transfer)
- Active di social media/forum (seek recommendations)
- Price-sensitive untuk vendor services (compare prices)

---

### 4.4 Vendor (Service/Product Provider)

**Profile:**
- Age: 25-50 tahun
- Business: UMKM (laundry, food delivery, repair service, grocery, cleaning)
- Location: Dekat dengan properties (radius 1-3 km)
- Tech Savvy: Low-Medium (bisa pakai WhatsApp, basic smartphone)

**Pain Points:**
- Sulit dapat customer baru (marketing cost tinggi)
- Risk of payment default (tenant cancel setelah service)
- Low repeat rate (customer one-time purchase)
- No platform untuk showcase services

**Goals:**
- Stable income stream (repeat customers from tenants)
- Low customer acquisition cost (no need FB ads)
- Payment guarantee (escrow system)
- Build reputation (verified badge, ratings)

**Subscription Decision Factors:**
1. Low/no upfront cost (5.5% commission acceptable)
2. Fast payment (disbursement H+1)
3. Easy to use (simple interface, no training needed)
4. Marketing support (featured placement, recommendations)

---

## 5. Core Features (MVP)

### 5.1 Admin Panel (Web App)

**Priority: P0 (Must Have for Launch)**

#### Dashboard & Analytics
- **Merchant Management:** CRUD merchants, view subscription status, approve verification
- **Vendor Management:** Approve/reject vendor registration, manage categories, suspend vendors
- **Transaction Monitoring:** Real-time escrow balance, pending disbursements, transaction logs
- **Subscription Billing:** View subscription renewals, failed payments, upgrade/downgrade events
- **Dispute Management:** Handle merchant-tenant & tenant-vendor disputes
- **Platform Analytics:** 
  - Revenue metrics (subscription, transaction fees, disbursement fees)
  - User metrics (MAU, churn rate, new signups)
  - Transaction metrics (GMV, avg transaction value, success rate)
  - Vendor metrics (top vendors, avg rating, order completion rate)

#### Configuration & Settings
- **Subscription Tier Management:** Create/edit/delete tiers, set pricing & limits
- **Fee Configuration:** Adjust platform fees (transaction, disbursement)
- **AI Chatbot Training:** Manage FAQ knowledge base, view chatbot analytics
- **Referral Program:** Set referral rewards, track referral performance
- **Payment Gateway:** Xendit configuration (API keys, webhook setup)

**Success Criteria:**
- Admin dapat onboard 1 merchant dalam <10 menit
- Transaction monitoring real-time (<5 second delay)
- Dispute resolution time <24 jam

---

### 5.2 Merchant Dashboard (Web App + PWA)

**Priority: P0**

#### Property & Unit Management
- **Multi-Property Support:** Unlimited properties (tier-limited for Free/Basic/Pro)
- **Unit CRUD:** Add/edit/delete units, set price per unit, upload photos
- **Unit Status:** Available, Occupied, Maintenance
- **Property Amenities:** WiFi, AC, Parking, Laundry, etc
- **Property Photos:** Upload hingga 10 photos per property

#### Tenant Management
- **Invite Tenant:** Generate invitation link atau manual input data tenant
- **Tenant Registration:** Tenant complete profile via link (KTP, emergency contact)
- **Assign Unit:** Assign tenant ke unit, set contract start/end date
- **Contract Management:** Digital contract (e-signature), auto-renewal settings
- **Tenant Status:** Active, Notice period, Expired

#### Payment & Invoicing
- **Auto Invoice Generation:** Monthly recurring invoice (tanggal customizable)
- **Payment Dashboard:** Real-time payment status (pending, paid, overdue)
- **Payment Reminder:** Auto WhatsApp/Email reminder (H-3, H-1, overdue)
- **Payment History:** View all transactions, filter by date/status
- **Receipt Download:** PDF invoice untuk tenant

#### Escrow & Disbursement
- **Escrow Balance:** Real-time balance dashboard
- **Disbursement Settings:** Choose schedule (daily 0.25%/weekly FREE/monthly FREE/on-demand 0.5%)
- **Disbursement History:** View all disbursements, status tracking
- **Bank Account:** Add/edit bank account untuk disbursement

#### Maintenance Requests
- **Request Inbox:** View all maintenance requests from tenants
- **Assign Technician:** Assign request ke staff/vendor
- **Status Tracking:** Pending → In Progress → Resolved
- **Communication:** Reply to tenant, upload photo updates

#### Analytics & Reports
- **Occupancy Rate:** Current occupancy, trends (monthly/yearly)
- **Revenue Trends:** Total revenue, avg revenue per unit
- **Payment Performance:** On-time payment rate, overdue analysis
- **Tenant Churn:** Churn rate, reasons for leaving
- **Custom Reports:** Date range filter, export CSV/PDF

#### Referral Program
- **Referral Dashboard:** Track referral progress, earnings
- **Generate Referral Link:** Share via WhatsApp/Email/Social media
- **Reward History:** View commission earned, credit balance

**Success Criteria:**
- Merchant dapat add property + 10 units dalam <15 menit
- Invoice generation automation 100% (no manual input needed)
- Payment success rate >95%
- Disbursement processing <24 hours

---

### 5.3 Tenant App (Web App + PWA)

**Priority: P0**

#### Onboarding & Profile
- **Registration via Invitation:** Click link dari merchant → complete profile
- **KYC:** Upload KTP, input emergency contact
- **Contract Signing:** E-signature for rental agreement
- **Profile Management:** Edit personal info, change password

#### Payment
- **View Invoice:** Current & upcoming invoices
- **Pay Rent:** 1-click payment via Xendit (VA/QRIS/E-Wallet/Credit Card)
- **Payment Method:** Save payment method untuk quick pay
- **Payment History:** Download PDF receipt
- **Auto-Pay Setup:** Auto-charge setiap bulan (consent required, Pro+ tier only)

#### Vendor Marketplace
- **Browse Vendors:** Filter by category (Laundry, Food, Repair, Grocery, Cleaning)
- **Search:** Keyword search (e.g., "cuci karpet")
- **Vendor Profile:** Photos, menu/services, price, rating, distance
- **Place Order:** Select item → add notes → checkout
- **Order Tracking:** Pending → Confirmed → Processing → Completed
- **Rate & Review:** After order completed (1-5 stars + text review)

#### Maintenance Request
- **Create Request:** Title, description, category, priority, upload photos
- **Track Status:** Real-time status updates
- **Communication:** Chat with merchant/technician
- **History:** View all past requests

#### Community Forum
- **Global Forum:** All tenants from all merchants (unlimited access)
- **Property Forum:** Private forum untuk tenant 1 property saja
- **Create Post:** Text + photos + tags
- **Interact:** Like, comment, reply
- **Report:** Report spam/abuse
- **Search:** Search posts by keyword/tag

#### AI Chatbot
- **24/7 Support:** FAQ (cara bayar, komplain, aturan hunian)
- **Vendor Recommendations:** "Cari tukang AC terdekat yang bagus"
- **Property Search:** "Cari kosan 2 juta di Jakarta" (future feature)
- **Maintenance Assistant:** "AC tidak dingin, apa yang harus saya lakukan?"

#### Referral Program
- **Referral Link:** Share ke teman untuk daftar sebagai tenant
- **Reward Tracking:** Track referral progress, voucher balance
- **Redeem Voucher:** Pakai voucher untuk order vendor

**Success Criteria:**
- Onboarding time <5 menit
- Payment success rate >95%
- Vendor order completion rate >90%
- Maintenance request resolution <48 hours
- Chatbot self-service rate >60%

---

### 5.4 Vendor App (Web App + PWA)

**Priority: P0**

#### Registration & Verification
- **Self-Registration:** Business name, category, address, phone
- **Upload Documents:** KTP, NIB/SIUP, foto tempat usaha
- **Verification Status:** Pending → Verified (admin review 1-2 hari)
- **Non-Verified:** Bisa langsung aktif, tapi limited features

#### Product/Service Management
- **Add Products:** Name, description, price, unit (porsi/kg/pcs), photos
- **Categories:** Laundry, Food, Repair, Grocery, Cleaning, etc
- **Stock Management:** Set stock available (optional)
- **Pricing:** Set regular price, promo price

#### Order Management
- **Order Inbox:** Real-time notification untuk order baru
- **Accept/Reject Order:** Confirm order dalam 1 jam (auto-reject setelah 1 jam)
- **Update Status:** Confirmed → Processing → Completed
- **Communication:** Chat dengan tenant (notes, delivery time)
- **Order History:** Filter by status/date

#### Escrow & Disbursement
- **Balance Dashboard:** Real-time escrow balance
- **Disbursement Settings:** Same as merchant (daily/weekly/monthly/on-demand)
- **Transaction History:** View all completed orders, fees deducted

#### Analytics
- **Sales Report:** Daily/weekly/monthly revenue
- **Top Products:** Best-selling items
- **Customer Insights:** Repeat customer rate, avg order value
- **Rating Analysis:** Avg rating, negative review tracking

#### Referral Program
- **Referral Dashboard:** Track vendor referrals, cashback earned
- **Generate Link:** Share referral link
- **Reward History:** View cashback, request payout

**Success Criteria:**
- Vendor dapat upload 10 products dalam <10 menit
- Order acceptance rate >95%
- Order completion rate >90%
- Avg rating >4.0 (verified vendors)

---

### 5.5 AI Chatbot (Universal - All Roles)

**Priority: P0**

**Powered by:** Google Gemini API

#### Core Capabilities

**For Tenant:**
- **FAQ Support:** 
  - "Cara bayar sewa?"
  - "Komplain AC rusak kemana?"
  - "Jam quiet hours property ini kapan?"
- **Vendor Recommendations:**
  - "Cari laundry terdekat dengan rating bagus"
  - "Rekomen tempat makan murah di sekitar sini"
  - Input: Location (property address) + category + rating filter
  - Output: Top 3-5 vendors dengan distance, rating, price range
- **Maintenance Assistant:**
  - "AC tidak dingin, apa yang harus saya lakukan sebelum call teknisi?"
  - "Listrik mati, siapa yang harus dihubungi?"

**For Merchant:**
- **Business Insights:**
  - "Berapa occupancy rate property saya bulan ini?"
  - "Tenant mana yang belum bayar bulan ini?"
  - "Prediksi revenue bulan depan berapa?"
- **Admin Shortcuts:**
  - "Kirim reminder pembayaran ke semua tenant overdue"
  - "Suspend tenant [name] karena 3 bulan belum bayar"

**For Vendor:**
- **Sales Tips:**
  - "Gimana cara naikin penjualan laundry?"
  - "Waktu terbaik buat promo apa ya?"
- **Demand Forecasting:**
  - "Prediksi order minggu depan berapa?"
  - Based on: Historical data, seasonal trends, property occupancy

**Technical Specs:**
- **Model:** Google Gemini 1.5 Flash (fast response, cost-efficient)
- **Context Window:** 32k tokens (cukup untuk conversation history)
- **Response Time:** <2 seconds (p95)
- **Fallback:** Human escalation jika confidence <60%
- **Training Data:** FAQ + property rules + vendor data + transaction history
- **Personalization:** Context-aware (tenant's property, payment status, order history)

**Tier Limits:**
- Free: ❌ No chatbot access
- Basic: 200 queries/month
- Pro: 1000 queries/month
- Enterprise: Unlimited

**Success Criteria:**
- Intent classification accuracy >80%
- Self-service resolution rate >60%
- User satisfaction (thumbs up/down) >75%
- Avg response time <2 seconds

---

## 6. Referral System (3-Tier)

### 6.1 Merchant Referral

**How it Works:**
1. Merchant A share referral link via dashboard
2. Merchant B click link → register → complete profile + verification
3. Merchant B subscribe paid tier (Basic/Pro/Enterprise) → Merchant A track progress
4. Merchant B bayar subscription pertama → **Merchant A dapat 20% commission bulan pertama**
5. Merchant B bertahan 3 bulan → **Merchant A dapat bonus Rp 50k credit**

**Rewards:**
- Commission 20% recurring for 6 bulan first subscription
- Example: B subscribe Pro Rp 349k → A dapat Rp 69.8k × 6 = Rp 418.8k total
- Credit bisa dipakai: Extend subscription, upgrade tier, cashout ke rekening (min Rp 100k)
- Unlimited referrals

---

### 6.2 Tenant Referral

**How it Works:**
1. Tenant A share referral link
2. Tenant B register → complete profile + KTP upload
3. Tenant B assigned to unit by merchant
4. Tenant B bayar sewa pertama (min Rp 500k) → **Tenant A dapat Rp 25k voucher, Tenant B dapat Rp 10k voucher**
5. Tenant B bayar 3 bulan berturut-turut → **Tenant A dapat bonus Rp 25k voucher**

**Rewards:**
- Voucher hanya untuk order vendor di platform
- Voucher berlaku 90 hari
- Max 5 referral per bulan (anti-spam)

---

### 6.3 Vendor Referral

**How it Works:**
1. Vendor A share referral link
2. Vendor B register → complete profile + verification → upload 5+ products
3. Vendor B dapat 5 orders pertama → Vendor B dapat "Featured" badge 3 hari
4. Vendor B complete 10 orders + rating avg >4.0 → **Vendor A dapat Rp 50k cashback, Vendor B dapat "Top Vendor" badge 7 hari**
5. Vendor B bertahan 3 bulan + 50+ orders → **Vendor A dapat bonus Rp 100k cashback**

**Rewards:**
- Cashback langsung transfer ke rekening (no minimum)
- Featured badge = top placement di vendor search
- Unlimited referrals

---

## 7. Verification System

### 7.1 Merchant Verification

**Non-Verified:**
- ✅ Bisa langsung aktif terima tenant
- ⚠️ Badge "Non-Verified"
- ⚠️ Disbursement: Manual approval per transaction (1-3 hari)
- ⚠️ Max tenant: 50% dari tier limit
- ⚠️ No recurring auto-pay feature

**Verified:** (Upload KTP + NPWP + Surat Property)
- ✅ Badge "Verified"
- ✅ Auto disbursement (schedule options)
- ✅ Full tier limit
- ✅ Recurring auto-pay enabled
- ✅ Priority support
- ✅ Featured placement (jika ada public search)

**Verification Process:**
- Upload docs via dashboard → Admin review 1-2 hari kerja → Approved/Rejected
- FREE (no cost)

---

### 7.2 Vendor Verification

**Non-Verified:**
- ✅ Bisa langsung aktif terima order
- ⚠️ Badge "Non-Verified"
- ⚠️ Disbursement: Manual per transaction (1-3 hari after completed)
- ⚠️ Max pending orders: 10
- ⚠️ Max order value: Rp 500k per order
- ⚠️ Rating minimum 4.0 required (after 10 orders)

**Verified:** (Upload KTP + NIB/SIUP + Foto Tempat Usaha)
- ✅ Badge "Verified"
- ✅ Auto disbursement (H+1 after completed)
- ✅ Unlimited pending orders & order value
- ✅ Priority placement
- ✅ Promo/discount feature
- ✅ Analytics dashboard

**Verification Process:**
- Upload docs via app → Admin review 1-2 hari kerja → Approved/Rejected
- FREE (no cost)

---

## 8. Success Metrics (KPI)

### 8.1 Business Metrics

| Metric | Target Year 1 | Target Year 3 | Measurement |
|--------|---------------|---------------|-------------|
| **MRR (Monthly Recurring Revenue)** | Rp 36 juta | Rp 180 juta | Subscription revenue |
| **GMV (Gross Merchandise Value)** | Rp 1.5M/mo sewa + Rp 150jt/mo vendor | Rp 15M/mo sewa + Rp 1.5M/mo vendor | Total transaction value |
| **Take Rate** | 4.2% blended (subscription + fees) | 4.5% | Revenue / GMV |
| **Paying Merchants** | 100 | 500 | Active paid subscriptions |
| **Active Tenants** | 1,000 | 10,000 | Tenants bayar sewa min 1x in 3 months |
| **Active Vendors** | 50 | 300 | Vendors complete min 5 orders/month |
| **Churn Rate** | <5% monthly | <3% monthly | Merchants cancel subscription |

---

### 8.2 Product Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| **Payment Success Rate** | >95% | Successful payments / Total attempts |
| **Disbursement Completion Rate** | >99% | Successful disbursements / Total requests |
| **Vendor Order Completion Rate** | >90% | Completed orders / Total orders |
| **Maintenance Resolution Time** | <48 hours (median) | Time from submit to resolved |
| **Chatbot Self-Service Rate** | >60% | Resolved by chatbot / Total queries |
| **Referral Conversion Rate** | >15% | Referred users → active users |
| **Forum Engagement Rate** | >40% MAU | Active forum users / Total users |
| **Vendor GMV per Tenant** | Rp 150k/month | Total vendor GMV / Active tenants |

---

### 8.3 User Satisfaction

| Metric | Target | Measurement |
|--------|--------|-------------|
| **NPS (Net Promoter Score)** | >40 | Quarterly survey (all roles) |
| **Merchant Satisfaction** | >4.0 / 5.0 | In-app rating after key milestones |
| **Tenant App Rating** | >4.5 / 5.0 | App store / PWA rating |
| **Vendor Satisfaction** | >4.0 / 5.0 | Quarterly survey |
| **Support Response Time** | <4 hours (business hours) | First response time |
| **Bug Report Resolution** | <48 hours (critical), <7 days (minor) | Time to fix |

---

## 9. Go-to-Market Strategy

### 9.1 Target Segments (Priority)

**Segment 1 (Primary):** Kosan & Kontrakan (65% market)
- Size: 10-50 kamar per property
- Location: Jakarta, Bandung, Yogyakarta, Surabaya
- Owner profile: Individual owners, 1-3 properties
- Pain point: Manual payment tracking, high churn tenant

**Segment 2 (Secondary):** Apartemen & Ruko (25% market)
- Size: 20-100 unit
- Location: Jakarta, Tangerang, Bekasi
- Owner profile: Small property management companies
- Pain point: No unified system, multiple properties hard to manage

**Segment 3 (Future):** Gudang & Industrial (10% market)
- Size: 5-20 unit
- Location: Industrial areas
- Owner profile: Corporate owners

### 9.2 Acquisition Channels

**Organic (50% target):**
1. **SEO:** Content marketing (blog: "cara kelola kosan modern", "tips tingkatkan occupancy")
2. **Social Media:** Instagram/TikTok (tips property management, success stories)
3. **Referral Program:** 3-tier viral loop
4. **Community:** WhatsApp groups, Facebook groups (owner kosan)

**Paid (30% target):**
1. **Google Ads:** Keyword "software manajemen kosan", "sistem pembayaran kosan"
2. **Facebook/Instagram Ads:** Targeting: Property owners, age 30-55, interest: real estate
3. **Influencer Marketing:** Property management influencers, YouTube channels

**Partnership (20% target):**
1. **Property Associations:** AREBI, REI (Real Estate Indonesia)
2. **University Partnerships:** Target kosan di sekitar kampus (ITB, UI, UGM)
3. **Co-working Spaces:** Cross-promotion (tenant ecosystem)

### 9.3 Pricing Strategy

**Penetration Pricing:**
- Free tier: Unlimited time (customer acquisition)
- Basic: Rp 149k (vs competitor Rp 200-300k) = 25-50% cheaper
- Trial period: Generous (7-14 hari) untuk reduce friction

**Value-Based:**
- ROI calculation: Merchant dengan 20 unit × Rp 1.5jt = Rp 30jt/bulan revenue
- Time saved: 2-3 jam/hari × Rp 50k/jam = Rp 3-4.5 juta/bulan value
- Subscription Rp 149k = hanya 5% dari time saved value

---

## 10. Technical Requirements Summary

### Tech Stack

**Frontend:**
- Web App: Next.js 14, TypeScript, Tailwind CSS, Shadcn UI
- PWA: Service Workers, offline capability (read-only)
- State: Zustand / React Query

**Backend:**
- API: Node.js (NestJS) atau Go (Fiber)
- Database: PostgreSQL 15 (primary), Redis (cache)
- Queue: BullMQ / RabbitMQ
- Storage: AWS S3 / GCP Cloud Storage

**AI/ML:**
- Chatbot: Google Gemini 1.5 Flash API
- Vector DB: Pinecone (semantic search)
- Analytics: Python (Pandas) untuk custom reports

**Payment:**
- Gateway: Xendit API (Sandbox mode untuk development)
- Escrow: Xendit Balance & Disbursement API

**Infrastructure:**
- Cloud: AWS (EC2, RDS, S3, SQS) atau GCP
- CI/CD: GitHub Actions
- Monitoring: DataDog / New Relic
- Logging: ELK Stack

---

## 11. Risks & Mitigation

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| **Xendit downtime** | Critical | Low | Fallback: Manual payment tracking + credit system |
| **Escrow reconciliation error** | High | Medium | Daily automated reconciliation + manual audit |
| **Merchant adoption slow** | High | Medium | Free tier + generous trial + referral incentives |
| **Vendor supply shortage** | Medium | Medium | Partnership dengan vendor aggregators (GoFood, Grab) |
| **Data breach (escrow balance)** | Critical | Low | PCI-DSS compliance via Xendit, SOC2 audit |
| **Gemini API cost overrun** | Medium | Medium | Caching + rate limiting + tier-based quota |
| **Disbursement fraud** | High | Low | KYC verification mandatory for verified status |
| **Forum spam/abuse** | Medium | High | AI moderation + rate limiting + community reporting |

---

## 12. Roadmap

### Phase 1 - MVP (Month 1-6)
**Goal:** Launch core platform, onboard 50 merchants

- ✅ Core features (property, tenant, payment, escrow, disbursement)
- ✅ Vendor marketplace (basic)
- ✅ AI chatbot (FAQ only)
- ✅ Referral system (all 3 tiers)
- ✅ Forum (global + private)
- ✅ Verification system
- 🎯 Target: 50 paying merchants, 500 tenants, 20 vendors

### Phase 2 - Growth (Month 7-12)
**Goal:** Scale to 100 merchants, improve retention

- 📱 Mobile-optimized PWA (push notifications)
- 🤖 Advanced AI (personalized recommendations, predictive analytics)
- 📊 Advanced analytics dashboard (custom reports, BI integration)
- 🎁 Loyalty program (tenant cashback, vendor rewards)
- 🔗 Integrations (accounting software: Accurate, Jurnal)
- 🎯 Target: 100 merchants, 1000 tenants, 50 vendors

### Phase 3 - Scale (Year 2)
**Goal:** Market leadership, enterprise features

- 🏢 B2B Enterprise features (multi-company management, API access)
- 🔗 IoT integration (smart locks, digital meters)
- 💳 Merchant financing (loan products for property owners)
- 🌏 Ekspansi kota (Bali, Medan, Makassar)
- 🌐 Multi-language (English untuk expat market)
- 🎯 Target: 500 merchants, 10,000 tenants, 300 vendors

---

## 13. Compliance & Legal

### Data Privacy (UU PDP Indonesia)
- **Consent Management:** Explicit opt-in untuk data processing
- **Right to Access:** User export data (JSON/PDF)
- **Right to Erasure:** Account deletion (30 hari grace period)
- **Data Breach Notification:** Report ke otoritas dalam 3×24 jam

### Payment Compliance
- **PCI-DSS:** Via Xendit (SiHuni tidak store kartu kredit)
- **Anti-Money Laundering (AML):** KYC verification untuk verified users
- **Tax Compliance:** E-Faktur integration untuk merchant >Rp 4.8M/year revenue

### Terms & Conditions
- **Escrow Agreement:** Clear terms untuk fund holding & disbursement
- **Dispute Resolution:** Arbitration clause (30 hari mediation period)
- **Service Level Agreement (SLA):** 99.5% uptime guarantee (Enterprise tier)

---

## 14. Competitive Analysis

| Feature | SiHuni | KostPay | Mamikos Pro | Travelio |
|---------|--------|---------|-------------|----------|
| **Business Model** | B2B2C SaaS + Escrow | Payment only | Listing + Ads | Booking platform |
| **Target** | Merchant (property owner) | Merchant | Tenant (search) | Tenant (booking) |
| **Pricing** | Rp 149k-999k/mo + 3.5% tx | ~4% tx fee | Rp 300k/mo | 15-20% commission |
| **Escrow** | ✅ Yes | ❌ No | ❌ No | ✅ Yes |
| **Vendor Marketplace** | ✅ Yes | ❌ No | ❌ No | ❌ No |
| **AI Chatbot** | ✅ Gemini | ❌ No | ❌ No | Limited |
| **Multi-Property** | ✅ Yes | ❌ No | ❌ No | ✅ Yes |
| **Referral Program** | ✅ 3-tier | ❌ No | Limited | Limited |
| **Forum Community** | ✅ Global + Private | ❌ No | ❌ No | ❌ No |

**Competitive Advantage:**
1. **Lowest pricing:** Basic Rp 149k vs competitor Rp 300k+
2. **Escrow security:** Payment guarantee untuk merchant & vendor
3. **Vendor marketplace:** Additional revenue stream (competitor tidak punya)
4. **AI-powered:** Gemini chatbot untuk automation & insights
5. **Viral growth:** 3-tier referral system

---

## 15. Open Questions & Assumptions

### Assumptions Log
1. **Merchant akan adopt SaaS:** Assumption based on pain point validation (20 merchant interviews)
2. **Tenant prefer digital payment:** 80% urban tenant (Gen Z/Millennial) prefer e-wallet/QRIS
3. **Vendor supply adequate:** Jakarta area ada 1000+ UMKM (laundry, food, repair) dalam radius 3km properties
4. **Xendit scalability:** Xendit dapat handle 10k+ transactions/day dengan uptime >99.9%
5. **Gemini API cost sustainable:** Avg Rp 500/query × 50k queries/month = Rp 25 juta (4% of revenue)

### Open Questions
1. **Regulatory:** Apakah perlu izin OJK untuk escrow service? (Legal review needed)
2. **Insurance:** Apakah perlu insurance untuk escrow balance? (Risk assessment needed)
3. **Multi-currency:** Demand untuk SGD/USD payment? (Market research needed)
4. **Custom branding:** Berapa % merchant mau white-label (Enterprise tier)? (Survey needed)

---

## Appendix

### A. Glossary
- **Escrow:** Third-party hold funds until transaction completed
- **Disbursement:** Transfer funds dari escrow ke merchant/vendor account
- **GMV (Gross Merchandise Value):** Total transaction value (before fees)
- **Take Rate:** Revenue / GMV (platform fee percentage)
- **Churn:** Percentage of users who cancel subscription
- **MAU (Monthly Active Users):** Users dengan activity in last 30 days

### B. References
- Indonesia property rental market size: Rp 150 trillion/year (Colliers International 2024)
- Digital payment adoption Indonesia: 78% (Bank Indonesia 2024)
- SaaS adoption growth: 35% YoY (Google Cloud Indonesia 2024)

---

**Document Owner:** Product Manager  
**Contributors:** CTO, Head of Design, Business Development  
**Reviewers:** CEO, CFO, Legal Team  
**Next Review:** Q1 2026 (post-pilot launch)