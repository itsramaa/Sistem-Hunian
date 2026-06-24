export interface AuditFilters {
  page: number;
  limit: number;
  property_id?: string;
  new_status?: string;
  from_date?: string;
  to_date?: string;
  changed_by?: string;
}

export interface RoomStatusLog {
  id: string;
  room_id: string;
  nomor_kamar: string;
  nama_properti: string;
  old_status: string;
  new_status: string;
  changed_by: string;
  changed_at: string;
  reason: string;
}
