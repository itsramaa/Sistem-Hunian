

# Fix & Redesign: Property/Unit Forms, Lists, dan Fitur Baru

## Ringkasan Perubahan

Perbaikan menyeluruh pada form properti/unit, list views, dan penambahan fitur baru.

---

## 1. Fix Layout Form Properti & Unit (Overflow & Konsistensi)

**Masalah:** Form dialog memiliki overflow-x pada layar kecil, gap tidak konsisten, dan scrollable area kurang rapi.

**Perbaikan di `PropertyFormDialog.tsx`:**
- Tambahkan `overflow-x-hidden` pada form container
- Standardisasi spacing: `space-y-4` untuk semua step
- Fix stepper overflow pada mobile: gunakan `overflow-x-auto` + `flex-nowrap`

**Perbaikan di `UnitFormDialog.tsx`:**
- Sama — tambahkan `overflow-x-hidden` pada form
- Fix stepper responsif
- Ketika `wifi_cost_sharing = "patungan"`, tampilkan field "Biaya WiFi (Rp)" — memerlukan penambahan kolom `wifi_cost` di database dan di schema

---

## 2. UnitsManager Dialog: Sticky Header

**Masalah:** Ketika scroll di dialog UnitsManager, header (title + tombol "Tambah Unit") ikut terscroll.

**Perbaikan di `UnitsManager.tsx`:**
- Pindahkan `DialogHeader` dan action bar ke luar area scrollable
- Buat struktur: sticky header + scrollable content area (`overflow-y-auto` hanya pada list, bukan seluruh dialog)

---

## 3. WiFi Patungan: Tampilkan Biaya

**Masalah:** Saat `wifi_cost_sharing = "patungan"`, tidak ada field untuk memasukkan biaya.

**DB Migration:** Tambah kolom `wifi_cost` (numeric, default 0, nullable) di tabel `units`.

**Perbaikan di `UnitFormDialog.tsx` (Step 2 - Utilitas):**
- Ketika `wifi_cost_sharing = "patungan"`, tampilkan input "Biaya WiFi per Penghuni (Rp)"
- Update schema di `schema.ts`: tambah `wifi_cost: z.coerce.number().min(0).default(0)`

**Perbaikan di `types/index.ts`:**
- Tambah `wifi_cost?: number` pada interface `Unit` dan `UnitFormData`

**Perbaikan di `UnitsManager.tsx`:**
- Sertakan `wifi_cost` pada payload create/update

---

## 4. UnitsManager: Gallery + List Toggle

**Masalah:** List unit di dialog UnitsManager hanya tampil sebagai card 2 kolom. User ingin toggle gallery (3 kolom dengan foto) dan list.

**Perbaikan di `UnitsManager.tsx`:**
- Tambah state `viewMode: 'list' | 'gallery'` + toggle button (LayoutGrid / List icons)
- **Gallery mode:** 3 kolom card dengan thumbnail foto unit sebagai header, info unit di bawah
- **List mode:** List sederhana (current layout, tapi 1 kolom)
- Gallery default 3 kolom di desktop, 2 di tablet, 1 di mobile

---

## 5. Duplicate Property (Fitur Baru)

**Masalah:** Fitur duplicate sudah ada untuk unit tapi belum untuk property.

**Perbaikan di `PropertyCard.tsx`:**
- Tambah menu item "Duplikat" di DropdownMenu (three-dot), dengan icon Copy

**Perbaikan di `PropertyTable.tsx`:**
- Tambah menu item "Duplikat" di DropdownMenu row actions

**Perbaikan di `Properties.tsx`:**
- Tambah handler `handleDuplicate(property)`:
  - Copy semua field kecuali `id`, `created_at`, `updated_at`
  - Set `name` = `{original.name} (Copy)`
  - Buka PropertyFormDialog dengan data pre-filled
  - Tidak menduplikasi units (hanya properti)

**Props tambahan:**
- `PropertyCard` dan `PropertyTable` terima `onDuplicate` callback

---

## 6. PropertyDetail: Tab Unit — Gallery/List + Thumbnail

**Masalah:** Tab "Unit" di PropertyDetail hanya tampilkan tabel. User ingin gallery view dengan thumbnail.

**Perbaikan di `PropertyDetail.tsx` (Units tab):**
- Tambah state `unitViewMode: 'list' | 'gallery'` + toggle buttons
- **List mode:** Tabel seperti sekarang (dengan pagination)
- **Gallery mode:** Grid 3 kolom, card dengan thumbnail foto unit, info status, harga. Infinite scroll.
- Pagination untuk list, infinite load untuk gallery

---

## 7. PropertyDetail: Tab Tenant — Fix Redirect + Gallery

**Masalah:** Klik tenant card redirect ke `/merchant/contracts/:id` (contract), bukan ke tenant detail.

**Perbaikan di `PropertyDetail.tsx` (Tenants tab, line 380):**
- Ganti `navigate(`/merchant/contracts/${contract.id}`)` menjadi `navigate(`/merchant/tenants`)` dengan filter atau ke tenant profile
- Karena tidak ada `/merchant/tenants/:id` route, opsi terbaik: navigate ke `/merchant/tenants` (tenant list) — ATAU buat tenant detail page

