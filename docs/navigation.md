# Merchant Navigation & Component Tree

This document maps the **Merchant (Pemilik Properti)** sidebar navigation to the codebase structure.

> **Architecture:** Flat sidebar with direct links to standalone pages.
> High-frequency features (Properties, Tenants, Invoices, Payments, Contracts, Maintenance) each have their own sidebar item and standalone page.
> Low-frequency features (Compliance, Data Quality, OCR, Guardians) are accessible contextually from parent pages or secondary nav.
> InsightsHub is the only "hub" page — it uses a card-based landing that links to standalone analytical pages.

---

## Sidebar Structure (8 Items, 4 Groups)

```text
Merchant Portal/
├── Utama
│   ├── Dashboard
│   └── Properti              (standalone list page)
├── Operasional
│   ├── Penyewa               (standalone list page)
│   ├── Kontrak               (standalone list page)
│   └── Maintenance           (standalone list page)
├── Keuangan
│   ├── Tagihan               (standalone list page)
│   └── Pembayaran            (standalone list page)
└── Wawasan
    └── Analitik              (card-based landing → sub-pages)
```

### Secondary Nav (sidebar footer)
- Support (`/merchant/support`)
- Feedback (`mailto:support@sihuni.com`)

### User Menu (NavUser dropdown)
- Profile (`/merchant/profile`)
- Billing (`/merchant/billing`)
- Settings (`/merchant/settings`)

---

## Navigation Config

**File:** `src/shared/components/layouts/navigation-config.ts`

Each nav item supports `activePatterns` for sidebar highlighting on related sub-routes:

```typescript
interface NavItem {
  path: string;
  icon: LucideIcon;
  label: string;
  activePatterns?: string[];
}
```

**Active path logic:** `isPathActive()` in the same file + `nav-main.tsx`.

---

## Page Inventory

### 1. Dashboard (standalone)

| | |
|---|---|
| **Path** | `/merchant` |
| **Page** | `pages/merchant/Dashboard.tsx` |
| **Components** | `InteractiveDashboardCharts`, `VacancyDashboard`, `SubscriptionWidget`, `TrialCountdownWidget` |

---

### 2. Properti (standalone)

| | |
|---|---|
| **Path** | `/merchant/properties` |
| **Page** | `pages/merchant/Properties.tsx` |
| **Detail** | `/merchant/properties/:id` → `pages/merchant/PropertyDetail.tsx` |
| **Related** | Units (`/merchant/units`) — accessible from Property Detail |
| **Detail Tabs** | 5 primary tabs + "Lainnya" dropdown (Staf, Kepatuhan) |

---

### 3. Penyewa (standalone)

| | |
|---|---|
| **Path** | `/merchant/tenants` |
| **Page** | `pages/merchant/Tenants.tsx` |
| **Related** | Move-Outs (`/merchant/move-outs`), Tenant Analytics (`/merchant/tenant-analytics`) |

---

### 4. Kontrak (standalone)

| | |
|---|---|
| **Path** | `/merchant/contracts` |
| **Page** | `pages/merchant/Contracts.tsx` |
| **Detail** | `/merchant/contracts/:id` → `pages/merchant/ContractDetail.tsx` |

---

### 5. Maintenance (standalone)

| | |
|---|---|
| **Path** | `/merchant/maintenance` |
| **Page** | `pages/merchant/Maintenance.tsx` |
| **Detail** | `/merchant/maintenance/:id` → `pages/merchant/MaintenanceDetail.tsx` |

---

### 6. Tagihan (standalone)

| | |
|---|---|
| **Path** | `/merchant/invoices` |
| **Page** | `pages/merchant/Invoices.tsx` |
| **Detail** | `/merchant/invoices/:id` → `pages/merchant/InvoiceDetail.tsx` |

---

### 7. Pembayaran (standalone)

