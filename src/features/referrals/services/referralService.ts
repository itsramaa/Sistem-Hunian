import { apiClient } from '@/lib/axios';
import { Referral, ReferralFilters, ReferralProfile, ReferralStats } from "../types/referrals";

const ITEMS_PER_PAGE = 20;

export const referralService = {
  async fetchReferrals(page: number, filters?: ReferralFilters): Promise<{ referrals: Referral[]; total: number }> {
    try {
      const response = await apiClient.get('/referrals', {
        params: { page, ...filters },
      });
      return {
        referrals: response.data.data.items as Referral[],
        total: response.data.data.total as number,
      };
    } catch (error: any) {
      throw new Error(error.response?.data?.error?.message || error.message || 'Failed to fetch referrals');
    }
  },

  async fetchReferralStats(): Promise<ReferralStats> {
    try {
      const response = await apiClient.get('/referrals/stats');
      return response.data.data as ReferralStats;
    } catch (error: any) {
      throw new Error(error.response?.data?.error?.message || error.message || 'Failed to fetch referral stats');
    }
  },

  async getReferralStats(): Promise<ReferralStats> {
    return this.fetchReferralStats();
  },

  async processReward(referralId: string): Promise<any> {
    try {
      const response = await apiClient.post('/referrals/reward', { referralId });
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error?.message || error.message || 'Failed to process referral reward');
    }
  },

  async fetchProfiles(): Promise<ReferralProfile[]> {
    // TODO: Go endpoint not yet implemented — was: supabase.from('profiles').select('user_id, full_name, email')
    return [];
  },

  async payoutReferral(referralId: string, referral: Referral, rewardAmount: number): Promise<void> {
    try {
      await apiClient.post(`/referrals/${referralId}/payout`, {
        referral_id: referralId,
        reward_amount: referral.reward_amount || rewardAmount,
        referrer_user_id: referral.referrer_user_id,
      });
    } catch (error: any) {
      const msg = error.response?.data?.error?.message || error.message || 'Failed to payout referral';
      throw new Error(msg);
    }
  },

  async validateReferralCode(code: string): Promise<{ name: string; role: string } | null> {
    try {
      const response = await apiClient.get('/referrals/validate', {
        params: { code: code.toUpperCase() },
      });
      return response.data.data as { name: string; role: string };
    } catch (error) {
      console.error('Error validating referral code:', error);
      return null;
    }
  },
};
