CREATE EXTENSION IF NOT EXISTS "pg_cron" WITH SCHEMA "pg_catalog";
CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";
CREATE EXTENSION IF NOT EXISTS "pg_net" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "plpgsql" WITH SCHEMA "pg_catalog";
CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";
BEGIN;

--
-- PostgreSQL database dump
--


-- Dumped from database version 17.6
-- Dumped by pg_dump version 18.1

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--



--
-- Name: app_role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.app_role AS ENUM (
    'admin',
    'merchant',
    'tenant',
    'vendor'
);


--
-- Name: calculate_sla_deadline(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.calculate_sla_deadline(priority text) RETURNS timestamp with time zone
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
BEGIN
  RETURN CASE priority
    WHEN 'urgent' THEN NOW() + INTERVAL '4 hours'
    WHEN 'high' THEN NOW() + INTERVAL '24 hours'
    WHEN 'medium' THEN NOW() + INTERVAL '72 hours'
    WHEN 'low' THEN NOW() + INTERVAL '7 days'
    ELSE NOW() + INTERVAL '72 hours'
  END;
END;
$$;


--
-- Name: create_merchant_escrow(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.create_merchant_escrow() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
    INSERT INTO public.escrow_accounts (merchant_id, balance, pending_balance)
    VALUES (NEW.id, 0, 0);
    RETURN NEW;
END;
$$;


--
-- Name: generate_invoice_number(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.generate_invoice_number() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
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


--
-- Name: generate_merchant_code(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.generate_merchant_code() RETURNS text
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  new_code TEXT;
  code_exists BOOLEAN;
BEGIN
  LOOP
    new_code := UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 6));
    SELECT EXISTS(SELECT 1 FROM public.merchants WHERE merchant_code = new_code) INTO code_exists;
    EXIT WHEN NOT code_exists;
  END LOOP;
  RETURN new_code;
END;
$$;


--
-- Name: generate_order_number(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.generate_order_number() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
    year_month TEXT;
    seq_num INTEGER;
BEGIN
    year_month := to_char(now(), 'YYYYMM');
    SELECT COALESCE(MAX(CAST(SUBSTRING(order_number FROM 8) AS INTEGER)), 0) + 1
    INTO seq_num
    FROM public.orders
    WHERE order_number LIKE 'ORD' || year_month || '%';
    
    NEW.order_number := 'ORD' || year_month || LPAD(seq_num::TEXT, 4, '0');
    RETURN NEW;
END;
$$;


--
-- Name: generate_referral_code(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.generate_referral_code() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
    code TEXT;
    exists_count INTEGER;
BEGIN
    LOOP
        code := upper(substring(md5(random()::text) from 1 for 8));
        SELECT COUNT(*) INTO exists_count FROM public.referrals WHERE referral_code = code;
        EXIT WHEN exists_count = 0;
    END LOOP;
    NEW.referral_code := code;
    RETURN NEW;
END;
$$;


--
-- Name: generate_voucher_code(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.generate_voucher_code() RETURNS text
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  new_code TEXT;
  code_exists BOOLEAN;
BEGIN
  LOOP
    new_code := 'VCHR-' || UPPER(SUBSTRING(md5(random()::text), 1, 8));
    SELECT EXISTS(SELECT 1 FROM vouchers WHERE code = new_code) INTO code_exists;
    EXIT WHEN NOT code_exists;
  END LOOP;
  RETURN new_code;
END;
$$;


--
-- Name: get_user_role(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_user_role(_user_id uuid) RETURNS public.app_role
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT role
  FROM public.user_roles
  WHERE user_id = _user_id
  LIMIT 1
$$;


--
-- Name: handle_new_user(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_new_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
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


--
-- Name: has_role(uuid, public.app_role); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.has_role(_user_id uuid, _role public.app_role) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;


--
-- Name: set_cancellation_effective_date(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.set_cancellation_effective_date() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  -- Only set when cancellation_requested_at is newly set and effective_date is null
  IF NEW.cancellation_requested_at IS NOT NULL 
     AND OLD.cancellation_requested_at IS NULL 
     AND NEW.cancellation_effective_date IS NULL THEN
    NEW.cancellation_effective_date := COALESCE(
      NEW.current_period_end, 
      (NOW() + INTERVAL '1 month')::timestamp with time zone
    );
  END IF;
  RETURN NEW;
END;
$$;


--
-- Name: set_maintenance_sla_deadline(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.set_maintenance_sla_deadline() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
BEGIN
  IF NEW.sla_deadline IS NULL THEN
    NEW.sla_deadline := calculate_sla_deadline(NEW.priority);
  END IF;
  RETURN NEW;
END;
$$;


--
-- Name: set_merchant_code(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.set_merchant_code() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  IF NEW.merchant_code IS NULL THEN
    NEW.merchant_code := public.generate_merchant_code();
  END IF;
  RETURN NEW;
END;
$$;


--
-- Name: update_property_unit_counts(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_property_unit_counts() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
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


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;


--
-- Name: update_vendor_maintenance_rating(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_vendor_maintenance_rating() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
BEGIN
  UPDATE vendors 
  SET rating = (
    SELECT COALESCE(AVG(rating), 0) FROM maintenance_reviews WHERE vendor_id = NEW.vendor_id
  )
  WHERE id = NEW.vendor_id;
  RETURN NEW;
END;
$$;


SET default_table_access_method = heap;

--
-- Name: analytics_events; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.analytics_events (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    event_type text NOT NULL,
    event_data jsonb DEFAULT '{}'::jsonb,
    page text,
    session_id text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.audit_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    action text NOT NULL,
    entity_type text NOT NULL,
    entity_id uuid,
    old_data jsonb,
    new_data jsonb,
    ip_address text,
    user_agent text,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: bank_accounts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.bank_accounts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    merchant_id uuid NOT NULL,
    bank_name text NOT NULL,
    account_name text NOT NULL,
    account_number text NOT NULL,
    branch_code text,
    is_primary boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: cancellation_feedback; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cancellation_feedback (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    merchant_id uuid NOT NULL,
    subscription_id uuid,
    reason text NOT NULL,
    feedback text,
    would_return boolean,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: chat_conversations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.chat_conversations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    title text,
    context jsonb DEFAULT '{}'::jsonb,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: chat_messages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.chat_messages (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    conversation_id uuid NOT NULL,
    role text NOT NULL,
    content text NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT chat_messages_role_check CHECK ((role = ANY (ARRAY['user'::text, 'assistant'::text, 'system'::text])))
);


--
-- Name: chatbot_analytics; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.chatbot_analytics (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    conversation_id uuid,
    user_id uuid,
    user_role text,
    query_type text,
    action_taken text,
    response_time_ms integer,
    user_satisfied boolean,
    message_count integer DEFAULT 1,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: chatbot_knowledge; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.chatbot_knowledge (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    category text NOT NULL,
    question text NOT NULL,
    answer text NOT NULL,
    keywords text[],
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: collections_cases; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.collections_cases (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_user_id uuid NOT NULL,
    merchant_id uuid NOT NULL,
    invoice_id uuid NOT NULL,
    total_due numeric NOT NULL,
    days_overdue integer NOT NULL,
    status text DEFAULT 'initiated'::text NOT NULL,
    escalation_level integer DEFAULT 1 NOT NULL,
    last_contact_at timestamp with time zone,
    next_action_date date,
    resolved_at timestamp with time zone,
    resolution_type text,
    notes text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: contracts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.contracts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    merchant_id uuid NOT NULL,
    unit_id uuid NOT NULL,
    tenant_user_id uuid NOT NULL,
    start_date date NOT NULL,
    end_date date NOT NULL,
    rent_amount numeric NOT NULL,
    deposit_amount numeric DEFAULT 0,
    status text DEFAULT 'active'::text,
    terms text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    signature_status text DEFAULT 'pending'::text,
    tenant_signature_url text,
    merchant_signature_url text,
    tenant_signed_at timestamp with time zone,
    merchant_signed_at timestamp with time zone,
    contract_document_url text,
    churn_reason text,
    billing_day integer,
    referral_bonus_applied boolean DEFAULT false,
    referral_bonus_amount numeric DEFAULT 0,
    grace_period_days integer DEFAULT 3,
    late_fee_type text DEFAULT 'percentage'::text,
    late_payment_penalty_rate numeric DEFAULT 0.02,
    move_out_notice_given boolean DEFAULT false,
    move_out_notice_date timestamp with time zone,
    expected_move_out_date date,
    actual_end_date date,
    termination_penalty numeric DEFAULT 0,
    notice_period_days integer DEFAULT 30,
    early_termination_penalty_rate numeric DEFAULT 2,
    CONSTRAINT contracts_status_check CHECK ((status = ANY (ARRAY['draft'::text, 'active'::text, 'expired'::text, 'terminated'::text])))
);


--
-- Name: deposit_disputes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.deposit_disputes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    deposit_refund_id uuid NOT NULL,
    tenant_user_id uuid NOT NULL,
    disputed_amount numeric NOT NULL,
    dispute_reason text NOT NULL,
    evidence_photos text[],
    status text DEFAULT 'pending'::text,
    merchant_response text,
    admin_notes text,
    resolution text,
    resolved_amount numeric,
    resolved_at timestamp with time zone,
    resolved_by uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: deposit_refunds; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.deposit_refunds (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_user_id uuid NOT NULL,
    contract_id uuid NOT NULL,
    inspection_id uuid,
    original_deposit numeric NOT NULL,
    deductions numeric DEFAULT 0,
    deduction_details jsonb DEFAULT '[]'::jsonb,
    refund_amount numeric NOT NULL,
    status text DEFAULT 'pending_processing'::text,
    due_date date,
    refunded_at timestamp with time zone,
    xendit_disbursement_id text,
    bank_account_number text,
    bank_name text,
    account_holder_name text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: disbursements; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.disbursements (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    escrow_account_id uuid,
    vendor_id uuid,
    type text DEFAULT 'rent'::text NOT NULL,
    amount numeric NOT NULL,
    fee_amount numeric DEFAULT 0,
    net_amount numeric NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    bank_account_id uuid,
    xendit_disbursement_id text,
    xendit_reference text,
    scheduled_for timestamp with time zone,
    processed_at timestamp with time zone,
    failure_reason text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    requires_manual_review boolean DEFAULT false,
    reviewed_by uuid,
    reviewed_at timestamp with time zone,
    review_notes text,
    completed_at timestamp with time zone
);


--
-- Name: disputes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.disputes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    merchant_id uuid NOT NULL,
    tenant_user_id uuid NOT NULL,
    contract_id uuid,
    title text NOT NULL,
    description text NOT NULL,
    status text DEFAULT 'open'::text,
    priority text DEFAULT 'medium'::text,
    resolution text,
    resolved_by uuid,
    resolved_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: early_termination_requests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.early_termination_requests (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_user_id uuid NOT NULL,
    contract_id uuid NOT NULL,
    requested_date date NOT NULL,
    reason text,
    supporting_docs text[],
    penalty_amount numeric DEFAULT 0,
    status text DEFAULT 'pending_approval'::text,
    merchant_response text,
    counter_offer_amount numeric,
    approved_at timestamp with time zone,
    denied_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: escrow_accounts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.escrow_accounts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    merchant_id uuid NOT NULL,
    balance numeric DEFAULT 0 NOT NULL,
    pending_balance numeric DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: escrow_transactions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.escrow_transactions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    escrow_account_id uuid NOT NULL,
    contract_id uuid,
    amount numeric NOT NULL,
    type text NOT NULL,
    status text DEFAULT 'pending'::text,
    reference text,
    description text,
    processed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    platform_fee numeric DEFAULT 0,
    gateway_fee numeric DEFAULT 0,
    gross_amount numeric,
    CONSTRAINT escrow_transactions_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'completed'::text, 'failed'::text, 'cancelled'::text]))),
    CONSTRAINT escrow_transactions_type_check CHECK ((type = ANY (ARRAY['deposit'::text, 'rent_payment'::text, 'disbursement'::text, 'refund'::text, 'fee'::text])))
);


--
-- Name: forum_comments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.forum_comments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    post_id uuid NOT NULL,
    author_id uuid NOT NULL,
    parent_id uuid,
    content text NOT NULL,
    like_count integer DEFAULT 0,
    is_visible boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: forum_likes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.forum_likes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    post_id uuid,
    comment_id uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT forum_likes_check CHECK ((((post_id IS NOT NULL) AND (comment_id IS NULL)) OR ((post_id IS NULL) AND (comment_id IS NOT NULL))))
);


--
-- Name: forum_posts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.forum_posts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    author_id uuid NOT NULL,
    property_id uuid,
    title text NOT NULL,
    content text NOT NULL,
    photos text[],
    tags text[],
    is_pinned boolean DEFAULT false,
    is_locked boolean DEFAULT false,
    view_count integer DEFAULT 0,
    comment_count integer DEFAULT 0,
    like_count integer DEFAULT 0,
    is_visible boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: forum_reports; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.forum_reports (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    reporter_id uuid NOT NULL,
    post_id uuid,
    comment_id uuid,
    reason text NOT NULL,
    description text,
    status text DEFAULT 'pending'::text,
    reviewed_by uuid,
    reviewed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT forum_reports_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'reviewed'::text, 'resolved'::text, 'dismissed'::text])))
);


--
-- Name: invoices; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.invoices (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    invoice_number text NOT NULL,
    contract_id uuid NOT NULL,
    merchant_id uuid NOT NULL,
    tenant_user_id uuid NOT NULL,
    amount numeric NOT NULL,
    tax_amount numeric DEFAULT 0,
    total_amount numeric NOT NULL,
    description text,
    line_items jsonb DEFAULT '[]'::jsonb,
    status text DEFAULT 'draft'::text NOT NULL,
    due_date date NOT NULL,
    issued_at timestamp with time zone,
    paid_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    late_fee numeric DEFAULT 0,
    original_amount numeric,
    late_fee_applied_at timestamp with time zone,
    grace_period_active boolean DEFAULT false,
    overdue_since timestamp with time zone,
    payment_plan_id uuid
);


--
-- Name: late_fee_records; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.late_fee_records (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    invoice_id uuid NOT NULL,
    original_amount numeric NOT NULL,
    late_fee_amount numeric NOT NULL,
    days_overdue integer NOT NULL,
    calculation_method text NOT NULL,
    applied_at timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: maintenance_requests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.maintenance_requests (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    unit_id uuid NOT NULL,
    tenant_user_id uuid NOT NULL,
    merchant_id uuid NOT NULL,
    title text NOT NULL,
    description text,
    category text DEFAULT 'general'::text NOT NULL,
    priority text DEFAULT 'medium'::text NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    images text[],
    assigned_to text,
    resolved_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    preferred_schedule timestamp with time zone,
    sla_deadline timestamp with time zone,
    assigned_vendor_id uuid,
    accepted_at timestamp with time zone,
    started_at timestamp with time zone,
    completion_notes text,
    completion_photos text[]
);


--
-- Name: maintenance_reviews; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.maintenance_reviews (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    maintenance_request_id uuid NOT NULL,
    vendor_id uuid NOT NULL,
    tenant_user_id uuid NOT NULL,
    rating integer NOT NULL,
    review_text text,
    photos text[],
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT maintenance_reviews_rating_check CHECK (((rating >= 1) AND (rating <= 5)))
);


--
-- Name: maintenance_timeline; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.maintenance_timeline (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    maintenance_request_id uuid NOT NULL,
    status text NOT NULL,
    message text NOT NULL,
    actor_id uuid,
    actor_role text,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: maintenance_updates; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.maintenance_updates (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    maintenance_request_id uuid NOT NULL,
    author_id uuid NOT NULL,
    author_role text NOT NULL,
    content text NOT NULL,
    photos text[],
    status_change_to text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: merchant_subscriptions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.merchant_subscriptions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    merchant_id uuid NOT NULL,
    tier_id uuid NOT NULL,
    status text DEFAULT 'trialing'::text NOT NULL,
    trial_ends_at timestamp with time zone,
    current_period_start timestamp with time zone DEFAULT now() NOT NULL,
    current_period_end timestamp with time zone NOT NULL,
    canceled_at timestamp with time zone,
    payment_method text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    xendit_recurring_id text,
    next_billing_date timestamp with time zone,
    payment_status text DEFAULT 'pending'::text,
    failed_attempts integer DEFAULT 0,
    grace_period_end timestamp with time zone,
    cancellation_requested_at timestamp with time zone,
    cancellation_effective_date timestamp with time zone,
    cancellation_reason text,
    CONSTRAINT merchant_subscriptions_status_check CHECK ((status = ANY (ARRAY['trialing'::text, 'active'::text, 'past_due'::text, 'canceled'::text, 'expired'::text])))
);


--
-- Name: merchant_verification_history; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.merchant_verification_history (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    merchant_id uuid NOT NULL,
    action text NOT NULL,
    performed_by uuid,
    approval_notes text,
    rejection_reason text,
    rejection_details text,
    resubmission_instructions text,
    old_status text,
    new_status text,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: merchant_verifications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.merchant_verifications (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    merchant_id uuid NOT NULL,
    document_type text NOT NULL,
    document_url text NOT NULL,
    status text DEFAULT 'pending'::text,
    rejection_reason text,
    reviewed_by uuid,
    reviewed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT merchant_verifications_document_type_check CHECK ((document_type = ANY (ARRAY['ktp'::text, 'npwp'::text, 'property_certificate'::text, 'business_license'::text]))),
    CONSTRAINT merchant_verifications_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text])))
);


--
-- Name: merchants; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.merchants (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    business_name text NOT NULL,
    business_type text DEFAULT 'individual'::text,
    address text,
    city text,
    province text,
    postal_code text,
    verification_status text DEFAULT 'pending'::text,
    subscription_tier text DEFAULT 'free'::text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    disbursement_schedule text DEFAULT 'weekly'::text,
    billing_day integer DEFAULT 1,
    merchant_code text,
    penalty_rate numeric DEFAULT 0.02,
    verified_at timestamp with time zone,
    verified_by uuid,
    rejected_at timestamp with time zone,
    rejected_by uuid,
    rejection_details text,
    resubmission_instructions text,
    resubmission_count integer DEFAULT 0,
    verification_submitted_at timestamp with time zone,
    min_disbursement_amount numeric DEFAULT 100000,
    last_disbursement_date timestamp with time zone,
    total_disbursed numeric DEFAULT 0,
    referral_discount numeric DEFAULT 0,
    referral_discount_months integer DEFAULT 0,
    referred_by uuid,
    CONSTRAINT merchants_billing_day_check CHECK (((billing_day >= 1) AND (billing_day <= 28))),
    CONSTRAINT merchants_business_type_check CHECK ((business_type = ANY (ARRAY['individual'::text, 'company'::text]))),
    CONSTRAINT merchants_subscription_tier_check CHECK ((subscription_tier = ANY (ARRAY['free'::text, 'basic'::text, 'pro'::text, 'enterprise'::text]))),
    CONSTRAINT merchants_verification_status_check CHECK ((verification_status = ANY (ARRAY['pending'::text, 'verified'::text, 'rejected'::text, 'suspended'::text])))
);


--
-- Name: move_out_inspections; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.move_out_inspections (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    move_out_notice_id uuid NOT NULL,
    scheduled_date timestamp with time zone,
    inspector_id uuid,
    status text DEFAULT 'scheduled'::text,
    tenant_confirmed boolean DEFAULT false,
    inspection_report jsonb DEFAULT '{}'::jsonb,
    total_deductions numeric DEFAULT 0,
    deposit_refund_amount numeric,
    deduction_details jsonb DEFAULT '[]'::jsonb,
    tenant_signature text,
    inspector_signature text,
    photos text[],
    completed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: move_out_notices; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.move_out_notices (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_user_id uuid NOT NULL,
    contract_id uuid NOT NULL,
    notice_date timestamp with time zone DEFAULT now(),
    intended_move_out_date date NOT NULL,
    is_early_termination boolean DEFAULT false,
    reason text,
    notes text,
    status text DEFAULT 'submitted'::text,
    acknowledged_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: move_out_tasks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.move_out_tasks (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    move_out_notice_id uuid NOT NULL,
    task_name text NOT NULL,
    description text,
    due_date date,
    completed boolean DEFAULT false,
    completed_at timestamp with time zone,
    order_index integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: move_out_timeline; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.move_out_timeline (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    move_out_notice_id uuid NOT NULL,
    step text NOT NULL,
    completed boolean DEFAULT false,
    completed_at timestamp with time zone,
    notes text,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: notifications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notifications (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    title text NOT NULL,
    message text NOT NULL,
    type text DEFAULT 'info'::text,
    read boolean DEFAULT false,
    link text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: order_reviews; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.order_reviews (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    order_id uuid NOT NULL,
    tenant_user_id uuid NOT NULL,
    vendor_id uuid NOT NULL,
    rating integer NOT NULL,
    review_text text,
    photos text[],
    vendor_reply text,
    vendor_replied_at timestamp with time zone,
    is_visible boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT order_reviews_rating_check CHECK (((rating >= 1) AND (rating <= 5)))
);


--
-- Name: orders; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.orders (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    order_number text NOT NULL,
    tenant_user_id uuid NOT NULL,
    vendor_id uuid NOT NULL,
    product_id uuid NOT NULL,
    quantity integer DEFAULT 1 NOT NULL,
    unit_price numeric NOT NULL,
    total_price numeric NOT NULL,
    service_fee numeric DEFAULT 0,
    status text DEFAULT 'pending'::text NOT NULL,
    notes text,
    scheduled_date date,
    scheduled_time text,
    address text,
    unit_id uuid,
    completed_at timestamp with time zone,
    canceled_at timestamp with time zone,
    cancel_reason text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT orders_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'confirmed'::text, 'in_progress'::text, 'completed'::text, 'canceled'::text, 'refunded'::text])))
);


--
-- Name: payment_plan_installments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.payment_plan_installments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    payment_plan_id uuid NOT NULL,
    installment_number integer NOT NULL,
    amount numeric NOT NULL,
    due_date date NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    paid_at timestamp with time zone,
    invoice_id uuid,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: payment_plans; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.payment_plans (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    invoice_id uuid NOT NULL,
    tenant_user_id uuid NOT NULL,
    merchant_id uuid NOT NULL,
    original_amount numeric NOT NULL,
    plan_type text DEFAULT 'installments'::text NOT NULL,
    installment_count integer DEFAULT 3 NOT NULL,
    installment_amount numeric NOT NULL,
    frequency text DEFAULT 'bi-weekly'::text NOT NULL,
    start_date date NOT NULL,
    late_fee_waived boolean DEFAULT false,
    waived_amount numeric DEFAULT 0,
    status text DEFAULT 'pending_acceptance'::text NOT NULL,
    terms text,
    accepted_at timestamp with time zone,
    completed_at timestamp with time zone,
    defaulted_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: payments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.payments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    contract_id uuid NOT NULL,
    merchant_id uuid NOT NULL,
    tenant_user_id uuid NOT NULL,
    amount numeric NOT NULL,
    payment_type text DEFAULT 'rent'::text NOT NULL,
    payment_method text,
    reference text,
    status text DEFAULT 'pending'::text NOT NULL,
    due_date date NOT NULL,
    paid_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: pending_subscription_changes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pending_subscription_changes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    merchant_id uuid NOT NULL,
    subscription_id uuid,
    current_tier_id uuid,
    pending_tier_id uuid NOT NULL,
    change_type text DEFAULT 'downgrade'::text NOT NULL,
    effective_date date NOT NULL,
    reason text,
    status text DEFAULT 'pending'::text NOT NULL,
    applied_at timestamp with time zone,
    cancelled_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: platform_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.platform_settings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    setting_key text NOT NULL,
    setting_value jsonb DEFAULT '{}'::jsonb NOT NULL,
    description text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: products; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.products (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    vendor_id uuid NOT NULL,
    name text NOT NULL,
    description text,
    category text NOT NULL,
    price numeric NOT NULL,
    unit text DEFAULT 'unit'::text,
    photos text[],
    stock integer,
    is_available boolean DEFAULT true,
    min_order integer DEFAULT 1,
    max_order integer,
    service_area text[],
    estimated_duration text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    promo_price numeric,
    promo_start timestamp with time zone,
    promo_end timestamp with time zone
);


--
-- Name: profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.profiles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    email text NOT NULL,
    full_name text,
    phone text,
    avatar_url text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    admin_2fa_enabled boolean DEFAULT false,
    admin_2fa_secret text
);


--
-- Name: properties; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.properties (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    merchant_id uuid NOT NULL,
    name text NOT NULL,
    property_type text NOT NULL,
    address text NOT NULL,
    city text NOT NULL,
    province text NOT NULL,
    postal_code text,
    description text,
    amenities text[] DEFAULT '{}'::text[],
    total_units integer DEFAULT 0,
    occupied_units integer DEFAULT 0,
    status text DEFAULT 'active'::text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    images text[] DEFAULT '{}'::text[],
    CONSTRAINT properties_property_type_check CHECK ((property_type = ANY (ARRAY['kost'::text, 'apartment'::text, 'house'::text, 'kontrakan'::text, 'ruko'::text]))),
    CONSTRAINT properties_status_check CHECK ((status = ANY (ARRAY['active'::text, 'inactive'::text, 'maintenance'::text])))
);


--
-- Name: referral_commissions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.referral_commissions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    referral_id uuid NOT NULL,
    referrer_id uuid NOT NULL,
    referee_id uuid NOT NULL,
    month_number integer DEFAULT 1 NOT NULL,
    subscription_amount numeric DEFAULT 0 NOT NULL,
    commission_rate numeric DEFAULT 0.20 NOT NULL,
    commission_amount numeric DEFAULT 0 NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    eligible_date timestamp with time zone,
    paid_at timestamp with time zone,
    cancellation_reason text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: referral_rewards; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.referral_rewards (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    referral_id uuid,
    type text DEFAULT 'subscription_credit'::text NOT NULL,
    amount numeric NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    credited_at timestamp with time zone,
    used_at timestamp with time zone,
    expires_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: referrals; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.referrals (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    referrer_user_id uuid NOT NULL,
    referee_user_id uuid,
    referrer_role text NOT NULL,
    referee_role text,
    referral_code text NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    reward_amount numeric DEFAULT 0,
    reward_paid boolean DEFAULT false,
    completed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    referee_subscription_tier text,
    referee_monthly_payment numeric DEFAULT 0,
    first_payment_at timestamp with time zone,
    converted_at timestamp with time zone,
    bonus_paid boolean DEFAULT false,
    bonus_paid_at timestamp with time zone,
    referee_order_count integer DEFAULT 0,
    referee_avg_rating numeric DEFAULT 0
);


--
-- Name: subscription_invoices; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.subscription_invoices (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    merchant_id uuid NOT NULL,
    subscription_id uuid,
    tier_id uuid NOT NULL,
    amount numeric NOT NULL,
    billing_period_start date NOT NULL,
    billing_period_end date NOT NULL,
    due_date date NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    xendit_invoice_id text,
    xendit_payment_url text,
    paid_at timestamp with time zone,
    payment_method text,
    failure_reason text,
    attempt_count integer DEFAULT 0,
    last_attempt_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: subscription_tiers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.subscription_tiers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    display_name text NOT NULL,
    description text,
    price_monthly numeric DEFAULT 0 NOT NULL,
    price_yearly numeric,
    max_properties integer DEFAULT 1 NOT NULL,
    max_units integer DEFAULT 5 NOT NULL,
    max_tenants integer DEFAULT 5 NOT NULL,
    features jsonb DEFAULT '[]'::jsonb,
    trial_days integer DEFAULT 14,
    is_active boolean DEFAULT true,
    sort_order integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: tenant_invitations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tenant_invitations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    merchant_id uuid NOT NULL,
    unit_id uuid NOT NULL,
    email text NOT NULL,
    phone text,
    status text DEFAULT 'pending'::text,
    token text DEFAULT encode(extensions.gen_random_bytes(32), 'hex'::text) NOT NULL,
    expires_at timestamp with time zone DEFAULT (now() + '7 days'::interval) NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT tenant_invitations_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'accepted'::text, 'expired'::text, 'cancelled'::text])))
);


--
-- Name: tenants; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tenants (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    ktp_number text,
    ktp_photo_url text,
    date_of_birth date,
    gender text,
    emergency_contact_name text,
    emergency_contact_phone text,
    emergency_contact_relation text,
    occupation text,
    income_range text,
    verification_status text DEFAULT 'pending'::text,
    verified_at timestamp with time zone,
    verified_by uuid,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    notification_preferences jsonb DEFAULT '{"new_invoices": true, "contract_updates": true, "payment_reminders": true, "maintenance_updates": true}'::jsonb,
    auto_pay_enabled boolean DEFAULT false,
    auto_pay_day integer DEFAULT 1,
    linked_merchant_id uuid,
    CONSTRAINT tenants_gender_check CHECK ((gender = ANY (ARRAY['male'::text, 'female'::text, 'other'::text]))),
    CONSTRAINT tenants_verification_status_check CHECK ((verification_status = ANY (ARRAY['pending'::text, 'verified'::text, 'rejected'::text])))
);


--
-- Name: unit_listings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.unit_listings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    unit_id uuid NOT NULL,
    merchant_id uuid NOT NULL,
    monthly_rent numeric NOT NULL,
    description text,
    photos text[],
    status text DEFAULT 'active'::text,
    listed_at timestamp with time zone DEFAULT now(),
    promoted boolean DEFAULT false,
    views integer DEFAULT 0,
    inquiries integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: units; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.units (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    property_id uuid NOT NULL,
    unit_number text NOT NULL,
    floor integer,
    unit_type text DEFAULT 'standard'::text,
    size_sqm numeric(10,2),
    rent_amount numeric(15,2) NOT NULL,
    deposit_amount numeric(15,2),
    status text DEFAULT 'available'::text,
    amenities text[] DEFAULT '{}'::text[],
    description text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    vacant_since timestamp with time zone,
    available_from date,
    is_listed boolean DEFAULT false,
    CONSTRAINT units_status_check CHECK ((status = ANY (ARRAY['available'::text, 'occupied'::text, 'reserved'::text, 'maintenance'::text]))),
    CONSTRAINT units_unit_type_check CHECK ((unit_type = ANY (ARRAY['single'::text, 'double'::text, 'studio'::text, 'suite'::text, 'standard'::text])))
);


--
-- Name: user_roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_roles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    role public.app_role NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: vendor_bank_accounts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.vendor_bank_accounts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    vendor_id uuid NOT NULL,
    bank_name text NOT NULL,
    account_name text NOT NULL,
    account_number text NOT NULL,
    branch_code text,
    is_primary boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: vendor_earnings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.vendor_earnings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    vendor_id uuid NOT NULL,
    vendor_job_id uuid NOT NULL,
    amount numeric NOT NULL,
    fee_amount numeric DEFAULT 0 NOT NULL,
    net_amount numeric NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    paid_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT valid_earning_status CHECK ((status = ANY (ARRAY['pending'::text, 'processing'::text, 'paid'::text, 'failed'::text])))
);


--
-- Name: vendor_jobs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.vendor_jobs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    vendor_id uuid NOT NULL,
    maintenance_request_id uuid NOT NULL,
    merchant_id uuid NOT NULL,
    quoted_price numeric,
    agreed_price numeric,
    status text DEFAULT 'pending'::text NOT NULL,
    notes text,
    started_at timestamp with time zone,
    completed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT valid_status CHECK ((status = ANY (ARRAY['pending'::text, 'accepted'::text, 'rejected'::text, 'in_progress'::text, 'completed'::text, 'cancelled'::text])))
);


--
-- Name: vendor_verifications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.vendor_verifications (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    vendor_id uuid NOT NULL,
    document_type text NOT NULL,
    document_url text NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    reviewed_by uuid,
    reviewed_at timestamp with time zone,
    rejection_reason text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: vendors; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.vendors (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    business_name text NOT NULL,
    contact_email text NOT NULL,
    contact_phone text,
    service_categories text[] DEFAULT '{}'::text[],
    description text,
    address text,
    city text,
    province text,
    verification_status text DEFAULT 'pending'::text,
    rating numeric DEFAULT 0,
    total_jobs integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    disbursement_schedule text DEFAULT 'weekly'::text,
    min_payout_threshold numeric DEFAULT 50000,
    notification_settings jsonb DEFAULT '{"push_new_jobs": true, "email_new_jobs": true, "email_payments": true, "push_job_updates": true, "email_job_updates": true}'::jsonb,
    referral_earnings numeric DEFAULT 0,
    referred_by uuid
);


--
-- Name: vouchers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.vouchers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    owner_id uuid NOT NULL,
    code text NOT NULL,
    discount_type text DEFAULT 'fixed'::text NOT NULL,
    discount_value numeric DEFAULT 0 NOT NULL,
    min_order numeric DEFAULT 0,
    max_discount numeric,
    valid_from timestamp with time zone DEFAULT now(),
    valid_until timestamp with time zone NOT NULL,
    applicable_to text DEFAULT 'marketplace_orders'::text,
    usage_limit integer DEFAULT 1,
    used_count integer DEFAULT 0,
    is_active boolean DEFAULT true,
    referral_id uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: xendit_transactions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.xendit_transactions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    xendit_invoice_id text,
    external_id text NOT NULL,
    payment_id uuid,
    invoice_id uuid,
    order_id uuid,
    user_id uuid NOT NULL,
    amount numeric NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    payment_method text,
    payment_channel text,
    payment_url text,
    qr_code_url text,
    virtual_account_number text,
    paid_at timestamp with time zone,
    expired_at timestamp with time zone,
    callback_data jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: analytics_events analytics_events_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.analytics_events
    ADD CONSTRAINT analytics_events_pkey PRIMARY KEY (id);


--
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- Name: bank_accounts bank_accounts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bank_accounts
    ADD CONSTRAINT bank_accounts_pkey PRIMARY KEY (id);


--
-- Name: cancellation_feedback cancellation_feedback_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cancellation_feedback
    ADD CONSTRAINT cancellation_feedback_pkey PRIMARY KEY (id);


--
-- Name: chat_conversations chat_conversations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_conversations
    ADD CONSTRAINT chat_conversations_pkey PRIMARY KEY (id);


--
-- Name: chat_messages chat_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_messages
    ADD CONSTRAINT chat_messages_pkey PRIMARY KEY (id);


--
-- Name: chatbot_analytics chatbot_analytics_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chatbot_analytics
    ADD CONSTRAINT chatbot_analytics_pkey PRIMARY KEY (id);


--
-- Name: chatbot_knowledge chatbot_knowledge_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chatbot_knowledge
    ADD CONSTRAINT chatbot_knowledge_pkey PRIMARY KEY (id);


--
-- Name: collections_cases collections_cases_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.collections_cases
    ADD CONSTRAINT collections_cases_pkey PRIMARY KEY (id);


--
-- Name: contracts contracts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contracts
    ADD CONSTRAINT contracts_pkey PRIMARY KEY (id);


--
-- Name: deposit_disputes deposit_disputes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.deposit_disputes
    ADD CONSTRAINT deposit_disputes_pkey PRIMARY KEY (id);


--
-- Name: deposit_refunds deposit_refunds_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.deposit_refunds
    ADD CONSTRAINT deposit_refunds_pkey PRIMARY KEY (id);


--
-- Name: disbursements disbursements_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.disbursements
    ADD CONSTRAINT disbursements_pkey PRIMARY KEY (id);


--
-- Name: disputes disputes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.disputes
    ADD CONSTRAINT disputes_pkey PRIMARY KEY (id);


--
-- Name: early_termination_requests early_termination_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.early_termination_requests
    ADD CONSTRAINT early_termination_requests_pkey PRIMARY KEY (id);


--
-- Name: escrow_accounts escrow_accounts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.escrow_accounts
    ADD CONSTRAINT escrow_accounts_pkey PRIMARY KEY (id);


--
-- Name: escrow_transactions escrow_transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.escrow_transactions
    ADD CONSTRAINT escrow_transactions_pkey PRIMARY KEY (id);


--
-- Name: forum_comments forum_comments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.forum_comments
    ADD CONSTRAINT forum_comments_pkey PRIMARY KEY (id);


--
-- Name: forum_likes forum_likes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.forum_likes
    ADD CONSTRAINT forum_likes_pkey PRIMARY KEY (id);


--
-- Name: forum_likes forum_likes_user_id_comment_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.forum_likes
    ADD CONSTRAINT forum_likes_user_id_comment_id_key UNIQUE (user_id, comment_id);


--
-- Name: forum_likes forum_likes_user_id_post_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.forum_likes
    ADD CONSTRAINT forum_likes_user_id_post_id_key UNIQUE (user_id, post_id);


--
-- Name: forum_posts forum_posts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.forum_posts
    ADD CONSTRAINT forum_posts_pkey PRIMARY KEY (id);


--
-- Name: forum_reports forum_reports_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.forum_reports
    ADD CONSTRAINT forum_reports_pkey PRIMARY KEY (id);


--
-- Name: invoices invoices_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_pkey PRIMARY KEY (id);


--
-- Name: late_fee_records late_fee_records_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.late_fee_records
    ADD CONSTRAINT late_fee_records_pkey PRIMARY KEY (id);


--
-- Name: maintenance_requests maintenance_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.maintenance_requests
    ADD CONSTRAINT maintenance_requests_pkey PRIMARY KEY (id);


--
-- Name: maintenance_reviews maintenance_reviews_maintenance_request_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.maintenance_reviews
    ADD CONSTRAINT maintenance_reviews_maintenance_request_id_key UNIQUE (maintenance_request_id);


--
-- Name: maintenance_reviews maintenance_reviews_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.maintenance_reviews
    ADD CONSTRAINT maintenance_reviews_pkey PRIMARY KEY (id);


--
-- Name: maintenance_timeline maintenance_timeline_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.maintenance_timeline
    ADD CONSTRAINT maintenance_timeline_pkey PRIMARY KEY (id);


--
-- Name: maintenance_updates maintenance_updates_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.maintenance_updates
    ADD CONSTRAINT maintenance_updates_pkey PRIMARY KEY (id);


--
-- Name: merchant_subscriptions merchant_subscriptions_merchant_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.merchant_subscriptions
    ADD CONSTRAINT merchant_subscriptions_merchant_id_key UNIQUE (merchant_id);


--
-- Name: merchant_subscriptions merchant_subscriptions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.merchant_subscriptions
    ADD CONSTRAINT merchant_subscriptions_pkey PRIMARY KEY (id);


--
-- Name: merchant_verification_history merchant_verification_history_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.merchant_verification_history
    ADD CONSTRAINT merchant_verification_history_pkey PRIMARY KEY (id);


--
-- Name: merchant_verifications merchant_verifications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.merchant_verifications
    ADD CONSTRAINT merchant_verifications_pkey PRIMARY KEY (id);


--
-- Name: merchants merchants_merchant_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.merchants
    ADD CONSTRAINT merchants_merchant_code_key UNIQUE (merchant_code);


--
-- Name: merchants merchants_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.merchants
    ADD CONSTRAINT merchants_pkey PRIMARY KEY (id);


--
-- Name: merchants merchants_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.merchants
    ADD CONSTRAINT merchants_user_id_key UNIQUE (user_id);


--
-- Name: move_out_inspections move_out_inspections_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.move_out_inspections
    ADD CONSTRAINT move_out_inspections_pkey PRIMARY KEY (id);


--
-- Name: move_out_notices move_out_notices_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.move_out_notices
    ADD CONSTRAINT move_out_notices_pkey PRIMARY KEY (id);


--
-- Name: move_out_tasks move_out_tasks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.move_out_tasks
    ADD CONSTRAINT move_out_tasks_pkey PRIMARY KEY (id);


--
-- Name: move_out_timeline move_out_timeline_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.move_out_timeline
    ADD CONSTRAINT move_out_timeline_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: order_reviews order_reviews_order_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_reviews
    ADD CONSTRAINT order_reviews_order_id_key UNIQUE (order_id);


--
-- Name: order_reviews order_reviews_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_reviews
    ADD CONSTRAINT order_reviews_pkey PRIMARY KEY (id);


--
-- Name: orders orders_order_number_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_order_number_key UNIQUE (order_number);


--
-- Name: orders orders_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_pkey PRIMARY KEY (id);


--
-- Name: payment_plan_installments payment_plan_installments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment_plan_installments
    ADD CONSTRAINT payment_plan_installments_pkey PRIMARY KEY (id);


--
-- Name: payment_plans payment_plans_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment_plans
    ADD CONSTRAINT payment_plans_pkey PRIMARY KEY (id);


--
-- Name: payments payments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_pkey PRIMARY KEY (id);


--
-- Name: pending_subscription_changes pending_subscription_changes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pending_subscription_changes
    ADD CONSTRAINT pending_subscription_changes_pkey PRIMARY KEY (id);


--
-- Name: platform_settings platform_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.platform_settings
    ADD CONSTRAINT platform_settings_pkey PRIMARY KEY (id);


--
-- Name: platform_settings platform_settings_setting_key_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.platform_settings
    ADD CONSTRAINT platform_settings_setting_key_key UNIQUE (setting_key);


--
-- Name: products products_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_user_id_key UNIQUE (user_id);


--
-- Name: properties properties_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.properties
    ADD CONSTRAINT properties_pkey PRIMARY KEY (id);


--
-- Name: referral_commissions referral_commissions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.referral_commissions
    ADD CONSTRAINT referral_commissions_pkey PRIMARY KEY (id);


--
-- Name: referral_rewards referral_rewards_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.referral_rewards
    ADD CONSTRAINT referral_rewards_pkey PRIMARY KEY (id);


--
-- Name: referrals referrals_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.referrals
    ADD CONSTRAINT referrals_pkey PRIMARY KEY (id);


--
-- Name: referrals referrals_referral_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.referrals
    ADD CONSTRAINT referrals_referral_code_key UNIQUE (referral_code);


--
-- Name: subscription_invoices subscription_invoices_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscription_invoices
    ADD CONSTRAINT subscription_invoices_pkey PRIMARY KEY (id);


--
-- Name: subscription_tiers subscription_tiers_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscription_tiers
    ADD CONSTRAINT subscription_tiers_name_key UNIQUE (name);


--
-- Name: subscription_tiers subscription_tiers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscription_tiers
    ADD CONSTRAINT subscription_tiers_pkey PRIMARY KEY (id);


--
-- Name: tenant_invitations tenant_invitations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant_invitations
    ADD CONSTRAINT tenant_invitations_pkey PRIMARY KEY (id);


--
-- Name: tenant_invitations tenant_invitations_token_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant_invitations
    ADD CONSTRAINT tenant_invitations_token_key UNIQUE (token);


--
-- Name: tenants tenants_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenants
    ADD CONSTRAINT tenants_pkey PRIMARY KEY (id);


--
-- Name: tenants tenants_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenants
    ADD CONSTRAINT tenants_user_id_key UNIQUE (user_id);


--
-- Name: unit_listings unit_listings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.unit_listings
    ADD CONSTRAINT unit_listings_pkey PRIMARY KEY (id);


--
-- Name: units units_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.units
    ADD CONSTRAINT units_pkey PRIMARY KEY (id);


--
-- Name: units units_property_id_unit_number_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.units
    ADD CONSTRAINT units_property_id_unit_number_key UNIQUE (property_id, unit_number);


--
-- Name: user_roles user_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_user_id_role_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_role_key UNIQUE (user_id, role);


--
-- Name: vendor_bank_accounts vendor_bank_accounts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vendor_bank_accounts
    ADD CONSTRAINT vendor_bank_accounts_pkey PRIMARY KEY (id);


--
-- Name: vendor_earnings vendor_earnings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vendor_earnings
    ADD CONSTRAINT vendor_earnings_pkey PRIMARY KEY (id);


--
-- Name: vendor_jobs vendor_jobs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vendor_jobs
    ADD CONSTRAINT vendor_jobs_pkey PRIMARY KEY (id);


--
-- Name: vendor_verifications vendor_verifications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vendor_verifications
    ADD CONSTRAINT vendor_verifications_pkey PRIMARY KEY (id);


--
-- Name: vendors vendors_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vendors
    ADD CONSTRAINT vendors_pkey PRIMARY KEY (id);


--
-- Name: vouchers vouchers_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vouchers
    ADD CONSTRAINT vouchers_code_key UNIQUE (code);


--
-- Name: vouchers vouchers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vouchers
    ADD CONSTRAINT vouchers_pkey PRIMARY KEY (id);


--
-- Name: xendit_transactions xendit_transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.xendit_transactions
    ADD CONSTRAINT xendit_transactions_pkey PRIMARY KEY (id);


--
-- Name: idx_audit_logs_action; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audit_logs_action ON public.audit_logs USING btree (action);


--
-- Name: idx_audit_logs_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audit_logs_created_at ON public.audit_logs USING btree (created_at DESC);


--
-- Name: idx_audit_logs_entity_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audit_logs_entity_type ON public.audit_logs USING btree (entity_type);


--
-- Name: idx_audit_logs_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audit_logs_user_id ON public.audit_logs USING btree (user_id);


--
-- Name: idx_cancellation_feedback_merchant_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cancellation_feedback_merchant_id ON public.cancellation_feedback USING btree (merchant_id);


--
-- Name: idx_chatbot_analytics_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_chatbot_analytics_created_at ON public.chatbot_analytics USING btree (created_at DESC);


--
-- Name: idx_chatbot_analytics_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_chatbot_analytics_user_id ON public.chatbot_analytics USING btree (user_id);


--
-- Name: idx_collections_cases_merchant_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_collections_cases_merchant_id ON public.collections_cases USING btree (merchant_id);


--
-- Name: idx_collections_cases_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_collections_cases_status ON public.collections_cases USING btree (status);


--
-- Name: idx_contracts_move_out; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_contracts_move_out ON public.contracts USING btree (move_out_notice_given) WHERE (move_out_notice_given = true);


--
-- Name: idx_deposit_refunds_contract; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_deposit_refunds_contract ON public.deposit_refunds USING btree (contract_id);


--
-- Name: idx_deposit_refunds_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_deposit_refunds_status ON public.deposit_refunds USING btree (status);


--
-- Name: idx_disbursements_pending_review; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_disbursements_pending_review ON public.disbursements USING btree (requires_manual_review, status) WHERE (requires_manual_review = true);


--
-- Name: idx_early_term_contract; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_early_term_contract ON public.early_termination_requests USING btree (contract_id);


--
-- Name: idx_inspections_notice; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_inspections_notice ON public.move_out_inspections USING btree (move_out_notice_id);


--
-- Name: idx_invoices_grace_period_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_invoices_grace_period_active ON public.invoices USING btree (grace_period_active);


--
-- Name: idx_invoices_overdue_since; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_invoices_overdue_since ON public.invoices USING btree (overdue_since);


--
-- Name: idx_late_fee_records_invoice_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_late_fee_records_invoice_id ON public.late_fee_records USING btree (invoice_id);


--
-- Name: idx_merchant_verification_history_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_merchant_verification_history_created_at ON public.merchant_verification_history USING btree (created_at DESC);


--
-- Name: idx_merchant_verification_history_merchant_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_merchant_verification_history_merchant_id ON public.merchant_verification_history USING btree (merchant_id);


--
-- Name: idx_merchants_merchant_code; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_merchants_merchant_code ON public.merchants USING btree (merchant_code);


--
-- Name: idx_move_out_notices_contract; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_move_out_notices_contract ON public.move_out_notices USING btree (contract_id);


--
-- Name: idx_move_out_notices_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_move_out_notices_status ON public.move_out_notices USING btree (status);


--
-- Name: idx_move_out_notices_tenant; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_move_out_notices_tenant ON public.move_out_notices USING btree (tenant_user_id);


--
-- Name: idx_move_out_tasks_notice; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_move_out_tasks_notice ON public.move_out_tasks USING btree (move_out_notice_id);


--
-- Name: idx_move_out_timeline_notice; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_move_out_timeline_notice ON public.move_out_timeline USING btree (move_out_notice_id);


--
-- Name: idx_payment_plan_installments_due_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_payment_plan_installments_due_date ON public.payment_plan_installments USING btree (due_date);


--
-- Name: idx_payment_plan_installments_plan_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_payment_plan_installments_plan_id ON public.payment_plan_installments USING btree (payment_plan_id);


--
-- Name: idx_payment_plans_invoice_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_payment_plans_invoice_id ON public.payment_plans USING btree (invoice_id);


--
-- Name: idx_payment_plans_merchant_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_payment_plans_merchant_id ON public.payment_plans USING btree (merchant_id);


--
-- Name: idx_payment_plans_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_payment_plans_status ON public.payment_plans USING btree (status);


--
-- Name: idx_payment_plans_tenant_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_payment_plans_tenant_user_id ON public.payment_plans USING btree (tenant_user_id);


--
-- Name: idx_pending_subscription_changes_effective_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pending_subscription_changes_effective_date ON public.pending_subscription_changes USING btree (effective_date);


--
-- Name: idx_pending_subscription_changes_merchant_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pending_subscription_changes_merchant_id ON public.pending_subscription_changes USING btree (merchant_id);


--
-- Name: idx_pending_subscription_changes_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pending_subscription_changes_status ON public.pending_subscription_changes USING btree (status);


--
-- Name: idx_products_promo_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_products_promo_active ON public.products USING btree (vendor_id, promo_start, promo_end) WHERE (promo_price IS NOT NULL);


--
-- Name: idx_referral_commissions_referrer; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_referral_commissions_referrer ON public.referral_commissions USING btree (referrer_id);


--
-- Name: idx_referral_commissions_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_referral_commissions_status ON public.referral_commissions USING btree (status);


--
-- Name: idx_referrals_referral_code; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_referrals_referral_code ON public.referrals USING btree (referral_code);


--
-- Name: idx_subscription_invoices_due_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_subscription_invoices_due_date ON public.subscription_invoices USING btree (due_date);


--
-- Name: idx_subscription_invoices_merchant_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_subscription_invoices_merchant_id ON public.subscription_invoices USING btree (merchant_id);


--
-- Name: idx_subscription_invoices_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_subscription_invoices_status ON public.subscription_invoices USING btree (status);


--
-- Name: idx_tenants_linked_merchant; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tenants_linked_merchant ON public.tenants USING btree (linked_merchant_id);


--
-- Name: idx_unit_listings_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_unit_listings_status ON public.unit_listings USING btree (status);


--
-- Name: idx_unit_listings_unit; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_unit_listings_unit ON public.unit_listings USING btree (unit_id);


--
-- Name: idx_units_vacant; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_units_vacant ON public.units USING btree (vacant_since) WHERE (vacant_since IS NOT NULL);


--
-- Name: idx_vendor_bank_accounts_vendor_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_vendor_bank_accounts_vendor_id ON public.vendor_bank_accounts USING btree (vendor_id);


--
-- Name: idx_vendor_earnings_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_vendor_earnings_status ON public.vendor_earnings USING btree (status);


--
-- Name: idx_vendor_earnings_vendor_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_vendor_earnings_vendor_id ON public.vendor_earnings USING btree (vendor_id);


--
-- Name: idx_vendor_jobs_maintenance_request_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_vendor_jobs_maintenance_request_id ON public.vendor_jobs USING btree (maintenance_request_id);


--
-- Name: idx_vendor_jobs_merchant_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_vendor_jobs_merchant_id ON public.vendor_jobs USING btree (merchant_id);


--
-- Name: idx_vendor_jobs_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_vendor_jobs_status ON public.vendor_jobs USING btree (status);


--
-- Name: idx_vendor_jobs_vendor_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_vendor_jobs_vendor_id ON public.vendor_jobs USING btree (vendor_id);


--
-- Name: idx_vouchers_code; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_vouchers_code ON public.vouchers USING btree (code);


--
-- Name: idx_vouchers_owner; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_vouchers_owner ON public.vouchers USING btree (owner_id);


--
-- Name: invoices generate_invoice_number_trigger; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER generate_invoice_number_trigger BEFORE INSERT ON public.invoices FOR EACH ROW WHEN (((new.invoice_number IS NULL) OR (new.invoice_number = ''::text))) EXECUTE FUNCTION public.generate_invoice_number();


--
-- Name: orders generate_order_number_trigger; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER generate_order_number_trigger BEFORE INSERT ON public.orders FOR EACH ROW EXECUTE FUNCTION public.generate_order_number();


--
-- Name: referrals generate_referral_code_trigger; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER generate_referral_code_trigger BEFORE INSERT ON public.referrals FOR EACH ROW WHEN (((new.referral_code IS NULL) OR (new.referral_code = ''::text))) EXECUTE FUNCTION public.generate_referral_code();


--
-- Name: merchants on_merchant_created_create_escrow; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER on_merchant_created_create_escrow AFTER INSERT ON public.merchants FOR EACH ROW EXECUTE FUNCTION public.create_merchant_escrow();


--
-- Name: merchant_subscriptions trigger_set_cancellation_effective_date; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_set_cancellation_effective_date BEFORE UPDATE ON public.merchant_subscriptions FOR EACH ROW EXECUTE FUNCTION public.set_cancellation_effective_date();


--
-- Name: merchants trigger_set_merchant_code; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_set_merchant_code BEFORE INSERT ON public.merchants FOR EACH ROW EXECUTE FUNCTION public.set_merchant_code();


--
-- Name: maintenance_requests trigger_set_sla_deadline; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_set_sla_deadline BEFORE INSERT ON public.maintenance_requests FOR EACH ROW EXECUTE FUNCTION public.set_maintenance_sla_deadline();


--
-- Name: maintenance_reviews trigger_update_vendor_maintenance_rating; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_update_vendor_maintenance_rating AFTER INSERT ON public.maintenance_reviews FOR EACH ROW EXECUTE FUNCTION public.update_vendor_maintenance_rating();


--
-- Name: bank_accounts update_bank_accounts_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_bank_accounts_updated_at BEFORE UPDATE ON public.bank_accounts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: chat_conversations update_chat_conversations_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_chat_conversations_updated_at BEFORE UPDATE ON public.chat_conversations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: chatbot_knowledge update_chatbot_knowledge_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_chatbot_knowledge_updated_at BEFORE UPDATE ON public.chatbot_knowledge FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: collections_cases update_collections_cases_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_collections_cases_updated_at BEFORE UPDATE ON public.collections_cases FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: contracts update_contracts_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_contracts_updated_at BEFORE UPDATE ON public.contracts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: disbursements update_disbursements_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_disbursements_updated_at BEFORE UPDATE ON public.disbursements FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: disputes update_disputes_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_disputes_updated_at BEFORE UPDATE ON public.disputes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: escrow_accounts update_escrow_accounts_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_escrow_accounts_updated_at BEFORE UPDATE ON public.escrow_accounts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: forum_comments update_forum_comments_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_forum_comments_updated_at BEFORE UPDATE ON public.forum_comments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: forum_posts update_forum_posts_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_forum_posts_updated_at BEFORE UPDATE ON public.forum_posts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: invoices update_invoices_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON public.invoices FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: maintenance_requests update_maintenance_requests_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_maintenance_requests_updated_at BEFORE UPDATE ON public.maintenance_requests FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: merchant_subscriptions update_merchant_subscriptions_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_merchant_subscriptions_updated_at BEFORE UPDATE ON public.merchant_subscriptions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: merchants update_merchants_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_merchants_updated_at BEFORE UPDATE ON public.merchants FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: order_reviews update_order_reviews_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_order_reviews_updated_at BEFORE UPDATE ON public.order_reviews FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: orders update_orders_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: payment_plans update_payment_plans_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_payment_plans_updated_at BEFORE UPDATE ON public.payment_plans FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: payments update_payments_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON public.payments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: pending_subscription_changes update_pending_subscription_changes_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_pending_subscription_changes_updated_at BEFORE UPDATE ON public.pending_subscription_changes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: platform_settings update_platform_settings_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_platform_settings_updated_at BEFORE UPDATE ON public.platform_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: products update_products_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: profiles update_profiles_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: properties update_properties_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_properties_updated_at BEFORE UPDATE ON public.properties FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: units update_property_counts_on_unit_change; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_property_counts_on_unit_change AFTER INSERT OR DELETE OR UPDATE ON public.units FOR EACH ROW EXECUTE FUNCTION public.update_property_unit_counts();


--
-- Name: referral_rewards update_referral_rewards_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_referral_rewards_updated_at BEFORE UPDATE ON public.referral_rewards FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: referrals update_referrals_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_referrals_updated_at BEFORE UPDATE ON public.referrals FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: subscription_invoices update_subscription_invoices_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_subscription_invoices_updated_at BEFORE UPDATE ON public.subscription_invoices FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: subscription_tiers update_subscription_tiers_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_subscription_tiers_updated_at BEFORE UPDATE ON public.subscription_tiers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: tenants update_tenants_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_tenants_updated_at BEFORE UPDATE ON public.tenants FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: units update_units_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_units_updated_at BEFORE UPDATE ON public.units FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: vendor_bank_accounts update_vendor_bank_accounts_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_vendor_bank_accounts_updated_at BEFORE UPDATE ON public.vendor_bank_accounts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: vendor_earnings update_vendor_earnings_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_vendor_earnings_updated_at BEFORE UPDATE ON public.vendor_earnings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: vendor_jobs update_vendor_jobs_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_vendor_jobs_updated_at BEFORE UPDATE ON public.vendor_jobs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: vendors update_vendors_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_vendors_updated_at BEFORE UPDATE ON public.vendors FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: xendit_transactions update_xendit_transactions_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_xendit_transactions_updated_at BEFORE UPDATE ON public.xendit_transactions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: audit_logs audit_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: bank_accounts bank_accounts_merchant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bank_accounts
    ADD CONSTRAINT bank_accounts_merchant_id_fkey FOREIGN KEY (merchant_id) REFERENCES public.merchants(id) ON DELETE CASCADE;


--
-- Name: cancellation_feedback cancellation_feedback_merchant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cancellation_feedback
    ADD CONSTRAINT cancellation_feedback_merchant_id_fkey FOREIGN KEY (merchant_id) REFERENCES public.merchants(id) ON DELETE CASCADE;


--
-- Name: cancellation_feedback cancellation_feedback_subscription_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cancellation_feedback
    ADD CONSTRAINT cancellation_feedback_subscription_id_fkey FOREIGN KEY (subscription_id) REFERENCES public.merchant_subscriptions(id) ON DELETE SET NULL;


--
-- Name: chat_conversations chat_conversations_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_conversations
    ADD CONSTRAINT chat_conversations_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: chat_messages chat_messages_conversation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_messages
    ADD CONSTRAINT chat_messages_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.chat_conversations(id) ON DELETE CASCADE;


--
-- Name: chatbot_analytics chatbot_analytics_conversation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chatbot_analytics
    ADD CONSTRAINT chatbot_analytics_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.chat_conversations(id) ON DELETE CASCADE;


--
-- Name: collections_cases collections_cases_invoice_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.collections_cases
    ADD CONSTRAINT collections_cases_invoice_id_fkey FOREIGN KEY (invoice_id) REFERENCES public.invoices(id) ON DELETE CASCADE;


--
-- Name: collections_cases collections_cases_merchant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.collections_cases
    ADD CONSTRAINT collections_cases_merchant_id_fkey FOREIGN KEY (merchant_id) REFERENCES public.merchants(id) ON DELETE CASCADE;


--
-- Name: contracts contracts_merchant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contracts
    ADD CONSTRAINT contracts_merchant_id_fkey FOREIGN KEY (merchant_id) REFERENCES public.merchants(id) ON DELETE CASCADE;


--
-- Name: contracts contracts_unit_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contracts
    ADD CONSTRAINT contracts_unit_id_fkey FOREIGN KEY (unit_id) REFERENCES public.units(id) ON DELETE CASCADE;


--
-- Name: deposit_disputes deposit_disputes_deposit_refund_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.deposit_disputes
    ADD CONSTRAINT deposit_disputes_deposit_refund_id_fkey FOREIGN KEY (deposit_refund_id) REFERENCES public.deposit_refunds(id) ON DELETE CASCADE;


--
-- Name: deposit_refunds deposit_refunds_contract_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.deposit_refunds
    ADD CONSTRAINT deposit_refunds_contract_id_fkey FOREIGN KEY (contract_id) REFERENCES public.contracts(id) ON DELETE CASCADE;


--
-- Name: deposit_refunds deposit_refunds_inspection_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.deposit_refunds
    ADD CONSTRAINT deposit_refunds_inspection_id_fkey FOREIGN KEY (inspection_id) REFERENCES public.move_out_inspections(id);


--
-- Name: disbursements disbursements_escrow_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.disbursements
    ADD CONSTRAINT disbursements_escrow_account_id_fkey FOREIGN KEY (escrow_account_id) REFERENCES public.escrow_accounts(id);


--
-- Name: disbursements disbursements_vendor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.disbursements
    ADD CONSTRAINT disbursements_vendor_id_fkey FOREIGN KEY (vendor_id) REFERENCES public.vendors(id);


--
-- Name: disputes disputes_contract_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.disputes
    ADD CONSTRAINT disputes_contract_id_fkey FOREIGN KEY (contract_id) REFERENCES public.contracts(id);


--
-- Name: early_termination_requests early_termination_requests_contract_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.early_termination_requests
    ADD CONSTRAINT early_termination_requests_contract_id_fkey FOREIGN KEY (contract_id) REFERENCES public.contracts(id) ON DELETE CASCADE;


--
-- Name: escrow_accounts escrow_accounts_merchant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.escrow_accounts
    ADD CONSTRAINT escrow_accounts_merchant_id_fkey FOREIGN KEY (merchant_id) REFERENCES public.merchants(id) ON DELETE CASCADE;


--
-- Name: escrow_transactions escrow_transactions_contract_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.escrow_transactions
    ADD CONSTRAINT escrow_transactions_contract_id_fkey FOREIGN KEY (contract_id) REFERENCES public.contracts(id) ON DELETE SET NULL;


--
-- Name: escrow_transactions escrow_transactions_escrow_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.escrow_transactions
    ADD CONSTRAINT escrow_transactions_escrow_account_id_fkey FOREIGN KEY (escrow_account_id) REFERENCES public.escrow_accounts(id) ON DELETE CASCADE;


--
-- Name: forum_comments forum_comments_author_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.forum_comments
    ADD CONSTRAINT forum_comments_author_id_fkey FOREIGN KEY (author_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: forum_comments forum_comments_parent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.forum_comments
    ADD CONSTRAINT forum_comments_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.forum_comments(id) ON DELETE CASCADE;


--
-- Name: forum_comments forum_comments_post_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.forum_comments
    ADD CONSTRAINT forum_comments_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.forum_posts(id) ON DELETE CASCADE;


--
-- Name: forum_likes forum_likes_comment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.forum_likes
    ADD CONSTRAINT forum_likes_comment_id_fkey FOREIGN KEY (comment_id) REFERENCES public.forum_comments(id) ON DELETE CASCADE;


--
-- Name: forum_likes forum_likes_post_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.forum_likes
    ADD CONSTRAINT forum_likes_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.forum_posts(id) ON DELETE CASCADE;


--
-- Name: forum_likes forum_likes_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.forum_likes
    ADD CONSTRAINT forum_likes_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: forum_posts forum_posts_author_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.forum_posts
    ADD CONSTRAINT forum_posts_author_id_fkey FOREIGN KEY (author_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: forum_posts forum_posts_property_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.forum_posts
    ADD CONSTRAINT forum_posts_property_id_fkey FOREIGN KEY (property_id) REFERENCES public.properties(id) ON DELETE CASCADE;


--
-- Name: forum_reports forum_reports_comment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.forum_reports
    ADD CONSTRAINT forum_reports_comment_id_fkey FOREIGN KEY (comment_id) REFERENCES public.forum_comments(id) ON DELETE CASCADE;


--
-- Name: forum_reports forum_reports_post_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.forum_reports
    ADD CONSTRAINT forum_reports_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.forum_posts(id) ON DELETE CASCADE;


--
-- Name: forum_reports forum_reports_reporter_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.forum_reports
    ADD CONSTRAINT forum_reports_reporter_id_fkey FOREIGN KEY (reporter_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: forum_reports forum_reports_reviewed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.forum_reports
    ADD CONSTRAINT forum_reports_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES auth.users(id);


--
-- Name: invoices invoices_contract_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_contract_id_fkey FOREIGN KEY (contract_id) REFERENCES public.contracts(id) ON DELETE CASCADE;


--
-- Name: invoices invoices_merchant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_merchant_id_fkey FOREIGN KEY (merchant_id) REFERENCES public.merchants(id) ON DELETE CASCADE;


--
-- Name: invoices invoices_payment_plan_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_payment_plan_id_fkey FOREIGN KEY (payment_plan_id) REFERENCES public.payment_plans(id) ON DELETE SET NULL;


--
-- Name: late_fee_records late_fee_records_invoice_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.late_fee_records
    ADD CONSTRAINT late_fee_records_invoice_id_fkey FOREIGN KEY (invoice_id) REFERENCES public.invoices(id) ON DELETE CASCADE;


--
-- Name: maintenance_requests maintenance_requests_assigned_vendor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.maintenance_requests
    ADD CONSTRAINT maintenance_requests_assigned_vendor_id_fkey FOREIGN KEY (assigned_vendor_id) REFERENCES public.vendors(id);


--
-- Name: maintenance_requests maintenance_requests_merchant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.maintenance_requests
    ADD CONSTRAINT maintenance_requests_merchant_id_fkey FOREIGN KEY (merchant_id) REFERENCES public.merchants(id) ON DELETE CASCADE;


--
-- Name: maintenance_requests maintenance_requests_unit_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.maintenance_requests
    ADD CONSTRAINT maintenance_requests_unit_id_fkey FOREIGN KEY (unit_id) REFERENCES public.units(id) ON DELETE CASCADE;


--
-- Name: maintenance_reviews maintenance_reviews_maintenance_request_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.maintenance_reviews
    ADD CONSTRAINT maintenance_reviews_maintenance_request_id_fkey FOREIGN KEY (maintenance_request_id) REFERENCES public.maintenance_requests(id) ON DELETE CASCADE;


--
-- Name: maintenance_reviews maintenance_reviews_vendor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.maintenance_reviews
    ADD CONSTRAINT maintenance_reviews_vendor_id_fkey FOREIGN KEY (vendor_id) REFERENCES public.vendors(id);


--
-- Name: maintenance_timeline maintenance_timeline_maintenance_request_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.maintenance_timeline
    ADD CONSTRAINT maintenance_timeline_maintenance_request_id_fkey FOREIGN KEY (maintenance_request_id) REFERENCES public.maintenance_requests(id) ON DELETE CASCADE;


--
-- Name: maintenance_updates maintenance_updates_maintenance_request_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.maintenance_updates
    ADD CONSTRAINT maintenance_updates_maintenance_request_id_fkey FOREIGN KEY (maintenance_request_id) REFERENCES public.maintenance_requests(id) ON DELETE CASCADE;


--
-- Name: merchant_subscriptions merchant_subscriptions_merchant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.merchant_subscriptions
    ADD CONSTRAINT merchant_subscriptions_merchant_id_fkey FOREIGN KEY (merchant_id) REFERENCES public.merchants(id) ON DELETE CASCADE;


--
-- Name: merchant_subscriptions merchant_subscriptions_tier_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.merchant_subscriptions
    ADD CONSTRAINT merchant_subscriptions_tier_id_fkey FOREIGN KEY (tier_id) REFERENCES public.subscription_tiers(id);


--
-- Name: merchant_verification_history merchant_verification_history_merchant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.merchant_verification_history
    ADD CONSTRAINT merchant_verification_history_merchant_id_fkey FOREIGN KEY (merchant_id) REFERENCES public.merchants(id) ON DELETE CASCADE;


--
-- Name: merchant_verifications merchant_verifications_merchant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.merchant_verifications
    ADD CONSTRAINT merchant_verifications_merchant_id_fkey FOREIGN KEY (merchant_id) REFERENCES public.merchants(id) ON DELETE CASCADE;


--
-- Name: merchant_verifications merchant_verifications_reviewed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.merchant_verifications
    ADD CONSTRAINT merchant_verifications_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES auth.users(id);


--
-- Name: merchants merchants_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.merchants
    ADD CONSTRAINT merchants_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: move_out_inspections move_out_inspections_move_out_notice_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.move_out_inspections
    ADD CONSTRAINT move_out_inspections_move_out_notice_id_fkey FOREIGN KEY (move_out_notice_id) REFERENCES public.move_out_notices(id) ON DELETE CASCADE;


--
-- Name: move_out_notices move_out_notices_contract_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.move_out_notices
    ADD CONSTRAINT move_out_notices_contract_id_fkey FOREIGN KEY (contract_id) REFERENCES public.contracts(id) ON DELETE CASCADE;


--
-- Name: move_out_tasks move_out_tasks_move_out_notice_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.move_out_tasks
    ADD CONSTRAINT move_out_tasks_move_out_notice_id_fkey FOREIGN KEY (move_out_notice_id) REFERENCES public.move_out_notices(id) ON DELETE CASCADE;


--
-- Name: move_out_timeline move_out_timeline_move_out_notice_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.move_out_timeline
    ADD CONSTRAINT move_out_timeline_move_out_notice_id_fkey FOREIGN KEY (move_out_notice_id) REFERENCES public.move_out_notices(id) ON DELETE CASCADE;


--
-- Name: order_reviews order_reviews_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_reviews
    ADD CONSTRAINT order_reviews_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;


--
-- Name: order_reviews order_reviews_tenant_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_reviews
    ADD CONSTRAINT order_reviews_tenant_user_id_fkey FOREIGN KEY (tenant_user_id) REFERENCES auth.users(id);


--
-- Name: order_reviews order_reviews_vendor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_reviews
    ADD CONSTRAINT order_reviews_vendor_id_fkey FOREIGN KEY (vendor_id) REFERENCES public.vendors(id);


--
-- Name: orders orders_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id);


--
-- Name: orders orders_tenant_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_tenant_user_id_fkey FOREIGN KEY (tenant_user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: orders orders_unit_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_unit_id_fkey FOREIGN KEY (unit_id) REFERENCES public.units(id);


--
-- Name: orders orders_vendor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_vendor_id_fkey FOREIGN KEY (vendor_id) REFERENCES public.vendors(id);


--
-- Name: payment_plan_installments payment_plan_installments_invoice_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment_plan_installments
    ADD CONSTRAINT payment_plan_installments_invoice_id_fkey FOREIGN KEY (invoice_id) REFERENCES public.invoices(id);


--
-- Name: payment_plan_installments payment_plan_installments_payment_plan_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment_plan_installments
    ADD CONSTRAINT payment_plan_installments_payment_plan_id_fkey FOREIGN KEY (payment_plan_id) REFERENCES public.payment_plans(id) ON DELETE CASCADE;


--
-- Name: payment_plans payment_plans_invoice_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment_plans
    ADD CONSTRAINT payment_plans_invoice_id_fkey FOREIGN KEY (invoice_id) REFERENCES public.invoices(id) ON DELETE CASCADE;


--
-- Name: payment_plans payment_plans_merchant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment_plans
    ADD CONSTRAINT payment_plans_merchant_id_fkey FOREIGN KEY (merchant_id) REFERENCES public.merchants(id) ON DELETE CASCADE;


--
-- Name: payments payments_contract_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_contract_id_fkey FOREIGN KEY (contract_id) REFERENCES public.contracts(id) ON DELETE CASCADE;


--
-- Name: payments payments_merchant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_merchant_id_fkey FOREIGN KEY (merchant_id) REFERENCES public.merchants(id) ON DELETE CASCADE;


--
-- Name: pending_subscription_changes pending_subscription_changes_current_tier_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pending_subscription_changes
    ADD CONSTRAINT pending_subscription_changes_current_tier_id_fkey FOREIGN KEY (current_tier_id) REFERENCES public.subscription_tiers(id);


--
-- Name: pending_subscription_changes pending_subscription_changes_merchant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pending_subscription_changes
    ADD CONSTRAINT pending_subscription_changes_merchant_id_fkey FOREIGN KEY (merchant_id) REFERENCES public.merchants(id) ON DELETE CASCADE;


--
-- Name: pending_subscription_changes pending_subscription_changes_pending_tier_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pending_subscription_changes
    ADD CONSTRAINT pending_subscription_changes_pending_tier_id_fkey FOREIGN KEY (pending_tier_id) REFERENCES public.subscription_tiers(id);


--
-- Name: pending_subscription_changes pending_subscription_changes_subscription_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pending_subscription_changes
    ADD CONSTRAINT pending_subscription_changes_subscription_id_fkey FOREIGN KEY (subscription_id) REFERENCES public.merchant_subscriptions(id) ON DELETE CASCADE;


--
-- Name: products products_vendor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_vendor_id_fkey FOREIGN KEY (vendor_id) REFERENCES public.vendors(id) ON DELETE CASCADE;


--
-- Name: profiles profiles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: properties properties_merchant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.properties
    ADD CONSTRAINT properties_merchant_id_fkey FOREIGN KEY (merchant_id) REFERENCES public.merchants(id) ON DELETE CASCADE;


--
-- Name: referral_commissions referral_commissions_referral_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.referral_commissions
    ADD CONSTRAINT referral_commissions_referral_id_fkey FOREIGN KEY (referral_id) REFERENCES public.referrals(id);


--
-- Name: referral_rewards referral_rewards_referral_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.referral_rewards
    ADD CONSTRAINT referral_rewards_referral_id_fkey FOREIGN KEY (referral_id) REFERENCES public.referrals(id);


--
-- Name: subscription_invoices subscription_invoices_merchant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscription_invoices
    ADD CONSTRAINT subscription_invoices_merchant_id_fkey FOREIGN KEY (merchant_id) REFERENCES public.merchants(id) ON DELETE CASCADE;


--
-- Name: subscription_invoices subscription_invoices_subscription_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscription_invoices
    ADD CONSTRAINT subscription_invoices_subscription_id_fkey FOREIGN KEY (subscription_id) REFERENCES public.merchant_subscriptions(id) ON DELETE SET NULL;


--
-- Name: subscription_invoices subscription_invoices_tier_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscription_invoices
    ADD CONSTRAINT subscription_invoices_tier_id_fkey FOREIGN KEY (tier_id) REFERENCES public.subscription_tiers(id);


--
-- Name: tenant_invitations tenant_invitations_merchant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant_invitations
    ADD CONSTRAINT tenant_invitations_merchant_id_fkey FOREIGN KEY (merchant_id) REFERENCES public.merchants(id) ON DELETE CASCADE;


--
-- Name: tenant_invitations tenant_invitations_unit_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant_invitations
    ADD CONSTRAINT tenant_invitations_unit_id_fkey FOREIGN KEY (unit_id) REFERENCES public.units(id) ON DELETE CASCADE;


--
-- Name: tenants tenants_linked_merchant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenants
    ADD CONSTRAINT tenants_linked_merchant_id_fkey FOREIGN KEY (linked_merchant_id) REFERENCES public.merchants(id);


--
-- Name: tenants tenants_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenants
    ADD CONSTRAINT tenants_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: unit_listings unit_listings_merchant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.unit_listings
    ADD CONSTRAINT unit_listings_merchant_id_fkey FOREIGN KEY (merchant_id) REFERENCES public.merchants(id);


--
-- Name: unit_listings unit_listings_unit_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.unit_listings
    ADD CONSTRAINT unit_listings_unit_id_fkey FOREIGN KEY (unit_id) REFERENCES public.units(id) ON DELETE CASCADE;


--
-- Name: units units_property_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.units
    ADD CONSTRAINT units_property_id_fkey FOREIGN KEY (property_id) REFERENCES public.properties(id) ON DELETE CASCADE;


--
-- Name: user_roles user_roles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: vendor_bank_accounts vendor_bank_accounts_vendor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vendor_bank_accounts
    ADD CONSTRAINT vendor_bank_accounts_vendor_id_fkey FOREIGN KEY (vendor_id) REFERENCES public.vendors(id) ON DELETE CASCADE;


--
-- Name: vendor_earnings vendor_earnings_vendor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vendor_earnings
    ADD CONSTRAINT vendor_earnings_vendor_id_fkey FOREIGN KEY (vendor_id) REFERENCES public.vendors(id) ON DELETE CASCADE;


--
-- Name: vendor_earnings vendor_earnings_vendor_job_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vendor_earnings
    ADD CONSTRAINT vendor_earnings_vendor_job_id_fkey FOREIGN KEY (vendor_job_id) REFERENCES public.vendor_jobs(id) ON DELETE CASCADE;


--
-- Name: vendor_jobs vendor_jobs_maintenance_request_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vendor_jobs
    ADD CONSTRAINT vendor_jobs_maintenance_request_id_fkey FOREIGN KEY (maintenance_request_id) REFERENCES public.maintenance_requests(id) ON DELETE CASCADE;


--
-- Name: vendor_jobs vendor_jobs_merchant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vendor_jobs
    ADD CONSTRAINT vendor_jobs_merchant_id_fkey FOREIGN KEY (merchant_id) REFERENCES public.merchants(id) ON DELETE CASCADE;


--
-- Name: vendor_jobs vendor_jobs_vendor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vendor_jobs
    ADD CONSTRAINT vendor_jobs_vendor_id_fkey FOREIGN KEY (vendor_id) REFERENCES public.vendors(id) ON DELETE CASCADE;


--
-- Name: vendor_verifications vendor_verifications_vendor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vendor_verifications
    ADD CONSTRAINT vendor_verifications_vendor_id_fkey FOREIGN KEY (vendor_id) REFERENCES public.vendors(id);


--
-- Name: vouchers vouchers_referral_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vouchers
    ADD CONSTRAINT vouchers_referral_id_fkey FOREIGN KEY (referral_id) REFERENCES public.referrals(id);


--
-- Name: xendit_transactions xendit_transactions_invoice_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.xendit_transactions
    ADD CONSTRAINT xendit_transactions_invoice_id_fkey FOREIGN KEY (invoice_id) REFERENCES public.invoices(id);


--
-- Name: xendit_transactions xendit_transactions_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.xendit_transactions
    ADD CONSTRAINT xendit_transactions_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id);


--
-- Name: bank_accounts Admins can manage all bank accounts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage all bank accounts" ON public.bank_accounts USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: forum_comments Admins can manage all comments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage all comments" ON public.forum_comments USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: referral_commissions Admins can manage all commissions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage all commissions" ON public.referral_commissions USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: contracts Admins can manage all contracts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage all contracts" ON public.contracts USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: deposit_disputes Admins can manage all deposit disputes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage all deposit disputes" ON public.deposit_disputes USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: deposit_refunds Admins can manage all deposit refunds; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage all deposit refunds" ON public.deposit_refunds USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: disbursements Admins can manage all disbursements; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage all disbursements" ON public.disbursements USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: disputes Admins can manage all disputes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage all disputes" ON public.disputes USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: early_termination_requests Admins can manage all early termination requests; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage all early termination requests" ON public.early_termination_requests USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: escrow_accounts Admins can manage all escrow accounts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage all escrow accounts" ON public.escrow_accounts USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: move_out_inspections Admins can manage all inspections; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage all inspections" ON public.move_out_inspections USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: invoices Admins can manage all invoices; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage all invoices" ON public.invoices USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: unit_listings Admins can manage all listings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage all listings" ON public.unit_listings USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: maintenance_requests Admins can manage all maintenance requests; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage all maintenance requests" ON public.maintenance_requests USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: maintenance_updates Admins can manage all maintenance updates; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage all maintenance updates" ON public.maintenance_updates USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: merchants Admins can manage all merchants; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage all merchants" ON public.merchants TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: move_out_notices Admins can manage all move-out notices; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage all move-out notices" ON public.move_out_notices USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: orders Admins can manage all orders; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage all orders" ON public.orders USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: payments Admins can manage all payments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage all payments" ON public.payments USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: pending_subscription_changes Admins can manage all pending changes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage all pending changes" ON public.pending_subscription_changes USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: forum_posts Admins can manage all posts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage all posts" ON public.forum_posts USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: products Admins can manage all products; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage all products" ON public.products USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: properties Admins can manage all properties; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage all properties" ON public.properties TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: referrals Admins can manage all referrals; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage all referrals" ON public.referrals USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: forum_reports Admins can manage all reports; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage all reports" ON public.forum_reports USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: maintenance_reviews Admins can manage all reviews; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage all reviews" ON public.maintenance_reviews USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: order_reviews Admins can manage all reviews; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage all reviews" ON public.order_reviews USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: referral_rewards Admins can manage all rewards; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage all rewards" ON public.referral_rewards USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: subscription_invoices Admins can manage all subscription invoices; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage all subscription invoices" ON public.subscription_invoices USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: merchant_subscriptions Admins can manage all subscriptions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage all subscriptions" ON public.merchant_subscriptions USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: move_out_tasks Admins can manage all tasks; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage all tasks" ON public.move_out_tasks USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: tenants Admins can manage all tenant profiles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage all tenant profiles" ON public.tenants USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: move_out_timeline Admins can manage all timeline; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage all timeline" ON public.move_out_timeline USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: maintenance_timeline Admins can manage all timeline entries; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage all timeline entries" ON public.maintenance_timeline USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: escrow_transactions Admins can manage all transactions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage all transactions" ON public.escrow_transactions USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: xendit_transactions Admins can manage all transactions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage all transactions" ON public.xendit_transactions USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: units Admins can manage all units; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage all units" ON public.units TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: vendor_bank_accounts Admins can manage all vendor bank accounts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage all vendor bank accounts" ON public.vendor_bank_accounts USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: vendor_earnings Admins can manage all vendor earnings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage all vendor earnings" ON public.vendor_earnings USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: vendor_jobs Admins can manage all vendor jobs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage all vendor jobs" ON public.vendor_jobs USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: vendor_verifications Admins can manage all vendor verifications; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage all vendor verifications" ON public.vendor_verifications USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: vendors Admins can manage all vendors; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage all vendors" ON public.vendors USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: merchant_verification_history Admins can manage all verification history; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage all verification history" ON public.merchant_verification_history USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: merchant_verifications Admins can manage all verifications; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage all verifications" ON public.merchant_verifications TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: vouchers Admins can manage all vouchers; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage all vouchers" ON public.vouchers USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: chatbot_knowledge Admins can manage knowledge; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage knowledge" ON public.chatbot_knowledge USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: platform_settings Admins can manage platform settings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage platform settings" ON public.platform_settings USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: user_roles Admins can manage roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage roles" ON public.user_roles TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: subscription_tiers Admins can manage subscription tiers; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage subscription tiers" ON public.subscription_tiers USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: analytics_events Admins can view all analytics; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all analytics" ON public.analytics_events FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: audit_logs Admins can view all audit logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all audit logs" ON public.audit_logs FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: cancellation_feedback Admins can view all cancellation feedback; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all cancellation feedback" ON public.cancellation_feedback FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: chatbot_analytics Admins can view all chatbot analytics; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all chatbot analytics" ON public.chatbot_analytics FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.profiles p
  WHERE ((p.user_id = auth.uid()) AND (EXISTS ( SELECT 1
           FROM auth.users u
          WHERE ((u.id = auth.uid()) AND ((u.raw_user_meta_data ->> 'role'::text) = 'admin'::text))))))));


--
-- Name: collections_cases Admins can view all collections cases; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all collections cases" ON public.collections_cases FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.user_roles ur
  WHERE ((ur.user_id = auth.uid()) AND (ur.role = 'admin'::public.app_role)))));


