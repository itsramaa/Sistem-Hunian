import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  invokeFinancialAnalytics,
  invokeRiskAssessment,
} from "@/features/dss/services/financialRiskService";

export function useFinancialAnalytics() {
  return useMutation({
    mutationFn: ({ propertyId, discountRate }: { propertyId: string; discountRate?: number }) =>
      invokeFinancialAnalytics(propertyId, discountRate),
    onError: (error: Error) => {
      toast.error("Gagal menganalisis keuangan", { description: error.message });
    },
  });
}

export function useRiskAssessment() {
  return useMutation({
    mutationFn: (propertyId: string) => invokeRiskAssessment(propertyId),
    onError: (error: Error) => {
      toast.error("Gagal menganalisis risiko", { description: error.message });
    },
  });
}
