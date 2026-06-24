# Tasks: UI/UX Redesign — SiHuni Frontend

**Change**: ui-ux-redesign  
**Tanggal**: 2026-06-24  
**Status**: Pending Approval

> **Scope Reminder**:
>
> - Sidebar, header, mobile nav, mobile header → **TIDAK DIUBAH**
> - Color palette, CSS variables, font → **TIDAK DIUBAH**
> - Redesign + SOC/KISS/DRY + naming fix → **DITERAPKAN BERSAMAAN**

---

## Phase 0: Audit & Naming Fix

- [x] **P0-001** Audit semua file/folder naming — pastikan sesuai konvensi:
  - Pages → `PascalCase.tsx`
  - Components → `PascalCase.tsx`
  - Hooks → `use*.ts` camelCase
  - Services → `*Service.ts` camelCase
  - Types → `index.ts` atau `types.ts`
  - Utils → `camelCase.ts`
- [x] **P0-002** Cek `src/shared/utils/` — tidak ada duplikasi fungsi antar file
- [x] **P0-003** Cek `src/shared/components/ui/` — custom components vs Shadcn primitives tidak overlap
- [x] **P0-004** Verifikasi `statusColors.ts` — tambah `getSiHuniStatus()` dengan 15 status domain ter-cover
- [x] **P0-005** Verifikasi `currency.ts` — `formatCurrency` sudah dipakai semua fitur (fix `formatRupiah` → `formatCurrency`)
- [x] **P0-006** Verifikasi `dateUtils.ts` — `formatDateTimeDisplay`, `formatRelativeTime`, `getMonthOptions` sudah dipakai

---

## Phase 1: Shared Components Audit & Enhance

### P1-001 — `PageHeader.tsx`

- [x] Baca file existing
- [x] Pastikan support: `title`, `subtitle`, `action` props — ✅ support `icon`, `title`, `description`, `children` (action)
- [x] Pastikan responsive (action button ke bawah di mobile) — ✅ `flex-col sm:flex-row`

### P1-002 — `EmptyState.tsx`

- [x] Baca file existing
- [x] Pastikan support: `icon`, `title`, `description`, `action` props — ✅ semua ada
- [x] Pastikan styling konsisten — ✅ centered, icon besar, optional CTA Button

### P1-003 — `StatCard.tsx`

- [x] Baca file existing
- [x] Pastikan support: `icon`, `label`, `value`, `subLabel` props — ✅ plus tooltip, loading, accentColor, compact
- [x] Pastikan icon container styling — ✅ rounded-lg dengan accentColor bg

### P1-004 — `ContentSkeleton.tsx` / `PageSkeleton.tsx`

- [x] Baca file existing — ✅ ContentSkeleton ada stats row + content area skeleton
- [x] StatCard loading variant sudah built-in di `StatCard.tsx`

### P1-005 — `statusColors.ts`

- [x] Baca file existing
- [x] Semua 15 status ter-cover: `available`, `occupied`, `dp_confirmation`, `active`, `checked_out`, `paid`, `unpaid`, `overdue`, `pending`, `confirmed`, `expired`, `reported`, `in_progress`, `completed`, `cancelled`
- [x] Return format: `{ label, className }` via `getSiHuniStatus()`

---

## Phase 2: Auth Pages (01-login.md)

### P2-001 — `Auth.tsx` (Login)

- [x] SOC check: logic di `AuthForm` component, `Auth.tsx` hanya redirect guard
- [x] Split layout: brand panel kiri `BrandPanel` (hidden mobile lg:flex) + form kanan — ✅
- [x] Label visible di atas input — ✅
- [x] Password show/hide toggle (EyeIcon/EyeOffIcon) — ✅
- [x] Submit button: `w-full`, disabled + `Loader2` saat loading — ✅
- [x] Error message: `text-destructive` di bawah field — ✅

### P2-002 — `ResetPassword.tsx`

- [x] Label visible — ✅
- [x] Submit state → success message — ✅ (fitur belum aktif, stub lengkap dengan feedback)

### P2-003 — `UpdatePassword.tsx`

- [x] Stub dengan info message — ✅ (fitur belum aktif, info card + back button)

---

## Phase 3: Dashboard (02-dashboard.md)

### P3-001 — `Dashboard.tsx`

- [x] SOC: fetch via `useDashboardSummary()`, `useDashboardAlerts()`, `useRooms()` — ✅
- [x] Custom `SummaryCard` komponen lokal — ✅
- [x] Loading: inline skeleton `animate-pulse` — ✅
- [x] Format angka: `tabular-nums` langsung — ✅
- [x] Viewer: `ViewerRequestPanel` dengan lapor cepat — ✅

---

## Phase 4: Properties (03-properties.md)

