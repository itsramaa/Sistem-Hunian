# SiHuni Frontend — Full Route Testing Report

**Date:** 2026-06-22  
**Tester:** Playwright 1.44.0 (Chromium 125, headless)  
**Environment:** Production — https://sihuni-frontend.vercel.app  
**Viewport:** 375×812 (iPhone X)  
**Routes Tested:** 18/18

---

## Summary

| Category | Result |
|---|---|
| Total Routes | 18 |
| ✅ Pass (0 errors) | 17 |
| ⚠️ Expected Error | 1 (404 page intentionally logs) |
| ❌ Blocking Bug | 0 |
| Auth Guard | ✅ All protected routes redirect to `/login` |
| Legacy Redirect | ✅ `/merchant` → `/login` (via `/dashboard` redirect chain) |
| 404 Page | ✅ Custom 404 renders |
| Backend API | ✅ Railway live & responding |

---

## Route Test Results

### Public Routes

| # | Route | Final URL | Title | Console Errors | Status |
|---|---|---|---|---|---|
| 1 | `/` | `/login` | Masuk | Sistem Hunian | 0 | ✅ Redirects to login |
| 2 | `/login` | `/login` | Masuk | Sistem Hunian | 0 | ✅ Renders |
| 3 | `/reset-password` | `/reset-password` | Sistem Hunian | 0 | ✅ Renders |
| 4 | `/update-password` | `/update-password` | Sistem Hunian | 0 | ✅ Renders |
| 5 | `/unauthorized` | `/unauthorized` | Sistem Hunian | 0 | ✅ Renders |

### Protected Routes (Auth Guard → redirect to /login)

| # | Route | Final URL | Console Errors | Status |
|---|---|---|---|---|
| 6 | `/dashboard` | `/login` | 0 | ✅ Auth guard works |
| 7 | `/dashboard/properties` | `/login` | 0 | ✅ Auth guard works |
| 8 | `/dashboard/rooms` | `/login` | 0 | ✅ Auth guard works |
| 9 | `/dashboard/tenants` | `/login` | 0 | ✅ Auth guard works |
| 10 | `/dashboard/payments` | `/login` | 0 | ✅ Auth guard works |
| 11 | `/dashboard/confirmations` | `/login` | 0 | ✅ Auth guard works |
| 12 | `/dashboard/maintenance` | `/login` | 0 | ✅ Auth guard works |
| 13 | `/dashboard/audit` | `/login` | 0 | ✅ Auth guard works |
| 14 | `/dashboard/notifications` | `/login` | 0 | ✅ Auth guard works |
| 15 | `/dashboard/profile` | `/login` | 0 | ✅ Auth guard works |
| 16 | `/dashboard/settings` | `/login` | 0 | ✅ Auth guard works |

### Legacy & Error Routes

| # | Route | Final URL | Console Errors | Status |
|---|---|---|---|---|
| 17 | `/merchant` | `/login` | 0 | ✅ Legacy redirect chain works |
| 18 | `/does-not-exist` | `/does-not-exist` | 1 (intentional) | ✅ 404 page renders correctly |

> **Note on `/does-not-exist`:** The single console error `"404 Error: User attempted to access non-existent route"` is **intentional** — logged by `NotFoundPage` component for debugging purposes. Not a bug.

---

## Screenshots

All screenshots saved in this directory:

| File | Route | Description |
|---|---|---|
| `09-home.png` | `/` | Home → login redirect |
| `10-login.png` | `/login` | Login page mobile |
| `11-reset-password.png` | `/reset-password` | Password reset form |
| `12-update-password.png` | `/update-password` | Password update form |
| `13-unauthorized.png` | `/unauthorized` | Unauthorized access page |
| `14-dashboard.png` | `/dashboard` | Dashboard → login redirect |
| `15-properties.png` | `/dashboard/properties` | Properties → login redirect |
| `16-rooms.png` | `/dashboard/rooms` | Rooms → login redirect |
| `17-tenants.png` | `/dashboard/tenants` | Tenants → login redirect |
| `18-payments.png` | `/dashboard/payments` | Payments → login redirect |
| `19-confirmations.png` | `/dashboard/confirmations` | Confirmations → login redirect |
| `20-maintenance.png` | `/dashboard/maintenance` | Maintenance → login redirect |
| `21-audit.png` | `/dashboard/audit` | Audit → login redirect |
| `22-notifications.png` | `/dashboard/notifications` | Notifications → login redirect |
| `23-profile.png` | `/dashboard/profile` | Profile → login redirect |
| `24-settings.png` | `/dashboard/settings` | Settings → login redirect |
| `25-merchant-redirect.png` | `/merchant` | Legacy redirect |
| `26-404.png` | `/does-not-exist` | Custom 404 page |

---

## Issues Found

| ID | Severity | Description | Status |
|---|---|---|---|
| None | — | No blocking bugs found across all 18 routes | — |

---

## Notes

- Protected routes cannot be tested with data without valid JWT credentials
- All 12 `/dashboard/*` routes correctly redirect to login when unauthenticated
- Auth guard behavior is consistent across all protected routes
- The 404 error log is by design (see `NotFoundPage.tsx` `console.error`)

---

## Raw Data

Full JSON results: [route-results.json](./route-results.json)
