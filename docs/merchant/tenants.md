# Tenants Management

## Overview
Manajemen tenant (penyewa) untuk merchant.

## File Location
- `src/pages/merchant/Tenants.tsx` - Halaman tenants

## Database Tables
- `tenants` - Data tenant
- `contracts` - Kontrak tenant
- `units` - Unit assignment
- `tenant_merchant_history` - History transfer

## Features
- ✅ List tenants
- ✅ Add tenant
- ✅ Edit tenant info
- ✅ Assign unit
- ✅ Generate invitation link
- ✅ Copy invitation link
- ✅ Resend invitation
- ✅ Filter by status
- ✅ View tenant contract
- ✅ Tenant transfer (history)

## Implementation Status
| Feature | Status |
|---------|--------|
| List | ✅ Complete |
| Create | ✅ Complete |
| Edit | ✅ Complete |
| Invitation | ✅ Complete |
| Copy Link | ✅ Complete |
| Filter | ✅ Complete |
| Transfer | ⚠️ UI Needed |

## Tenant Status
- `invited` - Undangan dikirim
- `active` - Tenant aktif
- `inactive` - Tidak aktif
- `moved_out` - Sudah pindah

## Invitation Flow
1. Merchant add tenant dengan unit
2. System generate invitation token
3. Merchant copy/share link
4. Tenant register via link
5. Tenant otomatis ter-assign ke unit

## Related Components
- `TenantProfileForm`
- Contract management
