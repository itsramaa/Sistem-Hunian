# Proposal Audit 4: Inkonsistensi Frontend Pages, Components, Routing vs TA Use Case & Wireframe

**Change:** audit-consistency-ta-vs-implementation  
**Proposal:** 4 dari 4  
**Tanggal:** 2026-06-26  
**Scope:** Semua halaman frontend (router.tsx, features/) vs TA 4.2.6 (Perancangan Antarmuka), 4.3.3 (Implementasi Antarmuka), Use Case Diagram, RBAC tabel

---

## 1. Latar Belakang

Proposal ini mengaudit lapisan frontend: routing, halaman, komponen, dan RBAC guard vs spesifikasi TA. Sumber:
- `src/app/router/router.tsx` — route definitions + allowedRoles
- `src/features/*/pages/*.tsx` — halaman implementasi
- `src/features/*/components/*.tsx` — komponen form
- TA 4.2.6 Perancangan Antarmuka (wireframe)
- TA 4.3.3 Implementasi Antarmuka
- TA 4.2.2 Use Case Diagram (RBAC tabel)
- TA 4.3.3.15/16 — Settings tabs + write-off

---

## 2. Audit Routing vs TA Halaman

### 2.1 Pemetaan Route → TA Halaman

| Route | Component | TA Halaman | Status |
|-------|-----------|------------|--------|
| `/` | `HomePage` | — | ⚠️ TA tidak menyebut halaman beranda publik |
| `/login` | `Auth` | 4.3.3.1 Halaman Login | ✅ |
| `/unauthorized` | `Unauthorized` | — | ⚠️ TA tidak mendefinisikan halaman unauthorized secara eksplisit tapi logis |
| `/dashboard` | `Dashboard` | 4.3.3.2 Halaman Dashboard | ✅ |
| `/dashboard/properties` | `Properties` | 4.3.3.3 Manajemen Properti | ✅ |
| `/dashboard/properties/:id` | `PropertyDetail` | 4.2.6 Detail Properti | ✅ |
| `/dashboard/rooms` | `Rooms` | 4.3.3.4 Manajemen Kamar | ✅ |
| `/dashboard/rooms/:id` | `RoomDetail` | 4.2.6 Detail Kamar (3 tab) | ✅ |
| `/dashboard/tenants` | `Tenants` | 4.3.3.5 Manajemen Penghuni | ✅ |
| `/dashboard/tenants/:id` | `TenantDetail` | 4.2.6 Detail Penghuni | ✅ |
| `/dashboard/payments` | `Payments` | 4.3.3.6 Manajemen Pembayaran | ✅ |
| `/dashboard/payments/:id` | `PaymentDetail` | 4.2.6 Detail Pembayaran | ✅ |
| `/dashboard/confirmations` | `ConfirmationsPage` | 4.3.3.7 Konfirmasi DP | ✅ |
| `/dashboard/maintenance` | `Maintenance` | 4.3.3.8 Manajemen Pemeliharaan | ✅ |
| `/dashboard/maintenance/:id` | `MaintenanceDetail` | 4.2.6 Detail Pemeliharaan | ✅ |
| `/dashboard/audit` | `AuditTrailPage` | 4.3.3.9 Audit Trail | ✅ |
| `/dashboard/notifications` | `NotificationHistory` | 4.3.3.10 Notifikasi | ✅ |
| `/dashboard/profile` | `Profile` | 4.3.3.11 Profil | ✅ |
| `/dashboard/settings` | `Settings` | 4.3.3.15 Pengaturan | ✅ |
| `/dashboard/viewer-requests` | `ViewerRequestsPage` | — | ❌ **I-25** — route dedicated `/viewer-requests` ada di frontend tapi TA tidak menyebut halaman terpisah untuk Viewer Requests. TA 4.3.3.13 dan 4.3.3.15 hanya menyebut panel di Dashboard Viewer dan tab di Settings Operator. |

**Temuan routing:**
- ❌ **I-25** — `/dashboard/viewer-requests` adalah route terpisah dengan `allowedRoles={["viewer"]}`. TA menyebut Viewer Request sebagai panel di Dashboard (untuk Viewer submit) dan tab di Settings Operator (untuk Operator lihat history). Route dedicated ini tidak ada di TA wireframe maupun implementasi antarmuka.
- ⚠️ **I-26** — Route `/` (HomePage) ada di implementasi sebagai public landing page. TA hanya mendefinisikan `/login` sebagai titik masuk publik. Perlu klarifikasi apakah HomePage ini redirect ke login atau merupakan halaman tersendiri.
- ✅ Route `/merchant/*` → redirect ke `/dashboard` — ini internal convenience redirect, tidak ada di TA, wajar.

