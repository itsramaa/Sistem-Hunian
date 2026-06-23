# Proposal: Detail Page Inline Histories

**Change ID:** detail-page-inline-histories  
**Tanggal:** 2026-06-22  
**Priority:** Medium  
**Author:** AI Agent  
**Status:** Proposed

---

## Problem Statement

Halaman detail (Room Detail, Tenant Detail, Property Detail) saat ini hanya menyediakan link "lihat riwayat" yang navigasi ke halaman lain. Pengguna harus berpindah halaman untuk melihat 3-5 data terakhir yang sebenarnya cukup ditampilkan inline. Ini menambah friction operasional yang tidak perlu.

---

## Goals

1. **Room Detail** — inline 3-5 pembayaran terakhir + 3-5 maintenance terakhir + DP confirmation info (kalau status `dp_confirmation`)
2. **Tenant Detail** — inline 3-5 pembayaran terakhir + status pembayaran bulan ini
3. **Property Detail** — inline 5 kamar teratas + inline active tenants + maintenance aktif count

---

## Non-Goals

- Histori tenant (siapa yang pernah tinggal) — Low priority, di-hold
- Perpanjang kontrak inline — separate change
- Export data dari detail page

---

## User Stories

**Operator:**
- Sebagai operator, saya ingin melihat 3-5 pembayaran terakhir di Room Detail tanpa harus navigasi ke halaman pembayaran.
- Sebagai operator, saya ingin melihat info DP confirmation (calon penghuni, batas tanggal, sisa hari) di Room Detail kalau status kamar `dp_confirmation`.
- Sebagai operator, saya ingin melihat status pembayaran bulan ini di Tenant Detail secara langsung.

**Manager:**
- Sebagai manager, saya ingin melihat daftar kamar dan maintenance aktif di Property Detail tanpa harus navigasi ke halaman lain.

---

## Acceptance Criteria

### AC1: Room Detail — Inline Payment History
- SHALL menampilkan maksimal 5 pembayaran terakhir untuk kamar ini
- SHALL menampilkan: periode, nominal, status badge, tanggal bayar
- SHALL ada link "Lihat semua" yang navigasi ke `/dashboard/payments?room_id=<id>`
- SHALL ditampilkan untuk semua role yang punya akses room detail

### AC2: Room Detail — Inline Maintenance History
- SHALL menampilkan maksimal 5 maintenance terakhir untuk kamar ini
- SHALL menampilkan: tanggal laporan, deskripsi (truncated 50 char), status badge
- SHALL ada link "Lihat semua" yang navigasi ke `/dashboard/maintenance?room_id=<id>`

### AC3: Room Detail — DP Confirmation Info
- SHALL menampilkan section khusus hanya kalau status kamar = `dp_confirmation`
- SHALL menampilkan: nama calon penghuni, nomor HP calon, batas tanggal konfirmasi, sisa hari
- SHALL menampilkan warning badge kalau sisa hari ≤ 3

### AC4: Tenant Detail — Inline Payment History
- SHALL menampilkan maksimal 5 pembayaran terakhir untuk tenant ini
- SHALL menampilkan: periode, nominal, status badge, tanggal bayar
- SHALL menampilkan "Status bulan ini: Lunas / Belum Bayar / Terlambat" sebagai badge prominan di atas section

### AC5: Property Detail — Inline Rooms List
- SHALL menampilkan maksimal 5 kamar dengan: nomor kamar, tipe, status badge, harga
- SHALL ada link "Lihat semua kamar" ke `/dashboard/rooms?property_id=<id>`

### AC6: Property Detail — Inline Active Tenants
- SHALL menampilkan maksimal 5 tenant aktif di properti ini: nama, nomor kamar, tanggal masuk
- SHALL ada link "Lihat semua penghuni" ke `/dashboard/tenants?property_id=<id>`

### AC7: Property Detail — Maintenance Aktif
- SHALL menampilkan count laporan `reported` dan `in_progress` di properti ini
- SHALL sebagai badge/card sederhana, bukan list

---

## Technical Approach

### Backend (Sistem-Hunian-Go)
- Endpoint yang sudah ada sudah support filter by `room_id` dan `property_id`
- **Tidak perlu endpoint baru** — frontend cukup query existing endpoints dengan filter + limit kecil
- `GET /api/v1/payments?room_id=X&limit=5` — sudah ada
- `GET /api/v1/maintenances?room_id=X&limit=5` — sudah ada
- `GET /api/v1/rooms?property_id=X&limit=5` — perlu verifikasi support limit
- `GET /api/v1/tenants?property_id=X&limit=5` — perlu verifikasi support limit
- Untuk DP confirmation info di room detail: ambil dari `GET /api/v1/confirmations?room_id=X&status=pending&limit=1`

### Frontend (Sistem-Hunian-V2)
- **Room Detail** (`features/rooms/pages/RoomDetail.tsx`): tambah `InlinePaymentHistory`, `InlineMaintenanceHistory`, `DPConfirmationInfo` sections
- **Tenant Detail** (`features/tenant/pages/TenantDetail.tsx`): tambah `InlinePaymentHistory`, `CurrentMonthPaymentStatus` sections  
- **Property Detail** (`features/properties/pages/PropertyDetail.tsx`): tambah `InlineRoomsList`, `InlineActiveTenants`, `MaintenanceActiveBadge` sections
- Buat shared component `InlineHistoryTable` yang reusable

---

## Dependencies

- Semua endpoint yang dibutuhkan sudah ada di backend
- Perlu verifikasi backend support `limit` query param di semua endpoints

---

## Risks

- N+1 request di detail page — mitigasi: semua query paralel via `Promise.all` / React Query parallel queries
- Perlu cek apakah `confirmations` endpoint support filter by `room_id`
