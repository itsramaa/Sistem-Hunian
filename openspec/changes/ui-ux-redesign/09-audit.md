# 09 — Audit Trail

**Page**: `/dashboard/audit`  
**Components**: `AuditTrailPage.tsx`

---

## Current Issues

- Log mungkin ditampilkan sebagai plain tabel tanpa context yang jelas
- Tidak ada filter yang memudahkan pencarian log spesifik
- Tidak ada visualisasi timeline

---

## Enhancement Specification

### Page Header
```
Audit Trail                          
Log perubahan status kamar secara kronologis
```
- Hanya visible untuk role Manager
- Badge role indicator: "Manager Only" di header

### Filter Bar
```
[🔍 Search kamar] [Properti ▾] [Tanggal ▾] [Reset]
```

### Table Columns
| Kolom | Width | Content |
|-------|-------|---------|
| Waktu | 150px | tanggal + jam format |
| Kamar | 100px | nomor kamar |
| Property | flex | nama property |
| Status Lama | 130px | Badge atau "–" (pertama kali) |
| → | 30px | arrow icon |
| Status Baru | 130px | Badge berwarna |
| Diubah Oleh | flex | nama user |

#### Status Arrow Visual
```
[Badge lama]  →  [Badge baru]
available        occupied
```

### Timeline View Toggle (optional enhancement)
- Toggle antara "Tabel" dan "Timeline" view
- Timeline: chronological list dengan icon per event

### Empty State
```
[Activity icon]
"Belum ada perubahan status"
"Log akan muncul saat ada perubahan status kamar"
```

### Acceptance Criteria
- [ ] Page hanya bisa diakses role manager
- [ ] Tabel log dengan status before/after arrow
- [ ] Filter berdasarkan kamar dan properti
- [ ] Status badge konsisten dengan global semantic colors
- [ ] Empty state informatif
- [ ] Timestamp format yang readable (DD MMM YYYY HH:mm)
