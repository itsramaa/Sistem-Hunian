# Proposal: Blackbox Testing Manual — SiHuni Frontend

**Change ID**: blackbox-testing  
**Tanggal**: 2026-06-23  
**Author**: QA Team  
**Status**: Draft  
**Target**: Manual testing oleh tester (bukan automated)

---

## 1. Latar Belakang

SiHuni Frontend adalah SPA React + TypeScript yang mengonsumsi SiHuni API. Sebelum release, diperlukan blackbox testing manual menyeluruh untuk memvalidasi bahwa:

- Semua halaman dapat diakses dan render dengan benar
- Semua form melakukan validasi input di sisi client
- Semua interaksi user (CRUD, filter, navigasi) berfungsi sesuai ekspektasi
- RBAC diterapkan dengan benar di UI (menu, tombol, redirect)
- State changes dari API tercermin langsung di UI tanpa reload manual
- Error states dan loading states ditampilkan dengan baik

---

## 2. Tujuan

1. **Functional correctness** — setiap fitur bekerja sesuai requirement
2. **UI validation** — form validation, error messages, dan feedback user
3. **Navigation & routing** — redirect, protected routes, 404/401/403
4. **RBAC enforcement** — akses menu dan halaman sesuai role
5. **State consistency** — data di UI sync dengan database setelah mutasi
6. **Edge cases** — empty states, loading states, error states

---

## 3. Best Practices Blackbox Testing yang Diterapkan

### 3.1 Equivalence Partitioning
Setiap input field diuji dengan:
- **Valid partition**: nilai yang diterima sistem
- **Invalid partition**: nilai yang ditolak sistem (kosong, terlalu pendek, format salah)
- **Boundary values**: nilai di batas minimum/maksimum

### 3.2 Decision Table Testing
Setiap kombinasi kondisi diuji:
- Login valid + role operator → dashboard operator
- Login valid + role manager → dashboard manager (tanpa menu operator)
- Login valid + role viewer → dashboard viewer (read-only)

### 3.3 State Transition Testing
Setiap state machine diuji:
- Room: available → dp_confirmation → occupied → available
- Payment: unpaid → paid / overdue
- Maintenance: reported → in_progress → completed
- Confirmation: pending → confirmed / expired

### 3.4 Error Guessing
Test case khusus untuk skenario yang sering gagal:
- Submit form dua kali cepat (double submit)
- Navigasi back/forward browser setelah mutasi
- Refresh halaman saat data sedang loading
- Token expired saat sedang mengisi form
- Input dengan karakter spesial, emoji, XSS attempt

### 3.5 Boundary Value Analysis
- Nama properti: 1 karakter (valid) vs kosong (invalid)
- Harga sewa: 1 (valid) vs 0 (invalid)
- Durasi sewa: 1 bulan (valid) vs 0 (invalid)
- Nominal DP: tepat 10% (valid) vs 9.9% (invalid)

---

## 4. Scope

### Halaman & Fitur yang Diuji

| Halaman | Route | Role | Fitur |
|---------|-------|------|-------|
| Login | `/login` | public | Form login, validasi, redirect |
| Reset Password | `/reset-password` | public | Form reset, email validasi |
| Update Password | `/update-password` | public | Form update password |
| Dashboard | `/dashboard` | all | Statistik, card summary |
| Properties | `/dashboard/properties` | operator | List, create, edit, delete |
| Property Detail | `/dashboard/properties/:id` | operator | Detail, room list |
| Rooms | `/dashboard/rooms` | operator | List, filter, create, edit, delete |
| Room Detail | `/dashboard/rooms/:id` | operator | Detail, tenant, payment, maintenance |
| Tenants | `/dashboard/tenants` | operator | List, filter, create, checkout |
| Tenant Detail | `/dashboard/tenants/:id` | operator | Detail, payment history, checkout |
| Payments | `/dashboard/payments` | operator | List, filter, create, update status |
| Payment Detail | `/dashboard/payments/:id` | operator | Detail, update status |
| Confirmations | `/dashboard/confirmations` | operator | List, create DP, confirm DP |
| Maintenance | `/dashboard/maintenance` | operator, manager | List, create, update status |
| Maintenance Detail | `/dashboard/maintenance/:id` | operator, manager | Detail, update |
| Audit Trail | `/dashboard/audit` | operator, manager | Log status kamar |
| Notifications | `/dashboard/notifications` | all | List, mark as read |
| Profile | `/dashboard/profile` | all | Edit profil, ganti password |
| Settings | `/dashboard/settings` | operator | WA config |
| 404 | `*` | public | Halaman tidak ditemukan |
| Unauthorized | `/unauthorized` | public | Halaman 403 |

### Out of Scope
- WhatsApp QR scan & session management (dependensi eksternal)
- Viewer request flow
- Email delivery (reset password)
- Performance / responsiveness / aksesibilitas
- Browser compatibility (fokus Chrome)

---

## 5. User Stories

**US-FE-01**: Sebagai tester, saya ingin memverifikasi semua halaman render tanpa error console agar saya yakin tidak ada broken component.

**US-FE-02**: Sebagai tester, saya ingin memverifikasi semua form menampilkan pesan error yang sesuai agar user mendapat feedback yang jelas.

**US-FE-03**: Sebagai tester, saya ingin memverifikasi RBAC di UI agar user tidak melihat fitur yang bukan haknya.

**US-FE-04**: Sebagai tester, saya ingin memverifikasi state UI sync setelah setiap mutasi agar data yang ditampilkan selalu akurat.

