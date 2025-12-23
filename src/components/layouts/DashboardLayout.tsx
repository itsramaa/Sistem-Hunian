import { ReactNode } from "react";
import { useLocation, Link } from "react-router-dom";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { NotificationsDropdown } from "@/components/notifications/NotificationsDropdown";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbLink,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { useIsMobile } from "@/hooks/use-mobile";
import { DashboardSidebar } from "./DashboardSidebar";
import { MobileLayout } from "./MobileLayout";
import { UserRole, navigationConfig, getAllNavItems } from "./navigation-config";

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

// Helper to get breadcrumb label for role dashboard
function getRoleDashboardLabel(role: UserRole): string {
  switch (role) {
    case "tenant": return "Beranda";
    case "merchant": return "Dashboard";
    case "vendor": return "Dashboard";
    case "admin": return "Dashboard";
    default: return "Dashboard";
  }
}

// Helper to get current page label from navigation config
function getCurrentPageLabel(role: UserRole, pathname: string): string | null {
  const navItems = getAllNavItems(role);
  const basePath = `/${role}`;
  
  // Find matching nav item
  const matchedItem = navItems.find(item => {
    if (item.path === basePath) return pathname === basePath;
    return pathname.startsWith(item.path);
  });
  
  return matchedItem?.label || null;
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
  
  // Auto-detect page label from navigation config if no title provided
  const pageLabel = title || getCurrentPageLabel(role, location.pathname);

  // Mobile: Use mobile layout with bottom nav (tenant) or drawer (others)
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

  // Desktop: Use sidebar layout (same for all roles)
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <DashboardSidebar role={role} />
        <SidebarInset>
          {/* Header with breadcrumb only */}
          <header className="flex h-14 shrink-0 items-center gap-2 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex items-center gap-2 px-4">
              <SidebarTrigger className="-ml-1" />
              <Separator orientation="vertical" className="mr-2 h-4" />
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem>
                    {isRootPage ? (
                      <BreadcrumbPage className="text-sm font-medium">
                        {getRoleDashboardLabel(role)}
                      </BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink asChild>
                        <Link to={basePath} className="text-sm">
                          {getRoleDashboardLabel(role)}
                        </Link>
                      </BreadcrumbLink>
                    )}
                  </BreadcrumbItem>
                  {!isRootPage && pageLabel && (
                    <>
                      <BreadcrumbSeparator />
                      <BreadcrumbItem>
                        <BreadcrumbPage className="text-sm font-medium">
                          {pageLabel}
                        </BreadcrumbPage>
                      </BreadcrumbItem>
                    </>
                  )}
                </BreadcrumbList>
              </Breadcrumb>
            </div>
            <div className="ml-auto flex items-center gap-2 px-4">
              <NotificationsDropdown />
            </div>
          </header>

          {/* Main Content */}
          <div className="flex flex-1 flex-col gap-6 p-6">
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
      </div>
    </SidebarProvider>
  );
}
