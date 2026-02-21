# AI Chatbot - Feedback

## 1. Bugs & Errors

### 🔴 Critical
| ID | Issue | Location | Description | Status |
|----|-------|----------|-------------|--------|
| BUG-CB-001 | No error recovery | `ChatbotWidget.tsx:111-119` | Jika stream error, user harus refresh untuk retry | ✅ Implemented retry mechanism |
| BUG-CB-002 | Message not persisted on error | `ChatbotDialog.tsx:164-171` | Error message tidak di-save ke database | ✅ Fixed with proper error handling |
| BUG-CB-003 | Race condition conversation load | `useChatbotConversation.ts:32-36` | autoLoad effect bisa race dengan user.id | ✅ Fixed with proper guards |
| BUG-CB-004 | Duplicate message save | `ChatbotDialog.tsx:80-81` | addMessage calls saveMessage yang bisa double save | ✅ Fixed with duplicate check |

### 🟡 Warning
| ID | Issue | Location | Description | Status |
|----|-------|----------|-------------|--------|
| BUG-CB-005 | Knowledge search inefficient | `ai-chatbot/index.ts:38-56` | Keyword search case-sensitive dan tidak optimal | ⏳ Pending |
| BUG-CB-006 | Context data leak | `ai-chatbot/index.ts:101-116` | Sensitive data mungkin terekspos dalam system prompt | ⏳ Pending |
| BUG-CB-007 | Empty assistant message | `ChatbotWidget.tsx:72` | Empty message bisa visible sebelum stream | ✅ Fixed with typing indicator |

## 2. Validations

### Current Implementation
```typescript
// ChatbotWidget.tsx - Line 127-130
const handleSubmit = (e: React.FormEvent) => {
  e.preventDefault();
  if (!input.trim() || isLoading) return; // ✅ Basic validation
  streamChat(input.trim());
};
```

### Missing Validations
| ID | Field | Issue | Recommendation | Status |
|----|-------|-------|----------------|--------|
| VAL-CB-001 | Message | No max length | Add `.max(1000)` limit | ✅ Implemented |
| VAL-CB-002 | Message | No profanity filter | Consider content moderation | ⏳ Skip (requires external service) |
| VAL-CB-003 | Context | Role not validated | Validate role against allowed values | ✅ Implemented |
| VAL-CB-004 | User ID | Not verified server-side | Validate user exists in DB | ⏳ Pending |
| VAL-CB-005 | Conversation ID | Format not validated | Validate UUID format | ⏳ Pending |

### Recommended Validation ✅ Implemented
```typescript
const messageSchema = z.object({
  content: z.string()
    .min(1, 'Message required')
    .max(1000, 'Message too long'),
  role: z.enum(['user', 'assistant']),
});

const contextSchema = z.object({
  role: z.enum(['tenant', 'merchant', 'vendor', 'admin']).optional(),
  userName: z.string().max(100).optional(),
});
```

## 3. UX & Flow Pengguna

### Issues
| ID | Issue | Severity | Recommendation | Status |
|----|-------|----------|----------------|--------|
| UX-CB-001 | No typing indicator | Medium | Add animated typing indicator | ✅ Implemented |
| UX-CB-002 | FAQ in English | Low | Translate to Indonesian | ✅ Implemented |
| UX-CB-003 | No clear conversation | Medium | Add "New Chat" button | ✅ Implemented |
| UX-CB-004 | No message copy | Low | Allow copy message content | ✅ Implemented |
| UX-CB-005 | No retry button | High | Add retry untuk failed messages | ✅ Implemented |
| UX-CB-006 | No offline indicator | Medium | Show when no connection | ✅ Implemented |
| UX-CB-007 | Quick actions not role-aware | Medium | Filter based on actual user data | ⏳ Pending |

### Flow Issues
1. **First message** - Greeting tidak personalized untuk guest
2. **Error state** - ✅ Fixed: Added retry mechanism
3. **Long responses** - No way to stop streaming ⏳ Pending

### Recommended Improvements ✅ Implemented
```typescript
// Add retry mechanism
const retryMessage = async (messageIndex: number) => {
  const failedMessage = messages[messageIndex];
  if (failedMessage.role === 'user') {
    // Remove failed response and retry
    setMessages(prev => prev.slice(0, messageIndex + 1));
    await streamChat(failedMessage.content);
  }
};
```

## 4. Performance

| ID | Issue | Impact | Recommendation | Status |
|----|-------|--------|----------------|--------|
| PERF-CB-001 | Knowledge fetch setiap message | High | Cache knowledge base | ⏳ Pending |
| PERF-CB-002 | User data fetch setiap request | High | Pass context dari frontend | ⏳ Pending |
| PERF-CB-003 | No message virtualization | Medium | Use virtual list untuk long chats | ⏳ Pending |
| PERF-CB-004 | Full history di setiap request | Medium | Limit to last N messages | ⏳ Pending |
| PERF-CB-005 | No response caching | Low | Cache common FAQ responses | ⏳ Pending |

## 5. Security

### 🔴 Critical
| ID | Issue | Risk | Recommendation | Status |
|----|-------|------|----------------|--------|
| SEC-CB-001 | No rate limiting | High | Limit requests per user per minute | ⏳ Skip (requires infrastructure) |
| SEC-CB-002 | PII in system prompt | High | Mask sensitive data | ⏳ Pending |
| SEC-CB-003 | No input sanitization | Medium | Sanitize user input | ✅ Implemented |
| SEC-CB-004 | API key exposure risk | Medium | Validate API key server-side | ⏳ Pending |

