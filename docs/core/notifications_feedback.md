# Notifications - Feedback

## 1. Bugs & Errors

### 🔴 Critical
| ID | Issue | Location | Description |
|----|-------|----------|-------------|
| BUG-NOT-001 | WhatsApp mock not production ready | `whatsapp-notification/index.ts` | Mock implementation tidak kirim notifikasi real |
| BUG-NOT-002 | Email fails silently | `send-notification/index.ts` | Jika RESEND_API_KEY missing, error tidak di-handle properly |
| BUG-NOT-003 | No retry mechanism | `send-notification/index.ts` | Failed emails tidak di-retry |

### 🟡 Warning
| ID | Issue | Location | Description |
|----|-------|----------|-------------|
| BUG-NOT-004 | Realtime subscription leak | `NotificationsDropdown.tsx:53-75` | Channel not properly cleaned up on unmount in some cases |
| BUG-NOT-005 | Query limit hardcoded | `NotificationsDropdown.tsx:45` | `.limit(20)` might miss notifications |
| BUG-NOT-006 | Notification type null | `Notification` interface | Type bisa null, tidak ter-handle |

## 2. Validations

### Current Implementation
```typescript
// send-notification/index.ts - No input validation
interface NotificationRequest {
  type: "invoice" | "payment_reminder" | ... // ✅ Type restricted
  recipientEmail: string; // ❌ Not validated
  recipientName: string;  // ❌ Not validated
  data: Record<string, any>; // ❌ Not validated
}
```

### Missing Validations
| ID | Field | Issue | Recommendation |
|----|-------|-------|----------------|
| VAL-NOT-001 | recipientEmail | Format not validated | Use zod email validation |
| VAL-NOT-002 | recipientName | Length not checked | Max 100 chars |
| VAL-NOT-003 | data | Structure not validated | Define per-type schemas |
| VAL-NOT-004 | type | Enum not exhaustive | Ensure all types handled |
| VAL-NOT-005 | link | URL format not validated | Validate relative/absolute URL |

### Recommended Validation
```typescript
import { z } from 'zod';

const notificationSchema = z.object({
  type: z.enum([
    'invoice', 'payment_reminder', 'maintenance_update',
    'subscription_upgrade', 'payment_receipt', // ... etc
  ]),
  recipientEmail: z.string().email('Invalid email'),
  recipientName: z.string().min(1).max(100),
  subject: z.string().max(200).optional(),
  data: z.record(z.unknown()),
});

// Type-specific data validation
const invoiceDataSchema = z.object({
  invoiceNumber: z.string(),
  merchantName: z.string(),
  amount: z.number().positive(),
  dueDate: z.string(),
  paymentLink: z.string().url().optional(),
});
```

## 3. UX & Flow Pengguna

### Issues
| ID | Issue | Severity | Recommendation |
|----|-------|----------|----------------|
| UX-NOT-001 | English labels | Low | "Notifications" → "Notifikasi" |
| UX-NOT-002 | No notification sound | Medium | Add audio alert for new notifications |
| UX-NOT-003 | No notification settings link | Medium | Add link to preferences |
| UX-NOT-004 | No filter/search | Low | Add filter by type |
| UX-NOT-005 | No bulk actions | Low | Select multiple to mark read/delete |
| UX-NOT-006 | Truncated message | Low | Allow expand to full message |
| UX-NOT-007 | No push notifications | High | Implement web push |

### Flow Issues
1. **New notification** - No toast/popup for new notifications
2. **Unread count** - "9+" limit might confuse users
3. **Old notifications** - No way to load more than 20

### Recommended UX Improvements
```typescript
// Add notification toast for new notifications
useEffect(() => {
  const channel = supabase
    .channel('notifications-toast')
    .on('postgres_changes', { ... }, (payload) => {
      // Show toast for new notification
      toast({
        title: payload.new.title,
        description: payload.new.message,
        action: <Button onClick={() => navigate(payload.new.link)}>View</Button>,
      });
      
      // Play sound if user preference allows
      if (userPreferences.notificationSound) {
        playNotificationSound();
      }
    })
    .subscribe();
}, []);
```

## 4. Performance

| ID | Issue | Impact | Recommendation |
|----|-------|--------|----------------|
| PERF-NOT-001 | Email template inline | Medium | Pre-compile templates |
| PERF-NOT-002 | No notification batching | High | Batch similar notifications |
| PERF-NOT-003 | Full re-fetch on new | Low | Optimistic update |
| PERF-NOT-004 | Large email templates | Medium | Minify HTML templates |
| PERF-NOT-005 | No pagination | Medium | Implement infinite scroll |

### Performance Optimization
```typescript
// Batch notifications
const batchNotifications = async (notifications: NotificationRequest[]) => {
  const grouped = groupBy(notifications, 'type');
  
  // Send digest email instead of individual emails
  for (const [type, items] of Object.entries(grouped)) {
    if (items.length > 3) {
      await sendDigestEmail(type, items);
    } else {
      await Promise.all(items.map(sendNotification));
    }
  }
};

// Optimistic update
const markAsRead = useMutation({
  mutationFn: async (id) => {
    await supabase.from('notifications').update({ read: true }).eq('id', id);
  },
  onMutate: (id) => {
    queryClient.setQueryData(['notifications'], (old) =>
      old?.map(n => n.id === id ? { ...n, read: true } : n)
    );
  },
});
```

## 5. Security

### 🔴 Critical
| ID | Issue | Risk | Recommendation |
|----|-------|------|----------------|
| SEC-NOT-001 | No email spoofing protection | High | Use verified sender domain |
| SEC-NOT-002 | User can mark any notification | Medium | RLS policy for user_id check |
| SEC-NOT-003 | HTML injection in templates | High | Escape user content in emails |
| SEC-NOT-004 | Link injection | Medium | Validate notification links |

