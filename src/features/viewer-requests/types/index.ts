export interface ViewerRequestPayload {
  jenis: "pembayaran" | "kerusakan" | "calon_penghuni";
  room_id: string | null;
  nomor_kamar: string;
  keterangan: string;
  nama_calon?: string | null;
  no_hp_calon?: string | null;
}

export interface ViewerRequest {
  id: string;
  jenis: string;
  room_id: string | null;
  nomor_kamar: string;
  keterangan: string;
  nama_calon: string | null;
  no_hp_calon: string | null;
  created_by: string;
  nama_pelapor: string;
  status: string;
  created_at: string;
}

export interface ViewerRequestListResponse {
  success: boolean;
  data: ViewerRequest[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
  };
}
