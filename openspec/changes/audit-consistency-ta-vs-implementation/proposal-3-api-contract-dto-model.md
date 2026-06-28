# Proposal Audit 3: Inkonsistensi API Contract, DTO, Response Shape, dan Model vs TA

**Change:** audit-consistency-ta-vs-implementation  
**Proposal:** 3 dari 4  
**Tanggal:** 2026-06-26  
**Scope:** Semua endpoint di router.go vs TA — validasi field, status code, upload constraint, write-off, dashboard alerts, konfirmasi temuan dari Proposal 1 & 2

---

## 1. Latar Belakang

Proposal ini mengaudit lapisan API: contract endpoint, shape DTO request/response, validasi input, file upload constraint, error code, dan behavior yang tidak terdokumentasi di TA. Ini adalah lapisan yang paling rawan karena TA mendefinisikan fungsionalitas tingkat tinggi sementara implementasi memiliki detail teknis yang lebih spesifik.

Sumber data:
- `internal/handler/*.go` (payment, maintenance, confirmation, auth)
- `internal/model/*.go` (semua DTO)
- `internal/router/router.go`
- `internal/repository/dashboard_repo.go`
- `internal/service/confirmation_service.go`
- `internal/whatsapp/service.go`
- TA: KF-01 s.d. KF-14, ERD, Batasan Penelitian, Lingkungan Implementasi

---

## 2. Konfirmasi Temuan dari Proposal 1 & 2

### I-02: Kolom `lastLoginIP` di model/user.go vs ERD TA

**Hasil verifikasi:** `model/user.go` memiliki `LastLoginIP *string`. Digunakan di `auth_service.go` untuk mendeteksi login dari perangkat baru (trigger notifikasi `login_new_device`). ERD TA tidak mencantumkan kolom ini.

**Status:** ❌ **Dikonfirmasi** — ERD TA perlu ditambah kolom `lastLoginIP` pada entitas `users`.

---

### I-05: Update status kamar langsung (KF-04)

**Hasil verifikasi:** `UpdateRoomRequest` di `model/room.go` memiliki field `Status string validate:"omitempty,oneof=available dp_confirmation occupied"`. Endpoint `PUT /rooms/:id` menggunakan `UpdateRoomRequest` — artinya update status manual sudah tersedia via endpoint update umum, bukan endpoint dedicated `PATCH /rooms/:id/status`.

**Status:** ⚠️ **Direvisi** — Inkonsistensi bukan pada ada/tidaknya fitur, tapi pada cara akses: TA menyebut "memperbarui status kamar secara langsung" yang bisa diinterpretasikan sebagai dedicated endpoint. Implementasi menggabungkan status update ke dalam `PUT /rooms/:id`. Fungsional terpenuhi tapi cara akses berbeda dari ekspektasi.

---

### I-07: Format upload PDF untuk bukti transfer (KF-07)

**Hasil verifikasi:** `handler/payment_handler.go` baris 121–128:
```
ext := strings.ToLower(filepath.Ext(file.Filename))
allowed := map[string]bool{".jpg": true, ".jpeg": true, ".png": true, ".pdf": true}
```
Plus validasi MIME via `http.DetectContentType` + fallback PDF magic bytes (`%PDF`).

**Status:** ✅ **Dikonfirmasi Konsisten** — PDF didukung sesuai TA KF-07. Namun ada inkonsistensi baru:

- ❌ **Inkonsistensi baru (I-17):** Komentar di handler: `// KF-09: max 6MB for maintenance photos; payments use same limit for consistency` — tapi validasi aktualnya `file.Size > 5*1024*1024` (5MB), bukan 6MB. TA KF-07 tidak menyebut batas ukuran eksplisit untuk bukti transfer. Router body limit adalah 6MB. Ada ketidakkonsistenan antara batas file 5MB di handler vs body limit 6MB di router.

---

### I-10: Default 10% DP dan H+7 (KF-08)

**Hasil verifikasi:** `confirmation_service.go`:
- Validasi `minDP = roomDetail.RentPrice * 0.1` — **backend memvalidasi minimum 10%**, bukan default
- Default 10% dan H+7 di-generate di **frontend** `ConfirmationForm.tsx` (autofill)
- Backend hanya memvalidasi bahwa nilai DP >= 10% dan <= 100% harga sewa

