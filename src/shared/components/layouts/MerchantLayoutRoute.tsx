import { Suspense } from "react";
import { Outlet } from "react-router-dom";
import { DashboardLayout } from "@/shared/components/layouts/DashboardLayout";
import { ContentSkeleton } from "@/shared/components/ui/ContentSkeleton";

export function MerchantLayoutRoute() {
  return (
    <DashboardLayout role="merchant">
      <Suspense fallback={<ContentSkeleton />}>
        <Outlet />
      </Suspense>
    </DashboardLayout>
  );
}
