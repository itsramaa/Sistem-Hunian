# Analytics System

## Overview
Sistem analytics untuk tracking events dan user behavior.

## File Location
- `src/lib/analytics.ts` - Analytics helper
- `src/hooks/useAnalytics.ts` - Hook

## Database Tables
- `analytics_events` - Events

## Features
- ✅ Page views
- ✅ User actions
- ✅ Custom events
- ✅ Session tracking
- ✅ Event data

## Implementation Status
| Feature | Status |
|---------|--------|
| Page Views | ✅ Complete |
| Actions | ✅ Complete |
| Custom Events | ✅ Complete |
| Sessions | ✅ Complete |

## Event Structure
```json
{
  "event_type": "page_view",
  "user_id": "uuid",
  "page": "/merchant/dashboard",
  "event_data": {},
  "session_id": "xxx"
}
```

## Event Types
- page_view
- button_click
- form_submit
- payment_initiated
- payment_completed
- error

## Related Components
- `useAnalytics` hook
- Various tracking implementations
