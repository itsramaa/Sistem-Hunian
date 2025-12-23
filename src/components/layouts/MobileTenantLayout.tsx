import { ReactNode, useState } from "react";
import { useLocation } from "react-router-dom";
import { TenantMobileHeader } from "./TenantMobileHeader";
import { TenantBottomNav } from "./TenantBottomNav";
import { FloatingActionButton, FloatingButtonType } from "./FloatingActionButton";
import { ChatbotDialog } from "@/components/chatbot/ChatbotDialog";
import { useChatbotTracking } from "@/hooks/useAnalytics";
import { Plus } from "lucide-react";

interface MobileTenantLayoutProps {
  children: ReactNode;
  title?: string;
  description?: string;
  actions?: ReactNode;
  showBack?: boolean;
  floatingAction?: {
    type: 'create';
    onClick: () => void;
  };
}

interface FloatingButtonConfig {
  type: FloatingButtonType;
  action?: string;
}

// Determine floating button config based on route
function getFloatingButtonConfig(pathname: string): FloatingButtonConfig {
  // Main pages with AI button (Dashboard, Payments, Orders - NOT Forum)
  const mainPagesWithAI = ['/tenant', '/tenant/payments', '/tenant/orders'];
  
  // Check exact match for main pages
  if (mainPagesWithAI.includes(pathname) || pathname === '/tenant/') {
    return { type: 'ai' };
  }
  
  // All other pages - no default floating button
  // Pages like Forum/Maintenance will provide their own via floatingAction prop
  return { type: 'none' };
}

export function MobileTenantLayout({ 
  children, 
  title, 
  description,
  actions,
  showBack,
  floatingAction
}: MobileTenantLayoutProps) {
  const location = useLocation();
  const [isChatOpen, setIsChatOpen] = useState(false);
  const { trackChatbotOpened } = useChatbotTracking();
  
  const floatingConfig = getFloatingButtonConfig(location.pathname);
  
  // Determine which floating button to show
  const showAIButton = floatingConfig.type === 'ai';
  const showCreateButton = floatingAction?.type === 'create';

  const handleAIButtonClick = () => {
    if (!isChatOpen) {
      trackChatbotOpened();
    }
    setIsChatOpen(!isChatOpen);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <TenantMobileHeader 
        title={title} 
        description={description}
        actions={actions}
        showBack={showBack}
      />
      
      <main className="flex-1 px-4 pt-4 pb-20 overflow-auto">
        {children}
      </main>
      
      <TenantBottomNav />

      {/* AI Floating Button - for main pages */}
      {showAIButton && (
        <FloatingActionButton
          type="ai"
          isOpen={isChatOpen}
          onClick={handleAIButtonClick}
        />
      )}

      {/* Create Floating Button - for sub-pages with create action */}
      {showCreateButton && (
        <FloatingActionButton
          type="create"
          onClick={floatingAction.onClick}
          icon={Plus}
        />
      )}

      {/* Chatbot Dialog */}
      <ChatbotDialog isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
    </div>
  );
}
