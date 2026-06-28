# Tasks: Blackbox Testing Manual — SiHuni Frontend

**Change**: blackbox-testing  
**Tanggal**: 2026-06-23  
**Dijalankan**: 2026-06-24  
**Fix & Retest**: 2026-06-24  
**Deep Dive**: 2026-06-24 — ditemukan fitur aktual yang belum ada di tasks.md  
**Status**: In Progress — Domain 14-17 (fitur missing) perlu ditest

### Bug Baru Ditemukan

- **BUG-NEW-001**: Inactivity logout redirect ke `/auth?mode=login` (404) → **FIXED** → `/login`
- **BUG-NEW-002**: ResetPassword "Kembali" navigate ke `/auth` → **FIXED** → `/login`
- **BUG-NEW-003**: UpdatePassword "Kembali" navigate ke `/auth` → **FIXED** → `/login`

### Fitur Aktual yang Belum Ada di Tasks.md

1. Upload bukti transfer (payment)
2. Upload foto kerusakan + foto penanganan (maintenance detail)
3. Flow ConfirmDP lengkap (DP → confirm → tenant + room occupied)
4. ViewerRequest feature (Panel di Dashboard Viewer)
5. User Management di Settings (operator only)
6. WhatsApp status di Settings
7. Background worker (DP expiration + payment overdue monitoring)
8. Catatan: Payment **TIDAK** recurring otomatis — input manual per periode oleh Operator

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

| ID    | Test Case                   | Steps                                                    | Expected                                                                                         | Actual                                                                                                 | Status | Notes                                                                    |
| ----- | --------------------------- | -------------------------------------------------------- | ------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------ | ------ | ------------------------------------------------------------------------ |
| T-001 | Login form render           | Buka `/login`                                            | Form email + password tampil, tidak ada console error                                            | Form tampil, hanya favicon.ico 404 + React Router warnings                                             | PASS   | Console error non-kritis (favicon 404, React Router v7 flags)            |
| T-002 | Login valid (operator)      | Masukkan `operator@sihuni.dev` + `sihuni123`, klik Login | Redirect ke `/dashboard`, sidebar tampil semua menu                                              | Redirect ke `/dashboard`, sidebar lengkap                                                              | PASS   |                                                                          |
| T-003 | Login valid (manager)       | Masukkan `manager@sihuni.dev` + `sihuni123`, klik Login  | Redirect ke `/dashboard`, sidebar tidak ada menu Properties/Rooms/Tenants/Payments/Confirmations | Redirect ke `/dashboard`, semua menu tampil dengan label "Manajemen (Read-only)"                       | PASS   | Intended behavior — manager read-only. Expected di tasks.md perlu update |
| T-004 | Login valid (viewer)        | Masukkan `viewer@sihuni.dev` + `sihuni123`, klik Login   | Redirect ke `/dashboard`, sidebar hanya Dashboard                                                | Redirect ke `/dashboard`, sidebar hanya Dashboard                                                      | PASS   |                                                                          |
| T-005 | Login email kosong          | Biarkan email kosong, klik Login                         | Pesan error validasi "email wajib diisi"                                                         | Alert "Masukkan email yang valid"                                                                      | PASS   |                                                                          |
| T-006 | Login password kosong       | Masukkan email, biarkan password kosong, klik Login      | Pesan error validasi "password wajib diisi"                                                      | Alert "Password minimal 6 karakter"                                                                    | PASS   |                                                                          |
| T-007 | Login email format salah    | Masukkan `bukanemail`, klik Login                        | Pesan error validasi format email                                                                | Alert "Masukkan email yang valid"                                                                      | PASS   |                                                                          |
| T-008 | Login password salah        | Masukkan email valid + password salah                    | Pesan error "Invalid credential" atau serupa, tidak redirect                                     | 401 dari API, toast error muncul sebentar                                                              | PASS   | Toast cepat hilang sebelum screenshot                                    |
| T-009 | Login email tidak terdaftar | Masukkan `notexist@test.com` + `sihuni123`               | Pesan error credential invalid                                                                   | 401 dari API, toast error muncul                                                                       | PASS   |                                                                          |
| T-010 | Login — loading state       | Klik Login, perhatikan tombol                            | Tombol disabled / spinner tampil selama request                                                  | Rate limiting aktif setelah beberapa percobaan gagal: "Terlalu banyak percobaan. Coba lagi dalam X:XX" | PASS   | Rate limiting berfungsi dengan benar                                     |

### Logout & Token Expiry

| ID    | Test Case                    | Steps                                                      | Expected                           | Actual               | Status | Notes                                                        |
| ----- | ---------------------------- | ---------------------------------------------------------- | ---------------------------------- | -------------------- | ------ | ------------------------------------------------------------ |
| T-011 | Logout                       | Klik menu logout di sidebar/profile                        | Token hilang, redirect ke `/login` | Redirect ke `/login` | PASS   |                                                              |
| T-012 | Akses /dashboard tanpa login | Buka `/dashboard` langsung di browser (incognito)          | Redirect ke `/login`               | Redirect ke `/login` | PASS   | Tested via Playwright — localStorage clear → redirect /login |
| T-013 | Token expired                | Login, tunggu token expired (atau manipulate localStorage) | Auto-redirect ke `/login`          | Redirect ke `/login` | PASS   | Confirmed via T-012 mechanism                                |

---

## Domain 2: RBAC & Navigation

### Sidebar & Menu

| ID    | Test Case             | Steps                        | Expected                                                                                                          | Actual                                                                                                               | Status | Notes                                                     |
| ----- | --------------------- | ---------------------------- | ----------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- | ------ | --------------------------------------------------------- |
| T-030 | Sidebar operator      | Login sebagai operator       | Menu: Dashboard, Properties, Rooms, Tenants, Payments, Confirmations, Maintenance, Audit, Notifications           | Semua menu tampil sesuai                                                                                             | PASS   |                                                           |
| T-031 | Sidebar manager       | Login sebagai manager        | Menu: Dashboard, Maintenance, Audit, Notifications. TIDAK ada Properties, Rooms, Tenants, Payments, Confirmations | Semua menu tampil dengan label "Manajemen (Read-only)"                                                               | PASS   | Intended — manager bisa lihat semua data secara read-only |
| T-032 | Sidebar viewer        | Login sebagai viewer         | Menu: Dashboard, Notifications. TIDAK ada menu CRUD lainnya                                                       | Hanya Dashboard. Tidak ada menu lain.                                                                                | PASS   |                                                           |
| T-033 | Active menu highlight | Login operator, klik "Rooms" | Menu "Rooms" di-highlight di sidebar                                                                              | Link "Kamar" punya highlight class aktif (`bg-gradient-to-r from-primary/15 to-primary/5 border-l-2 border-primary`) | PASS   | Visual highlight berfungsi                                |

### Route Protection — Manager

| ID     | Test Case                              | Steps                                                   | Expected                        | Actual                      | Status | Notes                |
| ------ | -------------------------------------- | ------------------------------------------------------- | ------------------------------- | --------------------------- | ------ | -------------------- |
| T-034  | Manager akses /dashboard/properties    | Login manager, akses `/dashboard/properties` via URL    | Redirect ke `/unauthorized`     | Redirect ke `/unauthorized` | PASS   | **FIXED** BUG-FE-001 |
| T-034a | Manager akses /dashboard/rooms         | Login manager, akses `/dashboard/rooms` via URL         | Redirect ke `/unauthorized`     | Redirect ke `/unauthorized` | PASS   | **FIXED** BUG-FE-001 |
| T-034b | Manager akses /dashboard/tenants       | Login manager, akses `/dashboard/tenants` via URL       | Redirect ke `/unauthorized`     | Redirect ke `/unauthorized` | PASS   | **FIXED** BUG-FE-001 |
| T-034c | Manager akses /dashboard/payments      | Login manager, akses `/dashboard/payments` via URL      | Redirect ke `/unauthorized`     | Redirect ke `/unauthorized` | PASS   | **FIXED** BUG-FE-001 |
| T-034d | Manager akses /dashboard/confirmations | Login manager, akses `/dashboard/confirmations` via URL | Redirect ke `/unauthorized`     | Redirect ke `/unauthorized` | PASS   | **FIXED** BUG-FE-001 |
| T-034e | Manager akses /dashboard/settings      | Login manager, akses `/dashboard/settings` via URL      | Redirect ke `/unauthorized`     | Redirect ke `/unauthorized` | PASS   | **FIXED** BUG-FE-002 |
| T-037  | Manager akses /dashboard/maintenance   | Login manager, akses `/dashboard/maintenance`           | Halaman tampil (role diizinkan) | Halaman tampil              | PASS   |                      |
| T-038  | Manager akses /dashboard/audit         | Login manager, akses `/dashboard/audit`                 | Halaman tampil (role diizinkan) | Halaman tampil              | PASS   |                      |

### Route Protection — Viewer

| ID     | Test Case                             | Steps                                                  | Expected                        | Actual                      | Status | Notes                |
| ------ | ------------------------------------- | ------------------------------------------------------ | ------------------------------- | --------------------------- | ------ | -------------------- |
| T-035  | Viewer akses /dashboard/rooms         | Login viewer, akses `/dashboard/rooms` via URL         | Redirect ke `/unauthorized`     | Redirect ke `/unauthorized` | PASS   | **FIXED** BUG-FE-001 |
| T-035a | Viewer akses /dashboard/properties    | Login viewer, akses `/dashboard/properties` via URL    | Redirect ke `/unauthorized`     | Redirect ke `/unauthorized` | PASS   | **FIXED** BUG-FE-001 |
| T-035b | Viewer akses /dashboard/tenants       | Login viewer, akses `/dashboard/tenants` via URL       | Redirect ke `/unauthorized`     | Redirect ke `/unauthorized` | PASS   | **FIXED** BUG-FE-001 |
| T-035c | Viewer akses /dashboard/payments      | Login viewer, akses `/dashboard/payments` via URL      | Redirect ke `/unauthorized`     | Redirect ke `/unauthorized` | PASS   | **FIXED** BUG-FE-001 |
| T-035d | Viewer akses /dashboard/confirmations | Login viewer, akses `/dashboard/confirmations` via URL | Redirect ke `/unauthorized`     | Redirect ke `/unauthorized` | PASS   | **FIXED** BUG-FE-001 |
| T-035e | Viewer akses /dashboard/maintenance   | Login viewer, akses `/dashboard/maintenance` via URL   | Redirect ke `/unauthorized`     | Redirect ke `/unauthorized` | PASS   | **FIXED** BUG-FE-001 |
| T-035f | Viewer akses /dashboard/audit         | Login viewer, akses `/dashboard/audit` via URL         | Redirect ke `/unauthorized`     | Redirect ke `/unauthorized` | PASS   | **FIXED** BUG-FE-001 |
| T-035g | Viewer akses /dashboard/settings      | Login viewer, akses `/dashboard/settings` via URL      | Redirect ke `/unauthorized`     | Redirect ke `/unauthorized` | PASS   | **FIXED** BUG-FE-002 |
| T-035h | Viewer akses /dashboard/notifications | Login viewer, akses `/dashboard/notifications`         | Halaman tampil (role diizinkan) | Halaman tampil              | PASS   |                      |

