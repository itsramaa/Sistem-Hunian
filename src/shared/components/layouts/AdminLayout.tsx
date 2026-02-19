import { ReactNode } from "react";
import { DashboardLayout } from "@/shared/components/layouts/DashboardLayout";

interface AdminLayoutProps {
  children: ReactNode;
  title?: string;
  description?: string;
  actions?: ReactNode;
}

export function AdminLayout({
  children,
  title,
  description,
  actions,
}: AdminLayoutProps) {
  return (
    <DashboardLayout
      role="admin"
      title={title}
      description={description}
      actions={actions}
    >
      {children}
    </DashboardLayout>
  );
}
