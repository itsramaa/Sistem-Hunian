
# Photo Zoom, Fasilitas Edit di Overview, Unit/Tenant Quick-Add, Compliance ke Overview, OCR Improvements, Seed Data

## 1. Photo Zoom/Lightbox Library

Tambahkan fitur zoom/pinch/swipe pada foto properti dan unit menggunakan library CSS-only atau lightweight lightbox.

**Pendekatan:** Buat komponen `PhotoLightbox.tsx` menggunakan native HTML `<dialog>` + CSS transform untuk zoom. Klik foto di carousel/gallery membuka lightbox fullscreen dengan:
- Pinch-to-zoom (touch) dan scroll-to-zoom (desktop)
- Swipe/arrow navigation antar foto
- Close button dan ESC key

**File baru:**
- `src/shared/components/PhotoLightbox.tsx`

**File diubah:**
- `src/pages/merchant/PropertyDetail.tsx` - Klik foto di carousel membuka lightbox
- `src/pages/merchant/UnitDetail.tsx` - Klik foto unit membuka lightbox

## 2. Fasilitas Editable di Tab Ringkasan (Overview)

Di tab Ringkasan `PropertyDetail.tsx`, card "Fasilitas" saat ini hanya menampilkan badge. Tambahkan tombol "Edit" dan "Tambah" yang membuka `FacilityManagementDialog` atau inline toggle fasilitas.

**File diubah:**
- `src/pages/merchant/PropertyDetail.tsx`:
  - Di card Fasilitas (overview tab, line ~423-434), tambah button "Edit Fasilitas" di CardHeader
  - Klik membuka dialog dengan `CustomAmenities` + save mutation ke property amenities
  - Tambah button "Tambah" yang menuju `FacilityManagementDialog` untuk membuat fasilitas master baru

## 3. Tambah Unit di Tab Unit -- Dialog Langsung Fix ke Properti

Di tab Unit `PropertyDetail.tsx`, tambahkan button "Tambah Unit" yang membuka `UnitFormDialog` dengan `property_id` sudah di-preset (tidak perlu pilih properti lagi).

**File diubah:**
- `src/pages/merchant/PropertyDetail.tsx`:
  - Import `UnitFormDialog` dan hooks unit
  - Tambah state `showAddUnitDialog`
  - Di tab Unit, tambah button "Tambah Unit" di header (sebelah filter/view toggle)
  - Render `UnitFormDialog` dengan properti fix, property selector disabled/hidden

- `src/features/properties/components/UnitFormDialog.tsx`:
  - Tambah prop opsional `preselectedPropertyId?: string` 
  - Jika ada, auto-set `property_id` dan hide property selector

## 4. Tambah Penyewa di Tab Penyewa -- Dialog Fix ke Properti

Di tab Penyewa `PropertyDetail.tsx`, tambahkan button "Tambah Penyewa" yang membuka `AddTenantDialog` dengan properti sudah di-preset. Hanya perlu pilih unit dan isi detail.

**File diubah:**
- `src/pages/merchant/PropertyDetail.tsx`:
  - Import `AddTenantDialog` dan mutation
  - Tambah state `showAddTenantDialog`
  - Di tab Tenants header, tambah button "Tambah Penyewa"
  - Render `AddTenantDialog` dengan `properties` berisi hanya properti saat ini (pre-filtered)

- `src/features/users/components/tenant/AddTenantDialog.tsx`:
  - Tambah prop opsional `preselectedPropertyId?: string`
  - Jika ada, auto-set property dan skip property selection (langsung ke unit selection)

## 5. Hapus Tab Kepatuhan, Pindahkan ke Overview

Tab "Kepatuhan" di `PropertyDetail.tsx` dihapus. Konten compliance (KPI cards + tabs) dipindahkan ke tab Overview sebagai section baru di bawah DSS/Financial metrics.

**File diubah:**
- `src/pages/merchant/PropertyDetail.tsx`:
  - Hapus `compliance` dari validTabs dan dari dropdown "Lainnya"
  - Di Overview tab, render `LazyCompliance` dengan `propertyId` setelah `OverviewDssMetrics`
  - Tab yang tersisa: Ringkasan, Unit, Staf, Penyewa, Keuangan, Pemeliharaan
  - Pindahkan "Staf" (guardians) dari dropdown ke tab utama

## 6. Polis Asuransi -- Scan Dokumen dengan Pilihan Kamera/Galeri/Webcam

Form tambah polis asuransi di `PropertyCompliance.tsx` saat ini tidak punya fitur scan. Tambahkan `OcrCameraButton` di dialog "Tambah Polis" untuk scan dokumen polis.

