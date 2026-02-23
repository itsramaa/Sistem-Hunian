import { useQuery } from '@tanstack/react-query';
import { tenantAnalyticsService } from '../services/tenantAnalyticsService';

export function useTenantDemographics(merchantId?: string) {
  return useQuery({
    queryKey: ['tenant-demographics', merchantId],
    queryFn: () => tenantAnalyticsService.fetchDemographics(merchantId!),
    enabled: !!merchantId,
  });
}

export function useOccupancyMetrics(merchantId?: string) {
  return useQuery({
    queryKey: ['occupancy-metrics', merchantId],
    queryFn: () => tenantAnalyticsService.fetchOccupancyMetrics(merchantId!),
    enabled: !!merchantId,
  });
}

export function useTenantPaymentProfiles(merchantId?: string) {
  return useQuery({
    queryKey: ['tenant-payment-profiles', merchantId],
    queryFn: () => tenantAnalyticsService.fetchPaymentProfiles(merchantId!),
    enabled: !!merchantId,
  });
}
