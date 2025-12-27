-- Add missing columns to tenant_invitations
ALTER TABLE tenant_invitations 
ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS accepted_by_user_id UUID REFERENCES auth.users(id);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_tenant_invitations_accepted_by ON tenant_invitations(accepted_by_user_id);