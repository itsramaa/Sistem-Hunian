# Referral System - Feedback

## 1. Bugs & Errors

### 🔴 Critical
| ID | Issue | Location | Description |
|----|-------|----------|-------------|
| BUG-REF-001 | Referral code generation collision | `ReferralDashboard.tsx:46` | `Date.now().toString(36)` bisa collision dalam ms yang sama |
| BUG-REF-002 | Self-referral possible | - | Tidak ada check untuk prevent self-referral |
| BUG-REF-003 | No transaction for reward processing | `process-referral-reward/index.ts` | Multiple updates tanpa transaction |
| BUG-REF-004 | Duplicate referral entry | `ReferralDashboard.tsx:29-51` | Race condition bisa create multiple entries |

### 🟡 Warning
| ID | Issue | Location | Description |
|----|-------|----------|-------------|
| BUG-REF-005 | Referral code case sensitivity | - | Code tidak normalized sebelum comparison |
| BUG-REF-006 | No expiry for referral codes | - | Referral codes never expire |
| BUG-REF-007 | Reward amount hardcoded | `ReferralDashboard.tsx:112-123` | Display tidak sync dengan actual calculation |
| BUG-REF-008 | Stats query inefficient | `ReferralDashboard.tsx:57-74` | Multiple queries for stats |

## 2. Validations

### Current Implementation
```typescript
// ReferralDashboard.tsx - No validation on referral creation
const { data: newReferral, error } = await supabase
  .from('referrals')
  .insert({
    referrer_user_id: user.id,
    referrer_role: userRole, // ❌ Not validated
    status: 'pending',
    referral_code: `REF${Date.now().toString(36).toUpperCase()}`, // ❌ Weak code generation
  })
```

### Missing Validations
| ID | Field | Issue | Recommendation |
|----|-------|-------|----------------|
| VAL-REF-001 | referral_code | Format not guaranteed unique | Use database trigger for generation |
| VAL-REF-002 | referrer_role | Not validated against enum | Use database constraint |
| VAL-REF-003 | reward_amount | No bounds check | Add min/max limits |
| VAL-REF-004 | referee_user_id | Self-referral not prevented | Add check constraint |
| VAL-REF-005 | status | Invalid transitions possible | Add state machine |

### Recommended Validation
```typescript
// Server-side validation
const referralSchema = z.object({
  referrer_user_id: z.string().uuid(),
  referrer_role: z.enum(['merchant', 'tenant', 'vendor']),
  referee_user_id: z.string().uuid().optional(),
  status: z.enum(['pending', 'active', 'completed', 'expired', 'cancelled']),
});

// Database constraint for self-referral prevention
ALTER TABLE referrals ADD CONSTRAINT no_self_referral 
CHECK (referrer_user_id != referee_user_id);
```

## 3. UX & Flow Pengguna

### Issues
| ID | Issue | Severity | Recommendation |
|----|-------|----------|----------------|
| UX-REF-001 | Reward info not clear | High | Show exact reward calculation |
| UX-REF-002 | No referral progress | Medium | Show steps to earn reward |
| UX-REF-003 | English labels | Low | Translate to Indonesian |
| UX-REF-004 | Stats cards too small | Low | Improve mobile layout |
| UX-REF-005 | No referral terms | Medium | Link to T&C |
| UX-REF-006 | WhatsApp share generic | Low | Personalize message |
| UX-REF-007 | No email share option | Low | Add email share |

### Flow Issues
1. **First time user** - No explanation of how referral works
2. **Reward tracking** - Tidak jelas kapan reward akan credited
3. **Multiple referrals** - Tidak ada limit yang jelas

### Recommended Improvements
```typescript
// Add referral explainer
const ReferralExplainer = ({ role }) => {
  const steps = {
    merchant: [
      { icon: Share2, text: 'Bagikan link referral Anda' },
      { icon: UserPlus, text: 'Teman mendaftar sebagai merchant' },
      { icon: CreditCard, text: 'Teman upgrade ke plan berbayar' },
      { icon: Gift, text: 'Anda dapat 20% komisi selama 6 bulan!' },
    ],
    tenant: [
      { icon: Share2, text: 'Bagikan link referral' },
      { icon: UserPlus, text: 'Teman mendaftar sebagai tenant' },
      { icon: CreditCard, text: 'Teman bayar sewa pertama' },
      { icon: Gift, text: 'Anda dapat voucher Rp 25.000!' },
    ],
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Cara Kerja Referral</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between">
          {steps[role].map((step, i) => (
            <div key={i} className="text-center">
              <step.icon className="mx-auto mb-2" />
              <p className="text-xs">{step.text}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
```

