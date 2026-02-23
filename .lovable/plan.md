
# Redesign Reports, ML Analytics, DSS Advisor, OCR Tutorial + Seed Data

Menerapkan "Warm Luxury Futurism" ke seluruh modul Reports, ML Analytics, DSS Advisor, dan OCR Tutorial beserta semua shared DSS components.

---

## BAGIAN A: Redesign Reports Page

### 1. Reports.tsx (Merchant)
- PageHeader: tambahkan `gradient-icon-box` pada icon BarChart3
- Export button: `rounded-xl`
- DateRangePicker dan Select: `rounded-xl bg-background/60 border-border/50`
- TabsList: pill-style `rounded-full bg-card/80 backdrop-blur-sm border border-border/40 p-1`
- TabsTrigger: `rounded-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground`
- KPI stat cards (5 cards): `bg-card/90 backdrop-blur-sm rounded-2xl border border-border/40`
- Icon circles: `rounded-xl bg-gradient-to-br from-[color]/20 to-[color]/5` (replace rounded-full)
- Chart cards: `bg-card/90 backdrop-blur-sm rounded-2xl border border-border/40`
- Tooltip contentStyle: `borderRadius: '16px', backdropFilter: 'blur(8px)'`
- Alert: `rounded-xl`

### 2. RevenueForecast.tsx
- Card: `rounded-2xl bg-card/90 backdrop-blur-sm border border-border/40`
- Header projection box: `rounded-xl bg-primary/10 p-3`
- Icon: `gradient-icon-box` treatment
- Chart tooltip: `borderRadius: '16px'`
- Footer text: improved styling

### 3. TenantChurnAnalytics.tsx
- KPI cards (4): `bg-card/90 backdrop-blur-sm rounded-2xl border border-border/40`
- Icon containers: `rounded-xl bg-gradient-to-br` (from rounded-full)
- Chart cards (Churn Reasons, Expiring): `rounded-2xl bg-card/90 backdrop-blur-sm border border-border/40`
- Expiring contract items: `rounded-xl bg-card/80 backdrop-blur-sm border border-border/40 hover:border-primary/20`
- Badges: `rounded-full`
- Empty states: glassmorphic

### 4. OnTimePaymentRate.tsx
- Card: `rounded-2xl bg-card/90 backdrop-blur-sm border border-border/40`
- Icon container: `rounded-xl bg-gradient-to-br from-success/20 to-success/5`

### 5. ContractNoticePeriod.tsx
- Already partially styled (rounded-2xl, glassmorphic) -- verify consistency
- Contract items: ensure `rounded-xl` and hover effects
- Dialog: verify `rounded-2xl` and `gradient-cta` save button

---

## BAGIAN B: Redesign ML Analytics Page

### 6. MlAnalytics.tsx
- PageHeader: `gradient-icon-box`
- TabsList: pill-style `rounded-full bg-card/80 backdrop-blur-sm border border-border/40 p-1`
- TabsTrigger: `rounded-full` with active gradient
- All Cards: `rounded-2xl bg-card/90 backdrop-blur-sm border border-border/40`
- "Generate Forecast" button: `gradient-cta` (`rounded-xl bg-gradient-to-r from-primary to-primary/80 shadow-md`)
- Forecast prediction items: `rounded-xl bg-card/80 backdrop-blur-sm border border-border/40`
- Badges: `rounded-full`
- Risk score items: `rounded-xl bg-card/80 backdrop-blur-sm border border-border/40`
- Progress bars: rounded with gradient fills
- Churn prediction items: `rounded-xl bg-card/80 backdrop-blur-sm border border-border/40`
- Pricing suggestion items: `rounded-xl` with arrow highlight
- "Refresh All" button: `rounded-xl`
- Empty states: glassmorphic with icon + description

### 7. TierGate.tsx
- Locked card: `rounded-2xl bg-card/90 backdrop-blur-sm border border-dashed border-border/60`
- Lock icon: gradient treatment, larger (`h-12 w-12`)
- Badge: `rounded-full`
- Add "Upgrade" suggestion text

