
# Priority 9: Multi-Property Support + Simplification & Consolidation

## Overview

Two tracks of work:
1. **Multi-Property Support** -- Property switcher in sidebar, per-property dashboard filtering, consolidated view, side-by-side comparison, and per-property rules
2. **Simplification & Consolidation** -- Merge collections diagrams (11, 20, 6B) into unified collections flow, and merge support + reconciliation (14, 15) into unified dispute resolution dashboard

---

## Priority 9: Multi-Property Support

### 9A: Property Context Store (Zustand)

Create `src/shared/stores/propertyContext.ts`:
- Zustand store holding `selectedPropertyId: string | null` (null = "All Properties" consolidated view)
- `setSelectedProperty(id | null)` action
- Persisted to `localStorage` so selection survives page refresh
- All merchant service queries can optionally filter by this property ID

### 9B: Property Switcher Component

Create `src/shared/components/layouts/sidebar/PropertySwitcher.tsx`:
- Dropdown placed in sidebar header, below TeamSwitcher
- Shows list of merchant's properties fetched from Supabase
- First option: "Semua Properti" (consolidated view, selectedPropertyId = null)
- Each property shows name + occupancy badge
- On select: updates Zustand store, all dashboard queries re-fetch with new filter
- Only renders for merchant role

### 9C: Per-Property Dashboard Filtering

Modify `merchantDashboardService.ts`:
- `fetchStats(merchantId, propertyId?)` -- optional propertyId parameter
- When propertyId is set: filter properties, payments, contracts, tenants by that property
- When null: current behavior (all properties)

Modify `useMerchantDashboardStats.ts`:
- Read `selectedPropertyId` from Zustand store
- Include it in query key and pass to service

### 9D: Consolidated vs Per-Property View

Modify `Dashboard.tsx`:
- When "Semua Properti" selected: show current consolidated dashboard (no changes)
- When specific property selected: same layout but filtered data, hide "Ringkasan Properti" section (since it's a single property), show property-specific quick actions

### 9E: Side-by-Side Comparison

Enhance existing `ComparativePortfolio.tsx` page:
- Already has benchmarks, rankings, and radar chart comparing properties
- Add a new "Perbandingan" tab with two property selectors for direct side-by-side
- Show KPIs in two columns: Property A vs Property B (occupancy, revenue, tenant count, maintenance cost)
- Reuse existing `comparativePortfolioService` data

### 9F: Per-Property Rules

The system already supports per-property configuration:
- `dynamic_pricing_rules` has `property_id` column
- `contracts` are per-property via `unit_id`
- Invoice terms come from contract
- No new database changes needed -- the property switcher context will naturally scope the merchant's view to see only that property's rules

### 9G: Sidebar Integration

Modify `app-sidebar.tsx`:
- Import and render `PropertySwitcher` between `SidebarHeader` (TeamSwitcher) and `SidebarContent` (NavMain)
- Only shown for merchant role
- Pass merchant's properties list

---

## Simplification & Consolidation

### S1: Merge Collections Diagrams (11, 20, 6B)

The collections system is already consolidated from previous Priority 3 work:
- `collectionsService.ts` handles aging buckets + case management
- `CollectionsCaseDetail.tsx` has interaction timeline + escalation path
- Payment plans are tracked via `negotiation_status` on amendments

**Remaining consolidation work:**
- Add a "Rencana Pembayaran" (Payment Plan) tab/section to `CollectionsCaseDetail.tsx`
- Allow creating a simple payment plan directly from a collections case: split overdue amount into N installments with dates
- Store as JSON in `collections_cases.resolution_notes` (no new table needed)
- This unifies the workflow: Invoice overdue -> Collections case -> Resolution (full pay / payment plan / legal / write-off)

### S2: Merge Support & Reconciliation (Diagrams 14, 15)

Create a unified "Dispute Resolution & Reconciliation" view:

Create `src/pages/merchant/DisputeResolution.tsx`:
- Tabbed layout with 3 tabs:
  - **Rekonsiliasi Pembayaran** -- Embed existing reconciliation components (UnmatchedPaymentsTable, MatchHistoryTable)
  - **Keluhan Penyewa** -- List of tenant complaints/support tickets from `support_tickets` table (filtered by merchant)
  - **Sengketa** -- Disputes from `disputes` table (deposit disputes, payment disputes)
- Each tab shows count badge
- Unified "Pending Resolution" counter in merchant alerts

Update navigation: Keep `/merchant/reconciliation` route pointing to this new unified page. The old reconciliation content becomes Tab 1.

### S3: Navigation Cleanup

Update `navigation-config.ts`:
- Remove separate "Rekonsiliasi" nav item
- Rename or repurpose to "Resolusi & Rekonsiliasi" under Keuangan group
- No new routes needed -- just redirect/rename

---

## Files Summary

| Action | File | Description |
|--------|------|-------------|
| CREATE | `src/shared/stores/propertyContext.ts` | Zustand store for selected property |
| CREATE | `src/shared/components/layouts/sidebar/PropertySwitcher.tsx` | Dropdown property selector |
| CREATE | `src/pages/merchant/DisputeResolution.tsx` | Unified dispute + reconciliation page |
| MODIFY | `src/shared/components/layouts/sidebar/app-sidebar.tsx` | Add PropertySwitcher |
| MODIFY | `src/features/dashboard/services/merchantDashboardService.ts` | Add optional propertyId filter |
| MODIFY | `src/features/dashboard/hooks/useMerchantDashboardStats.ts` | Read from Zustand store |
| MODIFY | `src/pages/merchant/Dashboard.tsx` | Conditional rendering based on property selection |
| MODIFY | `src/pages/merchant/ComparativePortfolio.tsx` | Add side-by-side comparison tab |
| MODIFY | `src/features/collections/components/cases/CollectionsCaseDetail.tsx` | Add payment plan section |
| MODIFY | `src/shared/components/layouts/navigation-config.ts` | Update nav labels, consolidate entries |
| MODIFY | `src/App.tsx` | Update reconciliation route to DisputeResolution |
| MODIFY | `old-docs/PMS_Audit_Report_FULL.md` | Mark Priority 9 + consolidation status |

---

## Technical Notes

- No new database tables needed -- property filtering uses existing `property_id` foreign keys on all relevant tables
- Zustand store with `localStorage` persistence ensures property selection survives navigation
- The property switcher queries the existing `properties` table (already fetched in dashboard stats)
- Side-by-side comparison reuses existing `comparativePortfolioService` which already computes per-property benchmarks
- Collections consolidation stores payment plans as JSON in existing `resolution_notes` field
- Dispute resolution page composes existing components into a unified tabbed view
