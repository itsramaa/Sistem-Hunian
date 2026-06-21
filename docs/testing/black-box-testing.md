# Black Box Testing
# Sistem Informasi Manajemen Kos Multi-Properti Berbasis Web

**Nama Sistem:** SiHuni  
**Versi:** 1.0  
**Tanggal Pengujian:** _______________  
**Penguji:** _______________  
**URL Sistem:** https://sihuni-frontend-holycans-projects.vercel.app  

---

## Panduan Pengujian

1. Buka sistem pada browser Chrome/Firefox/Edge versi terbaru
2. Lakukan setiap skenario uji secara berurutan
3. Catat hasil aktual dan tandai status (✅ Pass / ❌ Fail)
4. Tambahkan catatan jika ada perbedaan dengan expected output
5. Akun uji yang tersedia:
   - **Operator:** operator@sihuni.dev / sihuni123
   - **Manajer:** (buat akun dengan role manager)
   - **Viewer:** (buat akun dengan role viewer)

---

## Tabel Test Case

### TC-01: Login Valid

| | |
|---|---|
| **ID** | TC-01 |
| **Skenario** | Login dengan kredensial yang valid |
| **Prasyarat** | Sistem dapat diakses, akun Operator telah terdaftar |
| **Input** | Email: operator@sihuni.dev, Password: sihuni123 |
| **Langkah** | 1. Buka halaman /login<br>2. Isi field email dan password<br>3. Klik tombol "Masuk" |
| **Expected Output** | JWT token disimpan, pengguna diarahkan ke /dashboard |
| **Actual Output** | |
| **Status** | ☐ Pass  ☐ Fail |
| **Catatan** | |

---

### TC-02: Login Invalid

| | |
|---|---|
| **ID** | TC-02 |
| **Skenario** | Login dengan password yang salah |
| **Prasyarat** | Sistem dapat diakses |
| **Input** | Email: operator@sihuni.dev, Password: salah123 |
| **Langkah** | 1. Buka halaman /login<br>2. Isi email benar, password salah<br>3. Klik tombol "Masuk" |
| **Expected Output** | Muncul pesan error "Kredensial tidak valid", halaman tidak berpindah |
| **Actual Output** | |
| **Status** | ☐ Pass  ☐ Fail |
| **Catatan** | |

---

### TC-03: Akses Halaman Tanpa Login

| | |
|---|---|
| **ID** | TC-03 |
| **Skenario** | Mengakses halaman dashboard tanpa autentikasi |
| **Prasyarat** | Pengguna belum login / token dihapus |
| **Input** | URL langsung: /dashboard |
| **Langkah** | 1. Pastikan tidak ada sesi login aktif<br>2. Buka URL /dashboard secara langsung |
| **Expected Output** | Sistem mengarahkan ke halaman /login |
| **Actual Output** | |
| **Status** | ☐ Pass  ☐ Fail |
| **Catatan** | |

---

### TC-04: Manajer Akses Halaman Properti

| | |
|---|---|
| **ID** | TC-04 |
| **Skenario** | Pengguna dengan role Manajer mencoba mengakses halaman manajemen properti |
| **Prasyarat** | Login sebagai Manajer |
| **Input** | URL: /dashboard/properties |
| **Langkah** | 1. Login sebagai Manajer<br>2. Navigasi ke /dashboard/properties |
| **Expected Output** | Sistem menolak akses dan menampilkan pesan "Akses Ditolak" atau redirect ke dashboard |
| **Actual Output** | |
| **Status** | ☐ Pass  ☐ Fail |
| **Catatan** | |

---

### TC-05: Buat Properti Valid

| | |
|---|---|
| **ID** | TC-05 |
| **Skenario** | Operator menambahkan properti baru dengan data lengkap |
| **Prasyarat** | Login sebagai Operator |
| **Input** | Nama: "Kos Dahlia", Alamat: "Jl. Test No. 1", Deskripsi: "Kos baru" |
| **Langkah** | 1. Buka /dashboard/properties<br>2. Klik "Tambah Properti"<br>3. Isi semua field<br>4. Klik "Tambah" |
| **Expected Output** | Properti tersimpan dan muncul di daftar properti |
| **Actual Output** | |
| **Status** | ☐ Pass  ☐ Fail |
| **Catatan** | |

---

