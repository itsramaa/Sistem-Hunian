# 08 — Maintenance

**Pages**: `/dashboard/maintenance`, `/dashboard/maintenance/:id`  
**Components**: `Maintenance.tsx`, `MaintenanceDetail.tsx`

---

## Current Issues

- Status flow tidak tergambar dengan jelas di list
- Detail page mungkin tidak menampilkan progress status secara visual
- Form update status tidak intuitif

---

## Enhancement Specification

### Maintenance List Page

#### Page Header
```
Maintenance                          [+ Lapor Kerusakan]
Kelola laporan dan penanganan kerusakan
```

#### Filter Bar
```
[🔍 Search deskripsi] [Status ▾] [Kamar ▾] [Reset]
```
Status filter pills: All | Reported | In Progress | Completed

#### Table Columns
| Kolom | Width | Content |
|-------|-------|---------|
| Kamar | 100px | nomor kamar |
| Deskripsi | flex | truncate 1 baris |
| Tanggal | 110px | format tanggal |
| Biaya | flex-right | format Rupiah atau "–" |
| Status | 120px | Badge component |
| Aksi | 60px | DropdownMenu: Lihat, Update |

#### Status Badge
- `reported` → info: "Dilaporkan"
- `in_progress` → warning: "Diproses"
- `completed` → success: "Selesai"

### Maintenance Detail Page

#### Page Header
```
← Kembali ke Maintenance
Maintenance Kamar [Nomor]            [Update Status]
[Tanggal Laporan] • [Nama Property]
```

#### Status Progress Bar
Visual stepper horizontal:
```
[● Dilaporkan] ──── [● Diproses] ──── [○ Selesai]
```
- Step aktif: `bg-primary text-primary-foreground`
- Step selesai: `bg-success`
- Step pending: `bg-muted`

#### Info Card
```
[Grid 2 kolom]
  Kamar          Tanggal Laporan
  Biaya          Status
Deskripsi Kerusakan (full text)
Tindakan Penanganan (full text atau "Belum ada tindakan")
```

#### Foto Section (jika ada)
- Grid 2 kolom: Foto Kerusakan | Foto Penanganan
- Klik untuk preview full-size

#### Update Status Form (Sheet)
- Fields: Status* (select), Tindakan Penanganan (textarea), Biaya (number)
- Status options: reported → in_progress → completed
- Loading state pada submit

### Maintenance Create Form (Sheet)
- Fields: Kamar* (select), Deskripsi Kerusakan*, Tanggal Laporan (date, default today)

### Acceptance Criteria
- [ ] Status progress stepper tampil di detail page
- [ ] Filter pills untuk status
- [ ] Update status via Sheet form
- [ ] Biaya format Rupiah
- [ ] Foto section tampil jika ada foto
- [ ] Manager juga bisa create dan update (RBAC)
