# Merchant Management

## Overview
Manajemen merchant termasuk verifikasi, approval, dan monitoring.

## File Location
- `src/pages/admin/Merchants.tsx` - Halaman manajemen merchant
- `src/components/admin/BulkApprovalDialog.tsx` - Bulk approval
- `src/components/admin/RejectionReasonForm.tsx` - Form rejection
- `src/components/admin/MerchantVerificationHistory.tsx` - History verifikasi
- `src/components/admin/DocumentLightbox.tsx` - Lihat dokumen

## Database Tables
- `merchants` - Data merchant
- `merchant_verifications` - Dokumen verifikasi
- `merchant_verification_history` - History verifikasi
- `merchant_subscriptions` - Subscription merchant

## Features
- ✅ List semua merchant
- ✅ Filter by verification status
- ✅ View merchant detail
- ✅ Approve merchant
- ✅ Reject merchant dengan alasan
- ✅ Bulk approval
- ✅ View verification documents
- ✅ Verification history
- ✅ Merchant analytics tab
- ✅ Merchant properties tab
- ✅ Merchant activity tab

## Implementation Status
| Feature | Status |
|---------|--------|
| List Merchants | ✅ Complete |
| Filter | ✅ Complete |
| Approval | ✅ Complete |
| Rejection | ✅ Complete |
| Bulk Approval | ✅ Complete |
| Document View | ✅ Complete |
| History | ✅ Complete |

## Verification Status
- `pending` - Menunggu verifikasi
- `verified` - Sudah diverifikasi
- `rejected` - Ditolak
- `resubmitted` - Disubmit ulang

## Related Components
- `MerchantAnalyticsTab`
- `MerchantPropertiesTab`
- `MerchantActivityTab`
