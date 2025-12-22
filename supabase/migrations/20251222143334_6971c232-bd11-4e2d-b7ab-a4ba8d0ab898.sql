-- Add notification preferences to tenants table
ALTER TABLE public.tenants 
ADD COLUMN IF NOT EXISTS notification_preferences jsonb DEFAULT '{"payment_reminders": true, "maintenance_updates": true, "new_invoices": true, "contract_updates": true}'::jsonb;

-- Add auto-pay settings to tenants table
ALTER TABLE public.tenants 
ADD COLUMN IF NOT EXISTS auto_pay_enabled boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS auto_pay_day integer DEFAULT 1;