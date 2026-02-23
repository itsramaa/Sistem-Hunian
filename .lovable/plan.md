
# Redesign Profile, Billing, Settings & Dashboard -- "Warm Luxury Futurism"

Menerapkan glassmorphism, gradient accents, rounded-2xl corners, dan pill-style tabs ke seluruh modul Profile, Billing, Settings, dan Dashboard beserta semua komponen terkait.

---

## BAGIAN A: Dashboard Page Redesign

### 1. Dashboard.tsx (Merchant)
- Welcome section: glassmorphic card with gradient mesh background (`bg-card/90 backdrop-blur-sm rounded-2xl border border-border/40`)
- Refresh button: `rounded-xl`
- Subscription + Trial widgets grid: verify glass treatment
- Key Metrics (4 cards): upgrade to `bg-card/90 backdrop-blur-sm rounded-2xl border border-border/40`
- Icon containers: `rounded-xl bg-gradient-to-br from-[color]/20 to-[color]/5` (replace plain icon)
- Progress bars: `rounded-full` with color-coded fills
- Property Overview card: `rounded-2xl bg-card/90 backdrop-blur-sm border border-border/40`
- Property items: `rounded-xl hover:bg-primary/5 p-3` with glass hover
- Financial Summary card: `rounded-2xl bg-card/90 backdrop-blur-sm border border-border/40`
- Revenue box: `rounded-xl bg-card/80 backdrop-blur-sm border border-border/40` (from `rounded-lg border`)
- Growth badge: `rounded-full`
- "View Reports" button: `gradient-cta rounded-xl`
- Empty state: glassmorphic with icon

### 2. SubscriptionWidget.tsx
- Card: `rounded-2xl bg-card/90 backdrop-blur-sm border border-border/40`
- Tier badges: `rounded-full`
- Trial alert: `rounded-xl` (already close)
- Usage Progress bars: ensure `rounded-full`
- Buttons: `rounded-xl`, Upgrade = `gradient-cta`
- Cancel icon button: `rounded-xl`

### 3. TrialCountdownWidget.tsx
- Cards: `rounded-2xl` (from default)
- Icon circle: `rounded-xl` (from `rounded-full`)
- Buttons: `rounded-xl`

### 4. InteractiveDashboardCharts.tsx
- Quick stat cards (4): `rounded-2xl bg-card/90 backdrop-blur-sm border border-border/40`
- Icon containers: `rounded-xl bg-gradient-to-br`
- Badges: `rounded-full`
- TabsList: pill-style `rounded-full bg-card/80 backdrop-blur-sm border border-border/40 p-1`
- TabsTrigger: `rounded-full` active gradient
- Chart cards: `rounded-2xl bg-card/90 backdrop-blur-sm border border-border/40`
- Select: `rounded-xl bg-background/60`
- Tooltip: `rounded-xl backdrop-blur-sm`

---

## BAGIAN B: Profile Page Redesign

### 5. Profile.tsx (Merchant)
- TabsList: pill-style `rounded-full bg-card/80 backdrop-blur-sm border border-border/40 p-1`
- TabsTrigger: `rounded-full` with active gradient
- Merchant Code card: `rounded-2xl bg-card/90 backdrop-blur-sm border border-border/40`
- Code display: `rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20` with large tracking
- Copy button: `rounded-xl`
- Business Profile card: `rounded-2xl bg-card/90 backdrop-blur-sm border border-border/40`
- All inputs: `rounded-xl bg-background/60 border-border/50`
- All selects: `rounded-xl bg-background/60`
- Save buttons: `gradient-cta rounded-xl`
- Contact card: `rounded-2xl bg-card/90 backdrop-blur-sm border border-border/40`
- Verification Status card: `rounded-2xl bg-card/90 backdrop-blur-sm border border-border/40`
- Verification badges: `rounded-full`
- Required docs list: `rounded-xl bg-card/80 backdrop-blur-sm border border-border/40 p-4` (from `bg-muted/50`)
- Doc checklist items: pill check icons with gradient fills
- Uploaded documents: `rounded-xl bg-card/80 backdrop-blur-sm border border-border/40` (from `rounded-lg border`)
- Delete button: `rounded-full`
- Banking tab: passes through to BankAccountManager (already styled)

---

## BAGIAN C: Billing Page Redesign

### 6. Billing.tsx (Merchant)
- Payout section divider: `rounded-2xl bg-card/90 backdrop-blur-sm border border-border/40 p-6` (from plain `border-t`)
- Section heading: styled with gradient icon

### 7. BillingDashboard.tsx
- TabsList: pill-style `rounded-full bg-card/80 backdrop-blur-sm border border-border/40 p-1`
- TabsTrigger: `rounded-full` active gradient
- All cards: `rounded-2xl bg-card/90 backdrop-blur-sm border border-border/40`
- Usage placeholder: glass card

