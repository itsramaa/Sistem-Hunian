# Proposal Audit 1: Inkonsistensi Domain Auth, Property, Room, Tenant, Payment

**Change:** audit-consistency-ta-vs-implementation  
**Proposal:** 1 dari 4  
**Tanggal:** 2026-06-26  
**Scope:** KF-01, KF-02, KF-03, KF-04, KF-06, KF-07 + domain terkait di backend & frontend

---

## 1. Latar Belakang

Audit ini membandingkan secara menyeluruh tiga sumber kebenaran:

1. **TA** — dokumen akademik (BAB I–V, LAMPIRAN): spesifikasi kebutuhan fungsional, ERD, use case, activity diagram, black box testing, batasan penelitian.
2. **Sistem-Hunian-Go** — implementasi backend: router, handler, service, repository, model, worker.
3. **Sistem-Hunian-V2** — implementasi frontend: features/, pages/, hooks/, api/, types/.

Proposal ini mencakup 5 domain pertama yang paling fundamental: **Auth/User**, **Property**, **Room**, **Tenant**, **Payment**.

---

## 2. Metodologi Audit

Setiap domain diverifikasi pada 5 dimensi:

| Dimensi | Pertanyaan Kunci |
|---------|-----------------|
| **Kebutuhan Fungsional** | Apakah semua KF yang direferensikan sudah diimplementasi? |
| **ERD / Model** | Apakah atribut entitas di TA sama dengan struct Go dan TypeScript types? |
| **Use Case / RBAC** | Apakah pembatasan role (Operator/Viewer) konsisten di TA, backend middleware, dan frontend guard? |
| **API Endpoint** | Apakah semua operasi yang disebutkan TA tersedia di router.go? |
| **Frontend Coverage** | Apakah semua halaman/form yang dirancang di TA ada di features/? |

Status temuan:
- ✅ **Konsisten** — implementasi sesuai TA
- ⚠️ **Inkonsistensi Minor** — deviasi kecil, tidak mengubah perilaku fungsional
- ❌ **Inkonsistensi Mayor** — deviasi yang berdampak pada kebenaran TA atau implementasi
- 🔍 **Perlu Verifikasi Lebih Dalam** — butuh baca kode lebih lanjut untuk konfirmasi

---

## 3. Domain: Auth & User Management (KF-01, KF-02)

### 3.1 Kebutuhan Fungsional vs Implementasi

#### KF-01 — Autentikasi dan Manajemen Sesi

| Item TA | Backend | Frontend | Status |
|---------|---------|----------|--------|
| Login via email + password | `POST /api/v1/auth/login` → `auth_handler.go` | `features/auth/api/authApi.ts` → `Auth.tsx` | ✅ |
| Token JWT dengan validasi tiap request | `middleware/auth.go` — `Authenticate()` | `useAuth.tsx` menyimpan token di storage | ✅ |
| Token versioning untuk invalidasi paksa | `users.tokenVersion` di ERD + `model/user.go` | — | ✅ backend; 🔍 frontend perlu verifikasi apakah tokenVersion dihandle saat 401 |
| Ganti password | `POST /api/v1/auth/change-password` | `features/profile/api/settingsApi.ts` | ✅ |
| Update profil (name, phone, email) | `PATCH /api/v1/auth/me` | `features/profile/pages/Profile.tsx` | ✅ |
| Inactivity logout 30 menit + warning 1 menit | — | `features/auth/components/InactivityMonitor.tsx`, `hooks/useInactivityLogout.ts` | ✅ frontend; ⚠️ tidak ada mekanisme server-side invalidasi saat inactivity — sesi hanya expired di client |
| Notifikasi `login_new_device` | `auth_service.go` → deteksi `LastLoginIP` lalu buat notifikasi | `features/notifications/` | ✅ backend membuat notif; ✅ frontend menampilkan |
| Arahkan ke tampilan sesuai role setelah login | — | `features/auth/components/ProtectedRoute.tsx` | ✅ |

