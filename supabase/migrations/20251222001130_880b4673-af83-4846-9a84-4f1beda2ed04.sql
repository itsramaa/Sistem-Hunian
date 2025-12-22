-- Invoices table
CREATE TABLE public.invoices (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    invoice_number TEXT NOT NULL,
    contract_id UUID NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
    merchant_id UUID NOT NULL REFERENCES public.merchants(id) ON DELETE CASCADE,
    tenant_user_id UUID NOT NULL,
    amount NUMERIC NOT NULL,
    tax_amount NUMERIC DEFAULT 0,
    total_amount NUMERIC NOT NULL,
    description TEXT,
    line_items JSONB DEFAULT '[]'::jsonb,
    status TEXT NOT NULL DEFAULT 'draft',
    due_date DATE NOT NULL,
    issued_at TIMESTAMP WITH TIME ZONE,
    paid_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

-- Invoice RLS policies
CREATE POLICY "Admins can manage all invoices"
ON public.invoices FOR ALL
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Merchants can manage their invoices"
ON public.invoices FOR ALL
USING (EXISTS (
    SELECT 1 FROM merchants m
    WHERE m.id = invoices.merchant_id
    AND m.user_id = auth.uid()
));

CREATE POLICY "Tenants can view their invoices"
ON public.invoices FOR SELECT
USING (tenant_user_id = auth.uid());

-- Updated_at trigger
CREATE TRIGGER update_invoices_updated_at
BEFORE UPDATE ON public.invoices
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create invoice number sequence function
CREATE OR REPLACE FUNCTION public.generate_invoice_number()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    year_month TEXT;
    seq_num INTEGER;
BEGIN
    year_month := to_char(now(), 'YYYYMM');
    SELECT COALESCE(MAX(CAST(SUBSTRING(invoice_number FROM 8) AS INTEGER)), 0) + 1
    INTO seq_num
    FROM public.invoices
    WHERE invoice_number LIKE 'INV' || year_month || '%';
    
    NEW.invoice_number := 'INV' || year_month || LPAD(seq_num::TEXT, 4, '0');
    RETURN NEW;
END;
$$;

CREATE TRIGGER generate_invoice_number_trigger
BEFORE INSERT ON public.invoices
FOR EACH ROW
WHEN (NEW.invoice_number IS NULL OR NEW.invoice_number = '')
EXECUTE FUNCTION public.generate_invoice_number();