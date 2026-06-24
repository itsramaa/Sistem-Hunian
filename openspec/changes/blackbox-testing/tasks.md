# Tasks: Blackbox Testing Manual — SiHuni Frontend

**Change**: blackbox-testing  
**Tanggal**: 2026-06-23  
**Status**: Pending Approval

---

## Setup

- [ ] **S-001** Backend running (`make dev` di backend)
- [ ] **S-002** Frontend running (`pnpm dev`)
- [ ] **S-003** Seed data applied (`make migrate-up`)
- [ ] **S-004** Buka Chrome DevTools → tab Console terbuka
- [ ] **S-005** Buka Network tab untuk monitor API calls

---

## Domain 1: Authentication & Public Pages

### Login

| ID | Test Case | Steps | Expected | Status |
|----|-----------|-------|----------|--------|
| T-001 | Login form render | Buka `/login` | Form email + password tampil, tidak ada console error | |
| T-002 | Login valid (operator) | Masukkan `operator@sihuni.dev` + `sihuni123`, klik Login | Redirect ke `/dashboard`, sidebar tampil semua menu | |
| T-003 | Login valid (manager) | Masukkan `manager@sihuni.dev` + `sihuni123`, klik Login | Redirect ke `/dashboard`, sidebar tidak ada menu Properties/Rooms/Tenants/Payments/Confirmations | |
| T-004 | Login valid (viewer) | Masukkan `viewer@sihuni.dev` + `sihuni123`, klik Login | Redirect ke `/dashboard`, sidebar hanya Dashboard | |
| T-005 | Login email kosong | Biarkan email kosong, klik Login | Pesan error validasi "email wajib diisi" | |
| T-006 | Login password kosong | Masukkan email, biarkan password kosong, klik Login | Pesan error validasi "password wajib diisi" | |
| T-007 | Login email format salah | Masukkan `bukanemail`, klik Login | Pesan error validasi format email | |
| T-008 | Login password salah | Masukkan email valid + password salah | Pesan error "Invalid credential" atau serupa, tidak redirect | |
| T-009 | Login email tidak terdaftar | Masukkan `notexist@test.com` + `sihuni123` | Pesan error credential invalid | |
| T-010 | Login — loading state | Klik Login, perhatikan tombol | Tombol disabled / spinner tampil selama request | |

### Logout & Token Expiry

| ID | Test Case | Steps | Expected | Status |
|----|-----------|-------|----------|--------|
| T-011 | Logout | Klik menu logout di sidebar/profile | Token hilang, redirect ke `/login` | |
| T-012 | Akses /dashboard tanpa login | Buka `/dashboard` langsung di browser (incognito) | Redirect ke `/login` | |
| T-013 | Token expired | Login, tunggu token expired (atau manipulate localStorage) | Auto-redirect ke `/login` | |

### Reset Password

| ID | Test Case | Steps | Expected | Status |
|----|-----------|-------|----------|--------|
| T-014 | Halaman reset password render | Buka `/reset-password` | Form email tampil | |
| T-015 | Reset password valid | Masukkan email terdaftar | Pesan sukses "Email reset terkirim" atau serupa | |
| T-016 | Reset password email kosong | Biarkan kosong, submit | Pesan error validasi | |
| T-017 | Reset password email tidak terdaftar | Masukkan email yang tidak ada | Pesan sukses (tidak bocor info bahwa email tidak ada) atau error | |

### Update Password

| ID | Test Case | Steps | Expected | Status |
|----|-----------|-------|----------|--------|
| T-018 | Halaman update password render | Buka `/update-password` | Form new password tampil | |
| T-019 | Update password valid (>= 6 char) | Masukkan password baru 8+ karakter | Redirect ke login atau pesan sukses | |
| T-020 | Update password pendek (< 6 char) | Masukkan `12345` | Pesan error validasi minimum length | |

---

## Domain 2: RBAC & Navigation