**Temuan KF-01:**
- ❌ **Inkonsistensi Minor** — TA menyatakan sesi berakhir setelah 30 menit tidak aktif dengan peringatan 1 menit. Backend tidak memiliki mekanisme server-side inactivity; invalidasi hanya terjadi di client via `InactivityMonitor`. Jika token belum expired secara JWT, akses API masih mungkin dari klien lain.
- ⚠️ **Perlu Verifikasi** — `LastLoginIP` di `model/user.go` ada, tapi ERD TA tidak mencantumkan kolom `lastLoginIP` pada entitas `users`. ERD TA hanya menyebut: `id, name, email, passwordHash, role, isActive, phoneNumber, tokenVersion, createdAt, updatedAt`. Kolom `lastLoginIP` tidak ada di ERD TA tapi ada di implementasi.

#### KF-02 — Manajemen Pengguna

| Item TA | Backend | Frontend | Status |
|---------|---------|----------|--------|
| Tambah user (Operator only) | `POST /api/v1/users` → `RequireRole(operator)` | `features/profile/components/UserManagementCard.tsx` | ✅ |
| Update user | `PATCH /api/v1/users/:id` | ✅ | ✅ |
| Deactivate user | `PATCH /api/v1/users/:id/deactivate` | ✅ | ✅ |
| Role: operator atau viewer | `model.RoleOperator`, `model.RoleViewer` | `auth.ts` types | ✅ |
| Viewer tidak bisa akses manajemen user | `users` group: `RequireRole(operator)` | `ProtectedRoute.tsx` RBAC guard | ✅ |
| Delete user | **Tidak ada** di router.go | **Tidak ada** di frontend | ⚠️ TA tidak menyebutkan delete user, hanya deactivate — konsisten |
| Reset password oleh Operator | TA Batasan (j): tidak ada self-service reset; Operator menggunakan manajemen pengguna | Tidak ada endpoint khusus reset-by-operator | ⚠️ TA menyiratkan Operator bisa reset password pengguna lain via manajemen pengguna, tapi backend hanya `PATCH /:id` yang update name/email/role — tidak ada field password di `UpdateUserRequest` |

**Temuan KF-02:**
- ❌ **Inkonsistensi** — Batasan penelitian (j) menyatakan: *"Pembaruan password dilakukan melalui Operator menggunakan fitur manajemen pengguna."* Tapi `UpdateUserRequest` di `model/user.go` hanya memiliki field `Name`, `Email`, `Role` — tidak ada `Password`. Endpoint `PATCH /users/:id` tidak bisa digunakan Operator untuk reset password pengguna lain. Ini gap antara TA dan implementasi.
- ⚠️ **Minor** — `UpdateUserRequest.Role` hanya memperbolehkan `viewer` (validate: `oneof=viewer`). Operator tidak bisa diubah menjadi operator oleh operator lain lewat endpoint ini. Perlu konfirmasi apakah ini disengaja.

### 3.2 ERD vs Model

#### Entitas `users`

| Atribut TA | Field Go (`model/user.go`) | Status |
|-----------|--------------------------|--------|
| `id` | `ID string` | ✅ |
| `name` | `Name string` | ✅ |
| `email` | `Email string` | ✅ |
| `passwordHash` | `PasswordHash string` | ✅ |
| `role` | `Role string` (operator/viewer) | ✅ |
| `isActive` | `IsActive bool` | ✅ |
| `phoneNumber` | `PhoneNumber *string` | ✅ |
| `tokenVersion` | `TokenVersion int` | ✅ |
| `createdAt` | `CreatedAt time.Time` | ✅ |
| `updatedAt` | `UpdatedAt time.Time` | ✅ |
| *(tidak ada di TA)* | `LastLoginIP *string` | ❌ **Kolom ekstra** — ada di implementasi, tidak ada di ERD TA |

---

## 4. Domain: Property (KF-03)

### 4.1 Kebutuhan Fungsional vs Implementasi

