
# Fasilitas Tabel, Map Fullscreen, Form Restructure, DSS ke Overview, Maintenance Cost, dan Foto Button

## 1. Buat Tabel Fasilitas dengan Harga dan Depresiasi

Fasilitas akan memiliki tabel sendiri (`facilities`) dengan harga, tipe (umum/unit), dan data untuk kalkulasi depresiasi. Kemudian tabel relasi (`property_facilities` dan `unit_facilities`) menghubungkan fasilitas ke properti/unit.

### Database Migration

```sql
-- Master fasilitas
CREATE TABLE public.facilities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID NOT NULL REFERENCES public.merchants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'umum' CHECK (category IN ('umum', 'unit')),
  purchase_price NUMERIC DEFAULT 0,
  purchase_date DATE,
  useful_life_months INTEGER DEFAULT 60,
  salvage_value NUMERIC DEFAULT 0,
  brand TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Fasilitas terpasang di properti
CREATE TABLE public.property_facilities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  facility_id UUID NOT NULL REFERENCES public.facilities(id) ON DELETE CASCADE,
  quantity INTEGER DEFAULT 1,
  installed_date DATE,
  condition TEXT DEFAULT 'baik',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(property_id, facility_id)
);

-- Fasilitas terpasang di unit
CREATE TABLE public.unit_facilities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id UUID NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
  facility_id UUID NOT NULL REFERENCES public.facilities(id) ON DELETE CASCADE,
  quantity INTEGER DEFAULT 1,
  installed_date DATE,
  condition TEXT DEFAULT 'baik',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(unit_id, facility_id)
);

-- RLS
ALTER TABLE public.facilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_facilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.unit_facilities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Merchant manages own facilities" ON public.facilities
  FOR ALL USING (merchant_id IN (SELECT id FROM merchants WHERE user_id = auth.uid()));

CREATE POLICY "Merchant manages property facilities" ON public.property_facilities
  FOR ALL USING (property_id IN (
    SELECT id FROM properties WHERE merchant_id IN (SELECT id FROM merchants WHERE user_id = auth.uid())
  ));

CREATE POLICY "Merchant manages unit facilities" ON public.unit_facilities
  FOR ALL USING (unit_id IN (
    SELECT u.id FROM units u JOIN properties p ON u.property_id = p.id
    WHERE p.merchant_id IN (SELECT id FROM merchants WHERE user_id = auth.uid())
  ));
```

### UI Changes
- **`CustomAmenities.tsx`**: Refactor to fetch from `facilities` table instead of hardcoded arrays. Show price, condition. Toggle badges still select/deselect facilities.
- **New `FacilityManagementDialog.tsx`**: Dialog for CRUD fasilitas master (nama, harga, tipe, umur pakai, nilai sisa). Accessible from property form dan unit form.
- **Property form step "Detail"**: Move amenities/fasilitas selection here (from step 3/Media to step 2/Detail). Add "Kelola Fasilitas" button.
- **Depresiasi**: Computed on the fly: `(purchase_price - salvage_value) / useful_life_months * months_elapsed`. Shown in financial tab.

## 2. Map Fullscreen Toggle dengan Search

Add fullscreen toggle button to `LocationPicker.tsx` map, and show search bar inside the fullscreen view.

**File:** `src/features/properties/components/LocationPicker.tsx`
- Add `Maximize2`/`Minimize2` icon button to toggle map container from `h-64` to fixed fullscreen overlay (`fixed inset-0 z-50`)
- In fullscreen mode, show the search input overlaid on the map (top bar)
- Add ESC key handler to exit fullscreen
- Portal the fullscreen map to document.body to avoid parent overflow issues

## 3. Move Fasilitas to Step "Detail" in Property Form, Move Marketing Cost to Financial Tab

**File:** `src/features/properties/components/PropertyFormDialog.tsx`
- Move `CustomAmenities` from step 3 (Media) to step 2 (Detail)
- Remove `marketing_cost` field from step 2 form
- Step 3 (Media) now only has photo upload
- `marketing_cost` stays in the schema for DB but is removed from the create/edit form
- Marketing cost is edited via the Financial tab in PropertyDetail (already has `PropertyFinancialForm`)

**File:** `src/features/properties/components/PropertyFinancialForm.tsx`
- Add `marketing_cost` field if not already present

## 4. Move DSS Readiness and Financial Metrics to Overview Tab

Currently `DssReadinessCard` and `PropertyFinancialMetrics` are in the Financial tab. Move them to the Overview tab for immediate visibility.

**File:** `src/pages/merchant/PropertyDetail.tsx`
- In Overview tab (`TabsContent value="overview"`): Add `DssReadinessCard` and `PropertyFinancialMetrics` cards after the existing address/description/amenities cards
- In Financial tab: Remove `DssReadinessCard` and `PropertyFinancialMetrics` from `FinancialTabWithReadiness`. Keep only `PropertyFinancialForm` and `RenovationHistoryCard`

## 5. Add Estimated Cost Field to Maintenance

The `maintenance_requests` table currently has no cost field. Add `estimated_cost` column.

### Database Migration
```sql
ALTER TABLE public.maintenance_requests ADD COLUMN estimated_cost NUMERIC DEFAULT 0;
```

### UI Changes
**File:** `src/features/maintenance/components/CreateMaintenanceDialog.tsx`
- Add `estimatedCost` state and input field (Rp) between priority and photos
- Include in submit payload

**File:** `src/features/maintenance/types/index.ts`
- Add `estimated_cost` to `CreateMerchantMaintenancePayload`

## 6. Add "Foto" Button Next to "Edit Properti" in Detail Header

**File:** `src/pages/merchant/PropertyDetail.tsx`
- Next to the "Edit Properti" button (line ~285), add a "Foto" button with `ImageIcon`
- On click, open the same `ImageGalleryUpload` dialog that exists in `Properties.tsx`
- Add state for `showPhotoDialog` and `propertyImages`
- Reuse the `ImageGalleryUpload` component from `@/shared/components/FileUpload`

---

## Files Summary

| File | Change |
|------|--------|
| **Database migration** | Create `facilities`, `property_facilities`, `unit_facilities` tables; add `estimated_cost` to `maintenance_requests` |
| `src/features/properties/components/CustomAmenities.tsx` | Refactor to use `facilities` table data |
| `src/features/properties/components/FacilityManagementDialog.tsx` | **New**: CRUD dialog for master facilities |
| `src/features/properties/components/LocationPicker.tsx` | Add fullscreen toggle with search overlay |
| `src/features/properties/components/PropertyFormDialog.tsx` | Move fasilitas to step Detail, remove marketing_cost |
| `src/features/properties/components/PropertyFinancialForm.tsx` | Add marketing_cost field |
| `src/pages/merchant/PropertyDetail.tsx` | Move DSS+Metrics to overview, add Foto button with dialog |
| `src/features/maintenance/components/CreateMaintenanceDialog.tsx` | Add estimated_cost field |
| `src/features/maintenance/types/index.ts` | Add estimated_cost to payload type |

## Technical Notes

- Depresiasi fasilitas dihitung client-side: `(purchase_price - salvage_value) / useful_life_months * elapsed_months`. Ditampilkan di financial tab.
- `facilities` table adalah master data per-merchant. `property_facilities` dan `unit_facilities` adalah junction tables.
- Map fullscreen menggunakan CSS `fixed inset-0 z-50` dengan portal ke body, bukan native Leaflet fullscreen plugin.
- Marketing cost tetap di tabel `properties` untuk backward compat, hanya UI input-nya yang dipindah ke financial tab.
- `estimated_cost` di maintenance default 0 agar tidak break data existing.
