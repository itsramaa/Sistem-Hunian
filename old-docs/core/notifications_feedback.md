# Notifications - Feedback

## 1. Bugs & Errors

### 🔴 Critical
| ID | Issue | Location | Description | Status |
|----|-------|----------|-------------|--------|
| BUG-NOT-001 | WhatsApp mock not production ready | `whatsapp-notification/index.ts` | Mock implementation tidak kirim notifikasi real | ⏳ Pending (requires Twilio/WhatsApp Business API) |
| BUG-NOT-002 | Email fails silently | `send-notification/index.ts` | Jika RESEND_API_KEY missing, error tidak di-handle properly | ✅ Fixed with proper error handling |
| BUG-NOT-003 | No retry mechanism | `send-notification/index.ts` | Failed emails tidak di-retry | ⏳ Pending (requires queue system) |

### 🟡 Warning
| ID | Issue | Location | Description | Status |
|----|-------|----------|-------------|--------|
| BUG-NOT-004 | Realtime subscription leak | `NotificationsDropdown.tsx:53-75` | Channel not properly cleaned up on unmount in some cases | ✅ Fixed with proper cleanup |
| BUG-NOT-005 | Query limit hardcoded | `NotificationsDropdown.tsx:45` | `.limit(20)` might miss notifications | ✅ Made configurable with pagination |
| BUG-NOT-006 | Notification type null | `Notification` interface | Type bisa null, tidak ter-handle | ✅ Fixed with null check |

## 2. Validations

### Missing Validations
| ID | Field | Issue | Recommendation | Status |
|----|-------|-------|----------------|--------|
| VAL-NOT-001 | recipientEmail | Format not validated | Use zod email validation | ✅ Implemented |
| VAL-NOT-002 | recipientName | Length not checked | Max 100 chars | ✅ Implemented |
| VAL-NOT-003 | data | Structure not validated | Define per-type schemas | ⏳ Pending |
| VAL-NOT-004 | type | Enum not exhaustive | Ensure all types handled | ⏳ Pending |
| VAL-NOT-005 | link | URL format not validated | Validate relative/absolute URL | ✅ Implemented |

### Recommended Validation ✅ Partially Implemented
```typescript
import { z } from 'zod';

const notificationSchema = z.object({
  type: z.enum([...]),
  recipientEmail: z.string().email('Invalid email'),
  recipientName: z.string().min(1).max(100),
  subject: z.string().max(200).optional(),
  data: z.record(z.unknown()),
});
```

## 3. UX & Flow Pengguna

### Issues
| ID | Issue | Severity | Recommendation | Status |
|----|-------|----------|----------------|--------|
| UX-NOT-001 | English labels | Low | "Notifications" → "Notifikasi" | ✅ Translated |
| UX-NOT-002 | No notification sound | Medium | Add audio alert for new notifications | ✅ Implemented |
| UX-NOT-003 | No notification settings link | Medium | Add link to preferences | ✅ Added |
| UX-NOT-004 | No filter/search | Low | Add filter by type | ⏳ Pending |
| UX-NOT-005 | No bulk actions | Low | Select multiple to mark read/delete | ⏳ Pending |
| UX-NOT-006 | Truncated message | Low | Allow expand to full message | ✅ Implemented |
| UX-NOT-007 | No push notifications | High | Implement web push | ⏳ Pending (requires service worker) |

### Flow Issues
1. **New notification** - ⏳ No toast/popup for new notifications
2. **Unread count** - "9+" limit might confuse users ⏳ Pending
3. **Old notifications** - ✅ Pagination implemented

## 4. Performance

| ID | Issue | Impact | Recommendation | Status |
|----|-------|--------|----------------|--------|
| PERF-NOT-001 | Email template inline | Medium | Pre-compile templates | ⏳ Pending |
| PERF-NOT-002 | No notification batching | High | Batch similar notifications | ⏳ Pending |
| PERF-NOT-003 | Full re-fetch on new | Low | Optimistic update | ✅ Implemented |
| PERF-NOT-004 | Large email templates | Medium | Minify HTML templates | ⏳ Pending |
| PERF-NOT-005 | No pagination | Medium | Implement infinite scroll | ✅ Implemented pagination |

## 5. Security

### 🔴 Critical
| ID | Issue | Risk | Recommendation | Status |
|----|-------|------|----------------|--------|
| SEC-NOT-001 | No email spoofing protection | High | Use verified sender domain | ⏳ Pending (requires DNS config) |
| SEC-NOT-002 | User can mark any notification | Medium | RLS policy for user_id check | ⏳ Pending |
| SEC-NOT-003 | HTML injection in templates | High | Escape user content in emails | ✅ Implemented |
| SEC-NOT-004 | Link injection | Medium | Validate notification links | ✅ Implemented |

