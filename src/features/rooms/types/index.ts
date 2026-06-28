// Kamar — sesuai schema DB & Class Diagram
export interface Room {
  id: string;
  property_id: string;
  // joined fields dari backend
  property_name?: string;
  room_number: string;
  room_type: string;
  rent_price: number;
  status: 'available' | 'dp_confirmation' | 'occupied';
  // joined field dari list API
  active_tenant_name?: string | null;
  created_at: string;
  updated_at: string;
}

// RoomDetail — extends Room dengan joined fields dari GET /rooms/:id
export interface RoomDetail extends Room {
  active_tenant_id?: string | null;
  active_tenant_name?: string | null;
  active_tenant_phone?: string | null;
  active_tenant_check_in_date?: string | null;
  pending_confirmation_id?: string | null;
  pending_confirmation_name?: string | null;
  pending_confirmation_deadline?: string | null;
}

export interface CreateRoomPayload {
  property_id: string;
  room_number: string;
  room_type: string;
  rent_price: number;
}

export interface UpdateRoomPayload extends Partial<CreateRoomPayload> {
  status?: RoomStatus;
}

export type RoomStatus = Room['status'];
