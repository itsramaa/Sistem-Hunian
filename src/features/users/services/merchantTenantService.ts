import { Property } from '@/features/properties/types';
import { ActiveTenant, TenantInvitation } from '@/features/users/types/tenant';
import { AddTenantFormData } from '@/features/users/types/addTenantSchema';
import { apiClient } from '@/lib/axios';
import { CONTRACT_STATUS_TRANSITIONS, UNIT_STATUS_TRANSITIONS, isValidTransition } from '@/shared/constants/state-machines';
import { logStatusChange, createAuditLog } from '@/shared/utils/auditLog';

export const merchantTenantService = {
  async getPropertiesWithUnits(merchantId: string): Promise<Property[]> {
    try {
      const r = await apiClient.get('/properties', { params: { merchant_id: merchantId, include: 'units' } });
      return (r.data ?? []) as unknown as Property[];
    } catch {
      // TODO: implement Go endpoint — was: supabase.from('properties').select('id, name, units(...)').eq('merchant_id', merchantId)
      return [];
    }
  },

  async getInvitations(merchantId: string): Promise<TenantInvitation[]> {
    try {
      const r = await apiClient.get('/tenant-invitations', {
        params: { merchant_id: merchantId, order_by: 'created_at', order: 'desc' },
      });
      return (r.data ?? []) as TenantInvitation[];
    } catch {
      // TODO: implement Go endpoint — was: supabase.from('tenant_invitations').select('*, units:unit_id(...), inv_property:property_id(...)').eq('merchant_id', merchantId)
      return [];
    }
  },

  async getActiveTenants(merchantId: string): Promise<ActiveTenant[]> {
    try {
      const r = await apiClient.get('/contracts/active-tenants', { params: { merchant_id: merchantId } });
      return (r.data ?? []) as ActiveTenant[];
    } catch {
      // TODO: implement Go endpoint — was: supabase.from('contracts').select(...).eq('merchant_id', merchantId).in('status', [...])
      //       combined with supabase.from('tenants').select('user_id, current_unit_id').eq('linked_merchant_id', merchantId)
      return [];
    }
  },

  async getTenantProfiles(userIds: string[]) {
    if (!userIds.length) return [];
    try {
      const r = await apiClient.get('/profiles', { params: { user_ids: userIds.join(',') } });
      return r.data ?? [];
    } catch {
      // TODO: implement Go endpoint — was: supabase.from('profiles').select('user_id, full_name, email, phone').in('user_id', userIds)
      return [];
    }
  },

  async getAllMerchantTenants(merchantId: string) {
    try {
      const r = await apiClient.get('/contracts/tenant-profiles', { params: { merchant_id: merchantId } });
      return r.data ?? [];
    } catch {
      // TODO: implement Go endpoint — was: supabase.from('contracts').select('tenant_user_id').eq('merchant_id', merchantId) + profiles join
      return [];
    }
  },

  async getActiveContractsCount(merchantId: string): Promise<number> {
    try {
      const r = await apiClient.get('/contracts/count', { params: { merchant_id: merchantId, status: 'active' } });
      return r.data?.count ?? 0;
    } catch {
      // TODO: implement Go endpoint — was: supabase.from('contracts').select('id', { count: 'exact', head: true }).eq('merchant_id', merchantId).eq('status', 'active')
      return 0;
    }
  },

  async sendInvitation(merchantId: string, data: { property_id: string; email: string; phone?: string | null }) {
    try {
      await apiClient.post('/tenant-invitations', {
        merchant_id: merchantId,
        property_id: data.property_id,
        email: data.email.toLowerCase().trim(),
        phone: data.phone || null,
      });
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } };
      const msg = error?.response?.data?.message;
      if (msg?.includes('pending')) {
        throw new Error('Undangan pending sudah ada untuk email ini');
      }
      throw err;
    }
  },

  async cancelInvitation(id: string) {
    try {
      await apiClient.put(`/tenant-invitations/${id}`, { status: 'cancelled' });
    } catch (err) {
      throw err;
    }

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
    try {
      await apiClient.put(`/contracts/${contract.id}`, {
        status: 'terminated',
        actual_end_date: new Date().toISOString().split('T')[0],
      });
    } catch (err) {
      throw err;
    }

    // Update unit status back to available (with validation)
    if (contract.unit?.id) {
      try {
        const unitR = await apiClient.get(`/units/${contract.unit.id}`);
        const currentUnitStatus = unitR.data?.status || 'occupied';
        if (!isValidTransition(UNIT_STATUS_TRANSITIONS, currentUnitStatus, 'available')) {
          console.warn(`Unit transition not valid: ${currentUnitStatus} → available, skipping`);
        } else {
          await apiClient.put(`/units/${contract.unit.id}`, { status: 'available' });
        }
      } catch {
        // TODO: implement Go endpoint — was: supabase.from('units').select('status').eq('id', ...) + update
      }
    }

    // Update tenant's current_unit_id to null
    try {
      await apiClient.put(`/tenants/${contract.tenant_user_id}`, { current_unit_id: null });
    } catch {
      // TODO: implement Go endpoint — was: supabase.from('tenants').update({ current_unit_id: null }).eq('user_id', ...)
    }

    await logStatusChange('contract', contract.id, currentStatus, 'terminated');
  },

  async getAvailableTenants(merchantId: string): Promise<{ user_id: string; full_name: string | null; email: string | null; phone: string | null }[]> {
    try {
      const r = await apiClient.get('/tenants/available', { params: { merchant_id: merchantId } });
      return r.data ?? [];
    } catch {
      // TODO: implement Go endpoint — was: supabase.from('tenants').select('user_id').or(`linked_merchant_id.is.null,...`) + profiles join
      return [];
    }
  },

  async addTenantDirectly(merchantId: string, data: AddTenantFormData) {
    const tenantUserId = (data as any).tenant_user_id as string | undefined;

    let userId: string;

    if (tenantUserId) {
      // Existing tenant selected - use their user_id directly
      userId = tenantUserId;
    } else if ((data as any).password) {
      // Create new tenant account via Go API
      const response = await apiClient.post('/users/tenants', {
        email: data.email.toLowerCase().trim(),
        password: (data as any).password,
        full_name: data.full_name,
        phone: data.phone || null,
        merchant_id: merchantId,
      });
      const result = response.data;
      if (result?.error) throw new Error(result.error);
      if (!result?.user_id) throw new Error('Gagal mendapatkan ID tenant');

      userId = result.user_id;
    } else {
      // Fallback: Check if user exists by email, otherwise send invitation
      try {
        const profileR = await apiClient.get('/profiles', {
          params: { email: data.email.toLowerCase().trim() },
        });
        const existingProfile = profileR.data?.[0];

        if (!existingProfile) {
          await apiClient.post('/tenant-invitations', {
            merchant_id: merchantId,
            property_id: (data as any).property_id || null,
            email: data.email.toLowerCase().trim(),
            phone: data.phone || null,
          });

          await createAuditLog({
            action: 'create',
            entityType: 'tenant',
            entityId: data.email,
            newData: { unit_id: data.unit_id, email: data.email, existing_user: false },
          });
          return;
        }
        userId = existingProfile.user_id;
      } catch {
        // TODO: implement Go endpoint — was: supabase.from('profiles').select('user_id').eq('email', ...).maybeSingle()
        return;
      }
    }

    // Create contract directly
    try {
      await apiClient.post('/contracts', {
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
    } catch (err) {
      throw err;
    }

    // Update unit status to occupied
    try {
      await apiClient.put(`/units/${data.unit_id}`, { status: 'occupied' });
    } catch {
      // TODO: implement Go endpoint — was: supabase.from('units').update({ status: 'occupied' }).eq('id', data.unit_id)
    }

    // Link tenant to merchant
    try {
      await apiClient.put(`/tenants/${userId}`, {
        linked_merchant_id: merchantId,
        current_unit_id: data.unit_id,
      });
    } catch {
      // TODO: implement Go endpoint — was: supabase.from('tenants').update({ linked_merchant_id, current_unit_id }).eq('user_id', userId)
    }

    await createAuditLog({
      action: 'create',
      entityType: 'tenant',
      entityId: userId,
      newData: { unit_id: data.unit_id, tenant_user_id: userId, status: 'active' },
    });
  },

  async unlinkTenant(userId: string, merchantId: string) {
    try {
      await apiClient.put(`/tenants/${userId}/unlink`, { merchant_id: merchantId });
    } catch (err) {
      throw err;
    }

    await createAuditLog({
      action: 'delete',
      entityType: 'tenant',
      entityId: userId,
      newData: { linked_merchant_id: null },
    });
  }
};
