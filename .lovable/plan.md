

# Asset Quantity, Facility Name Resolution, Tab Risiko, dan Sistem Peraturan

## 1. Asset Quantity (Jumlah Aset)

**Masalah:** Form "Tambah Aset" hanya bisa menambah 1 aset per submit. Jika jumlah 0, tidak boleh di-assign.

**Perubahan:**
- **`AddAssetForm.tsx`**: Tambah field `quantity` (default 1, min 1). Saat save, loop insert N kali (atau batch insert). Jika quantity = 0, disable tombol submit.
- **Inventory.tsx** (tab Aset): Tampilkan jumlah aset per tipe di tabel/badge.
- **Validasi assign**: Saat assign aset ke property/unit, cek apakah ada aset `status = 'available'` untuk tipe tersebut. Jika 0, disable tombol assign / tampilkan pesan.

## 2. Fasilitas Tampil Nama, Bukan ID

**Masalah:** `property.amenities` menyimpan array UUID dari `facility_types`. Di PropertyDetail dan UnitDetail, badge menampilkan UUID mentah karena hanya melakukan string formatting (`a.replace(/_/g, ' ')`).

**Perubahan:**

### PropertyDetail.tsx (line 482-486)
- Fetch `facility_types` berdasarkan `property.amenities` (array of IDs)
- Tampilkan `name` dari facility_type, bukan ID
- Setiap badge bisa diklik untuk redirect ke `/merchant/inventory` (detail fasilitas)

### UnitDetail.tsx (line 425-436)
- Sama: resolve amenity IDs ke nama facility_type
- Badge bisa diklik → redirect ke inventory

### Implementasi:
- Buat hook `useFacilityTypeNames(ids: string[])` yang fetch facility_types by IDs dan return map `{id: name}`
- Gunakan di kedua halaman

## 3. Tab Risiko (Pindahkan Compliance dari Overview)

**Masalah:** Risiko & Kepatuhan saat ini ada di tab Ringkasan (overview). Perlu dipindahkan ke tab terpisah.

**Perubahan di PropertyDetail.tsx:**
- Tambah tab baru "Risiko" di TabsList (setelah Pemeliharaan)
- Pindahkan `<LazyCompliance propertyId={id} />` dari TabsContent overview ke TabsContent "risk"
- Update `getInitialTab` valid tabs: tambah `'risk'`

## 4. Database: Tabel Peraturan (Rules)

### Tabel Baru

**`rule_types`** (master template):
```text
id              UUID PK DEFAULT gen_random_uuid()
merchant_id     UUID FK merchants
name            TEXT NOT NULL
category        TEXT DEFAULT 'umum'
default_scope   TEXT DEFAULT 'property'
created_at      TIMESTAMPTZ DEFAULT now()
updated_at      TIMESTAMPTZ DEFAULT now()
UNIQUE(merchant_id, name)
```

**`rules`** (instance per properti/unit):
```text
id              UUID PK DEFAULT gen_random_uuid()
merchant_id     UUID FK merchants
property_id     UUID FK properties
unit_id         UUID FK units (nullable)
rule_type_id    UUID FK rule_types (nullable)
title           TEXT NOT NULL
description     TEXT
is_active       BOOLEAN DEFAULT true
is_overridable  BOOLEAN DEFAULT false
effective_from  DATE DEFAULT CURRENT_DATE
effective_until DATE (nullable)
created_at      TIMESTAMPTZ DEFAULT now()
updated_at      TIMESTAMPTZ DEFAULT now()
```

**`rule_acknowledgements`** (tenant agreement tracking):
```text
id              UUID PK DEFAULT gen_random_uuid()
rule_id         UUID FK rules ON DELETE CASCADE
tenant_id       UUID NOT NULL
acknowledged_at TIMESTAMPTZ DEFAULT now()
```

- RLS policies: merchant manages own rules via merchant_id
- Triggers: `update_updated_at_column` on rules and rule_types

## 5. UI Peraturan di Property & Unit Detail

### PropertyDetail.tsx -- Section Peraturan di Overview
- Tambah card "Peraturan" di tab overview (setelah fasilitas, sebelum DSS)
- Tampilkan semua rules yang `property_id = id` dan `unit_id IS NULL`
- Setiap rule ditampilkan sebagai card mini dengan: title, description, badge aktif/nonaktif
- Tombol "Tambah Peraturan" membuka inline form sederhana (title, description, is_overridable, effective_from)
- Tombol edit/delete di setiap rule card

### UnitDetail.tsx -- Section Peraturan di Overview
- Tampilkan rules khusus unit (`unit_id = id`) + inherited rules dari properti (`property_id = unit.property.id AND unit_id IS NULL`)
- Inherited rules ditandai badge "Dari Properti"
- Bisa tambah rule override khusus unit
- Tombol add/edit/delete

### Komponen Baru
- **`src/features/rules/components/RulesSection.tsx`**: Komponen reusable yang menampilkan list rules + inline form tambah/edit. Props: `propertyId`, `unitId?`, `merchantId`
- **`src/features/rules/hooks/useRules.ts`**: Query dan mutation hooks untuk CRUD rules

## Files Summary

| File | Perubahan |
|------|-----------|
| **Database migration** | Buat `rule_types`, `rules`, `rule_acknowledgements` + RLS |
| `src/features/inventory/components/AddAssetForm.tsx` | Tambah field quantity, batch insert |
| `src/features/inventory/hooks/useFacilityTypeNames.ts` | **Baru**: Hook resolve IDs ke names |
| `src/pages/merchant/PropertyDetail.tsx` | Resolve facility names, tambah tab Risiko, tambah RulesSection di overview |
| `src/pages/merchant/UnitDetail.tsx` | Resolve facility names, tambah RulesSection di overview |
| `src/features/rules/components/RulesSection.tsx` | **Baru**: Komponen list + CRUD rules |
| `src/features/rules/hooks/useRules.ts` | **Baru**: Query/mutation hooks rules |

## Technical Notes

- Batch insert aset: loop N kali `supabase.from('assets').insert()` dalam satu mutation (Supabase mendukung array insert)
- Facility name resolution: query `facility_types` WHERE `id IN (amenity_ids)` lalu map
- Rules inherited: query WHERE `property_id = X AND unit_id IS NULL` untuk property-level, unit-specific query WHERE `unit_id = Y`
- Rule acknowledgements digunakan nanti untuk tracking tenant agreement (phase 2)

