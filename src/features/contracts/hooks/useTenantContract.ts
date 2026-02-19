import { useQuery } from '@tanstack/react-query';
import { contractService } from '../services/contractService';

export const useTenantActiveContract = (tenantId: string | undefined) => {
  return useQuery({
    queryKey: ['tenant-active-contract', tenantId],
    queryFn: () => contractService.getTenantActiveContract(tenantId!),
    enabled: !!tenantId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useTenantContracts = (tenantId: string | undefined) => {
  return useQuery({
    queryKey: ['tenant-contracts', tenantId],
    queryFn: () => contractService.getTenantContracts(tenantId!),
    enabled: !!tenantId,
  });
};