---

## 3. Audit RBAC Route Guard vs TA Use Case Diagram

### 3.1 Tabel Perbandingan

| Route | allowedRoles (Router) | TA Use Case / RBAC Tabel | Status |
|-------|----------------------|--------------------------|--------|
| `/dashboard` | operator, viewer | Keduanya dapat akses | ✅ |
| `/dashboard/properties` | operator, viewer | Viewer: baca saja | ✅ |
| `/dashboard/properties/:id` | operator, viewer | Viewer: baca saja | ✅ |
| `/dashboard/rooms` | operator, viewer | Viewer: baca saja | ✅ |
| `/dashboard/rooms/:id` | operator, viewer | Viewer: baca saja | ✅ |
| `/dashboard/tenants` | operator, viewer | Viewer: baca saja | ✅ |
| `/dashboard/tenants/:id` | operator, viewer | Viewer: baca saja | ✅ |
| `/dashboard/payments` | operator, viewer | Viewer: baca saja | ✅ |
| `/dashboard/payments/:id` | operator, viewer | Viewer: baca saja | ✅ |
| `/dashboard/confirmations` | operator, viewer | Viewer: baca saja | ✅ |
| `/dashboard/maintenance` | operator, viewer | Viewer: baca saja | ✅ |
| `/dashboard/maintenance/:id` | operator, viewer | Viewer: baca saja | ✅ |
| `/dashboard/audit` | **operator only** | Viewer: tidak ada akses | ✅ |
| `/dashboard/notifications` | operator, viewer | Viewer: baca saja | ✅ |
| `/dashboard/profile` | **tidak ada ProtectedRoute** | Semua role | ✅ (semua authenticated) |
| `/dashboard/settings` | **operator only** | Viewer: tidak ada akses | ✅ |
| `/dashboard/viewer-requests` | **viewer only** | — | ⚠️ I-25 — tidak ada di TA |

**Temuan RBAC:**
- ✅ **RBAC konsisten** untuk semua route yang terdefinisi di TA.
- ⚠️ **I-27** — `/dashboard/profile` tidak memiliki `ProtectedRoute` wrapper di router — hanya `<DS>` Suspense wrapper. Artinya halaman profil accessible oleh siapapun yang sudah dalam layout `/dashboard` (yang sudah dilindungi `ProtectedRoute allowedRoles={["operator","viewer"]}` di level parent). Secara fungsional aman tapi tidak eksplisit di route level. TA menyebut Profil dapat diakses seluruh role.

---

## 4. Audit Komponen Form vs TA Wireframe

### 4.1 Form Components Coverage

| TA Wireframe | Komponen Frontend | Status |
|-------------|-------------------|--------|
| Formulir Properti (tambah/ubah) | `features/properties/components/PropertyForm.tsx` | ✅ |
| Formulir Kamar (tambah/ubah) | `features/rooms/components/RoomForm.tsx` | ✅ |
| Formulir Penghuni (tambah/ubah) | `features/tenant/components/TenantForm.tsx` | ✅ |
| Formulir Checkout Penghuni | `features/tenant/components/CheckoutForm.tsx` | ✅ |
| Formulir Catat Pembayaran | dalam `features/payments/pages/Payments.tsx` | ✅ |
| Formulir Konfirmasi Calon Penghuni | `features/confirmations/components/ConfirmationForm.tsx` | ✅ |
| Formulir Konfirmasi DP (buat tenant) | `features/confirmations/components/ConfirmDpForm.tsx` | ✅ |
| Formulir Perpanjang Batas Konfirmasi | dalam `ConfirmationsPage.tsx` atau dialog inline | 🔍 perlu verifikasi komponen terpisah atau inline |
| Formulir Laporan Kerusakan | dalam `features/maintenance/pages/Maintenance.tsx` | ✅ |
| Dialog Update Status Maintenance (reported→in_progress) | `features/maintenance/components/MaintenanceProcessDialog.tsx` | ✅ |
| Dialog Complete Maintenance (in_progress→completed) | `features/maintenance/components/MaintenanceCompleteDialog.tsx` | ✅ |
| Panel Viewer Request | `features/dashboard/components/ViewerRequestPanel.tsx` | ✅ |

**Temuan form components:**
- ✅ Hampir semua form komponen tersedia sesuai wireframe TA.
- 🔍 **I-28** — Formulir Perpanjang Batas Tanggal Konfirmasi (wireframe 4.2.6.19) — perlu verifikasi apakah ada komponen terpisah atau inline di `ConfirmationsPage.tsx`. TA mendefinisikan ini sebagai dialog tersendiri.

