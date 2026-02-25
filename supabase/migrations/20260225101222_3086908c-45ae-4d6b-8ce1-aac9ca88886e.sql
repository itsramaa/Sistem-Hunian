
-- Tabel feedback merchant
CREATE TABLE public.merchant_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID REFERENCES public.merchants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  category TEXT NOT NULL,
  rating INTEGER,
  message TEXT NOT NULL,
  screenshot_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  admin_response TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tabel live chat conversations
CREATE TABLE public.live_chat_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  user_role TEXT NOT NULL,
  merchant_id UUID REFERENCES public.merchants(id),
  status TEXT NOT NULL DEFAULT 'open',
  subject TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tabel live chat messages
CREATE TABLE public.live_chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES public.live_chat_conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  sender_role TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable realtime for live chat
ALTER PUBLICATION supabase_realtime ADD TABLE public.live_chat_messages;

-- RLS
ALTER TABLE public.merchant_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_chat_messages ENABLE ROW LEVEL SECURITY;

-- Feedback policies
CREATE POLICY "Users can insert own feedback" ON public.merchant_feedback FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can read own feedback" ON public.merchant_feedback FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admin can manage feedback" ON public.merchant_feedback FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Live chat conversation policies
CREATE POLICY "Users see own conversations" ON public.live_chat_conversations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users create own conversations" ON public.live_chat_conversations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admin manage all conversations" ON public.live_chat_conversations FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Live chat message policies
CREATE POLICY "Participants see messages" ON public.live_chat_messages FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.live_chat_conversations WHERE id = conversation_id AND (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin')))
);
CREATE POLICY "Participants send messages" ON public.live_chat_messages FOR INSERT WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "Admin manage messages" ON public.live_chat_messages FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Updated_at triggers
CREATE TRIGGER update_merchant_feedback_updated_at BEFORE UPDATE ON public.merchant_feedback FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_live_chat_conversations_updated_at BEFORE UPDATE ON public.live_chat_conversations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
