# Proposal: Bugfix & Feature Completion

**Change**: bugfix-and-feature-completion
**Tanggal**: 2026-06-25
**Prioritas**: P1 (BUG-BE-018) > P2 (T-112, T-157a, T-181) > P3 (T-164b cleanup)

---

## Latar Belakang

Setelah blackbox testing selesai, ditemukan beberapa item yang perlu diselesaikan:

1. **Bug aktif** yang belum difix
2. **Fitur yang salah diklasifikasikan** sebagai missing padahal sudah ada
3. **Cleanup tasks.md** dari item tidak relevan

---

## Investigasi Hasil

### T-112 — Tenant Detail Payment History
**Status aktual**: Sudah ada implementasi di `TenantDetail.tsx` (`usePayments(1, 5, undefined, id)` + render section). **Bug**: section hanya muncul jika `recentPayments.length > 0` — tidak ada empty state. Jika tenant baru atau belum ada payment, section hilang sepenuhnya.

**Fix**: Selalu tampilkan section, tambah empty state "Belum ada riwayat pembayaran".

### T-121/T-122 — Payment Filter by Room/Tenant
**Status aktual**: BE sudah support `tenant_id` dan `room_id` sebagai query param. TenantDetail sudah navigate ke `/dashboard/payments?tenant_id=X`. **Kesimpulan**: Tidak perlu filter global di halaman Payments — navigasi dari TenantDetail/RoomDetail sudah cukup untuk skripsi. **Action**: Update tasks.md, mark N/A.

### T-157a — State Machine Maintenance di FE
**Status aktual**: Semua 3 opsi status selalu tampil di select. BE akan reject dengan 422 jika transisi tidak valid, tapi FE tidak memberikan feedback yang baik.

**Best practice untuk skripsi**: Enforce state machine di FE dengan filter opsi valid:
- `reported` → hanya bisa pilih `in_progress`
- `in_progress` → hanya bisa pilih `completed`
- `completed` → tidak bisa diubah (readonly)

**Fix**: Filter `<SelectItem>` di update form maintenance berdasarkan status saat ini.

### T-164b — Audit Trail Filter
**Status aktual**: Filter sudah ada lengkap di `AuditTrailPage.tsx` — filter property, status, date range, changed_by. Ini adalah **false positive** di tasks.md — filter sudah diimplementasi sebelumnya. **Action**: Update tasks.md mark PASS.

### T-181 — Profile Edit Nama
**Status aktual**: `PATCH /api/v1/auth/me` sudah ada di BE. Model `UpdateMeRequest` tersedia. FE `Profile.tsx` belum ada form edit nama — hanya tampilan readonly.

**Fix**: Tambah inline edit form di Profile page untuk field `nama` dan `nomor_telepon`.

### T-186 / BUG-BE-018 — SQL Error Bocor di WA Config
**Root cause**: `wa_config_handler.go` mengambil userID secara manual via `c.Locals("user_claims")` tapi middleware menyimpan user di `c.Locals("user")` via `middleware.GetUser()`. Akibatnya `userID` = `""` (empty string), lalu query SQL `WHERE updated_by = ''` gagal dengan "invalid syntax for type uuid".

**Fix**: Ganti manual extraction dengan `middleware.GetUser(c).UserID` yang benar. Tambah error wrapping di handler agar pesan teknis tidak bocor ke user.

---

## Scope Perubahan

### Backend (Sistem-Hunian-Go)
| File | Perubahan |
|------|-----------|
| `internal/handler/wa_config_handler.go` | Fix userID extraction + sanitize error message |

### Frontend (Sistem-Hunian-V2)
| File | Perubahan |
|------|-----------|
| `src/features/tenant/pages/TenantDetail.tsx` | Tambah empty state payment history section |
| `src/features/maintenance/pages/Maintenance.tsx` | Enforce state machine di update status select |
| `src/features/profile/pages/Profile.tsx` | Tambah inline edit form nama + nomor telepon |
| `src/features/profile/api/settingsApi.ts` | Tambah `updateProfile()` call ke `PATCH /auth/me` |
| `src/features/profile/hooks/useProfile.ts` | Tambah `useUpdateProfile` mutation |

### tasks.md
| Item | Action |
|------|--------|
| T-112 | Update ke PASS setelah fix |
| T-121/T-122 | Mark N/A — navigasi dari detail page sudah cukup |
| T-157a | Update ke PASS setelah fix |
| T-164b | Update ke PASS — sudah ada implementasi (false positive) |
| T-181 | Update ke PASS setelah fix |
| T-186 | Update ke PASS setelah fix |

---

## Out of Scope
- BUG-FE-008 (payment history di TenantDetail) — ternyata sudah ada, hanya perlu empty state
- BUG-FE-010 (filter payment global) — tidak diimplementasi, N/A untuk skripsi
- BUG-FE-018 (audit filter) — sudah ada, false positive
- BUG-FE-020 (profile edit nama) → dalam scope sebagai T-181

---

## Risiko
- Profile edit menggunakan endpoint yang sama dengan user management — perlu pastikan hanya bisa update `nama` dan `nomor_telepon` milik sendiri (tidak bisa update role atau email).
- State machine enforcement di FE tidak menggantikan validasi BE — BE tetap jadi source of truth.
