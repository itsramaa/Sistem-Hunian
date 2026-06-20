# Tasks: feat-01-dashboard-roles

## Task List

### T1 — Read Dashboard component
- File: `src/features/dashboard/pages/Dashboard.tsx`
- Identifikasi section: Summary Cards, Alert Panel, Notification Panel
- Cek bagaimana role saat ini dipakai (jika ada)

### T2 — Implement role-based rendering
- Import `useAuth` di Dashboard
- Wrap Alert Panel dengan `{(role === 'operator' || role === 'manager') && ...}`
- Wrap Notification Panel dengan `{role === 'operator' && ...}`
- Pastikan Manager melihat Alert Panel tapi tanpa action buttons (read-only)

### T3 — Verify Viewer experience
- Pastikan halaman Viewer bersih: hanya 5 summary cards
- Tidak ada elemen interaktif yang tidak relevan

### T4 — Build check
- `npm run build` — 0 errors

## Definition of Done
- [ ] Viewer: hanya Summary Cards terlihat
- [ ] Manager: Summary Cards + Alert Panel (read-only, no action buttons)
- [ ] Operator: semua komponen + notifikasi + mark-as-read
- [ ] Build sukses
