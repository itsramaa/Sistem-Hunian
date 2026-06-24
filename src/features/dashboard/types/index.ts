export interface DashboardSummary {
  total_properti: number;
  total_kamar: number;
  kamar_available: number;
  kamar_occupied: number;
  kamar_dp_confirmation: number;
  properti_summary: Array<{
    property_id: string;
    nama_properti: string;
    total_kamar: number;
    occupied: number;
    available: number;
    dp_confirmation: number;
  }>;
  maintenance_summary: {
    reported: number;
    in_progress: number;
  };
}

export interface DpAlert {
  confirmation_id: string;
  room_id: string;
  nomor_kamar: string;
  nama_properti: string;
  nama_calon_penghuni: string;
  batas_tanggal: string;
  sisa_hari: number;
  tipe: "dp_reminder" | "dp_expired";
}

export interface PaymentAlert {
  room_id: string;
  nomor_kamar: string;
  nama_properti: string;
  nama_penghuni: string;
  periode: string;
  tipe: "payment_due" | "payment_overdue";
}

export interface DashboardAlerts {
  dp_alerts: DpAlert[];
  payment_alerts: PaymentAlert[];
}

export interface Notification {
  id: string;
  tipe: "dp_reminder" | "dp_expired" | "payment_due" | "payment_overdue";
  referensi_id: string;
  pesan: string;
  is_read: boolean;
  created_at: string;
}
