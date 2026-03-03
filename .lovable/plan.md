

# Fix Property Detail Page — Blank Screen Bug

## Root Cause

**Line 300** in `PropertyDetail.tsx` calls a React hook (`useFacilityTypeNames`) **after** an early return on lines 287-298. This violates React's Rules of Hooks — hooks must always be called in the same order, never after conditional returns.

```
Line 287: if (isLoading) return <PropertyDetailSkeleton />;  ← early return
Line 289: if (error || !property) return ...;                 ← early return
Line 300: const { data: facilityNameMap } = useFacilityTypeNames(...);  ← HOOK AFTER RETURN = CRASH
```

React will throw an error like "Rendered fewer hooks than expected" causing the entire component to blank out.

## Fix

Move the `useFacilityTypeNames` hook call **above** the early returns (before line 287), alongside all other hooks. Pass a safe fallback when `property` is not yet loaded:

```typescript
// Move BEFORE early returns (around line 130, with other hooks)
const { data: facilityNameMap = {} } = useFacilityTypeNames(property?.amenities || []);
```

Then remove line 300.

## Files

| File | Change |
|------|--------|
| `src/pages/merchant/PropertyDetail.tsx` | Move `useFacilityTypeNames` hook above early returns |

