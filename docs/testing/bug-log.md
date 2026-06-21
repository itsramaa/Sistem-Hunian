# Bug Log — SiHuni Black Box Testing

> Sesi pengujian: Black Box Testing — Role Operator
> Tanggal: 2026-06-20
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

### BUG-011: ProtectedRoute race condition — Manager redirect dari /maintenance ke /dashboard

- **Sesi**: Automated Playwright Testing v2 | **Prioritas**: High | **Halaman**: `/dashboard/maintenance`
- **Actual**: Manager login → navigate ke `/dashboard/maintenance` → redirect ke `/dashboard`. Route seharusnya allow `['operator', 'manager']`.
- **Root Cause**: `ProtectedRoute` tidak menunggu `refreshProfile()` selesai saat `hasToken=true` + `role=null` → redirect prematur ke `/unauthorized` → `/dashboard`.
- **GitHub Issue**: [#81](https://github.com/itsramaa/Sistem-Hunian/issues/81)

### BUG-012: Halaman /tenants redirect ke /dashboard saat navigasi langsung

- **Sesi**: Automated Playwright Testing v2 | **Prioritas**: Medium | **Halaman**: `/dashboard/tenants`
- **Actual**: Operator navigate langsung ke `/dashboard/tenants` → redirect ke `/dashboard`. Tapi klik link detail tenant dari halaman lain berhasil.
- **Root Cause**: Kemungkinan sama dengan BUG-011 — race condition ProtectedRoute.
- **GitHub Issue**: [#82](https://github.com/itsramaa/Sistem-Hunian/issues/82)

---

## Enhancement Requests

### ENH-001: Filter periode pembayaran sebaiknya menggunakan month picker

- **TC**: TC-13d | **Prioritas**: Low | **Halaman**: `/dashboard/payments`
- **Usulan**: Ganti input teks YYYY-MM dengan month picker visual.
- **GitHub Issue**: [#74](https://github.com/itsramaa/Sistem-Hunian/issues/74)

---

## Ringkasan

| Metrik               | Jumlah |
| -------------------- | ------ |
| Total Bug            | 12     |
| High                 | 7      |
| Medium               | 4      |
| Low                  | 1      |
| Enhancement Requests | 1      |
| GitHub Issues dibuat | 13     |

---

## Statistik Testing

| Metrik                 | Jumlah |
| ---------------------- | ------ |
| Total TC               | 25     |
| PASS                   | 15     |
| FAIL                   | 7      |
| BLOCKED                | 3      |
| Pass Rate (dieksekusi) | 60%    |
| Pass Rate (total)      | 56.5%  |
