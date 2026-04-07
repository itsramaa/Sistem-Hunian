# Chatbot Configuration

## Overview
Konfigurasi knowledge base untuk AI chatbot.

## File Location
- `src/pages/admin/Chatbot.tsx` - Halaman config chatbot

## Database Tables
- `chatbot_knowledge` - Knowledge base
- `chatbot_analytics` - Analytics chatbot

## API/Edge Functions
- `supabase/functions/ai-chatbot/index.ts` - Main chatbot function

## Features
- ✅ Add knowledge entries
- ✅ Edit knowledge entries
- ✅ Delete knowledge entries
- ✅ Categorize knowledge
- ✅ Add keywords
- ✅ Toggle active/inactive
- ✅ View chatbot analytics

## Implementation Status
| Feature | Status |
|---------|--------|
| CRUD Knowledge | ✅ Complete |
| Categories | ✅ Complete |
| Keywords | ✅ Complete |
| Analytics | ✅ Complete |

## Knowledge Structure
```json
{
  "question": "Bagaimana cara bayar?",
  "answer": "Anda bisa bayar melalui...",
  "category": "payment",
  "keywords": ["bayar", "payment", "transfer"],
  "is_active": true
}
```

## Categories
- General
- Payment
- Maintenance
- Contract
- Marketplace

## Related Components
- `ChatbotWidget` - Widget chatbot
- `ChatbotDialog` - Dialog chatbot
