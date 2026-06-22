// Maintenance — SRS §4.8
export interface Maintenance {
  id: string;
  room_id: string;
  nomor_kamar?: string;
  nama_properti?: string;
  tanggal_laporan: string;
  deskripsi_kerusakan: string;
  tindakan_penanganan?: string;
  biaya?: number;
  status: 'reported' | 'in_progress' | 'completed';
  foto_kerusakan_url?: string;
  foto_penanganan_url?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateMaintenancePayload {
  room_id: string;
  tanggal_laporan: string;
  deskripsi_kerusakan: string;
}

export interface UpdateMaintenancePayload {
  tindakan_penanganan?: string;
  biaya?: number;
  status: 'reported' | 'in_progress' | 'completed';
}
