import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { referralService } from "../services/referralService";
import { Referral, ReferralFilters } from "../types/referrals";

export const useReferrals = (page: number, filters?: ReferralFilters) => {
  const queryClient = useQueryClient();

  const {
    data: referralsData,
    isLoading: loadingReferrals,
    error: referralsError
  } = useQuery({
    queryKey: ['admin-referrals', page, filters?.status, filters?.search, filters?.dateRange?.from, filters?.dateRange?.to],
    queryFn: () => referralService.fetchReferrals(page, filters),
  });

  const {
    data: stats,
    isLoading: loadingStats
  } = useQuery({
    queryKey: ['admin-referral-stats'],
    queryFn: () => referralService.fetchReferralStats(),
  });

  const {
    data: profiles = []
  } = useQuery({
    queryKey: ['admin-profiles-for-referrals'],
    queryFn: () => referralService.fetchProfiles(),
  });

  const payoutMutation = useMutation({
    mutationFn: ({ referralId, referral, rewardAmount }: { referralId: string; referral: Referral; rewardAmount: number }) =>
      referralService.payoutReferral(referralId, referral, rewardAmount),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-referrals'] });
      queryClient.invalidateQueries({ queryKey: ['admin-referral-stats'] });
      queryClient.invalidateQueries({ queryKey: ['admin-referral-rewards'] });
      toast.success('Reward paid successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to process payout');
    },
  });

  return {
    referrals: referralsData?.referrals || [],
    totalReferrals: referralsData?.total || 0,
    loadingReferrals,
    referralsError,
    stats,
    loadingStats,
    profiles,
    payoutMutation,
  };
};
