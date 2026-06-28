# Proposal Audit 2: Inkonsistensi Domain Confirmation, Maintenance, Notification, WhatsApp, Dashboard, Audit Trail

**Change:** audit-consistency-ta-vs-implementation  
**Proposal:** 2 dari 4  
**Tanggal:** 2026-06-26  
**Scope:** KF-08, KF-09, KF-11, KF-12, KF-13, KF-14 + domain terkait di backend & frontend

---

## 1. Latar Belakang

Proposal ini melanjutkan audit dari Proposal 1. Mencakup domain yang lebih kompleks: konfirmasi DP, maintenance, notifikasi, WhatsApp, dashboard, audit trail, dan viewer request. Banyak domain ini melibatkan background worker, side-effect status kamar, dan integrasi eksternal — area yang paling rawan inkonsistensi antara TA dan implementasi.

Sumber data yang digunakan:
- `model/confirmation.go`, `model/maintenance.go`, `model/notification.go`, `model/wa_config.go`, `model/viewer_request.go`
- `internal/worker/worker.go`
- `internal/router/router.go`
- TA: KF-08, KF-09, KF-11, KF-12, KF-13, KF-14, ERD, Black Box Testing

---

## 2. Domain: Confirmation / Down Payment (KF-08)

### 2.1 Kebutuhan Fungsional vs Implementasi

| Item TA | Backend | Frontend | Status |
|---------|---------|----------|--------|
| Catat konfirmasi DP | `POST /api/v1/confirmations` → Operator | `features/confirmations/components/ConfirmationForm.tsx` | ✅ |
| Update batas tanggal konfirmasi | `PUT /api/v1/confirmations/:id` | ✅ | ✅ |
| Konfirmasi DP → buat tenant sekaligus | `POST /api/v1/confirmations/:id/confirm` → `ConfirmDPRequest` | `features/confirmations/components/ConfirmDpForm.tsx` | ✅ |
| Hanguskan manual oleh Operator | `POST /api/v1/confirmations/:id/expire` | ✅ | ✅ |
| Hangus otomatis via background worker | `worker.runDPExpiration()` | Rekaman berubah status | ✅ |
| Default nominal DP = 10% harga sewa | TA KF-08: "nilai default 10% dari harga sewa" | Frontend autofill | 🔍 perlu verifikasi apakah kalkulasi 10% ada di frontend atau backend |
| Default batas konfirmasi = H+7 | TA KF-08: "nilai default 7 hari dari tanggal pencatatan" | Frontend autofill | 🔍 perlu verifikasi di `ConfirmationForm.tsx` |
| Pengingat 3 hari sebelum batas | `worker.runDPExpiration()` → buat notif `dp_reminder` | `notifications/` | ✅ |
| Blokir konfirmasi kedua untuk kamar yang sama | `confSvc.CreateConfirmation` | Error dari API | ✅ Black box test no. 5 pass |
| Blokir nominal DP > harga sewa | Black box test no. 10 pass | Validasi di service | ✅ |
| Viewer baca saja | GET tanpa RequireRole | RBAC frontend | ✅ |

### 2.2 ERD vs Model (`confirmations`)

| Atribut TA | Go Model (`model/confirmation.go`) | Status |
|-----------|-----------------------------------|--------|
| `id` | `BaseModel.ID` | ✅ |
| `roomId` | `RoomID string` | ✅ |
| `prospectName` | `ProspectName string` | ✅ |
| `phoneNumber` | `PhoneNumber *string` | ✅ |
| `downPaymentAmount` (decimal di TA) | `DownPaymentAmount float64` | ⚠️ TA menyebut tipe `decimal`, Go menggunakan `float64` — potensi presisi floating point |
| `confirmationDeadline` | `ConfirmationDeadline time.Time` | ✅ |
| `remainingDays` (computed) | `RemainingDays *int` | ✅ |
| `status` (pending/confirmed/expired) | konstanta `ConfirmationStatusPending/Confirmed/Expired` | ✅ |
| `createdBy`, `updatedBy` | `BaseModel.CreatedBy`, `BaseModel.UpdatedBy` | ✅ |
| `createdAt`, `updatedAt` | `BaseModel.CreatedAt`, `BaseModel.UpdatedAt` | ✅ |
| *(tidak ada di TA)* | `RoomNumber string`, `PropertyName string` | ⚠️ Field denormalisasi untuk display — tidak ada di ERD TA tapi ada di model Go (pattern konsisten di semua model) |