### 🟡 Warning
| ID | Issue | Risk | Recommendation |
|----|-------|------|----------------|
| SEC-NOT-005 | No rate limit on notifications | Medium | Limit notifications per user/hour |
| SEC-NOT-006 | Sensitive data in email | Medium | Mask account numbers, etc |
| SEC-NOT-007 | Unsubscribe not implemented | Low | Add unsubscribe mechanism |

### Security Improvements
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
  // Only allow internal paths
  return link.startsWith('/') && !link.includes('//');
};
```

## 6. Consistency & Data Integrity

| ID | Issue | Impact | Recommendation |
|----|-------|--------|----------------|
| DATA-NOT-001 | Notification without user check | High | Verify user exists before insert |
| DATA-NOT-002 | No duplicate prevention | Medium | Check existing similar notification |
| DATA-NOT-003 | Orphan notifications | Low | Cascade delete on user delete |
| DATA-NOT-004 | Email log not stored | Medium | Log sent emails for audit |

### Data Integrity Improvements
```sql
-- Add constraint for valid links
ALTER TABLE notifications ADD CONSTRAINT valid_link 
CHECK (link IS NULL OR link ~ '^/[a-z]');

-- Add index for faster queries
CREATE INDEX idx_notifications_user_unread 
ON notifications(user_id) WHERE read = false;

-- Add email log table
CREATE TABLE notification_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_id UUID REFERENCES notifications(id),
  channel VARCHAR(20) NOT NULL, -- 'email', 'whatsapp', 'push'
  status VARCHAR(20) NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  retry_count INTEGER DEFAULT 0
);
```

## 7. Error Handling & Observability

### Current State
```typescript
// send-notification/index.ts - Basic error handling
if (!res.ok) {
  const error = await res.json();
  console.error("Failed to send email:", error);
  throw new Error(`Failed to send email: ${JSON.stringify(error)}`);
}
```

### Issues
| ID | Issue | Recommendation |
|----|-------|----------------|
| ERR-NOT-001 | No structured logging | Add log levels and context |
| ERR-NOT-002 | Email failures not tracked | Store failed sends in DB |
| ERR-NOT-003 | No alerting | Alert on high failure rate |
| ERR-NOT-004 | Silent WhatsApp failures | Log mock status clearly |
| ERR-NOT-005 | No delivery confirmation | Track email opens/clicks |

### Improved Error Handling
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
    stack: error.stack,
    context,
    timestamp: new Date().toISOString(),
  });
  
  // Store in notification_logs table
  await supabase.from('notification_logs').insert({
    channel: 'email',
    status: 'failed',
    error_message: error.message,
  });
};
```

## 8. Maintainability

| ID | Issue | Recommendation |
|----|-------|----------------|
| MAINT-NOT-001 | Huge edge function (1000+ lines) | Split by notification type |
| MAINT-NOT-002 | Inline HTML templates | Use template files |
| MAINT-NOT-003 | No template engine | Consider MJML or similar |
| MAINT-NOT-004 | Duplicate color/style values | Centralize design tokens |
| MAINT-NOT-005 | No template preview | Add preview endpoint |

### Suggested Refactoring
```typescript
// Proposed structure
supabase/functions/
  send-notification/
    index.ts              // Main handler
    templates/
      base.ts             // Base template
      invoice.ts          // Invoice template
      payment-reminder.ts // Reminder template
      // ... etc
    utils/
      formatters.ts       // Currency, date formatters
      validators.ts       // Input validation
      html-escape.ts      // Security utilities
    
  notification-worker/
    index.ts              // Background worker for retries
```

### Template Engine Example
```typescript
// Use MJML for responsive emails
import mjml2html from 'mjml';

const template = `
<mjml>
  <mj-body>
    <mj-section>
      <mj-column>
        <mj-text>Hello {{recipientName}}!</mj-text>
      </mj-column>
    </mj-section>
  </mj-body>
</mjml>
`;

const html = mjml2html(
  template.replace('{{recipientName}}', escapeHtml(recipientName))
).html;
```

## 9. Compatibility & Environment

| ID | Issue | Recommendation |
|----|-------|----------------|
| COMP-NOT-001 | Email client rendering | Test across email clients |
| COMP-NOT-002 | Dark mode emails | Add dark mode styles |
| COMP-NOT-003 | Mobile email layout | Test responsive design |
| COMP-NOT-004 | Image hosting | Use CDN for email images |
| COMP-NOT-005 | Unsubscribe link missing | Add list-unsubscribe header |

### Email Best Practices
```typescript
// Add email headers for better deliverability
const emailHeaders = {
  'List-Unsubscribe': `<mailto:unsubscribe@sihuni.com?subject=Unsubscribe>`,
  'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
  'X-Priority': '3',
  'X-Mailer': 'SiHuni Notification System',
};
```

## Summary

| Severity | Count |
|----------|-------|
| 🔴 Critical | 6 |
| 🟡 Warning | 9 |
| 🔵 Info | 7 |

## Recommended Actions (Priority Order)

1. **[CRITICAL]** Implement real WhatsApp integration atau remove mock
2. **[CRITICAL]** Add HTML escaping untuk user content di email
3. **[CRITICAL]** Add retry mechanism untuk failed emails
4. **[HIGH]** Add input validation untuk notification requests
5. **[HIGH]** Implement web push notifications
6. **[HIGH]** Split large edge function into modules
7. **[MEDIUM]** Add email delivery logging
8. **[MEDIUM]** Translate UI labels ke Indonesian
9. **[LOW]** Add notification sound option
10. **[LOW]** Implement infinite scroll untuk old notifications