| Item TA | Backend | Frontend | Status |
|---------|---------|----------|--------|
| Tambah properti | `POST /api/v1/properties` → `RequireRole(operator)` | `features/properties/components/PropertyForm.tsx` | ✅ |
| Edit properti | `PUT /api/v1/properties/:id` | `PropertyForm.tsx` (mode edit) | ✅ |
| Hapus properti | `DELETE /api/v1/properties/:id` | `Properties.tsx` delete action | ✅ |
| Blokir hapus jika ada kamar/penghuni/pembayaran/maintenance | `propSvc` inject `roomRepo, tenantRepo, payRepo, maintRepo` | Error message dari API | ✅ |
| Viewer baca saja | `GET /properties` dan `GET /properties/:id` tanpa `RequireRole` | ProtectedRoute + hide action buttons | ✅ |
| Jumlah kamar dihitung runtime (bukan kolom) | ERD TA: "dihitung melalui agregasi relasi" | — | ✅ konsisten dengan arsitektur |

### 4.2 ERD vs Model

| Atribut TA (`properties`) | Field Go | Status |
|--------------------------|----------|--------|
| `id` | ✅ | ✅ |
| `propertyName` | 🔍 perlu cek `model/property.go` | — |
| `address` | 🔍 | — |
| `description` | 🔍 | — |
| `createdAt` | ✅ | ✅ |
| `updatedAt` | ✅ | ✅ |

> **Aksi:** Baca `model/property.go` untuk konfirmasi penuh atribut.

**Temuan KF-03:**
- ✅ Semua operasi CRUD tersedia
- 🔍 Perlu verifikasi field-level di model Go vs ERD TA

---

## 5. Domain: Room (KF-04)

### 5.1 Kebutuhan Fungsional vs Implementasi

| Item TA | Backend | Frontend | Status |
|---------|---------|----------|--------|
| Tambah kamar | `POST /api/v1/rooms` → Operator | `features/rooms/components/RoomForm.tsx` | ✅ |
| Edit kamar | `PUT /api/v1/rooms/:id` | `RoomForm.tsx` edit mode | ✅ |
| Hapus kamar | `DELETE /api/v1/rooms/:id` | `Rooms.tsx` | ✅ |
| Blokir hapus jika status bukan available atau ada histori | `roomSvc` inject `tenantRepo, payRepo, maintRepo` | Error dari API | ✅ |
| Update status kamar langsung | — | — | ⚠️ TA KF-04 menyebut "memperbarui status kamar secara langsung" tapi tidak ada endpoint `PATCH /rooms/:id/status` di router. Status kamar berubah via side effect (tenant create/checkout, confirmation create/expire). Perlu konfirmasi apakah ada endpoint manual status update. |
| Viewer baca saja | `GET /rooms`, `GET /rooms/:id` tanpa RequireRole | RBAC di frontend | ✅ |
| Filter kamar berdasarkan properti | `GET /rooms?propertyId=...` (asumsi) | `Rooms.tsx` filter UI | 🔍 perlu verifikasi query param di handler |
| Nomor kamar unik per properti | Black box test no. 8 | validasi di service/DB | ✅ Black box pass |

### 5.2 ERD vs Model (`rooms`)

| Atribut TA | Go Model | Status |
|-----------|----------|--------|
| `id` | ✅ | ✅ |
| `propertyId` | 🔍 `model/room.go` | — |
| `roomNumber` | 🔍 | — |
| `roomType` | 🔍 | — |
| `rentPrice` | 🔍 | — |
| `status` | 🔍 (available/occupied/dp_confirmation) | — |
| `createdAt`, `updatedAt` | ✅ | ✅ |

**Temuan KF-04:**
- ❌ **Potensial Gap** — TA KF-04 menyebut *"memperbarui status kamar secara langsung"* sebagai fitur tersendiri. Di router tidak ada `PATCH /rooms/:id/status`. Perlu klarifikasi: apakah "update status langsung" hanya melalui alur konfirmasi/penghuni (yang sudah ada), atau memang harus ada endpoint manual?

---

## 6. Domain: Tenant (KF-06)

### 6.1 Kebutuhan Fungsional vs Implementasi

