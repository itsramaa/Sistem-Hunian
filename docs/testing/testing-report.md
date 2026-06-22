# SiHuni Frontend — Browser Testing Report

**Date:** 2026-06-22  
**Tester:** Antigravity (Automated Playwright)  
**Environment:** Production — https://sihuni-frontend.vercel.app  
**Viewport tested:** 375×812 (iPhone X) + 1440×900 (Desktop)

---

## Summary

| Category | Result |
|---|---|
| Build | ✅ Zero errors |
| Auth Guard | ✅ Redirects unauthenticated users to /login |
| Login Page | ✅ Renders correctly |
| Backend Connectivity | ✅ Railway API responding (401 = credentials rejected, not down) |
| Light Mode | ✅ Text readable, no invisible elements |
| Dark Mode | ✅ Text readable, contrast OK |
| 404 Page | ✅ Custom 404 renders, logs intentional error |
| Reset Password | ✅ Page accessible, 0 console errors |
| Console Errors (blocking) | ✅ None found |

---

## Test Cases

### TC-001: Login Page — Mobile 375×812
- **URL:** `/login`
- **Result:** ✅ PASS
- **Notes:** Logo SiHuni visible, "Masuk" heading, email/password inputs, submit button all rendered correctly
- **Screenshot:** [01-login-filled.png](./01-login-filled.png)

### TC-002: Login Error Handling
- **Action:** Submit with invalid credentials `operator@sihuni.com` / `password123`
- **Result:** ✅ PASS
- **Notes:** Backend returned `401`, toast appeared and dismissed, page stayed on `/login` — correct behavior
- **Console error:** `Failed to load resource: 401 @ /api/v1/auth/login` (expected)
- **Screenshot:** [02-login-error-state.png](./02-login-error-state.png)

### TC-003: Auth Guard — Protected Routes
- **Action:** Navigate directly to `/dashboard` without auth
- **Result:** ✅ PASS
- **Notes:** Immediately redirected to `/login` — auth guard working
- **Screenshot:** [03-auth-guard-redirect.png](./03-auth-guard-redirect.png)

### TC-004: Light Mode — Login Page
- **Action:** Force `classList.remove('dark')` + `colorScheme: light`
- **Result:** ✅ PASS
- **Notes:** Background cream (#FFF8E7), text foreground dark brown — readable. No invisible text found.
- **Screenshot:** [04-login-light-mode.png](./04-login-light-mode.png)

### TC-005: Dark Mode — Login Page
- **Action:** Force `classList.add('dark')`
- **Result:** ✅ PASS
- **Notes:** Dark brown background, cream foreground — readable. Gradient orbs visible.
- **Screenshot:** [05-login-dark-mode.png](./05-login-dark-mode.png)

### TC-006: Desktop Viewport — Login Page (1440×900)
- **Action:** Resize to 1440×900 dark mode
- **Result:** ✅ PASS
- **Notes:** Two-column layout rendered — brand panel on left, form on right. Correct lg:grid-cols-2 behavior.
- **Screenshot:** [06-login-desktop-dark.png](./06-login-desktop-dark.png)

### TC-007: Reset Password Page
- **URL:** `/reset-password`
- **Result:** ✅ PASS
- **Notes:** Page accessible, 0 console errors
- **Screenshot:** [07-reset-password-desktop.png](./07-reset-password-desktop.png)

### TC-008: 404 Page
- **URL:** `/halaman-tidak-ada`
- **Result:** ✅ PASS
- **Notes:** Custom 404 page renders with h1="404" and "Uups! Halaman tidak ditemukan" message + back button. Console logs intentional 404 error.
- **Screenshot:** [08-404-page.png](./08-404-page.png)

---

## Issues Found

| ID | Severity | Description | Status |
|---|---|---|---|
| None | — | No blocking bugs found in production | — |

> **Note:** The `401` on login attempt is **expected behavior** — test credentials don't exist in the database. The Railway backend is live and responding correctly.

---

## Backend Connectivity

| Endpoint | Status |
|---|---|
| `POST /api/v1/auth/login` | ✅ Reachable (returned 401 for invalid creds) |
| Railway URL | `https://api-production-b4c5.up.railway.app` |

---

## Screenshots Index

| File | Description |
|---|---|
| [01-login-filled.png](./01-login-filled.png) | Login page mobile — form filled |
| [02-login-error-state.png](./02-login-error-state.png) | Login page — after 401 error |
| [03-auth-guard-redirect.png](./03-auth-guard-redirect.png) | Auth guard — redirect from /dashboard |
| [04-login-light-mode.png](./04-login-light-mode.png) | Login page — light mode |
| [05-login-dark-mode.png](./05-login-dark-mode.png) | Login page — dark mode |
| [06-login-desktop-dark.png](./06-login-desktop-dark.png) | Login page — desktop 1440×900 dark |
| [07-reset-password-desktop.png](./07-reset-password-desktop.png) | Reset password page — desktop |
| [08-404-page.png](./08-404-page.png) | 404 not found page |
