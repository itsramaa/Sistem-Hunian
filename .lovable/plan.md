

# 3.1.2 Data Quality & Validation + 3.1.3 Data Versioning & History

## Ringkasan

Membuat sistem **Data Quality & Validation** dan **Data Versioning & History** untuk properti dan unit, mencakup automated validation rules, quality scoring, data versioning dengan restore capability, dan audit trail terintegrasi. Implementasi membutuhkan 2 tabel database baru, 1 edge function AI baru, 1 halaman dashboard baru, dan modifikasi beberapa file existing.

---

## Arsitektur

```text
[Frontend]                           [Edge Functions]            [AI Gateway]
DataQualityHistory.tsx  -------->  ml-data-quality-check  --->  Gemini 2.5 Flash
                        -------->  (Supabase client CRUD for versioning)

[Database]
property_data_versions  -- snapshot + restore
data_quality_checks     -- validation results + quality scores
audit_logs              -- existing, untuk FR-303
```

---

## 1. Database: 2 Tabel Baru

### Tabel `data_quality_checks`
Menyimpan hasil validasi per properti/unit.

| Kolom | Tipe | Keterangan |
|-------|------|------------|
| id | uuid PK | gen_random_uuid() |
| merchant_id | uuid FK merchants | NOT NULL |
| entity_type | text | 'property' atau 'unit' |
| entity_id | uuid | ID properti/unit |
| quality_score | numeric | 0-100 |
| validation_results | jsonb | Array of { rule, status, message, severity } |
| overrides | jsonb | Array of { rule, reason, overridden_by, overridden_at } |
| is_final_validated | boolean | default false (FR-304) |
| validated_by | uuid | user yang mark final |
| validated_at | timestamptz | kapan di-mark final |
| created_at | timestamptz | default now() |

RLS: merchant hanya bisa akses miliknya sendiri (via merchant_id).

### Tabel `property_data_versions`
Menyimpan snapshot data untuk versioning dan restore.

| Kolom | Tipe | Keterangan |
|-------|------|------------|
| id | uuid PK | gen_random_uuid() |
| entity_type | text | 'property' atau 'unit' |
| entity_id | uuid | ID properti/unit |
| version_number | integer | auto-increment per entity |
| snapshot_data | jsonb | full row snapshot |
| change_summary | text | ringkasan perubahan |
| changed_by | uuid | user_id |
| change_reason | text | nullable, alasan perubahan |
| created_at | timestamptz | default now() |

RLS: merchant bisa akses via join ke properties/units yang miliknya.

---

## 2. Edge Function: `ml-data-quality-check`

**File baru**: `supabase/functions/ml-data-quality-check/index.ts`

Mengcover FR-201 (automated validation) dan FR-202 (error + suggestion).

### Input:
- `property_id` (wajib) -- validasi properti + semua unitnya
- `include_suggestions` (boolean, default true)

### Validasi Rules yang Dijalankan:

**Deterministic (tanpa AI):**
1. Range validation: rent_amount > 0, occupancy 0-100%, floor valid, size_sqm reasonable
2. Logical consistency: occupied_units <= total_units, unit floor <= property floor_count
3. Duplicate check: unit_number unik per properti
4. Completeness check: field wajib terisi (address, city, province)

**AI-enhanced (dengan Gemini 2.5 Flash):**
5. Outlier detection: harga sewa anomali vs unit lain di properti/kota yang sama
6. Suggestion generation: saran perbaikan per error

### Tier limits: `{ free: 1, starter: 5, professional: -1, enterprise: -1 }`

### Output:
```text
{
  property_score: number,  // 0-100
  unit_scores: [{ unit_id, score }],
  aggregate_score: number,
  validations: [
    { entity_type, entity_id, rule, status: "pass"|"warning"|"error",
      message, suggestion?, severity: "low"|"medium"|"high"|"critical" }
  ],
  outliers: [{ entity_id, field, value, expected_range, anomaly_type }],
  summary: string
}
```

Hasil disimpan ke tabel `data_quality_checks`.

---

## 3. Frontend Service & Hooks

### `src/features/properties/services/dataQualityService.ts`
- `invokeDataQualityCheck(propertyId)` -- invoke edge function
- `fetchQualityChecks(merchantId)` -- fetch dari `data_quality_checks`
- `overrideValidation(checkId, rule, reason)` -- update override di check (FR-203)
- `markFinalValidated(checkId)` -- set `is_final_validated = true` (FR-304)
- `fetchDataVersions(entityType, entityId)` -- fetch dari `property_data_versions`
- `restoreVersion(versionId)` -- restore data ke versi sebelumnya (FR-302)
- `createVersion(entityType, entityId, snapshotData, changeSummary, changeReason?)` -- manual snapshot

