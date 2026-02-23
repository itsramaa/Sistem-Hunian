
# Strategi Input Data: Progressive Disclosure & DSS Readiness Score

## Ringkasan

Implementasi sistem progressive disclosure 4 level untuk input data properti, dilengkapi dengan "DSS Readiness Score" yang menghitung persentase kelengkapan data dan memblokir akses fitur DSS jika belum 100%.

---

## Arsitektur

Sistem terdiri dari 3 komponen utama:

1. **DSS Readiness Engine** -- hook yang menghitung skor berdasarkan data yang ada di database
2. **DSS Readiness Checklist UI** -- widget yang menampilkan progress dan daftar data yang belum diisi
3. **DSS Gate Integration** -- integrasi dengan `TierGate` yang sudah ada untuk memblokir DSS jika data belum lengkap

---

## Level Data & Definisi Field

### Level 1: Onboarding (Wajib)
Field yang sudah wajib di `propertySchema`:
- `name`, `property_type`, `address`, `province`, `city`
- Minimal 1 unit dengan `unit_number`, `unit_type`, `rent_amount`, `status`

### Level 2: Operasional (Recommended)
- `amenities` (minimal 1 fasilitas)
- `images` (minimal 1 foto properti)
- Guardian (`property_guardians` -- minimal 1 penjaga aktif)
- `description` (deskripsi properti)
- `floor_count`, `building_condition`

### Level 3: Financial (Opsional)
- `construction_cost`, `renovation_cost`
- `funding_source`, `monthly_amortization`
- `monthly_maintenance_cost`, `avg_annual_unexpected_cost`
- `marketing_cost`

### Level 4: DSS Required (Wajib untuk DSS)
- Semua data Level 3 terisi
- `tenant_payment_metrics` -- ada data payment history untuk tenant
- `disaster_risk_profiles` -- profil risiko terisi untuk properti
- `insurance_policies` -- minimal 1 polis aktif
- `compliance_documents` -- minimal IMB dan PBB terdaftar
- `occupancy_snapshots` -- ada data occupancy (minimal 1 bulan)

---

## Detail Teknis

### 1. DSS Readiness Hook: `useDssReadiness.ts`

File baru: `src/features/dss/hooks/useDssReadiness.ts`

- Menerima `propertyId` dan `merchantId`
- Fetch data dari tabel: `properties`, `units`, `property_guardians`, `disaster_risk_profiles`, `insurance_policies`, `compliance_documents`, `tenant_payment_metrics`, `occupancy_snapshots`
- Menghitung skor per level (Level 1-4)
- Return:
  - `overallScore: number` (0-100)
  - `levels: { level: number, label: string, score: number, items: ChecklistItem[] }[]`
  - `isDssReady: boolean` (true jika score === 100)
  - `missingItems: ChecklistItem[]`

```typescript
interface ChecklistItem {
  key: string;
  label: string;
  level: 1 | 2 | 3 | 4;
  completed: boolean;
  icon: string; // emoji
  link?: string; // navigasi ke halaman input
}
```

### 2. DSS Readiness Checklist Widget: `DssReadinessChecklist.tsx`

File baru: `src/features/dss/components/DssReadinessChecklist.tsx`

- Circular progress indicator dengan persentase
- 4 section collapsible per level, masing-masing dengan:
  - Badge level (Wajib/Recommended/Opsional/DSS Required)
  - Progress bar per level
  - Daftar item dengan checkbox (completed/not)
  - Link "Lengkapi" yang mengarah ke halaman input terkait
- Warna berbeda per level:
  - Level 1: hijau (wajib, biasanya sudah terisi)
  - Level 2: biru (recommended)
  - Level 3: kuning (opsional)
  - Level 4: merah/ungu (DSS required)

### 3. DSS Readiness Card: `DssReadinessCard.tsx`

File baru: `src/features/dss/components/DssReadinessCard.tsx`

- Compact card untuk ditampilkan di `PropertyDetail.tsx`
- Menampilkan: skor, progress bar, jumlah item belum diisi
- Tombol "Lihat Detail" membuka checklist lengkap
- Jika 100%: tampilkan badge "DSS Ready" dengan ikon centang

### 4. Integrasi dengan Sistem yang Ada

**`PropertyDetail.tsx`**:
- Tambah `DssReadinessCard` di bagian atas tab "Keuangan"
- Jika skor < 100% dan user klik fitur DSS, tampilkan checklist

**`TierGate.tsx`** -- Update:
- Tambah prop `propertyId` opsional
- Jika `propertyId` diberikan, cek DSS readiness selain tier
- Jika tier OK tapi data belum siap, tampilkan checklist bukan paywall

**`DssAdvisor.tsx`**:
- Tambah property selector di atas
- Setelah pilih properti, tampilkan readiness score
- Jika belum 100%, tampilkan checklist dan blokir advisor

**`PropertyFormDialog.tsx`**:
- Tambah indikator level di setiap step:
  - Step 0 (Info Dasar): Badge "Level 1 - Wajib"
  - Step 1 (Lokasi): Badge "Level 1 - Wajib"
  - Step 2 (Detail): Badge "Level 2 - Recommended"
  - Step 3 (Media): Badge "Level 2 - Recommended"
- Tidak mengubah flow form, hanya menambah visual label

### 5. Navigasi Link dari Checklist

Setiap item yang belum lengkap punya link navigasi:
| Item | Link |
|------|------|
| Data properti dasar | `/merchant/properties/{id}` (tab Overview) |
| Unit | `/merchant/properties/{id}` (tab Unit) |
| Fasilitas & Foto | `/merchant/properties/{id}` (edit property) |
| Guardian | `/merchant/guardians` |
| Data keuangan | `/merchant/properties/{id}` (tab Keuangan) |
| Disaster risk | `/merchant/compliance` |
| Insurance | `/merchant/compliance` (tab Asuransi) |
| Compliance docs | `/merchant/compliance` (tab Dokumen) |
| Tenant analytics | `/merchant/tenant-analytics` |

---

## File yang Dibuat

| File | Deskripsi |
|------|-----------|
| `src/features/dss/hooks/useDssReadiness.ts` | Hook kalkulasi skor readiness |
| `src/features/dss/components/DssReadinessChecklist.tsx` | Widget checklist lengkap |
| `src/features/dss/components/DssReadinessCard.tsx` | Card compact untuk PropertyDetail |

## File yang Dimodifikasi

| File | Perubahan |
|------|-----------|
| `src/pages/merchant/PropertyDetail.tsx` | Tambah DssReadinessCard di tab Keuangan |
| `src/features/dss/components/TierGate.tsx` | Tambah cek DSS readiness |
| `src/pages/merchant/DssAdvisor.tsx` | Tambah property selector + readiness check |
| `src/features/properties/components/PropertyFormDialog.tsx` | Tambah badge level per step |

## Tidak Ada Perubahan Database

Semua data sudah tersedia di tabel yang ada. Hook `useDssReadiness` hanya melakukan query read-only untuk menghitung skor.
