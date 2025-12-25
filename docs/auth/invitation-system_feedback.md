# Invitation System - Feedback

## 1. Bugs & Errors

### 🔴 Critical
| ID | Issue | Location | Description |
|----|-------|----------|-------------|
| BUG-INV-001 | Hardcoded contract duration | `Invite.tsx:112-113` | `end_date` hardcoded 1 tahun, tidak dari unit/merchant setting |
| BUG-INV-002 | Non-atomic updates | `Invite.tsx:94-130` | Unit, invitation, contract update tanpa transaction - bisa partial failure |
| BUG-INV-003 | Race condition | `Invite.tsx:60-66` | `prefillEmail` bisa race dengan auth state |
| BUG-INV-004 | Token tidak invalidated | `Invite.tsx:100-107` | Token bisa digunakan ulang jika ada error setelah status update |

### 🟡 Warning
| ID | Issue | Location | Description |
|----|-------|----------|-------------|
| BUG-INV-005 | Expiry tidak di-check awal | `Invite.tsx:34-49` | Token expiry hanya di-check setelah page load |
| BUG-INV-006 | No duplicate check | `Invite.tsx` | User bisa signup dua kali dengan token yang sama |
| BUG-INV-007 | Missing rent_amount | `Invite.tsx:111-122` | Contract created tanpa rent_amount dari unit |

## 2. Validations

### Current Implementation
```typescript
// Invite.tsx - Line 34-49
const { data: invitation, isLoading, error } = useQuery({
  queryKey: ['invitation', token],
  queryFn: async () => {
    const { data, error } = await supabase
      .from('tenant_invitations')
      .select('*, unit:units(*), merchant:merchants(*)')
      .eq('token', token)
      .eq('status', 'pending') // ✅ Status check
      .single();
    // ❌ No expiry check here
```

### Missing Validations
| ID | Field | Issue | Recommendation |
|----|-------|-------|----------------|
| VAL-INV-001 | Token | Expiry tidak divalidasi awal | Add `expires_at > now()` di query |
| VAL-INV-002 | Email | Format tidak validated | Add email validation |
| VAL-INV-003 | User | Duplicate signup check | Check if email already registered |
| VAL-INV-004 | Unit | Availability tidak di-check | Verify unit masih available |
| VAL-INV-005 | Token | Format tidak validated | Validate token format |

### Recommended Query
```typescript
const { data: invitation } = await supabase
  .from('tenant_invitations')
  .select('*, unit:units(*), merchant:merchants(*)')
  .eq('token', token)
  .eq('status', 'pending')
  .gt('expires_at', new Date().toISOString()) // Add expiry check
  .eq('unit.status', 'available') // Check unit available
  .single();
```

## 3. UX & Flow Pengguna

### Issues
| ID | Issue | Severity | Recommendation |
|----|-------|----------|----------------|
| UX-INV-001 | Complex flow | High | Simplify steps |
| UX-INV-002 | No progress indicator | Medium | Show step 1/3, 2/3, 3/3 |
| UX-INV-003 | Expired token message | Medium | Lebih jelas dengan contact merchant |
| UX-INV-004 | Already registered confusion | High | Clear path untuk existing users |
| UX-INV-005 | No resend option | Medium | Allow resend invitation |
| UX-INV-006 | Property info minimal | Low | Show more unit details |

### Current Flow
```
1. Receive invitation link
2. Open link → show property info
3. Create account OR login
4. Complete profile (TenantProfileForm)
5. Auto-accept invitation
6. Redirect to dashboard
```

### Recommended Flow
```
1. Receive invitation link
2. Open link → validate token immediately
3. If expired → show clear message + contact merchant
4. If valid → show property info + benefits
5. Create account OR login (clear toggle)
6. If existing user → verify and link to unit
7. Complete profile dengan pre-filled data
8. Review dan confirm acceptance
9. Success page dengan next steps
10. Redirect ke dashboard dengan welcome tour
```

## 4. Performance

| ID | Issue | Impact | Recommendation |
|----|-------|--------|----------------|
| PERF-INV-001 | Multiple sequential queries | Medium | Batch unit + invitation fetch |
| PERF-INV-002 | No caching | Low | Cache invitation data |
| PERF-INV-003 | Full form re-render | Low | Memoize form fields |
| PERF-INV-004 | Image tidak optimized | Low | Lazy load property images |

## 5. Security

### 🔴 Critical
| ID | Issue | Risk | Recommendation |
|----|-------|------|----------------|
| SEC-INV-001 | Token in URL | Medium | Use POST untuk token verification |
| SEC-INV-002 | No rate limiting | High | Limit invitation acceptance attempts |
| SEC-INV-003 | Token reuse possible | High | Single-use enforcement |
| SEC-INV-004 | No IP logging | Medium | Log acceptance IP for audit |

### 🟡 Warning
| ID | Issue | Risk | Recommendation |
|----|-------|------|----------------|
| SEC-INV-005 | Token tidak expired properly | Medium | Strict expiry enforcement |
| SEC-INV-006 | Email enumeration | Medium | Don't reveal if email exists |
| SEC-INV-007 | No CAPTCHA | Medium | Add bot protection |
| SEC-INV-008 | Contract auto-created | Medium | Require explicit acceptance |

