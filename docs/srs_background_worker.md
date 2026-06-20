# SRS — Background Worker
# Sistem Informasi Manajemen Kos Multi-Properti Berbasis Web

**Versi:** 1.0 | Lihat `srs_overview.md` untuk konteks penuh.

---

## 1. Gambaran Umum

Background worker adalah komponen terpisah dari alur penanganan request HTTP yang beroperasi secara periodik otomatis. Sistem memiliki dua worker yang masing-masing menangani satu domain pemantauan.

**Justifikasi keberadaan worker:** Sistem harus mampu mendeteksi kondisi kritis (DP expired, pembayaran terlambat) secara proaktif tanpa menunggu pengguna membuka aplikasi. Tanpa worker, keterlambatan pembayaran baru diketahui setelah pengguna secara manual memeriksa setiap kamar — kondisi yang persis sama dengan masalah di lapangan yang ingin diselesaikan.

Worker berjalan sebagai goroutine terpisah dalam proses Go yang sama dengan server HTTP, memanfaatkan model konkurensi Go agar pemantauan latar belakang tidak mengganggu performa penanganan request pengguna.

---

## 2. Worker 1 — DP Expiration Worker

### Tujuan

Mendeteksi konfirmasi calon penghuni yang melewati `batas_tanggal_konfirmasi` tanpa tindak lanjut, kemudian secara otomatis menandainya sebagai hangus dan mengembalikan status kamar.

**Konteks lapangan:** Aturan hangus DP sudah berlaku secara lisan namun tidak pernah dapat ditegakkan karena tidak ada mekanisme pencatatan batas tanggal maupun pengingat sistematis. Worker ini mengotomasi penegakan aturan tersebut.

### Jadwal

```
Schedule: Setiap 1 jam (cron: "0 * * * *")
```

### Alur Eksekusi

```
1. Query: ambil semua confirmations WHERE status = 'pending'

2. Untuk setiap confirmation:

   a. Hitung sisa_hari = batas_tanggal_konfirmasi - CURRENT_DATE

   b. Jika sisa_hari <= HARI_PERINGATAN (default: 3):
      - Cek: apakah notifikasi 'dp_reminder' untuk confirmation ini
        sudah dibuat hari ini?
      - Jika belum: INSERT notifications (tipe='dp_reminder')

   c. Jika batas_tanggal_konfirmasi < CURRENT_DATE (sudah expired):
      BEGIN TRANSACTION
        - UPDATE confirmations SET status='expired', updated_by=SYSTEM_USER_ID
        - UPDATE rooms SET status='available'
        - INSERT notifications (tipe='dp_expired', referensi_id=confirmation.id,
          pesan='DP konfirmasi kamar {nomor} atas nama {nama} telah expired.')
      COMMIT
      (Rollback apabila salah satu langkah gagal; log error dan lanjut ke item berikutnya)

3. Log ringkasan eksekusi: jumlah diperiksa, expired, reminder dikirim
```

### Konfigurasi

| Parameter | Default | Keterangan |
|-----------|---------|------------|
| `DP_EXPIRY_WARNING_DAYS` | 3 | Jumlah hari sebelum expired untuk memicu reminder |
| `DP_WORKER_CRON` | `0 * * * *` | Jadwal cron (setiap jam) |

### Error Handling

- Apabila satu konfirmasi gagal diproses, worker mencatat error ke log dan **melanjutkan ke konfirmasi berikutnya** — satu kegagalan tidak menghentikan seluruh batch.
- Apabila koneksi database putus, worker mencatat error kritis ke log dan menunggu eksekusi berikutnya.
- Transaksi expired bersifat idempoten — apabila worker dijalankan ulang pada konfirmasi yang sama, kondisi `status != 'pending'` akan menyebabkan tidak ada perubahan.

---

## 3. Worker 2 — Payment Monitoring Worker

### Tujuan

Memeriksa status pembayaran seluruh kamar aktif setiap hari dan membuat notifikasi apabila ditemukan kamar yang mendekati atau melewati jatuh tempo.

**Konteks lapangan:** Tidak ada mekanisme yang memberikan informasi lebih awal ketika penghuni mulai menunggak. Keterlambatan pembayaran baru diketahui setelah melewati batas toleransi yang tidak pernah terdefinisi secara tertulis. Worker ini mengisi celah tersebut dengan pemantauan harian otomatis.

### Jadwal

```
Schedule: Setiap hari pukul 00:00 (cron: "0 0 * * *")
```

### Definisi Jatuh Tempo

Jatuh tempo pembayaran per kamar dihitung berdasarkan **tanggal masuk penghuni**:

```
jatuh_tempo_bulan_ini = tanggal_masuk.day pada bulan berjalan
```

Contoh: penghuni masuk tanggal 5, maka jatuh tempo setiap bulan adalah tanggal 5.

### Status Pembayaran