--
-- Name: tenant_invitations Admins can view all invitations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all invitations" ON public.tenant_invitations FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: merchants Admins can view all merchants; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all merchants" ON public.merchants FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: profiles Admins can view all profiles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: user_roles Admins can view all roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all roles" ON public.user_roles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: analytics_events Anyone can insert analytics events; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can insert analytics events" ON public.analytics_events FOR INSERT WITH CHECK (true);


--
-- Name: chatbot_knowledge Anyone can read active knowledge; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can read active knowledge" ON public.chatbot_knowledge FOR SELECT USING ((is_active = true));


--
-- Name: platform_settings Anyone can read platform settings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can read platform settings" ON public.platform_settings FOR SELECT USING (true);


--
-- Name: unit_listings Anyone can view active listings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view active listings" ON public.unit_listings FOR SELECT USING ((status = 'active'::text));


--
-- Name: subscription_tiers Anyone can view active subscription tiers; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view active subscription tiers" ON public.subscription_tiers FOR SELECT USING ((is_active = true));


--
-- Name: products Anyone can view available products; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view available products" ON public.products FOR SELECT USING ((is_available = true));


--
-- Name: forum_likes Anyone can view likes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view likes" ON public.forum_likes FOR SELECT USING (true);


--
-- Name: maintenance_reviews Anyone can view reviews; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view reviews" ON public.maintenance_reviews FOR SELECT USING (true);


