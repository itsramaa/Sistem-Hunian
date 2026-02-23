import { Property } from '@/features/properties/types';
import { ActiveTenant, TenantInvitation } from '@/features/users/types/tenant';
import { AddTenantFormData } from '@/features/users/types/addTenantSchema';
import { supabase } from '@/lib/integrations/supabase/client';
import { CONTRACT_STATUS_TRANSITIONS, UNIT_STATUS_TRANSITIONS, isValidTransition } from '@/shared/constants/state-machines';
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
      .select('*, units:unit_id(unit_number, properties:property_id(name)), inv_property:property_id(name)')
      .eq('merchant_id', merchantId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map((inv: any) => ({
      ...inv,
      unit: inv.units ? {
        unit_number: inv.units.unit_number,
        property: inv.units.properties ? { name: inv.units.properties.name } : undefined
      } : undefined,
      property_name: inv.inv_property?.name || inv.units?.properties?.name || null,
    })) as TenantInvitation[];
  },

  async getActiveTenants(merchantId: string): Promise<ActiveTenant[]> {
    // Fetch tenants with contracts
    const { data: contractData, error: contractError } = await supabase
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

    if (contractError) throw contractError;

    // Also fetch tenants linked to merchant (without contracts)
    const { data: linkedTenants, error: linkedError } = await supabase
      .from('tenants')
      .select('user_id, current_unit_id')
      .eq('linked_merchant_id', merchantId);

    if (linkedError) throw linkedError;

    // Collect all unique user IDs
    const contractUserIds = (contractData || []).map(c => c.tenant_user_id);
    const linkedUserIds = (linkedTenants || []).map(t => t.user_id);
    const allUserIds = [...new Set([...contractUserIds, ...linkedUserIds])];

    if (allUserIds.length === 0) return [];

    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id, full_name, email, phone')
      .in('user_id', allUserIds);

    const profileMap = new Map((profiles || []).map(p => [p.user_id, p]));

    // Build results from contracts
    const contractTenants = (contractData || []).map((contract: any) => ({
      ...contract,
      profile: profileMap.get(contract.tenant_user_id) || null
    }));

    // Add linked tenants that don't have contracts yet
    const contractUserIdSet = new Set(contractUserIds);
    const linkedOnlyTenants = (linkedTenants || [])
      .filter(t => !contractUserIdSet.has(t.user_id))
      .map(t => ({
        id: `linked-${t.user_id}`,
        status: 'linked',
        start_date: '',
        end_date: '',
        rent_amount: 0,
        deposit_amount: null,
        tenant_user_id: t.user_id,
        unit: null,
        profile: profileMap.get(t.user_id) || null,
      }));

    return [...contractTenants, ...linkedOnlyTenants] as ActiveTenant[];
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

  async sendInvitation(merchantId: string, data: { property_id: string; email: string; phone?: string | null }) {
    const { data: existingEmail } = await supabase
      .from('tenant_invitations')
      .select('id')
      .eq('merchant_id', merchantId)
      .eq('email', data.email.toLowerCase().trim())
      .eq('status', 'pending')
      .maybeSingle();

    if (existingEmail) {
      throw new Error('Undangan pending sudah ada untuk email ini');
    }

    const { error } = await supabase
      .from('tenant_invitations')
      .insert({
        merchant_id: merchantId,
        property_id: data.property_id,
        email: data.email.toLowerCase().trim(),
        phone: data.phone || null,
      } as any);

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

    // Update unit status back to available (with validation)
    if (contract.unit?.id) {
      const { data: unitData } = await supabase
        .from('units')
        .select('status')
        .eq('id', contract.unit.id)
        .single();

      const currentUnitStatus = unitData?.status || 'occupied';
      if (!isValidTransition(UNIT_STATUS_TRANSITIONS, currentUnitStatus, 'available')) {
        console.warn(`Unit transition not valid: ${currentUnitStatus} → available, skipping`);
      } else {
        const { error: unitError } = await supabase
          .from('units')
          .update({ status: 'available' })
          .eq('id', contract.unit.id);

        if (unitError) throw unitError;
      }
    }

    // Update tenant's current_unit_id to null
    const { error: tenantError } = await supabase
      .from('tenants')
      .update({ current_unit_id: null })
      .eq('user_id', contract.tenant_user_id);

    if (tenantError) throw tenantError;

    await logStatusChange('contract', contract.id, currentStatus, 'terminated');
  },

  async getAvailableTenants(merchantId: string): Promise<{ user_id: string; full_name: string | null; email: string | null; phone: string | null }[]> {
    // Only fetch tenants not linked to any merchant, or already linked to this merchant
    const { data, error } = await supabase
      .from('tenants')
      .select('user_id')
      .or(`linked_merchant_id.is.null,linked_merchant_id.eq.${merchantId}`)
      .order('created_at', { ascending: false });

    if (error) throw error;
    if (!data || data.length === 0) return [];

    const userIds = data.map(t => t.user_id);
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('user_id, full_name, email, phone')
      .in('user_id', userIds);

    if (profilesError) throw profilesError;
    return profiles || [];
  },

  async addTenantDirectly(merchantId: string, data: AddTenantFormData) {
    const tenantUserId = (data as any).tenant_user_id as string | undefined;
    
    let userId: string;

    if (tenantUserId) {
      // Existing tenant selected - use their user_id directly
      userId = tenantUserId;
    } else {
      // Fallback: Check if user exists by email
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('email', data.email.toLowerCase().trim())
        .maybeSingle();

      if (!existingProfile) {
        // User doesn't exist - create invitation instead
        const { error: invError } = await supabase
          .from('tenant_invitations')
          .insert({
            merchant_id: merchantId,
            property_id: (data as any).property_id || null,
            email: data.email.toLowerCase().trim(),
            phone: data.phone || null,
          } as any);
        if (invError) throw invError;

        await createAuditLog({
          action: 'create',
          entityType: 'tenant',
          entityId: data.email,
          newData: { unit_id: data.unit_id, email: data.email, existing_user: false },
        });
        return;
      }
      userId = existingProfile.user_id;
    }

    // Create contract directly
    const { error: contractError } = await supabase
      .from('contracts')
      .insert({
        merchant_id: merchantId,
        unit_id: data.unit_id,
        tenant_user_id: userId,
        start_date: data.start_date,
        end_date: data.end_date,
        rent_amount: data.rent_amount,
        deposit_amount: data.deposit_amount || null,
        billing_day: data.billing_day || 1,
        status: 'active',
      });

    if (contractError) throw contractError;

    // Update unit status to occupied
    await supabase
      .from('units')
      .update({ status: 'occupied' })
      .eq('id', data.unit_id);

    // Link tenant to merchant
    await supabase
      .from('tenants')
      .update({ linked_merchant_id: merchantId, current_unit_id: data.unit_id })
      .eq('user_id', userId);

    await createAuditLog({
      action: 'create',
      entityType: 'tenant',
      entityId: userId,
      newData: { unit_id: data.unit_id, tenant_user_id: userId, status: 'active' },
    });
  },

  async unlinkTenant(userId: string, merchantId: string) {
    const { error } = await supabase
      .from('tenants')
      .update({ linked_merchant_id: null })
      .eq('user_id', userId)
      .eq('linked_merchant_id', merchantId);

    if (error) throw error;

    await createAuditLog({
      action: 'delete',
      entityType: 'tenant',
      entityId: userId,
      newData: { linked_merchant_id: null },
    });
  }
};
