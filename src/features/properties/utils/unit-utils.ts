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
        { value: 'kamar_mandi_dalam', label: 'Kamar Mandi Dalam' },
        { value: 'kamar_mandi_luar', label: 'Kamar Mandi Luar' },
      ];
    case 'kontrakan':
    case 'ruko':
      return [
        { value: 'petak', label: 'Petak / Kontrakan' },
        { value: 'rumah_full', label: 'Rumah Full' },
        { value: 'ruko_lantai_1', label: 'Ruko Lantai 1' },
        { value: 'ruko_lantai_2', label: 'Ruko Lantai 2' },
        { value: 'ruko_full', label: 'Ruko Full' },
      ];
    default:
      return [
        { value: 'kamar_standard', label: 'Kamar Standard' },
        { value: 'petak', label: 'Petak / Kontrakan' },
        { value: 'ruko_full', label: 'Ruko Full' },
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