### Sidebar & Menu

| ID | Test Case | Steps | Expected | Status |
|----|-----------|-------|----------|--------|
| T-030 | Sidebar operator | Login sebagai operator | Menu: Dashboard, Properties, Rooms, Tenants, Payments, Confirmations, Maintenance, Audit, Notifications | |
| T-031 | Sidebar manager | Login sebagai manager | Menu: Dashboard, Maintenance, Audit, Notifications. TIDAK ada Properties, Rooms, Tenants, Payments, Confirmations | |
| T-032 | Sidebar viewer | Login sebagai viewer | Menu: Dashboard, Notifications. TIDAK ada menu CRUD lainnya | |
| T-033 | Active menu highlight | Login, klik "Rooms" | Menu "Rooms" di-highlight di sidebar | |

### Route Protection

| ID | Test Case | Steps | Expected | Status |
|----|-----------|-------|----------|--------|
| T-034 | Manager akses /dashboard/properties | Login manager, akses `/dashboard/properties` via URL | Redirect ke `/unauthorized` atau `/dashboard` | |
| T-035 | Viewer akses /dashboard/rooms | Login viewer, akses `/dashboard/rooms` via URL | Redirect ke `/unauthorized` atau `/dashboard` | |
| T-036 | Operator akses semua halaman | Login operator, akses semua route via URL | Bisa akses semua halaman | |
| T-037 | Manager akses /dashboard/maintenance | Login manager, akses `/dashboard/maintenance` | Halaman tampil (role diizinkan) | |
| T-038 | Manager akses /dashboard/audit | Login manager, akses `/dashboard/audit` | Halaman tampil (role diizinkan) | |
| T-039 | Viewer akses /dashboard/audit | Login viewer, akses `/dashboard/audit` | Redirect ke `/unauthorized` | |
| T-040 | 404 page | Akses `/halaman-tidak-ada` | Halaman 404 tampil dengan pesan "not found" | |

---

## Domain 3: Dashboard

| ID | Test Case | Steps | Expected | Status |
|----|-----------|-------|----------|--------|
| T-050 | Dashboard render | Login, buka `/dashboard` | Semua card statistik tampil: Total Properti, Kamar Tersedia, Kamar Terisi, DP Confirmation, Penagihan Bulan Ini, Biaya Maintenance | |
| T-051 | Dashboard data akurat | Login operator, cek angka | Angka sesuai dengan data di database (sinkron dengan seed) | |
| T-052 | Dashboard loading state | Refresh halaman | Skeleton/spinner tampil sebelum data muncul | |
| T-053 | Dashboard — tidak ada console error | Buka DevTools Console | Tidak ada error/warning merah | |
| T-054 | Dashboard (manager) | Login manager, buka `/dashboard` | Dashboard tampil normal | |
| T-055 | Dashboard (viewer) | Login viewer, buka `/dashboard` | Dashboard tampil normal | |

---

## Domain 4: Property Management

### List

| ID | Test Case | Steps | Expected | Status |
|----|-----------|-------|----------|--------|
| T-060 | Property list render | Login operator, buka `/dashboard/properties` | Tabel/list properti tampil dengan data seed (Kos Maju Jaya, Kos Barokah Indah) | |
| T-061 | Property list pagination | Jika > 20 properti, klik page 2 | Data berubah, pagination controls tampil | |
| T-062 | Property list — loading state | Refresh halaman | Loading skeleton tampil | |
| T-063 | Property empty state | Hapus semua properti (atau filter yang tidak ada) | Empty state message tampil | |

### Create

| ID | Test Case | Steps | Expected | Status |
|----|-----------|-------|----------|--------|
| T-064 | Form create properti render | Klik "Tambah Properti" / "Create" | Modal/form tampil dengan field nama, alamat, deskripsi | |
| T-065 | Create valid | Isi nama + alamat, submit | Properti baru muncul di list, toast sukses | |
| T-066 | Create — nama kosong | Biarkan nama kosong, submit | Pesan error "nama wajib diisi" | |
| T-067 | Create — alamat kosong | Biarkan alamat kosong, submit | Pesan error "alamat wajib diisi" | |
| T-068 | Create — deskripsi optional | Isi nama + alamat saja, submit | Berhasil tanpa deskripsi | |

