import { apiClient } from '@/shared/lib/axios';
import { AppUser, CreateUserPayload, UpdateUserPayload } from '../types';

export const usersService = {
  async list(): Promise<AppUser[]> {
    const { data } = await apiClient.get<AppUser[]>('/users');
    return Array.isArray(data) ? data : [];
  },

  async create(payload: CreateUserPayload): Promise<AppUser> {
    const { data } = await apiClient.post<AppUser>('/users', payload);
    return data as AppUser;
  },

  async update(id: string, payload: UpdateUserPayload): Promise<AppUser> {
    const { data } = await apiClient.patch<AppUser>(`/users/${id}`, payload);
    return data as AppUser;
  },

  async deactivate(id: string): Promise<void> {
    await apiClient.patch(`/users/${id}/deactivate`);
  },
};
