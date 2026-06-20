# Tasks: feat-02-notification-ux

## Task List

### T1 — Audit existing notification code
- Baca `src/features/notifications/components/NotificationsDropdown.tsx`
- Baca `src/features/dashboard/pages/Dashboard.tsx` (notification section)
- Identifikasi: apakah filter unread sudah ada? apakah mark-as-read sudah terhubung?

### T2 — Add unread filter + toggle
- Default state: `showAll = false` → hanya tampilkan `is_read = false`
- Tambah tombol "Lihat semua" / "Tampilkan lebih sedikit"
- State toggle lokal dengan `useState`

### T3 — Implement mark-as-read
- Tambah `useMarkNotificationRead` mutation di notifications hooks
- Panggil `PATCH /api/v1/notifications/:id/read`
- Invalidate notifications query setelah sukses
- Tambah tombol/gesture mark-as-read pada tiap notifikasi

### T4 — Role-based visibility (koordinasi dengan feat-01)
- Pastikan notification panel hanya render untuk `role === 'operator'`
- Jika feat-01 sudah handle ini, verifikasi saja

### T5 — Build check
- `npm run build` — 0 errors

## Definition of Done
- [ ] Default view: hanya unread notifications
- [ ] Toggle "Lihat semua" berfungsi
- [ ] Mark-as-read memanggil API dan update UI
- [ ] Viewer dan Manager tidak melihat notification panel
- [ ] Build sukses
