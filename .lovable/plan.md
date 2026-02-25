
# Audit & Refactor Fasilitas/Inventori, Sidebar Updates, Guardian Assignment, Contract/Invoice Dialog di Unit Detail

## 1. Merge Fasilitas + Inventaris Menjadi Sistem "Inventori" Terpadu

Saat ini fasilitas dan inventaris terpisah -- `CustomAmenities` untuk toggle badge, dan `FacilityManagementDialog` untuk CRUD master. Tab "Inventaris" di Unit Detail sudah menggunakan `CustomAmenities`, tapi belum ada halaman terpusat.

### Perubahan:
- **Buat halaman `src/pages/merchant/Inventory.tsx`**: Halaman inventori terpusat yang menampilkan semua fasilitas merchant (umum + unit) dengan filter kategori, tabel list, dan akses ke `FacilityManagementDialog`
- **Tambah route** di `App.tsx`: `inventory` di bawah merchant routes
- **Tambah menu sidebar** di `navigation-config.ts`: Tambah item "Inventori" dengan icon `Package` di grup "Operasional"
- **Refactor `FacilityManagementDialog`**: Jadikan reusable -- bisa dipanggil dari halaman Inventori, form properti, dan unit detail

### Nilai Sisa Otomatis:
- Di `FacilityManagementDialog`, **hilangkan field input "Nilai Sisa"** dari user
- **Hitung otomatis** berdasarkan kategori barang:
  - Elektronik (AC, TV, Water Heater): 10% dari harga beli
  - Furnitur (Lemari, Meja, Kursi): 5% dari harga beli  
  - Infrastruktur (CCTV, Pompa Air): 15% dari harga beli
  - Default: 10% dari harga beli
- Tambah field **"Tipe Barang"** (dropdown: Elektronik, Furnitur, Infrastruktur, Lainnya) yang menentukan bobot nilai sisa
- Nilai sisa dihitung saat save: `salvage_value = purchase_price * weight_factor`

## 2. Tambah "Referral" di Menu Sidebar Merchant

Saat ini `merchant/referrals` sudah ada sebagai route tapi tidak ada di sidebar navigation.

### Perubahan:
- **`navigation-config.ts`**: Tambah `{ path: "/merchant/referrals", icon: Gift, label: "Referral" }` di grup "Operasional"

## 3. Fitur Assign Penjaga ke Multiple Properti

Saat ini `property_guardians` memiliki `property_id` sebagai required foreign key -- 1 penjaga = 1 properti. Untuk mendukung penjaga di banyak properti, perlu tabel relasi.

### Database Migration:
- Buat tabel **`guardian_property_assignments`**: `id`, `guardian_id` (FK ke `property_guardians`), `property_id` (FK ke `properties`), `role` (text: 'primary'|'backup'), `assigned_date`, `status`, `created_at`
- Unique constraint: `(guardian_id, property_id)`
- RLS policy: merchant manages own assignments

### UI Perubahan:
- **Halaman Guardians (`src/pages/merchant/Guardians.tsx`)**: Tambah tombol "Assign" di setiap row penjaga yang membuka dialog untuk memilih properti tambahan
- **`guardianService.ts`**: Tambah fungsi `assignToProperty`, `removeAssignment`, `fetchAssignments`
- **Detail Properti tab Staf**: Tampilkan penjaga dari `guardian_property_assignments` selain dari `property_guardians` langsung

## 4. Dialog Kontrak di Unit Detail (Bukan Redirect)

Saat ini "Tambah Kontrak" di tab Kontrak melakukan `navigate()` ke halaman contracts. Ubah menjadi membuka `CreateContractDialog` langsung.

### Perubahan di `UnitDetail.tsx`:
- Import `CreateContractDialog` dari `@/features/contracts/components/CreateContractDialog`
- Tambah state: `showContractDialog`, fetch `merchantTenants` via query
- Button "Tambah Kontrak" membuka dialog, bukan navigate
- Pass `availableUnits` hanya berisi unit saat ini (pre-selected)
- Pass `onSubmit` yang memanggil contract creation mutation dan refresh data
- Import contract creation mutation dari hooks yang sudah ada

## 5. Dialog Invoice/Pembayaran di Unit Detail (Bukan Redirect)

Saat ini "Tambah Pembayaran" melakukan `navigate()`. Ubah menjadi `CreateInvoiceDialog` langsung.

### Perubahan di `UnitDetail.tsx`:
- Import `CreateInvoiceDialog` dari `@/features/payments/components/CreateInvoiceDialog`
- Tambah state: `showInvoiceDialog`
- Pass `contracts` dari unit data (hanya kontrak aktif unit ini)
- Pass `merchantId` dari `unit.property.merchant_id`
- Button "Tambah Pembayaran" membuka dialog inline

---

## Files Summary

| File | Perubahan |
|------|-----------|
| `src/pages/merchant/Inventory.tsx` | **Baru**: Halaman inventori terpusat |
| `src/App.tsx` | Tambah route `/merchant/inventory` |
| `src/shared/components/layouts/navigation-config.ts` | Tambah "Inventori" dan "Referral" di sidebar merchant |
| `src/features/properties/components/FacilityManagementDialog.tsx` | Hilangkan input nilai sisa manual, tambah field "Tipe Barang", hitung otomatis |
| `src/pages/merchant/UnitDetail.tsx` | Ganti navigate ke dialog untuk kontrak dan invoice, import dan render kedua dialog |
| **Database migration** | Buat tabel `guardian_property_assignments` |
| `src/features/properties/services/guardianService.ts` | Tambah fungsi assign/unassign properti |
| `src/features/properties/hooks/useGuardians.ts` | Tambah hooks untuk assignments |
| `src/pages/merchant/Guardians.tsx` | Tambah UI assign penjaga ke properti |

## Technical Notes

- Nilai sisa otomatis dihitung client-side saat save: `purchase_price * factor` (Elektronik=0.10, Furnitur=0.05, Infrastruktur=0.15, Lainnya=0.10)
- Field "Tipe Barang" (`asset_type`) disimpan di tabel `facilities` -- perlu ALTER TABLE menambah kolom `asset_type TEXT DEFAULT 'lainnya'`
- `guardian_property_assignments` memungkinkan 1 penjaga assigned ke N properti tanpa mengubah struktur `property_guardians` yang sudah ada
- Dialog kontrak dan invoice di Unit Detail menggunakan komponen yang sudah ada (`CreateContractDialog`, `CreateInvoiceDialog`) -- hanya perlu pass data yang sesuai
- Halaman Inventori menampilkan semua fasilitas merchant dengan statistik: total item, total nilai aset, total depresiasi
