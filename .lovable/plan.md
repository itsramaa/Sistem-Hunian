

# Caretaker/Staff Role Management + Vendor Management & Performance Tracking

## Overview

Two features:
1. **Staff Role Management** -- Sub-user system for merchants to invite caretakers, property managers, and accountants with granular permissions scoped to specific properties
2. **Vendor Performance Tracking** -- Enhanced analytics dashboard for merchant-side vendor evaluation (response time, cost comparison, preferred marking) using existing `vendor_jobs`, `maintenance_reviews`, and `property_vendor_services` data

---

## Feature 6: Caretaker / Staff Role Management

### 6A: Database -- New Tables

**`merchant_staff`** -- Staff members invited by a merchant:
```
id                uuid PK
merchant_id       uuid FK merchants NOT NULL
user_id           uuid NOT NULL (references auth.users)
staff_role        text NOT NULL (caretaker, property_manager, accountant)
display_name      text NOT NULL
email             text NOT NULL
phone             text
property_ids      jsonb DEFAULT '[]' (list of property UUIDs this staff has access to -- empty = all)
is_active         boolean DEFAULT true
invited_at        timestamptz DEFAULT now()
accepted_at       timestamptz
created_at        timestamptz DEFAULT now()
updated_at        timestamptz DEFAULT now()
UNIQUE(merchant_id, user_id)
```

**`staff_permissions`** -- Granular permission overrides per staff member:
```
id                uuid PK
staff_id          uuid FK merchant_staff NOT NULL
permission_key    text NOT NULL
is_granted        boolean DEFAULT true
created_at        timestamptz DEFAULT now()
UNIQUE(staff_id, permission_key)
```

RLS: Merchant can CRUD their own staff. Staff users can read their own record.

### 6B: Default Permission Matrix

Predefined permission keys with defaults per role:

| Permission Key | Caretaker | Property Manager | Accountant |
|---|---|---|---|
| `units.view` | yes | yes | no |
| `units.edit_status` | yes | yes | no |
| `maintenance.view` | yes | yes | no |
| `maintenance.accept` | yes | yes | no |
| `maintenance.assign_vendor` | no | yes | no |
| `maintenance.log_activity` | yes | yes | no |
| `expenses.view` | no | yes | yes |
| `expenses.create` | no | yes | no |
| `expenses.approve` | no | yes (below Rp 1M) | no |
| `invoices.view` | no | yes | yes |
| `invoices.create` | no | yes | no |
| `collections.send_letter` | no | yes | no |
| `financial_reports.view` | no | yes | yes |
| `tenants.view` | yes | yes | no |
| `contracts.view` | no | yes | yes |
| `settings.view` | no | no | no |

### 6C: Staff Service

Create `src/features/staff/services/staffService.ts`:
- `fetchStaff(merchantId)` -- list all staff members
- `inviteStaff(data)` -- create merchant_staff record + insert user_roles row with 'merchant' role for the invited user (if not exists) + set default permissions based on staff_role
- `updateStaff(id, data)` -- update role, properties, active status
- `removeStaff(id)` -- soft deactivate (is_active = false)
- `fetchPermissions(staffId)` -- get permission overrides
- `updatePermissions(staffId, permissions[])` -- upsert permission grants
- `checkPermission(userId, merchantId, permissionKey)` -- check if user has a specific permission (used in UI guards)

### 6D: Staff Management Page

