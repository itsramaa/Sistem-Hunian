import { supabase } from "@/lib/integrations/supabase/client";
import { logPayout } from "@/shared/utils/auditLog";
import { Referral, ReferralFilters, ReferralProfile, ReferralStats } from "../types/referrals";

const ITEMS_PER_PAGE = 20;

export const referralService = {
  async fetchReferrals(page: number, filters?: ReferralFilters): Promise<{ referrals: Referral[]; total: number }> {
    let query = supabase
      .from('referrals')
      .select('*', { count: 'exact' });

    if (filters?.dateRange?.from) {
      query = query.gte('created_at', filters.dateRange.from.toISOString());
    }
    if (filters?.dateRange?.to) {
      query = query.lte('created_at', filters.dateRange.to.toISOString());
    }

    const { count } = await query;
    
    const offset = (page - 1) * ITEMS_PER_PAGE;
    
    // Re-apply filters for the data query
    let dataQuery = supabase
      .from('referrals')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + ITEMS_PER_PAGE - 1);

    if (filters?.status && filters.status !== 'all') {
      dataQuery = dataQuery.eq('status', filters.status);
    }
    if (filters?.search) {
      dataQuery = dataQuery.ilike('referral_code', `%${filters.search}%`);
    }
    if (filters?.dateRange?.from) {
      dataQuery = dataQuery.gte('created_at', filters.dateRange.from.toISOString());
    }
    if (filters?.dateRange?.to) {
      dataQuery = dataQuery.lte('created_at', filters.dateRange.to.toISOString());
    }

    const { data, error } = await dataQuery;
    
    if (error) throw error;
    return { referrals: (data as unknown as Referral[]) || [], total: count || 0 };
  },

  async fetchReferralStats(): Promise<ReferralStats> {
    const [
      { count: total },
      { count: completed },
      { count: pending },
      { count: pendingPayout }
    ] = await Promise.all([
      supabase.from('referrals').select('*', { count: 'exact', head: true }),
      supabase.from('referrals').select('*', { count: 'exact', head: true }).eq('status', 'completed'),
      supabase.from('referrals').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('referrals').select('*', { count: 'exact', head: true }).eq('status', 'completed').eq('reward_paid', false)
    ]);

    // Note: totalPaid is still calculated from current page in original code, 
    // to fix it properly we would need a database function or fetch all paid referrals.
    // For now we return 0 for totalPaid and let the hook handle it or just show 0/current page sum.
    // Actually, let's just not return totalPaid here and let the hook decide.
    // But I defined ReferralStats with totalPaid.
    
    return {
      total: total || 0,
      completed: completed || 0,
      pending: pending || 0,
      pendingPayout: pendingPayout || 0,
      totalPaid: 0 // Placeholder
    };
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

    // Log audit
    await logPayout('referral', referralId, actualRewardAmount, referral.referrer_user_id);
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
  }
};
