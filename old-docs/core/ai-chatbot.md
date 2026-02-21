# AI Chatbot

## Overview
AI-powered chatbot untuk membantu pengguna dengan pertanyaan umum.

## File Location
- `src/components/chatbot/ChatbotWidget.tsx` - Widget
- `src/components/chatbot/ChatbotDialog.tsx` - Dialog
- `src/components/chatbot/ChatMessageRenderer.tsx` - Render messages
- `src/components/merchant/MerchantChatbot.tsx` - Merchant
- `src/components/vendor/VendorChatbot.tsx` - Vendor
- `src/hooks/useChatbotConversation.ts` - Hook
- `supabase/functions/ai-chatbot/index.ts` - Main AI
- `supabase/functions/merchant-ai-assistant/index.ts` - Merchant AI
- `supabase/functions/vendor-ai-assistant/index.ts` - Vendor AI

## Database Tables
- `chat_conversations` - Conversations
- `chat_messages` - Messages
- `chatbot_knowledge` - Knowledge base
- `chatbot_analytics` - Analytics

## Features
- ✅ General FAQ
- ✅ Context-aware responses
- ✅ Role-specific answers
- ✅ Action suggestions
- ✅ Conversation history
- ✅ Quick replies
- ✅ Analytics tracking

## Implementation Status
| Feature | Status |
|---------|--------|
| FAQ | ✅ Complete |
| Context | ✅ Complete |
| Role-specific | ✅ Complete |
| Actions | ✅ Complete |
| History | ✅ Complete |

## AI Models Used
- Google Gemini (via Lovable AI)
- Knowledge base matching

## Related Components
- Various chatbot components
- Navigation with floating AI button
