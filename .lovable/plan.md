
# Bypass Limits + Add Tenant + Property Wizard + UI/UX Maximization

## Scope Overview

4 major areas of work:
1. **Bypass semua subscription limits** (sementara)
2. **Add Tenant langsung** (tanpa invitation-only)
3. **Property Form Wizard** (multi-step)
4. **Maksimalkan UI/UX** halaman Properties, Property Detail, Tenants, dan Tenant Details

---

## 1. Bypass Subscription Limits

**File:** `src/features/subscriptions/hooks/useSubscriptionLimits.ts`

Ubah return values agar semua limit di-bypass:
- `maxProperties`, `maxUnits`, `maxTenants` = `999999`
- `canAddProperty`, `canAddUnit`, `canAddTenant` = `true`
- `isNearPropertyLimit`, `isNearUnitLimit`, `isNearTenantLimit` = `false`

**File:** `src/features/subscriptions/components/SubscriptionLimitWarning.tsx`
- Return `null` langsung tanpa cek (atau hide saja)

---

## 2. Add Tenant Langsung (Direct Add)

Saat ini merchant hanya bisa **invite** tenant via email. Fitur baru: merchant bisa langsung **add tenant** dengan membuat contract tanpa melalui invitation.

### Flow "Add Tenant"
1. Merchant klik "Add Tenant"
2. Dialog wizard 3 step:
   - **Step 1 - Tenant Info**: Nama, email, phone
   - **Step 2 - Unit Selection**: Pilih property + unit (hanya yang available)
   - **Step 3 - Contract Details**: Start date, end date, rent amount, deposit amount, billing day
3. Submit: buat record di `contracts` + update unit status ke `occupied`

### File Baru
- `src/features/users/components/tenant/AddTenantDialog.tsx` -- Dialog wizard 3-step
- `src/features/users/types/addTenantSchema.ts` -- Zod schema untuk form

### File Update
- `src/features/users/services/merchantTenantService.ts` -- tambah method `addTenantDirectly()`
  - Cari user by email di `profiles`
  - Jika tidak ada: buat placeholder tenant (insert ke `contracts` tanpa `tenant_user_id` belum bisa karena NOT NULL)
  - Alternatif: tetap perlu email match dengan existing user, atau buat invitation otomatis di background
  - **Pendekatan terbaik**: Merchant add tenant = auto-create invitation + auto-create contract dengan status `pending_signature`. Tenant tinggal sign up dan accept.
  - Atau: Jika user sudah ada (by email), langsung buat contract. Jika belum ada, buat invitation + contract pending.
- `src/features/users/hooks/useMerchantTenants.ts` -- tambah mutation `addTenant`
- `src/pages/merchant/Tenants.tsx` -- tambah button "Add Tenant" + integrate dialog

### Pendekatan Database
Karena `contracts.tenant_user_id` NOT NULL, jika user belum terdaftar:
- Buat invitation di background (auto)
- Buat contract dengan status `draft` setelah tenant sign up

Jika user sudah ada (match email di `profiles`):
- Langsung buat contract dengan status `pending_signature`
- Update unit status

---

## 3. Property Form Wizard (Multi-Step)

Ubah `PropertyFormDialog` dari single long form menjadi wizard 3 langkah.

### Steps
1. **Step 1 - Info Dasar**: Nama, tipe properti, deskripsi
2. **Step 2 - Lokasi**: Province, city, address (map picker), postal code
3. **Step 3 - Media & Fasilitas**: Foto, amenities

### UI Pattern
- Progress indicator bar di atas (Step 1/3, 2/3, 3/3) dengan label
- Animasi slide transition antar step
- Tombol "Back" dan "Next" / "Submit" di footer
- Validasi per-step (hanya validasi fields di step aktif)
- Review summary sebelum submit (opsional, bisa skip)

### File
- `src/features/properties/components/PropertyFormDialog.tsx` -- rewrite jadi wizard
- Komponen internal per step (tidak perlu file terpisah, cukup function components dalam file yang sama)

---

## 4. UI/UX Maximization

### 4A. Halaman Properties (`Properties.tsx`)

