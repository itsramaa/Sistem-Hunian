# Analytics System - Feedback

## 1. Bugs & Errors

### 🔴 Critical
| ID | Issue | Location | Description |
|----|-------|----------|-------------|
| BUG-ANA-001 | Duplicate page_view events | `useAnalytics.ts:40-46` | Effect bisa trigger multiple times |
| BUG-ANA-002 | Session ID collision | `analytics.ts:5-11` | sessionStorage bisa conflict di multiple tabs |
| BUG-ANA-003 | Silent failures | `useAnalytics.ts:35` | Error hanya di-console.log |

### 🟡 Warning
| ID | Issue | Location | Description |
|----|-------|----------|-------------|
| BUG-ANA-004 | Async user fetch | `analytics.ts:21` | getUser() setiap event expensive |
| BUG-ANA-005 | No batching | - | Setiap event = 1 database call |
| BUG-ANA-006 | Event data type loose | `analytics.ts:14-17` | Record<string, any> tidak type-safe |

## 2. Validations

### Current Implementation
```typescript
// useAnalytics.ts - No input validation
const trackEvent = useCallback(async (
  eventType: string,    // ❌ Any string accepted
  eventData?: EventData, // ❌ No structure validation
  page?: string          // ❌ No format check
) => {
  // Direct insert without validation
  await supabase.from('analytics_events').insert({ ... });
}, []);
```

### Missing Validations
| ID | Field | Issue | Recommendation |
|----|-------|-------|----------------|
| VAL-ANA-001 | event_type | Any string allowed | Use enum of valid types |
| VAL-ANA-002 | event_data | Structure not validated | Define schemas per event type |
| VAL-ANA-003 | page | No URL validation | Validate path format |
| VAL-ANA-004 | session_id | Format not validated | Use UUID format |
| VAL-ANA-005 | user_id | Not verified | Ensure user exists |

### Recommended Validation
```typescript
import { z } from 'zod';

const analyticsEventSchema = z.object({
  event_type: z.enum([
    'page_view', 'login', 'logout', 'signup',
    'payment_initiated', 'payment_completed', 'payment_failed',
    'order_placed', 'order_completed', 'order_cancelled',
    'maintenance_created', 'maintenance_resolved',
    'chatbot_opened', 'chatbot_message_sent',
    'referral_link_copied', 'referral_link_shared',
    'contract_viewed', 'contract_signed',
    'forum_post_created', 'forum_post_viewed', 'forum_comment_added',
  ]),
  event_data: z.record(z.union([z.string(), z.number(), z.boolean(), z.null()])),
  page: z.string().regex(/^\/[a-z0-9\-\/]*$/i).optional(),
});

// Type-specific event data
const paymentEventData = z.object({
  payment_id: z.string().uuid(),
  amount: z.number().positive(),
  payment_method: z.string().optional(),
});
```

## 3. UX & Flow Pengguna

Analytics adalah backend system, tapi ada UX considerations:

### Issues
| ID | Issue | Severity | Recommendation |
|----|-------|----------|----------------|
| UX-ANA-001 | No consent banner | High | Add cookie/analytics consent |
| UX-ANA-002 | No opt-out option | High | Allow users to disable tracking |
| UX-ANA-003 | No data export | Medium | GDPR data export |
| UX-ANA-004 | No retention notice | Low | Inform data retention period |

### Privacy Flow
```typescript
// Add consent management
const useAnalyticsConsent = () => {
  const [hasConsent, setHasConsent] = useState(() => {
    return localStorage.getItem('analytics_consent') === 'true';
  });
  
  const grantConsent = () => {
    localStorage.setItem('analytics_consent', 'true');
    setHasConsent(true);
  };
  
  const revokeConsent = async () => {
    localStorage.removeItem('analytics_consent');
    // Clear existing data
    await supabase.from('analytics_events')
      .delete()
      .eq('session_id', getSessionId());
    setHasConsent(false);
  };
  
  return { hasConsent, grantConsent, revokeConsent };
};
```

## 4. Performance

| ID | Issue | Impact | Recommendation |
|----|-------|--------|----------------|
| PERF-ANA-001 | No event batching | High | Batch events before sending |
| PERF-ANA-002 | Sync database calls | Medium | Use async queue |
| PERF-ANA-003 | getUser() every event | High | Cache user ID |
| PERF-ANA-004 | No sampling | Medium | Sample high-frequency events |
| PERF-ANA-005 | No debouncing | Medium | Debounce rapid events |

