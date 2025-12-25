# AI Chatbot - Feedback

## 1. Bugs & Errors

### 🔴 Critical
| ID | Issue | Location | Description |
|----|-------|----------|-------------|
| BUG-CB-001 | No error recovery | `ChatbotWidget.tsx:111-119` | Jika stream error, user harus refresh untuk retry |
| BUG-CB-002 | Message not persisted on error | `ChatbotDialog.tsx:164-171` | Error message tidak di-save ke database |
| BUG-CB-003 | Race condition conversation load | `useChatbotConversation.ts:32-36` | autoLoad effect bisa race dengan user.id |
| BUG-CB-004 | Duplicate message save | `ChatbotDialog.tsx:80-81` | addMessage calls saveMessage yang bisa double save |

### 🟡 Warning
| ID | Issue | Location | Description |
|----|-------|----------|-------------|
| BUG-CB-005 | Knowledge search inefficient | `ai-chatbot/index.ts:38-56` | Keyword search case-sensitive dan tidak optimal |
| BUG-CB-006 | Context data leak | `ai-chatbot/index.ts:101-116` | Sensitive data mungkin terekspos dalam system prompt |
| BUG-CB-007 | Empty assistant message | `ChatbotWidget.tsx:72` | Empty message bisa visible sebelum stream |

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
| ID | Field | Issue | Recommendation |
|----|-------|-------|----------------|
| VAL-CB-001 | Message | No max length | Add `.max(1000)` limit |
| VAL-CB-002 | Message | No profanity filter | Consider content moderation |
| VAL-CB-003 | Context | Role not validated | Validate role against allowed values |
| VAL-CB-004 | User ID | Not verified server-side | Validate user exists in DB |
| VAL-CB-005 | Conversation ID | Format not validated | Validate UUID format |

### Recommended Validation
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
| ID | Issue | Severity | Recommendation |
|----|-------|----------|----------------|
| UX-CB-001 | No typing indicator | Medium | Add animated typing indicator |
| UX-CB-002 | FAQ in English | Low | Translate to Indonesian |
| UX-CB-003 | No clear conversation | Medium | Add "New Chat" button |
| UX-CB-004 | No message copy | Low | Allow copy message content |
| UX-CB-005 | No retry button | High | Add retry untuk failed messages |
| UX-CB-006 | No offline indicator | Medium | Show when no connection |
| UX-CB-007 | Quick actions not role-aware | Medium | Filter based on actual user data |

### Flow Issues
1. **First message** - Greeting tidak personalized untuk guest
2. **Error state** - No way to recover from errors
3. **Long responses** - No way to stop streaming

### Recommended Improvements
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

// Add stop streaming
const stopStreaming = () => {
  if (abortController.current) {
    abortController.current.abort();
  }
};
```

## 4. Performance

| ID | Issue | Impact | Recommendation |
|----|-------|--------|----------------|
| PERF-CB-001 | Knowledge fetch setiap message | High | Cache knowledge base |
| PERF-CB-002 | User data fetch setiap request | High | Pass context dari frontend |
| PERF-CB-003 | No message virtualization | Medium | Use virtual list untuk long chats |
| PERF-CB-004 | Full history di setiap request | Medium | Limit to last N messages |
| PERF-CB-005 | No response caching | Low | Cache common FAQ responses |

### Optimization Recommendations
```typescript
// Limit message history for context
const maxContextMessages = 10;
const contextMessages = messages.slice(-maxContextMessages);

// Cache knowledge base (edge function)
const KNOWLEDGE_CACHE_TTL = 300; // 5 minutes
let knowledgeCache: { data: any; timestamp: number } | null = null;

const getKnowledge = async () => {
  if (knowledgeCache && Date.now() - knowledgeCache.timestamp < KNOWLEDGE_CACHE_TTL * 1000) {
    return knowledgeCache.data;
  }
  const { data } = await supabase.from('chatbot_knowledge').select('*');
  knowledgeCache = { data, timestamp: Date.now() };
  return data;
};
```

## 5. Security

### 🔴 Critical
| ID | Issue | Risk | Recommendation |
|----|-------|------|----------------|
| SEC-CB-001 | No rate limiting | High | Limit requests per user per minute |
| SEC-CB-002 | PII in system prompt | High | Mask sensitive data |
| SEC-CB-003 | No input sanitization | Medium | Sanitize user input |
| SEC-CB-004 | API key exposure risk | Medium | Validate API key server-side |

### 🟡 Warning
| ID | Issue | Risk | Recommendation |
|----|-------|------|----------------|
| SEC-CB-005 | Conversation accessible by user_id only | Medium | Add RLS policy validation |
| SEC-CB-006 | No abuse detection | Medium | Flag suspicious patterns |
| SEC-CB-007 | Service key usage | Low | Use anon key where possible |
| SEC-CB-008 | Prompt injection risk | High | Add input filtering |

### Prompt Injection Prevention
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

| ID | Issue | Impact | Recommendation |
|----|-------|--------|----------------|
| DATA-CB-001 | Message order not guaranteed | Medium | Add sequence number |
| DATA-CB-002 | Conversation state mismatch | Medium | Sync state on reconnect |
| DATA-CB-003 | Analytics not atomic | Low | Batch analytics inserts |
| DATA-CB-004 | Orphan messages possible | Low | Foreign key cascade delete |

### Database Schema Recommendations
```sql
-- Add message ordering
ALTER TABLE chat_messages ADD COLUMN sequence_number INTEGER;

