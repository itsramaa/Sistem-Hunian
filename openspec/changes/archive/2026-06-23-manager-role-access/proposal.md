# Proposal: Manager Role Access

**Change ID:** manager-role-access  
**Tanggal:** 2026-06-22  
**Priority:** Medium  
**Author:** AI Agent  
**Status:** Proposed

---

## Problem Statement

Role manager saat ini hanya bisa akses Dashboard dan Maintenance. Namun secara operasional, manager perlu bisa melihat (read-only) kondisi properti, status kamar, daftar penghuni, status pembayaran, dan konfirmasi DP — tanpa bisa melakukan perubahan data. Tanpa akses ini, manager harus selalu bertanya ke operator untuk informasi dasar.

---

## Goals

Berikan manager read-only access ke:
1. Properties list + detail
2. Rooms list + detail
3. Tenants list + detail (tanpa data sensitif seperti nomor identitas)
4. Payments list (tanpa upload bukti, mark paid, edit)
5. Confirmations list (tanpa create, confirm, expire, edit)

---

## Non-Goals

- Manager tidak boleh create, edit, delete data apapun di halaman tersebut
- Manager tidak perlu akses ke Settings/User Management
- Manager tidak perlu akses ke Audit Trail (sudah ada)

---

## User Stories

**Manager:**
- Sebagai manager, saya ingin melihat list dan detail properti agar bisa monitor kondisi aset tanpa tanya operator.
- Sebagai manager, saya ingin melihat status kamar agar bisa tahu kamar mana yang kosong/terisi.
- Sebagai manager, saya ingin melihat daftar penghuni aktif agar bisa tahu siapa yang tinggal.
- Sebagai manager, saya ingin melihat status pembayaran agar bisa monitor tunggakan tanpa akses ke data sensitif.
- Sebagai manager, saya ingin melihat konfirmasi DP yang pending agar bisa tahu calon penghuni yang akan masuk.

---

## Acceptance Criteria

### AC1: Backend RBAC Update
- SHALL mengizinkan role `manager` akses GET endpoints: `/properties`, `/properties/:id`, `/rooms`, `/rooms/:id`, `/tenants`, `/tenants/:id`, `/payments`, `/payments/:id`, `/confirmations`, `/confirmations/:id`
- SHALL tetap blokir manager dari POST/PUT/DELETE/PATCH di endpoint tersebut (kecuali maintenance yang sudah ada)
- SHALL audit trail tetap read-only untuk manager (sudah ada)

### AC2: Frontend Sidebar Navigation
- SHALL menampilkan menu Properties, Rooms, Tenants, Payments, Confirmations di sidebar untuk role manager
- SHALL navigasi ke halaman yang sama dengan operator

### AC3: Frontend — Sembunyikan Action Buttons untuk Manager
- SHALL menyembunyikan tombol Create, Edit, Delete, Checkout, Mark Paid, Upload, Confirm DP, Expire di semua halaman tersebut untuk role manager
- SHALL menggunakan `useAuth()` untuk cek role di setiap halaman
- SHALL tetap menampilkan tombol navigasi (lihat detail, dll)

### AC4: Tenants — Sembunyikan Data Sensitif untuk Manager
- SHALL menyembunyikan field `nomor_identitas` (KTP/SIM) di tenant list dan detail untuk role manager
- SHALL tetap menampilkan: nama, nomor kamar, telepon, tanggal masuk, durasi

---

## Technical Approach

### Backend (Sistem-Hunian-Go)
- Update `middleware.RequireRole()` di router untuk GET endpoints yang saat ini hanya operator
- Saat ini sebagian besar GET endpoints sudah `protected` (semua authenticated roles) — perlu verifikasi per endpoint

### Frontend (Sistem-Hunian-V2)
- Update sidebar navigation: tambah conditional rendering untuk role manager
- Update setiap page component: wrap action buttons dengan `{profile?.role === 'operator' && ...}`
- Update Tenants page/detail: conditional hide `nomor_identitas` untuk manager

---

## Dependencies

- `useAuth()` hook sudah ada dan expose `profile?.role`
- Backend `middleware.RequireRole()` sudah ada
- Verifikasi: apakah GET `/payments`, `/confirmations` saat ini sudah accessible oleh manager?

---

## Risks

- Perlu audit setiap halaman untuk pastikan tidak ada action buttons yang terlewat untuk disembunyikan
- Nomor identitas tersembunyi untuk manager — pastikan tidak bocor via API response (backend juga perlu filter kalau perlu)