### Edit

| ID | Test Case | Steps | Expected | Status |
|----|-----------|-------|----------|--------|
| T-069 | Form edit pre-filled | Klik edit pada properti | Form terisi dengan data existing | |
| T-070 | Update valid | Ubah nama, submit | Nama berubah di list, toast sukses | |
| T-071 | Update — nama kosong | Hapus nama, submit | Pesan error | |

### Delete

| ID | Test Case | Steps | Expected | Status |
|----|-----------|-------|----------|--------|
| T-072 | Delete properti kosong | Klik hapus pada properti tanpa kamar | Konfirmasi dialog muncul → hapus → hilang dari list | |
| T-073 | Delete properti dengan kamar | Klik hapus pada properti yang punya kamar | Error message "properti masih memiliki kamar" | |
| T-074 | Cancel delete | Buka dialog hapus, klik batal | Properti masih ada di list | |

---

## Domain 5: Room Management

### List

| ID | Test Case | Steps | Expected | Status |
|----|-----------|-------|----------|--------|
| T-080 | Room list render | Login operator, buka `/dashboard/rooms` | Daftar kamar tampil, status badge berwarna | |
| T-081 | Filter by property | Pilih property dari dropdown filter | Hanya kamar properti tersebut yang tampil | |
| T-082 | Filter by status | Pilih "available" | Hanya kamar available yang tampil | |
| T-083 | Search by nomor kamar | Ketik "A01" di search | Kamar A01 muncul | |
| T-084 | Status badge colors | Cek status badge | available=green, dp_confirmation=yellow, occupied=red (atau sesuai desain) | |

### Create

| ID | Test Case | Steps | Expected | Status |
|----|-----------|-------|----------|--------|
| T-085 | Create room valid | Pilih properti, isi nomor A99, tipe, harga | Kamar baru muncul di list | |
| T-086 | Create — nomor kamar duplikat (properti sama) | Buat kamar dengan nomor A01 di properti yang sudah punya A01 | Error "nomor kamar sudah ada" | |
| T-087 | Create — harga sewa 0 | Isi harga_sewa = 0 | Error validasi minimum | |
| T-088 | Create — harga sewa negatif | Isi harga_sewa = -100000 | Error validasi | |

### Edit

| ID | Test Case | Steps | Expected | Status |
|----|-----------|-------|----------|--------|
| T-089 | Edit room valid | Ubah harga kamar | Harga berubah di list | |
| T-090 | Update status room | Ubah status room | Status berubah, room_status_log tercatat | |

### Delete

| ID | Test Case | Steps | Expected | Status |
|----|-----------|-------|----------|--------|
| T-091 | Delete room `available` | Hapus kamar available | Berhasil, hilang dari list | |
| T-092 | Delete room `occupied` | Hapus kamar occupied | Error "kamar tidak dapat dihapus" | |
| T-093 | Delete room `dp_confirmation` | Hapus kamar dp_confirmation | Error "kamar tidak dapat dihapus" | |

### Detail

| ID | Test Case | Steps | Expected | Status |
|----|-----------|-------|----------|--------|
| T-094 | Room detail render | Klik kamar untuk lihat detail | Semua info tampil: nomor, tipe, harga, status, property, tenant aktif | |
| T-095 | Room detail — payment history | Scroll ke section payment history | List pembayaran tampil | |
| T-096 | Room detail — maintenance history | Scroll ke section maintenance history | List maintenance tampil | |

---

## Domain 6: Tenant Management

### List

