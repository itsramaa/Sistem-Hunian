import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { maintenanceService } from '../api/maintenanceService';
import { CreateMaintenancePayload, UpdateMaintenancePayload } from '../types';

export const MAINTENANCE_KEY = 'maintenances';

export function useMaintenances(page = 1, limit = 20, status?: string, property_id?: string) {
  return useQuery({
    queryKey: [MAINTENANCE_KEY, { page, limit, status, property_id }],
    queryFn: () => maintenanceService.list(page, limit, status, property_id),
  });
}

export function useCreateMaintenance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateMaintenancePayload) => maintenanceService.create(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: [MAINTENANCE_KEY] }),
  });
}

export function useUpdateMaintenance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateMaintenancePayload }) =>
      maintenanceService.update(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: [MAINTENANCE_KEY] }),
  });
}
