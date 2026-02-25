# Fix Foto Upload, Unit Detail Enhancements, Fasilitas Consolidation, dan Listrik Bayar Sendiri

## 1. Fix Photo Upload di Dialog Kelola Foto Properti

**Masalah:** `ImageGalleryUpload` menggunakan `supabase` dari `@/lib/integrations/supabase/client` sedangkan halaman compliance dan lainnya menggunakan `@/integrations/supabase/client`. Keduanya seharusnya identik tapi bisa jadi masalah konfigurasi. Masalah utama kemungkinan adalah `onImagesChange` memanggil `propertyService.updateProperty` secara langsung tanpa `await` yang benar, atau webcam capture gagal karena dialog context.

**Fix:**

- Di `PropertyDetail.tsx` (line 886-888): Wrap `onImagesChange` callback agar handle error dengan toast dan re-fetch properly
- Di `ImageGalleryUpload` (`FileUpload.tsx` line 279-295): Pastikan `handleWebcamCapture` error handling benar dan webcam dialog tidak conflict dengan parent dialog

**File:** `src/shared/components/FileUpload.tsx`

- Fix webcam capture di `ImageGalleryUpload`: pastikan blob upload path benar
- Tambah error boundary dan logging

**File:** `src/pages/merchant/PropertyDetail.tsx`

- Fix `onImagesChange` callback di photo dialog

## 2. Polis Asuransi -- Scan Dokumen Sudah Ada

Dari kode yang saya baca, `OcrCameraButton` sudah ada di `InsuranceTab` (line 267-274 di PropertyCompliance.tsx). Ini sudah diimplementasikan. Akan diperiksa apakah berfungsi.

## 3. Tambah Unit Button di Kanan (Bukan Kiri)

**File:** `src/pages/merchant/PropertyDetail.tsx` (line 517-558)

- Saat ini layout: filter di kiri, lalu `Tambah Unit` + view toggle di kanan
- Button "Tambah Unit" sudah di kanan (line 534-536). Akan diverifikasi dan perbaiki jika perlu.

**Cek:** Button sudah di kanan dalam `div className="flex items-center gap-2"` (line 533). Ini sudah benar.

## 4. Fasilitas Bug -- Belum Terkonsolidasi

**Masalah:** `CustomAmenities` menggunakan `(supabase.from as any)('facilities')` -- cast ke `any` karena tabel `facilities` mungkin belum ada di types.ts auto-generated. Jika query gagal, fallback ke hardcoded list. Tapi fallback menggunakan value `parking`, `ac` dll sedangkan DB facilities menggunakan UUID. Ini menyebabkan ketidakcocokan -- saat property punya amenities `['ac', 'parking']` (dari fallback), tapi DB sudah ada facilities, toggle tidak match.

**Fix:**

- `CustomAmenities.tsx`: Gabungkan DB facilities + fallback. Jangan replace fallback sepenuhnya, tapi merge. Jika DB punya data, tampilkan DB items + existing selected amenities dari fallback
- Saat menyimpan amenities, simpan `name` (bukan UUID) agar konsisten
- Atau, ubah logic: selalu tampilkan semua (DB + fallback unique), dengan selected state dari property.amenities

**File:** `src/features/properties/components/CustomAmenities.tsx`

- Ubah logic merge: selalu tampilkan DB facilities + fallback yang belum ada di DB
- Gunakan `name` sebagai value (bukan UUID) untuk konsistensi dengan data lama

## 5. Listrik Ada Opsi "Bayar Sendiri"

**Masalah:** Saat ini listrik hanya punya toggle "Termasuk Sewa?" (ya/tidak). Jika tidak termasuk, muncul biaya + tipe. Tapi tidak ada opsi "Bayar Sendiri" (tenant bayar langsung ke PLN).

**Fix:**

- `COST_TYPE_OPTIONS` di `constants/index.ts`: Tambah opsi `{ value: 'bayar_sendiri', label: 'Bayar Sendiri' }`
- `UnitFormDialog.tsx`: Jika `electricity_cost_type` = `bayar_sendiri`, sembunyikan field biaya listrik (karena tenant bayar langsung)

**File:** `src/features/properties/constants/index.ts`

