# Tasks: feat-04-user-management

## Task List

### T1 — Audit database schema
- Cek tabel `users` di `migrations/` — apakah ada kolom `is_active`?
- Jika tidak ada, buat migration baru: `ALTER TABLE users ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT true`

### T2 — Backend: user_repo.go
- Tambah `FindAll(ctx, excludeRole string) ([]User, error)` — list user non-operator
- Tambah `Create(ctx, user *User) error`
- Tambah `Update(ctx, user *User) error`
- Tambah `Deactivate(ctx, id string) error` — set is_active = false

### T3 — Backend: user_service.go / user_handler.go
- Implementasi GET /users, POST /users, PATCH /users/:id, PATCH /users/:id/deactivate
- Middleware: hanya Operator yang bisa akses
- Validasi: role yang boleh dibuat hanya manager dan viewer

### T4 — Backend: Login guard
- Di auth service, cek `is_active = true` saat login
- Return 401 "Akun tidak aktif" jika is_active = false

### T5 — Frontend: feature users/
- Buat `src/features/users/` (api, components, hooks, pages, types)
- `usersService.ts`: list, create, update, deactivate
- `useUsers.ts`: TanStack Query hooks
- `UsersPage.tsx`: tabel + form tambah + form edit + toggle aktif

### T6 — Frontend: Router + Navigation
- Tambah route `/dashboard/users` di `router.tsx` (Operator only)
- Tambah menu "Kelola Pengguna" di `navigation-config.ts` untuk Operator

### T7 — Build + E2E test
- `npm run build` — 0 errors
- Go build — 0 errors

## Definition of Done
- [ ] Migration is_active kolom ada
- [ ] Endpoint GET/POST/PATCH /users berfungsi
- [ ] Login dengan akun nonaktif ditolak
- [ ] Halaman Kelola Pengguna tampil di Operator sidebar
- [ ] Operator bisa tambah Manager/Viewer baru dan bisa login
- [ ] Operator bisa nonaktifkan akun