---

## BAGIAN C: Redesign DSS Advisor Page

### 8. DssAdvisor.tsx
- PageHeader: `gradient-icon-box` with Brain icon
- TabsList: pill-style `rounded-full bg-card/80 backdrop-blur-sm p-1`
- TabsTrigger: `rounded-full` active state
- Advisor Cards: `rounded-2xl bg-card/90 backdrop-blur-sm border border-border/40`
- "Generate" button: `gradient-cta`
- Recommendation items: `rounded-xl bg-card/80 backdrop-blur-sm border border-border/40 p-4`
- Status badges: `rounded-full` with proper color classes
- Confidence Progress: styled bar
- Accept/Dismiss buttons: `rounded-xl`, Accept = `gradient-cta` mini, Dismiss = ghost
- Date text: improved formatting
- Empty state: glassmorphic with Brain icon

### 9. RecommendationList.tsx (shared component)
- Already uses `RecommendationCard` -- the card component will be restyled
- Status badges overlay: `rounded-full`

### 10. RecommendationCard.tsx (shared)
- Card: `rounded-2xl bg-card/90 backdrop-blur-sm border-l-4 border border-border/40`
- Impact box: `rounded-xl bg-muted/30 backdrop-blur-sm`
- Action buttons: Accept = `rounded-xl gradient-cta`, Defer = `rounded-xl`, Reject = `rounded-xl`
- Lightbulb icon container: `gradient-icon-box` mini

---

## BAGIAN D: Redesign OCR Tutorial Page

### 11. OcrTutorial.tsx
- PageHeader: `gradient-icon-box`
- Progress bar: `rounded-full` with gradient fill track
- Step navigator buttons: `rounded-xl bg-card/80 backdrop-blur-sm border border-border/40` with active = `gradient-cta`
- Completed steps: `bg-primary/10 border-primary/30 text-primary`

**Step 0 (Document Types):**
- Info card: `rounded-2xl bg-card/90 backdrop-blur-sm border border-border/40`
- OCR type cards: `rounded-2xl bg-card/90 backdrop-blur-sm border border-border/40 hover:-translate-y-1 hover:shadow-lg transition-all duration-300`
- Selected: `ring-2 ring-primary border-primary/50`
- Icon wrapper: `rounded-xl bg-gradient-to-br` with type-specific colors
- Field badges: `rounded-full`
- Tier badge: `rounded-full`

**Step 1 (Upload):**
- Card: `rounded-2xl bg-card/90 backdrop-blur-sm border border-border/40`
- Upload area: `rounded-2xl border-2 border-dashed border-border/50 hover:border-primary/50 bg-background/40 backdrop-blur-sm`
- Tips box: `rounded-xl bg-muted/30 backdrop-blur-sm border border-border/30`

**Step 2 (AI Processing):**
- Card: `rounded-2xl bg-card/90 backdrop-blur-sm`
- Process box: `rounded-xl bg-card/80 backdrop-blur-sm border border-border/40`
- Step items: gradient checkmark circles
- How it works box: `rounded-xl bg-primary/5 border border-primary/20`

**Step 3 (Review):**
- Card: `rounded-2xl bg-card/90 backdrop-blur-sm`
- Extracted result table: `rounded-xl overflow-hidden border border-border/40`
- Row items: glass treatment
- Warning box: `rounded-xl bg-warning/10 border border-warning/20`
- Confirm button: `gradient-cta`

**Navigation buttons:**
- Previous: `rounded-xl` outline
- Next: `gradient-cta` with arrow

### 12. OcrUploadCard.tsx (shared component)
- Card: `rounded-2xl bg-card/90 backdrop-blur-sm border border-border/40`
- Drop area: `rounded-xl` with glass treatment
- Dragging state: `border-primary bg-primary/5 backdrop-blur-sm`
- Processing spinner: gradient ring animation
- Result section: glass treatment
- Field grid: `rounded-xl` items
- "Upload Lagi" button: `rounded-xl`
- "Lanjutkan" button: `gradient-cta`