---

## 5. Audit Halaman Settings vs TA 4.3.3.15

### 5.1 Tab Settings di TA

TA 4.3.3.15 mendefinisikan Settings dengan **4 tab**:
1. Tab Tampilan — tema terang/gelap
2. Tab Notifikasi — preferensi notifikasi
3. Tab WhatsApp — koneksi + nomor penerima
4. Tab Pengguna — manajemen akun + viewer request history

### 5.2 Komponen Settings Frontend

`features/profile/components/SettingsCards.tsx` — mengelola konten settings  
`features/profile/components/UserManagementCard.tsx` — tab Pengguna  
`features/profile/components/ViewerRequestsCard.tsx` — viewer request history di tab Pengguna  
`features/profile/pages/Settings.tsx` — halaman utama  

**Temuan Settings:**
- ✅ Tab WhatsApp, Tab Pengguna, dan Viewer Request history konsisten dengan TA.
- 🔍 **I-29** — Perlu verifikasi apakah Tab Notifikasi (preferensi notifikasi per tipe) sudah diimplementasi. TA 4.3.3.15 menyebut "tab Notifikasi untuk mengelola preferensi notifikasi" tapi `wa_config` flags (`notif_payment`, `notif_dp`, `notif_maintenance`) ada di tab WhatsApp. Tidak jelas apakah ada tab Notifikasi tersendiri atau preferensi notifikasi digabung ke WhatsApp.
- 🔍 **I-30** — Tab Tampilan (dark/light mode toggle) — perlu verifikasi ada di Settings atau terpisah. TA 4.3.3.15 menyebut ini sebagai tab pertama.

---

## 6. Audit Write-off vs TA 4.3.3.16

TA 4.3.3.16 mendefinisikan write-off secara eksplisit sebagai fitur dengan:
- Tombol "Hapus Tagihan" di baris payment `unpaid` atau `overdue`
- Konfirmasi dialog sebelum diproses
- Status berubah menjadi `cancelled`
- Endpoint `PATCH /payments/:id/write-off`
- Data tetap tersimpan untuk audit trail

**Temuan:**
- ✅ **I-06 DIREVISI** — Write-off **sudah terdokumentasi** di TA 4.3.3.16 Implementasi Antarmuka. Temuan I-06 dari Proposal 1 (write-off tidak ada di TA) adalah **tidak akurat** — write-off ada di TA tapi di bagian 4.3.3 Implementasi Antarmuka, bukan di 4.1.2 Kebutuhan Fungsional (KF-07).
- ❌ **I-06 DIREVISI menjadi I-06b** — Write-off ada di 4.3.3.16 tapi **tidak ada di KF-07** kebutuhan fungsional. Ini inkonsistensi internal TA: fitur diimplementasikan dan didokumentasikan di bab implementasi tapi tidak masuk ke daftar kebutuhan fungsional. Perlu ditambahkan sebagai KF-07 tambahan atau sub-poin.
- ✅ **I-23 DIREVISI** — Status `cancelled` di `model/payment.go` konsisten dengan TA 4.3.3.16 yang menyebut status `cancelled` secara eksplisit. Inkonsistensinya bukan antara kode dan TA, tapi antara KF-07 (3 status) dan ERD (yang juga perlu status `cancelled`).

---

## 7. Audit Fitur TA yang Tidak Ada di Frontend

### 7.1 Fitur dari TA yang Perlu Verifikasi Lebih Lanjut

| Fitur TA | Location TA | Frontend | Status |
|---------|------------|---------|--------|
| Klik notifikasi → arahkan ke halaman relevan | 4.2.6.24 Notifikasi | `NotificationsDropdown.tsx` | 🔍 perlu verifikasi navigasi dari notifikasi |
| Tab filter "belum dibaca" di halaman Notifikasi | 4.2.6.24 | `NotificationHistory.tsx` | 🔍 perlu verifikasi tab filter |
| Pratinjau bukti transfer di Detail Pembayaran | 4.2.6.15 | `PaymentDetail.tsx` | 🔍 perlu verifikasi preview komponen |
| Ekspor audit log ke CSV | 4.3.3.9 | `AuditTrailPage.tsx` | 🔍 perlu verifikasi tombol ekspor dan format |
| Histori penghuni (tab) di Detail Kamar | 4.2.6.8 3 tab | `RoomDetail.tsx` | ✅ 3 tab: penghuni, pembayaran, maintenance |
| QR code update otomatis sampai timeout | 4.3.3.14 | `features/whatsapp/` | 🔍 perlu verifikasi polling/SSE di `useWhatsapp.ts` |
| Konfirmasi hangus otomatis → keterangan WA failed | 4.2.6.27 | `ViewerRequestPanel.tsx` | ✅ status `wa_failed` ditampilkan |

