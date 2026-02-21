# Invitation System

## Overview
Sistem undangan untuk tenant baru dari merchant. Merchant dapat mengundang tenant untuk bergabung ke properti mereka.

## File Location
- `src/pages/Invite.tsx` - Halaman terima undangan
- `src/pages/merchant/Tenants.tsx` - Generate invitation link

## Database Tables
- `tenants` - Data tenant dengan invitation_token
- `contracts` - Kontrak tenant
- `units` - Unit yang diundang

## Features
- ✅ Generate invitation link
- ✅ Copy invitation link
- ✅ Accept invitation
- ✅ Auto-assign tenant ke unit
- ✅ Invitation expiry
- ✅ Resend invitation

## Implementation Status
| Feature | Status |
|---------|--------|
| Generate Link | ✅ Complete |
| Copy Link | ✅ Complete |
| Accept Invite | ✅ Complete |
| Auto-assign | ✅ Complete |
| Expiry Check | ⚠️ Needs Implementation |

## Flow
1. Merchant buat tenant record dengan unit assignment
2. System generate invitation_token
3. Merchant copy link atau kirim via email
4. Tenant klik link
5. Tenant register/login
6. System assign tenant ke unit dan create contract

## Invitation Link Format
```
https://[domain]/invite?token=[invitation_token]
```

## Related Components
- `Tenants.tsx` - Tenant management
- `AuthForm.tsx` - Registration from invite