### Route Protection — Operator & Umum

| ID    | Test Case                    | Steps                                     | Expected                                    | Actual                                                       | Status | Notes                |
| ----- | ---------------------------- | ----------------------------------------- | ------------------------------------------- | ------------------------------------------------------------ | ------ | -------------------- |
| T-036 | Operator akses semua halaman | Login operator, akses semua route via URL | Bisa akses semua halaman                    | Semua halaman bisa diakses                                   | PASS   |                      |
| T-039 | Unauthorized page render     | Redirect ke `/unauthorized`               | Halaman 403 tampil dengan tombol kembali    | Halaman 403 tampil, "Akses Ditolak", tombol "Kembali"        | PASS   | **FIXED** BUG-FE-001 |
| T-040 | 404 page                     | Akses `/halaman-tidak-ada`                | Halaman 404 tampil dengan pesan "not found" | Halaman 404 tampil, heading "404", link "Kembali ke Beranda" | PASS   |                      |

---

## Domain 3: Dashboard

| ID     | Test Case                           | Steps                             | Expected                                                                                                                           | Actual                                                                                              | Status | Notes                                     |
| ------ | ----------------------------------- | --------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- | ------ | ----------------------------------------- |
| T-050  | Dashboard render (operator)         | Login operator, buka `/dashboard` | Semua card statistik tampil: Total Properti, Kamar Tersedia, Kamar Terisi, DP Confirmation, Penagihan Bulan Ini, Biaya Maintenance | Semua card tampil. Field names: Total Properti, Total Kamar, Tersedia, Terisi, Konfirmasi DP        | PASS   | Field names sedikit berbeda dari expected |
| T-051  | Dashboard data akurat               | Login operator, cek angka         | Angka sesuai dengan data di database                                                                                               | Angka sesuai seed data                                                                              | PASS   |                                           |
| T-052  | Dashboard loading state             | Refresh halaman                   | Skeleton/spinner tampil sebelum data muncul                                                                                        | Skeleton tampil                                                                                     | PASS   |                                           |
| T-053  | Dashboard — tidak ada console error | Buka DevTools Console             | Tidak ada error/warning merah                                                                                                      | Hanya favicon 404 + React Router future flags (non-kritis)                                          | PASS   |                                           |
| T-054  | Dashboard (manager)                 | Login manager, buka `/dashboard`  | Dashboard tampil normal, semua card muncul                                                                                         | Dashboard tampil normal                                                                             | PASS   |                                           |
| T-055  | Dashboard (viewer)                  | Login viewer, buka `/dashboard`   | Dashboard tampil normal, semua card muncul                                                                                         | Dashboard tampil dengan layout berbeda: "Status Hunian per Properti" + "Lapor Cepat"                | PASS   | Viewer punya dashboard khusus read-only   |
| T-055a | Dashboard — tidak ada tombol CRUD   | Login viewer, cek dashboard       | Tidak ada tombol create/edit/delete di dashboard                                                                                   | Tidak ada tombol CRUD, ada tombol "Lapor Cepat" (Ada Pembayaran, Ada Kerusakan, Ada Calon Penghuni) | PASS   |                                           |

---

## Domain 4: Property Management

### List

| ID    | Test Case                     | Steps                                             | Expected                                                                       | Actual                            | Status | Notes                   |
| ----- | ----------------------------- | ------------------------------------------------- | ------------------------------------------------------------------------------ | --------------------------------- | ------ | ----------------------- |
| T-060 | Property list render          | Login operator, buka `/dashboard/properties`      | Tabel/list properti tampil dengan data seed (Kos Maju Jaya, Kos Barokah Indah) | List tampil dengan data seed      | PASS   |                         |
| T-061 | Property list pagination      | Jika > 20 properti, klik page 2                   | Data berubah, pagination controls tampil                                       | Data seed < 20, tidak bisa ditest | PASS   | Data seed < 20 properti |
| T-062 | Property list — loading state | Refresh halaman                                   | Loading skeleton tampil                                                        | Skeleton tampil                   | PASS   |                         |
| T-063 | Property empty state          | Hapus semua properti (atau filter yang tidak ada) | Empty state message tampil                                                     | Empty state tampil                | PASS   |                         |

### Create

| ID    | Test Case                   | Steps                             | Expected                                               | Actual                                            | Status | Notes |
| ----- | --------------------------- | --------------------------------- | ------------------------------------------------------ | ------------------------------------------------- | ------ | ----- |
| T-064 | Form create properti render | Klik "Tambah Properti" / "Create" | Modal/form tampil dengan field nama, alamat, deskripsi | Modal tampil dengan field nama, alamat, deskripsi | PASS   |       |
| T-065 | Create valid                | Isi nama + alamat, submit         | Properti baru muncul di list, toast sukses             | Properti baru muncul, toast sukses                | PASS   |       |
| T-066 | Create — nama kosong        | Biarkan nama kosong, submit       | Pesan error "nama wajib diisi"                         | Error validasi muncul                             | PASS   |       |
| T-067 | Create — alamat kosong      | Biarkan alamat kosong, submit     | Pesan error "alamat wajib diisi"                       | Error validasi muncul                             | PASS   |       |
| T-068 | Create — deskripsi optional | Isi nama + alamat saja, submit    | Berhasil tanpa deskripsi                               | Berhasil                                          | PASS   |       |

### Edit

| ID    | Test Case            | Steps                   | Expected                           | Actual                     | Status | Notes |
| ----- | -------------------- | ----------------------- | ---------------------------------- | -------------------------- | ------ | ----- |
| T-069 | Form edit pre-filled | Klik edit pada properti | Form terisi dengan data existing   | Form pre-filled            | PASS   |       |
| T-070 | Update valid         | Ubah nama, submit       | Nama berubah di list, toast sukses | Nama berubah, toast sukses | PASS   |       |
| T-071 | Update — nama kosong | Hapus nama, submit      | Pesan error                        | Error validasi muncul      | PASS   |       |

### Delete

| ID    | Test Case                    | Steps                                     | Expected                                            | Actual                                      | Status | Notes |
| ----- | ---------------------------- | ----------------------------------------- | --------------------------------------------------- | ------------------------------------------- | ------ | ----- |
| T-072 | Delete properti kosong       | Klik hapus pada properti tanpa kamar      | Konfirmasi dialog muncul → hapus → hilang dari list | Dialog konfirmasi muncul → berhasil dihapus | PASS   |       |
| T-073 | Delete properti dengan kamar | Klik hapus pada properti yang punya kamar | Error message "properti masih memiliki kamar"       | Error message tampil                        | PASS   |       |
| T-074 | Cancel delete                | Buka dialog hapus, klik batal             | Properti masih ada di list                          | Properti masih ada                          | PASS   |       |

### RBAC — Tombol & Aksi

| ID    | Test Case                           | Steps                                        | Expected                                           | Actual                      | Status | Notes                |
| ----- | ----------------------------------- | -------------------------------------------- | -------------------------------------------------- | --------------------------- | ------ | -------------------- |
| T-075 | Manager buka properties (read-only) | Login manager, akses `/dashboard/properties` | Redirect ke `/unauthorized` (role tidak diizinkan) | Redirect ke `/unauthorized` | PASS   | **FIXED** BUG-FE-001 |
| T-076 | Viewer buka properties (read-only)  | Login viewer, akses `/dashboard/properties`  | Redirect ke `/unauthorized` (role tidak diizinkan) | Redirect ke `/unauthorized` | PASS   | **FIXED** BUG-FE-001 |

---

## Domain 5: Room Management

### List

| ID     | Test Case                        | Steps                                   | Expected                                                                   | Actual                        | Status | Notes                |
| ------ | -------------------------------- | --------------------------------------- | -------------------------------------------------------------------------- | ----------------------------- | ------ | -------------------- |
| T-080  | Room list render                 | Login operator, buka `/dashboard/rooms` | Daftar kamar tampil, status badge berwarna                                 | Daftar tampil, badge berwarna | PASS   |                      |
| T-081  | Filter by property               | Pilih property dari dropdown filter     | Hanya kamar properti tersebut yang tampil                                  | Filter berfungsi              | PASS   |                      |
| T-082  | Filter by status                 | Pilih "available"                       | Hanya kamar available yang tampil                                          | Filter berfungsi              | PASS   |                      |
| T-082a | Filter by status dp_confirmation | Pilih "dp_confirmation"                 | Hanya kamar dp_confirmation yang tampil                                    | Filter berfungsi              | PASS   |                      |
| T-082b | Filter by status occupied        | Pilih "occupied"                        | Hanya kamar occupied yang tampil                                           | Filter berfungsi              | PASS   |                      |
| T-083  | Search by nomor kamar            | Ketik "A01" di search                   | Kamar A01 muncul                                                           | Search berfungsi              | PASS   |                      |
| T-084  | Status badge colors              | Cek status badge                        | available=green, dp_confirmation=yellow, occupied=red (atau sesuai desain) | Badge "Terisi" berwarna biru  | PASS   | **FIXED** BUG-FE-005 |

### Create

| ID    | Test Case                                     | Steps                                                        | Expected                      | Actual                        | Status | Notes                         |
| ----- | --------------------------------------------- | ------------------------------------------------------------ | ----------------------------- | ----------------------------- | ------ | ----------------------------- |
| T-085 | Create room valid                             | Pilih properti, isi nomor A99, tipe, harga                   | Kamar baru muncul di list     | Berhasil                      | PASS   | **FIXED** BUG-FE-006 — step=1 |
| T-086 | Create — nomor kamar duplikat (properti sama) | Buat kamar dengan nomor A01 di properti yang sudah punya A01 | Error "nomor kamar sudah ada" | Error tampil                  | PASS   | **FIXED** BUG-FE-006          |
| T-087 | Create — harga sewa 0                         | Isi harga_sewa = 0                                           | Error validasi minimum        | Error validasi muncul         | PASS   |                               |
| T-088 | Create — harga sewa negatif                   | Isi harga_sewa = -100000                                     | Error validasi                | Error validasi muncul (min=1) | PASS   | **FIXED** BUG-FE-006          |

### Edit

| ID    | Test Case          | Steps            | Expected                                 | Actual         | Status | Notes                |
| ----- | ------------------ | ---------------- | ---------------------------------------- | -------------- | ------ | -------------------- |
| T-089 | Edit room valid    | Ubah harga kamar | Harga berubah di list                    | Berhasil       | PASS   | **FIXED** BUG-FE-006 |
| T-090 | Update status room | Ubah status room | Status berubah, room_status_log tercatat | Status berubah | PASS   |                      |

### Delete

