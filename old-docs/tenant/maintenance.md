# Tenant Maintenance

## Overview
Submit dan track maintenance request untuk tenant.

## File Location
- `src/pages/tenant/Maintenance.tsx` - List maintenance
- `src/pages/tenant/MaintenanceDetail.tsx` - Detail
- `src/components/maintenance/` - Components

## Database Tables
- `maintenance_requests` - Request
- `maintenance_updates` - Updates
- `maintenance_timeline` - Timeline
- `maintenance_reviews` - Reviews

## Features
- ✅ Submit request
- ✅ View request list
- ✅ View request detail
- ✅ Upload photos
- ✅ Track status
- ✅ Add comments
- ✅ Rate & review
- ✅ View timeline

## Implementation Status
| Feature | Status |
|---------|--------|
| Submit | ✅ Complete |
| List | ✅ Complete |
| Detail | ✅ Complete |
| Photos | ✅ Complete |
| Review | ✅ Complete |
| Filter | ⚠️ Needs Adding |

## Request Categories
- Plumbing
- Electrical
- AC/Heating
- Appliances
- General

## Related Components
- `MaintenancePhotoUpload`
- `MaintenanceReplyForm`
- `MaintenanceReviewForm`
- `UpdateTimeline`
