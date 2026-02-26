import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { renewalService } from '../services/renewalService';
import { toast } from 'sonner';

export function useRenewalAlerts() {
  const { merchant } = useAuth();
  return useQuery({
    queryKey: ['renewal-alerts', merchant?.id],
    queryFn: () => renewalService.fetchAlerts(merchant!.id),
    enabled: !!merchant?.id,
  });
}

export function useContractAmendments(contractId?: string) {
  return useQuery({
    queryKey: ['contract-amendments', contractId],
    queryFn: () => renewalService.fetchAmendments(contractId!),
    enabled: !!contractId,
  });
}

export function useCreateAmendment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: renewalService.createAmendment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contract-amendments'] });
      toast.success('Amandemen berhasil dibuat');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useSignAmendment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => renewalService.signAmendment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contract-amendments'] });
      toast.success('Amandemen berhasil ditandatangani');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
