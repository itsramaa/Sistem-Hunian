

# Perbaikan 6 Area: Unit Maintenance, Edit, Sidebar, Analitik, Pembayaran

---

## 1. Tab Maintenance di UnitDetail: Tambah "Add Maintenance" Button + Dialog

**Masalah:** Tab maintenance di `UnitDetail.tsx` hanya menampilkan list request tanpa tombol tambah, berbeda dari PropertyDetail yang sudah punya tombol + dialog.

**Perbaikan di `UnitDetail.tsx`:**
- Import `CreateMaintenanceDialog` dan `useCreateMerchantMaintenanceRequest`
- Tambah state `showCreateMaintenanceDialog`
- Di tab maintenance (line 333), tambah header bar dengan tombol "Tambah Maintenance" sebelum list
- Render `CreateMaintenanceDialog` dengan `preselectedPropertyId={unit.property?.id}`

**Perbaikan di `CreateMaintenanceDialog.tsx`:**
- Tambah prop `preselectedUnitId?: string`
- Jika diberikan, auto-select unit tersebut di dropdown unit dan disable/hide field unit

---

## 2. Button Edit di UnitDetail Tidak Berfungsi

**Masalah:** Tombol "Edit" di header UnitDetail (line 128) hanya render `<Button>` tanpa `onClick` handler.

**Perbaikan di `UnitDetail.tsx`:**
- Import `UnitFormDialog` dari `@/features/properties/components/UnitFormDialog`
- Tambah state: `showEditDialog: boolean`
- onClick tombol Edit: `() => setShowEditDialog(true)`
- Render `<UnitFormDialog>` dengan data unit sebagai `editingUnit`, mode edit
- onSuccess: refetch unit data

---

## 3. Sidebar: Laporan di Atas Analitik

**Masalah:** Urutan saat ini: Analitik, Laporan. User ingin Laporan di atas.

**Perbaikan di `navigation-config.ts` (line 138-143):**
```text
Wawasan
  Laporan        <-- pindah ke atas
  Alat           <-- rename dari "Analitik"
```

---

## 4. Rename "Analitik" ke "Alat" + Hapus Card Ringkasan

**Masalah:** Sidebar item "Analitik" seharusnya bernama "Alat". Card "Ringkasan Analitik" dan "Laporan" di InsightsHub harus dihapus karena sudah ada di page Laporan.

**Perbaikan di `navigation-config.ts`:**
- Rename label "Analitik" menjadi "Alat"

**Perbaikan di `InsightsHub.tsx`:**
- Hapus card "Ringkasan Analitik" (index 0 di `performanceCards`) dan card "Laporan" (index 1 di `performanceCards`)
- Update PageHeader title dari "Analitik" menjadi "Alat"
- Sisa performanceCards: "Template Laporan" dan "Portofolio Komparatif"

**Perbaikan di `Reports.tsx`:**
- Tambahkan section "Ringkasan Analitik" di atas tab reports (ikhtisar performa properti, okupansi, dan pendapatan yang sebelumnya ada di InsightsHub sebagai card link)
- Ini berupa summary stats cards (total revenue, occupancy rate, payment rate, dsb) yang sudah ada di report data

---

## 5. Pembayaran: Tambah Foto Bukti Pembayaran

**Masalah:** Di `MarkPaidDialog` dan data pembayaran, tidak ada field untuk upload foto bukti transfer/pembayaran.

**DB Migration:**
- Tambah kolom `proof_photo_url` (text, nullable) di tabel `payments`

**Perbaikan di `MarkPaidDialog.tsx`:**
- Tambah file input untuk upload foto bukti pembayaran
- Upload ke Supabase Storage bucket `payment-proofs`
- Simpan URL di `proof_photo_url` saat confirm payment
- Preview foto yang dipilih sebelum submit

**Perbaikan di `Payment` type (`types/index.ts`):**
- Tambah `proof_photo_url?: string | null`

**Perbaikan di `PaymentsTable.tsx`:**
- Tampilkan ikon/indicator jika pembayaran punya bukti foto
- Klik untuk preview foto bukti dalam dialog/lightbox

**Perbaikan di `useMerchantPayments.ts`:**
- Update mutation `markPaid` untuk menyertakan `proof_photo_url`

---

## Daftar File yang Diubah

| File | Perubahan |
|------|-----------|
| **DB Migration** | Tambah kolom `proof_photo_url` di `payments` |
| **Storage** | Buat bucket `payment-proofs` |
| `UnitDetail.tsx` | Tambah maintenance dialog + fix edit button |
| `CreateMaintenanceDialog.tsx` | Tambah prop `preselectedUnitId` |
| `navigation-config.ts` | Reorder Laporan > Alat, rename Analitik > Alat |
| `InsightsHub.tsx` | Hapus card Ringkasan Analitik dan Laporan, rename title |
| `Reports.tsx` | Tambah section ringkasan analitik |
| `MarkPaidDialog.tsx` | Tambah upload foto bukti bayar |
| `features/payments/types/index.ts` | Tambah `proof_photo_url` |
| `PaymentsTable.tsx` | Tampilkan indicator bukti foto |
| `useMerchantPayments.ts` | Update markPaid dengan proof_photo_url |

