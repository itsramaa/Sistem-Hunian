import { supabase } from "@/lib/integrations/supabase/client";
import { PlatformSetting } from "../types/platform-settings";

export const platformSettingsService = {
  fetchSettings: async (): Promise<PlatformSetting[]> => {
    const { data, error } = await supabase
      .from('platform_settings')
      .select('*');
    if (error) throw error;
    return (data || []) as PlatformSetting[];
  },

  updateSetting: async (key: string, value: Record<string, any>): Promise<void> => {
    const { error } = await supabase
      .from('platform_settings')
      .update({ setting_value: value })
      .eq('setting_key', key);
    if (error) throw error;
  },

  upsertSetting: async (key: string, value: Record<string, any>, description?: string): Promise<void> => {
    const { data: existing, error: fetchError } = await supabase
      .from('platform_settings')
      .select('id')
      .eq('setting_key', key)
      .maybeSingle();

    if (fetchError) throw fetchError;

    if (existing) {
      const { error } = await supabase
        .from('platform_settings')
        .update({ setting_value: value })
        .eq('setting_key', key);
      if (error) throw error;
    } else {
      const { error } = await supabase
        .from('platform_settings')
        .insert({ 
          setting_key: key, 
          setting_value: value, 
          description: description || 'System configuration' 
        });
      if (error) throw error;
    }
  }
};
