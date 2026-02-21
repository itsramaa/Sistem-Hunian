export interface Referral {
  id: string;
  referrer_user_id: string;
  referee_user_id: string | null;
  referral_code: string;
  status: string;
  referral_type: string | null;
  commission_amount: number | null;
  commission_status: string | null;
  reward_type: string | null;
  reward_amount: number | null;
  notes: string | null;
  created_at: string;
  [key: string]: unknown;
}

export interface ReferralProfile {
  user_id: string;
  email: string;
  full_name: string | null;
}

export interface ReferralFilters {
  dateRange?: { from?: Date; to?: Date };
  status?: string;
  search?: string;
}

export interface ReferralStats {
  total: number;
  totalReferrals: number;
  pendingReferrals: number;
  completedReferrals: number;
  totalCommissions: number;
  pendingCommissions: number;
  paidCommissions: number;
  [key: string]: unknown;
}