## 4. Performance

| ID | Issue | Impact | Recommendation |
|----|-------|--------|----------------|
| PERF-REF-001 | Multiple queries for dashboard | Medium | Single aggregated query |
| PERF-REF-002 | Reward history fetch all | Medium | Paginate rewards |
| PERF-REF-003 | No caching of referral code | Low | Cache user's referral code |
| PERF-REF-004 | Referral check on signup | Medium | Index on referral_code |

### Optimized Queries
```sql
-- Single query for all stats
SELECT 
  COUNT(*) FILTER (WHERE referee_user_id IS NOT NULL) as total_referrals,
  COUNT(*) FILTER (WHERE status = 'completed') as completed,
  COUNT(*) FILTER (WHERE status = 'pending' AND referee_user_id IS NOT NULL) as pending,
  (SELECT COALESCE(SUM(amount), 0) FROM referral_rewards WHERE user_id = $1 AND status = 'credited') as total_earned
FROM referrals
WHERE referrer_user_id = $1;

-- Add index for performance
CREATE INDEX idx_referrals_code ON referrals(UPPER(referral_code)) WHERE referee_user_id IS NULL;
CREATE INDEX idx_referral_rewards_user ON referral_rewards(user_id, status);
```

## 5. Security

### 🔴 Critical
| ID | Issue | Risk | Recommendation |
|----|-------|------|----------------|
| SEC-REF-001 | No fraud detection | High | Detect suspicious patterns |
| SEC-REF-002 | Self-referral possible | High | Add database constraint |
| SEC-REF-003 | No referral limit | Medium | Limit referrals per user/period |
| SEC-REF-004 | Code enumeration | Medium | Rate limit code checks |

### 🟡 Warning
| ID | Issue | Risk | Recommendation |
|----|-------|------|----------------|
| SEC-REF-005 | Reward manipulation | Medium | Server-side reward calculation |
| SEC-REF-006 | No IP tracking | Low | Track signup IPs for fraud |
| SEC-REF-007 | Session storage usage | Low | Use more secure storage |
| SEC-REF-008 | Multiple account fraud | High | Device fingerprinting |

### Fraud Prevention
```typescript
// Fraud detection patterns
const detectReferralFraud = async (referrerId: string, refereeEmail: string) => {
  // Check same IP signups
  const { data: recentSignups } = await supabase
    .from('signup_logs')
    .select('ip_address')
    .eq('referrer_id', referrerId)
    .gte('created_at', subDays(new Date(), 7));
  
  // Flag if multiple signups from same IP
  const ipCounts = countBy(recentSignups, 'ip_address');
  const suspiciousIPs = Object.entries(ipCounts).filter(([_, count]) => count > 3);
  
  if (suspiciousIPs.length > 0) {
    await flagReferrerForReview(referrerId, 'suspicious_ip_pattern');
    return true;
  }
  
  // Check email domain patterns
  const domain = refereeEmail.split('@')[1];
  const disposableDomains = ['tempmail.com', 'guerrillamail.com', ...];
  if (disposableDomains.includes(domain)) {
    return true;
  }
  
  return false;
};
```

## 6. Consistency & Data Integrity

| ID | Issue | Impact | Recommendation |
|----|-------|--------|----------------|
| DATA-REF-001 | Referral-reward mismatch | High | Use transaction for reward creation |
| DATA-REF-002 | Status inconsistency | Medium | Implement state machine |
| DATA-REF-003 | Orphan rewards possible | Medium | Foreign key constraints |
| DATA-REF-004 | Amount calculation varies | High | Centralize calculation logic |

### Transaction for Reward Processing
```sql
-- Complete referral transaction
BEGIN;
  -- Update referral status
  UPDATE referrals 
  SET status = 'completed', completed_at = now() 
  WHERE id = $1;
  
  -- Create reward for referrer
  INSERT INTO referral_rewards (
    user_id, referral_id, type, amount, status
  ) VALUES (
    $2, $1, 'referral_commission', $3, 'pending'
  );
  
  -- Create bonus for referee if applicable
  INSERT INTO referral_rewards (
    user_id, referral_id, type, amount, status
  ) VALUES (
    $4, $1, 'signup_bonus', $5, 'pending'
  );
  
  -- Update referrer stats
  UPDATE profiles 
  SET referral_count = referral_count + 1 
  WHERE user_id = $2;
COMMIT;
```

## 7. Error Handling & Observability

