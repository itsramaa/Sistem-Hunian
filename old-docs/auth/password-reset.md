# Password Reset

## Overview
Sistem reset password melalui email untuk pengguna yang lupa password.

## File Location
- `src/pages/ResetPassword.tsx` - Halaman request reset password
- `src/pages/UpdatePassword.tsx` - Halaman update password baru

## Features
- ✅ Request reset password via email
- ✅ Email dengan link reset
- ✅ Update password baru
- ✅ Validasi password baru
- ✅ Redirect ke login setelah update

## Implementation Status
| Feature | Status |
|---------|--------|
| Request Reset | ✅ Complete |
| Email Link | ✅ Complete |
| Update Password | ✅ Complete |
| Validation | ✅ Complete |

## Flow
1. User klik "Lupa Password" di halaman login
2. User masukkan email
3. System kirim email dengan reset link
4. User klik link dan diarahkan ke halaman update password
5. User masukkan password baru
6. User diarahkan ke halaman login

## Related Components
- `AuthForm` - Link ke reset password
- Supabase Auth - Email handling
