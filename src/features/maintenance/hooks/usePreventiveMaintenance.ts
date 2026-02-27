import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { preventiveMaintenanceService } from '../services/preventiveMaintenanceService';
import { toast } from 'sonner';

export function usePreventiveSchedules() {
  const { merchant } = useAuth();
  return useQuery({
    queryKey: ['preventive-schedules', merchant?.id],
    queryFn: () => preventiveMaintenanceService.fetchSchedules(merchant!.id),
    enabled: !!merchant?.id,
  });
}

export function useOverdueSchedules() {
  const { merchant } = useAuth();
  return useQuery({
    queryKey: ['preventive-overdue', merchant?.id],
    queryFn: () => preventiveMaintenanceService.getOverdueSchedules(merchant!.id),
    enabled: !!merchant?.id,
  });
}

export function useCostComparison() {
  const { merchant } = useAuth();
  return useQuery({
    queryKey: ['preventive-cost-comparison', merchant?.id],
    queryFn: () => preventiveMaintenanceService.getCostComparison(merchant!.id),
    enabled: !!merchant?.id,
  });
}

export function useCreateSchedule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: preventiveMaintenanceService.createSchedule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['preventive-schedules'] });
      toast.success('Jadwal preventif berhasil dibuat');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateSchedule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string } & Parameters<typeof preventiveMaintenanceService.updateSchedule>[1]) =>
      preventiveMaintenanceService.updateSchedule(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['preventive-schedules'] });
      toast.success('Jadwal diperbarui');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useExecuteSchedule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (scheduleId: string) => preventiveMaintenanceService.executeSchedule(scheduleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['preventive-schedules'] });
      queryClient.invalidateQueries({ queryKey: ['preventive-overdue'] });
      toast.success('Maintenance request berhasil dibuat dari jadwal');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
