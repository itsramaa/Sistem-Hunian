import { ReactNode, useState, Fragment } from "react";
import { useLocation, Link } from "react-router-dom";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/shared/components/ui/sidebar";
import { Separator } from "@/shared/components/ui/separator";
import { NotificationsDropdown } from "@/features/notifications/components/NotificationsDropdown";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbLink,
  BreadcrumbSeparator,
} from "@/shared/components/ui/breadcrumb";
import { useIsMobile } from "@/shared/hooks/use-mobile";
import { AppSidebar } from "@/shared/components/layouts/sidebar/app-sidebar";
import { MobileLayout } from "@/shared/components/layouts/MobileLayout";
import { UserRole, navigationConfig } from "@/shared/components/layouts/navigation-config";
import { FloatingActionButton } from "@/shared/components/layouts/FloatingActionButton";
import { ChatbotDialog } from "@/features/chatbot/components/ChatbotDialog";
import { useChatbotTracking } from "@/features/analytics/hooks/useAnalytics";
import { Meta } from "@/shared/components/meta";
import { ThemeToggle } from "@/shared/components/ui/ThemeToggle";
import { SearchCommand } from "@/shared/components/layouts/SearchCommand";
import { generateBreadcrumbs } from "@/shared/utils/breadcrumbUtils";

interface DashboardLayoutProps {
  children: ReactNode;
  role: UserRole;
  title?: string;
  description?: string;
  actions?: ReactNode;
  showBack?: boolean;
  floatingAction?: {
    type: "create";
    onClick: () => void;
  };
}

export function DashboardLayout({
  children,
  role,
  title,
  description,
  actions,
  showBack,
  floatingAction,
}: DashboardLayoutProps) {
  const isMobile = useIsMobile();
  const location = useLocation();
  const basePath = `/${role}`;
  const isRootPage = location.pathname === basePath || location.pathname === `${basePath}/`;
  
  // Floating AI state
  const [isChatOpen, setIsChatOpen] = useState(false);
  const { trackChatbotOpened } = useChatbotTracking();
  
  const config = navigationConfig[role];
  const showAIButton = config.hasFloatingAI && config.globalFloatingAI;
  const showCreateButton = floatingAction?.type === "create";
  
  const handleAIButtonClick = () => {
    if (!isChatOpen) trackChatbotOpened();
    setIsChatOpen(!isChatOpen);
  };
  
  // Auto-detect page label from navigation config if no title provided
  const pageLabel = title || ""; // Legacy support, though we use breadcrumbs now
  const breadcrumbs = generateBreadcrumbs(role, location.pathname);

  // Mobile: Use mobile layout with bottom nav (tenant) or simplified header (others)
  if (isMobile) {
    return (
      <MobileLayout
        role={role}
        title={title}
        description={description}
        actions={actions}
        showBack={showBack}
        floatingAction={floatingAction}
      >
        {children}
      </MobileLayout>
    );
  }

  // Desktop: Use sidebar layout with inset variant (sidebar-08 pattern)
  return (
    <SidebarProvider>
      <Meta noindex />
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:z-[100] focus:p-4 focus:bg-background focus:text-foreground">
        Langsung ke konten utama
      </a>
      <AppSidebar role={role} />
      <SidebarInset>
        {/* Header with breadcrumb */}
        <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12 bg-background/80 backdrop-blur-sm border-b border-border/30">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                {breadcrumbs.map((crumb, index) => (
                  <Fragment key={crumb.path}>
                    <BreadcrumbItem className={index === 0 ? "hidden md:block" : ""}>
                      {crumb.isCurrent ? (
                        <BreadcrumbPage className="text-sm font-medium">
                          {crumb.label}
                        </BreadcrumbPage>
                      ) : (
                        <BreadcrumbLink asChild>
                          <Link to={crumb.path} className="text-sm">
                            {crumb.label}
                          </Link>
                        </BreadcrumbLink>
                      )}
                    </BreadcrumbItem>
                    {index < breadcrumbs.length - 1 && (
                      <BreadcrumbSeparator className={index === 0 ? "hidden md:block" : ""} />
                    )}
                  </Fragment>
                ))}
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          <div className="ml-auto flex items-center gap-2 px-4">
            <SearchCommand role={role} />
            <ThemeToggle />
            <NotificationsDropdown />
          </div>
        </header>

        {/* Main Content */}
        <div id="main-content" className="flex flex-1 flex-col gap-4 p-4 pt-4">
          {/* Page Toolbar - description and actions */}
          {(description || actions) && (
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              {description && (
                <p className="text-sm text-muted-foreground">{description}</p>
              )}
              {actions && (
                <div className="flex items-center gap-2 shrink-0">
                  {actions}
                </div>
              )}
            </div>
          )}
          {children}
        </div>
      </SidebarInset>
      
      {/* Global Floating Buttons - visible on all screen sizes */}
      {showCreateButton && (
        <FloatingActionButton
          type="create"
          onClick={floatingAction.onClick}
          className="bottom-24"
        />
      )}
      
      {showAIButton && (
        <FloatingActionButton
          type="ai"
          isOpen={isChatOpen}
          onClick={handleAIButtonClick}
        />
      )}
      
      {config.hasFloatingAI && (
        <ChatbotDialog isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
      )}
    </SidebarProvider>
  );
}
