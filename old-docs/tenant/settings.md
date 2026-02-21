# Tenant Settings

## Overview
Pengaturan akun dan preferensi tenant.

## File Location
- `src/pages/tenant/Settings.tsx` - Halaman settings
- `src/pages/tenant/Profile.tsx` - Profile
- `src/components/tenant/TenantProfileForm.tsx` - Profile form
- `src/components/tenant/MoveOutDashboard.tsx` - Move-out
- `src/components/tenant/MoveOutNoticeDialog.tsx` - Notice dialog

## Database Tables
- `tenants` - Data tenant
- `profiles` - Profile
- `move_out_notices` - Move-out notices

## Features
- ✅ Edit profile
- ✅ Change password
- ✅ Notification preferences
- ✅ Auto-pay settings
- ✅ Move-out notice
- ✅ Request transfer

## Implementation Status
| Feature | Status |
|---------|--------|
| Profile | ✅ Complete |
| Password | ✅ Complete |
| Notifications | ✅ Complete |
| Auto-pay | ✅ Complete |
| Move-out | ✅ Complete |
| Transfer | ⚠️ UI Needed |

## Related Components
- `TenantProfileForm`
- `MoveOutDashboard`
- `MoveOutNoticeDialog`
