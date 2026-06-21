# Proposal: feat-04-user-management

## Summary
Saat ini user baru hanya bisa dibuat via SQL langsung ke database. Tidak ada UI untuk Operator mengelola akun anggota keluarga (Manager, Viewer). Ini adalah implied requirement dari RBAC system — ada yang harus bisa provisioning users.

## Problem
- Operator tidak bisa mandiri menambah/mengedit/menonaktifkan akun family member
- Setiap perubahan user butuh akses database langsung
- Tidak sesuai dengan prinsip sistem yang dapat dioperasikan tanpa bantuan teknis

## Solution
Tambahkan halaman "Kelola Pengguna" di dashboard Operator, dengan backend endpoints untuk CRUD users terbatas (hanya Manager dan Viewer — tidak bisa buat Operator lain).

## Requirements

### ADDED — Backend: List Users
- `GET /api/v1/users` SHALL mengembalikan semua user dengan role manager dan viewer
- Endpoint SHALL hanya accessible oleh Operator
- Response SHALL include: id, nama, email, role, is_active, created_at

### ADDED — Backend: Create User
- `POST /api/v1/users` SHALL membuat user baru dengan role manager atau viewer
- Operator SHALL NOT bisa membuat user dengan role operator atau admin
- Password awal di-set oleh Operator, user bisa ganti via profile
- Scenario: Operator POST dengan role=manager → user baru dibuat, bisa login

### ADDED — Backend: Update User
- `PATCH /api/v1/users/:id` SHALL memperbarui nama, email, role (manager↔viewer only)
- Operator SHALL NOT mengubah password user lain (hanya user sendiri via change-password)

### ADDED — Backend: Deactivate User
- `PATCH /api/v1/users/:id/deactivate` SHALL menonaktifkan akun (is_active = false)
- User yang dinonaktifkan SHALL tidak bisa login
- Scenario: Operator deactivate viewer → viewer tidak bisa login, dapat error

### ADDED — Frontend: Halaman Kelola Pengguna
- Route: `/dashboard/users` (Operator only)
- Tabel: nama, email, role, status aktif, aksi (edit, nonaktifkan)
- Form tambah user: nama, email, password, role (manager/viewer)
- Form edit user: nama, email, role
- Toggle aktif/nonaktif

### ADDED — Navigation
- Menu "Kelola Pengguna" di sidebar Operator (group Administrasi)

## Non-Goals
- Operator tidak bisa hapus permanen user (hanya nonaktifkan)
- Operator tidak bisa membuat Operator lain
- Tidak ada invite-by-email flow

## Dependencies
- Tabel `users` sudah ada di database dengan kolom `is_active` (atau perlu ditambah)
- JWT middleware sudah handle role-based access
- Backend Go di `F:\Coding\golang\Sistem-Hunian-Go`
