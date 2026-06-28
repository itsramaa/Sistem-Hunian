// Penghuni — sesuai schema DB & Class Diagram
export interface Tenant {
  id: string;
  room_id: string;
  // joined fields dari backend
  property_id?: string;
  room_number?: string;
  property_name?: string;
  name: string;
  identity_number: string;
  phone_number: string;
  check_in_date: string;
  rental_duration: number;
  status: 'active' | 'checked_out';
  check_out_date?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateTenantPayload {
  room_id: string;
  name: string;
  identity_number: string;
  phone_number: string;
  check_in_date: string;
  rental_duration: number;
}

export type TenantStatus = Tenant['status'];
