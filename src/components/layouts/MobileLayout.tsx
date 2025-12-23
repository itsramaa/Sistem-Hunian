import { ReactNode, useState } from "react";
import { useLocation } from "react-router-dom";
import { Plus } from "lucide-react";
import { MobileHeader } from "./MobileHeader";
import { MobileBottomNav } from "./MobileBottomNav";
import { MobileDrawer } from "./MobileDrawer";
import { FloatingActionButton } from "./FloatingActionButton";
import { ChatbotDialog } from "@/components/chatbot/ChatbotDialog";
import { useChatbotTracking } from "@/hooks/useAnalytics";
import { cn } from "@/lib/utils";
import { UserRole, navigationConfig } from "./navigation-config";

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
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const { trackChatbotOpened } = useChatbotTracking();

  const config = navigationConfig[role];
  const basePath = `/${role}`;

  // Determine if AI button should show based on config and current page
  const showAIButton =
    config.hasFloatingAI &&
    (config.mainPagesWithAI?.includes(location.pathname) ||
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
      <MobileHeader
        role={role}
        title={title}
        description={description}
        actions={actions}
        showBack={showBack}
        onMenuClick={!config.hasBottomNav ? () => setIsDrawerOpen(true) : undefined}
      />

      <main
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

      {/* Drawer - For roles without bottom nav */}
      {!config.hasBottomNav && (
        <MobileDrawer
          role={role}
          isOpen={isDrawerOpen}
          onClose={() => setIsDrawerOpen(false)}
        />
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