### TC-06: Hapus Properti yang Masih Memiliki Kamar

| | |
|---|---|
| **ID** | TC-06 |
| **Skenario** | Operator mencoba menghapus properti yang masih memiliki kamar |
| **Prasyarat** | Login sebagai Operator, properti "Kos Melati" memiliki kamar |
| **Input** | Hapus properti "Kos Melati" |
| **Langkah** | 1. Buka /dashboard/properties<br>2. Klik menu hapus pada "Kos Melati"<br>3. Konfirmasi hapus |
| **Expected Output** | Sistem menolak penghapusan dengan pesan error informatif, properti tidak terhapus |
| **Actual Output** | |
| **Status** | ☐ Pass  ☐ Fail |
| **Catatan** | |

---

### TC-07: Buat Kamar dengan Nomor Duplikat

| | |
|---|---|
| **ID** | TC-07 |
| **Skenario** | Operator membuat kamar dengan nomor yang sudah ada di properti yang sama |
| **Prasyarat** | Login sebagai Operator, kamar "A01" sudah ada di "Kos Melati" |
| **Input** | Properti: Kos Melati, Nomor Kamar: A01, Tipe: Standar, Harga: 1200000 |
| **Langkah** | 1. Buka /dashboard/rooms<br>2. Klik "Tambah Kamar"<br>3. Isi data dengan nomor duplikat<br>4. Klik "Tambah" |
| **Expected Output** | Sistem menampilkan pesan error bahwa nomor kamar sudah digunakan |
| **Actual Output** | |
| **Status** | ☐ Pass  ☐ Fail |
| **Catatan** | |

---

### TC-08: Tambah Penghuni di Kamar yang Sudah Terisi

| | |
|---|---|
| **ID** | TC-08 |
| **Skenario** | Operator mencoba menambah penghuni pada kamar berstatus "occupied" |
| **Prasyarat** | Login sebagai Operator, kamar "A01" berstatus occupied |
| **Input** | Room ID: kamar A01 (occupied), data penghuni baru |
| **Langkah** | 1. Buka /dashboard/tenants<br>2. Klik "Tambah Penghuni"<br>3. Pilih kamar A01 (occupied)<br>4. Isi data penghuni<br>5. Klik "Tambah" |
| **Expected Output** | Sistem menolak dengan pesan bahwa kamar tidak tersedia |
| **Actual Output** | |
| **Status** | ☐ Pass  ☐ Fail |
| **Catatan** | |

---

### TC-09: Catat Konfirmasi DP Valid

| | |
|---|---|
| **ID** | TC-09 |
| **Skenario** | Operator mencatat konfirmasi DP untuk kamar berstatus available |
| **Prasyarat** | Login sebagai Operator, kamar "A02" berstatus available |
| **Input** | Kamar: A02, Nama: "Calon Test", Nominal DP: 600000, Batas Tanggal: 7 hari ke depan |
| **Langkah** | 1. Buka /dashboard/confirmations<br>2. Klik "Catat Konfirmasi DP"<br>3. Pilih kamar A02<br>4. Isi data<br>5. Klik "Catat DP" |
| **Expected Output** | Konfirmasi tersimpan, status kamar A02 berubah menjadi dp_confirmation |
| **Actual Output** | |
| **Status** | ☐ Pass  ☐ Fail |
| **Catatan** | |

---

### TC-10: Catat DP ke Kamar yang Sudah Punya DP Pending

| | |
|---|---|
| **ID** | TC-10 |
| **Skenario** | Operator mencoba membuat konfirmasi DP kedua pada kamar yang sudah punya DP pending |
| **Prasyarat** | Login sebagai Operator, kamar "A03" sudah memiliki konfirmasi pending |
| **Input** | Kamar: A03 (dp_confirmation), data calon penghuni baru |
| **Langkah** | 1. Buka /dashboard/confirmations<br>2. Coba tambah DP untuk kamar A03<br>3. Submit form |
| **Expected Output** | Sistem menolak dengan pesan bahwa kamar sudah memiliki konfirmasi DP aktif |
| **Actual Output** | |
| **Status** | ☐ Pass  ☐ Fail |
| **Catatan** | |

---

### TC-11: Konfirmasi Masuk (Confirm DP)

