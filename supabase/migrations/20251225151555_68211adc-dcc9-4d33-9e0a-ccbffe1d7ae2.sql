-- Create tenant_merchant_history table for tracking tenant transfers
CREATE TABLE public.tenant_merchant_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_user_id UUID NOT NULL,
  merchant_id UUID NOT NULL REFERENCES merchants(id),
  start_date DATE NOT NULL,
  end_date DATE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'transferred')),
  contract_ids UUID[] DEFAULT '{}',
  transfer_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create index for faster lookups
CREATE INDEX idx_tenant_merchant_history_tenant ON tenant_merchant_history(tenant_user_id);
CREATE INDEX idx_tenant_merchant_history_merchant ON tenant_merchant_history(merchant_id);

-- Enable RLS
ALTER TABLE tenant_merchant_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Merchants can view their tenant history"
ON tenant_merchant_history FOR SELECT
USING (EXISTS (
  SELECT 1 FROM merchants m 
  WHERE m.id = tenant_merchant_history.merchant_id 
  AND m.user_id = auth.uid()
));

CREATE POLICY "Merchants can insert tenant history"
ON tenant_merchant_history FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM merchants m 
  WHERE m.id = tenant_merchant_history.merchant_id 
  AND m.user_id = auth.uid()
));

CREATE POLICY "Merchants can update their tenant history"
ON tenant_merchant_history FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM merchants m 
  WHERE m.id = tenant_merchant_history.merchant_id 
  AND m.user_id = auth.uid()
));

CREATE POLICY "Tenants can view their own history"
ON tenant_merchant_history FOR SELECT
USING (tenant_user_id = auth.uid());

CREATE POLICY "Admins can manage all tenant history"
ON tenant_merchant_history FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add updated_at trigger
CREATE TRIGGER update_tenant_merchant_history_updated_at
BEFORE UPDATE ON tenant_merchant_history
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();