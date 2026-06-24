import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { maintenanceApi } from "../api/maintenanceApi";
import { CreateMaintenancePayload, UpdateMaintenancePayload } from "../types";

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
      maintenanceApi.list(page, limit, status, property_id, room_id),
  });
}

export function useMaintenanceById(id?: string) {
  return useQuery({
    queryKey: [MAINTENANCE_KEY, "detail", id],
    queryFn: () => maintenanceApi.getById(id!),
    enabled: !!id,
  });
}

export function useCreateMaintenance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateMaintenancePayload) =>
      maintenanceApi.create(payload),
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
    }) => maintenanceApi.update(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: [MAINTENANCE_KEY] }),
  });
}

export function useUploadFotoKerusakan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, file }: { id: string; file: File }) =>
      maintenanceApi.uploadFotoKerusakan(id, file),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: [MAINTENANCE_KEY, "detail", id] });
    },
  });
}

export function useUploadFotoPenanganan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, file }: { id: string; file: File }) =>
      maintenanceApi.uploadFotoPenanganan(id, file),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: [MAINTENANCE_KEY, "detail", id] });
    },
  });
}

export function useMaintenanceLogs(id?: string) {
  return useQuery({
    queryKey: [MAINTENANCE_KEY, "logs", id],
    queryFn: () => maintenanceApi.getLogs(id!),
    enabled: !!id,
  });
}
