

# Fix: Full-Screen Loading Flicker and Compliance Property Context

## Problem 1: Full-Screen Empty State When Returning to Chrome

When switching apps and returning to Chrome, users see a full-screen spinner that covers the entire screen -- including the sidebar and navbar. This happens because `App.tsx` has a single top-level `<Suspense>` wrapping ALL routes with a full-screen `<PageLoader />` fallback.

The `MerchantLayoutRoute` already has its own inner `<Suspense>` with `<ContentSkeleton />` that correctly only affects the content area. However, if a lazy component suspends at the wrong moment, the outer fallback catches it and blanks the whole screen.

### Fix

1. **Move the outer `<Suspense>` boundary so it only wraps routes that are NOT inside a layout.** The merchant layout routes (under `MerchantLayoutRoute`) already have their own Suspense -- they don't need the outer one.

2. **Alternatively (simpler):** Keep the outer `<Suspense>` but change `<PageLoader />` to a less intrusive fallback (e.g., just a transparent overlay or null). Then ensure each layout route has its own inner Suspense with `ContentSkeleton`.

3. **Recommended approach:** Add a second `<Suspense>` boundary inside `MerchantLayoutRoute` that wraps `<Outlet />` and prevents suspension from bubbling up to the full-screen fallback. This is already done (`ContentSkeleton` fallback), but we should also add `React.startTransition` or configure TanStack Query to avoid re-suspending on window focus refetches.

**Concrete changes:**
- In `App.tsx`: Wrap only the non-layout routes (auth pages, standalone pages) in the outer `<Suspense fallback={<PageLoader />}>`. The merchant/admin layout routes already handle their own loading.
- Ensure `QueryClient` has `refetchOnWindowFocus: false` or at minimum does NOT trigger Suspense on refetch (default TanStack Query behavior should not suspend on refetch, but the lazy component re-evaluation might).

---

## Problem 2: Compliance Tab Asks to Select Property Again

The "Kepatuhan" tab in the Property Detail page loads `PropertyCompliance.tsx` via `React.lazy`. But `PropertyCompliance` is a standalone page that:
- Fetches its own property list
- Has its own `selectedPropertyId` state (starts as empty `''`)
- Shows "Pilih properti untuk melihat data compliance"

It completely ignores the fact that it's already embedded inside a Property Detail page that has a known `id`.

### Fix

Modify `PropertyCompliance.tsx` to accept an optional `propertyId` prop. When provided (from PropertyDetail), it skips the property selector and uses the passed ID directly. When not provided (standalone `/merchant/compliance` route), it shows the selector as before.

**Concrete changes:**
- `PropertyCompliance.tsx`: Add `propertyId?: string` prop. If provided, use it directly and hide the property selector dropdown.
- `PropertyDetail.tsx` line 377: Pass the property ID: `<LazyCompliance propertyId={id} />`

---

## Technical Details

### File Changes

**`src/App.tsx`**
- Add default options to `QueryClient`: `{ defaultOptions: { queries: { refetchOnWindowFocus: false } } }` (or set `suspense: false` -- though TanStack v5 doesn't use suspense by default, the lazy loading itself can trigger the outer boundary)
- Restructure `<Suspense>` boundaries so the outer fallback only applies to pages without their own layout shell

**`src/pages/merchant/PropertyCompliance.tsx`**
- Change the component signature to accept `{ propertyId?: string }`
- When `propertyId` is provided: skip `useMerchantProperties` fetch, skip the property selector UI, use `propertyId` directly
- When `propertyId` is not provided: keep current behavior (standalone page)

**`src/pages/merchant/PropertyDetail.tsx`**
- Line 377: Change `<LazyCompliance />` to `<LazyCompliance propertyId={id} />`

### Risk Assessment

- **Low risk**: Both changes are backward-compatible. The standalone compliance route continues to work. The layout change only affects which loading indicator shows during transitions.
- **No data loss**: No database or backend changes needed.
- **No feature removal**: All functionality preserved; only the UX flow is improved.

