import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { collectionsCaseService } from '../services/collectionsCaseService';
import { toast } from 'sonner';

export function useCollectionsCases(status?: string) {
  const { merchant } = useAuth();
  return useQuery({
    queryKey: ['collections-cases', merchant?.id, status],
    queryFn: () => collectionsCaseService.fetchCases(merchant!.id, status),
    enabled: !!merchant?.id,
  });
}

export function useUpdateCaseStatus() {
  const queryClient = useQueryClient();
  const { merchant } = useAuth();
  return useMutation({
    mutationFn: ({ caseId, currentStatus, newStatus, resolution }: { caseId: string; currentStatus: string; newStatus: string; resolution?: string }) =>
      collectionsCaseService.updateCaseStatus(caseId, currentStatus, newStatus, resolution),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collections-cases', merchant?.id] });
      toast.success('Status kasus diperbarui');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useCreatePaymentPlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: collectionsCaseService.createPaymentPlan,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collections-cases'] });
      toast.success('Rencana pembayaran berhasil dibuat');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
