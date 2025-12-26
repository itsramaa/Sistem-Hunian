import { useState, useEffect, useCallback, useRef } from 'react';
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

// Validate message role
const isValidRole = (role: string): role is 'user' | 'assistant' => {
  return role === 'user' || role === 'assistant';
};

export function useChatbotConversation(options: ChatbotConversationOptions = {}) {
  const { maxMessages = 20, autoLoad = true } = options;
  const { user } = useAuth();
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Track saved message IDs to prevent duplicates
  const savedMessageIds = useRef<Set<string>>(new Set());
  const loadingConversation = useRef(false);

  // Load or create conversation on mount - with race condition prevention
  useEffect(() => {
    if (autoLoad && user?.id && !loadingConversation.current) {
      loadingConversation.current = true;
      loadActiveConversation().finally(() => {
        loadingConversation.current = false;
      });
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
        .select('id, role, content')
        .eq('conversation_id', convId)
        .order('created_at', { ascending: true })
        .limit(maxMessages);

      if (error) throw error;

      if (data) {
        // Track loaded message IDs
        data.forEach(m => savedMessageIds.current.add(m.id));
        
        setMessages(data
          .filter(m => isValidRole(m.role))
          .map(m => ({
            role: m.role as 'user' | 'assistant',
            content: m.content,
          }))
        );
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
          title: title || 'Percakapan Baru',
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

    // Validate message
    if (!message.content || message.content.length > 5000) {
      console.warn('Invalid message: content too long or empty');
      return;
    }
    
    if (!isValidRole(message.role)) {
      console.warn('Invalid message role:', message.role);
      return;
    }

    // Create unique key for deduplication
    const messageKey = `${message.role}_${message.content.slice(0, 100)}_${Date.now()}`;
    
    // Check for duplicate save (within 2 second window)
    const recentKey = Array.from(savedMessageIds.current).find(id => id.startsWith(messageKey.slice(0, 50)));
    if (recentKey) {
      console.log('Skipping duplicate message save');
      return;
    }

    let convId = conversationId;
    
    // Create conversation if needed
    if (!convId) {
      convId = await createConversation();
      if (!convId) return;
    }

    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .insert({
          conversation_id: convId,
          role: message.role,
          content: message.content,
        })
        .select('id')
        .single();

      if (error) throw error;
      
      // Track saved message
      if (data) {
        savedMessageIds.current.add(data.id);
      }

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
    // Note: saveMessage is now called separately to prevent double saves
  }, []);

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
    savedMessageIds.current.clear();
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
