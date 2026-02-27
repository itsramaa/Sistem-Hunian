import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { collectionsCaseService } from '../services/collectionsCaseService';
import { toast } from 'sonner';

export function useCollectionsInteractions(caseId: string | null) {
  const { merchant } = useAuth();
  return useQuery({
    queryKey: ['collections-interactions', caseId],
    queryFn: () => collectionsCaseService.fetchInteractions(caseId!),
    enabled: !!caseId,
  });
}

export function useAddInteraction() {
  const queryClient = useQueryClient();
  const { merchant } = useAuth();
  return useMutation({
    mutationFn: (data: {
      caseId: string;
      interactionType: string;
      direction: string;
      outcome: string;
      notes: string;
      contactPerson: string;
      followUpDate: string | null;
    }) => {
      if (!merchant?.id) throw new Error('No merchant');
      return collectionsCaseService.addInteraction(data.caseId, merchant.id, data);
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['collections-interactions', vars.caseId] });
      queryClient.invalidateQueries({ queryKey: ['collections-cases'] });
      toast.success('Interaksi berhasil dicatat');
    },
    onError: () => toast.error('Gagal mencatat interaksi'),
  });
}
