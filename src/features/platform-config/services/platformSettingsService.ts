import { apiClient } from "@/lib/axios";
import { PlatformSetting } from "../types/platform-settings";

export const platformSettingsService = {
  fetchSettings: async (): Promise<PlatformSetting[]> => {
    // TODO: Migrate to Go endpoint — GET /v1/platform-settings
    const response = await apiClient.get('/platform-settings');
    return (response.data.data || []) as PlatformSetting[];
  },

  updateSetting: async (key: string, value: Record<string, any>): Promise<void> => {
    // TODO: Migrate to Go endpoint — PATCH /v1/platform-settings/:key
    await apiClient.patch(`/platform-settings/${key}`, { setting_value: value });
  },

  upsertSetting: async (key: string, value: Record<string, any>, description?: string): Promise<void> => {
    // TODO: Migrate to Go endpoint — PUT /v1/platform-settings/:key
    await apiClient.put(`/platform-settings/${key}`, {
      setting_value: value,
      description: description || 'System configuration',
    });
  },
};