--
-- Name: forum_comments Anyone can view visible comments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view visible comments" ON public.forum_comments FOR SELECT USING ((is_visible = true));


--
-- Name: forum_posts Anyone can view visible posts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view visible posts" ON public.forum_posts FOR SELECT USING ((is_visible = true));


--
-- Name: order_reviews Anyone can view visible reviews; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view visible reviews" ON public.order_reviews FOR SELECT USING ((is_visible = true));


--
-- Name: forum_comments Authenticated users can create comments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can create comments" ON public.forum_comments FOR INSERT WITH CHECK ((auth.uid() = author_id));


--
-- Name: forum_posts Authenticated users can create posts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can create posts" ON public.forum_posts FOR INSERT WITH CHECK ((auth.uid() = author_id));


--
-- Name: forum_comments Authors can delete their comments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authors can delete their comments" ON public.forum_comments FOR DELETE USING ((author_id = auth.uid()));


--
-- Name: forum_posts Authors can delete their posts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authors can delete their posts" ON public.forum_posts FOR DELETE USING ((author_id = auth.uid()));


--
-- Name: forum_comments Authors can update their comments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authors can update their comments" ON public.forum_comments FOR UPDATE USING ((author_id = auth.uid()));


--
-- Name: forum_posts Authors can update their posts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authors can update their posts" ON public.forum_posts FOR UPDATE USING (((author_id = auth.uid()) AND (is_locked = false)));


