# Merchant Navigation & Component Tree

This document maps the **Merchant (Pemilik Properti)** sidebar navigation to the codebase structure.

Merchant Portal/
├── Utama/
│   └── Dashboard/
│       ├── Path: /merchant
│       ├── Page: pages/merchant/Dashboard.tsx
│       └── Feature Components/
│           ├── InteractiveDashboardCharts.tsx (features/dashboard/components/)
│           ├── VacancyDashboard.tsx (features/dashboard/components/)
│           ├── SubscriptionWidget.tsx (features/subscriptions/components/)
│           ├── TrialCountdownWidget.tsx (features/subscriptions/components/)
│           ├── useMerchantDashboardStats.ts (features/dashboard/hooks/)
│           ├── useAnalytics.ts (features/analytics/hooks/)
│           └── useAuth.ts (features/auth/hooks/)
│
├── Manajemen Properti/
│   ├── Properti Saya/
│   │   ├── Path: /merchant/properties
│   │   ├── Page: pages/merchant/Properties.tsx
│   │   ├── Feature Components/
│   │   │   ├── PropertyCard.tsx (features/properties/components/)
│   │   │   ├── PropertyFilters.tsx (features/properties/components/)
│   │   │   ├── PropertyFormDialog.tsx (features/properties/components/)
│   │   │   ├── PropertyImportDialog.tsx (features/properties/components/)
│   │   │   ├── PropertyTable.tsx (features/properties/components/)
│   │   │   ├── UnitsManager.tsx (features/properties/components/)
│   │   │   ├── DeletePropertyDialog.tsx (features/properties/components/)
│   │   │   ├── PropertiesPageSkeleton.tsx (features/properties/components/)
│   │   │   ├── SubscriptionLimitWarning.tsx (features/subscriptions/components/)
│   │   │   ├── useMerchantProperties.ts (features/properties/hooks/)
│   │   │   └── useSubscriptionLimits.ts (features/subscriptions/hooks/)
│   │   └── Sub-pages/
│   │       └── Property Detail/
│   │           ├── Page: pages/merchant/PropertyDetail.tsx
│   │           └── Feature Components/
│   │               ├── PropertyFinancialForm.tsx (features/properties/components/)
│   │               ├── PropertyFinancialMetrics.tsx (features/properties/components/)
│   │               ├── PropertyDetailSkeleton.tsx (features/properties/components/)
│   │               ├── DssReadinessCard.tsx (features/dss/components/)
│   │               ├── usePropertyDetail.ts (features/properties/hooks/)
│   │               └── useDssReadiness.ts (features/dss/hooks/)
│   │
│   ├── Kamar & Unit/
│   │   ├── Path: /merchant/units
│   │   ├── Page: pages/merchant/Units.tsx
│   │   └── Feature Components/
│   │       ├── UnitCard.tsx (features/properties/components/)
│   │       ├── UnitFilters.tsx (features/properties/components/)
│   │       ├── UnitFormDialog.tsx (features/properties/components/)
│   │       ├── UnitImportDialog.tsx (features/properties/components/)
│   │       ├── UnitsStats.tsx (features/properties/components/)
│   │       ├── UnitsTable.tsx (features/properties/components/)
│   │       ├── useMerchantProperties.ts (features/properties/hooks/)
│   │       └── useMerchantUnits.ts (features/properties/hooks/)
│   │
│   ├── Penyewa/
│   │   ├── Path: /merchant/tenants
│   │   ├── Page: pages/merchant/Tenants.tsx
│   │   └── Feature Components/
│   │       ├── TenantsTable.tsx (features/users/components/tables/)
│   │       ├── InvitationsTable.tsx (features/users/components/tenant/)
│   │       ├── InviteTenantDialog.tsx (features/users/components/tenant/)
│   │       ├── AddTenantDialog.tsx (features/users/components/tenant/)
│   │       ├── TenantDetailsDialog.tsx (features/users/components/tenant/)
│   │       ├── TenantsFilters.tsx (features/users/components/tenant/)
│   │       ├── TenantStats.tsx (features/users/components/tenant/)
│   │       └── useAuth.ts (features/auth/hooks/)
│   │
│   └── Staf Penjaga/
│       ├── Path: /merchant/guardians
│       ├── Page: pages/merchant/Guardians.tsx
│       └── Feature Components/
│           ├── GuardianFormDialog.tsx (features/properties/components/)
│           ├── useGuardians.ts (features/properties/hooks/)
│           └── useMerchantProperties.ts (features/properties/hooks/)
│
├── Operasional/
│   ├── Administrasi (Submenu)/
│   │   ├── Kontrak Sewa/
│   │   │   ├── Path: /merchant/contracts
│   │   │   ├── Page: pages/merchant/Contracts.tsx
│   │   │   ├── Feature Components/
│   │   │   │   ├── ContractsTable.tsx (features/contracts/components/)
│   │   │   │   ├── ContractsFilters.tsx (features/contracts/components/)
│   │   │   │   ├── ContractStats.tsx (features/contracts/components/)
│   │   │   │   ├── CreateContractDialog.tsx (features/contracts/components/)
│   │   │   │   ├── DeleteContractDialog.tsx (features/contracts/components/)
│   │   │   │   ├── SignContractDialog.tsx (features/contracts/components/)
│   │   │   │   ├── useContractActions.ts (features/contracts/hooks/)
│   │   │   │   ├── usePropertiesWithUnits.ts (features/properties/hooks/)
│   │   │   │   └── useMerchantTenants.ts (features/users/hooks/)
│   │   │   └── Sub-pages/
│   │   │       └── Contract Detail/
│   │   │           ├── Page: pages/merchant/ContractDetail.tsx
│   │   │           └── Feature Components/
│   │   │               ├── ContractStatusBadge.tsx (features/contracts/components/)
│   │   │               ├── SignatureStatusBadge.tsx (features/contracts/components/)
│   │   │               ├── ContractDocumentUpload.tsx (features/contracts/components/)
│   │   │               └── useMerchantContracts.ts (features/contracts/hooks/)
│   │   │
│   │   ├── Kepatuhan Legal/
│   │   │   ├── Path: /merchant/compliance
│   │   │   ├── Page: pages/merchant/PropertyCompliance.tsx
│   │   │   └── Feature Components/
│   │   │       ├── useComplianceSummary.ts (features/compliance/hooks/)
│   │   │       ├── useOcrCompliance.ts (features/compliance/hooks/)
│   │   │       ├── useMerchantProperties.ts (features/properties/hooks/)
│   │   │       └── complianceService.ts (features/compliance/services/)
│   │   │
│   │   └── Validasi Data/
│   │       ├── Path: /merchant/data-quality
│   │       ├── Page: pages/merchant/DataQualityHistory.tsx
│   │       └── Feature Components/
│   │           ├── useDataQualityCheck.ts (features/properties/hooks/)
│   │           ├── useLatestQualityCheck.ts (features/properties/hooks/)
│   │           └── propertyService.ts (features/properties/services/)
│   │
│   └── Layanan (Submenu)/
│       ├── Laporan Kerusakan/
│       │   ├── Path: /merchant/maintenance
│       │   ├── Page: pages/merchant/Maintenance.tsx
│       │   ├── Feature Components/
│       │   │   ├── MaintenanceRequestTable.tsx (features/maintenance/components/)
│       │   │   ├── MaintenanceStats.tsx (features/maintenance/components/)
│       │   │   ├── UpdateMaintenanceDialog.tsx (features/maintenance/components/)
│       │   │   ├── MaintenanceFilters.tsx (features/maintenance/components/)
│       │   │   ├── useMerchantMaintenanceRequests.ts (features/maintenance/hooks/)
│       │   │   └── useVerifiedVendors.ts (features/maintenance/hooks/)
│       │   └── Sub-pages/
│       │       └── Maintenance Detail/
│       │           ├── Page: pages/merchant/MaintenanceDetail.tsx
│       │           └── Feature Components/
│       │               ├── MaintenancePriorityBadge.tsx (features/maintenance/components/)
│       │               ├── MaintenanceStatusBadge.tsx (features/maintenance/components/)
│       │               ├── SLABadge.tsx (features/maintenance/components/)
│       │               ├── UpdateMaintenanceDialog.tsx (features/maintenance/components/)
│       │               └── UpdateTimeline.tsx (features/maintenance/components/)
│       │
│       └── Pindah Keluar/
│           ├── Path: /merchant/move-outs
│           ├── Page: pages/merchant/MoveOuts.tsx
│           ├── Feature Components/
│           │   ├── EarlyTerminationReviewDialog.tsx (features/contracts/components/)
│           │   ├── EarlyTerminationsList.tsx (features/contracts/components/)
│           │   ├── MoveOutInspectionForm.tsx (features/properties/components/)
│           │   ├── MoveOutsTable.tsx (features/contracts/components/)
│           │   ├── MoveOutsFilters.tsx (features/contracts/components/)
│           │   ├── VacancyDashboard.tsx (features/dashboard/components/)
│           │   ├── ScheduleInspectionDialog.tsx (features/properties/components/)
│           │   └── useMerchantMoveOuts.ts (features/contracts/hooks/)
│           └── Sub-pages/
│               └── Move Out Detail/
│                   ├── Page: pages/merchant/MoveOutDetail.tsx
│                   └── Feature Components/
│                       └── MoveOutStatusBadge.tsx (features/contracts/components/)
│
├── Keuangan/
│   ├── Transaksi (Submenu)/
│   │   ├── Tagihan/
│   │   │   ├── Path: /merchant/invoices
│   │   │   ├── Page: pages/merchant/Invoices.tsx
│   │   │   ├── Feature Components/
│   │   │   │   ├── CreateInvoiceDialog.tsx (features/payments/components/)
│   │   │   │   ├── InvoiceDetailsDialog.tsx (features/payments/components/)
│   │   │   │   ├── InvoicesFilters.tsx (features/payments/components/)
│   │   │   │   ├── InvoicesStats.tsx (features/payments/components/)
│   │   │   │   ├── InvoicesTable.tsx (features/payments/components/)
│   │   │   │   └── useInvoiceActions.ts (features/payments/hooks/)
│   │   │   └── Sub-pages/
│   │   │       └── Invoice Detail/
│   │   │           ├── Page: pages/merchant/InvoiceDetail.tsx
│   │   │           └── Feature Components/
│   │   │               └── useMerchantInvoices.ts (features/payments/hooks/)
│   │   │
│   │   └── Pembayaran Masuk/
│   │       ├── Path: /merchant/payments
│   │       ├── Page: pages/merchant/Payments.tsx
│   │       ├── Feature Components/
│   │       │   ├── MarkPaidDialog.tsx (features/payments/components/)
│   │       │   ├── OverdueInvoicesTable.tsx (features/payments/components/)
│   │       │   ├── PaymentPlanDialog.tsx (features/payments/components/)
│   │       │   ├── PaymentsFilters.tsx (features/payments/components/)
│   │       │   ├── PaymentsStats.tsx (features/payments/components/)
│   │       │   ├── PaymentsTable.tsx (features/payments/components/)
│   │       │   └── useMerchantPayments.ts (features/payments/hooks/)
│   │       └── Sub-pages/
│   │           ├── Payment Detail/
│   │           │   ├── Page: pages/merchant/PaymentDetail.tsx
│   │           │   └── Feature Components/
│   │           │       ├── MarkPaidDialog.tsx (features/payments/components/)
│   │           │       └── useMerchantPayments.ts (features/payments/hooks/)
│   │           └── Escrow (Tab)/
│   │               ├── Page: pages/merchant/Escrow.tsx
│   │               └── Feature Components/
│   │                   ├── DisbursementDialog.tsx (features/escrow/components/)
│   │                   ├── EscrowBalanceCards.tsx (features/escrow/components/)
│   │                   ├── EscrowFilters.tsx (features/escrow/components/)
│   │                   ├── EscrowTransactionsTable.tsx (features/escrow/components/)
│   │                   └── useMerchantEscrow.ts (features/escrow/hooks/)
│   │
│   └── Laporan (Submenu)/
│       ├── Laporan Keuangan/
│       │   ├── Path: /merchant/reports
│       │   ├── Page: pages/merchant/Reports.tsx
│       │   └── Feature Components/
│       │       ├── TenantChurnAnalytics.tsx (features/analytics/components/)
│       │       ├── OnTimePaymentRate.tsx (features/analytics/components/)
│       │       ├── RevenueForecast.tsx (features/analytics/components/)
│       │       ├── ContractNoticePeriod.tsx (features/contracts/components/)
│       │       ├── useReportsData.ts (features/analytics/hooks/)
│       │       └── useReportExports.ts (features/analytics/hooks/)
│       │
│       ├── Risiko Keuangan/
│       │   ├── Path: /merchant/financial-risk
│       │   ├── Page: pages/merchant/FinancialRiskAnalytics.tsx
│       │   └── Feature Components/
│       │       ├── TierGate.tsx (features/dss/components/)
│       │       ├── useFinancialAnalytics.ts (features/dss/hooks/)
│       │       └── useRiskAssessment.ts (features/dss/hooks/)
│       │
│       └── Template Laporan/
│           ├── Path: /merchant/report-templates
│           ├── Page: pages/merchant/ReportTemplates.tsx
│           └── Feature Components/
│               ├── useMerchantProperties.ts (features/properties/hooks/)
│               ├── useExecutiveSummary.ts (features/analytics/hooks/)
│               ├── usePropertyAnalysis.ts (features/analytics/hooks/)
│               ├── useFinancialPerformance.ts (features/analytics/hooks/)
│               ├── useRiskAssessment.ts (features/analytics/hooks/)
│               └── useInvestmentOpportunity.ts (features/analytics/hooks/)
│
├── Wawasan Bisnis/
│   ├── Ringkasan Statistik/
│   │   ├── Path: /merchant/analytics-dashboard
│   │   ├── Page: pages/merchant/AnalyticsDashboard.tsx
│   │   └── Feature Components/
│   │       ├── useAnalyticsProperties.ts (features/analytics/hooks/)
│   │       ├── useAnalyticsUnits.ts (features/analytics/hooks/)
│   │       ├── useAnalyticsContracts.ts (features/analytics/hooks/)
│   │       ├── useAnalyticsTenantRiskScores.ts (features/analytics/hooks/)
│   │       └── useAnalyticsDisasterRisk.ts (features/analytics/hooks/)
│   │
│   ├── Market Intelligence (Submenu)/
│   │   ├── Tren Pasar/
│   │   │   ├── Path: /merchant/market-intelligence
│   │   │   ├── Page: pages/merchant/MarketIntelligence.tsx
│   │   │   └── Feature Components/
│   │   │       ├── TierGate.tsx (features/dss/components/)
│   │   │       ├── usePriceIntelligence.ts (features/dss/hooks/)
│   │   │       ├── useOccupancyForecast.ts (features/dss/hooks/)
│   │   │       └── useMerchantProperties.ts (features/properties/hooks/)
│   │   │
│   │   └── Perbandingan Aset/
│   │       ├── Path: /merchant/comparative-portfolio
│   │       ├── Page: pages/merchant/ComparativePortfolio.tsx
│   │       └── Feature Components/
│   │           └── useComparativePortfolio.ts (features/analytics/hooks/)
│   │
│   └── AI Insights (Submenu)/
│       ├── Prediksi AI/
│       │   ├── Path: /merchant/ml-analytics
│       │   ├── Page: pages/merchant/MlAnalytics.tsx
│       │   └── Feature Components/
│       │       ├── TierGate.tsx (features/dss/components/)
│       │       ├── useRevenueForecast.ts (features/dss/hooks/)
│       │       ├── useTenantRiskScores.ts (features/dss/hooks/)
│       │       ├── useChurnPrediction.ts (features/dss/hooks/)
│       │       ├── useOptimalPricing.ts (features/dss/hooks/)
│       │       └── useModelRunHistory.ts (features/dss/hooks/)
│       │
│       ├── Saran Cerdas/
│       │   ├── Path: /merchant/dss-advisor
│       │   ├── Page: pages/merchant/DssAdvisor.tsx
│       │   └── Feature Components/
│       │       ├── DssReadinessCard.tsx (features/dss/components/)
│       │       ├── TierGate.tsx (features/dss/components/)
│       │       ├── useDssReadiness.ts (features/dss/hooks/)
│       │       ├── usePricingAdvisor.ts (features/dss/hooks/)
│       │       ├── useCollectionStrategy.ts (features/dss/hooks/)
│       │       ├── useMaintenancePriority.ts (features/dss/hooks/)
│       │       ├── useInvestmentInsight.ts (features/dss/hooks/)
│       │       └── useDssRecommendations.ts (features/dss/hooks/)
│       │
│       └── Skor Penyewa/
│           ├── Path: /merchant/tenant-quality
│           ├── Page: pages/merchant/TenantQualityScoring.tsx
│           └── Feature Components/
│               ├── TierGate.tsx (features/subscriptions/components/)
│               ├── useMerchantTier.ts (features/dss/hooks/)
│               └── useTenantQualityScoring.ts (features/dss/hooks/)
│
├── Bantuan/
│   ├── Pusat Dokumen/
│   │   ├── Path: /merchant/documents
│   │   ├── Page: pages/merchant/DocumentCenter.tsx
│   │   └── Feature Components/
│       ├── OcrDocumentViewer.tsx (features/dss/components/)
│       ├── OcrResultEditor.tsx (features/dss/components/)
│       ├── useOcrResults.ts (features/dss/hooks/)
│       └── useUpdateOcrResult.ts (features/dss/hooks/)
│
│   └── Panduan OCR/
│       ├── Path: /merchant/ocr-tutorial
