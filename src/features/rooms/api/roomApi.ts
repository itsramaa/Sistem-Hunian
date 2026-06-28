import { apiClient } from '@/shared/lib/axios';
import { CreateRoomPayload, Room, RoomDetail, UpdateRoomPayload } from '../types';

export const roomApi = {
  async list(search = '', page = 1, limit = 20, property_id?: string, status?: string) {
    const params: Record<string, any> = { search, page, limit };
    if (property_id) params.property_id = property_id;
    if (status) params.status = status;

    const { data } = await apiClient.get<any>('/rooms', { params });
    return { rooms: data?.data ?? [], pagination: data?.pagination ?? null };
  },

  async getById(id: string): Promise<RoomDetail> {
    const { data } = await apiClient.get<any>(`/rooms/${id}`);
    return data as RoomDetail;
  },

  async create(payload: CreateRoomPayload): Promise<Room> {
    const { data } = await apiClient.post<Room>('/rooms', payload);
    return data as Room;
  },

  async update(id: string, payload: UpdateRoomPayload): Promise<Room> {
    const { data } = await apiClient.put<Room>(`/rooms/${id}`, payload);
    return data as Room;
  },

  async remove(id: string): Promise<void> {
    await apiClient.delete(`/rooms/${id}`);
  },
};
