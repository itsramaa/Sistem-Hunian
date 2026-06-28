# 05 — Tenants

**Pages**: `/dashboard/tenants`, `/dashboard/tenants/:id`  
**Components**: `Tenants.tsx`, `TenantDetail.tsx`, `TenantForm.tsx`, `CheckoutForm.tsx`

---

## Current Issues

- Checkout flow mungkin tidak jelas indikasi sukses/gagal
- Tenant detail tidak menampilkan payment status ringkas
- Status indicator tidak konsisten

---

## Enhancement Specification

### Tenants List Page

#### Page Header
```
Penghuni                             [+ Tambah Penghuni]
Kelola data penghuni aktif dan histori
```

#### Filter Bar
```
[🔍 Search nama] [Status ▾] [Reset]
```
Status filter pills: All | Active | Checked Out

#### Table Columns
| Kolom | Width | Content |
|-------|-------|---------|
| Nama | flex | nama tenant |
| Kamar | 100px | nomor kamar |
| Telepon | flex | nomor telepon |
| Masuk | 100px | tanggal format |
| Durasi | 80px | X bulan |
| Status | 100px | Badge component |
| Aksi | 60px | DropdownMenu |

#### Status Badge
- `active` → green success
- `checked_out` → gray muted

### Tenant Detail Page

#### Page Header
```
← Kembali ke Penghuni
[Nama Tenant]                        [Checkout]
Kamar [Nomor] • [Nama Property]
```

#### Info Grid
```
[Card Grid 2 kolom]
  Nomor Identitas    Tanggal Masuk
  Nomor Telepon      Durasi Sewa
  Status             Tanggal Keluar (jika checkout)
```

#### Payment History Section
- Mini-tabel: Periode, Nominal, Status badge, Tanggal Bayar

#### Checkout Button
- Hanya tampil jika status = `active`
- Variant: `destructive`
- Loading state: disabled + spinner

#### Checkout Confirmation (AlertDialog)
```
Konfirmasi Checkout
[Icon: AlertTriangle]
Anda yakin ingin checkout [Nama Tenant] dari kamar [Nomor]?
Proses ini tidak dapat dibatalkan. Jika ada tunggakan, checkout akan ditolak.
[Batal] [Checkout]
```

#### Checkout Error Handling
- Jika ada tunggakan → toast error: "Checkout ditolak: masih ada tunggakan pembayaran"
- Jika berhasil → toast success + redirect ke list

### Tenant Form (Sheet)
- Fields: Room* (select, only available), Nama*, Nomor Identitas*, Nomor Telepon*, Tanggal Masuk*, Durasi Sewa*
- Durasi dalam bulan (number input min=1)
- Validation: semua field required

### Acceptance Criteria
- [ ] Checkout hanya muncul untuk tenant active
- [ ] Checkout menggunakan AlertDialog konfirmasi
- [ ] Payment history tampil di detail page
- [ ] Toast untuk success/error checkout
- [ ] Filter pills untuk status
- [ ] Empty state saat tidak ada tenant
