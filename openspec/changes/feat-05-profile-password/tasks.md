# Tasks: feat-05-profile-password

## Task List

### T1 — Backend: change-password endpoint
- Tambah handler `ChangePassword` di `auth_handler.go`
- Tambah service method `ChangePassword(ctx, userID, oldPassword, newPassword string) error`
- Validasi: ambil user by ID → bcrypt.CompareHashAndPassword(oldPassword) → hash new → update
- Return 400 jika old password salah, 200 jika sukses
- Register route: `PATCH /api/v1/auth/change-password` (requires JWT)

### T2 — Frontend: Audit Profile page
- Baca `src/features/profile/pages/Profile.tsx`
- Identifikasi apakah form sudah ada tapi belum terhubung, atau perlu dibuat dari scratch

### T3 — Frontend: Change password form
- Zod schema: `{ old_password: string, new_password: string.min(8), confirm_password }`
- Refine: `new_password === confirm_password`
- React Hook Form + Zod resolver
- Submit: `PATCH /api/v1/auth/change-password` via apiClient
- Success toast, error inline message

### T4 — Build check
- Go build — 0 errors
- `npm run build` — 0 errors

## Definition of Done
- [ ] Endpoint PATCH /auth/change-password berfungsi
- [ ] Old password yang salah ditolak dengan error message
- [ ] Form di Profile page terhubung ke API
- [ ] Setelah ganti password, login dengan password baru berhasil
- [ ] Login dengan password lama ditolak
