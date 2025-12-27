-- Add INSERT policy for profiles table so users can insert their own profile
CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

-- Add policy for user_roles - users can view their own roles
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'user_roles' 
    AND policyname = 'Users can view their own roles'
  ) THEN
    CREATE POLICY "Users can view their own roles" 
    ON public.user_roles 
    FOR SELECT 
    TO authenticated 
    USING (auth.uid() = user_id);
  END IF;
END $$;