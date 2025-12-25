# Referral Invite - Feedback

## 1. Bugs & Errors

### 🔴 Critical
| ID | Issue | Location | Description |
|----|-------|----------|-------------|
| BUG-REF-001 | Session storage persistence | `ReferralInvite.tsx:21-23` | Referral code bisa hilang jika user clear storage |
| BUG-REF-002 | Referral validation timing | `ReferralInvite.tsx:28-62` | Query bisa fail silently jika referral tidak ditemukan |
| BUG-REF-003 | Role from URL not validated | `ReferralInvite.tsx:14` | Role parameter tidak divalidasi terhadap allowed roles |

### 🟡 Warning
| ID | Issue | Location | Description |
|----|-------|----------|-------------|
| BUG-REF-004 | Multiple referral handling | - | User bisa memiliki multiple referral codes dari different sources |
| BUG-REF-005 | Referral code case sensitivity | `ReferralInvite.tsx` | Code tidak di-normalize |
| BUG-REF-006 | Expired referral not shown | `ReferralInvite.tsx:60` | Query returns null tanpa reason |

## 2. Validations

### Current Implementation
```typescript
// ReferralInvite.tsx - Line 28-62
const { data: referralInfo, isLoading } = useQuery({
  queryKey: ['referral', referralCode],
  queryFn: async () => {
    // Validates referral exists
    const { data: referral } = await supabase
      .from('referrals')
      .select('*')
      .eq('referral_code', referralCode)
      .eq('is_active', true)
      .single();
    // ❌ No expiry check
    // ❌ No usage limit check
```

### Missing Validations
| ID | Field | Issue | Recommendation |
|----|-------|-------|----------------|
| VAL-REF-001 | Referral Code | No format validation | Validate alphanumeric 8 chars |
| VAL-REF-002 | Referral Code | No expiry check | Add expiry_date comparison |
| VAL-REF-003 | Referral Code | No usage limit | Check max_uses vs current_uses |
| VAL-REF-004 | Role | Not validated | Validate against AppRole enum |
| VAL-REF-005 | Self-referral | Not prevented | Check referrer != referee |

### Recommended Validation
```typescript
const referralSchema = z.object({
  code: z.string()
    .length(8, 'Kode referral harus 8 karakter')
    .regex(/^[A-Z0-9]+$/, 'Kode referral tidak valid'),
  role: z.enum(['merchant', 'vendor', 'tenant']).optional(),
});

// Query validation
const validReferral = await supabase
  .from('referrals')
  .select('*')
  .eq('referral_code', code.toUpperCase())
  .eq('is_active', true)
  .gt('expires_at', new Date().toISOString())
  .lt('current_uses', 'max_uses') // Pseudo - need raw query
  .single();
```

## 3. UX & Flow Pengguna

### Issues
| ID | Issue | Severity | Recommendation |
|----|-------|----------|----------------|
| UX-REF-001 | Referral benefit unclear | Medium | Show exact discount/bonus amount |
| UX-REF-002 | No cancel/skip option | Low | Allow user to proceed without referral |
| UX-REF-003 | Loading state minimal | Low | Show skeleton atau better loading |
| UX-REF-004 | Error messages generic | Medium | Specific error untuk expired/invalid |
| UX-REF-005 | No referrer info display | Medium | Show who referred them |
| UX-REF-006 | CTA not compelling | Low | Better call-to-action copy |

### Current Flow
```
1. User clicks referral link with code
2. Page loads → validates referral
3. Shows bonus info based on role
4. User clicks "Get Started"
5. Redirects to /auth?signup=true&referral=CODE
```

### Recommended Flow
```
1. User clicks referral link
2. Immediate validation (loading state)
3. If invalid → clear message + try again option
4. If valid → show:
   - Who referred them (nama referrer)
   - Exact benefit (Diskon Rp X atau Y%)
   - What they'll get after signup
5. Clear CTA with benefit reminder
6. Signup with referral pre-filled
7. Confirmation after signup dengan referral applied
```