| ID | Test Case | Steps | Expected | Status |
|----|-----------|-------|----------|--------|
| T-100 | Tenant list render | Login operator, buka `/dashboard/tenants` | Daftar penghuni tampil | |
| T-101 | Filter status active | Filter "active" | Hanya tenant aktif | |
| T-102 | Filter status checked_out | Filter "checked_out" | Hanya tenant yang sudah checkout | |

### Create

| ID | Test Case | Steps | Expected | Status |
|----|-----------|-------|----------|--------|
| T-103 | Create tenant valid | Pilih room available, isi nama + identitas + telepon + tanggal masuk + durasi | Tenant baru, room status → occupied | |
| T-104 | Create — room tidak available | Pilih room occupied | Error "room harus available" | |
| T-105 | Create — nama kosong | Biarkan nama kosong, submit | Error validasi | |
| T-106 | Create — nomor identitas kosong | Biarkan kosong, submit | Error validasi | |
| T-107 | Create — durasi 0 | Isi durasi_sewa = 0 | Error validasi minimum 1 | |

### Checkout

| ID | Test Case | Steps | Expected | Status |
|----|-----------|-------|----------|--------|
| T-108 | Checkout tenant tanpa tunggakan | Klik checkout pada tenant yang tidak punya tunggakan | Dialog konfirmasi → sukses → room → available | |
| T-109 | Checkout tenant dengan tunggakan | Klik checkout pada tenant yang punya tunggakan unpaid | Error "masih memiliki tunggakan" | |
| T-110 | Cancel checkout | Buka dialog checkout, batal | Tenant masih aktif | |

### Detail

| ID | Test Case | Steps | Expected | Status |
|----|-----------|-------|----------|--------|
| T-111 | Tenant detail render | Klik tenant | Semua info tampil: nama, identitas, telepon, room, tanggal masuk, durasi, status | |
| T-112 | Tenant detail — payment history | Cek section payment | List pembayaran tampil | |

---

## Domain 7: Payment Management

### List

| ID | Test Case | Steps | Expected | Status |
|----|-----------|-------|----------|--------|
| T-120 | Payment list render | Login operator, buka `/dashboard/payments` | Daftar pembayaran tampil | |
| T-121 | Filter by room | Filter berdasarkan room | Hanya pembayaran room tersebut | |
| T-122 | Filter by tenant | Filter berdasarkan tenant | Hanya pembayaran tenant tersebut | |
| T-123 | Status badge | Cek status badge | unpaid/paid/overdue sesuai warna | |

### Create

| ID | Test Case | Steps | Expected | Status |
|----|-----------|-------|----------|--------|
| T-124 | Create payment valid | Pilih room, tenant, periode, nominal, submit | Payment baru muncul | |
| T-125 | Create — nominal 0 | Isi nominal = 0 | Error validasi | |

### Update

| ID | Test Case | Steps | Expected | Status |
|----|-----------|-------|----------|--------|
| T-126 | Mark paid | Ubah status → paid, upload bukti | Status berubah, tanggal bayar terisi | |
| T-127 | Mark cancelled | Ubah status → cancelled | Status berubah | |
| T-128 | Payment detail | Klik payment | Semua info tampil: room, tenant, periode, nominal, status, bukti | |

### Business Rule

| ID | Test Case | Steps | Expected | Status |
|----|-----------|-------|----------|--------|
| T-129 | Payment tidak bisa dihapus | Cari tombol delete | Tidak ada tombol delete / tombol disabled | |

---

## Domain 8: Confirmation (DP)

### List

| ID | Test Case | Steps | Expected | Status |
|----|-----------|-------|----------|--------|
| T-130 | Confirmation list render | Login operator, buka `/dashboard/confirmations` | Daftar konfirmasi DP tampil | |
| T-131 | Status badge | Cek status | pending/confirmed/expired dengan warna berbeda | |

### Create

