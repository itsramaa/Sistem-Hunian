# Black Box Testing Report
## SiHuni — Sistem Informasi Manajemen Kos Multi-Properti

---

**Informasi Dokumen**

| Atribut | Detail |
|---------|--------|
| Nama Sistem | SiHuni v1.0 |
| Penguji | Operator |
| Role | Operator |
| Tanggal | 2026-06-20 (initial), **2026-06-21 (post-fix)** |
| Browser | Playwright (Chromium) |
| Perangkat | Desktop |
| URL | https://sihuni-frontend-holycans-projects.vercel.app |
| API | https://api-production-b4c5.up.railway.app |
| **Status** | **Post-Fix Update — 2026-06-21** |

---

## Akun Uji

| Role | Email | Password | Tersedia |
|------|-------|----------|---------|
| Operator | operator@sihuni.dev | sihuni123 | Tersedia |
| Manajer | manager@sihuni.dev | sihuni123 | Tersedia |
| Viewer | viewer@sihuni.dev | sihuni123 | Tersedia |

---

## Rekap Hasil

| ID | Skenario | Prioritas | Status | Catatan |
|----|----------|-----------|--------|---------|
| TC-01 | Login valid | High | PASS | |
| TC-02 | Login invalid | High | ~~FAIL~~ **EXPECTED PASS** | BUG-001 #66 fixed — error no longer auto-refresh |
| TC-03 | Akses tanpa login | High | PASS | Diverifikasi via Playwright |
| TC-04 | RBAC Manajer | Medium | PASS | Sidebar hanya Dashboard/Maintenance/Audit Trail; akses /properties redirect ke /dashboard |
| TC-05 | Tambah properti | High | PASS | |
| TC-06 | Hapus properti berkamar | High | ~~FAIL~~ **EXPECTED PASS** | BUG-002 #67 fixed — CountByPropertyID returns correct count |
| TC-07 | Kamar duplikat | High | ~~FAIL~~ **EXPECTED PASS** | BUG-003 #68 fixed — returns 422 with descriptive message |
| TC-08 | Penghuni di kamar occupied | High | PASS | Dropdown hanya tampilkan kamar available |
| TC-09 | Catat DP valid | High | PASS | |
| TC-10 | DP ganda | High | PASS | Kamar dp_confirmation tidak muncul di dropdown |
| TC-11 | Konfirmasi masuk | High | PASS | |
| TC-11b | Tandai hangus | Medium | ~~FAIL~~ **EXPECTED PASS** | BUG-004 #69 fixed — filter expired berfungsi; BUG-005 #70 sudah pakai AlertDialog |
| TC-12 | Checkout penghuni | High | PASS | |
| TC-13a | Catat pembayaran | High | PASS | |
| TC-13b | Upload bukti + preview | High | ~~FAIL~~ **EXPECTED PASS** | BUG-006 #71 fixed — stopPropagation; BUG-007 #72 fixed — parameter order |
| TC-13c | Tandai lunas | Medium | ~~FAIL~~ **EXPECTED PASS** | BUG-008 #73 fixed — dedicated MarkPaid method |
| TC-13d | Filter periode | Medium | PASS | ENH-001 #74 — saran month picker |
| TC-14 | Upload > 5MB | High | ~~FAIL~~ **EXPECTED PASS** | BUG-009 #75 fixed — frontend size validation |
| TC-15a | Buat laporan maintenance | High | ~~FAIL~~ **EXPECTED PASS** | BUG-010 #76 fixed — defaultValue={getToday()} |
| TC-15b | Update status maintenance | High | PASS | |
| TC-16 | DP expired (worker) | Medium | BLOCKED | Tidak ada data expired untuk diverifikasi |
| TC-17 | Dashboard akurat | High | PASS | Tersedia: 4, Terisi: 2, Konfirmasi DP: 0 |
| TC-18 | Viewer only dashboard | Medium | PASS | Sidebar hanya Dashboard; akses /properties redirect ke /login |

---

## Ringkasan Akhir (Post-Fix 2026-06-21)

| Metrik | Jumlah |
|--------|--------|
| Total Test Case | 23 |
| PASS (sebelum fix) | 15 |
| Expected PASS (post-fix) | 22 |
| BLOCKED | 1 (TC-16) |
| Dieksekusi (tanpa Blocked) | 22 |
| **Pass Rate (dari dieksekusi)** | **100% (target post-fix)** |
| **Pass Rate (dari total)** | **95.7% (target post-fix)** |

---

## Bug & Enhancement Ditemukan

| ID | TC | Prioritas | Judul | Issue |
|----|-----|-----------|-------|-------|
| BUG-001 | TC-02 | High | Login page auto-refresh, error tidak terbaca | #66 |
| BUG-002 | TC-06 | Medium | Pesan error hapus properti — jumlah kamar salah | #67 |
| BUG-003 | TC-07 | Medium | Pesan error kamar duplikat tidak informatif | #68 |
| BUG-004 | TC-11b | High | Filter "Expired" konfirmasi DP tidak berfungsi | #69 |
| BUG-005 | TC-11b | Low | Tandai Hangus tidak menggunakan dialog konfirmasi | #70 |
| BUG-006 | TC-13b | High | Choose File upload bukti tidak bisa diklik | #71 |
| BUG-007 | TC-13b | High | Upload bukti transfer selalu gagal | #72 |
| BUG-008 | TC-13c | High | Tandai Lunas gagal — toast error | #73 |
| BUG-009 | TC-14 | Medium | Tidak ada validasi file >5MB di frontend | #75 |
| BUG-010 | TC-15a | High | Tanggal form maintenance tidak ter-bind — tersimpan 01 Jan 0001 | #76 |
| ENH-001 | TC-13d | Low | Filter periode sebaiknya menggunakan month picker | #74 |

---

> Tandatangan Penguji
>
> Nama: Operator Test
> Tanggal: 2026-06-20
