-- Add current_unit_id column to tenants table
ALTER TABLE public.tenants 
ADD COLUMN IF NOT EXISTS current_unit_id UUID REFERENCES public.units(id);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_tenants_current_unit ON public.tenants(current_unit_id);

-- Fix existing tenant user (tenant@gmail.com) - add missing profiles and user_roles
INSERT INTO public.profiles (user_id, email, full_name)
SELECT '0c1b2849-4b7d-4464-9633-9d753bd9bfc1', 'tenant@gmail.com', 'tenant'
WHERE NOT EXISTS (
  SELECT 1 FROM public.profiles WHERE user_id = '0c1b2849-4b7d-4464-9633-9d753bd9bfc1'
);

INSERT INTO public.user_roles (user_id, role)
SELECT '0c1b2849-4b7d-4464-9633-9d753bd9bfc1', 'tenant'
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_roles WHERE user_id = '0c1b2849-4b7d-4464-9633-9d753bd9bfc1'
);