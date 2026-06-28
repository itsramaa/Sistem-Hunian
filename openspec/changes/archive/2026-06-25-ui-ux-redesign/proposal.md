# Proposal: UI/UX Redesign — SiHuni Frontend

**Change ID**: ui-ux-redesign  
**Tanggal**: 2026-06-24  
**Author**: UI/UX Team  
**Status**: Draft  
**Scope**: Enhancement & polish — color palette dan struktur TIDAK berubah

---

## 1. Latar Belakang

SiHuni adalah SaaS manajemen kos multi-properti. UI saat ini fungsional namun memiliki beberapa inkonsistensi visual, kurangnya hierarchy yang jelas, spacing yang tidak konsisten, dan beberapa pola interaksi yang bisa ditingkatkan. Redesign ini bertujuan untuk **memperhalus** tampilan yang sudah ada — bukan mengganti — sambil menerapkan best practices UI/UX untuk dashboard admin panel.

---

## 2. Prinsip Redesign

### Apa yang DIPERTAHANKAN

- Color palette: Cokelat gelap `#8B6F47`, krem `#FFF8E7`, kuning keemasan `#F4D03F`
- Font: Inter (body) + Plus Jakarta Sans (display/heading)
- CSS variables di `index.css` — tidak ada perubahan token
- **Sidebar, header, mobile nav, mobile header** — tidak disentuh sama sekali
- Komponen Shadcn UI yang sudah ada
- RBAC dan routing logic

### Apa yang DITINGKATKAN

1. **Visual hierarchy** — heading size, weight, dan spacing yang konsisten
2. **Component consistency** — badge, button, card, table pakai pola yang sama di semua halaman
3. **Data density** — tabel lebih readable, filter bar lebih compact
4. **Empty states** — illustrasi dan pesan yang informatif
5. **Loading states** — skeleton yang proporsional dan konsisten
6. **Micro-interactions** — hover, focus, transition yang halus (150–300ms)
7. **Status indicators** — badge color semantic yang konsisten
8. **Form UX** — label, placeholder, error message yang jelas
9. **Page headers** — reuse `PageHeader.tsx` yang sudah ada di semua halaman

### Prinsip Code Quality (diterapkan bersamaan dengan redesign)

#### SOC — Separation of Concerns

- `pages/` hanya orchestrate — tidak ada business logic atau fetch langsung
- `components/` hanya UI — tidak ada API call
- `hooks/` hanya data fetching — return data + mutation, tidak ada JSX
- `api/` hanya HTTP functions — pure functions, no React

#### KISS — Keep It Simple, Stupid

- Tidak ada abstraksi prematur untuk komponen yang hanya dipakai sekali
- Tidak ada wrapper yang hanya meneruskan props tanpa transformasi
- Gunakan komponen shared yang sudah ada sebelum buat baru

#### DRY — Don't Repeat Yourself

- Semua status badge → `statusColors.ts` + `Badge` component (sudah ada)
- Semua currency format → `currency.ts` (sudah ada)
- Semua date format → `dateUtils.ts` (sudah ada)
- Semua error handling → `getApiErrorMessage` dari `api-errors.ts` (sudah ada)
- Semua empty state → `EmptyState.tsx` (sudah ada)
- Semua page header → `PageHeader.tsx` (sudah ada)

#### File & Folder Naming (best practice)

- **Pages**: `PascalCase.tsx` — e.g. `Properties.tsx`, `RoomDetail.tsx`
- **Components**: `PascalCase.tsx` — e.g. `PropertyForm.tsx`, `ConfirmDpForm.tsx`
- **Hooks**: `camelCase.ts` prefixed `use` — e.g. `useProperties.ts`
- **API services**: `camelCase.ts` suffixed `Service` — e.g. `propertyService.ts`
- **Types**: `index.ts` atau `types.ts` di folder `types/`
- **Utils**: `camelCase.ts` — e.g. `currency.ts`, `dateUtils.ts`
- **Shared UI primitives**: `kebab-case.tsx` — e.g. `alert-dialog.tsx` (Shadcn convention)
- **Custom shared components**: `PascalCase.tsx` — e.g. `PageHeader.tsx`, `EmptyState.tsx`

