-- Create platform_settings table for admin settings persistence
CREATE TABLE public.platform_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key text NOT NULL UNIQUE,
  setting_value jsonb NOT NULL DEFAULT '{}'::jsonb,
  description text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

-- Only admins can manage platform settings
CREATE POLICY "Admins can manage platform settings"
ON public.platform_settings
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Anyone can read platform settings (for general config like platform name)
CREATE POLICY "Anyone can read platform settings"
ON public.platform_settings
FOR SELECT
USING (true);

-- Add trigger for updated_at
CREATE TRIGGER update_platform_settings_updated_at
BEFORE UPDATE ON public.platform_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default settings
INSERT INTO public.platform_settings (setting_key, setting_value, description) VALUES
  ('general', '{"platformName": "SiHuni", "supportEmail": "support@sihuni.com", "maxPropertiesPerMerchant": 100, "defaultCurrency": "IDR"}'::jsonb, 'General platform settings'),
  ('notifications', '{"emailNotifications": true, "paymentReminders": true, "maintenanceAlerts": true, "weeklyReports": true, "newMerchantAlerts": true}'::jsonb, 'Admin notification preferences'),
  ('security', '{"twoFactorAuth": true, "sessionTimeout": true, "ipWhitelist": false, "auditLogging": true}'::jsonb, 'Security settings')
ON CONFLICT (setting_key) DO NOTHING;