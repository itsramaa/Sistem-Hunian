# SRS — Frontend
# Sistem Informasi Manajemen Kos Multi-Properti Berbasis Web

**Versi:** 1.0 | Lihat `srs_overview.md` untuk konteks penuh.

---

## 1. Arsitektur Frontend

### Technology Stack

| Library / Tool | Versi | Peran |
|----------------|-------|-------|
| React | 18.x | UI component framework |
| Vite | 5.x | Build tool & dev server |
| React Router | 6.x | Client-side routing & route guards |
| TanStack Query | 5.x | Server state management, caching, refetch |
| Axios | 1.x | HTTP client, interceptor JWT |
| React Hook Form | 7.x | Form state management |
| Zod | 3.x | Schema validation (client-side) |
| TailwindCSS | 3.x | Utility-first styling |

### Justifikasi Teknis

**React + Vite dipilih** karena sistem memiliki beberapa tampilan yang secara struktural serupa (tabel, filter, form) — halaman properti, kamar, dan penghuni menggunakan pola identik sehingga komponen dapat digunakan lintas halaman tanpa duplikasi kode. Vite menyediakan dev server ringan untuk iterasi cepat.

**TanStack Query** menangani pembaruan tampilan selektif tanpa full page reload. Perubahan indikator status kamar, status pembayaran, dan status konfirmasi DP pada dashboard diperbarui secara dinamis ketika pengguna melakukan interaksi atau manual refetch.

---

## 2. Prinsip Perancangan Antarmuka

- **Kesederhanaan navigasi** adalah prioritas utama, mengingat profil Viewer memiliki tingkat kenyamanan teknologi rendah.
- Tampilan Viewer harus minimal — tidak ada elemen yang tidak relevan dengan kebutuhan akses status.
- Seluruh halaman dibatasi sesuai role; pengguna tidak dihadapkan pada menu atau fungsi di luar kewenangannya.
- Navigasi harus dapat dilakukan dengan jumlah klik yang minimal.
- Sistem dapat dioperasikan **tanpa pelatihan khusus**, terutama untuk fungsi yang diakses Viewer.

---

## 3. Route & Access Control

### Route Guard

Setiap route yang memerlukan autentikasi harus dilindungi oleh `ProtectedRoute` component yang memeriksa keberadaan JWT dan role pengguna aktif. Redirect otomatis:

- Unauthenticated → `/login`
- Role tidak memiliki akses ke route tersebut → `/dashboard` (atau halaman sesuai role)

### Route Map

| Path | Halaman | Operator | Manajer | Viewer |
|------|---------|----------|---------|--------|
| `/login` | Login | ✓ | ✓ | ✓ |
| `/dashboard` | Dashboard | ✓ | ✓ | ✓ |
| `/properties` | Manajemen Properti | ✓ | ✗ | ✗ |
| `/rooms` | Manajemen Kamar | ✓ | ✗ | ✗ |
| `/tenants` | Manajemen Penghuni | ✓ | ✗ | ✗ |
| `/payments` | Manajemen Pembayaran | ✓ | ✗ | ✗ |
| `/confirmations` | Konfirmasi DP | ✓ | ✗ | ✗ |
| `/maintenance` | Manajemen Maintenance | ✓ | ✓ | ✗ |

Setelah login berhasil, sistem mengarahkan pengguna secara otomatis:
- Operator → `/dashboard` (dengan akses menu penuh)
- Manajer → `/dashboard`
- Viewer → `/dashboard` (tampilan read-only minimal)

---

## 4. Spesifikasi Halaman

### 4.1 Halaman Login

**Tujuan:** Entry point sistem. Harus bersih dan tidak membingungkan.

**Komponen:**
- `LoginForm` — field `email`, field `password`, tombol masuk
- Tidak ada elemen dekoratif non-fungsional

**Behavior:**
- Submit → POST `/api/v1/auth/login`
- Sukses → simpan JWT di memory/secure storage → redirect sesuai role
- Gagal → tampilkan pesan error inline (jangan clear password field)
- Loading state pada tombol selama request berlangsung

**Validasi client-side (Zod):**
- `email`: wajib, format email valid
- `password`: wajib, tidak boleh kosong

---

### 4.2 Halaman Dashboard

**Tujuan:** Satu-satunya halaman yang dapat diakses semua role. Menggantikan ketergantungan informasi pada satu individu.

**Komponen:**

#### Summary Cards
Menampilkan ringkasan status kamar dari **seluruh properti** dalam bentuk kartu berwarna:

| Kartu | Warna | Data |
|-------|-------|------|
| Total Properti | Netral | Jumlah properti terdaftar |
| Total Kamar | Netral | Total kamar dari seluruh properti |
| Tersedia | Hijau | Kamar berstatus `available` |
| Terisi | Biru | Kamar berstatus `occupied` |
| Konfirmasi DP | Kuning | Kamar berstatus `dp_confirmation` |

