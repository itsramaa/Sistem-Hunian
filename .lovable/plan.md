

# Improvement 8: Mobile Alerts to Desktop Sidebar

## Overview

The "Notifikasi" sidebar item currently sits buried in the "Akun" group (6th group, 4th item). Desktop merchants easily miss critical alerts. This improvement promotes the alerts link to a prominent position and adds a live unread badge count directly on the sidebar item.

## Current State

- `Notifikasi` already exists in the sidebar at `/merchant/alerts` under the "Akun" group (line 178 of navigation-config.ts)
- `NotificationsDropdown` already exists in the desktop header (bell icon with badge) -- this handles DB-driven notifications
- The Alerts page (`/merchant/alerts`) shows dynamically-assembled operational alerts (overdue invoices, maintenance, contracts) -- these are NOT the same as DB notifications
- Mobile bottom nav already has "Notifikasi" as a primary tab

## What Changes

### 1. Promote "Notifikasi" in sidebar navigation

Move the alerts item from the "Akun" group to the "Utama" group (right below Dashboard), making it the second item merchants see. Remove it from "Akun" to avoid duplication.

**File:** `src/shared/components/layouts/navigation-config.ts`

### 2. Add badge support to NavItem interface

Extend `NavItem` with an optional `badge` field that can be rendered by `nav-main.tsx`. Since badge counts are dynamic (from DB), we use a string identifier that the sidebar resolves at render time.

**File:** `src/shared/components/layouts/navigation-config.ts`
- Add `badgeKey?: string` to `NavItem` interface
- Set `badgeKey: 'alerts'` on the Notifikasi item

### 3. Create a hook for alert counts

Create `useAlertCounts` hook that queries the same data sources as the Alerts page but returns only counts. This is lightweight (count queries, not full data).

**File:** `src/features/notifications/hooks/useAlertCounts.ts` (NEW)
- Queries overdue invoices count, pending expenses count, stale maintenance count, expiring contracts count
- Returns total count + per-type counts
- Uses `merchant?.id` as dependency, polls every 5 minutes (staleTime)

### 4. Render badges in nav-main.tsx

Update `NavMain` to accept an optional `badges` map and render a small count badge next to items that have a `badgeKey`.

**File:** `src/shared/components/layouts/sidebar/nav-main.tsx`
- Accept new prop: `badges?: Record<string, number>`
- When rendering an item with `badgeKey`, show a small red badge with the count (if > 0)
- Badge uses same style as NotificationsDropdown badge

### 5. Wire badge data in AppSidebar

Call `useAlertCounts` in `AppSidebar` for merchant role and pass the badge map down to `NavMain`.

**File:** `src/shared/components/layouts/sidebar/app-sidebar.tsx`

### 6. Update audit tracking

**File:** `old-docs/SYSTEM_AUDIT_REPORT.md`

## Files Changed

| File | Action | Description |
|------|--------|-------------|
| `src/shared/components/layouts/navigation-config.ts` | MODIFY | Move Notifikasi to Utama group, add `badgeKey` to NavItem |
| `src/features/notifications/hooks/useAlertCounts.ts` | CREATE | Lightweight hook returning alert counts |
| `src/shared/components/layouts/sidebar/nav-main.tsx` | MODIFY | Render badge counts on items with `badgeKey` |
| `src/shared/components/layouts/sidebar/app-sidebar.tsx` | MODIFY | Wire useAlertCounts and pass badges to NavMain |
| `old-docs/SYSTEM_AUDIT_REPORT.md` | UPDATE | Improvement 8 tracking |

## Technical Details

### Badge Count Query (useAlertCounts)

Four lightweight count queries in a single `Promise.all`:
- Overdue invoices: `supabase.from('invoices').select('id', { count: 'exact', head: true }).eq('merchant_id', X).in('status', ['overdue','escalated'])`
- Pending expenses: `supabase.from('expenses').select('id', { count: 'exact', head: true }).eq('merchant_id', X).eq('status', 'pending_approval')`
- Stale maintenance: `supabase.from('maintenance_requests').select('id', { count: 'exact', head: true }).eq('merchant_id', X).eq('status', 'pending')`
- Expiring contracts: count query with date filter

Total = sum of all counts. Cached with 5-minute staleTime to avoid excessive queries.

### NavItem Badge Rendering

```text
[Icon] Notifikasi  [3]
                    ^^^-- small red circle badge, only if count > 0
```

In collapsed sidebar mode, the badge appears as a dot on the icon (like the header bell).

### No Database Changes

All queries use existing tables. No new tables, columns, or RLS policies needed.