**Status:** ⚠️ **Minor** — TA menyebut "nilai default" yang diimplementasi di frontend. Validasi minimum ada di backend. Tidak ada default H+7 di backend — deadline dikirim dari frontend. Jika frontend dilewati langsung via API, bisa saja mengirim deadline <7 hari dari sekarang dan backend akan menerimanya selama format valid.

---

### I-14: Sesi WhatsApp persistence (KF-14)

**Hasil verifikasi:** `whatsapp/service.go` komentar header: *"Session disimpan di SQLite lokal sehingga tidak perlu scan QR ulang setelah restart."* Menggunakan `sqlstore.New(...sqlite...)` dengan WAL mode.

**Status:** ✅ **Dikonfirmasi Konsisten** — Sesi tersimpan di SQLite lokal sesuai TA KF-14.

---

### I-15: contract_reminder di dashboard alerts (KF-05)

**Hasil verifikasi:** `repository/dashboard_repo.go` — `DashboardAlerts` struct hanya memiliki:
```go
type DashboardAlerts struct {
    DPAlerts      []DPAlertItem      `json:"dp_alerts"`
    PaymentAlerts []PaymentAlertItem `json:"payment_alerts"`
}
```
Query alerts hanya JOIN `notifications` tipe `dp_reminder`, `dp_expired`, `payment_due`, `payment_overdue`. Tidak ada `contract_reminder` di alerts.

**Status:** ❌ **Dikonfirmasi Inkonsistensi (I-15)** — TA KF-05 menyebut panel peringatan aktif memuat "alert pembayaran mendekati jatuh tempo serta batas tanggal konfirmasi DP yang mendekati atau telah terlewati". `contract_reminder` tidak termasuk di dashboard alerts — hanya ada sebagai notifikasi. Ini bisa dianggap konsisten (TA KF-05 memang tidak menyebut contract expiry di alerts), namun TA KF-12 menyebutkan kontrak hampir berakhir sebagai kondisi kritis yang perlu dinotifikasi.

---

## 3. Audit API Endpoint Lengkap vs TA

### 3.1 Endpoint yang Ada di Backend tapi Tidak Disebutkan di TA

| Endpoint | Deskripsi | Status |
|----------|-----------|--------|
| `GET /docs` | Scalar API docs HTML | ✅ infrastruktur, wajar |
| `GET /openapi.json` | OpenAPI spec | ✅ infrastruktur, wajar |
| `GET /r2/*` | Proxy R2 object storage untuk authenticated access | ⚠️ Tidak disebutkan di TA — penting karena seluruh file upload (bukti transfer, foto maintenance) diakses via endpoint ini |
| `PATCH /payments/:id/write-off` | Write-off pembayaran (bad debt) | ❌ Tidak ada di KF-07 TA |
| `PUT /confirmations/:id` | Update deadline konfirmasi | ⚠️ TA KF-08 menyebut "Operator dapat menyesuaikan batas tanggal" tapi tidak eksplisit sebagai endpoint tersendiri |
| `POST /whatsapp/cancel` | Cancel proses connect/pairing | ⚠️ Tidak disebutkan di TA KF-14 tapi logis sebagai UX |
| `GET /audit/room-status/export` | Export audit log | ✅ TA KF-11 menyebut "ekspor log" |
| `DELETE /notifications/read` | Hapus notifikasi yang sudah dibaca | ✅ TA KF-12 menyebut "menghapus notifikasi yang sudah dibaca" |
| `POST /whatsapp/test` (dev only) | Test send WA | ✅ hanya development, tidak relevan untuk TA |
| `PATCH /payments/:id/write-off` | Write-off | ❌ **I-06** dikonfirmasi — tidak ada di TA |

### 3.2 Endpoint yang Disebutkan TA tapi Perlu Verifikasi

