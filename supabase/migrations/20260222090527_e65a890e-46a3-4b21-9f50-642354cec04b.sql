
-- Create rls_alert_settings table
CREATE TABLE public.rls_alert_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id uuid REFERENCES public.merchants(id) ON DELETE CASCADE,
  denial_threshold integer NOT NULL DEFAULT 10,
  window_minutes integer NOT NULL DEFAULT 60,
  alert_cooldown_minutes integer NOT NULL DEFAULT 30,
  last_alert_at timestamptz,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.rls_alert_settings ENABLE ROW LEVEL SECURITY;

-- Admin-only policies
CREATE POLICY "Admins can manage alert settings"
ON public.rls_alert_settings
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Updated_at trigger
CREATE TRIGGER update_rls_alert_settings_updated_at
BEFORE UPDATE ON public.rls_alert_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Seed a default platform-wide config
INSERT INTO public.rls_alert_settings (merchant_id, denial_threshold, window_minutes, alert_cooldown_minutes, is_active)
VALUES (null, 10, 60, 30, true);
