import { Button } from "@/shared/components/ui/button";
import { cn } from "@/shared/utils/utils";
import { Bot, User, Loader2, ThumbsUp, ThumbsDown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import DOMPurify from "dompurify";

interface ChatMessageRendererProps {
  content: string;
  role: "user" | "assistant";
  isLoading?: boolean;
  onFeedback?: (satisfied: boolean) => void;
  showFeedback?: boolean;
  failed?: boolean;
}

// Parse action buttons from AI response: [Button Text](path) or [Button Text]
function parseActionButtons(text: string): { text: string; buttons: { label: string; path?: string }[] } {
  const buttonRegex = /\[([^\]]+)\](?:\(([^)]+)\))?/g;
  const buttons: { label: string; path?: string }[] = [];
  
  // Find all button patterns
  let match;
  while ((match = buttonRegex.exec(text)) !== null) {
    buttons.push({
      label: match[1],
      path: match[2] || undefined,
    });
  }
  
  // Remove button syntax from text for display
  const cleanText = text.replace(buttonRegex, '').trim();
  
  return { text: cleanText, buttons };
}

// Simple HTML escape function to prevent XSS
function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Simple markdown-like formatting
function formatText(text: string): string {
  // Escape HTML first to prevent XSS
  const safeText = escapeHtml(text);
  
  return safeText
    // Bold text
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    // Headers
    .replace(/^### (.+)$/gm, '<h4 class="font-semibold mt-2">$1</h4>')
    .replace(/^## (.+)$/gm, '<h3 class="font-semibold text-lg mt-2">$1</h3>')
    // Bullet points with emojis
    .replace(/^[•\-✓✅❌⚠️💡📊🏠💰📅🔧🛒] (.+)$/gm, '<div class="flex gap-1.5 items-start"><span>•</span><span>$1</span></div>')
    // Numbered lists
    .replace(/^(\d+)\. (.+)$/gm, '<div class="flex gap-1.5 items-start"><span class="font-medium">$1.</span><span>$2</span></div>')
    // Line breaks
    .replace(/\n/g, '<br/>');
}

export function ChatMessageRenderer({ 
  content, 
  role, 
  isLoading,
  onFeedback,
  showFeedback = false,
  failed = false,
}: ChatMessageRendererProps) {
  const navigate = useNavigate();
  const [feedbackGiven, setFeedbackGiven] = useState<boolean | null>(null);
  
  const handleButtonClick = (path?: string, label?: string) => {
    if (path) {
      navigate(path);
    } else if (label) {
      // Map common labels to paths
      const pathMap: Record<string, string> = {
        'Bayar Sekarang': '/tenant/invoices',
        'Lihat Tagihan': '/tenant/invoices',
        'Lihat Invoice': '/tenant/invoices',
        'Lihat Kontrak': '/tenant/contracts',
        'Lapor Maintenance': '/tenant/maintenance',
        'Lihat Marketplace': '/tenant/marketplace',
        'Kirim Reminder': '/merchant/invoices',
        'Lihat Laporan': '/merchant/reports',
        'Buka Produk': '/vendor/products',
        'Buat Promo': '/vendor/products',
        'Lihat Analytics': '/vendor/earnings',
      };
      const targetPath = pathMap[label];
      if (targetPath) {
        navigate(targetPath);
      }
    }
  };

  const handleFeedback = (satisfied: boolean) => {
    setFeedbackGiven(satisfied);
    onFeedback?.(satisfied);
  };

  if (role === "user") {
    return (
      <div className="flex gap-2 flex-row-reverse">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary">
          <User className="h-4 w-4 text-primary-foreground" />
        </div>
        <div className="max-w-[75%] rounded-2xl px-4 py-2 text-sm bg-primary text-primary-foreground">
          {content}
        </div>
      </div>
    );
  }

  const { text, buttons } = parseActionButtons(content);
  const formattedText = formatText(text);

  return (
    <div className="flex gap-2 flex-row">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
        <Bot className="h-4 w-4" />
      </div>
      <div className="max-w-[80%] space-y-2">
        <div className="rounded-2xl px-4 py-2 text-sm bg-muted">
          {isLoading && !content ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <div 
              className="prose prose-sm dark:prose-invert max-w-none break-words"
              dangerouslySetInnerHTML={{ __html: formattedText }}
            />
          )}
        </div>
        
        {/* Action buttons */}
        {buttons.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {buttons.map((button, idx) => (
              <Button
                key={idx}
                variant="outline"
                size="sm"
                className="text-xs h-7"
                onClick={() => handleButtonClick(button.path, button.label)}
              >
                {button.label}
              </Button>
            ))}
          </div>
        )}

        {/* Feedback buttons */}
        {showFeedback && !isLoading && content && (
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-6 w-6",
                feedbackGiven === true && "text-green-500"
              )}
              onClick={() => handleFeedback(true)}
              disabled={feedbackGiven !== null}
            >
              <ThumbsUp className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-6 w-6",
                feedbackGiven === false && "text-red-500"
              )}
              onClick={() => handleFeedback(false)}
              disabled={feedbackGiven !== null}
            >
              <ThumbsDown className="h-3 w-3" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