---

## 3. Design System Reference

Berdasarkan analisis ui-ux-pro-max untuk "property management kos dashboard SaaS admin panel professional":

### Pattern

**Data-Dense + Drill-Down** — KPI cards di atas, tabel data di bawah, halaman detail via klik row.

### Style

**Data-Dense Dashboard** — Multiple KPI widgets, data tables, minimal padding, grid layout, space-efficient, maximum data visibility.

### Typography Scale (existing fonts dipertahankan)

| Level         | Font              | Size             | Weight | Use                  |
| ------------- | ----------------- | ---------------- | ------ | -------------------- |
| Page Title    | Plus Jakarta Sans | 24px / 1.5rem    | 700    | H1 tiap halaman      |
| Section Title | Plus Jakarta Sans | 18px / 1.125rem  | 600    | Sub-section header   |
| Card Title    | Plus Jakarta Sans | 14px / 0.875rem  | 600    | KPI card label       |
| Body          | Inter             | 14px / 0.875rem  | 400    | Paragraf, tabel cell |
| Body Small    | Inter             | 12px / 0.75rem   | 400    | Meta info, timestamp |
| Label         | Inter             | 12px / 0.75rem   | 500    | Form label           |
| Badge         | Inter             | 11px / 0.6875rem | 600    | Status badge         |

### Spacing System (8px base)

| Token | Value | Use                       |
| ----- | ----- | ------------------------- |
| xs    | 4px   | Icon gap, badge padding   |
| sm    | 8px   | Input padding, tight gap  |
| md    | 16px  | Card padding, section gap |
| lg    | 24px  | Page section gap          |
| xl    | 32px  | Page top padding          |
| 2xl   | 48px  | Major section separation  |

### Status Badge Semantic Colors

| Status          | Color Token | Use                  |
| --------------- | ----------- | -------------------- |
| available       | success     | Kamar tersedia       |
| occupied        | destructive | Kamar terisi         |
| dp_confirmation | warning     | Kamar DP pending     |
| active          | success     | Tenant aktif         |
| checked_out     | muted       | Tenant keluar        |
| paid            | success     | Pembayaran lunas     |
| unpaid          | warning     | Belum bayar          |
| overdue         | destructive | Jatuh tempo          |
| reported        | info        | Maintenance baru     |
| in_progress     | warning     | Maintenance diproses |
| completed       | success     | Maintenance selesai  |
| pending         | warning     | DP pending           |
| confirmed       | success     | DP dikonfirmasi      |
| expired         | muted       | DP expired           |

### Component Patterns (Shadcn)

- **Tabel data** → `<Table>` + `<TableHeader>` + `<TableBody>` (bukan div grid)
- **Filter kompleks** → `useReactTable` + TanStack Table
- **Dialog konfirmasi** → `<AlertDialog>` (bukan custom modal)
- **Form** → `<Form>` + react-hook-form + zod validation
- **Notifikasi** → `toast()` dari sonner
- **Loading** → `<Skeleton>` proporsional dengan content
- **Empty state** → Komponen terpusat dengan icon + pesan + CTA

---

## 4. Global Enhancement Rules

Rules yang berlaku di SEMUA halaman:

### 4.1 Page Header Pattern

Setiap halaman HARUS punya header dengan struktur:

```
[Page Title]                    [Primary Action Button]
[Subtitle/breadcrumb optional]
```

### 4.2 Filter Bar Pattern

Filter di atas tabel, layout horizontal, compact:

```
[Search Input] [Filter Dropdown 1] [Filter Dropdown 2] ... [Reset]
```

### 4.3 Table Pattern

- Header row: `font-medium text-muted-foreground text-xs uppercase tracking-wide`
- Data row: `hover:bg-muted/50 transition-colors cursor-pointer`
- Status column: selalu pakai Badge komponen
- Action column: selalu di kanan, pakai DropdownMenu untuk 2+ aksi
- Empty row: colspan full, centered empty state component

