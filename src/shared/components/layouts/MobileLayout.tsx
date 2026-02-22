import { ReactNode, useState } from "react";
import { useLocation } from "react-router-dom";
import { Plus } from "lucide-react";
import { MobileHeader } from "@/shared/components/layouts/MobileHeader";
import { MobileBottomNav } from "@/shared/components/layouts/MobileBottomNav";
import { FloatingActionButton } from "@/shared/components/layouts/FloatingActionButton";
import { ChatbotDialog } from "@/features/chatbot/components/ChatbotDialog";
import { useChatbotTracking } from "@/features/analytics/hooks/useAnalytics";
import { cn } from "@/shared/utils/utils";
import { UserRole, navigationConfig } from "@/shared/components/layouts/navigation-config";
import { Meta } from "@/shared/components/meta";

interface MobileLayoutProps {
  role: UserRole;
  children: ReactNode;
  title?: string;
  description?: string;
  actions?: ReactNode;
  showBack?: boolean;
  floatingAction?: {
    type: "create";
    onClick: () => void;
  };
}

export function MobileLayout({
  role,
  children,
  title,
  description,
  actions,
  showBack,
  floatingAction,
}: MobileLayoutProps) {
  const location = useLocation();
  const [isChatOpen, setIsChatOpen] = useState(false);
  const { trackChatbotOpened } = useChatbotTracking();

  const config = navigationConfig[role];
  const basePath = `/${role}`;

  // Determine if AI button should show based on config and current page
  // If globalFloatingAI is true, show on all pages; otherwise check mainPagesWithAI
  const showAIButton =
    config.hasFloatingAI &&
    (config.globalFloatingAI ||
      config.mainPagesWithAI?.includes(location.pathname) ||
      location.pathname === basePath + "/");

  const showCreateButton = floatingAction?.type === "create";

  const handleAIButtonClick = () => {
    if (!isChatOpen) {
      trackChatbotOpened();
    }
    setIsChatOpen(!isChatOpen);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Meta noindex />
      <a href="#mobile-main-content" className="sr-only focus:not-sr-only focus:absolute focus:z-[100] focus:p-4 focus:bg-background focus:text-foreground">
        Langsung ke konten utama
      </a>
      <MobileHeader
        role={role}
        title={title}
        description={description}
        actions={actions}
        showBack={showBack}
      />

      <main
        id="mobile-main-content"
        className={cn(
          "flex-1 px-4 pt-4 overflow-auto",
          config.hasBottomNav ? "pb-20" : "pb-4"
        )}
      >
        {children}
      </main>

      {/* Bottom Nav - Only for roles with hasBottomNav */}
      {config.hasBottomNav && config.bottomNav && (
        <MobileBottomNav items={config.bottomNav} basePath={basePath} />
      )}

      {/* AI Floating Button - for main pages */}
      {showAIButton && (
        <FloatingActionButton
          type="ai"
          isOpen={isChatOpen}
          onClick={handleAIButtonClick}
          hasBottomNav={config.hasBottomNav}
        />
      )}

      {/* Create Floating Button - for sub-pages with create action */}
      {showCreateButton && (
        <FloatingActionButton
          type="create"
          onClick={floatingAction.onClick}
          icon={Plus}
          hasBottomNav={config.hasBottomNav}
        />
      )}

      {/* Chatbot Dialog */}
      {config.hasFloatingAI && (
        <ChatbotDialog isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
      )}
    </div>
  );
}
