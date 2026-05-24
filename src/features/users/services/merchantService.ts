import { supabase } from "@/lib/integrations/supabase/client";
import { apiClient } from "@/lib/axios";
import { AuditLog, HistoryEntry, Merchant, Verification } from "../types/admin-merchant";
import { MERCHANT_VERIFICATION_TRANSITIONS, isValidTransition } from "@/shared/constants/state-machines";
import { createAuditLog, logStatusChange } from "@/shared/utils/auditLog";

export const merchantService = {
  async fetchMerchants(filters?: {
    status?: string;
    tier?: string;
    dateRange?: { from?: Date; to?: Date };
  }): Promise<Merchant[]> {
    let query = supabase
      .from('v_merchants_with_addresses' as any)
      .select(`
        *,
        profiles:user_id (
          email,
          full_name,
          phone
        ),
        merchant_subscriptions(
          tier_id,
          status,
          subscription_tiers(name)
        )
      `)
      .order('created_at', { ascending: false }) as any;

    if (filters?.status && filters.status !== 'all') {
      query = query.eq('verification_status', filters.status);
    }
    if (filters?.tier && filters.tier !== 'all') {
      query = query.eq('merchant_subscriptions.tier_id', filters.tier);
    }
    if (filters?.dateRange?.from) {
      query = query.gte('created_at', filters.dateRange.from.toISOString());
    }
    if (filters?.dateRange?.to) {
      query = query.lte('created_at', filters.dateRange.to.toISOString());
    }

    const { data, error } = await query;

    if (error) throw error;
    // Map resolved address fields to flat fields for backward compat
    return ((data || []) as any[]).map((m: any) => ({
      ...m,
      address: m.resolved_address,
      city: m.resolved_city,
      province: m.resolved_province,
    })) as unknown as Merchant[];
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

  async fetchMerchantActivity(merchantId: string): Promise<AuditLog[]> {
    const { data: merchant } = await supabase
      .from('merchants')
      .select('user_id')
      .eq('id', merchantId)
      .single();

    if (!merchant) return [];

    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .or(`entity_id.eq.${merchantId},user_id.eq.${merchant.user_id}`)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;
    return (data || []) as AuditLog[];
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
    // Validate transition
    const currentStatus = merchant.verification_status || 'pending';
    if (!isValidTransition(MERCHANT_VERIFICATION_TRANSITIONS, currentStatus, status)) {
      throw new Error(`Invalid verification transition: ${currentStatus} → ${status}`);
    }

    const { data: { user } } = await supabase.auth.getUser();
    const adminId = user?.id;

    // Single write to history -- trigger auto-syncs merchants.verification_status
    const { error } = await supabase.from('merchant_verification_history').insert({
      merchant_id: merchant.id,
      action: status === 'verified' ? 'approved' : 'rejected',
      performed_by: adminId,
      approval_notes: status === 'verified' ? approvalNotes : null,
      rejection_reason: rejectionData?.reasonLabel,
      rejection_details: rejectionData?.details,
      resubmission_instructions: rejectionData?.resubmissionInstructions,
      old_status: currentStatus,
      new_status: status,
    });

    if (error) throw error;

    // Audit log via centralized utility
    await logStatusChange('merchant', merchant.id, currentStatus, status, 
      status === 'rejected' ? rejectionData?.reasonLabel : approvalNotes);

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
      await apiClient.post('/notifications', {
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
        });
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError);
    }
  },

  async suspendMerchant(merchant: Merchant): Promise<string> {
    const newStatus = merchant.verification_status === 'suspended' ? 'verified' : 'suspended';
    const currentStatus = merchant.verification_status || 'pending';

    // Validate transition
    if (!isValidTransition(MERCHANT_VERIFICATION_TRANSITIONS, currentStatus, newStatus)) {
      throw new Error(`Invalid verification transition: ${currentStatus} → ${newStatus}`);
    }

    const { data: { user } } = await supabase.auth.getUser();
    const adminId = user?.id;

    // Single write to history -- trigger auto-syncs merchants.verification_status
    const { error } = await supabase.from('merchant_verification_history').insert({
      merchant_id: merchant.id,
      action: newStatus === 'suspended' ? 'suspended' : 'reactivated',
      performed_by: adminId,
      old_status: currentStatus,
      new_status: newStatus,
    });

    if (error) throw error;
    
    // Audit log via centralized utility
    await logStatusChange('merchant', merchant.id, currentStatus, newStatus);
    
    return newStatus;
  },

  async bulkApprove(
    merchants: Merchant[], 
    merchantIds: string[], 
    notes: string
  ): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    const adminId = user?.id;
    
    const targetMerchants = merchants.filter(m => merchantIds.includes(m.id));
    
    // Single write to history -- trigger auto-syncs merchants.verification_status per row
    const historyEntries = targetMerchants.map(m => ({
      merchant_id: m.id,
      action: 'approved',
      performed_by: adminId,
      approval_notes: notes,
      old_status: m.verification_status,
      new_status: 'verified'
    }));
    
    const { error } = await supabase.from('merchant_verification_history').insert(historyEntries);
    if (error) throw error;
    
    // 3. Audit logs via centralized utility
    for (const m of targetMerchants) {
      await createAuditLog({
        action: 'bulk_approve',
        entityType: 'merchant',
        entityId: m.id,
        oldData: { verification_status: m.verification_status },
        newData: { verification_status: 'verified', notes },
      });
    }
    
    // 4. Create notifications
    const notifications = targetMerchants.map(m => ({
      user_id: m.user_id,
      type: 'verification_approved',
      title: 'Akun Terverifikasi!',
      message: 'Selamat! Akun bisnis Anda telah terverifikasi secara massal.',
      link: '/merchant'
    }));
    
    await supabase.from('notifications').insert(notifications);
  }
};