#### Alert Panel
Menampilkan kondisi yang memerlukan tindakan segera. Hanya tampil jika ada alert aktif.

| Jenis Alert | Pemicu | Prioritas Visual |
|-------------|--------|-----------------|
| DP mendekati expired | `batas_tanggal_konfirmasi` ≤ 3 hari ke depan | Warning (kuning) |
| DP expired | `batas_tanggal_konfirmasi` sudah terlewati | Danger (merah) |
| Pembayaran mendekati jatuh tempo | Jatuh tempo ≤ 3 hari ke depan | Warning (kuning) |
| Pembayaran terlambat | Sudah melewati jatuh tempo | Danger (merah) |

#### Notification Panel
Menampilkan riwayat notifikasi yang dihasilkan background worker.

- Setiap notifikasi menampilkan: pesan, waktu, status baca
- Operator dapat menandai notifikasi sebagai sudah dibaca
- Panel hanya menampilkan notifikasi yang belum dibaca secara default (ada toggle untuk lihat semua)
- Viewer tidak menampilkan notification panel (tidak relevan dengan kebutuhan aksesnya)

**Catatan role:**
- Viewer hanya melihat Summary Cards
- Manajer melihat Summary Cards + Alert Panel (read-only)
- Operator melihat semua komponen + aksi mark-as-read

---

### 4.3 Halaman Manajemen Properti

**Akses:** Operator only

**Komponen:**
- `PropertyTable` — kolom: nama, alamat, jumlah kamar, aksi (edit, hapus)
- `PropertyForm` — modal/drawer: field nama, alamat, deskripsi
- Tombol "Tambah Properti" di bagian atas tabel

**Behavior:**
- Hapus properti yang masih memiliki kamar → sistem menampilkan pesan error informatif, operasi dihentikan
- Konfirmasi dialog sebelum aksi hapus
- Form edit mengisi ulang nilai saat ini secara otomatis

---

### 4.4 Halaman Manajemen Kamar

**Akses:** Operator only

**Komponen:**
- `RoomTable` — kolom: nomor kamar, tipe, harga sewa, penghuni aktif, status
- `RoomForm` — modal/drawer: field property_id, nomor_kamar, tipe_kamar, harga_sewa
- `RoomFilter` — filter berdasarkan properti dan status
- Search berdasarkan nomor kamar

**Behavior:**
- Status kamar ditampilkan dengan badge berwarna sesuai nilai (available/dp_confirmation/occupied)
- Hapus kamar berstatus `occupied` atau `dp_confirmation` → sistem menampilkan pesan error, operasi dihentikan
- Filter properti memudahkan navigasi lintas properti tanpa harus berpindah halaman

---

### 4.5 Halaman Manajemen Penghuni

**Akses:** Operator only

**Komponen:**
- `TenantTable` — kolom: nama, nomor kamar, properti, tanggal masuk, durasi sewa, status, aksi
- `TenantForm` — modal/drawer: field room_id (dropdown kamar tersedia), nama, nomor_identitas, nomor_telepon, tanggal_masuk, durasi_sewa
- `CheckoutForm` — konfirmasi tanggal keluar
- Tab `Penghuni Aktif` / `Histori Penghuni`

**Behavior:**
- Dropdown room_id hanya menampilkan kamar berstatus `available`
- Setelah checkout dikonfirmasi: status tenant → `checked_out`, status kamar → `available` secara otomatis
- Histori penghuni tidak dapat dihapus; tab terpisah untuk riwayat

---

### 4.6 Halaman Manajemen Pembayaran

**Akses:** Operator only

**Komponen:**
- `PaymentTable` — kolom: kamar, penghuni, periode, nominal, tanggal bayar, status
- `PaymentForm` — modal: field room_id, tenant_id, periode, nominal, tanggal_bayar, upload bukti transfer
- Filter berdasarkan properti, periode, dan status pembayaran

**Status visual:**
| Status | Indikator |
|--------|-----------|
| Lunas | Badge hijau |
| Belum bayar (mendekati jatuh tempo) | Badge kuning |
| Terlambat / menunggak | Badge merah |

**Upload Bukti Transfer:**
- Format yang diterima: `jpg`, `jpeg`, `png`, `pdf`
- Ukuran maksimum: 5 MB
- Preview file sebelum submit
- Upload bersifat opsional; pembayaran dapat dicatat tanpa bukti

**Behavior:**
- Histori pembayaran per kamar dapat diakses melalui aksi "Lihat Histori" pada setiap baris kamar
- Jatuh tempo dihitung berdasarkan tanggal masuk penghuni

