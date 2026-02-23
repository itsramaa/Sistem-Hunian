-- Add payment_frequency column to contracts table
ALTER TABLE public.contracts 
ADD COLUMN IF NOT EXISTS payment_frequency text DEFAULT 'monthly' 
CHECK (payment_frequency IN ('monthly', 'semester', 'annual'));

-- Add comment for documentation
COMMENT ON COLUMN public.contracts.payment_frequency IS 'Frekuensi pembayaran: monthly (bulanan), semester (per 6 bulan), annual (tahunan)';