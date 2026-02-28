
# Improvement 2: Unified Move-Out Wizard

## What We're Building

Replace the current MoveOutDetail page (`src/pages/merchant/MoveOutDetail.tsx`) with a step-based wizard that unifies the 4 move-out state machines (Notice, Inspection, Deposit Refund, Contract Termination) into a single guided workflow. The wizard is accessed from the existing MoveOuts list page when clicking on a notice row.

## Current State (What Exists)

The system already has solid building blocks:
- **MoveOutDetail page**: Read-only detail view (no actions for merchant)
- **ScheduleInspectionDialog**: Schedule inspection date/time
- **MoveOutInspectionForm**: Conduct inspection with checklist, deductions, signatures, creates `deposit_refunds` record
- **EarlyTerminationReviewDialog**: Approve/deny/negotiate early termination
- **MoveOutDashboard component**: Tenant-facing timeline tracker (uses `move_out_timeline`, `move_out_tasks`, `deposit_refunds`)
- **Database tables**: `move_out_notices`, `move_out_inspections`, `move_out_timeline`, `move_out_tasks`, `deposit_refunds`, `early_termination_requests`
- **State machines**: `MOVE_OUT_NOTICE_TRANSITIONS`, `MOVE_OUT_INSPECTION_TRANSITIONS`, `EARLY_TERMINATION_TRANSITIONS`, `DEPOSIT_REFUND_TRANSITIONS`

No database changes needed -- all required tables and columns already exist.

## Architecture

### Approach: Replace MoveOutDetail with Wizard Page

Instead of a modal (which would be too cramped for the inspection form + signatures), we replace the existing `MoveOutDetail.tsx` page at route `/merchant/move-outs/:noticeId` with a wizard-style page.

### File Structure

```
src/features/contracts/components/move-out-wizard/
  MoveOutWizard.tsx          -- Main wizard container with step navigation
  WizardStepNoticeReview.tsx -- Step 1: Review notice + tenant info
  WizardStepInspection.tsx   -- Step 2: Schedule or conduct inspection
  WizardStepDeposit.tsx      -- Step 3: Settle deposit & terminate contract
  WizardStepConfirmation.tsx -- Step 4: Summary + actions
  useMoveOutWizardData.ts    -- Hook: fetches all related data in one place
```

### Step Design (4 Steps, Not 5)

Combining the audit's 5 steps into 4 practical steps since "Select Tenant" is already handled by clicking a row in the MoveOuts list:

**Step 1 -- Tinjau Pemberitahuan (Review Notice)**
- Shows: tenant info, unit, move-out date, days remaining, reason, early termination status
- If early termination pending: embed the approve/deny/negotiate controls (currently in `EarlyTerminationReviewDialog`)
- Action: "Acknowledge Notice" (updates `move_out_notices.status` from `submitted` to `acknowledged`)
- Visual: unified status tracker showing all 4 state machine states

**Step 2 -- Inspeksi (Inspection)**
- If no inspection: show schedule form (reuse logic from `ScheduleInspectionDialog`)
- If inspection scheduled: show date, allow "Conduct Inspection" which shows the full checklist form (reuse logic from `MoveOutInspectionForm`)
- If inspection completed: show results summary (condition report, deductions)

**Step 3 -- Penyelesaian Deposit & Kontrak (Deposit Settlement & Contract)**
- Display: original deposit, deductions from inspection, net refund, outstanding invoices
- Action: "Approve Deposit Refund" (updates `deposit_refunds.status`)
- Action: "Terminate Contract" (updates `contracts.status` to `terminated`, triggers unit status change via existing DB trigger)
- Bank details input for refund transfer

**Step 4 -- Konfirmasi (Confirmation)**
- Summary of all actions taken
- Status of each state machine
- Actions: "Kirim Konfirmasi ke Penyewa", "Cetak Checklist", "Kembali ke Daftar"

### Unified Status Tracker Component

A horizontal stepper shown at the top of every step:
```
[Notice] ──> [Inspection] ──> [Deposit & Contract] ──> [Complete]
   ✓             In Progress          Pending              Pending
```

Each step shows green/yellow/gray based on the actual database state, not wizard navigation. Merchant can jump to any completed or current step.

## Files Changed

| File | Action | Description |
|------|--------|-------------|
| `src/features/contracts/components/move-out-wizard/MoveOutWizard.tsx` | CREATE | Main wizard container |
| `src/features/contracts/components/move-out-wizard/WizardStepNoticeReview.tsx` | CREATE | Step 1 |
| `src/features/contracts/components/move-out-wizard/WizardStepInspection.tsx` | CREATE | Step 2 (reuses inspection logic) |
| `src/features/contracts/components/move-out-wizard/WizardStepDeposit.tsx` | CREATE | Step 3 |
| `src/features/contracts/components/move-out-wizard/WizardStepConfirmation.tsx` | CREATE | Step 4 |
| `src/features/contracts/components/move-out-wizard/useMoveOutWizardData.ts` | CREATE | Unified data hook |
| `src/pages/merchant/MoveOutDetail.tsx` | REPLACE | Renders MoveOutWizard instead of static detail |
| `old-docs/SYSTEM_AUDIT_REPORT.md` | UPDATE | Add implementation tracking for Improvement 2 |

## Technical Details

### useMoveOutWizardData Hook
Single hook that fetches all related data:
- `move_out_notices` (with contract, unit, property joins)
- `move_out_inspections`
- `move_out_timeline`
- `deposit_refunds`
- `early_termination_requests`
- `profiles` (tenant)
- Outstanding `invoices` for the contract

### Step Navigation Logic
- Steps are not strictly linear -- merchant can revisit completed steps
- "Next" button is disabled until the current step's required action is done
- Step completion is derived from database state, not local wizard state:
  - Step 1 complete: notice status is `acknowledged` or later
  - Step 2 complete: inspection status is `completed`
  - Step 3 complete: deposit refund is `approved` or later AND contract is `terminated`
  - Step 4: always accessible once Step 3 is done

### Reuse Strategy
- Inspection checklist logic (8 items, condition radio, deductions, signatures) is extracted from `MoveOutInspectionForm` and reused inline in Step 2
- Early termination review controls are extracted from `EarlyTerminationReviewDialog` and embedded in Step 1
- Deposit calculation display is similar to `MoveOutInspectionForm`'s deposit section

### No Database Migration Needed
All tables (`move_out_notices`, `move_out_inspections`, `deposit_refunds`, `move_out_timeline`, `early_termination_requests`) already exist with the required columns. The wizard just orchestrates writes to these existing tables.

### UI Patterns
- Uses existing design system: `rounded-2xl` cards, `gradient-icon-box`, `bg-card/90 backdrop-blur-sm`, glass-table styles
- Indonesian language for all labels (matching existing MoveOuts page)
- Progress stepper at top using existing `Progress` component
