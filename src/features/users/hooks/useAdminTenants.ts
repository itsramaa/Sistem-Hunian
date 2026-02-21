import { useQuery } from '@tanstack/react-query';
import { adminTenantService } from '../services/adminTenantService';

export function useAdminTenants(page = 1, limit = 10, search = '', status = 'all', merchantId = 'all', propertyId = 'all', minRent = '', maxRent = '') {
  return useQuery({
    queryKey: ['admin-tenants', page, limit, search, status, merchantId, propertyId, minRent, maxRent],
    queryFn: () => adminTenantService.getAllActiveTenants(page, limit, search, status, merchantId, propertyId, minRent, maxRent),
  });
}