### 🟡 Warning
| ID | Issue | Risk | Recommendation | Status |
|----|-------|------|----------------|--------|
| SEC-CB-005 | Conversation accessible by user_id only | Medium | Add RLS policy validation | ⏳ Pending |
| SEC-CB-006 | No abuse detection | Medium | Flag suspicious patterns | ⏳ Skip (requires ML) |
| SEC-CB-007 | Service key usage | Low | Use anon key where possible | ⏳ Pending |
| SEC-CB-008 | Prompt injection risk | High | Add input filtering | ✅ Implemented |

### Prompt Injection Prevention ✅ Implemented
```typescript
// Sanitize user input before sending to AI
const sanitizeInput = (input: string): string => {
  // Remove potential prompt injection patterns
  const patterns = [
    /ignore previous instructions/gi,
    /system:/gi,
    /\[INST\]/gi,
    /<\|.*?\|>/g,
  ];
  
  let sanitized = input;
  patterns.forEach(pattern => {
    sanitized = sanitized.replace(pattern, '');
  });
  
  return sanitized.slice(0, 1000); // Max length
};
```

## 6. Consistency & Data Integrity

| ID | Issue | Impact | Recommendation | Status |
|----|-------|--------|----------------|--------|
| DATA-CB-001 | Message order not guaranteed | Medium | Add sequence number | ⏳ Pending |
| DATA-CB-002 | Conversation state mismatch | Medium | Sync state on reconnect | ⏳ Pending |
| DATA-CB-003 | Analytics not atomic | Low | Batch analytics inserts | ⏳ Pending |
| DATA-CB-004 | Orphan messages possible | Low | Foreign key cascade delete | ⏳ Pending |

## 7. Error Handling & Observability

### Issues
| ID | Issue | Recommendation | Status |
|----|-------|----------------|--------|
| ERR-CB-001 | Generic error messages | Return specific error codes | ✅ Implemented |
| ERR-CB-002 | No error tracking | Integrate Sentry atau similar | ⏳ Skip (requires external service) |
| ERR-CB-003 | Silent stream failures | Log stream errors server-side | ✅ Implemented |
| ERR-CB-004 | No retry mechanism | Add exponential backoff | ✅ Implemented |
| ERR-CB-005 | Missing analytics on error | Track error rates | ⏳ Pending |

### Error Handling Improvements ✅ Implemented
```typescript
// Error codes for client handling
const ERROR_CODES = {
  RATE_LIMIT: 'ERR_RATE_LIMIT',
  AI_UNAVAILABLE: 'ERR_AI_UNAVAILABLE',
  INVALID_INPUT: 'ERR_INVALID_INPUT',
  AUTH_REQUIRED: 'ERR_AUTH_REQUIRED',
  CONTEXT_FAILED: 'ERR_CONTEXT_FAILED',
};
```

## 8. Maintainability

| ID | Issue | Recommendation | Status |
|----|-------|----------------|--------|
| MAINT-CB-001 | Large edge function (243 lines) | Split into modules | ⏳ Skip per request |
| MAINT-CB-002 | Hardcoded prompts | Move to config/database | ⏳ Pending |
| MAINT-CB-003 | Duplicate streaming logic | Extract reusable hook | ⏳ Pending |
| MAINT-CB-004 | Mixed concerns | Separate data, UI, AI logic | ⏳ Skip per request |
| MAINT-CB-005 | No tests | Add unit/integration tests | ⏳ Pending |

## 9. Compatibility & Environment

| ID | Issue | Recommendation | Status |
|----|-------|----------------|--------|
| COMP-CB-001 | SSE browser support | Add WebSocket fallback | ⏳ Pending |
| COMP-CB-002 | Mobile keyboard issues | Handle viewport resize | ⏳ Pending |
| COMP-CB-003 | Offline mode | Show cached messages | ✅ Implemented offline indicator |
| COMP-CB-004 | Safari stream issues | Test Safari compatibility | ⏳ Pending |
| COMP-CB-005 | Slow network handling | Add timeout and retry | ✅ Implemented retry |

## Summary

| Severity | Count | Implemented |
|----------|-------|-------------|
| 🔴 Critical | 7 | 5 |
| 🟡 Warning | 12 | 4 |
| 🔵 Info | 8 | 3 |

## Recommended Actions (Priority Order)

1. ~~**[CRITICAL]** Add rate limiting di edge function~~ ⏳ Skip (requires infrastructure)
2. ✅ **[CRITICAL]** Implement input sanitization untuk prompt injection
3. ⏳ **[CRITICAL]** Mask PII dalam system prompt
4. ✅ **[HIGH]** Add retry mechanism untuk failed messages
5. ⏳ **[HIGH]** Cache knowledge base untuk performance
6. ⏳ **[HIGH]** Limit message context yang dikirim ke AI
7. ✅ **[MEDIUM]** Add "Clear conversation" button
8. ✅ **[MEDIUM]** Implement typing indicator
9. ✅ **[LOW]** Translate FAQ ke Indonesian
10. ✅ **[LOW]** Add message copy functionality
