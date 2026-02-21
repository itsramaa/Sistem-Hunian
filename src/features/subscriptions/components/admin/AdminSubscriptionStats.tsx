import { SubscriptionStats } from "@/features/subscriptions/types/subscriptions";
import { Card, CardContent } from "@/shared/components/ui/card";
import { CreditCard, Crown, Loader2, Star, Zap } from "lucide-react";

interface AdminSubscriptionStatsProps {
  stats: SubscriptionStats | undefined;
  isLoading: boolean;
}

export function AdminSubscriptionStats({ stats, isLoading }: AdminSubscriptionStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card>
        <CardContent className="p-6 flex items-center gap-4">
          <div className="p-3 rounded-lg bg-accent/10">
            <Crown className="h-6 w-6 text-accent-foreground" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Enterprise</p>
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <p className="text-2xl font-bold">{stats?.enterprise || 0}</p>
            )}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-6 flex items-center gap-4">
          <div className="p-3 rounded-lg bg-primary/10">
            <Star className="h-6 w-6 text-primary" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Pro</p>
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <p className="text-2xl font-bold">{stats?.pro || 0}</p>
            )}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-6 flex items-center gap-4">
          <div className="p-3 rounded-lg bg-info/10">
            <Zap className="h-6 w-6 text-info" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Basic</p>
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <p className="text-2xl font-bold">{stats?.basic || 0}</p>
            )}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-6 flex items-center gap-4">
          <div className="p-3 rounded-lg bg-muted">
            <CreditCard className="h-6 w-6 text-muted-foreground" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Free</p>
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <p className="text-2xl font-bold">{stats?.free || 0}</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
