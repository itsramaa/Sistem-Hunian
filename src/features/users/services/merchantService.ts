import { supabase } from "@/lib/integrations/supabase/client";
import { AuditLog, HistoryEntry, Merchant, Verification } from "../types/admin-merchant";

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

  async bulkApprove(
    merchants: Merchant[], 
    merchantIds: string[], 
    notes: string
  ): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    const adminId = user?.id;
    
    const targetMerchants = merchants.filter(m => merchantIds.includes(m.id));
    
    // 1. Update merchants status
    const { error } = await supabase
      .from('merchants')
      .update({ 
        verification_status: 'verified',
        verified_at: new Date().toISOString(),
        verified_by: adminId
      })
      .in('id', merchantIds);
      
    if (error) throw error;
    
    // 2. Insert history entries
    const historyEntries = targetMerchants.map(m => ({
      merchant_id: m.id,
      action: 'approved',
      performed_by: adminId,
      approval_notes: notes,
      old_status: m.verification_status,
      new_status: 'verified'
    }));
    
    await supabase.from('merchant_verification_history').insert(historyEntries);
    
    // 3. Insert audit logs
    const auditLogs = targetMerchants.map(m => ({
      user_id: adminId,
      action: 'verification_approved',
      entity_type: 'merchant',
      entity_id: m.id,
      old_data: { verification_status: m.verification_status },
      new_data: { verification_status: 'verified', notes },
      user_agent: navigator.userAgent
    }));
    
    await supabase.from('audit_logs').insert(auditLogs);
    
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
