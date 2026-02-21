

# Maksimalisasi Marketing Strategy & Go-to-Market Document - SiHuni Platform

## Ringkasan

File `docs/marketing.md` (v1.0) saat ini memiliki beberapa masalah:

1. **Data pricing SALAH** -- dokumen mencantumkan 3 tiers (Free/Pro Rp 99k/Business Rp 249k), padahal database aktual memiliki **4 tiers**: Free (Rp 0), Basic (Rp 99k), Professional (Rp 249k), Enterprise (Rp 599k)
2. **Fitur OCR tidak ada** -- berulang kali menyebut "OCR + Auto-Fill" dan "Scan KTP demo" sebagai fitur utama, padahal platform tidak memiliki fitur OCR
3. **Tenant Scoring System tidak ada** -- disebut sebagai USP utama, padahal tidak ada fitur scoring di codebase
4. **Referral program belum tercakup** -- platform sudah memiliki referral system lengkap (kode, tracking, payout, commission) tapi dokumen hanya menyebut "Referral Program Launch" di timeline tanpa detail
5. **Marketplace tidak disebutkan** -- fitur vendor marketplace (products, orders) tidak ada di dokumen
6. **Email sequences tidak ada** -- platform menggunakan Resend dengan 30+ template tapi tidak ada strategi email lifecycle
7. **Sangat pendek** (~187 baris) -- untuk dokumen marketing strategy, ini terlalu ringkas
8. **Tidak memanfaatkan skills** -- banyak skills relevan yang bisa memperkaya dokumen

## Perubahan yang Akan Dilakukan

### File: `docs/marketing.md` (Full Rewrite v2.0)

### 1. Executive Summary (Diperbarui)
- Hapus klaim OCR dan Tenant Scoring yang tidak ada
- USP baru berdasarkan fitur aktual:
  - **Automated Billing & Escrow**: Invoice auto-generation, Xendit payment, escrow disbursement
  - **Multi-Role Platform**: 4 roles (Admin/Merchant/Tenant/Vendor) dalam 1 platform
  - **Vendor Marketplace**: Tenant bisa order produk/jasa dari vendor terverifikasi
  - **AI-Powered Assistance**: 3 role-specific AI chatbots (Gemini)
  - **Referral Network**: Built-in referral program dengan commission tracking
- Core value proposition disesuaikan: "Kelola Kos Lebih Cerdas dengan Automasi & Data." (Manage Smarter with Automation & Data.)

### 2. Market Positioning & Personas (Diperkaya via competitive-landscape skill)

#### 2.1 Competitive Landscape Analysis (NEW)
Menggunakan **Porter's Five Forces** dari `competitive-landscape` skill:
- **Threat of New Entrants**: Moderate -- low barrier (web app) but network effects from marketplace + referral
- **Supplier Power**: Low -- Xendit/Resend are interchangeable
- **Buyer Power**: High -- fragmented market, owners can use Excel/WhatsApp
- **Substitutes**: High -- Excel, WhatsApp groups, manual notebooks
- **Competitive Rivalry**: Low-moderate -- few Indonesian kos-specific platforms

#### 2.2 Blue Ocean Strategy (NEW)
Four Actions Framework:
- **Eliminate**: Manual KTP typing (via digital invitation flow), manual bank reconciliation
- **Reduce**: Admin overhead (auto-invoicing, auto-reminders, auto-escalation)
- **Raise**: Financial transparency (escrow, real-time P&L analytics), tenant trust (digital contracts)
- **Create**: Vendor marketplace inside kos platform, AI chatbot per role, referral commission system

#### 2.3 Positioning Map (NEW)
2x2 matrix positioning SiHuni vs competitors:
- X-axis: Simple -> Feature-Rich
- Y-axis: Manual -> Automated
- SiHuni position: Feature-Rich + Highly Automated

#### 2.4 Positioning Statement (NEW)
Using `competitor-alternatives` framework:
```
For Indonesian boarding house owners
Who struggle with tenant payments, manual admin, and financial tracking
SiHuni is a comprehensive property management platform
That automates billing, payments, and tenant lifecycle management
Unlike Excel spreadsheets and generic property apps
SiHuni offers built-in escrow, vendor marketplace, and AI-powered assistance
```