--
-- Name: pending_subscription_changes Merchants can cancel their pending changes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Merchants can cancel their pending changes" ON public.pending_subscription_changes FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM public.merchants m
  WHERE ((m.id = pending_subscription_changes.merchant_id) AND (m.user_id = auth.uid())))));


--
-- Name: disputes Merchants can create disputes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Merchants can create disputes" ON public.disputes FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM public.merchants m
  WHERE ((m.id = disputes.merchant_id) AND (m.user_id = auth.uid())))));


--
-- Name: maintenance_updates Merchants can create updates for their requests; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Merchants can create updates for their requests" ON public.maintenance_updates FOR INSERT WITH CHECK (((author_id = auth.uid()) AND (EXISTS ( SELECT 1
   FROM (public.maintenance_requests mr
     JOIN public.merchants m ON ((m.id = mr.merchant_id)))
  WHERE ((mr.id = maintenance_updates.maintenance_request_id) AND (m.user_id = auth.uid()))))));


--
-- Name: bank_accounts Merchants can delete their bank accounts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Merchants can delete their bank accounts" ON public.bank_accounts FOR DELETE USING ((EXISTS ( SELECT 1
   FROM public.merchants m
  WHERE ((m.id = bank_accounts.merchant_id) AND (m.user_id = auth.uid())))));


