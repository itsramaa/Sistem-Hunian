# Audit Logs

## Overview
Log audit untuk tracking semua aktivitas penting di platform.

## File Location
- `src/pages/admin/AuditLogs.tsx` - Halaman audit logs

## Database Tables
- `audit_logs` - Log audit

## Features
- ✅ View all audit logs
- ✅ Filter by entity type
- ✅ Filter by action
- ✅ Filter by user
- ✅ Search logs
- ✅ Export logs

## Implementation Status
| Feature | Status |
|---------|--------|
| View Logs | ✅ Complete |
| Filters | ✅ Complete |
| Search | ✅ Complete |
| Export | ⚠️ Needs Implementation |

## Log Structure
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "action": "update",
  "entity_type": "merchant",
  "entity_id": "uuid",
  "old_data": {},
  "new_data": {},
  "ip_address": "xxx.xxx.xxx.xxx",
  "user_agent": "...",
  "created_at": "timestamp"
}
```

## Tracked Actions
- CREATE
- UPDATE
- DELETE
- LOGIN
- LOGOUT
- APPROVE
- REJECT

## Entity Types
- merchant
- vendor
- tenant
- contract
- invoice
- dispute

## Related Components
- Audit logging in various services
