

# Gap Analysis: 2.1 PROPERTI — Implementation Plan

## Current State Assessment

| Gap | Description | Status | Action |
|-----|-------------|--------|--------|
| 1.1.1 | No "Clear All Filters" | ✅ COMPLETE | "Reset Semua" + individual X badges already exist |
| 1.1.2 | Filters Not Sticky | ✅ COMPLETE | viewMode, sortBy, insightsOpen all persisted to localStorage |
| 1.1.3 | Inconsistent Occupancy | ✅ COMPLETE | Card uses segmented bar + BAIK/PERHATIAN/KRITIS badge, detail uses badge — acceptable |
| 1.1.4 | No "Jump to Page" | ✅ COMPLETE | Jump-to-page input shown when totalPages > 5 |
| 1.1.5 | Insights Panel Discovery | 🟡 PARTIAL | Panel exists and is collapsible, but no hint for new users |
| 1.1.6 | Empty State Clarity | ✅ COMPLETE | Differentiates "no properties" vs "filter mismatch" with distinct messages |
| 1.1.7 | Subscribe Warning Not Contextual | 🟡 PARTIAL | Warning is separate banner, not adjacent to button |
| 1.1.8 | No "Recently Viewed" | ⏳ NOT STARTED | **Implement** |
| 1.1.10 | Search Debounce Not Visible | ⏳ NOT STARTED | **Implement** |
| 1.1.11 | No Server-Side Pagination | ✅ COMPLETE | `search_properties_server` RPC, auto-activated ≥100 |
| 1.1.12 | View Units vs Manage Images | ⏭️ SKIP | Both are dialogs by design, rare confusion |

## Implementation (4 items)

### 1. Search Loading Indicator (Gap 1.1.10)
When user types in search and debounce is pending (`searchQuery !== debouncedSearch`), show a small spinner inside the search input (replacing the search icon). Gives immediate feedback that search is processing.

**File**: `src/features/properties/components/PropertyFilters.tsx`
- Replace static `Search` icon with `Loader2` (spinning) when `isSearching` prop is true
- Add `isSearching?: boolean` prop

**File**: `src/pages/merchant/Properties.tsx`
- Pass `isSearching={searchQuery !== debouncedSearch}` to PropertyFilters

### 2. Insights Panel Discovery Hint (Gap 1.1.5)
Add a subtle "tip" badge next to the Insights header on first visit. Store `sihuni:insightsHintDismissed` in localStorage. Once user expands/collapses once, dismiss forever.

**File**: `src/pages/merchant/Properties.tsx`
- Add `insightsHintSeen` state from localStorage
- Show a small `Badge` saying "Baru" next to "Operational Insights" title if not yet seen
- On first toggle, set localStorage flag

### 3. Subscription Warning Contextual (Gap 1.1.7)
Move the subscription limit warning inline next to the "Tambah Properti" button instead of a separate banner. Show as a tooltip or small inline text when at limit.

**File**: `src/pages/merchant/Properties.tsx`
- Remove standalone `<SubscriptionLimitWarning />` banner
- Add inline warning text/tooltip next to "Tambah Properti" button when `limits && !limits.canAddProperty`

### 4. Recently Viewed Properties (Gap 1.1.8)
Track last 5 viewed properties in localStorage (`sihuni:recentProperties`). Show as a small collapsible section above the filter bar when the list has entries.

**File**: `src/pages/merchant/Properties.tsx`
- Read/write `sihuni:recentProperties` (array of `{id, name, timestamp}`, max 5)
- On property card click (navigate), push to recent list
- Render a "Terakhir Dilihat" section with clickable chips

**File**: `src/features/properties/components/PropertyCard.tsx`
- No change needed — navigation already happens via `handleCardClick`

### 5. Update AUDIT_MENU.md
Update section 2.1 gaps with line-by-line status for all 11 gaps.

## Files Summary

| File | Action |
|------|--------|
| `src/features/properties/components/PropertyFilters.tsx` | Add `isSearching` prop, swap icon |
| `src/pages/merchant/Properties.tsx` | Search indicator, insights hint, inline subscription warning, recently viewed |
| `old-docs/AUDIT_MENU.md` | Update all gap statuses |