---

## 8. Audit Fitur Frontend yang Tidak Ada di TA

| Fitur Frontend | Location | TA | Status |
|---------------|----------|----|--------|
| Homepage (`/`) | `src/app/pages/HomePage` | Tidak ada | ⚠️ I-26 — bisa jadi splash/redirect page |
| Route `/merchant/*` → redirect dashboard | `router.tsx` | Tidak ada | ✅ internal, tidak relevan |
| `MerchantLayoutRoute` sebagai layout wrapper | `app/layouts/` | Tidak disebutkan | ✅ implementasi detail, bukan fungsional |
| `AuthLoadingSkeleton` | `features/auth/components/` | Tidak ada | ✅ UX improvement, tidak perlu di TA |
| `InactivityMonitor` sebagai komponen | `features/auth/components/` | KF-01 menyebut mekanisme ini | ✅ sesuai KF-01 |
| `permissions.ts` di maintenance | `features/maintenance/permissions.ts` | Tidak ada | 🔍 perlu verifikasi isi file ini |
| `SectionHeader` di profile | `features/profile/components/SectionHeader.tsx` | Tidak ada | ✅ UI component, tidak fungsional |

---

## 9. Ringkasan Temuan Proposal 4

### Inkonsistensi yang Ditemukan

| # | Domain | Tipe | Deskripsi |
|---|--------|------|-----------|
| I-25 | Routing | ❌ Mayor | Route `/dashboard/viewer-requests` (viewer only) tidak ada di TA — TA hanya mendefinisikan panel di dashboard dan tab di settings |
| I-26 | Routing | ⚠️ Minor | Route `/` (HomePage) tidak ada di TA — TA hanya mendefinisikan `/login` sebagai titik masuk publik |
| I-27 | RBAC | ⚠️ Minor | `/dashboard/profile` tidak memiliki explicit ProtectedRoute di level route — aman karena parent sudah protected tapi tidak eksplisit |
| I-28 | Component | 🔍 Verifikasi | Formulir Perpanjang Batas Konfirmasi — perlu verifikasi ada komponen terpisah atau inline |
| I-29 | Settings | 🔍 Verifikasi | Tab Notifikasi di Settings — perlu verifikasi apakah terpisah dari tab WhatsApp |
| I-30 | Settings | 🔍 Verifikasi | Tab Tampilan (dark/light mode) di Settings — perlu verifikasi implementasi |
| I-06b | Payment KF | ❌ Mayor | Write-off ada di 4.3.3.16 (implementasi) tapi tidak ada di KF-07 (kebutuhan fungsional) — inkonsistensi internal TA |

### Revisi Temuan dari Proposal Sebelumnya

| ID Lama | Revisi | Penjelasan |
|---------|--------|-----------|
| I-06 | ✅ Direvisi → I-06b | Write-off terdokumentasi di TA 4.3.3.16 — bukan missing dari TA, tapi missing dari KF-07 saja |
| I-23 | ✅ Dikonfirmasi OK | Status `cancelled` konsisten dengan TA 4.3.3.16 — yang perlu diperbaiki hanya ERD TA (tambah status `cancelled`) |

---

## 10. Rekapitulasi Semua Temuan (4 Proposal)

### Inkonsistensi Mayor (P0) — Harus Diperbaiki

| ID | Proposal | Domain | Deskripsi | Aksi |
|----|----------|--------|-----------|------|
| I-02 | P1 | Auth/ERD | `lastLoginIP` ada di Go model, tidak di ERD TA | Tambah ke ERD TA entitas `users` |
| I-03 | P1 | User KF-02 | Operator tidak bisa reset password user lain — TA Batasan (j) menyiratkan bisa | Tambah field `password` ke `UpdateUserRequest` ATAU klarifikasi batasan di TA |
| I-06b | P4 | Payment | Write-off ada di 4.3.3.16 tapi tidak di KF-07 | Tambah ke KF-07 sebagai sub-fitur |
| I-15 | P2/P3 | Dashboard | `contract_reminder` tidak ada di `DashboardAlerts` — hanya notifikasi | Tambah ke alerts ATAU klarifikasi di TA |
| I-23 | P3 | Payment ERD | Status `cancelled` di kode tapi tidak di ERD TA | Tambah status `cancelled` ke ERD entitas `payments` |
| I-25 | P4 | Routing | `/dashboard/viewer-requests` tidak ada di TA | Tambah dokumentasi halaman ini ke TA 4.3.3 |