| | |
|---|---|
| **Path** | `/merchant/payments` |
| **Page** | `pages/merchant/Payments.tsx` |
| **Detail** | `/merchant/payments/:id` → `pages/merchant/PaymentDetail.tsx` |
| **Related** | Escrow (`/merchant/escrow`) |

---

### 8. Analitik — InsightsHub (card-based landing)

| | |
|---|---|
| **Path** | `/merchant/insights` |
| **Page** | `pages/merchant/InsightsHub.tsx` |
| **Pattern** | Card grid with 2 sections (Performa + Intelijen AI), each card links to a standalone page |

**Performa cards:**
- Ringkasan Analitik → `/merchant/analytics-dashboard`
- Laporan → `/merchant/reports`
- Template Laporan → `/merchant/report-templates`
- Portofolio Komparatif → `/merchant/comparative-portfolio`

**Intelijen AI cards:**
- Prediksi ML → `/merchant/ml-analytics`
- Strategi DSS → `/merchant/dss-advisor`
- Tren Pasar → `/merchant/market-intelligence`
- Risiko Keuangan → `/merchant/financial-risk`
- Skor Penyewa → `/merchant/tenant-quality`

---

## PropertyDetail Tab Structure (Progressive Disclosure)

```text
Primary Tabs (always visible):
  Overview | Unit | Tenant | Keuangan | Maintenance

"Lainnya" Dropdown (progressive disclosure):
  ├─ Staf (Guardians)
  └─ Kepatuhan (Compliance + Data Quality)
```

Deep links via URL hash (`#guardians`, `#compliance`) auto-select the correct tab.

---

## Contextual / Secondary Pages (no sidebar item)

| Page | Path | Access Point |
|---|---|---|
| Units | `/merchant/units` | Properties page / Property Detail |
| Unit Detail | `/merchant/units/:id` | Units list |
| Move-Outs | `/merchant/move-outs` | Tenants page |
| Move-Out Detail | `/merchant/move-outs/:id` | Move-Outs list |
| Tenant Analytics | `/merchant/tenant-analytics` | InsightsHub or Tenants page |
| Compliance | `/merchant/compliance` | Property Detail (Lainnya dropdown) |
| Data Quality | `/merchant/data-quality` | Property Detail (Lainnya dropdown) |
| Documents | `/merchant/documents` | Secondary nav or Dashboard |
| OCR Tutorial | `/merchant/ocr-tutorial` | Documents page |
| Escrow | `/merchant/escrow` | Payments page or Dashboard |
| Referrals | `/merchant/referrals` | User menu or Dashboard |
| Profile | `/merchant/profile` | User menu |
| Billing | `/merchant/billing` | User menu |
| Settings | `/merchant/settings` | User menu |

---

## Legacy Redirects (backward compatibility)

| Old Path | Redirects To |
|---|---|
| `/merchant/assets` | `/merchant/properties` |
| `/merchant/occupancy` | `/merchant/tenants` |
| `/merchant/finance` | `/merchant/invoices` |
| `/merchant/transactions` | `/merchant/invoices` |
| `/merchant/operations` | `/merchant/maintenance` |
| `/merchant/legal` | `/merchant/compliance` |
| `/merchant/analytics` | `/merchant/insights` |
| `/merchant/ai-insights` | `/merchant/insights` |
| `/merchant/help` | `/merchant/documents` |

---

## Key Files

| File | Purpose |
|---|---|
| `src/shared/components/layouts/navigation-config.ts` | Sidebar items, groups, `activePatterns`, `isPathActive()` |
| `src/shared/components/layouts/sidebar/nav-main.tsx` | Renders sidebar, uses `activePatterns` for highlight |
| `src/shared/components/ui/PageSkeleton.tsx` | `ContentSkeleton` used as Suspense fallback |
| `src/shared/components/ui/PageHeader.tsx` | Consistent header for all pages |
| `src/App.tsx` | All routes (standalone + detail + legacy redirects) |