| Fitur TA | Endpoint | Status |
|----------|----------|--------|
| KF-09: "memperbarui status" maintenance ke 3 tahap | `PUT /maintenances/:id` dengan `UpdateMaintenanceRequest.Status` | ✅ |
| KF-07: "input pencatatan manual tetap tersedia" | `POST /payments` dengan status default `paid` | ✅ |
| KF-06: "menyimpan histori hunian" | `GET /tenants?status=checked_out` | 🔍 perlu verifikasi query param di tenant handler |
| KF-11: "filter berdasarkan properti, kamar, rentang tanggal, pemicu" | `GET /audit/room-status?propertyId=&roomId=&from=&to=&changedBy=` | 🔍 perlu verifikasi semua filter tersedia |

---

## 4. Audit DTO Request vs TA

### 4.1 CreateConfirmationRequest

| Field TA | DTO Go | Status |
|----------|--------|--------|
| roomId | `RoomID string validate:"required"` | ✅ |
| prospectName | `ProspectName string validate:"required,max=255"` | ✅ |
| phoneNumber | `PhoneNumber string validate:"omitempty,max=30"` | ✅ |
| downPaymentAmount | `DownPaymentAmount float64 validate:"required,gt=0"` | ⚠️ gt=0 saja — backend juga cek min 10% harga sewa di service |
| confirmationDeadline | `ConfirmationDeadline string validate:"required"` (YYYY-MM-DD) | ⚠️ TA menyebut default H+7 tapi backend tidak enforce minimum deadline |

**Temuan:**
- ❌ **I-18** — Backend tidak memvalidasi bahwa `confirmationDeadline` harus >= tanggal hari ini atau >= H+7. Frontend yang enforce H+7 default, tapi via API langsung bisa mengirim deadline yang sudah lewat.

### 4.2 UpdateUserRequest

| Field TA | DTO Go | Status |
|----------|--------|--------|
| name | `Name string validate:"omitempty,min=2,max=100"` | ✅ |
| email | `Email string validate:"omitempty,email"` | ✅ |
| role | `Role string validate:"omitempty,oneof=viewer"` | ❌ **I-04** dikonfirmasi — hanya bisa set ke viewer |
| password | **TIDAK ADA** | ❌ **I-03** dikonfirmasi — Operator tidak bisa reset password user lain |

### 4.3 CreateRoomRequest vs TA

| Field TA | DTO Go | Status |
|----------|--------|--------|
| propertyId | `PropertyID string validate:"required"` | ✅ |
| roomNumber | `RoomNumber string validate:"required"` | ✅ |
| roomType | `RoomType string validate:"required,max=100"` | ✅ |
| rentPrice | `RentPrice float64 validate:"required,gt=0"` | ✅ |

**Temuan:**
- ✅ Semua field konsisten

### 4.4 CreateTenantRequest vs TA

| Field TA | DTO Go | Status |
|----------|--------|--------|
| roomId | `RoomID string validate:"required"` | ✅ |
| name | `Name string validate:"required,max=255"` | ✅ |
| identityNumber | `IdentityNumber string validate:"required,max=100"` | ✅ |
| phoneNumber | `PhoneNumber string validate:"required,max=30"` | ✅ |
| checkInDate | `CheckInDate string validate:"required"` | ✅ |
| rentalDuration | `RentalDuration int validate:"required,gt=0"` | ✅ |

**Temuan:**
- ✅ Semua field konsisten dengan ERD TA
- ⚠️ **I-19** — TA ERD menyebut `rentalDuration` tapi tidak mendefinisikan unit (bulan/minggu/hari). Implementasi menggunakan integer tanpa unit tersirat — diasumsikan bulan berdasarkan konteks, tapi tidak ada validasi unit di backend.

### 4.5 CreateMaintenanceRequest vs TA

| Field TA | DTO Go | Status |
|----------|--------|--------|
| roomId | `RoomID string validate:"required"` | ✅ |
| reportDate | `ReportDate string validate:"required"` | ✅ |
| damageDescription | `DamageDescription string validate:"required"` | ✅ |
| *(tidak ada di TA)* | `PropertyID string validate:"required"` | ⚠️ I-12 dikonfirmasi — validasi, tidak disimpan |

---

## 5. Audit Model Struct vs ERD TA (Konfirmasi Field-Level)

### 5.1 `properties` — Dikonfirmasi

