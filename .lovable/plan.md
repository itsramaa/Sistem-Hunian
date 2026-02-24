
# Redesign Maintenance Page + Fix Photo Camera Support + Add Analytics to Reports

## Status: ✅ Completed

All three areas have been implemented.

## Changes Made

### 1. Maintenance Page Layout (✅ Done)
- **MaintenanceRequestTable**: Reduced from 10 columns to 6 (Request, Priority, Status, SLA, Created, Actions). Unit+Title merged into "Request" column with thumbnail.
- **MaintenanceStats**: Changed from 6-column to 4-column grid. Urgent/SLA Breach shown as subtitles.
- **MaintenanceFilters**: Removed redundant status dropdown (tabs handle it). Clean row: search + priority + category.
- **Maintenance.tsx**: Removed duplicate status filter, consistent `space-y-6`.

### 2. Photo Camera + Gallery Support (✅ Done)
- **FileUpload**: Added `capture` prop and compact button mode (`buttonLabel`/`buttonIcon`).
- **MaintenancePhotoUpload**: Two upload buttons - "Kamera" (with capture) and "Galeri" (without).
- **OcrCameraButton**: Replaced single input with DropdownMenu offering "Kamera" and "Galeri/Dokumen" choices.

### 3. Analytics Dashboard in Reports (✅ Done)
- Created `AnalyticsDashboardTab` component with all analytics visualizations.
- Added "Dashboard" tab to Reports page with Price Stats, Occupancy Trend, ROI Distribution, Risk Map, Tenant Quality.
- Includes filters (Property Type, City, Year Range) and "Ekspor PDF" button.
