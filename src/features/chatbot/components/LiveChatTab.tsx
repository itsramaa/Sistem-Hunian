import { useState, useEffect, useRef } from "react";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { ScrollArea } from "@/shared/components/ui/scroll-area";
import { Send, Loader2, MessageCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { toast } from "sonner";
import { cn } from "@/shared/utils/utils";

interface LiveMessage {
  id: string;
  sender_id: string;
  sender_role: string;
  message: string;
  created_at: string;
}

export function LiveChatTab() {
  const { user, role, merchant } = useAuth();
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<LiveMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Load or create conversation
  useEffect(() => {
    if (!user?.id) return;

    const loadConversation = async () => {
      setLoading(true);
      try {
        // Find existing open conversation
        const { data: existing } = await (supabase as any)
          .from("live_chat_conversations")
          .select("id")
          .eq("user_id", user.id)
          .eq("status", "open")
          .order("created_at", { ascending: false })
          .limit(1);

        if (existing && existing.length > 0) {
          setConversationId(existing[0].id);
          // Load messages
          const { data: msgs } = await (supabase as any)
            .from("live_chat_messages")
            .select("*")
            .eq("conversation_id", existing[0].id)
            .order("created_at", { ascending: true });
          setMessages(msgs || []);
        }
      } catch (err) {
        console.error("Error loading conversation:", err);
      } finally {
        setLoading(false);
      }
    };

    loadConversation();
  }, [user?.id]);

  // Subscribe to realtime messages
  useEffect(() => {
    if (!conversationId) return;

    const channel = supabase
      .channel(`live-chat-${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "live_chat_messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const newMsg = payload.new as LiveMessage;
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId]);

  // Auto scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const startConversation = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const { data, error } = await (supabase as any)
        .from("live_chat_conversations")
        .insert({
          user_id: user.id,
          user_role: role || "merchant",
          merchant_id: merchant?.id || null,
          subject: "Bantuan Live Chat",
        })
        .select("id")
        .single();
      if (error) throw error;
      setConversationId(data.id);
      toast.success("Percakapan dimulai. Tim admin akan merespons segera.");
    } catch {
      toast.error("Gagal memulai percakapan.");
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !conversationId || !user?.id) return;
    setSending(true);
    try {
      const { error } = await (supabase as any)
        .from("live_chat_messages")
        .insert({
          conversation_id: conversationId,
          sender_id: user.id,
          sender_role: role || "merchant",
          message: input.trim(),
        });
      if (error) throw error;
      setInput("");
    } catch {
      toast.error("Gagal mengirim pesan.");
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!conversationId) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center gap-4">
        <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center">
          <MessageCircle className="h-7 w-7 text-primary" />
        </div>
        <div>
          <h4 className="font-semibold">Live Chat dengan Admin</h4>
          <p className="text-sm text-muted-foreground mt-1">
            Mulai percakapan langsung dengan tim support kami. Biasanya direspons dalam beberapa menit.
          </p>
        </div>
        <Button onClick={startConversation} className="gradient-cta rounded-xl">
          Mulai Percakapan
        </Button>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="flex flex-col gap-3">
          {messages.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-4">
              Percakapan dimulai. Tunggu respons dari admin...
            </p>
          )}
          {messages.map((msg) => {
            const isOwn = msg.sender_id === user?.id;
            return (
              <div key={msg.id} className={cn("flex", isOwn ? "justify-end" : "justify-start")}>
                <div
                  className={cn(
                    "max-w-[80%] rounded-2xl px-3 py-2 text-sm",
                    isOwn
                      ? "bg-primary text-primary-foreground rounded-br-md"
                      : "bg-muted text-foreground rounded-bl-md"
                  )}
                >
                  {!isOwn && (
                    <p className="text-xs font-medium mb-1 opacity-70">Admin</p>
                  )}
                  <p className="whitespace-pre-wrap">{msg.message}</p>
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>

      <form onSubmit={sendMessage} className="flex gap-2 border-t p-3 bg-background shrink-0">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ketik pesan..."
          disabled={sending}
          className="flex-1 rounded-full h-10"
        />
        <Button
          type="submit"
          size="icon"
          disabled={sending || !input.trim()}
          className="rounded-full h-10 w-10 shrink-0"
        >
          {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </form>
    </div>
  );
}
