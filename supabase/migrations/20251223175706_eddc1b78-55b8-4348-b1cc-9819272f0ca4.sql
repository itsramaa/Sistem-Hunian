-- Add promotional pricing fields to products table
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS promo_price numeric,
ADD COLUMN IF NOT EXISTS promo_start timestamp with time zone,
ADD COLUMN IF NOT EXISTS promo_end timestamp with time zone;

-- Add index for active promotions
CREATE INDEX IF NOT EXISTS idx_products_promo_active 
ON public.products (vendor_id, promo_start, promo_end) 
WHERE promo_price IS NOT NULL;