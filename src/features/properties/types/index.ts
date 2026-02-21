export interface Unit {
  id: string;
  property_id: string;
  unit_number: string;
  unit_type: string;
  floor: number | null;
  size_sqm: number | null;
  rent_amount: number;
  deposit_amount: number | null;
  status: 'available' | 'occupied' | 'maintenance' | 'reserved';
  description: string | null;
  amenities: string[];
  photos?: string[];
  property?: {
    name: string;
    address: string;
    property_type?: string;
  };
}

export type CreateUnitPayload = Omit<Unit, 'id' | 'amenities'> & { amenities?: string[] };
export type UpdateUnitPayload = Partial<CreateUnitPayload>;

export interface Property {
  id: string;
  merchant_id: string;
  name: string;
  property_type: 'kost' | 'apartment' | 'house' | 'kontrakan' | 'ruko';
  address: string;
  city: string;
  province: string;
  postal_code: string | null;
  description: string | null;
  images: string[];
  amenities: string[];
  total_units: number;
  occupied_units: number;
  status: 'active' | 'inactive' | 'maintenance';
  created_at: string;
  updated_at: string;
}

export type CreatePropertyPayload = Omit<Property, 'id' | 'merchant_id' | 'total_units' | 'occupied_units' | 'created_at' | 'updated_at' | 'status'> & {
  status?: Property['status'];
};

export type UpdatePropertyPayload = Partial<CreatePropertyPayload>;

export interface UnitFormData {
  unit_number: string;
  unit_type: string;
  floor?: number | null;
  size_sqm?: number | null;
  rent_amount: number;
  deposit_amount?: number | null;
  status: 'available' | 'occupied' | 'maintenance' | 'reserved';
  description?: string | null;
  amenities?: string[];
}

export interface PropertyWithUnits {
  id: string;
  name: string;
  units: {
    id: string;
    unit_number: string;
    status: string;
  }[];
}