| ID | Test Case | Steps | Expected | Status |
|----|-----------|-------|----------|--------|
| T-132 | Create DP valid | Pilih room available, isi nama + DP minimal 10%, submit | DP baru, room → dp_confirmation | |
| T-133 | Create DP — room occupied | Pilih room occupied | Error "room harus available" | |
| T-134 | Create DP — sudah ada DP pending | Pilih room yang sudah ada DP pending | Error "sudah ada DP pending" | |
| T-135 | Create DP — nominal < 10% harga sewa | Isi DP = 9% dari harga | Error "minimal 10% harga sewa" | |
| T-136 | Create DP — nominal = 10% | Isi DP tepat 10% | Berhasil | |
| T-137 | Create DP — nominal = 100% | Isi DP = harga sewa | Berhasil | |

### Confirm

| ID | Test Case | Steps | Expected | Status |
|----|-----------|-------|----------|--------|
| T-138 | Confirm DP pending | Klik confirm pada DP pending | Dialog konfirmasi → sukses → tenant terbuat, room → occupied | |
| T-139 | Confirm DP expired | Klik confirm pada DP expired | Error "sudah expired" | |
| T-140 | Cancel confirm | Buka dialog, batal | DP masih pending | |

---

## Domain 9: Maintenance

### List

| ID | Test Case | Steps | Expected | Status |
|----|-----------|-------|----------|--------|
| T-150 | Maintenance list render | Login operator, buka `/dashboard/maintenance` | Daftar laporan maintenance tampil | |
| T-151 | Filter by status | Filter "reported" | Hanya laporan reported | |
| T-152 | Status badge | Cek badge | reported/in_progress/completed warna berbeda | |

### Create

| ID | Test Case | Steps | Expected | Status |
|----|-----------|-------|----------|--------|
| T-153 | Create laporan valid | Pilih room, isi deskripsi, submit | Laporan baru, status = reported | |
| T-154 | Create — deskripsi kosong | Biarkan kosong, submit | Error validasi | |
| T-155 | Manager create maintenance | Login manager, buka maintenance, create | Berhasil (role diizinkan) | |

### Update

| ID | Test Case | Steps | Expected | Status |
|----|-----------|-------|----------|--------|
| T-156 | Update reported → in_progress | Ubah status, submit | Status berubah | |
| T-157 | Update in_progress → completed | Ubah status, submit | Status berubah | |
| T-158 | Update dengan biaya + tindakan | Isi biaya dan tindakan penanganan | Data tersimpan, tampil di detail | |

### Detail

| ID | Test Case | Steps | Expected | Status |
|----|-----------|-------|----------|--------|
| T-159 | Maintenance detail render | Klik maintenance | Semua info tampil: room, tanggal, deskripsi, status, tindakan, biaya | |
| T-160 | Maintenance tidak bisa dihapus | Cari tombol delete | Tidak ada / disabled | |

---

## Domain 10: Notifications

### Dropdown

| ID | Test Case | Steps | Expected | Status |
|----|-----------|-------|----------|--------|
| T-170 | Notification dropdown render | Login, klik icon notifikasi di header | Dropdown muncul dengan list notifikasi | |
| T-171 | Unread count badge | Ada notifikasi unread | Badge number tampil di icon | |
| T-172 | Mark as read | Klik notifikasi unread | Notifikasi ditandai read, badge count berkurang | |

### History Page

| ID | Test Case | Steps | Expected | Status |
|----|-----------|-------|----------|--------|
| T-173 | Notification history render | Buka `/dashboard/notifications` | List notifikasi tampil | |
| T-174 | Empty state | Tidak ada notifikasi | Empty state message tampil | |

---

## Domain 11: Profile & Settings

### Profile

| ID | Test Case | Steps | Expected | Status |
|----|-----------|-------|----------|--------|
| T-180 | Profile page render | Buka `/dashboard/profile` | Data user tampil: nama, email, role | |
| T-181 | Edit nama valid | Ubah nama, submit | Nama berubah, toast sukses | |
| T-182 | Edit nama kosong | Hapus nama, submit | Error validasi | |
| T-183 | Ganti password valid | Masukkan password baru >= 6 char | Password berubah, toast sukses | |
| T-184 | Ganti password pendek | Masukkan `< 6 char` | Error validasi | |

