
import { Card, CardContent } from "@/shared/components/ui/card";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { TrendingDown, TrendingUp, UserCheck, Wrench } from "lucide-react";

interface AdminTenantAnalyticsStatsProps {
  activeTenants: number;
  newTenantsThisMonth: number;
  churnedTenantsThisMonth: number;
  pendingMaintenance: number;
  isLoading?: boolean;
}

export function AdminTenantAnalyticsStats({
  activeTenants,
  newTenantsThisMonth,
  churnedTenantsThisMonth,
  pendingMaintenance,
  isLoading,
}: AdminTenantAnalyticsStatsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-[120px] rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-primary/10">
              <UserCheck className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Active Tenants</p>
              <p className="text-2xl font-bold">{activeTenants}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-success/10">
              <TrendingUp className="h-6 w-6 text-success" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">New This Month</p>
              <p className="text-2xl font-bold">{newTenantsThisMonth}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-destructive/10">
              <TrendingDown className="h-6 w-6 text-destructive" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Churned This Month</p>
              <p className="text-2xl font-bold">{churnedTenantsThisMonth}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-warning/10">
              <Wrench className="h-6 w-6 text-warning" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Pending Maintenance</p>
              <p className="text-2xl font-bold">{pendingMaintenance}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