| | |
|---|---|
| **ID** | TC-11 |
| **Skenario** | Operator mengonfirmasi calon penghuni masuk setelah DP |
| **Prasyarat** | Login sebagai Operator, konfirmasi berstatus pending |
| **Input** | Klik "Konfirmasi Masuk", isi data: nama, no. identitas, telepon, tanggal masuk, durasi |
| **Langkah** | 1. Buka /dashboard/confirmations<br>2. Klik "Konfirmasi Masuk" pada baris pending<br>3. Isi data penghuni<br>4. Klik "Konfirmasi Masuk" |
| **Expected Output** | Status konfirmasi → confirmed, kamar → occupied, tenant baru dibuat |
| **Actual Output** | |
| **Status** | ☐ Pass  ☐ Fail |
| **Catatan** | |

---

### TC-12: Checkout Penghuni

| | |
|---|---|
| **ID** | TC-12 |
| **Skenario** | Operator melakukan checkout penghuni aktif |
| **Prasyarat** | Login sebagai Operator, ada penghuni aktif di kamar B01 |
| **Input** | Tanggal Keluar: hari ini |
| **Langkah** | 1. Buka /dashboard/tenants<br>2. Tab "Penghuni Aktif"<br>3. Klik "Checkout" pada baris penghuni<br>4. Isi tanggal keluar<br>5. Klik "Konfirmasi Checkout" |
| **Expected Output** | Status tenant → checked_out, status kamar → available, data muncul di tab "Histori" |
| **Actual Output** | |
| **Status** | ☐ Pass  ☐ Fail |
| **Catatan** | |

---

### TC-13: Catat Pembayaran dengan Bukti Transfer

| | |
|---|---|
| **ID** | TC-13 |
| **Skenario** | Operator mencatat pembayaran dan mengupload bukti transfer |
| **Prasyarat** | Login sebagai Operator, ada penghuni aktif |
| **Input** | Kamar: B01, Penghuni: Siti Rahayu, Periode: 2024-03, Nominal: 1100000 + file bukti JPG < 5MB |
| **Langkah** | 1. Buka /dashboard/payments<br>2. Klik "Catat Pembayaran"<br>3. Isi data + klik "Catat"<br>4. Klik "Bukti" pada baris baru<br>5. Upload file JPG<br>6. Klik "Upload" |
| **Expected Output** | Pembayaran tersimpan dengan URL bukti transfer |
| **Actual Output** | |
| **Status** | ☐ Pass  ☐ Fail |
| **Catatan** | |

---

### TC-14: Upload File Bukti Transfer Melebihi 5MB

| | |
|---|---|
| **ID** | TC-14 |
| **Skenario** | Operator mencoba mengupload file bukti transfer yang berukuran lebih dari 5MB |
| **Prasyarat** | Login sebagai Operator, ada pembayaran yang belum punya bukti |
| **Input** | File gambar/PDF berukuran > 5MB |
| **Langkah** | 1. Buka /dashboard/payments<br>2. Klik "Bukti" pada baris pembayaran<br>3. Pilih file > 5MB<br>4. Klik "Upload" |
| **Expected Output** | Sistem menolak upload dengan pesan error "File maksimal 5MB" |
| **Actual Output** | |
| **Status** | ☐ Pass  ☐ Fail |
| **Catatan** | |

---

### TC-15: Update Status Maintenance

| | |
|---|---|
| **ID** | TC-15 |
| **Skenario** | Operator/Manajer mengubah status laporan maintenance dari "reported" ke "in_progress" |
| **Prasyarat** | Login sebagai Operator atau Manajer, ada laporan maintenance berstatus "reported" |
| **Input** | Status: in_progress, Tindakan: "Sedang diproses teknisi" |
| **Langkah** | 1. Buka /dashboard/maintenance<br>2. Klik "Update" pada baris dengan status "Dilaporkan"<br>3. Ganti status ke "Diproses"<br>4. Isi tindakan<br>5. Klik "Simpan Update" |
| **Expected Output** | Status laporan berubah menjadi "in_progress" / "Diproses" |
| **Actual Output** | |
| **Status** | ☐ Pass  ☐ Fail |
| **Catatan** | |

---

### TC-16: Background Worker — DP Expired Otomatis

