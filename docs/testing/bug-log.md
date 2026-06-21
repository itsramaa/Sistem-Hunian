# Bug Log — SiHuni Black Box Testing

> Sesi pengujian: Black Box Testing — Role Operator
> Tanggal: 2026-06-20
> **Status Update: 2026-06-21 — Semua bug telah diperbaiki**
> URL: https://sihuni-frontend-holycans-projects.vercel.app
> GitHub Issues: https://github.com/itsramaa/Sistem-Hunian/issues

---

## Daftar Bug

### BUG-001: Halaman login refresh otomatis setelah login gagal — pesan error tidak terbaca
- **TC**: TC-02 | **Prioritas**: High | **Halaman**: `/login`
- **Actual**: Pesan error muncul sebentar lalu halaman refresh otomatis.
- **GitHub Issue**: [#66](https://github.com/itsramaa/Sistem-Hunian/issues/66)

### BUG-002: Pesan error hapus properti menampilkan jumlah kamar yang salah
- **TC**: TC-06 | **Prioritas**: Medium | **Halaman**: `/dashboard/properties`
- **Actual**: Muncul "masih memiliki 1 kamar" padahal Kos Melati memiliki 3 kamar.
- **GitHub Issue**: [#67](https://github.com/itsramaa/Sistem-Hunian/issues/67)

### BUG-003: Pesan error tambah kamar duplikat tidak informatif
- **TC**: TC-07 | **Prioritas**: Medium | **Halaman**: `/dashboard/rooms`
- **Actual**: Pesan hanya "Gagal menambahkan kamar" — tidak menjelaskan alasan.
- **GitHub Issue**: [#68](https://github.com/itsramaa/Sistem-Hunian/issues/68)

### BUG-004: Filter status "Expired" pada Konfirmasi DP tidak menampilkan data
- **TC**: TC-11b | **Prioritas**: High | **Halaman**: `/dashboard/confirmations`
- **Actual**: Filter "Semua" dan "Expired" tidak menampilkan data expired setelah filter diganti-ganti.
- **GitHub Issue**: [#69](https://github.com/itsramaa/Sistem-Hunian/issues/69)

### BUG-005: Aksi "Tandai Hangus" tidak menggunakan dialog konfirmasi seperti aksi lainnya
- **TC**: TC-11b | **Prioritas**: Low | **Halaman**: `/dashboard/confirmations`
- **Actual**: Tidak menggunakan dialog popup standar — inkonsistensi UX.
- **GitHub Issue**: [#70](https://github.com/itsramaa/Sistem-Hunian/issues/70)

### BUG-006: Tombol "Choose File" pada upload bukti transfer tidak bisa diklik
- **TC**: TC-13b | **Prioritas**: High | **Halaman**: `/dashboard/payments`
- **Actual**: Tombol tidak merespons klik. Hanya drag & drop yang berfungsi.
- **GitHub Issue**: [#71](https://github.com/itsramaa/Sistem-Hunian/issues/71)

### BUG-007: Upload bukti transfer gagal meskipun file valid (60kb)
- **TC**: TC-13b | **Prioritas**: High | **Halaman**: `/dashboard/payments`
- **Actual**: Toast error "Gagal upload bukti transfer". Bukti tidak tersimpan.
- **GitHub Issue**: [#72](https://github.com/itsramaa/Sistem-Hunian/issues/72)

### BUG-008: Tandai Lunas gagal — toast error, status pembayaran tidak berubah
- **TC**: TC-13c | **Prioritas**: High | **Halaman**: `/dashboard/payments`
- **Actual**: Toast error muncul. Status pembayaran tetap unpaid.
- **GitHub Issue**: [#73](https://github.com/itsramaa/Sistem-Hunian/issues/73)

### BUG-009: Tidak ada validasi ukuran file >5MB di frontend
- **TC**: TC-14 | **Prioritas**: Medium | **Halaman**: `/dashboard/payments`
- **Actual**: File >5MB tidak divalidasi frontend — toast error generik sama seperti file valid.
- **GitHub Issue**: [#75](https://github.com/itsramaa/Sistem-Hunian/issues/75)

### BUG-010: Form Buat Laporan Maintenance — tanggal default tidak ter-bind, tersimpan 01 Jan 0001
- **TC**: TC-15a | **Prioritas**: High | **Halaman**: `/dashboard/maintenance`
- **Actual**: Field tanggal menampilkan hari ini secara visual tapi saat submit tersimpan 01 Jan 0001.
- **GitHub Issue**: [#76](https://github.com/itsramaa/Sistem-Hunian/issues/76)

---

## Enhancement Requests

### ENH-001: Filter periode pembayaran sebaiknya menggunakan month picker
- **TC**: TC-13d | **Prioritas**: Low | **Halaman**: `/dashboard/payments`
- **Usulan**: Ganti input teks YYYY-MM dengan month picker visual.
- **GitHub Issue**: [#74](https://github.com/itsramaa/Sistem-Hunian/issues/74)

---

## Status Perbaikan (2026-06-21)

| ID | Status | Fix Location | Keterangan |
|-----|--------|-------------|------------|
| BUG-001 | ✅ FIXED | `src/shared/lib/axios.ts` | Prevent redirect saat login gagal, check `isLoginRequest` |
| BUG-002 | ✅ FIXED | `internal/service/property_service.go` + `internal/repository/room_repo.go` | Added `CountByPropertyID` untuk count akurat |
| BUG-003 | ✅ FIXED | `internal/handler/room_handler.go` | Return 422 + error code `ROOM_004` untuk duplikat |
| BUG-004 | ✅ FIXED | `src/features/confirmations/pages/ConfirmationsPage.tsx` | Filter space `" "` di-handle sebagai undefined |
| BUG-005 | ✅ FIXED | `src/features/confirmations/pages/ConfirmationsPage.tsx` | `ExpireButton` sudah pakai AlertDialog |
| BUG-006 | ✅ FIXED | `src/features/payments/pages/Payments.tsx` | `e.stopPropagation()` pada drag-drop area click |
| BUG-007 | ✅ FIXED | `internal/handler/payment_handler.go` | Parameter swap: `(id, userID, buktiURL)` |
| BUG-008 | ✅ FIXED | `internal/handler/payment_handler.go` + `internal/service/payment_service.go` | Dedicated `MarkPaid` method |
| BUG-009 | ✅ FIXED | `src/features/payments/pages/Payments.tsx` | Pre-upload file size check + specific error message |
| BUG-010 | ✅ FIXED | `src/features/maintenance/pages/Maintenance.tsx` | Added `defaultValue={getToday()}` |

---

## Ringkasan

| Metrik | Jumlah |
|--------|--------|
| Total Bug | 10 |
| ✅ Fixed | 10 |
| ⏳ Open | 0 |
| High | 6 (semua fixed) |
| Medium | 3 (semua fixed) |
| Low | 1 (fixed) |
| Enhancement Requests | 1 (ENH-001 masih open) |
| GitHub Issues dibuat | 11 |

---

## Statistik Testing (Post-Fix)

| Metrik | Jumlah |
|--------|--------|
| Total TC | 23 |
| Expected PASS (post-fix) | 22 |
| FAIL | 0 |
| BLOCKED | 1 (TC-16 — perlu data expired untuk verifikasi) |
| Pass Rate (dieksekusi) | **100%** (target) |
| Pass Rate (total) | **95.7%** (target) |
