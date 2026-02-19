import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { vendorService } from "../services/vendorService";
import { UpdateVendorStatusParams, VendorFilters } from "../types/admin-vendor";

export function useVendors({ page = 1, pageSize = 20, search = "" }: VendorFilters = {}) {
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-vendors', page, pageSize, search],
    queryFn: () => vendorService.fetchVendors({ page, pageSize, search }),
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status, reason, oldStatus }: UpdateVendorStatusParams & { oldStatus: string }) => {
      await vendorService.updateVendorStatus({ id, status, reason }, oldStatus);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-vendors'] });
      queryClient.invalidateQueries({ queryKey: ['admin-vendor-stats'] });
    },
  });

  return {
    vendors: data?.vendors || [],
    totalCount: data?.total || 0,
    isLoading,
    error,
    updateStatus: updateStatusMutation.mutate,
    isUpdating: updateStatusMutation.isPending,
  };
}

