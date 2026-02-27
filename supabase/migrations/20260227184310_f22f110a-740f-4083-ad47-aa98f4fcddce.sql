
-- =============================================
-- Feature 6: Staff Role Management Tables
-- =============================================

-- merchant_staff table
CREATE TABLE public.merchant_staff (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id uuid NOT NULL REFERENCES public.merchants(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  staff_role text NOT NULL CHECK (staff_role IN ('caretaker', 'property_manager', 'accountant')),
  display_name text NOT NULL,
  email text NOT NULL,
  phone text,
  property_ids jsonb NOT NULL DEFAULT '[]',
  is_active boolean NOT NULL DEFAULT true,
  invited_at timestamptz NOT NULL DEFAULT now(),
  accepted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(merchant_id, user_id)
);

ALTER TABLE public.merchant_staff ENABLE ROW LEVEL SECURITY;

-- Merchant owner can manage their staff
CREATE POLICY "Merchants manage own staff"
  ON public.merchant_staff FOR ALL
  TO authenticated
  USING (merchant_id IN (SELECT id FROM public.merchants WHERE user_id = auth.uid()))
  WITH CHECK (merchant_id IN (SELECT id FROM public.merchants WHERE user_id = auth.uid()));

-- Staff can read their own record
CREATE POLICY "Staff read own record"
  ON public.merchant_staff FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- updated_at trigger
CREATE TRIGGER set_merchant_staff_updated_at
  BEFORE UPDATE ON public.merchant_staff
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- staff_permissions table
CREATE TABLE public.staff_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id uuid NOT NULL REFERENCES public.merchant_staff(id) ON DELETE CASCADE,
  permission_key text NOT NULL,
  is_granted boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(staff_id, permission_key)
);

ALTER TABLE public.staff_permissions ENABLE ROW LEVEL SECURITY;

-- Merchant owner can manage permissions for their staff
CREATE POLICY "Merchants manage staff permissions"
  ON public.staff_permissions FOR ALL
  TO authenticated
  USING (staff_id IN (
    SELECT ms.id FROM public.merchant_staff ms
    JOIN public.merchants m ON m.id = ms.merchant_id
    WHERE m.user_id = auth.uid()
  ))
  WITH CHECK (staff_id IN (
    SELECT ms.id FROM public.merchant_staff ms
    JOIN public.merchants m ON m.id = ms.merchant_id
    WHERE m.user_id = auth.uid()
  ));

-- Staff can read their own permissions
CREATE POLICY "Staff read own permissions"
  ON public.staff_permissions FOR SELECT
  TO authenticated
  USING (staff_id IN (
    SELECT id FROM public.merchant_staff WHERE user_id = auth.uid()
  ));

-- =============================================
-- Feature 7: Add is_preferred to property_vendor_services
-- =============================================
ALTER TABLE public.property_vendor_services
  ADD COLUMN IF NOT EXISTS is_preferred boolean NOT NULL DEFAULT false;

-- Indexes
CREATE INDEX idx_merchant_staff_merchant_id ON public.merchant_staff(merchant_id);
CREATE INDEX idx_merchant_staff_user_id ON public.merchant_staff(user_id);
CREATE INDEX idx_staff_permissions_staff_id ON public.staff_permissions(staff_id);
