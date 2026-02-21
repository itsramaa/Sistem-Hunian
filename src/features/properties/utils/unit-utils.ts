// Dynamic unit types based on property type
export const getUnitTypesForProperty = (propertyType: string | undefined): { value: string; label: string }[] => {
  switch (propertyType) {
    case 'kost':
      return [
        { value: 'kamar_standard', label: 'Kamar Standard' },
        { value: 'kamar_vip', label: 'Kamar VIP' },
        { value: 'kamar_deluxe', label: 'Kamar Deluxe' },
        { value: 'kamar_ac', label: 'Kamar AC' },
        { value: 'kamar_non_ac', label: 'Kamar Non-AC' },
      ];
    case 'apartment':
      return [
        { value: 'studio', label: 'Studio' },
        { value: '1br', label: '1 Bedroom' },
        { value: '2br', label: '2 Bedroom' },
        { value: '3br', label: '3 Bedroom' },
        { value: 'penthouse', label: 'Penthouse' },
      ];
    case 'house':
      return [
        { value: 'full_house', label: 'Full House' },
      ];
    case 'kontrakan':
      return [
        { value: 'petak', label: 'Petak' },
        { value: 'full_bangunan', label: 'Full Bangunan' },
      ];
    case 'ruko':
      return [
        { value: 'lantai_1', label: 'Lantai 1' },
        { value: 'lantai_2', label: 'Lantai 2' },
        { value: 'lantai_3', label: 'Lantai 3' },
        { value: 'full_building', label: 'Full Building' },
      ];
    default:
      return [
        { value: 'studio', label: 'Studio' },
        { value: 'room', label: 'Room' },
        { value: 'apartment', label: 'Apartment' },
        { value: 'house', label: 'House' },
        { value: 'office', label: 'Office' },
        { value: 'retail', label: 'Retail' },
      ];
  }
};

export const statusColors: Record<string, string> = {
  available: 'bg-success/10 text-success border-success/20',
  occupied: 'bg-primary/10 text-primary border-primary/20',
  maintenance: 'bg-warning/10 text-warning border-warning/20',
  reserved: 'bg-info/10 text-info border-info/20',
};

export const MAX_REASONABLE_SIZE = 10000; // 10,000 sqm
