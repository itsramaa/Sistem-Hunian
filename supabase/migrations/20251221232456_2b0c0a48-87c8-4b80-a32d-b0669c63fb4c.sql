-- Create properties table
CREATE TABLE public.properties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id UUID REFERENCES public.merchants(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    property_type TEXT CHECK (property_type IN ('kost', 'apartment', 'house', 'kontrakan', 'ruko')) NOT NULL,
    address TEXT NOT NULL,
    city TEXT NOT NULL,
    province TEXT NOT NULL,
    postal_code TEXT,
    description TEXT,
    amenities TEXT[] DEFAULT '{}',
    total_units INTEGER DEFAULT 0,
    occupied_units INTEGER DEFAULT 0,
    status TEXT CHECK (status IN ('active', 'inactive', 'maintenance')) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;

-- Merchants can manage their own properties
CREATE POLICY "Merchants can view their own properties"
ON public.properties FOR SELECT TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.merchants m
        WHERE m.id = merchant_id AND m.user_id = auth.uid()
    )
);

CREATE POLICY "Merchants can insert their own properties"
ON public.properties FOR INSERT TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.merchants m
        WHERE m.id = merchant_id AND m.user_id = auth.uid()
    )
);

CREATE POLICY "Merchants can update their own properties"
ON public.properties FOR UPDATE TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.merchants m
        WHERE m.id = merchant_id AND m.user_id = auth.uid()
    )
);

CREATE POLICY "Merchants can delete their own properties"
ON public.properties FOR DELETE TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.merchants m
        WHERE m.id = merchant_id AND m.user_id = auth.uid()
    )
);

CREATE POLICY "Admins can manage all properties"
ON public.properties FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Create units table
CREATE TABLE public.units (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE NOT NULL,
    unit_number TEXT NOT NULL,
    floor INTEGER,
    unit_type TEXT CHECK (unit_type IN ('single', 'double', 'studio', 'suite', 'standard')) DEFAULT 'standard',
    size_sqm NUMERIC(10,2),
    rent_amount NUMERIC(15,2) NOT NULL,
    deposit_amount NUMERIC(15,2),
    status TEXT CHECK (status IN ('available', 'occupied', 'reserved', 'maintenance')) DEFAULT 'available',
    amenities TEXT[] DEFAULT '{}',
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(property_id, unit_number)
);

ALTER TABLE public.units ENABLE ROW LEVEL SECURITY;

-- RLS for units (through property ownership)
CREATE POLICY "Merchants can view their units"
ON public.units FOR SELECT TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.properties p
        JOIN public.merchants m ON m.id = p.merchant_id
        WHERE p.id = property_id AND m.user_id = auth.uid()
    )
);

CREATE POLICY "Merchants can insert their units"
ON public.units FOR INSERT TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.properties p
        JOIN public.merchants m ON m.id = p.merchant_id
        WHERE p.id = property_id AND m.user_id = auth.uid()
    )
);

CREATE POLICY "Merchants can update their units"
ON public.units FOR UPDATE TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.properties p
        JOIN public.merchants m ON m.id = p.merchant_id
        WHERE p.id = property_id AND m.user_id = auth.uid()
    )
);

CREATE POLICY "Merchants can delete their units"
ON public.units FOR DELETE TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.properties p
        JOIN public.merchants m ON m.id = p.merchant_id
        WHERE p.id = property_id AND m.user_id = auth.uid()
    )
);

CREATE POLICY "Admins can manage all units"
ON public.units FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Triggers for updated_at
CREATE TRIGGER update_properties_updated_at
    BEFORE UPDATE ON public.properties
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_units_updated_at
    BEFORE UPDATE ON public.units
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to update property unit counts
CREATE OR REPLACE FUNCTION public.update_property_unit_counts()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        UPDATE public.properties SET 
            total_units = (SELECT COUNT(*) FROM public.units WHERE property_id = OLD.property_id),
            occupied_units = (SELECT COUNT(*) FROM public.units WHERE property_id = OLD.property_id AND status = 'occupied')
        WHERE id = OLD.property_id;
        RETURN OLD;
    ELSE
        UPDATE public.properties SET 
            total_units = (SELECT COUNT(*) FROM public.units WHERE property_id = NEW.property_id),
            occupied_units = (SELECT COUNT(*) FROM public.units WHERE property_id = NEW.property_id AND status = 'occupied')
        WHERE id = NEW.property_id;
        RETURN NEW;
    END IF;
END;
$$;

CREATE TRIGGER update_property_counts_on_unit_change
    AFTER INSERT OR UPDATE OR DELETE ON public.units
    FOR EACH ROW EXECUTE FUNCTION public.update_property_unit_counts();