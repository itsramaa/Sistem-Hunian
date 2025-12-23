import { ReactNode } from "react";
import { MobileTenantLayout } from "./MobileTenantLayout";
import { TenantSidebar } from "./TenantSidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { NotificationsDropdown } from "@/components/notifications/NotificationsDropdown";

interface TenantLayoutProps {
  children: ReactNode;
  title?: string;
  description?: string;
  actions?: ReactNode;
  showBack?: boolean;
}

export function TenantLayout({ 
  children, 
  title, 
  description,
  actions,
  showBack
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
      >
        {children}
      </MobileTenantLayout>
    );
  }

  // Desktop: Use modern sidebar layout
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <TenantSidebar />
        <SidebarInset className="flex flex-col">
          {/* Desktop Header */}
          <header className="flex h-14 shrink-0 items-center gap-2 border-b bg-background px-6">
            <SidebarTrigger className="-ml-2" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <div className="flex-1 min-w-0">
              {title && (
                <h1 className="text-base font-semibold truncate">{title}</h1>
              )}
            </div>
            <div className="flex items-center gap-3">
              {actions}
              <NotificationsDropdown />
            </div>
          </header>
          
          {/* Main Content */}
          <main className="flex-1 overflow-auto">
            <div className="p-6">
              {description && (
                <p className="text-sm text-muted-foreground mb-6">{description}</p>
              )}
              {children}
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