Sudah cukup baik dari iterasi sebelumnya. Perbaikan tambahan:
- Stats card ke-4: **Revenue Potential** (total rent dari occupied units)
- Animasi counter pada angka stats (count-up effect sederhana)
- Empty state: tambah ilustrasi gradient yang lebih menarik

### 4B. Property Detail (`PropertyDetail.tsx`)

Peningkatan signifikan:
- **Breadcrumb navigation**: Dashboard > Properties > [Property Name]
- **Image gallery**: Lightbox view saat klik foto (dialog full-screen)
- **Units tab**: Tambah tombol "Add Unit" dan "Edit Unit" inline
- **Overview tab**: Card layout lebih visual, alamat dengan copy button
- **Stats cards**: Tambah border-left accent colors seperti Properties page
- **Sidebar**: Tambah occupancy donut/ring visual kecil
- **Mobile**: Full-width tabs, collapsible sidebar info
- **Edit button**: Langsung buka PropertyFormDialog dengan data property
- **Photos button**: Langsung buka image manager dialog

### 4C. Halaman Tenants (`Tenants.tsx`)

Peningkatan:
- **Stats cards enhanced**: Border accent, icon backgrounds lebih visual, tooltip info
- **Tab badges**: Animasi pulse pada pending count
- **Filters enhanced**: Tambah sort options (Name, Date, Rent amount), active filter badges
- **Empty state per tab**: Ilustrasi berbeda untuk Invitations vs Active Tenants
- **Invitations table**: Status badges dengan warna lebih kuat, relative time ("2 days ago")
- **Active tenants table**: Avatar placeholder (inisial), row hover highlight
- **Quick actions**: Tombol action lebih visible (tidak hanya dropdown)
- **Add Tenant button**: Tombol baru di samping "Send Invitation"
- **Skeleton loading**: Skeleton per-tab, bukan generic spinner

### 4D. Tenant Details Dialog (`TenantDetailsDialog.tsx`)

Redesign dari basic list menjadi rich detail view:
- **Header**: Avatar placeholder (inisial + warna random), nama besar, status badge
- **Card-based layout**: Personal info card, unit info card, contract card (bukan plain list)
- **Contract timeline visual**: Start - Now - End dengan progress bar
- **Financial summary**: Rent + deposit + total paid (jika ada data)
- **Action buttons**: Edit contract, Renew, Terminate (sesuai status)
- **Responsive**: Dialog lebih lebar di desktop (max-w-2xl), scrollable di mobile

---

## Detail Teknis Per File

### File Baru (4)
| File | Deskripsi |
|------|-----------|
| `src/features/users/components/tenant/AddTenantDialog.tsx` | Wizard 3-step untuk add tenant langsung |
| `src/features/users/types/addTenantSchema.ts` | Zod schema untuk add tenant form |

### File Update (10)
| File | Perubahan |
|------|-----------|
| `src/features/subscriptions/hooks/useSubscriptionLimits.ts` | Bypass semua limit = 999999 |
| `src/features/subscriptions/components/SubscriptionLimitWarning.tsx` | Return null |
| `src/features/properties/components/PropertyFormDialog.tsx` | Rewrite jadi wizard 3-step |
| `src/features/users/services/merchantTenantService.ts` | Tambah `addTenantDirectly()` |
| `src/features/users/hooks/useMerchantTenants.ts` | Tambah mutation `addTenant` |
| `src/pages/merchant/Tenants.tsx` | Add Tenant button, enhanced stats, filters, skeletons, empty states |
| `src/pages/merchant/Properties.tsx` | Revenue stat, counter animation |
| `src/pages/merchant/PropertyDetail.tsx` | Breadcrumb, lightbox, enhanced cards, edit/photos integration |
| `src/features/users/components/tenant/TenantDetailsDialog.tsx` | Full redesign: avatar, cards, timeline, actions |
| `src/features/users/components/tables/TenantsTable.tsx` | Avatar, hover, enhanced actions |

---

## Urutan Implementasi

1. Bypass subscription limits (2 files)
2. Add Tenant schema + service method (2 files)
3. Add Tenant dialog wizard (1 file)
4. Property Form wizard rewrite (1 file)
5. Tenants page UI/UX upgrade (Tenants.tsx + TenantsTable + TenantDetailsDialog + TenantsFilters)
6. Properties page + Property Detail page enhancements
