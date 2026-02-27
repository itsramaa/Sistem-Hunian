
-- Drop trigger first, then function with CASCADE
DROP TRIGGER IF EXISTS on_merchant_created_create_escrow ON public.merchants;
DROP FUNCTION IF EXISTS public.create_merchant_escrow() CASCADE;
