# Testing Report — Sistem Hunian V2

**Tanggal:** 26 Juni 2026  
**Status:** ✅ PASS — 460/460 tests  
**Coverage:** 84% Statements | 69.93% Branches | 91.56% Functions | 85.02% Lines  
**Alignment:** ✅ Aligned dengan Black Box Testing 4.4.1 & Activity Diagram 4.2.3  
**Backend Cross-check:** ✅ Validated terhadap Sistem-Hunian-Go handlers

---

## Ringkasan Eksekusi

| Metric              | Nilai            |
| ------------------- | ---------------- |
| Total Test Files    | 37               |
| Total Tests         | 460              |
| Tests Passed        | 460 (100%)       |
| Tests Failed        | 0                |
| Duration            | ~14–16 detik     |
| Coverage Statements | 84% (604/719)    |
| Coverage Branches   | 69.93% (321/459) |
| Coverage Functions  | 91.56% (217/237) |
| Coverage Lines      | 85.02% (568/668) |

---

## Infrastruktur Testing

### Stack

| Tool                        | Versi   | Peran                            |
| --------------------------- | ------- | -------------------------------- |
| Vitest                      | ^4.1.9  | Test runner (unit & integration) |
| @testing-library/react      | latest  | Component testing                |
| @testing-library/jest-dom   | latest  | DOM assertions                   |
| @testing-library/user-event | latest  | User interaction simulation      |
| MSW (Mock Service Worker)   | latest  | API mocking                      |
| @faker-js/faker             | latest  | Test data generation             |
| @playwright/test            | ^1.61.0 | E2E testing                      |

### File Setup

```
src/test/
├── setup.ts                 # Global test setup (MSW lifecycle, browser API mocks)
├── test-utils.tsx           # React Query wrapper, auth helpers
└── mocks/
    ├── server.ts            # MSW Node server
    ├── handlers.ts          # MSW request handlers (semua API endpoint)
    └── fixtures.ts          # Reusable test data (auth, properties, rooms, dst)
```

### Konfigurasi Vitest

```
vitest.config.ts
├── environment: jsdom
├── setupFiles: src/test/setup.ts
├── coverage provider: v8
├── coverage thresholds: statements 70%, functions 70%, branches 65%, lines 70%
└── define: VITE_API_BASE_URL=http://localhost:3000/api/v1
```

---

## Unit Tests — Shared Utils & Hooks

**File:** `src/shared/utils/__tests__/`, `src/shared/hooks/__tests__/`

| File                    | Tests                                                                                                                                                                                                                          | Coverage |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------- |
| utils.test.ts           | cn(), formatRupiah(), formatYear(), formatLabel()                                                                                                                                                                              | 100%     |
| currency.test.ts        | formatCurrency(), formatCurrencyCompact(), parseCurrency()                                                                                                                                                                     | 100%     |
| dateUtils.test.ts       | formatDisplayDate(), formatISODate(), getDaysDifference(), isDueSoon(), isOverdue(), getDaysUntilDue(), getMonthDateRange(), getLastNDaysRange(), getNextNDaysRange(), getCurrentMonthDateRange(), getPreviousMonthDateRange() | 92.3%    |
| statusColors.test.ts    | getPriorityColor(), getJobStatusColor(), getOrderStatusColor(), getPaymentStatusColor(), getVerificationStatusColor()                                                                                                          | 61.4%    |
| breadcrumbUtils.test.ts | generateBreadcrumbs(), getRoleDashboardLabel()                                                                                                                                                                                 | 100%     |
| api-errors.test.ts      | getApiErrorMessage() — 13 HTTP codes + backend codes + network errors                                                                                                                                                          | 55.5%    |
| validations.test.ts     | isCommonPassword(), strongPasswordSchema, loginPasswordSchema, phoneSchema, businessNameSchema, merchantCodeSchema, referralCodeSchema                                                                                         | 45.6%    |
| haptic.test.ts          | triggerHaptic() — semua tipe, dengan/tanpa navigator.vibrate                                                                                                                                                                   | 100%     |
| useDebounce.test.ts     | delay behavior, value update, cleanup, reset timer, tipe number/object                                                                                                                                                         | 100%     |

**Total tests di layer ini: ~90 tests**

