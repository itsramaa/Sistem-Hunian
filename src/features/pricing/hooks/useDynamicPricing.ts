import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { dynamicPricingService, CreatePricingRulePayload } from "../services/dynamicPricingService";
import { toast } from "sonner";

export function useDynamicPricingRules(merchantId?: string) {
  return useQuery({
    queryKey: ["dynamic-pricing-rules", merchantId],
    queryFn: () => dynamicPricingService.fetchRules(merchantId!),
    enabled: !!merchantId,
  });
}

export function useCreatePricingRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreatePricingRulePayload) => dynamicPricingService.createRule(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["dynamic-pricing-rules"] });
      toast.success("Aturan harga berhasil dibuat");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdatePricingRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<CreatePricingRulePayload> }) =>
      dynamicPricingService.updateRule(id, updates),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["dynamic-pricing-rules"] });
      toast.success("Aturan harga berhasil diperbarui");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeletePricingRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => dynamicPricingService.deleteRule(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["dynamic-pricing-rules"] });
      toast.success("Aturan harga berhasil dihapus");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useTogglePricingRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) =>
      dynamicPricingService.toggleRule(id, is_active),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["dynamic-pricing-rules"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
