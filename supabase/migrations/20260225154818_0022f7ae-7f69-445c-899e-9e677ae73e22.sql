
-- Add asset_type column to facilities table
ALTER TABLE public.facilities ADD COLUMN IF NOT EXISTS asset_type TEXT DEFAULT 'lainnya';

-- Create guardian_property_assignments table
CREATE TABLE IF NOT EXISTS public.guardian_property_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  guardian_id UUID NOT NULL REFERENCES public.property_guardians(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'primary',
  assigned_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(guardian_id, property_id)
);

-- RLS for guardian_property_assignments
ALTER TABLE public.guardian_property_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Merchants manage own guardian assignments"
  ON public.guardian_property_assignments
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.property_guardians pg
      JOIN public.properties p ON p.id = guardian_property_assignments.property_id
      JOIN public.merchants m ON m.id = p.merchant_id
      WHERE pg.id = guardian_property_assignments.guardian_id
      AND m.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.property_guardians pg
      JOIN public.properties p ON p.id = guardian_property_assignments.property_id
      JOIN public.merchants m ON m.id = p.merchant_id
      WHERE pg.id = guardian_property_assignments.guardian_id
      AND m.user_id = auth.uid()
    )
  );