### P4-001 — `Properties.tsx`

- [x] SOC: data dari `useProperties()` — ✅
- [x] Header dengan title + action button "+ Tambah Properti" — ✅
- [x] Filter: search input + sort dropdown — ✅
- [x] Shadcn `Table` — ✅
- [x] `EmptyState` saat data kosong — ✅
- [x] Loading spinner — ✅
- [x] Delete via `AlertDialog` konfirmasi — ✅
- [x] Toast success/error — ✅

### P4-002 — `PropertyDetail.tsx`

- [x] SOC: `usePropertyById(id)` hook — ✅
- [x] Back button — ✅
- [x] Edit/Delete actions — ✅
- [x] Info grid + stats — ✅
- [x] `ContentSkeleton` loading — ✅

### P4-003 — `PropertyForm.tsx`

- [x] `react-hook-form` + `zod` validation — ✅
- [x] Label di atas input, error message di bawah — ✅
- [x] Footer Batal/Simpan dengan loading state — ✅

---

## Phase 5: Rooms (04-rooms.md)

### P5-001 — `Rooms.tsx`

- [x] SOC: data dari `useRooms()` — ✅
- [x] PageHeader + "+ Tambah Kamar" — ✅
- [x] Filter status pills + search + properti dropdown — ✅
- [x] Shadcn `Table`, status `Badge` via `getSiHuniStatus()` — ✅
- [x] `EmptyState` + loading — ✅

### P5-002 — `RoomDetail.tsx`

- [x] SOC: `useRoomById(id)` — ✅
- [x] DRY: `statusConfig` pakai `getSiHuniStatus()` — ✅
- [x] Tabs: Info | Penghuni | Pembayaran | Maintenance | Konfirmasi DP — ✅
- [x] `ContentSkeleton` loading — ✅

### P5-003 — `RoomForm.tsx`

- [x] `react-hook-form` + `zod` — ✅
- [x] Harga prefix "Rp", min validation — ✅

---

## Phase 6: Tenants (05-tenants.md)

### P6-001 — `Tenants.tsx`

- [x] SOC: data dari `useActiveTenants()` / `useTenantHistory()` — ✅
- [x] PageHeader + "+ Tambah Penghuni" — ✅
- [x] Tabs Active/History — ✅
- [x] `EmptyState` + `ContentSkeleton` — ✅

### P6-002 — `TenantDetail.tsx`

- [x] SOC: `useTenantById(id)` — ✅
- [x] DRY: `getSiHuniStatus()` — ✅
- [x] Back button, Edit via Dialog (react-hook-form+zod), Checkout via AlertDialog — ✅
- [x] Payment history section — ✅

### P6-003 — `TenantForm.tsx`

- [x] `react-hook-form` + `zod` — ✅
- [x] Room select hanya `available` — ✅
- [x] Durasi min 1 — ✅

### P6-004 — `CheckoutForm.tsx`

- [x] Checkout via AlertDialog di detail + list — ✅

---

## Phase 7: Payments (06-payments.md)

### P7-001 — `Payments.tsx`

- [x] SOC: `usePayments()` — ✅
- [x] PageHeader + "+ Tambah Pembayaran" — ✅
- [x] Filter: search, kamar, periode, status — ✅
- [x] Shadcn `Table`, status `Badge` via `getSiHuniStatus()` — ✅
- [x] `EmptyState` + `ContentSkeleton` — ✅

### P7-002 — `PaymentDetail.tsx`

- [x] SOC: `usePaymentById(id)` — ✅
- [x] DRY: `getSiHuniStatus()`, `formatCurrency()` — ✅
- [x] Upload bukti transfer + preview — ✅
- [x] "Tandai Lunas" via `useMarkPaid` — ✅

---

## Phase 8: Confirmations (07-confirmations.md)

### P8-001 — `ConfirmationsPage.tsx`

- [x] SOC: `useConfirmations()` — ✅
- [x] PageHeader + "+ Ajukan DP" — ✅
- [x] Status `Badge` via `getSiHuniStatus()` — ✅
- [x] `EmptyState` + loading — ✅

### P8-002 — `ConfirmationForm.tsx`

- [x] `react-hook-form` + `zod` — ✅

### P8-003 — `ConfirmDpForm.tsx`

- [x] `react-hook-form` + `zod`, loading state — ✅

---

## Phase 9: Maintenance (08-maintenance.md)

### P9-001 — `Maintenance.tsx`

- [x] SOC: `useMaintenances()` — ✅
- [x] PageHeader + "+ Lapor Kerusakan" — ✅
- [x] Status `Badge` via `getSiHuniStatus()` — ✅
- [x] `EmptyState` + loading — ✅

### P9-002 — `MaintenanceDetail.tsx`