### Performance Optimizations
```typescript
// Event batching
class AnalyticsBatcher {
  private queue: AnalyticsEvent[] = [];
  private flushTimeout: NodeJS.Timeout | null = null;
  private readonly BATCH_SIZE = 10;
  private readonly FLUSH_INTERVAL = 5000; // 5 seconds
  
  add(event: AnalyticsEvent) {
    this.queue.push(event);
    
    if (this.queue.length >= this.BATCH_SIZE) {
      this.flush();
    } else if (!this.flushTimeout) {
      this.flushTimeout = setTimeout(() => this.flush(), this.FLUSH_INTERVAL);
    }
  }
  
  async flush() {
    if (this.queue.length === 0) return;
    
    const events = [...this.queue];
    this.queue = [];
    
    if (this.flushTimeout) {
      clearTimeout(this.flushTimeout);
      this.flushTimeout = null;
    }
    
    try {
      await supabase.from('analytics_events').insert(events);
    } catch (error) {
      // Re-queue on failure
      this.queue = [...events, ...this.queue];
      console.error('Analytics flush failed:', error);
    }
  }
}

// Sampling for high-frequency events
const shouldSample = (eventType: string): boolean => {
  const samplingRates: Record<string, number> = {
    page_view: 1.0, // 100%
    scroll_depth: 0.1, // 10%
    mouse_movement: 0.01, // 1%
  };
  
  return Math.random() < (samplingRates[eventType] ?? 1.0);
};
```

## 5. Security

### 🔴 Critical
| ID | Issue | Risk | Recommendation |
|----|-------|------|----------------|
| SEC-ANA-001 | No rate limiting | High | Limit events per session |
| SEC-ANA-002 | PII in event_data | High | Filter sensitive data |
| SEC-ANA-003 | Session spoofing | Medium | Validate session origin |
| SEC-ANA-004 | No data anonymization | Medium | Anonymize for GDPR |

### 🟡 Warning
| ID | Issue | Risk | Recommendation |
|----|-------|------|----------------|
| SEC-ANA-005 | Raw referrer logged | Low | Sanitize URLs |
| SEC-ANA-006 | No IP hashing | Medium | Hash IPs for privacy |
| SEC-ANA-007 | Unlimited data retention | Medium | Implement retention policy |

### Security Improvements
```typescript
// Filter PII from event data
const sanitizeEventData = (data: Record<string, any>): Record<string, any> => {
  const piiFields = ['email', 'phone', 'password', 'ssn', 'credit_card'];
  const sanitized = { ...data };
  
  for (const field of piiFields) {
    if (sanitized[field]) {
      sanitized[field] = '[REDACTED]';
    }
  }
  
  // Mask email if present
  if (typeof sanitized.email === 'string') {
    sanitized.email = maskEmail(sanitized.email);
  }
  
  return sanitized;
};

// Rate limiting
const rateLimiter = new Map<string, number>();
const MAX_EVENTS_PER_MINUTE = 100;

const canTrackEvent = (sessionId: string): boolean => {
  const now = Date.now();
  const windowStart = now - 60000; // 1 minute
  
  const count = rateLimiter.get(sessionId) || 0;
  
  if (count >= MAX_EVENTS_PER_MINUTE) {
    return false;
  }
  
  rateLimiter.set(sessionId, count + 1);
  return true;
};
```

## 6. Consistency & Data Integrity

| ID | Issue | Impact | Recommendation |
|----|-------|--------|----------------|
| DATA-ANA-001 | No event schema | Medium | Enforce event structure |
| DATA-ANA-002 | Inconsistent event names | Medium | Use constants/enums |
| DATA-ANA-003 | No timestamp validation | Low | Server-side timestamps |
| DATA-ANA-004 | Orphan sessions | Low | Clean up old sessions |
| DATA-ANA-005 | Duplicate events | Medium | Add idempotency key |

### Data Schema Improvements
```sql
-- Add constraints
ALTER TABLE analytics_events ADD CONSTRAINT valid_event_type 
CHECK (event_type IN (
  'page_view', 'login', 'logout', 'signup',
  'payment_initiated', 'payment_completed', 'payment_failed',
  'order_placed', 'order_completed', 'order_cancelled',
  'maintenance_submitted', 'maintenance_resolved',
  'chatbot_opened', 'chatbot_message',
  'referral_link_copied', 'referral_link_shared',
  'contract_viewed', 'contract_signed',
  'forum_post_created', 'forum_post_viewed', 'forum_comment_added'
));

-- Add indexes for common queries
CREATE INDEX idx_analytics_user_date ON analytics_events(user_id, created_at);
CREATE INDEX idx_analytics_event_type ON analytics_events(event_type, created_at);
CREATE INDEX idx_analytics_session ON analytics_events(session_id, created_at);

-- Add idempotency key
ALTER TABLE analytics_events ADD COLUMN idempotency_key TEXT;
CREATE UNIQUE INDEX idx_analytics_idempotency ON analytics_events(idempotency_key) 
WHERE idempotency_key IS NOT NULL;
```

## 7. Error Handling & Observability

### Current State
```typescript
// useAnalytics.ts - Minimal error handling
try {
  await supabase.from('analytics_events').insert({ ... });
} catch (error) {
  console.error('Analytics tracking error:', error);
  // ❌ Error swallowed, no retry, no alerting
}
```

