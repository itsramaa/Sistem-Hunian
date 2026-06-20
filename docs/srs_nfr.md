# SRS — Non-Functional Requirements & Acceptance Criteria
# Sistem Informasi Manajemen Kos Multi-Properti Berbasis Web

**Versi:** 1.0 | Lihat `srs_overview.md` untuk konteks penuh.

---

## 1. Non-Functional Requirements

### NFR-01 — Kemudahan Penggunaan (Usability)

**Prioritas:** Kritis — merupakan atribut paling penting mengingat profil pengguna lapangan.

| Parameter | Kriteria |
|-----------|----------|
| Metode pengukuran | System Usability Scale (SUS) |
| Target skor | Skor SUS berada pada kategori **Acceptable** (≥ 70) berdasarkan skala interpretasi Bangor et al. |
| Cakupan pengujian | Seluruh tiga profil pengguna: Operator, Manajer, Viewer |
| Penekanan khusus | Pengguna profil Viewer harus mampu mengoperasikan fungsi tampilan status tanpa pelatihan khusus |

**Implikasi desain:**
- Navigasi minimal — pengguna mencapai informasi yang dibutuhkan dalam jumlah klik yang sedikit.
- Tampilan Viewer harus benar-benar minimal; tidak ada menu, tombol, atau elemen yang tidak relevan dengan kebutuhan akses statusnya.
- Pesan error harus deskriptif dan dapat dipahami oleh pengguna non-teknis.
- Sistem dapat dioperasikan tanpa membaca dokumentasi atau mengikuti pelatihan khusus.

---

### NFR-02 — Aksesibilitas Berbasis Web

| Parameter | Kriteria |
|-----------|----------|
| Platform | Browser pada smartphone Android, iOS, dan komputer laptop |
| Instalasi | Tidak memerlukan instalasi aplikasi tambahan |
| Responsivitas | Tata letak antarmuka menyesuaikan secara proporsional pada setiap ukuran layar |
| Fungsionalitas | Tidak ada fitur yang hilang atau tidak dapat diakses pada ukuran layar manapun |

**Browser yang didukung:**

| Browser | Versi Minimum |
|---------|--------------|
| Chrome | 90+ |
| Firefox | 88+ |
| Edge | 90+ |
| Safari (iOS) | 14+ |

**Breakpoint responsif:**

| Breakpoint | Ukuran | Target |
|-----------|--------|--------|
| Mobile | < 640px | Smartphone Android/iOS |
| Tablet | 640–1024px | Tablet |
| Desktop | > 1024px | Laptop/komputer |

---

### NFR-03 — Keamanan Data (Security)

| Parameter | Kriteria |
|-----------|----------|
| Autentikasi | JWT — setiap request terautentikasi dan divalidasi token |
| Password | Disimpan menggunakan bcrypt hash, tidak pernah disimpan plaintext |
| Otorisasi | RBAC — setiap pengguna hanya dapat mengakses data dan fungsi sesuai role-nya |
| Akses tidak sah | Setiap upaya akses tanpa autentikasi valid atau di luar kewenangan role ditolak sistem |
| Data sensitif | Identitas penghuni, riwayat pembayaran, dan informasi operasional properti hanya dapat diakses oleh pengguna yang berwenang |

**Implementasi keamanan:**
- Input validation di frontend (Zod) dan backend (struct validation) untuk mencegah injection.
- File upload divalidasi format dan ukuran; nama file di-rename ke UUID untuk mencegah path traversal.
- HTTPS wajib di environment production.

---

### NFR-04 — Performa

| Parameter | Target |
|-----------|--------|
| Response time API (P95) | < 500ms untuk endpoint CRUD standar |
| Load time Dashboard | < 2 detik pada koneksi mobile 4G |
| Background worker | Tidak boleh memblokir atau memperlambat response HTTP |

---

### NFR-05 — Ketersediaan (Availability)

| Parameter | Target |
|-----------|--------|
| Uptime | 99% (downtime maksimum ~7 jam/bulan) |
| Recovery | Graceful shutdown — request yang sedang diproses diselesaikan sebelum server berhenti |

---

## 2. Acceptance Criteria

Sistem dinyatakan diterima apabila seluruh kriteria berikut terpenuhi pada tahap pengujian.

### Fungsional

| ID | Kriteria | Cara Verifikasi |
|----|----------|----------------|
| AC-01 | Semua fungsi CRUD (properti, kamar, penghuni, pembayaran, konfirmasi, maintenance) berjalan sesuai spesifikasi | Black Box Testing per use case |
| AC-02 | RBAC berjalan sesuai role — Operator, Manajer, Viewer hanya dapat mengakses endpoint dan halaman yang diizinkan | Pengujian akses dengan token masing-masing role |
| AC-03 | Dashboard menampilkan data status kamar yang akurat dan diperbarui ketika terjadi perubahan | Verifikasi setelah operasi yang mengubah status kamar |
| AC-04 | DP expired berjalan otomatis — konfirmasi yang melewati `batas_tanggal_konfirmasi` otomatis di-expire, kamar kembali available | Simulasi dengan batas tanggal yang sudah lewat |
| AC-05 | Notifikasi otomatis terbentuk oleh background worker sesuai kondisi yang dipicu | Verifikasi tabel notifications setelah worker berjalan |
| AC-06 | Histori pembayaran tersimpan permanen dan tidak dapat dihapus | Verifikasi tidak ada endpoint DELETE untuk payments |
| AC-07 | Histori maintenance tersimpan permanen dan tidak dapat dihapus | Verifikasi tidak ada endpoint DELETE untuk maintenances |
| AC-08 | Transaksi atomik berjalan benar — Confirm DP dan Checkout tidak meninggalkan state tidak konsisten apabila salah satu langkah gagal | Simulasi kegagalan di tengah transaksi |

