import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  fetchVendorPerformance,
  fetchVendorHistory,
  togglePreferredVendor,
} from '../services/vendorPerformanceService';

export function useVendorPerformance(merchantId: string | undefined) {
  return useQuery({
    queryKey: ['vendor-performance', merchantId],
    queryFn: () => fetchVendorPerformance(merchantId!),
    enabled: !!merchantId,
  });
}

export function useVendorHistory(vendorId: string | undefined, merchantId: string | undefined) {
  return useQuery({
    queryKey: ['vendor-history', vendorId, merchantId],
    queryFn: () => fetchVendorHistory(vendorId!, merchantId!),
    enabled: !!vendorId && !!merchantId,
  });
}

export function useTogglePreferred() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ vendorId, merchantId, isPreferred }: { vendorId: string; merchantId: string; isPreferred: boolean }) =>
      togglePreferredVendor(vendorId, merchantId, isPreferred),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['vendor-performance', vars.merchantId] });
    },
  });
}