--
-- Name: properties Merchants can delete their own properties; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Merchants can delete their own properties" ON public.properties FOR DELETE TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.merchants m
  WHERE ((m.id = properties.merchant_id) AND (m.user_id = auth.uid())))));


--
-- Name: units Merchants can delete their units; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Merchants can delete their units" ON public.units FOR DELETE TO authenticated USING ((EXISTS ( SELECT 1
   FROM (public.properties p
     JOIN public.merchants m ON ((m.id = p.merchant_id)))
  WHERE ((p.id = units.property_id) AND (m.user_id = auth.uid())))));


--
-- Name: vendor_jobs Merchants can insert jobs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Merchants can insert jobs" ON public.vendor_jobs FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM public.merchants m
  WHERE ((m.id = vendor_jobs.merchant_id) AND (m.user_id = auth.uid())))));


--
-- Name: bank_accounts Merchants can insert their bank accounts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Merchants can insert their bank accounts" ON public.bank_accounts FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM public.merchants m
  WHERE ((m.id = bank_accounts.merchant_id) AND (m.user_id = auth.uid())))));


--
-- Name: cancellation_feedback Merchants can insert their cancellation feedback; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Merchants can insert their cancellation feedback" ON public.cancellation_feedback FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM public.merchants m
  WHERE ((m.id = cancellation_feedback.merchant_id) AND (m.user_id = auth.uid())))));