### Current State
```typescript
// ReferralDashboard.tsx - Basic error handling
const { data: newReferral, error } = await supabase
  .from('referrals')
  .insert({ ... })
  .select()
  .single();

if (error) throw error; // ❌ No specific handling
```

### Issues
| ID | Issue | Recommendation |
|----|-------|----------------|
| ERR-REF-001 | Generic error throwing | Show user-friendly messages |
| ERR-REF-002 | No referral analytics | Track referral funnel |
| ERR-REF-003 | Reward processing failures silent | Alert on failures |
| ERR-REF-004 | No audit trail | Log all referral actions |

### Improved Error Handling
```typescript
// Specific error messages
const createReferral = async () => {
  try {
    const result = await supabase.from('referrals').insert({ ... });
    
    if (result.error) {
      if (result.error.code === '23505') {
        // Duplicate key
        toast.error('Anda sudah memiliki kode referral');
      } else {
        toast.error('Gagal membuat kode referral. Coba lagi.');
      }
      return null;
    }
    
    // Track analytics
    trackEvent('referral_code_created', { role: userRole });
    
    return result.data;
  } catch (error) {
    console.error('Referral creation failed:', error);
    toast.error('Terjadi kesalahan. Silakan coba lagi.');
    return null;
  }
};
```

## 8. Maintainability

| ID | Issue | Recommendation |
|----|-------|----------------|
| MAINT-REF-001 | Reward logic in component | Extract to service |
| MAINT-REF-002 | Hardcoded reward values | Move to config/database |
| MAINT-REF-003 | No types for referral data | Create comprehensive types |
| MAINT-REF-004 | Multiple edge functions | Consolidate referral processing |
| MAINT-REF-005 | No tests | Add unit/integration tests |

### Suggested Refactoring
```typescript
// Proposed structure
src/
  features/referral/
    types.ts              // TypeScript types
    constants.ts          // Reward amounts, limits
    hooks/
      useReferral.ts      // Main hook
      useReferralStats.ts // Stats hook
      useReferralRewards.ts // Rewards hook
    components/
      ReferralDashboard.tsx
      ReferralCodeCard.tsx
      RewardProgress.tsx
      RewardsHistory.tsx
    services/
      referralService.ts  // API calls
      rewardCalculator.ts // Reward calculation

// Centralized reward configuration
export const REWARD_CONFIG = {
  merchant: {
    type: 'percentage',
    amount: 0.20, // 20%
    duration: 6, // months
    condition: 'referee_subscription_active',
  },
  tenant: {
    type: 'fixed',
    amount: 25000, // IDR
    bonusAmount: 25000,
    bonusCondition: '3_consecutive_payments',
  },
  vendor: {
    type: 'fixed',
    amount: 50000,
    milestone: 10, // orders
    bonusAmount: 100000,
    bonusMilestone: 3, // months active
  },
};
```

## 9. Compatibility & Environment

| ID | Issue | Recommendation |
|----|-------|----------------|
| COMP-REF-001 | Clipboard API support | Add fallback for older browsers |
| COMP-REF-002 | WhatsApp mobile deep link | Test on iOS/Android |
| COMP-REF-003 | Share API support | Use native share when available |
| COMP-REF-004 | Responsive design | Test on small screens |

### Share API Enhancement
```typescript
// Use native share when available
const handleShare = async () => {
  if (navigator.share) {
    try {
      await navigator.share({
        title: 'Join SiHuni',
        text: 'Daftar SiHuni pakai link saya dan dapat bonus!',
        url: referralLink,
      });
    } catch (err) {
      if (err.name !== 'AbortError') {
        // Fallback to clipboard
        handleCopyLink();
      }
    }
  } else {
    // Fallback for browsers without Share API
    handleCopyLink();
  }
};
```

## Summary

| Severity | Count |
|----------|-------|
| 🔴 Critical | 7 |
| 🟡 Warning | 10 |
| 🔵 Info | 7 |

## Recommended Actions (Priority Order)

1. **[CRITICAL]** Add self-referral prevention constraint
2. **[CRITICAL]** Implement fraud detection system
3. **[CRITICAL]** Use database trigger untuk code generation
4. **[HIGH]** Add referral limits per user/period
5. **[HIGH]** Implement transaction untuk reward processing
6. **[HIGH]** Add expiry untuk referral codes
7. **[MEDIUM]** Add referral explainer/onboarding
8. **[MEDIUM]** Centralize reward configuration
9. **[LOW]** Translate UI ke Indonesian
10. **[LOW]** Implement native share API