---

## BAGIAN E: Redesign Shared DSS Components

### 13. ConfidenceBadge.tsx
- Add `rounded-full` to all badge variants
- Improve color contrast

### 14. RiskScoreIndicator.tsx
- Progress bar: `rounded-full`
- Score text: bolder treatment
- Label text: improved spacing

### 15. ExtractedField.tsx
- Container: `rounded-xl` (from rounded-lg)
- Glass treatment for needsReview state
- Badge alignment improvements

### 16. RiskDashboardWidgets.tsx
- KPI cards: `rounded-2xl bg-card/90 backdrop-blur-sm border border-border/40`
- Icon containers: `rounded-xl bg-gradient-to-br`
- Risk Score card: `rounded-2xl bg-card/90 backdrop-blur-sm border border-border/40`
- Revenue Forecast card: `rounded-2xl bg-card/90 backdrop-blur-sm border border-border/40`

---

## BAGIAN F: Seed Data (if needed)

Data seeding sudah mencukupi dari seed sebelumnya (invoices, payments, contracts, maintenance, move-outs). Tidak diperlukan seed tambahan karena:
- Reports page mengambil data dari invoices/payments/contracts yang sudah di-seed
- ML Analytics dan DSS Advisor menggunakan edge functions yang generate data on-demand
- OCR Tutorial adalah demo/tutorial statis
- Risk scores dan recommendations di-generate melalui button click

Jika diperlukan data untuk `dss_recommendations` dan `tenant_risk_scores` agar tampil langsung tanpa generate, maka akan di-seed:
1. **4 dss_recommendations** -- variasi type (pricing, collection, maintenance, investment) dan status (pending, accepted)
2. **2 tenant_risk_scores** -- untuk 2 tenant yang ada

---

## Ringkasan File yang Diubah

| No | File | Tipe | Perubahan |
|----|------|------|-----------|
| 1 | `Reports.tsx` (merchant) | EDIT | Glassmorphic KPIs, pill tabs, glass charts |
| 2 | `RevenueForecast.tsx` | EDIT | Glass card, gradient icon |
| 3 | `TenantChurnAnalytics.tsx` | EDIT | Glass KPIs, glass charts |
| 4 | `OnTimePaymentRate.tsx` | EDIT | Glass card, gradient icon |
| 5 | `MlAnalytics.tsx` | EDIT | Full glassmorphic redesign |
| 6 | `TierGate.tsx` | EDIT | Glass locked card |
| 7 | `DssAdvisor.tsx` | EDIT | Full glassmorphic redesign |
| 8 | `OcrTutorial.tsx` | EDIT | Full glassmorphic redesign |
| 9 | `OcrUploadCard.tsx` | EDIT | Glass card, drop area |
| 10 | `RecommendationCard.tsx` (shared) | EDIT | Glass card, gradient CTA |
| 11 | `RiskDashboardWidgets.tsx` | EDIT | Glass KPIs |
| 12 | `ConfidenceBadge.tsx` | EDIT | rounded-full |
| 13 | `RiskScoreIndicator.tsx` | EDIT | rounded-full progress |
| 14 | `ExtractedField.tsx` | EDIT | rounded-xl, glass |
| 15 | `RecommendationList.tsx` | EDIT | Badge rounded-full |
| 16 | DB Migration | SQL | Seed dss_recommendations + tenant_risk_scores |

## Urutan Implementasi

1. Seed data (dss_recommendations + tenant_risk_scores)
2. Shared DSS components (ConfidenceBadge, RiskScoreIndicator, ExtractedField, RecommendationCard)
3. RiskDashboardWidgets
4. Reports page + sub-components (RevenueForecast, TenantChurnAnalytics, OnTimePaymentRate)
5. ML Analytics page + TierGate
6. DSS Advisor page + RecommendationList
7. OCR Tutorial page + OcrUploadCard