--
-- Name: merchants Merchants can insert their own data; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Merchants can insert their own data" ON public.merchants FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user_id));


--
-- Name: properties Merchants can insert their own properties; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Merchants can insert their own properties" ON public.properties FOR INSERT TO authenticated WITH CHECK ((EXISTS ( SELECT 1
   FROM public.merchants m
  WHERE ((m.id = properties.merchant_id) AND (m.user_id = auth.uid())))));


--
-- Name: merchant_verifications Merchants can insert their own verifications; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Merchants can insert their own verifications" ON public.merchant_verifications FOR INSERT TO authenticated WITH CHECK ((EXISTS ( SELECT 1
   FROM public.merchants m
  WHERE ((m.id = merchant_verifications.merchant_id) AND (m.user_id = auth.uid())))));


--
-- Name: pending_subscription_changes Merchants can insert their pending changes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Merchants can insert their pending changes" ON public.pending_subscription_changes FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM public.merchants m
  WHERE ((m.id = pending_subscription_changes.merchant_id) AND (m.user_id = auth.uid())))));


--
-- Name: units Merchants can insert their units; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Merchants can insert their units" ON public.units FOR INSERT TO authenticated WITH CHECK ((EXISTS ( SELECT 1
   FROM (public.properties p
     JOIN public.merchants m ON ((m.id = p.merchant_id)))
  WHERE ((p.id = units.property_id) AND (m.user_id = auth.uid())))));


--
-- Name: deposit_refunds Merchants can manage deposit refunds; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Merchants can manage deposit refunds" ON public.deposit_refunds USING ((EXISTS ( SELECT 1
   FROM (public.contracts c
     JOIN public.merchants m ON ((m.id = c.merchant_id)))
  WHERE ((c.id = deposit_refunds.contract_id) AND (m.user_id = auth.uid())))));


--
-- Name: move_out_inspections Merchants can manage inspections; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Merchants can manage inspections" ON public.move_out_inspections USING ((EXISTS ( SELECT 1
   FROM ((public.move_out_notices mon
     JOIN public.contracts c ON ((c.id = mon.contract_id)))
     JOIN public.merchants m ON ((m.id = c.merchant_id)))
  WHERE ((mon.id = move_out_inspections.move_out_notice_id) AND (m.user_id = auth.uid())))));


--
-- Name: payment_plans Merchants can manage payment plans for their tenants; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Merchants can manage payment plans for their tenants" ON public.payment_plans USING ((EXISTS ( SELECT 1
   FROM public.merchants m
  WHERE ((m.id = payment_plans.merchant_id) AND (m.user_id = auth.uid())))));


--
-- Name: collections_cases Merchants can manage their collections cases; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Merchants can manage their collections cases" ON public.collections_cases USING ((EXISTS ( SELECT 1
   FROM public.merchants m
  WHERE ((m.id = collections_cases.merchant_id) AND (m.user_id = auth.uid())))));


--
-- Name: contracts Merchants can manage their contracts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Merchants can manage their contracts" ON public.contracts USING ((EXISTS ( SELECT 1
   FROM public.merchants m
  WHERE ((m.id = contracts.merchant_id) AND (m.user_id = auth.uid())))));


--
-- Name: tenant_invitations Merchants can manage their invitations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Merchants can manage their invitations" ON public.tenant_invitations USING ((EXISTS ( SELECT 1
   FROM public.merchants m
  WHERE ((m.id = tenant_invitations.merchant_id) AND (m.user_id = auth.uid())))));


--
-- Name: invoices Merchants can manage their invoices; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Merchants can manage their invoices" ON public.invoices USING ((EXISTS ( SELECT 1
   FROM public.merchants m
  WHERE ((m.id = invoices.merchant_id) AND (m.user_id = auth.uid())))));


--
-- Name: unit_listings Merchants can manage their listings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Merchants can manage their listings" ON public.unit_listings USING ((EXISTS ( SELECT 1
   FROM public.merchants m
  WHERE ((m.id = unit_listings.merchant_id) AND (m.user_id = auth.uid())))));


--
-- Name: maintenance_requests Merchants can manage their maintenance requests; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Merchants can manage their maintenance requests" ON public.maintenance_requests USING ((EXISTS ( SELECT 1
   FROM public.merchants m
  WHERE ((m.id = maintenance_requests.merchant_id) AND (m.user_id = auth.uid())))));


