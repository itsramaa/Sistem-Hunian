
# Redesign Maintenance Page + Photo Upload + OCR Integration (7 Use Cases)

## Overview

Tiga area perbaikan utama:
1. **Redesign halaman Maintenance** agar rapi dan profesional
2. **Tambah fitur foto** pada pembuatan maintenance request
3. **Integrasi OCR** di 7 titik berbeda dalam aplikasi

---

## 1. Redesign Halaman Maintenance (Maintenance.tsx)

**Masalah:** Layout saat ini terasa flat dan kurang terstruktur.

**Perbaikan:**
- Bungkus stats, filters, dan table dalam card sections yang jelas dengan heading
- Tambah tab view: "Semua" | "Pending" | "In Progress" | "Completed" untuk quick-filter
- Stat cards: tambah trend indicator (perbandingan bulan ini vs bulan lalu)
- Filters: redesign menjadi collapsible filter bar dengan chip-style active filters
- Table: tambah thumbnail foto pertama di kolom Title jika ada images
- Empty state: redesign dengan ilustrasi dan CTA yang lebih menarik

**File:** `src/pages/merchant/Maintenance.tsx`

---

## 2. Redesign MaintenanceDetail Page

**Masalah:** Detail page kurang lengkap, tidak ada galeri foto, cost tracking, atau vendor info yang mendalam.

**Fitur baru di `MerchantMaintenanceDetail.tsx`:**
- **Photo Gallery:** Tampilkan images dalam grid dengan lightbox zoom (klik untuk fullscreen)
- **Completion Photos:** Section terpisah untuk foto setelah pekerjaan selesai
- **Cost Summary Card:** Tampilkan agreed_price, actual cost, material costs
- **Vendor Card (enhanced):** Rating, contact info, service categories, job history count
- **SLA Progress Bar:** Visual progress dari created_at menuju sla_deadline
- **Quick Actions Bar:** Tombol-tombol cepat (Assign Vendor, Mark Complete, Cancel) di header
- **OCR Scan Button:** Tombol untuk scan struk maintenance (integrasi `ocr-maintenance-receipt`)

**File:** `src/pages/merchant/MaintenanceDetail.tsx`

---

## 3. Foto Upload di CreateMaintenanceDialog

**Masalah:** Dialog create maintenance belum ada upload foto.

**Perbaikan di `CreateMaintenanceDialog.tsx`:**
- Import dan gunakan `MaintenancePhotoUpload` component (sudah ada)
- Tambah state `photos: string[]`
- Kirim `images: photos` dalam payload ke `createMerchantRequest`

**Perbaikan di `CreateMerchantMaintenancePayload` type:**
- Tambah `images?: string[]`

**Perbaikan di `maintenanceService.createMerchantRequest`:**
- Sertakan `images` dalam insert query

**File:**
- `src/features/maintenance/components/CreateMaintenanceDialog.tsx`
- `src/features/maintenance/types/index.ts`
- `src/features/maintenance/services/maintenanceService.ts`

---

## 4. Integrasi OCR - 7 Use Cases

Semua edge functions OCR sudah tersedia di backend. Yang perlu dibuat adalah **komponen frontend** yang memicu kamera/galeri dan mengirim ke edge function yang sesuai.

### Komponen Reusable Baru: `OcrCameraButton`

Buat komponen `src/shared/components/OcrCameraButton.tsx`:
- Button yang memicu `<input type="file" accept="image/*" capture="environment">` untuk kamera
- Atau mode galeri tanpa `capture` attribute
- Upload file ke Supabase Storage
- Invoke edge function OCR yang relevan
- Tampilkan hasil dalam dialog/sheet dengan field-field yang diekstrak
- Callback `onExtracted(data)` untuk auto-fill form

### 4.1 Verifikasi Identitas (KTP/Paspor)

**Lokasi:** Form registrasi tenant / merchant onboarding
**Edge Function:** `ocr-ktp-extract` (sudah ada)
**Integrasi:**
- Tambah tombol "Scan KTP" di halaman verifikasi profil
- Auto-fill: Nama, NIK, Alamat dari hasil OCR
- Tampilkan confidence score per field

**File yang diubah:** `src/pages/merchant/Settings.tsx` atau `src/features/auth/components/VerificationForm.tsx` (wherever identity verification form exists)

### 4.2 Legalitas Properti (Sertifikat/IMB/PBB)

**Lokasi:** Form tambah properti / halaman compliance
**Edge Function:** `ocr-compliance-document` (sudah ada)
**Integrasi:** Sudah ada `OcrScanButton` di `PropertyCompliance.tsx` -- hanya perlu ditambahkan juga di form create property.

**File:** `src/features/properties/components/PropertyFormDialog.tsx`

### 4.3 Bukti Pembayaran (Transfer Receipt)

**Lokasi:** `MarkPaidDialog.tsx` dan `CreatePaymentDialog.tsx`
**Edge Function:** `ocr-payment-proof` (sudah ada)
**Integrasi:**
- Tambah tombol "Scan Bukti Transfer" di dialog pembayaran
- Auto-fill: nominal, tanggal, bank pengirim, referensi
- Verifikasi otomatis nominal vs jumlah tagihan

