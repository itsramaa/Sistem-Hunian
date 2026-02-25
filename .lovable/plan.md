

# Sidebar Updates, Amenities Split, Webcam Fixes, Data Quality Relocation, and Maintenance Detail Bug Fix

## 1. Add Escrow, Referral, and Dokumen to Merchant Sidebar

Update `navigation-config.ts` to add three new sidebar items:

- **Escrow** under Keuangan group, below Pembayaran: `{ path: "/merchant/escrow", icon: Wallet, label: "Escrow" }`
- **Referral** in a new group or under Operasional: `{ path: "/merchant/referrals", icon: Gift, label: "Referral" }`
- **Pusat Dokumen** under Utama or Wawasan: `{ path: "/merchant/documents", icon: FileText, label: "Dokumen" }`

Pages already exist (`Escrow.tsx`, `Referrals.tsx`, `DocumentCenter.tsx`) and routes are already defined in `App.tsx`. Only the sidebar config needs updating.

## 2. Split Fasilitas Kamar vs Fasilitas Umum

Currently `CustomAmenities` has a single list of default amenities used for both property-level (Fasilitas Umum) and unit-level (Fasilitas Kamar).

**Changes:**

- **`CustomAmenities.tsx`**: Add a `type` prop (`"property" | "unit"`) to control which defaults show:
  - **Property (Fasilitas Umum)**: Parkir, Keamanan 24 Jam, CCTV, Kolam Renang, Gym, Dapur Bersama, Laundry, Cleaning Service
  - **Unit (Fasilitas Kamar)**: AC, Water Heater, Furnished, Lemari, Meja, Kamar Mandi Dalam, Balkon
  - Exclude **WiFi, Air, Listrik** from both lists (they have their own dedicated fields already)
  - Label changes: "Fasilitas Umum" for property, "Fasilitas Kamar" for unit

- **`PropertyFormDialog.tsx`**: Pass `type="property"` to `CustomAmenities`
- **`UnitFormDialog.tsx`**: Pass `type="unit"` to `CustomAmenities`

Data in DB stays as-is (all stored in `amenities` array). This is purely a UI filter for which defaults to show.

## 3. Fix Webcam Not Appearing in All Photo Upload Points

The webcam button currently exists in `FileUpload` and `MaintenancePhotoUpload` but is missing from:

- **`CompletionDialog.tsx`** (line 59): Uses `FileUpload` without compact/button mode, and the drop-zone webcam only shows when `accept.startsWith('image')` -- need to verify this works with `accept="image/*"`
- **`MaintenanceReplyForm.tsx`** (line 84): Same issue -- uses `FileUpload` in drop-zone mode
- **`EnhancedFileUpload.tsx`**: Has no webcam support at all -- add `WebcamCaptureDialog` integration

**Fix `EnhancedFileUpload.tsx`:**
- Import `WebcamCaptureDialog` and `useIsMobile`
- Add webcam button below drop zone (desktop only)
- Add `onWebcamCapture` handler similar to `FileUpload`

**Fix `CompletionDialog.tsx`:**
- Switch to using `MaintenancePhotoUpload` component instead of bare `FileUpload`, since it already has the full Kamera/Galeri/Webcam pattern

**Fix `MaintenanceReplyForm.tsx`:**
- Add webcam option alongside the existing FileUpload

## 4. Move Data Quality History to "Alat" (InsightsHub)

Currently Data Quality is a tab inside Property Detail and has a standalone page at `/merchant/data-quality` that redirects to properties.

**Changes:**

- **`navigation-config.ts`**: Add `/merchant/data-quality` to the `activePatterns` of the "Alat" sidebar item
- **`App.tsx`**: Change the `/merchant/data-quality` route from `Navigate` redirect to render `MerchantDataQuality` as a standalone page
- **`InsightsHub.tsx`**: Add a card for "Kualitas Data" linking to `/merchant/data-quality`
- **`PropertyDetail.tsx`**: Keep the data-quality tab as-is (contextual access from property is still useful), but it now also has a standalone page via the Alat section

## 5. Fix Maintenance Detail Bugs

**Bug: `maintenance_expenses` table access using `(supabase as any)`**
- This suggests the table may not exist in the schema. Wrap the query in try/catch so it fails gracefully instead of breaking the page.

**Bug: Vendor phone display**
- Current code accesses `request.assigned_vendor.phone_number` which should work if the service query includes it. Verify the `maintenanceService.getRequestById` select includes `phone_number` for vendors.

**Fix: Add error boundary around expenses query**
- Wrap the expenses `useQuery` with proper error handling so if the table doesn't exist, it returns an empty array instead of crashing.

---

## Files to Modify

| File | Change |
|------|--------|
| `src/shared/components/layouts/navigation-config.ts` | Add Escrow, Referral, Dokumen to merchant sidebar; add data-quality to Alat activePatterns |
| `src/App.tsx` | Change data-quality route from redirect to standalone page |
| `src/features/properties/components/CustomAmenities.tsx` | Add `type` prop, split defaults into property vs unit lists, exclude wifi/air/listrik |
| `src/features/properties/components/PropertyFormDialog.tsx` | Pass `type="property"` |
| `src/features/properties/components/UnitFormDialog.tsx` | Pass `type="unit"` |
| `src/shared/components/EnhancedFileUpload.tsx` | Add webcam support |
| `src/features/maintenance/components/CompletionDialog.tsx` | Use MaintenancePhotoUpload or add webcam |
| `src/features/maintenance/components/MaintenanceReplyForm.tsx` | Add webcam option |
| `src/pages/merchant/MaintenanceDetail.tsx` | Wrap expenses query in try/catch |
| `src/pages/merchant/InsightsHub.tsx` | Add Kualitas Data card |

## Technical Notes

- No database changes needed -- amenities stay stored the same way in DB
- All pages referenced (Escrow, Referrals, DocumentCenter) already exist with routes in App.tsx
- The webcam fix focuses on `EnhancedFileUpload` and `CompletionDialog` which are the two remaining upload components without webcam
- Data Quality History page already has a property selector built-in, so it works perfectly as a standalone page

