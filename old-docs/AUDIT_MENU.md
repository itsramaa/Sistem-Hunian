# AUDIT_MENU.md — Complete Structural Navigation Audit

> **Merchant Portal (SiHuni)**
> Audit Date: 2026-03-02
> Source: Actual codebase analysis — no hallucinated features.

---

# SIDEBAR

---

## 1. Dashboard

### A. Business Purpose

- **Problem solved**: Single entry point for merchant to assess business health at a glance — revenue, occupancy, tenant growth, vacancies, and pending actions.
- **Persona**: Property owner/merchant; daily operational user.
- **Operational frequency**: Multiple times daily (first page after login).
- **Direct business impact**: Accelerates decision-making by surfacing KPIs, action items, and cash flow trends without navigating to sub-modules.

### B. UI Structure Breakdown

- **Route**: `/merchant`
- **Page file**: `src/pages/merchant/Dashboard.tsx`
- **Mobile variant**: `MobileMerchantDashboard` (completely different component for `isMobile`)
- **Top KPI cards (4)**: Total Properti (click → `/merchant/properties`), Tingkat Hunian (% + progress bar + status badge BAIK/PERHATIAN/KRITIS), Penyewa Aktif (with growth % vs last month), Pendapatan Bulan Ini (with growth badge).
- **Quick Actions card (4 actions)**: Tambah Properti → `/merchant/properties`, Buat Tagihan → `/merchant/invoices`, Buat Kontrak → `/merchant/contracts`, Lihat Laporan → `/merchant/reports`.
- **Subscription Widget**: `SubscriptionWidget` — shows current plan tier.
- **Charts section**: `InteractiveDashboardCharts` — analytic performance charts.
- **Property Overview**: Property list with occupancy progress bars (each clickable → `/merchant/properties/:id`). Financial summary card with revenue comparison.
- **Vacancy Dashboard**: `VacancyDashboard` — collapsible section. Shows vacant unit listings with links.
- **Cash Flow Widget**: `CashFlowWidget`.
- **Action Items Widget**: `ActionItemsWidget` — pending tasks.
- **Occupancy Forecast**: `OccupancyForecastWidget`.
- **Alerts & Events**: `AlertsEventsWidget`.
- **Trial Countdown**: `TrialCountdownWidget` (conditional).
- **Quick Start Checklist**: `MerchantQuickStartChecklist` (conditional).
- **Customize button**: Opens `DashboardCustomizeDialog` for widget reorder/hide.
- **Refresh button**: Triggers `refetch()` for dashboard stats.
- **Widget system**: Configurable via `useDashboardPreferences` → stored in `dashboard_preferences` table. `getOrderedWidgets()` controls render order. `hiddenWidgets` controls visibility.
- **Loading state**: `MerchantDashboardSkeleton`.
- **Error state**: Alert with "Coba Lagi" button.
- **Empty state**: Per-widget — e.g., "Tidak ada properti ditemukan" with "Tambahkan properti pertama Anda" link.
- **Pagination**: None (single-page dashboard).

### C. Interaction Flow Mapping

| Element | Entry Point | Click Path | State Change | Cross-Module |
|---------|-------------|------------|--------------|--------------|
| KPI: Total Properti | Dashboard | Click card | Navigate | → `/merchant/properties` |
| KPI: Tingkat Hunian | Dashboard | Click card | Navigate | → `/merchant/properties` |
| KPI: Penyewa Aktif | Dashboard | Click card | Navigate | → `/merchant/tenants` |
| KPI: Pendapatan | Dashboard | Click card | Navigate | → `/merchant/payments` |
| Quick Action: Tambah Properti | Dashboard | Click | Navigate | → `/merchant/properties` |
| Quick Action: Buat Tagihan | Dashboard | Click | Navigate | → `/merchant/invoices` |
| Quick Action: Buat Kontrak | Dashboard | Click | Navigate | → `/merchant/contracts` |
| Quick Action: Lihat Laporan | Dashboard | Click | Navigate | → `/merchant/reports` |
| Kustomisasi | Dashboard header | Click Settings2 icon | Opens `DashboardCustomizeDialog` | None |
| Segarkan | Dashboard header | Click RefreshCw icon | `refetch()` — partial reload (react-query) | Server dependent |
| Property row | Property Overview section | Click row | Navigate | → `/merchant/properties/:id` |
| Lihat Laporan Detail | Financial summary | Click button | Navigate | → `/merchant/reports` |

- **Kustomisasi**: Modifies `widget_order` and `hidden_widgets` in `dashboard_preferences` table. Per-merchant (not per-user). Persistent via Supabase. Dialog uses `useSaveDashboardPreferences`.
- **Segarkan**: Partial reload — only re-fetches `useMerchantDashboardStats`. Server dependent.

### D. State Machine Mapping

- **Core states**: Loading → Error | Loaded (mobile vs desktop).
- **Hidden states**: Empty dashboard (no properties), trial expired (shows countdown), widget preferences not yet loaded (falls back to defaults).
- **Edge states**: `selectedPropertyId` from `usePropertyContext` changes layout — if set, Property Overview hides property list and shows single-property financial view.
- **Invalid transitions**: None identified.
- **Role-based**: Merchant only.
- **State explosion risk**: Low — widget system is additive, not multiplicative.

### E. UX Risk & Cognitive Load

- **Discoverability**: Good — dashboard is the default landing page.
- **Information density**: HIGH — 4 KPI cards + 8 configurable widgets. Mobile variant mitigates this.
- **Overlapping features**: Revenue data appears in KPI strip, Financial Summary, and Cash Flow Widget.
- **Redundancy**: Property overview duplicates data from Properties page.
- **Context switching burden**: Low — all data is on one page.
- **Mental model mismatch**: Widget customization is hidden behind Settings2 icon — users may not discover it.

### F. Integration & Cross-Dependency

- **Depends on**: `useMerchantDashboardStats` (aggregates properties, tenants, financials), `useDashboardPreferences`, `usePropertyContext`.
- **Triggers**: Navigation to Properties, Tenants, Payments, Reports, Contracts.
- **Preserves context**: `selectedPropertyId` from PropertySwitcher in sidebar filters dashboard data.
- **Deep linking**: No — no hash-based or query-param based widget targeting.
- **Flow continuity**: Good — all navigation from dashboard leads to relevant sub-pages.

### G. Scalability Impact

| Scale | Impact |
|-------|--------|
| 5 units | Dashboard loads instantly. Property Overview shows all properties. |
| 20 units | No performance issue. All properties render in Property Overview without pagination. |
| 100+ units | `useMerchantDashboardStats` may slow — aggregates all properties. Property Overview list becomes long. No virtualization or pagination in dashboard view. Cash Flow and Charts may load slowly if payment history is large. |

### H. Optimization Opportunities

1. **Dashboard Property Overview**: Add pagination or "Top 5" with "Lihat Semua" link for 100+ properties.
2. **Widget lazy loading**: Currently all visible widgets render simultaneously. Load below-fold widgets on scroll.
3. **Quick Actions**: Should be dynamic based on user's most common actions (learn from analytics).
4. **Property context filter**: When `selectedPropertyId` is set, the entire dashboard should scope ALL widgets to that property, not just the Property Overview.

---

## 2. Properti & Okupansi (Group)

This is a sidebar group containing 5 sub-items (2.1–2.5).

---

### 2.1 Properti

### A. Business Purpose

- **Problem solved**: Central registry and management of all properties owned by the merchant.
- **Persona**: Property owner managing portfolio.
- **Operational frequency**: Weekly (add/edit properties), daily (check occupancy).
- **Direct business impact**: Core entity — all contracts, tenants, invoices, and maintenance link to a property.

### B. UI Structure Breakdown

- **Route**: `/merchant/properties`
- **Page file**: `src/pages/merchant/Properties.tsx`
- **Detail route**: `/merchant/properties/:id` → `PropertyDetail.tsx`
- **Top KPI cards (4)**: Properti (count), Unit (total with occupied/vacant), Hunian (% with 4-bar indicator + status), Unit Kosong (count).
- **Operational Insights panel (3 cards, conditional — shows when ≥2 properties)**: Best Performer, Worst Performer, Properties with >50% vacancy.
- **Filters**: `PropertyFilters` component — search (debounced 500ms), type filter (all/kost/kontrakan), status filter (all/active/inactive/maintenance), sort (newest/oldest/name-asc/name-desc/occupancy-high/occupancy-low).
- **View mode toggle**: Grid / List.
- **Grid view**: `PropertyCard` components.
- **List view**: `PropertyTable` component.
- **Pagination**: Page numbers with ellipsis, items-per-page selector (default 9).
- **Buttons**: "Import CSV" (`PropertyImportDialog`), "Tambah Properti" (disabled if subscription limit reached).
- **Dialogs**: `PropertyFormDialog` (create/edit, multi-step), `DeletePropertyDialog` (with canDelete check), `PropertyImportDialog`, Image Gallery dialog.
- **Subscription warning**: `SubscriptionLimitWarning` banner.
- **Loading state**: `PropertiesPageSkeleton`.
- **Empty state**: When no properties match filters.
- **Active filter count badge**: Shows count of active filters.
- **Context actions per card/row**: Edit, Duplicate, Delete, Manage Images, View Units.

### C. Interaction Flow Mapping

| Element | Click Path | Destination |
|---------|------------|-------------|
| "Tambah Properti" button | Opens `PropertyFormDialog` | Stays on page |
| "Import CSV" button | Opens `PropertyImportDialog` | Stays on page |
| Property card click | Navigate | → `/merchant/properties/:id` |
| Edit action | Opens `PropertyFormDialog` with property data | Stays on page |
| Duplicate action | Opens `PropertyFormDialog` with copied data (name + " (Salinan)") | Stays on page |
| Delete action | Checks `checkCanDelete` → opens `DeletePropertyDialog` | Stays on page |
| Units action | Opens `UnitsManager` dialog | Stays on page |
| Images action | Opens Image Gallery dialog | Stays on page |

### D. State Machine Mapping

- **Core states**: Loading → Empty | Loaded (filtered/unfiltered).
- **Hidden states**: Subscription limit reached (Tambah Properti disabled), delete check pending (deleteLoading per property).
- **Edge states**: Duplicate creates a copy with 0 units — user must manually add units.
- **Invalid transitions**: Cannot delete property with active units/contracts (server-side check via `checkCanDelete`).
- **State explosion risk**: Low.

