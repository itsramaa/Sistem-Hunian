-- Add missing columns to maintenance_requests
ALTER TABLE maintenance_requests ADD COLUMN IF NOT EXISTS preferred_schedule TIMESTAMP WITH TIME ZONE;
ALTER TABLE maintenance_requests ADD COLUMN IF NOT EXISTS sla_deadline TIMESTAMP WITH TIME ZONE;
ALTER TABLE maintenance_requests ADD COLUMN IF NOT EXISTS assigned_vendor_id UUID REFERENCES vendors(id);
ALTER TABLE maintenance_requests ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE maintenance_requests ADD COLUMN IF NOT EXISTS started_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE maintenance_requests ADD COLUMN IF NOT EXISTS completion_notes TEXT;
ALTER TABLE maintenance_requests ADD COLUMN IF NOT EXISTS completion_photos TEXT[];

-- Create maintenance_timeline table
CREATE TABLE IF NOT EXISTS maintenance_timeline (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  maintenance_request_id UUID REFERENCES maintenance_requests(id) ON DELETE CASCADE NOT NULL,
  status TEXT NOT NULL,
  message TEXT NOT NULL,
  actor_id UUID,
  actor_role TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on maintenance_timeline
ALTER TABLE maintenance_timeline ENABLE ROW LEVEL SECURITY;

-- RLS Policies for maintenance_timeline
CREATE POLICY "Admins can manage all timeline entries"
ON maintenance_timeline FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view timeline for their requests"
ON maintenance_timeline FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM maintenance_requests mr
    WHERE mr.id = maintenance_timeline.maintenance_request_id
    AND (
      mr.tenant_user_id = auth.uid()
      OR EXISTS (SELECT 1 FROM merchants m WHERE m.id = mr.merchant_id AND m.user_id = auth.uid())
      OR EXISTS (SELECT 1 FROM vendors v WHERE v.id = mr.assigned_vendor_id AND v.user_id = auth.uid())
    )
  )
);

CREATE POLICY "Users can insert timeline entries for their requests"
ON maintenance_timeline FOR INSERT
WITH CHECK (
  actor_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM maintenance_requests mr
    WHERE mr.id = maintenance_timeline.maintenance_request_id
    AND (
      mr.tenant_user_id = auth.uid()
      OR EXISTS (SELECT 1 FROM merchants m WHERE m.id = mr.merchant_id AND m.user_id = auth.uid())
      OR EXISTS (SELECT 1 FROM vendors v WHERE v.id = mr.assigned_vendor_id AND v.user_id = auth.uid())
    )
  )
);

-- Create maintenance_reviews table
CREATE TABLE IF NOT EXISTS maintenance_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  maintenance_request_id UUID REFERENCES maintenance_requests(id) ON DELETE CASCADE NOT NULL UNIQUE,
  vendor_id UUID REFERENCES vendors(id) NOT NULL,
  tenant_user_id UUID NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  photos TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on maintenance_reviews
ALTER TABLE maintenance_reviews ENABLE ROW LEVEL SECURITY;

-- RLS Policies for maintenance_reviews
CREATE POLICY "Admins can manage all reviews"
ON maintenance_reviews FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view reviews"
ON maintenance_reviews FOR SELECT
USING (true);

CREATE POLICY "Tenants can create reviews for their completed requests"
ON maintenance_reviews FOR INSERT
WITH CHECK (
  tenant_user_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM maintenance_requests mr
    WHERE mr.id = maintenance_reviews.maintenance_request_id
    AND mr.tenant_user_id = auth.uid()
    AND mr.status = 'completed'
  )
);

-- Create SLA calculation function
CREATE OR REPLACE FUNCTION calculate_sla_deadline(priority TEXT)
RETURNS TIMESTAMP WITH TIME ZONE AS $$
BEGIN
  RETURN CASE priority
    WHEN 'urgent' THEN NOW() + INTERVAL '4 hours'
    WHEN 'high' THEN NOW() + INTERVAL '24 hours'
    WHEN 'medium' THEN NOW() + INTERVAL '72 hours'
    WHEN 'low' THEN NOW() + INTERVAL '7 days'
    ELSE NOW() + INTERVAL '72 hours'
  END;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger to auto-set SLA deadline on insert
CREATE OR REPLACE FUNCTION set_maintenance_sla_deadline()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.sla_deadline IS NULL THEN
    NEW.sla_deadline := calculate_sla_deadline(NEW.priority);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS trigger_set_sla_deadline ON maintenance_requests;
CREATE TRIGGER trigger_set_sla_deadline
BEFORE INSERT ON maintenance_requests
FOR EACH ROW EXECUTE FUNCTION set_maintenance_sla_deadline();

-- Create vendor rating update function and trigger
CREATE OR REPLACE FUNCTION update_vendor_maintenance_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE vendors 
  SET rating = (
    SELECT COALESCE(AVG(rating), 0) FROM maintenance_reviews WHERE vendor_id = NEW.vendor_id
  )
  WHERE id = NEW.vendor_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS trigger_update_vendor_maintenance_rating ON maintenance_reviews;
CREATE TRIGGER trigger_update_vendor_maintenance_rating
AFTER INSERT ON maintenance_reviews
FOR EACH ROW EXECUTE FUNCTION update_vendor_maintenance_rating();

-- Enable realtime for maintenance tables
ALTER PUBLICATION supabase_realtime ADD TABLE maintenance_timeline;