Create `src/pages/merchant/StaffManagement.tsx`:
- List of all staff with role badge, assigned properties, active status
- "Undang Staff" button opens dialog:
  - Email input (existing user or new invite)
  - Staff role selector (Caretaker / Property Manager / Accountant)
  - Property assignment (multi-select from merchant's properties, or "Semua Properti")
- Edit staff: change role, reassign properties, toggle active
- Permission editor: expandable section per staff showing toggles for each permission key (pre-filled from role defaults, customizable)

### 6E: Staff Permission Hook

Create `src/features/staff/hooks/useStaffPermission.ts`:
- `useStaffPermission(permissionKey)` -- returns `{ hasPermission, isLoading }` 
- Checks: if user is the merchant owner, always true. If user is staff, checks `merchant_staff` + `staff_permissions`
- Used as UI guard to show/hide buttons and sections

Create `src/features/staff/hooks/useStaffMembers.ts`:
- TanStack Query hooks for staff CRUD

### 6F: Permission Constants

Create `src/features/staff/constants/permissions.ts`:
- `PERMISSION_KEYS` -- all permission key constants
- `DEFAULT_PERMISSIONS` -- map of staff_role to default permission set
- `PERMISSION_LABELS` -- Indonesian labels for each permission for the UI

### 6G: Navigation & Routes

- Add `/merchant/staff` route
- Add "Manajemen Staff" nav item in merchant navigation under "Pengaturan" group with `Users` icon

---

## Feature 7: Vendor Management & Performance Tracking

### 7A: Vendor Performance Service

Create `src/features/vendor-management/services/vendorPerformanceService.ts`:

Uses existing tables -- no new database tables needed:
- `vendor_jobs` has `created_at`, `started_at`, `completed_at`, `agreed_price` -- enough to calculate response time and cost
- `maintenance_reviews` has `rating`, `comment` -- for quality metrics
- `property_vendor_services` has `is_active`, `monthly_cost` -- for assignment tracking
- `vendors` has `rating`, `total_jobs` -- for overview

Functions:
- `fetchVendorPerformance(merchantId)` -- aggregate per vendor: avg response time (started_at - created_at), avg completion time, avg rating, total cost, job count, cost per job
- `fetchVendorComparison(merchantId, vendorIds[])` -- side-by-side comparison data
- `togglePreferredVendor(merchantId, vendorId, isPreferred)` -- update `property_vendor_services.is_active` or add a `is_preferred` flag
- `fetchVendorHistory(vendorId, merchantId)` -- job timeline with costs and ratings

### 7B: Database Enhancement

Add column to `property_vendor_services`:
```sql
ALTER TABLE property_vendor_services ADD COLUMN IF NOT EXISTS is_preferred boolean DEFAULT false;
```

This allows merchants to mark specific vendors as "preferred" for quick assignment. No other new tables needed.

### 7C: Vendor Performance Dashboard

Create `src/pages/merchant/VendorPerformance.tsx`:
- **Stats Strip**: Total vendors, avg rating, avg response time, total spend this month
- **Tab 1: Ringkasan** -- Table of all vendors the merchant has worked with, showing: name, specialization, avg response time, avg rating (stars), total jobs, total cost, preferred badge. Sortable columns
- **Tab 2: Perbandingan** -- Select 2-3 vendors to compare side-by-side: bar charts for response time, cost per job, rating. Uses recharts
- **Tab 3: Riwayat** -- Select a vendor to see full job history timeline with cost, rating per job, and trend line

### 7D: Preferred Vendor Quick Actions

Enhance existing maintenance vendor assignment:
- In `UpdateMaintenanceDialog.tsx`, show preferred vendors at the top of the vendor dropdown with a star icon
- Add "Mark as Preferred" toggle in vendor performance table

### 7E: Hooks

Create `src/features/vendor-management/hooks/useVendorPerformance.ts`:
- `useVendorPerformance(merchantId)` -- query aggregated performance data
- `useVendorComparison(merchantId, vendorIds)` -- query comparison data
- `useVendorHistory(vendorId, merchantId)` -- query job history
- `useTogglePreferred()` -- mutation

### 7F: Navigation & Routes

- Add `/merchant/vendor-performance` route
- Add "Performa Vendor" nav item in merchant navigation under "Operasional" group with `TrendingUp` icon

---

## Files Summary

| Action | File | Description |
|--------|------|-------------|
| CREATE | DB migration | `merchant_staff`, `staff_permissions` tables + `is_preferred` column on `property_vendor_services` |
| CREATE | `src/features/staff/services/staffService.ts` | Staff CRUD + permission checks |
| CREATE | `src/features/staff/hooks/useStaffMembers.ts` | TanStack Query hooks |
| CREATE | `src/features/staff/hooks/useStaffPermission.ts` | Permission guard hook |
| CREATE | `src/features/staff/constants/permissions.ts` | Permission keys + defaults |
| CREATE | `src/pages/merchant/StaffManagement.tsx` | Staff management page |
| CREATE | `src/features/vendor-management/services/vendorPerformanceService.ts` | Vendor analytics from existing data |
| CREATE | `src/features/vendor-management/hooks/useVendorPerformance.ts` | TanStack Query hooks |
| CREATE | `src/pages/merchant/VendorPerformance.tsx` | Vendor performance dashboard |
| MODIFY | `src/features/maintenance/components/UpdateMaintenanceDialog.tsx` | Preferred vendor sorting |
| MODIFY | `src/shared/components/layouts/navigation-config.ts` | Add 2 nav items |
| MODIFY | `src/App.tsx` | Add 2 routes |
| MODIFY | `old-docs/PMS_Audit_Report_FULL.md` | Mark Feature 6 + 7 status |

---

## Technical Notes

- Staff system does NOT create new `app_role` values -- staff members use the existing `merchant` role but are scoped via `merchant_staff` records. This avoids changing the auth system
- Permission checks are lightweight: a single query to `merchant_staff` + `staff_permissions` cached via TanStack Query
- Vendor performance analytics are computed client-side from existing `vendor_jobs` and `maintenance_reviews` data -- no materialized views needed at this scale
- Response time is calculated as `started_at - created_at` on `vendor_jobs`; completion time as `completed_at - started_at`
- The `is_preferred` flag on `property_vendor_services` is per-property per-vendor, allowing different preferred vendors per property
- Staff property scoping uses JSONB array of property IDs for flexible assignment without a junction table

