import { supabase } from "@/lib/integrations/supabase/client";
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
    const { data, error } = await supabase
      .from('profiles')
      .select('user_id, full_name, email');

    if (error) throw error;
    return (data as unknown as ReferralProfile[]) || [];
  },

  async payoutReferral(referralId: string, referral: Referral, rewardAmount: number): Promise<void> {
    // Check if already paid (idempotency)
    if (referral.reward_paid) {
      throw new Error('This referral has already been paid');
    }

    // Check for existing reward (double payout prevention)
    const { data: existingReward } = await supabase
      .from('referral_rewards')
      .select('id')
      .eq('referral_id', referralId)
      .eq('status', 'credited')
      .single();

    if (existingReward) {
      throw new Error('A reward has already been credited for this referral');
    }

    const actualRewardAmount = referral.reward_amount || rewardAmount;

    // Update referral as paid
    const { error: referralError } = await supabase
      .from('referrals')
      .update({ reward_paid: true })
      .eq('id', referralId);
    if (referralError) throw referralError;

    // Create reward record
    const { error: rewardError } = await supabase
      .from('referral_rewards')
      .insert({
        user_id: referral.referrer_user_id,
        referral_id: referralId,
        amount: actualRewardAmount,
        type: 'subscription_credit',
        status: 'credited',
        credited_at: new Date().toISOString(),
      });
    if (rewardError) throw rewardError;
  },

  async validateReferralCode(code: string): Promise<{ name: string; role: string } | null> {
    try {
      const { data: referral, error } = await supabase
        .from('referrals')
        .select('referrer_user_id, referrer_role')
        .eq('referral_code', code.toUpperCase())
        .is('referee_user_id', null)
        .single();

      if (error || !referral) return null;

      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('user_id', referral.referrer_user_id)
        .single();

      return {
        name: profile?.full_name || 'Pengguna SiHuni',
        role: referral.referrer_role,
      };
    } catch (error) {
      console.error('Error validating referral code:', error);
      return null;
    }
  },
};
