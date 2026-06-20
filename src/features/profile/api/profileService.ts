import { apiClient } from '@/shared/lib/axios';
import { Profile, TenantProfile, UpdateProfilePayload, UpdateTenantPayload } from '../types';

export const profileService = {
  async getProfile(userId: string): Promise<Profile | null> {
    const response = await apiClient.get(`/profiles/${userId}`);
    return response.data.data as Profile;
  },

  async getTenantProfile(userId: string): Promise<TenantProfile | null> {
    const response = await apiClient.get(`/tenants/${userId}`);
    return response.data.data as TenantProfile;
  },

  async updateProfile(userId: string, payload: UpdateProfilePayload): Promise<Profile> {
    const response = await apiClient.put(`/profiles/${userId}`, payload);
    return response.data.data as Profile;
  },

  async updateTenantProfile(userId: string, payload: UpdateTenantPayload): Promise<TenantProfile> {
    const response = await apiClient.put(`/tenants/${userId}`, payload);
    return response.data.data as TenantProfile;
  },

  async uploadKtp(_userId: string, _file: File): Promise<string> {
    // TODO: Migrate supabase.storage upload to REST API endpoint
    // Previously: supabase.storage.from('verification-documents').upload(filePath, file)
    throw new Error('KTP upload not yet migrated to REST API');
  },
};
