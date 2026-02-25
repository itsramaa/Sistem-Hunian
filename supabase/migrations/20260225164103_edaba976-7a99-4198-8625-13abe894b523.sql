
-- rule_types (master template)
CREATE TABLE public.rule_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID NOT NULL REFERENCES public.merchants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT DEFAULT 'umum',
  default_scope TEXT DEFAULT 'property',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(merchant_id, name)
);

-- rules (instance per property/unit)
CREATE TABLE public.rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID NOT NULL REFERENCES public.merchants(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  unit_id UUID REFERENCES public.units(id) ON DELETE SET NULL,
  rule_type_id UUID REFERENCES public.rule_types(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  is_overridable BOOLEAN DEFAULT false,
  effective_from DATE DEFAULT CURRENT_DATE,
  effective_until DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- rule_acknowledgements (tenant agreement tracking)
CREATE TABLE public.rule_acknowledgements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_id UUID NOT NULL REFERENCES public.rules(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL,
  acknowledged_at TIMESTAMPTZ DEFAULT now()
);

-- Triggers for updated_at
CREATE TRIGGER update_rule_types_updated_at
  BEFORE UPDATE ON public.rule_types
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_rules_updated_at
  BEFORE UPDATE ON public.rules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RLS
ALTER TABLE public.rule_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rule_acknowledgements ENABLE ROW LEVEL SECURITY;

-- RLS policies for rule_types
CREATE POLICY "Merchants manage own rule_types" ON public.rule_types
  FOR ALL USING (
    merchant_id IN (SELECT id FROM public.merchants WHERE user_id = auth.uid())
  );

-- RLS policies for rules
CREATE POLICY "Merchants manage own rules" ON public.rules
  FOR ALL USING (
    merchant_id IN (SELECT id FROM public.merchants WHERE user_id = auth.uid())
  );

-- RLS policies for rule_acknowledgements
CREATE POLICY "Merchants view acknowledgements for own rules" ON public.rule_acknowledgements
  FOR SELECT USING (
    rule_id IN (SELECT id FROM public.rules WHERE merchant_id IN (SELECT id FROM public.merchants WHERE user_id = auth.uid()))
  );

CREATE POLICY "Tenants acknowledge rules" ON public.rule_acknowledgements
  FOR INSERT WITH CHECK (tenant_id = auth.uid());

-- Indexes
CREATE INDEX idx_rules_property_id ON public.rules(property_id);
CREATE INDEX idx_rules_unit_id ON public.rules(unit_id);
CREATE INDEX idx_rules_merchant_id ON public.rules(merchant_id);
CREATE INDEX idx_rule_types_merchant_id ON public.rule_types(merchant_id);