| Atribut TA | Go Model | Status |
|-----------|----------|--------|
| `id` | `BaseModel.ID` | ✅ |
| `propertyName` | `PropertyName string` | ✅ |
| `address` | `Address string` | ✅ |
| `description` | `Description string` | ✅ |
| `createdAt`, `updatedAt` | `BaseModel.CreatedAt/UpdatedAt` | ✅ |
| *(tidak ada di TA)* | `TotalRooms`, `AvailableRooms`, `OccupiedRooms`, `DPConfirmationRooms`, `ActiveTenants` | ⚠️ **I-20** — Field computed/aggregated dari JOIN, tidak ada di ERD TA. Bukan kolom DB, tapi shape response property berbeda dari ERD. |

### 5.2 `rooms` — Dikonfirmasi

| Atribut TA | Go Model | Status |
|-----------|----------|--------|
| `id` | `BaseModel.ID` | ✅ |
| `propertyId` | `PropertyID string` | ✅ |
| `roomNumber` | `RoomNumber string` | ✅ |
| `roomType` | `RoomType string` | ✅ |
| `rentPrice` | `RentPrice float64` | ⚠️ TA tidak menyebut tipe eksplisit tapi float64 wajar |
| `status` (available/dp_confirmation/occupied) | 3 konstanta | ✅ |
| `createdAt`, `updatedAt` | `BaseModel.CreatedAt/UpdatedAt` | ✅ |
| *(tidak ada di TA)* | `PropertyName string` (denormalisasi) | ⚠️ Pattern denormalisasi, konsisten lintas domain |
| *(tidak ada di TA)* | `RoomDetail` struct dengan `ActiveTenantID`, `PendingConfirmationID`, dll | ⚠️ **I-21** — `RoomDetail` response shape lebih kaya dari ERD. Wajar untuk API response tapi perlu dicatat. |

### 5.3 `tenants` — Dikonfirmasi

| Atribut TA | Go Model | Status |
|-----------|----------|--------|
| `id` | `BaseModel.ID` | ✅ |
| `roomId` | `RoomID *string` | ⚠️ **I-22** — ERD TA: `roomId` wajib. Go model: `RoomID *string` (nullable pointer). Saat status `checked_out`, `roomId` kemungkinan tetap terisi. Perlu konfirmasi apakah nullable di Go hanya untuk flexibility atau ada kasus roomId null. |
| `name` | `Name string` | ✅ |
| `identityNumber` | `IdentityNumber string` | ✅ |
| `phoneNumber` | `PhoneNumber string` | ✅ |
| `checkInDate` | `CheckInDate time.Time` | ✅ |
| `checkOutDate` | `CheckOutDate *time.Time` | ✅ nullable saat masih aktif |
| `rentalDuration` | `RentalDuration int` | ✅ |
| `status` (active/checked_out) | 2 konstanta | ✅ |
| `createdAt`, `updatedAt` | `BaseModel.CreatedAt/UpdatedAt` | ✅ |

### 5.4 `payments` — Dikonfirmasi

| Atribut TA | Go Model | Status |
|-----------|----------|--------|
| `id` | `BaseModel.ID` | ✅ |
| `roomId` | `RoomID string` | ✅ |
| `tenantId` | `TenantID string` | ✅ |
| `period` (YYYY-MM) | `Period string` | ✅ |
| `amount` | `Amount float64` | ✅ |
| `paymentDate` | `PaymentDate *time.Time` | ✅ nullable saat unpaid |
| `status` (unpaid/paid/overdue) | 4 konstanta termasuk `cancelled` | ⚠️ **I-23** — ERD TA menyebut 3 status: unpaid, paid, overdue. Go memiliki 4: `PaymentStatusCancelled = "cancelled"`. Status `cancelled` digunakan oleh write-off (I-06). Tidak ada di ERD TA. |
| `transferProofUrl` | `TransferProofURL *string` | ✅ |
| `waSent` | `WASent bool` | ✅ |
| `createdBy`, `updatedBy` | `BaseModel.CreatedBy/UpdatedBy` | ✅ |
| `createdAt`, `updatedAt` | `BaseModel.CreatedAt/UpdatedAt` | ✅ |

---

## 6. Audit Upload Constraint vs TA

