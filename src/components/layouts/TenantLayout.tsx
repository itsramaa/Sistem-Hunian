import { ReactNode } from "react";
import { DashboardLayout } from "./DashboardLayout";
import { MobileTenantLayout } from "./MobileTenantLayout";
import { useIsMobile } from "@/hooks/use-mobile";

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

  // Desktop: Use sidebar layout
  return (
    <DashboardLayout 
      role="tenant" 
      title={title} 
      description={description}
      actions={actions}
    >
      {children}
    </DashboardLayout>
  );
}
