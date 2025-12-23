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
import { UserRole, navigationConfig } from "./navigation-config";

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
          {/* Header with breadcrumb */}
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
                  {!isRootPage && title && (
                    <>
                      <BreadcrumbSeparator />
                      <BreadcrumbItem>
                        <BreadcrumbPage className="text-sm font-medium">
                          {title}
                        </BreadcrumbPage>
                      </BreadcrumbItem>
                    </>
                  )}
                </BreadcrumbList>
              </Breadcrumb>
            </div>
            <div className="ml-auto flex items-center gap-2 px-4">
              {actions}
              <NotificationsDropdown />
            </div>
          </header>

          {/* Main Content */}
          <div className="flex flex-1 flex-col gap-4 p-4">
            {description && (
              <p className="text-sm text-muted-foreground">{description}</p>
            )}
            {children}
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
