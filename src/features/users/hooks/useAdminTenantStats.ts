import { useQuery } from '@tanstack/react-query';
import { adminTenantService } from '../services/adminTenantService';

export function useAdminTenantStats() {
  return useQuery({
    queryKey: ['admin-tenant-stats'],
    queryFn: () => adminTenantService.getTenantStats(),
  });
}
