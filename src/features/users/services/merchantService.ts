import { supabase } from "@/lib/integrations/supabase/client";
import { HistoryEntry, Merchant, Verification } from "../types/admin-merchant";

export const merchantService = {
  async fetchMerchants(filters?: {
    status?: string;
    tier?: string;
    dateRange?: { from?: Date; to?: Date };
  }): Promise<Merchant[]> {
    let query = supabase
      .from('merchants')
      .select(`
        *,
        profiles:user_id (
          email,
          full_name,
          phone
        )
      `)
      .order('created_at', { ascending: false });

    if (filters?.status && filters.status !== 'all') {
      query = query.eq('verification_status', filters.status);
    }
    if (filters?.tier && filters.tier !== 'all') {
      query = query.eq('subscription_tier', filters.tier);
    }
    if (filters?.dateRange?.from) {
      query = query.gte('created_at', filters.dateRange.from.toISOString());
    }
    if (filters?.dateRange?.to) {
      query = query.lte('created_at', filters.dateRange.to.toISOString());
    }

    const { data, error } = await query;

    if (error) throw error;
    return (data || []) as Merchant[];
  },

  async fetchMerchantHistory(merchantId: string): Promise<HistoryEntry[]> {
    const { data, error } = await supabase
      .from('merchant_verification_history')
      .select('*')
      .eq('merchant_id', merchantId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Fetch performer details for each entry
    const historyWithPerformers = await Promise.all(
      (data || []).map(async (entry) => {
        if (entry.performed_by) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('email, full_name')
            .eq('user_id', entry.performed_by)
            .single();
          return { ...entry, performer: profile };
        }
        return entry;
      })
    );

    return historyWithPerformers as HistoryEntry[];
  },

  async fetchActivePaidCount(): Promise<number> {
    const { count, error } = await supabase
      .from('merchant_subscriptions')
      .select('*, subscription_tiers!inner(name)', { count: 'exact', head: true })
      .eq('status', 'active')
      .neq('subscription_tiers.name', 'free');

    if (error) throw error;
    return count || 0;
  },

  async fetchVerifications(merchantId: string): Promise<Verification[]> {
    const { data, error } = await supabase
      .from('merchant_verifications')
      .select('*')
      .eq('merchant_id', merchantId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as Verification[];
  },

  async verifyMerchant(
    merchant: Merchant,
    status: 'verified' | 'rejected',
    rejectionData?: {
      reason: string;
      reasonLabel: string;
      details: string;
      resubmissionInstructions: string;
    },
    approvalNotes?: string
  ): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    const adminId = user?.id;

    const updateData: Record<string, unknown> = {
      verification_status: status,
    };

    if (status === 'verified') {
      updateData.verified_at = new Date().toISOString();
      updateData.verified_by = adminId;
    } else if (status === 'rejected' && rejectionData) {
      updateData.rejected_at = new Date().toISOString();
      updateData.rejected_by = adminId;
      updateData.rejection_details = rejectionData.details;
      updateData.resubmission_instructions = rejectionData.resubmissionInstructions;
    }

    const { error } = await supabase
      .from('merchants')
      .update(updateData)
      .eq('id', merchant.id);

    if (error) throw error;

    // Insert verification history
    await supabase.from('merchant_verification_history').insert({
      merchant_id: merchant.id,
      action: status === 'verified' ? 'approved' : 'rejected',
      performed_by: adminId,
      approval_notes: status === 'verified' ? approvalNotes : null,
      rejection_reason: rejectionData?.reasonLabel,
      rejection_details: rejectionData?.details,
      resubmission_instructions: rejectionData?.resubmissionInstructions,
      old_status: merchant.verification_status,
      new_status: status,
    });

    // Insert audit log
    await supabase.from('audit_logs').insert({
      user_id: adminId,
      action: status === 'verified' ? 'verification_approved' : 'verification_rejected',
      entity_type: 'merchant',
      entity_id: merchant.id,
      old_data: { verification_status: merchant.verification_status },
      new_data: { verification_status: status, ...rejectionData },
      user_agent: navigator.userAgent,
    });

    // Create notification for merchant
    await supabase.from('notifications').insert({
      user_id: merchant.user_id,
      type: status === 'verified' ? 'verification_approved' : 'verification_rejected',
      title: status === 'verified' ? 'Akun Terverifikasi!' : 'Verifikasi Ditolak',
      message: status === 'verified' 
        ? 'Selamat! Akun bisnis Anda telah terverifikasi. Semua fitur telah dibuka.'
        : `Pengajuan verifikasi Anda ditolak: ${rejectionData?.reasonLabel}. Silakan perbaiki dan ajukan kembali.`,
      link: '/merchant',
    });

    // Send email notification
    try {
      await supabase.functions.invoke('send-notification', {
        body: {
          type: status === 'verified' ? 'verification_approved' : 'verification_rejected',
          recipientEmail: merchant.profiles?.email,
          recipientName: merchant.profiles?.full_name || 'Merchant',
          data: {
            businessName: merchant.business_name,
            dashboardLink: `${window.location.origin}/merchant`,
            approvalNotes: status === 'verified' ? approvalNotes : null,
            rejectionReason: rejectionData?.reasonLabel,
            rejectionDetails: rejectionData?.details,
            resubmissionInstructions: rejectionData?.resubmissionInstructions,
          }
        }
      });
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError);
    }
  },

  async suspendMerchant(merchant: Merchant): Promise<string> {
    const { data: { user } } = await supabase.auth.getUser();
    const adminId = user?.id;
    
    const newStatus = merchant.verification_status === 'suspended' ? 'verified' : 'suspended';
    const { error } = await supabase
      .from('merchants')
      .update({ verification_status: newStatus })
      .eq('id', merchant.id);

    if (error) throw error;

    // Insert verification history
    await supabase.from('merchant_verification_history').insert({
      merchant_id: merchant.id,
      action: newStatus === 'suspended' ? 'suspended' : 'reactivated',
      performed_by: adminId,
      old_status: merchant.verification_status,
      new_status: newStatus,
    });

    // Insert audit log
    await supabase.from('audit_logs').insert({
      user_id: adminId,
      action: newStatus === 'suspended' ? 'merchant_suspended' : 'merchant_reactivated',
      entity_type: 'merchant',
      entity_id: merchant.id,
      old_data: { verification_status: merchant.verification_status },
      new_data: { verification_status: newStatus },
      user_agent: navigator.userAgent,
    });

    return newStatus;
  },

  async bulkApproveMerchants(
    merchants: Merchant[], 
    selectedIds: string[], 
    notes: string
  ): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    const adminId = user?.id;

    for (const merchantId of selectedIds) {
      const merchant = merchants.find(m => m.id === merchantId);
      if (!merchant || merchant.verification_status !== 'pending') continue;

      await supabase
        .from('merchants')
        .update({
          verification_status: 'verified',
          verified_at: new Date().toISOString(),
          verified_by: adminId,
        })
        .eq('id', merchantId);

      await supabase.from('merchant_verification_history').insert({
        merchant_id: merchantId,
        action: 'approved',
        performed_by: adminId,
        approval_notes: notes,
        old_status: 'pending',
        new_status: 'verified',
      });

      await supabase.from('audit_logs').insert({
        user_id: adminId,
        action: 'verification_approved',
        entity_type: 'merchant',
        entity_id: merchantId,
        old_data: { verification_status: 'pending' },
        new_data: { verification_status: 'verified', approval_notes: notes },
        user_agent: navigator.userAgent,
      });

      await supabase.from('notifications').insert({
        user_id: merchant.user_id,
        type: 'verification_approved',
        title: 'Akun Terverifikasi!',
        message: 'Selamat! Akun bisnis Anda telah terverifikasi. Semua fitur telah dibuka.',
        link: '/merchant',
      });

      // Send email notification for bulk approval
      try {
        await supabase.functions.invoke('send-notification', {
          body: {
            type: 'verification_approved',
            recipientEmail: merchant.profiles?.email,
            recipientName: merchant.profiles?.full_name || 'Merchant',
            data: {
              businessName: merchant.business_name,
              dashboardLink: `${window.location.origin}/merchant`,
              approvalNotes: notes || null,
            }
          }
        });
      } catch (emailError) {
        console.error('Failed to send bulk approval email:', emailError);
      }
    }
  },

  async fetchMerchantAnalytics(merchantId: string): Promise<MerchantAnalytics> {
    // Fetch payments (paid)
    const { data: payments } = await supabase
      .from('payments')
      .select('amount')
      .eq('merchant_id', merchantId)
      .eq('status', 'paid');

    const totalRevenue = payments?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;

    // Fetch properties and units
    const { data: properties } = await supabase
      .from('properties')
      .select('id')
      .eq('merchant_id', merchantId);

    const propertyIds = properties?.map(p => p.id) || [];
    
    let totalUnits = 0;
    let occupiedUnits = 0;
    
    if (propertyIds.length > 0) {
      const { data: units } = await supabase
        .from('units')
        .select('id, status')
        .in('property_id', propertyIds);
      
      totalUnits = units?.length || 0;
      occupiedUnits = units?.filter(u => u.status === 'occupied').length || 0;
    }

    // Fetch contracts
    const { data: contracts } = await supabase
      .from('contracts')
      .select('id, status, tenant_user_id')
      .eq('merchant_id', merchantId);

    const activeContracts = contracts?.filter(c => c.status === 'active').length || 0;
    const uniqueTenants = new Set(contracts?.map(c => c.tenant_user_id)).size;

    // Fetch invoices
    const { data: invoices } = await supabase
      .from('invoices')
      .select('id, status, due_date, paid_at')
      .eq('merchant_id', merchantId);

    const paidInvoices = invoices?.filter(i => i.status === 'paid').length || 0;
    const pendingInvoices = invoices?.filter(i => i.status === 'pending').length || 0;
    const overdueInvoices = invoices?.filter(i => 
      i.status === 'pending' && new Date(i.due_date) < new Date()
    ).length || 0;

    // Calculate on-time payment rate
    const totalPaidInvoices = invoices?.filter(i => i.status === 'paid' && i.paid_at && i.due_date) || [];
    const onTimePaid = totalPaidInvoices.filter(i => 
      new Date(i.paid_at!) <= new Date(i.due_date)
    ).length;
    const onTimePaymentRate = totalPaidInvoices.length > 0 
      ? (onTimePaid / totalPaidInvoices.length) * 100 
      : 0;

    return {
      totalRevenue,
      totalTenants: uniqueTenants,
      totalProperties: properties?.length || 0,
      totalUnits,
      occupiedUnits,
      occupancyRate: totalUnits > 0 ? (occupiedUnits / totalUnits) * 100 : 0,
      activeContracts,
      paidInvoices,
      pendingInvoices,
      overdueInvoices,
      onTimePaymentRate,
    };
  },

  async fetchMerchantProperties(merchantId: string): Promise<MerchantProperty[]> {
    const { data, error } = await supabase
      .from('properties')
      .select('id, name, address, city, province, property_type, total_units, occupied_units, status')
      .eq('merchant_id', merchantId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as MerchantProperty[];
  },

  async fetchMerchantActivity(merchantId: string): Promise<AuditLog[]> {
    // First get property IDs for this merchant
    const { data: properties } = await supabase
      .from('properties')
      .select('id')
      .eq('merchant_id', merchantId);

    const propertyIds = properties?.map(p => p.id) || [];

    // Fetch audit logs for merchant and related entities
    const query = supabase
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    // Build OR conditions for entity_id matching
    const orConditions = [
      `entity_id.eq.${merchantId}`,
    ];

    if (propertyIds.length > 0) {
      propertyIds.forEach(id => {
        orConditions.push(`entity_id.eq.${id}`);
      });
    }

    const { data, error } = await query.or(orConditions.join(','));

    if (error) throw error;
    return (data as AuditLog[]) || [];
  },
};