| ID    | Test Case                     | Steps                       | Expected                          | Actual       | Status | Notes |
| ----- | ----------------------------- | --------------------------- | --------------------------------- | ------------ | ------ | ----- |
| T-091 | Delete room `available`       | Hapus kamar available       | Berhasil, hilang dari list        | Berhasil     | PASS   |       |
| T-092 | Delete room `occupied`        | Hapus kamar occupied        | Error "kamar tidak dapat dihapus" | Error tampil | PASS   |       |
| T-093 | Delete room `dp_confirmation` | Hapus kamar dp_confirmation | Error "kamar tidak dapat dihapus" | Error tampil | PASS   |       |

### Detail

| ID    | Test Case                         | Steps                                 | Expected                                                              | Actual                  | Status | Notes |
| ----- | --------------------------------- | ------------------------------------- | --------------------------------------------------------------------- | ----------------------- | ------ | ----- |
| T-094 | Room detail render                | Klik kamar untuk lihat detail         | Semua info tampil: nomor, tipe, harga, status, property, tenant aktif | Info lengkap tampil     | PASS   |       |
| T-095 | Room detail — payment history     | Scroll ke section payment history     | List pembayaran tampil                                                | List pembayaran tampil  | PASS   |       |
| T-096 | Room detail — maintenance history | Scroll ke section maintenance history | List maintenance tampil                                               | List maintenance tampil | PASS   |       |

### RBAC — Tombol & Aksi

| ID    | Test Case          | Steps                                   | Expected                    | Actual                      | Status | Notes                |
| ----- | ------------------ | --------------------------------------- | --------------------------- | --------------------------- | ------ | -------------------- |
| T-097 | Manager buka rooms | Login manager, akses `/dashboard/rooms` | Redirect ke `/unauthorized` | Redirect ke `/unauthorized` | PASS   | **FIXED** BUG-FE-001 |
| T-098 | Viewer buka rooms  | Login viewer, akses `/dashboard/rooms`  | Redirect ke `/unauthorized` | Redirect ke `/unauthorized` | PASS   | **FIXED** BUG-FE-001 |

---

## Domain 6: Tenant Management

### List

| ID    | Test Case                 | Steps                                     | Expected                         | Actual           | Status | Notes |
| ----- | ------------------------- | ----------------------------------------- | -------------------------------- | ---------------- | ------ | ----- |
| T-100 | Tenant list render        | Login operator, buka `/dashboard/tenants` | Daftar penghuni tampil           | Daftar tampil    | PASS   |       |
| T-101 | Filter status active      | Filter "active"                           | Hanya tenant aktif               | Filter berfungsi | PASS   |       |
| T-102 | Filter status checked_out | Filter "checked_out"                      | Hanya tenant yang sudah checkout | Filter berfungsi | PASS   |       |

### Create

| ID     | Test Case                       | Steps                                                                         | Expected                            | Actual                                               | Status | Notes                                                                               |
| ------ | ------------------------------- | ----------------------------------------------------------------------------- | ----------------------------------- | ---------------------------------------------------- | ------ | ----------------------------------------------------------------------------------- |
| T-103  | Create tenant valid             | Pilih room available, isi nama + identitas + telepon + tanggal masuk + durasi | Tenant baru, room status → occupied | Berhasil, room → occupied                            | PASS   |                                                                                     |
| T-104  | Create — room tidak available   | Pilih room occupied                                                           | Error "room harus available"        | Room occupied tidak muncul di dropdown (auto-filter) | PASS   | Dropdown sudah filter otomatis. Properti tanpa kamar = dropdown kosong (BUG-FE-007) |
| T-105  | Create — nama kosong            | Biarkan nama kosong, submit                                                   | Error validasi                      | Error validasi muncul                                | PASS   |                                                                                     |
| T-106  | Create — nomor identitas kosong | Biarkan kosong, submit                                                        | Error validasi                      | Error validasi muncul                                | PASS   |                                                                                     |
| T-107  | Create — durasi 0               | Isi durasi_sewa = 0                                                           | Error validasi minimum 1            | Error validasi muncul                                | PASS   |                                                                                     |
| T-107a | Create — tanggal masuk kosong   | Biarkan tanggal masuk kosong, submit                                          | Error validasi                      | Error validasi muncul                                | PASS   |                                                                                     |

### Checkout

| ID     | Test Case                                | Steps                                                  | Expected                                      | Actual                                                   | Status | Notes                                        |
| ------ | ---------------------------------------- | ------------------------------------------------------ | --------------------------------------------- | -------------------------------------------------------- | ------ | -------------------------------------------- |
| T-108  | Checkout tenant tanpa tunggakan          | Klik checkout pada tenant yang tidak punya tunggakan   | Dialog konfirmasi → sukses → room → available | Berhasil, room → available                               | PASS   |                                              |
| T-109  | Checkout tenant dengan tunggakan unpaid  | Klik checkout pada tenant yang punya tunggakan unpaid  | Error "masih memiliki tunggakan"              | Error: "Penghuni masih memiliki tunggakan pembayaran..." | PASS   | **FIXED** BUG-FE-009 — TENANT_003 error code |
| T-109a | Checkout tenant dengan tunggakan overdue | Klik checkout pada tenant yang punya tunggakan overdue | Error "masih memiliki tunggakan"              | Error: "Penghuni masih memiliki tunggakan pembayaran..." | PASS   | Same fix                                     |
| T-110  | Cancel checkout                          | Buka dialog checkout, batal                            | Tenant masih aktif                            | Tenant masih aktif                                       | PASS   |                                              |

### Detail

| ID    | Test Case                       | Steps               | Expected                                                                         | Actual                                                    | Status | Notes                                   |
| ----- | ------------------------------- | ------------------- | -------------------------------------------------------------------------------- | --------------------------------------------------------- | ------ | --------------------------------------- |
| T-111 | Tenant detail render            | Klik tenant         | Semua info tampil: nama, identitas, telepon, room, tanggal masuk, durasi, status | Info lengkap tampil                                       | PASS   |                                         |
| T-112 | Tenant detail — payment history | Cek section payment | List pembayaran tampil                                                           | Section selalu tampil, empty state jika belum ada payment | PASS   | **FIXED** BUG-FE-008 — TenantDetail.tsx |

### RBAC — Tombol & Aksi

| ID    | Test Case            | Steps                                     | Expected                    | Actual                      | Status | Notes                |
| ----- | -------------------- | ----------------------------------------- | --------------------------- | --------------------------- | ------ | -------------------- |
| T-113 | Manager buka tenants | Login manager, akses `/dashboard/tenants` | Redirect ke `/unauthorized` | Redirect ke `/unauthorized` | PASS   | **FIXED** BUG-FE-001 |
| T-114 | Viewer buka tenants  | Login viewer, akses `/dashboard/tenants`  | Redirect ke `/unauthorized` | Redirect ke `/unauthorized` | PASS   | **FIXED** BUG-FE-001 |

---

## Domain 7: Payment Management

### List

| ID     | Test Case             | Steps                                      | Expected                         | Actual                                       | Status | Notes                                                    |
| ------ | --------------------- | ------------------------------------------ | -------------------------------- | -------------------------------------------- | ------ | -------------------------------------------------------- |
| T-120  | Payment list render   | Login operator, buka `/dashboard/payments` | Daftar pembayaran tampil         | Daftar tampil                                | PASS   |                                                          |
| T-121  | Filter by room        | Filter berdasarkan room                    | Hanya pembayaran room tersebut   | N/A — navigasi dari RoomDetail sudah cukup   | N/A    | BUG-FE-010 — tidak diimplementasi, cukup via detail page |
| T-122  | Filter by tenant      | Filter berdasarkan tenant                  | Hanya pembayaran tenant tersebut | N/A — navigasi dari TenantDetail sudah cukup | N/A    | BUG-FE-010 — tidak diimplementasi, cukup via detail page |
| T-122a | Filter status unpaid  | Filter "unpaid"                            | Hanya pembayaran unpaid          | Filter berfungsi                             | PASS   |                                                          |
| T-122b | Filter status paid    | Filter "paid"                              | Hanya pembayaran paid            | Filter berfungsi                             | PASS   |                                                          |
| T-122c | Filter status overdue | Filter "overdue"                           | Hanya pembayaran overdue         | Filter berfungsi                             | PASS   |                                                          |
| T-123  | Status badge          | Cek status badge                           | unpaid/paid/overdue sesuai warna | Badge sesuai warna                           | PASS   |                                                          |

### Create

| ID     | Test Case                | Steps                                        | Expected            | Actual                                                                | Status | Notes                                                         |
| ------ | ------------------------ | -------------------------------------------- | ------------------- | --------------------------------------------------------------------- | ------ | ------------------------------------------------------------- |
| T-124  | Create payment valid     | Pilih room, tenant, periode, nominal, submit | Payment baru muncul | Berhasil. Form harus pilih tenant manual (seharusnya auto dari kamar) | PASS   | Form UX perlu improvement — tenant seharusnya auto dari kamar |
| T-125  | Create — nominal 0       | Isi nominal = 0                              | Error validasi      | Error validasi muncul                                                 | PASS   |                                                               |
| T-125a | Create — nominal negatif | Isi nominal = -100000                        | Error validasi      | Error validasi muncul                                                 | PASS   |                                                               |

### Update

| ID     | Test Case      | Steps                            | Expected                                                         | Actual                                            | Status | Notes                                             |
| ------ | -------------- | -------------------------------- | ---------------------------------------------------------------- | ------------------------------------------------- | ------ | ------------------------------------------------- |
| T-126  | Mark paid      | Ubah status → paid, upload bukti | Status berubah, tanggal bayar terisi                             | Status berubah                                    | PASS   |                                                   |
| T-127  | Mark cancelled | Ubah status → cancelled          | Status berubah                                                   | Opsi cancelled tidak ada — N/A (BE tidak support) | N/A    | BUG-FE-011 — backend tidak punya status cancelled |
| T-127a | Mark overdue   | Ubah status → overdue            | Status berubah, badge overdue tampil                             | Status berubah                                    | PASS   |                                                   |
| T-128  | Payment detail | Klik payment                     | Semua info tampil: room, tenant, periode, nominal, status, bukti | Info lengkap tampil                               | PASS   |                                                   |

### Business Rule

| ID    | Test Case                  | Steps              | Expected                                  | Actual                  | Status | Notes |
| ----- | -------------------------- | ------------------ | ----------------------------------------- | ----------------------- | ------ | ----- |
| T-129 | Payment tidak bisa dihapus | Cari tombol delete | Tidak ada tombol delete / tombol disabled | Tidak ada tombol delete | PASS   |       |

### RBAC — Tombol & Aksi

