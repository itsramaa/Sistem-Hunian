-- =====================================================
-- PHASE 1: SUBSCRIPTION SYSTEM
-- =====================================================

-- Subscription tiers table
CREATE TABLE public.subscription_tiers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    display_name TEXT NOT NULL,
    description TEXT,
    price_monthly NUMERIC NOT NULL DEFAULT 0,
    price_yearly NUMERIC,
    max_properties INTEGER NOT NULL DEFAULT 1,
    max_units INTEGER NOT NULL DEFAULT 5,
    max_tenants INTEGER NOT NULL DEFAULT 5,
    features JSONB DEFAULT '[]'::jsonb,
    trial_days INTEGER DEFAULT 14,
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Merchant subscriptions table
CREATE TABLE public.merchant_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id UUID NOT NULL REFERENCES public.merchants(id) ON DELETE CASCADE,
    tier_id UUID NOT NULL REFERENCES public.subscription_tiers(id),
    status TEXT NOT NULL DEFAULT 'trialing' CHECK (status IN ('trialing', 'active', 'past_due', 'canceled', 'expired')),
    trial_ends_at TIMESTAMPTZ,
    current_period_start TIMESTAMPTZ NOT NULL DEFAULT now(),
    current_period_end TIMESTAMPTZ NOT NULL,
    canceled_at TIMESTAMPTZ,
    payment_method TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(merchant_id)
);

-- Insert default subscription tiers
INSERT INTO public.subscription_tiers (name, display_name, description, price_monthly, price_yearly, max_properties, max_units, max_tenants, features, trial_days, sort_order) VALUES
('free', 'Free', 'Basic features for getting started', 0, 0, 1, 5, 5, '["Basic property management", "Up to 5 units", "Email support"]'::jsonb, 0, 1),
('basic', 'Basic', 'Essential features for small landlords', 99000, 990000, 3, 20, 20, '["Up to 3 properties", "Up to 20 units", "Invoice generation", "Payment tracking", "Email support"]'::jsonb, 14, 2),
('pro', 'Professional', 'Advanced features for growing businesses', 299000, 2990000, 10, 100, 100, '["Up to 10 properties", "Up to 100 units", "Advanced reports", "Vendor marketplace", "Priority support", "Custom branding"]'::jsonb, 14, 3),
('enterprise', 'Enterprise', 'Full features for large organizations', 799000, 7990000, -1, -1, -1, '["Unlimited properties", "Unlimited units", "API access", "Dedicated support", "Custom integrations", "SLA guarantee"]'::jsonb, 14, 4);

-- =====================================================
-- PHASE 2: TENANT PROFILE SYSTEM
-- =====================================================

-- Tenants table for extended profile
CREATE TABLE public.tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    ktp_number TEXT,
    ktp_photo_url TEXT,
    date_of_birth DATE,
    gender TEXT CHECK (gender IN ('male', 'female', 'other')),
    emergency_contact_name TEXT,
    emergency_contact_phone TEXT,
    emergency_contact_relation TEXT,
    occupation TEXT,
    income_range TEXT,
    verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected')),
    verified_at TIMESTAMPTZ,
    verified_by UUID,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(user_id)
);

-- =====================================================
-- PHASE 3: AI CHATBOT
-- =====================================================

-- Chat conversations table
CREATE TABLE public.chat_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT,
    context JSONB DEFAULT '{}'::jsonb,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Chat messages table
