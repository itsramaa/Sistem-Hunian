// SRS-aligned Property types matching Go backend response
export interface Property {
  id: string;
  nama: string;
  alamat: string;
  deskripsi: string;
  jumlah_kamar: number;
  total_kamar: number;
  kamar_available: number;
  kamar_occupied: number;
  kamar_dp_confirmation: number;
  jumlah_penghuni_aktif: number;
  created_at: string;
  updated_at: string;
}

export interface CreatePropertyPayload {
  nama: string;
  alamat: string;
  deskripsi: string;
}

export type UpdatePropertyPayload = Partial<CreatePropertyPayload>;

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
}