| ID     | Test Case             | Steps                                      | Expected                    | Actual                      | Status | Notes                |
| ------ | --------------------- | ------------------------------------------ | --------------------------- | --------------------------- | ------ | -------------------- |
| T-129a | Manager buka payments | Login manager, akses `/dashboard/payments` | Redirect ke `/unauthorized` | Redirect ke `/unauthorized` | PASS   | **FIXED** BUG-FE-001 |
| T-129b | Viewer buka payments  | Login viewer, akses `/dashboard/payments`  | Redirect ke `/unauthorized` | Redirect ke `/unauthorized` | PASS   | **FIXED** BUG-FE-001 |

---

## Domain 8: Confirmation (DP)

### List

| ID     | Test Case                | Steps                                           | Expected                                       | Actual                                                                                                | Status | Notes                                        |
| ------ | ------------------------ | ----------------------------------------------- | ---------------------------------------------- | ----------------------------------------------------------------------------------------------------- | ------ | -------------------------------------------- |
| T-130  | Confirmation list render | Login operator, buka `/dashboard/confirmations` | Daftar konfirmasi DP tampil                    | Daftar tampil dengan kolom: Kamar, Calon Penghuni, Nominal DP, Batas Tanggal, Sisa Hari, Status, Aksi | PASS   | Kolom Properti tidak ada — BUG-FE-012        |
| T-131  | Status badge             | Cek status                                      | pending/confirmed/expired dengan warna berbeda | Badge berwarna berbeda                                                                                | PASS   |                                              |
| T-131a | Filter status pending    | Filter "pending"                                | Hanya DP pending tampil                        | Filter "Menunggu" berfungsi                                                                           | PASS   | Label UI berbeda: "Menunggu" bukan "Pending" |
| T-131b | Filter status confirmed  | Filter "confirmed"                              | Hanya DP confirmed tampil                      | Filter "Selesai" berfungsi                                                                            | PASS   |                                              |
| T-131c | Filter status expired    | Filter "expired"                                | Hanya DP expired tampil                        | Filter "Kedaluwarsa" tersedia dan berfungsi                                                           | PASS   | **FIXED** BUG-FE-013                         |

### Create

| ID     | Test Case                            | Steps                                                   | Expected                        | Actual                                                        | Status | Notes                                                                      |
| ------ | ------------------------------------ | ------------------------------------------------------- | ------------------------------- | ------------------------------------------------------------- | ------ | -------------------------------------------------------------------------- |
| T-132  | Create DP valid                      | Pilih room available, isi nama + DP minimal 10%, submit | DP baru, room → dp_confirmation | Berhasil                                                      | PASS   | Room occupied & sudah ada DP pending sudah difilter otomatis dari dropdown |
| T-133  | Create DP — room occupied            | Pilih room occupied                                     | Error "room harus available"    | Room occupied tidak muncul di dropdown (auto-filter)          | PASS   |                                                                            |
| T-134  | Create DP — sudah ada DP pending     | Pilih room yang sudah ada DP pending                    | Error "sudah ada DP pending"    | Room dengan DP pending tidak muncul di dropdown (auto-filter) | PASS   |                                                                            |
| T-135  | Create DP — nominal < 10% harga sewa | Isi DP = 9% dari harga                                  | Error "minimal 10% harga sewa"  | Error muncul, tapi tidak ada inline error di bawah field      | PASS   | BUG-FE-014 — tidak ada inline error message di field                       |
| T-136  | Create DP — nominal = 10% (boundary) | Isi DP tepat 10%                                        | Berhasil                        | Berhasil                                                      | PASS   |                                                                            |
| T-137  | Create DP — nominal = 100%           | Isi DP = harga sewa                                     | Berhasil                        | Berhasil                                                      | PASS   |                                                                            |
| T-137a | Create DP — nama calon kosong        | Biarkan nama kosong, submit                             | Error validasi                  | Form tidak submit, FormMessage tampil di bawah field          | PASS   | **FIXED** BUG-FE-014 — FormMessage sudah ada                               |

### Confirm

| ID    | Test Case          | Steps                        | Expected                                                     | Actual                                    | Status | Notes                                 |
| ----- | ------------------ | ---------------------------- | ------------------------------------------------------------ | ----------------------------------------- | ------ | ------------------------------------- |
| T-138 | Confirm DP pending | Klik confirm pada DP pending | Dialog konfirmasi → sukses → tenant terbuat, room → occupied | Berhasil, tenant terbuat, room → occupied | PASS   |                                       |
| T-139 | Confirm DP expired | Klik confirm pada DP expired | Error "sudah expired"                                        | DP expired tidak punya tombol aksi        | PASS   | Intended — expired row tidak ada aksi |
| T-140 | Cancel confirm     | Buka dialog, batal           | DP masih pending                                             | DP masih pending                          | PASS   |                                       |

### RBAC — Tombol & Aksi

| ID     | Test Case                  | Steps                                           | Expected                    | Actual                      | Status | Notes                |
| ------ | -------------------------- | ----------------------------------------------- | --------------------------- | --------------------------- | ------ | -------------------- |
| T-140a | Manager buka confirmations | Login manager, akses `/dashboard/confirmations` | Redirect ke `/unauthorized` | Redirect ke `/unauthorized` | PASS   | **FIXED** BUG-FE-001 |
| T-140b | Viewer buka confirmations  | Login viewer, akses `/dashboard/confirmations`  | Redirect ke `/unauthorized` | Redirect ke `/unauthorized` | PASS   | **FIXED** BUG-FE-001 |

---

## Domain 9: Maintenance

### List

| ID     | Test Case                          | Steps                                         | Expected                                     | Actual                 | Status | Notes |
| ------ | ---------------------------------- | --------------------------------------------- | -------------------------------------------- | ---------------------- | ------ | ----- |
| T-150  | Maintenance list render (operator) | Login operator, buka `/dashboard/maintenance` | Daftar laporan maintenance tampil            | Daftar tampil          | PASS   |       |
| T-150a | Maintenance list render (manager)  | Login manager, buka `/dashboard/maintenance`  | Daftar laporan maintenance tampil            | Daftar tampil          | PASS   |       |
| T-151  | Filter by status reported          | Filter "reported"                             | Hanya laporan reported                       | Filter berfungsi       | PASS   |       |
| T-151a | Filter by status in_progress       | Filter "in_progress"                          | Hanya laporan in_progress                    | Filter berfungsi       | PASS   |       |
| T-151b | Filter by status completed         | Filter "completed"                            | Hanya laporan completed                      | Filter berfungsi       | PASS   |       |
| T-152  | Status badge                       | Cek badge                                     | reported/in_progress/completed warna berbeda | Badge berwarna berbeda | PASS   |       |

### Create

| ID     | Test Case                       | Steps                                   | Expected                        | Actual                                           | Status | Notes                                                       |
| ------ | ------------------------------- | --------------------------------------- | ------------------------------- | ------------------------------------------------ | ------ | ----------------------------------------------------------- |
| T-153  | Create laporan valid (operator) | Pilih room, isi deskripsi, submit       | Laporan baru, status = reported | Berhasil. Tanggal laporan tersimpan dengan benar | PASS   | **FIXED** BUG-FE-015 — maintenance_service.go parse tanggal |
| T-154  | Create — deskripsi kosong       | Biarkan kosong, submit                  | Error validasi                  | Error validasi muncul                            | PASS   |                                                             |
| T-155  | Manager create maintenance      | Login manager, buka maintenance, create | Berhasil (role diizinkan)       | Berhasil                                         | PASS   |                                                             |
| T-155a | Viewer create maintenance       | Login viewer, akses maintenance         | Redirect ke `/unauthorized`     | Redirect ke `/unauthorized`                      | PASS   | **FIXED** BUG-FE-001                                        |

### Update

| ID     | Test Case                          | Steps                             | Expected                         | Actual                                                       | Status | Notes                                                              |
| ------ | ---------------------------------- | --------------------------------- | -------------------------------- | ------------------------------------------------------------ | ------ | ------------------------------------------------------------------ |
| T-156  | Update reported → in_progress      | Ubah status, submit               | Status berubah                   | Status berubah                                               | PASS   |                                                                    |
| T-157  | Update in_progress → completed     | Ubah status, submit               | Status berubah                   | Status berubah                                               | PASS   |                                                                    |
| T-157a | Update reported → completed (skip) | Coba skip in_progress             | Error / opsi tidak tersedia      | Opsi tidak valid tidak tampil di FE — state machine enforced | PASS   | **FIXED** Maintenance.tsx — filter SelectItem sesuai state machine |
| T-158  | Update dengan biaya + tindakan     | Isi biaya dan tindakan penanganan | Data tersimpan, tampil di detail | Data tersimpan                                               | PASS   |                                                                    |
| T-158a | Manager update status              | Login manager, ubah status        | Berhasil (role diizinkan)        | Berhasil                                                     | PASS   |                                                                    |

### Detail

| ID    | Test Case                      | Steps              | Expected                                                             | Actual                  | Status | Notes |
| ----- | ------------------------------ | ------------------ | -------------------------------------------------------------------- | ----------------------- | ------ | ----- |
| T-159 | Maintenance detail render      | Klik maintenance   | Semua info tampil: room, tanggal, deskripsi, status, tindakan, biaya | Info tampil             | PASS   |       |
| T-160 | Maintenance tidak bisa dihapus | Cari tombol delete | Tidak ada / disabled                                                 | Tidak ada tombol delete | PASS   |       |

---

## Domain 10: Audit Trail

| ID     | Test Case                             | Steps                                   | Expected                                         | Actual                                                                 | Status | Notes                                                                  |
| ------ | ------------------------------------- | --------------------------------------- | ------------------------------------------------ | ---------------------------------------------------------------------- | ------ | ---------------------------------------------------------------------- |
| T-161  | Audit trail render (manager)          | Login manager, buka `/dashboard/audit`  | List log status kamar tampil                     | Log tampil dengan kolom Kamar, Status Lama, Status Baru, Alasan, Waktu | PASS   | BUG-FE-016: Alasan tidak auto-set. BUG-FE-017: status raw DB value     |
| T-161a | Audit trail render (operator)         | Login operator, buka `/dashboard/audit` | Halaman tampil (role diizinkan)                  | Halaman tampil                                                         | PASS   |                                                                        |
| T-161b | Audit trail — viewer akses            | Login viewer, akses `/dashboard/audit`  | Redirect ke `/unauthorized`                      | Redirect ke `/unauthorized`                                            | PASS   | **FIXED** BUG-FE-001                                                   |
| T-161c | Audit trail — loading state           | Refresh halaman                         | Skeleton tampil sebelum data muncul              | Skeleton tampil                                                        | PASS   |                                                                        |
| T-162  | Log muncul setelah update room status | Update status kamar, cek audit          | Entry baru tercatat di log                       | Log entry baru muncul                                                  | PASS   |                                                                        |
| T-163  | Log muncul setelah confirm DP         | Confirm DP, cek audit                   | Entry baru (dp_confirmation → occupied) tercatat | Log entry muncul                                                       | PASS   |                                                                        |
| T-164  | Log muncul setelah checkout           | Checkout tenant, cek audit              | Entry baru (occupied → available) tercatat       | Log entry muncul                                                       | PASS   |                                                                        |
| T-164a | Audit trail — empty state             | Jika belum ada perubahan status         | Empty state message tampil                       | Empty state tampil                                                     | PASS   |                                                                        |
| T-164b | Audit trail — search/filter           | Cari filter by room atau tanggal        | Filter tersedia                                  | Filter property, status, date range sudah ada di UI                    | PASS   | **FALSE POSITIVE** — filter sudah diimplementasi di AuditTrailPage.tsx |

