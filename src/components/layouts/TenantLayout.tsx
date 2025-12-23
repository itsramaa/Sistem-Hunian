import { ReactNode } from "react";
import { DashboardLayout } from "./DashboardLayout";

interface TenantLayoutProps {
  children: ReactNode;
  title?: string;
  description?: string;
  actions?: ReactNode;
  showBack?: boolean;
  floatingAction?: {
    type: "create";
    onClick: () => void;
  };
}

export function TenantLayout({
  children,
  title,
  description,
  actions,
  showBack,
  floatingAction,
}: TenantLayoutProps) {
  return (
    <DashboardLayout
      role="tenant"
      title={title}
      description={description}
      actions={actions}
      showBack={showBack}
      floatingAction={floatingAction}
    >
      {children}
    </DashboardLayout>
  );
}
