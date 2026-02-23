
# Audit & Refactor: Property Forms, Units, Tenant Flows

## Ringkasan Temuan

Setelah audit menyeluruh terhadap 20+ file terkait, ditemukan **6 area masalah utama** yang saling terkait. Berikut rencana perbaikan lengkap.

---

## 1. PropertyFormDialog -- Responsive Gap & Validasi

### Masalah
- `DialogContent` hanya `max-w-lg`, pada mobile kecil konten terlalu rapat
- Step indicator tidak responsif di layar kecil (label tersembunyi tapi separator tetap mengambil ruang)
- Tidak ada `trim()` pada input name/address sehingga user bisa submit whitespace
- Form area `max-h-[60vh]` bisa terlalu pendek di landscape mobile

### Perbaikan
- Ubah `DialogContent` ke `max-w-lg w-[95vw]` agar di mobile tidak mentok
- Tambah responsive step indicator: sembunyikan separator di mobile (`hidden sm:block`)
- Tambah `.trim()` pada schema validasi name dan address
- Ubah `max-h-[60vh]` ke `max-h-[55vh] sm:max-h-[60vh]`

### File: `src/features/properties/components/PropertyFormDialog.tsx`

---

## 2. UnitsManager Dialog -- Deprecate atau Konsistenkan

### Keputusan: Tetap sebagai Quick Action, tapi konsistenkan

UnitsManager berguna sebagai quick-action dari Property Card/Detail tanpa navigasi ke halaman Units. Namun masalahnya:
- Form unit di dalamnya pakai schema BERBEDA dari UnitFormDialog (wizard di halaman Units)
- Unit types hardcoded (`standard, deluxe, studio, suite, penthouse`) vs dynamic berdasarkan property_type (`kamar_standard, ruko_full`, dll)
- Card unit tidak bisa diklik ke detail
- Tidak ada photo upload

### Perbaikan
- **Ganti form internal** UnitsManager agar menggunakan `UnitFormDialog` yang sudah ada (wizard), bukan form sederhana sendiri. Ini menghilangkan duplikasi schema dan menjamin konsistensi
- **Hapus schema & unitTypes lokal** di UnitsManager (30 baris kode)
- **Tambah navigasi** dari card unit ke `/merchant/units` (atau detail unit jika ada)
- Property ID otomatis di-pass ke UnitFormDialog, sehingga user tidak perlu pilih ulang properti

### File: `src/features/properties/components/UnitsManager.tsx`

---

## 3. UnitFormDialog Wizard -- Validasi, Responsive, Error Handling

### Masalah Validasi
- `rent_amount` schema: `min(0)` membolehkan 0 -- seharusnya `min(1)` (sewa harus > 0)
- `unit_number` hanya `min(1)` tanpa `.trim()` -- whitespace lolos
- `register("rent_amount")` tanpa `valueAsNumber` -- menghasilkan string, bukan number
- Tidak ada validasi end_date > start_date pada AddTenantDialog
- `grid-cols-2` di step 1 dan 2 tanpa responsive breakpoint -- di mobile 2 kolom terlalu sempit

### Masalah Responsive
- `grid grid-cols-2 gap-4` di line 186, 250, 279 tidak responsive -- harus `grid-cols-1 sm:grid-cols-2`
- `max-h-[55vh]` bisa terlalu pendek pada mobile landscape

### Masalah Unique Constraint Error
- Ketika user membuat unit dengan nomor yang sudah ada di properti yang sama, Supabase melempar: `"duplicated key violates unique constraint 'units_property_id_unit_number_key'"`
- Error ini ditampilkan apa adanya ke user -- sangat teknis dan membingungkan
- Perlu ditangkap di `unitService.createUnit` dan di-translate ke pesan yang user-friendly

### Perbaikan

**Schema** (`src/features/properties/types/schema.ts`):
- `unit_number`: tambah `.trim()`
- `rent_amount`: ubah `min(0)` ke `min(1, 'Harga sewa harus lebih dari 0')`

