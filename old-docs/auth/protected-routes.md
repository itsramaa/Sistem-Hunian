# Protected Routes

## Overview
Sistem proteksi route berdasarkan autentikasi dan role pengguna.

## File Location
- `src/components/auth/ProtectedRoute.tsx` - Komponen proteksi route
- `src/hooks/useAuth.tsx` - Hook autentikasi

## Database Tables
- `user_roles` - Role pengguna

## Features
- ✅ Route protection berdasarkan autentikasi
- ✅ Role-based access control
- ✅ Redirect ke login jika tidak terautentikasi
- ✅ Redirect ke unauthorized jika role tidak sesuai
- ✅ Loading state saat cek autentikasi

## Implementation Status
| Feature | Status |
|---------|--------|
| Auth Check | ✅ Complete |
| Role Check | ✅ Complete |
| Redirect Logic | ✅ Complete |
| Loading State | ✅ Complete |

## Usage
```tsx
<Route
  path="/merchant/*"
  element={
    <ProtectedRoute allowedRoles={["merchant"]}>
      <MerchantLayout />
    </ProtectedRoute>
  }
/>
```

## Route Access Matrix
| Route | Tenant | Merchant | Vendor | Admin |
|-------|--------|----------|--------|-------|
| /tenant/* | ✅ | ❌ | ❌ | ❌ |
| /merchant/* | ❌ | ✅ | ❌ | ❌ |
| /vendor/* | ❌ | ❌ | ✅ | ❌ |
| /admin/* | ❌ | ❌ | ❌ | ✅ |

## Related Components
- `useAuth` hook
- Layout components per role