--
-- Name: payments Merchants can manage their payments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Merchants can manage their payments" ON public.payments USING ((EXISTS ( SELECT 1
   FROM public.merchants m
  WHERE ((m.id = payments.merchant_id) AND (m.user_id = auth.uid())))));


--
-- Name: vendor_jobs Merchants can update jobs for their requests; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Merchants can update jobs for their requests" ON public.vendor_jobs FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM public.merchants m
  WHERE ((m.id = vendor_jobs.merchant_id) AND (m.user_id = auth.uid())))));


--
-- Name: move_out_notices Merchants can update move-out notices; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Merchants can update move-out notices" ON public.move_out_notices FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM (public.contracts c
     JOIN public.merchants m ON ((m.id = c.merchant_id)))
  WHERE ((c.id = move_out_notices.contract_id) AND (m.user_id = auth.uid())))));


--
-- Name: bank_accounts Merchants can update their bank accounts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Merchants can update their bank accounts" ON public.bank_accounts FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM public.merchants m
  WHERE ((m.id = bank_accounts.merchant_id) AND (m.user_id = auth.uid())))));


--
-- Name: merchants Merchants can update their own data; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Merchants can update their own data" ON public.merchants FOR UPDATE TO authenticated USING ((auth.uid() = user_id));


--
-- Name: properties Merchants can update their own properties; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Merchants can update their own properties" ON public.properties FOR UPDATE TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.merchants m
  WHERE ((m.id = properties.merchant_id) AND (m.user_id = auth.uid())))));


--
-- Name: units Merchants can update their units; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Merchants can update their units" ON public.units FOR UPDATE TO authenticated USING ((EXISTS ( SELECT 1
   FROM (public.properties p
     JOIN public.merchants m ON ((m.id = p.merchant_id)))
  WHERE ((p.id = units.property_id) AND (m.user_id = auth.uid())))));


--
-- Name: deposit_disputes Merchants can view and respond to disputes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Merchants can view and respond to disputes" ON public.deposit_disputes USING ((EXISTS ( SELECT 1
   FROM ((public.deposit_refunds dr
     JOIN public.contracts c ON ((c.id = dr.contract_id)))
     JOIN public.merchants m ON ((m.id = c.merchant_id)))
  WHERE ((dr.id = deposit_disputes.deposit_refund_id) AND (m.user_id = auth.uid())))));


--
-- Name: early_termination_requests Merchants can view and update early termination requests; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Merchants can view and update early termination requests" ON public.early_termination_requests USING ((EXISTS ( SELECT 1
   FROM (public.contracts c
     JOIN public.merchants m ON ((m.id = c.merchant_id)))
  WHERE ((c.id = early_termination_requests.contract_id) AND (m.user_id = auth.uid())))));


--
-- Name: payment_plan_installments Merchants can view installments for their payment plans; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Merchants can view installments for their payment plans" ON public.payment_plan_installments FOR SELECT USING ((EXISTS ( SELECT 1
   FROM (public.payment_plans pp
     JOIN public.merchants m ON ((pp.merchant_id = m.id)))
  WHERE ((pp.id = payment_plan_installments.payment_plan_id) AND (m.user_id = auth.uid())))));


--
-- Name: vendor_jobs Merchants can view jobs for their requests; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Merchants can view jobs for their requests" ON public.vendor_jobs FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.merchants m
  WHERE ((m.id = vendor_jobs.merchant_id) AND (m.user_id = auth.uid())))));


--
-- Name: late_fee_records Merchants can view late fee records for their invoices; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Merchants can view late fee records for their invoices" ON public.late_fee_records FOR SELECT USING ((EXISTS ( SELECT 1
   FROM (public.invoices i
     JOIN public.merchants m ON ((i.merchant_id = m.id)))
  WHERE ((i.id = late_fee_records.invoice_id) AND (m.user_id = auth.uid())))));


--
-- Name: move_out_notices Merchants can view move-out notices for their contracts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Merchants can view move-out notices for their contracts" ON public.move_out_notices FOR SELECT USING ((EXISTS ( SELECT 1
   FROM (public.contracts c
     JOIN public.merchants m ON ((m.id = c.merchant_id)))
  WHERE ((c.id = move_out_notices.contract_id) AND (m.user_id = auth.uid())))));


--
-- Name: move_out_tasks Merchants can view move-out tasks; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Merchants can view move-out tasks" ON public.move_out_tasks FOR SELECT USING ((EXISTS ( SELECT 1
   FROM ((public.move_out_notices mon
     JOIN public.contracts c ON ((c.id = mon.contract_id)))
     JOIN public.merchants m ON ((m.id = c.merchant_id)))
  WHERE ((mon.id = move_out_tasks.move_out_notice_id) AND (m.user_id = auth.uid())))));


--
-- Name: bank_accounts Merchants can view their bank accounts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Merchants can view their bank accounts" ON public.bank_accounts FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.merchants m
  WHERE ((m.id = bank_accounts.merchant_id) AND (m.user_id = auth.uid())))));


--
-- Name: cancellation_feedback Merchants can view their cancellation feedback; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Merchants can view their cancellation feedback" ON public.cancellation_feedback FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.merchants m
  WHERE ((m.id = cancellation_feedback.merchant_id) AND (m.user_id = auth.uid())))));


--
-- Name: disbursements Merchants can view their disbursements; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Merchants can view their disbursements" ON public.disbursements FOR SELECT USING ((EXISTS ( SELECT 1
   FROM (public.escrow_accounts ea
     JOIN public.merchants m ON ((m.id = ea.merchant_id)))
  WHERE ((ea.id = disbursements.escrow_account_id) AND (m.user_id = auth.uid())))));


--
-- Name: disputes Merchants can view their disputes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Merchants can view their disputes" ON public.disputes FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.merchants m
  WHERE ((m.id = disputes.merchant_id) AND (m.user_id = auth.uid())))));


--
-- Name: escrow_accounts Merchants can view their escrow; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Merchants can view their escrow" ON public.escrow_accounts FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.merchants m
  WHERE ((m.id = escrow_accounts.merchant_id) AND (m.user_id = auth.uid())))));


--
-- Name: merchants Merchants can view their own data; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Merchants can view their own data" ON public.merchants FOR SELECT TO authenticated USING ((auth.uid() = user_id));


--
-- Name: merchant_verification_history Merchants can view their own history; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Merchants can view their own history" ON public.merchant_verification_history FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.merchants m
  WHERE ((m.id = merchant_verification_history.merchant_id) AND (m.user_id = auth.uid())))));


--
-- Name: properties Merchants can view their own properties; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Merchants can view their own properties" ON public.properties FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.merchants m
  WHERE ((m.id = properties.merchant_id) AND (m.user_id = auth.uid())))));


--
-- Name: merchant_verifications Merchants can view their own verifications; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Merchants can view their own verifications" ON public.merchant_verifications FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.merchants m
  WHERE ((m.id = merchant_verifications.merchant_id) AND (m.user_id = auth.uid())))));


--
-- Name: pending_subscription_changes Merchants can view their pending changes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Merchants can view their pending changes" ON public.pending_subscription_changes FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.merchants m
  WHERE ((m.id = pending_subscription_changes.merchant_id) AND (m.user_id = auth.uid())))));


--
-- Name: merchant_subscriptions Merchants can view their subscription; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Merchants can view their subscription" ON public.merchant_subscriptions FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.merchants m
  WHERE ((m.id = merchant_subscriptions.merchant_id) AND (m.user_id = auth.uid())))));


--
-- Name: subscription_invoices Merchants can view their subscription invoices; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Merchants can view their subscription invoices" ON public.subscription_invoices FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.merchants m
  WHERE ((m.id = subscription_invoices.merchant_id) AND (m.user_id = auth.uid())))));


--
-- Name: tenants Merchants can view their tenants; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Merchants can view their tenants" ON public.tenants FOR SELECT USING ((EXISTS ( SELECT 1
   FROM (public.contracts c
     JOIN public.merchants m ON ((m.id = c.merchant_id)))
  WHERE ((c.tenant_user_id = tenants.user_id) AND (m.user_id = auth.uid())))));


--
-- Name: escrow_transactions Merchants can view their transactions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Merchants can view their transactions" ON public.escrow_transactions FOR SELECT USING ((EXISTS ( SELECT 1
   FROM (public.escrow_accounts ea
     JOIN public.merchants m ON ((m.id = ea.merchant_id)))
  WHERE ((ea.id = escrow_transactions.escrow_account_id) AND (m.user_id = auth.uid())))));


--
-- Name: units Merchants can view their units; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Merchants can view their units" ON public.units FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM (public.properties p
     JOIN public.merchants m ON ((m.id = p.merchant_id)))
  WHERE ((p.id = units.property_id) AND (m.user_id = auth.uid())))));


--
-- Name: vendors Merchants can view verified vendors; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Merchants can view verified vendors" ON public.vendors FOR SELECT USING (((verification_status = 'verified'::text) AND public.has_role(auth.uid(), 'merchant'::public.app_role)));


--
-- Name: referrals Referees can update their referral status; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Referees can update their referral status" ON public.referrals FOR UPDATE USING ((referee_user_id = auth.uid()));


--
-- Name: referral_commissions Referrers can view their commissions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Referrers can view their commissions" ON public.referral_commissions FOR SELECT USING ((referrer_id = auth.uid()));


--
-- Name: notifications System can create notifications; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "System can create notifications" ON public.notifications FOR INSERT WITH CHECK (true);


--
-- Name: xendit_transactions System can create transactions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "System can create transactions" ON public.xendit_transactions FOR INSERT WITH CHECK (true);


--
-- Name: audit_logs System can insert audit logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "System can insert audit logs" ON public.audit_logs FOR INSERT WITH CHECK (true);


--
-- Name: move_out_timeline System can insert timeline entries; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "System can insert timeline entries" ON public.move_out_timeline FOR INSERT WITH CHECK (true);


--
-- Name: vendor_earnings System can insert vendor earnings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "System can insert vendor earnings" ON public.vendor_earnings FOR INSERT WITH CHECK (true);


--
-- Name: vouchers System can insert vouchers; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "System can insert vouchers" ON public.vouchers FOR INSERT WITH CHECK (true);


--
-- Name: referral_commissions System can manage commissions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "System can manage commissions" ON public.referral_commissions USING (true);


--
-- Name: xendit_transactions System can update transactions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "System can update transactions" ON public.xendit_transactions FOR UPDATE USING (true);


--
-- Name: disputes Tenants can create disputes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Tenants can create disputes" ON public.disputes FOR INSERT WITH CHECK ((tenant_user_id = auth.uid()));


--
-- Name: maintenance_requests Tenants can create maintenance requests; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Tenants can create maintenance requests" ON public.maintenance_requests FOR INSERT WITH CHECK ((tenant_user_id = auth.uid()));


--
-- Name: orders Tenants can create orders; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Tenants can create orders" ON public.orders FOR INSERT WITH CHECK ((tenant_user_id = auth.uid()));


--
-- Name: maintenance_reviews Tenants can create reviews for their completed requests; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Tenants can create reviews for their completed requests" ON public.maintenance_reviews FOR INSERT WITH CHECK (((tenant_user_id = auth.uid()) AND (EXISTS ( SELECT 1
   FROM public.maintenance_requests mr
  WHERE ((mr.id = maintenance_reviews.maintenance_request_id) AND (mr.tenant_user_id = auth.uid()) AND (mr.status = 'completed'::text))))));


--
-- Name: order_reviews Tenants can create reviews for their orders; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Tenants can create reviews for their orders" ON public.order_reviews FOR INSERT WITH CHECK (((tenant_user_id = auth.uid()) AND (EXISTS ( SELECT 1
   FROM public.orders o
  WHERE ((o.id = order_reviews.order_id) AND (o.tenant_user_id = auth.uid()) AND (o.status = 'completed'::text))))));


--
-- Name: maintenance_updates Tenants can create updates for their requests; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Tenants can create updates for their requests" ON public.maintenance_updates FOR INSERT WITH CHECK (((author_id = auth.uid()) AND (EXISTS ( SELECT 1
   FROM public.maintenance_requests mr
  WHERE ((mr.id = maintenance_updates.maintenance_request_id) AND (mr.tenant_user_id = auth.uid()))))));


--
-- Name: deposit_disputes Tenants can manage their deposit disputes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Tenants can manage their deposit disputes" ON public.deposit_disputes USING ((tenant_user_id = auth.uid()));


--
-- Name: early_termination_requests Tenants can manage their early termination requests; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Tenants can manage their early termination requests" ON public.early_termination_requests USING ((tenant_user_id = auth.uid()));


--
-- Name: move_out_notices Tenants can manage their move-out notices; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Tenants can manage their move-out notices" ON public.move_out_notices USING ((tenant_user_id = auth.uid()));


--
-- Name: move_out_tasks Tenants can manage their move-out tasks; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Tenants can manage their move-out tasks" ON public.move_out_tasks USING ((EXISTS ( SELECT 1
   FROM public.move_out_notices mon
  WHERE ((mon.id = move_out_tasks.move_out_notice_id) AND (mon.tenant_user_id = auth.uid())))));


--
-- Name: deposit_refunds Tenants can update bank details; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Tenants can update bank details" ON public.deposit_refunds FOR UPDATE USING ((tenant_user_id = auth.uid()));


--
-- Name: move_out_inspections Tenants can update inspection confirmation; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Tenants can update inspection confirmation" ON public.move_out_inspections FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM public.move_out_notices mon
  WHERE ((mon.id = move_out_inspections.move_out_notice_id) AND (mon.tenant_user_id = auth.uid())))));


--
-- Name: payment_plans Tenants can update their payment plans (accept/decline); Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Tenants can update their payment plans (accept/decline)" ON public.payment_plans FOR UPDATE USING ((tenant_user_id = auth.uid())) WITH CHECK ((tenant_user_id = auth.uid()));


--
-- Name: maintenance_requests Tenants can update their pending maintenance requests; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Tenants can update their pending maintenance requests" ON public.maintenance_requests FOR UPDATE USING (((tenant_user_id = auth.uid()) AND (status = 'pending'::text)));


--
-- Name: payment_plans Tenants can view and update their payment plans; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Tenants can view and update their payment plans" ON public.payment_plans FOR SELECT USING ((tenant_user_id = auth.uid()));


--
-- Name: contracts Tenants can view their contracts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Tenants can view their contracts" ON public.contracts FOR SELECT USING ((tenant_user_id = auth.uid()));


--
-- Name: deposit_refunds Tenants can view their deposit refunds; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Tenants can view their deposit refunds" ON public.deposit_refunds FOR SELECT USING ((tenant_user_id = auth.uid()));


--
-- Name: disputes Tenants can view their disputes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Tenants can view their disputes" ON public.disputes FOR SELECT USING ((tenant_user_id = auth.uid()));


--
-- Name: invoices Tenants can view their invoices; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Tenants can view their invoices" ON public.invoices FOR SELECT USING ((tenant_user_id = auth.uid()));


--
-- Name: maintenance_requests Tenants can view their maintenance requests; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Tenants can view their maintenance requests" ON public.maintenance_requests FOR SELECT USING ((tenant_user_id = auth.uid()));


--
-- Name: orders Tenants can view their orders; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Tenants can view their orders" ON public.orders FOR SELECT USING ((tenant_user_id = auth.uid()));


--
-- Name: payment_plan_installments Tenants can view their own installments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Tenants can view their own installments" ON public.payment_plan_installments FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.payment_plans pp
  WHERE ((pp.id = payment_plan_installments.payment_plan_id) AND (pp.tenant_user_id = auth.uid())))));


--
-- Name: late_fee_records Tenants can view their own late fee records; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Tenants can view their own late fee records" ON public.late_fee_records FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.invoices i
  WHERE ((i.id = late_fee_records.invoice_id) AND (i.tenant_user_id = auth.uid())))));


