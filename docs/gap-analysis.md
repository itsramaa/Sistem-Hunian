# Gap Analysis — Fitur Belum Terimplementasi

**Tanggal:** 2026-06-22  
**Status:** Draft Review  
**Scope:** Frontend (React) + Backend (Go) — per halaman & per fitur kecil

---

## Metodologi

Analisis ini membandingkan implementasi aktual (kode frontend & backend) terhadap SRS (`srs_frontend.md`, `srs_overview.md`, `srs_api.md`). Setiap gap dicatat per halaman/fitur dengan kategori:

- **Action** — aksi yang seharusnya ada tapi belum (edit, delete, checkout, dll.)
- **Information** — data/informasi yang seharusnya ditampilkan tapi tidak ada
- **Configuration** — pengaturan/preferensi yang belum diimplementasi
- **UX Enhancement** — perbaikan UX yang signifikan

---

## 1. Profile Page

### Yang sudah ada

- Info akun (nama, email, role badge)
- Ganti password (form + validasi Zod)

### Gap

| #   | Gap                                     | Kategori    | Prioritas |
| --- | --------------------------------------- | ----------- | --------- |
| 1   | Edit nomor telepon                      | Action      | High      |
| 2   | Edit email (dengan konfirmasi password) | Action      | Medium    |
| 3   | Info "terakhir login"                   | Information | Low       |

> **Catatan:** Edit nama dihapus dari scope — nama user bersifat tetap setelah akun dibuat.

---

## 2. Settings Page

### Yang sudah ada

- Theme toggle (dark/light)
- WhatsApp connect/disconnect (operator only)
- System info (versi app, database, storage)
- Section notifikasi (cuma teks, bukan konfigurasi)

### Gap

**Untuk semua role:**

| #   | Gap                                                                                     | Kategori      | Prioritas |
| --- | --------------------------------------------------------------------------------------- | ------------- | --------- |
| 1   | Notification preferences — toggle per jenis (DP reminder, payment due, payment overdue) | Configuration | High      |
| 2   | Timezone preference — sekarang hardcoded WIB                                            | Configuration | Low       |

**Operator only:**

| #   | Gap                                                                                                             | Kategori      | Prioritas |
| --- | --------------------------------------------------------------------------------------------------------------- | ------------- | --------- |
| 3   | User management — list semua user, tambah user baru (email + password + role), nonaktifkan/hapus user           | Configuration | High      |
| 4   | Konfigurasi alert threshold — berapa hari sebelum jatuh tempo mulai alert? Sekarang hardcoded 3 hari di backend | Configuration | Medium    |
| 5   | WhatsApp notification recipient — pilih nomor tujuan notifikasi                                                 | Configuration | Medium    |
| 6   | Default harga sewa per tipe kamar — master data untuk pre-fill form tambah kamar                                | Configuration | Low       |

> **Catatan User Management:** Sistem di-deliver ke pengguna akhir, operator harus bisa buat akun baru tanpa akses DB langsung. Scope minimal: create user (email + password + role), list user, delete/nonaktifkan user. Tidak perlu edit role post-create.

> **Catatan Export/Generate:** Di-hold, belum masuk scope saat ini.

---

## 3. Dashboard

### Yang sudah ada

- Summary cards (total properti, kamar, available, occupied, dp_confirmation)
- Alert panel (DP + payment alerts)
- Notification panel (mark as read, toggle show all)
- Summary cards clickable — navigate ke page relevan
- Role differentiation sebagian (viewer tidak liat alerts/notifications)

### Gap

| #   | Gap                                                                                                            | Kategori    | Prioritas |
| --- | -------------------------------------------------------------------------------------------------------------- | ----------- | --------- |
| 1   | Breakdown per properti — sekarang hanya total agregat, tidak ada drill-down per properti                       | Information | High      |
| 2   | Pendapatan bulan ini — total payment `paid` bulan berjalan                                                     | Information | High      |
| 3   | Quick action buttons — "Catat Pembayaran", "Tambah Konfirmasi DP", "Catat Maintenance" langsung dari dashboard | Action      | Medium    |
| 4   | Maintenance status summary — berapa laporan `reported`/`in_progress` yang belum selesai                        | Information | Medium    |
| 5   | Viewer: room status visual per properti — grid sederhana "Properti A: 10 terisi / 5 kosong"                    | Information | Medium    |
| 6   | Dashboard role differentiation yang lebih jelas — tampilan berbeda per role                                    | UX          | Medium    |

