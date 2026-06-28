// Notifikasi — sesuai schema DB & Class Diagram
export interface Notification {
  id: string;
  user_id?: string | null;
  type: 'dp_reminder' | 'dp_expired' | 'payment_due' | 'payment_overdue' | 'contract_reminder' | 'login_new_device' | string;
  reference_id?: string | null;
  message: string;
  is_read: boolean;
  created_at: string;
}
