import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { confirmationApi } from "../api/confirmationApi";

import {
  ConfirmDPPayload,
  CreateConfirmationPayload,
  UpdateConfirmationPayload,
} from "../types";

export const CONFIRMATIONS_KEY = "confirmations";

export function useConfirmations(
  page = 1,
  limit = 20,
  status?: string,
  property_id?: string,
) {
  return useQuery({
    queryKey: [CONFIRMATIONS_KEY, { page, limit, status, property_id }],
    queryFn: () => confirmationApi.list(page, limit, status, property_id),
    staleTime: 0,
  });
}

export function useCreateConfirmation() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateConfirmationPayload) =>
      confirmationApi.create(payload),

    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [CONFIRMATIONS_KEY] });

      qc.invalidateQueries({ queryKey: ["rooms"] });

      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useExpireConfirmation() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => confirmationApi.expire(id),

    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [CONFIRMATIONS_KEY] });

      qc.invalidateQueries({ queryKey: ["rooms"] });

      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useConfirmDP() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: ConfirmDPPayload }) =>
      confirmationApi.confirmDP(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [CONFIRMATIONS_KEY] });
      qc.invalidateQueries({ queryKey: ["rooms"] });
      qc.invalidateQueries({ queryKey: ["tenants"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useUpdateDeadline() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdateConfirmationPayload;
    }) => confirmationApi.updateDeadline(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [CONFIRMATIONS_KEY] });
    },
  });
}
