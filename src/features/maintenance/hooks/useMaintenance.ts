import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { maintenanceService } from "../api/maintenanceService";
import { CreateMaintenancePayload, UpdateMaintenancePayload } from "../types";
import { apiClient } from "@/shared/lib/axios";

export const MAINTENANCE_KEY = "maintenances";

export function useMaintenances(
  page = 1,
  limit = 20,
  status?: string,
  property_id?: string,
  room_id?: string,
) {
  return useQuery({
    queryKey: [MAINTENANCE_KEY, { page, limit, status, property_id, room_id }],
    queryFn: () =>
      maintenanceService.list(page, limit, status, property_id, room_id),
  });
}

export function useMaintenanceById(id?: string) {
  return useQuery({
    queryKey: [MAINTENANCE_KEY, "detail", id],
    queryFn: () => maintenanceService.getById(id!),
    enabled: !!id,
  });
}

export function useCreateMaintenance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateMaintenancePayload) =>
      maintenanceService.create(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: [MAINTENANCE_KEY] }),
  });
}

export function useUpdateMaintenance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdateMaintenancePayload;
    }) => maintenanceService.update(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: [MAINTENANCE_KEY] }),
  });
}

export function useUploadFotoKerusakan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, file }: { id: string; file: File }) =>
      maintenanceService.uploadFotoKerusakan(id, file),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: [MAINTENANCE_KEY, "detail", id] });
    },
  });
}

export function useUploadFotoPenanganan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, file }: { id: string; file: File }) =>
      maintenanceService.uploadFotoPenanganan(id, file),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: [MAINTENANCE_KEY, "detail", id] });
    },
  });
}

export function useMaintenanceLogs(id?: string) {
  return useQuery({
    queryKey: [MAINTENANCE_KEY, "logs", id],
    queryFn: () =>
      apiClient.get(`/maintenances/${id}/logs`).then((r) => r.data?.data ?? []),
    enabled: !!id,
  });
}
