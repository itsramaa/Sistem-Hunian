# Lembar Pengujian Usability — System Usability Scale (SUS)

> **SiHuni** · Sistem Informasi Manajemen Kos Multi-Properti  
> Versi 1.0 · Pengujian Operator

---

## Identitas Responden

| | |
|:---|:---|
| **Nama** | |
| **Role** | Operator (Pemilik Utama) |
| **Tanggal** | |
| **Durasi sesi** | menit |
| **Perangkat** | |
| **Browser** | |

---

## Bagian 1 — Tugas Pengujian

Selesaikan semua tugas berikut secara berurutan sebelum mengisi kuesioner.  
Tandai ✅ jika berhasil diselesaikan, atau ❌ jika tidak bisa.

> **URL Sistem:** <https://sihuni-frontend-holycans-projects.vercel.app>  
> **Akun:** `operator@sihuni.dev` · Kata sandi tersedia dari peneliti.

| # | Tugas | Hasil |
|:---:|:---|:---:|
| T-01 | Login ke sistem menggunakan akun Operator | |
| T-02 | Baca ringkasan status kamar di dashboard (berapa tersedia, terisi, konfirmasi DP) | |
| T-03 | Buka halaman **Properti** — pastikan daftar properti tampil | |
| T-04 | Buka halaman **Kamar** — filter kamar berdasarkan properti tertentu | |
| T-05 | Buka halaman **Penghuni** — lihat tab Aktif dan Histori | |
| T-06 | Buka halaman **Pembayaran** — filter berdasarkan status "Belum Bayar" | |
| T-07 | Klik tombol **Catat Pembayaran** — isi form (boleh dibatalkan, tidak perlu submit) | |
| T-08 | Buka halaman **Konfirmasi DP** — lihat daftar dan status sisa hari | |
| T-09 | Buka halaman **Maintenance** — lihat daftar laporan | |
| T-10 | Buka menu **avatar** di pojok bawah sidebar — pastikan ada opsi Profil, Pengaturan, Keluar | |
| T-11 | Buka halaman **Audit Trail** — lihat riwayat perubahan status kamar | |
| T-12 | Ganti tema (terang ↔ gelap) melalui **Pengaturan** | |
| T-13 | Logout dari sistem | |

**Total tugas berhasil:** ___ / 13

---

## Bagian 2 — Kuesioner SUS

Isi kuesioner ini **setelah** menyelesaikan semua tugas di atas.

**Petunjuk:** Untuk setiap pernyataan, beri tanda **X** pada kolom yang paling menggambarkan pendapat Anda.

| Skala | 1 | 2 | 3 | 4 | 5 |
|:---|:---:|:---:|:---:|:---:|:---:|
| Keterangan | Sangat Tidak Setuju | Tidak Setuju | Netral | Setuju | Sangat Setuju |

---

### Pernyataan

| # | Pernyataan | 1 | 2 | 3 | 4 | 5 |
|:---:|:---|:---:|:---:|:---:|:---:|:---:|
| 1 | Saya rasa saya akan sering menggunakan sistem ini. | ☐ | ☐ | ☐ | ☐ | ☐ |
| 2 | Saya rasa sistem ini **terlalu kompleks** untuk digunakan. | ☐ | ☐ | ☐ | ☐ | ☐ |
| 3 | Saya rasa sistem ini **mudah** untuk digunakan. | ☐ | ☐ | ☐ | ☐ | ☐ |
| 4 | Saya membutuhkan bantuan orang teknis untuk menggunakan sistem ini. | ☐ | ☐ | ☐ | ☐ | ☐ |
| 5 | Saya rasa berbagai fungsi dalam sistem ini **terintegrasi dengan baik**. | ☐ | ☐ | ☐ | ☐ | ☐ |
| 6 | Saya rasa terlalu banyak **ketidakkonsistenan** dalam sistem ini. | ☐ | ☐ | ☐ | ☐ | ☐ |
| 7 | Saya bayangkan kebanyakan orang akan **cepat mempelajari** sistem ini. | ☐ | ☐ | ☐ | ☐ | ☐ |
| 8 | Saya rasa sistem ini sangat **membingungkan** untuk digunakan. | ☐ | ☐ | ☐ | ☐ | ☐ |
| 9 | Saya merasa **percaya diri** menggunakan sistem ini. | ☐ | ☐ | ☐ | ☐ | ☐ |
| 10 | Saya perlu mempelajari **banyak hal** sebelum bisa menggunakan sistem ini. | ☐ | ☐ | ☐ | ☐ | ☐ |

---

## Bagian 3 — Perhitungan Skor

### Cara menghitung

- Pernyataan **ganjil** (1, 3, 5, 7, 9) → kontribusi = **nilai yang dipilih − 1**
- Pernyataan **genap** (2, 4, 6, 8, 10) → kontribusi = **5 − nilai yang dipilih**
- **Skor SUS = jumlah kontribusi × 2,5**

### Lembar hitung

| # | Nilai Dipilih | Jenis | Rumus | Kontribusi |
|:---:|:---:|:---:|:---:|:---:|
| Q1 | | Positif | nilai − 1 | |
| Q2 | | Negatif | 5 − nilai | |
| Q3 | | Positif | nilai − 1 | |
| Q4 | | Negatif | 5 − nilai | |
| Q5 | | Positif | nilai − 1 | |
| Q6 | | Negatif | 5 − nilai | |
| Q7 | | Positif | nilai − 1 | |
| Q8 | | Negatif | 5 − nilai | |
| Q9 | | Positif | nilai − 1 | |
| Q10 | | Negatif | 5 − nilai | |
| | | | **Total** | |

**Skor SUS = Total × 2,5 =** ___

### Interpretasi

| Skor SUS | Grade | Kategori | Keterangan |
|:---:|:---:|:---:|:---|
| ≥ 85,0 | A | Excellent | Sangat mudah digunakan |
| 72,6 – 84,9 | B | Good | Mudah digunakan |
| 70,0 – 72,5 | C | Acceptable | Dapat diterima ✅ *(target minimum)* |
| 51,0 – 69,9 | D | Poor | Perlu perbaikan |
| ≤ 50,9 | F | Awful | Sulit digunakan |

> Sumber: Bangor, A., Kortum, P., & Miller, J. (2009). *Determining What Individual SUS Scores Mean.*

---

## Bagian 4 — Umpan Balik Kualitatif

Jawab pertanyaan berikut berdasarkan pengalaman Anda menggunakan sistem.

**1. Fitur mana yang menurut Anda paling mudah dan berguna?**

```
_________________________________________________________________
_________________________________________________________________
```

**2. Fitur atau bagian mana yang menurut Anda paling membingungkan atau sulit?**

```
_________________________________________________________________
_________________________________________________________________
```

**3. Apakah ada informasi yang Anda cari tetapi tidak bisa ditemukan di sistem?**

```
_________________________________________________________________
_________________________________________________________________
```

**4. Bagaimana pendapat Anda tentang tampilan dan navigasi sistem di perangkat yang Anda gunakan?**

```
_________________________________________________________________
_________________________________________________________________
```

**5. Satu hal yang paling ingin Anda ubah atau tambahkan ke sistem ini:**

```
_________________________________________________________________
_________________________________________________________________
```

---

## Tanda Tangan

| | |
|:---|:---|
| **Responden** | |
| Tanda tangan | |
| Tanggal | |

---

*Dokumen ini merupakan instrumen pengujian usability pada penelitian pengembangan SiHuni — Sistem Informasi Manajemen Kos Multi-Properti Berbasis Web.*  
*Metode: System Usability Scale (Brooke, 1996; Bangor et al., 2009)*
