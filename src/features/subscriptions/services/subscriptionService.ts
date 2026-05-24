import { apiClient } from '@/lib/axios';
import { createAuditLog } from "@/shared/utils/auditLog";
import { SubscriptionTier, SubscriptionTierInput } from "../types/subscription-tier";
import {
  CancellationFeedback,
  PendingSubscriptionChange,
  SubscriptionInvoice,
  SubscriptionMerchant
} from "../types/subscriptions";

export const subscriptionService = {
  fetchTiers: async (onlyActive = false): Promise<SubscriptionTier[]> => {
    try {
      const response = await apiClient.get('/subscriptions/tiers', {
        params: onlyActive ? { is_active: true } : undefined,
      });
      return response.data.data as SubscriptionTier[];
    } catch (error: any) {
      throw new Error(error.response?.data?.error?.message || error.message || 'Failed to load tiers');
    }
  },

  fetchMerchants: async (): Promise<SubscriptionMerchant[]> => {
    try {
      const response = await apiClient.get('/subscriptions');
      return response.data.data as SubscriptionMerchant[];
    } catch (error: any) {
      throw new Error(error.response?.data?.error?.message || error.message || 'Failed to load merchants');
    }
  },

  getSubscription: async (id: string): Promise<SubscriptionMerchant> => {
    try {
      const response = await apiClient.get(`/subscriptions/${id}`);
      return response.data.data as SubscriptionMerchant;
    } catch (error: any) {
      throw new Error(error.response?.data?.error?.message || error.message || 'Failed to fetch subscription');
    }
  },

  fetchInvoices: async (): Promise<SubscriptionInvoice[]> => {
    try {
      const response = await apiClient.get('/subscriptions/invoices', {
        params: { limit: 100 },
      });
      return (response.data.data || []) as SubscriptionInvoice[];
    } catch (error: any) {
      throw new Error(error.response?.data?.error?.message || error.message || 'Failed to load invoices');
    }
  },

  fetchCancellationFeedback: async (): Promise<CancellationFeedback[]> => {
    // TODO: Go endpoint not yet implemented — was: supabase.from('cancellation_feedback').select(...)
    return [];
  },

  fetchPendingChanges: async (): Promise<PendingSubscriptionChange[]> => {
    // TODO: Go endpoint not yet implemented — was: supabase.from('subscription_changes').select(...)
    return [];
  },

  fetchStats: async () => {
    try {
      const response = await apiClient.get('/subscriptions/stats');
      return response.data.data as Record<string, number>;
    } catch (error: any) {
      throw new Error(error.response?.data?.error?.message || error.message || 'Failed to load stats');
    }
  },

  updateSubscription: async (merchantId: string, tierId: string, tierName: string): Promise<void> => {
    try {
      await apiClient.put(`/subscriptions/merchant/${merchantId}`, {
        tier_id: tierId,
      });

      await createAuditLog({
        action: 'update',
        entityType: 'merchant_subscription',
        entityId: merchantId,
        newData: { tierId, tierName }
      });
    } catch (error: any) {
      throw new Error(error.response?.data?.error?.message || error.message || 'Failed to update subscription');
    }
  },

  checkActiveSubscribers: async (tierId: string): Promise<number> => {
    try {
      const response = await apiClient.get(`/subscriptions/tiers/${tierId}/active-count`);
      return (response.data.data?.count as number) || 0;
    } catch (error: any) {
      throw new Error(error.response?.data?.error?.message || error.message || 'Failed to check active subscribers');
    }
  },

  createTier: async (tierData: SubscriptionTierInput): Promise<SubscriptionTier> => {
    try {
      const response = await apiClient.post('/subscriptions/tiers', tierData);
      return response.data.data as SubscriptionTier;
    } catch (error: any) {
      const msg = error.response?.data?.error?.message || error.message || 'Failed to create tier';
      if (msg.includes('duplicate') || msg.includes('already exists') || error.response?.status === 409) {
        throw new Error('A tier with this name already exists');
      }
      throw new Error(msg);
    }
  },

  updateTier: async (id: string, tierData: Partial<SubscriptionTierInput>): Promise<void> => {
    try {
      await apiClient.put(`/subscriptions/tiers/${id}`, tierData);
    } catch (error: any) {
      const msg = error.response?.data?.error?.message || error.message || 'Failed to update tier';
      if (msg.includes('duplicate') || msg.includes('already exists') || error.response?.status === 409) {
        throw new Error('A tier with this name already exists');
      }
      throw new Error(msg);
    }
  },

  deleteTier: async (id: string): Promise<void> => {
    // Check for active subscribers before deleting
    const activeCount = await subscriptionService.checkActiveSubscribers(id);
    if (activeCount > 0) {
      throw new Error(`Cannot delete tier with ${activeCount} active subscriber(s). Please migrate them to another tier first.`);
    }

    try {
      await apiClient.delete(`/subscriptions/tiers/${id}`);
    } catch (error: any) {
      throw new Error(error.response?.data?.error?.message || error.message || 'Failed to delete tier');
    }
  },
};
