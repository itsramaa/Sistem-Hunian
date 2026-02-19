import { supabase } from '@/lib/integrations/supabase/client';

export interface TenantProfile {
  user_id: string;
  full_name: string;
  email: string;
}

export const tenantService = {
  async getTenantProfiles(tenantIds: string[]): Promise<TenantProfile[]> {
    if (tenantIds.length === 0) return [];
    
    const { data, error } = await supabase
      .from('profiles')
      .select('user_id, full_name, email')
      .in('user_id', tenantIds);

    if (error) throw error;
    return data as TenantProfile[];
  },

  async getMerchantTenants(merchantId: string): Promise<TenantProfile[]> {
    const { data, error } = await supabase
      .from('tenants')
      .select('user_id, profiles(user_id, full_name, email)')
      .eq('linked_merchant_id', merchantId);

    if (error) throw error;
    
    interface TenantQueryResult {
      user_id: string;
      profiles: {
        user_id: string;
        full_name: string | null;
        email: string;
      } | null;
    }

    const typedData = data as unknown as TenantQueryResult[];
    
    return typedData?.map((t) => ({
      user_id: t.user_id,
      full_name: t.profiles?.full_name || 'Unknown',
      email: t.profiles?.email || '',
    })) || [];
  }
};
