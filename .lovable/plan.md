
# Redesign Maintenance Page, Fix Photo Upload, Enhance Detail Pages

## 1. MaintenanceStats: 5 Cards (Smaller Size)

Change from 4-column to 5-column grid with smaller cards:
- **Total** (all requests)
- **Pending** (with urgent count as subtitle)
- **In Progress** (with SLA breach as subtitle)
- **Completed**
- **Priority** (show count of urgent+high active requests)

Reduce card padding from `p-4` to `p-3`, icon from `h-10 w-10` to `h-8 w-8`, value from `text-2xl` to `text-xl`. Grid: `grid-cols-2 sm:grid-cols-3 md:grid-cols-5`.

**Files:** `MaintenanceStats.tsx`, `StatCard.tsx` (add optional `compact` prop)

## 2. react-webcam for Desktop Photo Upload

Install `react-webcam` package and create a shared `WebcamCaptureDialog` component that:
- Opens a dialog with live webcam preview
- Has "Capture" button to take snapshot
- Returns the captured image as a Blob for upload
- Includes front/rear camera toggle

Integrate into:
- **`FileUpload.tsx`**: Add a third option "Webcam" alongside Camera/Gallery (compact button mode adds webcam button)
- **`MaintenancePhotoUpload.tsx`**: Add "Webcam" button next to Kamera/Galeri
- **`OcrCameraButton.tsx`**: Add "Webcam" option in dropdown alongside Kamera/Galeri

**New file:** `src/shared/components/WebcamCaptureDialog.tsx`
**Modified:** `FileUpload.tsx`, `MaintenancePhotoUpload.tsx`, `OcrCameraButton.tsx`

## 3. Fix MaintenanceDetail Bug + Enhance

The detail page uses `getRelevantContract` and accesses `request.tenant?.phone_number` but the query only fetches `full_name, email` from profiles. Also `assigned_vendor` only fetches `business_name` but template uses `phone_number`.

**Fixes:**
- Update `maintenanceService.getRequestById()` query to include `phone` from profiles and `phone_number, rating, service_categories` from vendors
- Update `MaintenanceRequest` type to include `phone` in tenant and extra vendor fields
- Add completion photos section (separate from issue photos)
- Add review display section if maintenance is completed
- Add clickable links: tenant name links to `/merchant/tenants/{id}`, unit links to `/merchant/units/{unit_id}`, property links to `/merchant/properties/{property_id}`

**Files:** `maintenanceService.ts`, `types/index.ts`, `MaintenanceDetail.tsx`

## 4. Enhance All Detail Pages with Cross-References

Add clickable navigation links to related entities across detail pages:

### InvoiceDetail.tsx
- Tenant name: clickable link to `/merchant/tenants/{tenant_user_id}`
- Property name: clickable link to `/merchant/properties/{property_id}`
- Unit number: clickable link to `/merchant/units/{unit_id}`
- Contract: clickable link to `/merchant/contracts/{contract_id}`
- Fetch `property_id` and `unit_id` from contract query (add to select)

### PaymentDetail.tsx
- Same as Invoice: tenant, property, unit, contract all clickable
- Add invoice reference link if `invoice_id` exists

### ContractDetail.tsx
- Tenant name: clickable link to `/merchant/tenants/{tenant_user_id}`
- Property/Unit: clickable links
- Add maintenance requests count/link for this unit

### TenantDetail.tsx
- Property/Unit references: clickable links
- Contract references: clickable links

**Pattern:** Use `<Link>` from react-router-dom with hover underline styling:
```tsx
<Link to={`/merchant/tenants/${id}`} className="font-medium hover:underline text-primary">
  {tenant.full_name}
</Link>
```

## Files Summary

| File | Change |
|------|--------|
| `src/shared/components/ui/StatCard.tsx` | Add `compact` prop for smaller cards |
| `src/features/maintenance/components/MaintenanceStats.tsx` | 5-card grid with compact mode |
| `src/shared/components/WebcamCaptureDialog.tsx` | New: react-webcam dialog component |
| `src/shared/components/FileUpload.tsx` | Add webcam option |
| `src/features/maintenance/components/MaintenancePhotoUpload.tsx` | Add webcam button |
| `src/shared/components/OcrCameraButton.tsx` | Add webcam option in dropdown |
| `src/features/maintenance/services/maintenanceService.ts` | Fix getRequestById query (add phone, vendor details) |
| `src/features/maintenance/types/index.ts` | Update type for phone, vendor fields |
| `src/pages/merchant/MaintenanceDetail.tsx` | Fix bug, add review section, clickable links |
| `src/pages/merchant/InvoiceDetail.tsx` | Add clickable cross-reference links |
| `src/pages/merchant/PaymentDetail.tsx` | Add clickable cross-reference links |
| `src/pages/merchant/ContractDetail.tsx` | Add clickable cross-reference links |

## Technical Notes

- `react-webcam` needs to be installed as a new dependency
- Webcam only shows on desktop (detect via `navigator.mediaDevices`); on mobile, native camera input is sufficient
- Cross-reference links use existing route patterns already defined in the router
- The maintenance detail bug is caused by the Supabase select query not including `phone` from profiles -- `phone_number` doesn't exist on profiles table, the field is `phone`
- All detail page enhancements are additive -- existing functionality is preserved, just adding `<Link>` wrappers around text that currently displays names/titles
