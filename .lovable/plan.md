

# Fix & Redesign: 7 Perbaikan UI/UX

## 1. Hapus "Level 1 — Wajib" Badge, Ganti dengan Tanda Merah (*)

**Masalah:** Di `PropertyFormDialog.tsx` dan `UnitFormDialog.tsx`, stepper menampilkan badge "Level 1 — Wajib" / "Level 2 — Recommended" yang memakan ruang.

**Perbaikan di `PropertyFormDialog.tsx`:**
- Hapus `levelBadge` dan `levelColor` dari array `STEPS`
- Hapus rendering badge di stepper (line 132)
- Pada semua Label field wajib, ganti `*` dengan `<span className="text-destructive">*</span>`
- Contoh: `<Label>Nama Properti <span className="text-destructive">*</span></Label>`

**Perbaikan di `UnitFormDialog.tsx`:**
- Sama — pastikan semua field wajib (Properti, Nomor Unit, Tipe Unit, Harga Sewa) menggunakan tanda `*` merah
- Hapus teks `*` biasa yang sudah ada dan ganti dengan span merah

---

## 2. Tenant Card: Buka Dialog Detail + Tombol ke Detail Page

**Masalah:** Di PropertyDetail tab Tenants, klik tenant card redirect ke `/merchant/tenants` — seharusnya buka dialog ringkasan tenant.

**Perbaikan di `PropertyDetail.tsx` (tab tenants):**
- Import `TenantDetailsDialog` dari `@/features/users/components/tenant/TenantDetailsDialog`
- Tambah state: `selectedTenantForDialog`, `showTenantDialog`
- onClick tenant card: buka `TenantDetailsDialog` dengan data tenant (map contract data ke `ActiveTenant` format)
- Di dalam dialog (atau di card langsung): tambah link "Lihat Detail Lengkap" yang navigate ke `/merchant/tenants/:id` (halaman detail tenant baru)

**Buat halaman detail tenant baru:**
- File: `src/pages/merchant/TenantDetail.tsx`
- Route: `/merchant/tenants/:tenantId`
- Konten: semua info tenant lengkap — profil, riwayat kontrak, riwayat pembayaran, maintenance requests, timeline
- Ini berbeda dari dialog ringkasan yang hanya tampil info dasar

**Update `App.tsx`:**
- Tambah route `/merchant/tenants/:tenantId` -> `TenantDetail`

---

## 3. Tombol "Foto" di Detail Property Tidak Berfungsi

**Masalah:** Button "Foto" di header PropertyDetail (line 250) tidak punya handler — hanya render button tanpa onClick.

**Perbaikan di `PropertyDetail.tsx` (line 250):**
- onClick: buka `PropertyFormDialog` di step 3 (Media) — karena step index 3 adalah "Media"
- Implementasi: `onClick={() => { setEditInitialStep(3); setShowEditDialog(true); }}`
- Ini memanfaatkan state `editInitialStep` yang sudah ada

---

## 4. Maintenance Tab: Dialog Form, Bukan Redirect

**Masalah:** Tombol "Tambah Maintenance" di tab maintenance (line 574) melakukan `navigate(...)` ke halaman maintenance — seharusnya buka dialog form langsung.

**Perbaikan di `PropertyDetail.tsx`:**
- Import `CreateMaintenanceDialog` dari `@/features/maintenance/components/CreateMaintenanceDialog`
- Import `useCreateMerchantMaintenanceRequest` hook
- Tambah state: `showCreateMaintenanceDialog`
- Tombol "Tambah Maintenance": `onClick={() => setShowCreateMaintenanceDialog(true)}`
- Render `CreateMaintenanceDialog` dengan property pre-selected
- Modifikasi `CreateMaintenanceDialog` agar menerima prop `preselectedPropertyId` — jika diberikan, auto-select property dan hide property selector

**Perbaikan di `CreateMaintenanceDialog.tsx`:**
- Tambah prop opsional `preselectedPropertyId?: string`
- Jika `preselectedPropertyId` diberikan:
  - Set `propertyId` = preselectedPropertyId saat mount
  - Sembunyikan field "Properti" (sudah otomatis terpilih)
- Pola contextual module yang sama berlaku juga untuk unit detail maintenance tab

---

