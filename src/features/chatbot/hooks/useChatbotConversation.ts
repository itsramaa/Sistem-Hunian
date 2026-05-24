import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/features/auth/hooks/useAuth';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatbotConversationOptions {
  maxMessages?: number;
  autoLoad?: boolean;
}

// Validate message role
const isValidRole = (role: string): role is 'user' | 'assistant' => {
  return role === 'user' || role === 'assistant';
};

// TODO: Go endpoint not yet implemented for chatbot conversation domain
// All supabase calls (chat_conversations, chat_messages, chatbot_analytics) are stubbed

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
    // TODO: Go endpoint not yet implemented — was: supabase.from('chat_conversations').select(...)
    // Stub: no-op, start fresh each session
  }, [user?.id]);

  const createConversation = useCallback(async (_title?: string): Promise<string | null> => {
    if (!user?.id) return null;
    // TODO: Go endpoint not yet implemented — was: supabase.from('chat_conversations').insert(...)
    // Stub: generate a local ID
    const localId = `local_${Date.now()}`;
    setConversationId(localId);
    return localId;
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

    // TODO: Go endpoint not yet implemented — was: supabase.from('chat_messages').insert(...)
    // Stub: track locally only
    const messageKey = `${message.role}_${message.content.slice(0, 100)}_${Date.now()}`;
    savedMessageIds.current.add(messageKey);
  }, [conversationId, user?.id, createConversation]);

  const addMessage = useCallback((message: Message) => {
    setMessages(prev => [...prev, message]);
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
    // TODO: Go endpoint not yet implemented — was: supabase.from('chat_conversations').update({ is_active: false })
    setMessages([]);
    setConversationId(null);
    savedMessageIds.current.clear();
  }, [conversationId]);

  const trackAnalytics = useCallback(async (_data: {
    queryType?: string;
    actionTaken?: string;
    responseTimeMs?: number;
    userSatisfied?: boolean;
  }) => {
    if (!user?.id) return;
    // TODO: Go endpoint not yet implemented — was: supabase.from('chatbot_analytics').insert(...)
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