### E. UX Risk & Cognitive Load

- **Discoverability**: Good — primary sidebar item.
- **Information density**: Medium — KPI strip + filters + paginated grid/list.
- **Overlapping features**: Units can be managed here (via dialog) AND from Property Detail page.
- **Redundancy**: Occupancy data appears in KPI strip AND individual cards AND dashboard.
- **Context switching**: Low — detail page is a natural drill-down.

### F. Integration & Cross-Dependency

- **Depends on**: `useMerchantProperties`, `useSubscriptionLimits`.
- **Triggers**: Property creation → triggers refresh, affects dashboard stats, affects tenant/contract flows.
- **Deep linking**: No.
- **activePatterns**: `["/merchant/units"]` — sidebar highlights "Properti" when on units pages.

### G. Scalability Impact

| Scale | Impact |
|-------|--------|
| 5 units | No issues. All fit on one page. |
| 20 units | Pagination activates. Filters become useful. |
| 100+ units | Filter + pagination handles well. Grid view with 9 items/page means 12+ pages. List view may be more practical. No server-side pagination — all properties loaded client-side and filtered in memory. |

### H. Optimization Opportunities

1. **Server-side pagination**: Currently loads all properties then paginates client-side. Will not scale past 1000 properties (Supabase default limit).
2. **Bulk actions**: No multi-select for bulk delete/status change.
3. **Map view**: Properties have lat/lng — a map view would add value.

---

#### 2.1.1 PropertyDetail — Overview Tab

### A. Business Purpose

- **Problem solved**: At-a-glance property summary: address, description, amenities, rules, DSS readiness, and financial metrics.
- **Persona**: Property owner reviewing a specific property.
- **Operational frequency**: Weekly.
- **Direct business impact**: Provides context for all property-level decisions.

### B. UI Structure Breakdown

- **Route**: `/merchant/properties/:id#overview`
- **Hero header**: Property name + status badge + type badge + city/province + "Baru" badge (if <7 days old).
- **Action buttons**: "Foto" (opens photo dialog), "Edit Properti" (opens `PropertyFormDialog`).
- **Image gallery**: Carousel (if images exist) or placeholder. Click opens `PhotoLightbox`.
- **KPI strip (5)**: Unit (occupied/total), Hunian (%), Pendapatan (from occupied units), Pemeliharaan (active tickets), Kontrak (active contracts).
- **Tab bar (7 tabs)**: Ringkasan, Unit, Staf, Penyewa, Keuangan, Pemeliharaan, Risiko.
- **Overview content**: Address card, Description card, Fasilitas card (with "Edit Fasilitas" button → `FacilityTypePicker`), Rules section (`RulesSection`), DSS Readiness + Financial Metrics (`OverviewDssMetrics`).
- **Sidebar (right column, 280px)**: Present in the grid layout alongside tabs.

### C. Interaction Flow Mapping

- **Edit Fasilitas**: Opens FacilityTypePicker dialog → saves via `propertyService.updateProperty` → invalidates query.
- **Fasilitas badge click**: Navigates to `/merchant/inventory`.
- **Deep linking**: URL hash (`#overview`, `#units`, `#guardians`, `#tenants`, `#financial`, `#maintenance`, `#risk`) auto-selects tab.
- **`?edit=true&step=N`**: Auto-opens PropertyFormDialog at step N from URL params.

### D. State Machine Mapping

- **Core states**: Loading → Error/Not Found | Loaded with tab selection.
- **Hidden states**: Property just created (no units, no contracts) — all tabs show empty states.
- **Edge states**: Deep link to `#guardians` loads lazy component `LazyGuardians`.

### E–H. (Shared with parent PropertyDetail context)

---

#### 2.1.2 PropertyDetail — Unit Tab

### A. Business Purpose

- **Problem solved**: Manage all units within a property — view status, add/edit units, navigate to unit details.
- **Persona**: Property owner/manager.
- **Operational frequency**: Weekly.
- **Direct business impact**: Units are the rentable inventory — directly tied to revenue.

### B. UI Structure Breakdown

- **Route**: `/merchant/properties/:id#units`
- **Status filter buttons (5)**: Semua, Tersedia, Terisi, Perbaikan, Dipesan — with count per status.
- **View toggle**: List / Gallery.
- **"Tambah Unit" button**: Opens `UnitFormDialog`.
- **List view**: Table with columns — Unit, Tipe, Lantai, Ukuran, Sewa, Deposit, Status. Rows clickable → `/merchant/units/:id`.
- **Gallery view**: Card grid with infinite scroll (`IntersectionObserver`).
- **Pagination (list mode)**: 10 items per page.
- **Empty state**: "Tidak ada unit ditemukan."

### C. Interaction Flow Mapping

- **Unit row click**: Navigate → `/merchant/units/:id`.
- **Tambah Unit**: Opens `UnitFormDialog` → `createUnit` mutation → refresh.
- **Status filter**: Client-side filter on `unitFilter` state.

### D. State Machine Mapping

- **Core states**: Empty | Filtered list with pagination.
- **Infinite scroll state**: Gallery mode accumulates items via `unitGalleryCount` + IntersectionObserver.

### E. UX Risk & Cognitive Load

- **Discoverability**: Good — second tab.
- **Information density**: Medium — table is compact.
- **Overlapping features**: Units also accessible from Properties list page via "Manage Units" action.

### F. Integration & Cross-Dependency

- **Depends on**: Property's units array (from `usePropertyDetail`), `useUnits` hook.
- **Triggers**: Navigate to `/merchant/units/:id` (separate page with full unit detail).

### G. Scalability Impact

| Scale | Impact |
|-------|--------|
| 5 units | All visible without pagination. |
| 20 units | 2 pages. Manageable. |
| 100+ units | 10+ pages. Gallery mode uses infinite scroll — acceptable. List pagination works. All data loaded at once from parent query (no lazy loading). |

### H. Optimization Opportunities

1. **Inline unit status change**: Currently must navigate to unit detail to change status.

---

#### 2.1.3 PropertyDetail — Staf (Guardians) Tab

### A. Business Purpose

- **Problem solved**: Manage on-site staff (security, cleaners, managers, maintenance) assigned to this property.
- **Persona**: Property owner.
- **Operational frequency**: Monthly.
- **Direct business impact**: Operational staffing directly affects tenant satisfaction and property maintenance quality.

### B. UI Structure Breakdown

- **Route**: `/merchant/properties/:id#guardians`
- **Component**: `LazyGuardians` — lazy-loaded `Guardians` component with `propertyId` prop.
- **Suspense fallback**: `ContentSkeleton`.
- **Content**: Same as 2.5 Penjaga, but scoped to this property.

### C–H. See 2.5 Penjaga (same component, property-scoped).

---

#### 2.1.4 PropertyDetail — Penyewa Tab

### A. Business Purpose

- **Problem solved**: View active tenants in this property via their contracts.
- **Persona**: Property owner checking tenant roster.
- **Operational frequency**: Weekly.
- **Direct business impact**: Tenant visibility for rent collection and relationship management.

### B. UI Structure Breakdown

