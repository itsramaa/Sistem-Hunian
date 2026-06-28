# Tasks: Bugfix & Feature Completion

**Change**: bugfix-and-feature-completion
**Tanggal**: 2026-06-25
**Status**: COMPLETED

---

## BE Fixes

- [x] **BE-01** Fix `wa_config_handler.go` — ganti manual `c.Locals("user_claims")` dengan `middleware.GetUser(c).UserID`
- [x] **BE-02** Sanitize error message di `UpdateWAConfig` handler — jangan bocorkan raw SQL error ke user
- [x] **BE-03** Tambah `Nama` ke `UpdateMeRequest` model
- [x] **BE-04** Update `user_repo.UpdateMe` untuk support update `nama` + `nomor_telepon`
- [x] **BE-05** Simplify `auth_service.UpdateMe` — single repo call

## FE Fixes

- [x] **FE-01** `TenantDetail.tsx` — section payment history selalu tampil + empty state "Belum ada riwayat pembayaran"
- [x] **FE-02** `Maintenance.tsx` — enforce state machine di update status:
  - `reported` → only show `in_progress`
  - `in_progress` → only show `completed`
  - default value ke next valid state saat form dibuka
- [x] **FE-03** `Profile.tsx` — inline edit form untuk `nama` (pencil icon + save/cancel)
- [x] **FE-04** `useProfile.ts` — tambah `nama` ke `UpdateProfilePayload`

## tasks.md Cleanup

- [x] **CLEANUP-01** T-112 → PASS (empty state fix)
- [x] **CLEANUP-02** T-121/T-122 → N/A (navigasi dari detail page sudah cukup)
- [x] **CLEANUP-03** T-157a → PASS (state machine enforced di FE)
- [x] **CLEANUP-04** T-164b → PASS (false positive — filter sudah ada)
- [x] **CLEANUP-05** T-181/T-182 → PASS (profile edit nama implemented)
- [x] **CLEANUP-06** T-186/T-225 → PASS (wa_config UUID bug fixed)
- [x] **CLEANUP-07** Open Issues section → cleared
