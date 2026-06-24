# 04 — Rooms

**Pages**: `/dashboard/rooms`, `/dashboard/rooms/:id`  
**Components**: `Rooms.tsx`, `RoomDetail.tsx`, `RoomForm.tsx`

---

## Current Issues

- Filter bar mungkin terlalu banyak dropdown berjajar
- Status badge mungkin belum konsisten
- Room detail mungkin tidak menampilkan info terkait secara terstruktur

---

## Enhancement Specification

### Rooms List Page

#### Page Header
```
Kamar                               [+ Tambah Kamar]
Kelola semua unit kamar di properti
```

#### Filter Bar
```
[🔍 Search nomor kamar] [Properti ▾] [Status ▾] [Reset]
```
- Status filter: pills (All | Available | DP | Occupied), bukan dropdown
- Filter pills: `bg-muted hover:bg-muted/80`, active: `bg-primary text-primary-foreground`

#### Table Columns
| Kolom | Width | Content |
|-------|-------|---------|
| Nomor | 100px | teks bold |
| Tipe | flex | teks |
| Harga | flex-right | format Rupiah |
| Status | 120px | Badge component |
| Property | flex | nama property |
| Penghuni | flex | nama atau "–" |
| Aksi | 60px | DropdownMenu |

#### Status Badge
- `available` → Badge `bg-success/10 text-success border-success/20`
- `dp_confirmation` → Badge `bg-warning/10 text-warning border-warning/20`
- `occupied` → Badge `bg-destructive/10 text-destructive border-destructive/20`

### Room Detail Page

#### Page Header
```
← Kembali ke Kamar
Kamar [Nomor Kamar]                   [Edit]
[Tipe] • [Nama Property]
```

#### Status Card
Status badge besar + informasi harga

#### Tabs
1. **Info** — Detail kamar, property info
2. **Penghuni** — Tenant aktif, checkout button
3. **Pembayaran** — List pembayaran kamar
4. **Maintenance** — List maintenance kamar

#### Tenant Tab (jika ada tenant aktif)
```
[Card tenant: nama, telepon, tanggal masuk, durasi]
[Checkout button: variant=destructive]
```

#### Checkout Dialog (AlertDialog)
```
Konfirmasi Checkout
Apakah Anda yakin ingin melakukan checkout untuk [Nama]?
Jika ada tunggakan, proses akan ditolak.
[Batal] [Checkout]
```

### Room Form (Sheet)
- Fields: Properti* (select), Nomor Kamar*, Tipe Kamar*, Harga Sewa*
- Harga format input dengan prefix "Rp"
- Validation: harga min 1, nomor max 50 char

### Acceptance Criteria
- [ ] Filter pills untuk status (bukan dropdown)
- [ ] Status badge konsisten dengan semantic colors
- [ ] Detail page pakai tabs untuk section
- [ ] Checkout menggunakan AlertDialog
- [ ] Harga format Rupiah di semua tempat
- [ ] Empty state tampil jika tidak ada kamar
