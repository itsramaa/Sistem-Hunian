-- =============================================
-- FIX AUTHENTICATION FLOW: Complete Implementation
-- =============================================

-- 1. Populate subscription_tiers table with default data
INSERT INTO subscription_tiers (name, display_name, price_monthly, price_yearly, max_properties, max_units, max_tenants, trial_days, features, sort_order, is_active, description)
VALUES 
  ('free', 'Free', 0, 0, 1, 5, 5, 14, '["Basic dashboard", "Up to 5 units", "Email support"]'::jsonb, 0, true, 'Perfect for getting started with a small property'),
  ('basic', 'Basic', 99000, 990000, 3, 20, 20, 14, '["Up to 3 properties", "Up to 20 units", "Priority email support", "Monthly reports"]'::jsonb, 1, true, 'Ideal for small property owners'),
  ('pro', 'Pro', 249000, 2490000, 10, 100, 100, 7, '["Up to 10 properties", "Up to 100 units", "Priority support", "Advanced analytics", "Custom branding"]'::jsonb, 2, true, 'Best for growing property managers'),
  ('enterprise', 'Enterprise', 499000, 4990000, -1, -1, -1, 3, '["Unlimited properties", "Unlimited units", "Dedicated support", "API access", "White-label options"]'::jsonb, 3, true, 'For large property management companies')
ON CONFLICT (name) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  price_monthly = EXCLUDED.price_monthly,
  price_yearly = EXCLUDED.price_yearly,
  max_properties = EXCLUDED.max_properties,
  max_units = EXCLUDED.max_units,
  max_tenants = EXCLUDED.max_tenants,
  trial_days = EXCLUDED.trial_days,
  features = EXCLUDED.features,
  sort_order = EXCLUDED.sort_order,
  is_active = EXCLUDED.is_active,
  description = EXCLUDED.description;

-- 2. Replace handle_new_user function with complete version
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    user_role app_role;
    default_tier_id uuid;
    new_merchant_id uuid;
    linked_merchant_id uuid;
BEGIN
    -- Get role from metadata, default to tenant
    user_role := COALESCE(
        (NEW.raw_user_meta_data ->> 'role')::app_role,
        'tenant'::app_role
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
        ORDER BY sort_order 
        LIMIT 1;
        
        IF default_tier_id IS NOT NULL THEN
            INSERT INTO public.merchant_subscriptions (
                merchant_id, 
                tier_id, 
                status, 
                trial_ends_at, 
                current_period_end,
                next_billing_date
            )
            VALUES (
                new_merchant_id,
                default_tier_id, 
                'trialing',
                now() + interval '14 days',
                now() + interval '14 days',
                now() + interval '14 days'
            );
        END IF;
        
    ELSIF user_role = 'vendor' THEN
        -- Create vendor record with contact_email (required field)
        INSERT INTO public.vendors (user_id, business_name, contact_email, verification_status)
        VALUES (
            NEW.id,
            COALESCE(NEW.raw_user_meta_data ->> 'business_name', 'My Business'),
            NEW.email,
            'pending'
        );
        
    ELSIF user_role = 'tenant' THEN
        -- Get linked merchant from metadata if provided
        IF NEW.raw_user_meta_data ->> 'merchant_code' IS NOT NULL THEN
            SELECT id INTO linked_merchant_id
            FROM merchants
            WHERE merchant_code = UPPER(NEW.raw_user_meta_data ->> 'merchant_code');
        END IF;
        
        -- Create tenant record
        INSERT INTO public.tenants (user_id, linked_merchant_id, verification_status)
        VALUES (
            NEW.id,
            linked_merchant_id,
            'pending'
        );
    END IF;

    RETURN NEW;
END;
$$;

-- 3. Create or replace trigger on auth.users
-- Note: This trigger connects to Supabase's auth.users table
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();