**UnitFormDialog** (`src/features/properties/components/UnitFormDialog.tsx`):
- Semua `grid-cols-2` ubah ke `grid-cols-1 sm:grid-cols-2`
- Tambah `valueAsNumber` pada register rent_amount dan deposit_amount

**unitService** (`src/features/properties/services/unitService.ts`):
- Wrap createUnit error: jika error.message mengandung `units_property_id_unit_number_key`, throw `"Nomor unit sudah digunakan di properti ini. Silakan gunakan nomor unit yang berbeda."`
- Wrap updateUnit error serupa

### File yang diubah:
- `src/features/properties/types/schema.ts`
- `src/features/properties/components/UnitFormDialog.tsx`
- `src/features/properties/services/unitService.ts`

---

## 4. Invite Tenant -- Ubah dari Unit ke Property

### Masalah Bisnis
Saat ini InviteTenantDialog meminta merchant memilih **unit** untuk invitation. Tapi menurut business rule, invitation seharusnya ke **property** (tenant di-link ke merchant/property dulu), dan unit baru dipilih saat **contract** dibuat. Ini karena:
- Invitation = "ayo bergabung ke properti saya"
- Contract = "kamu tinggal di unit X dengan harga Y"

### Perbaikan

**Database**: Kolom `unit_id` di `tenant_invitations` sudah NOT NULL. Perlu migration untuk menjadikannya nullable (karena invitation bisa tanpa unit).

Namun, pendekatan yang lebih aman tanpa mengubah schema DB:
- **Ubah UI**: Ganti selector dari unit ke **property** di InviteTenantDialog
- **Di backend**: Simpan property_id terpisah di flow -- tapi DB requires unit_id...

**Keputusan pragmatis**: Karena DB sudah ada `unit_id NOT NULL`, dan mengubahnya butuh migration + banyak refactor di acceptance flow, pendekatan terbaik:

1. **Migrasi DB**: ALTER `tenant_invitations` -- tambah kolom `property_id` (nullable, FK ke properties), jadikan `unit_id` nullable
2. **Update InviteTenantDialog**: Ganti dari pilih unit ke pilih property + email
3. **Update service**: `sendInvitation` kirim `property_id` bukan `unit_id`
4. **Update InvitationsTable**: Tampilkan property name (bukan unit)

### File yang diubah:
- DB Migration (ALTER TABLE)
- `src/features/users/types/schema.ts` -- ubah schema invitation
- `src/features/users/components/tenant/InviteTenantDialog.tsx`
- `src/features/users/services/merchantTenantService.ts`
- `src/features/users/components/tenant/InvitationsTable.tsx`
- `src/pages/merchant/Tenants.tsx` (availableUnits logic berubah)

---

## 5. AddTenantDialog -- Validasi Kurang

### Masalah
- `addTenantSchema`: `rent_amount` `min(1)` tapi `register` tanpa `valueAsNumber` -- bisa submit string "0"
- Tidak ada validasi `end_date > start_date`
- `billing_day` boleh kosong tapi schema requires number
- Step 1 validasi hanya cek `selectedTenantUserId` ada, tapi tidak validate via schema
- `grid-cols-2` tanpa responsive breakpoint di step 3 (line 259, 276)

### Perbaikan

**Schema** (`src/features/users/types/addTenantSchema.ts`):
- Tambah `.refine()` untuk `end_date > start_date`
- `rent_amount`: pastikan `min(1)` bukan `min(0)`
- `billing_day`: jadikan `.default(1)` agar tidak error saat kosong
- `deposit_amount`: jadikan `.default(0)`

**AddTenantDialog** (`src/features/users/components/tenant/AddTenantDialog.tsx`):
- Semua `grid-cols-2` ubah ke `grid-cols-1 sm:grid-cols-2`
- Tambah min date pada input start_date (hari ini)
- Tambah validasi visual jika end_date <= start_date

### File yang diubah:
- `src/features/users/types/addTenantSchema.ts`
- `src/features/users/components/tenant/AddTenantDialog.tsx`

---

## 6. Tenant Page Flow Audit -- Inkonsistensi & Masalah UX

### Temuan Audit

