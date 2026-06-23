# Proposal: Dashboard Enhancements

**Change ID:** dashboard-enhancements  
**Tanggal:** 2026-06-22  
**Priority:** Medium  
**Author:** AI Agent  
**Status:** Proposed

---

## Problem Statement

Dashboard saat ini hanya menampilkan aggregate summary (total properti, kamar, status). Tidak ada breakdown per properti, tidak ada quick actions, tidak ada maintenance summary, dan viewer tidak punya visual yang bermakna. Operator/manager harus navigasi ke page lain untuk melakukan aksi umum seperti catat pembayaran atau tambah DP.

---

## Goals

1. Tambah **breakdown per properti** — occupancy per properti di dashboard
2. Tambah **quick action buttons** — shortcut ke form create payment, confirmation DP, maintenance
3. Tambah **maintenance status summary** — count reported/in_progress yang belum selesai
4. Tambah **viewer room status visual** — grid sederhana occupancy per properti untuk role viewer

---

## Non-Goals

- Export/generate laporan dari dashboard
- Chart/grafik historis pendapatan (belum di scope)
- Real-time push notifications

---

## User Stories

**Operator:**

- Sebagai operator, saya ingin melihat occupancy per properti di dashboard agar bisa langsung tahu properti mana yang perlu perhatian tanpa harus ke halaman properti.
- Sebagai operator, saya ingin tombol quick action di dashboard agar bisa langsung catat pembayaran/DP/maintenance dalam 1 klik.

**Manager:**

- Sebagai manager, saya ingin melihat berapa laporan maintenance yang belum selesai di dashboard agar bisa prioritaskan tindakan.

**Viewer:**

- Sebagai viewer, saya ingin melihat status kamar per properti (terisi/kosong) di dashboard agar bisa memberikan info ke calon penghuni tanpa tanya operator.

---

## Acceptance Criteria

### AC1: Dashboard Breakdown Per Properti

- SHALL menampilkan list properti dengan: nama, total kamar, occupied, available, dp_confirmation
- SHALL menampilkan occupancy rate sebagai progress bar per properti
- SHALL hanya ditampilkan untuk role operator dan manager

### AC2: Quick Action Buttons

- SHALL menampilkan 3 tombol: "Catat Pembayaran", "Tambah Konfirmasi DP", "Catat Maintenance"
- SHALL navigate ke halaman relevan saat diklik (payments, confirmations, maintenance)
- SHALL hanya ditampilkan untuk role operator
- SHALL menggunakan icon yang jelas (Banknote, FileCheck, Wrench)

### AC3: Maintenance Status Summary

- SHALL menampilkan count laporan dengan status `reported` dan `in_progress`
- SHALL ditampilkan sebagai card/badge di dashboard
- SHALL hanya untuk role operator dan manager

### AC4: Viewer Room Status Grid

- SHALL menampilkan per properti: nama, jumlah occupied, jumlah available
- SHALL ditampilkan sebagai grid sederhana (bukan table)
- SHALL ONLY ditampilkan untuk role viewer

---

## Technical Approach

### Backend (Sistem-Hunian-Go)

- Extend `GET /api/v1/dashboard` response: tambah field `properti_summary` (array per properti dengan occupancy stats)
- Extend `GET /api/v1/dashboard` response: tambah field `maintenance_summary` (count reported, in_progress)
- Query baru di `dashboard_repo.go` dengan JOIN properties → rooms → GROUP BY property

### Frontend (Sistem-Hunian-V2)

- Update `DashboardSummary` type di `useDashboard.ts`
- Tambah komponen `PropertyBreakdownSection` di `Dashboard.tsx`
- Tambah komponen `QuickActionsSection` di `Dashboard.tsx` (operator only)
- Tambah komponen `MaintenanceSummaryCard` di `Dashboard.tsx` (operator/manager only)
- Tambah komponen `ViewerRoomGrid` di `Dashboard.tsx` (viewer only)

---

## Dependencies

- Backend endpoint `/api/v1/dashboard` harus di-extend (tidak breaking — additive)
- Frontend `useDashboard` hook perlu update type

---

## Risks

- Query dashboard bisa lambat kalau properti banyak — mitigasi: query efisien dengan single JOIN query bukan N+1
- Role differentiation di frontend harus tepat — viewer tidak boleh lihat quick actions

---

## Out of Scope

- Chart historis pendapatan
- Export dashboard
- Real-time update tanpa refresh