### 🟡 Warning
| ID | Issue | Risk | Recommendation | Status |
|----|-------|------|----------------|--------|
| SEC-NOT-005 | No rate limit on notifications | Medium | Limit notifications per user/hour | ⏳ Skip (requires infrastructure) |
| SEC-NOT-006 | Sensitive data in email | Medium | Mask account numbers, etc | ⏳ Pending |
| SEC-NOT-007 | Unsubscribe not implemented | Low | Add unsubscribe mechanism | ⏳ Pending |

### Security Improvements ✅ Implemented
```typescript
// Escape HTML in user content
const escapeHtml = (str: string): string => {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return str.replace(/[&<>"']/g, m => map[m]);
};

// Validate internal links only
const isValidNotificationLink = (link: string): boolean => {
  if (!link) return true;
  return link.startsWith('/') && !link.includes('//');
};
```

## 6. Consistency & Data Integrity

| ID | Issue | Impact | Recommendation | Status |
|----|-------|--------|----------------|--------|
| DATA-NOT-001 | Notification without user check | High | Verify user exists before insert | ⏳ Pending |
| DATA-NOT-002 | No duplicate prevention | Medium | Check existing similar notification | ⏳ Pending |
| DATA-NOT-003 | Orphan notifications | Low | Cascade delete on user delete | ⏳ Pending |
| DATA-NOT-004 | Email log not stored | Medium | Log sent emails for audit | ⏳ Pending |

## 7. Error Handling & Observability

### Issues
| ID | Issue | Recommendation | Status |
|----|-------|----------------|--------|
| ERR-NOT-001 | No structured logging | Add log levels and context | ✅ Implemented |
| ERR-NOT-002 | Email failures not tracked | Store failed sends in DB | ⏳ Pending |
| ERR-NOT-003 | No alerting | Alert on high failure rate | ⏳ Pending |
| ERR-NOT-004 | Silent WhatsApp failures | Log mock status clearly | ⏳ Pending |
| ERR-NOT-005 | No delivery confirmation | Track email opens/clicks | ⏳ Pending |

### Improved Error Handling ✅ Implemented
```typescript
// Structured error logging
const logNotificationError = async (
  type: string,
  recipient: string,
  error: Error,
  context: Record<string, any>
) => {
  console.error({
    event: 'notification_failed',
    type,
    recipient: maskEmail(recipient),
    error: error.message,
    timestamp: new Date().toISOString(),
  });
};
```

## 8. Maintainability

| ID | Issue | Recommendation | Status |
|----|-------|----------------|--------|
| MAINT-NOT-001 | Huge edge function (1000+ lines) | Split by notification type | ⏳ Skip per request |
| MAINT-NOT-002 | Inline HTML templates | Use template files | ⏳ Pending |
| MAINT-NOT-003 | No template engine | Consider MJML or similar | ⏳ Pending |
| MAINT-NOT-004 | Duplicate color/style values | Centralize design tokens | ⏳ Pending |
| MAINT-NOT-005 | No template preview | Add preview endpoint | ⏳ Pending |

## 9. Compatibility & Environment

| ID | Issue | Recommendation | Status |
|----|-------|----------------|--------|
| COMP-NOT-001 | Email client rendering | Test across email clients | ⏳ Pending |
| COMP-NOT-002 | Dark mode emails | Add dark mode styles | ⏳ Pending |
| COMP-NOT-003 | Mobile email layout | Test responsive design | ⏳ Pending |
| COMP-NOT-004 | Image hosting | Use CDN for email images | ⏳ Pending |
| COMP-NOT-005 | Unsubscribe link missing | Add list-unsubscribe header | ✅ Implemented |

### Email Best Practices ✅ Implemented
```typescript
// Add email headers for better deliverability
const emailHeaders = {
  'List-Unsubscribe': `<mailto:unsubscribe@sihuni.com?subject=Unsubscribe>`,
  'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
};
```

## Summary

| Severity | Count | Implemented |
|----------|-------|-------------|
| 🔴 Critical | 6 | 3 |
| 🟡 Warning | 9 | 4 |
| 🔵 Info | 7 | 4 |

## Recommended Actions (Priority Order)

1. ⏳ **[CRITICAL]** Implement real WhatsApp integration atau remove mock
2. ✅ **[CRITICAL]** Add HTML escaping untuk user content di email
3. ⏳ **[CRITICAL]** Add retry mechanism untuk failed emails
4. ✅ **[HIGH]** Add input validation untuk notification requests
5. ⏳ **[HIGH]** Implement web push notifications
6. ⏳ ~~**[HIGH]** Split large edge function into modules~~ Skip per request
7. ⏳ **[MEDIUM]** Add email delivery logging
8. ✅ **[MEDIUM]** Translate UI labels ke Indonesian
9. ✅ **[LOW]** Add notification sound option
10. ✅ **[LOW]** Implement pagination untuk old notifications
