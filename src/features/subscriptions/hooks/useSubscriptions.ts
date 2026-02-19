import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { subscriptionService } from "../services/subscriptionService";

export const useSubscriptions = () => {
  const queryClient = useQueryClient();

  const { data: merchants, isLoading: isLoadingMerchants } = useQuery({
    queryKey: ['admin-subscriptions'],
    queryFn: subscriptionService.fetchMerchants,
  });

  const { data: activeTiers, isLoading: isLoadingTiers } = useQuery({
    queryKey: ['subscription-tiers', 'active'],
    queryFn: () => subscriptionService.fetchTiers(true),
  });

  const { data: invoices, isLoading: isLoadingInvoices } = useQuery({
    queryKey: ['admin-subscription-invoices'],
    queryFn: subscriptionService.fetchInvoices,
  });

  const { data: cancellations, isLoading: isLoadingCancellations } = useQuery({
    queryKey: ['admin-cancellation-feedback'],
    queryFn: subscriptionService.fetchCancellationFeedback,
  });

  const { data: pendingChanges, isLoading: isLoadingPending } = useQuery({
    queryKey: ['admin-pending-changes'],
    queryFn: subscriptionService.fetchPendingChanges,
  });

  const updateSubscriptionMutation = useMutation({
    mutationFn: async ({ 
      merchantId, 
      tierId, 
      tierName 
    }: { 
      merchantId: string; 
      tierId: string; 
      tierName: string;
    }) => {
      await subscriptionService.updateSubscription(merchantId, tierId, tierName);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-subscriptions'] });
      toast.success('Subscription updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update subscription: ${error.message}`);
    },
  });

  return {
    merchants,
    isLoadingMerchants,
    activeTiers,
    isLoadingTiers,
    invoices,
    isLoadingInvoices,
    cancellations,
    isLoadingCancellations,
    pendingChanges,
    isLoadingPending,
    updateSubscription: updateSubscriptionMutation.mutate,
    isUpdating: updateSubscriptionMutation.isPending,
  };
};

export function useSubscriptionStats() {
  return useQuery({
    queryKey: ['admin-subscription-stats'],
    queryFn: subscriptionService.fetchStats,
  });
}
