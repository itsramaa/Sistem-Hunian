

# Improvement 5: Bulk Move-Out Processing

## Overview

Add multi-select capability to the MoveOuts list page so merchants can select multiple notices and process them in batch. Instead of navigating to the single-notice wizard 5 times, the merchant selects multiple notices and opens a bulk processing page that handles all selected notices in parallel.

## Architecture Decision

Rather than rewriting the existing single-notice wizard (which handles complex per-notice flows like inspection checklists and signatures), we add a **bulk action layer on top**:

1. **MoveOutsTable** gets row checkboxes and a bulk action bar
2. A new **BulkMoveOutProcessor** page handles batch operations on selected notices
3. The single-notice wizard remains for detailed per-notice work (inspections with signatures, etc.)

This is practical because some steps (like conducting an inspection with a physical checklist and signatures) are inherently per-unit and can't be meaningfully batched. What CAN be batched: acknowledging notices, scheduling inspections for same date, approving deposit refunds, and terminating contracts.

## What Changes

### 1. Modify: `MoveOutsTable.tsx` -- Add checkbox selection

- Add a "select all" checkbox in the header
- Add per-row checkboxes (clicking checkbox does NOT navigate to detail)
- Track selected notice IDs via new props: `selectedIds`, `onSelectionChange`
- Row click on non-checkbox area still navigates to single wizard

### 2. Modify: `MoveOuts.tsx` -- Add bulk state and action bar

- Add `selectedNoticeIds` state (Set of strings)
- Pass selection props to MoveOutsTable
- Show a sticky bulk action bar when 2+ notices selected:
  - "Process X Pindah Keluar" button (navigates to bulk processor)
  - "Batal Pilih" button (clears selection)
  - Count badge

### 3. Create: `BulkMoveOutProcessor.tsx` (new page component)

A full-page component at route `/merchant/move-outs/bulk` that receives notice IDs via URL search params. Contains 4 collapsible sections (not wizard steps -- all visible at once for batch overview):

**Section 1: Ringkasan Penyewa (Tenant Summary)**
- Table showing all selected notices: Tenant, Unit, Move-out date, Current status
- Option to remove individual notices from the batch

**Section 2: Konfirmasi Pemberitahuan (Bulk Acknowledge)**
- Shows which notices are still "submitted" (unacknowledged)
- "Konfirmasi Semua" button -- bulk updates all to "acknowledged"
- Already-acknowledged notices show green checkmark

**Section 3: Jadwal Inspeksi (Bulk Schedule Inspection)**
- Date/time picker shared across all selected units
- Checkboxes per unit to include/exclude from batch scheduling
- "Jadwalkan Semua" button -- creates inspection records for all selected

**Section 4: Selesaikan Deposit & Kontrak (Bulk Settle)**
- Summary table: Tenant, Deposit, Deductions, Net Refund, Status
- "Setujui Semua Refund" button -- bulk approves deposit refunds
- "Akhiri Semua Kontrak" button -- bulk terminates contracts
- Per-row override possible

### 4. Create: `useBulkMoveOutData.ts` (new hook)

Fetches data for multiple notice IDs in one go:
- Batch fetch notices with contract/unit/property joins
- Batch fetch inspections for all notice IDs
- Batch fetch deposit refunds for all contract IDs
- Batch fetch tenant profiles
- Provides bulk mutation functions

### 5. Wire up route

Add route for `/merchant/move-outs/bulk` pointing to a new page wrapper.

### 6. Update `old-docs/SYSTEM_AUDIT_REPORT.md`

Add Improvement 5 tracking lines.

## Files Changed

| File | Action | Description |
|------|--------|-------------|
| `src/features/contracts/components/MoveOutsTable.tsx` | MODIFY | Add checkbox selection |
| `src/pages/merchant/MoveOuts.tsx` | MODIFY | Add selection state + bulk action bar |
| `src/features/contracts/components/move-out-wizard/BulkMoveOutProcessor.tsx` | CREATE | Bulk processing page |
| `src/features/contracts/hooks/useBulkMoveOutData.ts` | CREATE | Hook for batch data + mutations |
| `src/pages/merchant/BulkMoveOut.tsx` | CREATE | Page wrapper for bulk route |
| Route config | MODIFY | Add `/merchant/move-outs/bulk` route |
| `old-docs/SYSTEM_AUDIT_REPORT.md` | UPDATE | Improvement 5 tracking |

## Technical Details

### Checkbox Selection in Table

The checkbox column is added as the first column. Clicking the checkbox toggles selection without triggering row navigation. The row `onClick` handler checks `e.target` to skip navigation when clicking checkboxes.

### Bulk Action Bar

A sticky bar at the bottom of the page (similar to email bulk select UI):
```text
[X selected] | [Proses Pindah Keluar (X)] | [Batal Pilih]
```

### Bulk Mutations

Each bulk action calls Supabase with batch updates:
- Acknowledge: `supabase.from('move_out_notices').update({status:'acknowledged'}).in('id', noticeIds)`
- Schedule inspection: Loop + insert for each notice (inspection records are per-notice)
- Approve refunds: `supabase.from('deposit_refunds').update({status:'approved'}).in('contract_id', contractIds)`
- Terminate contracts: `supabase.from('contracts').update({status:'terminated'}).in('id', contractIds)`

### URL-Based Selection

Selected notice IDs are passed via URL search params (`?ids=uuid1,uuid2,uuid3`) so the bulk page can be bookmarked/refreshed without losing context.

### No Database Changes

All existing tables support batch operations via `.in()` queries. No new tables or columns needed.

