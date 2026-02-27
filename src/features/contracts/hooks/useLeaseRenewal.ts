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

export function useMerchantAmendments() {
  const { merchant } = useAuth();
  return useQuery({
    queryKey: ['merchant-amendments', merchant?.id],
    queryFn: () => renewalService.fetchAmendmentsByMerchant(merchant!.id),
    enabled: !!merchant?.id,
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

export function useSendOffer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: renewalService.sendOffer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['renewal-alerts'] });
      queryClient.invalidateQueries({ queryKey: ['merchant-amendments'] });
      toast.success('Penawaran perpanjangan berhasil dikirim');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useSubmitCounterOffer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ amendmentId, counterOffer }: { amendmentId: string; counterOffer: { newRent: number; notes: string } }) =>
      renewalService.submitCounterOffer(amendmentId, counterOffer),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contract-amendments'] });
      toast.success('Counter-offer terkirim');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useAcceptOffer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (amendmentId: string) => renewalService.acceptOffer(amendmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contract-amendments'] });
      toast.success('Penawaran diterima');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useRejectOffer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (amendmentId: string) => renewalService.rejectOffer(amendmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contract-amendments'] });
      toast.success('Penawaran ditolak');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useSignAmendment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, role, signatureData }: { id: string; role: 'merchant' | 'tenant'; signatureData: string }) =>
      role === 'merchant'
        ? renewalService.signAsMerchant(id, signatureData)
        : renewalService.signAsTenant(id, signatureData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contract-amendments'] });
      queryClient.invalidateQueries({ queryKey: ['merchant-amendments'] });
      toast.success('Amandemen berhasil ditandatangani');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
