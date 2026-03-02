

# Create: old-docs/AUDIT_MENU.md -- Complete Structural Navigation Audit

## Overview

Create a single comprehensive markdown file that systematically maps every navigation item in the Merchant Portal to its components, flows, states, and impact. The document follows strict hierarchical numbering from Level 1 (Sidebar top-to-bottom) through Level 5 (components inside tabs).

## File to Create

| File | Action |
|------|--------|
| `old-docs/AUDIT_MENU.md` | CREATE |

## Document Structure

The audit will cover all **15 top-level numbered items** plus all sub-items, tabs, and nested components found in the actual codebase. Every section follows the mandatory template (A through H).

### Sidebar Items (1-7)

1. **Dashboard** (`/merchant`) -- Dashboard.tsx with customizable widgets (KPI strip, quick actions, charts, vacancy, cash flow, action items, subscription), MobileMerchantDashboard for mobile, DashboardCustomizeDialog for widget reordering.

2. **Properti & Okupansi** (5 sub-items)
   - 2.1 Properti (`/merchant/properties`) -- Properties.tsx with 4 KPI cards, filters (search, type, status, sort), grid/list view, pagination, PropertyFormDialog, DeletePropertyDialog, PropertyImportDialog. Detail page (`PropertyDetail.tsx`) has 7 tabs: Overview, Unit, Staf, Penyewa, Keuangan, Pemeliharaan, Risiko -- each fully audited as sub-numbers.
   - 2.2 Papan Okupansi (`/merchant/occupancy-board`) -- Wrapper for OccupancyBoard component with drag-and-drop unit status changes.
   - 2.3 Inventori (`/merchant/inventory`) -- Inventory.tsx with 4 stat cards, 3 tabs (Tipe Fasilitas, Aset, Assignment), depreciation calculations, asset detail panel.
   - 2.4 Maintenance (`/merchant/maintenance`) -- Maintenance.tsx with 4 priority stats, status tabs (5 tabs), filters (search, priority, category), paginated table, CreateMaintenanceDialog, UpdateMaintenanceDialog.
   - 2.5 Penjaga (`/merchant/guardians`) -- Guardians.tsx with 3 stat cards, search/role filter, assignment dialog with property scope, CRUD operations.

3. **Penyewa & Kontrak** (3 sub-items)
   - 3.1 Penyewa (`/merchant/tenants`) -- Tenants.tsx with TenantStats, 3 tabs (Aktif, Segera Berakhir, Undangan), InviteTenantDialog, AddTenantDialog, TenantDetailsDialog.
   - 3.2 Kontrak (`/merchant/contracts`) -- Contracts.tsx with ContractStats, 5 tabs (Draf, Aktif, Segera Berakhir, Menunggu TTD, Riwayat), CreateContractDialog, SignContractDialog, DeleteContractDialog.
   - 3.3 Daftar Tunggu (`/merchant/waiting-list`) -- WaitingList.tsx with WaitingListTable, AddApplicantDialog, SendOfferDialog.

4. **Keuangan** (9 sub-items)
   - 4.1 Kontrol Keuangan -- 4 KPI cards, approval rules collapsible, pending approvals list with approve/reject, 10 recent transactions.
   - 4.2 Tagihan -- InvoicesStats, 5 status tabs, InvoicesFilters, InvoicesTable (inline view via dialog), CreateInvoiceDialog, InvoiceDetailsDialog.
   - 4.3 Pembayaran -- PaymentsStats, PaymentsFilters, 3 tabs (Riwayat, Tagihan Terlambat, Status Transfer), MarkPaidDialog, CreatePaymentDialog, PaymentPlanDialog.
   - 4.4 Penagihan -- CollectionsSummary, 3 tabs (Dashboard with aging buckets + outstanding table, Kasus, Laporan).
   - 4.5 Pengeluaran -- 4 stat cards, category breakdown bar chart, 2 tabs (Daftar Pengeluaran, Approval), ExpenseCreateDialog, ReceiptViewer.
   - 4.6 Rekonsiliasi -- 3 stat cards, 3 tabs (Perlu Review, Riwayat Cocok, Laporan), PaymentReviewCard with auto/manual match.
   - 4.7 Utilitas -- Property selector, 3 tabs (Pengaturan, Input Meter, Tagihan), uses MerchantLayout wrapper.
   - 4.8 Harga Dinamis -- 3 stat cards, PricingRulesTable, CreatePricingRuleDialog.
   - 4.9 Lap. Keuangan -- 4 summary cards, 3 tabs (Laba Rugi with bar+line charts, Pendapatan per Properti pie chart, Pengeluaran per Kategori pie chart).

