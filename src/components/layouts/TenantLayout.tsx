import { ReactNode } from "react";
import { MobileTenantLayout } from "./MobileTenantLayout";
import { TenantSidebar } from "./TenantSidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { NotificationsDropdown } from "@/components/notifications/NotificationsDropdown";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";

interface TenantLayoutProps {
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

export function TenantLayout({ 
  children, 
  title, 
  description,
  actions,
  showBack,
  floatingAction
}: TenantLayoutProps) {
  const isMobile = useIsMobile();

  // Mobile/Tablet: Use bottom navigation layout
  if (isMobile) {
    return (
      <MobileTenantLayout 
        title={title} 
        description={description}
        actions={actions}
        showBack={showBack}
        floatingAction={floatingAction}
      >
        {children}
      </MobileTenantLayout>
    );
  }

  // Desktop: Use inset sidebar layout (sidebar-08 style)
  return (
    <SidebarProvider>
      <TenantSidebar />
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
    </SidebarProvider>
  );
}
