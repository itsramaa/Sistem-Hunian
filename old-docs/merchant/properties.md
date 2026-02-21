# Properties Management

## Overview
Manajemen properti merchant (kos, apartemen, rumah kontrakan).

## File Location
- `src/pages/merchant/Properties.tsx` - Halaman properties

## Database Tables
- `properties` - Data properti
- `units` - Unit dalam properti

## Features
- ✅ List properties
- ✅ Add property
- ✅ Edit property
- ✅ Delete property
- ✅ Property photos
- ✅ Location picker (map)
- ✅ Province/City selection
- ✅ Property details (address, type, amenities)
- ✅ View units per property

## Implementation Status
| Feature | Status |
|---------|--------|
| List | ✅ Complete |
| Create | ✅ Complete |
| Edit | ✅ Complete |
| Delete | ✅ Complete |
| Photos | ✅ Complete |
| Location | ✅ Complete |

## Property Fields
- `name` - Nama properti
- `address` - Alamat lengkap
- `province` - Provinsi
- `city` - Kota
- `postal_code` - Kode pos
- `latitude/longitude` - Koordinat
- `type` - Tipe (kos/apartemen/rumah)
- `photos` - Foto properti
- `amenities` - Fasilitas

## Related Components
- `UnitPhotoUpload` - Upload foto
- `LocationPicker` - Pick location on map
- `ProvincesCitiesSelect` - Province/city dropdown
