import { useQuery } from '@tanstack/react-query';
import { tenantService } from '../services/tenantService';

export function useTenantProfiles(tenantIds: string[]) {
  return useQuery({
    queryKey: ['tenant-profiles', tenantIds],
    queryFn: () => tenantService.getTenantProfiles(tenantIds),
    enabled: tenantIds.length > 0,
  });
}

export function useMerchantTenants(merchantId: string | undefined) {
  return useQuery({
    queryKey: ['merchant-tenants', merchantId],
    queryFn: () => tenantService.getMerchantTenants(merchantId!),
    enabled: !!merchantId,
  });
}