CREATE TABLE public.chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES public.chat_conversations(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Chatbot knowledge base for FAQs
CREATE TABLE public.chatbot_knowledge (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category TEXT NOT NULL,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    keywords TEXT[],
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Insert default FAQ knowledge
INSERT INTO public.chatbot_knowledge (category, question, answer, keywords) VALUES
('payments', 'How do I pay my rent?', 'You can pay your rent through the Payments section in your tenant dashboard. We support bank transfer and various payment methods. Simply click on the pending invoice and follow the payment instructions.', ARRAY['rent', 'pay', 'payment', 'invoice', 'bayar', 'sewa']),
('payments', 'When is my rent due?', 'Rent is typically due on the 1st of each month. You can check your specific due dates in the Invoices section of your dashboard. Late payments may incur additional fees as specified in your contract.', ARRAY['due', 'deadline', 'jatuh tempo', 'tanggal']),
('maintenance', 'How do I report a maintenance issue?', 'Go to the Maintenance section in your dashboard and click "New Request". Describe the issue, select the priority level, and optionally upload photos. Our team will respond within 24-48 hours.', ARRAY['maintenance', 'repair', 'broken', 'fix', 'rusak', 'perbaikan']),
('contracts', 'How do I view my contract?', 'You can view your active contract in the Contracts section of your tenant dashboard. This includes all terms, rent amount, and contract duration.', ARRAY['contract', 'lease', 'agreement', 'kontrak', 'sewa']),
('general', 'How do I contact support?', 'You can reach our support team through this chatbot, or email us at support@sihuni.com. For urgent matters, please contact your property manager directly.', ARRAY['support', 'help', 'contact', 'bantuan', 'hubungi']),
('vendors', 'How do I find a service vendor?', 'Visit the Marketplace section to browse verified vendors for various services like plumbing, electrical, cleaning, and more. You can filter by service type, rating, and location.', ARRAY['vendor', 'service', 'marketplace', 'tukang', 'jasa']);

-- =====================================================
-- PHASE 4: VENDOR MARKETPLACE
-- =====================================================

-- Products table
CREATE TABLE public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_id UUID NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL,
    price NUMERIC NOT NULL,
    unit TEXT DEFAULT 'unit',
    photos TEXT[],
    stock INTEGER,
    is_available BOOLEAN DEFAULT true,
    min_order INTEGER DEFAULT 1,
    max_order INTEGER,
    service_area TEXT[],
    estimated_duration TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Orders table
CREATE TABLE public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number TEXT NOT NULL UNIQUE,
    tenant_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    vendor_id UUID NOT NULL REFERENCES public.vendors(id),
    product_id UUID NOT NULL REFERENCES public.products(id),
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price NUMERIC NOT NULL,
    total_price NUMERIC NOT NULL,
    service_fee NUMERIC DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'in_progress', 'completed', 'canceled', 'refunded')),
    notes TEXT,
    scheduled_date DATE,
    scheduled_time TEXT,
    address TEXT,
    unit_id UUID REFERENCES public.units(id),
    completed_at TIMESTAMPTZ,
    canceled_at TIMESTAMPTZ,
    cancel_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Order reviews table
CREATE TABLE public.order_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    tenant_user_id UUID NOT NULL REFERENCES auth.users(id),
    vendor_id UUID NOT NULL REFERENCES public.vendors(id),
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review_text TEXT,
    photos TEXT[],
    vendor_reply TEXT,
    vendor_replied_at TIMESTAMPTZ,
    is_visible BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(order_id)
);

-- Function to generate order number
CREATE OR REPLACE FUNCTION public.generate_order_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

CREATE TRIGGER generate_order_number_trigger
    BEFORE INSERT ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION public.generate_order_number();

-- =====================================================
-- PHASE 5: COMMUNITY FORUM
-- =====================================================

-- Forum posts table
CREATE TABLE public.forum_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    photos TEXT[],
    tags TEXT[],
    is_pinned BOOLEAN DEFAULT false,
    is_locked BOOLEAN DEFAULT false,
    view_count INTEGER DEFAULT 0,
    comment_count INTEGER DEFAULT 0,
    like_count INTEGER DEFAULT 0,
    is_visible BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Forum comments table
