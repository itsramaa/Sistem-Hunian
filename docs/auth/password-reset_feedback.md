# Password Reset - Feedback

## 1. Bugs & Errors

### 🔴 Critical
| ID | Issue | Location | Description |
|----|-------|----------|-------------|
| BUG-PW-001 | No token validation | `UpdatePassword.tsx` | Token dari URL tidak divalidasi sebelum show form |
| BUG-PW-002 | Session check timing | `UpdatePassword.tsx:47-56` | useEffect bisa race condition dengan auth state |

### 🟡 Warning
| ID | Issue | Location | Description |
|----|-------|----------|-------------|
| BUG-PW-003 | Redirect timing | `UpdatePassword.tsx:73-75` | 2 second delay bisa di-bypass dengan navigation |
| BUG-PW-004 | Error state not cleared | `ResetPassword.tsx` | Error message persists after retry |

## 2. Validations

### Current Implementation
```typescript
// ResetPassword.tsx - Line 14-16
const resetSchema = z.object({
  email: z.string().email({ message: 'Masukkan alamat email yang valid' }),
});

// UpdatePassword.tsx - Line 14-21
const updatePasswordSchema = z.object({
  password: z.string().min(6, { message: 'Password minimal 6 karakter' }), // ❌ Too weak
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, { ... });
```

### Missing Validations
| ID | Field | Issue | Recommendation |
|----|-------|-------|----------------|
| VAL-PW-001 | Password | Min 6 chars too weak | Min 8 + complexity rules |
| VAL-PW-002 | Password | No strength meter | Add visual indicator |
| VAL-PW-003 | Email | No rate limit check | Validate against abuse |
| VAL-PW-004 | Password | No common password check | Block weak passwords |
| VAL-PW-005 | Token | No format validation | Validate token format |

### Recommended Password Policy
```typescript
const passwordSchema = z.string()
  .min(8, 'Minimal 8 karakter')
  .regex(/[A-Z]/, 'Harus mengandung huruf besar')
  .regex(/[a-z]/, 'Harus mengandung huruf kecil')
  .regex(/[0-9]/, 'Harus mengandung angka')
  .regex(/[^A-Za-z0-9]/, 'Harus mengandung karakter spesial');
```

## 3. UX & Flow Pengguna

### Issues
| ID | Issue | Severity | Recommendation |
|----|-------|----------|----------------|
| UX-PW-001 | Bahasa inconsistent | Low | Mix English/Indonesian - standardize |
| UX-PW-002 | No password visibility toggle | Medium | Add eye icon untuk show/hide |
| UX-PW-003 | Success redirect delay | Low | Show countdown timer |
| UX-PW-004 | No email confirmation display | Medium | Show masked email yang akan dikirim |
| UX-PW-005 | Expired link handling poor | High | Clear message + retry option |
| UX-PW-006 | No password strength feedback | Medium | Real-time password validation |

### Flow Issues
1. **Email sent page** - Tidak ada opsi untuk resend
2. **Invalid token** - User confused, pesan tidak jelas
3. **Success page** - Auto redirect mungkin unexpected

## 4. Performance

| ID | Issue | Impact | Recommendation |
|----|-------|--------|----------------|
| PERF-PW-001 | Form re-render on each keystroke | Low | Debounce validation |
| PERF-PW-002 | No lazy loading | Low | Code split password pages |
| PERF-PW-003 | Session check on mount | Low | Cache session status |

## 5. Security

### 🔴 Critical
| ID | Issue | Risk | Recommendation |
|----|-------|------|----------------|
| SEC-PW-001 | No rate limiting | High | Limit reset requests per email/IP |
| SEC-PW-002 | Token not validated client-side | Medium | Validate before showing form |
| SEC-PW-003 | Password policy weak | High | Enforce strong password requirements |

### 🟡 Warning
| ID | Issue | Risk | Recommendation |
|----|-------|------|----------------|
| SEC-PW-004 | No email enumeration protection | Medium | Same response for valid/invalid email |
| SEC-PW-005 | Token in URL (visible in logs) | Low | Consider POST-based verification |
| SEC-PW-006 | No password history check | Medium | Prevent reuse of old passwords |
| SEC-PW-007 | No CAPTCHA on reset request | Medium | Add bot protection |

