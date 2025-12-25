# Login & Register - Feedback

## 1. Bugs & Errors

### 🔴 Critical
| ID | Issue | Location | Description |
|----|-------|----------|-------------|
| BUG-LR-001 | Console.log sensitive data | `AuthForm.tsx:266` | `console.log('Signup error details:', signUpError)` exposes sensitive auth data in production |
| BUG-LR-002 | Role mismatch potential | `auth-webhook/index.ts` | Role dari metadata bisa berbeda dengan yang di-insert ke user_roles jika webhook dipanggil multiple times |
| BUG-LR-003 | Duplicate signup handling | `AuthForm.tsx:258-270` | Error "User already registered" tidak selalu di-handle dengan benar |

### 🟡 Warning
| ID | Issue | Location | Description |
|----|-------|----------|-------------|
| BUG-LR-004 | Referral validation async | `AuthForm.tsx:68-91` | Referral validation bisa race condition dengan form submit |
| BUG-LR-005 | Merchant code case sensitivity | `AuthForm.tsx:135-145` | Merchant code tidak di-normalize (UPPER case) sebelum validasi |

## 2. Validations

### Missing Validations
| ID | Field | Issue | Recommendation |
|----|-------|-------|----------------|
| VAL-LR-001 | Phone | Format Indonesia tidak divalidasi | Gunakan regex `/^(\+62|62|0)[0-9]{9,13}$/` |
| VAL-LR-002 | Password | Tidak ada strength indicator | Tambahkan password strength meter |
| VAL-LR-003 | Email | Disposable email tidak di-block | Pertimbangkan validasi domain email |
| VAL-LR-004 | Name | Max length tidak di-enforce | Tambahkan `.max(100)` di schema |
| VAL-LR-005 | Merchant Code | Format tidak divalidasi | Tambahkan regex validation untuk 6 char alphanumeric |

### Current Validation Schema
```typescript
// signupSchema - Line 21-33
name: z.string().min(2) // ✅ OK
email: z.string().email() // ⚠️ Perlu disposable email check
phone: z.string().min(10) // ❌ Tidak cukup untuk format Indonesia
password: z.string().min(6) // ⚠️ Terlalu lemah, minimum 8 + complexity
confirmPassword: z.string() // ✅ OK dengan refine
```

## 3. UX & Flow Pengguna

### Issues
| ID | Issue | Severity | Recommendation |
|----|-------|----------|----------------|
| UX-LR-001 | No password strength indicator | Medium | Tambahkan visual password strength meter |
| UX-LR-002 | Bahasa campur (EN/ID) | Low | Konsistenkan ke Bahasa Indonesia |
| UX-LR-003 | No "Remember me" persistence | Low | Implement session persistence option |
| UX-LR-004 | Tab tidak switch otomatis dari URL | Low | Jika `?mode=signup`, langsung buka tab signup |
| UX-LR-005 | Loading state tidak comprehensive | Medium | Disable semua input saat loading |
| UX-LR-006 | Error message generic | Medium | Berikan error message yang lebih spesifik |

### Flow Issues
1. **Tenant signup flow** - Perlu merchant code tapi tidak ada guidance jelas
2. **Referral banner** - Muncul terlalu besar, mengganggu form
3. **Redirect after signup** - Langsung ke onboarding tanpa konfirmasi

## 4. Performance

| ID | Issue | Impact | Recommendation |
|----|-------|--------|----------------|
| PERF-LR-001 | Referral validation on mount | Medium | Debounce atau lazy load |
| PERF-LR-002 | Multiple Supabase calls on signup | Medium | Batch ke single webhook call |
| PERF-LR-003 | No form state memoization | Low | Gunakan useMemo untuk computed values |

## 5. Security

### 🔴 Critical
| ID | Issue | Risk | Recommendation |
|----|-------|------|----------------|
| SEC-LR-001 | No rate limiting | High | Implement rate limiting di edge function atau middleware |
| SEC-LR-002 | Console.log auth errors | High | Remove semua console.log sensitive data di production |
| SEC-LR-003 | Merchant code enumeration | Medium | Rate limit merchant code validation |

### 🟡 Warning
| ID | Issue | Risk | Recommendation |
|----|-------|------|----------------|
| SEC-LR-004 | Password policy weak | Medium | Minimum 8 chars, 1 uppercase, 1 number, 1 special |
| SEC-LR-005 | No CAPTCHA | Medium | Tambahkan reCAPTCHA atau hCaptcha |
| SEC-LR-006 | Referral code in session storage | Low | Encrypt atau gunakan httpOnly cookie |

## 6. Consistency & Data Integrity

| ID | Issue | Impact | Recommendation |
|----|-------|--------|----------------|
| DATA-LR-001 | Webhook failure = orphan auth user | High | Implement rollback mechanism |
| DATA-LR-002 | Multiple role assignment possible | Medium | Add unique constraint check before insert |
| DATA-LR-003 | Profile/role sync issue | Medium | Use database transaction di webhook |
| DATA-LR-004 | Referral linking tidak atomic | Medium | Wrap dalam transaction |

## 7. Error Handling & Observability

### Current State
```typescript
// Error handling pattern - Line 233-271
} catch (signUpError: any) {
  console.log('Signup error details:', signUpError); // ❌ Security issue
  setError(signUpError.message || 'Failed to create account');
}
```

### Issues
| ID | Issue | Recommendation |
|----|-------|----------------|
| ERR-LR-001 | Generic error messages | Map error codes ke user-friendly messages |
| ERR-LR-002 | No error tracking | Integrate Sentry atau similar |
| ERR-LR-003 | Webhook errors tidak di-log | Add structured logging |
| ERR-LR-004 | No retry mechanism | Implement retry untuk transient failures |

## 8. Maintainability

| ID | Issue | Recommendation |
|----|-------|----------------|
| MAINT-LR-001 | handleSignup 130+ lines | Split into smaller functions |
| MAINT-LR-002 | Inline business logic | Extract ke custom hooks |
| MAINT-LR-003 | Magic strings | Use constants/enums |
| MAINT-LR-004 | No unit tests | Add Jest/Vitest tests |
| MAINT-LR-005 | Mixed concerns | Separate UI dari business logic |

### Suggested Refactoring
```typescript
// Proposed structure
hooks/
  useSignup.ts        // Signup business logic
  useLogin.ts         // Login business logic
  useReferralCode.ts  // Referral validation
  useMerchantCode.ts  // Merchant code validation
```

## 9. Compatibility & Environment

| ID | Issue | Recommendation |
|----|-------|----------------|
| COMP-LR-001 | emailRedirectTo hardcoded | Use environment variable |
| COMP-LR-002 | No mobile responsive check | Test on various screen sizes |
| COMP-LR-003 | Browser autofill issues | Add autocomplete attributes |
| COMP-LR-004 | No offline handling | Add network status check |

## Summary

| Severity | Count |
|----------|-------|
| 🔴 Critical | 6 |
| 🟡 Warning | 12 |
| 🔵 Info | 8 |

## Recommended Actions (Priority Order)

1. **[CRITICAL]** Remove console.log untuk sensitive data
2. **[CRITICAL]** Implement rate limiting
3. **[CRITICAL]** Fix webhook transaction handling
4. **[HIGH]** Add password strength validation
5. **[HIGH]** Add phone format validation
6. **[MEDIUM]** Refactor handleSignup ke smaller functions
7. **[MEDIUM]** Add CAPTCHA protection
8. **[LOW]** Konsistenkan bahasa ke Indonesian
9. **[LOW]** Add unit tests
