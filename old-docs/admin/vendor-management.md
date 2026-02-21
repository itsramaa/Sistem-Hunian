# Vendor Management

## Overview
Manajemen vendor termasuk verifikasi dan monitoring.

## File Location
- `src/pages/admin/Vendors.tsx` - Halaman manajemen vendor
- `src/pages/admin/VendorVerifications.tsx` - Verifikasi vendor

## Database Tables
- `vendors` - Data vendor
- `vendor_verifications` - Dokumen verifikasi vendor
- `vendor_bank_accounts` - Akun bank vendor

## Features
- ✅ List semua vendor
- ✅ Filter by verification status
- ✅ View vendor detail
- ✅ Approve vendor
- ✅ Reject vendor
- ✅ View verification documents
- ✅ Vendor analytics

## Implementation Status
| Feature | Status |
|---------|--------|
| List Vendors | ✅ Complete |
| Filter | ✅ Complete |
| Approval | ✅ Complete |
| Rejection | ✅ Complete |
| Document View | ✅ Complete |

## Verification Status
- `pending` - Menunggu verifikasi
- `verified` - Sudah diverifikasi
- `rejected` - Ditolak

## Related Components
- `VendorVerifications` page
