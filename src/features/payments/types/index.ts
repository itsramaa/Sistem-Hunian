// Pembayaran — sesuai schema DB & Class Diagram
export interface Payment {
  id: string;
  room_id: string;
  tenant_id: string;
  period: string; // YYYY-MM
  amount: number;
  payment_date?: string | null;
  status: 'unpaid' | 'paid' | 'overdue' | 'cancelled';
  transfer_proof_url?: string | null;
  wa_sent: boolean;
  created_by?: string | null;
  updated_by?: string | null;
  // joined fields dari backend
  room_number?: string;
  property_name?: string;
  tenant_name?: string;
  created_at: string;
  updated_at: string;
}

export interface CreatePaymentPayload {
  room_id: string;
  tenant_id: string;
  period: string;
  amount: number;
  payment_date?: string;
}

export interface UpdatePaymentPayload {
  amount?: number;
  payment_date?: string;
  period?: string;
}

export type PaymentStatus = Payment['status'];
