

# Improvement: Inline Invoice Detail Panel on Collections Page (Pattern 1 Fix)

## Overview

Replace the current dropdown-menu-only interaction on the Collections outstanding table with a **click-to-open Sheet panel** that slides from the right. Clicking a table row opens an inline panel showing invoice details, send-reminder action, and payment matching -- all without leaving the page. This reduces the workflow from 5-6 page navigations to 2-3 in-context actions.

## Current State

- `OutstandingTable` has a dropdown menu (3-dot button) per row with actions: Send Reminder, Process Payment, Call Tenant
- "Process Payment" opens `InlinePaymentMatchDialog` (a centered Dialog/modal) showing candidate payments
- There is no way to click a row to see invoice details inline
- The Sheet component (`src/shared/components/ui/sheet.tsx`) exists with `side="right"` support

## What Changes

### 1. Create: `InvoiceDetailSheet` component

New component: `src/features/collections/components/InvoiceDetailSheet.tsx`

A right-sliding Sheet panel that shows:
- **Invoice summary** section (unit, tenant, invoice number, amount, days overdue, due date, last payment)
- **Quick actions** section:
  - "Kirim Pengingat" button (reuse existing reminder logic)
  - "Hubungi Penyewa" link
- **Payment matching** section (embedded directly, not a separate dialog):
  - Reuses `useInvoiceCandidatePayments` hook
  - Shows candidate payments with confidence scores
  - "Konfirmasi Cocok" button inline
  - Success state after matching
- Uses the existing `Sheet`, `SheetContent`, `SheetHeader`, `SheetTitle` components with `side="right"`

### 2. Modify: `OutstandingTable` -- Add row click to open Sheet

- Clicking a table row opens the `InvoiceDetailSheet` for that invoice
- The dropdown menu remains as a secondary access method
- "Proses Pembayaran" in dropdown now also opens the Sheet (instead of the Dialog)
- Row gets a `cursor-pointer` and hover highlight
- The existing `InlinePaymentMatchDialog` import can be removed (functionality absorbed into the Sheet)

### 3. Update: `old-docs/SYSTEM_AUDIT_REPORT.md`

Track Pattern 1 implementation with step-level status markers.

## Files Changed

| File | Action | Description |
|------|--------|-------------|
| `src/features/collections/components/InvoiceDetailSheet.tsx` | CREATE | Right-sliding panel with invoice details + inline payment matching |
| `src/features/collections/components/OutstandingTable.tsx` | MODIFY | Add row click handler, replace Dialog with Sheet |
| `old-docs/SYSTEM_AUDIT_REPORT.md` | UPDATE | Pattern 1 implementation tracking |

## Technical Details

### InvoiceDetailSheet Structure

```text
Sheet (side="right", max-w-md)
  SheetHeader
    SheetTitle: "Detail Tagihan"
    SheetDescription: Invoice number
  
  ScrollArea
    Section 1: Invoice Summary (reuse summary card from InlinePaymentMatchDialog)
      - Unit, Tenant, Amount, Days Overdue, Due Date, Last Payment
    
    Section 2: Quick Actions (horizontal button row)
      - Kirim Pengingat (with loading state)
      - Hubungi Penyewa (tel: link)
    
    Section 3: Payment Matching (embedded)
      - Header: "Pembayaran Kandidat (N ditemukan)"
      - Candidate cards with confidence badges
      - "Konfirmasi Cocok" button per card
      - Success state after match
```

### Row Click Behavior

- Clicking anywhere on a `TableRow` opens the Sheet for that invoice
- The dropdown 3-dot button uses `e.stopPropagation()` to prevent double-open
- Selected row gets a subtle highlight (`bg-primary/5`)

### Reuse Strategy

- `useInvoiceCandidatePayments` hook: reused as-is inside the Sheet
- `collectionsService.sendReminder`: reused for reminder action
- `reconciliationService.manualMatch`: reused for payment matching
- `formatCurrency`: reused for amount display
- The `InlinePaymentMatchDialog` component becomes unused after this change and can be kept for backward compatibility or removed

### Sheet Width

Override the default `sm:max-w-sm` to `sm:max-w-md` (448px) to give enough room for payment candidate cards with confidence badges.

### No Database Changes

Purely a frontend interaction improvement. All data queries and mutations are already in place.