#### 2.5 Target Personas (Diperkaya)
Existing personas diperbarui + 2 persona baru:
- **Pak Budi (Owner)**: Pain points disesuaikan -- bukan OCR, tapi manual invoice tracking, overdue chasing, no financial visibility
- **Mba Siti (Admin)**: Pain points disesuaikan -- bukan KTP typing, tapi WhatsApp payment proof chaos, manual spreadsheet reconciliation
- **Mas Andi (Tenant)** -- NEW: Wants easy payment (QRIS/VA), transparent billing, maintenance request tracking
- **Bu Dewi (Vendor)** -- NEW: Wants access to kos market, order management, product showcase

### 3. Pricing Strategy (Dikoreksi Total via pricing-strategy skill)

#### 3.1 Actual Pricing Tiers (dari database)

| Tier | Price (Monthly) | Price (Yearly) | Max Units | Max Properties | Trial |
|------|----------------|---------------|-----------|----------------|-------|
| **Free** | Rp 0 | Rp 0 | 5 | 1 | 14 days |
| **Basic** | Rp 99.000 | Rp 990.000 | 25 | 3 | 14 days |
| **Professional** | Rp 249.000 | Rp 2.490.000 | 100 | 10 | 14 days |
| **Enterprise** | Rp 599.000 | Rp 5.990.000 | Unlimited | Unlimited | 30 days |

