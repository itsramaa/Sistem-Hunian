

# Fix Loading Full-Screen + Tambah Detail Page Properties

## Masalah 1: Loading Full-Screen Saat Pindah Halaman

### Penyebab
Saat ini, `Suspense` di `App.tsx` (baris 124) membungkus SEMUA routes dengan fallback `PageLoader` yang menampilkan spinner full-screen (`min-h-screen`). Ketika berpindah halaman, semua lazy-loaded page (termasuk sidebar dan navbar yang ada di dalamnya) menghilang dan diganti spinner.

Selain itu, `ProtectedRoute` juga menampilkan loader full-screen saat cek autentikasi.

### Solusi

Ubah arsitektur routing menggunakan **Layout Route pattern**:
- Buat komponen layout route per role (misalnya `MerchantLayoutRoute`) yang render sidebar/navbar secara langsung (eager)
- Bungkus `<Outlet />` (konten halaman) dalam `<Suspense>` dengan fallback skeleton ringan
- Halaman-halaman tidak lagi mengimpor layout sendiri, cukup render konten saja

Karena perubahan ini berdampak ke SEMUA halaman di semua role, kita akan fokus pada **merchant** dulu sebagai pilot, dan terapkan pola yang sama ke role lain secara bertahap.

### Perubahan Teknis

**1. Buat `src/shared/components/layouts/MerchantLayoutRoute.tsx`**
- Render `DashboardLayout` dengan `role="merchant"`
- Di dalam content area, render `<Suspense fallback={<ContentSkeleton />}><Outlet /></Suspense>`
- `ContentSkeleton` = skeleton ringan (bukan full screen)

**2. Buat `src/shared/components/ui/ContentSkeleton.tsx`**
- Skeleton loading untuk area konten saja (tanpa sidebar/navbar)
- Beberapa baris skeleton cards/text

**3. Update `src/App.tsx`**
- Ubah merchant routes dari flat menjadi nested:
```text
<Route path="/merchant" element={<ProtectedRoute><MerchantLayoutRoute /></ProtectedRoute>}>
  <Route index element={<MerchantDashboard />} />
  <Route path="properties" element={<MerchantProperties />} />
  <Route path="properties/:id" element={<MerchantPropertyDetail />} />
  <Route path="tenants" element={<MerchantTenants />} />
  ... (semua merchant routes)
</Route>
```

**4. Update SEMUA halaman merchant (17 halaman)**
- Hapus pembungkus `<MerchantLayout>` dari setiap halaman
- Halaman hanya return konten tanpa layout wrapper
- Pindahkan props `title`, `description`, `actions` ke pattern baru (via Outlet context atau langsung di layout route)

**5. Update `ProtectedRoute.tsx`**
- Loading state-nya juga menjadi content-only skeleton (bukan full screen)

---

## Masalah 2: Tambah Detail Page Properties

### Halaman Baru: `/merchant/properties/:id`

Halaman detail properti yang menampilkan informasi lengkap, sesuai skill `interaction-design`, `frontend-design`, `ui-ux-designer`.

### Konten Detail Page

**Header Section**
- Nama properti + badge status (active/inactive/maintenance)
- Badge tipe properti (kost/apartment/house/kontrakan/ruko)
- Badge "Baru" jika < 7 hari
- Tombol aksi: Edit, Manage Photos, Delete

**Image Gallery**
- Carousel foto properti (menggunakan embla-carousel yang sudah terinstall)
- Placeholder gradient jika tidak ada foto
- Jumlah foto

**Info Cards Row**
- Total Units (occupied/total)
- Occupancy Rate (dengan progress bar warna dinamis)
- Revenue Potential (total rent_amount dari occupied units)
- Average Rent (rata-rata rent_amount)

**Tab-based Content**
- **Tab Overview**: Alamat lengkap, deskripsi, amenities badges, peta lokasi (jika ada koordinat)
- **Tab Units**: Tabel units dengan status, tipe, lantai, luas, harga sewa, deposit, action buttons. Filter by status.
- **Tab Activity**: Placeholder untuk log aktivitas (future feature)

**Sidebar Info (Desktop)**
- Created/Updated timestamps
- Property ID (untuk referensi)
- Quick stats ringkasan

### Komponen Baru

**1. `src/pages/merchant/PropertyDetail.tsx`**
- Halaman utama detail properti
- Fetch property by ID + units
- Tab navigation (overview, units, activity)
- Responsive: tabs menjadi full-width di mobile

**2. `src/features/properties/hooks/usePropertyDetail.ts`**
- Hook untuk fetch single property + units-nya
- Query key: `['property-detail', propertyId]`

**3. `src/features/properties/services/propertyService.ts` (update)**
- Tambah method `fetchPropertyById(id)` - fetch property + units
- Tambah method `fetchPropertyUnits(propertyId)` - fetch units dengan detail

**4. `src/features/properties/components/PropertyDetailSkeleton.tsx`**
- Skeleton loading khusus untuk detail page

**5. Update `PropertyCard.tsx`**
- Tambah navigasi ke detail page saat card di-klik (bukan hanya via dropdown)
- Klik card = navigasi ke `/merchant/properties/:id`
- Quick action tetap ada di hover

### Navigasi

- Dari `PropertyCard` klik = buka detail page
- Dari `PropertyTable` row klik = buka detail page
- Detail page punya tombol "Back to Properties"
- Breadcrumb: Dashboard > Properties > [Property Name]

---

## File yang Diubah/Dibuat

| File | Aksi | Deskripsi |
|------|------|-----------|
| `src/shared/components/layouts/MerchantLayoutRoute.tsx` | Baru | Layout route wrapper untuk merchant |
| `src/shared/components/ui/ContentSkeleton.tsx` | Baru | Skeleton untuk area konten |
| `src/pages/merchant/PropertyDetail.tsx` | Baru | Halaman detail properti |
| `src/features/properties/hooks/usePropertyDetail.ts` | Baru | Hook fetch property detail |
| `src/features/properties/components/PropertyDetailSkeleton.tsx` | Baru | Skeleton loading detail page |
| `src/App.tsx` | Update | Nested routes merchant |
| `src/features/properties/services/propertyService.ts` | Update | Tambah fetchPropertyById |
| `src/features/properties/components/PropertyCard.tsx` | Update | Klik navigasi ke detail |
| `src/features/properties/components/PropertyTable.tsx` | Update | Row klik navigasi ke detail |
| `src/features/auth/components/ProtectedRoute.tsx` | Update | Loading bukan full-screen |
| 17 halaman merchant | Update | Hapus wrapper MerchantLayout |

## Urutan Implementasi

1. Buat `ContentSkeleton` + `MerchantLayoutRoute`
2. Restructure merchant routes di `App.tsx` (nested)
3. Update semua 17 halaman merchant (hapus layout wrapper)
4. Update `ProtectedRoute` loading state
5. Buat `usePropertyDetail` hook + update `propertyService`
6. Buat `PropertyDetailSkeleton`
7. Buat `PropertyDetail.tsx` page
8. Update `PropertyCard` + `PropertyTable` untuk navigasi ke detail

