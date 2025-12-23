-- Add merchant_code column for tenant registration linking
ALTER TABLE public.merchants 
ADD COLUMN IF NOT EXISTS merchant_code TEXT UNIQUE;

-- Create function to generate unique merchant code
CREATE OR REPLACE FUNCTION generate_merchant_code()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  new_code TEXT;
  code_exists BOOLEAN;
BEGIN
  LOOP
    -- Generate a 6-character alphanumeric code
    new_code := UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 6));
    
    -- Check if code already exists
    SELECT EXISTS(SELECT 1 FROM merchants WHERE merchant_code = new_code) INTO code_exists;
    
    EXIT WHEN NOT code_exists;
  END LOOP;
  
  RETURN new_code;
END;
$$;

-- Trigger to auto-generate merchant code on insert
CREATE OR REPLACE FUNCTION set_merchant_code()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.merchant_code IS NULL THEN
    NEW.merchant_code := generate_merchant_code();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_set_merchant_code ON merchants;
CREATE TRIGGER trigger_set_merchant_code
BEFORE INSERT ON merchants
FOR EACH ROW
EXECUTE FUNCTION set_merchant_code();

-- Update existing merchants with codes
UPDATE merchants 
SET merchant_code = generate_merchant_code() 
WHERE merchant_code IS NULL;

-- Add linked_merchant_id to tenants for tenant-merchant relationship
ALTER TABLE public.tenants 
ADD COLUMN IF NOT EXISTS linked_merchant_id UUID REFERENCES merchants(id);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_tenants_linked_merchant ON tenants(linked_merchant_id);
CREATE INDEX IF NOT EXISTS idx_merchants_merchant_code ON merchants(merchant_code);