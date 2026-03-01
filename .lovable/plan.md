

# Improvement: Pattern 2 & 3 - State Machine Visibility + Bulk Operations

## Analysis Summary

**Pattern 3 (Bulk Operations): Already Implemented**
The codebase already has:
- Checkbox selection on `MoveOutsTable` with `selectedIds` state
- Floating bulk action bar at bottom of MoveOuts page (appears when 2+ selected)
- `BulkMoveOutProcessor` component with 4 collapsible sections (summary, acknowledge, schedule inspection, settle deposits)
- `useBulkMoveOutData` hook with bulk mutations

Status: COMPLETE. Only needs audit report update.

**Pattern 2 (State Transitions Without Feedback): Partially Implemented**
The Move-Out Wizard exists with 4 steps, and the Confirmation step (step 4) shows all 4 state machine statuses. However:
- Steps 1-3 do NOT show the parallel state machine progression
- The merchant has no visibility into how their current action affects Unit status, Contract status, and Deposit status simultaneously
- The step tracker at top only shows wizard steps, not the underlying domain state machines

## What Changes

### 1. Create: `StateMachineTracker` component

A compact sidebar/panel component showing 4 parallel state machine progressions in real-time:
- **Pemberitahuan**: submitted -> acknowledged -> in_progress -> completed
- **Unit**: occupied -> vacating -> available
- **Deposit**: pending_processing -> approved -> processing -> completed
- **Kontrak**: active -> terminated

Each row shows: label, current state (color-coded badge), and a mini progress indicator. The current state pulses subtly. States that change as a result of the current wizard step are highlighted.

This component reads from `useMoveOutWizardData` return values (notice.status, contract.status, depositRefund.status) and derives unit status from contract state.

**File:** `src/features/contracts/components/move-out-wizard/StateMachineTracker.tsx` (NEW)

### 2. Modify: `MoveOutWizard` -- Embed tracker in layout

Update the wizard layout to include the `StateMachineTracker` as a persistent sidebar on desktop (right side) and a collapsible section on mobile (above step content). The tracker stays visible across all 4 wizard steps.

Layout change: The current single-column step content becomes a 2-column layout on lg+ screens:
- Left (lg:col-span-3): Step content (unchanged)
- Right (lg:col-span-1): StateMachineTracker (persistent)

**File:** `src/features/contracts/components/move-out-wizard/MoveOutWizard.tsx` (MODIFY)

### 3. Update: `old-docs/SYSTEM_AUDIT_REPORT.md`

Mark Pattern 2 and Pattern 3 implementation status.

## Files Changed

| File | Action | Description |
|------|--------|-------------|
| `src/features/contracts/components/move-out-wizard/StateMachineTracker.tsx` | CREATE | Persistent 4-state-machine visibility panel |
| `src/features/contracts/components/move-out-wizard/MoveOutWizard.tsx` | MODIFY | Add tracker to layout as sidebar |
| `old-docs/SYSTEM_AUDIT_REPORT.md` | UPDATE | Pattern 2 & 3 status tracking |

## Technical Details

### StateMachineTracker Component

```text
Props: { data: ReturnType<typeof useMoveOutWizardData> }

Renders 4 rows:
1. Pemberitahuan: notice.status mapped to progression
2. Unit: derived from contract.status (active=occupied, terminated=available)
3. Deposit: depositRefund?.status or "Belum ada"
4. Kontrak: contract?.status

Each row:
  [Icon] [Label]
  [state-1] -> [state-2] -> [state-3]  (current state highlighted)
```

Visual states:
- Completed states: green text, green dot
- Current state: primary color, subtle pulse animation
- Future states: muted/gray

### Layout Change in MoveOutWizard

Current:
```text
<div className="min-h-[400px]">
  {step content}
</div>
```

New:
```text
<div className="grid grid-cols-1 lg:grid-cols-4 gap-6 min-h-[400px]">
  <div className="lg:col-span-3">
    {step content}
  </div>
  <aside className="lg:col-span-1">
    <StateMachineTracker data={data} />
  </aside>
</div>
```

On mobile, the tracker renders above the step content as a compact horizontal bar with collapsible detail.

### No Database Changes

All state data is already fetched by `useMoveOutWizardData`. The tracker is purely a presentation layer reading existing data.

