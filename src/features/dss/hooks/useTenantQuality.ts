import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { invokeTenantQualityScoring, ScreeningData } from "@/features/dss/services/tenantQualityService";

export function useTenantQualityScoring() {
  return useMutation({
    mutationFn: (params: { tenant_user_id?: string; screening_data?: ScreeningData; batch?: boolean }) =>
      invokeTenantQualityScoring(params),
    onError: (error: Error) => {
      toast.error("Gagal menilai kualitas tenant", { description: error.message });
    },
  });
}
