

# Improvement 6: Alert-to-Action Automation

## Overview

Transform the Alerts page from static "click-to-navigate" cards into expandable alert cards with inline quick action buttons. Each alert type gets contextual actions (send reminder, process payment, call tenant, dismiss) that execute directly from the Alerts page without navigating away.

## Architecture

The current Alerts page dynamically assembles alerts from multiple DB queries (overdue invoices, pending expenses, urgent maintenance, etc.). Rather than building a persistent alert tracking system (which would require a new table and complex sync logic), we enhance the existing approach by:

1. Enriching the `AlertItem` interface with action-relevant metadata (e.g., `tenantUserId`, `invoiceAmount`)
2. Making alert cards expandable to show quick action buttons
3. Reusing existing components (`InlinePaymentMatchDialog`) and services (`collectionsService.sendReminder`)
4. Adding a local dismiss mechanism (sessionStorage-based, clears on refresh)

## What Changes

### 1. Modify: `src/pages/merchant/Alerts.tsx` -- Complete overhaul

**Data changes:**
- Extend `AlertItem` interface to include action metadata: `invoiceId`, `tenantUserId`, `contractId`, `merchantId`, `invoiceAmount`, `unitNumber` (all optional, populated based on alert type)
- Store these fields when constructing overdue invoice alerts (they already come from the query)

**UI changes:**
- Replace single-click-navigate cards with expandable cards (click toggles expansion)
- Expanded state shows contextual quick action buttons based on alert type:
  - **Overdue invoices**: Send Reminder, Process Payment (opens `InlinePaymentMatchDialog`), Call Tenant, Dismiss
  - **Expense approvals**: Navigate to Expenses (keep current behavior), Dismiss
  - **Maintenance**: Navigate to Detail (keep current behavior), Dismiss
  - **Contract expiry**: Navigate to Contract (keep current behavior), Dismiss
  - **Preventive overdue**: Navigate to PM page (keep current behavior), Dismiss
- Show action feedback inline (e.g., "Pengingat terhasil dikirim" badge on card after sending)
- Dismissed alerts are hidden (tracked in local state, `Set<string>`)

**Action handlers:**
- `handleSendReminder(alert)`: Calls `collectionsService.sendReminder()`, shows success toast, marks alert as "actioned"
- `handleProcessPayment(alert)`: Opens `InlinePaymentMatchDialog` (reuse from Improvement 4)
- `handleDismiss(alert)`: Adds alert ID to dismissed set, hides from list
- Navigation actions remain for non-overdue alert types

### 2. Create: `src/features/notifications/components/AlertActionCard.tsx`

A reusable expandable alert card component that encapsulates:
- Collapsed view: icon, title, description, severity badge, expand chevron (rotates on expand)
- Expanded view: action buttons grid based on alert type
- "Actioned" state: shows green checkmark + action summary instead of buttons
- Props: `alert`, `expanded`, `onToggle`, `onAction`, `actioned`

### 3. Update: `old-docs/SYSTEM_AUDIT_REPORT.md`

Add Improvement 6 tracking lines.

## Files Changed

| File | Action | Description |
|------|--------|-------------|
| `src/features/notifications/components/AlertActionCard.tsx` | CREATE | Expandable alert card with inline actions |
| `src/pages/merchant/Alerts.tsx` | MODIFY | Add action metadata, expand/collapse, action handlers, dismiss, reuse InlinePaymentMatchDialog |
| `old-docs/SYSTEM_AUDIT_REPORT.md` | UPDATE | Improvement 6 tracking |

## Technical Details

### AlertItem Interface Extension

```text
Additional fields (all optional):
- invoiceId?: string        -- for overdue alerts
- tenantUserId?: string     -- for overdue alerts (reminder + payment match)
- contractId?: string       -- for overdue alerts (payment match)
- merchantId?: string       -- for all (from merchant context)
- invoiceAmount?: number    -- for overdue alerts (payment match dialog)
- unitNumber?: string       -- for overdue alerts (display)
```

These fields are already available from the existing `invoices` query in the `queryFn`. We just need to store them instead of discarding them.

### Expandable Card UX

- Only one card can be expanded at a time (accordion pattern via `expandedId` state)
- Clicking card header toggles expansion
- ChevronRight rotates to ChevronDown when expanded
- Action buttons are rendered in a flex-wrap grid inside the expanded area

### Reuse of InlinePaymentMatchDialog

For overdue invoice alerts, the "Process Payment" action constructs an `OutstandingInvoice` object from the alert metadata and passes it to `InlinePaymentMatchDialog`. After successful match, the alert query is invalidated, causing the alert to disappear from the list.

### Dismiss Mechanism

- Local `Set<string>` state tracks dismissed alert IDs
- Dismissed alerts are filtered out before rendering
- Resets on page refresh (intentional -- alerts are regenerated from live data each time)
- A "Show dismissed" toggle at the bottom reveals dismissed alerts if needed

### No Database Changes

All alert data is already queried from existing tables. No new tables, columns, or RLS policies needed.

