import { useState, useRef, useEffect } from "react";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { ScrollArea } from "@/shared/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { MessageCircle, X, Send, Sparkles, Loader2, TrendingUp, Lightbulb, Package, Star } from "lucide-react";
import { cn } from "@/shared/utils/utils";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useChatbotConversation } from "@/features/chatbot/hooks/useChatbotConversation";
import { ChatMessageRenderer } from "@/features/chatbot/components/ChatMessageRenderer";

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/vendor-ai-assistant`;

const VENDOR_QUICK_ACTIONS = [
  { label: "Tips tingkatkan penjualan", icon: TrendingUp, query: "Berikan tips untuk meningkatkan penjualan saya berdasarkan data performa." },
  { label: "Rekomendasi produk baru", icon: Package, query: "Produk apa yang sebaiknya saya tambahkan berdasarkan kategori saya?" },
  { label: "Analisis performa", icon: Lightbulb, query: "Analisis performa bisnis saya dan berikan insight." },
  { label: "Cara tingkatkan rating", icon: Star, query: "Tips untuk meningkatkan rating dan review dari pelanggan." },
];

interface VendorChatbotProps {
  vendorId: string;
  businessName?: string;
}

export function VendorChatbot({ vendorId, businessName }: VendorChatbotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  
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

  const streamChat = async (userMessage: string) => {
    setIsStreaming(true);
    const startTime = Date.now();
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
          vendorId,
          userId: user?.id,
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
        queryType: 'vendor_advice',
        responseTimeMs: responseTime,
      });

    } catch (error) {
      console.error("Chat error:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Maaf, terjadi kesalahan. Silakan coba lagi nanti.",
        },
      ]);
    } finally {
      setIsStreaming(false);
    }
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

  if (!isOpen) {
    return (
      <Card 
        className="cursor-pointer hover:shadow-lg transition-shadow border-primary/20 hover:border-primary/50"
        onClick={() => setIsOpen(true)}
      >
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <div className="p-2 rounded-lg bg-primary/10">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            AI Business Assistant
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-3">
            Dapatkan tips personal, prediksi penjualan, dan rekomendasi produk
          </p>
          <div className="flex gap-2">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3" />
              <span>Tips Penjualan</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Lightbulb className="h-3 w-3" />
              <span>Ide Produk</span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden h-[500px] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between bg-primary p-4 text-primary-foreground shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-foreground/20">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-semibold">AI Business Assistant</h3>
            <p className="text-xs opacity-80">Penasihat bisnis personal Anda</p>
          </div>
        </div>
        <Button 
          variant="ghost" 
          size="icon" 
          className="text-primary-foreground hover:bg-primary-foreground/20"
          onClick={() => setIsOpen(false)}
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        {messages.length === 0 ? (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-muted-foreground">
              Hai {businessName ? businessName : ""}! Saya bisa membantu Anda dengan:
            </p>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Strategi optimasi penjualan</li>
              <li>• Rekomendasi produk baru</li>
              <li>• Prediksi permintaan</li>
              <li>• Insight pelanggan</li>
            </ul>
            <div className="flex flex-col gap-2 mt-2">
              {VENDOR_QUICK_ACTIONS.map((action) => (
                <Button
                  key={action.label}
                  variant="outline"
                  size="sm"
                  className="text-xs justify-start h-auto py-2"
                  onClick={() => handleQuickAction(action.query)}
                >
                  <action.icon className="h-4 w-4 mr-2" />
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
      <form onSubmit={handleSubmit} className="flex gap-2 border-t p-4 shrink-0">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Tanya tips bisnis..."
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
      </form>
    </Card>
  );
}