### Token Security Requirements
```typescript
// Recommended token handling
1. Generate cryptographically secure token (UUID v4 or better)
2. Hash token in database (store only hash)
3. Set expiry (24-72 hours)
4. Single use enforcement
5. IP logging on use
6. Rate limit attempts per token
7. Notify merchant on acceptance
```

## 6. Consistency & Data Integrity

| ID | Issue | Impact | Recommendation |
|----|-------|--------|----------------|
| DATA-INV-001 | Non-atomic operations | Critical | Use database transaction |
| DATA-INV-002 | Missing rollback | Critical | Implement proper rollback |
| DATA-INV-003 | Orphan records possible | High | Clean up on failure |
| DATA-INV-004 | Contract without rent | High | Ensure rent_amount is set |
| DATA-INV-005 | Duplicate tenant possible | Medium | Unique constraint check |

### Required Transaction
```sql
BEGIN;
  -- 1. Verify invitation still valid
  SELECT * FROM tenant_invitations 
  WHERE token = $1 AND status = 'pending' AND expires_at > now()
  FOR UPDATE;
  
  -- 2. Verify unit still available
  SELECT * FROM units WHERE id = $2 AND status = 'available' FOR UPDATE;
  
  -- 3. Create user (if new) - handled by Supabase Auth
  
  -- 4. Create/update tenant record
  INSERT INTO tenants (user_id, linked_merchant_id) VALUES ($3, $4);
  
  -- 5. Create contract
  INSERT INTO contracts (tenant_user_id, unit_id, merchant_id, rent_amount, start_date, end_date)
  VALUES ($3, $2, $4, $5, $6, $7);
  
  -- 6. Update unit status
  UPDATE units SET status = 'occupied' WHERE id = $2;
  
  -- 7. Mark invitation as accepted
  UPDATE tenant_invitations SET status = 'accepted', accepted_at = now() WHERE id = $8;
  
COMMIT;
```

## 7. Error Handling & Observability

### Current State
```typescript
// Invite.tsx - Error handling scattered
if (!invitation || error) {
  return (...) // ❌ No logging
}
```

### Issues
| ID | Issue | Recommendation |
|----|-------|----------------|
| ERR-INV-001 | Silent failures | Log semua errors |
| ERR-INV-002 | No partial failure recovery | Implement retry mechanism |
| ERR-INV-003 | Generic error messages | Specific, actionable messages |
| ERR-INV-004 | No merchant notification on failure | Alert merchant on issues |

### Error Scenarios to Handle
```typescript
const ERROR_SCENARIOS = {
  INVITATION_EXPIRED: {
    message: 'Undangan sudah kadaluarsa',
    action: 'Hubungi pemilik properti untuk undangan baru',
  },
  INVITATION_USED: {
    message: 'Undangan sudah digunakan',
    action: 'Login ke akun Anda untuk akses dashboard',
  },
  UNIT_NOT_AVAILABLE: {
    message: 'Unit sudah tidak tersedia',
    action: 'Hubungi pemilik properti untuk unit lain',
  },
  EMAIL_EXISTS: {
    message: 'Email sudah terdaftar',
    action: 'Login dengan email ini untuk lanjutkan',
  },
  CONTRACT_FAILED: {
    message: 'Gagal membuat kontrak',
    action: 'Coba lagi atau hubungi support',
  },
};
```

## 8. Maintainability

| ID | Issue | Recommendation |
|----|-------|----------------|
| MAINT-INV-001 | 400+ lines component | Split into smaller components |
| MAINT-INV-002 | Business logic in component | Extract to hook/service |
| MAINT-INV-003 | Hardcoded values | Use config constants |
| MAINT-INV-004 | No type for invitation | Create proper TypeScript types |
| MAINT-INV-005 | Mixed concerns | Separate UI, data, logic |

### Suggested Refactoring
```typescript
// Proposed structure
components/
  invitation/
    InvitationCard.tsx        // Property info display
    InvitationAuthForm.tsx    // Login/signup form
    InvitationConfirm.tsx     // Confirmation step
    InvitationSuccess.tsx     // Success message

hooks/
  useInvitation.ts            // Invitation data fetching
  useInvitationAccept.ts      // Accept invitation logic

services/
  invitationService.ts        // API calls

types/
  invitation.ts               // TypeScript types
```

## 9. Compatibility & Environment

| ID | Issue | Recommendation |
|----|-------|----------------|
| COMP-INV-001 | Mobile layout issues | Test responsive design |
| COMP-INV-002 | Deep link handling | Support app deep links |
| COMP-INV-003 | Email client preview | Test link preview in emails |
| COMP-INV-004 | Offline handling | Show appropriate message |
| COMP-INV-005 | Browser compatibility | Test on all major browsers |

## Summary

| Severity | Count |
|----------|-------|
| 🔴 Critical | 8 |
| 🟡 Warning | 10 |
| 🔵 Info | 6 |

## Recommended Actions (Priority Order)

1. **[CRITICAL]** Implement database transaction untuk acceptance flow
2. **[CRITICAL]** Fix hardcoded contract duration - use unit/merchant settings
3. **[CRITICAL]** Add proper rollback mechanism
4. **[CRITICAL]** Enforce token single-use
5. **[HIGH]** Add token expiry check di awal
6. **[HIGH]** Add rent_amount ke contract creation
7. **[MEDIUM]** Refactor ke smaller components
8. **[MEDIUM]** Add proper error handling dengan specific messages
9. **[LOW]** Add rate limiting
10. **[LOW]** Add progress indicator
