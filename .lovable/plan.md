

# Fase 6: DSS & AI Integration

## Ringkasan

Fase ini mengintegrasikan data baru dari Fase 1-5 ke dalam AI chatbot, menambah kemampuan OCR untuk dokumen compliance, memperkaya DSS Advisor, mengimplementasikan dual-role (merchant+vendor), dan menghubungkan vendor marketplace dengan properti merchant.

---

## 1. AI Chatbot Enhancement -- Konteks Data Real-Time

Memperkaya ketiga edge function chatbot agar menyertakan data dari fase sebelumnya dalam system prompt.

### 1a. `merchant-ai-assistant` -- Tambah Data Baru
- Fetch `property_guardians` (total gaji, jumlah penjaga aktif)
- Fetch `disaster_risk_profiles` (ringkasan level risiko per properti)
- Fetch `insurance_policies` (polis aktif, total coverage, yang akan expired)
- Fetch `compliance_documents` (dokumen expired, yang perlu diperbarui)
- Fetch `security_incidents` (insiden terbuka)
- Fetch `tenant_payment_metrics` (tenant dengan skor rendah)
- Fetch `occupancy_snapshots` (tren occupancy terbaru)
- Tambahkan data kalkulasi keuangan (ROI, payback period) dari kolom `properties`
- Masukkan semua data di atas ke dalam `contextData` string yang sudah ada

### 1b. `vendor-ai-assistant` -- Tambah Konteks Layanan Properti
- Fetch data maintenance requests yang bisa di-handle vendor (berdasarkan kategori)
- Tambah konteks peluang job dari merchant terdekat

### 1c. `ai-chatbot` (Tenant) -- Tambah Konteks Keamanan & Compliance
- Fetch `security_incidents` terkait properti tenant
- Fetch info asuransi properti tempat tenant tinggal (ringkasan coverage)

---

## 2. OCR Enhancement -- Scan Dokumen IMB, PBB, Invoice Maintenance

### 2a. Edge Function Baru: `ocr-compliance-document`
- Menerima file dari bucket `verification-documents` atau `contract-documents`
- Mendukung tipe: `IMB`, `PBB`, `POLIS_ASURANSI`, `INVOICE_MAINTENANCE`
- Menggunakan tool calling Gemini 2.5 Pro (pattern sama dengan `ocr-business-document`)
- Extracted fields per tipe:
  - **IMB**: nomor IMB, tanggal terbit, pemilik, alamat, luas bangunan, fungsi bangunan
  - **PBB**: NOP, tahun pajak, NJOP, luas tanah/bangunan, jumlah pajak, jatuh tempo
  - **Polis Asuransi**: nomor polis, perusahaan, premi, coverage, masa berlaku
  - **Invoice Maintenance**: nomor invoice, vendor, deskripsi pekerjaan, total biaya, tanggal
- Auto-populate ke tabel `compliance_documents` yang sudah ada (dari Fase 5)
- Log ke `ml_model_runs` dan `ocr_results`

### 2b. Frontend -- OCR Upload di Compliance Dashboard
- Tambah tombol "Scan Dokumen" di tab Dokumen pada `PropertyCompliance.tsx`
- Upload file ke bucket, panggil `ocr-compliance-document`, tampilkan hasil
- Reuse pattern `OcrUploadCard` yang sudah ada

### 2c. Service & Hook
- `src/features/compliance/services/ocrComplianceService.ts` -- invoke edge function
- `src/features/compliance/hooks/useOcrCompliance.ts` -- mutation hook

---

## 3. DSS Advisor Enhancement -- Data Baru Fase 1-5

### 3a. Update `dss-pricing-advisor`
- Tambah fetch data keuangan properti (construction_cost, renovation_cost, monthly_amortization) ke konteks
- Tambah data `tenant_payment_metrics` (skor bayar tenant per unit)
- Tambah occupancy_snapshots seasonal data

### 3b. Update `dss-investment-insight`
- Tambah data disaster risk profile dan insurance coverage
- Tambah data compliance (expired docs = risiko legal)
- Tambah data keuangan (ROI, payback period aktual)

### 3c. Update `dss-collection-strategy`
- Tambah `tenant_payment_metrics` (payment_score, avg_days_late)
- Tambah data demografi tenant (age_group, occupation)

### 3d. Update `dss-maintenance-priority`
- Tambah data security incidents
- Tambah data guardian assignment (apakah ada penjaga di properti)

---

## 4. Dual-Role Support -- Merchant + Vendor dalam 1 Akun

