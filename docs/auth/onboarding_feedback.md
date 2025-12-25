# Onboarding - Feedback

## 1. Bugs & Errors

### 🔴 Critical
| ID | Issue | Location | Description |
|----|-------|----------|-------------|
| BUG-ON-001 | User tanpa role stuck | `Onboarding.tsx:54-63` | Jika user sudah login tapi role null, redirect loop |
| BUG-ON-002 | Tenant tidak bisa onboard | `Onboarding.tsx:16-19` | roleOptions hanya merchant/vendor, tenant tidak ada |
| BUG-ON-003 | Webhook failure silent | `Onboarding.tsx:95-101` | Jika auth-webhook gagal, user stuck tanpa role |

### 🟡 Warning
| ID | Issue | Location | Description |
|----|-------|----------|-------------|
| BUG-ON-004 | Double role assignment | `Onboarding.tsx` + `handle_new_user` | Role bisa di-assign 2x jika onboarding dipanggil setelah trigger |
| BUG-ON-005 | Referral code tidak handled | `Onboarding.tsx` | Session storage referral code tidak diproses |
| BUG-ON-006 | Business name empty allowed | `Onboarding.tsx:78` | Validasi hanya di button disabled, bisa bypass |

## 2. Validations

### Current Implementation
```typescript
// Onboarding.tsx - Line 78
disabled={isSubmitting || !selectedRole || !businessName.trim()}
// ❌ Client-side only validation
```

### Missing Validations
| ID | Field | Issue | Recommendation |
|----|-------|-------|----------------|
| VAL-ON-001 | Business Name | No max length | Add `.max(100)` |
| VAL-ON-002 | Business Name | No special char restriction | Validate allowed characters |
| VAL-ON-003 | Role | Not validated against allowed | Validate role is valid enum |
| VAL-ON-004 | User state | Auth state not verified | Check session freshness |

### Recommended Validation
```typescript
const onboardingSchema = z.object({
  role: z.enum(['merchant', 'vendor']),
  businessName: z.string()
    .min(3, 'Nama bisnis minimal 3 karakter')
    .max(100, 'Nama bisnis maksimal 100 karakter')
    .regex(/^[a-zA-Z0-9\s\-\.]+$/, 'Hanya huruf, angka, spasi, dan tanda baca'),
});
```

## 3. UX & Flow Pengguna

### Issues
| ID | Issue | Severity | Recommendation |
|----|-------|----------|----------------|
| UX-ON-001 | Tenant excluded | High | Add tenant option atau clear messaging |
| UX-ON-002 | No progress indicator | Medium | Show step 1/2, 2/2 |
| UX-ON-003 | No back button | Low | Allow user to go back |
| UX-ON-004 | Bahasa mix | Low | "Merchant" bukan Indonesian |
| UX-ON-005 | No confirmation | Medium | Confirm role selection sebelum submit |
| UX-ON-006 | Loading state minimal | Medium | Show what's happening |

### Flow Issues
1. **Signup → Onboarding gap** - User bisa stuck jika close browser di tengah
2. **Role selection irreversible** - Tidak bisa ganti role setelah submit
3. **No skip option** - Tidak ada opsi skip atau later

### Recommended Flow
```
1. User signs up → auto redirect ke onboarding
2. Show role selection dengan deskripsi jelas
3. User pilih role → show business name form
4. Confirm selection (dapat diubah sebelum submit)
5. Submit → loading dengan progress
6. Success → redirect ke dashboard dengan welcome tour
```

## 4. Performance

| ID | Issue | Impact | Recommendation |
|----|-------|--------|----------------|
| PERF-ON-001 | Multiple API calls | Medium | Batch user data fetch |
| PERF-ON-002 | No optimistic update | Low | Show success sebelum API complete |
| PERF-ON-003 | Full page reload after submit | Medium | Use state management |

## 5. Security

### 🔴 Critical
| ID | Issue | Risk | Recommendation |
|----|-------|------|----------------|
| SEC-ON-001 | Role assignment client-side | High | Validate role di server |
| SEC-ON-002 | No auth state verification | High | Verify session sebelum allow submit |
| SEC-ON-003 | Webhook can be called directly | High | Add request validation |

### 🟡 Warning
| ID | Issue | Risk | Recommendation |
|----|-------|------|----------------|
| SEC-ON-004 | Business name not sanitized | Medium | Sanitize input |
| SEC-ON-005 | No CSRF protection | Medium | Add CSRF token |
| SEC-ON-006 | Referral in session storage | Low | Validate referral code server-side |

