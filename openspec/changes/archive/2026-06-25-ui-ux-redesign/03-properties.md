# 03 — Properties

**Pages**: `/dashboard/properties`, `/dashboard/properties/:id`  
**Components**: `Properties.tsx`, `PropertyDetail.tsx`, `PropertyForm.tsx`

---

## Current Issues

- List mungkin tidak punya info cukup di setiap row
- Form create/edit mungkin tidak konsisten dengan global form pattern
- Detail page mungkin tidak menampilkan room list secara intuitif

---

## Enhancement Specification

### Properties List Page

#### Page Header
```
Properti                              [+ Tambah Properti]
Kelola semua properti kos Anda
```

#### Filter Bar
```
[🔍 Search nama/alamat]   [Urutkan: Terbaru ▾]
```

#### Table Columns
| Kolom | Width | Content |
|-------|-------|---------|
| Nama | flex | nama + alamat sebagai sub-text |
| Deskripsi | flex | truncate 1 baris |
| Total Kamar | 100px | angka badge |
| Dibuat | 120px | tanggal format |
| Aksi | 60px | DropdownMenu: Edit, Hapus |

#### Row Interaction
- `hover:bg-muted/50 cursor-pointer`
- Klik row → navigate ke detail page

#### Empty State
```
[Building2 icon besar]
"Belum ada properti"
"Mulai dengan menambahkan properti kos pertama Anda"
[+ Tambah Properti]
```

### Property Detail Page

#### Page Header
```
← Kembali ke Properti
[Nama Properti]                       [Edit] [Hapus]
[Alamat]
```

#### Info Section
- Card dengan grid 2 kolom: Nama, Alamat, Deskripsi, Dibuat

#### Rooms Section
- Title: "Kamar" + badge count + button "+ Tambah Kamar"
- Mini-tabel: Nomor, Tipe, Harga, Status badge, Aksi

### Property Form (Dialog/Sheet)
- Field: Nama* , Alamat*, Deskripsi (optional)
- Validation: nama min 1 char, alamat min 5 char
- Footer: [Batal] [Simpan]

### Acceptance Criteria
- [ ] Page header konsisten dengan pattern global
- [ ] Table menggunakan Shadcn Table component
- [ ] Row klik navigate ke detail
- [ ] Empty state tampil saat kosong
- [ ] Form validation aktif sebelum submit
- [ ] Delete: AlertDialog konfirmasi + error jika masih ada kamar
