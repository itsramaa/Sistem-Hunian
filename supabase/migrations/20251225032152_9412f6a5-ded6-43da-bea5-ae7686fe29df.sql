-- Create chatbot_analytics table for tracking chatbot usage
CREATE TABLE public.chatbot_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID REFERENCES public.chat_conversations(id) ON DELETE CASCADE,
  user_id UUID,
  user_role TEXT,
  query_type TEXT, -- 'faq', 'data_query', 'action', 'unclear'
  action_taken TEXT,
  response_time_ms INTEGER,
  user_satisfied BOOLEAN,
  message_count INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.chatbot_analytics ENABLE ROW LEVEL SECURITY;

-- Users can view their own analytics
CREATE POLICY "Users can view own chatbot analytics" 
ON public.chatbot_analytics 
FOR SELECT 
USING (auth.uid() = user_id);

-- Users can insert their own analytics
CREATE POLICY "Users can insert own chatbot analytics" 
ON public.chatbot_analytics 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Admins can view all analytics
CREATE POLICY "Admins can view all chatbot analytics" 
ON public.chatbot_analytics 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM auth.users u 
      WHERE u.id = auth.uid() 
      AND u.raw_user_meta_data->>'role' = 'admin'
    )
  )
);

-- Add index for performance
CREATE INDEX idx_chatbot_analytics_user_id ON public.chatbot_analytics(user_id);
CREATE INDEX idx_chatbot_analytics_created_at ON public.chatbot_analytics(created_at DESC);