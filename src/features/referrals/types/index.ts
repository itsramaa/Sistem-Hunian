export interface Referral {
  id: string;
  referral_code: string;
  referrer_user_id: string;
  referee_user_id: string | null;
  referrer_role: string;
  referee_role: string | null;
  status: string;
  reward_amount: number | null;
  reward_paid: boolean;
  created_at: string;
  completed_at: string | null;
}

export interface ReferralProfile {
  user_id: string;
  full_name: string | null;
  email: string | null;
}

export interface ReferralStats {
  total: number;
  completed: number;
  pending: number;
  totalPaid: number;
  pendingPayout: number;
}

export interface ReferralFilters {
  search?: string;
  status?: string;
  dateRange?: { from?: Date; to?: Date };
}

export const DEFAULT_REWARD_AMOUNT = 50000;
