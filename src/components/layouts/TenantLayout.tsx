import { ReactNode } from "react";
import { DashboardLayout } from "./DashboardLayout";

interface TenantLayoutProps {
  children: ReactNode;
  title?: string;
  description?: string;
  actions?: ReactNode;
}

export function TenantLayout({ 
  children, 
  title, 
  description,
  actions 
}: TenantLayoutProps) {
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