--
-- Name: payments Tenants can view their payments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Tenants can view their payments" ON public.payments FOR SELECT USING ((tenant_user_id = auth.uid()));


--
-- Name: referrals Users can create referrals; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create referrals" ON public.referrals FOR INSERT WITH CHECK ((referrer_user_id = auth.uid()));


--
-- Name: forum_reports Users can create reports; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create reports" ON public.forum_reports FOR INSERT WITH CHECK ((reporter_id = auth.uid()));


--
-- Name: chat_conversations Users can create their own conversations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create their own conversations" ON public.chat_conversations FOR INSERT WITH CHECK ((user_id = auth.uid()));


--
-- Name: chat_messages Users can insert messages in their conversations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert messages in their conversations" ON public.chat_messages FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM public.chat_conversations cc
  WHERE ((cc.id = chat_messages.conversation_id) AND (cc.user_id = auth.uid())))));


--
-- Name: chatbot_analytics Users can insert own chatbot analytics; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert own chatbot analytics" ON public.chatbot_analytics FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: tenants Users can insert their own tenant profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own tenant profile" ON public.tenants FOR INSERT WITH CHECK ((user_id = auth.uid()));


--
-- Name: maintenance_timeline Users can insert timeline entries for their requests; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert timeline entries for their requests" ON public.maintenance_timeline FOR INSERT WITH CHECK (((actor_id = auth.uid()) AND (EXISTS ( SELECT 1
   FROM public.maintenance_requests mr
  WHERE ((mr.id = maintenance_timeline.maintenance_request_id) AND ((mr.tenant_user_id = auth.uid()) OR (EXISTS ( SELECT 1
           FROM public.merchants m
          WHERE ((m.id = mr.merchant_id) AND (m.user_id = auth.uid())))) OR (EXISTS ( SELECT 1
           FROM public.vendors v
          WHERE ((v.id = mr.assigned_vendor_id) AND (v.user_id = auth.uid()))))))))));


--
-- Name: forum_likes Users can manage their likes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can manage their likes" ON public.forum_likes USING ((user_id = auth.uid()));


--
-- Name: notifications Users can update their notifications; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their notifications" ON public.notifications FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: chat_conversations Users can update their own conversations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own conversations" ON public.chat_conversations FOR UPDATE USING ((user_id = auth.uid()));


--
-- Name: profiles Users can update their own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE TO authenticated USING ((auth.uid() = user_id));


--
-- Name: tenants Users can update their own tenant profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own tenant profile" ON public.tenants FOR UPDATE USING ((user_id = auth.uid()));


--
-- Name: vouchers Users can update their vouchers (use them); Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their vouchers (use them)" ON public.vouchers FOR UPDATE USING ((owner_id = auth.uid()));


--
-- Name: chat_messages Users can view messages in their conversations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view messages in their conversations" ON public.chat_messages FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.chat_conversations cc
  WHERE ((cc.id = chat_messages.conversation_id) AND (cc.user_id = auth.uid())))));


--
-- Name: chatbot_analytics Users can view own chatbot analytics; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own chatbot analytics" ON public.chatbot_analytics FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: move_out_inspections Users can view their inspections; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their inspections" ON public.move_out_inspections FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.move_out_notices mon
  WHERE ((mon.id = move_out_inspections.move_out_notice_id) AND ((mon.tenant_user_id = auth.uid()) OR (EXISTS ( SELECT 1
           FROM (public.contracts c
             JOIN public.merchants m ON ((m.id = c.merchant_id)))
          WHERE ((c.id = mon.contract_id) AND (m.user_id = auth.uid())))))))));


--
-- Name: notifications Users can view their notifications; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their notifications" ON public.notifications FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: chat_conversations Users can view their own conversations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own conversations" ON public.chat_conversations FOR SELECT USING ((user_id = auth.uid()));


--
-- Name: profiles Users can view their own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT TO authenticated USING ((auth.uid() = user_id));


--
-- Name: user_roles Users can view their own roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own roles" ON public.user_roles FOR SELECT TO authenticated USING ((auth.uid() = user_id));


--
-- Name: tenants Users can view their own tenant profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own tenant profile" ON public.tenants FOR SELECT USING ((user_id = auth.uid()));


--
-- Name: xendit_transactions Users can view their own transactions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own transactions" ON public.xendit_transactions FOR SELECT USING ((user_id = auth.uid()));


--
-- Name: referrals Users can view their referrals; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their referrals" ON public.referrals FOR SELECT USING (((referrer_user_id = auth.uid()) OR (referee_user_id = auth.uid())));


--
-- Name: forum_reports Users can view their reports; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their reports" ON public.forum_reports FOR SELECT USING ((reporter_id = auth.uid()));


--
-- Name: referral_rewards Users can view their rewards; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their rewards" ON public.referral_rewards FOR SELECT USING ((user_id = auth.uid()));


--
-- Name: vouchers Users can view their vouchers; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their vouchers" ON public.vouchers FOR SELECT USING ((owner_id = auth.uid()));


--
-- Name: move_out_timeline Users can view timeline for their move-outs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view timeline for their move-outs" ON public.move_out_timeline FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.move_out_notices mon
  WHERE ((mon.id = move_out_timeline.move_out_notice_id) AND ((mon.tenant_user_id = auth.uid()) OR (EXISTS ( SELECT 1
           FROM (public.contracts c
             JOIN public.merchants m ON ((m.id = c.merchant_id)))
          WHERE ((c.id = mon.contract_id) AND (m.user_id = auth.uid())))))))));


--
-- Name: maintenance_timeline Users can view timeline for their requests; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view timeline for their requests" ON public.maintenance_timeline FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.maintenance_requests mr
  WHERE ((mr.id = maintenance_timeline.maintenance_request_id) AND ((mr.tenant_user_id = auth.uid()) OR (EXISTS ( SELECT 1
           FROM public.merchants m
          WHERE ((m.id = mr.merchant_id) AND (m.user_id = auth.uid())))) OR (EXISTS ( SELECT 1
           FROM public.vendors v
          WHERE ((v.id = mr.assigned_vendor_id) AND (v.user_id = auth.uid())))))))));


--
-- Name: maintenance_updates Users can view updates for their requests; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view updates for their requests" ON public.maintenance_updates FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.maintenance_requests mr
  WHERE ((mr.id = maintenance_updates.maintenance_request_id) AND ((mr.tenant_user_id = auth.uid()) OR (EXISTS ( SELECT 1
           FROM public.merchants m
          WHERE ((m.id = mr.merchant_id) AND (m.user_id = auth.uid())))))))));


--
-- Name: vendor_bank_accounts Vendors can delete their bank accounts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Vendors can delete their bank accounts" ON public.vendor_bank_accounts FOR DELETE USING ((EXISTS ( SELECT 1
   FROM public.vendors v
  WHERE ((v.id = vendor_bank_accounts.vendor_id) AND (v.user_id = auth.uid())))));


--
-- Name: vendor_bank_accounts Vendors can insert their bank accounts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Vendors can insert their bank accounts" ON public.vendor_bank_accounts FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM public.vendors v
  WHERE ((v.id = vendor_bank_accounts.vendor_id) AND (v.user_id = auth.uid())))));


--
-- Name: vendors Vendors can insert their own data; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Vendors can insert their own data" ON public.vendors FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: vendor_verifications Vendors can insert their verifications; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Vendors can insert their verifications" ON public.vendor_verifications FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM public.vendors v
  WHERE ((v.id = vendor_verifications.vendor_id) AND (v.user_id = auth.uid())))));


--
-- Name: products Vendors can manage their products; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Vendors can manage their products" ON public.products USING ((EXISTS ( SELECT 1
   FROM public.vendors v
  WHERE ((v.id = products.vendor_id) AND (v.user_id = auth.uid())))));


--
-- Name: order_reviews Vendors can reply to reviews; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Vendors can reply to reviews" ON public.order_reviews FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM public.vendors v
  WHERE ((v.id = order_reviews.vendor_id) AND (v.user_id = auth.uid())))));


--
-- Name: vendor_bank_accounts Vendors can update their bank accounts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Vendors can update their bank accounts" ON public.vendor_bank_accounts FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM public.vendors v
  WHERE ((v.id = vendor_bank_accounts.vendor_id) AND (v.user_id = auth.uid())))));


--
-- Name: vendor_jobs Vendors can update their jobs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Vendors can update their jobs" ON public.vendor_jobs FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM public.vendors v
  WHERE ((v.id = vendor_jobs.vendor_id) AND (v.user_id = auth.uid())))));


--
-- Name: orders Vendors can update their orders; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Vendors can update their orders" ON public.orders FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM public.vendors v
  WHERE ((v.id = orders.vendor_id) AND (v.user_id = auth.uid())))));


--
-- Name: vendors Vendors can update their own data; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Vendors can update their own data" ON public.vendors FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: orders Vendors can view orders for their products; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Vendors can view orders for their products" ON public.orders FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.vendors v
  WHERE ((v.id = orders.vendor_id) AND (v.user_id = auth.uid())))));


--
-- Name: vendor_bank_accounts Vendors can view their bank accounts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Vendors can view their bank accounts" ON public.vendor_bank_accounts FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.vendors v
  WHERE ((v.id = vendor_bank_accounts.vendor_id) AND (v.user_id = auth.uid())))));


--
-- Name: disbursements Vendors can view their disbursements; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Vendors can view their disbursements" ON public.disbursements FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.vendors v
  WHERE ((v.id = disbursements.vendor_id) AND (v.user_id = auth.uid())))));


--
-- Name: vendor_earnings Vendors can view their earnings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Vendors can view their earnings" ON public.vendor_earnings FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.vendors v
  WHERE ((v.id = vendor_earnings.vendor_id) AND (v.user_id = auth.uid())))));


--
-- Name: vendor_jobs Vendors can view their jobs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Vendors can view their jobs" ON public.vendor_jobs FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.vendors v
  WHERE ((v.id = vendor_jobs.vendor_id) AND (v.user_id = auth.uid())))));


--
-- Name: vendors Vendors can view their own data; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Vendors can view their own data" ON public.vendors FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: vendor_verifications Vendors can view their verifications; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Vendors can view their verifications" ON public.vendor_verifications FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.vendors v
  WHERE ((v.id = vendor_verifications.vendor_id) AND (v.user_id = auth.uid())))));


--
-- Name: analytics_events; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

--
-- Name: audit_logs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

--
-- Name: bank_accounts; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.bank_accounts ENABLE ROW LEVEL SECURITY;

--
-- Name: cancellation_feedback; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.cancellation_feedback ENABLE ROW LEVEL SECURITY;

--
-- Name: chat_conversations; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.chat_conversations ENABLE ROW LEVEL SECURITY;

--
-- Name: chat_messages; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

--
-- Name: chatbot_analytics; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.chatbot_analytics ENABLE ROW LEVEL SECURITY;

--
-- Name: chatbot_knowledge; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.chatbot_knowledge ENABLE ROW LEVEL SECURITY;

--
-- Name: collections_cases; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.collections_cases ENABLE ROW LEVEL SECURITY;

--
-- Name: contracts; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;

--
-- Name: deposit_disputes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.deposit_disputes ENABLE ROW LEVEL SECURITY;

--
-- Name: deposit_refunds; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.deposit_refunds ENABLE ROW LEVEL SECURITY;

--
-- Name: disbursements; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.disbursements ENABLE ROW LEVEL SECURITY;

--
-- Name: disputes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.disputes ENABLE ROW LEVEL SECURITY;

--
-- Name: early_termination_requests; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.early_termination_requests ENABLE ROW LEVEL SECURITY;

--
-- Name: escrow_accounts; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.escrow_accounts ENABLE ROW LEVEL SECURITY;

--
-- Name: escrow_transactions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.escrow_transactions ENABLE ROW LEVEL SECURITY;

--
-- Name: forum_comments; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.forum_comments ENABLE ROW LEVEL SECURITY;

--
-- Name: forum_likes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.forum_likes ENABLE ROW LEVEL SECURITY;

--
-- Name: forum_posts; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.forum_posts ENABLE ROW LEVEL SECURITY;

--
-- Name: forum_reports; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.forum_reports ENABLE ROW LEVEL SECURITY;

--
-- Name: invoices; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

--
-- Name: late_fee_records; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.late_fee_records ENABLE ROW LEVEL SECURITY;

--
-- Name: maintenance_requests; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.maintenance_requests ENABLE ROW LEVEL SECURITY;

--
-- Name: maintenance_reviews; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.maintenance_reviews ENABLE ROW LEVEL SECURITY;

--
-- Name: maintenance_timeline; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.maintenance_timeline ENABLE ROW LEVEL SECURITY;

--
-- Name: maintenance_updates; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.maintenance_updates ENABLE ROW LEVEL SECURITY;

--
-- Name: merchant_subscriptions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.merchant_subscriptions ENABLE ROW LEVEL SECURITY;

--
-- Name: merchant_verification_history; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.merchant_verification_history ENABLE ROW LEVEL SECURITY;

--
-- Name: merchant_verifications; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.merchant_verifications ENABLE ROW LEVEL SECURITY;

--
-- Name: merchants; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.merchants ENABLE ROW LEVEL SECURITY;

--
-- Name: move_out_inspections; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.move_out_inspections ENABLE ROW LEVEL SECURITY;

--
-- Name: move_out_notices; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.move_out_notices ENABLE ROW LEVEL SECURITY;

--
-- Name: move_out_tasks; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.move_out_tasks ENABLE ROW LEVEL SECURITY;

--
-- Name: move_out_timeline; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.move_out_timeline ENABLE ROW LEVEL SECURITY;

--
-- Name: notifications; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

--
-- Name: order_reviews; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.order_reviews ENABLE ROW LEVEL SECURITY;

--
-- Name: orders; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

--
-- Name: payment_plan_installments; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.payment_plan_installments ENABLE ROW LEVEL SECURITY;

--
-- Name: payment_plans; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.payment_plans ENABLE ROW LEVEL SECURITY;

--
-- Name: payments; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

--
-- Name: pending_subscription_changes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.pending_subscription_changes ENABLE ROW LEVEL SECURITY;

--
-- Name: platform_settings; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

--
-- Name: products; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

--
-- Name: profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: properties; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;

--
-- Name: referral_commissions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.referral_commissions ENABLE ROW LEVEL SECURITY;

--
-- Name: referral_rewards; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.referral_rewards ENABLE ROW LEVEL SECURITY;

--
-- Name: referrals; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

--
-- Name: subscription_invoices; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.subscription_invoices ENABLE ROW LEVEL SECURITY;

--
-- Name: subscription_tiers; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.subscription_tiers ENABLE ROW LEVEL SECURITY;

--
-- Name: tenant_invitations; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.tenant_invitations ENABLE ROW LEVEL SECURITY;

--
-- Name: tenants; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

--
-- Name: unit_listings; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.unit_listings ENABLE ROW LEVEL SECURITY;

--
-- Name: units; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.units ENABLE ROW LEVEL SECURITY;

--
-- Name: user_roles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

--
-- Name: vendor_bank_accounts; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.vendor_bank_accounts ENABLE ROW LEVEL SECURITY;

--
-- Name: vendor_earnings; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.vendor_earnings ENABLE ROW LEVEL SECURITY;

--
-- Name: vendor_jobs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.vendor_jobs ENABLE ROW LEVEL SECURITY;

--
-- Name: vendor_verifications; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.vendor_verifications ENABLE ROW LEVEL SECURITY;

--
-- Name: vendors; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;

--
-- Name: vouchers; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.vouchers ENABLE ROW LEVEL SECURITY;

--
-- Name: xendit_transactions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.xendit_transactions ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--




COMMIT;