### `src/features/properties/hooks/useDataQuality.ts`
- `useDataQualityCheck()` -- mutation hook untuk invoke
- `useQualityChecks(merchantId)` -- query hook untuk list
- `useOverrideValidation()` -- mutation
- `useMarkFinalValidated()` -- mutation
- `useDataVersions(entityType, entityId)` -- query hook
- `useRestoreVersion()` -- mutation hook

---

## 4. Auto-Versioning pada Property/Unit Update

Modifikasi `propertyService.ts`:
- Pada `updateProperty()`: sebelum update, fetch current data, simpan snapshot ke `property_data_versions`, lalu lakukan update.
- Catat change_summary otomatis (diff fields yang berubah).

Modifikasi `unitService.ts`:
- Sama: pada update unit, simpan snapshot sebelumnya.

Ini memenuhi FR-301 (changelog) secara otomatis.

---

## 5. Halaman: Data Quality & History Dashboard

**File baru**: `src/pages/merchant/DataQualityHistory.tsx`

### Layout:
- PageHeader dengan icon Shield dan badge "Data Governance"
- Property selector (wajib pilih 1 properti)

### 3 Tab:

**Tab 1: Validasi & Kualitas (FR-201, FR-202, FR-204)**
- Tombol "Jalankan Validasi" -> memanggil `ml-data-quality-check`
- Quality Score gauge (0-100) per properti + aggregate
- Tabel hasil validasi: entity, rule, status (pass/warning/error), message, suggestion
- Badge severity color-coded
- Tombol "Override" per baris error -> dialog input alasan (FR-203)
- Tombol "Mark as Final Validated" (FR-304) -- hanya bisa jika tidak ada error critical
- Filter: severity, status, entity_type

**Tab 2: Riwayat Perubahan (FR-301, FR-303)**
- Timeline changelog: siapa, apa yang berubah, kapan, ringkasan perubahan
- Data diambil dari `property_data_versions` + `audit_logs`
- Expand row untuk lihat detail diff (old vs new snapshot)
- Filter by entity (properti atau unit tertentu)

**Tab 3: Restore Data (FR-302)**
- Pilih entity (properti/unit) -> tampilkan daftar versi
- Preview snapshot data per versi
- Tombol "Restore ke Versi Ini" -> konfirmasi dialog -> restore data + catat audit log
- Badge "Final Validated" pada versi yang sudah di-mark (FR-304)

---

## 6. Navigasi

Update `navigation-config.ts`:
- Tambah item di grup "Manajemen Properti" (bukan Analitik): `{ path: "/merchant/data-quality", icon: Shield, label: "Kualitas Data" }`

Update `App.tsx`:
- Lazy import + route `data-quality`

---

## Detail Teknis

### File Baru

| File | Deskripsi |
|------|-----------|
| `supabase/functions/ml-data-quality-check/index.ts` | Validation + outlier detection edge function |
| `src/features/properties/services/dataQualityService.ts` | Service CRUD + invoke |
| `src/features/properties/hooks/useDataQuality.ts` | React Query hooks |
| `src/pages/merchant/DataQualityHistory.tsx` | Dashboard page |

### File yang Dimodifikasi

| File | Perubahan |
|------|-----------|
| `src/features/properties/services/propertyService.ts` | Tambah auto-versioning di updateProperty |
| `src/features/properties/services/unitService.ts` | Tambah auto-versioning di unit update |
| `src/shared/components/layouts/navigation-config.ts` | Tambah menu Kualitas Data |
| `src/App.tsx` | Tambah lazy import + route |

### Database Migration

1 migration file dengan:
- CREATE TABLE `data_quality_checks` + RLS policies
- CREATE TABLE `property_data_versions` + RLS policies
- Index pada `entity_id` dan `merchant_id` untuk kedua tabel

### Urutan Implementasi
1. Database migration (2 tabel baru + RLS)
2. Edge function `ml-data-quality-check`
3. Service `dataQualityService.ts`
4. Hooks `useDataQuality.ts`
5. Auto-versioning di `propertyService.ts` dan `unitService.ts`
6. Halaman `DataQualityHistory.tsx`
7. Update navigasi + routes

