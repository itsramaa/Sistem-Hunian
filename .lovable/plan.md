
# Redesign Maintenance Stats, Webcam Integration, Fix Bugs, and Complete Cross-References

## 1. MaintenanceStats: 5 Cards by Priority Level

**Current:** Total, Pending, In Progress, Completed, Priority (urgent+high)
**Change to:** Total, Low, Medium, High, Urgent

Update `MaintenanceStats.tsx`:
- Change props interface to accept `low`, `medium`, `high`, `urgent` counts instead of `pending`/`inProgress`/`completed`
- 5 compact cards: Total (primary), Low (muted), Medium (info), High (warning), Urgent (destructive)
- Grid: `grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3` with `compact` prop on all

Update `Maintenance.tsx`:
- Compute stats by priority: `low`, `medium`, `high`, `urgent` counts for active (non-completed, non-cancelled) requests
- Pass updated props to `MaintenanceStats`

## 2. Webcam Integration for All Photo Upload Points

Currently webcam is only in `MaintenancePhotoUpload`, `OcrCameraButton`. Need to add to all `FileUpload` usages.

**Add webcam to `FileUpload.tsx`:**
- Import `WebcamCaptureDialog` and `useIsMobile`
- In compact button mode: if `buttonIcon === 'camera'` and not mobile, show webcam button alongside
- In drop-zone mode: add a "Webcam" button below the drop zone (desktop only)
- Add `onWebcamCapture` handler that uploads blob to storage then calls `onUploadComplete`

**Update `FileUpload` bucket type:**
- Expand the union type to include `"payment-proofs" | "contract-documents"` so all upload contexts work

**Verify all upload locations use camera/gallery/webcam pattern:**
- `MaintenancePhotoUpload` - already has webcam
- `OcrCameraButton` - already has webcam
- `FileUpload` (used in property images, verification docs, etc.) - ADD webcam
- `ImageGalleryUpload` - ADD webcam option

## 3. Fix Maintenance Page Bugs

**Bug 1: `MaintenanceDetail.tsx` line 397** - References `request.assigned_vendor.phone_number` but type uses `phone_number` while the vendor select might not return it.
- The `getRequestById` query selects `phone_number` from vendors which is correct. Verify the type matches.

**Bug 2: `MaintenanceStats` props mismatch** - After changing to priority-based stats, the parent must pass correct props.

**Bug 3: `MaintenanceDetail` - `maintenance_expenses` table** - Used with `(supabase as any)` cast suggesting table may not exist. Check if this causes runtime errors and handle gracefully with try/catch or optional chaining.

## 4. Complete Cross-Reference Links on All Detail Pages

### InvoiceDetail.tsx (Currently partial)
**Missing links:**
- Property name (line 155): currently plain text in grid, add Link to `/merchant/properties/{property_id}` - need to fetch property_id from contract query
- Unit number (line 156): add Link to `/merchant/units/{unit_id}` - need unit_id from contract
- Contract reference: add Link to `/merchant/contracts/{contract.id}`

**Fix:** Update the contracts select to include `units(id, unit_number, properties(id, name))` and render as Links.

### PaymentDetail.tsx (Currently partial)
**Missing links:**
- Property name (line 156): plain text, add Link
- Unit number: add Link
- Contract: add Link to `/merchant/contracts/{contract.id}`
- Invoice reference: if `payment.invoice_id` exists, add Link to `/merchant/invoices/{invoice_id}`

**Fix:** Same pattern - update contract select to include IDs and render as Links.

### ContractDetail.tsx (Currently partial)
**Missing links:**
- Property name (line 113): plain text, add Link to `/merchant/properties/{property.id}` - need property ID from select
- Unit number (line 115): plain text, add Link to `/merchant/units/{unit.id}` - need unit ID from select

**Fix:** Update contract query to include `units(id, ...)` and `properties(id, ...)` and wrap in Links.

### TenantDetail.tsx (Currently partial)
**Missing links:**
- Property name (line 162): plain text, wrap in Link
- Unit number (line 163): plain text, wrap in Link
- Invoice items (lines 261-274): clickable but only shows data, add navigate to `/merchant/invoices/{inv.id}`

**Fix:** Add Links for property/unit in personal info card, and make invoice items clickable to invoice detail.

### UnitDetail.tsx (Currently partial)
**Missing links:**
- Active tenant name (line 234): plain text, add Link to `/merchant/tenants/{activeContract.id}` (uses contract ID as tenant route)
- Invoice items: should navigate to invoice detail page

**Fix:** Wrap tenant name and invoice items in Links.

### MaintenanceDetail.tsx
**Missing links (already has tenant/property/unit):**
- Vendor name: if vendor has a detail page, link to it. Check if `/merchant/vendors/{id}` exists. If not, skip.
- Contract status badge: add Link to contract detail if contract ID is available

**Fix:** Add contract ID to the query select and create a link from the contract badge.

---

## Files to Modify

| File | Change |
|------|--------|
| `src/features/maintenance/components/MaintenanceStats.tsx` | 5 priority-based cards |
| `src/pages/merchant/Maintenance.tsx` | Update stats computation by priority |
| `src/shared/components/FileUpload.tsx` | Add webcam support + expand bucket types |
| `src/pages/merchant/InvoiceDetail.tsx` | Add property/unit/contract Links |
| `src/pages/merchant/PaymentDetail.tsx` | Add property/unit/contract/invoice Links |
| `src/pages/merchant/ContractDetail.tsx` | Add property/unit Links |
| `src/pages/merchant/TenantDetail.tsx` | Add property/unit Links + invoice navigation |
| `src/pages/merchant/UnitDetail.tsx` | Add tenant Link + invoice navigation |
| `src/pages/merchant/MaintenanceDetail.tsx` | Fix vendor phone bug + add contract link |

## Technical Notes

- Cross-reference links follow existing pattern: `<Link to={...} className="font-medium hover:underline text-primary">`
- Webcam only renders on desktop (detected via `useIsMobile()` hook)
- `FileUpload` bucket type union expanded to support all storage buckets used across the app
- Stats redesign doesn't change any database queries, only UI computation
- All detail page queries may need expanded select fields to include entity IDs for linking (e.g., `properties(id, name)` instead of just `properties(name)`)