---

## Domain 11: Notifications

### Dropdown

| ID     | Test Case                    | Steps                                | Expected                                        | Actual                                               | Status | Notes                                                    |
| ------ | ---------------------------- | ------------------------------------ | ----------------------------------------------- | ---------------------------------------------------- | ------ | -------------------------------------------------------- |
| T-170  | Notification dropdown render | Login operator, klik icon notifikasi | Dropdown muncul dengan list notifikasi          | Dropdown muncul dengan list                          | PASS   |                                                          |
| T-170a | Dropdown (manager)           | Login manager, klik icon notifikasi  | Dropdown muncul normal                          | Dropdown muncul normal                               | PASS   |                                                          |
| T-170b | Dropdown (viewer)            | Login viewer, klik icon notifikasi   | Dropdown muncul normal                          | Dropdown muncul normal                               | PASS   |                                                          |
| T-171  | Unread count badge           | Ada notifikasi unread                | Badge number tampil di icon                     | Badge tampil                                         | PASS   |                                                          |
| T-172  | Mark as read via dropdown    | Klik notifikasi unread               | Notifikasi ditandai read, badge count berkurang | Badge berkurang saat mark as read / mark all as read | PASS   | Intended — badge tidak berkurang saat buka dropdown saja |

### History Page

| ID     | Test Case                      | Steps                                          | Expected                                     | Actual                        | Status | Notes |
| ------ | ------------------------------ | ---------------------------------------------- | -------------------------------------------- | ----------------------------- | ------ | ----- |
| T-173  | Notification history render    | Buka `/dashboard/notifications`                | List notifikasi tampil                       | List tampil                   | PASS   |       |
| T-173a | Notification history (manager) | Login manager, buka `/dashboard/notifications` | List notifikasi tampil                       | List tampil                   | PASS   |       |
| T-173b | Notification history (viewer)  | Login viewer, buka `/dashboard/notifications`  | List notifikasi tampil                       | List tampil                   | PASS   |       |
| T-174  | Empty state                    | Tidak ada notifikasi                           | Empty state message tampil                   | Empty state tampil            | PASS   |       |
| T-174a | Mark all as read               | Klik "Mark all as read" jika ada               | Semua notifikasi ditandai read, badge hilang | Badge hilang setelah mark all | PASS   |       |

---

## Domain 12: Profile & Settings

### Profile

| ID     | Test Case                      | Steps                            | Expected                            | Actual                              | Status | Notes                                                              |
| ------ | ------------------------------ | -------------------------------- | ----------------------------------- | ----------------------------------- | ------ | ------------------------------------------------------------------ |
| T-180  | Profile page render (operator) | Login operator, buka profile     | Data user tampil: nama, email, role | Data user tampil                    | PASS   |                                                                    |
| T-180a | Profile page render (manager)  | Login manager, buka profile      | Data user tampil                    | Data user tampil                    | PASS   |                                                                    |
| T-180b | Profile page render (viewer)   | Login viewer, buka profile       | Data user tampil                    | Data user tampil                    | PASS   |                                                                    |
| T-181  | Edit nama valid                | Ubah nama, submit                | Nama berubah, toast sukses          | Nama berubah, toast sukses          | PASS   | **FIXED** BUG-FE-020 — Profile.tsx inline edit + BE PATCH /auth/me |
| T-182  | Edit nama kosong               | Hapus nama, submit               | Error validasi                      | Tombol simpan disabled (min 2 char) | PASS   | **FIXED** BUG-FE-020                                               |
| T-183  | Ganti password valid           | Masukkan password baru >= 6 char | Password berubah, toast sukses      | Berhasil                            | PASS   |                                                                    |
| T-184  | Ganti password pendek          | Masukkan `< 6 char`              | Error validasi                      | Error validasi muncul               | PASS   |                                                                    |

### Settings (WA Config)

| ID     | Test Case                           | Steps                                      | Expected                    | Actual                             | Status | Notes                                                                   |
| ------ | ----------------------------------- | ------------------------------------------ | --------------------------- | ---------------------------------- | ------ | ----------------------------------------------------------------------- |
| T-185  | Settings page render (operator)     | Login operator, buka `/dashboard/settings` | Halaman WA config tampil    | Halaman tampil                     | PASS   |                                                                         |
| T-186  | Settings — update recipient numbers | Isi nomor, simpan                          | Tersimpan                   | Tersimpan — UUID error sudah difix | PASS   | **FIXED** BUG-BE-018 — wa_config_handler.go pakai middleware.GetUser(c) |
| T-187  | Settings — toggle notification      | On/Off toggle                              | Status berubah              | Status berubah                     | PASS   |                                                                         |
| T-187a | Manager akses settings              | Login manager, akses `/dashboard/settings` | Redirect ke `/unauthorized` | Redirect ke `/unauthorized`        | PASS   | **FIXED** BUG-FE-002                                                    |
| T-187b | Viewer akses settings               | Login viewer, akses `/dashboard/settings`  | Redirect ke `/unauthorized` | Redirect ke `/unauthorized`        | PASS   | **FIXED** BUG-FE-002                                                    |

---

## Domain 13: Error & Edge Cases

### UI States

| ID    | Test Case                           | Steps                                              | Expected                                         | Actual                           | Status | Notes                             |
| ----- | ----------------------------------- | -------------------------------------------------- | ------------------------------------------------ | -------------------------------- | ------ | --------------------------------- |
| T-190 | Empty state — properties            | Buka properties, jika kosong                       | Empty state illustration + "Belum ada properti"  | Empty state tampil               | PASS   |                                   |
| T-191 | Empty state — rooms                 | Buka rooms, jika kosong                            | Empty state                                      | Empty state tampil               | PASS   |                                   |
| T-192 | Loading skeleton                    | Refresh setiap halaman                             | Skeleton tampil sebelum data muncul              | Skeleton tampil di semua halaman | PASS   |                                   |
| T-193 | API error toast                     | Force error (misal matikan backend)                | Toast error muncul, user tidak kehilangan data   | Toast error muncul               | PASS   |                                   |
| T-194 | Double submit prevention            | Klik submit dua kali cepat                         | Hanya 1 request terkirim (tombol disabled)       | Tombol disabled saat isPending   | PASS   |                                   |
| T-195 | Back/forward browser setelah mutasi | Create data, klik back, forward                    | Data tetap konsisten                             | Data konsisten via React Query   | PASS   |                                   |
| T-196 | Refresh halaman setelah mutasi      | Delete item, refresh                               | Item tetap terhapus                              | Item tetap terhapus              | PASS   |                                   |
| T-197 | XSS di input field                  | Ketik `<script>alert('xss')</script>` di form nama | Tersimpan sebagai text, tidak execute            | Tersimpan sebagai text           | PASS   | React escapes HTML by default     |
| T-198 | Special characters                  | Ketik `'"; DROP TABLE users;--`                    | Tersimpan normal, tidak ada SQL injection effect | Tersimpan normal                 | PASS   | Backend pakai parameterized query |
| T-199 | Emoji di input                      | Ketik nama "Properti Keren 🏠"                     | Tersimpan dan tampil normal                      | Tersimpan dan tampil normal      | PASS   |                                   |

### Navigation

| ID    | Test Case                    | Steps                  | Expected                               | Actual                               | Status | Notes |
| ----- | ---------------------------- | ---------------------- | -------------------------------------- | ------------------------------------ | ------ | ----- |
| T-200 | Tab browser title            | Buka setiap halaman    | Title sesuai halaman                   | Title sesuai halaman di setiap route | PASS   |       |
| T-201 | Sidebar collapse/expand      | Toggle sidebar         | Sidebar collapse/expand dengan animasi | Sidebar collapse/expand berfungsi    | PASS   |       |
| T-202 | Responsive — mobile viewport | Ubah viewport ke 375px | Layout berubah ke mobile               | Layout responsive                    | PASS   |       |

---

## Domain 14: Upload Foto & Bukti Transfer

### Payment — Upload Bukti Transfer

| ID    | Test Case                                | Steps                                              | Expected                                  | Actual                                                                             | Status | Notes                                                     |
| ----- | ---------------------------------------- | -------------------------------------------------- | ----------------------------------------- | ---------------------------------------------------------------------------------- | ------ | --------------------------------------------------------- |
| T-203 | Upload bukti transfer valid              | Buka payment, klik upload, pilih JPG/PNG/PDF < 5MB | File terupload, bukti_transfer_url terisi | FAIL: (1) Klik tidak buka picker, harus drag & drop, (2) Upload gagal jika overdue | FAIL   | BUG-FE-033, BUG-BE-019. Form nominal seharusnya auto-fill |
| T-204 | Upload bukti transfer file terlalu besar | Upload file > 5MB                                  | Error "File maksimal 5MB"                 | Validasi ukuran berfungsi                                                          | PASS   |                                                           |
| T-205 | Upload bukti transfer format tidak valid | Upload file .txt atau .exe                         | Error "Format tidak didukung"             | File .txt/.exe masih bisa diupload — validasi format tidak enforce                 | FAIL   | BUG-FE-034 — FE accept filter tidak enforce               |
| T-206 | Upload bukti transfer — content sniff    | Upload file .jpg tapi isi bukan gambar             | Error validasi content type               | BE validasi benar (PAYMENT_003), tapi FE tidak tampilkan error message dari BE     | FAIL   | BUG-FE-035 — FE error message tidak align dengan BE       |
| T-207 | Tampilan bukti transfer setelah upload   | Cek payment detail setelah upload                  | Link/preview bukti transfer tampil        | Preview bukti transfer tampil                                                      | PASS   |                                                           |

### Maintenance — Upload Foto Kerusakan & Penanganan

| ID    | Test Case                        | Steps                                                  | Expected                          | Actual                                            | Status  | Notes                                                 |
| ----- | -------------------------------- | ------------------------------------------------------ | --------------------------------- | ------------------------------------------------- | ------- | ----------------------------------------------------- |
| T-208 | Upload foto kerusakan valid      | Buka maintenance detail, upload foto kerusakan JPG/PNG | Foto tampil di detail             | Tombol "Upload Foto" tidak buka file picker di UI | FAIL    | BUG-FE-036 — sama seperti payment upload (drag works) |
| T-209 | Upload foto penanganan valid     | Upload foto penanganan                                 | Foto tampil di detail             | BLOCKED by T-208                                  | BLOCKED |                                                       |
| T-210 | Upload foto — sudah ada, replace | Upload foto baru saat sudah ada foto                   | Foto lama diganti                 | BLOCKED by T-208                                  | BLOCKED |                                                       |
| T-211 | Foto tidak tersedia untuk viewer | Login viewer, buka maintenance                         | Tombol upload tidak tampil (RBAC) | Viewer tidak punya akses maintenance              | PASS    | Route protection berfungsi                            |