---

## Unit Tests — Feature API Services

**File:** `src/features/*/api/__tests__/`

| Feature              | API Functions                                                                                   | Test Cases                                         |
| -------------------- | ----------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| **authApi**          | login(), getMe(), updateMe(), changePassword()                                                  | Happy path + 401/400/500 errors                    |
| **propertyApi**      | list(), getById(), create(), update(), remove()                                                 | Pagination, search params, 404/400 errors          |
| **roomApi**          | list(), getById(), create(), update(), remove()                                                 | Filter params, 404/409/400 errors                  |
| **tenantApi**        | list(), getById(), create(), update(), checkout()                                               | Status filter, 404/400 errors                      |
| **paymentApi**       | list(), getById(), create(), markPaid(), uploadBukti(), update()                                | Period/status filter, 404/409/413 errors           |
| **maintenanceApi**   | list(), getById(), create(), update(), uploadFotoKerusakan(), uploadFotoPenanganan(), getLogs() | Status/property filter, upload, 404/400/500 errors |
| **confirmationApi**  | list(), create(), confirmDP(), expire(), updateDeadline()                                       | Status filter, 404/400/409 errors                  |
| **dashboardApi**     | getSummary(), getAlerts(), getNotifications(), markRead(), markAllRead(), clearRead()           | is_read filter, 401/404/500 errors                 |
| **auditApi**         | getAuditRoomStatus(), exportAuditCsv(), getUsersList()                                          | Date range filter, CSV blob, 401/500 errors        |
| **settingsApi**      | getUsers(), createUser(), deleteUser(), updateUser(), getWaConfig(), saveWaConfig()             | CRUD users, WA config, 404/409 errors              |
| **viewerRequestApi** | create(), list()                                                                                | Page param, 409/400/401 errors                     |

**Total tests di layer ini: ~100 tests**

---

## Integration Tests — React Query Hooks

**File:** `src/features/*/hooks/__tests__/`

| Hook File                    | Hooks Tested                                                                                                                                         | Test Scenarios                                       |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| **useProperties.test.ts**    | useProperties, usePropertyById, useCreateProperty, useUpdateProperty, useDeleteProperty                                                              | loading, success, error, filter params, undefined id |
| **usePayments.test.ts**      | usePayments, usePaymentById, useCreatePayment, useMarkPaid, useUploadBukti, useUpdatePayment                                                         | status/period filter, mutation success/error         |
| **useTenants.test.ts**       | useTenants, useTenantById, useActiveTenants, useTenantHistory, useCreateTenant, useUpdateTenant, useCheckoutTenant                                   | status filter, active/history tabs, checkout         |
| **useMaintenance.test.ts**   | useMaintenances, useMaintenanceById, useCreateMaintenance, useUpdateMaintenance, useUploadFotoKerusakan, useUploadFotoPenanganan, useMaintenanceLogs | status/property filter, photo upload, logs           |
| **useRooms.test.ts**         | useRooms, useRoomById, useCreateRoom, useUpdateRoom, useDeleteRoom                                                                                   | property/status filter, CRUD mutations               |
| **useConfirmations.test.ts** | useConfirmations, useCreateConfirmation, useExpireConfirmation, useConfirmDP, useUpdateDeadline                                                      | status filter, DP workflow                           |
| **useDashboard.test.ts**     | useDashboardSummary, useDashboardAlerts, useNotifications, useMarkNotificationRead, useMarkAllNotificationsRead, useClearReadNotifications           | is_read filter, mutation                             |
| **useAudit.test.ts**         | useAuditRoomStatus, useAuditUsersList                                                                                                                | filter params, re-fetch on change                    |

**Total tests di layer ini: ~100 tests**

---

## Component Tests — Testing Library

**File:** `src/features/*/components/__tests__/`, `src/shared/components/ui/__tests__/`

