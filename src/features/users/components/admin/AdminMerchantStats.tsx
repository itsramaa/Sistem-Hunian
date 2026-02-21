import { Card, CardContent } from "@/shared/components/ui/card";
import { cn } from "@/shared/utils/utils";
import {
    AlertTriangle,
    CheckCircle,
    Clock,
    CreditCard,
    Loader2,
    Users,
    XCircle
} from "lucide-react";

interface AdminMerchantStatsProps {
  total: number;
  pending: number;
  verified: number;
  rejected: number;
  suspended: number;
  activePaid: number;
  isLoading: boolean;
  className?: string;
}

export function AdminMerchantStats({
  total,
  pending,
  verified,
  rejected,
  suspended,
  activePaid,
  isLoading,
  className,
}: AdminMerchantStatsProps) {
  if (isLoading) {
    return (
      <div className={cn("grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4", className)}>
        {[...Array(6)].map((_, i) => (
          <Card key={i}>
            <CardContent className="pt-4 h-24 flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className={cn("grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4", className)}>
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <Users className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{total}</p>
              <p className="text-xs text-muted-foreground">Total</p>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-warning/10">
              <Clock className="h-4 w-4 text-warning" />
            </div>
            <div>
              <p className="text-2xl font-bold">{pending}</p>
              <p className="text-xs text-muted-foreground">Pending</p>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-success/10">
              <CheckCircle className="h-4 w-4 text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold">{verified}</p>
              <p className="text-xs text-muted-foreground">Verified</p>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-destructive/10">
              <XCircle className="h-4 w-4 text-destructive" />
            </div>
            <div>
              <p className="text-2xl font-bold">{rejected}</p>
              <p className="text-xs text-muted-foreground">Rejected</p>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-muted">
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </div>
            <div>
              <p className="text-2xl font-bold">{suspended}</p>
              <p className="text-xs text-muted-foreground">Suspended</p>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <CreditCard className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{activePaid}</p>
              <p className="text-xs text-muted-foreground">Paid Active</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
