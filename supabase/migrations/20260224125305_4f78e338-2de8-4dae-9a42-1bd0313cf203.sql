
-- Issue 4: Make tenant_user_id nullable for merchant-initiated maintenance
ALTER TABLE maintenance_requests ALTER COLUMN tenant_user_id DROP NOT NULL;

-- Issue 6: Create property_renovations table for historical renovation costs
CREATE TABLE property_renovations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  merchant_id uuid NOT NULL REFERENCES merchants(id),
  renovation_date date NOT NULL DEFAULT CURRENT_DATE,
  cost numeric NOT NULL DEFAULT 0,
  description text,
  category text DEFAULT 'general',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE property_renovations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Merchants can manage own renovations" ON property_renovations
  FOR ALL USING (
    merchant_id IN (SELECT id FROM merchants WHERE user_id = auth.uid())
  );

CREATE TRIGGER update_property_renovations_updated_at
  BEFORE UPDATE ON property_renovations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-sum trigger: update properties.renovation_cost when renovations change
CREATE OR REPLACE FUNCTION update_property_renovation_total()
  RETURNS trigger
  LANGUAGE plpgsql
  SET search_path TO 'public'
AS $$
BEGIN
  UPDATE properties SET renovation_cost = (
    SELECT COALESCE(SUM(cost), 0) FROM property_renovations WHERE property_id = COALESCE(NEW.property_id, OLD.property_id)
  ) WHERE id = COALESCE(NEW.property_id, OLD.property_id);
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER sync_renovation_cost_on_insert
  AFTER INSERT ON property_renovations
  FOR EACH ROW EXECUTE FUNCTION update_property_renovation_total();

CREATE TRIGGER sync_renovation_cost_on_update
  AFTER UPDATE ON property_renovations
  FOR EACH ROW EXECUTE FUNCTION update_property_renovation_total();

CREATE TRIGGER sync_renovation_cost_on_delete
  AFTER DELETE ON property_renovations
  FOR EACH ROW EXECUTE FUNCTION update_property_renovation_total();
