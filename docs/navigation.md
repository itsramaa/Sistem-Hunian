# Merchant Navigation & Component Tree

This document maps the **Merchant (Pemilik Properti)** sidebar navigation to the codebase structure.

> **Architecture:** Hub-and-Spoke pattern — sidebar shows 10 main items across 6 groups.
> Related modules are consolidated into **Hub Pages** using Shadcn `Tabs`.
> All original standalone routes remain for backward compatibility and deep-linking.

---

## Sidebar Structure (10 Items)

```text
Merchant Portal/
├── 1. Utama
│   └── Dashboard
├── 2. Manajemen Aset
│   ├── Properti & Unit          (Hub: Properties + Units)
│   ├── Penyewa & Okupansi       (Hub: Tenants + Move-Outs + Tenant Analytics)
│   └── Staf Operasional         (Guardians)
├── 3. Keuangan
│   ├── Transaksi & Tagihan      (Hub: Invoices + Payments)
│   └── Kontrak Sewa             (Contracts)
├── 4. Operasional
│   ├── Laporan Kerusakan        (Maintenance)
│   └── Kepatuhan & Legalitas    (Hub: Compliance + Data Quality)
├── 5. Wawasan Bisnis
│   ├── Analitik Performa        (Hub: Analytics Dashboard + Reports + Templates + Portfolio)
│   └── Intelijen AI             (Hub: ML Analytics + DSS Advisor + Market Intel + Risk + Tenant Quality)
└── 6. Bantuan
    └── Pusat Bantuan            (Hub: Documents + OCR Tutorial + Support)
```

---

## Navigation Config

**File:** `src/shared/components/layouts/navigation-config.ts`

Each hub item has an `activePatterns` array so the sidebar highlights correctly on sub-routes:

```typescript
interface NavItem {
  path: string;
  icon: LucideIcon;
  label: string;
  activePatterns?: string[];  // sub-routes that activate this item
}
```

**Active path logic:** `isPathActive()` in the same file + `nav-main.tsx` checks both `path` prefix and `activePatterns`.

---

## Hub Pages & Embedded Modules

### 1. Dashboard (standalone)

| | |
|---|---|
| **Path** | `/merchant` |
| **Page** | `pages/merchant/Dashboard.tsx` |
| **Components** | `InteractiveDashboardCharts`, `VacancyDashboard`, `SubscriptionWidget`, `TrialCountdownWidget` |
| **Hooks** | `useMerchantDashboardStats`, `useAnalytics`, `useAuth` |

---

### 2. Properti & Unit — AssetsHub

| | |
|---|---|
| **Path** | `/merchant/assets` |
| **Hub Page** | `pages/merchant/AssetsHub.tsx` |
| **Tabs** | `#properties` · `#units` |

**Tab: Properti** — lazy-loads `pages/merchant/Properties.tsx`

| Feature Components | Location |
|---|---|
| PropertyCard, PropertyFilters, PropertyFormDialog | `features/properties/components/` |
| PropertyImportDialog, PropertyTable, UnitsManager | `features/properties/components/` |
| DeletePropertyDialog, PropertiesPageSkeleton | `features/properties/components/` |
| SubscriptionLimitWarning | `features/subscriptions/components/` |
| useMerchantProperties | `features/properties/hooks/` |
| useSubscriptionLimits | `features/subscriptions/hooks/` |

Sub-page: **Property Detail** (`/merchant/properties/:id`) — `pages/merchant/PropertyDetail.tsx`

**Tab: Unit** — lazy-loads `pages/merchant/Units.tsx`

| Feature Components | Location |
|---|---|
| UnitCard, UnitFilters, UnitFormDialog | `features/properties/components/` |
| UnitImportDialog, UnitsStats, UnitsTable | `features/properties/components/` |
| useMerchantProperties, useMerchantUnits | `features/properties/hooks/` |

---

### 3. Penyewa & Okupansi — OccupancyHub

| | |
|---|---|
| **Path** | `/merchant/occupancy` |
| **Hub Page** | `pages/merchant/OccupancyHub.tsx` |
| **Tabs** | `#tenants` · `#move-outs` · `#analytics` |

**Tab: Penyewa** — lazy-loads `pages/merchant/Tenants.tsx`

| Feature Components | Location |
|---|---|
| TenantsTable | `features/users/components/tables/` |
| InvitationsTable, InviteTenantDialog, AddTenantDialog | `features/users/components/tenant/` |
| TenantDetailsDialog, TenantsFilters, TenantStats | `features/users/components/tenant/` |

**Tab: Pindah Keluar** — lazy-loads `pages/merchant/MoveOuts.tsx`

| Feature Components | Location |
|---|---|
| EarlyTerminationReviewDialog, EarlyTerminationsList | `features/contracts/components/` |
| MoveOutInspectionForm, ScheduleInspectionDialog | `features/properties/components/` |
| MoveOutsTable, MoveOutsFilters | `features/contracts/components/` |
| VacancyDashboard | `features/dashboard/components/` |
| useMerchantMoveOuts | `features/contracts/hooks/` |