| Kondisi | Status |
|---------|--------|
| Belum ada payment record untuk periode berjalan | `unpaid` |
| Ada payment record dan `tanggal_bayar` terisi | `paid` |
| `CURRENT_DATE` ≥ `jatuh_tempo` dan belum bayar | `overdue` |

### Alur Eksekusi

```
1. Query: ambil semua tenants WHERE status = 'active'

2. Untuk setiap tenant:

   a. Hitung periode_berjalan = format(CURRENT_DATE, 'YYYY-MM')

   b. Query: cek apakah ada payment record untuk room_id + tenant_id + periode_berjalan
      dengan status = 'paid'

   c. Jika belum bayar:
      - Hitung jatuh_tempo = tanggal_masuk.day pada bulan berjalan
      - Hitung sisa_hari = jatuh_tempo - CURRENT_DATE

      - Jika sisa_hari <= HARI_PERINGATAN dan sisa_hari > 0 (mendekati jatuh tempo):
          - Cek: sudah ada notifikasi 'payment_due' untuk room + periode ini hari ini?
          - Jika belum: INSERT notifications (tipe='payment_due')

      - Jika sisa_hari <= 0 (sudah melewati jatuh tempo):
          - UPDATE payments SET status='overdue' (apabila payment record sudah ada)
            ATAU INSERT payment record baru dengan status='overdue'
          - Cek: sudah ada notifikasi 'payment_overdue' untuk room + periode ini?
          - Jika belum: INSERT notifications (tipe='payment_overdue')

3. Log ringkasan eksekusi: jumlah diperiksa, due, overdue
```

### Konfigurasi

| Parameter | Default | Keterangan |
|-----------|---------|------------|
| `PAYMENT_DUE_WARNING_DAYS` | 3 | Jumlah hari sebelum jatuh tempo untuk memicu reminder |
| `PAYMENT_WORKER_CRON` | `0 0 * * *` | Jadwal cron (setiap hari 00:00) |

### Error Handling

- Kegagalan pada satu tenant tidak menghentikan seluruh batch.
- Log error per item dengan konteks (tenant_id, room_id, periode).
- Idempoten: apabila worker dijalankan dua kali pada hari yang sama, notifikasi yang sama tidak dibuat ulang karena ada pengecekan duplikat sebelum insert.

---

## 4. Notification Record

Setiap notifikasi yang dibuat worker menghasilkan satu baris di tabel `notifications`:

| Field | Nilai |
|-------|-------|
| `tipe` | `dp_reminder` / `dp_expired` / `payment_due` / `payment_overdue` |
| `referensi_id` | UUID confirmation (untuk dp_*) atau UUID payment (untuk payment_*) |
| `pesan` | Pesan deskriptif yang dapat langsung ditampilkan ke Operator |
| `is_read` | `false` (default) |

### Contoh Pesan Notifikasi

| Tipe | Contoh Pesan |
|------|-------------|
| `dp_reminder` | "DP konfirmasi kamar B03 (Kos Mawar) atas nama Sari Dewi akan expired dalam 2 hari." |
| `dp_expired` | "DP konfirmasi kamar B03 (Kos Mawar) atas nama Sari Dewi telah expired. Kamar kembali tersedia." |
| `payment_due` | "Pembayaran kamar A01 (Kos Melati) atas nama Budi Santoso jatuh tempo dalam 3 hari (periode 2024-01)." |
| `payment_overdue` | "Pembayaran kamar A01 (Kos Melati) atas nama Budi Santoso telah melewati jatuh tempo (periode 2024-01)." |

---

## 5. Identitas Sistem untuk Audit Trail

Perubahan yang dilakukan background worker (bukan oleh pengguna manusia) menggunakan `updated_by = SYSTEM_USER_ID` — sebuah UUID khusus yang merepresentasikan aksi otomatis sistem. Hal ini memungkinkan audit trail membedakan perubahan manual oleh Operator dari perubahan otomatis oleh worker.

Nilai `SYSTEM_USER_ID` dikonfigurasi sebagai konstanta di environment atau config file, dan tidak terhubung ke baris pada tabel `users` (tidak ada constraint FK pada kolom `updated_by` untuk kasus ini, atau menggunakan user sistem khusus dengan role `system`).

---

## 6. Startup Sequence

Pada saat aplikasi dimulai, worker didaftarkan ke scheduler sebelum server HTTP mulai menerima request:

```go
func main() {
    // 1. Init DB
    // 2. Init repositories & services
    // 3. Register & start workers
    scheduler.AddFunc("0 * * * *", dpWorker.Run)
    scheduler.AddFunc("0 0 * * *", paymentWorker.Run)
    scheduler.Start()
    // 4. Start Fiber HTTP server
    app.Listen(":8080")
}
```

Graceful shutdown memastikan worker yang sedang berjalan menyelesaikan batch aktifnya sebelum proses dihentikan.
