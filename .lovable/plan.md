

# Priority 1: Tenant Screening Gate + Priority 2: Unit Occupancy Board (Kanban)

## Overview

Two critical features:
1. **Tenant Screening Gate** -- mandatory pre-contract screening with Green/Yellow/Red scoring, guarantor for high-risk, and gating on contract creation
2. **Unit Occupancy Board** -- Kanban-style visual board with drag-drop status updates, color-coded unit types, tenant details, and filters

---

## Priority 1: Tenant Screening Gate (Pre-Contract)

### Phase 1A: Database -- `tenant_screenings` table

Create a new `tenant_screenings` table to store structured screening data and results:

```text
tenant_screenings
  id              uuid PK
  merchant_id     uuid FK merchants
  tenant_user_id  uuid (nullable -- for existing tenants)
  candidate_name  text NOT NULL
  candidate_email text
  candidate_phone text
  occupation      text
  employer_name   text
  monthly_income  numeric
  income_proof_url text (file path in storage)
  previous_landlord_name  text
  previous_landlord_phone text
  previous_rental_notes   text
  guarantor_name    text
  guarantor_phone   text
  guarantor_relation text
  guarantor_id_url  text (file path in storage)
  screening_score   numeric (0-100, nullable until scored)
  screening_grade   text (green/yellow/red)
  ai_assessment     jsonb (full AI result)
  status            text (pending/scored/approved/rejected) DEFAULT 'pending'
  reviewed_by       uuid (merchant user who approved/rejected)
  reviewed_at       timestamptz
  notes             text
  created_at        timestamptz DEFAULT now()
  updated_at        timestamptz DEFAULT now()
```

RLS: merchant can CRUD own screenings. Add `updated_at` trigger. Add state machine `SCREENING_STATUS_TRANSITIONS`.

### Phase 1B: Screening Form UI

Create `src/features/screening/` module:
- `types/index.ts` -- ScreeningFormData type, ScreeningResult type
- `components/TenantScreeningForm.tsx` -- multi-step form:
  - Step 1: Personal info (name, email, phone, occupation, employer, income)
  - Step 2: Rental history (previous landlord name, phone, notes)
  - Step 3: Income proof upload (file upload to `verification-documents` bucket)
  - Step 4: Guarantor info (if high-risk or optional)
- `components/ScreeningScoreCard.tsx` -- displays Green/Yellow/Red badge with score breakdown
- `components/ScreeningApprovalActions.tsx` -- Approve/Reject buttons for Red-scored tenants
- `hooks/useScreening.ts` -- CRUD mutations for tenant_screenings table
- `services/screeningService.ts` -- Supabase queries + invoke `ml-tenant-quality-scoring` for AI scoring

### Phase 1C: Screening Gate in Contract Creation Flow

Modify the contract creation workflow:
1. **`CreateContractDialog.tsx`** -- add a screening gate step:
   - When merchant selects a tenant, check if a valid screening exists (status = 'approved' or grade = 'green'/'yellow')
   - If no screening or screening grade = 'red' without approval: block contract creation with message "Screening diperlukan sebelum membuat kontrak"
   - Show link to run screening
2. **`useContractActions.ts`** -- add screening validation before `createContractMutation.mutate()`
3. If screening grade = 'red', require `reviewed_by` to be set (merchant must explicitly approve)
4. If screening grade = 'yellow', show warning but allow proceed
5. If screening grade = 'green', auto-proceed

### Phase 1D: AI Scoring Integration

Reuse the existing `ml-tenant-quality-scoring` edge function but enhance the screening service to:
- Map `tenant_screenings` form data to `ScreeningData` format
- After AI returns result, update `tenant_screenings` with `screening_score`, `screening_grade` (mapped from quality_grade: A/B = green, C = yellow, D/F = red), and full `ai_assessment`
- Auto-set status to 'scored'

### Phase 1E: Screening Page

Create `src/pages/merchant/TenantScreening.tsx`:
- Table of all screenings (filterable by grade, status)
- "New Screening" button opens `TenantScreeningForm`
- Detail view shows score card + approval actions
- Add to merchant nav under "Operasional" group

### Phase 1F: Guarantor Handling

- If screening_grade = 'red', make guarantor fields mandatory before approval
- Store guarantor ID document in `verification-documents` bucket
- Display guarantor info on screening detail and contract detail

---

## Priority 2: Unit Occupancy Board (Kanban)

### Phase 2A: Kanban Board Page

Create `src/pages/merchant/OccupancyBoard.tsx`:
- 4 columns: **Occupied** | **Vacant-Available** | **Vacant-Maintenance** | **Notice-Received**
- Each unit rendered as a card with:
  - Unit number + property name
  - Color stripe by unit_type (single=blue, double=green, studio=orange, suite=purple, other=gray)
  - Tenant name (if occupied/notice)
  - Contract end date (if occupied/notice)
  - Rent amount
  - Mini badge for pending maintenance count