| Component                                 | Test Cases                                                                                                                           |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| **AuthForm.test.tsx**                     | render fields, validasi kosong, isi email/password, submit valid, error response                                                     |
| **ProtectedRoute.test.tsx**               | loading skeleton, redirect unauthenticated, access authorized, RBAC redirect, account disabled                                       |
| **EmptyState.test.tsx**                   | title, description, icon, action button, onClick                                                                                     |
| **PageHeader.test.tsx**                   | title, description, icon, children (action buttons), h1                                                                              |
| **StatCard.test.tsx**                     | loading skeleton, numeric value, string value, subtitle, icon                                                                        |
| **TablePagination.test.tsx**              | hide saat ≤1 page, prev/next buttons, disable di halaman pertama/terakhir, onPageChange calls, showing X to Y info, custom itemLabel |
| **DashboardCards (SummaryCard).test.tsx** | label, value, skeleton loading, icon, onClick, cursor-pointer, ring accent                                                           |
| **ThemeToggle.test.tsx**                  | render button toggle                                                                                                                 |

**Total tests di layer ini: ~55 tests**

---

## E2E Tests — Playwright

**File:** `e2e/` (14 spec files + 1 comprehensive flow file)

### Existing E2E Specs (01–13)

| File                     | Fitur              | Test Cases                                                          |
| ------------------------ | ------------------ | ------------------------------------------------------------------- |
| 01-auth.spec.ts          | Auth & Route Guard | Login semua role, password salah, form kosong, redirect tanpa token |
| 02-dashboard.spec.ts     | Dashboard          | Summary cards, dark/light mode, mobile responsive                   |
| 03-rbac.spec.ts          | RBAC               | Manager/Operator/Viewer access control                              |
| 04-properties.spec.ts    | Properties         | List, form, detail, delete                                          |
| 05-rooms.spec.ts         | Rooms              | List, badges, filter                                                |
| 06-tenants.spec.ts       | Tenants            | Active/history tab, detail page                                     |
| 07-payments.spec.ts      | Payments           | List, badges, filter, detail                                        |
| 08-confirmations.spec.ts | Confirmations      | List, countdown timer                                               |
| 09-maintenance.spec.ts   | Maintenance        | List, filter, detail                                                |
| 10-notifications.spec.ts | Notifications      | Bell, history page                                                  |
| 11-profile-audit.spec.ts | Profile & Audit    | Profile page, audit trail                                           |
| 12-ux-responsive.spec.ts | UX & Responsive    | Dark mode, mobile, empty state                                      |
| 13-performance.spec.ts   | Performance        | CLS, load time                                                      |

### New Comprehensive E2E (14)

**File:** `e2e/14-comprehensive-flows.spec.ts`

| Group                   | Test Cases                                                                    |
| ----------------------- | ----------------------------------------------------------------------------- |
| 01 — Auth Flows         | login operator/viewer, credential salah, form kosong, auth guard semua routes |
| 02 — Dashboard          | summary cards, viewer dashboard, alerts panel                                 |
| 03 — Properties CRUD    | list, form tambah, detail, viewer readonly                                    |
| 04 — Rooms              | list, status badges, filter, detail                                           |
| 05 — Tenants            | list, tab aktif, tab histori, detail                                          |
| 06 — Payments           | list, filter status, badges, detail                                           |
| 07 — Confirmations      | list, countdown timer, filter status                                          |
| 08 — Maintenance        | list, filter, detail, form baru                                               |
| 09 — Notifications      | bell icon, histori notifikasi                                                 |
| 10 — Audit Trail        | list, date filter, export CSV, viewer blocked                                 |
| 11 — Profile & Settings | profil data, form edit, settings WA                                           |
| 12 — RBAC Enforcement   | viewer tidak bisa create rooms/payments, operator full access                 |
| 13 — Responsive & UX    | dark mode, sidebar, 404, loading skeleton                                     |
| 14 — Auth Store         | remember me → localStorage, logout clear token                                |

**Target E2E:** Production URL `https://sihuni-frontend.vercel.app`

---

## Coverage Report Detail

