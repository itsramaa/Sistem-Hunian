import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/hooks/useAuth';
import { useChatbotConversation } from '@/hooks/useChatbotConversation';
import { ChatMessageRenderer } from '@/components/chatbot/ChatMessageRenderer';
import { 
  MessageSquare, 
  Send, 
  Loader2, 
  X, 
  Bot, 
  TrendingUp,
  CreditCard,
  Users,
  Calendar,
  BarChart3
} from 'lucide-react';
import { cn } from '@/lib/utils';

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/merchant-ai-assistant`;

const QUICK_ACTIONS = [
  { label: 'Siapa yang belum bayar?', icon: CreditCard, query: 'Siapa tenant yang belum bayar bulan ini? Berikan detail dan action yang bisa dilakukan.' },
  { label: 'Revenue bulan ini', icon: TrendingUp, query: 'Berapa total revenue bulan ini? Bandingkan dengan bulan lalu.' },
  { label: 'Kontrak expiring', icon: Calendar, query: 'Kontrak mana yang akan berakhir dalam 30 hari? Sertakan action untuk follow up.' },
  { label: 'Occupancy rate', icon: Users, query: 'Berapa occupancy rate properti saya saat ini? Berikan saran untuk meningkatkannya.' },
  { label: 'Prediksi revenue', icon: BarChart3, query: 'Prediksi revenue bulan depan berdasarkan tren 6 bulan terakhir.' },
];

export function MerchantChatbot() {
  const { merchant, user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const {
    messages,
    setMessages,
    addMessage,
    saveMessage,
    trackAnalytics,
  } = useChatbotConversation({ autoLoad: isOpen });

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const streamChat = async (messageText: string) => {
    if (!messageText.trim() || isStreaming || !merchant?.id) return;

    const startTime = Date.now();
    const userMessage = { role: 'user' as const, content: messageText };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    addMessage(userMessage);
    setInput('');
    setIsStreaming(true);

    try {
      const resp = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
          merchantId: merchant.id,
          userId: user?.id,
        }),
      });

      if (!resp.ok || !resp.body) {
        const errorData = await resp.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to connect');
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = '';
      let assistantContent = '';
      let streamDone = false;

      // Add empty assistant message
      setMessages((prev) => [...prev, { role: 'assistant', content: '' }]);

      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') {
            streamDone = true;
            break;
          }

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              assistantContent += content;
              setMessages((prev) => {
                const updated = [...prev];
                updated[updated.length - 1] = { role: 'assistant', content: assistantContent };
                return updated;
              });
            }
          } catch {
            textBuffer = line + '\n' + textBuffer;
            break;
          }
        }
      }

      // Save assistant message
      if (assistantContent) {
        saveMessage({ role: 'assistant', content: assistantContent });
      }

      // Track analytics
      const responseTime = Date.now() - startTime;
      trackAnalytics({
        queryType: 'business_query',
        responseTimeMs: responseTime,
      });

    } catch (error) {
      console.error('Chatbot error:', error);
      const errorMessage = {
        role: 'assistant' as const,
        content: 'Maaf, terjadi kesalahan. Silakan coba lagi.',
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsStreaming(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    streamChat(input);
  };

  const handleQuickAction = (query: string) => {
    streamChat(query);
  };

  const handleFeedback = async (satisfied: boolean) => {
    await trackAnalytics({ userSatisfied: satisfied });
  };

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50"
        size="icon"
      >
        <MessageSquare className="h-6 w-6" />
      </Button>
    );
  }

  return (
    <Card className={cn(
      "fixed z-50 shadow-2xl flex flex-col",
      "inset-4 md:inset-auto",
      "md:bottom-6 md:right-6 md:w-[400px] md:h-[600px]"
    )}>
      <CardHeader className="flex flex-row items-center justify-between py-3 px-4 border-b shrink-0">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-primary/10">
            <Bot className="h-5 w-5 text-primary" />
          </div>
          <CardTitle className="text-base">Business Assistant</CardTitle>
        </div>
        <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
        <ScrollArea className="flex-1 p-4" ref={scrollRef}>
          {messages.length === 0 ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground text-center">
                Halo! Saya bisa membantu Anda dengan informasi bisnis dan analisis data.
              </p>
              <div className="grid grid-cols-1 gap-2">
                {QUICK_ACTIONS.map((action) => (
                  <Button
                    key={action.label}
                    variant="outline"
                    size="sm"
                    className="h-auto py-2 px-3 justify-start text-left"
                    onClick={() => handleQuickAction(action.query)}
                    disabled={isStreaming}
                  >
                    <action.icon className="h-4 w-4 mr-2 flex-shrink-0" />
                    <span className="text-xs">{action.label}</span>
                  </Button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message, index) => (
                <ChatMessageRenderer
                  key={index}
                  content={message.content}
                  role={message.role}
                  isLoading={isStreaming && index === messages.length - 1 && message.role === 'assistant'}
                  showFeedback={
                    message.role === 'assistant' && 
                    index === messages.length - 1 && 
                    !isStreaming && 
                    message.content.length > 0
                  }
                  onFeedback={handleFeedback}
                />
              ))}
            </div>
          )}
        </ScrollArea>

        <form onSubmit={handleSubmit} className="p-3 border-t shrink-0">
          <div className="flex gap-2">
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Tanya tentang bisnis Anda..."
              disabled={isStreaming}
              className="flex-1"
            />
            <Button type="submit" size="icon" disabled={isStreaming || !input.trim()}>
              {isStreaming ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
