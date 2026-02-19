export interface PlatformSetting {
  id: string;
  setting_key: string;
  setting_value: Record<string, any>;
  description: string | null;
}

export interface GeneralSettings {
  platformName: string;
  supportEmail: string;
  maxPropertiesPerMerchant: number;
  defaultCurrency: string;
}

export interface NotificationSettings {
  emailNotifications: boolean;
  paymentReminders: boolean;
  maintenanceAlerts: boolean;
  weeklyReports: boolean;
  newMerchantAlerts: boolean;
}

export interface SecuritySettings {
  twoFactorAuth: boolean;
  sessionTimeout: boolean;
  ipWhitelist: boolean;
  auditLogging: boolean;
}
