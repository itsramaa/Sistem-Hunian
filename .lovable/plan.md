
# Frontend Audit & Refactor: Maintenance, MoveOuts, Reports

## Audit Findings

### A. Design System Violations (HIGH)

**1. Hardcoded Colors**

| File | Line | Violation | Fix |
|------|------|-----------|-----|
| `MaintenanceStats.tsx` | 55 | `text-yellow-600` | `text-warning` |
| `MaintenanceStats.tsx` | 65 | `text-blue-600` | `text-info` |
| `MaintenanceStats.tsx` | 75 | `text-green-600` | `text-success` |
| `MaintenanceRequestTable.tsx` | 104 | `text-yellow-600` | `text-warning` |
| `MoveOutsTable.tsx` | 106 | `text-yellow-600` | `text-warning` |
| `MoveOutsTable.tsx` | 131 | `text-green-600` | `text-success` |
| `Reports.tsx` | 40 | `'#10b981', '#f59e0b'` (raw hex in COLORS array) | Use `hsl(var(--success))`, `hsl(var(--warning))` |

**2. Reports.tsx Overview Tab Loading**

| File | Line | Violation | Fix |
|------|------|-----------|-----|
| `Reports.tsx` | 450-452 | `Loader2` spinner for overview tab loading | Replace with `StatsRowSkeleton` + `ChartSkeleton` |

### B. Structural Issues (HIGH)

**3. Maintenance.tsx: Duplicate PageHeader**

Lines 78-79 render `<PageHeader>` TWICE -- this is a bug from a previous refactor. One must be removed.

**4. MaintenanceStats Not Using Shared StatCard**

`MaintenanceStats.tsx` uses raw `Card/CardHeader/CardContent` with no icons, no border-left accent, no hover effects, and no count-up animation. The project already has a polished `StatCard` component. Should be refactored for consistency with Contracts/Invoices/Payments stats (which were just refactored to use `StatCard`).

**5. Duplicated Pagination in Maintenance and MoveOuts Tables**

Both `MaintenanceRequestTable.tsx` (lines 186-214) and `MoveOutsTable.tsx` (lines 174-203) have inline pagination blocks identical to the pattern already extracted into the shared `TablePagination` component. These should use `TablePagination`.

**6. MoveOutsTable and MaintenanceRequestTable Empty States**

Both use custom inline empty states instead of the shared `EmptyState` component. Should be standardized.

**7. EarlyTerminationsList Empty State**

Uses a custom inline empty state (Card + CardContent with icon). Should use shared `EmptyState` for consistency.

### C. SRP Violations (MEDIUM)

**8. Reports.tsx: 644 lines -- Too Much Inline Logic**

The page contains:
- 5 `useQuery` calls directly in the component
- 3 export handler functions with try/catch/toast patterns (~100 lines)
- 7 `useMemo` computations for chart data transformations (~100 lines)
- `formatCurrency` utility defined inline (should import from shared)
- `COLORS` constant defined inline

Should extract:
- All queries + computed data into `useReportsData()` hook
- All export handlers into `useReportExports()` hook

**9. MaintenanceFilters: Missing Responsive Class**

`SelectTrigger` at line 33 uses `w-[180px]` without `w-full sm:w-[180px]`, inconsistent with other filter components (ContractsFilters, PaymentsFilters).

### D. Accessibility (LOW)

**10. EarlyTerminationsList: Grid Not Responsive**

Line 46: `grid-cols-3` without responsive breakpoints. On mobile, 3 columns will be too narrow. Should be `grid-cols-1 sm:grid-cols-3`.

---

## Refactoring Plan

### Phase 1: Fix Critical Bugs & Create Hooks

**1.1 Fix Maintenance.tsx duplicate PageHeader**

Remove the duplicate `<PageHeader>` on line 79.

**1.2 Create `src/features/analytics/hooks/useReportsData.ts`**

