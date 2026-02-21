export interface PlatformSetting {
  id: string;
  setting_key: string;
  setting_value: Record<string, any>;
  description: string | null;
  created_at: string;
  updated_at: string;
}
