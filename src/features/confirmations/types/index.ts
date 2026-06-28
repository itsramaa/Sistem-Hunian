// Konfirmasi DP — sesuai schema DB & Class Diagram
export interface Confirmation {
  id: string;
  room_id: string;
  // joined fields dari backend
  room_number?: string;
  property_name?: string;
  prospect_name: string;
  phone_number: string;
  down_payment_amount: number;
  confirmation_deadline: string;
  remaining_days?: number | null;
  status: "pending" | "confirmed" | "expired";
  updated_by?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateConfirmationPayload {
  room_id: string;
  prospect_name: string;
  phone_number: string;
  down_payment_amount: number;
  confirmation_deadline: string;
}

export interface ConfirmDPPayload {
  name: string;
  identity_number: string;
  phone_number: string;
  check_in_date: string;
  rental_duration: number;
}

export interface UpdateConfirmationPayload {
  confirmation_deadline: string;
}
