# 07 — Confirmations (DP)

**Page**: `/dashboard/confirmations`  
**Components**: `ConfirmationsPage.tsx`, `ConfirmationForm.tsx`, `ConfirmDpForm.tsx`

---

## Current Issues

- Flow konfirmasi DP tidak intuitif
- Status expired mungkin tidak dibedakan dengan jelas
- Form DP tidak memberikan preview harga sewa terkait

---

## Enhancement Specification

### Confirmations List Page

#### Page Header
```
Konfirmasi DP                        [+ Ajukan DP]
Kelola uang muka dan konfirmasi penghuni
```

#### Filter Bar
```
[🔍 Search nama] [Status ▾] [Reset]
```
Status pills: All | Pending | Confirmed | Expired

#### Table Columns
| Kolom | Width | Content |
|-------|-------|---------|
| Calon Penghuni | flex | nama |
| Kamar | 100px | nomor + tipe |
| Nominal DP | flex-right | format Rupiah |
| Batas Waktu | 120px | tanggal + countdown |
| Status | 100px | Badge component |
| Aksi | 80px | Confirm / View |

#### Status Badge
- `pending` → warning: "Pending" + countdown indicator
- `confirmed` → success: "Dikonfirmasi"
- `expired` → muted: "Kedaluwarsa" + line-through style

#### Countdown Indicator (pending)
- Sisa waktu: "3 hari lagi", "Besok", "Hari ini", "Terlambat X hari"
- Warna: hijau (>3 hari), kuning (1-3 hari), merah (0/habis)

#### Row Action
- Pending → tombol "Konfirmasi" (primary button kecil)
- Confirmed → tombol "Lihat" (link ke detail tenant)
- Expired → tidak ada aksi

### Confirm DP Dialog (AlertDialog)
```
Konfirmasi DP
Anda yakin ingin mengkonfirmasi DP dari [Nama Calon Penghuni]?

Detail:
  Kamar: [Nomor] ([Tipe])
  Nominal DP: Rp X
  Tanggal Masuk: [Tanggal]
  Durasi Sewa: X bulan

Proses ini akan:
• Membuat data penghuni baru
• Mengubah status kamar menjadi "occupied"

[Batal] [Konfirmasi]
```

### Create DP Form (Sheet)
- Fields: Kamar* (select, only available), Nama Calon*, Telepon, Nominal DP*, Tanggal Masuk*, Durasi*
- Live preview: "Minimal DP: Rp X (10% dari Rp [harga sewa])" di bawah nominal input
- Validation: nominal >= 10% harga sewa kamar

### Acceptance Criteria
- [ ] Countdown indicator tampil untuk DP pending
- [ ] Status expired dibedakan dengan visual (line-through atau opacity)
- [ ] Confirm dialog tampilkan detail lengkap sebelum submit
- [ ] Create form tampilkan minimum DP hint
- [ ] Toast success setelah konfirmasi berhasil
- [ ] DP expired tidak bisa dikonfirmasi
