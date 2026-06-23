# Proposal: Tenant — Perpanjang Kontrak Inline

## Problem
Operator tidak bisa memperpanjang durasi sewa langsung dari Tenant Detail. Saat ini hanya bisa checkout tenant dan buat konfirmasi baru — tidak ada cara langsung extend kontrak yang sedang berjalan.

## Solution
Tambah tombol "Perpanjang Kontrak" di Tenant Detail (hanya untuk tenant aktif) yang membuka dialog sederhana untuk input tambahan bulan. Backend endpoint `PATCH /api/v1/tenants/:id` sudah support update `durasi_sewa`.

## Scope
- **Frontend** — `src/features/tenant/pages/TenantDetail.tsx`
- **Backend** — verifikasi `PATCH /api/v1/tenants/:id` support extend `durasi_sewa`

## Implementation Plan

### Frontend — TenantDetail.tsx
1. Tambah state `extendOpen` dan `tambahBulan`
2. Tambah tombol "Perpanjang" di samping Edit (hanya tenant aktif, operator only)
3. Dialog konfirmasi dengan input jumlah bulan tambahan
4. Panggil `useUpdateTenant` dengan payload `{ durasi_sewa: tenant.durasi_sewa + tambahBulan }`

### Dialog
```tsx
<Dialog open={extendOpen} onOpenChange={setExtendOpen}>
  <DialogContent>
    <DialogHeader><DialogTitle>Perpanjang Kontrak</DialogTitle></DialogHeader>
    <p className="text-sm text-muted-foreground">
      Durasi sewa saat ini: {tenant.durasi_sewa} bulan.
      Est. berakhir: {format(estimatedCheckout, "dd MMMM yyyy")}
    </p>
    <div>
      <Label>Tambah berapa bulan?</Label>
      <Input type="number" min={1} max={24} value={tambahBulan} onChange={...} />
    </div>
    <p className="text-xs text-muted-foreground">
      Setelah perpanjangan: {tenant.durasi_sewa + tambahBulan} bulan total.
      Est. berakhir baru: {format(newCheckout, "dd MMMM yyyy")}
    </p>
    <DialogFooter>
      <Button onClick={handleExtend} disabled={isPending}>Perpanjang</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

## Acceptance Criteria
- [ ] Tombol "Perpanjang" muncul di Tenant Detail untuk tenant aktif (operator only)
- [ ] Dialog menampilkan durasi saat ini dan estimasi berakhir
- [ ] Input tambahan bulan (1-24), preview estimasi berakhir baru
- [ ] Submit update `durasi_sewa` via `useUpdateTenant`
- [ ] Success toast + invalidate query
- [ ] Tombol tidak muncul untuk tenant yang sudah checkout atau role manager/viewer
