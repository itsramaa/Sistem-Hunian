
# Fix: Maintenance Bugs (Detail Not Found + Buggy Behavior)

## Root Cause Analysis

Found **5 bugs** across the maintenance feature:

### Bug 1: `getRequestById` uses `.single()` instead of `.maybeSingle()`
In `maintenanceService.ts` line 78, `.single()` **throws an error** when no rows are returned. This means the detail page query enters an **error state** (not `data = null`), but the page only checks `!request` (no error handling). Result: user sees loading skeleton forever or a cryptic error instead of the "not found" message.

### Bug 2: Detail page has no error state handling
`MaintenanceDetail.tsx` checks `isLoading` and `!request`, but never checks `error`. When `.single()` throws, `isLoading = false` and `request = undefined`, but the error may prevent proper rendering.

### Bug 3: Timeline table mismatch
- **Writes** go to `maintenance_timeline` table (status changes, reviews)
- **Reads** come from `maintenance_updates` table (manual replies only)
- The `UpdateTimeline` component only shows manual replies, missing all automated status change entries

### Bug 4: `createMerchantRequest` drops `estimated_cost`
The `CreateMaintenanceDialog` collects `estimated_cost` and sends it in the payload, but `maintenanceService.createMerchantRequest()` never includes it in the insert. The field is silently dropped.

### Bug 5: Wrong status filter in PropertyDetail
`pendingMaintenance` filters `status !== 'resolved' && status !== 'closed'` but these statuses don't exist. Actual statuses are: `pending`, `in_progress`, `completed`, `cancelled`. So the badge count is always wrong (shows ALL maintenance as pending).

## Fixes

### File 1: `src/features/maintenance/services/maintenanceService.ts`
- **Line 78**: Change `.single()` to `.maybeSingle()` in `getRequestById`
- **Line 151-163**: Add `estimated_cost` to the insert in `createMerchantRequest`

### File 2: `src/pages/merchant/MaintenanceDetail.tsx`
- Add `error` from the query destructuring
- Add error state UI before the "not found" check (shows proper error message with retry button)

### File 3: `src/features/maintenance/components/UpdateTimeline.tsx`
- Merge data from both `maintenance_updates` AND `maintenance_timeline` tables
- Sort combined entries by `created_at` ascending
- Display timeline entries (status changes) with distinct styling from manual updates

### File 4: `src/pages/merchant/PropertyDetail.tsx`
- **Line 311**: Change `pendingMaintenance` filter from `status !== 'resolved' && status !== 'closed'` to `status !== 'completed' && status !== 'cancelled'`

### File 5: `old-docs/SYSTEM_AUDIT_REPORT.md`
- Track all 5 bug fixes

## Technical Details

### UpdateTimeline merge strategy
```text
1. Fetch maintenance_updates (manual replies with content, photos)
2. Fetch maintenance_timeline (automated status changes with message, actor)
3. Normalize both into a common shape: { id, type, content/message, author_role, status, photos, created_at }
4. Merge + sort by created_at ascending
5. Render with type-specific styling (status changes get icon + badge, replies get avatar + content)
```

### No database changes needed
All fixes are purely frontend.
