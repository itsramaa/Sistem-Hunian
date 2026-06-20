// Penghuni — SRS §4.5
export interface Tenant {
  id: string;
  room_id: string;
  nomor_kamar: string;
  nama_properti: string;
  nama: string;
  nomor_identitas: string;
  nomor_telepon: string;
  tanggal_masuk: string;
  durasi_sewa: number;
  status: 'active' | 'checked_out';
  tanggal_keluar?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateTenantPayload {
  room_id: string;
  nama: string;
  nomor_identitas: string;
  nomor_telepon: string;
  tanggal_masuk: string;
  durasi_sewa: number;
}

export type TenantStatus = Tenant['status'];