---

## 4. Properties Page (List)

### Yang sudah ada

- CRUD lengkap (tambah, edit, hapus dengan confirm dialog)
- Search
- Pagination
- Error handling hapus properti yang masih punya kamar
- Mobile: card view, Desktop: table view

### Gap

| #   | Gap                                                                                        | Kategori    | Prioritas |
| --- | ------------------------------------------------------------------------------------------ | ----------- | --------- |
| 1   | Sort — by nama, jumlah kamar, occupancy rate                                               | UX          | Medium    |
| 2   | Summary stats di atas tabel — "3 properti, 42 kamar total, 85% hunian"                     | Information | Medium    |
| 3   | Occupancy indicator per baris — progress bar atau badge "penuh/hampir penuh/banyak kosong" | UX          | Low       |

---

## 5. Property Detail Page

### Yang sudah ada

- Info properti (nama, alamat, deskripsi)
- Occupancy banner + progress bar
- Stats cards (total, available, occupied, dp_confirmation)
- Quick action: lihat kamar, lihat penghuni

### Gap

| #   | Gap                                                                         | Kategori    | Prioritas |
| --- | --------------------------------------------------------------------------- | ----------- | --------- |
| 1   | Tombol Edit properti langsung dari detail page                              | Action      | High      |
| 2   | Tombol Hapus properti langsung dari detail page                             | Action      | High      |
| 3   | Inline list kamar — minimal 5 kamar teratas dengan status                   | Information | Medium    |
| 4   | Inline active tenants — siapa yang tinggal di properti ini                  | Information | Medium    |
| 5   | Maintenance aktif — berapa laporan `reported`/`in_progress` di properti ini | Information | Medium    |
| 6   | Payment status summary — berapa yang lunas/belum bayar/terlambat bulan ini  | Information | Low       |
| 7   | Revenue bulan ini — total pendapatan dari properti ini                      | Information | Low       |

---

## 6. Rooms Page (List)

### Yang sudah ada

- CRUD lengkap (tambah, edit, hapus dengan confirm dialog)
- Filter: properti + status
- Search by nomor kamar
- Pagination
- Status badge per kamar
- Dropdown action (edit, hapus, lihat detail, lihat histori)
- Mobile: card view

### Gap

| #   | Gap                                                                              | Kategori | Prioritas |
| --- | -------------------------------------------------------------------------------- | -------- | --------- |
| 1   | Sort by harga sewa, nomor kamar, status                                          | UX       | Medium    |
| 2   | Filter by tipe kamar — 3 petak / 2 petak / 1 petak                               | UX       | Medium    |
| 3   | "Tandai Maintenance" shortcut dari list — langsung buka form laporan maintenance | Action   | Medium    |
| 4   | Bulk select + bulk action — update harga semua kamar tipe tertentu sekaligus     | Action   | Low       |

---

## 7. Room Detail Page

### Yang sudah ada

- Info kamar (nomor, tipe, harga, properti, status)
- Penghuni aktif section (kalau occupied: nama, tanggal masuk, durasi)
- Quick action: lihat detail properti, lihat histori pembayaran

### Gap

| #   | Gap                                                                                              | Kategori    | Prioritas |
| --- | ------------------------------------------------------------------------------------------------ | ----------- | --------- |
| 1   | Tombol Edit kamar (harga/tipe) langsung dari detail                                              | Action      | High      |
| 2   | Tombol Hapus kamar langsung dari detail                                                          | Action      | High      |
| 3   | Tombol Checkout tenant — kalau occupied, harusnya ada tombol checkout langsung                   | Action      | High      |
| 4   | Tombol "Catat Maintenance" — shortcut catatan kerusakan untuk kamar ini                          | Action      | Medium    |
| 5   | Histori pembayaran inline — 3-5 pembayaran terakhir, bukan cuma link                             | Information | Medium    |
| 6   | Histori maintenance inline — 3-5 maintenance terakhir                                            | Information | Medium    |
| 7   | Histori tenant — siapa yang pernah tinggal di kamar ini                                          | Information | Low       |
| 8   | DP confirmation info — kalau status `dp_confirmation`, tampilkan calon, batas tanggal, sisa hari | Information | Medium    |

