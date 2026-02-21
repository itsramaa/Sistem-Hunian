export interface VendorVerification {
  id: string;
  vendor_id: string;
  document_type: string;
  document_url: string;
  status: 'pending' | 'verified' | 'rejected';
  rejection_reason: string | null;
  created_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
  vendor?: {
    id: string;
    business_name: string;
    contact_email: string;
    user_id: string;
  };
}

export interface UpdateVerificationParams {
  id: string;
  status: 'verified' | 'rejected';
  rejectionReason?: string;
}