**Temuan KF-08:**
- ⚠️ **Minor** — TA mendefinisikan `downPaymentAmount` sebagai tipe `decimal` (presisi tinggi untuk nilai moneter). Go menggunakan `float64` yang rentan floating point error untuk nilai uang. Tidak berdampak pada fungsi tapi berpotensi masalah presisi.
- ⚠️ **Pattern Denormalisasi** — Semua model Go menyertakan `RoomNumber` dan `PropertyName` sebagai field denormalisasi untuk kemudahan display. Ini tidak ada di ERD TA tapi konsisten di seluruh codebase. Bukan inkonsistensi fungsional, tapi perlu disebutkan di TA.
- 🔍 **Perlu Verifikasi** — Default 10% dan H+7 apakah dihitung di backend atau hanya di frontend.

---

## 3. Domain: Maintenance (KF-09)

### 3.1 Kebutuhan Fungsional vs Implementasi

| Item TA | Backend | Frontend | Status |
|---------|---------|----------|--------|
| Catat laporan kerusakan | `POST /api/v1/maintenances` → Operator | `features/maintenance/pages/Maintenance.tsx` | ✅ |
| Update tindakan, biaya, status | `PUT /api/v1/maintenances/:id` | `MaintenanceProcessDialog.tsx`, `MaintenanceCompleteDialog.tsx` | ✅ |
| Upload foto kerusakan | `PATCH /api/v1/maintenances/:id/upload-damage` | ✅ | ✅ |
| Upload foto penanganan | `PATCH /api/v1/maintenances/:id/upload-repair` | ✅ | ✅ |
| Status: reported → in_progress → completed | konstanta di `model/maintenance.go` | Dialog status update | ✅ |
| Maintenance logs per laporan | `GET /api/v1/maintenances/:id/logs` | `MaintenanceDetail.tsx` | ✅ |
| Format foto JPEG/PNG/WebP, maks 6MB | TA KF-09: "JPEG, PNG, WebP maks 6MB"; router: `BodyLimit: 6 * 1024 * 1024` | 🔍 perlu verifikasi MIME validation di handler | ⚠️ Body limit sudah dikonfigurasi, MIME validation perlu dikonfirmasi |
| Viewer baca saja | GET tanpa RequireRole | ✅ | ✅ |
| Histori per kamar | relasi `room_id` → filter di `GET /maintenances?roomId=` | `RoomDetail.tsx` tab maintenance | ✅ |
| Biaya pemeliharaan tercatat | `Cost *float64` di model | `UpdateMaintenanceRequest.Cost` | ✅ |
| Delete maintenance | **Tidak ada** di router | **Tidak ada** | ✅ konsisten — TA tidak menyebut delete maintenance |

### 3.2 ERD vs Model (`maintenances`)

| Atribut TA | Go Model (`model/maintenance.go`) | Status |
|-----------|----------------------------------|--------|
| `id` | `BaseModel.ID` | ✅ |
| `roomId` | `RoomID string` | ✅ |
| `reportDate` | `ReportDate time.Time` | ✅ |
| `damageDescription` | `DamageDescription string` | ✅ |
| `repairAction` | `RepairAction *string` | ✅ |
| `cost` | `Cost *float64` | ✅ |
| `damagePhotoUrl` | `DamagePhotoURL *string` | ✅ |
| `repairPhotoUrl` | `RepairPhotoURL *string` | ✅ |
| `status` (reported/in_progress/completed) | konstanta 3 nilai | ✅ |
| `createdBy`, `updatedBy` | `BaseModel.CreatedBy`, `BaseModel.UpdatedBy` | ✅ |
| `createdAt`, `updatedAt` | `BaseModel.CreatedAt/UpdatedAt` | ✅ |
| *(tidak ada di TA)* | `RoomNumber`, `PropertyName` | ⚠️ Denormalisasi, sama dengan pola di domain lain |

### 3.3 ERD vs Model (`maintenance_logs`)

| Atribut TA | Go Model (`MaintenanceLog`) | Status |
|-----------|----------------------------|--------|
| `id` | `ID string` | ✅ |
| `maintenanceId` | `MaintenanceID string` | ✅ |
| `status` | `Status string` | ✅ |
| `notes` | `Notes string` | ✅ |
| `updatedBy` | `UpdatedBy *string` | ✅ |
| `createdAt` | `CreatedAt time.Time` | ✅ |
| *(tidak ada di TA)* | `UpdatedByName string` | ⚠️ Denormalisasi nama untuk display |