- Tambah `bayar_sendiri` ke `COST_TYPE_OPTIONS`

**File:** `src/features/properties/components/UnitFormDialog.tsx`

- Kondisikan field biaya listrik: hide jika tipe = `bayar_sendiri`

## 6. Kelola Foto Unit di Detail Unit

**File:** `src/pages/merchant/UnitDetail.tsx`

- Di header (line 168), tambah button "Foto" di samping "Edit" dengan icon Camera
- Tambah state `showPhotoDialog`
- Tambah Dialog dengan `ImageGalleryUpload` untuk unit photos (bucket `property-images`, folder `units/{unitId}`)
- `onImagesChange`: update unit photos via supabase update

## 7. Ringkasan Unit Kosong -- Tambah Info

**Masalah:** Tab Ringkasan di UnitDetail hanya menampilkan penghuni, deskripsi, dan fasilitas. Jika kosong, tampil "Unit kosong". Padahal ada data lain seperti occupancy_type (single/sharing), electricity, water, wifi info.

**File:** `src/pages/merchant/UnitDetail.tsx`

- Di `TabsContent value="overview"` (sebelum empty state check):
  - Tambah card "Detail Unit" yang menampilkan: occupancy_type (Single/Sharing), electricity info (termasuk/bayar sendiri/flat), water info, wifi info (speed, sharing type)
  - Perbaiki empty state check: jangan tampil "kosong" jika ada data utilitas

## 8. Tab Kontrak & Pembayaran -- Tambah Button dan Fix Inventaris

### Tab Kontrak di Unit Detail

**File:** `src/pages/merchant/UnitDetail.tsx` (line 330)

- Tambah header dengan button "Tambah Kontrak" yang membuka dialog kontrak (pre-selected unit)
- Perlu import `ContractFormDialog` atau buat inline dialog sederhana

### Tab Pembayaran di Unit Detail

**File:** `src/pages/merchant/UnitDetail.tsx` (line 368)

- Tambah button "Tambah Pembayaran" yang membuka dialog invoice/payment

### Tab Inventaris = Fasilitas Unit

**Masalah:** Tab Inventaris saat ini menggunakan `UnitAssetInventory` (scan barcode/label). Tapi seharusnya sama dengan fasilitas (menggunakan form yang sama dengan `CustomAmenities` + `FacilityManagementDialog`).

**File:** `src/pages/merchant/UnitDetail.tsx`

- Ganti `UnitAssetInventory` di tab Inventaris dengan `CustomAmenities` type="unit" + button "Kelola" yang membuka `FacilityManagementDialog`
- Tambah save mutation untuk update unit amenities

---

## Files Summary


| File                                                     | Change                                                                          |
| -------------------------------------------------------- | ------------------------------------------------------------------------------- |
| `src/shared/components/FileUpload.tsx`                   | Fix webcam capture di ImageGalleryUpload                                        |
| `src/pages/merchant/PropertyDetail.tsx`                  | Fix photo dialog callback                                                       |
| `src/features/properties/components/CustomAmenities.tsx` | Fix merge logic DB + fallback, gunakan name bukan UUID                          |
| `src/features/properties/constants/index.ts`             | Tambah `bayar_sendiri` ke COST_TYPE_OPTIONS                                     |
| `src/features/properties/components/UnitFormDialog.tsx`  | Hide biaya jika bayar_sendiri                                                   |
| `src/pages/merchant/UnitDetail.tsx`                      | Kelola foto, ringkasan info, kontrak/pembayaran buttons, inventaris = fasilitas |


## Technical Notes

- Fasilitas consolidation: value yang disimpan di `property.amenities` akan menggunakan facility `name` (lowercase, underscore) bukan UUID, untuk backward compat dengan data lama
- "Bayar Sendiri" berarti tenant bayar langsung ke penyedia (PLN/PDAM), tidak ada biaya di sistem
- Tab Inventaris di Unit Detail sekarang identik dengan fasilitas unit, menggunakan komponen yang sama
- Foto unit di-manage via `ImageGalleryUpload` dengan bucket `property-images` (sudah public)  
Tambahkan system inventory yang terintegrasi dengan fasilitas dan inventorinya itu ada di menu sidebar.