Extract from Reports.tsx:
- All 5 `useQuery` calls (properties, payments, previousPayments, maintenanceRequests)
- All 7 `useMemo` computations (totalRevenue, previousRevenue, revenueChange, pendingPayments, revenueData, occupancyByType, maintenanceByCategory, maintenanceTrend)
- Computed stats (totalUnits, occupiedUnits, occupancyRate)
- Accept `merchantId`, `effectiveDateRange` as params
- Return all computed data + loading/error states

**1.3 Create `src/features/analytics/hooks/useReportExports.ts`**

Extract from Reports.tsx:
- `handleExportPaymentsCSV`
- `handleExportMaintenanceCSV`
- `handleExportPDF`
- `exportLoading` state
- Accept payments, maintenanceRequests, computed stats as params

### Phase 2: Refactor Stats to Use StatCard

**2.1 Rewrite `MaintenanceStats.tsx`**

Replace raw Card grid with `StatCard` components:
- Total Requests: Wrench icon, primary accent
- Pending: Clock icon, warning accent
- In Progress: Loader icon, info accent
- Completed: CheckCircle icon, success accent

### Phase 3: Fix Tables (Pagination + Empty States)

**3.1 Update `MaintenanceRequestTable.tsx`**

- Replace inline pagination (lines 186-214) with shared `TablePagination` component
- Replace custom empty state with shared `EmptyState`

**3.2 Update `MoveOutsTable.tsx`**

- Replace inline pagination (lines 174-203) with shared `TablePagination`
- Replace custom empty state with shared `EmptyState`
- Fix hardcoded colors (`text-yellow-600` -> `text-warning`, `text-green-600` -> `text-success`)

**3.3 Update `EarlyTerminationsList.tsx`**

- Replace custom empty state with shared `EmptyState`
- Fix grid responsiveness: `grid-cols-3` -> `grid-cols-1 sm:grid-cols-3`

### Phase 4: Fix Reports.tsx

**4.1 Slim down `Reports.tsx`**

- Import `useReportsData()` and `useReportExports()` hooks
- Remove inline `formatCurrency` -- import from `@/shared/utils/currency`
- Replace `COLORS` hardcoded hex values with semantic tokens
- Replace `Loader2` spinner in overview tab with `StatsRowSkeleton` + `ChartSkeleton`
- Page becomes ~200 lines (pure UI shell) instead of 644

### Phase 5: Minor Fixes

**5.1 Fix `MaintenanceFilters.tsx` responsive class**

Change `w-[180px]` to `w-full sm:w-[180px]` on SelectTrigger for mobile consistency.

---

## Files Summary

### New Files (2)
| File | Description |
|------|-------------|
| `src/features/analytics/hooks/useReportsData.ts` | Extracted report queries + computed data |
| `src/features/analytics/hooks/useReportExports.ts` | Extracted export handlers |

### Updated Files (8)
| File | Changes |
|------|---------|
| `Maintenance.tsx` | Remove duplicate PageHeader |
| `MaintenanceStats.tsx` | Rewrite with shared `StatCard`, fix hardcoded colors |
| `MaintenanceRequestTable.tsx` | Use `TablePagination`, `EmptyState`, fix hardcoded color |
| `MaintenanceFilters.tsx` | Fix responsive SelectTrigger width |
| `MoveOutsTable.tsx` | Use `TablePagination`, `EmptyState`, fix hardcoded colors |
| `EarlyTerminationsList.tsx` | Use `EmptyState`, fix grid responsive |
| `Reports.tsx` | Use new hooks, fix COLORS, replace spinner with skeleton |

## Implementation Order

1. Create `useReportsData` + `useReportExports` hooks
2. Fix Maintenance.tsx duplicate PageHeader bug
3. Rewrite MaintenanceStats with StatCard
4. Update 3 table components (pagination, empty states, colors)
5. Slim down Reports.tsx with new hooks + skeleton loading
6. Fix MaintenanceFilters responsive class
