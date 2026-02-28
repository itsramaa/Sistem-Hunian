

# Improvement 7: Replace "Balance: 0" with Action-Driven Dashboard

## Overview

The dashboard currently hardcodes `balance: 0` in `merchantDashboardService.ts` and shows no cash flow information. This improvement replaces that with real financial data and adds a prioritized action items widget, making the dashboard a true operational command center.

## Scope Decisions

The user's UX spec describes 5 sections. The dashboard already implements most of them via existing widgets:

- **Section 1 (Cash Flow)**: NEW -- needs to be built
- **Section 2 (Action Items)**: NEW -- needs to be built  
- **Section 3 (Occupancy Health)**: ALREADY EXISTS as `kpi_strip` + `property_overview` + `vacancy` widgets
- **Section 4 (AI Recommendations)**: SKIP -- InsightsHub is a separate feature; wiring it into dashboard is a separate improvement
- **Section 5 (Quick Links)**: ALREADY EXISTS as `quick_actions` widget

So we focus on the two new sections plus fixing the hardcoded balance.

## What Changes

### 1. Fix: `merchantDashboardService.ts` -- Real balance calculation

Replace `balance: 0` with actual computed balance:
- **Available Balance** = Sum of completed payment transfers (net_amount where status = 'completed')
- **Pending Balance** = Already computed (pending transfers)
- **Outstanding Receivables** = Sum of unpaid invoices (status in pending, overdue)
- **Receivable Count** = Number of unpaid invoices

Add new fields to `MerchantDashboardStats.financials`:
- `availableBalance: number` (completed transfers)
- `outstandingReceivables: number` (unpaid invoice total)
- `outstandingInvoiceCount: number`

Add two new queries to the existing `Promise.all`:
- Completed transfers: `payment_transfers` where status = 'completed'
- Unpaid invoices: `invoices` where status in ('pending', 'overdue')

### 2. Create: `CashFlowWidget.tsx`

**Location:** `src/features/dashboard/components/CashFlowWidget.tsx`

A compact card showing 4 metrics in a grid:
- Available Balance (green, from completed transfers)
- Pending Transfers (amber, links to /merchant/payments)
- Outstanding Receivables (orange, links to /merchant/collections)
- 7-Day Forecast (blue, simple sum: available + pending + receivables)

Bottom row: "Lihat Laporan Keuangan" button linking to /merchant/financial-reports

### 3. Create: `ActionItemsWidget.tsx`

**Location:** `src/features/dashboard/components/ActionItemsWidget.tsx`

Uses existing `useMerchantDashboardStats` data (overdue invoices, stale maintenance, expiring contracts) plus one additional query for pending maintenance approvals. Organizes items into 3 priority tiers:

- **URGENT (red)**: Overdue invoices 15+ days, stale maintenance, pending approvals
- **UPCOMING (amber)**: Expiring contracts within 30 days
- **ON TRACK (green)**: Paid invoices this week count

Each item has a direct action button (navigate to relevant page). Uses existing stats data -- no new service needed, just reshapes what's already fetched.

### 4. Update: Widget Registry

Add two new widget IDs to `widgetRegistry.ts`:
- `cash_flow`: "Arus Kas" -- positioned first (before kpi_strip)
- `action_items`: "Prioritas Hari Ini" -- positioned second (after cash_flow)

### 5. Update: Dashboard page

Add renderers for `cash_flow` and `action_items` in the `widgetRenderers` map in `Dashboard.tsx`.

### 6. Update: Mobile Dashboard

Add a simplified cash flow strip to `MobileMerchantDashboard.tsx` replacing the current basic Pendapatan card with richer financial data.

### 7. Update: `old-docs/SYSTEM_AUDIT_REPORT.md`

Add Improvement 7 tracking lines.

## Files Changed

| File | Action | Description |
|------|--------|-------------|
| `src/features/dashboard/services/merchantDashboardService.ts` | MODIFY | Fix balance: 0, add receivables + completed transfers queries |
| `src/features/dashboard/components/CashFlowWidget.tsx` | CREATE | Cash flow snapshot widget |
| `src/features/dashboard/components/ActionItemsWidget.tsx` | CREATE | Prioritized action items widget |
| `src/features/dashboard/constants/widgetRegistry.ts` | MODIFY | Add cash_flow and action_items entries |
| `src/pages/merchant/Dashboard.tsx` | MODIFY | Add widget renderers for new widgets |
| `src/features/dashboard/components/MobileMerchantDashboard.tsx` | MODIFY | Add cash flow data to mobile view |
| `old-docs/SYSTEM_AUDIT_REPORT.md` | UPDATE | Improvement 7 tracking |

## Technical Details

### New Queries in merchantDashboardService

Two additional queries added to the existing `Promise.all` (12 total, up from 10):

```text
Query 11: Completed transfers
  FROM payment_transfers
  WHERE merchant_id = X AND status = 'completed'
  SELECT net_amount

Query 12: Unpaid invoices (for receivables)
  FROM invoices
  WHERE merchant_id = X AND status IN ('pending', 'overdue')
  SELECT total_amount
```

### Updated financials interface

```text
financials: {
  balance: number          -- NOW: computed as sum of completed transfers
  pendingBalance: number   -- existing
  monthlyRevenue: number   -- existing
  lastMonthRevenue: number -- existing
  revenueGrowth: number    -- existing
  outstandingReceivables: number  -- NEW
  outstandingInvoiceCount: number -- NEW
}
```

### 7-Day Forecast (Simple)

Client-side calculation: `availableBalance + pendingBalance + outstandingReceivables`. No ML needed -- it's a "if everything comes in" optimistic projection displayed with appropriate disclaimer text.

### No Database Changes

All data already exists in `payment_transfers`, `invoices`, `maintenance_requests`, and `contracts` tables. No new tables, columns, or RLS policies needed.

