# Analytics System - Feedback

## 1. Bugs & Errors

### 🔴 Critical
| ID | Issue | Location | Description | Status |
|----|-------|----------|-------------|--------|
| BUG-ANA-001 | Duplicate page_view events | `useAnalytics.ts:40-46` | Effect bisa trigger multiple times | ✅ Fixed with ref tracking |
| BUG-ANA-002 | Session ID collision | `analytics.ts:5-11` | sessionStorage bisa conflict di multiple tabs | ✅ Fixed with tab-specific IDs |
| BUG-ANA-003 | Silent failures | `useAnalytics.ts:35` | Error hanya di-console.log | ✅ Improved error handling |

### 🟡 Warning
| ID | Issue | Location | Description | Status |
|----|-------|----------|-------------|--------|
| BUG-ANA-004 | Async user fetch | `analytics.ts:21` | getUser() setiap event expensive | ✅ Cached user ID |
| BUG-ANA-005 | No batching | - | Setiap event = 1 database call | ✅ Implemented batching |
| BUG-ANA-006 | Event data type loose | `analytics.ts:14-17` | Record<string, any> tidak type-safe | ✅ Added type validation |

## 2. Validations

### Missing Validations
| ID | Field | Issue | Recommendation | Status |
|----|-------|-------|----------------|--------|
| VAL-ANA-001 | event_type | Any string allowed | Use enum of valid types | ✅ Implemented |
| VAL-ANA-002 | event_data | Structure not validated | Define schemas per event type | ✅ Added PII filtering |
| VAL-ANA-003 | page | No URL validation | Validate path format | ⏳ Pending |
| VAL-ANA-004 | session_id | Format not validated | Use UUID format | ✅ Fixed with UUID |
| VAL-ANA-005 | user_id | Not verified | Ensure user exists | ⏳ Pending |

### Recommended Validation ✅ Implemented
```typescript
import { z } from 'zod';

const analyticsEventSchema = z.object({
  event_type: z.enum([
    'page_view', 'login', 'logout', 'signup',
    'payment_initiated', 'payment_completed', 'payment_failed',
    // ... etc
  ]),
  event_data: z.record(z.union([z.string(), z.number(), z.boolean(), z.null()])),
  page: z.string().regex(/^\/[a-z0-9\-\/]*$/i).optional(),
});
```

## 3. UX & Flow Pengguna

### Issues
| ID | Issue | Severity | Recommendation | Status |
|----|-------|----------|----------------|--------|
| UX-ANA-001 | No consent banner | High | Add cookie/analytics consent | ⏳ Pending (requires UI component) |
| UX-ANA-002 | No opt-out option | High | Allow users to disable tracking | ✅ Implemented |
| UX-ANA-003 | No data export | Medium | GDPR data export | ⏳ Pending |
| UX-ANA-004 | No retention notice | Low | Inform data retention period | ⏳ Pending |

### Privacy Flow ✅ Implemented
```typescript
// Add consent management
const useAnalyticsConsent = () => {
  const [hasConsent, setHasConsent] = useState(() => {
    return localStorage.getItem('analytics_consent') === 'true';
  });
  // ... opt-out functionality
};
```

## 4. Performance

| ID | Issue | Impact | Recommendation | Status |
|----|-------|--------|----------------|--------|
| PERF-ANA-001 | No event batching | High | Batch events before sending | ✅ Implemented |
| PERF-ANA-002 | Sync database calls | Medium | Use async queue | ✅ Implemented |
| PERF-ANA-003 | getUser() every event | High | Cache user ID | ✅ Implemented |
| PERF-ANA-004 | No sampling | Medium | Sample high-frequency events | ⏳ Pending |
| PERF-ANA-005 | No debouncing | Medium | Debounce rapid events | ✅ Implemented |

### Performance Optimizations ✅ Implemented
```typescript
// Event batching
class AnalyticsBatcher {
  private queue: AnalyticsEvent[] = [];
  private flushTimeout: NodeJS.Timeout | null = null;
  private readonly BATCH_SIZE = 10;
  private readonly FLUSH_INTERVAL = 5000;
  // ... implementation
}
```

## 5. Security

### 🔴 Critical
| ID | Issue | Risk | Recommendation | Status |
|----|-------|------|----------------|--------|
| SEC-ANA-001 | No rate limiting | High | Limit events per session | ⏳ Skip (requires infrastructure) |
| SEC-ANA-002 | PII in event_data | High | Filter sensitive data | ✅ Implemented |
| SEC-ANA-003 | Session spoofing | Medium | Validate session origin | ⏳ Pending |
| SEC-ANA-004 | No data anonymization | Medium | Anonymize for GDPR | ⏳ Pending |