| Item TA | Backend | Frontend | Status |
|---------|---------|----------|--------|
| Catat penghuni baru | `POST /api/v1/tenants` → Operator | `features/tenant/components/TenantForm.tsx` | ✅ |
| Update data penghuni | `PUT /api/v1/tenants/:id` | `TenantForm.tsx` edit | ✅ |
| Checkout penghuni | `POST /api/v1/tenants/:id/checkout` | `features/tenant/components/CheckoutForm.tsx` | ✅ |
| Blokir checkout jika ada tunggakan unpaid/overdue | `tenantSvc` inject `payRepo` | Error dari API | ✅ Black box test no. 4 pass |
| Histori penghuni tersimpan (tidak dihapus) | Soft approach: `status = checked_out`, `checkOutDate` terisi | Frontend menampilkan histori | ✅ |
| Viewer baca saja | GET tanpa RequireRole | RBAC frontend | ✅ |
| Perpanjangan kontrak via checkout + buat penghuni baru | TA KF-06: "Perpanjangan kontrak dilakukan melalui proses checkout penghuni lama dan pencatatan penghuni baru" | Alur checkout + add tenant | ✅ desain disengaja |
| Delete tenant | **Tidak ada** di router | **Tidak ada** | ✅ konsisten — TA tidak menyebut delete penghuni |

### 6.2 ERD vs Model (`tenants`)

| Atribut TA | Go Model | Status |
|-----------|----------|--------|
| `id` | ✅ | ✅ |
| `roomId` | 🔍 `model/tenant.go` | — |
| `name` | 🔍 | — |
| `identityNumber` | 🔍 | — |
| `phoneNumber` | 🔍 | — |
| `checkInDate` | 🔍 | — |
| `checkOutDate` | 🔍 | — |
| `rentalDuration` | 🔍 | — |
| `status` (active/checked_out) | 🔍 | — |
| `createdAt`, `updatedAt` | ✅ | ✅ |

**Temuan KF-06:**
- ✅ Semua alur utama konsisten
- 🔍 Perlu verifikasi field-level di `model/tenant.go`

---

## 7. Domain: Payment (KF-07)

### 7.1 Kebutuhan Fungsional vs Implementasi

| Item TA | Backend | Frontend | Status |
|---------|---------|----------|--------|
| Catat pembayaran manual | `POST /api/v1/payments` → Operator | `features/payments/pages/Payments.tsx` | ✅ |
| Update pembayaran | `PUT /api/v1/payments/:id` | ✅ | ✅ |
| Tandai lunas | `PATCH /api/v1/payments/:id/mark-paid` | ✅ | ✅ |
| Upload bukti transfer | `PATCH /api/v1/payments/:id/upload` | ✅ | ✅ |
| Write-off | `PATCH /api/v1/payments/:id/write-off` | ✅ | ⚠️ **TA tidak menyebut write-off** — KF-07 tidak mencantumkan fitur ini. Write-off ada di router tapi tidak ada di kebutuhan fungsional TA. |
| Rekaman otomatis H-3 via background worker | `internal/worker/worker.go` | Rekaman muncul di list | ✅ |
| Status unpaid → overdue otomatis via worker | `worker.go` | Indikator di dashboard | ✅ |
| Nominal terisi otomatis dari harga sewa | Frontend autofill saat pilih kamar | `Payments.tsx` form | ✅ |
| Upload JPEG/PNG/PDF (bukan hanya gambar) | TA KF-07: *"format gambar (JPEG, PNG) atau dokumen (PDF)"* | 🔍 perlu cek validasi tipe file di handler | ⚠️ perlu verifikasi |
| Viewer baca saja | GET tanpa RequireRole | ✅ | ✅ |
| Blokir duplikat pembayaran periode yang sama | Black box test no. 9 pass | Validasi di service | ✅ |
| Indikator di dashboard | `GET /api/v1/dashboard/alerts` | `DashboardCards.tsx` | ✅ |

### 7.2 ERD vs Model (`payments`)

