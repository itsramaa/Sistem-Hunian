
-- Add property_id column to tenant_invitations
ALTER TABLE public.tenant_invitations
ADD COLUMN property_id uuid REFERENCES public.properties(id) ON DELETE SET NULL;

-- Make unit_id nullable
ALTER TABLE public.tenant_invitations
ALTER COLUMN unit_id DROP NOT NULL;