## 4. Performance

| ID | Issue | Impact | Recommendation |
|----|-------|--------|----------------|
| PERF-REF-001 | Referrer info multiple queries | Medium | Single join query |
| PERF-REF-002 | No caching | Low | Cache referral validation |
| PERF-REF-003 | Session storage on every render | Low | Check once on mount |
| PERF-REF-004 | Icon imports | Low | Lazy load icons |

### Optimized Query
```typescript
// Single query untuk semua data
const { data } = await supabase
  .from('referrals')
  .select(`
    *,
    referrer:profiles!referrer_id(full_name, avatar_url),
    merchant:merchants(business_name),
    vendor:vendors(business_name)
  `)
  .eq('referral_code', code)
  .eq('is_active', true)
  .single();
```

## 5. Security

### 🔴 Critical
| ID | Issue | Risk | Recommendation |
|----|-------|------|----------------|
| SEC-REF-001 | Referral code enumeration | Medium | Rate limit code checks |
| SEC-REF-002 | Session storage manipulation | Medium | Validate code server-side |
| SEC-REF-003 | Role parameter injection | Medium | Validate role server-side |

### 🟡 Warning
| ID | Issue | Risk | Recommendation |
|----|-------|------|----------------|
| SEC-REF-004 | No referral abuse prevention | Medium | Limit referrals per IP/device |
| SEC-REF-005 | Self-referral possible | Low | Check referrer != new user |
| SEC-REF-006 | Referral code in URL | Low | Consider POST-based flow |
| SEC-REF-007 | No fraud detection | Medium | Monitor unusual patterns |

### Fraud Prevention
```typescript
// Recommended checks
1. Rate limit: Max 10 referral checks per IP per hour
2. Device fingerprint: Track referral claims per device
3. Email domain: Flag disposable email domains
4. IP geolocation: Flag suspicious locations
5. Time pattern: Flag rapid signups from same referrer
6. Self-referral: Compare email domains, IPs
```

## 6. Consistency & Data Integrity

| ID | Issue | Impact | Recommendation |
|----|-------|--------|----------------|
| DATA-REF-001 | Referral tracking inconsistent | Medium | Ensure referral recorded on signup |
| DATA-REF-002 | Usage count not updated | High | Increment on successful signup |
| DATA-REF-003 | Reward not calculated | High | Trigger reward calculation |
| DATA-REF-004 | Multiple referral sources | Medium | Handle priority/first-wins |

### Referral Flow Data Integrity
```sql
-- On successful signup with referral
BEGIN;
  -- 1. Increment referral usage
  UPDATE referrals 
  SET current_uses = current_uses + 1 
  WHERE referral_code = $1;
  
  -- 2. Record referral link
  INSERT INTO referral_rewards (
    referral_id, referee_id, referrer_id, 
    reward_type, amount, status
  ) VALUES ($2, $3, $4, $5, $6, 'pending');
  
  -- 3. Update new user profile
  UPDATE profiles SET referred_by = $4 WHERE user_id = $3;
  
  -- 4. Apply discount if applicable
  -- (handled by subscription/billing system)
COMMIT;
```

## 7. Error Handling & Observability

### Current State
```typescript
// ReferralInvite.tsx - Line 12-26
if (!referralCode) {
  return (...) // No code scenario - OK
}

// Line 64-72
if (!referralCode || !referralInfo) {
  return (...) // Invalid code - generic message
}
```

### Issues
| ID | Issue | Recommendation |
|----|-------|----------------|
| ERR-REF-001 | No error differentiation | Distinguish expired vs invalid vs used |
| ERR-REF-002 | No logging | Log referral page views and conversions |
| ERR-REF-003 | No retry option | Allow re-enter referral code |
| ERR-REF-004 | Silent failures | Show clear error states |