-- Add index for faster queries
CREATE INDEX idx_chat_messages_conversation_created 
ON chat_messages(conversation_id, created_at);

-- Ensure cascade delete
ALTER TABLE chat_messages 
DROP CONSTRAINT IF EXISTS chat_messages_conversation_id_fkey,
ADD CONSTRAINT chat_messages_conversation_id_fkey 
FOREIGN KEY (conversation_id) REFERENCES chat_conversations(id) ON DELETE CASCADE;
```

## 7. Error Handling & Observability

### Current State
```typescript
// ai-chatbot/index.ts - Line 208-227
if (!response.ok) {
  if (response.status === 429) {
    return new Response(JSON.stringify({ error: "Rate limit exceeded..." }), { ... });
  }
  // ❌ Missing detailed error logging
}
```

### Issues
| ID | Issue | Recommendation |
|----|-------|----------------|
| ERR-CB-001 | Generic error messages | Return specific error codes |
| ERR-CB-002 | No error tracking | Integrate Sentry atau similar |
| ERR-CB-003 | Silent stream failures | Log stream errors server-side |
| ERR-CB-004 | No retry mechanism | Add exponential backoff |
| ERR-CB-005 | Missing analytics on error | Track error rates |

### Error Handling Improvements
```typescript
// Error codes for client handling
const ERROR_CODES = {
  RATE_LIMIT: 'ERR_RATE_LIMIT',
  AI_UNAVAILABLE: 'ERR_AI_UNAVAILABLE',
  INVALID_INPUT: 'ERR_INVALID_INPUT',
  AUTH_REQUIRED: 'ERR_AUTH_REQUIRED',
  CONTEXT_FAILED: 'ERR_CONTEXT_FAILED',
};

// Structured error response
return new Response(JSON.stringify({ 
  error: {
    code: ERROR_CODES.RATE_LIMIT,
    message: 'Terlalu banyak permintaan. Tunggu sebentar.',
    retryAfter: 60,
  }
}), { status: 429 });
```

## 8. Maintainability

| ID | Issue | Recommendation |
|----|-------|----------------|
| MAINT-CB-001 | Large edge function (243 lines) | Split into modules |
| MAINT-CB-002 | Hardcoded prompts | Move to config/database |
| MAINT-CB-003 | Duplicate streaming logic | Extract reusable hook |
| MAINT-CB-004 | Mixed concerns | Separate data, UI, AI logic |
| MAINT-CB-005 | No tests | Add unit/integration tests |

### Suggested Refactoring
```typescript
// Proposed structure
supabase/functions/
  ai-chatbot/
    index.ts           // Main handler
    context.ts         // User context builder
    knowledge.ts       // Knowledge base search
    prompts.ts         // System prompts
    types.ts           // TypeScript types

src/
  hooks/
    useChatbot.ts      // Main chatbot hook
    useChatStream.ts   // Streaming logic
  components/chatbot/
    ChatWidget.tsx     // Widget wrapper
    ChatDialog.tsx     // Dialog UI
    MessageList.tsx    // Message rendering
    QuickActions.tsx   // Role-based actions
```

## 9. Compatibility & Environment

| ID | Issue | Recommendation |
|----|-------|----------------|
| COMP-CB-001 | SSE browser support | Add WebSocket fallback |
| COMP-CB-002 | Mobile keyboard issues | Handle viewport resize |
| COMP-CB-003 | Offline mode | Show cached messages |
| COMP-CB-004 | Safari stream issues | Test Safari compatibility |
| COMP-CB-005 | Slow network handling | Add timeout and retry |

## Summary

| Severity | Count |
|----------|-------|
| 🔴 Critical | 7 |
| 🟡 Warning | 12 |
| 🔵 Info | 8 |

## Recommended Actions (Priority Order)

1. **[CRITICAL]** Add rate limiting di edge function
2. **[CRITICAL]** Implement input sanitization untuk prompt injection
3. **[CRITICAL]** Mask PII dalam system prompt
4. **[HIGH]** Add retry mechanism untuk failed messages
5. **[HIGH]** Cache knowledge base untuk performance
6. **[HIGH]** Limit message context yang dikirim ke AI
7. **[MEDIUM]** Add "Clear conversation" button
8. **[MEDIUM]** Implement typing indicator
9. **[LOW]** Translate FAQ ke Indonesian
10. **[LOW]** Add message copy functionality
