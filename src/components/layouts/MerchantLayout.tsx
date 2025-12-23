import { ReactNode } from "react";
import { DashboardLayout } from "./DashboardLayout";

interface MerchantLayoutProps {
  children: ReactNode;
  title?: string;
  description?: string;
  actions?: ReactNode;
}

export function MerchantLayout({
  children,
  title,
  description,
  actions,
}: MerchantLayoutProps) {
  return (
    <DashboardLayout
      role="merchant"
      title={title}
      description={description}
      actions={actions}
    >
      {children}
    </DashboardLayout>
  );
}
