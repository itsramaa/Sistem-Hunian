
# Redesign Sistem Inventori: 3-Konsep Terpisah + Hapus Escrow Merchant + Hapus CustomAmenities

## Ringkasan

Refaktor total sistem fasilitas/inventori menjadi arsitektur 3-tabel yang bersih:
1. **facility_types** (Master Data) - Definisi tipe fasilitas
2. **assets** (Barang Fisik Trackable) - Instance nyata dari barang tangible
3. **facility_assignments** (Relasi Intangible) - Untuk WiFi, Parkiran, dll

Hapus semua fitur Escrow dari merchant, hapus `CustomAmenities` (fallback hardcoded AC, Water Heater, dll), dan konsolidasikan semuanya ke sistem inventori terpusat.

---

## 1. Database Migration

### Tabel Baru

**`facility_types`** (Master Data):
```text
id              UUID PK
merchant_id     UUID FK merchants
name            TEXT NOT NULL
scope           TEXT ('property' | 'unit')
nature          TEXT ('tangible' | 'intangible')
is_trackable    BOOLEAN DEFAULT false
asset_type      TEXT ('elektronik' | 'furnitur' | 'infrastruktur' | 'lainnya')
default_useful_life_months  INTEGER
created_at      TIMESTAMPTZ
updated_at      TIMESTAMPTZ
UNIQUE(merchant_id, name)
```

**`assets`** (Barang Fisik - tangible & trackable):
```text
id                UUID PK
facility_type_id  UUID FK facility_types
merchant_id       UUID FK merchants
property_id       UUID FK properties (nullable)
unit_id           UUID FK units (nullable)
serial_number     TEXT (nullable)
brand             TEXT (nullable)
condition         TEXT ('good' | 'damaged' | 'lost') DEFAULT 'good'
purchase_price    NUMERIC DEFAULT 0
purchase_date     DATE (nullable)
useful_life_months INTEGER DEFAULT 60
salvage_value     NUMERIC DEFAULT 0
status            TEXT ('available' | 'in_use' | 'maintenance') DEFAULT 'available'
notes             TEXT (nullable)
created_at        TIMESTAMPTZ
updated_at        TIMESTAMPTZ
```

**`facility_assignments`** (Intangible / non-asset):
```text
id                UUID PK
facility_type_id  UUID FK facility_types
property_id       UUID FK properties (nullable)
unit_id           UUID FK units (nullable)
capacity          INTEGER (nullable) -- e.g. parkiran = 5 motor
notes             TEXT (nullable)
created_at        TIMESTAMPTZ
```

### Migrasi Data
- Migrate data dari `facilities` lama ke `facility_types` + `assets`
- Drop tabel lama `facilities`, `property_facilities`, `unit_facilities` setelah migrasi
- RLS policies untuk semua 3 tabel baru (merchant_id based)

---

## 2. Hapus Escrow dari Merchant

### File yang dihapus/diabaikan:
- Hapus route `/merchant/escrow` dari `App.tsx`
- Hapus menu "Escrow" dari sidebar `navigation-config.ts` (line 137)
- Tidak perlu hapus file escrow karena admin masih pakai -- hanya hapus dari merchant routes & nav

### File yang diubah:
- `src/App.tsx`: Hapus lazy import `MerchantEscrow` dan route
- `src/shared/components/layouts/navigation-config.ts`: Hapus item escrow dari grup Keuangan merchant
- `src/pages/merchant/Dashboard.tsx`: Hapus card "Saldo Escrow" (line 197-204)

---

## 3. Hapus `CustomAmenities` -- Ganti dengan Facility Type Picker

### Hapus file:
- `src/features/properties/components/CustomAmenities.tsx`

### Buat pengganti:
- **`src/features/inventory/components/FacilityTypePicker.tsx`**: Komponen picker yang menampilkan facility_types dari DB (tidak ada fallback hardcoded). Tampil sebagai badge toggle, diambil dari tabel `facility_types`. Ada tombol "Tambah Tipe Baru" yang langsung membuka inline form (bukan dialog kelola).

### Update konsumen:
- `PropertyFormDialog.tsx`: Ganti `CustomAmenities` dengan `FacilityTypePicker` -- saat user pilih facility type, otomatis buat `facility_assignment` atau `asset` tergantung nature
- `UnitFormDialog.tsx`: Sama
- `PropertySetupWizard.tsx`: Sama
- `PropertyDetail.tsx`: Ganti referensi CustomAmenities dan FacilityManagementDialog
- `UnitDetail.tsx`: Ganti tab inventaris

---

## 4. Redesign Form Tambah Fasilitas (Langsung, Bukan Dialog)

