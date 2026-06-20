// Konfirmasi DP — SRS §4.7
export interface Confirmation {
  id: string;
  room_id: string;
  nomor_kamar: string;
  nama_properti: string;
  nama_calon_penghuni: string;
  nominal_dp: number;
  batas_tanggal_konfirmasi: string;
  sisa_hari?: number;
  status: 'pending' | 'confirmed' | 'expired';
  created_at: string;
  updated_at: string;
}

export interface CreateConfirmationPayload {
  room_id: string;
  nama_calon_penghuni: string;
  nominal_dp: number;
  batas_tanggal_konfirmasi: string;
}

export interface ConfirmDPPayload {
  nama: string;
  nomor_identitas: string;
  nomor_telepon: string;
  tanggal_masuk: string;
  durasi_sewa: number;
}
