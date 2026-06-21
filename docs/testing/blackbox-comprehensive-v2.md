# Black Box Testing Report — SiHuni v1.0 (Comprehensive)

**Nama Sistem:** SiHuni (Sistem Informasi Manajemen Kos Multi-Properti)  
**Versi:** 1.0  
**Tanggal Pengujian:** 22 Juni 2026  
**Penguji:** Automated (Playwright) + Manual  
**URL Sistem:** https://sihuni-frontend.vercel.app  
**API Backend:** https://api-production-b4c5.up.railway.app/api/v1  
**GitHub Issue:** [#80](https://github.com/itsramaa/Sistem-Hunian/issues/80)

---

## Ringkasan Eksekutif

Pengujian black box ini mencakup **seluruh halaman dan fungsionalitas** sistem SiHuni dengan tiga role pengguna (Operator, Manager, Viewer) sesuai spesifikasi SRS. Testing dilakukan menggunakan **Playwright** untuk automated E2E tests dan manual testing untuk validasi UX.

**Cakupan Testing:**

- ✅ Authentication & Route Guard (11 test cases)
- ✅ Dashboard (9 test cases)
- ✅ RBAC - Role-Based Access Control (10 test cases)
- ✅ Manajemen Properti (7 test cases)
- ✅ Manajemen Kamar (9 test cases)
- ✅ Manajemen Penghuni (7 test cases)
- ✅ Manajemen Pembayaran (10 test cases)
- ✅ Konfirmasi DP (8 test cases)
- ✅ Manajemen Maintenance (7 test cases)
- ✅ Notifikasi (4 test cases)
- ✅ Profil & Settings (3 test cases)
- ✅ Audit Trail (2 test cases)
- ✅ UX & Responsivitas (9 test cases)
- ✅ Performance - PageSpeed (7 test cases)
- ✅ SUS Testing (4 test cases)

**Total: 107 Acceptance Criteria**

---

## Credentials Uji

| Role         | Email               | Password  | Status    |
| ------------ | ------------------- | --------- | --------- |
| **Operator** | operator@sihuni.dev | sihuni123 | ✅ Active |
| **Manager**  | manager@sihuni.dev  | sihuni123 | ✅ Active |
| **Viewer**   | viewer@sihuni.dev   | sihuni123 | ✅ Active |

_Credentials diverifikasi dari database Neon PostgreSQL._

---

## 1. Authentication & Route Guard

### Test Cases

| ID             | Skenario                                  | Expected Output                             | Status | Screenshot                            |
| -------------- | ----------------------------------------- | ------------------------------------------- | ------ | ------------------------------------- |
| **AC-AUTH-01** | Login valid dengan credentials Operator   | Redirect ke `/dashboard`                    | ☐      | `e2e-auth-login-success-operator.png` |
| **AC-AUTH-02** | Login valid dengan credentials Manager    | Redirect ke `/dashboard`                    | ☐      | `e2e-auth-login-success-manager.png`  |
| **AC-AUTH-03** | Login valid dengan credentials Viewer     | Redirect ke `/dashboard`                    | ☐      | `e2e-auth-login-success-viewer.png`   |
| **AC-AUTH-04** | Login dengan password salah               | Pesan error inline, halaman tidak berpindah | ☐      | `e2e-auth-login-error.png`            |
| **AC-AUTH-05** | Login dengan email tidak terdaftar        | Pesan error inline                          | ☐      | `e2e-auth-login-notfound.png`         |
| **AC-AUTH-06** | Submit form login kosong                  | Validasi client-side Zod aktif              | ☐      | `e2e-auth-login-empty-validation.png` |
| **AC-AUTH-07** | Akses `/dashboard` tanpa token            | Redirect ke `/login`                        | ☐      | `e2e-auth-guard-dashboard.png`        |
| **AC-AUTH-08** | Akses `/dashboard/properties` tanpa token | Redirect ke `/login`                        | ☐      | `e2e-auth-guard-properties.png`       |
| **AC-AUTH-09** | Logout berhasil                           | Token dihapus, redirect ke `/login`         | ☐      | -                                     |
| **AC-AUTH-10** | Reset password page accessible            | Halaman `/reset-password` tampil            | ☐      | `e2e-auth-reset-password.png`         |
| **AC-AUTH-11** | Update password page accessible           | Halaman `/update-password` tampil           | ☐      | `e2e-auth-update-password.png`        |

### Acceptance Criteria Detail

**AC-AUTH-01 ~ 03: Login Valid Semua Role**

- **Prasyarat:** Sistem dapat diakses, semua akun aktif di database
- **Langkah:**
  1. Buka halaman `/login`
  2. Isi field email dan password sesuai role
  3. Klik tombol "Masuk"
- **Expected:** JWT token tersimpan, redirect ke `/dashboard` dalam < 5 detik
- **Actual:** _[diisi setelah testing]_

**AC-AUTH-04 ~ 05: Login Invalid**

- **Prasyarat:** Sistem dapat diakses
- **Langkah:**
  1. Buka halaman `/login`
  2. Isi dengan credentials salah (password salah atau email tidak terdaftar)
  3. Klik tombol "Masuk"
- **Expected:** Pesan error inline muncul (toast/alert), halaman tetap di `/login`, password field tidak di-clear
- **Actual:** _[diisi setelah testing]_

**AC-AUTH-06: Validasi Client-Side**

- **Prasyarat:** Sistem dapat diakses
- **Langkah:**
  1. Buka halaman `/login`
  2. Kosongkan semua field
  3. Klik tombol "Masuk"
- **Expected:** Validasi Zod aktif, highlight field kosong dengan pesan error, tidak ada request ke API
- **Actual:** _[diisi setelah testing]_

**AC-AUTH-07 ~ 08: Route Guard**

- **Prasyarat:** User belum login (tidak ada token)
- **Langkah:**
  1. Akses langsung ke URL `/dashboard` atau `/dashboard/properties`
- **Expected:** Redirect otomatis ke `/login`
- **Actual:** _[diisi setelah testing]_

**AC-AUTH-09: Logout**

- **Prasyarat:** User sudah login
- **Langkah:**
  1. Klik menu user di sidebar/navbar
  2. Klik "Logout"
- **Expected:** Token dihapus dari storage, redirect ke `/login`
- **Actual:** _[diisi setelah testing]_

---

## 2. Dashboard (Semua Role)

### Test Cases

| ID             | Skenario                       | Expected Output                                | Status | Screenshot                           |
| -------------- | ------------------------------ | ---------------------------------------------- | ------ | ------------------------------------ |
| **AC-DASH-01** | Operator: Summary cards tampil | Total Properti, kamar, tersedia, terisi, DP    | ☐      | `e2e-dashboard-operator-desktop.png` |
| **AC-DASH-02** | Operator: Alert panel tampil   | DP expired & pembayaran terlambat              | ☐      | -                                    |
| **AC-DASH-03** | Operator: Notification panel   | Toggle unread/all berfungsi                    | ☐      | -                                    |
| **AC-DASH-04** | Manager: Summary + Alert       | Tanpa notification panel                       | ☐      | `e2e-dashboard-manager-desktop.png`  |
| **AC-DASH-05** | Viewer: Hanya summary cards    | Tanpa alert & notification panel               | ☐      | `e2e-dashboard-viewer-desktop.png`   |
| **AC-DASH-06** | Angka summary cards akurat     | Berubah setelah checkout/confirm DP            | ☐      | -                                    |
| **AC-DASH-07** | Dark mode readable             | Semua teks kontras, tidak ada elemen invisible | ☐      | `e2e-dashboard-operator-dark.png`    |
| **AC-DASH-08** | Light mode readable            | Semua teks kontras, tidak ada elemen invisible | ☐      | `e2e-dashboard-operator-light.png`   |
| **AC-DASH-09** | Mobile responsive (375px)      | Layout tidak overflow horizontal               | ☐      | `e2e-dashboard-operator-mobile.png`  |

### Acceptance Criteria Detail

**AC-DASH-01: Summary Cards**

- **Komponen:** 5 kartu statistik
  - Total Properti (jumlah properti terdaftar)
  - Total Kamar (jumlah kamar dari semua properti)
  - Tersedia (kamar status `available` - hijau)
  - Terisi (kamar status `occupied` - biru)
  - Konfirmasi DP (kamar status `dp_confirmation` - kuning)
- **Data Source:** API `/dashboard/summary`
- **Expected:** Semua kartu tampil dengan angka akurat

**AC-DASH-02: Alert Panel**

- **Kondisi Trigger:**
  - DP mendekati expired (≤ 3 hari) → warning kuning
  - DP sudah expired → danger merah
  - Pembayaran mendekati jatuh tempo (≤ 3 hari) → warning kuning
  - Pembayaran terlambat → danger merah
- **Expected:** Alert hanya tampil jika ada kondisi trigger aktif

**AC-DASH-03: Notification Panel**

- **Fitur:**
  - Daftar notifikasi dari background worker
  - Toggle: unread only / semua notifikasi
  - Mark as read functionality
- **Expected:** Panel tampil, toggle berfungsi, mark as read berfungsi

**AC-DASH-04 ~ 05: Role-Based Dashboard**

- **Manager:** Summary cards + Alert panel (read-only), tanpa notification panel
- **Viewer:** Hanya summary cards, tanpa alert panel dan notification panel
- **Expected:** Komponen sesuai role, tidak ada menu/fitur di luar kewenangan

**AC-DASH-06: Akurasi Data**

- **Test:** Lakukan checkout penghuni (kamar occupied → available)
- **Expected:** Angka "Terisi" berkurang 1, "Tersedia" bertambah 1 setelah refresh

**AC-DASH-07 ~ 08: Theme Support**

- **Dark Mode:** Background gelap, teks terang, contrast ratio ≥ 4.5:1
- **Light Mode:** Background terang, teks gelap, contrast ratio ≥ 4.5:1
- **Expected:** Tidak ada teks invisible, semua elemen readable

**AC-DASH-09: Mobile Responsive**

- **Viewport:** 375×812 (iPhone 13)
- **Expected:** Tidak ada horizontal scroll, layout proporsional

---

## 3. RBAC - Role-Based Access Control

### Test Cases

| ID             | Skenario                                 | Expected Output             | Status | Screenshot                                 |
| -------------- | ---------------------------------------- | --------------------------- | ------ | ------------------------------------------ |
| **AC-RBAC-01** | Manager akses `/dashboard/properties`    | Redirect/unauthorized       | ☐      | `e2e-rbac-manager-properties.png`          |
| **AC-RBAC-02** | Manager akses `/dashboard/rooms`         | Redirect/unauthorized       | ☐      | `e2e-rbac-manager-rooms.png`               |
| **AC-RBAC-03** | Manager akses `/dashboard/tenants`       | Redirect/unauthorized       | ☐      | `e2e-rbac-manager-tenants.png`             |
| **AC-RBAC-04** | Manager akses `/dashboard/payments`      | Redirect/unauthorized       | ☐      | `e2e-rbac-manager-payments.png`            |
| **AC-RBAC-05** | Manager akses `/dashboard/confirmations` | Redirect/unauthorized       | ☐      | `e2e-rbac-manager-confirmations.png`       |
| **AC-RBAC-06** | Manager akses `/dashboard/maintenance`   | ✅ Allowed                  | ☐      | `e2e-rbac-manager-maintenance-allowed.png` |
| **AC-RBAC-07** | Viewer akses `/dashboard/properties`     | Redirect/unauthorized       | ☐      | `e2e-rbac-viewer-properties.png`           |
| **AC-RBAC-08** | Viewer akses `/dashboard/maintenance`    | Redirect/unauthorized       | ☐      | `e2e-rbac-viewer-maintenance.png`          |
| **AC-RBAC-09** | Viewer sidebar                           | Hanya menu Dashboard tampil | ☐      | `e2e-rbac-viewer-sidebar.png`              |
| **AC-RBAC-10** | Operator sidebar                         | Semua menu tampil           | ☐      | `e2e-rbac-operator-sidebar.png`            |

### Access Matrix

| Route                      | Operator | Manager | Viewer |
| -------------------------- | -------- | ------- | ------ |
| `/dashboard`               | ✅       | ✅      | ✅     |
| `/dashboard/properties`    | ✅       | ❌      | ❌     |
| `/dashboard/rooms`         | ✅       | ❌      | ❌     |
| `/dashboard/tenants`       | ✅       | ❌      | ❌     |
| `/dashboard/payments`      | ✅       | ❌      | ❌     |
| `/dashboard/confirmations` | ✅       | ❌      | ❌     |
| `/dashboard/maintenance`   | ✅       | ✅      | ❌     |
| `/dashboard/audit`         | ✅       | ✅      | ❌     |
| `/dashboard/notifications` | ✅       | ✅      | ✅     |
| `/dashboard/profile`       | ✅       | ✅      | ✅     |
| `/dashboard/settings`      | ✅       | ✅      | ✅     |

### Acceptance Criteria Detail

**AC-RBAC-01 ~ 05: Manager Restrictions**

- **Test:** Login sebagai Manager, akses URL langsung
- **Expected:** Redirect ke `/unauthorized` atau `/dashboard` dengan pesan error
- **Implementation:** `ProtectedRoute` component checks `allowedRoles`

**AC-RBAC-06: Manager Maintenance Access**

- **Test:** Login sebagai Manager, akses `/dashboard/maintenance`
- **Expected:** Halaman maintenance tampil, dapat membuat/update laporan

**AC-RBAC-07 ~ 08: Viewer Restrictions**

- **Test:** Login sebagai Viewer, akses URL protected
- **Expected:** Redirect ke `/unauthorized` atau `/dashboard`

**AC-RBAC-09: Viewer Sidebar**

- **Test:** Login sebagai Viewer, periksa sidebar
- **Expected:** Hanya menu "Dashboard" tampil, tidak ada Properties/Rooms/Tenants/Payments/Confirmations/Maintenance

**AC-RBAC-10: Operator Full Access**

- **Test:** Login sebagai Operator, periksa sidebar
- **Expected:** Semua menu tampil (Dashboard, Properties, Rooms, Tenants, Payments, Confirmations, Maintenance, Audit, Notifications, Profile, Settings)

---

## 4. Manajemen Properti (Operator Only)

### Test Cases

| ID             | Skenario                | Expected Output                                      | Status | Screenshot                    |
| -------------- | ----------------------- | ---------------------------------------------------- | ------ | ----------------------------- |
| **AC-PROP-01** | Daftar properti tampil  | Tabel dengan kolom: nama, alamat, jumlah kamar, aksi | ☐      | `e2e-props-list.png`          |
| **AC-PROP-02** | Tambah properti baru    | Tersimpan, muncul di daftar                          | ☐      | -                             |
| **AC-PROP-03** | Edit properti           | Form terisi nilai saat ini, update berhasil          | ☐      | -                             |
| **AC-PROP-04** | Hapus properti berkamar | Error informatif, properti tidak terhapus            | ☐      | `e2e-props-delete-error.png`  |
| **AC-PROP-05** | Konfirmasi dialog       | Muncul sebelum hapus                                 | ☐      | -                             |
| **AC-PROP-06** | Empty state             | Tampil jika belum ada properti                       | ☐      | `e2e-props-empty-or-list.png` |
| **AC-PROP-07** | Klik properti → detail  | Navigasi ke halaman detail                           | ☐      | `e2e-props-detail.png`        |

### Acceptance Criteria Detail

**AC-PROP-01: Property Table**

- **Kolom:**
  - Nama Properti
  - Alamat
  - Jumlah Kamar
  - Aksi (Edit, Hapus, Detail)
- **Expected:** Tabel tampil dengan data dari API `/properties`

**AC-PROP-02: Create Property**

- **Input:**
  - Nama (required)
  - Alamat (required)
  - Deskripsi (optional)
- **Expected:** Toast success, properti baru muncul di tabel, TanStack Query invalidate

**AC-PROP-03: Edit Property**

- **Test:** Klik edit pada baris properti
- **Expected:** Modal/drawer terbuka dengan form terisi nilai saat ini, update berhasil

**AC-PROP-04: Delete Property with Rooms**

- **Business Rule:** BR-006 - Properti tidak dapat dihapus jika masih memiliki kamar
- **Test:** Klik hapus pada properti yang masih punya kamar
- **Expected:** Confirm dialog muncul, setelah konfirmasi error toast "Properti masih memiliki X kamar", properti tidak terhapus

**AC-PROP-05: Confirm Dialog**

- **Expected:** Dialog konfirmasi muncul sebelum aksi destruktif (hapus)

**AC-PROP-06: Empty State**

- **Expected:** Komponen `EmptyState` tampil jika belum ada properti

**AC-PROP-07: Property Detail**

- **Test:** Klik link/baris properti
- **Expected:** Navigasi ke `/dashboard/properties/:id`, halaman detail tampil

---

## 5. Manajemen Kamar (Operator Only)

### Test Cases

| ID             | Skenario                    | Expected Output                                          | Status | Screenshot                    |
| -------------- | --------------------------- | -------------------------------------------------------- | ------ | ----------------------------- |
| **AC-ROOM-01** | Daftar kamar tampil         | Tabel dengan kolom: nomor, tipe, harga, penghuni, status | ☐      | `e2e-rooms-list.png`          |
| **AC-ROOM-02** | Status badge warna          | available=hijau, occupied=biru, dp_confirmation=kuning   | ☐      | `e2e-rooms-badges.png`        |
| **AC-ROOM-03** | Filter properti             | Berfungsi                                                | ☐      | `e2e-rooms-filter-prop.png`   |
| **AC-ROOM-04** | Filter status               | Berfungsi                                                | ☐      | `e2e-rooms-filter-status.png` |
| **AC-ROOM-05** | Search nomor kamar          | Berfungsi                                                | ☐      | -                             |
| **AC-ROOM-06** | Nomor kamar duplikat        | Error dari API ditampilkan                               | ☐      | -                             |
| **AC-ROOM-07** | Hapus kamar occupied        | Error ditampilkan, kamar tidak terhapus                  | ☐      | -                             |
| **AC-ROOM-08** | Hapus kamar dp_confirmation | Error ditampilkan                                        | ☐      | -                             |
| **AC-ROOM-09** | Klik kamar → detail         | Navigasi ke halaman detail                               | ☐      | `e2e-rooms-detail.png`        |

### Acceptance Criteria Detail

**AC-ROOM-01: Room Table**

- **Kolom:**
  - Nomor Kamar
  - Tipe Kamar
  - Harga Sewa (format Rupiah)
  - Penghuni Aktif (nama atau "-")
  - Status (badge)
  - Properti
  - Aksi (Edit, Hapus, Detail)
- **Expected:** Tabel tampil dengan pagination, sorting, filter

**AC-ROOM-02: Status Badges**

- **Warna:**
  - `available` → hijau (tersedia)
  - `occupied` → biru (terisi)
  - `dp_confirmation` → kuning (konfirmasi DP)
- **Component:** `StatusBadge` dengan warna konsisten

**AC-ROOM-03 ~ 04: Filters**

- **Filter Properti:** Dropdown/select untuk filter berdasarkan properti
- **Filter Status:** Dropdown untuk filter berdasarkan status kamar
- **Expected:** Tabel ter-filter real-time, TanStack Query invalidate

**AC-ROOM-05: Search**

- **Expected:** Search box untuk mencari berdasarkan nomor kamar

**AC-ROOM-06: Duplicate Room Number**

- **Business Rule:** Nomor kamar harus unik per properti
- **Expected:** API return error, toast menampilkan pesan dari backend

**AC-ROOM-07 ~ 08: Delete Protected Rooms**

- **Business Rule:** BR-007 - Kamar tidak dapat dihapus jika status `occupied` atau `dp_confirmation`
- **Expected:** Error informatif, kamar tidak terhapus

**AC-ROOM-09: Room Detail**

- **Expected:** Navigasi ke `/dashboard/rooms/:id`, halaman detail tampil

---

## 6. Manajemen Penghuni (Operator Only)

### Test Cases

| ID               | Skenario                  | Expected Output                                                          | Status | Screenshot                    |
| ---------------- | ------------------------- | ------------------------------------------------------------------------ | ------ | ----------------------------- |
| **AC-TENANT-01** | Tab Penghuni Aktif tampil | Tabel dengan kolom: nama, kamar, properti, tanggal masuk, durasi, status | ☐      | `e2e-tenants-active-tab.png`  |
| **AC-TENANT-02** | Tab Histori Penghuni      | Tabel histori dengan status checked_out                                  | ☐      | `e2e-tenants-history-tab.png` |
| **AC-TENANT-03** | Dropdown room_id          | Hanya kamar berstatus `available`                                        | ☐      | -                             |
| **AC-TENANT-04** | Tambah penghuni baru      | Tersimpan, muncul di daftar aktif                                        | ☐      | -                             |
| **AC-TENANT-05** | Checkout penghuni         | Status tenant → checked_out, kamar → available                           | ☐      | -                             |
| **AC-TENANT-06** | Setelah checkout          | Penghuni muncul di tab Histori                                           | ☐      | -                             |
| **AC-TENANT-07** | Klik penghuni → detail    | Navigasi ke halaman detail                                               | ☐      | `e2e-tenants-detail.png`      |

### Acceptance Criteria Detail

**AC-TENANT-01 ~ 02: Tabs**

- **Tab 1:** Penghuni Aktif (status = active)
- **Tab 2:** Histori Penghuni (status = checked_out)
- **Expected:** Tab switching berfungsi, data terpisah

**AC-TENANT-03: Available Rooms Dropdown**

- **Business Rule:** BR-001 - Satu kamar hanya boleh memiliki satu penghuni aktif
- **Expected:** Dropdown hanya menampilkan kamar dengan status `available`

**AC-TENANT-04: Create Tenant**

- **Input:**
  - Room ID (dropdown kamar available)
  - Nama (required)
  - Nomor Identitas (required)
  - Nomor Telepon (required)
  - Tanggal Masuk (required)
  - Durasi Sewa (required, bulan)
- **Expected:** Tenant tersimpan, status kamar berubah ke `occupied`

**AC-TENANT-05: Checkout**

- **Business Rule:** BR-005 - Checkout penghuni
- **Input:** Tanggal Keluar
- **Expected:** Status tenant → `checked_out`, status kamar → `available`, data muncul di tab Histori

**AC-TENANT-06: History Tab**

- **Expected:** Setelah checkout, penghuni muncul di tab Histori dengan status `checked_out`

**AC-TENANT-07: Tenant Detail**

- **Expected:** Navigasi ke `/dashboard/tenants/:id`, halaman detail tampil

---

## 7. Manajemen Pembayaran (Operator Only)

### Test Cases

| ID            | Skenario                    | Expected Output                                                              | Status | Screenshot                 |
| ------------- | --------------------------- | ---------------------------------------------------------------------------- | ------ | -------------------------- |
| **AC-PAY-01** | Daftar pembayaran tampil    | Tabel dengan kolom: kamar, penghuni, periode, nominal, tanggal bayar, status | ☐      | `e2e-payments-list.png`    |
| **AC-PAY-02** | Filter properti             | Berfungsi                                                                    | ☐      | `e2e-payments-filters.png` |
| **AC-PAY-03** | Filter periode              | Berfungsi                                                                    | ☐      | -                          |
| **AC-PAY-04** | Filter status               | Berfungsi                                                                    | ☐      | -                          |
| **AC-PAY-05** | Catat pembayaran baru       | Tersimpan, muncul di daftar                                                  | ☐      | -                          |
| **AC-PAY-06** | Upload bukti transfer < 5MB | Berhasil                                                                     | ☐      | -                          |
| **AC-PAY-07** | Upload file > 5MB           | Error 'File maksimal 5MB'                                                    | ☐      | -                          |
| **AC-PAY-08** | Upload format tidak valid   | Error format                                                                 | ☐      | -                          |
| **AC-PAY-09** | Status badge                | lunas=hijau, mendekati jatuh tempo=kuning, terlambat=merah                   | ☐      | `e2e-payments-badges.png`  |
| **AC-PAY-10** | Tandai lunas                | Status berubah ke paid                                                       | ☐      | -                          |

### Acceptance Criteria Detail

**AC-PAY-01: Payment Table**

- **Kolom:**
  - Kamar (nomor + properti)
  - Penghuni (nama)
  - Periode (bulan/tahun)
  - Nominal (format Rupiah)
  - Tanggal Bayar
  - Status (badge)
  - Bukti Transfer (link/preview)
  - Aksi (Detail, Upload Bukti, Tandai Lunas)
- **Expected:** Tabel tampil dengan pagination, sorting, filter

**AC-PAY-02 ~ 04: Filters**

- **Filter Properti:** Dropdown untuk filter berdasarkan properti
- **Filter Periode:** Date picker untuk filter periode pembayaran
- **Filter Status:** Dropdown untuk filter status (lunas, mendekati jatuh tempo, terlambat)
- **Expected:** Tabel ter-filter real-time

**AC-PAY-05: Create Payment**

- **Input:**
  - Room ID (dropdown)
  - Tenant ID (auto-fill dari room)
  - Periode (required)
  - Nominal (required, format Rupiah)
  - Tanggal Bayar (required)
  - Upload Bukti Transfer (optional)
- **Expected:** Pembayaran tersimpan, muncul di tabel

**AC-PAY-06 ~ 08: File Upload**

- **Format yang Diterima:** jpg, jpeg, png, pdf
- **Ukuran Maksimum:** 5 MB
- **Expected:**
  - File valid < 5MB → upload berhasil, preview tampil
  - File > 5MB → error "File maksimal 5MB"
  - Format tidak valid (.exe, .txt) → error format

**AC-PAY-09: Status Badges**

- **Warna:**
  - `paid` (lunas) → hijau
  - Approaching due date (≤ 3 hari) → kuning
  - `overdue` (terlambat) → merah
- **Expected:** Badge tampil dengan warna sesuai status

**AC-PAY-10: Mark as Paid**

- **Test:** Klik "Tandai Lunas" pada baris pembayaran
- **Expected:** Status berubah ke `paid`, badge berubah ke hijau

---

## 8. Konfirmasi DP (Operator Only)

### Test Cases

| ID             | Skenario                    | Expected Output                                                                     | Status | Screenshot                        |
| -------------- | --------------------------- | ----------------------------------------------------------------------------------- | ------ | --------------------------------- |
| **AC-CONF-01** | Daftar konfirmasi tampil    | Tabel dengan kolom: kamar, nama calon, nominal DP, batas tanggal, sisa hari, status | ☐      | `e2e-confirmations-list.png`      |
| **AC-CONF-02** | Dropdown room_id            | Hanya kamar berstatus `available`                                                   | ☐      | -                                 |
| **AC-CONF-03** | Catat DP baru               | Status kamar berubah ke `dp_confirmation`                                           | ☐      | -                                 |
| **AC-CONF-04** | DP kedua pada kamar pending | Error ROOM_003                                                                      | ☐      | -                                 |
| **AC-CONF-05** | Konfirmasi Masuk            | Status → confirmed, kamar → occupied, tenant baru dibuat                            | ☐      | -                                 |
| **AC-CONF-06** | Tandai Hangus               | Status → expired, kamar → available                                                 | ☐      | -                                 |
| **AC-CONF-07** | Badge expired               | Tampil merah                                                                        | ☐      | `e2e-confirmations-expired.png`   |
| **AC-CONF-08** | Countdown sisa hari         | Tampil sebagai "X hari lagi"                                                        | ☐      | `e2e-confirmations-countdown.png` |

### Acceptance Criteria Detail

**AC-CONF-01: Confirmation Table**

- **Kolom:**
  - Kamar (nomor + properti)
  - Nama Calon Penghuni
  - Nominal DP (format Rupiah)
  - Batas Tanggal Konfirmasi
  - Sisa Hari (countdown)
  - Status (badge: pending, confirmed, expired)
  - Aksi (Konfirmasi Masuk, Tandai Hangus)
- **Expected:** Tabel tampil dengan pagination

**AC-CONF-02: Available Rooms Dropdown**

- **Business Rule:** BR-002 - Satu kamar hanya boleh memiliki satu konfirmasi DP aktif
- **Expected:** Dropdown hanya menampilkan kamar dengan status `available`

**AC-CONF-03: Create DP Confirmation**

- **Input:**
  - Room ID (dropdown kamar available)
  - Nama Calon Penghuni (required)
  - Nominal DP (required, format Rupiah)
  - Batas Tanggal Konfirmasi (required)
- **Expected:** Konfirmasi tersimpan, status kamar berubah ke `dp_confirmation`

**AC-CONF-04: Duplicate DP**

- **Business Rule:** BR-003 - DP baru tidak dapat dibuat apabila pada kamar yang sama masih terdapat konfirmasi dengan status `pending`
- **Expected:** API return error ROOM_003, toast menampilkan pesan error

**AC-CONF-05: Confirm Entry**

- **Test:** Klik "Konfirmasi Masuk" pada baris pending
- **Input:**
  - Nama (required)
  - Nomor Identitas (required)
  - Nomor Telepon (required)
  - Tanggal Masuk (required)
  - Durasi Sewa (required)
- **Expected:** Status konfirmasi → `confirmed`, status kamar → `occupied`, tenant baru dibuat dengan status `active`

**AC-CONF-06: Mark as Expired**

- **Test:** Klik "Tandai Hangus" pada baris pending
- **Expected:** Status konfirmasi → `expired`, status kamar → `available`

**AC-CONF-07: Expired Badge**

- **Expected:** Konfirmasi dengan status `expired` tampil badge merah

**AC-CONF-08: Countdown**

- **Expected:** Sisa hari tampil sebagai countdown (misal: "2 hari lagi", "5 hari lagi")

---

## 9. Manajemen Maintenance (Operator + Manager)

### Test Cases

| ID              | Skenario                     | Expected Output                                                        | Status | Screenshot                    |
| --------------- | ---------------------------- | ---------------------------------------------------------------------- | ------ | ----------------------------- |
| **AC-MAINT-01** | Daftar maintenance tampil    | Tabel dengan kolom: kamar, properti, tanggal, deskripsi, biaya, status | ☐      | `e2e-maintenance-list.png`    |
| **AC-MAINT-02** | Filter                       | Berfungsi (properti, kamar, status)                                    | ☐      | `e2e-maintenance-filters.png` |
| **AC-MAINT-03** | Buat laporan baru            | Status awal = reported                                                 | ☐      | -                             |
| **AC-MAINT-04** | Update status ke in_progress | Berhasil                                                               | ☐      | -                             |
| **AC-MAINT-05** | Update status ke completed   | Berhasil                                                               | ☐      | -                             |
| **AC-MAINT-06** | Histori permanen             | Tidak ada aksi hapus                                                   | ☐      | -                             |
| **AC-MAINT-07** | Manager akses                | Manager dapat membuat dan update laporan                               | ☐      | `e2e-maintenance-manager.png` |

### Acceptance Criteria Detail

**AC-MAINT-01: Maintenance Table**

- **Kolom:**
  - Kamar (nomor + properti)
  - Tanggal Laporan
  - Deskripsi Kerusakan
  - Tindakan Penanganan
  - Biaya (format Rupiah)
  - Status (reported, in_progress, completed)
  - Aksi (Update, Detail)
- **Expected:** Tabel tampil dengan pagination, sorting, filter

**AC-MAINT-02: Filters**

- **Filter Properti:** Dropdown untuk filter berdasarkan properti
- **Filter Kamar:** Dropdown untuk filter berdasarkan kamar
- **Filter Status:** Dropdown untuk filter berdasarkan status
- **Expected:** Tabel ter-filter real-time

**AC-MAINT-03: Create Maintenance Report**

- **Input:**
  - Room ID (dropdown)
  - Tanggal Laporan (required)
  - Deskripsi Kerusakan (required, textarea)
- **Expected:** Laporan tersimpan dengan status awal `reported`, biaya = 0, tindakan penanganan = "-"

**AC-MAINT-04 ~ 05: Update Status**

- **Input:**
  - Status (dropdown: reported, in_progress, completed)
  - Tindakan Penanganan (textarea, required saat update)
  - Biaya (number, required saat update)
- **Expected:** Status berubah sesuai input, biaya dan tindakan tersimpan

**AC-MAINT-06: Permanent History**

- **Expected:** Tidak ada tombol "Hapus" pada maintenance, histori bersifat permanen

**AC-MAINT-07: Manager Access**

- **Test:** Login sebagai Manager, akses maintenance
- **Expected:** Manager dapat melihat, membuat, dan update laporan maintenance

---

## 10. Notifikasi

### Test Cases

| ID              | Skenario                   | Expected Output                          | Status | Screenshot                      |
| --------------- | -------------------------- | ---------------------------------------- | ------ | ------------------------------- |
| **AC-NOTIF-01** | NotificationBell di navbar | Badge jumlah unread tampil               | ☐      | `e2e-notifications-bell.png`    |
| **AC-NOTIF-02** | Halaman riwayat notifikasi | Accessible di `/dashboard/notifications` | ☐      | `e2e-notifications-history.png` |
| **AC-NOTIF-03** | Toggle unread/all          | Berfungsi                                | ☐      | `e2e-notifications-toggled.png` |
| **AC-NOTIF-04** | Mark as read               | Berfungsi                                | ☐      | -                               |

### Acceptance Criteria Detail

**AC-NOTIF-01: Notification Bell**

- **Component:** `NotificationBell` di navbar
- **Expected:** Icon bell dengan badge jumlah notifikasi unread

**AC-NOTIF-02: Notification History**

- **Expected:** Halaman riwayat notifikasi accessible di `/dashboard/notifications`

**AC-NOTIF-03: Toggle**

- **Expected:** Toggle untuk menampilkan unread only atau semua notifikasi

**AC-NOTIF-04: Mark as Read**

- **Expected:** Tombol "Tandai sudah dibaca" berfungsi, badge di navbar berkurang

---

## 11. Profil & Settings

### Test Cases

| ID             | Skenario              | Expected Output               | Status | Screenshot              |
| -------------- | --------------------- | ----------------------------- | ------ | ----------------------- |
| **AC-PROF-01** | Halaman profil tampil | Data user (nama, email, role) | ☐      | `e2e-profile-page.png`  |
| **AC-PROF-02** | Update profil         | Berhasil                      | ☐      | -                       |
| **AC-PROF-03** | Halaman settings      | Accessible                    | ☐      | `e2e-settings-page.png` |

### Acceptance Criteria Detail

**AC-PROF-01: Profile Page**

- **Data:**
  - Nama
  - Email
  - Role
- **Expected:** Halaman profil tampil dengan data user

**AC-PROF-02: Update Profile**

- **Expected:** User dapat mengupdate nama/profil, perubahan tersimpan

**AC-PROF-03: Settings Page**

- **Expected:** Halaman settings accessible di `/dashboard/settings`

---

## 12. Audit Trail

### Test Cases

| ID              | Skenario                | Expected Output                 | Status | Screenshot            |
| --------------- | ----------------------- | ------------------------------- | ------ | --------------------- |
| **AC-AUDIT-01** | Audit trail accessible  | Untuk Operator dan Manager      | ☐      | `e2e-audit-trail.png` |
| **AC-AUDIT-02** | Daftar audit log tampil | Informasi aksi, user, timestamp | ☐      | -                     |

### Acceptance Criteria Detail

**AC-AUDIT-01 ~ 02: Audit Trail**

- **Kolom:**
  - Timestamp
  - User (nama/email)
  - Aksi (create, update, delete)
  - Entity (property, room, tenant, payment, dll)
  - Detail (deskripsi perubahan)
- **Expected:** Tabel audit log tampil dengan pagination, Operator dan Manager dapat akses

---

## 13. UX & Responsivitas

### Test Cases

| ID           | Skenario           | Expected Output                         | Status | Screenshot                     |
| ------------ | ------------------ | --------------------------------------- | ------ | ------------------------------ |
| **AC-UX-01** | Mobile (375px)     | Semua halaman tidak overflow horizontal | ☐      | `e2e-ux-mobile-dashboard.png`  |
| **AC-UX-02** | Desktop (1440px)   | Layout proporsional                     | ☐      | `e2e-ux-desktop-dashboard.png` |
| **AC-UX-03** | Loading skeleton   | Tampil saat fetching data               | ☐      | `e2e-ux-loading-skeleton.png`  |
| **AC-UX-04** | Empty state        | Tampil ketika tidak ada data            | ☐      | `e2e-ux-empty-state.png`       |
| **AC-UX-05** | Error state        | Tampil ketika API gagal                 | ☐      | -                              |
| **AC-UX-06** | Toast notification | Muncul setelah aksi sukses/gagal        | ☐      | `e2e-ux-toast.png`             |
| **AC-UX-07** | Confirm dialog     | Muncul sebelum aksi destruktif          | ☐      | -                              |
| **AC-UX-08** | 404 page           | Tampil untuk route tidak dikenal        | ☐      | `e2e-auth-404-page.png`        |
| **AC-UX-09** | Unauthorized page  | Tampil saat akses ditolak               | ☐      | `e2e-ux-unauthorized.png`      |

### Acceptance Criteria Detail

**AC-UX-01: Mobile Responsive**

- **Viewport:** 375×812 (iPhone 13)
- **Expected:** Tidak ada horizontal scroll, layout proporsional, semua fitur accessible

**AC-UX-02: Desktop Layout**

- **Viewport:** 1440×900
- **Expected:** Layout proporsional, sidebar tetap visible, content area tidak terlalu lebar

**AC-UX-03: Loading Skeleton**

- **Expected:** Skeleton loader tampil saat data sedang di-fetch

**AC-UX-04: Empty State**

- **Expected:** Komponen `EmptyState` tampil ketika tidak ada data

**AC-UX-05: Error State**

- **Expected:** Error message tampil ketika API gagal, tombol "Coba Lagi" jika ada

**AC-UX-06: Toast Notifications**

- **Expected:** Toast muncul setelah aksi sukses (hijau) atau gagal (merah), auto-dismiss

**AC-UX-07: Confirm Dialog**

- **Expected:** Dialog konfirmasi muncul sebelum aksi destruktif (hapus, checkout)

**AC-UX-08: 404 Page**

- **Expected:** Halaman 404 custom tampil untuk route tidak dikenal

**AC-UX-09: Unauthorized Page**

- **Expected:** Halaman "Akses Ditolak" tampil saat user mencoba akses di luar kewenangan

---

## Hasil Testing

### Summary

| Kategori           | Total AC | Pass  | Fail  | Pending |
| ------------------ | -------- | ----- | ----- | ------- |
| Authentication     | 11       | -     | -     | 11      |
| Dashboard          | 9        | -     | -     | 9       |
| RBAC               | 10       | -     | -     | 10      |
| Properti           | 7        | -     | -     | 7       |
| Kamar              | 9        | -     | -     | 9       |
| Penghuni           | 7        | -     | -     | 7       |
| Pembayaran         | 10       | -     | -     | 10      |
| Konfirmasi DP      | 8        | -     | -     | 8       |
| Maintenance        | 7        | -     | -     | 7       |
| Notifikasi         | 4        | -     | -     | 4       |
| Profil & Settings  | 3        | -     | -     | 3       |
| Audit Trail        | 2        | -     | -     | 2       |
| UX & Responsivitas | 9        | -     | -     | 9       |
| **TOTAL**          | **107**  | **-** | **-** | **107** |

_Status akan diupdate setelah Playwright tests selesai dijalankan._

---

## Bug Log

Bug yang ditemukan selama testing akan didokumentasikan di [bug-log.md](./bug-log.md).

---

## Screenshot Evidence

Semua screenshot disimpan di folder `docs/testing/` dengan format `e2e-[test-name].png`.

---

## Linked Documents

- [GitHub Issue #80](https://github.com/itsramaa/Sistem-Hunian/issues/80)
- [SRS Frontend](../srs_frontend.md)
- [SRS NFR & Acceptance Criteria](../srs_nfr.md)
- [SUS Testing Report](./sus-testing.md)
- [Bug Log](./bug-log.md)

---

**Penguji:** Automated (Playwright) + Manual  
**Tanggal:** 22 Juni 2026  
**Status:** Testing in progress...