```
File                        | Stmts | Branch | Funcs | Lines
----------------------------|-------|--------|-------|------
audit/api/auditApi.ts       |  90.6 |  78.1  | 100.0 | 100.0
auth/components/AuthForm.tsx|  73.8 |  71.7  |  61.5 |  77.0
auth/components/Protected.. |  88.5 |  76.0  |  75.0 |  88.5
confirmations/api/..Api.ts  | 100.0 |  91.7  | 100.0 | 100.0
dashboard/api/dashboardApi.ts| 100.0 |  66.7  | 100.0 | 100.0
maintenance/api/..Api.ts    | 100.0 |  95.0  | 100.0 | 100.0
payments/api/paymentApi.ts  | 100.0 |  88.9  | 100.0 | 100.0
profile/api/settingsApi.ts  | 100.0 |  66.7  | 100.0 | 100.0
properties/api/propertyApi.ts| 100.0 |  70.0  | 100.0 | 100.0
rooms/api/roomApi.ts        | 100.0 |  90.9  | 100.0 | 100.0
tenant/api/tenantApi.ts     | 100.0 |  91.7  | 100.0 | 100.0
shared/lib/axios.ts         |  95.0 |  85.0  | 100.0 |  95.0
shared/utils/api-errors.ts  |  55.6 |  59.0  |  50.0 |  64.4
shared/utils/dateUtils.ts   |  92.3 |  75.0  |  92.3 |  91.9
shared/utils/statusColors.ts|  61.4 |  48.3  |  41.7 |  61.4
shared/utils/validations/...|  45.7 |  20.0  |  88.9 |  44.4
----------------------------|-------|--------|-------|------
ALL FILES                   |  84.0 |  69.9  |  91.6 |  85.0
```

### Threshold Status

| Threshold  | Target | Actual | Status    |
| ---------- | ------ | ------ | --------- |
| Statements | 70%    | 84.0%  | ✅ +14%   |
| Branches   | 65%    | 69.9%  | ✅ +4.9%  |
| Functions  | 70%    | 91.6%  | ✅ +21.6% |
| Lines      | 70%    | 85.0%  | ✅ +15%   |

---

## Cara Menjalankan Tests

### Unit & Integration Tests (Vitest)

```bash
# Run semua tests sekali
npm test

# Run dengan watch mode (development)
npm run test:watch

# Run dengan coverage report
npm run test:coverage

# Run dengan UI interaktif
npm run test:ui
```

### E2E Tests (Playwright)

```bash
# Run semua E2E tests (headless, target Vercel)
npm run test:e2e

# Run dengan browser visible
npm run test:e2e:headed

# Buka HTML report
npm run test:e2e:report

# Run spec tertentu
npx playwright test e2e/14-comprehensive-flows.spec.ts
```

---

## Struktur File Tests

```
src/
├── test/
│   ├── setup.ts                              # Global setup
│   ├── test-utils.tsx                        # React Query wrapper
│   └── mocks/
│       ├── server.ts                         # MSW server
│       ├── handlers.ts                       # API handlers (semua endpoint)
│       └── fixtures.ts                       # Test data fixtures
│
├── shared/
│   ├── utils/__tests__/
│   │   ├── utils.test.ts
│   │   ├── currency.test.ts
│   │   ├── dateUtils.test.ts
│   │   ├── statusColors.test.ts
│   │   ├── breadcrumbUtils.test.ts
│   │   ├── api-errors.test.ts
│   │   ├── validations.test.ts
│   │   └── haptic.test.ts
│   ├── hooks/__tests__/
│   │   └── useDebounce.test.ts
│   └── components/ui/__tests__/
│       ├── EmptyState.test.tsx
│       ├── PageHeader.test.tsx
│       ├── StatCard.test.tsx
│       ├── TablePagination.test.tsx
│       └── ThemeToggle.test.tsx
│
└── features/
    ├── auth/
    │   ├── api/__tests__/authApi.test.ts
    │   └── components/__tests__/
    │       ├── AuthForm.test.tsx
    │       └── ProtectedRoute.test.tsx
    ├── properties/
    │   ├── api/__tests__/propertyApi.test.ts
    │   └── hooks/__tests__/useProperties.test.ts
    ├── rooms/
    │   ├── api/__tests__/roomApi.test.ts
    │   └── hooks/__tests__/useRooms.test.ts
    ├── tenant/
    │   ├── api/__tests__/tenantApi.test.ts
    │   └── hooks/__tests__/useTenants.test.ts
    ├── payments/
    │   ├── api/__tests__/paymentApi.test.ts
    │   └── hooks/__tests__/usePayments.test.ts
    ├── maintenance/
    │   ├── api/__tests__/maintenanceApi.test.ts
    │   └── hooks/__tests__/useMaintenance.test.ts
    ├── confirmations/
    │   ├── api/__tests__/confirmationApi.test.ts
    │   └── hooks/__tests__/useConfirmations.test.ts
    ├── dashboard/
    │   ├── api/__tests__/dashboardApi.test.ts
    │   ├── hooks/__tests__/useDashboard.test.ts
    │   └── components/__tests__/DashboardCards.test.tsx
    ├── audit/
    │   ├── api/__tests__/auditApi.test.ts
    │   └── hooks/__tests__/useAudit.test.ts
    ├── profile/
    │   └── api/__tests__/settingsApi.test.ts
    └── viewer-requests/
        └── api/__tests__/viewerRequestApi.test.ts

e2e/
├── helpers/auth.ts
├── 01-auth.spec.ts
├── 02-dashboard.spec.ts
├── 03-rbac.spec.ts
├── 04-properties.spec.ts
├── 05-rooms.spec.ts
├── 06-tenants.spec.ts
├── 07-payments.spec.ts
├── 08-confirmations.spec.ts
├── 09-maintenance.spec.ts
├── 10-notifications.spec.ts
├── 11-profile-audit.spec.ts
├── 12-ux-responsive.spec.ts
├── 13-performance.spec.ts
└── 14-comprehensive-flows.spec.ts
```

