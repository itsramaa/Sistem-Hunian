import { Button } from "@/components/ui/button";
import { MessageCircle, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

export type FloatingButtonType = 'ai' | 'create' | 'none';

interface FloatingActionButtonProps {
  type: FloatingButtonType;
  isOpen?: boolean;
  onClick: () => void;
  icon?: LucideIcon;
  className?: string;
}

export function FloatingActionButton({ 
  type, 
  isOpen = false, 
  onClick, 
  icon: CustomIcon,
  className 
}: FloatingActionButtonProps) {
  if (type === 'none') return null;

  const Icon = type === 'ai' 
    ? (isOpen ? X : MessageCircle) 
    : (CustomIcon || Plus);

  return (
    <Button
      onClick={onClick}
      className={cn(
        "fixed z-50 h-14 w-14 rounded-full shadow-lg transition-all duration-300",
        "bottom-20 right-4", // Above bottom nav
        type === 'ai' && isOpen && "rotate-90",
        type === 'create' && "bg-primary hover:bg-primary/90",
        className
      )}
      size="icon"
    >
      <Icon className="h-6 w-6" />
    </Button>
  );
}
