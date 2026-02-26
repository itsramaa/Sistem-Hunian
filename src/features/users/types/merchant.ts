export interface Merchant {
  id: string;
  user_id: string;
  business_name: string;
  business_type: string | null;
  headquarters_address_id: string | null;
  billing_address_id: string | null;
  merchant_code: string | null;
  verification_status: string | null;
  verification_submitted_at: string | null;
  verified_at: string | null;
  verified_by: string | null;
  rejected_at: string | null;
  rejected_by: string | null;
  rejection_details: string | null;
  resubmission_count: number | null;
  resubmission_instructions: string | null;
  penalty_rate: number | null;
  total_disbursed: number | null;
  last_disbursement_date: string | null;
  min_disbursement_amount: number | null;
  created_at: string;
  updated_at: string;
  // Flattened from addresses JOIN
  address?: string | null;
  city?: string | null;
  province?: string | null;
  postal_code?: string | null;
  profiles?: {
    email: string;
    full_name: string | null;
    phone: string | null;
  };
}