### Phase 2B: Kanban Components

Create `src/features/properties/components/occupancy/`:
- `OccupancyBoard.tsx` -- main board container with 4 columns
- `OccupancyColumn.tsx` -- single column with drop zone (HTML5 drag-and-drop, no extra library)
- `OccupancyCard.tsx` -- draggable unit card with color coding
- `OccupancyFilters.tsx` -- filter bar (floor, unit_type, price range, property)
- `OccupancyStats.tsx` -- summary strip (total, occupied %, vacant count, maintenance count)

### Phase 2C: Drag-and-Drop Status Update

Implement native HTML5 drag-and-drop (no additional library needed):
- Drag a card from one column to another
- On drop, call `unitService.updateUnit(id, { status: newStatus })` 
- Map columns: Occupied -> `occupied`, Vacant-Available -> `available`, Vacant-Maintenance -> `maintenance`, Notice-Received -> uses contract `notice` status (read-only column, no drop)
- Show confirmation dialog for status changes (e.g., "Pindahkan unit ke Maintenance?")
- Refresh data after mutation

### Phase 2D: Data Enrichment

Create `src/features/properties/hooks/useOccupancyBoard.ts`:
- Fetch all merchant units with property info
- Join with active contracts to get tenant name + end date for occupied units
- Join with contracts in 'notice' status for notice column
- Join with maintenance_requests count for each unit
- All in a single optimized query

### Phase 2E: Navigation + Route

- Add route in `App.tsx`: `/merchant/occupancy-board` -> `OccupancyBoard`
- Add nav item in merchant "Utama" group: icon `LayoutGrid`, label "Papan Okupansi"

### Phase 2F: Responsive Design

- Desktop: 4 columns side by side
- Tablet: 2x2 grid
- Mobile: vertical stack, swipeable tabs for each column

---

## State Machine Addition

Add to `state-machines.ts`:
```typescript
export const SCREENING_STATUS_TRANSITIONS: Record<string, string[]> = {
  pending: ['scored'],
  scored: ['approved', 'rejected'],
  approved: [],   // terminal
  rejected: ['pending'],  // allow re-screening
};
```

---

## Files Summary

| Action | File | Description |
|--------|------|-------------|
| CREATE | DB migration | `tenant_screenings` table + RLS + updated_at trigger |
| CREATE | `src/features/screening/types/index.ts` | Screening types |
| CREATE | `src/features/screening/services/screeningService.ts` | DB queries + AI invoke |
| CREATE | `src/features/screening/hooks/useScreening.ts` | TanStack Query mutations |
| CREATE | `src/features/screening/components/TenantScreeningForm.tsx` | Multi-step screening form |
| CREATE | `src/features/screening/components/ScreeningScoreCard.tsx` | Green/Yellow/Red score display |
| CREATE | `src/features/screening/components/ScreeningApprovalActions.tsx` | Approve/Reject for red scores |
| CREATE | `src/features/screening/components/ScreeningTable.tsx` | List all screenings |
| CREATE | `src/pages/merchant/TenantScreening.tsx` | Screening management page |
| MODIFY | `src/features/contracts/components/CreateContractDialog.tsx` | Add screening gate |
| MODIFY | `src/features/contracts/hooks/useContractActions.ts` | Screening validation |
| MODIFY | `src/shared/constants/state-machines.ts` | Add SCREENING_STATUS_TRANSITIONS |
| CREATE | `src/features/properties/components/occupancy/OccupancyBoard.tsx` | Kanban board container |
| CREATE | `src/features/properties/components/occupancy/OccupancyColumn.tsx` | Droppable column |
| CREATE | `src/features/properties/components/occupancy/OccupancyCard.tsx` | Draggable unit card |
| CREATE | `src/features/properties/components/occupancy/OccupancyFilters.tsx` | Filter bar |
| CREATE | `src/features/properties/components/occupancy/OccupancyStats.tsx` | Stats strip |
| CREATE | `src/features/properties/hooks/useOccupancyBoard.ts` | Data fetching hook |
| CREATE | `src/pages/merchant/OccupancyBoard.tsx` | Board page |
| MODIFY | `src/App.tsx` | Add routes |
| MODIFY | `navigation-config.ts` | Add nav items |
| MODIFY | `old-docs/PMS_Audit_Report_FULL.md` | Update status to COMPLETE |

---

## Technical Notes

- **No new npm packages** -- HTML5 drag-and-drop is sufficient for the Kanban board
- Screening reuses existing `ml-tenant-quality-scoring` edge function via `screening_data` parameter
- File uploads for income proof and guarantor ID reuse existing `verification-documents` bucket
- Unit type color coding uses Tailwind classes mapped from `unit_type` field
- The screening gate is a soft gate for green/yellow and hard gate for red (requires explicit merchant approval)