**Sebenarnya:** Tenant tidak punya halaman detail individual di sistem ini. Yang ada adalah contract detail. Solusi realistis:
- Ubah onClick untuk navigasi ke tenant page (filtered), bukan contract
- Tambahkan link kecil "Lihat Kontrak" terpisah di card agar user bisa akses keduanya

**Gallery view untuk tenant:** Tambah toggle gallery/list. Gallery menampilkan avatar, nama, email, unit, status kontrak dalam card 3 kolom.

---

## 8. PropertyDetail: Tab Maintenance — Tombol Add

**Masalah:** Tab maintenance hanya menampilkan list, tidak ada tombol untuk membuat request baru.

**Perbaikan di `PropertyDetail.tsx` (Maintenance tab):**
- Tambah tombol "Tambah Maintenance" di atas list
- onClick: navigate ke `/merchant/maintenance` dengan query param `?propertyId={id}` agar pre-filter/pre-select property
- Atau buka dialog create maintenance langsung (jika component tersedia)

---

## 9. Pagination di Semua List, Infinite Load di Gallery

**Prinsip:**
- Mode **list/table**: pagination standar (page numbers)
- Mode **gallery**: infinite scroll (load more saat scroll bottom)

**File yang perlu pagination:**
- PropertyDetail units tab (list mode): tambah pagination
- PropertyDetail tenants tab: tambah pagination
- PropertyDetail maintenance tab: tambah pagination
- UnitsManager dialog: tambah pagination (list mode)

**Infinite scroll untuk gallery:**
- Gunakan `IntersectionObserver` hook sederhana
- Load 9 items per batch (3x3 grid)

---

## 10. Kualitas Data & Riwayat: Fitur Terpisah

**Masalah:** "Kualitas Data" (`DataQualityHistory`) saat ini tertanam di tab Compliance pada PropertyDetail. User menginginkan ini jadi fitur/tools terpisah.

**Perbaikan:**
- **PropertyDetail.tsx:** Hapus `<LazyDataQuality>` dari tab `compliance`
- **Tambah tab baru** "Kualitas Data" di dropdown "Lainnya" (progressive disclosure) — atau jadikan tab ke-6 yang visible
- Update `getInitialTab()` untuk mengenali `data-quality` sebagai valid tab
- Tambah `TabsContent value="data-quality"` yang render `<LazyDataQuality propertyId={id} />`

---

## 11. Penjaga (Guardians) Kembali ke Sidebar

**Masalah:** Guardians sebelumnya di-redirect ke `/merchant/properties`. User ingin manajemen penjaga di semua properti tersedia dari sidebar.

**Perbaikan di `navigation-config.ts`:**
- Tambah item "Penjaga" di group "Operasional":
  ```
  Operasional
    Penyewa
    Kontrak
    Maintenance
    Penjaga      <-- baru
  ```
- Icon: `UserCheck`
- Path: `/merchant/guardians`

**Perbaikan di `App.tsx`:**
- Ubah route `guardians` dari `<Navigate to="/merchant/properties" replace />` kembali ke `<MerchantGuardians />`

**Perbaikan di `Guardians.tsx`:**
- Ketika `propertyId` tidak diberikan (standalone mode): tampilkan semua penjaga dari semua properti (current behavior)
- Ketika `propertyId` diberikan (embedded di PropertyDetail): filter per properti

---

## Daftar File yang Diubah

| File | Perubahan |
|------|-----------|
| **DB Migration** | Tambah kolom `wifi_cost` di tabel `units` |
| `src/features/properties/types/schema.ts` | Tambah `wifi_cost` field |
| `src/features/properties/types/index.ts` | Tambah `wifi_cost` pada Unit interface |
| `src/features/properties/components/PropertyFormDialog.tsx` | Fix overflow-x, spacing konsisten |
| `src/features/properties/components/UnitFormDialog.tsx` | Fix overflow-x, tambah wifi cost field untuk patungan |
| `src/features/properties/components/UnitsManager.tsx` | Sticky header, gallery/list toggle, pagination, wifi_cost payload |
| `src/features/properties/components/PropertyCard.tsx` | Tambah onDuplicate prop + menu item |
| `src/features/properties/components/PropertyTable.tsx` | Tambah onDuplicate prop + menu item |
| `src/pages/merchant/Properties.tsx` | Handler duplicate property |
| `src/pages/merchant/PropertyDetail.tsx` | Unit gallery/list + pagination, tenant fix redirect + gallery, maintenance add button, data quality tab terpisah, tenant pagination |
| `src/shared/components/layouts/navigation-config.ts` | Tambah "Penjaga" ke group Operasional |
| `src/App.tsx` | Restore route guardians |

---

## Risiko & Catatan

- **DB Migration** diperlukan untuk `wifi_cost` column — low risk (nullable, default 0)
- **Duplicate property** tidak menduplikasi units untuk menghindari duplikasi data berlebihan
- **Infinite scroll** menggunakan `IntersectionObserver` native — tidak perlu library tambahan
- **Tenant redirect** — karena tidak ada halaman tenant detail individual, navigasi akan ke tenant list

