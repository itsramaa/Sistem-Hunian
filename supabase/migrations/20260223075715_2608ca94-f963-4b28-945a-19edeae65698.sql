
-- Update handle_new_user function to default role to 'merchant' instead of 'tenant'
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
    user_role app_role;
    default_tier_id uuid;
    new_merchant_id uuid;
    linked_merchant_id uuid;
BEGIN
    -- Get role from metadata, default to merchant (changed from tenant)
    user_role := COALESCE(
        (NEW.raw_user_meta_data ->> 'role')::app_role,
        'merchant'::app_role
    );

    -- Insert profile with phone
    INSERT INTO public.profiles (user_id, email, full_name, phone)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''),
        NEW.raw_user_meta_data ->> 'phone'
    );

    -- Insert user role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, user_role);

    -- Handle role-specific inserts
    IF user_role = 'merchant' THEN
        -- Create merchant record
        INSERT INTO public.merchants (user_id, business_name)
        VALUES (
            NEW.id, 
            COALESCE(NEW.raw_user_meta_data ->> 'business_name', 'My Business')
        )
        RETURNING id INTO new_merchant_id;
        
        -- Create escrow account for merchant
        INSERT INTO public.escrow_accounts (merchant_id, balance, pending_balance)
        VALUES (new_merchant_id, 0, 0);
        
        -- Create default free subscription if tier exists
        SELECT id INTO default_tier_id 
        FROM subscription_tiers 
        WHERE name = 'free' AND is_active = true
        LIMIT 1;
        
        IF default_tier_id IS NOT NULL THEN
            INSERT INTO public.merchant_subscriptions (
                merchant_id, tier_id, status, 
                current_period_start, current_period_end
            )
            VALUES (
                new_merchant_id, default_tier_id, 'active',
                now(), now() + interval '100 years'
            );
        END IF;
    ELSIF user_role = 'vendor' THEN
        -- Create vendor record
        INSERT INTO public.vendors (user_id, business_name, contact_email)
        VALUES (
            NEW.id,
            COALESCE(NEW.raw_user_meta_data ->> 'business_name', 'My Vendor'),
            NEW.email
        );
    ELSIF user_role = 'tenant' THEN
        -- Handle tenant with merchant code
        linked_merchant_id := NULL;
        IF NEW.raw_user_meta_data ->> 'merchant_code' IS NOT NULL THEN
            SELECT id INTO linked_merchant_id
            FROM merchants
            WHERE merchant_code = UPPER(NEW.raw_user_meta_data ->> 'merchant_code')
            AND verification_status != 'suspended';
        END IF;
    END IF;

    RETURN NEW;
END;
$$;
