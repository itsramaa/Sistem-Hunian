
# Redesign Maintenance Page + Fix Photo Camera Support + Add Analytics to Reports

## 1. Redesign Maintenance Page Layout

**Problem:** Table has 10 columns (Unit, Tenant, Title, Category, Priority, Status, SLA, Assigned, Created, Actions) causing content to stretch too far right. Layout is cluttered compared to clean pages like Properties and Guardians.

**Solution - Simplify the table to show only key points:**

Reduce `MaintenanceRequestTable.tsx` columns to 5-6 essential ones:
- **Request** (combined: thumbnail + title + unit name as subtitle) 
- **Priority** (badge)
- **Status** (badge)
- **SLA** (badge, hidden on mobile)
- **Created** (date)
- **Actions** (menu icon)

Remove from table: Tenant, Category, Assigned (these belong in detail page). The "Title" column will be merged with Unit info into a single "Request" column for a compact layout.

**Redesign `Maintenance.tsx` layout:**
- Remove duplicate status filter (currently both Tabs AND Select dropdown filter status)
- Move MaintenanceFilters inside the tab content area, keep only search + priority + category (remove redundant status select since tabs handle it)
- Ensure consistent spacing with `space-y-6` and proper card wrapping

**Redesign `MaintenanceStats.tsx`:**
- Change from 6-column grid to 4-column for better proportions: Total, Pending, In Progress, Completed
- Show Urgent and SLA Breach as accent badges within existing cards rather than separate cards

**Redesign `MaintenanceFilters.tsx`:**
- Remove status filter dropdown (tabs already handle this)
- Keep: search, priority, category in a clean row
- Use `flex flex-col sm:flex-row` for mobile responsiveness

## 2. Fix Photo Upload - Camera + Gallery Support

**Problem:** `FileUpload` component and `MaintenancePhotoUpload` don't trigger camera on mobile. All photo fields should support both camera and gallery/document upload.

**Fix `FileUpload.tsx`:**
- Add optional `capture` prop to the file input element
- When `capture="environment"` is set, mobile devices will open the camera

**Fix `MaintenancePhotoUpload.tsx`:**
- Add two upload buttons: "Kamera" (with `capture="environment"`) and "Galeri" (without capture)
- Both use the same upload logic but with different input attributes

**Fix `OcrCameraButton.tsx`:**
- Currently has `useCapture` prop but defaults to `false`
- Change: instead of a single input, provide two options when clicked - a dialog/dropdown with "Kamera" and "Galeri/Dokumen" choices
- Both options trigger the same file input but with different capture attributes
- Accept `image/*` for both modes (OCR needs images)

## 3. Add Analytics Dashboard Content to Reports Page

**Problem:** The Reports page is missing the analytics dashboard visualizations that exist at `/merchant/analytics-dashboard`:
- Price Stats (Min, Max, Avg, Median)
- Tren Hunian 6 Bulan (Occupancy Trend line chart)
- Distribusi ROI (ROI Distribution bar chart)
- Peta Risiko Bencana (Disaster Risk Map)
- Distribusi Kualitas Tenant (Tenant Quality pie chart)

**Solution:** Add a new "Dashboard Analitik" tab to `Reports.tsx` that imports and reuses the analytics dashboard hooks and renders the same visualizations:

Add to `Reports.tsx`:
- New tab: "Dashboard" with icon `BarChart3`
- Import analytics hooks: `useAnalyticsProperties`, `useAnalyticsUnits`, `useAnalyticsContracts`, `useAnalyticsTenantRiskScores`, `useAnalyticsDisasterRisk`
- Render sections: Price Stats cards, Occupancy Trend LineChart, ROI Distribution BarChart, Disaster Risk Map (Leaflet), Tenant Quality PieChart
- Include filters: Property Type, City, Year Range slider
- Include "Ekspor PDF" button using `window.print()`

---

## Files to Modify

| File | Change |
|------|--------|
| `MaintenanceRequestTable.tsx` | Reduce to 5-6 columns, merge Unit+Title into "Request" |
| `Maintenance.tsx` | Remove duplicate status filter, cleaner layout |
| `MaintenanceStats.tsx` | Simplify to 4 main cards |
| `MaintenanceFilters.tsx` | Remove status dropdown, keep search+priority+category |
| `FileUpload.tsx` | Add `capture` prop support |
| `MaintenancePhotoUpload.tsx` | Add Camera vs Gallery buttons |
| `OcrCameraButton.tsx` | Add Camera/Gallery choice dialog |
| `Reports.tsx` | Add "Dashboard Analitik" tab with charts and map |

---

## Technical Notes

- The analytics dashboard data hooks already exist in `useAnalyticsDashboard.ts` and can be directly imported into Reports
- Leaflet map import requires `import "leaflet/dist/leaflet.css"` which is already used in AnalyticsDashboard
- The `capture="environment"` attribute triggers rear camera on mobile; omitting it opens file picker/gallery
- No database changes required