### Non-Fungsional

| ID | Kriteria | Cara Verifikasi |
|----|----------|----------------|
| AC-09 | Black Box Testing lulus untuk seluruh test case yang telah didefinisikan | Hasil Black Box Testing terdokumentasi |
| AC-10 | Skor SUS mencapai kategori Acceptable (≥ 70) dari pengujian terhadap ketiga profil pengguna | Kuesioner SUS pasca-pengujian dengan responden nyata |
| AC-11 | Sistem dapat diakses dari smartphone Android, iOS, dan laptop tanpa perbedaan fungsionalitas | Pengujian lintas perangkat |
| AC-12 | Pengguna profil Viewer dapat mengakses dashboard tanpa pelatihan khusus | Observasi pengujian usability |

---

## 3. Black Box Testing Scope

Pengujian Black Box dilakukan pada seluruh alur fungsional berikut:

| No | Skenario Uji | Input | Expected Output |
|----|-------------|-------|----------------|
| 1 | Login valid | email + password benar | JWT token, redirect ke dashboard sesuai role |
| 2 | Login invalid | password salah | Error 401, pesan invalid credential |
| 3 | Akses halaman tanpa login | Request tanpa token | Redirect ke login |
| 4 | Manajer akses halaman properti | Token role manager | Error 403 |
| 5 | Buat properti (valid) | Data lengkap | Properti tersimpan, muncul di list |
| 6 | Hapus properti berisi kamar | Property ID dengan kamar | Error, properti tidak dihapus |
| 7 | Buat kamar dengan nomor duplikat | Nomor kamar yang sudah ada di properti sama | Error ROOM_004 |
| 8 | Buat penghuni di kamar occupied | Room berstatus occupied | Error ROOM_002 |
| 9 | Catat konfirmasi DP (valid) | Kamar available, data lengkap | Konfirmasi tersimpan, status kamar → dp_confirmation |
| 10 | Catat DP ke kamar yang sudah ada DP pending | Room dengan pending confirmation | Error ROOM_003 |
| 11 | Confirm DP | Confirmation pending | Status → confirmed, kamar → occupied, tenant dibuat |
| 12 | Checkout penghuni | Tenant aktif | Tenant checked_out, kamar → available |
| 13 | Catat pembayaran dengan bukti transfer | File JPG < 5MB | Pembayaran tersimpan dengan URL bukti |
| 14 | Upload file melebihi 5MB | File > 5MB | Error PAYMENT_003 |
| 15 | Update status maintenance | Maintenance reported | Status → in_progress |
| 16 | Background worker DP expired | Confirmation dengan batas tanggal kemarin | Status → expired, kamar → available, notifikasi dibuat |
| 17 | Dashboard akurat setelah perubahan status | Operasi yang mengubah status kamar | Jumlah counter pada dashboard berubah |
| 18 | Viewer hanya melihat dashboard | Login sebagai viewer | Hanya dashboard yang dapat diakses |

---

## 4. SUS Testing Protocol

### Responden

| Profil | Jumlah Responden |
|--------|-----------------|
| Operator | 1 orang (pemilik utama) |
| Manajer | 1 orang (anggota keluarga) |
| Viewer | 1 orang (anggota keluarga tingkat kenyamanan teknologi rendah) |

### Skenario Pengujian per Role

**Operator:**
1. Login dan navigasi ke dashboard
2. Tambah data penghuni baru pada kamar tersedia
3. Catat pembayaran sewa dengan bukti transfer
4. Catat laporan maintenance baru
5. Proses checkout penghuni

**Manajer:**
1. Login dan lihat dashboard
2. Catat laporan maintenance
3. Update status maintenance menjadi selesai

**Viewer:**
1. Login
2. Membaca status kamar dari dashboard
3. Membaca informasi notifikasi

### Instrumen SUS

10 pertanyaan SUS standar dengan skala Likert 1–5 (sangat tidak setuju – sangat setuju), diberikan kepada responden setelah sesi pengujian selesai. Skor dihitung sesuai formula SUS: skor item bernomor ganjil dikurangi 1, skor item genap = 5 dikurangi skor item; semua dijumlahkan dan dikalikan 2.5.

**Interpretasi skor:**

| Skor | Kategori | Grade |
|------|----------|-------|
| ≥ 85 | Excellent | A |
| 71–84 | Good | B |
| 70 | Acceptable (batas minimum) | C |
| 51–69 | Poor | D |
| ≤ 50 | Awful | F |

**Target:** Skor ≥ 70 dari seluruh responden, dengan perhatian khusus pada responden profil Viewer.