**Temuan KF-09:**
- ✅ Semua operasi fungsional konsisten
- ⚠️ **CreateMaintenanceRequest memiliki `PropertyID`** yang tidak ada di ERD TA — digunakan untuk validasi bahwa room berada di properti yang benar, bukan disimpan ke tabel maintenances
- 🔍 **Perlu Verifikasi** — MIME type validation di `maintenance_handler.go` untuk format JPEG/PNG/WebP

---

## 4. Domain: Notification (KF-12)

### 4.1 Kebutuhan Fungsional vs Implementasi

| Item TA | Backend | Frontend | Status |
|---------|---------|----------|--------|
| 6 tipe notifikasi: dp_reminder, dp_expired, payment_due, payment_overdue, contract_reminder, login_new_device | 6 konstanta di `model/notification.go` | `features/notifications/types/index.ts` | ✅ |
| Notifikasi disimpan persisten | entitas `notifications` di DB | List di `NotificationHistory.tsx` | ✅ |
| userId nullable (hanya untuk login_new_device) | `UserID *string` nullable | ✅ | ✅ |
| referenceId untuk pemicu notifikasi | `ReferenceID *string` nullable | ✅ | ✅ |
| Operator tandai baca satu | `PATCH /notifications/:id/read` | ✅ | ✅ |
| Operator tandai semua baca | `PATCH /notifications/read-all` | `NotificationsDropdown.tsx` | ✅ |
| Operator hapus notifikasi yang sudah dibaca | `DELETE /notifications/read` → RequireRole(operator) | ✅ | ✅ |
| Viewer akses notifikasi read-only | GET tanpa RequireRole | ✅ | ✅ |
| Viewer tidak bisa hapus notifikasi | `DELETE` butuh `RequireRole(operator)` | Hide delete button | ✅ |
| Worker buat dp_reminder 3 hari sebelum deadline | `worker.runDPExpiration()` | — | ✅ |
| Worker buat dp_expired saat hangus otomatis | `worker.runDPExpiration()` | — | ✅ |
| Worker buat payment_due saat H-3 jatuh tempo | `worker.runPaymentMonitoring()` | — | ✅ |
| Worker buat payment_overdue saat jatuh tempo terlewati | `worker.runPaymentMonitoring()` | — | ✅ |
| Worker buat contract_reminder saat kontrak hampir berakhir 7 hari | `worker.runContractExpiry()` | — | ✅ |
| login_new_device dibuat saat login dari perangkat baru | `auth_service.go` deteksi LastLoginIP | `NotificationsDropdown.tsx` | ✅ |

### 4.2 ERD vs Model (`notifications`)

| Atribut TA | Go Model (`model/notification.go`) | Status |
|-----------|-----------------------------------|--------|
| `id` | `ID string` | ✅ |
| `userId` (nullable, hanya login_new_device) | `UserID *string` | ✅ |
| `type` (6 nilai) | 6 konstanta NotificationType* | ✅ |
| `referenceId` | `ReferenceID *string` | ✅ |
| `message` | `Message string` | ✅ |
| `isRead` | `IsRead bool` | ✅ |
| `createdAt` | `CreatedAt time.Time` | ✅ |

**Temuan KF-12:**
- ✅ **Fully Consistent** — Semua 6 tipe notifikasi, semua operasi CRUD, dan RBAC sepenuhnya konsisten antara TA, backend, dan frontend.
- ⚠️ **Minor** — TA menyebut notifikasi di `wa_config` dapat dikontrol per tipe (`notif_payment`, `notif_dp`), tapi tidak ada `notif_maintenance` untuk Notification in-app — hanya WA. Perlu konfirmasi apakah `notif_maintenance` di `wa_config` mempengaruhi pembuatan notifikasi in-app atau hanya WA.

---

## 5. Domain: WhatsApp Integration (KF-14)

### 5.1 Kebutuhan Fungsional vs Implementasi

