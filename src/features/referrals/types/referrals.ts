export interface Referral {
  id: string;
  referrer_user_id: string;
  referee_user_id: string | null;
  referral_code: string;
  referrer_role: string;
  referee_role: string | null;
  status: string;
  referral_type?: string | null;
  commission_amount?: number | null;
  commission_status?: string | null;
  reward_type?: string | null;
  reward_amount: number | null;
  reward_paid: boolean;
  notes?: string | null;
  created_at: string;
  completed_at: string | null;
  [key: string]: unknown;
}

export interface ReferralProfile {
  user_id: string;
  full_name: string | null;
  email: string | null;
}

export interface ReferralFilters {
  dateRange?: { from?: Date; to?: Date };
  status?: string;
  search?: string;
}

export interface ReferralStats {
  total: number;
  completed: number;
  pending: number;
  totalPaid: number;
  pendingPayout: number;
  // Aliases for compatibility
  totalReferrals?: number;
  pendingReferrals?: number;
  completedReferrals?: number;
  totalCommissions?: number;
  pendingCommissions?: number;
  paidCommissions?: number;
  [key: string]: unknown;
}

export const DEFAULT_REWARD_AMOUNT = 50000;
