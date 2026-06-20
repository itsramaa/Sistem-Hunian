// Kamar — SRS §4.4
export interface Room {
  id: string;
  property_id: string;
  nama_properti: string;
  nomor_kamar: string;
  tipe_kamar: string;
  harga_sewa: number;
  status: 'available' | 'dp_confirmation' | 'occupied';
  penghuni_aktif?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateRoomPayload {
  property_id: string;
  nomor_kamar: string;
  tipe_kamar: string;
  harga_sewa: number;
}

export type UpdateRoomPayload = Partial<CreateRoomPayload>;

export type RoomStatus = Room['status'];