| Fitur | TA | Implementasi | Status |
|-------|-----|-------------|--------|
| Format bukti transfer | JPEG, PNG, PDF | `.jpg`, `.jpeg`, `.png`, `.pdf` + MIME magic bytes check | ✅ |
| Ukuran max bukti transfer | Tidak disebutkan eksplisit | **5MB** di handler (bukan 6MB) | ⚠️ I-17 dikonfirmasi |
| Format foto maintenance | JPEG, PNG, WebP, maks 6MB | 🔍 perlu verifikasi `maintenance_handler.go` |
| Router body limit | — | 6MB global (router.go) | ⚠️ Tidak sinkron dengan 5MB di payment handler |

---

## 7. Audit Dashboard Response vs TA

### Summary Response — `DashboardSummary`

| Item TA KF-05 | Tersedia di Response | Status |
|--------------|---------------------|--------|
| Status hunian semua properti | `PropertySummary[]` per properti | ✅ |
| Ringkasan statistik hunian | `TotalRooms`, `RoomsAvailable`, `RoomsOccupied`, `RoomsDPConfirmation` | ✅ |
| *(tidak disebutkan TA)* | `MaintenanceSummary` (reported, in_progress, total_cost) | ⚠️ Extra data — berguna tapi tidak ada di KF-05 |
| *(tidak disebutkan TA)* | `ViewerRequestSummary` (total, wa_failed) | ⚠️ Extra data — berguna tapi tidak ada di KF-05 |

### Alerts Response — `DashboardAlerts`

| Item TA KF-05 | Tersedia di Alerts | Status |
|--------------|-------------------|--------|
| Alert pembayaran mendekati/melewati jatuh tempo | `PaymentAlerts[]` tipe `payment_due`, `payment_overdue` | ✅ |
| Alert batas konfirmasi DP mendekati/terlewati | `DPAlerts[]` tipe `dp_reminder`, `dp_expired` | ✅ |
| Alert kontrak hampir berakhir | **TIDAK ADA** di `DashboardAlerts` | ❌ **I-15 dikonfirmasi** — hanya ada sebagai notifikasi, tidak di panel alerts |

---

## 8. Audit Error Code Consistency

Backend menggunakan konstanta error code di `response` package. Beberapa error code relevan yang perlu disesuaikan dengan TA:

| Error Code Backend | Kondisi | Disebutkan di TA |
|-------------------|---------|-----------------|
| `PAYMENT_WRITE_OFF_FAILED` | Write-off gagal | ❌ Tidak ada — karena write-off tidak ada di TA |
| `ErrPaymentPeriodExists` | Duplikat periode pembayaran | ✅ Black box test no. 9 |
| `ErrPaymentInvalidFile` | File format/size tidak valid | ✅ KF-07 |
| `ErrPaymentNotFound` | Payment tidak ditemukan | ✅ |

---

## 9. Ringkasan Temuan Proposal 3

### Inkonsistensi yang Dikonfirmasi dari Proposal 1 & 2

| ID | Domain | Status Konfirmasi |
|----|--------|------------------|
| I-02 | `lastLoginIP` tidak ada di ERD TA | ❌ Dikonfirmasi |
| I-03 | Operator tidak bisa reset password user lain | ❌ Dikonfirmasi |
| I-04 | `UpdateUserRequest.Role` hanya `viewer` | ⚠️ Dikonfirmasi |
| I-05 | Update status kamar via `PUT /rooms/:id` bukan endpoint dedicated | ⚠️ Direvisi — fungsional terpenuhi |
| I-06 | Write-off tidak ada di TA | ❌ Dikonfirmasi |
| I-07 | PDF didukung, batas 5MB bukan 6MB | ✅ PDF OK, ⚠️ batas size baru ditemukan |
| I-14 | Sesi WhatsApp tersimpan di SQLite | ✅ Dikonfirmasi Konsisten |
| I-15 | contract_reminder tidak ada di dashboard alerts | ❌ Dikonfirmasi |

### Inkonsistensi Baru Ditemukan di Proposal 3

