
# Fix Maintenance Page: Data Not Loading + Design Maximization

## Root Cause Analysis

The maintenance page shows "No maintenance requests" because the Supabase query in `maintenanceService.getMerchantRequests()` uses a foreign key hint that doesn't exist:

```typescript
tenant:profiles!maintenance_requests_tenant_user_id_fkey(full_name, email)
```

The `maintenance_requests` table has NO foreign key from `tenant_user_id` to `profiles`. Only these FKs exist:
- `maintenance_requests_assigned_vendor_id_fkey` -> vendors
- `maintenance_requests_merchant_id_fkey` -> merchants  
- `maintenance_requests_unit_id_fkey` -> units

This causes the PostgREST query to fail silently, returning an error that react-query catches, resulting in empty data (`[]`).

The same bug affects `getRequestById()` which uses the same invalid FK hint.

---

## Fix 1: Database Migration - Add Missing Foreign Key

Add a FK constraint from `maintenance_requests.tenant_user_id` to `profiles.user_id` so the PostgREST hint works correctly.

```sql
ALTER TABLE maintenance_requests 
ADD CONSTRAINT maintenance_requests_tenant_user_id_fkey 
FOREIGN KEY (tenant_user_id) REFERENCES profiles(user_id);
```

---

## Fix 2: Design Maximization - Maintenance Page

Redesign `Maintenance.tsx` to match the "Warm Luxury Futurism" aesthetic with a proper PageHeader, better layout structure, and consistent styling.

**Changes to `Maintenance.tsx`:**
- Add `PageHeader` with icon, title "Maintenance", and breadcrumbs
- Wrap content sections properly with spacing
- Add priority filter alongside status filter
- Add category filter
- Better button placement (gradient CTA in header area)

**Changes to `MaintenanceStats.tsx`:**
- Add urgentCount stat card
- Show SLA breach count
- Add trend indicators

**Changes to `MaintenanceRequestTable.tsx`:**
- Better mobile responsiveness
- Add row hover states with priority accent
- Improve empty state messaging

**Changes to `MaintenanceFilters.tsx`:**
- Add priority filter dropdown
- Add category filter dropdown
- Add date range filter

---

## Files to Modify

| File | Change |
|------|--------|
| **DB Migration** | Add FK `tenant_user_id` -> `profiles.user_id` |
| `Maintenance.tsx` | Add PageHeader, better layout, priority/category filters |
| `MaintenanceStats.tsx` | Add urgent + SLA breach stats |
| `MaintenanceFilters.tsx` | Add priority, category, date filters |
| `MaintenanceRequestTable.tsx` | Better mobile layout, priority accent rows |

---

## Technical Notes

- The FK migration is non-destructive: all existing `tenant_user_id` values either reference valid `profiles.user_id` or are NULL
- The `getRequestById()` method in `maintenanceService.ts` uses the same broken FK hint and will also be fixed automatically by the migration
- No code changes needed in `maintenanceService.ts` since the FK hint syntax is correct -- it just needs the actual constraint to exist