CREATE TABLE public.forum_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES public.forum_posts(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES public.forum_comments(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    like_count INTEGER DEFAULT 0,
    is_visible BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Forum likes table
CREATE TABLE public.forum_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    post_id UUID REFERENCES public.forum_posts(id) ON DELETE CASCADE,
    comment_id UUID REFERENCES public.forum_comments(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(user_id, post_id),
    UNIQUE(user_id, comment_id),
    CHECK ((post_id IS NOT NULL AND comment_id IS NULL) OR (post_id IS NULL AND comment_id IS NOT NULL))
);

-- Forum reports table
CREATE TABLE public.forum_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    post_id UUID REFERENCES public.forum_posts(id) ON DELETE CASCADE,
    comment_id UUID REFERENCES public.forum_comments(id) ON DELETE CASCADE,
    reason TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
    reviewed_by UUID REFERENCES auth.users(id),
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================
-- RLS POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE public.subscription_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.merchant_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chatbot_knowledge ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_reports ENABLE ROW LEVEL SECURITY;

-- Subscription tiers policies (public read)
CREATE POLICY "Anyone can view active subscription tiers" ON public.subscription_tiers
    FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage subscription tiers" ON public.subscription_tiers
    FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Merchant subscriptions policies
CREATE POLICY "Merchants can view their subscription" ON public.merchant_subscriptions
    FOR SELECT USING (EXISTS (
        SELECT 1 FROM merchants m WHERE m.id = merchant_subscriptions.merchant_id AND m.user_id = auth.uid()
    ));
CREATE POLICY "Admins can manage all subscriptions" ON public.merchant_subscriptions
    FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Tenants policies
CREATE POLICY "Users can view their own tenant profile" ON public.tenants
    FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can update their own tenant profile" ON public.tenants
    FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can insert their own tenant profile" ON public.tenants
    FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Admins can manage all tenant profiles" ON public.tenants
    FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Merchants can view their tenants" ON public.tenants
    FOR SELECT USING (EXISTS (
        SELECT 1 FROM contracts c
        JOIN merchants m ON m.id = c.merchant_id
        WHERE c.tenant_user_id = tenants.user_id AND m.user_id = auth.uid()
    ));

-- Chat conversations policies
CREATE POLICY "Users can view their own conversations" ON public.chat_conversations
    FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can create their own conversations" ON public.chat_conversations
    FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update their own conversations" ON public.chat_conversations
    FOR UPDATE USING (user_id = auth.uid());

-- Chat messages policies
CREATE POLICY "Users can view messages in their conversations" ON public.chat_messages
    FOR SELECT USING (EXISTS (
        SELECT 1 FROM chat_conversations cc WHERE cc.id = chat_messages.conversation_id AND cc.user_id = auth.uid()
    ));
CREATE POLICY "Users can insert messages in their conversations" ON public.chat_messages
    FOR INSERT WITH CHECK (EXISTS (
        SELECT 1 FROM chat_conversations cc WHERE cc.id = chat_messages.conversation_id AND cc.user_id = auth.uid()
    ));

-- Chatbot knowledge policies (public read)
CREATE POLICY "Anyone can read active knowledge" ON public.chatbot_knowledge
    FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage knowledge" ON public.chatbot_knowledge
    FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Products policies
CREATE POLICY "Anyone can view available products" ON public.products
    FOR SELECT USING (is_available = true);
CREATE POLICY "Vendors can manage their products" ON public.products
    FOR ALL USING (EXISTS (
        SELECT 1 FROM vendors v WHERE v.id = products.vendor_id AND v.user_id = auth.uid()
    ));
CREATE POLICY "Admins can manage all products" ON public.products
    FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Orders policies
CREATE POLICY "Tenants can view their orders" ON public.orders
    FOR SELECT USING (tenant_user_id = auth.uid());
CREATE POLICY "Tenants can create orders" ON public.orders
    FOR INSERT WITH CHECK (tenant_user_id = auth.uid());
CREATE POLICY "Vendors can view orders for their products" ON public.orders
    FOR SELECT USING (EXISTS (
        SELECT 1 FROM vendors v WHERE v.id = orders.vendor_id AND v.user_id = auth.uid()
    ));
CREATE POLICY "Vendors can update their orders" ON public.orders
    FOR UPDATE USING (EXISTS (
        SELECT 1 FROM vendors v WHERE v.id = orders.vendor_id AND v.user_id = auth.uid()
    ));
CREATE POLICY "Admins can manage all orders" ON public.orders
    FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Order reviews policies
CREATE POLICY "Anyone can view visible reviews" ON public.order_reviews
    FOR SELECT USING (is_visible = true);
CREATE POLICY "Tenants can create reviews for their orders" ON public.order_reviews
    FOR INSERT WITH CHECK (tenant_user_id = auth.uid() AND EXISTS (
        SELECT 1 FROM orders o WHERE o.id = order_reviews.order_id AND o.tenant_user_id = auth.uid() AND o.status = 'completed'
    ));
CREATE POLICY "Vendors can reply to reviews" ON public.order_reviews
    FOR UPDATE USING (EXISTS (
        SELECT 1 FROM vendors v WHERE v.id = order_reviews.vendor_id AND v.user_id = auth.uid()
    ));
CREATE POLICY "Admins can manage all reviews" ON public.order_reviews
    FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Forum posts policies
CREATE POLICY "Anyone can view visible posts" ON public.forum_posts
    FOR SELECT USING (is_visible = true);
CREATE POLICY "Authenticated users can create posts" ON public.forum_posts
    FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Authors can update their posts" ON public.forum_posts
    FOR UPDATE USING (author_id = auth.uid() AND is_locked = false);
CREATE POLICY "Authors can delete their posts" ON public.forum_posts
    FOR DELETE USING (author_id = auth.uid());
CREATE POLICY "Admins can manage all posts" ON public.forum_posts
    FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Forum comments policies
CREATE POLICY "Anyone can view visible comments" ON public.forum_comments
    FOR SELECT USING (is_visible = true);
CREATE POLICY "Authenticated users can create comments" ON public.forum_comments
    FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Authors can update their comments" ON public.forum_comments
    FOR UPDATE USING (author_id = auth.uid());
CREATE POLICY "Authors can delete their comments" ON public.forum_comments
    FOR DELETE USING (author_id = auth.uid());
CREATE POLICY "Admins can manage all comments" ON public.forum_comments
    FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Forum likes policies
CREATE POLICY "Anyone can view likes" ON public.forum_likes
    FOR SELECT USING (true);
CREATE POLICY "Users can manage their likes" ON public.forum_likes
    FOR ALL USING (user_id = auth.uid());

-- Forum reports policies
CREATE POLICY "Users can create reports" ON public.forum_reports
    FOR INSERT WITH CHECK (reporter_id = auth.uid());
CREATE POLICY "Users can view their reports" ON public.forum_reports
    FOR SELECT USING (reporter_id = auth.uid());
CREATE POLICY "Admins can manage all reports" ON public.forum_reports
    FOR ALL USING (has_role(auth.uid(), 'admin'));

-- =====================================================
-- TRIGGERS FOR UPDATED_AT
-- =====================================================

CREATE TRIGGER update_subscription_tiers_updated_at BEFORE UPDATE ON public.subscription_tiers
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_merchant_subscriptions_updated_at BEFORE UPDATE ON public.merchant_subscriptions
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_tenants_updated_at BEFORE UPDATE ON public.tenants
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_chat_conversations_updated_at BEFORE UPDATE ON public.chat_conversations
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_chatbot_knowledge_updated_at BEFORE UPDATE ON public.chatbot_knowledge
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_order_reviews_updated_at BEFORE UPDATE ON public.order_reviews
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_forum_posts_updated_at BEFORE UPDATE ON public.forum_posts
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_forum_comments_updated_at BEFORE UPDATE ON public.forum_comments
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- REALTIME ENABLEMENT
-- =====================================================

ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.forum_posts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.forum_comments;