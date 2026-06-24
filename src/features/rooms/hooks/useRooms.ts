import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { roomApi as roomApi } from '../api/roomApi';
import { CreateRoomPayload, UpdateRoomPayload } from '../types';

export const ROOMS_KEY = 'rooms';

export function useRooms(search = '', page = 1, limit = 20, property_id?: string, status?: string) {
  return useQuery({
    queryKey: [ROOMS_KEY, { search, page, limit, property_id, status }],
    queryFn: () => roomApi.list(search, page, limit, property_id, status),
  });
}

export function useRoomById(id: string | undefined) {
  return useQuery({
    queryKey: [ROOMS_KEY, id],
    queryFn: () => roomApi.getById(id!),
    enabled: !!id,
  });
}

export function useCreateRoom() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateRoomPayload) => roomApi.create(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [ROOMS_KEY] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useUpdateRoom() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateRoomPayload }) =>
      roomApi.update(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [ROOMS_KEY] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useDeleteRoom() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => roomApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [ROOMS_KEY] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}