---

## 8. Tenants Page (List)

### Yang sudah ada

- Tab aktif / histori
- Create tenant (form lengkap)
- Checkout tenant
- Filter by properti
- Search by nama / nomor kamar
- Pagination

### Gap

| #   | Gap                                                                                   | Kategori | Prioritas |
| --- | ------------------------------------------------------------------------------------- | -------- | --------- |
| 1   | Edit data tenant dari list — tidak ada tombol edit di baris tenant                    | Action   | High      |
| 2   | "Mendekati berakhir" indicator — highlight tenant yang kontraknya habis dalam 30 hari | UX       | High      |
| 3   | Filter by "mendekati berakhir" di tab aktif                                           | UX       | Medium    |
| 4   | Sort by tanggal masuk, nama, nomor kamar                                              | UX       | Medium    |
| 5   | Search di tab histori — search hanya berjalan di client side                          | UX       | Low       |
| 6   | Export daftar penghuni — CSV atau PDF                                                 | Action   | Low       |

---

## 9. Tenant Detail Page

### Yang sudah ada

- Data pribadi (nomor identitas, telepon)
- Info hunian (tanggal masuk, durasi, estimasi berakhir / tanggal keluar)
- Quick action: detail kamar, detail properti, riwayat pembayaran

### Gap

| #   | Gap                                                                                          | Kategori    | Prioritas |
| --- | -------------------------------------------------------------------------------------------- | ----------- | --------- |
| 1   | Tombol Edit data tenant (nama, no identitas, no telepon)                                     | Action      | High      |
| 2   | Tombol Checkout langsung dari detail page                                                    | Action      | High      |
| 3   | Riwayat pembayaran inline — 3-5 terakhir, bukan cuma link                                    | Information | Medium    |
| 4   | Status pembayaran bulan ini — langsung visible: "Bulan ini: Lunas / Belum Bayar"             | Information | Medium    |
| 5   | WhatsApp shortcut — tombol "Hubungi via WhatsApp" (buka `wa.me/` link karena ada no telepon) | Action      | Medium    |
| 6   | Perpanjang kontrak — tenant bisa perpanjang `durasi_sewa` tanpa checkout + re-register       | Action      | Medium    |

---

## 10. Payments Page (List)

### Yang sudah ada

- Create payment
- Upload bukti transfer (dengan preview)
- Mark as paid shortcut
- Filter: properti, periode, status
- Pagination
- Status badge
- Mobile: card view

### Gap

| #   | Gap                                                                                               | Kategori    | Prioritas |
| --- | ------------------------------------------------------------------------------------------------- | ----------- | --------- |
| 1   | Edit payment — kalau salah input nominal atau periode, tidak bisa dikoreksi                       | Action      | High      |
| 2   | Filter by tenant name / nomor kamar — sekarang hanya filter by properti, periode, status          | UX          | Medium    |
| 3   | Summary stats di atas tabel — "Bulan ini: 28 lunas, 5 belum bayar, 3 terlambat, total Rp XX juta" | Information | High      |
| 4   | Export laporan pembayaran — CSV/PDF per bulan                                                     | Action      | Medium    |
| 5   | "Generate tagihan" — auto-create payment record untuk semua tenant aktif di bulan tertentu        | Action      | Medium    |
| 6   | Periode navigation — tombol prev/next bulan untuk ganti periode filter cepat                      | UX          | Medium    |

---

## 11. Payment Detail Page

### Yang sudah ada

- Info lengkap (kamar, penghuni, periode, nominal, tanggal bayar, status)
- Tampilkan bukti transfer (download link)
- Quick action: detail kamar, detail penghuni

### Gap

