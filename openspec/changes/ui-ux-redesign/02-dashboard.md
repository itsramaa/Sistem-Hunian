# 02 — Dashboard

**Page**: `/dashboard`  
**Components**: `Dashboard.tsx`, `useDashboard.ts`

---

## Current Issues

- KPI cards mungkin tidak konsisten ukuran/spacing
- Tidak jelas hierarki antara summary numbers dan label
- Belum ada trend/delta indicator
- Loading skeleton mungkin tidak proporsional

---

## Enhancement Specification

### Page Header
```
Selamat datang, [Nama User]        [Tanggal hari ini]
Ringkasan operasional properti Anda
```

### KPI Cards Grid
Layout: `grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4`

Setiap card:
```
[Icon container bg-primary/10 rounded-lg p-2]   [Label text-xs text-muted-foreground uppercase tracking-wide]
                                                  [Value text-3xl font-bold text-foreground]
                                                  [Sub-label text-xs text-muted-foreground]
```

Cards:
1. **Total Properti** — icon: `Building2`, value: angka, sub: "properti terdaftar"
2. **Kamar Tersedia** — icon: `DoorOpen`, color: success, value: angka
3. **Kamar Terisi** — icon: `Users`, color: primary, value: angka
4. **Kamar DP** — icon: `Clock`, color: warning, value: angka
5. **Penagihan Bulan Ini** — icon: `Banknote`, value: format Rupiah
6. **Biaya Maintenance** — icon: `Wrench`, color: destructive, value: format Rupiah

### Loading State
- 6 skeleton cards dengan dimensi yang sama persis dengan card asli
- `<Skeleton className="h-24 w-full rounded-xl" />`

### Empty / Zero State
- Jika semua angka 0: tampilkan banner "Mulai dengan menambahkan properti pertama Anda" + CTA button

### Acceptance Criteria
- [ ] 6 KPI cards tampil dalam grid responsif
- [ ] Angka menggunakan format Rupiah (Intl.NumberFormat)
- [ ] Icon konsisten dari Lucide React
- [ ] Loading skeleton proporsional
- [ ] Tidak ada console error