**File:** `src/features/payments/components/MarkPaidDialog.tsx`, `src/features/payments/components/CreatePaymentDialog.tsx`

### 4.4 Pendaftaran Bisnis (NPWP/NIB/SIUP)

**Lokasi:** Profil Merchant / Vendor settings
**Edge Function:** `ocr-business-document` (sudah ada)
**Integrasi:**
- Tambah tombol "Scan Dokumen Bisnis" di settings merchant/vendor
- Auto-fill: nomor NPWP, nama perusahaan, alamat bisnis

**File:** `src/pages/merchant/Settings.tsx`, `src/pages/vendor/Settings.tsx`

### 4.5 Manajemen Kontrak Fisik

**Lokasi:** Form upload kontrak / detail kontrak
**Edge Function:** Baru -- `ocr-contract-document`
**Integrasi:**
- Buat edge function baru untuk scan kontrak sewa
- Ekstrak: nama penyewa, alamat unit, durasi sewa, harga sewa, tanggal mulai/akhir
- Tombol "Digitalisasi Kontrak" di halaman kontrak

**File baru:**
- `supabase/functions/ocr-contract-document/index.ts`
- Integrasi di `src/pages/merchant/ContractDetail.tsx` atau form kontrak

### 4.6 Struk Maintenance & Perbaikan

**Lokasi:** Detail maintenance request
**Edge Function:** `ocr-maintenance-receipt` (sudah ada)
**Integrasi:**
- Tombol "Scan Struk/Nota" di detail maintenance
- Auto-fill: vendor name, total cost, item details, tanggal
- Simpan data biaya ke maintenance request

**File:** `src/pages/merchant/MaintenanceDetail.tsx`

### 4.7 Inventaris Aset (Barcode/Label)

**Lokasi:** Detail unit / tab inventaris
**Edge Function:** Baru -- `ocr-asset-label`
**Integrasi:**
- Buat edge function untuk scan barcode/label aset
- Buat tabel baru `unit_assets` untuk menyimpan inventaris
- Ekstrak: nama aset, serial number, merek, model
- Tombol "Scan Aset" di tab inventaris unit

**DB Migration:**
```sql
CREATE TABLE unit_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id uuid NOT NULL REFERENCES units(id) ON DELETE CASCADE,
  merchant_id uuid NOT NULL REFERENCES merchants(id),
  asset_name text NOT NULL,
  serial_number text,
  brand text,
  model text,
  category text DEFAULT 'other',
  condition text DEFAULT 'good',
  photo_url text,
  barcode_data text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE unit_assets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Merchants manage own assets" ON unit_assets
  FOR ALL USING (merchant_id IN (SELECT id FROM merchants WHERE user_id = auth.uid()));
```

**File baru:**
- `supabase/functions/ocr-asset-label/index.ts`
- `src/features/properties/components/UnitAssetInventory.tsx`
- Integrasi di `src/pages/merchant/UnitDetail.tsx` sebagai tab baru "Inventaris"

---

## Daftar File yang Diubah/Dibuat

| File | Aksi |
|------|------|
| `src/pages/merchant/Maintenance.tsx` | Redesign layout |
| `src/pages/merchant/MaintenanceDetail.tsx` | Redesign + photo gallery + OCR struk |
| `src/features/maintenance/components/CreateMaintenanceDialog.tsx` | Tambah photo upload |
| `src/features/maintenance/types/index.ts` | Tambah images ke CreateMerchantPayload |
| `src/features/maintenance/services/maintenanceService.ts` | Sertakan images |
| `src/shared/components/OcrCameraButton.tsx` | Komponen reusable baru |
| `src/features/payments/components/MarkPaidDialog.tsx` | OCR bukti bayar |
| `src/features/payments/components/CreatePaymentDialog.tsx` | OCR bukti bayar |
| `supabase/functions/ocr-contract-document/index.ts` | Edge function baru |
| `supabase/functions/ocr-asset-label/index.ts` | Edge function baru |
| **DB Migration** | Tabel `unit_assets` |
| `src/features/properties/components/UnitAssetInventory.tsx` | Komponen inventaris baru |
| `src/pages/merchant/UnitDetail.tsx` | Tab inventaris baru |

---

## Catatan Teknis

- `OcrCameraButton` menggunakan `<input type="file" accept="image/*" capture="environment">` yang otomatis memicu kamera di mobile dan galeri di desktop
- Semua OCR edge functions sudah menggunakan pattern yang konsisten dari `dss-utils.ts` (auth, tier check, Lovable AI gateway, logging)
- Edge function baru (`ocr-contract-document`, `ocr-asset-label`) akan mengikuti pattern yang sama
- Photo upload untuk maintenance menggunakan bucket `maintenance-photos` yang sudah ada dan public
- Tabel `unit_assets` dilengkapi RLS policy agar hanya merchant pemilik yang bisa CRUD
