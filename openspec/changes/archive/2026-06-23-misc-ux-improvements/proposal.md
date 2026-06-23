# Proposal: Misc UX Improvements

**Change ID:** misc-ux-improvements  
**Tanggal:** 2026-06-22  
**Priority:** Medium  
**Author:** AI Agent  
**Status:** Proposed

---

## Problem Statement

Beberapa UX improvements kecil yang tersebar di berbagai halaman belum diimplementasi:
- Sort di semua list pages (properties, rooms, tenants, payments)
- Filter by tipe kamar di Rooms page
- Periode navigation (prev/next bulan) di Payments page
- Tab pending vs completed di Confirmations page
- Filter tanggal + filter jenis perubahan di Audit Trail page
- Filter by tipe notifikasi + real-time badge update di Notifications

---

## Goals

1. **Sort** — tambah sort control di Properties, Rooms, Tenants list
2. **Rooms filter** — tambah filter by tipe kamar
3. **Payments periode navigation** — tombol prev/next bulan
4. **Confirmations tabs** — tab "Pending" vs "Selesai (Confirmed + Expired)"
5. **Audit Trail filters** — filter by date range dan jenis perubahan
6. **Notifications** — filter by tipe + polling/refetch otomatis untuk badge

---

## Non-Goals

- Export CSV/PDF (di-hold)
- Bulk operations
- Real-time WebSocket push (gunakan polling sederhana)
- Timezone preference

---

## Acceptance Criteria

### AC1: Sort di List Pages
- SHALL tambah dropdown sort di Properties list: by nama (A-Z/Z-A), jumlah kamar
- SHALL tambah dropdown sort di Rooms list: by nomor kamar, harga sewa, status
- SHALL tambah dropdown sort di Tenants list: by nama, tanggal masuk
- SHALL sort dilakukan di frontend (client-side) karena data sudah di-fetch dengan pagination

### AC2: Rooms — Filter Tipe Kamar
- SHALL tambah filter dropdown: "Semua Tipe", "1 Petak", "2 Petak", "3 Petak"
- SHALL filter by field `tipe` di room data
- SHALL dikirim sebagai query param ke backend kalau backend support, atau filter client-side

### AC3: Payments — Periode Navigation
- SHALL tampilkan tombol `<` (prev bulan) dan `>` (next bulan) di samping filter periode
- SHALL update filter periode otomatis saat diklik
- SHALL format periode: `YYYY-MM` (sudah sesuai existing format)
- SHALL disable tombol next kalau periode sudah bulan berjalan

### AC4: Confirmations — Tab Pending vs Selesai
- SHALL tambah dua tab: "Menunggu" (status=pending) dan "Selesai" (status=confirmed atau expired)
- SHALL tab "Menunggu" sebagai default tab
- SHALL filter by status otomatis sesuai tab aktif
- SHALL count badge di tab "Menunggu" menampilkan jumlah pending

### AC5: Audit Trail — Tambahan Filter
- SHALL tambah date range picker (dari tanggal — sampai tanggal)
- SHALL tambah filter jenis perubahan: "Semua", "→ Occupied", "→ Available", "→ DP Confirmation"
- SHALL filter dikirim ke backend sebagai query params
- **Backend:** update `GET /api/v1/audit/room-status` untuk support query params: `from_date`, `to_date`, `new_status`

### AC6: Notifications — Filter Tipe + Auto Refresh
- SHALL tambah filter tabs/chips: "Semua", "Pengingat DP", "Pembayaran"
- SHALL filter by `tipe` query param ke backend (sudah support di `FindAll`)
- SHALL badge count di navbar di-refresh otomatis setiap 60 detik via React Query `refetchInterval`

---

## Technical Approach

### Backend (Sistem-Hunian-Go)
- Update `GetRoomStatusLogs` di `audit_repo.go` untuk support filter `from_date`, `to_date`, `new_status`
- Update `audit_handler.go` untuk parse query params baru
- Update `audit_service.go` interface

### Frontend (Sistem-Hunian-V2)
- **Properties.tsx** — tambah sort state + useMemo untuk sorted list
- **Rooms.tsx** — tambah tipe filter + sort state
- **Tenants.tsx** — tambah sort state
- **Payments.tsx** — tambah periode navigation buttons
- **ConfirmationsPage.tsx** — tambah tabs dengan count badge
- **AuditTrailPage.tsx** — tambah date range picker + status filter
- **NotificationHistory.tsx** — tambah tipe filter chips
- **NotificationsDropdown.tsx** — tambah `refetchInterval: 60000` di React Query

---

## Dependencies

- Shadcn `Tabs` component sudah ada
- Date picker: gunakan `<input type="date">` native atau Shadcn Calendar/Popover
- Semua filter yang client-side tidak butuh backend change

---

## Risks

- Client-side sort/filter konsisten dengan server-side pagination — pastikan sort diterapkan pada data halaman yang sudah di-fetch, bukan seluruh dataset
- Polling 60 detik untuk badge: minimal impact, tidak perlu WebSocket
