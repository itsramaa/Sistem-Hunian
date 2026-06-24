import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { propertyApi } from "../api/propertyApi";
import { CreatePropertyPayload, UpdatePropertyPayload } from "../types";

export const PROPERTIES_KEY = "properties";

export function useProperties(search = "", page = 1, limit = 20) {
  return useQuery({
    queryKey: [PROPERTIES_KEY, { search, page, limit }],
    queryFn: () => propertyApi.list(search, page, limit),
  });
}

export function usePropertyById(id: string | undefined) {
  return useQuery({
    queryKey: [PROPERTIES_KEY, id],
    queryFn: () => propertyApi.getById(id!),
    enabled: !!id,
  });
}

export function useCreateProperty() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreatePropertyPayload) => propertyApi.create(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: [PROPERTIES_KEY] }),
  });
}

export function useUpdateProperty() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdatePropertyPayload;
    }) => propertyApi.update(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: [PROPERTIES_KEY] }),
  });
}

export function useDeleteProperty() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => propertyApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: [PROPERTIES_KEY] }),
  });
}
