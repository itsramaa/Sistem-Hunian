# Onboarding

## Overview
Proses onboarding untuk pengguna baru yang belum memiliki role atau perlu setup tambahan.

## File Location
- `src/pages/Onboarding.tsx` - Halaman onboarding

## Database Tables
- `profiles` - Profil pengguna
- `user_roles` - Role pengguna
- `merchants` - Data merchant
- `vendors` - Data vendor
- `tenants` - Data tenant

## Features
- ✅ Role selection untuk user tanpa role
- ✅ Profile completion
- ✅ Redirect ke dashboard setelah onboarding

## Implementation Status
| Feature | Status |
|---------|--------|
| Role Selection | ✅ Complete |
| Profile Setup | ✅ Complete |
| Redirect Logic | ✅ Complete |

## Flow
1. User login tanpa role
2. Redirect ke /onboarding
3. User pilih role
4. System create role record
5. Redirect ke dashboard sesuai role

## Related Components
- `useAuth` hook
- `ProtectedRoute` component