| #   | Gap                                                                      | Kategori    | Prioritas |
| --- | ------------------------------------------------------------------------ | ----------- | --------- |
| 1   | Upload bukti transfer dari detail page — sekarang upload hanya dari list | Action      | High      |
| 2   | Mark as paid dari detail page                                            | Action      | Medium    |
| 3   | Edit nominal / tanggal bayar dari detail page                            | Action      | Medium    |
| 4   | Keterangan/catatan field — ada di type tapi tidak ditampilkan            | Information | Low       |

---

## 12. Confirmations Page (List)

### Yang sudah ada

- Create DP confirmation
- Confirm DP (dengan form data tenant)
- Expire/hanguskan DP
- Countdown sisa hari
- Filter by properti
- Status badge (pending/confirmed/expired)
- Alert visual kalau expired

### Gap

| #   | Gap                                                                                           | Kategori    | Prioritas |
| --- | --------------------------------------------------------------------------------------------- | ----------- | --------- |
| 1   | Edit DP — perpanjang `batas_tanggal_konfirmasi` kalau calon minta waktu lebih                 | Action      | High      |
| 2   | Filter by status (pending only) — sekarang tampil semua, harus scroll untuk cari yang pending | UX          | Medium    |
| 3   | Catatan/keterangan per konfirmasi — info tambahan soal calon penghuni                         | Information | Low       |
| 4   | Tab terpisah: pending vs completed (confirmed + expired)                                      | UX          | Medium    |

---

## 13. Maintenance Page (List + Detail)

### Yang sudah ada (List)

- Create laporan
- Filter: properti, kamar, status
- Klik baris ke detail page

### Yang sudah ada (Detail)

- Update progress (tindakan, biaya, status) via modal
- Info lengkap (kamar, properti, tanggal, deskripsi, tindakan, biaya, status)

### Gap

**List:**

| #   | Gap                                                                 | Kategori    | Prioritas |
| --- | ------------------------------------------------------------------- | ----------- | --------- |
| 1   | Summary stats — "5 reported, 3 in_progress, 12 completed bulan ini" | Information | Medium    |
| 2   | Total biaya maintenance — pengeluaran maintenance periode tertentu  | Information | Medium    |
| 3   | Filter by tanggal laporan / rentang tanggal                         | UX          | Medium    |
| 4   | Sort by biaya, tanggal, status                                      | UX          | Low       |

**Detail:**

| #   | Gap                                                                                              | Kategori    | Prioritas |
| --- | ------------------------------------------------------------------------------------------------ | ----------- | --------- |
| 5   | Update deskripsi kerusakan awal — kalau salah tulis saat create                                  | Action      | Medium    |
| 6   | Foto kerusakan / foto setelah diperbaiki — upload bukti foto untuk dokumentasi                   | Action      | Medium    |
| 7   | Multiple progress update history — sekarang hanya simpan state terakhir, tidak ada log perubahan | Information | Low       |

---

## 14. Audit Trail Page

### Yang sudah ada

- List perubahan status kamar (old -> new)
- Filter by properti
- Pagination
- Info: nomor kamar, properti, siapa yang ubah, kapan, alasan

### Gap

| #   | Gap                                                                                                   | Kategori    | Prioritas |
| --- | ----------------------------------------------------------------------------------------------------- | ----------- | --------- |
| 1   | Filter by tanggal range                                                                               | UX          | Medium    |
| 2   | Filter by jenis perubahan (misal: hanya lihat yang masuk `occupied`)                                  | UX          | Medium    |
| 3   | Filter by user (siapa yang melakukan perubahan)                                                       | UX          | Low       |
| 4   | Audit untuk entitas lain — sekarang hanya room status, seharusnya juga property, tenant, payment, dll | Information | Medium    |
| 5   | Export audit log — PDF/CSV                                                                            | Action      | Low       |

---

## 15. Notifications

### Yang sudah ada (Dropdown navbar)

- Bell icon dengan badge unread count
- List notifikasi terbaru
- Mark as read per item
- Mark all as read

### Yang sudah ada (History page)

- Full list dengan filter is_read
- Pagination

### Gap

