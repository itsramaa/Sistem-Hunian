import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { ScrollArea } from "@/shared/components/ui/scroll-area";
import { X, Send, Bot, Loader2, Home, CreditCard, Wrench, ShoppingBag, HelpCircle, RefreshCw, Trash2, WifiOff, Copy, Check } from "lucide-react";
import { cn } from "@/shared/utils/utils";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useChatbotTracking } from "@/features/analytics/hooks/useAnalytics";
import { useChatbotConversation } from "@/features/chatbot/hooks/useChatbotConversation";
import { ChatMessageRenderer } from "@/features/chatbot/components/ChatMessageRenderer";
import { toast } from "sonner";

const MAX_MESSAGE_LENGTH = 1000;
const MAX_RETRIES = 3;

// Input sanitization for prompt injection prevention
const sanitizeInput = (input: string): string => {
  const patterns = [
    /ignore previous instructions/gi,
    /system:/gi,
    /\[INST\]/gi,
    /<\|.*?\|>/g,
    /```system/gi,
  ];
  
  let sanitized = input;
  patterns.forEach(pattern => {
    sanitized = sanitized.replace(pattern, '');
  });
  
  return sanitized.trim().slice(0, MAX_MESSAGE_LENGTH);
};

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

// Role-specific assistant titles
const ROLE_ASSISTANT_INFO: Record<string, { title: string; subtitle: string }> = {
  tenant: { title: "Asisten Tenant", subtitle: "Siap membantu Anda" },
  merchant: { title: "Asisten Bisnis", subtitle: "Siap membantu bisnis Anda" },
  vendor: { title: "Asisten Vendor", subtitle: "Siap membantu bisnis Anda" },
  default: { title: "Sihuni Assistant", subtitle: "Siap membantu Anda" },
};

// Get the correct edge function URL based on role
function getChatUrl(role: string): string {
  const base = import.meta.env.VITE_SUPABASE_URL;
  switch (role) {
    case 'merchant':
      return `${base}/functions/v1/merchant-ai-assistant`;
    case 'vendor':
      return `${base}/functions/v1/vendor-ai-assistant`;
    case 'tenant':
    default:
      return `${base}/functions/v1/ai-chatbot`;
  }
}

interface Message {
  role: "user" | "assistant";
  content: string;
  failed?: boolean;
}

interface ChatbotDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ChatbotDialog({ isOpen, onClose }: ChatbotDialogProps) {
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [localMessages, setLocalMessages] = useState<Message[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const conversationLoadedRef = useRef(false);
  const { user, role, merchant, vendor } = useAuth();
  const { trackChatbotMessage } = useChatbotTracking();
  const {
    messages: savedMessages,
    setMessages,
    saveMessage,
    trackAnalytics,
    clearConversation,
  } = useChatbotConversation({ autoLoad: isOpen });

  const userRole = (role as keyof typeof ROLE_QUICK_ACTIONS) || 'default';
  const quickActions = ROLE_QUICK_ACTIONS[userRole] || ROLE_QUICK_ACTIONS.default;
  const assistantInfo = ROLE_ASSISTANT_INFO[userRole] || ROLE_ASSISTANT_INFO.default;
  const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || '';

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Load saved messages only once to prevent race condition
  useEffect(() => {
    if (savedMessages.length > 0 && !conversationLoadedRef.current) {
      setLocalMessages(savedMessages.map(m => ({ ...m, failed: false })));
      conversationLoadedRef.current = true;
    }
  }, [savedMessages]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [localMessages]);

  const streamChat = useCallback(async (userMessage: string, retryCount = 0) => {
    if (!isOnline) {
      toast.error("Tidak ada koneksi internet. Coba lagi nanti.");
      return;
    }

    const sanitizedMessage = sanitizeInput(userMessage);
    if (!sanitizedMessage) return;

    setIsStreaming(true);
    const startTime = Date.now();
    trackChatbotMessage('user');
    
    const userMsg: Message = { role: "user", content: sanitizedMessage };
    const newMessages = [...localMessages.filter(m => !m.failed), userMsg];
    setLocalMessages(newMessages);
    setInput("");

    // Save user message
    saveMessage(userMsg);

    abortControllerRef.current = new AbortController();

    // Build role-specific request body
    const chatUrl = getChatUrl(userRole);
    const bodyPayload: Record<string, unknown> = {
      messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
      userId: user?.id,
    };

    // Add role-specific context
    if (userRole === 'merchant' && merchant) {
      bodyPayload.merchantId = merchant.id;
    } else if (userRole === 'vendor' && vendor) {
      bodyPayload.vendorId = vendor.id;
    } else {
      bodyPayload.context = {
        role: userRole,
        userName,
      };
    }

    try {
      const resp = await fetch(chatUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify(bodyPayload),
        signal: abortControllerRef.current.signal,
      });

      if (!resp.ok || !resp.body) {
        const errorData = await resp.json().catch(() => ({}));
        
        if (resp.status === 429) {
          throw new Error("ERR_RATE_LIMIT");
        }
        if (resp.status === 402) {
          throw new Error("ERR_PAYMENT_REQUIRED");
        }
        throw new Error(errorData.error || "ERR_CONNECTION");
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";
      let assistantContent = "";
      let streamDone = false;

      // Add empty assistant message
      setLocalMessages((prev) => [...prev, { role: "assistant", content: "" }]);

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
              setLocalMessages((prev) => {
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
        queryType: detectQueryType(sanitizedMessage),
        responseTimeMs: responseTime,
      });

      trackChatbotMessage('bot');
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        return;
      }

      console.error("Chat error:", error);
      
      const errorMessage = (error as Error).message;
      let userFriendlyMessage = "Maaf, terjadi kesalahan. ";
      
      if (errorMessage === "ERR_RATE_LIMIT") {
        userFriendlyMessage = "Terlalu banyak permintaan. Tunggu sebentar dan coba lagi.";
      } else if (errorMessage === "ERR_PAYMENT_REQUIRED") {
        userFriendlyMessage = "Layanan sementara tidak tersedia. Coba lagi nanti.";
      } else if (retryCount < MAX_RETRIES - 1) {
        const delay = Math.pow(2, retryCount) * 1000;
        toast.info(`Mencoba ulang dalam ${delay / 1000} detik...`);
        setTimeout(() => {
          streamChat(sanitizedMessage, retryCount + 1);
        }, delay);
        return;
      } else {
        userFriendlyMessage += "Silakan coba lagi.";
      }
      
      setLocalMessages((prev) => [
        ...prev.filter(m => m.role === 'user'),
        {
          role: "assistant",
          content: userFriendlyMessage,
          failed: true,
        },
      ]);
    } finally {
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  }, [localMessages, user, userRole, userName, merchant, vendor, isOnline, trackChatbotMessage, saveMessage, trackAnalytics]);

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
    if (isStreaming || !isOnline) return;
    streamChat(query);
  };

  const handleRetry = () => {
    const lastUserMessage = [...localMessages].reverse().find(m => m.role === 'user');
    if (lastUserMessage) {
      setLocalMessages(localMessages.filter(m => !m.failed));
      streamChat(lastUserMessage.content);
    }
  };

  const handleNewChat = async () => {
    await clearConversation();
    setLocalMessages([]);
    conversationLoadedRef.current = false;
    toast.success("Percakapan baru dimulai");
  };

  const handleFeedback = async (satisfied: boolean) => {
    await trackAnalytics({ userSatisfied: satisfied });
    toast.success(satisfied ? "Terima kasih atas feedbacknya!" : "Kami akan berusaha lebih baik");
  };

  const hasFailed = localMessages.some(m => m.failed);

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
          aria-label="Tutup"
        >
          <X className="h-4 w-4" />
        </Button>
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-foreground/20">
          <Bot className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm">{assistantInfo.title}</h3>
          <div className="flex items-center gap-1 text-xs opacity-80">
            {!isOnline && <WifiOff className="h-3 w-3" />}
            <span>{isOnline ? assistantInfo.subtitle : "Offline"}</span>
          </div>
        </div>
        {localMessages.length > 0 && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-primary-foreground hover:bg-primary-foreground/20"
            onClick={handleNewChat}
            aria-label="Percakapan baru"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="hidden md:flex h-8 w-8 text-primary-foreground hover:bg-primary-foreground/20"
          onClick={onClose}
          aria-label="Tutup"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Offline indicator */}
      {!isOnline && (
        <div className="bg-destructive/10 text-destructive text-xs p-2 text-center flex items-center justify-center gap-1">
          <WifiOff className="h-3 w-3" />
          <span>Tidak ada koneksi internet</span>
        </div>
      )}

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        {localMessages.length === 0 ? (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-muted-foreground">
              Hai{userName ? ` ${userName}` : ''}! 👋 Saya {assistantInfo.title.toLowerCase()} Sihuni. Ada yang bisa saya bantu hari ini?
            </p>
            <div className="flex flex-col gap-2">
              {quickActions.map((action) => (
                <Button
                  key={action.label}
                  variant="outline"
                  size="sm"
                  className="justify-start text-xs h-auto py-2"
                  onClick={() => handleQuickAction(action.query)}
                  disabled={!isOnline}
                >
                  <action.icon className="h-4 w-4 mr-2 flex-shrink-0" />
                  {action.label}
                </Button>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {localMessages.map((message, index) => (
              <ChatMessageRenderer
                key={index}
                content={message.content}
                role={message.role}
                isLoading={isStreaming && index === localMessages.length - 1 && message.role === "assistant"}
                showFeedback={
                  message.role === "assistant" && 
                  index === localMessages.length - 1 && 
                  !isStreaming && 
                  message.content.length > 0 &&
                  !message.failed
                }
                onFeedback={handleFeedback}
                failed={message.failed}
              />
            ))}
            
            {/* Retry button for failed messages */}
            {hasFailed && !isStreaming && (
              <div className="flex justify-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRetry}
                  className="gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Coba Lagi
                </Button>
              </div>
            )}
          </div>
        )}
      </ScrollArea>

      {/* Input */}
      <form onSubmit={handleSubmit} className="flex gap-2 border-t p-3 bg-background shrink-0 safe-area-bottom">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value.slice(0, MAX_MESSAGE_LENGTH))}
          placeholder="Ketik pesan..."
          disabled={isStreaming || !isOnline}
          className="flex-1 rounded-full h-10"
          maxLength={MAX_MESSAGE_LENGTH}
        />
        <Button 
          type="submit" 
          size="icon" 
          disabled={isStreaming || !input.trim() || !isOnline} 
          className="rounded-full h-10 w-10 shrink-0"
          aria-label="Kirim"
        >
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