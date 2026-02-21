import { supabase } from '@/lib/integrations/supabase/client';
import { Vendor } from '../../users/types/admin-vendor';
import { CreateMaintenanceRequestPayload, MaintenanceRequest, MaintenanceReview, MaintenanceTimeline, UpdateMaintenanceStatusPayload } from '../types';

export const maintenanceService = {
  async getMerchantRequests(merchantId: string): Promise<MaintenanceRequest[]> {
    const { data, error } = await supabase
      .from('maintenance_requests')
      .select(`
        *,
        assigned_vendor:vendors(business_name),
        unit:units(
          unit_number,
          property:properties(name, address),
          contracts(status, start_date, end_date, tenant_user_id)
        ),
        tenant:profiles!maintenance_requests_tenant_user_id_fkey(full_name, email)
      `)
      .eq('merchant_id', merchantId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data as unknown) as MaintenanceRequest[];
  },

  async getTenantRequests(tenantId: string): Promise<MaintenanceRequest[]> {
    const { data, error } = await supabase
      .from('maintenance_requests')
      .select(`
        *,
        assigned_vendor:vendors(business_name),
        unit:units(
          unit_number,
          property:properties(name, address)
        )
      `)
      .eq('tenant_user_id', tenantId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data as unknown) as MaintenanceRequest[];
  },

  async getTenantActiveRequests(tenantId: string, limit?: number): Promise<MaintenanceRequest[]> {
    let query = supabase
      .from('maintenance_requests')
      .select('id, title, category, status, priority, created_at')
      .eq('tenant_user_id', tenantId)
      .in('status', ['pending', 'in_progress', 'assigned'])
      .order('created_at', { ascending: false });

    if (limit) {
      query = query.limit(limit);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data as MaintenanceRequest[];
  },

  async getRequestById(id: string): Promise<MaintenanceRequest | null> {
    const { data, error } = await supabase
      .from('maintenance_requests')
      .select(`
        *,
        assigned_vendor:vendors(business_name),
        unit:units(
          unit_number,
          property:properties(name, address),
          contracts(status, start_date, end_date, tenant_user_id)
        ),
        tenant:profiles!maintenance_requests_tenant_user_id_fkey(full_name, email)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return (data as unknown) as MaintenanceRequest;
  },

  async createRequest(payload: CreateMaintenanceRequestPayload): Promise<MaintenanceRequest> {
    // 0. Verify Active/Notice Contract
    const { data: contractData, error: contractError } = await supabase
      .from('contracts')
      .select('status')
      .eq('unit_id', payload.unit_id)
      .eq('tenant_user_id', payload.tenant_user_id)
      .in('status', ['active', 'notice'])
      .maybeSingle();

    if (contractError) throw contractError;
    if (!contractData) {
      throw new Error('No active or notice period contract found for this unit. You can only submit maintenance requests for units you are currently renting.');
    }

    const { data, error } = await supabase
      .from('maintenance_requests')
      .insert({
        title: payload.title,
        description: payload.description,
        category: payload.category,
        priority: payload.priority,
        unit_id: payload.unit_id,
        tenant_user_id: payload.tenant_user_id,
        merchant_id: payload.merchant_id,
        images: payload.images,
        preferred_schedule: payload.preferred_schedule,
      })
      .select()
      .single();

    if (error) throw error;

    // Create initial timeline entry
    await supabase.from('maintenance_timeline').insert({
      maintenance_request_id: data.id,
      status: 'submitted',
      message: `Request submitted: ${payload.title}`,
      actor_id: payload.tenant_user_id,
      actor_role: 'tenant',
    });

    // Notify merchant
    try {
      const { data: merchantData } = await supabase
        .from('merchants')
        .select('user_id')
        .eq('id', payload.merchant_id)
        .single();

      if (merchantData) {
        await supabase.from('notifications').insert({
          user_id: merchantData.user_id,
          title: 'New Maintenance Request',
          message: `${payload.title} - Priority: ${payload.priority}`,
          type: 'warning',
          link: `/merchant/maintenance/${data.id}`,
        });
      }
    } catch (e) {
      console.error('Failed to create notification', e);
    }

    return data as MaintenanceRequest;
  },

  async cancelRequest(requestId: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('maintenance_requests')
      .update({ status: 'cancelled' })
      .eq('id', requestId)
      .eq('tenant_user_id', userId)
      .eq('status', 'pending');
    
    if (error) throw error;

    // Add timeline entry
    await supabase.from('maintenance_timeline').insert({
      maintenance_request_id: requestId,
      status: 'cancelled',
      message: 'Request cancelled by tenant',
      actor_id: userId,
      actor_role: 'tenant',
    });
  },

  async updateRequest(id: string, payload: Partial<MaintenanceRequest>): Promise<MaintenanceRequest> {
    const { data, error } = await supabase
      .from('maintenance_requests')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as MaintenanceRequest;
  },

  async updateStatus(payload: UpdateMaintenanceStatusPayload & { actor_id?: string, actor_role?: string }): Promise<MaintenanceRequest> {
    // 0. Pre-check: Verify contract status if assigning a vendor
    if (payload.assigned_vendor_id) {
      const { data: requestData, error: requestError } = await supabase
        .from('maintenance_requests')
        .select(`
          unit:units(
            contracts(status)
          )
        `)
        .eq('id', payload.id)
        .single();

      if (requestError) throw requestError;

      // Check for active or notice period contracts
      const hasValidContract = (requestData?.unit?.contracts as { status: string }[] | null)?.some(
        (c) => ['active', 'notice'].includes(c.status)
      );

      if (!hasValidContract) {
        throw new Error('Cannot assign vendor: No active or notice period contract found for this unit.');
      }
    }

    const updateData: Record<string, any> = {
      status: payload.status,
      updated_at: new Date().toISOString()
    };

    if (payload.status === 'completed') {
      updateData.resolved_at = new Date().toISOString();
    }
    
    // Logic from original component: if assigned_vendor_id is provided, update it
    let vendor: { id: string; user_id: string; business_name: string } | null = null;
    if (payload.assigned_vendor_id) {
      updateData.assigned_vendor_id = payload.assigned_vendor_id;
      
      // Fetch vendor details
      const { data: vendorData } = await supabase
        .from('vendors')
        .select('business_name, user_id, id')
        .eq('id', payload.assigned_vendor_id)
        .single();
        
      if (vendorData) {
        vendor = vendorData;
        updateData.assigned_to = vendor.business_name;
      }
    }

    if (payload.notes) {
      updateData.completion_notes = payload.notes;
    }

    // 1. Update Request
    const { data: request, error } = await supabase
      .from('maintenance_requests')
      .update(updateData)
      .eq('id', payload.id)
      .select('*, tenant:profiles!tenant_user_id(user_id)') // Need tenant user_id for notification
      .single();

    if (error) throw error;

    // 2. Create Timeline Entry
    const timelineMessage = payload.status === 'in_progress' && vendor
        ? `Assigned to vendor: ${vendor.business_name}`
        : payload.status === 'completed'
          ? 'Maintenance request marked as completed'
          : payload.status === 'cancelled'
            ? 'Maintenance request cancelled'
            : `Status changed to ${payload.status}`;

    if (payload.actor_id && payload.actor_role) {
      await supabase.from('maintenance_timeline').insert({
        maintenance_request_id: payload.id,
        status: payload.status,
        message: timelineMessage,
        actor_id: payload.actor_id,
        actor_role: payload.actor_role,
        metadata: vendor ? { vendor_id: vendor.id, vendor_name: vendor.business_name } : {},
      });
    }

    // 3. Handle Vendor Job Creation (when assigning)
    if (payload.assigned_vendor_id && payload.merchant_id && payload.status === 'in_progress') {
      // Check for existing job
      const { data: existingJob } = await supabase
        .from('vendor_jobs')
        .select('id')
        .eq('maintenance_request_id', payload.id)
        .eq('vendor_id', payload.assigned_vendor_id)
        .maybeSingle();

      if (!existingJob) {
        const { error: jobError } = await supabase
          .from('vendor_jobs')
          .insert({
            vendor_id: payload.assigned_vendor_id,
            maintenance_request_id: payload.id,
            merchant_id: payload.merchant_id,
            agreed_price: payload.agreed_price || null,
            status: 'pending',
          });
        
        if (jobError) throw jobError;
      }

      // 4. Notify Vendor
      if (vendor && vendor.user_id) {
        await supabase.from('notifications').insert({
          user_id: vendor.user_id,
          title: 'New Job Assignment',
          message: `You have been assigned to maintenance request: ${request.title}`,
          type: 'maintenance',
          link: '/vendor/jobs',
        });
      }

      // 5. Notify Tenant
      if (request.tenant_user_id) {
        await supabase.from('notifications').insert({
          user_id: request.tenant_user_id,
          title: 'Vendor Assigned',
          message: `A vendor (${vendor?.business_name}) has been assigned to your maintenance request: ${request.title}`,
          type: 'maintenance',
          link: `/tenant/maintenance/${payload.id}`,
        });
      }
    }

    // 6. Handle Completion (Earnings & Notifications)
    if (payload.status === 'completed') {
      // If there was a vendor job, complete it
      if (request.assigned_vendor_id) {
        const { data: vendorJob } = await supabase
          .from('vendor_jobs')
          .select('id, vendor_id, agreed_price')
          .eq('maintenance_request_id', payload.id)
          .eq('status', 'pending')
          .maybeSingle();

        if (vendorJob && vendorJob.agreed_price) {
          await supabase
            .from('vendor_jobs')
            .update({
              status: 'completed',
              completed_at: new Date().toISOString(),
            })
            .eq('id', vendorJob.id);

          const amount = vendorJob.agreed_price;
          const feeAmount = amount * 0.1;
          const netAmount = amount - feeAmount;

          await supabase.from('vendor_earnings').insert({
            vendor_id: vendorJob.vendor_id,
            vendor_job_id: vendorJob.id,
            amount,
            fee_amount: feeAmount,
            net_amount: netAmount,
            status: 'pending',
          });
        }
      }

      // Notify Tenant of completion
      if (request.tenant_user_id) {
        await supabase.from('notifications').insert({
          user_id: request.tenant_user_id,
          title: 'Maintenance Completed',
          message: `Your maintenance request "${request.title}" has been completed. Please review the work.`,
          type: 'maintenance',
          link: `/tenant/maintenance/${payload.id}`,
        });
      }
    }

    return (request as unknown) as MaintenanceRequest;
  },

  async getUpdates(requestId: string): Promise<MaintenanceTimeline[]> {
    const { data, error } = await supabase
      .from('maintenance_updates')
      .select('*')
      .eq('maintenance_request_id', requestId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return (data as unknown) as MaintenanceTimeline[];
  },

  async getReview(requestId: string): Promise<MaintenanceReview | null> {
    const { data, error } = await supabase
      .from('maintenance_reviews')
      .select('*, vendor:vendors(business_name)')
      .eq('maintenance_request_id', requestId)
      .maybeSingle();

    if (error) throw error;
    return data as MaintenanceReview;
  },

  async createReview(payload: Omit<MaintenanceReview, 'id' | 'created_at' | 'vendor'> & { tenant_user_id: string, vendor_id: string }): Promise<MaintenanceReview> {
    const { data, error } = await supabase
      .from('maintenance_reviews')
      .insert(payload)
      .select()
      .single();

    if (error) throw error;
    return data as MaintenanceReview;
  },

  async getVerifiedVendors(): Promise<Pick<Vendor, 'id' | 'business_name' | 'service_categories' | 'rating' | 'user_id'>[]> {
    const { data, error } = await supabase
      .from('vendors')
      .select('id, business_name, service_categories, rating, user_id')
      .eq('verification_status', 'verified');
    
    if (error) throw error;
    return data as Pick<Vendor, 'id' | 'business_name' | 'service_categories' | 'rating' | 'user_id'>[];
  }
};