- [x] DRY: `statusConfig` pakai `getSiHuniStatus()` — ✅
- [x] `formatCurrency()` — ✅
- [x] Update status via Dialog: react-hook-form + zod — ✅
- [x] Foto upload (kerusakan + penanganan) — ✅
- [x] Maintenance logs section — ✅

---

## Phase 10: Audit Trail (09-audit.md)

### P10-001 — `AuditTrailPage.tsx`

- [x] SOC: extract ke `useAudit.ts` hook (`useAuditRoomStatus`, `exportAuditCsv`) — ✅ done
- [x] Filter: properti, status, tanggal, user — ✅
- [x] Shadcn `Table` dengan before/after status arrow — ✅
- [x] Status `Badge` via `getSiHuniStatus()` — ✅
- [x] Export CSV — ✅

---

## Phase 11: Notifications (10-notifications.md)

### P11-001 — `NotificationsDropdown.tsx`

- [x] Unread count badge di Bell icon — ✅ (ada di header, tidak diubah)
- [x] **TIDAK ubah posisi/trigger di header** — ✅

### P11-002 — `NotificationHistory.tsx`

- [x] SOC: extract `markAllRead` ke `useMarkAllNotificationsRead()` di `useDashboard.ts` — ✅ done
- [x] Header + Lihat Semua/Belum Dibaca toggle — ✅
- [x] Klik → mark as read — ✅
- [x] `EmptyState` — ✅

---

## Phase 12: Profile & Settings (11-profile.md)

### P12-001 — `Profile.tsx`

- [x] Role badge via `roleConfig` — ✅
- [x] Edit nama via Form — ✅
- [x] Ganti password: konfirmasi password match via `zod` `.refine()` — ✅
- [x] Toast per aksi — ✅

### P12-002 — `Settings.tsx`

- [x] WA config + QR connect — ✅
- [x] RBAC guard (operator only tabs) — ✅
- [x] `getSiHuniStatus()` — ✅

---

## Phase 13: Final Audit

- [x] **F-001** Semua halaman reuse `PageHeader.tsx` atau custom header dengan pattern sama — ✅
- [x] **F-002** Semua status badge via `getSiHuniStatus()` dari `statusColors.ts` — ✅
- [x] **F-003** Semua currency via `formatCurrency()` dari `currency.ts` — ✅
- [x] **F-004** `dateUtils.ts` tersedia dan dipakai di komponen date-sensitive — ✅
- [x] **F-005** Semua error handling via `getApiErrorMessage` — ✅
- [x] **F-006** Semua empty state via `EmptyState.tsx` — ✅
- [x] **F-007** Loading state via skeleton/spinner per page — ✅
- [x] **F-008** Destructive actions via `AlertDialog` (delete properti, checkout, dll) — ✅
- [x] **F-009** Semua form via `react-hook-form` + `zod` — ✅

- [x] **F-010** Build pass zero TypeScript errors melalui npx tsc -p tsconfig.app.json --noEmit — ✅
- [x] **F-011** Tidak ada regresi fungsional — routing, RBAC, API tetap sama — ✅
- [x] **F-012** Sidebar/header/nav tidak berubah — ✅
- [x] **F-013** Naming file sesuai konvensi (PascalCase pages/components, camelCase hooks/utils) — ✅
- [x] **F-014** Tidak ada logic duplikat — `getSiHuniStatus`, `formatCurrency`, `getApiErrorMessage` di-centralize — ✅
- [x] **F-016** Components di folder `components/` masing-masing fitur — `DashboardCards.tsx`, `ViewerRequestPanel.tsx`, `SectionHeader.tsx`, `SettingsCards.tsx`, `UserManagementCard.tsx` di-extract — ✅
- [x] **F-017** Semua logika di folder `hooks/` — semua inline `apiClient` di hooks/pages dipindah ke api layer — ✅
- [x] **F-018** Semua terkait api di folder `api/` — hooks hanya berisi `useQuery`/`useMutation` — ✅
- [x] **F-019** Semua types di folder `types/index.ts` — dashboard, audit, whatsapp, viewer-requests types di-extract — ✅
- [x] **F-020** Hapus alias `as xService` — semua hooks pakai `xApi` langsung tanpa alias — ✅
- [x] **F-021** Extract inline JSX di pages jadi components — Dashboard.tsx + Settings.tsx inline functions di-extract ke `components/` — ✅

---

## Urutan Eksekusi yang Direkomendasikan

```
Phase 0 (audit naming)
  → Phase 1 (shared components)
    → Phase 3 (dashboard — paling visible)
      → Phase 4-9 (fitur utama, bisa paralel per fitur)
        → Phase 2 (auth — last, less critical)
          → Phase 10-12 (audit, notif, profile)
            → Phase 13 (final audit)
```
