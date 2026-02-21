# Maintenance Management

## Overview
Manajemen permintaan maintenance dari tenant.

## File Location
- `src/pages/merchant/Maintenance.tsx` - List maintenance
- `src/pages/merchant/MaintenanceDetail.tsx` - Detail maintenance
- `src/components/maintenance/` - Various components

## Database Tables
- `maintenance_requests` - Request maintenance
- `maintenance_updates` - Update/reply
- `maintenance_timeline` - Timeline
- `maintenance_reviews` - Review dari tenant

## Features
- ✅ List maintenance requests
- ✅ View detail
- ✅ Update status
- ✅ Assign vendor
- ✅ Reply/comment
- ✅ Upload photos
- ✅ SLA tracking
- ✅ Completion with photos
- ✅ Filter by status/priority

## Implementation Status
| Feature | Status |
|---------|--------|
| List | ✅ Complete |
| Detail | ✅ Complete |
| Status Update | ✅ Complete |
| Assign Vendor | ✅ Complete |
| Reply | ✅ Complete |
| Photos | ✅ Complete |
| SLA | ✅ Complete |

## Maintenance Status
- `pending` - Baru masuk
- `acknowledged` - Diterima
- `in_progress` - Dikerjakan
- `completed` - Selesai
- `cancelled` - Dibatalkan

## Priority Levels
- `low` - Rendah
- `medium` - Sedang
- `high` - Tinggi
- `urgent` - Urgent

## Related Components
- `MaintenancePhotoUpload`
- `MaintenanceReplyForm`
- `MaintenanceReviewForm`
- `SLABadge`
- `UpdateTimeline`
- `CompletionDialog`
