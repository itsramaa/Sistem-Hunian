import { apiClient } from '@/lib/axios';
import { CreatePaymentPlanPayload, PaymentPlan } from '../types';

export const paymentPlanService = {
  async getTenantPaymentPlans(tenantId: string, statuses?: string[]): Promise<PaymentPlan[]> {
    try {
      const params: Record<string, string> = { tenant_id: tenantId };
      if (statuses && statuses.length > 0) {
        params.status = statuses.join(',');
      }
      const response = await apiClient.get('/billing/payment-plans', { params });
      return response.data.data as PaymentPlan[];
    } catch (error: any) {
      const apiError = error.response?.data?.error;
      throw new Error(apiError?.message || error.message || 'Failed to fetch payment plans');
    }
  },

  async createPaymentPlan(payload: CreatePaymentPlanPayload): Promise<PaymentPlan> {
    try {
      const response = await apiClient.post('/billing/payment-plans', payload);
      return response.data.data as PaymentPlan;
    } catch (error: any) {
      const apiError = error.response?.data?.error;
      throw new Error(apiError?.message || error.message || 'Failed to create payment plan');
    }
  },

  async acceptPaymentPlan(planId: string, _invoiceId: string): Promise<void> {
    try {
      await apiClient.put(`/billing/payment-plans/${planId}/status`, { status: 'active' });
    } catch (error: any) {
      const apiError = error.response?.data?.error;
      throw new Error(apiError?.message || error.message || 'Failed to accept payment plan');
    }
  },

  async declinePaymentPlan(planId: string): Promise<void> {
    try {
      await apiClient.put(`/billing/payment-plans/${planId}/status`, { status: 'cancelled' });
    } catch (error: any) {
      const apiError = error.response?.data?.error;
      throw new Error(apiError?.message || error.message || 'Failed to decline payment plan');
    }
  }
};
