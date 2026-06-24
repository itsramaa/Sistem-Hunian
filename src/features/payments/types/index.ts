// Pembayaran — SRS §4.6
export interface Payment {
  id: string;
  room_id: string;
  tenant_id: string;
  property_id?: string;
  nomor_kamar?: string;
  nama_properti?: string;
  nama_penghuni?: string;
  periode: string; // YYYY-MM
  nominal: number;
  tanggal_bayar?: string;
  status: 'unpaid' | 'paid' | 'overdue';
  metode_pembayaran?: string;
  keterangan?: string;
  bukti_transfer_url?: string;
  created_at: string;
  updated_at: string;
}

export interface CreatePaymentPayload {
  room_id: string;
  tenant_id: string;
  periode: string;
  nominal: number;
  tanggal_bayar?: string;
}

export type PaymentStatus = Payment['status'];
