import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { waitingListService } from '../services/waitingListService';
import type { CreateApplicantPayload } from '../types';
import { toast } from 'sonner';

export function useWaitingList(filters?: { status?: string; propertyId?: string }) {
  const { merchant } = useAuth();
  const queryClient = useQueryClient();
  const queryKey = ['waiting-list', merchant?.id, filters];

  const list = useQuery({
    queryKey,
    queryFn: () => waitingListService.fetchApplicants(merchant!.id, filters),
    enabled: !!merchant?.id,
  });

  const addApplicant = useMutation({
    mutationFn: (payload: Omit<CreateApplicantPayload, 'merchantId'>) =>
      waitingListService.addApplicant({ ...payload, merchantId: merchant!.id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['waiting-list', merchant?.id] });
      toast.success('Pelamar berhasil ditambahkan');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, currentStatus, newStatus, extra }: { id: string; currentStatus: string; newStatus: string; extra?: Record<string, any> }) =>
      waitingListService.updateStatus(id, currentStatus, newStatus, extra),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['waiting-list', merchant?.id] });
      toast.success('Status berhasil diperbarui');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const sendOffer = useMutation({
    mutationFn: ({ applicantId, unitId }: { applicantId: string; unitId: string }) =>
      waitingListService.sendOffer(applicantId, unitId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['waiting-list', merchant?.id] });
      toast.success('Penawaran berhasil dikirim');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return { list, addApplicant, updateStatus, sendOffer };
}
