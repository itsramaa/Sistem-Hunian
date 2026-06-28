# 06 — Payments

**Pages**: `/dashboard/payments`, `/dashboard/payments/:id`  
**Components**: `Payments.tsx`, `PaymentDetail.tsx`

---

## Current Issues

- Tabel pembayaran mungkin terlalu banyak kolom
- Status update flow tidak intuitif
- Filter mungkin belum optimal

---

## Enhancement Specification

### Payments List Page

#### Page Header
```
Pembayaran                           [+ Tambah Pembayaran]
Histori pembayaran sewa penghuni
```

#### Filter Bar
```
[🔍 Search] [Kamar ▾] [Periode ▾] [Status ▾] [Reset]
```
Status filter pills: All | Paid | Unpaid | Overdue

#### Table Columns
| Kolom | Width | Content |
|-------|-------|---------|
| Periode | 100px | format "Juni 2026" |
| Kamar | 100px | nomor kamar |
| Penghuni | flex | nama tenant |
| Nominal | flex-right | format Rupiah |
| Tanggal Bayar | 120px | format atau "Belum dibayar" |
| Status | 100px | Badge component |
| Aksi | 60px | DropdownMenu |

#### Status Badge
- `paid` → green success: "Lunas"
- `unpaid` → yellow warning: "Belum Dibayar"
- `overdue` → red destructive: "Jatuh Tempo"
- `pending` → blue info: "Pending"
- `cancelled` → gray muted: "Dibatalkan"

#### Row Highlight
- Overdue rows: `bg-destructive/5` subtle red background
- Hover: `hover:bg-muted/50`

### Payment Detail Page

#### Page Header
```
← Kembali ke Pembayaran
Pembayaran Periode [Bulan Tahun]     [Update Status]
Kamar [Nomor] • [Nama Property]
```

#### Info Card
```
[Card: Grid 2 kolom]
  Tenant         Nominal
  Tanggal Bayar  Status
  Bukti Transfer (link jika ada)
```

#### Update Status Section
- Button group atau select: Paid / Cancelled
- Upload bukti transfer (optional)
- Loading state pada button

### Acceptance Criteria
- [ ] Rupiah format konsisten
- [ ] Status badge sesuai semantic color
- [ ] Overdue rows punya background merah subtle
- [ ] Detail page menampilkan semua info
- [ ] Update status dengan loading feedback
- [ ] Histori tidak bisa dihapus (tidak ada tombol delete)