---

## Fitur yang Dicoverage

| Fitur                                         | Unit API | Integration Hook | Component      | E2E |
| --------------------------------------------- | -------- | ---------------- | -------------- | --- |
| Auth (login/logout/me)                        | ✅       | -                | ✅ AuthForm    | ✅  |
| ProtectedRoute / RBAC                         | -        | -                | ✅             | ✅  |
| Properties CRUD                               | ✅       | ✅               | -              | ✅  |
| Rooms CRUD                                    | ✅       | ✅               | -              | ✅  |
| Tenants (active/history/checkout)             | ✅       | ✅               | -              | ✅  |
| Payments (CRUD/mark-paid/upload)              | ✅       | ✅               | -              | ✅  |
| Maintenance (CRUD/foto/logs)                  | ✅       | ✅               | -              | ✅  |
| Confirmations DP (create/confirm/expire)      | ✅       | ✅               | -              | ✅  |
| Dashboard (summary/alerts)                    | ✅       | ✅               | ✅ SummaryCard | ✅  |
| Notifications (read/clear)                    | ✅       | ✅               | -              | ✅  |
| Audit Trail (filter/export CSV)               | ✅       | ✅               | -              | ✅  |
| Profile & Settings                            | ✅       | -                | -              | ✅  |
| WhatsApp Settings (WA config)                 | ✅       | -                | -              | -   |
| Viewer Requests                               | ✅       | -                | -              | -   |
| Shared Utils (currency/date/status)           | ✅       | -                | -              | -   |
| Shared Components (EmptyState/Pagination/etc) | -        | -                | ✅             | -   |
| Auth Store (remember me/logout)               | -        | -                | -              | ✅  |
| Responsive / UX                               | -        | -                | -              | ✅  |

---

## Notes

### Known Limitations

1. **AuthForm coverage 73%** — beberapa branch terkait loading state dan OTP flow belum dicover karena kompleksitas Radix UI components di jsdom
2. **statusColors.ts 61%** — beberapa status colors yang jarang dipakai (getRoomStatusColor, getContractStatusColor) belum ditest
3. **api-errors.ts 55%** — beberapa backend error codes spesifik (PAYMENT*\*, MAINT*\_, CONF\_\_) belum ditest exhaustively
4. **validations/auth.ts 45%** — fungsi-fungsi schema yang belum ditest: emailSchemaUpdate, addressSchema, descriptionSchema

### Cara Improve Coverage

```bash
# Lihat coverage HTML report
npx vite-coverage-reporter coverage/coverage-final.json

# Atau buka langsung
open coverage/index.html
```

### CI/CD Integration

Untuk CI, tambahkan ke `.github/workflows/test.yml`:

```yaml
- name: Run unit tests
  run: npm test

- name: Run coverage
  run: npm run test:coverage

- name: Run E2E tests
  run: npx playwright install --with-deps && npm run test:e2e
```
