import { ReactNode } from "react";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { NotificationsDropdown } from "@/components/notifications/NotificationsDropdown";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { useIsMobile } from "@/hooks/use-mobile";
import { DashboardSidebar } from "./DashboardSidebar";
import { MobileLayout } from "./MobileLayout";
import { UserRole } from "./navigation-config";

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
          <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
            <div className="flex items-center gap-2 px-4">
              <SidebarTrigger className="-ml-1" />
              <Separator orientation="vertical" className="mr-2 h-4" />
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbPage>{title || "Dashboard"}</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>
            <div className="ml-auto flex items-center gap-2 px-4">
              {actions}
              <NotificationsDropdown />
            </div>
          </header>

          {/* Main Content */}
          <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
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
