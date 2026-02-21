# Units Management

## Overview
Manajemen unit dalam properti (kamar kos, unit apartemen).

## File Location
- `src/pages/merchant/Units.tsx` - Halaman units
- `src/components/merchant/UnitsManager.tsx` - Unit manager component
- `src/components/merchant/UnitPhotoUpload.tsx` - Upload foto unit

## Database Tables
- `units` - Data unit
- `properties` - Parent property

## Features
- ✅ List units per property
- ✅ Add unit
- ✅ Edit unit
- ✅ Delete unit
- ✅ Unit photos
- ✅ Unit type (single/double/studio/etc)
- ✅ Unit pricing
- ✅ Unit amenities
- ✅ Availability status
- ✅ Custom amenities

## Implementation Status
| Feature | Status |
|---------|--------|
| List | ✅ Complete |
| Create | ✅ Complete |
| Edit | ✅ Complete |
| Delete | ✅ Complete |
| Photos | ✅ Complete |
| Custom Amenities | ✅ Complete |

## Unit Fields
- `name` - Nama/nomor unit
- `property_id` - Parent property
- `type` - Tipe unit
- `price` - Harga sewa
- `size` - Ukuran (m²)
- `photos` - Foto unit
- `amenities` - Fasilitas
- `status` - available/occupied/maintenance

## Unit Types
- single
- double
- studio
- suite
- other

## Related Components
- `UnitPhotoUpload` - Foto upload
- `CustomAmenities` - Amenities manager