### 8. SubscriptionDetails.tsx
- Card: `rounded-2xl bg-card/90 backdrop-blur-sm border border-border/40`
- Plan/Calendar info boxes: `rounded-xl bg-card/80 backdrop-blur-sm border border-border/40` (from `rounded-md border`)
- Icon containers: `rounded-xl bg-gradient-to-br from-primary/20 to-primary/5`
- Usage box: `rounded-xl` glass treatment
- Past due alert: `rounded-xl`
- Status badge: `rounded-full`
- Cancel button: `rounded-xl`
- Update Payment button: `rounded-xl`
- No subscription card: glass with `gradient-cta` "Subscribe Now" button

### 9. PricingTable.tsx
- Plan cards: `rounded-2xl bg-card/90 backdrop-blur-sm border border-border/40`
- Current plan card: `border-primary/50 ring-2 ring-primary/20 shadow-lg shadow-primary/10`
- "Current Plan" badge: `rounded-full` positioned top-right
- Price text: larger, with gradient accent
- Feature check icons: gradient-colored circles
- Feature list items: `rounded-full bg-primary/5 px-3 py-1` pill style
- Upgrade button: `gradient-cta rounded-xl`
- Current plan button: `rounded-xl outline`

### 10. InvoiceList.tsx
- Table wrapper: `glass-table rounded-2xl overflow-hidden`
- Header: `bg-gradient-to-r from-muted/80 to-muted/40`, uppercase tracking
- Rows: `hover:bg-primary/5`
- Status badges: `rounded-full`
- PDF button: `rounded-xl`
- Pagination buttons: `rounded-xl`
- Empty state: glassmorphic

---

## BAGIAN D: Settings Page Redesign

### 11. Settings.tsx (Merchant)
- TabsList: pill-style `rounded-full bg-card/80 backdrop-blur-sm border border-border/40 p-1`
- TabsTrigger: `rounded-full` active gradient

**Theme tab:**
- Card: `rounded-2xl bg-card/90 backdrop-blur-sm border border-border/40`
- Theme selector cards: `rounded-2xl` (from `rounded-md`), glass treatment
- Preview boxes: `rounded-xl` (from `rounded-md`)
- Selected state: `border-primary ring-2 ring-primary/20`

**Security tab:**
- Card: `rounded-2xl bg-card/90 backdrop-blur-sm border border-border/40`
- Icon in title: `gradient-icon-box` mini
- Success alert: `rounded-xl bg-success/10 border border-success/20`
- Error messages: `rounded-lg`
- All inputs: `rounded-xl bg-background/60 border-border/50`
- "Change Password" button: `gradient-cta rounded-xl`

### 12. MerchantNotificationSettings.tsx
- All cards: `rounded-2xl bg-card/90 backdrop-blur-sm border border-border/40`
- Channel items: `rounded-xl bg-card/80 backdrop-blur-sm border border-border/40` (from `rounded-lg border`)
- Icon circles: `rounded-xl bg-gradient-to-br` (from `rounded-full`)
- Active badge: `rounded-full`
- WhatsApp dashed section: `rounded-xl border-dashed border-border/50 bg-background/40 backdrop-blur-sm`
- Phone input: `rounded-xl bg-background/60`
- Reminder schedule items: `rounded-xl bg-card/80 backdrop-blur-sm border border-border/40`
- Event notification items: `rounded-xl bg-card/80 backdrop-blur-sm border border-border/40`
- Save button: `gradient-cta rounded-xl`

---

## BAGIAN E: PageHeader Enhancement

### 13. PageHeader.tsx
- Icon container: upgrade to `gradient-icon-box` pattern -- `rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20`
- Already mostly styled, just enhance the gradient on icon box

---

## Ringkasan File yang Diubah

| No | File | Perubahan |
|----|------|-----------|
| 1 | `Dashboard.tsx` | Glassmorphic metrics, gradient icons, glass revenue box |
| 2 | `SubscriptionWidget.tsx` | rounded-2xl card, gradient-cta, rounded-full badges |
| 3 | `TrialCountdownWidget.tsx` | rounded-2xl, rounded-xl icons |
| 4 | `InteractiveDashboardCharts.tsx` | Glass stat cards, pill tabs, glass charts |
| 5 | `Profile.tsx` | Pill tabs, glass cards, gradient merchant code, glass docs |
| 6 | `Billing.tsx` | Glass payout section |
| 7 | `BillingDashboard.tsx` | Pill tabs, glass cards |
| 8 | `SubscriptionDetails.tsx` | Glass info boxes, gradient icons, rounded-full badge |
| 9 | `PricingTable.tsx` | Glass plan cards, gradient-cta, pill features |
| 10 | `InvoiceList.tsx` | glass-table, gradient header, rounded-full badges |
| 11 | `Settings.tsx` | Pill tabs, glass theme cards, glass security, gradient-cta |
| 12 | `MerchantNotificationSettings.tsx` | Glass cards, gradient icons, gradient-cta |
| 13 | `PageHeader.tsx` | Enhanced gradient icon box |

## Urutan Implementasi

1. PageHeader enhancement (affects all pages)
2. Dashboard page + SubscriptionWidget + TrialCountdownWidget + InteractiveDashboardCharts
3. Profile page (all tabs)
4. Billing page + BillingDashboard + SubscriptionDetails + PricingTable + InvoiceList
5. Settings page + MerchantNotificationSettings
