-- Drop existing constraint
ALTER TABLE units DROP CONSTRAINT IF EXISTS units_unit_type_check;

-- Add new constraint with all valid unit types
ALTER TABLE units ADD CONSTRAINT units_unit_type_check CHECK (
  unit_type = ANY (ARRAY[
    -- Existing types
    'single', 'double', 'studio', 'suite', 'standard',
    -- Kost types
    'kamar_standard', 'kamar_vip', 'kamar_deluxe', 'kamar_ac', 'kamar_non_ac',
    -- Apartment types
    '1br', '2br', '3br', 'penthouse',
    -- House types
    'full_house',
    -- Kontrakan types
    'petak', 'full_bangunan',
    -- Ruko types
    'lantai_1', 'lantai_2', 'lantai_3', 'full_building',
    -- Other types
    'room', 'apartment', 'house', 'office', 'retail'
  ])
);