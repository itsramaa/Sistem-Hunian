import { Card, CardContent } from "@/shared/components/ui/card";
import { cn } from "@/shared/utils/utils";
import { CheckCircle, Clock, Loader2, Wrench } from "lucide-react";

interface AdminVendorStatsProps {
  stats: {
    total: number;
    pending: number;
    verified: number;
  } | undefined;
  isLoading: boolean;
  className?: string;
}

export function AdminVendorStats({ stats, isLoading, className }: AdminVendorStatsProps) {
  return (
    <div className={cn("grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4", className)}>
      <Card>
        <CardContent className="p-6 flex items-center gap-4">
          <div className="p-3 rounded-lg bg-primary/10">
            <Wrench className="h-6 w-6 text-primary" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Total Vendors</p>
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <p className="text-2xl font-bold">{stats?.total || 0}</p>
            )}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-6 flex items-center gap-4">
          <div className="p-3 rounded-lg bg-warning/10">
            <Clock className="h-6 w-6 text-warning" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Pending Review</p>
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <p className="text-2xl font-bold">{stats?.pending || 0}</p>
            )}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-6 flex items-center gap-4">
          <div className="p-3 rounded-lg bg-success/10">
            <CheckCircle className="h-6 w-6 text-success" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Verified</p>
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <p className="text-2xl font-bold">{stats?.verified || 0}</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