### 4a. Database
- Tabel `user_roles` sudah mendukung multi-row per user (tidak ada unique constraint pada user_id saja)
- Tambah migration: buat fungsi `get_user_roles(uuid)` yang return array of roles

### 4b. Auth Context (`useAuth.tsx`)
- Ubah `role: AppRole | null` menjadi `roles: AppRole[]` dan tetap `primaryRole: AppRole | null`
- Fetch SEMUA roles dari `user_roles` (bukan `.maybeSingle()`)
- Jika user punya role merchant DAN vendor, fetch kedua profil
- Tambah state `activeRole` yang bisa di-switch

### 4c. Role Switcher UI
- Komponen `RoleSwitcher.tsx` di sidebar/navbar
- Dropdown yang menampilkan roles yang dimiliki user
- Switch `activeRole` tanpa logout
- Redirect ke dashboard role yang dipilih

### 4d. Halaman "Tambah Role"
- Di profile merchant, tombol "Daftar sebagai Vendor juga"
- Di profile vendor, tombol "Daftar sebagai Merchant juga"
- Insert row baru ke `user_roles` + create merchant/vendor record

### 4e. RLS Update
- Pastikan RLS policies tetap aman untuk multi-role
- Fungsi `has_role()` sudah mendukung check per role, jadi tidak perlu perubahan besar

---

## 5. Layanan Tambahan -- Integrasi Vendor System

### 5a. Merchant-Vendor Connection
- Database: Tabel `property_vendor_services` (property_id, vendor_id, service_type, status, monthly_fee)
- Memungkinkan merchant assign vendor tetap ke properti (laundry, cleaning, catering)

### 5b. Merchant UI -- Kelola Vendor Properti
- Tab baru "Vendor" di `PropertyDetail.tsx`
- List vendor yang tersedia (dari tabel `vendors` yang verified)
- Assign/remove vendor ke properti
- Lihat performa vendor (rating, completed orders)

### 5c. Vendor UI -- Lihat Properti Assigned
- Halaman baru `/vendor/assigned-properties`
- List properti yang menggunakan jasa mereka
- Statistik per properti (jumlah order, revenue)

---

## Detail Teknis

### File Baru
| File | Deskripsi |
|------|-----------|
| `supabase/functions/ocr-compliance-document/index.ts` | OCR edge function untuk IMB/PBB/Polis/Invoice |
| `src/features/compliance/services/ocrComplianceService.ts` | Invoke OCR compliance |
| `src/features/compliance/hooks/useOcrCompliance.ts` | React Query mutation |
| `src/features/auth/components/RoleSwitcher.tsx` | UI switch role |
| `src/pages/vendor/AssignedProperties.tsx` | Halaman vendor assigned |
| Migration SQL | Tabel `property_vendor_services`, fungsi `get_user_roles` |

### File yang Dimodifikasi
| File | Perubahan |
|------|-----------|
| `supabase/functions/merchant-ai-assistant/index.ts` | Tambah fetch data Fase 1-5 |
| `supabase/functions/vendor-ai-assistant/index.ts` | Tambah konteks maintenance opportunities |
| `supabase/functions/ai-chatbot/index.ts` | Tambah konteks keamanan & compliance |
| `supabase/functions/dss-pricing-advisor/index.ts` | Tambah data keuangan & tenant metrics |
| `supabase/functions/dss-investment-insight/index.ts` | Tambah risk & compliance data |
| `supabase/functions/dss-collection-strategy/index.ts` | Tambah tenant payment metrics |
| `supabase/functions/dss-maintenance-priority/index.ts` | Tambah security & guardian data |
| `src/features/auth/hooks/useAuth.tsx` | Multi-role support |
| `src/features/auth/types/auth.ts` | Tambah `roles`, `activeRole` |
| `src/pages/merchant/PropertyDetail.tsx` | Tab vendor |
| `src/pages/merchant/PropertyCompliance.tsx` | Tombol scan OCR |
| `src/shared/components/layouts/navigation-config.ts` | Route vendor assigned |
| `src/App.tsx` | Route baru |
| `supabase/config.toml` | Daftarkan `ocr-compliance-document` |

### Urutan Implementasi
1. Database migration (tabel + fungsi baru)
2. OCR edge function `ocr-compliance-document`
3. Update 4 DSS advisor edge functions
4. Update 3 chatbot edge functions
5. Dual-role auth changes
6. Role switcher UI
7. Property-vendor integration (tabel + UI)
8. Frontend hooks & halaman baru