### Issues
| ID | Issue | Recommendation |
|----|-------|----------------|
| ERR-ANA-001 | Errors swallowed | Track analytics errors separately |
| ERR-ANA-002 | No offline support | Queue events when offline |
| ERR-ANA-003 | No retry mechanism | Add exponential backoff |
| ERR-ANA-004 | No health monitoring | Monitor analytics pipeline |

### Improved Error Handling
```typescript
// Offline-capable analytics
class OfflineAnalytics {
  private offlineQueue: AnalyticsEvent[] = [];
  
  constructor() {
    window.addEventListener('online', () => this.flushOfflineQueue());
    this.loadOfflineQueue();
  }
  
  private loadOfflineQueue() {
    const stored = localStorage.getItem('offline_analytics');
    if (stored) {
      this.offlineQueue = JSON.parse(stored);
    }
  }
  
  private saveOfflineQueue() {
    localStorage.setItem('offline_analytics', JSON.stringify(this.offlineQueue));
  }
  
  async track(event: AnalyticsEvent) {
    if (!navigator.onLine) {
      this.offlineQueue.push(event);
      this.saveOfflineQueue();
      return;
    }
    
    try {
      await supabase.from('analytics_events').insert(event);
    } catch (error) {
      // Queue for retry
      this.offlineQueue.push(event);
      this.saveOfflineQueue();
    }
  }
  
  private async flushOfflineQueue() {
    const events = [...this.offlineQueue];
    this.offlineQueue = [];
    localStorage.removeItem('offline_analytics');
    
    for (const event of events) {
      await this.track(event);
    }
  }
}
```

## 8. Maintainability

| ID | Issue | Recommendation |
|----|-------|----------------|
| MAINT-ANA-001 | Duplicate code | Merge analytics.ts and useAnalytics.ts |
| MAINT-ANA-002 | Event names as strings | Use constants/enums |
| MAINT-ANA-003 | No documentation | Document event schema |
| MAINT-ANA-004 | No type generation | Generate types from DB schema |
| MAINT-ANA-005 | Scattered tracking calls | Centralize tracking logic |

### Suggested Refactoring
```typescript
// Proposed structure
src/
  features/analytics/
    types.ts              // Event types and schemas
    constants.ts          // Event names, sampling rates
    hooks/
      useAnalytics.ts     // Main hook
      usePageTracking.ts  // Auto page tracking
    services/
      analyticsService.ts // Core tracking logic
      batcher.ts          // Event batching
      offline.ts          // Offline support
    providers/
      AnalyticsProvider.tsx // Context provider

// Type-safe event tracking
type PaymentEvent = {
  type: 'payment_initiated' | 'payment_completed' | 'payment_failed';
  data: {
    payment_id: string;
    amount: number;
    payment_method?: string;
    error?: string;
  };
};

type OrderEvent = {
  type: 'order_placed' | 'order_completed' | 'order_cancelled';
  data: {
    order_id: string;
    product_id?: string;
    amount?: number;
    cancel_reason?: string;
  };
};

type AnalyticsEvent = PaymentEvent | OrderEvent | ...;

// Type-safe tracking
const trackPayment = (event: PaymentEvent) => analytics.track(event);
```

## 9. Compatibility & Environment

| ID | Issue | Recommendation |
|----|-------|----------------|
| COMP-ANA-001 | SessionStorage not available | Add fallback for private mode |
| COMP-ANA-002 | crypto.randomUUID support | Add polyfill for older browsers |
| COMP-ANA-003 | No server-side tracking | Add edge function for SSR |
| COMP-ANA-004 | Ad blockers | Handle tracking failures gracefully |

### Browser Compatibility
```typescript
// UUID polyfill
const generateUUID = (): string => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for older browsers
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

// Storage fallback
const getSessionId = (): string => {
  try {
    let sessionId = sessionStorage.getItem('analytics_session_id');
    if (!sessionId) {
      sessionId = generateUUID();
      sessionStorage.setItem('analytics_session_id', sessionId);
    }
    return sessionId;
  } catch {
    // Private mode or storage blocked
    return generateUUID();
  }
};
```

## Summary

| Severity | Count |
|----------|-------|
| 🔴 Critical | 6 |
| 🟡 Warning | 8 |
| 🔵 Info | 6 |

## Recommended Actions (Priority Order)

1. **[CRITICAL]** Add consent management untuk privacy compliance
2. **[CRITICAL]** Implement PII filtering di event data
3. **[CRITICAL]** Add rate limiting per session
4. **[HIGH]** Implement event batching untuk performance
5. **[HIGH]** Cache user ID instead of fetching every event
6. **[HIGH]** Add offline support dengan local storage queue
7. **[MEDIUM]** Use enum/constants untuk event types
8. **[MEDIUM]** Add data retention policy
9. **[LOW]** Merge duplicate analytics files
10. **[LOW]** Add browser compatibility polyfills
