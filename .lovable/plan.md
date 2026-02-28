

# Improvement 10: Property-Level Staff Permission Scoping

## Overview

The `merchant_staff` table already has a `property_ids` column, but it is never enforced anywhere. Staff permissions are completely global -- `checkPermission()` doesn't check which properties a staff member is assigned to. This improvement activates property-level scoping so that staff can only access data for their assigned properties.

## Current State

- `merchant_staff.property_ids` (JSON array) exists but is decorative -- only displayed as a count badge in the UI
- `staff_permissions` table has no property-level scoping
- `checkPermission()` returns true/false based solely on permission key, ignoring property context
- The invite dialog has no property selector
- No data queries (invoices, maintenance, expenses, etc.) filter by staff's assigned properties

## What Changes

### 1. Modify: `checkPermission` to accept optional `propertyId`

Update `checkPermission()` in `staffService.ts` to:
- Accept an optional `propertyId` parameter
- When provided, fetch the staff member's `property_ids` and check if the requested property is in the list
- If `property_ids` is empty, treat as "all properties" (backward compatible)
- Owner still bypasses all checks

This is the core enforcement point -- all existing callers continue working (propertyId is optional).

### 2. Create: `checkPropertyAccess` helper function

New exported function in `staffService.ts`:
- Given a `userId`, `merchantId`, and `propertyId`, returns whether the staff member has access to that property
- Owners always have access
- Staff with empty `property_ids` have access to all properties
- Staff with non-empty `property_ids` only have access to listed properties

### 3. Modify: `useStaffPermission` hook to accept optional `propertyId`

Update the hook signature to `useStaffPermission(permissionKey, propertyId?)` so components can pass the current property context. The hook passes this through to `checkPermission`.

### 4. Modify: Invite Dialog -- Add property selector

Update the invite form in `StaffManagement.tsx` to include a multi-select for properties:
- Fetch merchant's properties using existing property queries
- Show checkboxes for each property
- "Semua Properti" option (empty array = all access)
- Pass selected `property_ids` to `inviteStaff`

### 5. Modify: Staff Card -- Show assigned property names

Instead of just showing "3 properti" count, resolve and display the actual property names. This gives merchants clear visibility into what each staff member can access.

### 6. Modify: Permissions Dialog -- Show property scope info

Add a read-only section at the top of the Permissions Dialog showing which properties this staff member is scoped to, with a link to edit.

### 7. Create: `useStaffPropertyAccess` hook

New hook that returns the current user's accessible property IDs:
- Owners get all properties
- Staff get their `property_ids` (or all if empty)
- Used by data-fetching hooks to filter queries

### 8. Update: `old-docs/SYSTEM_AUDIT_REPORT.md`

Add Improvement 10 tracking lines.

## Files Changed

| File | Action | Description |
|------|--------|-------------|
| `src/features/staff/services/staffService.ts` | MODIFY | Add propertyId param to checkPermission, add checkPropertyAccess helper |
| `src/features/staff/hooks/useStaffPermission.ts` | MODIFY | Accept optional propertyId parameter |
| `src/features/staff/hooks/useStaffPropertyAccess.ts` | CREATE | Hook returning accessible property IDs for current staff user |
| `src/pages/merchant/StaffManagement.tsx` | MODIFY | Add property selector to invite dialog, show property names on cards, show scope in permissions dialog |
| `old-docs/SYSTEM_AUDIT_REPORT.md` | UPDATE | Improvement 10 tracking |

## Technical Details

### Updated `checkPermission` signature

```text
checkPermission(userId, merchantId, permissionKey, propertyId?)
  1. Owner check (unchanged) -> true
  2. Find staff record (unchanged)
  3. NEW: If propertyId provided AND staff.property_ids is non-empty:
     - Check if propertyId is in staff.property_ids
     - If not, return false (no access to this property)
  4. Check permission key (unchanged)
```

### `checkPropertyAccess` function

```text
checkPropertyAccess(userId, merchantId, propertyId)
  1. Owner -> true
  2. Find staff with property_ids
  3. If property_ids is empty -> true (all access)
  4. If propertyId in property_ids -> true
  5. Else -> false
```

### `useStaffPropertyAccess` hook

```text
Returns: { accessiblePropertyIds: string[] | null, isAllAccess: boolean, isLoading }
- null = owner (all access)
- empty array with isAllAccess=true = staff with no restrictions
- non-empty array = staff limited to these properties
```

### Property Selector in Invite Dialog

Uses existing property data (from property queries already available in the merchant context). Renders as a list of checkboxes:
```text
Akses Properti:
[x] Semua Properti (default)
[ ] Bangunan Sejahtera
[ ] Kost Bahagia
[ ] Rumah Harmoni
```

When "Semua Properti" is unchecked, individual properties become selectable.

### No Database Changes

The `merchant_staff.property_ids` column already exists. No schema changes needed. The enforcement happens purely in application logic via `checkPermission` and the new `checkPropertyAccess` helper.

### Backward Compatibility

- All existing `checkPermission` calls continue working (no propertyId = no property check)
- All existing `useStaffPermission` calls continue working (propertyId is optional)
- Staff with empty `property_ids` retain full access (same as before)
- Only staff explicitly assigned to specific properties get scoped

