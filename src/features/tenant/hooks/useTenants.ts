import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { tenantApi } from "../api/tenantApi";
import { CreateTenantPayload } from "../types";

export const TENANTS_KEY = "tenants";

export function useTenants(
  page = 1,
  limit = 20,
  status?: string,
  property_id?: string,
  room_id?: string,
) {
  return useQuery({
    queryKey: [TENANTS_KEY, { page, limit, status, property_id, room_id }],
    queryFn: () => tenantApi.list(page, limit, status, property_id, room_id),
  });
}

export function useTenantById(id: string | undefined) {
  return useQuery({
    queryKey: [TENANTS_KEY, id],
    queryFn: () => tenantApi.getById(id!),
    enabled: !!id,
  });
}

export function useActiveTenants(
  page = 1,
  limit = 20,
  property_id?: string,
  room_id?: string,
) {
  return useTenants(page, limit, "active", property_id, room_id);
}

export function useTenantHistory(
  page = 1,
  limit = 20,
  property_id?: string,
  room_id?: string,
) {
  return useTenants(page, limit, "checked_out", property_id, room_id);
}

export function useCreateTenant() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateTenantPayload) => tenantApi.create(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [TENANTS_KEY] });
      qc.invalidateQueries({ queryKey: ["rooms"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useUpdateTenant() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: Partial<CreateTenantPayload>;
    }) => tenantApi.update(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [TENANTS_KEY] });
    },
  });
}

export function useCheckoutTenant() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      tanggal_keluar,
    }: {
      id: string;
      tanggal_keluar: string;
    }) => tenantApi.checkout(id, tanggal_keluar),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [TENANTS_KEY] });
      qc.invalidateQueries({ queryKey: ["rooms"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}
