import { Suspense } from "react";
import { Outlet } from "react-router-dom";
import { DashboardLayout } from "@/app/layouts/DashboardLayout";
import { ContentSkeleton } from "@/shared/components/ui/ContentSkeleton";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { UserRole } from "@/shared/components/sidebar/navigation-config";

export function MerchantLayoutRoute() {
  const { role } = useAuth();
  // Map auth role to UserRole — default to operator if unknown
  const layoutRole: UserRole = (role as UserRole) ?? 'operator';

  return (
    <DashboardLayout role={layoutRole}>
      <Suspense fallback={<ContentSkeleton />}>
        <Outlet />
      </Suspense>
    </DashboardLayout>
  );
}