---

### 4.7 Halaman Konfirmasi DP

**Akses:** Operator only

**Komponen:**
- `ConfirmationTable` — kolom: kamar, nama calon penghuni, nominal DP, batas tanggal, sisa hari, status
- `ConfirmationForm` — modal: field room_id (dropdown kamar berstatus `available`), nama_calon_penghuni, nominal_dp, batas_tanggal_konfirmasi
- Tombol aksi: "Konfirmasi Masuk" dan "Tandai Hangus" pada setiap baris

**Behavior:**
- Kamar yang batas tanggal konfirmasinya sudah terlewati ditandai merah dengan badge "Expired"
- Sisa hari ditampilkan sebagai countdown (misal: "2 hari lagi")
- `room_id` dropdown hanya menampilkan kamar berstatus `available` (bukan `dp_confirmation` atau `occupied`)
- Konfirmasi masuk → alur `confirm_dp` API → room status menjadi `occupied`, perlu input data tenant

---

### 4.8 Halaman Manajemen Maintenance

**Akses:** Operator dan Manajer

**Komponen:**
- `MaintenanceTable` — kolom: kamar, properti, tanggal laporan, deskripsi, biaya, status, aksi
- `MaintenanceForm` — modal: field room_id, tanggal_laporan, deskripsi_kerusakan
- `MaintenanceUpdateForm` — modal: field tindakan_penanganan, biaya, status (dropdown: reported/in_progress/completed)
- Filter berdasarkan properti, kamar, status

**Behavior:**
- Status awal laporan selalu `reported`
- Tombol "Update Progress" tersedia untuk mengubah status ke `in_progress` atau `completed`
- Histori maintenance per kamar dapat diakses dan diurutkan berdasarkan tanggal terbaru
- Histori bersifat permanen — tidak ada aksi hapus
- `tindakan_penanganan` dan `biaya` diisi saat update, bukan saat membuat laporan awal

---

## 5. Shared Components

| Komponen | Kegunaan |
|----------|----------|
| `StatusBadge` | Menampilkan status dengan warna konsisten (room, payment, confirmation, maintenance) |
| `ConfirmDialog` | Dialog konfirmasi sebelum aksi destruktif (hapus, checkout) |
| `DataTable` | Tabel dengan pagination, sorting, dan filter yang dapat dikonfigurasi |
| `FormModal` | Wrapper modal/drawer untuk form CRUD |
| `FileUpload` | Komponen upload dengan validasi format dan ukuran |
| `NotificationBell` | Icon notifikasi di navbar dengan badge jumlah unread |
| `EmptyState` | Tampilan ketika tidak ada data pada tabel |
| `LoadingSpinner` | Indikator loading selama request berlangsung |

---

## 6. State Management

- **Server state** dikelola oleh TanStack Query (fetching, caching, background refetch, optimistic update).
- **Form state** dikelola oleh React Hook Form + Zod.
- **Auth state** (user info, JWT, role) disimpan di React Context, tidak di localStorage.
- **UI state** (modal open/close, filter aktif) dikelola dengan `useState` lokal per komponen.

### Invalidation Strategy

Setelah mutasi berhasil, query yang relevan di-invalidate agar data terbaru langsung tampil:

| Aksi | Query yang di-invalidate |
|------|--------------------------|
| Create/Update/Delete Room | `rooms`, `dashboard` |
| Create/Update Payment | `payments`, `dashboard` |
| Confirm DP / DP Expired | `confirmations`, `rooms`, `dashboard` |
| Checkout Tenant | `tenants`, `rooms`, `dashboard` |
| Create/Update Maintenance | `maintenances` |

---

## 7. Error Handling (Frontend)

- Error response dari API ditampilkan sebagai toast notification atau inline message di bawah field yang relevan.
- Error 401 (token expired/invalid) → clear auth state → redirect ke `/login`.
- Error 403 (forbidden) → tampilkan halaman "Akses Ditolak" dengan tombol kembali ke dashboard.
- Error jaringan → tampilkan toast "Koneksi bermasalah, coba lagi."
- Validasi Zod gagal sebelum request dikirim → highlight field dengan pesan error spesifik.

---

## 8. Responsivitas

| Breakpoint | Target Perangkat |
|-----------|-----------------|
| `sm` (640px) | Smartphone Android/iOS |
| `md` (768px) | Tablet |
| `lg` (1024px+) | Laptop/Desktop |

- Tabel pada mobile menggunakan horizontal scroll atau tampilan card stacked.
- Form menggunakan layout full-width pada mobile.
- Sidebar navigasi collapsible pada mobile.
- Seluruh fungsionalitas tersedia di semua ukuran layar — tidak ada fitur yang hanya dapat diakses di desktop.