| | |
|---|---|
| **ID** | TC-16 |
| **Skenario** | Konfirmasi DP dengan batas tanggal yang sudah lewat otomatis di-expire oleh background worker |
| **Prasyarat** | Ada konfirmasi DP dengan `batas_tanggal_konfirmasi` = kemarin atau lebih lampau |
| **Input** | Tunggu worker berjalan (setiap jam) |
| **Langkah** | 1. Buka /dashboard/confirmations<br>2. Lihat konfirmasi dengan tanggal sudah lewat<br>3. Tunggu hingga worker berjalan (atau cek keesokan hari)<br>4. Refresh halaman |
| **Expected Output** | Status konfirmasi → expired, status kamar → available, notifikasi dp_expired dibuat |
| **Actual Output** | |
| **Status** | ☐ Pass  ☐ Fail |
| **Catatan** | Dapat diverifikasi via database atau notifikasi |

---

### TC-17: Dashboard Akurat Setelah Perubahan Status Kamar

| | |
|---|---|
| **ID** | TC-17 |
| **Skenario** | Angka summary cards di dashboard berubah setelah operasi yang mengubah status kamar |
| **Prasyarat** | Login sebagai Operator, catat jumlah kamar "Tersedia" sebelum operasi |
| **Input** | Lakukan checkout penghuni (kamar occupied → available) |
| **Langkah** | 1. Catat angka "Terisi" dan "Tersedia" di dashboard<br>2. Lakukan checkout penghuni<br>3. Kembali ke dashboard<br>4. Refresh halaman |
| **Expected Output** | Angka "Terisi" berkurang 1, angka "Tersedia" bertambah 1 |
| **Actual Output** | |
| **Status** | ☐ Pass  ☐ Fail |
| **Catatan** | |

---

### TC-18: Viewer Hanya Dapat Mengakses Dashboard

| | |
|---|---|
| **ID** | TC-18 |
| **Skenario** | Pengguna dengan role Viewer hanya dapat melihat dashboard, tidak dapat mengakses fitur lain |
| **Prasyarat** | Login sebagai Viewer |
| **Input** | Akses URL /dashboard/properties, /dashboard/rooms, /dashboard/tenants |
| **Langkah** | 1. Login sebagai Viewer<br>2. Amati menu sidebar<br>3. Coba akses /dashboard/properties secara langsung |
| **Expected Output** | Sidebar hanya menampilkan Dashboard; akses langsung ke /dashboard/properties ditolak |
| **Actual Output** | |
| **Status** | ☐ Pass  ☐ Fail |
| **Catatan** | |

---

## Rekap Hasil Pengujian

| ID | Skenario | Status |
|----|----------|--------|
| TC-01 | Login valid | ☐ Pass ☐ Fail |
| TC-02 | Login invalid | ☐ Pass ☐ Fail |
| TC-03 | Akses tanpa login | ☐ Pass ☐ Fail |
| TC-04 | RBAC Manajer | ☐ Pass ☐ Fail |
| TC-05 | Buat properti | ☐ Pass ☐ Fail |
| TC-06 | Hapus properti berkamar | ☐ Pass ☐ Fail |
| TC-07 | Nomor kamar duplikat | ☐ Pass ☐ Fail |
| TC-08 | Penghuni di kamar occupied | ☐ Pass ☐ Fail |
| TC-09 | Konfirmasi DP valid | ☐ Pass ☐ Fail |
| TC-10 | DP kamar sudah pending | ☐ Pass ☐ Fail |
| TC-11 | Confirm DP (masuk) | ☐ Pass ☐ Fail |
| TC-12 | Checkout penghuni | ☐ Pass ☐ Fail |
| TC-13 | Pembayaran + bukti | ☐ Pass ☐ Fail |
| TC-14 | File > 5MB | ☐ Pass ☐ Fail |
| TC-15 | Update maintenance | ☐ Pass ☐ Fail |
| TC-16 | DP expired worker | ☐ Pass ☐ Fail |
| TC-17 | Dashboard akurat | ☐ Pass ☐ Fail |
| TC-18 | Viewer only dashboard | ☐ Pass ☐ Fail |

**Total Pass:** ___ / 18  
**Total Fail:** ___ / 18  
**Persentase Keberhasilan:** ___%

---

*Dokumen ini merupakan bagian dari pengujian Black Box Testing pada penelitian pengembangan Sistem Informasi Manajemen Kos Multi-Properti Berbasis Web.*