### Inkonsistensi Penting (P1) — Perbaiki Sebelum Finalisasi TA

| ID | Proposal | Domain | Deskripsi | Aksi |
|----|----------|--------|-----------|------|
| I-09 | P2 | Confirmation | `downPaymentAmount` tipe `decimal` di TA vs `float64` di Go | Dokumentasikan pilihan float64 atau ganti ke presisi tinggi |
| I-17 | P3 | Payment upload | Batas file 5MB di handler vs 6MB di router body limit | Sinkronkan ke 6MB atau dokumentasikan perbedaan |
| I-18 | P3 | Confirmation | Backend tidak validasi `confirmationDeadline >= today` | Tambah validasi di `confirmation_service.go` |
| I-22 | P3 | Tenant model | `RoomID *string` nullable di Go vs non-nullable di ERD TA | Konfirmasi dan dokumentasikan |

### Inkonsistensi Minor (P2) — Baik untuk Diperbaiki

| ID | Proposal | Domain | Deskripsi | Aksi |
|----|----------|--------|-----------|------|
| I-01 | P1 | Auth KF-01 | Inactivity logout hanya client-side | Dokumentasikan limitasi di TA |
| I-04 | P1/P3 | User | `UpdateUserRequest.Role` hanya `viewer` | Klarifikasi di TA |
| I-05 | P1/P3 | Room KF-04 | Update status via `PUT /rooms/:id` bukan dedicated endpoint | Klarifikasi di TA KF-04 |
| I-10 | P2/P3 | Confirmation | Default 10%/H+7 hanya di frontend, tidak di backend | Tambah validasi minimum deadline di backend |
| I-12 | P2 | Maintenance | `PropertyID` di CreateMaintenanceRequest untuk validasi saja | Tambah catatan di TA |
| I-13 | P2 | Notification | Perlu konfirmasi `notif_maintenance` pengaruhi in-app atau hanya WA | Klarifikasi di TA KF-12 |
| I-19 | P3 | Tenant | `rentalDuration` tidak ada unit terdefinisi | Tambah unit "bulan" ke ERD TA |
| I-20 | P3 | Property | Response menyertakan aggregated fields tidak di ERD | Tambah catatan computed fields di TA |
| I-24 | P3 | Dashboard | `MaintenanceSummary` + `ViewerRequestSummary` di dashboard tidak di KF-05 | Dokumentasikan sebagai extended data |
| I-26 | P4 | Routing | Homepage `/` tidak di TA | Klarifikasi redirect behavior |
| I-27 | P4 | RBAC | Profile route tanpa explicit ProtectedRoute wrapper | Tambah explicit guard |

### Items Perlu Verifikasi Lebih Lanjut

| ID | Proposal | Domain | Perlu Baca |
|----|----------|--------|------------|
| I-11 | P2 | Maintenance | MIME validation di `maintenance_handler.go` |
| I-28 | P4 | Confirmation | Komponen perpanjang deadline — inline atau terpisah |
| I-29 | P4 | Settings | Tab Notifikasi vs Tab WhatsApp |
| I-30 | P4 | Settings | Tab Tampilan dark/light mode |
| — | P3 | Tenant | Filter `status=checked_out` di `GET /tenants` |
| — | P3 | Audit | Filter params di `GET /audit/room-status` |
| — | P4 | Whatsapp | Polling QR di `useWhatsapp.ts` |

---

## 11. Non-Goals

- Proposal ini tidak mencakup audit migration SQL vs ERD TA.
- Proposal ini tidak mencakup E2E test coverage vs black box test scenarios.
- Proposal ini tidak mencakup audit performa atau aksesibilitas.

---

## 12. Langkah Selanjutnya (Tasks)

Berdasarkan 4 proposal ini, langkah selanjutnya adalah membuat `tasks.md` yang berisi:

1. **Verifikasi sisa items** — baca `maintenance_handler.go`, `confirmations` perpanjang form, `settings` tabs, `useWhatsapp.ts`, `permissions.ts`
2. **Perbaikan TA** — update ERD (tambah `lastLoginIP`, `cancelled` status, `rentalDuration` unit), update KF-07 (tambah write-off), update KF-02 (klarifikasi reset password)
3. **Perbaikan Implementasi** — tambah validasi deadline di `confirmation_service.go`, sinkronkan batas upload 5MB→6MB, tambah `contract_reminder` ke dashboard alerts
4. **Dokumentasi** — tambah catatan denormalized fields di TA, klarifikasi route viewer-requests, dokumentasikan inactivity logout limitasi
