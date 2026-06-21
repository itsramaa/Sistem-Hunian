# Proposal: feat-05-profile-password

## Summary
Halaman Profile sudah ada di frontend (`src/features/profile/pages/Profile.tsx`) tapi belum fungsional untuk ganti password. Ini basic user management yang setiap user butuhkan, terutama setelah Operator set password awal di feat-04.

## Problem
- User tidak bisa ganti password sendiri tanpa akses database
- Profile page ada tapi form ganti password belum terhubung ke API
- Setelah feat-04, user baru di-set password oleh Operator — butuh cara ganti ke password pribadi

## Solution
Tambahkan backend endpoint `PATCH /auth/change-password` dan hubungkan ke form di Profile page.

## Requirements

### ADDED — Backend: Change Password Endpoint
- `PATCH /api/v1/auth/change-password` SHALL tersedia untuk semua role yang sudah login
- Request body SHALL berisi: `old_password`, `new_password`
- Backend SHALL validasi `old_password` cocok dengan hash di database
- Backend SHALL hash `new_password` dengan bcrypt sebelum simpan
- Scenario: User kirim old+new password → jika old benar, password diupdate

### ADDED — Frontend: Profile Page Form
- Form ganti password SHALL memiliki 3 field: password lama, password baru, konfirmasi password baru
- Validasi Zod: old_password wajib, new_password min 8 karakter, confirm harus sama dengan new
- Submit SHALL memanggil `PATCH /api/v1/auth/change-password`
- Sukses → toast "Password berhasil diubah"
- Error (old password salah) → pesan error inline
- Scenario: User isi form dengan benar → password berubah, bisa login dengan password baru

## Non-Goals
- Tidak ada forgot password / reset via email
- Tidak mengubah data profil lain (nama, email) — itu feat-04 scope
- Tidak ada password strength meter (terlalu kompleks untuk scope ini)

## Dependencies
- Backend Go: `internal/handler/auth_handler.go`, `internal/service/auth_service.go`
- Frontend: `src/features/profile/pages/Profile.tsx` sudah ada
- feat-04-user-management sebaiknya selesai lebih dulu (user baru butuh ganti password)
