import { apiClient } from '@/lib/axios';

export interface TenantProfile {
  user_id: string;
  full_name: string;
  email: string;
}

export const tenantService = {
  async getTenantProfiles(tenantIds: string[]): Promise<TenantProfile[]> {
    if (tenantIds.length === 0) return [];

    try {
      const r = await apiClient.get('/profiles', { params: { user_ids: tenantIds.join(',') } });
      return r.data as TenantProfile[];
    } catch {
      // TODO: implement Go endpoint — was: supabase.from('profiles').select('user_id, full_name, email').in('user_id', tenantIds)
      return [];
    }
  },

  async getMerchantTenants(merchantId: string): Promise<TenantProfile[]> {
    try {
      const r = await apiClient.get('/tenants', { params: { linked_merchant_id: merchantId } });
      return (r.data ?? []) as TenantProfile[];
    } catch {
      // TODO: implement Go endpoint — was: supabase.from('tenants').select('user_id, profiles(...)').eq('linked_merchant_id', merchantId)
      return [];
    }
  }
};