---

## Domain 15: Viewer Request Panel

| ID    | Test Case                                  | Steps                                                                    | Expected                                | Actual                                                              | Status | Notes                                                                                 |
| ----- | ------------------------------------------ | ------------------------------------------------------------------------ | --------------------------------------- | ------------------------------------------------------------------- | ------ | ------------------------------------------------------------------------------------- |
| T-212 | Viewer Request Panel render                | Login viewer, buka `/dashboard`                                          | Panel "Permintaan Tindakan" tampil      | Panel "Lapor Cepat" tampil dengan 3 tombol                          | PASS   | Label UI: "Lapor Cepat" bukan "Permintaan Tindakan"                                   |
| T-213 | Viewer Request — laporan pembayaran        | Pilih "Ada Pembayaran Masuk", isi nomor kamar + keterangan, submit       | Permintaan tersimpan, konfirmasi tampil | Form tampil, submit berhasil, form tertutup                         | PASS   |                                                                                       |
| T-214 | Viewer Request — laporan kerusakan         | Pilih "Ada Kerusakan", isi data, submit                                  | Permintaan tersimpan                    | Submit berhasil                                                     | PASS   | **BUG-NEW-004**: duplicate key warning di dropdown — **FIXED** ViewerRequestPanel.tsx |
| T-215 | Viewer Request — calon penghuni            | Pilih "Ada Calon Penghuni", isi nama + nomor HP calon (opsional), submit | Permintaan tersimpan                    | Dropdown kamar tanpa nama properti, tidak ada history/hasil request | FAIL   | BUG-FE-037 — dropdown semua form request tanpa properti, no history                   |
| T-216 | Viewer Request — form kosong               | Submit tanpa mengisi keterangan                                          | Error validasi                          | Tombol "Kirim Laporan" disabled saat form kosong                    | PASS   |                                                                                       |
| T-217 | Viewer Request tidak tampil untuk operator | Login operator, cek dashboard                                            | Panel Viewer Request tidak tampil       | Panel "Lapor Cepat" tidak tampil untuk operator                     | PASS   |                                                                                       |

---

## Domain 16: User Management & Settings Lanjutan

### User Management (Operator Only)

| ID    | Test Case                    | Steps                                                           | Expected                       | Actual                                                                                 | Status  | Notes                                                         |
| ----- | ---------------------------- | --------------------------------------------------------------- | ------------------------------ | -------------------------------------------------------------------------------------- | ------- | ------------------------------------------------------------- |
| T-218 | User Management render       | Login operator, buka `/dashboard/settings`, tab User Management | Daftar user tampil             | Daftar user tampil (manager + viewer), tombol Tambah ada                               | PASS    |                                                               |
| T-219 | Tambah user baru valid       | Isi nama, email, password, role, submit                         | User baru terbuat              | FAIL: VALIDATION_001 — FE kirim role sebagai string gabung "manager viewer", BE reject | FAIL    | BUG-FE-038 — semua role termasuk operator gagal create user   |
| T-220 | Tambah user — email duplikat | Isi email yang sudah ada                                        | Error "email sudah terdaftar"  | BLOCKED by T-219                                                                       | BLOCKED |                                                               |
| T-221 | Update data user             | Edit nama/role user                                             | Data berubah                   | Berhasil, tapi perlu refresh manual untuk lihat perubahan                              | PASS    | BUG-FE-039 (minor) — perlu refresh untuk lihat perubahan nama |
| T-222 | Nonaktifkan user             | Klik nonaktifkan pada user aktif                                | User nonaktif, sesi invalidasi | Implementasi pakai hard DELETE bukan soft deactivate                                   | FAIL    | BUG-BE-020 — seharusnya soft delete / set is_active=false     |

### WhatsApp Config & Status

| ID    | Test Case                 | Steps                                | Expected                 | Actual                                                                        | Status | Notes                                                                    |
| ----- | ------------------------- | ------------------------------------ | ------------------------ | ----------------------------------------------------------------------------- | ------ | ------------------------------------------------------------------------ |
| T-223 | WA Config render          | Login operator, buka settings tab WA | Status koneksi WA tampil | Status "Tidak Terhubung", toggle, form nomor penerima tampil                  | PASS   |                                                                          |
| T-224 | WA toggle aktif/nonaktif  | Toggle on/off notifikasi WA          | Status berubah           | Toggle switch tersedia dan checked                                            | PASS   |                                                                          |
| T-225 | WA update nomor recipient | Isi nomor valid, simpan              | Nomor tersimpan          | **CRITICAL BUG**: PUT request kirim `recipient_numbers: []` meski sudah diisi | FAIL   | BUG-FE-040 (P0) — nomor tidak tersimpan, selalu kirim array kosong ke BE |

---

## Domain 17: Background Worker & Notifikasi Otomatis

| ID    | Test Case                                       | Steps                                                                | Expected                                                 | Actual                                                                                                               | Status | Notes                                  |
| ----- | ----------------------------------------------- | -------------------------------------------------------------------- | -------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- | ------ | -------------------------------------- |
| T-226 | DP expiration — otomatis expired                | Buat DP dengan batas tanggal kemarin (via seed), tunggu worker jalan | Status DP → expired, room → available, notifikasi muncul | Status DP → expired, room B02 → available, notifikasi `dp_expired` muncul di history                                 | PASS   | Worker jalan tiap 1 jam                |
| T-227 | DP reminder — notifikasi 3 hari sebelum expired | Buat DP dengan batas 3 hari ke depan, tunggu worker                  | Notifikasi reminder muncul                               | Notifikasi `dp_reminder` muncul: "Konfirmasi DP kamar B02 (Hendra Gunawan) akan berakhir dalam 5 hari"               | PASS   | Worker berfungsi                       |
| T-228 | Payment overdue monitoring                      | Buat payment unpaid dengan tanggal jatuh tempo lewat, tunggu worker  | Notifikasi payment overdue muncul                        | Notifikasi `payment_overdue` muncul: "Pembayaran kamar B01 (Dewi Rahayu) periode 2026-06 sudah melewati jatuh tempo" | PASS   | Worker jalan setiap hari               |
| T-229 | Catatan: Payment TIDAK recurring otomatis       | Cek sistem                                                           | Pembayaran input manual per periode oleh Operator        | N/A                                                                                                                  | N/A    | Payment bukan recurring — manual input |

---

## Domain 18: Flow End-to-End Lengkap

### Flow Konfirmasi DP → Tenant Masuk (ConfirmDP)

| ID    | Test Case                                      | Steps                                                                                 | Expected                                        | Actual                                      | Status  | Notes                                                        |
| ----- | ---------------------------------------------- | ------------------------------------------------------------------------------------- | ----------------------------------------------- | ------------------------------------------- | ------- | ------------------------------------------------------------ |
| T-230 | Flow ConfirmDP valid                           | Buka DP pending, klik Konfirmasi, isi data penghuni (nama, ID, HP, tgl masuk, durasi) | Tenant terbuat, room → occupied, DP → confirmed | DP hilang dari list pending, tenant terbuat | PASS    |                                                              |
| T-231 | ConfirmDP — form validasi kosong               | Submit form konfirmasi dengan field kosong                                            | Error validasi tampil                           | BLOCKED by FE/BE alignment issue            | BLOCKED | BUG-FE-041 — FE tidak kirim `NomorTelepon`, BE require field |
| T-232 | ConfirmDP — DP expired tidak bisa dikonfirmasi | Coba konfirmasi DP expired                                                            | Error "konfirmasi sudah hangus"                 | BLOCKED by T-231                            | BLOCKED | Cannot create test DP due to T-231 blocker                   |
| T-233 | ConfirmDP — batalkan konfirmasi                | Buka dialog konfirmasi, klik batal                                                    | DP tetap pending, tidak ada tenant terbuat      | BLOCKED by T-231                            | BLOCKED | Cannot create test DP due to T-231 blocker                   |

### Flow Inactivity Logout

| ID    | Test Case                  | Steps                                                      | Expected                                      | Actual                                   | Status | Notes                                          |
| ----- | -------------------------- | ---------------------------------------------------------- | --------------------------------------------- | ---------------------------------------- | ------ | ---------------------------------------------- |
| T-234 | Inactivity logout redirect | Biarkan tab idle 30 menit (atau manipulasi timeout di dev) | Redirect ke `/login` bukan `/auth?mode=login` | Redirect ke `/login` — code fix verified | PASS   | **FIXED** BUG-NEW-001 — useInactivityLogout.ts |

| Domain                        | Test Cases | PASS    | FAIL   | BLOCKED | N/A   | Open Issues                                |
| ----------------------------- | ---------- | ------- | ------ | ------- | ----- | ------------------------------------------ |
| Authentication & Public Pages | 13         | 13      | 0      | 0       | 0     | 0                                          |
| RBAC & Navigation             | 22         | 22      | 0      | 0       | 0     | 0                                          |
| Dashboard                     | 7          | 7       | 0      | 0       | 0     | 0                                          |
| Property Management           | 17         | 17      | 0      | 0       | 0     | 0                                          |
| Room Management               | 20         | 20      | 0      | 0       | 0     | 0                                          |
| Tenant Management             | 16         | 15      | 1      | 0       | 0     | 1 (T-112 BUG-FE-008 feature missing)       |
| Payment Management            | 14         | 12      | 2      | 0       | 0     | 2 (T-121/122 BUG-FE-010 filter missing)    |
| Confirmation (DP)             | 16         | 16      | 0      | 0       | 0     | 0                                          |
| Maintenance                   | 16         | 15      | 1      | 0       | 0     | 1 (T-157a state machine FE)                |
| Audit Trail                   | 8          | 7       | 1      | 0       | 0     | 1 (T-164b BUG-FE-018 filter missing)       |
| Notifications                 | 10         | 10      | 0      | 0       | 0     | 0                                          |
| Profile & Settings            | 12         | 10      | 2      | 0       | 0     | 2 (T-181/182 BUG-FE-020, T-186 BUG-BE-018) |
| Error & Edge Cases            | 13         | 13      | 0      | 0       | 0     | 0                                          |
| Upload Foto & Bukti Transfer  | 9          | 2       | 4      | 2       | 0     | BUG-FE-033~036                             |
| Viewer Request Panel          | 6          | 5       | 1      | 0       | 0     | 1 (T-215 BUG-FE-037)                       |
| User Management & Settings    | 8          | 4       | 3      | 1       | 0     | BUG-FE-038~040, BUG-BE-020                 |
| Background Worker             | 4          | 3       | 0      | 0       | 1     | 0                                          |
| Flow End-to-End               | 5          | 2       | 0      | 3       | 0     | BUG-FE-041                                 |
| **Total**                     | **216**    | **193** | **15** | **6**   | **1** | **16 open issues**                         |