### 4.4 Card KPI Pattern

```
[Icon bg-primary/10]  [Label text-muted-foreground text-xs]
                      [Value text-2xl font-bold]
                      [Delta/trend optional text-xs]
```

### 4.5 Form Pattern

- Label selalu di atas input (bukan placeholder-only)
- Error message di bawah input, warna destructive
- Required field ditandai dengan `*` merah
- Submit button: full-width di mobile, right-aligned di desktop
- Loading state: tombol disabled + spinner icon

### 4.6 Empty State Pattern

```
[SVG Illustration atau Icon besar]
[Judul "Belum ada data"]
[Deskripsi singkat]
[CTA Button jika applicable]
```

### 4.7 Micro-interactions

- Semua hover: `transition-colors duration-150`
- Semua clickable card/row: `cursor-pointer`
- Button loading: `disabled` + `<Loader2 className="animate-spin" />`
- Toast success: `toast.success()`
- Toast error: `toast.error()`

---

## 5. Per-Feature Scope

Setiap fitur punya proposal file tersendiri di folder ini:

| File                  | Halaman                                | Route                                                  |
| --------------------- | -------------------------------------- | ------------------------------------------------------ |
| `01-login.md`         | Login, Reset Password, Update Password | `/login`, `/reset-password`, `/update-password`        |
| `02-dashboard.md`     | Dashboard Summary                      | `/dashboard`                                           |
| `03-properties.md`    | Properties List + Detail               | `/dashboard/properties`, `/dashboard/properties/:id`   |
| `04-rooms.md`         | Rooms List + Detail                    | `/dashboard/rooms`, `/dashboard/rooms/:id`             |
| `05-tenants.md`       | Tenants List + Detail                  | `/dashboard/tenants`, `/dashboard/tenants/:id`         |
| `06-payments.md`      | Payments List + Detail                 | `/dashboard/payments`, `/dashboard/payments/:id`       |
| `07-confirmations.md` | Confirmations List                     | `/dashboard/confirmations`                             |
| `08-maintenance.md`   | Maintenance List + Detail              | `/dashboard/maintenance`, `/dashboard/maintenance/:id` |
| `09-audit.md`         | Audit Trail                            | `/dashboard/audit`                                     |
| `10-notifications.md` | Notifications History + Dropdown       | `/dashboard/notifications`                             |
| `11-profile.md`       | Profile + Settings                     | `/dashboard/profile`, `/dashboard/settings`            |
| `12-sidebar.md`       | Sidebar & Layout                       | Global                                                 |
| `13-shared.md`        | Shared Components                      | Global                                                 |

---

## 6. Acceptance Criteria Global

1. **SHALL** color palette tidak berubah (CSS variables tetap sama)
2. **SHALL** font family tidak berubah (Inter + Plus Jakarta Sans)
3. **SHALL** semua halaman menggunakan page header pattern yang konsisten
4. **SHALL** semua status menggunakan badge semantic color yang sama
5. **SHALL** semua tabel menggunakan shadcn Table component
6. **SHALL** semua form menggunakan react-hook-form + zod
7. **SHALL** semua empty state menggunakan komponen terpusat
8. **SHALL** semua loading state menggunakan Skeleton proporsional
9. **SHALL** tidak ada console error setelah redesign
10. **SHALL** tidak ada regresi fungsional (RBAC, routing, API calls tetap sama)

---

## 7. Out of Scope

- Perubahan warna/token CSS
- Perubahan font family
- Perubahan struktur routing
- Penambahan fitur baru
- Perubahan API integration
- Dark mode enhancement (bisa dilakukan terpisah)
- Mobile responsiveness overhaul (bisa dilakukan terpisah)

---

## 8. Dependencies

- Semua komponen Shadcn UI yang sudah terinstall
- `sonner` untuk toast
- `react-hook-form` + `zod` untuk form validation
- `@tanstack/react-query` untuk data fetching (sudah ada)
- Lucide React untuk icons (sudah ada)
