import { ReactNode } from "react";
import { TenantMobileHeader } from "./TenantMobileHeader";
import { TenantBottomNav } from "./TenantBottomNav";

interface MobileTenantLayoutProps {
  children: ReactNode;
  title?: string;
  description?: string;
  actions?: ReactNode;
  showBack?: boolean;
}

export function MobileTenantLayout({ 
  children, 
  title, 
  description,
  actions,
  showBack
}: MobileTenantLayoutProps) {
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
    </div>
  );
}
