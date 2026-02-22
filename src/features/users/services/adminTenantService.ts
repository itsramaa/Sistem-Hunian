
import { supabase } from '@/lib/integrations/supabase/client';
import { AdminTenant } from '../types/tenant';
import { CONTRACT_STATUS_TRANSITIONS, isValidTransition } from '@/shared/constants/state-machines';
import { logStatusChange } from '@/shared/utils/auditLog';

export const adminTenantService = {
  async getAllActiveTenants(page = 1, limit = 10, search = '', status = 'all', merchantId = 'all', propertyId = 'all', minRent = '', maxRent = ''): Promise<{ data: AdminTenant[]; count: number }> {
    // 1. Pre-fetch matching user IDs if search is provided
    let matchingUserIds: string[] | null = null;
    if (search) {
      const { data: users, error: searchError } = await supabase
        .from('profiles')
        .select('user_id')
        .or(`full_name.ilike.%${search}%,email.ilike.%${search}%`);
      
      if (searchError) throw searchError;
      if (users) {
        matchingUserIds = users.map(u => u.user_id);
      }
      
      if (matchingUserIds && matchingUserIds.length === 0) {
        return { data: [], count: 0 };
      }
    }

    // 2. Base query for contracts
    let query = supabase
      .from('contracts')
      .select(`
        id, 
        status, 
        start_date, 
        end_date, 
        rent_amount,
        deposit_amount,
        tenant_user_id,
        merchant_id,
        unit:units!inner(id, unit_number, property:properties!inner(id, name))
      `, { count: 'exact' });

    if (status !== 'all') {
      query = query.eq('status', status);
    }
    
    if (merchantId !== 'all') {
      query = query.eq('merchant_id', merchantId);
    }

    if (propertyId !== 'all') {
      query = query.eq('unit.property.id', propertyId);
    }

    if (minRent) {
      query = query.gte('rent_amount', minRent);
    }

    if (maxRent) {
      query = query.lte('rent_amount', maxRent);
    }

    if (matchingUserIds) {
      query = query.in('tenant_user_id', matchingUserIds);
    }

    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to).order('created_at', { ascending: false });

    const { data: contracts, error, count } = await query;

    if (error) throw error;
    if (!contracts || contracts.length === 0) return { data: [], count: 0 };

    const tenantUserIds = contracts.map(c => c.tenant_user_id);
    const merchantIds = contracts.map(c => c.merchant_id);
    const allUserIds = [...new Set([...tenantUserIds, ...merchantIds])];

    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('user_id, full_name, email, phone')
      .in('user_id', allUserIds);

    if (profileError) throw profileError;

    const profileMap = new Map((profiles || []).map(p => [p.user_id, p]));

    const enrichedData = contracts.map((contract: any) => {
      const tenantProfile = profileMap.get(contract.tenant_user_id);
      const merchantProfile = profileMap.get(contract.merchant_id);

      return {
        ...contract,
        profile: tenantProfile || { full_name: 'Unknown', email: 'unknown', phone: '' },
        merchant_profile: merchantProfile || { full_name: 'Unknown', email: 'unknown', phone: '' },
      };
    });

    return { data: enrichedData as AdminTenant[], count: count || 0 };
  },

  async getTenantStats() {
    const { count: total } = await supabase.from('contracts').select('*', { count: 'exact', head: true });
    const { count: active } = await supabase.from('contracts').select('*', { count: 'exact', head: true }).eq('status', 'active');
    const { count: pending } = await supabase.from('contracts').select('*', { count: 'exact', head: true }).eq('status', 'pending_signature');
    const { count: terminated } = await supabase.from('contracts').select('*', { count: 'exact', head: true }).in('status', ['terminated', 'expired', 'cancelled']);

    return {
      total: total || 0,
      active: active || 0,
      pending: pending || 0,
      terminated: terminated || 0
    };
  },

  async updateTenantStatus(tenantId: string, newStatus: string): Promise<void> {
    // Fetch current contract status for validation
    const { data: current, error: fetchError } = await supabase
      .from('contracts')
      .select('status')
      .eq('id', tenantId)
      .single();

    if (fetchError) throw fetchError;
    const currentStatus = current?.status || '';

    if (!isValidTransition(CONTRACT_STATUS_TRANSITIONS, currentStatus, newStatus)) {
      throw new Error(`Invalid contract transition: ${currentStatus} → ${newStatus}`);
    }

    const { error } = await supabase
      .from('contracts')
      .update({ status: newStatus })
      .eq('id', tenantId);

    if (error) throw error;

    await logStatusChange('contract', tenantId, currentStatus, newStatus);
  }
};
