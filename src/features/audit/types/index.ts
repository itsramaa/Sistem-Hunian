// Audit Trail — sesuai schema DB & Class Diagram
export interface AuditFilters {
  page: number;
  limit: number;
  property_id?: string;
  room_id?: string;
  new_status?: string;
  from_date?: string;
  to_date?: string;
  changed_by?: string;
}

export interface RoomStatusLog {
  id: string;
  room_id: string;
  room_number?: string;
  property_name?: string;
  old_status: string | null;
  new_status: string;
  changed_by: string | null;
  user_name?: string | null;
  created_at: string;
}
