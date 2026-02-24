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
  occupancy_type?: string;
  electricity_included?: boolean;
  electricity_cost?: number;
  electricity_cost_type?: string;
  water_included?: boolean;
  water_cost?: number;
  water_cost_type?: string;
  wifi_included?: boolean;
  wifi_speed_mbps?: number | null;
  wifi_cost_sharing?: string;
  wifi_cost?: number;
  additional_costs?: AdditionalCost[];
  property?: {
    name: string;
    address: string;
    property_type?: string;
    floor_count?: number;
  };
}

export interface AdditionalCost {
  name: string;
  amount: number;
}

export type CreateUnitPayload = Omit<Unit, 'id' | 'amenities' | 'property'> & { amenities?: string[] };
export type UpdateUnitPayload = Partial<CreateUnitPayload>;

export interface Property {
  id: string;
  merchant_id: string;
  name: string;
  property_type: 'kost' | 'kontrakan';
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
  // New fields - all optional for backward compat
  guardian_name?: string | null;
  guardian_phone?: string | null;
  marketing_cost?: number | null;
  construction_year?: number | null;
  floor_count?: number;
  building_condition?: string | null;
  land_ownership?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  nearby_facilities?: NearbyFacility[];
  // Financial fields
  construction_cost?: number | null;
  renovation_cost?: number | null;
  funding_source?: string | null;
  monthly_amortization?: number | null;
  monthly_maintenance_cost?: number | null;
  avg_annual_unexpected_cost?: number | null;
}

export interface NearbyFacility {
  type: string;
  name: string;
  distance_meters: number;
}

export type CreatePropertyPayload = Omit<Property, 'id' | 'merchant_id' | 'total_units' | 'occupied_units' | 'created_at' | 'updated_at' | 'status'> & {
  status?: Property['status'];
};

export type UpdatePropertyPayload = Partial<CreatePropertyPayload>;

export interface UnitFormData {
  property_id: string;
  unit_number: string;
  unit_type: string;
  floor?: number | null;
  size_sqm?: number | null;
  rent_amount: number;
  deposit_amount?: number | null;
  status: 'available' | 'occupied' | 'maintenance' | 'reserved';
  description?: string | null;
  amenities?: string[];
  photos?: string[];
  occupancy_type?: string;
  electricity_included?: boolean;
  electricity_cost?: number;
  electricity_cost_type?: string;
  water_included?: boolean;
  water_cost?: number;
  water_cost_type?: string;
  wifi_included?: boolean;
  wifi_speed_mbps?: number | null;
  wifi_cost_sharing?: string;
  wifi_cost?: number;
  additional_costs?: AdditionalCost[];
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

export interface PropertyGuardian {
  id: string;
  property_id: string;
  merchant_id: string;
  name: string;
  phone: string | null;
  address: string | null;
  id_number: string | null;
  salary: number;
  salary_frequency: string;
  start_date: string | null;
  end_date: string | null;
  status: string;
  notes: string | null;
  photo_url: string | null;
  created_at: string;
  updated_at: string;
}
