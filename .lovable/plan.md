
# Priority 5: Expense Approval Workflow + Priority 6: Mobile App (Core Features)

## Overview

Two enhancements:
1. **Expense Approval Workflow** -- Receipt upload with OCR auto-fill, approval gate (>Rp 500K requires manual approval), auto-categorization, and audit-ready attachment storage
2. **Mobile App Core** -- Responsive mobile-optimized merchant experience with bottom nav, compact dashboard, one-click reminder, quick expense logging, alerts view, and tenant search

---

## Priority 5: Expense Approval Workflow

### 5A: OCR Edge Function for Expense Receipts

Create `supabase/functions/ocr-expense-receipt/index.ts`:
- Modeled after existing `ocr-maintenance-receipt` pattern
- Extract: vendor_name, receipt_date, total_amount, line_items, payment_method, suggested_category
- Auto-categorize based on vendor/description keywords (utilities, maintenance, etc.)
- Store results in `ocr_results` table, link back via `ocr_data` on `expenses`
- Uploads go to existing `verification-documents` bucket

### 5B: Enhanced Expense Creation Form

Refactor the expense dialog in `src/pages/merchant/Expenses.tsx` into a dedicated component `src/features/expenses/components/ExpenseCreateDialog.tsx`:
- **Step 1: Receipt Upload** -- Photo capture (camera/gallery) or PDF upload to `verification-documents` bucket. Optional -- user can skip for manual entry
- **Step 2: OCR Processing** -- If receipt uploaded, call `ocr-expense-receipt` edge function. Auto-fill amount, vendor, date, suggested category. Show confidence indicator
- **Step 3: Review & Edit** -- Pre-filled form with all fields editable. Category selector with auto-suggestion highlighted
- **Approval logic**: If amount >= 500,000, set `approval_status = 'pending_approval'`. If amount < 500,000, set `approval_status = 'approved'` and auto-set `approved_at = now()`
- Store `receipt_url` (file path) and `ocr_data` (JSON from OCR) on the expense record

### 5C: Approval Management UI

Create `src/features/expenses/components/ExpenseApprovalList.tsx`:
- Filter expenses by `approval_status = 'pending_approval'`
- Each item shows: receipt thumbnail, amount, category, date, OCR confidence
- Approve / Reject buttons that update `approval_status`, `approved_by`, `approved_at`
- Add an "Approval" tab or section to the Expenses page

### 5D: Expense Service Enhancement

Update `expenseService.ts`:
- `createExpense` now accepts `receiptUrl` and `ocrData` fields
- Add `approveExpense(id, userId)` method -- updates `approval_status = 'approved'`, sets `approved_by` and `approved_at`
- Add `rejectExpense(id, userId)` method -- sets `approval_status = 'rejected'`
- Add `fetchPendingApprovals(merchantId)` -- query expenses with `pending_approval` status

### 5E: State Machine

Add to `state-machines.ts`:
```typescript
export const EXPENSE_APPROVAL_TRANSITIONS: Record<string, string[]> = {
  submitted: ['pending_approval', 'approved'],  // auto-approve if < 500K
  pending_approval: ['approved', 'rejected'],
  approved: ['verified'],
  rejected: ['submitted'],  // allow re-submission
  verified: [],  // terminal
};
```

### 5F: Receipt Viewer

Create `src/features/expenses/components/ReceiptViewer.tsx`:
- Modal that displays receipt image/PDF from `receipt_url`
- Shows OCR extracted data alongside for comparison
- Clickable from expense table rows that have attachments

---

## Priority 6: Mobile App (Core Features)

Since the system already has `DashboardLayout` auto-switching to `MobileLayout` on mobile, and the merchant role already works on mobile (just without bottom nav), the approach is to **enable and optimize the mobile experience** rather than build a native app.

### 6A: Enable Merchant Bottom Nav

Update `navigation-config.ts` for merchant role:
- Set `hasBottomNav: true`
- Add `bottomNav` array with 5 items: Dashboard, Properti, Tagihan, Notifikasi, Profil
- This immediately gives merchants a mobile-native navigation experience

### 6B: Mobile Merchant Dashboard

