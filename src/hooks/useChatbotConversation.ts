import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface ConversationData {
  id: string;
  title: string | null;
  context: Record<string, unknown> | null;
  is_active: boolean | null;
  created_at: string;
  updated_at: string;
}

interface ChatbotConversationOptions {
  maxMessages?: number;
  autoLoad?: boolean;
}

export function useChatbotConversation(options: ChatbotConversationOptions = {}) {
  const { maxMessages = 20, autoLoad = true } = options;
  const { user } = useAuth();
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load or create conversation on mount
  useEffect(() => {
    if (autoLoad && user?.id) {
      loadActiveConversation();
    }
  }, [user?.id, autoLoad]);

  const loadActiveConversation = useCallback(async () => {
    if (!user?.id) return;

    try {
      // Find active conversation
      const { data: conversations, error } = await supabase
        .from('chat_conversations')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('updated_at', { ascending: false })
        .limit(1);

      if (error) throw error;

      if (conversations && conversations.length > 0) {
        const conversation = conversations[0] as ConversationData;
        setConversationId(conversation.id);
        await loadMessages(conversation.id);
      }
    } catch (error) {
      console.error('Failed to load conversation:', error);
    }
  }, [user?.id]);

  const loadMessages = async (convId: string) => {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('role, content')
        .eq('conversation_id', convId)
        .order('created_at', { ascending: true })
        .limit(maxMessages);

      if (error) throw error;

      if (data) {
        setMessages(data.map(m => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        })));
      }
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  };

  const createConversation = useCallback(async (title?: string): Promise<string | null> => {
    if (!user?.id) return null;

    try {
      const { data, error } = await supabase
        .from('chat_conversations')
        .insert({
          user_id: user.id,
          title: title || 'New Conversation',
          is_active: true,
          context: { role: user?.user_metadata?.role },
        })
        .select('id')
        .single();

      if (error) throw error;
      
      setConversationId(data.id);
      return data.id;
    } catch (error) {
      console.error('Failed to create conversation:', error);
      return null;
    }
  }, [user?.id]);

  const saveMessage = useCallback(async (message: Message) => {
    if (!user?.id) return;

    let convId = conversationId;
    
    // Create conversation if needed
    if (!convId) {
      convId = await createConversation();
      if (!convId) return;
    }

    try {
      await supabase
        .from('chat_messages')
        .insert({
          conversation_id: convId,
          role: message.role,
          content: message.content,
        });

      // Update conversation timestamp
      await supabase
        .from('chat_conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', convId);

    } catch (error) {
      console.error('Failed to save message:', error);
    }
  }, [conversationId, user?.id, createConversation]);

  const addMessage = useCallback((message: Message) => {
    setMessages(prev => [...prev, message]);
    saveMessage(message);
  }, [saveMessage]);

  const updateLastAssistantMessage = useCallback((content: string) => {
    setMessages(prev => {
      const updated = [...prev];
      if (updated.length > 0 && updated[updated.length - 1].role === 'assistant') {
        updated[updated.length - 1] = { role: 'assistant', content };
      }
      return updated;
    });
  }, []);

  const clearConversation = useCallback(async () => {
    if (conversationId) {
      try {
        await supabase
          .from('chat_conversations')
          .update({ is_active: false })
          .eq('id', conversationId);
      } catch (error) {
        console.error('Failed to close conversation:', error);
      }
    }
    setMessages([]);
    setConversationId(null);
  }, [conversationId]);

  const trackAnalytics = useCallback(async (data: {
    queryType?: string;
    actionTaken?: string;
    responseTimeMs?: number;
    userSatisfied?: boolean;
  }) => {
    if (!user?.id) return;

    try {
      await supabase
        .from('chatbot_analytics')
        .insert({
          conversation_id: conversationId,
          user_id: user.id,
          user_role: user?.user_metadata?.role || 'unknown',
          query_type: data.queryType,
          action_taken: data.actionTaken,
          response_time_ms: data.responseTimeMs,
          user_satisfied: data.userSatisfied,
          message_count: messages.length + 1,
        });
    } catch (error) {
      console.error('Failed to track analytics:', error);
    }
  }, [conversationId, user?.id, messages.length]);

  return {
    conversationId,
    messages,
    setMessages,
    isLoading,
    setIsLoading,
    addMessage,
    updateLastAssistantMessage,
    clearConversation,
    loadActiveConversation,
    createConversation,
    saveMessage,
    trackAnalytics,
  };
}
