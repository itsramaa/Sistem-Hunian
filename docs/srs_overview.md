# SRS — Overview & Business Rules
# Sistem Informasi Manajemen Kos Multi-Properti Berbasis Web

**Versi:** 1.0  
**Status:** Draft Implementasi  
**Konteks:** Objek penelitian adalah tiga properti kos dengan total 42 kamar di kawasan industri MM2100, dikelola satu keluarga tanpa sistem informasi terpusat.

---

## 1. Tujuan Dokumen

Dokumen ini mendefinisikan kebutuhan perangkat lunak secara rinci sebagai acuan implementasi. SRS ini dibagi ke dalam beberapa file terpisah berdasarkan concern:

| File | Isi |
|------|-----|
| `srs_overview.md` | Pendahuluan, stakeholder, business rules, state machine |
| `srs_frontend.md` | Arsitektur frontend, halaman, komponen |
| `srs_backend.md` | Arsitektur backend, service/repository contract, error catalog |
| `srs_database.md` | Skema database, constraint, transaksi, domain model, validasi |
| `srs_api.md` | REST API endpoint, contract detail, authorization matrix |
| `srs_background_worker.md` | Spesifikasi background worker |
| `srs_nfr.md` | Non-functional requirements, acceptance criteria, audit trail |

---

## 2. Ruang Lingkup Sistem

Sistem mencakup:

- Manajemen properti (master data)
- Manajemen kamar per properti
- Manajemen penghuni dan histori hunian
- Pencatatan dan monitoring pembayaran sewa
- Pencatatan konfirmasi calon penghuni dan down payment (DP)
- Pencatatan dan histori maintenance
- Dashboard status kamar multi-properti
- Notifikasi operasional (jatuh tempo, DP expiry)
- Kontrol akses berbasis role (RBAC)

Sistem **tidak** mencakup:

- Marketplace atau booking online publik
- Payment gateway / virtual account
- Verifikasi pembayaran otomatis dari bank
- Integrasi OTA (Online Travel Agent)

---

## 3. Stakeholder & Role Pengguna

Tiga profil pengguna diidentifikasi berdasarkan hasil observasi dan wawancara lapangan. Perbedaan kebutuhan dan kapasitas akses masing-masing menjadi dasar pembagian role dalam sistem.

### Operator
- Pemilik utama yang mengelola operasional harian.
- Membutuhkan akses penuh terhadap seluruh fungsi sistem.
- Melakukan seluruh proses administrasi: properti, kamar, penghuni, pembayaran, DP, maintenance.

### Manajer
- Anggota keluarga yang terlibat pada aspek pemeliharaan dan informasi teknis.
- Akses terbatas pada modul maintenance dan dashboard (read-only).
- Tidak perlu mengakses data keuangan atau identitas penghuni.

### Viewer
- Anggota keluarga yang membutuhkan informasi status hunian tanpa terlibat operasional pencatatan.
- Akses hanya pada dashboard status kamar, tanpa kemampuan mengubah data apapun.
- **Catatan penting:** profil ini mencakup pengguna dengan tingkat kenyamanan teknologi rendah — tampilan yang dihadapi harus minimal, tidak memerlukan kurva pembelajaran tinggi.

---

## 4. Business Rules

### BR-001
Satu kamar hanya boleh memiliki **satu penghuni aktif** (`tenant.status = active`) dalam satu waktu.

### BR-002
Satu kamar hanya boleh memiliki **satu konfirmasi DP aktif** (`confirmation.status = pending`) dalam satu waktu.

### BR-003
DP baru tidak dapat dibuat apabila pada kamar yang sama masih terdapat konfirmasi dengan status `pending`. Sistem menolak pencatatan dengan error `ROOM_003`.

### BR-004
Apabila `batas_tanggal_konfirmasi` terlewati tanpa tindak lanjut, background worker secara otomatis mengubah:
- `confirmation.status` → `expired`
- `room.status` → `available`

### BR-005
Proses checkout penghuni mengubah secara atomik:
- `tenant.status` → `checked_out`
- `tenant.tanggal_keluar` → tanggal checkout
- `room.status` → `available`

### BR-006
Properti **tidak dapat dihapus** apabila masih memiliki kamar aktif (jumlah kamar > 0). Sistem menampilkan pesan error informatif dan menghentikan operasi.

### BR-007
Kamar **tidak dapat dihapus** apabila statusnya:
- `occupied` — masih ditempati penghuni aktif
- `dp_confirmation` — masih dalam proses konfirmasi DP

### BR-008
Histori pembayaran (`payments`) **tidak boleh dihapus** dari basis data. Koreksi dilakukan melalui pencatatan ulang, bukan penghapusan rekaman.

### BR-009
Histori maintenance (`maintenances`) **tidak boleh dihapus** dari basis data. Rekaman bersifat permanen sebagai referensi penanganan kerusakan berulang.

---

## 5. State Machine

### Room Status

```
available
  └─► dp_confirmation   (saat konfirmasi DP berhasil dicatat)
        ├─► occupied     (saat penghuni masuk / DP dikonfirmasi)
        └─► available    (saat DP expired oleh background worker)
occupied
  └─► available          (saat checkout penghuni)
```

Transisi status kamar **tidak dilakukan langsung dari dashboard**. Status berubah sebagai dampak dari proses pencatatan lain (konfirmasi DP, checkout, background worker).

### Confirmation Status

```
pending
  ├─► confirmed   (Operator mengkonfirmasi calon penghuni masuk)
  └─► expired     (background worker: batas_tanggal_konfirmasi terlewati)
```

Satu kamar hanya boleh memiliki satu `confirmation` dengan status `pending` dalam satu waktu.

### Maintenance Status

```
reported
  └─► in_progress   (penanganan dimulai)
        └─► completed (penanganan selesai)
```

Transisi status diperbarui secara **manual** oleh Operator atau Manajer. Tidak ada mekanisme penugasan teknisi otomatis maupun alur persetujuan bertingkat.

---

## 6. Functional Requirements Summary

| Kode | Nama | Aktor | Justifikasi Lapangan |
|------|------|-------|----------------------|
| FR-01 | Login & Autentikasi | Semua | Prasyarat teknis RBAC; tanpa identifikasi pengguna, diferensiasi hak akses tidak dapat ditegakkan |
| FR-02 | Dashboard Multi-Properti | Semua (sesuai role) | Tidak ada medium yang memungkinkan akses status kamar mandiri; seluruh info hanya ada di kepala pemilik |
| FR-03 | Manajemen Properti | Operator | Master data fondasi sistem multi-properti |
| FR-04 | Manajemen Kamar | Operator | Entitas pusat yang menjadi acuan seluruh modul lain |
| FR-05 | Manajemen Penghuni | Operator | Data penghuni tersebar di 3 medium tidak terintegrasi tanpa format konsisten |
| FR-06 | Pembayaran Sewa | Operator | Verifikasi manual 42 kamar/bulan; tidak ada early warning tunggakan |
| FR-07 | Konfirmasi DP | Operator | Aturan hangus DP tidak dapat ditegakkan karena tidak ada pencatatan batas tanggal |
| FR-08 | Maintenance | Operator, Manajer | Kerusakan berulang ditangani dari awal karena tidak ada histori perbaikan |
| FR-09 | Notifikasi | Operator | Alert otomatis menggantikan pemantauan manual |
