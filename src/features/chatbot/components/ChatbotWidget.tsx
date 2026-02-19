import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { ScrollArea } from "@/shared/components/ui/scroll-area";
import { MessageCircle, X, Send, Bot, User, Loader2, RefreshCw, Trash2, WifiOff, Copy, Check } from "lucide-react";
import { cn } from "@/shared/utils/utils";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useChatbotTracking } from "@/features/analytics/hooks/useAnalytics";
import { toast } from "sonner";

interface Message {
  role: "user" | "assistant";
  content: string;
  failed?: boolean;
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-chatbot`;
const MAX_MESSAGE_LENGTH = 1000;
const MAX_RETRIES = 3;

// Indonesian FAQ suggestions
const FAQ_SUGGESTIONS = [
  "Bagaimana cara bayar sewa?",
  "Cara lapor kerusakan?",
  "Cari vendor terdekat",
  "Lihat kontrak saya",
];

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

export function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const { user } = useAuth();
  const { trackChatbotOpened, trackChatbotMessage } = useChatbotTracking();

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

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const streamChat = useCallback(async (userMessage: string, retryCount = 0) => {
    if (!isOnline) {
      toast.error("Tidak ada koneksi internet. Coba lagi nanti.");
      return;
    }

    const sanitizedMessage = sanitizeInput(userMessage);
    if (!sanitizedMessage) return;

    setIsLoading(true);
    trackChatbotMessage('user');
    
    // Mark any previous failed messages as not failed
    const newMessages: Message[] = [...messages.filter(m => !m.failed), { role: "user" as const, content: sanitizedMessage }];
    setMessages(newMessages);
    setInput("");

    // Create abort controller for this request
    abortControllerRef.current = new AbortController();

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
          context: { role: user?.user_metadata?.role },
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!resp.ok || !resp.body) {
        const errorData = await resp.json().catch(() => ({}));
        
        // Handle specific error codes
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
      
      trackChatbotMessage('bot');
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        return; // User cancelled
      }

      console.error("Chat error:", error);
      
      const errorMessage = (error as Error).message;
      let userFriendlyMessage = "Maaf, terjadi kesalahan. ";
      
      if (errorMessage === "ERR_RATE_LIMIT") {
        userFriendlyMessage = "Terlalu banyak permintaan. Tunggu sebentar dan coba lagi.";
      } else if (errorMessage === "ERR_PAYMENT_REQUIRED") {
        userFriendlyMessage = "Layanan sementara tidak tersedia. Coba lagi nanti.";
      } else if (retryCount < MAX_RETRIES - 1) {
        // Retry with exponential backoff
        const delay = Math.pow(2, retryCount) * 1000;
        toast.info(`Mencoba ulang dalam ${delay / 1000} detik...`);
        setTimeout(() => {
          streamChat(sanitizedMessage, retryCount + 1);
        }, delay);
        return;
      } else {
        userFriendlyMessage += "Silakan coba lagi.";
      }
      
      setMessages((prev) => [
        ...prev.filter(m => m.role === 'user'),
        {
          role: "assistant",
          content: userFriendlyMessage,
          failed: true,
        },
      ]);
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  }, [messages, user, isOnline, trackChatbotMessage]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    streamChat(input.trim());
  };

  const handleSuggestion = (suggestion: string) => {
    if (isLoading) return;
    streamChat(suggestion);
  };

  const handleRetry = () => {
    const lastUserMessage = [...messages].reverse().find(m => m.role === 'user');
    if (lastUserMessage) {
      setMessages(messages.filter(m => !m.failed));
      streamChat(lastUserMessage.content);
    }
  };

  const handleNewChat = () => {
    setMessages([]);
    toast.success("Percakapan baru dimulai");
  };

  const handleCopyMessage = (content: string, index: number) => {
    navigator.clipboard.writeText(content);
    setCopiedIndex(index);
    toast.success("Pesan disalin");
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const hasFailed = messages.some(m => m.failed);

  return (
    <>
      {/* Floating Button */}
      <Button
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) trackChatbotOpened();
        }}
        className={cn(
          "fixed z-50 h-12 w-12 rounded-full shadow-lg transition-all duration-300",
          "bottom-20 right-4 md:bottom-6 md:right-6",
          isOpen && "rotate-90"
        )}
        size="icon"
        aria-label={isOpen ? "Tutup chat" : "Buka chat"}
      >
        {isOpen ? <X className="h-5 w-5" /> : <MessageCircle className="h-5 w-5" />}
      </Button>

      {/* Chat Widget */}
      {isOpen && (
        <div className={cn(
          "fixed z-50 overflow-hidden bg-background shadow-2xl flex flex-col",
          "inset-0 md:inset-auto",
          "md:bottom-24 md:right-6 md:w-[380px] md:h-[500px] md:max-w-[calc(100vw-3rem)] md:rounded-2xl md:border"
        )}>
          {/* Header */}
          <div className="flex items-center gap-3 bg-primary p-3 text-primary-foreground shrink-0">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden h-8 w-8 text-primary-foreground hover:bg-primary-foreground/20"
              onClick={() => setIsOpen(false)}
              aria-label="Tutup"
            >
              <X className="h-4 w-4" />
            </Button>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-foreground/20">
              <Bot className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm">Sihuni Assistant</h3>
              <div className="flex items-center gap-1 text-xs opacity-80">
                {!isOnline && <WifiOff className="h-3 w-3" />}
                <span>{isOnline ? "Siap membantu Anda" : "Offline"}</span>
              </div>
            </div>
            {messages.length > 0 && (
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
            {messages.length === 0 ? (
              <div className="flex flex-col gap-4">
                <p className="text-sm text-muted-foreground">
                  Hai! Saya siap membantu Anda dengan pembayaran, maintenance, vendor, dan lainnya. Ada yang bisa saya bantu?
                </p>
                <div className="flex flex-wrap gap-2">
                  {FAQ_SUGGESTIONS.map((suggestion) => (
                    <Button
                      key={suggestion}
                      variant="outline"
                      size="sm"
                      className="text-xs"
                      onClick={() => handleSuggestion(suggestion)}
                      disabled={!isOnline}
                    >
                      {suggestion}
                    </Button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={cn(
                      "flex gap-2 group",
                      message.role === "user" ? "flex-row-reverse" : "flex-row"
                    )}
                  >
                    <div
                      className={cn(
                        "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                        message.role === "user" ? "bg-primary" : "bg-muted"
                      )}
                    >
                      {message.role === "user" ? (
                        <User className="h-4 w-4 text-primary-foreground" />
                      ) : (
                        <Bot className="h-4 w-4" />
                      )}
                    </div>
                    <div className="flex flex-col gap-1 max-w-[75%]">
                      <div
                        className={cn(
                          "rounded-2xl px-4 py-2 text-sm",
                          message.role === "user"
                            ? "bg-primary text-primary-foreground"
                            : message.failed
                            ? "bg-destructive/10 text-destructive"
                            : "bg-muted"
                        )}
                      >
                        {message.content || (
                          <div className="flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span className="text-muted-foreground animate-pulse">Mengetik...</span>
                          </div>
                        )}
                      </div>
                      {/* Copy button for assistant messages */}
                      {message.role === "assistant" && message.content && !message.failed && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity self-start"
                          onClick={() => handleCopyMessage(message.content, index)}
                          aria-label="Salin pesan"
                        >
                          {copiedIndex === index ? (
                            <Check className="h-3 w-3 text-green-500" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
                
                {/* Retry button for failed messages */}
                {hasFailed && !isLoading && (
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
              disabled={isLoading || !isOnline}
              className="flex-1 rounded-full h-10"
              maxLength={MAX_MESSAGE_LENGTH}
            />
            <Button 
              type="submit" 
              size="icon" 
              disabled={isLoading || !input.trim() || !isOnline} 
              className="rounded-full h-10 w-10 shrink-0"
              aria-label="Kirim"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </form>
        </div>
      )}
    </>
  );
}
