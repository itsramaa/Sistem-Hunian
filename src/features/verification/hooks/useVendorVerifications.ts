import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { vendorVerificationService } from "../services/vendorVerificationService";
import { UpdateVerificationParams, VendorVerification } from "../types/vendor-verification";

export function useVendorVerifications() {
  const queryClient = useQueryClient();

  const { data: verifications = [], isLoading, error } = useQuery({
    queryKey: ['admin-vendor-verifications'],
    queryFn: () => vendorVerificationService.fetchVerifications(),
  });

  const updateVerificationMutation = useMutation({
    mutationFn: async ({ id, status, rejectionReason }: UpdateVerificationParams) => {
      await vendorVerificationService.updateVerification({ id, status, rejectionReason });

      if (status === 'verified') {
        const verification = verifications.find((v) => v.id === id);
        if (verification) {
          await vendorVerificationService.updateVendorStatusIfVerified(verification.vendor_id);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-vendor-verifications'] });
    },
  });

  return {
    verifications,
    isLoading,
    error,
    updateVerification: updateVerificationMutation.mutate,
    isUpdating: updateVerificationMutation.isPending,
  };
}