**A. Tab default = "invitations" padahal "active" lebih penting**
- Merchant buka halaman tenant, yang pertama dilihat adalah invitations (yang mungkin kosong)
- Seharusnya default tab = "active" karena itu data utama

**B. TenantDetailsDialog crash untuk linked tenants**
- Linked tenants punya `start_date: ''` dan `end_date: ''`
- `TenantDetailsDialog` langsung `new Date(tenant.start_date)` tanpa guard -- menghasilkan Invalid Date
- `differenceInDays(endDate, startDate)` = NaN
- `format(startDate, ...)` = crash/error

**C. "Remove Tenant" pada linked tenant memanggil `terminateContract`**
- Linked tenants punya `id: 'linked-{userId}'` -- bukan UUID kontrak
- `terminateContract` akan gagal karena `.eq('id', contract.id)` dengan ID palsu
- Seharusnya untuk linked tenant, action = "unlink" (hapus `linked_merchant_id`), bukan terminate contract

**D. InviteTenantDialog disabled saat `availableUnits.length === 0`**
- Setelah refactor invitation ke property-based, kondisi ini tidak relevan lagi
- Invitation harusnya selalu bisa dikirim selama ada property

**E. TenantStats `activeTenantsCount` pakai `activeContractsCount`**
- Tapi active tenants list juga menampilkan linked tenants (tanpa kontrak)
- Angka di stats tidak match dengan jumlah baris di tabel

### Perbaikan

1. **Default tab**: Ubah dari `'invitations'` ke `'active'`
2. **TenantDetailsDialog**: Tambah guard untuk linked tenants -- sembunyikan Contract Timeline dan Financial Summary jika `status === 'linked'`
3. **Tenants.tsx**: Tambah handler terpisah `handleUnlinkTenant` untuk linked tenants vs `handleDeleteTenant` untuk contract tenants
4. **Service**: Tambah `unlinkTenant(userId, merchantId)` yang hanya update `tenants.linked_merchant_id = null`
5. **TenantStats**: Ubah `activeTenantsCount` ke jumlah aktual dari `activeTenants.length`
6. **InviteTenantDialog**: Disable condition ubah ke berdasarkan ada/tidaknya properties (bukan units)

### File yang diubah:
- `src/pages/merchant/Tenants.tsx`
- `src/features/users/components/tenant/TenantDetailsDialog.tsx`
- `src/features/users/services/merchantTenantService.ts`
- `src/features/users/hooks/useMerchantTenants.ts`

---

## Ringkasan File

### Database Migration (1)
| Perubahan | Detail |
|-----------|--------|
| ALTER `tenant_invitations` | Tambah `property_id` (uuid, nullable, FK), jadikan `unit_id` nullable |

### File Baru (0)

### File Diubah (12)
| File | Perubahan |
|------|-----------|
| `PropertyFormDialog.tsx` | Responsive fixes, trim validation |
| `UnitsManager.tsx` | Gunakan UnitFormDialog, hapus form lokal, navigasi card |
| `UnitFormDialog.tsx` | Responsive grid, valueAsNumber |
| `schema.ts` (properties) | trim, rent_amount min(1) |
| `unitService.ts` | User-friendly unique constraint error |
| `InviteTenantDialog.tsx` | Ubah dari unit-based ke property-based |
| `schema.ts` (users) | Ubah invitation schema ke property_id |
| `addTenantSchema.ts` | end_date > start_date refine, defaults |
| `AddTenantDialog.tsx` | Responsive grid, date validation |
| `Tenants.tsx` | Default tab, unlink vs terminate, stats fix |
| `TenantDetailsDialog.tsx` | Guard linked tenants |
| `merchantTenantService.ts` | sendInvitation property-based, unlinkTenant |

## Urutan Implementasi

1. DB Migration (tenant_invitations)
2. Schema fixes (properti & tenant validation)
3. unitService error handling
4. PropertyFormDialog & UnitFormDialog responsive
5. UnitsManager refactor (use UnitFormDialog)
6. InviteTenantDialog property-based
7. AddTenantDialog validation & responsive
8. Tenant page flow fixes (default tab, details guard, unlink)