### Hapus file:
- `src/features/properties/components/FacilityManagementDialog.tsx`

### Halaman Inventori yang diperbarui:
- **`src/pages/merchant/Inventory.tsx`**: Redesign total:
  - Tab: **Tipe Fasilitas** | **Aset** | **Assignment**
  - Tab Tipe Fasilitas: List + inline form "Tambah Tipe" (langsung di halaman, bukan dialog)
  - Tab Aset: List semua barang fisik dengan filter property/unit, condition, status. Klik row buka detail.
  - Tab Assignment: List semua intangible assignments
  - Tombol "Tambah Aset" membuka form inline/expandable di halaman
  - Tombol "Tambah Assignment" untuk intangible

### Detail Aset:
- Klik item di tabel Aset membuka halaman/panel detail dengan info lengkap: tipe, serial, brand, kondisi, harga beli, depresiasi, nilai buku, lokasi (property/unit), history

---

## 5. Konsep Assign ke Property/Unit

### Di halaman Inventory:
- Form "Tambah Aset": pilih Tipe Fasilitas, lalu pilih Property dan/atau Unit tujuan
- Form "Tambah Assignment": pilih Tipe Fasilitas intangible, pilih property/unit, isi capacity

### Di PropertyDetail (Overview/Ringkasan):
- Section "Fasilitas" menampilkan: assets yang di-assign ke property + facility_assignments property
- Tombol "Assign Aset" membuka form picker (pilih dari assets yang available milik merchant)

### Di UnitDetail (Inventaris tab):
- Tampilkan assets di unit + facility_assignments unit
- Tombol "Assign Aset" untuk assign existing asset ke unit
- Tombol "Tambah Baru" untuk create + assign sekaligus

---

## 6. Nilai Sisa Otomatis

Logic tetap sama dari sebelumnya:
- Elektronik: 10% dari harga beli
- Furnitur: 5%
- Infrastruktur: 15%
- Lainnya: 10%

Dihitung otomatis saat save asset berdasarkan `facility_type.asset_type`.

---

## Files Summary

| File | Perubahan |
|------|-----------|
| **Database migration** | Buat `facility_types`, `assets`, `facility_assignments`. Migrasi data dari `facilities` lama. RLS policies. |
| `src/features/inventory/` | **Baru**: Folder fitur inventory |
| `src/features/inventory/components/FacilityTypePicker.tsx` | **Baru**: Pengganti CustomAmenities |
| `src/features/inventory/components/AddAssetForm.tsx` | **Baru**: Form inline tambah aset |
| `src/features/inventory/components/AddAssignmentForm.tsx` | **Baru**: Form inline tambah assignment |
| `src/features/inventory/components/AssetDetailPanel.tsx` | **Baru**: Detail view aset |
| `src/pages/merchant/Inventory.tsx` | Redesign total dengan 3 tab |
| `src/App.tsx` | Hapus MerchantEscrow route |
| `src/shared/components/layouts/navigation-config.ts` | Hapus Escrow dari merchant nav |
| `src/pages/merchant/Dashboard.tsx` | Hapus card Saldo Escrow |
| `src/features/properties/components/CustomAmenities.tsx` | **Hapus** |
| `src/features/properties/components/FacilityManagementDialog.tsx` | **Hapus** |
| `src/features/properties/components/PropertyFormDialog.tsx` | Ganti CustomAmenities dengan FacilityTypePicker |
| `src/features/properties/components/PropertySetupWizard.tsx` | Ganti CustomAmenities dengan FacilityTypePicker |
| `src/features/properties/components/UnitFormDialog.tsx` | Ganti CustomAmenities dengan FacilityTypePicker |
| `src/pages/merchant/PropertyDetail.tsx` | Ganti fasilitas section, hapus FacilityManagementDialog |
| `src/pages/merchant/UnitDetail.tsx` | Ganti inventaris tab, hapus CustomAmenities |

## Technical Notes

- `facility_types` = **definisi**. Tidak punya harga, kondisi, serial. Hanya nama, scope, nature, trackable.
- `assets` = **instance fisik**. Punya harga, kondisi, serial, lokasi. Hanya untuk tangible items.
- `facility_assignments` = **relasi intangible**. Parkiran (capacity=5), WiFi, Keamanan 24 Jam. Tidak punya kondisi/harga.
- Migrasi data: `facilities` lama yang punya `purchase_price > 0` jadi `assets`, sisanya jadi `facility_assignments`. Semua jadi `facility_types` master.
- Fallback hardcoded (AC, Water Heater, Parkir, dll) dihapus total. Semua dari DB.
- Escrow hanya dihapus dari merchant -- admin escrow tetap ada.
