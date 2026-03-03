

# Flow Analysis & Gap Implementation Plan

## Flow-by-Flow Verification

### Flow A: Main Page Load — ✅ COMPLETE
All items implemented: localStorage restore (viewMode, itemsPerPage, sortBy, insightsExpanded), header, subscription alert, toolbar, KPI cards, insights panel, results counter, grid/list, pagination.

### Flow B: Filter + Search — ✅ COMPLETE  
Debounce 500ms with loading indicator, client-side filtering, empty states differentiated, server-side search for 100+. All match the diagram.

### Flow C: Property Edit Multi-Step — ✅ COMPLETE
4-step dialog (Basic Info → Location → Details → Media), validation per step, back preserves data, success/error toasts. Error keeps dialog open. Steps match (diagram shows 3 steps but actual has 4 which is better).

### Flow D: Delete with Dependency Check — 🟡 PARTIAL (2 gaps)

| Item | Status | Gap |
|------|--------|-----|
| Confirmation dialog | ✅ | Exists |
| `canDelete` check | ✅ | Checks occupied units + active contracts |
| Error dialog with reasons | ✅ | Shows reason via toast |
| Delete execution | ✅ | Works |
| **5-sec undo toast** | ❌ | `SoftDeleteManager` component exists but is NOT used in Properties delete flow |
| **KPI card auto-update** | ✅ | Query invalidation handles this |

### Flow E: Pagination & View Toggle — 🟡 PARTIAL (1 gap)

| Item | Status | Gap |
|------|--------|-----|
| Page click updates items | ✅ | Works |
| Items per page change resets to page 1 | ✅ | `useEffect` resets page on itemsPerPage change |
| View toggle preserves state | ✅ | All state preserved |
| **Scroll to top on page change** | ❌ | No `window.scrollTo(0, 0)` on page change |

## Implementation

### 1. Scroll to Top on Page Change (Flow E)
**File**: `src/pages/merchant/Properties.tsx`
- Add `useEffect` watching `page` → `window.scrollTo({ top: 0, behavior: 'smooth' })`

### 2. Undo Toast on Property Delete (Flow D)
**File**: `src/pages/merchant/Properties.tsx`
- Import and use `SoftDeleteManager` + `UndoToastContainer` from existing component
- Change delete flow: instead of immediately calling `deleteProperty`, use `handleSoftDelete` which shows undo toast for 5 seconds, then permanently deletes
- This requires: snapshot property data before delete, restore on undo (re-create via `createProperty`)

**Alternative (simpler)**: Use `sonner` toast with an undo action button. On delete success, show a 5-second toast with "Undo" button. If clicked within 5 seconds, re-create the property. This is simpler but the undo is best-effort (units/contracts won't be restored).

**Recommended**: Use the simpler approach — show a `toast` with duration 5000ms and an action button. The existing `SoftDeleteManager` component requires `onRestore` which would need re-inserting the property, which is feasible since we already have `createProperty`.

### 3. Update AUDIT_MENU.md
- Mark Flow D undo toast and Flow E scroll-to-top as COMPLETE

## Files

| File | Action |
|------|--------|
| `src/pages/merchant/Properties.tsx` | Add scroll-to-top effect + undo toast on delete |
| `old-docs/AUDIT_MENU.md` | Update flow verification status |

