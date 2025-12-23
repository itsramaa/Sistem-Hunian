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
        <SidebarInset>
          {/* Desktop Header */}
          <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <div className="flex-1 min-w-0">
              {title && (
                <h1 className="text-lg font-semibold truncate">{title}</h1>
              )}
            </div>
            <div className="flex items-center gap-2">
              {actions}
              <NotificationsDropdown />
            </div>
          </header>
          
          {/* Main Content */}
          <main className="flex-1 p-6">
            {description && (
              <p className="text-muted-foreground mb-4">{description}</p>
            )}
            {children}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}