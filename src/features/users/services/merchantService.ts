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
    try {
      const params: Record<string, string> = {};
      if (filters?.status && filters.status !== 'all') params.verification_status = filters.status;
      if (filters?.tier && filters.tier !== 'all') params.tier_id = filters.tier;
      if (filters?.dateRange?.from) params.created_from = filters.dateRange.from.toISOString();
      if (filters?.dateRange?.to) params.created_to = filters.dateRange.to.toISOString();

      const r = await apiClient.get('/merchants', { params });
      return ((r.data ?? []) as any[]).map((m: any) => ({
        ...m,
        address: m.resolved_address ?? m.address,
        city: m.resolved_city ?? m.city,
        province: m.resolved_province ?? m.province,
      })) as unknown as Merchant[];
    } catch (err) {
      throw err;
    }
  },

  async fetchMerchantHistory(merchantId: string): Promise<HistoryEntry[]> {
    try {
      const r = await apiClient.get('/merchant-verification-history', {
        params: { merchant_id: merchantId, order_by: 'created_at', order: 'desc' },
      });
      return (r.data ?? []) as HistoryEntry[];
    } catch (err) {
      throw err;
    }
  },

  async fetchActivePaidCount(): Promise<number> {
    try {
      const r = await apiClient.get('/merchant-subscriptions/active-paid-count');
      return r.data?.count ?? 0;
    } catch {
      // TODO: implement Go endpoint — was: supabase.from('merchant_subscriptions').select(...).eq('status','active').neq('subscription_tiers.name','free')
      return 0;
    }
  },

  async fetchVerifications(merchantId: string): Promise<Verification[]> {
    try {
      const r = await apiClient.get('/merchant-verifications', {
        params: { merchant_id: merchantId, order_by: 'created_at', order: 'desc' },
      });
      return (r.data ?? []) as Verification[];
    } catch (err) {
      throw err;
    }
  },

  async fetchMerchantActivity(merchantId: string): Promise<AuditLog[]> {
    try {
      const r = await apiClient.get('/audit-logs', {
        params: { merchant_id: merchantId, limit: 50, order_by: 'created_at', order: 'desc' },
      });
      return (r.data ?? []) as AuditLog[];
    } catch {
      // TODO: implement Go endpoint — was: supabase.from('audit_logs').select('*').or(...)
      return [];
    }
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

    // Single write to history -- trigger auto-syncs merchants.verification_status
    try {
      await apiClient.post('/merchant-verification-history', {
        merchant_id: merchant.id,
        action: status === 'verified' ? 'approved' : 'rejected',
        approval_notes: status === 'verified' ? approvalNotes : null,
        rejection_reason: rejectionData?.reasonLabel,
        rejection_details: rejectionData?.details,
        resubmission_instructions: rejectionData?.resubmissionInstructions,
        old_status: currentStatus,
        new_status: status,
      });
    } catch (err) {
      throw err;
    }

    // Audit log via centralized utility
    await logStatusChange('merchant', merchant.id, currentStatus, status,
      status === 'rejected' ? rejectionData?.reasonLabel : approvalNotes);

    // Create notification for merchant
    try {
      await apiClient.post('/notifications', {
        user_id: merchant.user_id,
        type: status === 'verified' ? 'verification_approved' : 'verification_rejected',
        title: status === 'verified' ? 'Akun Terverifikasi!' : 'Verifikasi Ditolak',
        message: status === 'verified'
          ? 'Selamat! Akun bisnis Anda telah terverifikasi. Semua fitur telah dibuka.'
          : `Pengajuan verifikasi Anda ditolak: ${rejectionData?.reasonLabel}. Silakan perbaiki dan ajukan kembali.`,
        link: '/merchant',
      });
    } catch (notifErr) {
      console.error('Failed to create notification:', notifErr);
    }

    // Send email notification
    try {
      await apiClient.post('/notifications/email', {
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

    // Single write to history -- trigger auto-syncs merchants.verification_status
    try {
      await apiClient.post('/merchant-verification-history', {
        merchant_id: merchant.id,
        action: newStatus === 'suspended' ? 'suspended' : 'reactivated',
        old_status: currentStatus,
        new_status: newStatus,
      });
    } catch (err) {
      throw err;
    }

    // Audit log via centralized utility
    await logStatusChange('merchant', merchant.id, currentStatus, newStatus);

    return newStatus;
  },

  async bulkApprove(
    merchants: Merchant[],
    merchantIds: string[],
    notes: string
  ): Promise<void> {
    const targetMerchants = merchants.filter(m => merchantIds.includes(m.id));

    // Single write to history -- trigger auto-syncs merchants.verification_status per row
    const historyEntries = targetMerchants.map(m => ({
      merchant_id: m.id,
      action: 'approved',
      approval_notes: notes,
      old_status: m.verification_status,
      new_status: 'verified'
    }));

    try {
      await apiClient.post('/merchant-verification-history/bulk', historyEntries);
    } catch (err) {
      throw err;
    }

    // Audit logs via centralized utility
    for (const m of targetMerchants) {
      await createAuditLog({
        action: 'bulk_approve',
        entityType: 'merchant',
        entityId: m.id,
        oldData: { verification_status: m.verification_status },
        newData: { verification_status: 'verified', notes },
      });
    }

    // Create notifications
    const notifications = targetMerchants.map(m => ({
      user_id: m.user_id,
      type: 'verification_approved',
      title: 'Akun Terverifikasi!',
      message: 'Selamat! Akun bisnis Anda telah terverifikasi secara massal.',
      link: '/merchant'
    }));

    try {
      await apiClient.post('/notifications/bulk', notifications);
    } catch (notifErr) {
      console.error('Failed to create bulk notifications:', notifErr);
    }
  }
};
