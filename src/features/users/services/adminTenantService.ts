import { apiClient } from '@/lib/axios';
import { AdminTenant } from '../types/tenant';
import { CONTRACT_STATUS_TRANSITIONS, isValidTransition } from '@/shared/constants/state-machines';
import { logStatusChange } from '@/shared/utils/auditLog';

export const adminTenantService = {
  async getAllActiveTenants(page = 1, limit = 10, search = '', status = 'all', merchantId = 'all', propertyId = 'all', minRent = '', maxRent = ''): Promise<{ data: AdminTenant[]; count: number }> {
    try {
      const params: Record<string, string | number> = { page, limit };
      if (search) params.search = search;
      if (status !== 'all') params.status = status;
      if (merchantId !== 'all') params.merchant_id = merchantId;
      if (propertyId !== 'all') params.property_id = propertyId;
      if (minRent) params.min_rent = minRent;
      if (maxRent) params.max_rent = maxRent;

      const r = await apiClient.get('/contracts/tenants', { params });
      return { data: r.data?.data ?? [], count: r.data?.count ?? 0 };
    } catch {
      // TODO: implement Go endpoint — was: supabase.from('contracts').select(...) with profiles join
      return { data: [], count: 0 };
    }
  },

  async getTenantStats() {
    try {
      const r = await apiClient.get('/contracts/stats');
      return r.data;
    } catch {
      // TODO: implement Go endpoint — was: supabase.from('contracts').select('*', { count: 'exact', head: true })
      return { total: 0, active: 0, pending: 0, terminated: 0 };
    }
  },

  async updateTenantStatus(tenantId: string, newStatus: string): Promise<void> {
    // Fetch current contract status for validation
    let currentStatus = '';
    try {
      const r = await apiClient.get(`/contracts/${tenantId}`);
      currentStatus = r.data?.status ?? '';
    } catch {
      // TODO: implement Go endpoint — was: supabase.from('contracts').select('status').eq('id', tenantId).single()
    }

    if (!isValidTransition(CONTRACT_STATUS_TRANSITIONS, currentStatus, newStatus)) {
      throw new Error(`Invalid contract transition: ${currentStatus} → ${newStatus}`);
    }

    try {
      await apiClient.put(`/contracts/${tenantId}`, { status: newStatus });
    } catch (err) {
      throw err;
    }

    await logStatusChange('contract', tenantId, currentStatus, newStatus);
  }
};
