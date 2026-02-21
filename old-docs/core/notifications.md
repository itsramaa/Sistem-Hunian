# Notifications

## Overview
Sistem notifikasi untuk semua pengguna.

## File Location
- `src/components/notifications/NotificationsDropdown.tsx` - Dropdown
- `src/lib/notifications.ts` - Helper functions
- `supabase/functions/send-notification/index.ts` - Send
- `supabase/functions/send-payment-reminder/index.ts` - Reminder
- `supabase/functions/whatsapp-notification/index.ts` - WhatsApp

## Database Tables
- `notifications` - Data notifikasi

## Features
- ✅ In-app notifications
- ✅ Email notifications
- ✅ WhatsApp notifications (mock)
- ✅ Payment reminders
- ✅ Notification preferences
- ✅ Read/unread status
- ✅ Notification actions

## Implementation Status
| Feature | Status |
|---------|--------|
| In-app | ✅ Complete |
| Email | ⚠️ Partial |
| WhatsApp | ⚠️ Mock |
| Reminders | ✅ Complete |
| Preferences | ✅ Complete |

## Notification Types
- Payment due
- Payment received
- Maintenance update
- Order update
- Contract update
- System announcements

## Related Components
- `NotificationsDropdown`
- Notification settings
