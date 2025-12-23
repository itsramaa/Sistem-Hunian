import { ReactNode } from "react";
import { DashboardLayout } from "./DashboardLayout";

interface VendorLayoutProps {
  children: ReactNode;
  title?: string;
  description?: string;
  actions?: ReactNode;
}

export function VendorLayout({
  children,
  title,
  description,
  actions,
}: VendorLayoutProps) {
  return (
    <DashboardLayout
      role="vendor"
      title={title}
      description={description}
      actions={actions}
    >
      {children}
    </DashboardLayout>
  );
}