5. **Wawasan & Manajemen** (6 sub-items)
   - 5.1 Alat (InsightsHub) -- Card grid with 2 sections: Performa (3 cards) and Intelijen AI (6 cards), each linking to standalone pages.
   - 5.2 Laporan -- Reports.tsx with 6 tabs (Ringkasan, Dashboard, ROI & Ringkasan, Perkiraan, Perputaran Tenant, Pemeliharaan), date range picker, export dropdown (PDF/CSV).
   - 5.3 Template Dokumen -- Category filter, grouped card grid, DocumentTemplateEditor dialog, DocumentFillDialog.
   - 5.4 Manajemen Staff -- Staff card grid, invite dialog with role/property scope selection, permissions dialog with granular switches.
   - 5.5 Performa Vendor -- 4 stat cards, 3 tabs (Ringkasan table, Perbandingan bar chart, Riwayat per vendor).
   - 5.6 API & Integrasi -- 3 tabs (API Keys, Webhooks, Dokumentasi).

6. **Bantuan** (`/merchant/support`) -- Support.tsx with AI Assistant CTA, FAQ accordion by category, sidebar with useful links and system status.

7. **Feedback** (`/merchant/feedback`) -- Feedback.tsx with feedback form (category, rating, message, screenshot upload), feedback history with status badges.

### Navbar Items (8-11)

8. **Breadcrumb** -- Auto-generated from route using `generateBreadcrumbs()`, clickable intermediate segments.
9. **Search** -- CommandDialog (Cmd+K), searches all nav items grouped by sidebar group.
10. **Dark Toggle Theme** -- ThemeToggle component, toggles light/dark.
11. **Notification Icon** -- NotificationsDropdown with real-time subscription, unread badge, mark as read, expandable messages, link navigation.

### Nav User Items (12-15)

12. **Profile** -- NavUser dropdown item linking to `/{role}/profile`.
13. **Notifikasi** -- Not present in NavUser dropdown. The "Akun" sidebar group has it, and the alerts page exists at `/merchant/alerts`. NavUser does NOT have a dedicated "Notifikasi" item. Marked as: "Not Clearly Defined in Current System" for NavUser context.
14. **Langganan** (Billing) -- NavUser dropdown item linking to `/{role}/billing`.
15. **Pengaturan** (Settings) -- NavUser dropdown item linking to `/{role}/settings`. Settings.tsx with 3 tabs (Notifikasi, Perbankan, Pencairan).

### Global Navigation Audit (End Section)

- Total Sidebar Depth analysis
- Discoverability Risk Ranking (top 10 hardest features)
- Cross-Module Context Switch Map
- Redundancy & Overlap Matrix
- Navigation Restructure Proposal

## Key Findings to Document

1. **Akun group duplication**: Support and Feedback appear both in sidebar "Akun" group AND in NavSecondary (footer). The sidebar renders both locations.
2. **NavUser has no "Notifikasi" item** -- it has Profile, Billing, Settings, Log out. The user's spec item 13 doesn't exist in code.
3. **PropertyDetail has 7 tabs**, not 5 as in older docs (Overview, Unit, Staf, Penyewa, Keuangan, Pemeliharaan, Risiko).
4. **UtilityBilling uses MerchantLayout** wrapper instead of DashboardLayout pattern -- inconsistency.
5. **Mixed toast systems** still present across some pages (useToast vs sonner).

## Size Estimate

The document will be approximately 3,000-4,000 lines of markdown covering all 15+ top-level items with full A-H template for each.