## 6. Consistency & Data Integrity

| ID | Issue | Impact | Recommendation |
|----|-------|--------|----------------|
| DATA-ON-001 | Role mismatch possible | High | Use database transaction |
| DATA-ON-002 | Profile incomplete | Medium | Validate all required fields |
| DATA-ON-003 | Duplicate onboarding | Medium | Check if already onboarded |
| DATA-ON-004 | Orphan records on failure | High | Rollback on error |

### Transaction Requirements
```sql
BEGIN;
  -- 1. Check if user already has role
  SELECT role FROM user_roles WHERE user_id = $1;
  
  -- 2. If no role, proceed
  INSERT INTO user_roles (user_id, role) VALUES ($1, $2);
  
  -- 3. Create role-specific record
  INSERT INTO merchants/vendors (user_id, business_name) VALUES ($1, $3);
  
  -- 4. Update profile
  UPDATE profiles SET onboarding_completed = true WHERE user_id = $1;
COMMIT;
```

## 7. Error Handling & Observability

### Current State
```typescript
// Onboarding.tsx - Line 95-101
const { error } = await supabase.functions.invoke('auth-webhook', { ... });
if (error) {
  console.error('Webhook error:', error); // ❌ Console only
  toast({ variant: 'destructive', ... });
  return;
}
```

### Issues
| ID | Issue | Recommendation |
|----|-------|----------------|
| ERR-ON-001 | Console.error only | Integrate error tracking |
| ERR-ON-002 | Generic error message | Show specific failure reason |
| ERR-ON-003 | No retry option | Allow user to retry |
| ERR-ON-004 | Stuck state possible | Add timeout and recovery |

### Error Recovery
```typescript
// Recommended error handling
try {
  await onboard();
} catch (error) {
  if (error.code === 'ALREADY_ONBOARDED') {
    // Redirect to dashboard
  } else if (error.code === 'ROLE_EXISTS') {
    // Show role conflict resolution
  } else if (error.code === 'NETWORK_ERROR') {
    // Show retry button
  } else {
    // Log to error service + show support contact
  }
}
```

## 8. Maintainability

| ID | Issue | Recommendation |
|----|-------|----------------|
| MAINT-ON-001 | Role logic duplicated | Share dengan AuthForm |
| MAINT-ON-002 | Hardcoded role options | Move to config |
| MAINT-ON-003 | Business logic in component | Extract to hook |
| MAINT-ON-004 | No type safety for roles | Use strict typing |

### Suggested Refactoring
```typescript
// config/roles.ts
export const ROLE_OPTIONS = [
  {
    value: 'merchant' as const,
    label: 'Pemilik Properti',
    icon: Building2,
    description: 'Untuk pemilik kos, apartemen, atau properti sewa',
  },
  {
    value: 'vendor' as const,
    label: 'Vendor Jasa',
    icon: Wrench,
    description: 'Untuk penyedia layanan maintenance dan jasa',
  },
] as const;

// hooks/useOnboarding.ts
export function useOnboarding() {
  const completeOnboarding = async (role: AppRole, businessName: string) => { ... };
  return { completeOnboarding, isOnboarding, error };
}
```

## 9. Compatibility & Environment

| ID | Issue | Recommendation |
|----|-------|----------------|
| COMP-ON-001 | No mobile optimization | Test on small screens |
| COMP-ON-002 | Icon accessibility | Add aria-labels |
| COMP-ON-003 | Keyboard navigation | Ensure tab order works |
| COMP-ON-004 | Slow network handling | Add timeout and retry |

## Summary

| Severity | Count |
|----------|-------|
| 🔴 Critical | 6 |
| 🟡 Warning | 8 |
| 🔵 Info | 6 |

## Recommended Actions (Priority Order)

1. **[CRITICAL]** Fix user tanpa role redirect loop
2. **[CRITICAL]** Add server-side role validation
3. **[CRITICAL]** Handle webhook failure dengan rollback
4. **[HIGH]** Add tenant onboarding path atau redirect
5. **[HIGH]** Implement database transaction untuk role assignment
6. **[MEDIUM]** Add progress indicator dan confirmation step
7. **[MEDIUM]** Extract business logic ke custom hook
8. **[LOW]** Move role options ke config
9. **[LOW]** Add keyboard navigation support
