import { Property } from '@/features/properties/types';
import { ActiveTenant, TenantInvitation } from '@/features/users/types/tenant';
import { supabase } from '@/lib/integrations/supabase/client';
import { CONTRACT_STATUS_TRANSITIONS, isValidTransition } from '@/shared/constants/state-machines';
import { logStatusChange, createAuditLog } from '@/shared/utils/auditLog';

export const merchantTenantService = {
  async getPropertiesWithUnits(merchantId: string): Promise<Property[]> {
    const { data, error } = await supabase
      .from('properties')
      .select('id, name, units(id, unit_number, status)')
      .eq('merchant_id', merchantId);

    if (error) throw error;
    return (data as unknown as Property[]) || [];
  },

  async getInvitations(merchantId: string): Promise<TenantInvitation[]> {
    const { data, error } = await supabase
      .from('tenant_invitations')
      .select('*, units:unit_id(unit_number, properties:property_id(name))')
      .eq('merchant_id', merchantId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map((inv: any) => ({
      ...inv,
      unit: inv.units ? {
        unit_number: inv.units.unit_number,
        property: inv.units.properties ? { name: inv.units.properties.name } : undefined
      } : undefined
    })) as TenantInvitation[];
  },

  async getActiveTenants(merchantId: string): Promise<ActiveTenant[]> {
    const { data, error } = await supabase
      .from('contracts')
      .select(`
        id, 
        status, 
        start_date, 
        end_date, 
        rent_amount,
        deposit_amount,
        tenant_user_id,
        unit:units(id, unit_number, property:properties(id, name))
      `)
      .eq('merchant_id', merchantId)
      .in('status', ['active', 'pending_signature', 'notice']);

    if (error) throw error;

    if (!data || data.length === 0) return [];

    const tenantUserIds = data.map(c => c.tenant_user_id);
    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id, full_name, email, phone')
      .in('user_id', tenantUserIds);

    const profileMap = new Map((profiles || []).map(p => [p.user_id, p]));

    return data.map((contract: any) => ({
      ...contract,
      profile: profileMap.get(contract.tenant_user_id) || null
    })) as ActiveTenant[];
  },

  async getTenantProfiles(userIds: string[]) {
    if (!userIds.length) return [];
    const { data, error } = await supabase
      .from('profiles')
      .select('user_id, full_name, email, phone')
      .in('user_id', userIds);
    
    if (error) throw error;
    return data || [];
  },

  async getAllMerchantTenants(merchantId: string) {
    const { data: contracts, error } = await supabase
      .from('contracts')
      .select('tenant_user_id')
      .eq('merchant_id', merchantId);

    if (error) throw error;

    if (!contracts || contracts.length === 0) return [];

    const userIds = [...new Set(contracts.map(c => c.tenant_user_id))];
    
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('user_id, full_name, email, phone')
      .in('user_id', userIds);

    if (profilesError) throw profilesError;
    return profiles || [];
  },

  async getActiveContractsCount(merchantId: string): Promise<number> {
    const { count, error } = await supabase
      .from('contracts')
      .select('id', { count: 'exact', head: true })
      .eq('merchant_id', merchantId)
      .eq('status', 'active');

    if (error) throw error;
    return count || 0;
  },

  async sendInvitation(merchantId: string, data: { unit_id: string; email: string; phone?: string | null }) {
    const { data: existingEmail } = await supabase
      .from('tenant_invitations')
      .select('id')
      .eq('merchant_id', merchantId)
      .eq('email', data.email.toLowerCase().trim())
      .eq('status', 'pending')
      .maybeSingle();

    if (existingEmail) {
      throw new Error('A pending invitation already exists for this email address');
    }

    const { data: existingUnit } = await supabase
      .from('tenant_invitations')
      .select('id')
      .eq('unit_id', data.unit_id)
      .eq('status', 'pending')
      .maybeSingle();

    if (existingUnit) {
      throw new Error('A pending invitation already exists for this unit');
    }

    const { error } = await supabase
      .from('tenant_invitations')
      .insert({
        merchant_id: merchantId,
        unit_id: data.unit_id,
        email: data.email.toLowerCase().trim(),
        phone: data.phone || null,
      });

    if (error) throw error;
  },

  async cancelInvitation(id: string) {
    const { error } = await supabase
      .from('tenant_invitations')
      .update({ status: 'cancelled' })
      .eq('id', id);

    if (error) throw error;

    await createAuditLog({
      action: 'cancel',
      entityType: 'tenant',
      entityId: id,
      newData: { status: 'cancelled' },
    });
  },

  async terminateContract(contract: ActiveTenant) {
    // Validate transition
    const currentStatus = contract.status || '';
    if (!isValidTransition(CONTRACT_STATUS_TRANSITIONS, currentStatus, 'terminated')) {
      throw new Error(`Invalid contract transition: ${currentStatus} → terminated`);
    }

    // Update contract status to terminated
    const { error: contractError } = await supabase
      .from('contracts')
      .update({ 
        status: 'terminated',
        actual_end_date: new Date().toISOString().split('T')[0]
      })
      .eq('id', contract.id);

    if (contractError) throw contractError;

    // Update unit status back to available
    if (contract.unit?.id) {
      const { error: unitError } = await supabase
        .from('units')
        .update({ status: 'available' })
        .eq('id', contract.unit.id);

      if (unitError) throw unitError;
    }

    // Update tenant's current_unit_id to null
    const { error: tenantError } = await supabase
      .from('tenants')
      .update({ current_unit_id: null })
      .eq('user_id', contract.tenant_user_id);

    if (tenantError) throw tenantError;

    await logStatusChange('contract', contract.id, currentStatus, 'terminated');
  }
};
