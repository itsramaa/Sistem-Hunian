-- Create trigger on_auth_user_created to call handle_new_user after signup
-- This is the CRITICAL missing piece that was causing profiles/roles not to be created

DO $$
BEGIN
  -- Drop trigger if exists (to avoid errors on re-run)
  DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
  
  -- Create the trigger
  CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();
    
  RAISE NOTICE 'Trigger on_auth_user_created created successfully';
END $$;

-- Fix existing users who don't have profiles or roles
-- Insert missing profiles for users that exist in auth.users but not in profiles
INSERT INTO public.profiles (user_id, email, full_name)
SELECT 
  u.id,
  u.email,
  COALESCE(u.raw_user_meta_data ->> 'full_name', '')
FROM auth.users u
LEFT JOIN public.profiles p ON p.user_id = u.id
WHERE p.user_id IS NULL;

-- Insert missing user_roles for users that exist in auth.users but not in user_roles
-- Default to 'tenant' role if no role specified in metadata
INSERT INTO public.user_roles (user_id, role)
SELECT 
  u.id,
  COALESCE(
    (u.raw_user_meta_data ->> 'role')::public.app_role,
    'tenant'::public.app_role
  )
FROM auth.users u
LEFT JOIN public.user_roles ur ON ur.user_id = u.id
WHERE ur.user_id IS NULL;

-- Insert missing tenant records for users with tenant role
INSERT INTO public.tenants (user_id, verification_status)
SELECT 
  ur.user_id,
  'pending'
FROM public.user_roles ur
LEFT JOIN public.tenants t ON t.user_id = ur.user_id
WHERE ur.role = 'tenant' AND t.user_id IS NULL;