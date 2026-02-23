
-- ===========================================
-- Phase 5: Disaster Risk & Compliance
-- ===========================================

-- 1. Disaster Risk Profiles (per property)
CREATE TABLE public.disaster_risk_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  merchant_id UUID NOT NULL REFERENCES public.merchants(id) ON DELETE CASCADE,
  risk_zone TEXT NOT NULL DEFAULT 'low', -- low, medium, high, critical
  flood_risk TEXT DEFAULT 'low',
  earthquake_risk TEXT DEFAULT 'low',
  landslide_risk TEXT DEFAULT 'low',
  fire_risk TEXT DEFAULT 'low',
  disaster_history JSONB DEFAULT '[]'::jsonb, -- [{date, type, description, damage_cost}]
  mitigation_systems JSONB DEFAULT '[]'::jsonb, -- [{type, status, last_checked}]
  last_assessed_at TIMESTAMPTZ,
  overall_risk_score NUMERIC DEFAULT 0, -- 0-100
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.disaster_risk_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Merchants manage own disaster profiles" ON public.disaster_risk_profiles
  FOR ALL USING (merchant_id IN (SELECT id FROM merchants WHERE user_id = auth.uid()));

CREATE POLICY "Admins full access disaster profiles" ON public.disaster_risk_profiles
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE UNIQUE INDEX idx_disaster_risk_property ON public.disaster_risk_profiles(property_id);

-- 2. Insurance Policies
CREATE TABLE public.insurance_policies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  merchant_id UUID NOT NULL REFERENCES public.merchants(id) ON DELETE CASCADE,
  policy_number TEXT NOT NULL,
  provider TEXT NOT NULL,
  policy_type TEXT NOT NULL, -- property, fire, flood, earthquake, comprehensive
  coverage_amount NUMERIC NOT NULL DEFAULT 0,
  premium_amount NUMERIC NOT NULL DEFAULT 0,
  premium_frequency TEXT DEFAULT 'annual', -- monthly, quarterly, annual
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'active', -- active, expired, cancelled, pending
  coverage_details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.insurance_policies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Merchants manage own insurance" ON public.insurance_policies
  FOR ALL USING (merchant_id IN (SELECT id FROM merchants WHERE user_id = auth.uid()));

CREATE POLICY "Admins full access insurance" ON public.insurance_policies
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- 3. Insurance Claims
CREATE TABLE public.insurance_claims (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  policy_id UUID NOT NULL REFERENCES public.insurance_policies(id) ON DELETE CASCADE,
  merchant_id UUID NOT NULL REFERENCES public.merchants(id) ON DELETE CASCADE,
  claim_date DATE NOT NULL,
  incident_date DATE NOT NULL,
  incident_type TEXT NOT NULL,
  description TEXT,
  claim_amount NUMERIC NOT NULL DEFAULT 0,
  approved_amount NUMERIC,
  status TEXT NOT NULL DEFAULT 'submitted', -- submitted, under_review, approved, rejected, paid
  documents JSONB DEFAULT '[]'::jsonb,
  resolution_notes TEXT,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.insurance_claims ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Merchants manage own claims" ON public.insurance_claims
  FOR ALL USING (merchant_id IN (SELECT id FROM merchants WHERE user_id = auth.uid()));

CREATE POLICY "Admins full access claims" ON public.insurance_claims
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- 4. Compliance Documents
CREATE TABLE public.compliance_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  merchant_id UUID NOT NULL REFERENCES public.merchants(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL, -- imb, pbb, insurance_policy, fire_cert, building_cert, other
  document_name TEXT NOT NULL,
  document_url TEXT,
  issue_date DATE,
  expiry_date DATE,
  status TEXT NOT NULL DEFAULT 'valid', -- valid, expired, pending, missing
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.compliance_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Merchants manage own compliance docs" ON public.compliance_documents
  FOR ALL USING (merchant_id IN (SELECT id FROM merchants WHERE user_id = auth.uid()));

CREATE POLICY "Admins full access compliance docs" ON public.compliance_documents
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- 5. Security Incidents
CREATE TABLE public.security_incidents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  merchant_id UUID NOT NULL REFERENCES public.merchants(id) ON DELETE CASCADE,
  incident_date TIMESTAMPTZ NOT NULL,
  incident_type TEXT NOT NULL, -- theft, vandalism, fire, flood, intrusion, other
  severity TEXT NOT NULL DEFAULT 'low', -- low, medium, high, critical
  description TEXT,
  location_detail TEXT,
  reported_by TEXT,
  police_report_number TEXT,
  damage_cost NUMERIC DEFAULT 0,
  resolution TEXT,
  resolved_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'open', -- open, investigating, resolved, closed
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.security_incidents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Merchants manage own security incidents" ON public.security_incidents
  FOR ALL USING (merchant_id IN (SELECT id FROM merchants WHERE user_id = auth.uid()));

CREATE POLICY "Admins full access security incidents" ON public.security_incidents
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- 6. Property Security Score (calculated)
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS security_score NUMERIC DEFAULT 0;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS disaster_risk_level TEXT DEFAULT 'low';

-- Triggers for updated_at
CREATE TRIGGER update_disaster_risk_profiles_updated_at BEFORE UPDATE ON public.disaster_risk_profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_insurance_policies_updated_at BEFORE UPDATE ON public.insurance_policies FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_insurance_claims_updated_at BEFORE UPDATE ON public.insurance_claims FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_compliance_documents_updated_at BEFORE UPDATE ON public.compliance_documents FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_security_incidents_updated_at BEFORE UPDATE ON public.security_incidents FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