### Settings (WA Config)

| ID | Test Case | Steps | Expected | Status |
|----|-----------|-------|----------|--------|
| T-185 | Settings page render (operator) | Login operator, buka `/dashboard/settings` | Halaman WA config tampil | |
| T-186 | Settings — update recipient numbers | Isi nomor, simpan | Tersimpan | |
| T-187 | Settings — toggle notification | On/Off toggle | Status berubah | |

---

## Domain 12: Error & Edge Cases

### UI States

| ID | Test Case | Steps | Expected | Status |
|----|-----------|-------|----------|--------|
| T-190 | Empty state — properties | Buka properties, jika kosong | Empty state illustration + "Belum ada properti" | |
| T-191 | Empty state — rooms | Buka rooms, jika kosong | Empty state | |
| T-192 | Loading skeleton | Refresh setiap halaman | Skeleton tampil sebelum data muncul | |
| T-193 | API error toast | Force error (misal matikan backend) | Toast error muncul, user tidak kehilangan data | |

### Form Edge Cases

| ID | Test Case | Steps | Expected | Status |
|----|-----------|-------|----------|--------|
| T-194 | Double submit prevention | Klik submit dua kali cepat | Hanya 1 request terkirim (tombol disabled) | |
| T-195 | Back/forward browser setelah mutasi | Create data, klik back, forward | Data tetap konsisten | |
| T-196 | Refresh halaman setelah mutasi | Delete item, refresh | Item tetap terhapus | |
| T-197 | XSS di input field | Ketik `<script>alert('xss')</script>` di form nama | Tersimpan sebagai text, tidak execute | |
| T-198 | Special characters | Ketik `'"; DROP TABLE users;--` | Tersimpan normal, tidak ada SQL injection effect | |
| T-199 | Emoji di input | Ketik nama "Properti Keren" | Tersimpan dan tampil normal | |

### Navigation

| ID | Test Case | Steps | Expected | Status |
|----|-----------|-------|----------|--------|
| T-200 | Tab browser title | Buka setiap halaman | Title sesuai halaman | |
| T-201 | Sidebar collapse/expand | Toggle sidebar | Sidebar collapse/expand dengan animasi | |
| T-202 | Responsive — mobile viewport | Ubah viewport ke 375px | Layout berubah ke mobile | |

---

## Rangkuman

| Domain | Test Cases |
|--------|-----------|
| Authentication & Public Pages | 20 |
| RBAC & Navigation | 11 |
| Dashboard | 6 |
| Property Management | 15 |
| Room Management | 17 |
| Tenant Management | 13 |
| Payment Management | 10 |
| Confirmation (DP) | 11 |
| Maintenance | 11 |
| Notifications | 5 |
| Profile & Settings | 8 |
| Error & Edge Cases | 13 |
| **Total** | **140** |

---

## Evidence Format

Setiap test case dicatat:

```
### T-XXX — [Nama Test Case]
**Browser**: Chrome XX
**Steps**:
1. ...
2. ...
3. ...

**Expected**: ...
**Actual**: ...
**Screenshot**: (jika fail)
**Status**: PASS / FAIL
**Bug ID**: (jika fail, refer ke bug list)
```

Evidence disimpan di: `docs/evidence/blackbox-testing-frontend/`

---

## Bug Report Format

```
### BUG-XXX — [Judul]
**Severity**: P0 / P1 / P2 / P3
**Test Case**: T-XXX
**Steps to Reproduce**:
1. ...
2. ...

**Expected**: ...
**Actual**: ...
**Screenshot**: (lampirkan)
**Browser**: Chrome XX
**Notes**: (kondisi khusus)
```
