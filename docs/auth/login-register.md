# Login & Register

## Overview
Sistem autentikasi untuk login dan registrasi pengguna dengan dukungan multi-role (Tenant, Merchant, Vendor).

## File Location
- `src/pages/Auth.tsx` - Halaman autentikasi utama
- `src/components/auth/AuthForm.tsx` - Form login/register

## Database Tables
- `auth.users` - Tabel user Supabase Auth
- `profiles` - Profil pengguna
- `user_roles` - Role pengguna

## API/Edge Functions
- `supabase/functions/auth-webhook/index.ts` - Webhook untuk setup user baru

## Features
- ✅ Login dengan email/password
- ✅ Register dengan role selection (Tenant/Merchant/Vendor)
- ✅ Email verification (auto-confirm enabled)
- ✅ Remember me functionality
- ✅ Password visibility toggle
- ✅ Form validation dengan Zod
- ✅ Error handling dengan toast notifications
- ✅ Redirect berdasarkan role setelah login

## Implementation Status
| Feature | Status |
|---------|--------|
| Login | ✅ Complete |
| Register | ✅ Complete |
| Role Selection | ✅ Complete |
| Auto-confirm Email | ✅ Complete |
| Webhook Integration | ⚠️ Needs Testing |

## Related Components
- `ProtectedRoute` - Route protection
- `useAuth` - Authentication hook

## Notes
- Webhook `auth-webhook` dipanggil setelah registrasi untuk membuat profile, user_roles, dan record spesifik role
- Auto-confirm email diaktifkan untuk development
