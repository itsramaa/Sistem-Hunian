import { useToast } from '@/shared/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { merchantService } from '../services/merchantService';
import { Merchant } from '../types/merchant';

export function useMerchantActions(onSuccess?: () => void) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const verifyMutation = useMutation({
    mutationFn: async ({ 
      merchant, 
      status, 
      rejectionData, 
      approvalNotes 
    }: {
      merchant: Merchant;
      status: 'verified' | 'rejected';
      rejectionData?: {
        reason: string;
        reasonLabel: string;
        details: string;
        resubmissionInstructions: string;
      };
      approvalNotes?: string;
    }) => {
      await merchantService.verifyMerchant(merchant, status, rejectionData, approvalNotes);
      return { merchant, status };
    },
    onSuccess: ({ merchant, status }) => {
      queryClient.invalidateQueries({ queryKey: ['admin-merchants'] });
      queryClient.invalidateQueries({ queryKey: ['merchant-history', merchant.id] });
      toast({
        title: status === 'verified' ? 'Merchant Diverifikasi' : 'Merchant Ditolak',
        description: `${merchant.business_name} telah ${status === 'verified' ? 'diverifikasi' : 'ditolak'}`,
      });
      onSuccess?.();
    },
    onError: (error) => {
      console.error('Error updating merchant:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Gagal mengupdate status merchant',
      });
    }
  });

  const suspendMutation = useMutation({
    mutationFn: async (merchant: Merchant) => {
      const newStatus = await merchantService.suspendMerchant(merchant);
      return { merchant, newStatus };
    },
    onSuccess: ({ merchant, newStatus }) => {
      queryClient.invalidateQueries({ queryKey: ['admin-merchants'] });
      queryClient.invalidateQueries({ queryKey: ['merchant-history', merchant.id] });
      toast({
        title: newStatus === 'suspended' ? 'Merchant Ditangguhkan' : 'Merchant Diaktifkan Kembali',
        description: `${merchant.business_name} telah ${newStatus === 'suspended' ? 'ditangguhkan' : 'diaktifkan kembali'}`,
      });
      onSuccess?.();
    },
    onError: (error) => {
      console.error('Error updating merchant:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Gagal mengupdate status merchant',
      });
    }
  });

  const bulkApproveMutation = useMutation({
    mutationFn: async ({ merchants, selectedIds, notes }: { merchants: Merchant[], selectedIds: string[], notes: string }) => {
      await merchantService.bulkApproveMerchants(merchants, selectedIds, notes);
      return selectedIds.length;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ['admin-merchants'] });
      toast({
        title: 'Bulk Approval Selesai',
        description: `${count} merchant telah diverifikasi`,
      });
      onSuccess?.();
    },
    onError: (error) => {
      console.error('Error in bulk approval:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Gagal melakukan bulk approval',
      });
    }
  });

  return {
    verifyMerchant: (merchant: Merchant, status: 'verified' | 'rejected', rejectionData?: any, approvalNotes?: string) => 
      verifyMutation.mutateAsync({ merchant, status, rejectionData, approvalNotes }),
    suspendMerchant: (merchant: Merchant) => suspendMutation.mutateAsync(merchant),
    bulkApprove: (merchants: Merchant[], selectedIds: string[], notes: string) => 
      bulkApproveMutation.mutateAsync({ merchants, selectedIds, notes }),
    loading: verifyMutation.isPending || suspendMutation.isPending || bulkApproveMutation.isPending
  };
}