| #   | Gap                                                                                                                               | Kategori | Prioritas |
| --- | --------------------------------------------------------------------------------------------------------------------------------- | -------- | --------- |
| 1   | Deep link — klik notifikasi langsung navigate ke entitas terkait (DP notif -> confirmations page, payment notif -> payments page) | UX       | High      |
| 2   | Filter by tipe notifikasi (dp_reminder, dp_expired, payment_due, payment_overdue)                                                 | UX       | Medium    |
| 3   | Delete/clear notifikasi lama                                                                                                      | Action   | Low       |
| 4   | Real-time update — badge count update otomatis tanpa manual refresh                                                               | UX       | Medium    |

---

## 16. Role Access Gaps

### Manager

Manager sekarang cuma bisa akses Dashboard + Maintenance. Yang seharusnya bisa diakses (read-only):

| #   | Page                                                   | Alasan                               |
| --- | ------------------------------------------------------ | ------------------------------------ |
| 1   | Properties list + detail (read-only)                   | Manager perlu tau kondisi properti   |
| 2   | Rooms list + detail (read-only)                        | Manager perlu tau status kamar       |
| 3   | Tenants list + detail (read-only, tanpa data sensitif) | Manager perlu tau siapa yang tinggal |
| 4   | Payments list (read-only, tanpa detail sensitif)       | Manager perlu tau status pembayaran  |
| 5   | Confirmations list (read-only)                         | Manager perlu tau calon penghuni     |

### Viewer

Viewer sekarang cuma liat Summary Cards di Dashboard. Viewer adalah profil yang gaptek (misal mamah) tapi tau operasional harian — ada yang mau bayar, kamar rusak, calon penghuni datang.

**Masalah:** Kalau viewer harus kabarin operator/manager secara manual (telepon/chat), itu sama aja dengan sistem gak ada. Viewer perlu cara menyampaikan info operasional yang sangat simple.

**Solusi: Viewer Request Panel (WhatsApp-based)**

Daripada viewer harus input data langsung (yang terlalu kompleks), viewer punya panel "Request" yang super simple. Setiap request di-forward otomatis via WhatsApp ke operator/manager.

| #   | Request Type         | Form Fields                                         | Forward To            |
| --- | -------------------- | --------------------------------------------------- | --------------------- |
| 1   | Ada pembayaran masuk | Kamar (dropdown), Nama penghuni, Keterangan singkat | WA Operator           |
| 2   | Ada kerusakan        | Kamar (dropdown), Deskripsi singkat                 | WA Manager + Operator |
| 3   | Ada calon penghuni   | Kamar (dropdown), Nama calon, No HP calon           | WA Operator           |

**Flow:**

1. Viewer buka panel "Request" di dashboard — 3 tombol besar dengan icon jelas
2. Pilih jenis request
3. Isi form sederhana (dropdown kamar + 1-2 field teks)
4. Submit → sistem kirim WA ke operator/manager dengan format pesan terstruktur
5. Operator/manager terima WA → tindak lanjuti manual di sistem

**Backend yang dibutuhkan:**

- `POST /api/v1/viewer-requests` — simpan & trigger WhatsApp forwarding
- Tabel `viewer_requests` — simpan history request viewer

> **Catatan:** Viewer tetap hanya read-only untuk data sistem. Request Panel ini bukan input data langsung ke DB — hanya notifikasi ke operator/manager via WA.

> **Catatan Maintenance:** Maintenance adalah catatan internal operator/manager. Tenant tidak punya akses sistem. Maintenance dicatat oleh operator/manager saat menemukan atau mendapat laporan kerusakan dari lapangan.

---

## 17. Backend API Missing Endpoints

| #   | Endpoint                       | Method  | Alasan                                                                       |
| --- | ------------------------------ | ------- | ---------------------------------------------------------------------------- |
| 1   | `/api/v1/users`                | GET     | List users (operator only, untuk user management)                            |
| 2   | `/api/v1/users`                | POST    | Create user baru (operator only)                                             |
| 3   | `/api/v1/users/:id`            | DELETE  | Nonaktifkan/hapus user (operator only)                                       |
| 4   | `/api/v1/auth/change-password` | POST    | Ganti password sendiri — **sudah ada di frontend, perlu verifikasi backend** |
| 5   | `/api/v1/users/profile`        | PUT     | Update profile sendiri (email, telepon)                                      |
| 6   | `/api/v1/notifications/:id`    | DELETE  | Hapus notifikasi lama                                                        |
| 7   | `/api/v1/config/alerts`        | GET/PUT | Konfigurasi alert threshold                                                  |
| 8   | `/api/v1/viewer-requests`      | POST    | Simpan & trigger WhatsApp forwarding untuk Viewer Request Panel              |
| 9   | `/api/v1/viewer-requests`      | GET     | History request dari viewer (operator only)                                  |

