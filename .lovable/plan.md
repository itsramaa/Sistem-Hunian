

# 2.1.5 Tenant Quality Scoring + 3.1.1 Data Entry & Collection

## Ringkasan

Implementasi terbagi menjadi 2 bagian:

1. **Tenant Quality Scoring (BR-501 s/d BR-504)**: Edge function AI baru `ml-tenant-quality-scoring` + halaman dashboard baru "Tenant Quality Scoring" yang menyediakan penilaian kualitas tenant, prediksi payment reliability, identifikasi high-risk profiles, dan screening recommendation.

2. **Data Entry & Collection (FR-101 s/d FR-106)**: Sebagian besar sudah terimplementasi. Yang perlu ditambahkan hanya **FR-104 (CSV/Excel import)** -- fitur import data properti dan unit dari file CSV.

---

## Status FR-101 s/d FR-106

| FR | Deskripsi | Status |
|----|-----------|--------|
| FR-101 | Web form terstruktur untuk input data kosan | Sudah ada (`PropertyFormDialog`) |
| FR-102 | Mobile-responsive design | Sudah ada (min-height 44px, text-base) |
| FR-103 | Real-time validation | Sudah ada (Zod + react-hook-form) |
| FR-104 | Import dari CSV/Excel | **Belum ada -- perlu dibuat** |
| FR-105 | Generate unique ID otomatis | Sudah ada (UUID v4 via `gen_random_uuid()`) |
| FR-106 | Track timestamp dan user | Sudah ada (`created_at`, `updated_at` triggers, audit log) |

---

## Arsitektur

```text
[Frontend]                          [Edge Functions]               [AI Gateway]
TenantQualityScoring.tsx  --->  ml-tenant-quality-scoring  --->  Gemini 2.5 Pro

PropertyImportDialog.tsx  --->  (client-side CSV parse + Supabase insert)
```

---

## 1. Edge Function: `ml-tenant-quality-scoring`

**File baru**: `supabase/functions/ml-tenant-quality-scoring/index.ts`

Mengcover BR-501 s/d BR-504. Berbeda dari `ml-tenant-risk-score` yang sudah ada:
- `ml-tenant-risk-score`: fokus risk scoring (0-100, higher = riskier) untuk tenant yang sudah aktif
- `ml-tenant-quality-scoring`: fokus quality assessment menyeluruh + screening recommendation untuk evaluasi calon tenant maupun tenant existing

### Input:
- `tenant_user_id` (opsional, untuk tenant existing)
- `screening_data` (opsional, untuk calon tenant baru -- data manual: nama, pekerjaan, penghasilan, referensi)
- `batch` (boolean, untuk scoring semua tenant aktif)

### Data yang Di-fetch (untuk tenant existing):
1. `invoices` -- riwayat pembayaran 24 bulan
2. `contracts` -- semua kontrak (aktif + historis)
3. `collections_cases` -- riwayat koleksi
4. `maintenance_requests` -- pola maintenance
5. `tenant_payment_metrics` -- metrik payment yang sudah dihitung
6. `tenant_risk_scores` -- risk score existing (dari `ml-tenant-risk-score`)
7. `profiles` -- data profil tenant

### Tier limits: `{ free: 0, starter: 3, professional: 15, enterprise: -1 }`

### AI Tool Output:
```text
Tool: score_tenant_quality
Output:
{
  quality_score: number,          // 0-100, higher = better quality
  quality_grade: "A" | "B" | "C" | "D" | "F",
  payment_reliability: {
    score: number,                // 0-100
    on_time_ratio: number,
    avg_days_late: number,
    trend: "improving" | "stable" | "declining",
    prediction_next_6_months: "reliable" | "moderate_risk" | "high_risk"
  },
  risk_profile: {
    level: "low" | "medium" | "high" | "critical",
    flags: [{ flag, severity, description }],
    churn_probability: number
  },
  screening_recommendation: {
    decision: "approve" | "approve_with_conditions" | "review" | "reject",
    conditions: string[],
    reasoning: string,
    suggested_deposit_multiplier: number
  },
  behavioral_insights: [{ category, observation, impact }],
  summary: string
}
```

---

## 2. Frontend: Tenant Quality Scoring Dashboard

**File baru**: `src/pages/merchant/TenantQualityScoring.tsx`

