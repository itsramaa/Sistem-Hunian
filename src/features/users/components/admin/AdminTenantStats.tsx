
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { cn } from "@/shared/utils/utils";
import { AlertTriangle, Building2, CheckCircle, UserX } from "lucide-react";

interface AdminTenantStatsProps {
  stats?: { total: number; active: number; pending: number; terminated: number };
  isLoading: boolean;
  className?: string;
}

const statItems = [
  { key: 'total', label: 'Total Tenants', desc: 'Across all properties', icon: Building2 },
  { key: 'active', label: 'Active Leases', desc: 'Currently occupying', icon: CheckCircle },
  { key: 'pending', label: 'Pending', desc: 'Awaiting signature', icon: AlertTriangle },
  { key: 'terminated', label: 'Terminated', desc: 'Past tenants', icon: UserX },
] as const;

export function AdminTenantStats({ stats, isLoading, className }: AdminTenantStatsProps) {
  return (
    <div className={cn("grid gap-4 sm:grid-cols-2 lg:grid-cols-4", className)}>
      {statItems.map((item, index) => (
        <Card key={item.key} className="glass-stat-card hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{item.label}</CardTitle>
            <div className="gradient-icon-box">
              <item.icon className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-8 w-16 bg-muted animate-pulse rounded-xl" />
            ) : (
              <>
                <div className="text-2xl font-bold font-display">{stats?.[item.key] || 0}</div>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