> **Catatan:** Endpoint reports (`/reports/*`), generate tagihan (`/payments/generate`), dan update nama user dihapus dari scope — di-hold sesuai keputusan sebelumnya.

---

## Ringkasan Prioritas

**Update terakhir:** 2026-06-23 04:32 UTC

### High Priority (Must Have)

| No  | Gap                                                                      | Status  |
| --- | ------------------------------------------------------------------------ | ------- |
| 1   | Detail pages: tombol Edit/Hapus/Checkout langsung di detail page         | ✅ Done |
| 2   | Settings: User management (create + list + delete user, operator only)   | ✅ Done |
| 3   | Settings: Notification preferences (toggle per jenis)                    | ✅ Done |
| 4   | Viewer: Request Panel (3 jenis request → forward ke WA operator/manager) | ✅ Done |
| 5   | Tenant: Edit data tenant dari list + detail                              | ✅ Done |
| 6   | Tenant: "Mendekati berakhir" indicator                                   | ✅ Done |
| 7   | Payments: Edit payment + summary stats bulan ini                         | ✅ Done |
| 8   | Confirmations: Edit batas tanggal konfirmasi (perpanjang)                | ✅ Done |
| 9   | Notifications: Deep link ke entitas terkait                              | ✅ Done |
| 10  | Profile: Edit nomor telepon                                              | ✅ Done |
| 11  | Dashboard: Breakdown per properti + pendapatan bulan ini                 | ✅ Done |

### Medium Priority (Should Have)

| No  | Gap                                                                              | Status                                   |
| --- | -------------------------------------------------------------------------------- | ---------------------------------------- |
| 12  | Dashboard: Quick actions (catat pembayaran, tambah DP, catat maintenance)        | ✅ Done                                  |
| 13  | Dashboard: Maintenance status summary (reported/in_progress count)               | ✅ Done                                  |
| 14  | Detail pages: Inline histories (payment, maintenance)                            | ✅ Done                                  |
| 15  | Room Detail: DP confirmation info kalau status dp_confirmation                   | 📋 Proposal: `room-dp-confirmation-info` |
| 16  | Payments: Periode navigation (prev/next bulan)                                   | ✅ Done                                  |
| 17  | Maintenance: filter tanggal (via audit trail)                                    | ✅ Done                                  |
| 18  | Maintenance Detail: Foto kerusakan/penanganan                                    | ✅ Done                                  |
| 19  | Manager: Read-only access ke Properties, Rooms, Tenants, Payments, Confirmations | ✅ Done                                  |
| 20  | Confirmations: Tab pending vs completed/expired                                  | ✅ Done                                  |
| 21  | Sort di list pages (Properties, Rooms)                                           | ✅ Done                                  |
| 22  | Audit trail: filter tanggal + filter jenis perubahan                             | ✅ Done                                  |
| 23  | Notifications: real-time badge update (60s polling)                              | ✅ Done                                  |

### Low Priority (Nice to Have)

| No  | Gap                                               | Status                                      |
| --- | ------------------------------------------------- | ------------------------------------------- |
| 24  | Tenant: perpanjang kontrak inline                 | 📋 Proposal: `tenant-extend-contract`       |
| 25  | Bulk operations (bulk update harga kamar)         | ⏸️ Hold                                     |
| 26  | Maintenance: multi-progress update history        | 📋 Proposal: `maintenance-progress-history` |
| 27  | Audit trail: export, filter by user               | 📋 Proposal: `audit-trail-export`           |
| 28  | Settings: default harga sewa, WA recipient config | 📋 Proposal: `settings-wa-config`           |
| 29  | Profile: Edit email                               | 📋 Proposal: `profile-edit-email`           |
| 30  | Notifications: Delete/clear notifikasi lama       | 📋 Proposal: `notifications-clear`          |
