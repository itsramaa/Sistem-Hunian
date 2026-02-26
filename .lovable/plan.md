
# Phase 1, Step 5: Collections Dashboard

## Current Status
- Phase 0: COMPLETE (DB tables, verification tiers, invoice state machine)
- Phase 1 Step 5 (Collections Dashboard): NOT STARTED

## What We're Building
A Collections Dashboard for merchants (pemilik kos) to see outstanding invoices organized by aging buckets, with drill-down capability and quick actions.

## Implementation Steps

### 5a. Database: Create `v_outstanding_summary` view + indexes
Create a SQL migration with:
- Index on `invoices(merchant_id, status, due_date DESC)` for fast aging queries
- A database view `v_outstanding_summary` that calculates:
  - Outstanding amount per invoice (total_amount - paid amount)
  - Aging bucket assignment based on days since due_date
  - Grouped totals by merchant_id and aging bucket

### 5b. Collections Service
Create `src/features/collections/services/collectionsService.ts`:
- `fetchCollectionsSummary(merchantId)`: Returns aging bucket totals (less than 7d, 7-14d, 14-30d, 30+d), collections today, expected this week, collection rate this month
- `fetchOutstandingInvoices(merchantId, agingBucket?)`: Returns detailed invoice list filtered by aging bucket with tenant info (unit, name, amount, days overdue, last payment date)
- `sendReminder(invoiceId, tenantUserId)`: Triggers payment reminder (reuse existing edge function)

### 5c. Collections Hook
Create `src/features/collections/hooks/useCollectionsDashboard.ts`:
- Uses `useQuery` for summary data and drill-down data
- Realtime subscription on `invoices` and `payments` tables for live updates
- Filter state for aging bucket selection

### 5d. Collections Dashboard Components
Create `src/features/collections/components/`:

1. **CollectionsSummary.tsx** - Top-level widget strip:
   - "Collections Today" card (real-time paid amount + count)
   - "Total Outstanding" card
   - "Expected This Week" card (invoices due within 7 days)
   - "Collection Rate" card (% of invoices paid on time this month)

2. **AgingBuckets.tsx** - Color-coded aging display:
   - 4 clickable cards: less than 7d (yellow), 7-14d (orange), 14-30d (red), 30+d (dark red)
   - Each shows: count of invoices + total amount
   - Click to drill-down

3. **OutstandingTable.tsx** - Drill-down table:
   - Columns: Unit, Tenant, Invoice#, Amount, Days Overdue, Last Payment, Action
   - Actions: Send Reminder, Create Collections Case, Mark Disputed
   - Sortable by days overdue, amount
   - Search/filter capability

4. **CollectionsDashboardPage.tsx** - Main page layout combining all widgets

### 5e. Route & Navigation
- Add route `/merchant/collections` in `App.tsx`
- Add lazy import for `MerchantCollections`
- Create page at `src/pages/merchant/Collections.tsx`
- Add "Collections" link to merchant sidebar/navigation (if sidebar exists) and quick actions on dashboard

### 5f. Update Plan Status
- Update `.lovable/plan.md` to mark Step 5 as complete

## Technical Details

### Aging Bucket Logic
```text
days_overdue = CURRENT_DATE - due_date
Bucket assignment:
  0-6 days  -> "< 7 hari" (yellow/warning)
  7-13 days -> "7-14 hari" (orange)
  14-29 days -> "14-30 hari" (red)
  30+ days  -> "> 30 hari" (dark red/destructive)
```

### Query Strategy
- Filter invoices where `status IN ('sent', 'overdue', 'escalated', 'partially_paid')` and `merchant_id = current merchant`
- Join with payments table to get last payment date per tenant
- Use the DB view for summary aggregation, direct queries for drill-down

### Files to Create/Modify
| Action | File |
|--------|------|
| Migration | `supabase/migrations/...collections_view.sql` |
| Create | `src/features/collections/services/collectionsService.ts` |
| Create | `src/features/collections/hooks/useCollectionsDashboard.ts` |
| Create | `src/features/collections/components/CollectionsSummary.tsx` |
| Create | `src/features/collections/components/AgingBuckets.tsx` |
| Create | `src/features/collections/components/OutstandingTable.tsx` |
| Create | `src/pages/merchant/Collections.tsx` |
| Edit | `src/App.tsx` (add route + lazy import) |
| Edit | `.lovable/plan.md` (mark Step 5 done) |

### Patterns Followed
- Feature module structure: `src/features/collections/`
- React Query with `useQuery` + realtime subscriptions (same as `useMerchantDashboardStats`)
- Indonesian language UI (consistent with existing dashboard)
- Shadcn Card components with gradient icons (matching Dashboard.tsx style)
- State machine validation for any status changes