| Item TA | Backend | Frontend | Status |
|---------|---------|----------|--------|
| Pairing via QR | `GET /whatsapp/qr` | `features/whatsapp/` | ✅ |
| Connect | `POST /whatsapp/connect` | ✅ | ✅ |
| Cancel connect | `POST /whatsapp/cancel` | ✅ | ✅ |
| Disconnect / logout | `POST /whatsapp/logout` | ✅ | ✅ |
| Status koneksi | `GET /whatsapp/status` | ✅ | ✅ |
| Semua WA endpoint: Operator only | `wa.Use(RequireRole(operator))` | RBAC frontend | ✅ |
| Konfigurasi nomor penerima | `GET/PUT /settings/wa-config` | `features/profile/pages/Settings.tsx` | ✅ |
| Flag `notification_enabled` | `WAConfigResponse.NotificationEnabled` | Settings toggle | ✅ |
| Flag per-tipe: `notif_payment`, `notif_dp`, `notif_maintenance` | `WAConfigResponse.NotifPayment/DP/Maintenance` | ✅ | ✅ |
| Kirim ke Operator via `wa_config` recipient_numbers | `worker.sendWAOperators()` | — | ✅ |
| Kirim ke penghuni via nomor di data penghuni | `worker.sendWAPersonalTyped()` | — | ✅ |
| Kirim ke calon penghuni via nomor di konfirmasi | `worker.sendWAPersonal()` | — | ✅ |
| Sesi tersimpan lokal (tidak perlu QR ulang setelah restart) | `whatsmeow` session persistence | — | ✅ arsitektur |
| Test endpoint hanya di development | `wa.Post("/test", ...)` gated `cfg.IsDevelopment()` | — | ✅ |

### 5.2 ERD vs Model (`wa_config`)

| Atribut TA (5 entri key-value) | Go Model | Status |
|-------------------------------|----------|--------|
| `recipient_numbers` | `RecipientNumbers []string` | ✅ |
| `notification_enabled` | `NotificationEnabled bool` | ✅ |
| `notif_payment` | `NotifPayment bool` | ✅ |
| `notif_dp` | `NotifDP bool` | ✅ |
| `notif_maintenance` | `NotifMaintenance bool` | ✅ |
| `id`, `key`, `value`, `description`, `updatedBy`, `updatedAt` | `WAConfig struct` | ✅ |

**Temuan KF-14:**
- ✅ **Fully Consistent** — Semua fitur WhatsApp konsisten antara TA, backend, dan frontend.
- ⚠️ **Minor** — TA menyebut "sesi tersimpan lokal sehingga tidak perlu QR ulang setelah server restart" — ini bergantung pada implementasi whatsmeow session store, bukan yang bisa diaudit dari kode model saja. Perlu verifikasi di `whatsapp/service.go`.

---

## 6. Domain: Dashboard (KF-05)

### 6.1 Kebutuhan Fungsional vs Implementasi

| Item TA | Backend | Frontend | Status |
|---------|---------|----------|--------|
| Tampilan status kamar semua properti | `GET /dashboard` → `dashSvc` | `features/dashboard/pages/Dashboard.tsx` | ✅ |
| Ringkasan statistik hunian | `GET /dashboard` → aggregasi | `DashboardCards.tsx` | ✅ |
| Panel peringatan aktif | `GET /dashboard/alerts` | `DashboardCards.tsx` alert section | ✅ |
| Alert: pembayaran mendekati/melewati jatuh tempo | `dashboard/alerts` payment_due + overdue | ✅ | ✅ |
| Alert: konfirmasi DP mendekati/terlewati | `dashboard/alerts` dp_reminder + dp_expired | ✅ | ✅ |
| Viewer dapat akses dashboard | `GET /dashboard` tanpa RequireRole | ✅ | ✅ |
| Viewer Request panel di dashboard | `features/dashboard/components/ViewerRequestPanel.tsx` | ✅ | ✅ |

**Temuan KF-05:**
- ✅ **Fully Consistent** — Dashboard sudah mencakup semua yang disebutkan di KF-05.
- 🔍 **Perlu Verifikasi** — Apakah `dashboard/alerts` juga menyertakan `contract_reminder` (kontrak hampir berakhir 7 hari) sebagai alert, atau hanya notifikasi. TA KF-05 menyebut "alert pembayaran mendekati jatuh tempo dan batas tanggal konfirmasi DP" tapi tidak secara eksplisit menyebut contract expiry di dashboard alerts.

---

## 7. Domain: Audit Trail (KF-11)

### 7.1 Kebutuhan Fungsional vs Implementasi