Create `src/features/dashboard/components/MobileMerchantDashboard.tsx`:
- Compact KPI strip: Occupancy %, Monthly Revenue, Overdue count, Pending approvals
- Latest 5 transactions section (from invoices/payments)
- Critical alerts section: overdue invoices, pending expense approvals, maintenance urgent
- Quick action cards: Send Reminder, Log Expense, View Tenants
- Conditionally rendered in `MerchantDashboard` when `useIsMobile()` is true

### 6C: Quick Expense Logger (Mobile)

Create `src/features/expenses/components/QuickExpenseSheet.tsx`:
- Bottom sheet (using vaul `Drawer`) optimized for mobile
- Camera button for instant receipt photo
- Amount input (large, easy to tap)
- Category quick-select (icon grid)
- One-tap submit
- Accessible from mobile dashboard quick actions and bottom nav FAB

### 6D: Mobile Alerts Page

Create `src/pages/merchant/Alerts.tsx`:
- Aggregated view of: overdue invoices, pending expense approvals, maintenance requests (urgent/high), expiring contracts (30 days)
- Each alert card is actionable (tap to navigate to relevant page)
- Badge count on bottom nav "Notifikasi" icon
- Route: `/merchant/alerts`

### 6E: One-Click Reminder

Create `src/features/payments/components/QuickReminderButton.tsx`:
- Button that calls existing `send-payment-reminder` edge function
- Shows in overdue invoice cards on mobile dashboard
- Confirmation toast after send
- Reuse in Alerts page for overdue items

### 6F: Mobile Tenant Search

The existing `/merchant/tenants` page already works on mobile via `MobileLayout`. Enhance with:
- Sticky search bar at top
- Compact card layout instead of table on mobile
- Quick-tap to see payment history inline

---

## Files Summary

| Action | File | Description |
|--------|------|-------------|
| CREATE | `supabase/functions/ocr-expense-receipt/index.ts` | OCR edge function for receipts |
| CREATE | `src/features/expenses/components/ExpenseCreateDialog.tsx` | Enhanced create form with receipt upload + OCR |
| CREATE | `src/features/expenses/components/ExpenseApprovalList.tsx` | Pending approval management |
| CREATE | `src/features/expenses/components/ReceiptViewer.tsx` | Receipt image/PDF viewer modal |
| CREATE | `src/features/expenses/components/QuickExpenseSheet.tsx` | Mobile-optimized quick expense entry |
| CREATE | `src/features/dashboard/components/MobileMerchantDashboard.tsx` | Mobile-first compact dashboard |
| CREATE | `src/pages/merchant/Alerts.tsx` | Aggregated alerts page |
| CREATE | `src/features/payments/components/QuickReminderButton.tsx` | One-click payment reminder |
| MODIFY | `src/features/expenses/services/expenseService.ts` | Add approve/reject/OCR methods |
| MODIFY | `src/features/expenses/hooks/useExpenses.ts` | Add approval mutations |
| MODIFY | `src/pages/merchant/Expenses.tsx` | Integrate new dialog + approval tab |
| MODIFY | `src/shared/constants/state-machines.ts` | Add EXPENSE_APPROVAL_TRANSITIONS |
| MODIFY | `src/shared/components/layouts/navigation-config.ts` | Enable merchant bottomNav + alerts route |
| MODIFY | `src/pages/merchant/Dashboard.tsx` | Conditional mobile dashboard rendering |
| MODIFY | `src/App.tsx` | Add /merchant/alerts route |
| MODIFY | `old-docs/PMS_Audit_Report_FULL.md` | Mark Priority 5 & 6 status |

---

## Technical Notes

- The `expenses` table already has `receipt_url`, `ocr_data`, `approved_by`, `approved_at` columns -- no DB migration needed
- OCR edge function reuses `_shared/dss-utils.ts` helpers (callLovableAI, logModelRun, createOcrResult, etc.)
- Receipt uploads go to existing `verification-documents` bucket (private, RLS-protected)
- The 500K approval threshold is a client-side constant, easily configurable
- Mobile bottom nav uses the existing `MobileBottomNav` component -- just needs config entries
- No native app build needed -- the responsive web app with bottom nav provides a native-like experience
- `vaul` (already installed) provides the bottom sheet drawer for QuickExpenseSheet
