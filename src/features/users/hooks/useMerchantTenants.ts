import { useToast } from '@/shared/hooks/use-toast';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { merchantTenantService } from '../services/merchantTenantService';

export function useMerchantPropertiesWithUnits(merchantId: string | undefined) {
  return useQuery({
    queryKey: ['merchant-properties-with-units', merchantId],
    queryFn: () => merchantTenantService.getPropertiesWithUnits(merchantId!),
    enabled: !!merchantId,
  });
}

export function useMerchantInvitations(merchantId: string | undefined) {
  return useQuery({
    queryKey: ['tenant-invitations', merchantId],
    queryFn: () => merchantTenantService.getInvitations(merchantId!),
    enabled: !!merchantId,
  });
}

export function useMerchantActiveTenants(merchantId: string | undefined) {
  return useQuery({
    queryKey: ['active-tenants', merchantId],
    queryFn: () => merchantTenantService.getActiveTenants(merchantId!),
    enabled: !!merchantId,
  });
}

export function useMerchantActiveContractsCount(merchantId: string | undefined) {
  return useQuery({
    queryKey: ['active-contracts-count', merchantId],
    queryFn: () => merchantTenantService.getActiveContractsCount(merchantId!),
    enabled: !!merchantId,
  });
}

export function useTenantProfiles(userIds: string[]) {
  return useQuery({
    queryKey: ['tenant-profiles', userIds],
    queryFn: () => merchantTenantService.getTenantProfiles(userIds),
    enabled: userIds.length > 0,
  });
}

export function useMerchantTenants(merchantId: string | undefined) {
  return useQuery({
    queryKey: ['merchant-tenants-all', merchantId],
    queryFn: () => merchantTenantService.getAllMerchantTenants(merchantId!),
    enabled: !!merchantId,
  });
}

export function useMerchantTenantMutations(merchantId: string | undefined) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const sendInvitation = useMutation({
    mutationFn: (data: { unit_id: string; email: string; phone?: string | null }) => {
      if (!merchantId) throw new Error('Merchant ID is required');
      return merchantTenantService.sendInvitation(merchantId, data);
    },
    onSuccess: (_, variables) => {
      toast({
        title: 'Invitation Sent',
        description: `Invitation sent to ${variables.email}`,
      });
      queryClient.invalidateQueries({ queryKey: ['tenant-invitations'] });
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to send invitation',
      });
    },
  });

  const cancelInvitation = useMutation({
    mutationFn: merchantTenantService.cancelInvitation,
    onSuccess: () => {
      toast({ title: 'Invitation Cancelled' });
      queryClient.invalidateQueries({ queryKey: ['tenant-invitations'] });
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Failed to cancel',
        description: error.message || 'Could not cancel the invitation. Please try again.',
      });
    },
  });

  const terminateContract = useMutation({
    mutationFn: merchantTenantService.terminateContract,
    onSuccess: () => {
      toast({
        title: 'Contract Terminated',
        description: 'The tenant has been removed from this unit.',
      });
      queryClient.invalidateQueries({ queryKey: ['active-tenants'] });
      queryClient.invalidateQueries({ queryKey: ['active-contracts-count'] });
      queryClient.invalidateQueries({ queryKey: ['merchant-properties-with-units'] });
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Failed to terminate contract',
        description: error.message || 'Could not remove the tenant. Please try again.',
      });
    },
  });

  return {
    sendInvitation,
    cancelInvitation,
    terminateContract,
  };
}