| Item TA | Backend | Frontend | Status |
|---------|---------|----------|--------|
| Log setiap perubahan status kamar otomatis | Semua status change trigger insert ke `room_status_logs` | — | ✅ |
| Simpan: kamar, oldStatus, newStatus, waktu, pemicu | `room_status_logs`: roomId, oldStatus, newStatus, changedBy (nullable), createdAt | ✅ | ✅ |
| `changedBy` null jika dipicu background job | `room_status_logs.changedBy` → FK ke users nullable | ✅ | ✅ |
| Filter: properti, kamar, rentang tanggal, pemicu | `GET /audit/room-status` dengan query params | `features/audit/pages/AuditTrailPage.tsx` | ✅ |
| Ekspor log | `GET /audit/room-status/export` | ✅ | ✅ |
| Log tidak bisa dihapus oleh siapapun | **Tidak ada endpoint DELETE** di audit group | Tidak ada tombol delete | ✅ |
| Hanya Operator yang bisa akses | `audit` group: `RequireRole(operator)` | ProtectedRoute RBAC | ✅ |
| Viewer tidak bisa akses audit trail | `RequireRole(operator)` memblokir Viewer | ✅ | ✅ |

### 7.2 ERD vs Model (`room_status_logs`)

| Atribut TA | Go Model (via `auditSvc`) | Status |
|-----------|--------------------------|--------|
| `id` | ✅ | ✅ |
| `roomId` | ✅ | ✅ |
| `oldStatus` | ✅ | ✅ |
| `newStatus` | ✅ | ✅ |
| `changedBy` (FK users, nullable) | ✅ | ✅ |
| `createdAt` | ✅ | ✅ |

**Temuan KF-11:**
- ✅ **Fully Consistent** — Audit trail sepenuhnya konsisten antara TA dan implementasi.

---

## 8. Domain: Viewer Request (KF-13)

### 8.1 Kebutuhan Fungsional vs Implementasi

| Item TA | Backend | Frontend | Status |
|---------|---------|----------|--------|
| Viewer ajukan permintaan | `POST /viewer-requests` → RequireRole(viewer) | `features/viewer-requests/pages/ViewerRequestsPage.tsx` | ✅ |
| Operator lihat daftar permintaan | `GET /viewer-requests` → RequireRole(operator) | `features/profile/components/ViewerRequestsCard.tsx` | ✅ |
| 3 tipe: payment, damage, prospect | konstanta `ViewerRequestType*` | Form dropdown | ✅ |
| Status: forwarded atau wa_failed (atomik saat buat) | `ViewerRequestStatusForwarded/WAFailed` | Indikator status | ✅ |
| prospectName dan prospectPhone opsional (hanya untuk prospect) | `ProspectName *string`, `ProspectPhone *string` | Form conditional fields | ✅ |
| Kirim notifikasi WA ke Operator saat dibuat | `viewerReqHandler.Create` → `waSvc` | — | ✅ |
| Permintaan tetap tersimpan meski WA gagal | Status `wa_failed` tetap simpan ke DB | ✅ | ✅ |
| `roomId` wajib | `validate:"required"` di `CreateViewerRequestPayload` | Form required field | ✅ |
| `roomNumber` denormalisasi | `RoomNumber string` di model | ✅ | ✅ |
| `reporterName` denormalisasi | `ReporterName string` di model | ✅ | ✅ |
| Penanganan di luar sistem via WA langsung | Tidak ada endpoint update/close | Tidak ada action button | ✅ desain disengaja |

### 8.2 ERD vs Model (`viewer_requests`)

| Atribut TA | Go Model (`model/viewer_request.go`) | Status |
|-----------|--------------------------------------|--------|
| `id` | `ID string` | ✅ |
| `requestType` (payment/damage/prospect) | `RequestType string` + konstanta | ✅ |
| `roomId` | `RoomID string` | ✅ |
| `roomNumber` (denormalisasi) | `RoomNumber string` | ✅ |
| `description` | `Description string` | ✅ |
| `prospectName` (opsional) | `ProspectName *string` | ✅ |
| `prospectPhone` (opsional) | `ProspectPhone *string` | ✅ |
| `createdBy` | `CreatedBy *string` | ✅ |
| `reporterName` (denormalisasi) | `ReporterName string` | ✅ |
| `status` (forwarded/wa_failed) | konstanta `ViewerRequestStatus*` | ✅ |
| `createdAt` | `CreatedAt time.Time` | ✅ |
| *(tidak ada di TA)* | `PropertyName string` | ⚠️ Denormalisasi tambahan untuk display |
| *(tidak ada di TA)* | `CreateViewerRequestPayload.PropertyID` | ⚠️ Field tambahan untuk validasi room-property, tidak disimpan ke tabel |