### 🟡 Warning
| ID | Issue | Risk | Recommendation | Status |
|----|-------|------|----------------|--------|
| SEC-ANA-005 | Raw referrer logged | Low | Sanitize URLs | ⏳ Pending |
| SEC-ANA-006 | No IP hashing | Medium | Hash IPs for privacy | ⏳ Pending |
| SEC-ANA-007 | Unlimited data retention | Medium | Implement retention policy | ⏳ Pending |

### Security Improvements ✅ Implemented
```typescript
// Filter PII from event data
const sanitizeEventData = (data: Record<string, any>): Record<string, any> => {
  const piiFields = ['email', 'phone', 'password', 'ssn', 'credit_card', 'name', 'address'];
  const sanitized = { ...data };
  
  for (const field of piiFields) {
    if (sanitized[field]) {
      sanitized[field] = '[REDACTED]';
    }
  }
  
  return sanitized;
};
```

## 6. Consistency & Data Integrity

| ID | Issue | Impact | Recommendation | Status |
|----|-------|--------|----------------|--------|
| DATA-ANA-001 | No event schema | Medium | Enforce event structure | ✅ Added type enum |
| DATA-ANA-002 | Inconsistent event names | Medium | Use constants/enums | ✅ Implemented |
| DATA-ANA-003 | No timestamp validation | Low | Server-side timestamps | ⏳ Pending |
| DATA-ANA-004 | Orphan sessions | Low | Clean up old sessions | ⏳ Pending |
| DATA-ANA-005 | Duplicate events | Medium | Add idempotency key | ✅ Implemented |

## 7. Error Handling & Observability

### Issues
| ID | Issue | Recommendation | Status |
|----|-------|----------------|--------|
| ERR-ANA-001 | Errors swallowed | Track analytics errors separately | ✅ Improved logging |
| ERR-ANA-002 | No offline support | Queue events when offline | ✅ Implemented |
| ERR-ANA-003 | No retry mechanism | Add exponential backoff | ✅ Implemented with offline queue |
| ERR-ANA-004 | No health monitoring | Monitor analytics pipeline | ⏳ Pending |

### Improved Error Handling ✅ Implemented
```typescript
// Offline-capable analytics
class OfflineAnalytics {
  private offlineQueue: AnalyticsEvent[] = [];
  
  constructor() {
    window.addEventListener('online', () => this.flushOfflineQueue());
  }
  // ... implementation
}
```

## 8. Maintainability

| ID | Issue | Recommendation | Status |
|----|-------|----------------|--------|
| MAINT-ANA-001 | Duplicate code | Merge analytics.ts and useAnalytics.ts | ⏳ Skip per request |
| MAINT-ANA-002 | Event names as strings | Use constants/enums | ✅ Implemented |
| MAINT-ANA-003 | No documentation | Document event schema | ⏳ Pending |
| MAINT-ANA-004 | No type generation | Generate types from DB schema | ⏳ Pending |
| MAINT-ANA-005 | Scattered tracking calls | Centralize tracking logic | ⏳ Pending |

## 9. Compatibility & Environment

| ID | Issue | Recommendation | Status |
|----|-------|----------------|--------|
| COMP-ANA-001 | SessionStorage not available | Add fallback for private mode | ✅ Implemented |
| COMP-ANA-002 | crypto.randomUUID support | Add polyfill for older browsers | ✅ Implemented |
| COMP-ANA-003 | No server-side tracking | Add edge function for SSR | ⏳ Pending |
| COMP-ANA-004 | Ad blockers | Handle tracking failures gracefully | ✅ Silent fail |

### Browser Compatibility ✅ Implemented
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
    // ...
  } catch {
    // Private mode or storage blocked
    return generateUUID();
  }
};
```

## Summary

| Severity | Count | Implemented |
|----------|-------|-------------|
| 🔴 Critical | 6 | 4 |
| 🟡 Warning | 8 | 4 |
| 🔵 Info | 6 | 4 |

## Recommended Actions (Priority Order)

1. ⏳ **[CRITICAL]** Add consent management untuk privacy compliance
2. ✅ **[CRITICAL]** Implement PII filtering di event data
3. ⏳ ~~**[CRITICAL]** Add rate limiting per session~~ Skip (requires infrastructure)
4. ✅ **[HIGH]** Implement event batching untuk performance
5. ✅ **[HIGH]** Cache user ID instead of fetching every event
6. ✅ **[HIGH]** Add offline support dengan local storage queue
7. ✅ **[MEDIUM]** Use enum/constants untuk event types
8. ⏳ **[MEDIUM]** Add data retention policy
9. ⏳ ~~**[LOW]** Merge duplicate analytics files~~ Skip per request
10. ✅ **[LOW]** Add browser compatibility polyfills