**US-FE-05**: Sebagai tester, saya ingin memverifikasi semua edge case (empty state, error API, loading) agar UX tetap baik di kondisi tidak normal.

---

## 6. Acceptance Criteria

1. **SHALL** semua halaman render tanpa error di browser console
2. **SHALL** semua form menampilkan validasi error sebelum submit ke server
3. **SHALL** user yang belum login diredirect ke `/login`
4. **SHALL** user dengan role salah diredirect ke `/unauthorized`
5. **SHALL** setelah CRUD berhasil, data di list ter-refresh otomatis
6. **SHALL** loading state ditampilkan saat menunggu API response
7. **SHALL** error dari API ditampilkan sebagai toast/alert yang informatif
8. **SHALL** empty state ditampilkan saat tidak ada data
9. **SHALL** tombol/menu operator tidak muncul untuk role manager/viewer
10. **SHALL** sidebar hanya menampilkan menu sesuai role

---

## 7. Test Environment

- **URL**: `http://localhost:5173` (atau URL dev server)
- **Browser**: Google Chrome (latest)
- **DevTools**: Console tab terbuka untuk monitor errors
- **Network tab**: terbuka untuk verifikasi API calls
- **Test Accounts**:

| Email | Password | Role |
|-------|----------|------|
| `operator@sihuni.dev` | `sihuni123` | operator |
| `manager@sihuni.dev` | `sihuni123` | manager |
| `viewer@sihuni.dev` | `sihuni123` | viewer |

---

## 8. Test Categories

### 8.1 Authentication & Public Pages
- Login form validasi (email format, password kosong)
- Login valid → redirect ke /dashboard
- Login invalid → error message tampil
- Akses /dashboard tanpa login → redirect ke /login
- Logout → token dihapus, redirect ke /login
- Token expired → auto logout + redirect

### 8.2 RBAC & Navigation
- Operator: semua menu sidebar visible
- Manager: hanya Dashboard, Maintenance, Audit visible
- Viewer: hanya Dashboard visible
- Direct URL access ke halaman yang tidak sesuai role → /unauthorized
- Sidebar badge notifikasi unread count

### 8.3 Dashboard
- Semua card statistik tampil dengan data
- Angka statistik sesuai dengan data sebenarnya
- Loading skeleton saat fetch

### 8.4 Property Management
- List dengan paginasi
- Create form: validasi required fields
- Create berhasil → muncul di list
- Edit: form pre-filled dengan data existing
- Delete properti dengan kamar → error message
- Delete properti kosong → hilang dari list

### 8.5 Room Management
- List dengan filter property, status, search
- Create form: semua validasi field
- Status badge sesuai (available/dp_confirmation/occupied)
- Edit room
- Delete room occupied → error message
- Room detail: tampilkan tenant aktif, payment, maintenance

### 8.6 Tenant Management
- List dengan filter status (active/checked_out)
- Create tenant: form validasi + room harus available
- Tenant detail: informasi lengkap
- Checkout: konfirmasi dialog muncul
- Checkout dengan tunggakan → error message

### 8.7 Payment Management
- List dengan filter room/tenant/periode
- Create payment
- Update status → paid (dengan upload bukti)
- Update status → cancelled
- Payment detail: tampilkan semua info

### 8.8 Confirmation (DP)
- List confirmations dengan status badge
- Create DP: validasi nominal min 10% harga sewa
- Create DP pada room occupied → error
- Confirm DP: dialog konfirmasi + berhasil → tenant terbuat
- Expired DP: tidak bisa dikonfirmasi

### 8.9 Maintenance
- List dengan filter status
- Create laporan maintenance
- Detail maintenance: tampilkan semua info
- Update status: reported → in_progress → completed
- Update dengan biaya dan tindakan

### 8.10 Notifications
- Dropdown notifikasi di header: unread count badge
- Mark as read: badge count berkurang
- Halaman history notifikasi: list semua
- Mark all as read

### 8.11 Profile & Settings
- Profile: tampilkan data user
- Edit nama
- Ganti password: validasi min length
- Settings: WA config (operator only)

### 8.12 Error & Edge Cases
- Empty state: tampil ilustrasi/pesan saat data kosong
- Loading state: skeleton/spinner tampil saat fetch
- API error: toast error informatif
- 404: halaman tidak ditemukan
- Form double submit: tombol disabled saat loading
- Refresh halaman: data tetap tampil (React Query cache / refetch)

---

## 9. Deliverables

- [ ] `tasks.md` — task list terstruktur per halaman (checklist format)
- [ ] Evidence screenshot per test case yang fail
- [ ] QA report: pass/fail summary per domain
- [ ] Bug list dengan severity (P0/P1/P2/P3)

---

## 10. Bug Severity Levels

| Level | Deskripsi | Contoh |
|-------|-----------|--------|
| P0 | Blocker — tidak bisa lanjut | Login gagal, dashboard blank |
| P1 | Critical — fitur utama rusak | Create tenant error, payment tidak tersimpan |
| P2 | Major — fitur penting tidak optimal | Filter tidak bekerja, pagination salah |
| P3 | Minor — kosmetik / UX kecil | Typo, icon salah, warna tidak sesuai |

---

## 11. Dependencies

- Backend SiHuni API running (`make dev` di backend)
- Database ter-migrate dengan seed data
- Frontend dev server running (`pnpm dev`)
- Seed accounts tersedia
