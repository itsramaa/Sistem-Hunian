-- Create a function to check phone uniqueness per role
CREATE OR REPLACE FUNCTION public.check_phone_unique_per_role(_phone TEXT, _role app_role, _exclude_user_id UUID DEFAULT NULL)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF _phone IS NULL OR _phone = '' THEN
    RETURN TRUE;
  END IF;
  
  RETURN NOT EXISTS (
    SELECT 1
    FROM profiles p
    JOIN user_roles ur ON p.user_id = ur.user_id
    WHERE p.phone = _phone
      AND ur.role = _role
      AND (_exclude_user_id IS NULL OR p.user_id != _exclude_user_id)
  );
END;
$$;