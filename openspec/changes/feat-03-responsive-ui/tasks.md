# Tasks: feat-03-responsive-ui

## Task List

### T1 — Audit semua halaman
Periksa setiap halaman untuk isu breakpoint:
- [ ] `src/features/payments/pages/Payments.tsx`
- [ ] `src/features/confirmations/pages/ConfirmationsPage.tsx`
- [ ] `src/features/maintenance/pages/Maintenance.tsx`
- [ ] `src/features/tenant/pages/Tenants.tsx`
- [ ] `src/features/rooms/pages/Rooms.tsx`
- [ ] `src/features/properties/pages/Properties.tsx`
- [ ] `src/features/dashboard/pages/Dashboard.tsx`

Dokumentasikan per halaman: ada/tidak mobile view, ada/tidak tablet handling, touch target issues.

### T2 — Fix mobile card views
Halaman yang belum punya card view untuk mobile: tambahkan menggunakan `isMobile` check + `DataCard` component.

### T3 — Fix form modals di mobile
- Dialog dengan `sm:max-w-lg` perlu `max-h-[90vh] overflow-y-auto` di mobile
- Form fields harus full-width di mobile

### T4 — Tablet layout optimasi
- Sidebar: tambah `md:` breakpoint states yang tepat
- Grid/flex layouts: pastikan ada `md:` variants yang proporsional
- Tabel: di tablet show lebih banyak kolom daripada mobile tapi bisa lebih sedikit dari desktop

### T5 — Touch targets audit + fix
- Cari semua `h-8` buttons di tabel actions
- Ganti dengan `h-11 min-h-[44px]` untuk mobile contexts
- Gunakan `sm:h-8` untuk keep desktop compact, `h-11` untuk mobile

### T6 — Build + visual test
- `npm run build` — 0 errors
- Test manual di 360px, 768px, 1280px

## Definition of Done
- [ ] Semua halaman punya consistent mobile card view
- [ ] Form modal tidak overflow di 360px
- [ ] Tablet layout proporsional di 768px
- [ ] Semua touch targets ≥ 44px di mobile
- [ ] Build sukses
