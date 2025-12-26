# Login & Register - Feedback

## 1. Bugs & Errors

### 🔴 Critical
| ID | Issue | Location | Status |
|----|-------|----------|--------|
| BUG-LR-001 | Console.log sensitive data | `AuthForm.tsx:266` | ✅ Fixed - Removed sensitive console.log |
| BUG-LR-002 | Role mismatch potential | `auth-webhook/index.ts` | ⚠️ Pending - Webhook level fix |
| BUG-LR-003 | Duplicate signup handling | `AuthForm.tsx:258-270` | ✅ Fixed - Improved error handling |

### 🟡 Warning
| ID | Issue | Location | Status |
|----|-------|----------|--------|
| BUG-LR-004 | Referral validation async | `AuthForm.tsx:68-91` | ⚠️ Pending - Need refactor |
| BUG-LR-005 | Merchant code case sensitivity | `AuthForm.tsx:135-145` | ✅ Fixed - Normalized to uppercase |

## 2. Validations

### Missing Validations
| ID | Field | Issue | Status |
|----|-------|-------|--------|
| VAL-LR-001 | Phone | Format Indonesia tidak divalidasi | ✅ Fixed - Added regex validation |
| VAL-LR-002 | Password | Tidak ada strength indicator | ✅ Fixed - Added PasswordStrengthMeter |
| VAL-LR-003 | Email | Disposable email tidak di-block | ⚠️ Low priority |
| VAL-LR-004 | Name | Max length tidak di-enforce | ✅ Fixed - Added .max(100) |
| VAL-LR-005 | Merchant Code | Format tidak divalidasi | ✅ Fixed - Added 6 char alphanumeric validation |

### Current Validation Schema
```typescript
// signupSchema - Updated
name: z.string().min(2).max(100) // ✅ Fixed
email: z.string().email() // ✅ OK
phone: z.string().regex(/^(\+62|62|0)[0-9]{9,13}$/) // ✅ Fixed
password: z.string().min(8) + complexity // ✅ Fixed
confirmPassword: z.string() // ✅ OK dengan refine
```

## 3. UX & Flow Pengguna

### Issues
| ID | Issue | Severity | Status |
|----|-------|----------|--------|
| UX-LR-001 | No password strength indicator | Medium | ✅ Fixed |
| UX-LR-002 | Bahasa campur (EN/ID) | Low | ✅ Fixed - Standardized to Indonesian |
| UX-LR-003 | No "Remember me" persistence | Low | ⚠️ Pending |
| UX-LR-004 | Tab tidak switch otomatis dari URL | Low | ⚠️ Pending |
| UX-LR-005 | Loading state tidak comprehensive | Medium | ✅ Fixed |
| UX-LR-006 | Error message generic | Medium | ✅ Fixed - Added error mapping |

## 4. Performance

| ID | Issue | Impact | Status |
|----|-------|--------|--------|
| PERF-LR-001 | Referral validation on mount | Medium | ⚠️ Pending |
| PERF-LR-002 | Multiple Supabase calls on signup | Medium | ⚠️ Pending |
| PERF-LR-003 | No form state memoization | Low | ⚠️ Pending |

## 5. Security

### 🔴 Critical
| ID | Issue | Risk | Status |
|----|-------|------|--------|
| SEC-LR-001 | No rate limiting | High | ⚠️ Pending - Server level |
| SEC-LR-002 | Console.log auth errors | High | ✅ Fixed |
| SEC-LR-003 | Merchant code enumeration | Medium | ⚠️ Pending |

### 🟡 Warning
| ID | Issue | Risk | Status |
|----|-------|------|--------|
| SEC-LR-004 | Password policy weak | Medium | ✅ Fixed - Min 8 + complexity |
| SEC-LR-005 | No CAPTCHA | Medium | ⚠️ Pending |
| SEC-LR-006 | Referral code in session storage | Low | ⚠️ Pending |

## 6. Consistency & Data Integrity

| ID | Issue | Impact | Status |
|----|-------|--------|--------|
| DATA-LR-001 | Webhook failure = orphan auth user | High | ⚠️ Pending |
| DATA-LR-002 | Multiple role assignment possible | Medium | ⚠️ Pending |
| DATA-LR-003 | Profile/role sync issue | Medium | ⚠️ Pending |
| DATA-LR-004 | Referral linking tidak atomic | Medium | ⚠️ Pending |

## 7. Error Handling & Observability

### Current State - IMPROVED ✅
```typescript
// Error handling pattern - Updated
} catch (signUpError: any) {
  // No more console.log for sensitive data
  const friendlyMessage = getAuthErrorMessage(signUpError);
  setError(friendlyMessage);
}
```

### Issues
| ID | Issue | Status |
|----|-------|--------|
| ERR-LR-001 | Generic error messages | ✅ Fixed - Added error mapping |
| ERR-LR-002 | No error tracking | ⚠️ Pending |
| ERR-LR-003 | Webhook errors tidak di-log | ⚠️ Pending |
| ERR-LR-004 | No retry mechanism | ⚠️ Pending |

## 8. Maintainability

| ID | Issue | Status |
|----|-------|--------|
| MAINT-LR-001 | handleSignup 130+ lines | ⚠️ Pending refactor |
| MAINT-LR-002 | Inline business logic | ⚠️ Pending |
| MAINT-LR-003 | Magic strings | ✅ Fixed - Using constants |
| MAINT-LR-004 | No unit tests | ⚠️ Pending |
| MAINT-LR-005 | Mixed concerns | ⚠️ Pending |

## 9. Compatibility & Environment

| ID | Issue | Status |
|----|-------|--------|
| COMP-LR-001 | emailRedirectTo hardcoded | ✅ Fixed - Using window.location.origin |
| COMP-LR-002 | No mobile responsive check | ✅ Already responsive |
| COMP-LR-003 | Browser autofill issues | ⚠️ Pending |
| COMP-LR-004 | No offline handling | ⚠️ Pending |

## Summary

| Severity | Total | Fixed | Pending |
|----------|-------|-------|---------|
| 🔴 Critical | 6 | 3 | 3 |
| 🟡 Warning | 12 | 6 | 6 |
| 🔵 Info | 8 | 4 | 4 |

## Implementation Progress

### ✅ Completed
1. Remove console.log untuk sensitive data
2. Add password strength validation
3. Add phone format validation (Indonesia)
4. Merchant code normalization
5. Error message mapping
6. Standardize language to Indonesian

### ⚠️ Pending (Requires deeper changes)
1. Rate limiting (server level)
2. CAPTCHA protection
3. Webhook transaction handling
4. Refactor handleSignup ke smaller functions
