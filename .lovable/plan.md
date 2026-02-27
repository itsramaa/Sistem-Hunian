

# Feature 8, 9, 10 -- Status Assessment & Remaining Implementation

## Current State

### Feature 8: Property Insurance Integration
**Status: Already COMPLETE** in audit report. No work needed.

### Feature 9: Occupancy Trend Analytics & Forecasting UI
**Status: MOSTLY COMPLETE** -- `MarketIntelligence.tsx` already has:
- Occupancy prediction chart with confidence bands
- Seasonal patterns display (peak/low/transition)
- Turnover KPI strip (current rate, predicted rate, avg vacancy days, trend)
- Warnings with severity badges and recommended actions
- Anomaly detection cards

**Missing items:**
- What-if price elasticity simulator ("If I drop price 10%, occupancy becomes ___")
- Dashboard widget showing next-month forecast summary (currently only available deep in Market Intelligence page)

### Feature 10: Tenant Communication Portal
**Status: MOSTLY COMPLETE** -- 17 pages exist in `src/pages/tenant/`:
- Dashboard, Contracts, ContractDetail, SignContract
- Invoices, InvoiceDetail, Payments
- Maintenance, MaintenanceDetail
- Profile, Settings, Forum, Marketplace, etc.

**Missing items:**
- Payment receipt PDF download (invoice detail exists but no receipt generation)
- Lease renewal / move-out reminder notifications on tenant dashboard

---

## Implementation Plan

### 9A: What-If Price Elasticity Simulator

Add a new section inside the "occupancy" tab of `src/pages/merchant/MarketIntelligence.tsx`:
- Simple slider: "Simulasi perubahan harga: -20% to +20%"
- Client-side calculation using basic elasticity model:
  - Default elasticity = -0.5 (configurable)
  - Formula: `new_occupancy = current_occupancy * (1 + elasticity * price_change_pct)`
  - Revenue impact = new_occupancy * new_price * total_units
- Display: predicted occupancy change, revenue impact, and visual comparison bar
- Uses existing `occData` from the forecast -- no new backend calls needed

### 9B: Occupancy Forecast Dashboard Widget

Create `src/features/dashboard/components/OccupancyForecastWidget.tsx`:
- Compact card showing: current occupancy rate, next-month predicted rate, trend arrow
- "Lihat Detail" link to `/merchant/market-intelligence`
- Register in `widgetRegistry.ts` as `'occupancy_forecast'` widget
- Data source: use existing `merchant_analytics_summary` for current occupancy + simple client-side projection

### 10A: Payment Receipt Download

Add receipt download to tenant invoice detail:
- Modify `src/pages/tenant/InvoiceDetail.tsx` to add "Unduh Kwitansi" button (visible when invoice status = 'paid')
- Generate receipt as a formatted text/HTML blob downloaded as PDF-like file
- Include: invoice number, tenant name, property, unit, amount, payment date, payment method
- Reuse existing `useDownloadInvoice` hook pattern or create simple client-side receipt generator

### 10B: Lease Renewal & Move-Out Reminders on Tenant Dashboard

Enhance `src/pages/tenant/Dashboard.tsx`:
- Query tenant's active contract `end_date`
- If contract expires within 60 days, show an alert card:
  - "Kontrak Anda berakhir dalam X hari (DD MMM YYYY)"
  - Urgency: critical (<=30 days), warning (<=60 days)
- If contract expires within 30 days, show move-out checklist reminder
- Uses existing `useTenantActiveContract` hook -- no new queries needed

### 9C + 10C: Update Audit Report

Mark Feature 9 and 10 with updated status in `old-docs/PMS_Audit_Report_FULL.md`.

---

## Files Summary

| Action | File | Description |
|--------|------|-------------|
| MODIFY | `src/pages/merchant/MarketIntelligence.tsx` | Add what-if price elasticity simulator section |
| CREATE | `src/features/dashboard/components/OccupancyForecastWidget.tsx` | Compact forecast widget for dashboard |
| MODIFY | `src/features/dashboard/constants/widgetRegistry.ts` | Register occupancy_forecast widget |
| MODIFY | `src/pages/tenant/InvoiceDetail.tsx` | Add payment receipt download button |
| MODIFY | `src/pages/tenant/Dashboard.tsx` | Add lease renewal/move-out reminder alerts |
| MODIFY | `old-docs/PMS_Audit_Report_FULL.md` | Mark Features 8, 9, 10 status |

## Technical Notes

- What-if simulator is purely client-side using a basic price elasticity formula -- no new edge functions needed
- Payment receipt uses client-side HTML-to-download approach (no server-side PDF generation needed)
- Lease renewal reminders reuse existing `useTenantActiveContract` hook data
- Dashboard widget reads from `merchant_analytics_summary` which is already refreshed periodically
- Feature 8 requires NO changes -- already fully implemented