#### 3.2 Value Metric Analysis (NEW)
Menggunakan `pricing-strategy` skill:
- **Primary Value Metric**: Number of Units (scales with owner's revenue)
- **Secondary Gating**: Feature tiers (analytics, auto-invoicing, marketplace, white-label)
- Annual discount: ~17% (Rp 990k/yr vs Rp 99k x 12 = Rp 1.188k)

#### 3.3 Feature Gating per Tier (NEW)
Detail fitur per tier berdasarkan `features` column aktual di database.

#### 3.4 Good-Better-Best Analysis (NEW)
- Free = "Good" (entry, displace Excel)
- Basic = "Better" (recommended, anchor tier for most owners)
- Professional = "Best" (power users, multi-property)
- Enterprise = "Custom" (large property companies)

#### 3.5 Pricing Psychology (NEW)
Menggunakan `marketing-psychology` skill:
- **Anchoring**: Show Enterprise (Rp 599k) first to make Professional (Rp 249k) seem reasonable
- **Decoy Effect**: Basic tier serves as decoy making Professional better value per unit
- **Mental Accounting**: "Rp 3.300/hari" (less than 1 cup of kopi) for Basic
- **Zero-Price Effect**: Free tier removes all risk -- powerful in Indonesian market
- **Endowment Effect**: 14-day trial creates ownership feeling

### 4. Referral Program Strategy (NEW -- via referral-program skill)

#### 4.1 Program Architecture (Aktual dari codebase)
- Double-sided rewards (referrer + referee)
- Default reward: Rp 50.000 per completed referral
- Commission tracking: `referral_codes`, `referral_rewards` tables
- 3 edge functions: `process-referral-commissions`, `process-referral-reward`, `process-vendor-order-referral`
- Referral types: merchant-to-merchant, vendor order referral

#### 4.2 Referral Loop Design
Using `referral-program` skill:
```
Trigger Moment (owner reaches 5-unit limit) 
  -> Share (unique referral link/code)
  -> Convert (referee signs up + onboards)
  -> Reward (Rp 50k subscription discount)
  -> Loop (referee becomes referrer)
```

#### 4.3 Optimization Strategy
- Optimal trigger moments (after first tenant added, after first payment received, after hitting room limit)
- Analytics tracking: `trackReferralLinkCopied`, `trackReferralLinkShared` (already implemented)
- K-Factor target and viral coefficient tracking

### 5. Free Tool Strategy (NEW -- via free-tool-strategy skill)

Engineering-as-marketing tools untuk lead generation:

| Tool | Type | Target Keyword | Lead Quality |
|------|------|---------------|-------------|
| **Kalkulator ROI Kos** | Calculator | "kalkulator investasi kos" | High |
| **Template Kontrak Sewa** | Generator | "contoh kontrak sewa kos" | High |
| **Cek Harga Sewa per Kota** | Analyzer | "harga sewa kos [kota]" | Medium |
| **Kalkulator Biaya Renovasi** | Calculator | "biaya renovasi kamar kos" | Medium |

Each tool serves as top-of-funnel, gated with email capture, leading to Free tier signup.

### 6. Content Strategy (Diperkaya via content-strategy skill)

#### 6.1 Content Pillars (5 Pillars)
Using `content-strategy` skill framework:

| Pillar | % | Topics | Format | Buyer Stage |
|--------|---|--------|--------|-------------|
| **Manajemen Kos** | 30% | Tips pengelolaan, efisiensi operasional | Blog, PDF Guide | Awareness |
| **Keuangan Properti** | 25% | ROI, cashflow, pajak kos | Calculator, Infographic | Consideration |
| **Hukum & Kepatuhan** | 20% | Kontrak sewa, hak pemilik, regulasi | Blog, Template | Consideration |
| **Teknologi & Automasi** | 15% | Demo produk, tutorial, studi kasus | Video, Tutorial | Decision |
| **Komunitas & Inspirasi** | 10% | Cerita sukses owner, tips bisnis | Social, Podcast | Awareness |

#### 6.2 Hub-and-Spoke Structure (NEW)
- Hub: "Panduan Lengkap Manajemen Kos 2026"
- Spokes: 10+ subtopic articles per pillar
- Internal linking strategy

#### 6.3 Keyword Research by Buyer Stage (NEW)
Indonesian keyword targets:
- **Awareness**: "cara mengelola kos", "tips bisnis kos-kosan"
- **Consideration**: "aplikasi manajemen kos", "software kos terbaik"
- **Decision**: "SiHuni review", "harga aplikasi kos"
- **Implementation**: "tutorial SiHuni", "cara buat invoice kos"

#### 6.4 Content Calendar (NEW)
Monthly content production plan with formats, channels, and responsible roles.

### 7. Social Media Strategy (NEW -- via social-content skill)

#### 7.1 Platform Selection for Indonesian Market

| Platform | Priority | Audience | Content Type |
|----------|----------|----------|-------------|
| **TikTok/Reels** | PRIMARY | Owner 25-45, Admin 20-30 | Short-form "before vs after SiHuni" |
| **Facebook Groups** | PRIMARY | Owner 35-55 | Community, tips, testimonials |
| **Instagram** | SECONDARY | Owner 25-40 | Carousel infographics, stories |
| **LinkedIn** | TERTIARY | Enterprise owners, investors | Thought leadership, data insights |

#### 7.2 Content Pillars for Social (dari social-content skill)
- 30% Industry insights (kos market data, trends)
- 25% Behind-the-scenes (building SiHuni, customer stories)
- 25% Educational (tips, how-tos, templates)
- 15% Personal (founder stories, lessons learned)
- 5% Promotional (product updates, features)

#### 7.3 Hook Formulas Adapted for Indonesian Audience (NEW)
- "Saya hampir bangkrut karena penyewa kabur. Ini yang saya pelajari..."
- "3 kesalahan fatal pemilik kos yang bikin rugi jutaan:"
- "Stop pakai Excel untuk kos. Ini alasannya:"

### 8. Email Marketing Strategy (NEW -- via email-sequence skill)

#### 8.1 Email Sequences (via Resend)
Platform already uses Resend for 30+ email templates. Strategy for:

**Onboarding Sequence (7 emails, 14 days)**:
1. Welcome + first property setup (immediate)
2. Add your first unit (day 1)
3. Invite your first tenant (day 3)
4. See your first invoice auto-generated (day 5)
5. Success story: Owner saves 10 hours/week (day 7)
6. Advanced tip: Escrow & auto-disbursement (day 10)
7. Upgrade prompt with trial ending reminder (day 13)

**Payment Reminder Sequence (already implemented)**:
- Pre-due date reminders (3, 1 day before)
- Due date notification
- Overdue escalation (4-tier system already built)

**Win-Back Sequence (3 emails)**:
- Day 30 inactive: "Penyewa Anda mungkin sudah bayar, cek sekarang"
- Day 45: Feature update round-up
- Day 60: Special offer / extended trial

**Upgrade Sequence (5 emails)**:
- Approaching unit limit: "Anda sudah 4 dari 5 kamar"
- Feature gate hit: Show locked analytics preview
- Social proof: Owner testimonials with upgrade story
- Limited offer: Annual discount highlight
- Last chance: Trial ending countdown

#### 8.2 Transactional Email Templates (Already Built)
- Payment confirmations
- Invoice generated notifications
- Overdue reminders (4-tier escalation)
- Subscription renewal/expiry
- Tenant invitation
- Maintenance request updates
- Referral reward earned

### 9. Go-to-Market Strategy (Diperbarui Total -- via launch-strategy skill)

#### 9.1 ORB Framework (NEW)
Using `launch-strategy` skill:

**Owned Channels**:
- Email list (via free tool lead gen + freemium signups)
- Blog (SEO-optimized content pillars)
- In-app messaging (upgrade prompts, feature announcements)

**Rented Channels**:
- TikTok/Instagram Reels (primary visibility)
- Facebook Groups kos community (relationship building)
- Google Search Ads (high-intent keywords)

**Borrowed Channels**:
- Guest posts on properti.com, rumah123.com
- Podcast interviews on Indonesian business/property podcasts
- Partnership with kos supplier networks

#### 9.2 Five-Phase Launch (Diperbarui via launch-strategy skill)

| Phase | Timeline | Goal | Strategy |
|-------|----------|------|----------|
| **1. Internal Alpha** | Month 1 | Validate core flows | 5-10 friendly owners, white-glove onboarding |
| **2. Closed Beta** | Month 2-3 | 50 active merchants | Invitation-only, referral-based waitlist |
| **3. Open Beta** | Month 3-4 | 200 signups | Facebook Ads, free tier, content launch |
| **4. Public Launch** | Month 5 | 500+ users, first paid conversions | Product Hunt, PR, webinar series |
| **5. Growth** | Month 6+ | Scale paid conversions | Referral program, partnerships, paid acquisition |

#### 9.3 Product Hunt Launch Checklist (NEW)
From `launch-strategy` skill:
- Pre-launch: Build 200+ email waitlist, prep demo video, GIFs
- Launch day: All-day engagement, respond to every comment
- Post-launch: Convert PH traffic to email signups, follow up

### 10. Acquisition Funnel (Diperbarui)

Updated Mermaid diagram reflecting actual platform flow:
- Landing Page -> Free Tool (ROI Calculator) -> Email Capture -> Free Signup
- Free Signup -> Onboarding (Add Property -> Add Unit -> Invite Tenant)
- Aha Moment: First auto-generated invoice + tenant payment via Xendit
- Room Limit (5) -> Upgrade Prompt -> Basic/Professional Subscription
- Satisfied User -> Referral Code Share -> New User -> Loop

### 11. Marketing Psychology Principles (NEW -- via marketing-psychology skill)

Applied psychology principles for SiHuni context:
- **Zero-Price Effect**: Free tier removes all risk for price-sensitive Indonesian owners
- **Endowment Effect**: 14-day trial creates ownership; harder to leave
- **Loss Aversion**: "Jangan kehilangan data penyewa" framing
- **IKEA Effect**: Owner customizes properties/units = higher perceived value
- **Goal-Gradient Effect**: Onboarding progress bar (property -> unit -> tenant -> invoice)
- **Bandwagon Effect**: "500+ pemilik kos sudah menggunakan SiHuni" social proof
- **Mere Exposure Effect**: Consistent brand presence via TikTok + Facebook
- **Jobs to Be Done**: Owner doesn't want "software" -- wants "peace of mind about rent payments"

### 12. Key Metrics & KPIs (Diperkaya via startup-metrics-framework skill)

#### 12.1 North Star Metric
**Active Properties with Auto-Invoicing** -- captures core value delivered

#### 12.2 SaaS Metrics Dashboard

| Metric | Formula | Target (Month 6) |
|--------|---------|-------------------|
| **MRR** | Active Subscriptions x Monthly Price | Rp 10M |
| **CAC** | Marketing Spend / New Signups | < Rp 50.000 |
| **LTV** | ARPU x Avg Lifetime x Gross Margin | > Rp 1.500.000 |
| **LTV:CAC** | LTV / CAC | > 3.0 |
| **Activation Rate** | % signups adding first tenant in 24h | > 40% |
| **Free-to-Paid Conversion** | % free upgrading within 90 days | > 5% |
| **Monthly Churn** | Cancelled / Total Active | < 2% |
| **Referral K-Factor** | Invites/User x Conversion Rate | > 0.5 |
| **Net Dollar Retention** | (ARR Start + Expansion - Churn) / ARR Start | > 100% |

#### 12.3 Marketplace Metrics (NEW)
- GMV (Gross Merchandise Value) from vendor orders
- Take Rate (platform commission from vendor marketplace)
- Vendor fill rate (orders fulfilled / orders placed)

#### 12.4 Reporting Cadence (dari startup-metrics-framework skill)
- Daily: MRR, active users, signups
- Weekly: Growth rates, retention cohorts, referral metrics
- Monthly: Full metric suite, funnel analysis
- Quarterly: Strategy review, pricing review

### 13. Competitor Comparison Pages Strategy (NEW -- via competitor-alternatives skill)

SEO-driven comparison pages to capture high-intent traffic:

| Page | URL Pattern | Target Keywords |
|------|------------|----------------|
| SiHuni vs Excel | `/vs/excel` | "aplikasi kos vs excel" |
| SiHuni vs WhatsApp Management | `/vs/whatsapp` | "manajemen kos tanpa whatsapp" |
| Alternatives to Manual Kos Management | `/alternatives/manual` | "alternatif manajemen kos manual" |
| Best Kos Management Apps 2026 | `/blog/best-kos-apps` | "aplikasi manajemen kos terbaik" |

### 14. Marketplace Marketing Strategy (NEW)

For the vendor marketplace feature:
- Vendor acquisition: Partner with local kos suppliers (AC repair, laundry, cleaning)
- Tenant awareness: In-app marketplace discovery (order products/services from dashboard)
- Cross-sell: When maintenance request created, suggest relevant vendor products
- Platform fee: 5% commission on vendor orders (already implemented)

### 15. Assumptions, Risks & Constraints (Diperbarui)
- **Assumption**: Indonesian kos owners will adopt digital tools (evidence: smartphone penetration >70%)
- **Assumption**: Free tier converts at >5% (industry benchmark for vertical SaaS)
- **Risk**: Low tech literacy among older owners -- mitigation: WhatsApp onboarding support
- **Risk**: Payment gateway friction -- mitigation: Multiple payment methods (VA, QRIS, e-wallet)
- **Constraint**: Limited marketing budget -- heavy reliance on organic + referral growth
- **Constraint**: Indonesian market specific -- content must be 100% Bahasa Indonesia

---

## Skills yang Digunakan

| Skill | Penerapan |
|-------|-----------|
| `marketing-ideas` | 139 proven strategies mapped to SiHuni's stage (early/growth), budget (low), and timeline |
| `pricing-strategy` | Value metric analysis, Good-Better-Best framework, pricing psychology, tier differentiation |
| `referral-program` | Referral loop design, trigger moments, double-sided rewards, K-Factor tracking |
| `content-strategy` | 5 content pillars, hub-and-spoke structure, keyword research by buyer stage |
| `launch-strategy` | ORB framework, five-phase launch, Product Hunt checklist |
| `startup-metrics-framework` | North Star metric, SaaS metrics (MRR/CAC/LTV/NDR), reporting cadence |
| `marketing-psychology` | 12 applied mental models (zero-price, endowment, loss aversion, IKEA, bandwagon) |
| `competitive-landscape` | Porter's Five Forces, Blue Ocean Strategy, positioning map, positioning statement |
| `competitor-alternatives` | Competitor comparison page strategy for SEO |
| `email-sequence` | 4 email sequences (onboarding, payment, win-back, upgrade) |
| `social-content` | Platform selection, content pillars for social, hook formulas, content calendar |
| `free-tool-strategy` | 4 free tools for lead generation (calculator, template, analyzer) |
| `sales-automator` | Cold outreach templates for enterprise/large property owners |
| `seo-content-writer` | SEO-optimized content guidelines for blog articles |

---

## Hasil Akhir

Dokumen marketing strategy lengkap (~1200+ baris) mencakup: competitive analysis (Porter's Five Forces + Blue Ocean), 4 pricing tiers aktual dari database, referral program architecture, 4 free marketing tools, 5 content pillars, social media strategy (TikTok/Facebook/Instagram), 4 email sequences, 5-phase GTM launch, 12 applied marketing psychology principles, 15+ SaaS/marketplace KPIs, competitor comparison page strategy, dan vendor marketplace marketing -- menggantikan dokumen v1.0 yang berisi klaim fitur tidak ada (OCR, Scoring) dan data pricing salah.