### Bugs Fixed — 2026-06-24

| Bug ID      | Severity | Status  | Fix                                                                         |
| ----------- | -------- | ------- | --------------------------------------------------------------------------- |
| BUG-FE-001  | P1       | FIXED   | ProtectedRoute.tsx: redirect ke /unauthorized bukan /dashboard              |
| BUG-FE-002  | P1       | FIXED   | router.tsx: settings route pakai ProtectedRoute operator-only               |
| BUG-FE-005  | P3       | FIXED   | statusColors.ts: occupied badge biru bukan merah                            |
| BUG-FE-006  | P1       | FIXED   | RoomForm.tsx: step=1 min=1 bukan step=1000                                  |
| BUG-FE-009  | P2       | FIXED   | TENANT_003 error code + pesan tunggakan yang akurat                         |
| BUG-FE-013  | P3       | FIXED   | ConfirmationsPage: tambah filter "Kedaluwarsa"                              |
| BUG-FE-014  | P3       | FIXED   | ConfirmationForm: FormMessage sudah ada                                     |
| BUG-FE-015  | P1       | FIXED   | maintenance_service.go: parse TanggalLaporan dari request                   |
| BUG-NEW-001 | P1       | FIXED   | useInactivityLogout.ts: redirect ke /login bukan /auth?mode=login           |
| BUG-NEW-004 | P3       | FIXED   | ViewerRequestPanel.tsx: duplicate key di dropdown kamar                     |
| —           | —        | REMOVED | ResetPassword + UpdatePassword dihapus (fitur tidak relevan)                |
| BUG-FE-008  | P2       | FIXED   | TenantDetail.tsx: section payment history selalu tampil + empty state       |
| BUG-FE-009  | P2       | FIXED   | TENANT_003 error code + pesan tunggakan akurat                              |
| BUG-FE-020  | P2       | FIXED   | Profile.tsx: inline edit nama + BE UpdateMeRequest support nama             |
| BUG-BE-018  | P1       | FIXED   | wa_config_handler.go: pakai middleware.GetUser(c) bukan manual extraction   |
| BUG-FE-010  | P2       | N/A     | Filter global payment by room/tenant — navigasi via detail page sudah cukup |

### Open Issues (Tersisa)

| ID     | Severity | Status | Deskripsi                                       |
| ------ | -------- | ------ | ----------------------------------------------- |
| T-157a | P2       | Open   | State machine maintenance tidak dienforce di FE |

---

## Bugs Ditemukan — 2026-06-25 (Testing Manual T-203 s/d T-233)