## 5. Skor Risiko Otomatis (Bukan Input Manual)

**Masalah:** Di `PropertyCompliance.tsx` (line 170-171), `overall_risk_score` diinput manual oleh user. Seharusnya dihitung otomatis berdasarkan dropdown risk yang dipilih.

**Perbaikan di `PropertyCompliance.tsx` - `DisasterRiskTab`:**
- Hapus input manual "Skor Risiko (0-100)"
- Tambah fungsi `calculateRiskScore(form)`:

```typescript
function calculateRiskScore(form: { risk_zone: string; flood_risk: string; earthquake_risk: string; landslide_risk: string; fire_risk: string }): number {
  const WEIGHTS = { risk_zone: 0.30, flood_risk: 0.25, earthquake_risk: 0.20, landslide_risk: 0.15, fire_risk: 0.10 };
  const SCORES = { low: 15, medium: 45, high: 75, critical: 95 };
  return Math.round(
    (SCORES[form.risk_zone] || 0) * WEIGHTS.risk_zone +
    (SCORES[form.flood_risk] || 0) * WEIGHTS.flood_risk +
    (SCORES[form.earthquake_risk] || 0) * WEIGHTS.earthquake_risk +
    (SCORES[form.landslide_risk] || 0) * WEIGHTS.landslide_risk +
    (SCORES[form.fire_risk] || 0) * WEIGHTS.fire_risk
  );
}
```

- Bobot berdasarkan best practice risk assessment: zona risiko keseluruhan paling dominan (30%), banjir (25%), gempa (20%), longsor (15%), kebakaran (10%)
- Skor per level: low=15, medium=45, high=75, critical=95
- Tampilkan skor hasil perhitungan sebagai read-only indicator (bukan input)
- Update `form.overall_risk_score` secara reaktif saat dropdown berubah menggunakan `useEffect`

---

## 6. Penjaga di Atas Penyewa di Sidebar

**Masalah:** Saat ini urutan di group "Operasional": Penyewa, Kontrak, Maintenance, Penjaga. User ingin Penjaga di atas Penyewa.

**Perbaikan di `navigation-config.ts`:**
```typescript
{
  label: "Operasional",
  items: [
    { path: "/merchant/guardians", icon: UserCheck, label: "Penjaga" },
    { path: "/merchant/tenants", icon: Users, label: "Penyewa", ... },
    { path: "/merchant/contracts", icon: ClipboardList, label: "Kontrak" },
    { path: "/merchant/maintenance", icon: Wrench, label: "Maintenance" },
  ],
},
```

---

## 7. Tambah "Laporan" ke Sidebar (Group Wawasan)

**Masalah:** "Laporan" tersembunyi di dalam InsightsHub. User ingin akses langsung dari sidebar.

**Perbaikan di `navigation-config.ts`:**
```typescript
{
  label: "Wawasan",
  items: [
    { path: "/merchant/insights", icon: BarChart3, label: "Analitik",
      activePatterns: ["/merchant/analytics", "/merchant/ai-insights", "/merchant/analytics-dashboard", "/merchant/comparative-portfolio", "/merchant/ml-analytics", "/merchant/dss-advisor", "/merchant/market-intelligence", "/merchant/financial-risk", "/merchant/tenant-quality"] },
    { path: "/merchant/reports", icon: FileText, label: "Laporan",
      activePatterns: ["/merchant/report-templates"] },
  ],
},
```

- Hapus `/merchant/reports` dan `/merchant/report-templates` dari activePatterns milik "Analitik"

---

## Daftar File yang Diubah

| File | Perubahan |
|------|-----------|
| `PropertyFormDialog.tsx` | Hapus level badges, ganti `*` dengan span merah |
| `UnitFormDialog.tsx` | Ganti `*` dengan span merah |
| `PropertyDetail.tsx` | Fix tombol foto, maintenance dialog, tenant dialog |
| `CreateMaintenanceDialog.tsx` | Tambah prop `preselectedPropertyId` |
| `PropertyCompliance.tsx` | Skor risiko auto-calculate |
| `navigation-config.ts` | Reorder Penjaga, tambah Laporan |
| `TenantDetail.tsx` (baru) | Halaman detail tenant lengkap |
| `App.tsx` | Tambah route tenant detail |

