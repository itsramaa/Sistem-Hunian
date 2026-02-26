
# Phase 1, Step 5: Collections Dashboard

## Current Status
- Phase 0: ✅ COMPLETE (DB tables, verification tiers, invoice state machine)
- Phase 1 Step 5 (Collections Dashboard): ✅ COMPLETE

## What Was Built

### 5a. Database ✅
- Index `idx_invoices_merchant_status_due` on `invoices(merchant_id, status, due_date DESC)`
- View `v_outstanding_summary` with aging bucket logic, outstanding amounts, last payment dates
- Realtime enabled on `invoices` and `payments` tables

### 5b. Collections Service ✅
- `src/features/collections/services/collectionsService.ts`
- `fetchSummary()`, `fetchOutstandingInvoices()`, `sendReminder()`

### 5c. Collections Hook ✅
- `src/features/collections/hooks/useCollectionsDashboard.ts`
- React Query + realtime subscriptions + bucket filter state

### 5d. UI Components ✅
- `CollectionsSummary.tsx` - 4 stat cards (Penagihan Hari Ini, Total Tunggakan, Jatuh Tempo Minggu Ini, Tingkat Penagihan)
- `AgingBuckets.tsx` - 4 clickable color-coded aging cards with drill-down
- `OutstandingTable.tsx` - Searchable table with reminder actions

### 5e. Route & Navigation ✅
- Route `/merchant/collections` added in `App.tsx`
- "Penagihan" nav link added to merchant Keuangan section
- Page at `src/pages/merchant/Collections.tsx`

## Next Step
- Phase 1, Step 6: Auto Payment Reconciliation
