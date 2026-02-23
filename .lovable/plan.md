

# Responsive Fixes, UnitsManager Navigation, dan Tenant Flow Audit

## 1. Responsive Component Fixes

Berdasarkan skill `responsive-design` (mobile-first breakpoints, fluid spacing) dan `ui-ux-designer` (cognitive load reduction, accessibility):

### A. Base UI Components -- Input, Textarea, Select

**Input** (`src/shared/components/ui/input.tsx`):
- Sudah punya `h-12 md:h-10` -- ini bagus untuk mobile touch targets
- Tidak ada masalah mayor

**Textarea** (`src/shared/components/ui/textarea.tsx`):
- Kurang touch-friendly di mobile -- tambah padding dan min-height yang lebih besar di mobile
- Ubah: `min-h-[80px]` ke `min-h-[100px] md:min-h-[80px]`, tambah `text-base md:text-sm` (prevent iOS zoom)

**SelectTrigger** (`src/shared/components/ui/select.tsx`):
- Tingginya `h-10` fixed, di mobile seharusnya lebih besar untuk touch target (44px minimum)
- Ubah: `h-10` ke `h-12 md:h-10`, tambah `text-base md:text-sm`

### B. Dialog Forms -- Consistent Spacing & Padding

**PropertyFormDialog**, **UnitFormDialog**, **AddTenantDialog**, **InviteTenantDialog**:
- Form scroll area: tambah `px-1` padding agar content tidak mentok ke edge di mobile
- Step indicator separators: tambah `hidden sm:block` pada separator agar di mobile hanya tampil circles
- DialogFooter: sudah ada `gap-2`, tambah `flex-col-reverse sm:flex-row` agar di mobile buttons stack

### C. Tables -- Mobile Card View

**InvitationsTable** (`src/features/users/components/tenant/InvitationsTable.tsx`):
- Table columns "Properti", "Tanggal Kirim" tidak visible di mobile -- terlalu banyak kolom
- Tambah `hidden sm:table-cell` pada kolom non-essential
- Tambah mobile info di bawah email (property name, date sebagai inline text)

**TenantsTable** (`src/features/users/components/tables/TenantsTable.tsx`):
- Pagination controls: `flex-col sm:flex-row` agar di mobile text dan buttons tidak terlalu cramped
- Sudah ada responsive hiding -- OK

### D. TenantStats -- Grid Responsive

**TenantStats** (`src/features/users/components/tenant/TenantStats.tsx`):
- `grid-cols-1 md:grid-cols-3` sudah OK, tapi card padding bisa lebih compact di mobile
- Angka `text-3xl` terlalu besar di mobile kecil -- ubah ke `text-2xl sm:text-3xl`

### E. TenantDetailsDialog -- Mobile Spacing

- Financial summary `grid-cols-2` tanpa responsive -- OK karena hanya 2 item
- Avatar header: `w-14 h-14` bisa dikecilkan di mobile kecil -- `w-12 h-12 sm:w-14 sm:h-14`

---

## 2. UnitsManager Card Navigation ke Detail

Saat ini card unit di UnitsManager navigate ke `/merchant/units` (list page). Route detail unit sudah ada di `/merchant/units/:unitId`. 

**Perbaikan**:
- Ubah `onClick={() => navigate('/merchant/units')}` ke `onClick={() => navigate('/merchant/units/${unit.id}')}`
- Ini konsisten dengan behavior di `UnitsTable.tsx` yang sudah navigate ke detail

File: `src/features/properties/components/UnitsManager.tsx` line 195

---

## 3. Tenant Flow Audit -- Business Logic Issues

Setelah audit menyeluruh terhadap semua file tenant di merchant, berikut temuan dan perbaikan:

### A. Bahasa Campuran (ID + EN) -- Konsistensi

Seluruh UI mencampur bahasa Indonesia dan Inggris secara acak:
- "Kirim Undangan" (ID) vs "Add Tenant" (EN) di satu baris
- "Active Tenants" (EN) di tab vs "Hari Tagihan" (ID) di form
- "Showing 1 to 10 of 20" (EN) vs "Tidak ada undangan" (ID)

**Perbaikan**: Konsistenkan ke Bahasa Indonesia (sesuai target market kost/kontrakan Indonesia):
- Tab: "Undangan" dan "Tenant Aktif"
- Buttons: "Tambah Tenant" dan "Kirim Undangan" 
- Empty states, pagination, error messages -- semua ke ID
- Stats labels: "Undangan Pending", "Tenant Aktif", "Unit Tersedia"

### B. "Add Tenant" vs "Kirim Undangan" -- Membingungkan

Dua action button yang mirip di header:
1. **Add Tenant** -- bypass invitation, langsung buat kontrak
2. **Kirim Undangan** -- kirim invitation email

User bingung kapan pakai yang mana. Best practice:
- **Undangan** = flow normal (tenant belum ada di sistem atau belum terhubung)
- **Tambah Langsung** = shortcut untuk tenant yang sudah ada di sistem

