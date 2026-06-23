# Proposal: Maintenance Photo Upload

**Change ID:** maintenance-photo-upload  
**Tanggal:** 2026-06-22  
**Priority:** Medium  
**Author:** AI Agent  
**Status:** Proposed

---

## Problem Statement

Laporan maintenance saat ini hanya menyimpan deskripsi teks dan tindakan penanganan. Tidak ada dokumentasi foto kerusakan maupun foto setelah perbaikan. Tanpa foto, sulit memverifikasi kondisi kerusakan dan hasil perbaikan, terutama untuk audit atau dispute dengan tenant.

---

## Goals

1. Tambah kemampuan upload foto kerusakan saat create maintenance atau dari detail page
2. Tambah kemampuan upload foto penanganan saat update progress maintenance
3. Tampilkan foto-foto tersebut di Maintenance Detail page

---

## Non-Goals

- Multiple foto per upload (single foto per jenis sudah cukup)
- Video upload
- Kompresi foto di frontend (biarkan backend handle size limit)
- Foto di maintenance list page

---

## User Stories

**Operator/Manager:**
- Sebagai operator, saya ingin upload foto kerusakan saat membuat laporan maintenance agar ada dokumentasi visual kondisi awal.
- Sebagai operator, saya ingin upload foto penanganan saat mengupdate progress maintenance agar ada bukti perbaikan telah dilakukan.
- Sebagai operator/manager, saya ingin melihat foto kerusakan dan foto penanganan di detail maintenance.

---

## Acceptance Criteria

### AC1: Backend — Model Update
- SHALL tambah kolom `foto_kerusakan_url` (nullable TEXT) di tabel `maintenances`
- SHALL tambah kolom `foto_penanganan_url` (nullable TEXT) di tabel `maintenances`
- SHALL migration baru (000012) untuk ALTER TABLE

### AC2: Backend — Upload Endpoint
- SHALL ada endpoint `PATCH /api/v1/maintenances/:id/upload-kerusakan` untuk upload foto kerusakan
- SHALL ada endpoint `PATCH /api/v1/maintenances/:id/upload-penanganan` untuk upload foto penanganan
- SHALL upload ke R2/MinIO (sama dengan pattern payment `UploadBuktiTransfer`)
- SHALL require role operator atau manager
- SHALL validasi: file harus image (jpeg/png/webp), max 5MB

### AC3: Backend — Response Update
- SHALL `GET /api/v1/maintenances/:id` response include `foto_kerusakan_url` dan `foto_penanganan_url`
- SHALL `GET /api/v1/maintenances` list response include kedua field tersebut

### AC4: Frontend — Create Form
- SHALL tambah optional file input "Foto Kerusakan" di `CreateMaintenanceForm`
- SHALL upload setelah create berhasil (separate PATCH request)
- SHALL tampilkan preview thumbnail kalau foto sudah dipilih

### AC5: Frontend — Update Form (Detail Page)
- SHALL tambah optional file input "Foto Penanganan" di update progress modal di `MaintenanceDetail.tsx`
- SHALL upload setelah update berhasil

### AC6: Frontend — Detail Display
- SHALL tampilkan foto kerusakan di section tersendiri kalau ada
- SHALL tampilkan foto penanganan di section tersendiri kalau ada
- SHALL foto bisa diklik untuk open full size (lightbox sederhana atau buka di tab baru)

---

## Technical Approach

### Backend (Sistem-Hunian-Go)
- Tambah kolom ke model `Maintenance` struct: `FotoKerusakanURL *string`, `FotoPenangananURL *string`
- Buat handler `UploadFotoKerusakan` dan `UploadFotopenanganan` mengikuti pattern `UploadBuktiTransfer` di `payment_handler.go`
- Update `FindByID` dan `FindAll` query untuk include kolom baru
- Buat migration `000012_maintenance_photos.sql`

### Frontend (Sistem-Hunian-V2)
- Update `Maintenance` type di `features/maintenance/types/index.ts`
- Update `maintenanceService.ts` dengan fungsi upload
- Update `useMaintenance.ts` dengan mutation hook baru
- Update `Maintenance.tsx` (create form) dan `MaintenanceDetail.tsx` (update modal + display)

---

## Dependencies

- R2/MinIO client sudah ada (`internal/pkg/r2client/`)
- Pattern upload sudah ada di payment handler — tinggal replicate
- Migration sequential: next adalah `000012`

---

## Risks

- Kalau R2 tidak dikonfigurasi (dev env), upload akan gagal — perlu graceful error message
- File size validation harus konsisten antara frontend dan backend (max 5MB)
