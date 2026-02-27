import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { screeningService } from '../services/screeningService';
import { ScreeningFormData } from '../types';

export function useScreenings() {
  const { merchant } = useAuth();
  const merchantId = merchant?.id;

  return useQuery({
    queryKey: ['tenant-screenings', merchantId],
    queryFn: () => screeningService.fetchScreenings(merchantId!),
    enabled: !!merchantId,
  });
}

export function useCreateScreening() {
  const { merchant } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (formData: ScreeningFormData) => {
      if (!merchant) throw new Error('No merchant');
      const screening = await screeningService.createScreening(merchant.id, formData);
      // Auto-run AI scoring
      return screeningService.runAiScoring(screening);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tenant-screenings'] }),
  });
}

export function useApproveScreening() {
  const { user } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => screeningService.approveScreening(id, user!.id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tenant-screenings'] }),
  });
}

export function useRejectScreening() {
  const { user } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ id, notes }: { id: string; notes?: string }) =>
      screeningService.rejectScreening(id, user!.id, notes),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tenant-screenings'] }),
  });
}

export function useScreeningForTenant(tenantUserId: string | undefined) {
  const { merchant } = useAuth();

  return useQuery({
    queryKey: ['tenant-screening-check', merchant?.id, tenantUserId],
    queryFn: () => screeningService.getApprovedScreeningForTenant(merchant!.id, tenantUserId!),
    enabled: !!merchant?.id && !!tenantUserId,
  });
}