Sub-page: **Move Out Detail** (`/merchant/move-outs/:id`) — `pages/merchant/MoveOutDetail.tsx`

**Tab: Analitik Penyewa** — lazy-loads `pages/merchant/TenantAnalytics.tsx`

---

### 4. Staf Operasional (standalone)

| | |
|---|---|
| **Path** | `/merchant/guardians` |
| **Page** | `pages/merchant/Guardians.tsx` |
| **Components** | `GuardianFormDialog` |
| **Hooks** | `useGuardians`, `useMerchantProperties` |

---

### 5. Transaksi & Tagihan — TransactionsHub

| | |
|---|---|
| **Path** | `/merchant/transactions` |
| **Hub Page** | `pages/merchant/TransactionsHub.tsx` |
| **Tabs** | `#invoices` · `#payments` |

**Tab: Tagihan** — lazy-loads `pages/merchant/Invoices.tsx`

| Feature Components | Location |
|---|---|
| CreateInvoiceDialog, InvoiceDetailsDialog | `features/payments/components/` |
| InvoicesFilters, InvoicesStats, InvoicesTable | `features/payments/components/` |
| useInvoiceActions | `features/payments/hooks/` |

Sub-page: **Invoice Detail** (`/merchant/invoices/:id`) — `pages/merchant/InvoiceDetail.tsx`

**Tab: Pembayaran** — lazy-loads `pages/merchant/Payments.tsx`

| Feature Components | Location |
|---|---|
| MarkPaidDialog, OverdueInvoicesTable, PaymentPlanDialog | `features/payments/components/` |
| PaymentsFilters, PaymentsStats, PaymentsTable | `features/payments/components/` |
| useMerchantPayments | `features/payments/hooks/` |

Sub-pages: **Payment Detail** (`/merchant/payments/:id`), **Escrow** (`/merchant/escrow`)

---

### 6. Kontrak Sewa (standalone)

| | |
|---|---|
| **Path** | `/merchant/contracts` |
| **Page** | `pages/merchant/Contracts.tsx` |
| **Components** | `ContractsTable`, `ContractsFilters`, `ContractStats`, `CreateContractDialog`, `DeleteContractDialog`, `SignContractDialog` |
| **Hooks** | `useContractActions`, `usePropertiesWithUnits`, `useMerchantTenants` |

Sub-page: **Contract Detail** (`/merchant/contracts/:id`) — `pages/merchant/ContractDetail.tsx`

---

### 7. Laporan Kerusakan (standalone)

| | |
|---|---|
| **Path** | `/merchant/maintenance` |
| **Page** | `pages/merchant/Maintenance.tsx` |
| **Components** | `MaintenanceRequestTable`, `MaintenanceStats`, `UpdateMaintenanceDialog`, `MaintenanceFilters` |
| **Hooks** | `useMerchantMaintenanceRequests`, `useVerifiedVendors` |

Sub-page: **Maintenance Detail** (`/merchant/maintenance/:id`) — `pages/merchant/MaintenanceDetail.tsx`

---

### 8. Kepatuhan & Legalitas — LegalHub

| | |
|---|---|
| **Path** | `/merchant/legal` |
| **Hub Page** | `pages/merchant/LegalHub.tsx` |
| **Tabs** | `#compliance` · `#data-quality` |

**Tab: Kepatuhan** — lazy-loads `pages/merchant/PropertyCompliance.tsx`

| Feature Components | Location |
|---|---|
| useComplianceSummary, useOcrCompliance | `features/compliance/hooks/` |
| complianceService | `features/compliance/services/` |
| useMerchantProperties | `features/properties/hooks/` |

**Tab: Validasi Data** — lazy-loads `pages/merchant/DataQualityHistory.tsx`

| Feature Components | Location |
|---|---|
| useDataQualityCheck, useLatestQualityCheck | `features/properties/hooks/` |
| propertyService | `features/properties/services/` |

---

### 9. Analitik Performa — AnalyticsHub

| | |
|---|---|
| **Path** | `/merchant/analytics` |
| **Hub Page** | `pages/merchant/AnalyticsHub.tsx` |
| **Tabs** | `#summary` · `#reports` · `#templates` · `#portfolio` |

**Tab: Ringkasan** — lazy-loads `pages/merchant/AnalyticsDashboard.tsx`

| Hooks | Location |
|---|---|
| useAnalyticsProperties, useAnalyticsUnits | `features/analytics/hooks/` |
| useAnalyticsContracts, useAnalyticsTenantRiskScores | `features/analytics/hooks/` |
| useAnalyticsDisasterRisk | `features/analytics/hooks/` |

**Tab: Laporan** — lazy-loads `pages/merchant/Reports.tsx`

