import { apiClient } from '@/lib/axios';
import { Vendor } from '../../users/types/admin-vendor';
import { CreateMaintenanceRequestPayload, CreateMerchantMaintenancePayload, MaintenanceRequest, MaintenanceReview, MaintenanceTimeline, UpdateMaintenanceStatusPayload } from '../types';
import { logStatusChange } from '@/shared/utils/auditLog';

export const maintenanceService = {
  async getMerchantRequests(merchantId: string): Promise<MaintenanceRequest[]> {
    const response = await apiClient.get('/maintenance-requests', {
      params: { merchant_id: merchantId, order: 'created_at', ascending: false },
    });
    return (response.data?.data || response.data || []) as MaintenanceRequest[];
  },

  async getTenantRequests(tenantId: string): Promise<MaintenanceRequest[]> {
    const response = await apiClient.get('/maintenance-requests', {
      params: { tenant_user_id: tenantId, order: 'created_at', ascending: false },
    });
    return (response.data?.data || response.data || []) as MaintenanceRequest[];
  },

  async getTenantActiveRequests(tenantId: string, limit?: number): Promise<MaintenanceRequest[]> {
    const response = await apiClient.get('/maintenance-requests', {
      params: {
        tenant_user_id: tenantId,
        status: 'pending,in_progress,assigned',
        order: 'created_at',
        ascending: false,
        ...(limit ? { limit } : {}),
        select: 'id,title,category,status,priority,created_at',
      },
    });
    return (response.data?.data || response.data || []) as MaintenanceRequest[];
  },

  async getRequestById(id: string): Promise<MaintenanceRequest | null> {
    const response = await apiClient.get(`/maintenance-requests/${id}`);
    return (response.data?.data || response.data) as MaintenanceRequest;
  },

  async createRequest(payload: CreateMaintenanceRequestPayload): Promise<MaintenanceRequest> {
    const response = await apiClient.post('/maintenance-requests', payload);
    return (response.data?.data || response.data) as MaintenanceRequest;
  },

  async createMerchantRequest(payload: CreateMerchantMaintenancePayload): Promise<MaintenanceRequest> {
    const response = await apiClient.post('/maintenance-requests/merchant', payload);
    return (response.data?.data || response.data) as MaintenanceRequest;
  },

  async cancelRequest(requestId: string, userId: string): Promise<void> {
    await apiClient.patch(`/maintenance-requests/${requestId}/cancel`, { user_id: userId });
    await logStatusChange('maintenance', requestId, 'pending', 'cancelled');
  },

  async updateRequest(id: string, payload: Partial<MaintenanceRequest>): Promise<MaintenanceRequest> {
    const response = await apiClient.patch(`/maintenance-requests/${id}`, payload);
    return (response.data?.data || response.data) as MaintenanceRequest;
  },

  async updateStatus(payload: UpdateMaintenanceStatusPayload & { actor_id?: string, actor_role?: string }): Promise<MaintenanceRequest> {
    const response = await apiClient.patch(`/maintenance-requests/${payload.id}/status`, payload);
    return (response.data?.data || response.data) as MaintenanceRequest;
  },

  async getUpdates(requestId: string): Promise<MaintenanceTimeline[]> {
    const response = await apiClient.get(`/maintenance-requests/${requestId}/timeline`);
    return (response.data?.data || response.data || []) as MaintenanceTimeline[];
  },

  async getReview(requestId: string): Promise<MaintenanceReview | null> {
    const response = await apiClient.get(`/maintenance-requests/${requestId}/review`);
    return (response.data?.data || response.data || null) as MaintenanceReview | null;
  },

  async createReview(payload: Omit<MaintenanceReview, 'id' | 'created_at' | 'vendor'> & { tenant_user_id: string, vendor_id: string }): Promise<MaintenanceReview> {
    const response = await apiClient.post(`/maintenance-requests/${payload.maintenance_request_id}/review`, payload);
    return (response.data?.data || response.data) as MaintenanceReview;
  },

  async getVerifiedVendors(): Promise<Pick<Vendor, 'id' | 'business_name' | 'service_categories' | 'rating' | 'user_id'>[]> {
    const response = await apiClient.get('/vendors', {
      params: { verification_status: 'verified', select: 'id,business_name,service_categories,rating,user_id' },
    });
    return (response.data?.data || response.data || []) as Pick<Vendor, 'id' | 'business_name' | 'service_categories' | 'rating' | 'user_id'>[];
  }
};