| Atribut TA | Go Model | Status |
|-----------|----------|--------|
| `id` | ✅ | ✅ |
| `roomId` | 🔍 `model/payment.go` | — |
| `tenantId` | 🔍 | — |
| `period` | 🔍 | — |
| `amount` | 🔍 | — |
| `paymentDate` | 🔍 | — |
| `status` | 🔍 (unpaid/paid/overdue) | — |
| `transferProofUrl` | 🔍 | — |
| `waSent` | 🔍 | — |
| `createdBy`, `updatedBy` | 🔍 | — |
| `createdAt`, `updatedAt` | ✅ | ✅ |

**Temuan KF-07:**
- ❌ **Inkonsistensi** — `PATCH /payments/:id/write-off` ada di implementasi tapi tidak tercakup dalam KF-07 TA. TA tidak mendefinisikan skenario write-off, namun fitur ini ada di backend dan perlu didokumentasikan atau dievaluasi apakah perlu ditambahkan ke TA.
- ⚠️ **Perlu Verifikasi** — TA KF-07 menyebut upload PDF sebagai format yang didukung. Perlu konfirmasi di `payment_handler.go` apakah validasi MIME type menerima PDF.

---

## 8. Ringkasan Temuan Proposal 1

### Inkonsistensi yang Ditemukan

| # | Domain | Tipe | Deskripsi | Sumber |
|---|--------|------|-----------|--------|
| I-01 | Auth (KF-01) | ⚠️ Minor | Inactivity logout hanya client-side; backend tidak memiliki server-side session invalidation pada inactivity | TA vs Go |
| I-02 | Auth (KF-01) | ❌ Mayor | Kolom `lastLoginIP` ada di `model/user.go` dan digunakan untuk deteksi `login_new_device`, tapi tidak ada di ERD TA | Go vs TA ERD |
| I-03 | User (KF-02) | ❌ Mayor | TA Batasan (j) menyatakan Operator bisa reset password pengguna lain via manajemen pengguna, tapi `UpdateUserRequest` tidak memiliki field `password` | TA vs Go |
| I-04 | User (KF-02) | ⚠️ Minor | `UpdateUserRequest.Role` hanya memperbolehkan `oneof=viewer` — Operator tidak bisa di-assign role operator via endpoint ini | Go behavior |
| I-05 | Room (KF-04) | ❌ Mayor | TA menyebut "memperbarui status kamar secara langsung" sebagai fitur KF-04, tapi tidak ada endpoint `PATCH /rooms/:id/status` di router | TA vs Go |
| I-06 | Payment (KF-07) | ❌ Mayor | Endpoint `write-off` ada di backend tapi tidak tercantum di KF-07 TA — fitur undocumented | Go vs TA |
| I-07 | Payment (KF-07) | ⚠️ Minor | TA menyebut PDF sebagai format upload yang valid, perlu verifikasi MIME validation di handler | TA vs Go |
| I-08 | Semua model | 🔍 Verifikasi | Field-level ERD vs Go model belum dikonfirmasi untuk: property, room, tenant, payment | Go vs TA ERD |

### Items Perlu Dibaca Lebih Lanjut (untuk Proposal 3)

- `model/property.go`
- `model/room.go`
- `model/tenant.go`
- `model/payment.go`
- `internal/handler/payment_handler.go` (MIME type validation)
- `internal/service/room_service.go` (manual status update logic)

---

## 9. Non-Goals

- Proposal ini tidak mencakup: Confirmation, Maintenance, Notification, WhatsApp, Dashboard, Audit Trail, Viewer Request (→ Proposal 2).
- Proposal ini tidak mencakup audit OpenAPI spec / DTO response shape (→ Proposal 3).
- Proposal ini tidak mencakup frontend page-by-page audit terhadap wireframe TA (→ Proposal 4).

---

## 10. Langkah Selanjutnya

1. Baca `model/property.go`, `model/room.go`, `model/tenant.go`, `model/payment.go` untuk konfirmasi I-08.
2. Baca `handler/payment_handler.go` untuk konfirmasi I-07.
3. Baca `service/room_service.go` untuk konfirmasi I-05.
4. Lanjut ke **Proposal 2** — domain Confirmation, Maintenance, Notification, WhatsApp, Dashboard, Audit.