**File diubah:**
- `src/pages/merchant/PropertyCompliance.tsx`:
  - Di `InsuranceTab`, tambah `OcrCameraButton` di dalam dialog form
  - Props: `edgeFunction="ocr-compliance-document"`, `bucket="verification-documents"`
  - `onExtracted` mengisi form fields: policy_number, provider, coverage_amount, dll

## 7. Security Incident "Dilaporkan Oleh" -- Dropdown Penjaga & Penyewa

Field `reported_by` di form insiden keamanan saat ini adalah text input biasa. Ubah menjadi Select dropdown yang menampilkan semua penjaga dan penyewa properti tersebut.

**File diubah:**
- `src/pages/merchant/PropertyCompliance.tsx`:
  - Di `SecurityTab`, fetch guardians via `property_guardians` table filtered by property_id
  - Fetch tenants via contracts + profiles untuk properti tersebut
  - Ganti `<Input>` reported_by menjadi `<Select>` dengan optgroup: Penjaga, Penyewa, dan opsi "Lainnya" (free text fallback)

## 8. Scan Dokumen di Tab Dokumen -- Pilihan Kamera/Galeri/Webcam

`OcrScanButton` di `ComplianceDocsTab` (line 358) menggunakan basic file input tanpa pilihan. Ganti dengan `OcrCameraButton` yang sudah ada (sudah punya dropdown Kamera/Galeri/Webcam).

**File diubah:**
- `src/pages/merchant/PropertyCompliance.tsx`:
  - Di `ComplianceDocsTab`, ganti `OcrScanButton` inline component dengan `OcrCameraButton`
  - Props: `label="Scan Dokumen"`, `bucket="verification-documents"`, `edgeFunction="ocr-compliance-document"`
  - `onExtracted` mengisi form fields dari hasil OCR

## 9. Comprehensive Seed Data dengan Dummy Photos

Buat migration seed data yang mengisi semua tabel dengan data dummy termasuk photo URLs menggunakan placeholder images (picsum.photos atau ui-avatars.com).

**Data yang di-seed:**
- `facilities` - 10+ fasilitas master (AC, TV, lemari, dll) dengan harga dan umur pakai
- `property_facilities` - Link fasilitas ke properti yang ada
- `unit_facilities` - Link fasilitas ke unit yang ada
- `insurance_policies` - 2-3 polis asuransi dummy
- `compliance_documents` - 3-5 dokumen kepatuhan (IMB, PBB, dll)
- `security_incidents` - 2-3 insiden keamanan
- `disaster_risk_profiles` - Profil risiko untuk properti
- Update `properties.images` dengan placeholder photos
- Update `units.photos` dengan placeholder photos  
- Update `property_guardians.photo_url` dengan placeholder avatars
- `merchant_feedback` - 2-3 feedback dummy
- Update `profiles.avatar_url` dengan placeholder avatars

---

## Files Summary

| File | Change |
|------|--------|
| `src/shared/components/PhotoLightbox.tsx` | **Baru**: Lightbox component dengan zoom |
| `src/pages/merchant/PropertyDetail.tsx` | Photo lightbox, fasilitas edit di overview, tambah unit button, tambah penyewa button, hapus tab compliance, pindahkan ke overview, pindahkan guardians ke tab utama |
| `src/pages/merchant/UnitDetail.tsx` | Photo lightbox integration |
| `src/features/properties/components/UnitFormDialog.tsx` | Tambah prop `preselectedPropertyId` |
| `src/features/users/components/tenant/AddTenantDialog.tsx` | Tambah prop `preselectedPropertyId` |
| `src/pages/merchant/PropertyCompliance.tsx` | OCR scan polis asuransi, reported_by dropdown, scan dokumen pakai OcrCameraButton |
| **Database seed migration** | Seed data facilities, compliance, photos placeholder |

## Technical Notes

- PhotoLightbox menggunakan CSS `transform: scale()` dengan wheel/touch events, bukan library eksternal -- meminimalkan bundle size
- Placeholder photos dari `https://picsum.photos/seed/{id}/800/600` untuk properti/unit, `https://ui-avatars.com/api/?name={name}` untuk avatar
- Seed data menggunakan migration tool (INSERT statements) yang reference existing property/unit IDs dari database
- `preselectedPropertyId` prop di UnitFormDialog dan AddTenantDialog bersifat optional -- backward compatible
- Compliance di overview hanya render jika `propertyId` tersedia (sudah handled oleh existing LazyCompliance component)
