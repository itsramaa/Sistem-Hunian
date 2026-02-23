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

export function useAvailableTenants(merchantId: string | undefined) {
  return useQuery({
    queryKey: ['available-tenants', merchantId],
    queryFn: () => merchantTenantService.getAvailableTenants(merchantId!),
    enabled: !!merchantId,
  });
}

export function useMerchantTenantMutations(merchantId: string | undefined) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const sendInvitation = useMutation({
    mutationFn: (data: { property_id: string; email: string; phone?: string | null }) => {
      if (!merchantId) throw new Error('Merchant ID is required');
      return merchantTenantService.sendInvitation(merchantId, data);
    },
    onSuccess: (_, variables) => {
      toast({
        title: 'Undangan Terkirim',
        description: `Undangan berhasil dikirim ke ${variables.email}`,
      });
      queryClient.invalidateQueries({ queryKey: ['tenant-invitations'] });
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Gagal',
        description: error.message || 'Gagal mengirim undangan. Silakan coba lagi.',
      });
    },
  });

  const cancelInvitation = useMutation({
    mutationFn: merchantTenantService.cancelInvitation,
    onSuccess: () => {
      toast({ title: 'Undangan Dibatalkan' });
      queryClient.invalidateQueries({ queryKey: ['tenant-invitations'] });
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Gagal membatalkan',
        description: error.message || 'Tidak dapat membatalkan undangan. Silakan coba lagi.',
      });
    },
  });

  const terminateContract = useMutation({
    mutationFn: merchantTenantService.terminateContract,
    onSuccess: () => {
      toast({
        title: 'Kontrak Diakhiri',
        description: 'Tenant telah dihapus dari unit ini.',
      });
      queryClient.invalidateQueries({ queryKey: ['active-tenants'] });
      queryClient.invalidateQueries({ queryKey: ['active-contracts-count'] });
      queryClient.invalidateQueries({ queryKey: ['merchant-properties-with-units'] });
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Gagal mengakhiri kontrak',
        description: error.message || 'Tidak dapat menghapus tenant. Silakan coba lagi.',
      });
    },
  });

  const addTenantDirectly = useMutation({
    mutationFn: (data: import('@/features/users/types/addTenantSchema').AddTenantFormData) => {
      if (!merchantId) throw new Error('Merchant ID is required');
      return merchantTenantService.addTenantDirectly(merchantId, data);
    },
    onSuccess: (_, variables) => {
      toast({
        title: 'Tenant Ditambahkan',
        description: `Tenant ${variables.full_name} berhasil ditambahkan`,
      });
      queryClient.invalidateQueries({ queryKey: ['active-tenants'] });
      queryClient.invalidateQueries({ queryKey: ['active-contracts-count'] });
      queryClient.invalidateQueries({ queryKey: ['tenant-invitations'] });
      queryClient.invalidateQueries({ queryKey: ['merchant-properties-with-units'] });
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Gagal menambah tenant',
        description: error.message || 'Tidak dapat menambah tenant. Silakan coba lagi.',
      });
    },
  });

  const unlinkTenant = useMutation({
    mutationFn: (userId: string) => {
      if (!merchantId) throw new Error('Merchant ID is required');
      return merchantTenantService.unlinkTenant(userId, merchantId);
    },
    onSuccess: () => {
      toast({
        title: 'Tenant Dilepas',
        description: 'Tenant berhasil dilepas dari merchant Anda.',
      });
      queryClient.invalidateQueries({ queryKey: ['active-tenants'] });
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Gagal melepas tenant',
        description: error.message || 'Tidak dapat melepas tenant. Silakan coba lagi.',
      });
    },
  });

  return {
    sendInvitation,
    cancelInvitation,
    terminateContract,
    addTenantDirectly,
    unlinkTenant,
  };
}
