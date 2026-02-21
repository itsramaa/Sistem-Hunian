import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { subscriptionService } from "../services/subscriptionService";
import { SubscriptionTier, SubscriptionTierInput } from "../types/subscription-tier";
import { createAuditLog } from "@/shared/utils/auditLog";

export function useSubscriptionTiers() {
  const queryClient = useQueryClient();

  const { data: tiers, isLoading, error } = useQuery<SubscriptionTier[]>({
    queryKey: ["subscription-tiers"],
    queryFn: () => subscriptionService.fetchTiers(),
  });

  const createMutation = useMutation({
    mutationFn: async (data: SubscriptionTierInput) => {
      const newTier = await subscriptionService.createTier(data);
      await createAuditLog({
        action: "create",
        entityType: "subscription_tier",
        entityId: newTier.id,
        newData: newTier,
      });
      return newTier;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscription-tiers"] });
      toast.success("Tier created successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<SubscriptionTierInput> }) => {
      const oldTier = tiers?.find((t) => t.id === id);
      await subscriptionService.updateTier(id, data);
      await createAuditLog({
        action: "update",
        entityType: "subscription_tier",
        entityId: id,
        oldData: oldTier,
        newData: data,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscription-tiers"] });
      toast.success("Tier updated successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const oldTier = tiers?.find((t) => t.id === id);
      await subscriptionService.deleteTier(id);
      await createAuditLog({
        action: "delete",
        entityType: "subscription_tier",
        entityId: id,
        oldData: oldTier,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscription-tiers"] });
      toast.success("Tier deleted successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  return {
    tiers,
    isLoading,
    error,
    createTier: createMutation.mutate,
    updateTier: updateMutation.mutate,
    deleteTier: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