**Temuan KF-13:**
- ✅ **Fully Consistent** — Semua mekanisme Viewer Request konsisten.
- ⚠️ **Minor** — `CreateViewerRequestPayload` memiliki `PropertyID` yang tidak ada di ERD TA. Digunakan untuk validasi server-side bahwa room milik properti yang benar, tidak disimpan ke DB. Pattern sama seperti di CreateMaintenanceRequest.

---

## 9. Ringkasan Temuan Proposal 2

### Inkonsistensi yang Ditemukan

| # | Domain | Tipe | Deskripsi |
|---|--------|------|-----------|
| I-09 | Confirmation (KF-08) | ⚠️ Minor | `downPaymentAmount` di TA bertipe `decimal`, implementasi Go menggunakan `float64` — potensi presisi floating point untuk nilai moneter |
| I-10 | Confirmation (KF-08) | 🔍 Verifikasi | Default 10% DP dan H+7 deadline — perlu konfirmasi kalkulasi ada di frontend atau backend/service |
| I-11 | Maintenance (KF-09) | 🔍 Verifikasi | MIME type validation untuk JPEG/PNG/WebP di `maintenance_handler.go` belum dikonfirmasi |
| I-12 | Maintenance (KF-09) | ⚠️ Minor | `CreateMaintenanceRequest` memiliki `PropertyID` untuk validasi — tidak ada di ERD TA tapi bukan field yang disimpan ke DB |
| I-13 | Notification (KF-12) | ⚠️ Minor | `notif_maintenance` di `wa_config` mengontrol WA notification, perlu konfirmasi apakah juga mempengaruhi in-app notification atau hanya WA |
| I-14 | WhatsApp (KF-14) | 🔍 Verifikasi | Persistensi sesi whatsmeow perlu diverifikasi di `whatsapp/service.go` |
| I-15 | Dashboard (KF-05) | 🔍 Verifikasi | Perlu konfirmasi apakah `contract_reminder` termasuk dalam `dashboard/alerts` response atau hanya notifikasi |
| I-16 | Viewer Request (KF-13) | ⚠️ Minor | `CreateViewerRequestPayload.PropertyID` untuk validasi server-side — tidak ada di ERD TA, pattern sama dengan Maintenance |

### Pattern Inkonsistensi Lintas Domain (Temuan Sistemik)

| Pattern | Deskripsi | Dampak |
|---------|-----------|--------|
| **Denormalisasi Display Fields** | Semua model Go menyertakan `RoomNumber`, `PropertyName`, dan kadang `TenantName` sebagai field join result. Tidak ada di ERD TA. | ⚠️ Minor — ERD TA perlu catatan bahwa field ini computed join, bukan kolom tabel |
| **`PropertyID` di Request DTO** | `CreateMaintenanceRequest` dan `CreateViewerRequestPayload` memiliki `PropertyID` untuk validasi, tidak untuk penyimpanan. Tidak ada di ERD TA. | ⚠️ Minor — Dokumentasi TA perlu menjelaskan ini sebagai field validasi |
| **`float64` untuk nilai moneter** | `downPaymentAmount`, `cost`, `amount`, `rent_price` semua menggunakan `float64`. TA menyebut `decimal` untuk downPaymentAmount. | ❌ Perlu konsistensi — idealnya gunakan integer (sen/rupiah) atau library presisi |

---

## 10. Non-Goals

- Proposal ini tidak mengaudit API response shape secara detail (→ Proposal 3).
- Proposal ini tidak mengaudit frontend page-by-page terhadap wireframe TA (→ Proposal 4).
- Proposal ini tidak mencakup domain Auth, Property, Room, Tenant, Payment (→ Proposal 1).

---

## 11. Langkah Selanjutnya

1. Baca `whatsapp/service.go` untuk konfirmasi I-14 (sesi persistence).
2. Baca `handler/maintenance_handler.go` untuk konfirmasi I-11 (MIME validation).
3. Baca `service/confirmation_service.go` untuk konfirmasi I-10 (default 10% dan H+7).
4. Baca `service/dashboard_service.go` untuk konfirmasi I-15 (contract_reminder di alerts).
5. Lanjut ke **Proposal 3** — API Contract, DTO shape, response format vs TA.