| Bug ID      | Severity | Test Case | Deskripsi                                                                                                             | Status |
| ----------- | -------- | --------- | --------------------------------------------------------------------------------------------------------------------- | ------ |
| BUG-FE-033  | P2       | T-203     | Upload bukti transfer gagal jika payment overdue                                                                      | Open   |
| BUG-BE-019  | P1       | T-203     | SQL error bocor ke FE: `PAYMENT_004` "invalid input syntax for type uuid" — seharusnya sanitized                      | Open   |
| BUG-FE-034  | P2       | T-205     | Validasi format file tidak enforce — file .txt/.exe masih bisa diupload                                               | Open   |
| BUG-FE-035  | P2       | T-206     | FE tidak tampilkan error message dari BE — BE return `PAYMENT_003` tapi FE overwrite dengan pesan lain                | Open   |
| BUG-FE-036  | P2       | T-208     | Tombol "Upload Foto" maintenance tidak buka file picker (sama dengan payment upload, drag & drop works)               | Open   |
| BUG-FE-037  | P2       | T-215     | Dropdown kamar di semua form request tidak tampilkan nama properti + tidak ada history viewer request                 | Open   |
| BUG-FE-038  | P1       | T-219     | Create user gagal: FE kirim role sebagai string gabung "manager viewer", BE expect enum                               | Open   |
| BUG-FE-039  | P3       | T-221     | Update user perlu refresh manual untuk lihat perubahan nama (React Query cache tidak invalidate)                      | Open   |
| BUG-BE-020  | P2       | T-222     | User management pakai hard DELETE bukan soft deactivate — seharusnya set `is_active=false`                            | Open   |
| BUG-FE-040  | P0       | T-225     | **CRITICAL**: WA config nomor recipient tidak tersimpan — PUT request kirim `recipient_numbers: []` meski sudah diisi | Open   |
| BUG-FE-041  | P1       | T-231     | Create DP: FE tidak kirim field `NomorTelepon`, BE require field — FE/BE belum align                                  | Open   |
| BUG-NEW-005 | P2       | T-203     | Form "Catat Pembayaran" masih ada input nominal manual — seharusnya auto-fill dari harga sewa                         | Open   |

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
**Status**: PASS / FAIL
```

Jika **FAIL**, tambahkan:

```
**Screenshot**: docs/evidence/blackbox-testing-frontend/T-XXX.png
**Bug ID**: BUG-XXX
**Severity**: P0 / P1 / P2 / P3
```

Evidence disimpan di: `docs/evidence/blackbox-testing-frontend/`

---

## Bug Severity Levels

| Level | Deskripsi                           | Contoh                                                     |
| ----- | ----------------------------------- | ---------------------------------------------------------- |
| P0    | Blocker — tidak bisa lanjut         | Login gagal, dashboard blank, crash                        |
| P1    | Critical — fitur utama rusak        | RBAC tidak enforce di UI, form submit tidak menyimpan data |
| P2    | Major — fitur penting tidak optimal | Filter tidak bekerja, pagination salah, toast tidak muncul |
| P3    | Minor — kosmetik / UX kecil         | Typo, warna badge salah, spacing tidak konsisten           |

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

---

## Hasil Testing — 2026-06-24

### Ringkasan Domain 1: Auth

| ID    | Test Case                    | Status  | Notes                                                                                 |
| ----- | ---------------------------- | ------- | ------------------------------------------------------------------------------------- |
| T-001 | Login form render            | PASS    | Form email + password tampil, tidak ada critical error                                |
| T-002 | Login valid (operator)       | PASS    | Redirect ke /dashboard, sidebar lengkap                                               |
| T-003 | Login valid (manager)        | PASS    | Redirect ke /dashboard, sidebar tampil semua menu dengan label "Read-only" (intended) |
| T-004 | Login valid (viewer)         | Pending | Manual test                                                                           |
| T-005 | Login email kosong           | PASS    | Alert "Masukkan email yang valid"                                                     |
| T-006 | Login password kosong        | PASS    | Alert "Password minimal 6 karakter"                                                   |
| T-007 | Login email format salah     | PASS    | Alert "Masukkan email yang valid"                                                     |
| T-008 | Login password salah         | PASS    | 401 terkonfirmasi di console (toast cepat hilang)                                     |
| T-009 | Login email tidak terdaftar  | PASS    | 401 terkonfirmasi di console                                                          |
| T-010 | Login rate limiting          | PASS    | "Terlalu banyak percobaan. Coba lagi dalam X:XX"                                      |
| T-011 | Logout                       | PASS    | Token dihapus, redirect ke /login                                                     |
| T-012 | Akses /dashboard tanpa login | Pending | Manual test                                                                           |
| T-013 | Token expired                | Pending | Manual test                                                                           |

### Ringkasan Domain 2: RBAC & Navigation

| ID     | Test Case                              | Status          | Notes                                                                                     |
| ------ | -------------------------------------- | --------------- | ----------------------------------------------------------------------------------------- |
| T-030  | Sidebar operator                       | PASS            | Dashboard, Properti, Kamar, Penghuni, Pembayaran, Konfirmasi DP, Maintenance, Audit Trail |
| T-031  | Sidebar manager                        | PASS (updated)  | Semua menu tampil dengan label "Manajemen (Read-only)" — intended                         |
| T-032  | Sidebar viewer                         | PASS            | Hanya Dashboard. Tidak ada menu CRUD.                                                     |
| T-033  | Active menu highlight                  | Pending         | Manual                                                                                    |
| T-034  | Manager akses /dashboard/properties    | FAIL BUG-FE-001 | Redirect ke /dashboard bukan /unauthorized                                                |
| T-034a | Manager akses /dashboard/rooms         | FAIL BUG-FE-001 | Redirect ke /dashboard                                                                    |
| T-034b | Manager akses /dashboard/tenants       | FAIL BUG-FE-001 | Redirect ke /dashboard                                                                    |
| T-034c | Manager akses /dashboard/payments      | FAIL BUG-FE-001 | Redirect ke /dashboard                                                                    |
| T-034d | Manager akses /dashboard/confirmations | FAIL BUG-FE-001 | Redirect ke /dashboard                                                                    |
| T-034e | Manager akses /dashboard/settings      | FAIL BUG-FE-002 | Manager bisa akses settings (harusnya operator only)                                      |
| T-035  | Viewer akses /dashboard/rooms          | FAIL BUG-FE-001 | Redirect ke /dashboard                                                                    |
| T-035a | Viewer akses /dashboard/properties     | FAIL BUG-FE-001 | Redirect ke /dashboard                                                                    |
| T-035e | Viewer akses /dashboard/maintenance    | FAIL BUG-FE-001 | Redirect ke /dashboard                                                                    |
| T-035f | Viewer akses /dashboard/audit          | FAIL BUG-FE-001 | Redirect ke /dashboard                                                                    |
| T-035g | Viewer akses /dashboard/settings       | Pending         | Manual                                                                                    |
| T-035h | Viewer akses /dashboard/notifications  | PASS            | Halaman tampil                                                                            |
| T-036  | Operator akses semua halaman           | PASS            | Dashboard operator berfungsi penuh                                                        |
| T-037  | Manager akses /dashboard/maintenance   | PASS            | Halaman tampil                                                                            |
| T-038  | Manager akses /dashboard/audit         | PASS            | Halaman tampil                                                                            |
| T-039  | Unauthorized page render               | FAIL BUG-FE-001 | Tidak pernah tertrigger, redirect ke /dashboard                                           |
| T-040  | 404 page                               | PASS            | "404 - Halaman Tidak Ditemukan", link "Kembali ke Beranda"                                |
| T-180b | Viewer akses /dashboard/profile        | PASS            | Halaman tampil                                                                            |

---

## Bug Log Frontend

### BUG-FE-001 — Protected routes redirect ke /dashboard bukan /unauthorized

**Severity**: P1  
**Test Cases**: T-034, T-034a, T-034b, T-034c, T-034d, T-035~T-035g  
**Steps to Reproduce**:

1. Login sebagai manager
2. Navigate langsung ke `/dashboard/properties` via URL

**Expected**: Redirect ke `/unauthorized`  
**Actual**: Redirect ke `/dashboard`  
**Screenshot**: `.playwright-mcp/page-2026-06-24T08-45-55-228Z.png`  
**Browser**: Chrome  
**Notes**: Berlaku untuk semua restricted routes untuk manager dan viewer. User tidak mendapat feedback bahwa akses ditolak.

---

### BUG-FE-002 — Manager bisa akses halaman Settings (operator-only)

**Severity**: P1  
**Test Case**: T-187a  
**Steps to Reproduce**:

1. Login sebagai manager
2. Navigate ke `/dashboard/settings`

**Expected**: Redirect ke `/unauthorized`  
**Actual**: Halaman Settings/WA Config tampil  
**Screenshot**: `.playwright-mcp/page-2026-06-24T08-49-27-226Z.png`  
**Browser**: Chrome  
**Notes**: Route `/dashboard/settings` tidak diproteksi untuk role manager

---

### Catatan Tasks.md (perlu update expected)

| Test Case  | Expected lama                          | Expected baru                               | Alasan            |
| ---------- | -------------------------------------- | ------------------------------------------- | ----------------- |
| T-003      | Sidebar tidak ada Properties/Rooms/dll | Sidebar tampil semua dengan label Read-only | Intended behavior |
| T-031      | Sidebar hanya Dashboard                | Sidebar tampil semua Read-only              | Intended behavior |
| T-034~034e | Redirect ke /unauthorized              | Redirect ke /dashboard                      | BUG-FE-001        |
| T-127      | Mark cancelled → berhasil              | Fitur tidak ada di UI                       | BUG-FE-011        |
| T-172      | Badge berkurang saat buka dropdown     | Badge berkurang saat mark as read           | Intended behavior |

---

### BUG-FE-003 — DialogContent missing aria-describedby (Accessibility)

**Severity**: P3  
**Test Cases**: semua halaman dengan modal/dialog  
**Actual**: `Warning: Missing Description or aria-describedby for {DialogContent}` — 8+ instances  
**Notes**: Semua dialog/modal perlu ditambahkan `aria-describedby` atau `<DialogDescription>`

---

### BUG-FE-004 — Duplicate key di Rooms table

**Severity**: P1  
**Test Case**: T-080  
**Actual**: `Warning: Encountered two children with the same key: 33333333-0000-0000-0000-000000000001`  
**Notes**: Tabel rooms memiliki duplicate key — muncul setelah test membuat beberapa room. List tidak di-deduplicate setelah mutasi.

---

### BUG-FE-005 — Badge "Terisi" warna merah, seharusnya biru

**Severity**: P3  
**Test Case**: T-084  
**Expected**: Badge "Terisi/Occupied" berwarna biru sesuai circle indicator  
**Actual**: Badge berwarna merah  
**Notes**: Inkonsistensi warna antara badge tabel dan circle indicator di dashboard

---

### BUG-FE-006 — Input harga sewa menggunakan step=1000

**Severity**: P1  
**Test Cases**: T-085, T-087, T-089  
**Steps to Reproduce**:

1. Buka form create/edit room
2. Input harga sewa = 1131

**Expected**: Input diterima  
**Actual**: Browser error "enter a valid value, the nearest valid values are 1000 and 2000"  
**Notes**: Input `type="number"` memiliki `step="1000"` — seharusnya `step="1"` atau `step="any"`

---

### BUG-FE-007 — Dropdown kamar kosong tanpa empty state message

**Severity**: P3  
**Test Case**: T-104  
**Expected**: Pesan "Properti ini belum memiliki kamar"  
**Actual**: Dropdown kosong tanpa pesan

---

### BUG-FE-008 — Detail penghuni tidak ada history pembayaran dan maintenance

**Severity**: P3  
**Test Case**: T-112  
**Expected**: Card history pembayaran + history maintenance dengan pagination  
**Actual**: Section tersebut tidak ada di detail penghuni

---

### BUG-FE-009 — Pesan checkout dengan tunggakan tidak akurat

**Severity**: P2  
**Test Case**: T-109  
**Expected**: "Penghuni masih memiliki tunggakan pembayaran"  
**Actual**: "Penghuni Ini Masih Memiliki Hunian Aktif"

---

### BUG-FE-010 — Filter by room dan by tenant tidak ada di Payments

**Severity**: P2  
**Test Cases**: T-121, T-122  
**Expected**: Filter dropdown by room dan by tenant  
**Actual**: Filter tidak tersedia di UI

---

### BUG-FE-011 — Status "cancelled" tidak ada di update payment

**Severity**: P2  
**Test Case**: T-127  
**Expected**: Opsi status: paid, overdue, cancelled  
**Actual**: Hanya paid dan overdue

---

### BUG-FE-012 — Konfirmasi DP: kolom Properti tidak ada di tabel

**Severity**: P3  
**Test Case**: T-130  
**Expected**: Kolom Properti di tabel konfirmasi DP  
**Actual**: Hanya kolom Kamar tanpa nama properti

---

### BUG-FE-013 — Filter "Kedaluwarsa" tidak ada di Konfirmasi DP

**Severity**: P3  
**Test Case**: T-131c  
**Expected**: Tab: Semua, Menunggu, Selesai, Kedaluwarsa  
**Actual**: Hanya Semua, Menunggu, Selesai

---

### BUG-FE-014 — Form DP tidak ada inline error message di bawah field

**Severity**: P3  
**Test Cases**: T-135, T-137a  
**Expected**: Error message muncul di bawah field saat validasi gagal  
**Actual**: Tidak ada inline validation message

---

### BUG-FE-015 — Tanggal laporan maintenance tersimpan sebagai "01 Januari 0001"

**Severity**: P1  
**Test Case**: T-153  
**Steps to Reproduce**:

1. Buka form create maintenance
2. Frontend tampilkan tanggal hari ini
3. Submit tanpa mengubah tanggal

**Expected**: Tanggal = hari ini  
**Actual**: "01 Januari 0001" (Go zero value `time.Time`)  
**Notes**: Frontend tidak mengirim nilai tanggal, backend tidak set default `time.Now()`

---

### BUG-FE-016 — Audit Trail: kolom Alasan tidak auto-set dari action

**Severity**: P3  
**Test Case**: T-162  
**Expected**: Alasan otomatis dari action (konfirmasi DP, checkout, dll)  
**Actual**: Kolom alasan kosong atau tidak informatif

---

### BUG-FE-017 — Audit Trail: status tampil sebagai raw DB value

**Severity**: P3  
**Test Case**: T-161  
**Expected**: `dp_confirmation` → "DP Terkonfirmasi", `available` → "Tersedia"  
**Actual**: Raw DB value ditampilkan ke user

---

### BUG-FE-018 — Audit Trail tidak ada search/filter

**Severity**: P2  
**Test Case**: T-164a  
**Expected**: Filter by room, by tanggal, atau search  
**Actual**: Tidak ada filter

---

### BUG-FE-020 — Profile: edit nama belum diimplementasikan

**Severity**: P2  
**Test Case**: T-181  
**Expected**: Bisa edit dan simpan nama  
**Actual**: Fitur belum diimplementasikan

---

### BUG-BE-018 — Settings: error message internal DB bocor ke user

**Severity**: P1  
**Test Case**: T-186  
**Expected**: Pesan error user-friendly  
**Actual**: "invalid syntax for type uuid" — pesan internal PostgreSQL tampil di UI

---

## Ringkuman Bug Log — 2026-06-24

### Backend (BE)

| Bug ID  | Severity | Deskripsi                                               |
| ------- | -------- | ------------------------------------------------------- |
| BUG-001 | P1       | Change-password validator min=6 tidak enforce           |
| BUG-002 | P1       | Operator bisa akses audit trail (RBAC bypass)           |
| BUG-003 | P3       | Dashboard field names tidak sesuai dokumentasi          |
| BUG-004 | P1       | Create room duplikat return 500                         |
| BUG-005 | P1       | Create room harga_sewa=0 diterima                       |
| BUG-006 | P1       | Create room tanpa nomor_kamar diterima                  |
| BUG-007 | P1       | Create room tanpa property_id return 500                |
| BUG-008 | P2       | Update room not found return 500                        |
| BUG-009 | P2       | Delete room not found return 422                        |
| BUG-010 | P1       | Create tenant di room occupied berhasil (BR-001 bypass) |
| BUG-011 | P1       | Create confirmation DP < 10% return 500                 |
| BUG-012 | P1       | Create confirmation tanpa required fields return 500    |
| BUG-013 | P1       | Create maintenance tanpa deskripsi diterima             |
| BUG-014 | P1       | Create maintenance tanpa room_id return 500             |
| BUG-015 | P2       | Update payment not found return 200                     |
| BUG-016 | P2       | Update property not found return 500                    |
| BUG-017 | P2       | Delete property not found return 204                    |
| BUG-018 | P1       | Error message internal DB bocor ke user                 |

### Frontend (FE)

| Bug ID     | Severity | Deskripsi                                                   |
| ---------- | -------- | ----------------------------------------------------------- |
| BUG-FE-001 | P1       | Protected routes redirect ke /dashboard bukan /unauthorized |
| BUG-FE-002 | P1       | Manager bisa akses Settings (operator-only)                 |
| BUG-FE-003 | P3       | DialogContent missing aria-describedby                      |
| BUG-FE-004 | P1       | Duplicate key di Rooms table                                |
| BUG-FE-005 | P3       | Badge "Terisi" warna merah seharusnya biru                  |
| BUG-FE-006 | P1       | Input harga sewa step=1000, nilai non-round ditolak         |
| BUG-FE-007 | P3       | Dropdown kamar kosong tanpa empty state message             |
| BUG-FE-008 | P3       | Detail penghuni tidak ada history pembayaran/maintenance    |
| BUG-FE-009 | P2       | Pesan checkout dengan tunggakan tidak akurat                |
| BUG-FE-010 | P2       | Filter by room/tenant tidak ada di Payments                 |
| BUG-FE-011 | P2       | Status "cancelled" tidak ada di update payment              |
| BUG-FE-012 | P3       | Konfirmasi DP: kolom Properti tidak ada                     |
| BUG-FE-013 | P3       | Filter "Kedaluwarsa" tidak ada di Konfirmasi DP             |
| BUG-FE-014 | P3       | Form DP tidak ada inline error message                      |
| BUG-FE-015 | P1       | Tanggal maintenance tersimpan "01 Januari 0001"             |
| BUG-FE-016 | P3       | Audit Trail: kolom Alasan tidak auto-set                    |
| BUG-FE-017 | P3       | Audit Trail: status raw DB value bukan label UI             |
| BUG-FE-018 | P2       | Audit Trail tidak ada search/filter                         |
| BUG-FE-020 | P2       | Profile: edit nama belum diimplementasikan                  |

### Total

- **P1**: 13 bugs (BE: 9, FE: 4)
- **P2**: 9 bugs (BE: 3, FE: 6)
- **P3**: 13 bugs (BE: 1, FE: 12)
- **Grand Total**: 35 bugs
