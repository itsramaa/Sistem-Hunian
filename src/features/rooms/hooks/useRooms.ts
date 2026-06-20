import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { roomService } from '../api/roomService';
import { CreateRoomPayload, UpdateRoomPayload } from '../types';

export const ROOMS_KEY = 'rooms';

export function useRooms(search = '', page = 1, limit = 20, property_id?: string, status?: string) {
  return useQuery({
    queryKey: [ROOMS_KEY, { search, page, limit, property_id, status }],
    queryFn: () => roomService.list(search, page, limit, property_id, status),
  });
}

export function useCreateRoom() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateRoomPayload) => roomService.create(payload),
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
      roomService.update(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [ROOMS_KEY] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useDeleteRoom() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => roomService.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [ROOMS_KEY] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}