| # | Domain | Tipe | Deskripsi |
|---|--------|------|-----------|
| I-17 | Payment (KF-07) | ⚠️ Minor | Batas ukuran file bukti transfer: handler 5MB vs router body limit 6MB. TA tidak menyebut batas untuk payment upload (KF-07 hanya KF-09 yang menyebut 6MB). |
| I-18 | Confirmation (KF-08) | ⚠️ Minor | Backend tidak memvalidasi `confirmationDeadline` >= hari ini. Frontend enforce H+7 default tapi API bisa menerima deadline lampau. |
| I-19 | Tenant (KF-06) | ⚠️ Minor | `rentalDuration` tidak memiliki unit yang terdefinisi (bulan/minggu) di TA maupun backend. Diasumsikan bulan dari konteks. |
| I-20 | Property response | ⚠️ Minor | Response `GET /properties` menyertakan aggregated fields (`TotalRooms`, `AvailableRooms`, dll) yang tidak ada di ERD TA. Bukan kolom DB, computed join. |
| I-21 | Room response | ⚠️ Minor | `RoomDetail` response menyertakan `ActiveTenantID`, `PendingConfirmationID`, dll — tidak ada di ERD TA tapi logis untuk API detail. |
| I-22 | Tenant model | ⚠️ Minor | `Tenant.RoomID` di Go adalah `*string` (nullable pointer) sedangkan ERD TA mendefinisikan sebagai wajib. Perlu konfirmasi apakah ada skenario roomId null. |
| I-23 | Payment model | ❌ Mayor | `payments.status` di ERD TA memiliki 3 nilai (unpaid/paid/overdue). Go model memiliki 4 nilai termasuk `cancelled` yang digunakan write-off (I-06). ERD TA tidak mencantumkan status ini. |
| I-24 | Dashboard | ⚠️ Minor | `DashboardSummary` menyertakan `MaintenanceSummary` dan `ViewerRequestSummary` yang tidak disebutkan di KF-05 TA. Extra data, tidak mengubah fungsionalitas. |

---

## 10. Prioritas Perbaikan

### P0 — Kritis (harus diperbaiki atau didokumentasikan di TA)

| ID | Aksi |
|----|------|
| I-02 | Tambah `lastLoginIP` ke ERD TA entitas `users` |
| I-03 | Tambah field `password` ke `UpdateUserRequest` ATAU klarifikasi di TA bahwa reset password tidak tersedia via manajemen user |
| I-06 + I-23 | Tambah fitur write-off ke KF-07 TA + tambah status `cancelled` ke ERD payments |
| I-15 | Tambah `contract_reminder` ke `DashboardAlerts` response ATAU klarifikasi di TA bahwa contract expiry hanya notifikasi, bukan panel alerts |

### P1 — Penting (perbaiki sebelum finalisasi TA)

| ID | Aksi |
|----|------|
| I-09 | Ganti `float64` ke `decimal`/integer untuk nilai moneter, atau dokumentasikan pilihan float64 di TA |
| I-17 | Sinkronkan batas upload: handler payment 5MB → 6MB (sama dengan KF-09) atau klarifikasi di TA |
| I-18 | Tambah validasi deadline >= tanggal hari ini di backend |
| I-22 | Konfirmasi dan dokumentasikan apakah `roomId` nullable di tenant |

### P2 — Minor (baik untuk diperbaiki)

| ID | Aksi |
|----|------|
| I-04 | Klarifikasi di TA: role operator tidak bisa diubah via endpoint, hanya bisa set viewer |
| I-19 | Tambah keterangan unit `rentalDuration` (bulan) ke ERD TA |
| I-20, I-21, I-24 | Tambah catatan di TA bahwa response API menyertakan computed/denormalized fields untuk kemudahan frontend |

---

## 11. Non-Goals

- Proposal ini tidak mengaudit tampilan UI/UX frontend terhadap wireframe TA (→ Proposal 4).
- Proposal ini tidak mencakup migration SQL vs ERD TA (perlu akses ke `migrations/` folder).
- Proposal ini tidak mengaudit E2E test coverage.

---

## 12. Langkah Selanjutnya

1. Baca `handler/maintenance_handler.go` untuk konfirmasi MIME validation foto (I-11).
2. Baca `migrations/` untuk audit database schema vs ERD TA.
3. Lanjut ke **Proposal 4** — Frontend pages, components, routing vs TA use case & wireframe.