### Recommended Security Flow
```
1. User requests reset
2. Server validates email exists (don't reveal)
3. Generate secure token (expires in 1 hour)
4. Send email with one-time link
5. User clicks link
6. Validate token server-side
7. Show password form
8. Enforce password policy
9. Update password
10. Invalidate token
11. Invalidate all other sessions (optional)
12. Send confirmation email
```

## 6. Consistency & Data Integrity

| ID | Issue | Impact | Recommendation |
|----|-------|--------|----------------|
| DATA-PW-001 | Token single-use not enforced | High | Mark token as used after reset |
| DATA-PW-002 | Old sessions not invalidated | High | Logout all sessions on password change |
| DATA-PW-003 | No password change audit | Medium | Log password change events |
| DATA-PW-004 | Reset email not logged | Low | Audit reset requests |

## 7. Error Handling & Observability

### Current State
```typescript
// ResetPassword.tsx - Line 28-35
const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
  redirectTo: `${window.location.origin}/update-password`,
});

if (error) {
  toast({ variant: "destructive", title: "Gagal", description: error.message });
  return; // ❌ No logging, no retry
}
```

### Issues
| ID | Issue | Recommendation |
|----|-------|----------------|
| ERR-PW-001 | Generic error messages | Map to user-friendly messages |
| ERR-PW-002 | No error tracking | Integrate error monitoring |
| ERR-PW-003 | No retry mechanism | Add retry with exponential backoff |
| ERR-PW-004 | Token expiry not handled | Clear message for expired tokens |

### Error Message Mapping
```typescript
const ERROR_MESSAGES = {
  'Email not confirmed': 'Email belum diverifikasi',
  'User not found': 'Jika email terdaftar, Anda akan menerima link reset', // Don't reveal
  'Rate limit exceeded': 'Terlalu banyak percobaan. Coba lagi dalam 5 menit',
  'Invalid token': 'Link sudah tidak valid. Silakan request reset baru',
  'Token expired': 'Link sudah kadaluarsa. Silakan request reset baru',
};
```

## 8. Maintainability

| ID | Issue | Recommendation |
|----|-------|----------------|
| MAINT-PW-001 | Duplicate validation logic | Share schema between pages |
| MAINT-PW-002 | Hardcoded redirect URL | Use config/constants |
| MAINT-PW-003 | Inline styles | Use design system |
| MAINT-PW-004 | No separation of concerns | Extract logic ke hooks |

### Suggested Refactoring
```typescript
// hooks/usePasswordReset.ts
export function usePasswordReset() {
  const requestReset = async (email: string) => { ... };
  const validateToken = async (token: string) => { ... };
  const updatePassword = async (password: string) => { ... };
  return { requestReset, validateToken, updatePassword };
}

// config/auth.ts
export const PASSWORD_POLICY = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumber: true,
  requireSpecial: true,
};
```

## 9. Compatibility & Environment

| ID | Issue | Recommendation |
|----|-------|----------------|
| COMP-PW-001 | Redirect URL hardcoded | Use environment variable |
| COMP-PW-002 | Email client compatibility | Test email rendering |
| COMP-PW-003 | Deep link from email | Handle app vs web |
| COMP-PW-004 | Offline handling | Show appropriate message |

## Summary

| Severity | Count |
|----------|-------|
| 🔴 Critical | 5 |
| 🟡 Warning | 9 |
| 🔵 Info | 5 |

## Recommended Actions (Priority Order)

1. **[CRITICAL]** Implement rate limiting pada reset request
2. **[CRITICAL]** Strengthen password policy (min 8 + complexity)
3. **[CRITICAL]** Add token validation sebelum show form
4. **[HIGH]** Invalidate all sessions setelah password change
5. **[HIGH]** Add email enumeration protection
6. **[MEDIUM]** Add password strength indicator
7. **[MEDIUM]** Standardize bahasa ke Indonesian
8. **[LOW]** Add CAPTCHA protection
9. **[LOW]** Extract logic ke custom hooks
