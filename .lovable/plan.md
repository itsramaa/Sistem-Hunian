

# 3.2 OCR & Document Processing -- Gap Analysis & Implementation

## Status Existing

| FR | Deskripsi | Status |
|----|-----------|--------|
| FR-401 | Upload PDF, JPG, PNG | Sudah ada (`FileUpload`, `OcrUploadCard`) |
| FR-402 | Drag-drop upload | Sudah ada (`OcrUploadCard` drag-drop) |
| FR-403 | Organized folder structure | Sudah ada (`verification-documents` bucket, path: `userId/folder/timestamp.ext`) |
| FR-404 | Preview dokumen sebelum processing | Sudah ada untuk image (`FileUpload` preview). PDF preview belum ada |
| FR-405 | Track metadata | Sudah ada (`ocr_results` table: document_type, document_url, created_at, user_id) |
| FR-501 | OCR extract text | Sudah ada (5 edge functions: ktp, payment-proof, business-doc, compliance-doc, maintenance-receipt) |
| FR-502 | Multiple document types | Sudah ada (KTP, bukti bayar, IMB, sertifikat, invoice/nota) |
| FR-503 | Confidence score | Sudah ada (semua OCR functions return confidence) |
| FR-504 | Highlight extracted text di original dokumen | **Belum ada** |
| FR-505 | Manual review dan correction | **Belum ada** (database columns ada, tapi UI belum) |

---

## Yang Perlu Diimplementasi

Hanya 3 hal yang perlu dibuat:

1. **Halaman Document Center** -- Pusat manajemen semua dokumen OCR (menggabungkan FR-504 dan FR-505)
2. **OCR Review & Correction UI** -- Komponen untuk edit field OCR result secara manual
3. **PDF Preview** -- Tambahan preview untuk file PDF (melengkapi FR-404)

Tidak ada perubahan database -- `ocr_results` sudah memiliki semua kolom yang diperlukan (`requires_review`, `review_notes`, `reviewed_by`, `reviewed_at`, `extracted_data`, `status`).

---

## Arsitektur

```text
[Frontend]
DocumentCenter.tsx  ---->  Supabase client (ocr_results CRUD)
  |-- OcrDocumentViewer.tsx   (preview dokumen + highlight fields)
  |-- OcrResultEditor.tsx     (manual review & correction form)
```

---

## 1. Halaman: Document Center

**File baru**: `src/pages/merchant/DocumentCenter.tsx`

Halaman terpusat untuk melihat semua hasil OCR, melakukan review, dan correction.

### Layout:
- PageHeader dengan icon FileSearch dan judul "Pusat Dokumen"
- Filter bar: document_type, status (completed/requires_review/error), date range
- Tabel hasil OCR dari `ocr_results`:
  - Kolom: Document Type, Status, Confidence Score, Upload Date, Requires Review badge, Actions
  - Klik baris -> buka detail view (side panel atau dialog)

### Detail View (Dialog/Sheet):
- **Kiri**: Preview dokumen original (image viewer atau PDF viewer via iframe/embed)
- **Kanan**: Extracted data fields yang bisa di-edit
- Confidence badge per field (dari `extracted_data.field_confidences`)
- Low-confidence fields di-highlight kuning
- Tombol "Approve" -> update status ke "completed", set reviewed_by dan reviewed_at
- Tombol "Reject" -> update status ke "rejected" dengan review_notes
- Tombol "Save Corrections" -> update `extracted_data` di `ocr_results`

---

## 2. Komponen: OcrDocumentViewer

**File baru**: `src/features/dss/components/OcrDocumentViewer.tsx`

Preview dokumen original dengan visual highlighting:
- Untuk image (JPG/PNG): tampilkan dengan `<img>` tag, overlay colored badges pada posisi field yang di-extract (menggunakan relative positioning berdasarkan field name, bukan exact coordinates karena OCR tidak return bounding boxes)
- Untuk PDF: tampilkan via `<iframe>` atau `<embed>` tag
- Zoom in/out controls
- Fit-to-width toggle

---

## 3. Komponen: OcrResultEditor

**File baru**: `src/features/dss/components/OcrResultEditor.tsx`

Form untuk review dan correction:
- Render semua fields dari `extracted_data` sebagai editable input
- Per-field confidence badge (color coded: hijau >= 80, kuning >= 60, merah < 60)
- Tombol "Reset" per field (kembalikan ke nilai original)
- Text area untuk review notes
- Status selector: "Approve" / "Reject"
- Save button -> update `ocr_results` row

---

## 4. Service & Hooks

### `src/features/dss/services/ocrDocumentService.ts`
- `fetchOcrResults(merchantId, filters?)` -- query `ocr_results` with filters
- `fetchOcrResultById(id)` -- single result detail
- `updateOcrResult(id, updates)` -- update extracted_data, status, review_notes, reviewed_by, reviewed_at
- `getDocumentPreviewUrl(documentUrl)` -- generate signed URL for private bucket documents

### `src/features/dss/hooks/useOcrDocuments.ts`
- `useOcrResults(merchantId, filters)` -- query hook
- `useOcrResultDetail(id)` -- single query hook
- `useUpdateOcrResult()` -- mutation hook

---

## 5. Navigasi

Update `navigation-config.ts`:
- Tambah item di grup "Bantuan" (sebelum Tutorial OCR) atau buat grup baru "Dokumen":
  `{ path: "/merchant/documents", icon: FileSearch, label: "Pusat Dokumen" }`

Update `App.tsx`:
- Lazy import + route `documents`

---

## Detail Teknis

### File Baru

| File | Deskripsi |
|------|-----------|
| `src/pages/merchant/DocumentCenter.tsx` | Halaman pusat dokumen OCR |
| `src/features/dss/components/OcrDocumentViewer.tsx` | Preview dokumen + field highlight |
| `src/features/dss/components/OcrResultEditor.tsx` | Form review & correction |
| `src/features/dss/services/ocrDocumentService.ts` | Service CRUD ocr_results |
| `src/features/dss/hooks/useOcrDocuments.ts` | React Query hooks |

### File yang Dimodifikasi

| File | Perubahan |
|------|-----------|
| `src/shared/components/layouts/navigation-config.ts` | Tambah menu "Pusat Dokumen" + import FileSearch |
| `src/App.tsx` | Tambah lazy import + route |

### Tidak Ada Perubahan Database

Tabel `ocr_results` sudah memiliki semua kolom yang diperlukan:
- `requires_review` (boolean)
- `review_notes` (text)
- `reviewed_by` (uuid)
- `reviewed_at` (timestamptz)
- `extracted_data` (jsonb -- bisa di-update untuk correction)
- `status` (text -- completed/requires_review/error)

### Tidak Ada Edge Function Baru

Semua 5 OCR edge functions sudah ada. Yang ditambahkan hanya frontend CRUD untuk mengelola hasil OCR.

### Urutan Implementasi
1. Service `ocrDocumentService.ts`
2. Hooks `useOcrDocuments.ts`
3. Komponen `OcrDocumentViewer.tsx`
4. Komponen `OcrResultEditor.tsx`
5. Halaman `DocumentCenter.tsx`
6. Update navigasi + routes

