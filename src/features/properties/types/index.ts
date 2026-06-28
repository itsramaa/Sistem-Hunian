// Property — sesuai schema DB & Class Diagram
export interface Property {
  id: string;
  property_name: string;
  address: string;
  description?: string;
  total_rooms: number;
  // computed/joined fields dari backend
  available_rooms?: number;
  occupied_rooms?: number;
  dp_confirmation_rooms?: number;
  active_tenants?: number;
  created_at: string;
  updated_at: string;
}

export interface CreatePropertyPayload {
  property_name: string;
  address: string;
  description?: string;
}

export type UpdatePropertyPayload = Partial<CreatePropertyPayload>;

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
}