| Feature Components | Location |
|---|---|
| TenantChurnAnalytics, OnTimePaymentRate, RevenueForecast | `features/analytics/components/` |
| ContractNoticePeriod | `features/contracts/components/` |
| useReportsData, useReportExports | `features/analytics/hooks/` |

**Tab: Template** — lazy-loads `pages/merchant/ReportTemplates.tsx`

| Hooks | Location |
|---|---|
| useExecutiveSummary, usePropertyAnalysis | `features/analytics/hooks/` |
| useFinancialPerformance, useRiskAssessment | `features/analytics/hooks/` |
| useInvestmentOpportunity | `features/analytics/hooks/` |

**Tab: Portfolio** — lazy-loads `pages/merchant/ComparativePortfolio.tsx`

| Hooks | Location |
|---|---|
| useComparativePortfolio | `features/analytics/hooks/` |

---

### 10. Intelijen AI — AiInsightsHub

| | |
|---|---|
| **Path** | `/merchant/ai-insights` |
| **Hub Page** | `pages/merchant/AiInsightsHub.tsx` |
| **Tabs** | `#predictions` · `#strategy` · `#market` · `#risk` · `#tenant-score` |

**Tab: Prediksi** — lazy-loads `pages/merchant/MlAnalytics.tsx`

| Feature Components | Location |
|---|---|
| TierGate | `features/dss/components/` |
| useRevenueForecast, useTenantRiskScores | `features/dss/hooks/` |
| useChurnPrediction, useOptimalPricing | `features/dss/hooks/` |
| useModelRunHistory | `features/dss/hooks/` |

**Tab: Strategi** — lazy-loads `pages/merchant/DssAdvisor.tsx`

| Feature Components | Location |
|---|---|
| DssReadinessCard, TierGate | `features/dss/components/` |
| useDssReadiness, usePricingAdvisor | `features/dss/hooks/` |
| useCollectionStrategy, useMaintenancePriority | `features/dss/hooks/` |
| useInvestmentInsight, useDssRecommendations | `features/dss/hooks/` |

**Tab: Tren Pasar** — lazy-loads `pages/merchant/MarketIntelligence.tsx`

| Feature Components | Location |
|---|---|
| TierGate | `features/dss/components/` |
| usePriceIntelligence, useOccupancyForecast | `features/dss/hooks/` |

**Tab: Risiko** — lazy-loads `pages/merchant/FinancialRiskAnalytics.tsx`

| Feature Components | Location |
|---|---|
| TierGate | `features/dss/components/` |
| useFinancialAnalytics, useRiskAssessment | `features/dss/hooks/` |

**Tab: Skor Penyewa** — lazy-loads `pages/merchant/TenantQualityScoring.tsx`

| Feature Components | Location |
|---|---|
| TierGate | `features/subscriptions/components/` |
| useMerchantTier, useTenantQualityScoring | `features/dss/hooks/` |

---

### 11. Pusat Bantuan — HelpHub

| | |
|---|---|
| **Path** | `/merchant/help` |
| **Hub Page** | `pages/merchant/HelpHub.tsx` |
| **Tabs** | `#documents` · `#ocr` · `#support` |

**Tab: Dokumen** — lazy-loads `pages/merchant/DocumentCenter.tsx`

| Feature Components | Location |
|---|---|
| OcrDocumentViewer, OcrResultEditor | `features/dss/components/` |
| useOcrResults, useUpdateOcrResult | `features/dss/hooks/` |

**Tab: Panduan OCR** — lazy-loads `pages/merchant/OcrTutorial.tsx`

**Tab: Dukungan** — lazy-loads `pages/merchant/Support.tsx`

---

## Secondary / User Menu (Not in Sidebar mainNav)

### Profile

| | |
|---|---|
| **Path** | `/merchant/profile` |
| **Page** | `pages/merchant/Profile.tsx` |
| **Components** | `BankAccountManager` (`features/payments/components/`) |

### Settings

| | |
|---|---|
| **Path** | `/merchant/settings` |
| **Page** | `pages/merchant/Settings.tsx` |
| **Components** | `MerchantNotificationSettings`, `BankAccountManager`, `DisbursementScheduleSettings` |

### Billing

| | |
|---|---|
| **Path** | `/merchant/billing` |
| **Page** | `pages/merchant/Billing.tsx` |
| **Components** | `BillingDashboard`, `DisbursementScheduleSettings`, `SuspensionWarningBanner` |

---

## Key Files

| File | Purpose |
|---|---|
| `src/shared/components/layouts/navigation-config.ts` | Sidebar items, groups, `activePatterns`, `isPathActive()` |
| `src/shared/components/layouts/sidebar/nav-main.tsx` | Renders sidebar, uses `activePatterns` for highlight |
| `src/shared/components/ui/PageSkeleton.tsx` | `ContentSkeleton` used as Suspense fallback in hubs |
| `src/shared/components/ui/PageHeader.tsx` | Consistent header for all hub & standalone pages |
| `src/App.tsx` | All routes (hub + standalone + detail sub-pages) |
