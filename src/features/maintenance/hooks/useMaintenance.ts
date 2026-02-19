import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { maintenanceService } from '../services/maintenanceService';
import { CreateMaintenanceRequestPayload, MaintenanceReview, UpdateMaintenanceStatusPayload } from '../types';

export const useMerchantMaintenanceRequests = (merchantId: string | undefined) => {
  return useQuery({
    queryKey: ['merchant-maintenance-requests', merchantId],
    queryFn: () => maintenanceService.getMerchantRequests(merchantId!),
    enabled: !!merchantId,
  });
};

export const useTenantMaintenanceRequests = (tenantId: string | undefined) => {
  return useQuery({
    queryKey: ['tenant-maintenance-requests', tenantId],
    queryFn: () => maintenanceService.getTenantRequests(tenantId!),
    enabled: !!tenantId,
  });
};

export const useTenantActiveMaintenanceRequests = (tenantId: string | undefined, limit?: number) => {
  return useQuery({
    queryKey: ['tenant-active-maintenance-requests', tenantId, limit],
    queryFn: () => maintenanceService.getTenantActiveRequests(tenantId!, limit),
    enabled: !!tenantId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

export const useMaintenanceRequest = (requestId: string | undefined) => {
  return useQuery({
    queryKey: ['maintenance-request', requestId],
    queryFn: () => maintenanceService.getRequestById(requestId!),
    enabled: !!requestId,
  });
};

export const useCreateMaintenanceRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateMaintenanceRequestPayload) => maintenanceService.createRequest(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenant-maintenance-requests'] });
      queryClient.invalidateQueries({ queryKey: ['merchant-maintenance-requests'] });
    },
  });
};

export const useCancelMaintenanceRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ requestId, userId }: { requestId: string; userId: string }) => 
      maintenanceService.cancelRequest(requestId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenant-maintenance-requests'] });
    },
  });
};

export const useUpdateMaintenanceRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateMaintenanceStatusPayload & { actor_id?: string; actor_role?: string }) => 
      maintenanceService.updateStatus(payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['maintenance-request', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['merchant-maintenance-requests'] });
      queryClient.invalidateQueries({ queryKey: ['tenant-maintenance-requests'] });
      // Invalidate timeline as well since status update might add timeline entries
      queryClient.invalidateQueries({ queryKey: ['maintenance-updates', variables.id] });
    },
  });
};

export const useMaintenanceUpdates = (requestId: string | undefined) => {
  return useQuery({
    queryKey: ['maintenance-updates', requestId],
    queryFn: () => maintenanceService.getUpdates(requestId!),
    enabled: !!requestId,
  });
};

export const useMaintenanceReview = (requestId: string | undefined) => {
  return useQuery({
    queryKey: ['maintenance-review', requestId],
    queryFn: () => maintenanceService.getReview(requestId!),
    enabled: !!requestId,
  });
};

export const useCreateMaintenanceReview = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: Omit<MaintenanceReview, 'id' | 'created_at' | 'vendor'> & { tenant_user_id: string, vendor_id: string }) => 
      maintenanceService.createReview(payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['maintenance-review', variables.maintenance_request_id] });
    },
  });
};

export const useVerifiedVendors = () => {
  return useQuery({
    queryKey: ['verified-vendors'],
    queryFn: () => maintenanceService.getVerifiedVendors(),
  });
};