- **Route**: `/merchant/properties/:id#tenants`
- **View toggle**: List / Gallery.
- **"Tambah Penyewa" button**: Opens `AddTenantDialog` (scoped to this property's units).
- **List view**: Table — Penyewa, Unit, Periode, Sewa/Bulan, Status. Row click opens `TenantDetailsDialog`.
- **Gallery view**: Card grid with infinite scroll.
- **Pagination (list mode)**: 10 items per page.
- **Empty state**: "Belum ada penyewa aktif."

### C. Interaction Flow Mapping

- **Tenant row click**: Opens `TenantDetailsDialog` (modal, not navigation).
- **Tambah Penyewa**: Opens `AddTenantDialog` → invokes `create-tenant` edge function.

### D. State Machine Mapping

- **Core states**: Empty | List with active contracts.
- **Data source**: `propertyContracts` query — fetches contracts by unit IDs in this property, joins with profiles.

### E–H. Similar to parent Tenants page (3.1), but property-scoped.

---

#### 2.1.5 PropertyDetail — Keuangan Tab

### A. Business Purpose

- **Problem solved**: Property-level financial metrics: revenue potential, NOI, ROI, cap rate, and financial form for cost tracking.
- **Persona**: Property owner analyzing investment performance.
- **Operational frequency**: Monthly.
- **Direct business impact**: Informs investment decisions (renovate, sell, optimize pricing).

### B. UI Structure Breakdown

- **Route**: `/merchant/properties/:id#financial`
- **Components**: `FinancialTabContent` (metrics display + financial form), `RenovationHistoryCard`.
- **`PropertyFinancialMetrics`**: Displays computed financial KPIs.
- **`PropertyFinancialForm`**: Editable form for `FinancialFormData` (construction_cost, renovation_cost, monthly_maintenance_cost, etc.).
- **`RenovationHistoryCard`**: Tracks renovation history for depreciation and ROI calculations.

### C. Interaction Flow Mapping

- **Financial form save**: Updates property financial fields via mutation.
- **Renovation add**: Adds to renovation history.

### D. State Machine Mapping

- **Core states**: Empty (no financial data entered) | Populated with computed metrics.
- **Hidden states**: Financial form fields are nullable — metrics show 0 or N/A when missing.

### E–H. Low complexity. Self-contained within tab.

---

#### 2.1.6 PropertyDetail — Pemeliharaan Tab

### A. Business Purpose

- **Problem solved**: View and create maintenance requests for this property.
- **Persona**: Property owner/manager.
- **Operational frequency**: Daily/weekly.
- **Direct business impact**: Rapid response to maintenance issues retains tenants.

### B. UI Structure Breakdown

- **Route**: `/merchant/properties/:id#maintenance`
- **"Buat Pemeliharaan" button**: Opens `CreateMaintenanceDialog`.
- **Table**: Judul, Unit, Prioritas, Status, Tanggal. Rows clickable → `/merchant/maintenance/:id`.
- **Pagination**: 10 items per page.
- **Empty state**: "Belum ada permintaan pemeliharaan."
- **Badge on tab**: Shows `pendingMaintenance.length` when > 0.

### C. Interaction Flow Mapping

- **Maintenance row click**: Navigate → `/merchant/maintenance/:id`.
- **"Buat Pemeliharaan"**: Opens `CreateMaintenanceDialog` → `createMaintenanceMutation`.

### D. State Machine Mapping

- **Data source**: `propertyMaintenance` query — fetches by unit IDs in property.
- **Filter**: Status filter fixed to exclude `completed` and `cancelled` for badge count.

### E–H. Similar to Maintenance (2.4) but property-scoped.

---

#### 2.1.7 PropertyDetail — Risiko Tab

### A. Business Purpose

- **Problem solved**: Compliance and risk assessment for the property — disaster risk profiles, document compliance.
- **Persona**: Property owner ensuring legal/regulatory compliance.
- **Operational frequency**: Monthly/quarterly.
- **Direct business impact**: Regulatory compliance prevents fines and operational disruptions.

### B. UI Structure Breakdown

- **Route**: `/merchant/properties/:id#risk`
- **Component**: `LazyCompliance` — lazy-loaded `PropertyCompliance` component.
- **Suspense fallback**: `ContentSkeleton`.

### C–H.

- **Discoverability risk**: LOW — tab is visible but users may not understand "Risiko" means compliance.
- **Deep linking**: `#risk` in URL hash.

---

### 2.2 Papan Okupansi

### A. Business Purpose

- **Problem solved**: Visual board showing unit occupancy status across all properties with drag-and-drop status changes.
- **Persona**: Property manager doing daily occupancy tracking.
- **Operational frequency**: Daily.
- **Direct business impact**: Quick status updates reduce administrative overhead.

### B. UI Structure Breakdown

- **Route**: `/merchant/occupancy-board`
- **Page file**: `src/pages/merchant/OccupancyBoard.tsx`
- **Title**: "Papan Okupansi" with LayoutGrid icon.
- **Description**: "Visualisasi status unit secara real-time. Drag & drop untuk mengubah status."
- **Component**: `OccupancyBoard` — renders board with drag-and-drop lanes (Available, Occupied, Maintenance, Reserved).
- **No KPI cards, no filters, no pagination**.

### C. Interaction Flow Mapping

- **Drag unit card**: Changes unit status (e.g., Available → Occupied) — triggers mutation.
- **No navigation away** — self-contained board.

### D. State Machine Mapping

- **Core states**: Loading | Board rendered.
- **Hidden states**: Empty (no properties/units).
- **Invalid transitions**: ⚠ Not Clearly Defined in Current System — whether all status transitions are valid via drag is not restricted in the UI.

### E. UX Risk & Cognitive Load

- **Discoverability**: Medium — second item in Properti group.
- **Information density**: Depends on property count. Could become overwhelming with many properties.
- **Overlapping features**: Unit status can also be changed in Unit Detail page.

### F. Integration & Cross-Dependency

- **Depends on**: Properties and Units data.
- **Triggers**: Unit status change — affects occupancy rates, dashboard stats, contract eligibility.

### G. Scalability Impact

| Scale | Impact |
|-------|--------|
| 5 units | Board is clear and usable. |
| 20 units | Lanes get longer but manageable. |
| 100+ units | Board becomes unwieldy without property grouping or virtual scrolling. Drag-and-drop performance may degrade. |

### H. Optimization Opportunities

1. **Property grouping**: Add ability to filter board by property.
2. **Bulk status change**: Multi-select units for batch operations.

---

### 2.3 Inventori

### A. Business Purpose

- **Problem solved**: Track physical and intangible assets/facilities across properties — depreciation, condition tracking, and assignment management.
- **Persona**: Property owner/accountant.
- **Operational frequency**: Monthly.
- **Direct business impact**: Asset depreciation affects tax calculations and financial reporting.

### B. UI Structure Breakdown

- **Route**: `/merchant/inventory`
- **Page file**: `src/pages/merchant/Inventory.tsx`
- **Top stat cards (4)**: Tipe Fasilitas (count), Total Aset (count), Nilai Aset (total purchase price), Assignment (count).
- **Tabs (3)**:
  - **Tipe Fasilitas**: Table (Nama, Scope, Sifat, Jenis, Trackable) + inline add form (name, scope [property/unit], nature [tangible/intangible], asset type). CRUD operations.
  - **Aset**: `AddAssetForm` component + searchable table (Tipe, Merek, Kondisi, Lokasi, Harga Beli, Nilai Buku, Status). Click row → `AssetDetailPanel`.
  - **Assignment**: `AddAssignmentForm` + assignment table.
- **Depreciation calculation**: `calcDepreciation()` — straight-line method based on purchase price, salvage value, useful life, and purchase date.
- **Asset Detail Panel**: Full detail view with back button (replaces list view).
- **Search**: Text search in Assets tab.
- **Empty states**: Per tab.
- **Toast**: Uses `sonner` (not `useToast`).

### C. Interaction Flow Mapping

- **Tipe Fasilitas add**: Inline form → `addTypeMutation` → refresh.
- **Tipe Fasilitas delete**: Button per row → `deleteTypeMutation`.
- **Asset row click**: Shows `AssetDetailPanel` (in-page, replaces list).
- **Back from detail**: `onBack()` returns to list.

### D. State Machine Mapping

- **Core states**: Loading | Tab view (3 tabs) | Asset detail view.
- **Hidden states**: No facility types created yet → Assets and Assignments disabled conceptually.
- **State explosion risk**: Low.

### E. UX Risk & Cognitive Load

- **Discoverability**: Medium — third item in group.
- **Information density**: Moderate — 3 tabs with separate concerns.
- **Overlapping features**: Facility types are also referenced in PropertyDetail's "Fasilitas" section (amenities use facility type IDs).

### F. Integration & Cross-Dependency

- **Depends on**: `facility_types`, `assets`, `facility_assignments` tables.
- **Triggers**: Facility type changes affect PropertyDetail amenities display.
- **Deep linking**: No.

### G. Scalability Impact

| Scale | Impact |
|-------|--------|
| 5 units | Few assets, manageable. |
| 20 units | Asset list grows proportionally. |
| 100+ units | No pagination on asset table — will need it. Search helps but client-side only. |

### H. Optimization Opportunities

1. **Asset table pagination**: Currently no pagination — will break with many assets.
2. **Link assets to maintenance**: When maintenance is completed, auto-update asset condition.

---

### 2.4 Maintenance

### A. Business Purpose

- **Problem solved**: Central hub for managing all maintenance requests across all properties.
- **Persona**: Property owner/manager.
- **Operational frequency**: Daily.
- **Direct business impact**: Maintenance response time directly affects tenant retention and property value.

### B. UI Structure Breakdown

- **Route**: `/merchant/maintenance`
- **Page file**: `src/pages/merchant/Maintenance.tsx`
- **Detail route**: `/merchant/maintenance/:id` → `MaintenanceDetail.tsx`
- **PageHeader**: "Pemeliharaan" with Wrench icon + "Tambah Pemeliharaan" button.
- **Priority stats (4)**: `MaintenanceStats` — total, low, medium, high, urgent (counts of ACTIVE requests only).
- **Status tabs (5)**: Semua, Tertunda (`pending`), Dalam Proses (`in_progress`), Selesai (`completed`), Dibatalkan (`cancelled`). Each shows count.
- **Filters**: `MaintenanceFilters` — search (debounced), priority filter (all/low/medium/high/urgent), category filter.
- **Table**: `MaintenanceRequestTable` — paginated (10/page), with edit action per row.
- **Dialogs**: `CreateMaintenanceDialog` (merchant-initiated), `UpdateMaintenanceDialog` (status change with vendor assignment).
- **Loading state**: `TabsPageSkeleton` with 4 stat cards.

### C. Interaction Flow Mapping

| Element | Click Path | Result |
|---------|------------|--------|
| "Tambah Pemeliharaan" | Opens `CreateMaintenanceDialog` | Create request (title, description, priority, category, unit, estimated_cost) |
| Table row edit | Opens `UpdateMaintenanceDialog` | Change status, assign vendor, add notes |
| Table row | ⚠ No click-to-detail from list page — edit action only opens dialog | — |

⚠ **Missing**: No direct click-to-detail navigation from the maintenance list to `/merchant/maintenance/:id`. Users can only access detail via PropertyDetail's maintenance tab or direct URL.

### D. State Machine Mapping

- **Request statuses**: `pending` → `in_progress` → `completed` | `cancelled`.
- **Hidden states**: Vendor assignment (optional), estimated_cost (now included after bug fix).
- **Edge states**: Completed status auto-links to Expenses module via `onSuccess` toast message.
- **Invalid transitions**: ⚠ Not clearly enforced in UI — user can set any status from any status via `UpdateMaintenanceDialog`.

### E. UX Risk & Cognitive Load

- **Discoverability**: Good — dedicated sidebar item.
- **Information density**: Medium — stats + tabs + filters + table.
- **Overlapping features**: Maintenance also appears in PropertyDetail tab 2.1.6.

### F. Integration & Cross-Dependency

- **Depends on**: `useMerchantMaintenanceRequests`, `useVerifiedVendors`.
- **Triggers**: Completion → auto-creates expense entry. Status changes → updates PropertyDetail counts.
- **activePatterns**: `["/merchant/preventive-maintenance"]`.

### G. Scalability Impact

| Scale | Impact |
|-------|--------|
| 5 units | Few requests. |
| 20 units | Moderate request volume. Filters become essential. |
| 100+ units | High volume. Client-side pagination handles display. But initial query loads ALL requests — needs server-side pagination. |

### H. Optimization Opportunities

1. **Click-to-detail**: Table rows should navigate to `/merchant/maintenance/:id` on click.
2. **Server-side pagination**: Currently all requests loaded client-side.
3. **SLA indicators**: Add visual SLA deadline (based on priority) in table.

---

### 2.5 Penjaga (Tim On-Site)

### A. Business Purpose

- **Problem solved**: Manage on-site staff (security guards, cleaners, property managers, maintenance staff) including salary tracking and multi-property assignment.
- **Persona**: Property owner managing staffing.
- **Operational frequency**: Monthly.
- **Direct business impact**: Staff costs are a major expense. Multi-property assignment optimizes resource utilization.

### B. UI Structure Breakdown

- **Route**: `/merchant/guardians`
- **Page file**: `src/pages/merchant/Guardians.tsx`
- **Stat cards (3)**: Total Penjaga, Aktif (count), Total Gaji Aktif/bulan (sum of active guardians' salary).
- **Table**: Daftar Penjaga — columns: Nama, Properti, Peran, Telepon, Gaji (with frequency label), Status. Actions: Assign (Building2 icon), Edit, Delete.
- **Search**: Text search by name.
- **Role filter**: Dropdown — Semua Peran, Keamanan, Kebersihan, Manajer, Pemeliharaan.
- **Buttons**: "Tambah Penjaga" → opens `GuardianFormDialog`.
- **Assign Dialog**: Property assignment dialog with primary/backup role selection. Shows current assignments. Can remove assignments.
- **Delete Dialog**: AlertDialog confirmation.
- **Empty state**: "Data tidak ditemukan" with prompt.
- **Loading state**: Centered spinner.
- **No pagination**.

### C. Interaction Flow Mapping

- **Tambah Penjaga**: Opens `GuardianFormDialog` → creates guardian with property assignment.
- **Edit**: Opens same dialog with pre-filled data.
- **Delete**: Opens confirmation dialog.
- **Assign**: Opens property assignment dialog with dropdown for available properties and role selector (Utama/Cadangan). Shows current assignments with remove button.

### D. State Machine Mapping

- **Guardian statuses**: `active`, `non-active`.
- **Assignment model**: One guardian can be assigned to multiple properties via `guardian_assignments` table (separate from primary `property_id`).
- **Edge states**: All properties assigned → "Semua properti sudah di-assign" message.

### E. UX Risk & Cognitive Load

- **Discoverability**: Low — fifth item in group.
- **Information density**: Low-medium.
- **Overlapping features**: Also appears as tab in PropertyDetail (2.1.3).

### F. Integration & Cross-Dependency

- **Depends on**: `useGuardians`, `useMerchantProperties`, `useGuardianAssignments`.
- **Triggers**: Guardian assignment affects PropertyDetail's staff tab.
- **Deep linking**: No.

### G. Scalability Impact

| Scale | Impact |
|-------|--------|
| 5 units | 1-2 guardians. |
| 20 units | 5-10 guardians. No pagination issue. |
| 100+ units | 20+ guardians. Table needs pagination. Multi-property assignment dialog may have long property list. |

### H. Optimization Opportunities

1. **Add pagination**: No pagination on guardian table.
2. **Salary summary**: Monthly payroll report integration.

---

## 3. Penyewa & Kontrak (Group)

---

### 3.1 Penyewa

### A. Business Purpose

- **Problem solved**: Manage tenant lifecycle — invite, add directly, monitor active tenants, handle expiring contracts, terminate.
- **Persona**: Property owner/manager.
- **Operational frequency**: Weekly.
- **Direct business impact**: Tenant management directly drives occupancy and revenue.

### B. UI Structure Breakdown

- **Route**: `/merchant/tenants`
- **Page file**: `src/pages/merchant/Tenants.tsx`
- **PageHeader buttons**: "Pindah Keluar" → `/merchant/move-outs`, "Kirim Undangan" (opens `InviteTenantDialog`), "Tambah Langsung" (opens `AddTenantDialog`).
- **Stats (4)**: `TenantStats` — pending invitations, active tenants, available units, expiring contracts (≤30 days).
- **Tabs (3)**: Tenant Aktif (with count badge), Segera Berakhir (with warning badge), Undangan (with pending count badge).
- **Filters**: `TenantsFilters` — search, status filter (active on invitations tab).
- **Tables**: `TenantsTable` (active/expiring tabs), `InvitationsTable` (invitations tab).
- **Pagination**: 10 items per page per tab.
- **Dialogs**: `InviteTenantDialog`, `AddTenantDialog`, `TenantDetailsDialog`, AlertDialog (delete/unlink confirmation).
- **Empty states**: Per tab — with contextual CTAs.
- **Error state**: Full card with retry button.

### C. Interaction Flow Mapping

| Element | Click Path | Result |
|---------|------------|--------|
| "Kirim Undangan" | Opens `InviteTenantDialog` | Sends invitation email |
| "Tambah Langsung" | Opens `AddTenantDialog` | Creates contract + links tenant |
| "Pindah Keluar" | Navigate → `/merchant/move-outs` | Cross-module |
| Tenant row: View | Opens `TenantDetailsDialog` | Modal detail view |
| Tenant row: Delete | Opens AlertDialog (terminate or unlink) | Terminates contract or unlinks tenant |
| Cancel invitation | `cancelInvitation` mutation | Removes invitation |

### D. State Machine Mapping

- **Tenant lifecycle**: Invited → Accepted → Active → Expiring → Terminated/Moved-out.
- **Contract statuses**: `active`, `notice`, `terminated`, `expired`, `completed`.
- **Edge states**: Linked tenant (no contract) vs contracted tenant — different delete behavior (unlink vs terminate).

### E. UX Risk & Cognitive Load

- **Discoverability**: Good — first item in group.
- **Information density**: Medium — stats + 3 tabs.
- **Overlapping features**: Tenant data also in PropertyDetail (2.1.4).

### F. Integration & Cross-Dependency

- **Depends on**: `useMerchantActiveTenants`, `useMerchantInvitations`, `useMerchantPropertiesWithUnits`.
- **Triggers**: Add tenant → creates contract → affects invoices, payments. Terminate → marks unit available.
- **activePatterns**: `["/merchant/move-outs", "/merchant/tenant-analytics", "/merchant/tenant-screening"]`.

### G. Scalability Impact

| Scale | Impact |
|-------|--------|
| 5 units | 5 tenants max. |
| 20 units | 20 tenants. Pagination handles display. |
| 100+ units | 100+ tenants. All loaded client-side. Will need server-side pagination. |

### H. Optimization Opportunities

1. **Server-side pagination**: All tenants loaded at once.
2. **Tenant search**: Add property filter alongside text search.

---

### 3.2 Kontrak

### A. Business Purpose

- **Problem solved**: Full contract lifecycle management — draft, activate, sign, terminate, review history.
- **Persona**: Property owner/legal.
- **Operational frequency**: Weekly.
- **Direct business impact**: Contracts are the legal basis for all revenue — must be accurate and properly signed.

### B. UI Structure Breakdown

- **Route**: `/merchant/contracts`
- **Page file**: `src/pages/merchant/Contracts.tsx`
- **PageHeader**: "Kontrak" with contract count + "Buat Kontrak" button.
- **Stats (4)**: `ContractStats` — total, active, pending signature, past.
- **Filters**: `ContractsFilters` — search (by ID or tenant name), status filter.
- **Tabs (5)**: Draf (count), Aktif (count), Segera Berakhir (badge if >0), Menunggu TTD (count), Riwayat (count).
- **Table per tab**: `ContractsTable` — paginated (10/page). Actions: View, Sign, Delete, Mark Notice.
- **Dialogs**: `CreateContractDialog` (unit + tenant selection, dates, amounts), `SignContractDialog` (signature capture), `DeleteContractDialog`.
- **Loading state**: `TabsPageSkeleton`.

### C. Interaction Flow Mapping

| Element | Result |
|---------|--------|
| "Buat Kontrak" | Opens `CreateContractDialog` with available units + tenant list |
| Sign action | Opens `SignContractDialog` with signature canvas |
| View action | Opens view dialog |
| Delete action | Opens `DeleteContractDialog` |
| Mark Notice | Marks contract for notice period |

### D. State Machine Mapping

- **Contract statuses**: `draft` → `pending` → `active` → `notice` → `terminated`/`expired`/`completed`.
- **Signature states**: Unsigned → Tenant signed → Merchant signed → Fully executed.
- **Hidden states**: `pendingSignature` filters — shows contracts where tenant signed but merchant hasn't.
- **Edge states**: Expiring contracts (≤30 days) filtered separately.

### E. UX Risk & Cognitive Load

- **Discoverability**: Good.
- **Information density**: High — 5 tabs each with paginated table.
- **Overlapping features**: Contract data also in PropertyDetail (2.1.4), Tenant Details dialog.

### F. Integration & Cross-Dependency

- **Depends on**: `useContractActions`, `usePropertiesWithUnits`, `useMerchantTenants`, `useTenantProfiles`.
- **Triggers**: Contract creation → generates invoices, affects occupancy. Termination → frees unit.
- **activePatterns**: `["/merchant/lease-renewals"]`.

### G. Scalability Impact

- Same as tenants — client-side pagination on all contracts.

### H. Optimization Opportunities

1. **Contract detail page**: Currently no dedicated `/merchant/contracts/:id` detail page — only dialog view.
2. **Batch operations**: Bulk renewal for expiring contracts.

---

### 3.3 Daftar Tunggu

### A. Business Purpose

- **Problem solved**: Manage prospective tenant queue — add applicants, track priority, send unit offers.
- **Persona**: Property manager handling prospecting.
- **Operational frequency**: Weekly.
- **Direct business impact**: Reduces vacancy duration by having ready applicants.

### B. UI Structure Breakdown

- **Route**: `/merchant/waiting-list`
- **Page file**: `src/pages/merchant/WaitingList.tsx`
- **Title**: "Daftar Tunggu".
- **Description**: "Kelola calon penyewa dan kirim penawaran".
- **Button**: "Tambah Pelamar" → `AddApplicantDialog`.
- **Card**: Pelamar card with `WaitingListTable`.
- **Dialogs**: `AddApplicantDialog`, `SendOfferDialog` (with unit selection).
- **No tabs, no KPI cards, no filters, no pagination**.

### C. Interaction Flow Mapping

- **"Tambah Pelamar"**: Opens `AddApplicantDialog` → adds to waiting list.
- **Table row "Kirim Penawaran"**: Opens `SendOfferDialog` → sends offer with unit ID.
- **Status update**: Inline status change per row.

### D. State Machine Mapping

- **Applicant statuses**: ⚠ Not Clearly Defined in Current System — managed via `updateStatus` mutation with current → next status.

### E. UX Risk & Cognitive Load

- **Discoverability**: Low — third item in group.
- **Information density**: Low.
- **Mental model mismatch**: "Daftar Tunggu" may not be intuitive for all users.

### F. Integration & Cross-Dependency

- **Depends on**: `useWaitingList` custom hook.
- **Triggers**: Sending offer → initiates tenant onboarding flow.

### G. Scalability Impact

- **No pagination** — table will need it at scale.

### H. Optimization Opportunities

1. **Add pagination and search**.
2. **Priority ordering**: Allow manual reordering.

---

## 4. Keuangan (Group)

---

### 4.1 Kontrol Keuangan

### A. Business Purpose

- **Problem solved**: Financial overview + approval workflow — cash balance, receivables, payables, and pending approvals in one place.
- **Persona**: Property owner as financial approver.
- **Operational frequency**: Daily.
- **Direct business impact**: Approval delays block expenses, refunds, and move-outs.

### B. UI Structure Breakdown

- **Route**: `/merchant/financial-control`
- **Page file**: `src/pages/merchant/FinancialControl.tsx`
- **KPI cards (4)**: Saldo Kas (revenue - expenses), Piutang (unpaid invoices), Hutang (pending expenses + refunds), Menunggu Approve (pending items count, with alert border if >0).
- **Approval Rules (collapsible)**: Info section explaining auto-approval rules vs manual approval thresholds.
- **Pending Approvals list**: Each item shows type badge (Pengeluaran/Refund Deposit/Move-Out), amount, description, date. Actions: Setuju / Tolak.
- **Recent Transactions (10)**: Shows last 10 transactions with type icon, description, amount, status badge.
- **No tabs, no pagination, no filters**.
- **Loading state**: Centered spinner.
- **⚠ Uses direct color classes**: `bg-green-100`, `bg-yellow-100`, `bg-red-100` — violates design system guidelines.

### C. Interaction Flow Mapping

- **Approve**: Calls respective mutation (expense/deposit_refund/move_out).
- **Reject**: Calls respective reject mutation.
- **No navigation** — self-contained page.

### D. State Machine Mapping

- **Approval types**: `expense`, `deposit_refund`, `move_out`.
- **States per item**: `pending_approval` → `approved` | `rejected`.

### E. UX Risk & Cognitive Load

- **Discoverability**: Medium — first in Keuangan group but group has 9 items.
- **Information density**: Medium — 4 KPIs + 2 lists.
- **Overlapping features**: Pending approvals also appear in Expenses (4.5) approval tab.

### F. Integration & Cross-Dependency

- **Depends on**: `useFinancialControl` — aggregates across expenses, invoices, deposit_refunds, move_out inspections.
- **Triggers**: Approval → updates expense status, triggers disbursement.

### G. Scalability Impact

- **10 recent transactions**: Fixed limit. OK at scale.
- **Pending approvals**: Could be many at scale — no pagination.

### H. Optimization Opportunities

1. **Paginate pending approvals**.
2. **Fix design system violations**: Replace direct color classes with semantic tokens.

---

### 4.2 Tagihan

### A. Business Purpose

- **Problem solved**: Invoice lifecycle management — create, send, track payment status, send reminders.
- **Persona**: Property owner/accountant.
- **Operational frequency**: Daily.
- **Direct business impact**: Invoices are the primary revenue collection mechanism.

### B. UI Structure Breakdown

- **Route**: `/merchant/invoices`
- **Page file**: `src/pages/merchant/Invoices.tsx`
- **Stats**: `InvoicesStats` — rendered from invoices array.
- **Tabs (5)**: Semua (count), Draf (count), Terkirim (count), Lunas (count), Jatuh Tempo (destructive badge if >0).
- **Filters**: `InvoicesFilters` — search (by invoice_number/description), status filter.
- **Table**: `InvoicesTable` — paginated (10/page). Actions: View (opens `InvoiceDetailsDialog`), Download PDF, Send, Remind.
- **Dialogs**: `CreateInvoiceDialog` (with contract selection), `InvoiceDetailsDialog` (with send/mark paid/remind actions).
- **Loading state**: `TabsPageSkeleton`.

### C. Interaction Flow Mapping

| Element | Result |
|---------|--------|
| "Buat Faktur" | Opens `CreateInvoiceDialog` |
| Send invoice | `handleSendInvoice` — sends notification to tenant |
| Mark as paid | `handleMarkAsPaid` — updates status |
| Send reminder | `handleSendReminder` — sends reminder notification |
| Download PDF | `downloadInvoicePdf` — generates and downloads PDF |
| View | Opens `InvoiceDetailsDialog` (modal) |

### D. State Machine Mapping

- **Invoice statuses**: `draft` → `sent` → `paid` | `overdue`.
- **Hidden states**: Reminder in progress (loading state per invoice).

### E–H. Standard financial CRUD. Client-side pagination.

---

### 4.3 Pembayaran

### A. Business Purpose

- **Problem solved**: Track all payment transactions, manage overdue invoices, monitor transfer status.
- **Persona**: Property owner/accountant.
- **Operational frequency**: Daily.
- **Direct business impact**: Payment visibility ensures cash flow health.

### B. UI Structure Breakdown

- **Route**: `/merchant/payments`
- **Page file**: `src/pages/merchant/Payments.tsx`
- **PageHeader buttons**: "Tambah Pembayaran" (opens `CreatePaymentDialog`), "Refresh", "Kirim Pengingat" (bulk — conditional on overdue invoices).
- **Stats**: `PaymentsStats`.
- **Filters**: `PaymentsFilters` — search, status filter.
- **Tabs (3)**: Riwayat Pembayaran (with pending count badge), Tagihan Terlambat (with overdue count destructive badge), Status Transfer (with failed count badge).
- **Tables per tab**: `PaymentsTable` (history), `OverdueInvoicesTable` (overdue), `TransferStatusTab` (transfers).
- **Pagination**: 10/page per tab.
- **Dialogs**: `MarkPaidDialog` (manual mark paid with proof upload), `CreatePaymentDialog`, `PaymentPlanDialog` (installment plan for overdue).

### C. Interaction Flow Mapping

| Element | Result |
|---------|--------|
| Mark as paid | Opens `MarkPaidDialog` with payment method, reference, proof photo |
| Setup payment plan | Opens `PaymentPlanDialog` from overdue table |
| Bulk reminder | Sends reminders to all overdue tenants |
| Retry transfer | Retries failed disbursement |

### D. State Machine Mapping

- **Payment statuses**: `pending` → `verified`/`paid`.
- **Transfer statuses**: `pending` → `processing` → `completed` | `failed`.

### E. UX Risk & Cognitive Load

- **Information density**: High — 3 tabs with different data structures.

### F. Integration & Cross-Dependency

- **Depends on**: `useMerchantPayments`, `usePaymentTransfers`.
- **Triggers**: Payment verification → updates invoice status. Transfer retry → re-attempts disbursement.

### G–H. Standard. Needs server-side pagination at scale.

---

### 4.4 Penagihan

### A. Business Purpose

- **Problem solved**: Collections management for overdue invoices — aging analysis, case management, reporting.
- **Persona**: Property owner/collections officer.
- **Operational frequency**: Weekly.
- **Direct business impact**: Reduces bad debt by systematic follow-up.

### B. UI Structure Breakdown

- **Route**: `/merchant/collections`
- **Page file**: `src/pages/merchant/Collections.tsx`
- **Summary**: `CollectionsSummary` — aggregate collection stats.
- **Tabs (3)**:
  - **Dashboard**: `AgingBuckets` (click to filter) + `OutstandingTable` (filtered by selected bucket).
  - **Kasus**: `CollectionsCasesList` — case management with status transitions.
  - **Laporan**: `CollectionsReportWidgets` — collection performance reports.
- **No pagination, no search explicitly in this page**.

### C. Interaction Flow Mapping

- **Aging bucket click**: Filters `OutstandingTable` by aging period.
- **Case status update**: `updateCaseStatus` mutation with current/next status and optional resolution.

### D. State Machine Mapping

- **Case statuses**: ⚠ Managed via `useUpdateCaseStatus` with `currentStatus`, `newStatus`, `resolution`.

### E–H. Low-medium complexity. Needs pagination for outstanding table at scale.

---

### 4.5 Pengeluaran

### A. Business Purpose

- **Problem solved**: Track all operational expenses with categorization, approval workflow, and receipt management.
- **Persona**: Property owner/accountant.
- **Operational frequency**: Weekly.
- **Direct business impact**: Expense tracking enables P&L reporting and tax compliance.

### B. UI Structure Breakdown

- **Route**: `/merchant/expenses`
- **Page file**: `src/pages/merchant/Expenses.tsx`
- **Stat cards (4)**: `StatCard` components — Pengeluaran Bulan Ini (amount + transaction count), Tren vs Bulan Lalu (%), Kategori Terbesar (name + amount), Menunggu Approval (count).
- **Category breakdown**: Horizontal bar chart showing category percentages.
- **Tabs (2)**: Daftar Pengeluaran (with search + table), Approval (with pending count badge, `ExpenseApprovalList` component).
- **Table columns**: Tanggal, Kategori, Deskripsi, Jumlah, Status, Aksi (receipt view + delete).
- **Dialogs**: `ExpenseCreateDialog`, `ReceiptViewer`.
- **No pagination on expense table**.
- **⚠ Toast**: Uses `sonner` (inconsistent with other pages using `useToast`).

### C–H. Standard CRUD. Needs pagination.

---

### 4.6 Rekonsiliasi

### A. Business Purpose

- **Problem solved**: Match incoming payments to invoices — auto-match or manual match.
- **Persona**: Accountant.
- **Operational frequency**: Daily.
- **Direct business impact**: Accurate reconciliation ensures financial integrity.

### B. UI Structure Breakdown

- **Route**: `/merchant/reconciliation`
- **Page file**: `src/pages/merchant/Reconciliation.tsx`
- **Stat cards (3)**: Belum Dicocokkan (count), Perlu Review (count), Total Belum Cocok (amount).
- **Tabs (3)**: Perlu Review, Riwayat Cocok, Laporan.
- **Review tab**: If ≤10 payments → renders individual `PaymentReviewCard` per payment (with auto-match and manual-match actions). If >10 → renders `UnmatchedPaymentsTable`.
- **History tab**: `MatchHistoryTable`.
- **Report tab**: `ReconciliationReport`.

### C. Interaction Flow Mapping

- **Auto-match**: `autoMatch` mutation — system attempts to find matching invoice.
- **Manual match**: `manualMatch` mutation — user selects invoice ID and amount.

### D–H. Medium complexity. Payment review cards vs table threshold at 10 items is an unusual UX pattern.

---

### 4.7 Utilitas

### A. Business Purpose

- **Problem solved**: Manage utility billing (water, electricity, internet, shared costs) per property.
- **Persona**: Property owner.
- **Operational frequency**: Monthly.
- **Direct business impact**: Utility pass-through charges supplement rental income.

### B. UI Structure Breakdown

- **Route**: `/merchant/utility-billing`
- **Page file**: `src/pages/merchant/UtilityBilling.tsx`
- **⚠ Layout**: Uses `MerchantLayout` wrapper instead of standard `DashboardLayout` pattern — inconsistency.
- **Property selector**: Dropdown to select property. Auto-selects first property.
- **Tabs (3, conditional on property selection)**: Pengaturan (`UtilitySettingsForm`), Input Meter (`MeterReadingForm`), Tagihan (`UtilityChargeGenerator`).
- **Empty state**: "Anda belum memiliki properti" or "Pilih properti untuk memulai".

### C. Interaction Flow Mapping

- **Property selector change**: Loads utility settings for selected property.
- All interactions scoped to selected property.

### D. State Machine Mapping

- **Core states**: No property selected | Property selected with 3 tabs.
- **Hidden states**: Property without utility settings configured.

### E. UX Risk & Cognitive Load

- **Discoverability**: Low — 7th item in Keuangan group.
- **Mental model mismatch**: Property selector is separate from the global PropertySwitcher in sidebar.

### F. Integration & Cross-Dependency

- **Triggers**: Generated utility charges become invoices.

### G–H. Low complexity per property. Layout inconsistency should be fixed.

---

### 4.8 Harga Dinamis

### A. Business Purpose

- **Problem solved**: Configure automatic price adjustment rules based on occupancy, season, and demand.
- **Persona**: Property owner optimizing revenue.
- **Operational frequency**: Monthly.
- **Direct business impact**: Dynamic pricing maximizes revenue per unit.

### B. UI Structure Breakdown

- **Route**: `/merchant/dynamic-pricing`
- **Page file**: `src/pages/merchant/DynamicPricing.tsx`
- **Stat cards (3)**: Total Aturan (count), Aturan Aktif (count, green), Properti Tercakup (unique property count or "Semua").
- **Table**: `PricingRulesTable` — all pricing rules.
- **Button**: `CreatePricingRuleDialog` (in header area).
- **Loading state**: Centered spinner.
- **No tabs, no filters, no pagination**.

### C–H. Low complexity. Needs pagination for many rules.

---

### 4.9 Lap. Keuangan

### A. Business Purpose

- **Problem solved**: Financial reporting — P&L, revenue by property, expense by category.
- **Persona**: Property owner/accountant.
- **Operational frequency**: Monthly.
- **Direct business impact**: Financial reporting for tax, investor relations, and decision-making.

### B. UI Structure Breakdown

- **Route**: `/merchant/financial-reports`
- **Page file**: `src/pages/merchant/FinancialReports.tsx`
- **Summary cards (4)**: Total Pendapatan (green), Total Pengeluaran (red), Laba Bersih (green/red), Margin Laba (%).
- **Tabs (3)**:
  - **Laba Rugi**: Stacked BarChart (revenue vs expenses by month) + LineChart (net income trend).
  - **Pendapatan per Properti**: PieChart.
  - **Pengeluaran per Kategori**: PieChart.
- **Loading state**: Centered spinner.
- **Empty state**: "Data belum tersedia."
- **⚠ Uses direct color classes**: `text-green-600`, `text-red-600` — violates design system.
- **Chart colors**: Properly uses HSL from CSS variables.

### C–H. Read-only reporting. No export functionality (unlike Reports page 5.2).

---

## 5. Wawasan & Manajemen (Group)

---

### 5.1 Alat (InsightsHub)

### A. Business Purpose

- **Problem solved**: Central discovery page for analytics tools and AI intelligence features.
- **Persona**: Property owner looking for analytical insights.
- **Operational frequency**: Weekly.
- **Direct business impact**: Enables data-driven decision making.

### B. UI Structure Breakdown

- **Route**: `/merchant/insights`
- **Page file**: `src/pages/merchant/InsightsHub.tsx`
- **PageHeader**: "Alat & Intelijen".
- **Section 1 — Performa (3 cards)**: Template Laporan → `/merchant/report-templates`, Portofolio Komparatif → `/merchant/comparative-portfolio`, Pusat Dokumen → `/merchant/documents`. Tagged "Standar".
- **Section 2 — Intelijen AI (6 cards)**: Prediksi ML → `/merchant/ml-analytics`, Strategi DSS → `/merchant/dss-advisor`, Tren Pasar → `/merchant/market-intelligence`, Risiko Keuangan → `/merchant/financial-risk`, Skor Penyewa → `/merchant/tenant-quality`, Kualitas Data → `/merchant/data-quality`. Tagged "Premium".
- **Each card**: Icon + title + description. Click navigates to standalone page.
- **No tabs, no filters, no data loading** — pure navigation hub.

### C. Interaction Flow Mapping

- All cards navigate to standalone pages (9 total destinations).
- **activePatterns**: Extensive list covering all sub-pages.

### D. State Machine Mapping

- Stateless — pure navigation.

### E. UX Risk & Cognitive Load

- **Discoverability**: Medium — relies on users visiting this hub to find sub-pages.
- **Information density**: Low — card grid.
- **Overlapping features**: Some links also accessible from other pages (e.g., Reports, Documents).

### F. Integration & Cross-Dependency

- Pure navigation. No data dependencies.

### G. Scalability Impact

- N/A — static page.

### H. Optimization Opportunities

1. **Show preview metrics on cards**: Instead of pure navigation, show key metrics per card (e.g., "3 rekomendasi aktif" for DSS).
2. **Remove hub pattern**: These pages could be promoted to sidebar items directly if the group isn't too large.

---

### 5.2 Laporan

### A. Business Purpose

- **Problem solved**: Comprehensive reporting with multiple analytical views — revenue trends, ROI, forecasting, churn, maintenance analytics.
- **Persona**: Property owner/executive.
- **Operational frequency**: Weekly/monthly.
- **Direct business impact**: Strategic decision-making based on trend analysis.

### B. UI Structure Breakdown

- **Route**: `/merchant/reports`
- **Page file**: `src/pages/merchant/Reports.tsx`
- **PageHeader**: "Laporan & Analitik" with export dropdown + date range picker + time range selector (3/6/12 months).
- **Export dropdown**: PDF, Payments CSV, Maintenance CSV.
- **Tabs (6)**: Ringkasan, Dashboard, ROI & Ringkasan, Perkiraan, Perputaran Tenant, Pemeliharaan.
- **Ringkasan tab**: 5 KPI cards + `OnTimePaymentRate` widget + Revenue AreaChart + Occupancy PieChart.
- **Dashboard tab**: `AnalyticsDashboardTab` component.
- **ROI tab**: 4 KPI cards (ROI, Yield, NOI, Total Investasi) + ROI per Property breakdown.
- **Perkiraan tab**: `RevenueForecast` + `ContractNoticePeriod`.
- **Perputaran Tenant tab**: `TenantChurnAnalytics`.
- **Pemeliharaan tab**: Maintenance charts.
- **Error state**: Alert with refresh prompt.
- **Loading state**: `StatsRowSkeleton` + `ChartSkeleton`.

### C. Interaction Flow Mapping

- **Date range picker**: Changes data scope for all tabs.
- **Time range selector**: 3/6/12 months (disabled if custom date range set).
- **Export**: PDF generates full report, CSV exports raw data.

### D–H. Read-only analytics. High complexity (6 tabs). Date range is global across tabs — good UX.

---

### 5.3 Template Dokumen

### A. Business Purpose

- **Problem solved**: Document template management — create, edit, fill, and generate documents from templates (contracts, checklists, notices).
- **Persona**: Property owner/legal.
- **Operational frequency**: Monthly.
- **Direct business impact**: Standardized documents reduce legal risk.

### B. UI Structure Breakdown

- **Route**: `/merchant/document-templates`
- **Page file**: `src/pages/merchant/DocumentTemplates.tsx`
- **⚠ Layout**: Uses `MerchantLayout` wrapper (same inconsistency as Utility Billing).
- **Category filter**: Dropdown (all categories + specific: lease_contract, house_rules, move_in_checklist, inspection_report, eviction_notice, payment_reminder, other).
- **Template cards**: Grouped by category. Each card shows name, description, version, date. Actions via dropdown: Gunakan/Isi, Edit (custom only), Duplikasi (system only), Hapus (custom only).
- **System vs custom templates**: System templates are read-only (can only duplicate). Custom templates are fully editable.
- **Dialogs**: `DocumentTemplateEditor` (rich editor with variables), `DocumentFillDialog` (fill template with variable values).
- **Empty state**: Prompt to create first template.

### C. Interaction Flow Mapping

- **"Buat Template"**: Opens `DocumentTemplateEditor` in dialog.
- **"Gunakan / Isi"**: Opens `DocumentFillDialog` — fill variable placeholders and generate document.
- **"Duplikasi"**: Creates merchant copy of system template.

### D–H. Medium complexity. Template variable system adds sophistication.

---

### 5.4 Manajemen Staff

### A. Business Purpose

- **Problem solved**: Manage internal staff access — invite caretakers, property managers, accountants with granular permissions and property scope.
- **Persona**: Property owner delegating access.
- **Operational frequency**: Monthly.
- **Direct business impact**: Delegation enables scaling operations without owner bottleneck.

### B. UI Structure Breakdown

- **Route**: `/merchant/staff`
- **Page file**: `src/pages/merchant/StaffManagement.tsx`
- **PageHeader**: "Manajemen Staff" + "Undang Staff" button.
- **Staff card grid**: Each card shows name, role badge (Caretaker/Property Manager/Accountant), email, phone, active status, property scope badges (all properties or specific). Actions: "Izin" (permissions), "Nonaktifkan" (deactivate).
- **Invite dialog**: Name, email, phone, role selector, property scope (all or specific checkboxes).
- **Permissions dialog**: `PermissionsDialog` — grouped permission switches (`PERMISSION_GROUPS`) with collapsible sections. Shows property scope. Individual toggle per permission key.
- **Empty state**: "Belum ada staff."
- **Loading state**: Centered spinner.

### C. Interaction Flow Mapping

- **"Undang Staff"**: Opens dialog → creates staff record with role and property scope.
- **"Izin"**: Opens `PermissionsDialog` → view/edit granular permissions per permission key.
- **"Nonaktifkan"**: Sets `is_active` to false.

### D. State Machine Mapping

- **Staff states**: Active | Inactive.
- **Permission model**: Per-staff, per-key boolean grants. Grouped by `PERMISSION_GROUPS`.
- **Property scope**: Empty array = all properties. Non-empty = specific properties only.

### E. UX Risk & Cognitive Load

- **Discoverability**: Low — 4th item in Wawasan group.
- **Information density**: Low (card grid) but permissions dialog is dense.

### F. Integration & Cross-Dependency

- **Triggers**: Staff permissions affect what staff users can access throughout the system.
- **⚠ Not Clearly Defined**: How staff users actually use these permissions in the runtime system (RLS policies, frontend guards) is not visible from page code alone.

### G–H. Low complexity. No pagination — needs it for many staff.

---

### 5.5 Performa Vendor

### A. Business Purpose

- **Problem solved**: Analyze vendor performance — ratings, response times, costs, comparison, and job history.
- **Persona**: Property owner evaluating maintenance vendors.
- **Operational frequency**: Monthly.
- **Direct business impact**: Choosing optimal vendors reduces maintenance costs and improves quality.

### B. UI Structure Breakdown

- **Route**: `/merchant/vendor-performance`
- **Page file**: `src/pages/merchant/VendorPerformance.tsx`
- **Stat cards (4)**: Total Vendor (count), Rata-rata Rating, Rata-rata Respon (hours), Total Pengeluaran.
- **Tabs (3)**:
  - **Ringkasan**: Table — Vendor, Spesialisasi (badges), Rating (star), Job count, Response hours, Total Cost, Favorit toggle.
  - **Perbandingan**: Select 2-3 vendors → BarChart comparing response time and rating.
  - **Riwayat**: Select vendor → `VendorHistoryTable` showing past jobs with status, cost, rating, date.
- **Favorite toggle**: `useTogglePreferred` mutation.
- **Loading state**: Centered spinner.

### C. Interaction Flow Mapping

- **Vendor compare selection**: Click vendor buttons (max 3) → updates BarChart.
- **Vendor history selection**: Dropdown → loads history table.
- **Toggle favorite**: Star button per vendor.

### D–H. Read-only analytics + favorite toggle. Low complexity.

---

### 5.6 API & Integrasi

### A. Business Purpose

- **Problem solved**: Developer tools — API key management, webhook configuration, and API documentation.
- **Persona**: Technical user/developer integrating with SiHuni API.
- **Operational frequency**: Rarely.
- **Direct business impact**: Enables third-party integrations (accounting software, custom dashboards).

### B. UI Structure Breakdown

- **Route**: `/merchant/api-integration`
- **Page file**: `src/pages/merchant/ApiIntegration.tsx`
- **Tabs (3)**:
  - **API Keys**: List of keys (name, prefix, scopes, rate limit). Actions: Create (dialog), Revoke. Warning card for new key (copy-once).
  - **Webhooks**: Endpoint list (URL, events, failure count). Actions: Create (dialog with event selection checkboxes), Delete, View Logs. Log viewer shows delivery history.
  - **Dokumentasi**: Static API documentation (auth, endpoints table, response format, webhook events, signature verification, rate limiting).
- **⚠ Toast**: Uses `sonner`.

### C–H. Developer tooling. Low operational frequency. Self-contained.

---

## 6. Bantuan

### A. Business Purpose

- **Problem solved**: Self-service help center — FAQ, AI assistant, useful links, system status.
- **Persona**: Any merchant user needing help.
- **Operational frequency**: As needed.
- **Direct business impact**: Reduces support ticket volume.

### B. UI Structure Breakdown

- **Route**: `/merchant/support`
- **Page file**: `src/pages/merchant/Support.tsx`
- **PageHeader**: "Pusat Bantuan" with LifeBuoy icon.
- **AI Assistant CTA card**: Gradient card with "Tanya AI Assistant" button → dispatches `open-chatbot` custom event.
- **FAQ section (2/3 width)**: 5 category cards (Properti & Unit, Kontrak & Penyewa, Pembayaran & Keuangan, Maintenance, Keamanan & Akun). Each with Accordion of Q&A items.
- **Sidebar (1/3 width)**: Useful Links (Pengaturan Akun, Billing & Langganan, Profil Bisnis, Kirim Feedback — all navigate to internal routes). System Status (API & Platform, Database, Payment Gateway — all show "Operasional" with green dot).
- **No tabs, no forms, no data loading**.

### C. Interaction Flow Mapping

- **"Tanya AI Assistant"**: Opens floating chatbot via custom event.
- **FAQ accordion**: Expand/collapse Q&A.
- **Useful links**: Navigate to internal pages.

### D. State Machine Mapping

- Stateless — pure informational page.
- **⚠ System status is hardcoded** — always shows "Operasional". Not connected to real monitoring.

### E. UX Risk & Cognitive Load

- **Discoverability**: Good — sidebar item (in Akun group) + NavSecondary (footer).
- **⚠ Duplication**: Bantuan appears BOTH in sidebar "Akun" group AND in NavSecondary (footer). Renders in both locations.

### F–H. Static page. No scalability concerns.

---

## 7. Feedback

### A. Business Purpose

- **Problem solved**: User feedback collection — feature requests, bug reports, UX feedback with rating and screenshot.
- **Persona**: Any merchant user.
- **Operational frequency**: As needed.
- **Direct business impact**: Product improvement through user feedback.

### B. UI Structure Breakdown

- **Route**: `/merchant/feedback`
- **Page file**: `src/pages/merchant/Feedback.tsx`
- **Layout (2/3 + 1/3)**:
  - **Form (2/3)**: Category selector (Permintaan Fitur, Laporan Bug, Pengalaman Pengguna, Lainnya), Star rating (1-5, optional), Message textarea, Screenshot upload (`FileUpload`), Submit button.
  - **History (1/3)**: Past feedback cards with date, status badge (Menunggu/Ditinjau/Selesai), category, rating, message (line-clamped), admin response (if any).
- **Status badges**: `pending` → Menunggu, `reviewed` → Ditinjau, `resolved` → Selesai.
- **⚠ Toast**: Uses `sonner`.
- **⚠ Table**: Uses `merchant_feedback` table — cast via `(supabase as any)` suggesting table may not be in TypeScript types.

### C. Interaction Flow Mapping

- **Submit feedback**: Validates category + message → inserts to `merchant_feedback` → refreshes history.
- **Screenshot upload**: `FileUpload` component → stores in `verification-documents` bucket.

### D–H. Low complexity. ⚠ Duplication with Bantuan in sidebar + NavSecondary.

---

# NAVBAR

---

## 8. Breadcrumb

### A. Business Purpose

- **Problem solved**: Navigation context — shows current location in the app hierarchy with clickable intermediate segments.
- **Persona**: All users.
- **Operational frequency**: Every page view (passive).
- **Direct business impact**: Reduces navigation errors and supports wayfinding.

### B. UI Structure Breakdown

- **Component**: Rendered in `DashboardLayout.tsx` header.
- **Source**: `generateBreadcrumbs(role, location.pathname)` from `src/shared/utils/breadcrumbUtils.ts`.
- **Structure**: Breadcrumb → BreadcrumbList → BreadcrumbItem → BreadcrumbLink (intermediate) / BreadcrumbPage (last).
- **First crumb**: Hidden on mobile (`hidden md:block`).
- **Separators**: BreadcrumbSeparator between items.

### C. Interaction Flow Mapping

- **Intermediate crumb click**: Navigates to that path via `<Link>`.
- **Last crumb**: Non-interactive (current page).
- Auto-generated from route — no manual configuration needed.

### D–H. Stateless. No scalability concerns. Works well.

---

## 9. Search

### A. Business Purpose

- **Problem solved**: Quick navigation via keyboard shortcut — search all sidebar items by label.
- **Persona**: Power users.
- **Operational frequency**: Multiple times daily for experienced users.
- **Direct business impact**: Reduces time-to-navigation.

### B. UI Structure Breakdown

- **Component**: `SearchCommand` from `src/shared/components/layouts/SearchCommand.tsx`.
- **Trigger**: Button with Cmd+K shortcut indicator.
- **Dialog**: Uses `cmdk` (Command Menu) — `CommandDialog`.
- **Content**: Lists all nav items from `navigationConfig[role]`, grouped by sidebar group.
- **Search**: Fuzzy match on item labels.
- **Action**: Click item → navigate to its path.

### C. Interaction Flow Mapping

- **Cmd+K / Ctrl+K**: Opens CommandDialog.
- **Type query**: Filters nav items.
- **Select item**: Navigate + close dialog.

### D–H. Stateless navigation aid. Works well at any scale.

---

## 10. Dark Toggle Theme

### A. Business Purpose

- **Problem solved**: User preference for light/dark mode.
- **Persona**: All users.
- **Operational frequency**: Once per session (set and forget).
- **Direct business impact**: Accessibility and user comfort.

### B. UI Structure Breakdown

- **Component**: `ThemeToggle` from `src/shared/components/ui/ThemeToggle.tsx`.
- **Source**: `useTheme()` context.
- **Behavior**: Toggles between light and dark modes.

### C–H. Minimal. Stored in context/localStorage. No cross-module impact.

---

## 11. Notification Icon

### A. Business Purpose

- **Problem solved**: Real-time notification delivery — alerts for payments, maintenance, contracts, and system events.
- **Persona**: All merchant users.
- **Operational frequency**: Continuous (passive monitoring).
- **Direct business impact**: Timely notifications prevent missed deadlines and overdue payments.

### B. UI Structure Breakdown

- **Component**: `NotificationsDropdown` from `src/features/notifications/components/NotificationsDropdown.tsx`.
- **Trigger**: Bell icon with unread count badge.
- **Dropdown content**: List of notifications with expandable messages. Actions: Mark as read, navigate to linked resource.
- **Real-time**: Supabase realtime subscription for new notifications.

### C. Interaction Flow Mapping

- **Click bell**: Opens dropdown.
- **Click notification**: Navigates to related page (e.g., invoice, maintenance request).
- **Mark as read**: Updates notification status.

### D. State Machine Mapping

- **Notification states**: Unread → Read.
- **Real-time updates**: New notifications appear without page refresh.

### E. UX Risk & Cognitive Load

- **Discoverability**: Good — always visible in navbar.
- **Information density**: Can be overwhelming with many unread notifications — no pagination in dropdown.

### F. Integration & Cross-Dependency

- **Depends on**: `notifications` table with realtime subscription.
- **Triggers**: Notification click → cross-module navigation.

### G–H. Needs pagination/virtualization in dropdown for high-volume notification scenarios.

---

# NAV USER

---

## 12. Profile

### A. Business Purpose

- **Problem solved**: User/business profile management.
- **Persona**: Merchant owner.
- **Operational frequency**: Rarely.
- **Direct business impact**: Business profile affects verification status and trust.

### B. UI Structure Breakdown

- **Entry point**: NavUser dropdown → "Profile" item.
- **Route**: `/{role}/profile`
- **NavUser dropdown items (actual)**: Profile, Billing (merchant only), Settings, Log out. Optional: "Upgrade to Pro" (if not enterprise).
- **⚠ No "Notifikasi" item in NavUser dropdown** — it only exists as a sidebar item.

### C–H. Standard profile page. Low complexity.

---

## 13. Notifikasi

⚠ **Not Clearly Defined in Current System** for NavUser context.

### A. Business Purpose

- In the **sidebar**, Notifikasi exists at `/merchant/alerts` in the "Utama" group with a dynamic badge (`badgeKey: "alerts"`).
- In the **NavUser dropdown**, there is NO "Notifikasi" item. The dropdown contains: Profile, Billing, Settings, Log out.
- The **navbar** has a NotificationsDropdown (item 11) which serves the notification viewing purpose.

### B. UI Structure Breakdown

- **Sidebar route**: `/merchant/alerts` — presumably an alerts/notification center page.
- **NavUser**: Not present.
- **Navbar**: NotificationsDropdown serves this function.

### C–H. See item 11 (Notification Icon) for the functional implementation.

---

## 14. Langganan (Billing)

### A. Business Purpose

- **Problem solved**: Subscription management — view plan, upgrade, payment history.
- **Persona**: Property owner.
- **Operational frequency**: Monthly.
- **Direct business impact**: Subscription tier determines feature access and property limits.

### B. UI Structure Breakdown

- **Entry point**: NavUser dropdown → "Billing" (merchant only).
- **Also in sidebar**: "Akun" group → "Langganan" → `/merchant/billing`.
- **Route**: `/merchant/billing`

### C–H. Standard billing/subscription page.

---

## 15. Pengaturan (Settings)

### A. Business Purpose

- **Problem solved**: Account configuration — notification preferences, bank account management, disbursement schedule.
- **Persona**: Property owner.
- **Operational frequency**: Monthly.
- **Direct business impact**: Bank setup enables payment reception. Notification settings affect operational awareness.

### B. UI Structure Breakdown

- **Entry points**: NavUser dropdown → "Settings", Sidebar "Akun" group → "Pengaturan".
- **Route**: `/merchant/settings`
- **Page file**: `src/pages/merchant/Settings.tsx`
- **PageHeader**: "Pengaturan" with Settings icon.
- **Tabs (3)**:

#### 15.1 Notifikasi Tab

- **Component**: `MerchantNotificationSettings`.
- **Purpose**: Configure which notifications to receive and through which channels.

#### 15.2 Perbankan Tab

- **Component**: `BankAccountManager`.
- **Purpose**: Manage bank accounts for receiving payments. Set primary account.

#### 15.3 Pencairan Tab

- **Component**: `DisbursementScheduleSettings`.
- **Purpose**: Configure automatic disbursement schedule (frequency, day, minimum amount).

### C. Interaction Flow Mapping

- **Tab selection**: URL query param `?tab=notifications|banking|disbursement`.
- Each tab contains its own form with save functionality.

### D. State Machine Mapping

- Per-tab form states. Bank accounts have primary/secondary designation.

### E. UX Risk & Cognitive Load

- **Discoverability**: Good — accessible from both NavUser and sidebar.
- **Information density**: Low per tab.

### F–H. Standard settings. Low complexity.

---

# GLOBAL NAVIGATION AUDIT

---

## 1. Total Sidebar Depth

| Metric | Value |
|--------|-------|
| **Max nesting level** | 2 (Group → Item). No sub-menus or nested dropdowns. |
| **Avg nesting level** | 2 for all items (flat within groups). |
| **Over-nested modules** | None — sidebar is flat. BUT PropertyDetail has 7 internal tabs which function as Level 3+. |
| **Total sidebar groups** | 6 (Utama, Properti & Okupansi, Penyewa & Kontrak, Keuangan, Wawasan & Manajemen, Akun). |
| **Total sidebar items** | 28 (including Akun group items). |
| **Keuangan group size** | 9 items — largest group, may overwhelm users. |

---

## 2. Discoverability Risk Ranking

| Rank | Feature | Path | Why Hard to Find |
|------|---------|------|------------------|
| 1 | Kualitas Data | `/merchant/data-quality` | Behind InsightsHub card grid → 6th AI card |
| 2 | Strategi DSS | `/merchant/dss-advisor` | Behind InsightsHub card grid |
| 3 | Skor Penyewa | `/merchant/tenant-quality` | Behind InsightsHub card grid |
| 4 | Portofolio Komparatif | `/merchant/comparative-portfolio` | Behind InsightsHub card grid |
| 5 | Risiko Keuangan | `/merchant/financial-risk` | Behind InsightsHub card grid |
| 6 | Tren Pasar | `/merchant/market-intelligence` | Behind InsightsHub card grid |
| 7 | Prediksi ML | `/merchant/ml-analytics` | Behind InsightsHub card grid |
| 8 | Rekonsiliasi | `/merchant/reconciliation` | 6th of 9 items in Keuangan group |
| 9 | Harga Dinamis | `/merchant/dynamic-pricing` | 8th of 9 items in Keuangan group |
| 10 | Daftar Tunggu | `/merchant/waiting-list` | 3rd item in Penyewa group, unclear naming |

**Pattern**: All InsightsHub sub-pages (7/10 hardest) are hidden behind a card-based hub page. Users must navigate to InsightsHub first, then find the right card.

---

## 3. Cross-Module Context Switch Map

Flows requiring >3 navigations:

| Flow | Steps | Path |
|------|-------|------|
| Create invoice for specific tenant | Dashboard → Properties → PropertyDetail → Tenants tab → Back → Invoices → Create → Select contract | 5+ navigations |
| Review vendor performance after maintenance | Maintenance → Detail → (no vendor link) → Navigate to Vendor Performance → Find vendor | 4+ navigations |
| Reconcile payment with invoice | Payments → (see payment) → Reconciliation → Find matching payment → Match | 3+ navigations (cross-page) |
| Set up utility billing for new property | Properties → Create property → Back → Utility Billing → Select property → Configure | 4+ navigations |
| Complete move-out with deposit refund | Tenants → "Pindah Keluar" → Process move-out → Financial Control → Approve refund | 4+ navigations |

---

## 4. Redundancy & Overlap Matrix

| Feature | Appears In | Redundancy Level |
|---------|-----------|-----------------|
| Occupancy data | Dashboard KPI, Properties KPI, PropertyDetail KPI, Reports, Occupancy Board | HIGH |
| Revenue data | Dashboard KPI, Dashboard Financial Summary, Reports (multiple tabs), Financial Reports, Financial Control | HIGH |
| Maintenance requests | Maintenance page (2.4), PropertyDetail tab (2.1.6), Dashboard Action Items | MEDIUM |
| Tenant list | Tenants page (3.1), PropertyDetail tab (2.1.4) | MEDIUM |
| Unit management | Properties page (via dialog), PropertyDetail Units tab, Occupancy Board | MEDIUM |
| Guardian management | Guardians page (2.5), PropertyDetail Staf tab (2.1.3) | MEDIUM — same component, different scope |
| Support/Feedback | Sidebar "Akun" group, NavSecondary (footer) | HIGH — renders in both locations |
| Financial reporting | Financial Reports (4.9), Reports (5.2) | HIGH — two separate pages with overlapping data |
| Expense approval | Financial Control (4.1), Expenses (4.5) approval tab | MEDIUM |

---

## 5. Navigation Restructure Proposal

### Problem Areas

1. **Keuangan group too large** (9 items) — cognitive overload.
2. **InsightsHub hides 9 sub-pages** — low discoverability.
3. **Financial Reports vs Reports redundancy** — confusing.
4. **Support/Feedback duplication** — unnecessary double rendering.

### Proposed Restructure

```text
Merchant Portal/
├── Utama
│   ├── Dashboard
│   └── Notifikasi
├── Properti
│   ├── Daftar Properti
│   ├── Papan Okupansi
│   ├── Inventori
│   └── Penjaga
├── Penyewa
│   ├── Penyewa
│   ├── Kontrak
│   └── Daftar Tunggu
├── Operasional
│   ├── Maintenance
│   ├── Utilitas
│   └── Penagihan
├── Keuangan
│   ├── Kontrol Keuangan
│   ├── Tagihan
│   ├── Pembayaran
│   ├── Pengeluaran
│   ├── Rekonsiliasi
│   └── Harga Dinamis
├── Wawasan
│   ├── Laporan (merge Reports + Financial Reports)
│   ├── Analitik AI (promote InsightsHub sub-pages to collapsible sub-nav)
│   ├── Performa Vendor
│   └── Template Dokumen
├── Pengaturan
│   ├── Manajemen Staff
│   ├── API & Integrasi
│   └── Pengaturan Akun
└── Bantuan (NavSecondary only — remove from sidebar Akun group)
    ├── Pusat Bantuan
    └── Feedback
```

### Key Changes

1. **Split Keuangan** (9→6): Move Utilitas and Penagihan to new "Operasional" group. Move Lap. Keuangan into merged Reports.
2. **Flatten InsightsHub**: Promote AI sub-pages to visible collapsible section under "Analitik AI".
3. **Merge Reports**: Combine Financial Reports (4.9) and Reports (5.2) into single "Laporan" with unified tab structure.
4. **Deduplicate Support**: Remove from sidebar Akun group. Keep only in NavSecondary.
5. **Create Pengaturan group**: Move Staff Management and API from Wawasan group (they're not "insights").

---

*End of Audit*
