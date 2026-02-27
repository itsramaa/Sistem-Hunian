
# Priority 3: Reduce Permission Complexity + Priority 4: UX Debt Cleanup

## Analysis

### Priority 3: Permission Complexity
The state machine system in `src/shared/constants/state-machines.ts` contains **25 state machines** with 100+ transitions total. However, this is backend validation logic -- it's well-structured and each service only uses the transitions relevant to its domain. The real complexity issue isn't the state machines themselves, but that **users don't have a clear mental model of what they can do**.

The solution is NOT to remove state machines (they protect data integrity), but to create a **Role Action Map** -- a simple reference that maps each role to their 3-5 primary actions with clear "where to click" guidance. This gets surfaced as contextual help in the UI.

### Priority 4: UX Debt Cleanup
The current dashboard is feature-rich but lacks three key elements for non-technical owners:
1. **Health indicators** (Green/Yellow/Red status badges on KPI cards)
2. **Critical alerts section** (overdue payments, stale maintenance, expiring leases)
3. **Upcoming events** (lease endings, scheduled maintenance)

The mobile dashboard hardcodes `overdueCount = 0` -- this needs real data.

---

## Implementation Plan

### 3A: Role Action Map Component

Create `src/shared/components/ui/RoleActionGuide.tsx`:
- A simple collapsible card showing "Apa yang bisa Anda lakukan" per role
- Merchant: 5 actions (Kelola Properti, Buat Tagihan, Approve Pengeluaran, Kirim Reminder, Lihat Laporan)
- Tenant: 4 actions (Bayar Tagihan, Ajukan Maintenance, Lihat Kontrak, Update Profil)
- Vendor: 3 actions (Terima Pekerjaan, Update Progress, Lihat Pendapatan)
- Each action links directly to the relevant page
- Shown on first visit or accessible from dashboard "Bantuan" button

### 3B: Simplify State Machine Exposure

Create `src/shared/constants/role-actions.ts`:
- Define `ROLE_PRIMARY_ACTIONS` mapping each role to 3-5 core actions with labels, descriptions, icons, and target paths
- This becomes the single reference for "what can this role do" in all UI components
- No changes to existing state machines -- they remain as backend validation

### 4A: Dashboard Health Indicators

Modify `src/pages/merchant/Dashboard.tsx` KPI strip to add status badges:
- Occupancy: Green (>=80%), Yellow (50-79%), Red (<50%) with text label (BAIK/PERHATIAN/KRITIS)
- Revenue: Green (growth >0), Yellow (flat), Red (declining) with percentage
- Add a new "Piutang" (Receivables) KPI card showing overdue invoice total with Red if >0

### 4B: Alerts & Events Dashboard Widget

Create `src/features/dashboard/components/AlertsEventsWidget.tsx`:
- **Critical Alerts section**: Query overdue invoices (>15 days), stale maintenance (pending >5 days), expiring contracts (<30 days)
- **Upcoming Events section**: Contracts ending in 30-60 days, scheduled preventive maintenance
- Color-coded urgency (red = critical, yellow = warning)
- Each alert links to the relevant detail page
- Register as `'alerts_events'` widget in `widgetRegistry.ts`

### 4C: Dashboard Stats Service Enhancement

Modify `src/features/dashboard/services/merchantDashboardService.ts`:
- Add `alerts` to `MerchantDashboardStats` interface:
  - `overdueInvoices`: count + total amount of invoices with status `overdue` or `escalated`
  - `staleMaintenance`: count of maintenance requests with status `pending` and created >5 days ago
  - `expiringContracts`: contracts with `end_date` within 30 days
  - `upcomingEvents`: array of {type, description, date, link}
- Add parallel queries for these in `fetchStats()`

### 4D: Mobile Dashboard Enhancement

Modify `src/features/dashboard/components/MobileMerchantDashboard.tsx`:
- Replace hardcoded `overdueCount = 0` with real data from stats
- Add health status badges (color dots + text) on KPI cards
- Add compact alerts section showing top 3 critical items
- Add "Acara Mendatang" section with 3 nearest events

### 4E: Update Audit Report

Update `old-docs/PMS_Audit_Report_FULL.md`:
- Mark Priority 3 (Reduce Permission Complexity) status
- Mark Priority 4 (UX Debt Cleanup) status
- Update Scalability section status

---

## Files Summary

| Action | File | Description |
|--------|------|-------------|
| CREATE | `src/shared/constants/role-actions.ts` | Role-to-actions mapping (3-5 actions per role) |
| CREATE | `src/shared/components/ui/RoleActionGuide.tsx` | Collapsible "what can I do" help card |
| CREATE | `src/features/dashboard/components/AlertsEventsWidget.tsx` | Alerts + upcoming events dashboard widget |
| MODIFY | `src/features/dashboard/services/merchantDashboardService.ts` | Add overdue/stale/expiring queries |
| MODIFY | `src/pages/merchant/Dashboard.tsx` | Add health badges on KPIs, integrate alerts widget |
| MODIFY | `src/features/dashboard/components/MobileMerchantDashboard.tsx` | Real overdue data, health badges, alerts |
| MODIFY | `src/features/dashboard/constants/widgetRegistry.ts` | Register alerts_events widget |
| MODIFY | `old-docs/PMS_Audit_Report_FULL.md` | Mark Priority 3 + 4 status |

## Technical Notes

- State machines remain untouched -- they are backend validation, not user-facing complexity
- Role Action Map is a UX layer on top of existing permissions, not a replacement
- Dashboard alerts use existing tables (invoices, maintenance_requests, contracts) with simple date/status filters
- Health indicators are computed client-side from existing stats data -- no new backend queries for KPI badges
- Alerts widget adds 3-4 new parallel queries to `fetchStats()` but they are lightweight count queries
- Mobile dashboard gets the same data via existing `useMerchantDashboardStats` hook