### Layout:
- PageHeader dengan icon UserCheck dan badge "AI-Powered"
- Mode selector: "Tenant Existing" vs "Screening Calon Tenant"
- TierGate wrapper

### Mode 1: Tenant Existing
- Tenant selector (dropdown tenant aktif)
- Generate button --> memanggil `ml-tenant-quality-scoring` dengan `tenant_user_id`
- Batch scoring button (scoring semua tenant sekaligus)
- Hasil ditampilkan:
  - **Quality Score Card**: skor 0-100, grade (A-F), badge warna
  - **Payment Reliability Section**: skor, on-time ratio, trend chart, prediksi 6 bulan (BR-502)
  - **Risk Profile Card**: level, flags list, churn probability gauge (BR-503)
  - **Screening Recommendation**: decision badge, conditions list, reasoning (BR-504)
  - **Behavioral Insights**: cards per kategori

### Mode 2: Screening Calon Tenant
- Form input data calon tenant: nama, pekerjaan, penghasilan, riwayat sewa sebelumnya (opsional)
- Generate button --> memanggil `ml-tenant-quality-scoring` dengan `screening_data`
- Hasil screening recommendation ditampilkan (approve/reject/review)

### Batch Results View
- Tabel semua tenant dengan kolom: nama, quality score, grade, payment reliability, risk level, decision
- Sortable dan filterable
- Export CSV button

---

## 3. CSV Import untuk Properties (FR-104)

**File baru**: `src/features/properties/components/PropertyImportDialog.tsx`

### Fitur:
- Dialog modal dengan drag-and-drop area untuk file CSV
- Template CSV yang bisa didownload (contoh format)
- Client-side parsing menggunakan native `FileReader` + manual CSV parse (tidak perlu library tambahan)
- Preview tabel data sebelum import
- Validasi per baris (Zod schema) dengan error highlighting
- Tombol "Import" untuk menyimpan ke database via Supabase client
- Progress indicator selama import
- Laporan hasil: berhasil, gagal, error detail

### Format CSV yang Didukung:
```text
name,property_type,address,city,province,postal_code,description
Kosan ABC,kost,Jl. Sudirman 123,Jakarta Selatan,DKI Jakarta,12345,Kosan nyaman
```

### Integrasi:
- Tombol "Import CSV" ditambahkan di halaman `Properties.tsx` di samping tombol "Tambah Properti"

---

## 4. Service & Hooks

### `src/features/dss/services/tenantQualityService.ts`
- `invokeTenantQualityScoring(params)` -- invoke `ml-tenant-quality-scoring`
- Type interfaces untuk result

### `src/features/dss/hooks/useTenantQuality.ts`
- `useTenantQualityScoring()` -- mutation hook

---

## 5. Navigasi

Update `navigation-config.ts`:
- Tambah item di grup "Analitik": `{ path: "/merchant/tenant-quality", icon: UserCheck, label: "Kualitas Tenant" }`

Update `App.tsx`:
- Lazy import + route `tenant-quality`

---

## Detail Teknis

### File Baru

| File | Deskripsi |
|------|-----------|
| `supabase/functions/ml-tenant-quality-scoring/index.ts` | AI tenant quality scoring edge function |
| `src/features/dss/services/tenantQualityService.ts` | Service invoke + types |
| `src/features/dss/hooks/useTenantQuality.ts` | React Query mutation hook |
| `src/pages/merchant/TenantQualityScoring.tsx` | Dashboard page |
| `src/features/properties/components/PropertyImportDialog.tsx` | CSV import dialog |

### File yang Dimodifikasi

| File | Perubahan |
|------|-----------|
| `src/shared/components/layouts/navigation-config.ts` | Tambah menu + import UserCheck |
| `src/App.tsx` | Tambah lazy import + route |
| `src/pages/merchant/Properties.tsx` | Tambah tombol "Import CSV" |

### Tidak Ada Perubahan Database

Semua data sudah tersedia di tabel existing. Import CSV menggunakan Supabase client insert biasa ke tabel `properties`.

### Urutan Implementasi
1. Edge function `ml-tenant-quality-scoring`
2. Service + hooks tenant quality
3. Halaman `TenantQualityScoring.tsx`
4. `PropertyImportDialog.tsx` (CSV import)
5. Update navigasi + routes + Properties page

