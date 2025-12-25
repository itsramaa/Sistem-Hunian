import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { X, Send, Bot, Loader2, Home, CreditCard, Wrench, ShoppingBag, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useChatbotTracking } from "@/hooks/useAnalytics";
import { useChatbotConversation } from "@/hooks/useChatbotConversation";
import { ChatMessageRenderer } from "./ChatMessageRenderer";

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-chatbot`;

// Role-specific quick actions in Indonesian
const ROLE_QUICK_ACTIONS = {
  tenant: [
    { label: "Cek status sewa", icon: Home, query: "Cek status sewa saya bulan ini" },
    { label: "Lihat tagihan", icon: CreditCard, query: "Tampilkan tagihan yang belum dibayar" },
    { label: "Lapor maintenance", icon: Wrench, query: "Bagaimana cara melaporkan kerusakan?" },
    { label: "Cari laundry", icon: ShoppingBag, query: "Rekomendasi laundry terdekat dengan rating bagus" },
    { label: "Bantuan lainnya", icon: HelpCircle, query: "Apa saja yang bisa kamu bantu?" },
  ],
  merchant: [
    { label: "Tenant belum bayar", icon: CreditCard, query: "Siapa tenant yang belum bayar bulan ini?" },
    { label: "Revenue bulan ini", icon: Home, query: "Berapa total revenue bulan ini?" },
    { label: "Kontrak expiring", icon: Wrench, query: "Kontrak mana yang akan berakhir dalam 30 hari?" },
    { label: "Occupancy rate", icon: ShoppingBag, query: "Berapa occupancy rate properti saya?" },
  ],
  vendor: [
    { label: "Tips penjualan", icon: Home, query: "Tips untuk tingkatkan penjualan" },
    { label: "Produk terlaris", icon: ShoppingBag, query: "Apa produk terlaris saya?" },
    { label: "Cara buat promo", icon: CreditCard, query: "Bagaimana cara membuat promo?" },
    { label: "Analisis performa", icon: Wrench, query: "Analisis performa bisnis saya" },
  ],
  default: [
    { label: "Cara bayar sewa", icon: CreditCard, query: "Cara bayar sewa gimana?" },
    { label: "Lapor maintenance", icon: Wrench, query: "Bagaimana cara lapor maintenance?" },
    { label: "Cari vendor", icon: ShoppingBag, query: "Rekomendasi vendor terdekat" },
    { label: "Lihat kontrak", icon: Home, query: "Lihat detail kontrak saya" },
  ],
};

interface ChatbotDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ChatbotDialog({ isOpen, onClose }: ChatbotDialogProps) {
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const { trackChatbotMessage } = useChatbotTracking();
  const {
    messages,
    setMessages,
    addMessage,
    saveMessage,
    trackAnalytics,
  } = useChatbotConversation({ autoLoad: isOpen });

  const userRole = (user?.user_metadata?.role as keyof typeof ROLE_QUICK_ACTIONS) || 'default';
  const quickActions = ROLE_QUICK_ACTIONS[userRole] || ROLE_QUICK_ACTIONS.default;
  const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || '';

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const streamChat = async (userMessage: string) => {
    setIsStreaming(true);
    const startTime = Date.now();
    trackChatbotMessage('user');
    
    const userMsg = { role: "user" as const, content: userMessage };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    addMessage(userMsg);
    setInput("");

    try {
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
          userId: user?.id,
          context: { 
            role: userRole,
            userName,
          },
        }),
      });

      if (!resp.ok || !resp.body) {
        const errorData = await resp.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to connect to assistant");
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";
      let assistantContent = "";
      let streamDone = false;

      // Add empty assistant message
      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") {
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
                updated[updated.length - 1] = { role: "assistant", content: assistantContent };
                return updated;
              });
            }
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }

      // Save assistant message
      if (assistantContent) {
        saveMessage({ role: "assistant", content: assistantContent });
      }

      // Track analytics
      const responseTime = Date.now() - startTime;
      trackAnalytics({
        queryType: detectQueryType(userMessage),
        responseTimeMs: responseTime,
      });

    } catch (error) {
      console.error("Chat error:", error);
      const errorMsg = {
        role: "assistant" as const,
        content: "Maaf, terjadi kesalahan. Silakan coba lagi nanti.",
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsStreaming(false);
      trackChatbotMessage('bot');
    }
  };

  const detectQueryType = (message: string): string => {
    const lowerMsg = message.toLowerCase();
    if (lowerMsg.includes('bayar') || lowerMsg.includes('tagihan') || lowerMsg.includes('invoice')) {
      return 'payment';
    }
    if (lowerMsg.includes('maintenance') || lowerMsg.includes('kerusakan') || lowerMsg.includes('perbaikan')) {
      return 'maintenance';
    }
    if (lowerMsg.includes('vendor') || lowerMsg.includes('laundry') || lowerMsg.includes('service')) {
      return 'vendor_search';
    }
    if (lowerMsg.includes('kontrak') || lowerMsg.includes('contract')) {
      return 'contract';
    }
    return 'general';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isStreaming) return;
    streamChat(input.trim());
  };

  const handleQuickAction = (query: string) => {
    if (isStreaming) return;
    streamChat(query);
  };

  const handleFeedback = async (satisfied: boolean) => {
    await trackAnalytics({ userSatisfied: satisfied });
  };

  if (!isOpen) return null;

  return (
    <div className={cn(
      "fixed z-50 overflow-hidden bg-background shadow-2xl flex flex-col",
      "inset-0 md:inset-auto",
      "md:bottom-24 md:right-6 md:w-[400px] md:h-[600px] md:max-w-[calc(100vw-3rem)] md:rounded-2xl md:border"
    )}>
      {/* Header */}
      <div className="flex items-center gap-3 bg-primary p-3 text-primary-foreground shrink-0">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden h-8 w-8 text-primary-foreground hover:bg-primary-foreground/20"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </Button>
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-foreground/20">
          <Bot className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm">Sihuni Assistant</h3>
          <p className="text-xs opacity-80">Siap membantu Anda</p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="hidden md:flex h-8 w-8 text-primary-foreground hover:bg-primary-foreground/20"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        {messages.length === 0 ? (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-muted-foreground">
              Hai{userName ? ` ${userName}` : ''}! 👋 Saya asisten Sihuni. Ada yang bisa saya bantu hari ini?
            </p>
            <div className="flex flex-col gap-2">
              {quickActions.map((action) => (
                <Button
                  key={action.label}
                  variant="outline"
                  size="sm"
                  className="justify-start text-xs h-auto py-2"
                  onClick={() => handleQuickAction(action.query)}
                >
                  <action.icon className="h-4 w-4 mr-2 flex-shrink-0" />
                  {action.label}
                </Button>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {messages.map((message, index) => (
              <ChatMessageRenderer
                key={index}
                content={message.content}
                role={message.role}
                isLoading={isStreaming && index === messages.length - 1 && message.role === "assistant"}
                showFeedback={
                  message.role === "assistant" && 
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

      {/* Input */}
      <form onSubmit={handleSubmit} className="flex gap-2 border-t p-3 bg-background shrink-0 safe-area-bottom">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ketik pesan..."
          disabled={isStreaming}
          className="flex-1 rounded-full h-10"
        />
        <Button type="submit" size="icon" disabled={isStreaming || !input.trim()} className="rounded-full h-10 w-10 shrink-0">
          {isStreaming ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </form>
    </div>
  );
}