### Error Scenarios
```typescript
const REFERRAL_ERRORS = {
  NOT_FOUND: {
    title: 'Kode Referral Tidak Ditemukan',
    message: 'Kode referral yang Anda masukkan tidak valid.',
    action: 'Periksa kembali kode atau daftar tanpa referral',
  },
  EXPIRED: {
    title: 'Kode Referral Kadaluarsa',
    message: 'Kode referral ini sudah tidak berlaku.',
    action: 'Minta kode baru dari teman Anda',
  },
  MAX_USES: {
    title: 'Kode Referral Sudah Penuh',
    message: 'Kode referral ini sudah mencapai batas penggunaan.',
    action: 'Daftar tanpa referral atau minta kode lain',
  },
  INACTIVE: {
    title: 'Kode Referral Tidak Aktif',
    message: 'Kode referral ini sudah dinonaktifkan.',
    action: 'Hubungi pemilik kode atau daftar tanpa referral',
  },
};
```

## 8. Maintainability

| ID | Issue | Recommendation |
|----|-------|----------------|
| MAINT-REF-001 | getBonusInfo logic complex | Extract to separate function |
| MAINT-REF-002 | Hardcoded benefits | Move to config/database |
| MAINT-REF-003 | Role checking scattered | Centralize role utils |
| MAINT-REF-004 | No types for referral data | Create proper TypeScript types |

### Suggested Refactoring
```typescript
// types/referral.ts
interface ReferralInfo {
  code: string;
  referrer: {
    name: string;
    role: AppRole;
    businessName?: string;
  };
  benefits: {
    referrer: ReferralBenefit;
    referee: ReferralBenefit;
  };
  isValid: boolean;
  expiresAt: Date;
}

// config/referralBenefits.ts
export const REFERRAL_BENEFITS: Record<AppRole, ReferralBenefit> = {
  merchant: {
    title: 'Diskon Langganan',
    description: 'Diskon 20% untuk 3 bulan pertama',
    amount: 0.2,
    type: 'percentage',
    duration: 3,
  },
  // ...
};

// hooks/useReferral.ts
export function useReferral(code: string) {
  const validateReferral = () => { ... };
  const applyReferral = () => { ... };
  return { referralInfo, isValid, isLoading, error };
}
```

## 9. Compatibility & Environment

| ID | Issue | Recommendation |
|----|-------|----------------|
| COMP-REF-001 | Link preview (OG tags) | Add meta tags for sharing |
| COMP-REF-002 | Mobile deep link | Support app opening |
| COMP-REF-003 | Social sharing preview | Add preview image |
| COMP-REF-004 | WhatsApp/SMS link format | Ensure links work in messaging apps |
| COMP-REF-005 | URL shortener compatibility | Test with bit.ly etc |

### Link Preview Requirements
```html
<!-- OG Tags untuk referral page -->
<meta property="og:title" content="Bergabung dengan Sihuni - Dapat Bonus!">
<meta property="og:description" content="Daftar dengan referral dari [nama] dan dapatkan diskon spesial">
<meta property="og:image" content="/referral-preview.png">
<meta property="og:url" content="https://sihuni.com/referral?code=ABC123">
```

## Summary

| Severity | Count |
|----------|-------|
| 🔴 Critical | 5 |
| 🟡 Warning | 8 |
| 🔵 Info | 6 |

## Recommended Actions (Priority Order)

1. **[CRITICAL]** Add server-side referral code validation
2. **[CRITICAL]** Implement referral expiry check
3. **[CRITICAL]** Add usage count limit check
4. **[HIGH]** Implement rate limiting untuk code checks
5. **[HIGH]** Ensure referral tracking on signup
6. **[MEDIUM]** Add specific error messages
7. **[MEDIUM]** Show referrer info and exact benefits
8. **[MEDIUM]** Add fraud prevention measures
9. **[LOW]** Add OG tags for link sharing
10. **[LOW]** Extract benefits to config