**Perbaikan**:
- Rename "Add Tenant" ke "Tambah Langsung" dengan subtitle/tooltip "Untuk tenant yang sudah terdaftar di sistem"
- Jadikan "Kirim Undangan" sebagai primary button (action utama)
- "Tambah Langsung" sebagai secondary/outline
- Urutan: Primary dulu (Kirim Undangan), lalu secondary (Tambah Langsung)

### C. InvitationsTable -- Kurang Responsive & Info

- Kolom "Properti" dan "Tanggal Kirim" harus hidden di mobile
- Tampilkan info properti di bawah email pada mobile view
- Cancel button hanya untuk status "pending" -- saat ini semua invitation bisa di-cancel

**Perbaikan**:
- Tambah `hidden sm:table-cell` pada kolom Properti dan Tanggal Kirim  
- Tambah mobile inline info di cell Email
- Disable cancel button jika status bukan "pending"

### D. TenantsTable -- Linked Tenant Display Issues

Untuk linked tenants (tanpa kontrak):
- Property & Unit kolom menampilkan "Unknown Property" / "Unit N/A" -- membingungkan
- Rent kolom menampilkan "Rp0" -- salah, harusnya "-" atau "Belum ada kontrak"
- Dates kolom: `format(new Date(''), ...)` bisa error

**Perbaikan**:
- Jika `tenant.status === 'linked'`: tampilkan "Belum ada unit" di kolom Property
- Jika `rent_amount === 0` dan status linked: tampilkan "-" bukan "Rp0"
- Guard date formatting: jika `start_date` kosong, tampilkan "-"

### E. AddTenantDialog -- Mengambil SEMUA Tenant di Sistem

`useAllTenantsInSystem()` mengambil semua record dari tabel `tenants` -- ini masalah:
1. **Security**: Merchant bisa melihat semua tenant di platform, termasuk yang bukan miliknya
2. **Performance**: Jika ada ribuan tenant, list akan sangat panjang
3. **Business logic**: Seharusnya hanya menampilkan tenant yang sudah pernah terhubung atau yang belum punya merchant

**Perbaikan**:
- Filter `getAllTenantsInSystem` di service: hanya tampilkan tenant yang `linked_merchant_id IS NULL` (belum terhubung ke merchant manapun) atau `linked_merchant_id = merchantId` (sudah terhubung ke merchant ini tapi belum punya kontrak)
- Tambah `merchantId` parameter ke query
- Ubah hook menjadi `useAvailableTenants(merchantId)`

### F. addTenantDirectly -- Unit Status Tidak Diupdate

Ketika kontrak dibuat langsung via AddTenantDialog:
- Unit status tetap "available" padahal sudah ada kontrak aktif
- Ini menyebabkan unit masih muncul di daftar available units

**Perbaikan** di `merchantTenantService.addTenantDirectly`:
- Setelah insert contract, update unit status ke "occupied":
  ```
  await supabase.from('units').update({ status: 'occupied' }).eq('id', data.unit_id)
  ```

### G. sendInvitation -- Fallback ke tenant_invitations insert tanpa property_id FK guard

Sudah di-fix di migration sebelumnya (property_id nullable, unit_id nullable). Tapi di `addTenantDirectly` fallback path (line 276-291), masih insert `unit_id` tanpa `property_id`. Ini inkonsisten.

**Perbaikan**: Tambah `property_id: data.property_id` ke fallback invitation insert.

---

## Ringkasan File yang Diubah

| File | Perubahan |
|------|-----------|
| `src/shared/components/ui/textarea.tsx` | Mobile-friendly height & font size |
| `src/shared/components/ui/select.tsx` | Mobile touch target height (h-12 md:h-10) & font |
| `src/features/properties/components/UnitsManager.tsx` | Card navigate ke `/merchant/units/${unit.id}` |
| `src/features/users/components/tenant/InvitationsTable.tsx` | Responsive columns, cancel guard, bahasa ID |
| `src/features/users/components/tables/TenantsTable.tsx` | Linked tenant display fixes, bahasa ID, date guard |
| `src/features/users/components/tenant/TenantStats.tsx` | Responsive font size, bahasa ID labels |
| `src/features/users/components/tenant/TenantDetailsDialog.tsx` | Mobile avatar sizing |
| `src/features/users/components/tenant/AddTenantDialog.tsx` | Bahasa ID, responsive improvements |
| `src/features/users/components/tenant/TenantsFilters.tsx` | Bahasa ID placeholder |
| `src/features/users/services/merchantTenantService.ts` | getAllTenantsInSystem filter by merchant, addTenantDirectly update unit status, fallback property_id |
| `src/features/users/hooks/useMerchantTenants.ts` | useAvailableTenants(merchantId) |
| `src/pages/merchant/Tenants.tsx` | Button labels & order, bahasa ID |
| `src/features/properties/components/PropertyFormDialog.tsx` | DialogFooter responsive stack |
| `src/features/properties/components/UnitFormDialog.tsx` | DialogFooter responsive stack |

## Urutan Implementasi

1. Base UI components (textarea, select) -- fondasi
2. UnitsManager card navigation -- quick fix
3. Tenant service logic fixes (security filter, unit status update)
4. Responsive fixes di semua dialog/table components
5. Bahasa konsistensi (ID) di semua tenant components

