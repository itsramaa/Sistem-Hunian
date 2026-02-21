export interface Profile {
  id: string;
  user_id: string;
  email?: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface TenantProfile {
  id: string;
  user_id: string;
  ktp_number: string | null;
  ktp_photo_url: string | null;
  date_of_birth: string | null;
  gender: string | null;
  occupation: string | null;
  income_range: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  emergency_contact_relation: string | null;
  auto_pay_enabled?: boolean;
  auto_pay_day?: number | null;
  notification_preferences?: {
    payment_reminders: boolean;
    maintenance_updates: boolean;
    new_invoices: boolean;
    contract_updates: boolean;
    forum_replies: boolean;
    order_updates: boolean;
  };
  created_at: string;
  updated_at: string;
}

export interface UpdateProfilePayload {
  full_name?: string;
  phone?: string;
  avatar_url?: string;
}

export interface UpdateTenantPayload {
  ktp_number?: string;
  ktp_photo_url?: string;
  date_of_birth?: string;
  gender?: string;
  occupation?: string;
  income_range?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_contact_relation?: string;
  auto_pay_enabled?: boolean;
  auto_pay_day?: number;
  notification_preferences?: {
    payment_reminders: boolean;
    maintenance_updates: boolean;
    new_invoices: boolean;
    contract_updates: boolean;
    forum_replies: boolean;
    order_updates: boolean;
  };
}
