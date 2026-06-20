import { ReactNode } from "react";
import { DashboardLayout } from "@/app/layouts/DashboardLayout";

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
      role="operator"
      title={title}
      description={description}
      actions={actions}
    >
      {children}
    </DashboardLayout>
  );
}
