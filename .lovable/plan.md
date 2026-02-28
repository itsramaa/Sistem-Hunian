

# Improvement 9: Auto-Link Maintenance Costs to Expenses

## Overview

When a maintenance request is marked as "completed" and has a vendor with an `agreed_price`, the system will automatically create a linked expense record. This eliminates manual data entry and ensures 100% cost tracking.

## Current State

- `maintenanceService.updateStatus()` already handles completion logic (lines 368-413): completes vendor jobs, creates earnings, sends notifications
- The `expenses` table has `vendor_id`, `property_id`, `unit_id` fields but no `maintenance_request_id` reference
- A separate `maintenance_expenses` table exists (for OCR receipt tracking) but is independent from the main `expenses` table
- The expense auto-approval threshold is Rp 500k (amounts below are auto-approved)

## What Changes

### 1. Database Migration: Add `maintenance_request_id` to `expenses`

Add an optional foreign key column `maintenance_request_id` on the `expenses` table referencing `maintenance_requests(id)`. This enables:
- Linking expenses back to their originating maintenance request
- Preventing duplicate expense creation (unique-ish check before insert)
- Audit trail between maintenance and finance modules

### 2. Modify: `maintenanceService.updateStatus()` -- Auto-create expense on completion

Inside the existing `if (payload.status === 'completed')` block (after vendor job completion), add logic to:

1. Fetch the maintenance request's `unit_id` and look up the `property_id` from the `units` table (already available from the request query)
2. Check if an expense already exists for this `maintenance_request_id` (prevent duplicates)
3. If vendor job has `agreed_price`, create an expense record:
   - `merchant_id`: from the request
   - `category`: 'maintenance'
   - `subcategory`: request category (e.g., 'plumbing', 'electrical')
   - `description`: "Pemeliharaan - [request title]"
   - `amount`: agreed_price
   - `expense_date`: today
   - `property_id`: from unit lookup
   - `unit_id`: from the request
   - `vendor_id`: assigned_vendor_id
   - `maintenance_request_id`: request id
   - `approval_status`: auto-approve if under Rp 500k, else 'pending_approval'
   - `notes`: completion notes from the request

4. Show a toast message is already handled client-side; after the mutation succeeds, we add expense query invalidation

### 3. Modify: `useMaintenance.ts` -- Invalidate expense queries on completion

In the `useUpdateMaintenanceRequest` `onSuccess` callback, also invalidate expense-related queries so the Expenses page reflects the new auto-created record immediately.

### 4. Modify: `Maintenance.tsx` -- Add toast about auto-linked expense

Update the success toast in `handleUpdateStatus` to mention expense auto-creation when status is 'completed'.

### 5. Update: `old-docs/SYSTEM_AUDIT_REPORT.md`

Add Improvement 9 tracking lines.

## Files Changed

| File | Action | Description |
|------|--------|-------------|
| Database migration | CREATE | Add `maintenance_request_id` column to `expenses` table |
| `src/features/maintenance/services/maintenanceService.ts` | MODIFY | Add expense auto-creation in completion block |
| `src/features/maintenance/hooks/useMaintenance.ts` | MODIFY | Invalidate expense queries on status update |
| `src/pages/merchant/Maintenance.tsx` | MODIFY | Enhanced toast on completion |
| `old-docs/SYSTEM_AUDIT_REPORT.md` | UPDATE | Improvement 9 tracking |

## Technical Details

### Migration SQL

```text
ALTER TABLE expenses ADD COLUMN maintenance_request_id uuid REFERENCES maintenance_requests(id);
CREATE INDEX idx_expenses_maintenance_request_id ON expenses(maintenance_request_id) WHERE maintenance_request_id IS NOT NULL;
```

### Expense Auto-Creation Logic (in maintenanceService.updateStatus)

After existing vendor job completion block (around line 400), insert:

```text
1. Query: Check if expense with this maintenance_request_id already exists
2. If not exists AND vendorJob.agreed_price > 0:
   a. Fetch property_id from units table using request.unit_id
   b. Determine approval_status: agreed_price < 500000 ? 'approved' : 'pending_approval'
   c. INSERT into expenses with all pre-populated fields
   d. Log to audit trail
```

### Duplicate Prevention

Before creating expense, check:
```text
SELECT id FROM expenses WHERE maintenance_request_id = [request_id] LIMIT 1
```
If exists, skip creation (idempotent).

### No New UI Components

This is purely backend logic -- the expense appears automatically in the existing Expenses page. The only UI change is an enhanced toast message on completion.
