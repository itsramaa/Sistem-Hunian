import { ReactNode } from "react";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";

interface DashboardLayoutProps {
  children: ReactNode;
  role: "admin" | "merchant" | "tenant";
  title?: string;
  description?: string;
  actions?: ReactNode;
}

export function DashboardLayout({ 
  children, 
  role, 
  title, 
  description,
  actions 
}: DashboardLayoutProps) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar role={role} />
        <SidebarInset className="flex-1">
          <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 lg:px-6">
            <SidebarTrigger className="lg:hidden" />
            {title && (
              <div className="flex-1">
                <h1 className="text-lg font-semibold">{title}</h1>
                {description && (
                  <p className="text-sm text-muted-foreground hidden sm:block">{description}</p>
                )}
              </div>
            )}
            {actions && <div className="ml-auto flex items-center gap-2">{actions}</div>}
          </header>
          <main className="flex-1 p-4 lg:p-6">
            {children}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
