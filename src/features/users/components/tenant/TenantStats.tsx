import { Card, CardContent } from '@/shared/components/ui/card';
import { StatsCardSkeleton } from '@/shared/components/ui/skeletons';
import { CheckCircle, Clock, Home } from 'lucide-react';

interface TenantStatsProps {
  pendingInvitationsCount: number;
  activeTenantsCount: number;
  availableUnitsCount: number;
  loading: boolean;
}

export function TenantStats({ 
  pendingInvitationsCount, 
  activeTenantsCount, 
  availableUnitsCount, 
  loading 
}: TenantStatsProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <StatsCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Pending Invitations</p>
              <p className="text-2xl font-bold">{pendingInvitationsCount}</p>
            </div>
            <div className="p-3 rounded-lg bg-warning/10">
              <Clock className="h-5 w-5 text-warning" />
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Active Tenants</p>
              <p className="text-2xl font-bold">{activeTenantsCount}</p>
            </div>
            <div className="p-3 rounded-lg bg-success/10">
              <CheckCircle className="h-5 w-5 text-success" />
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Available Units</p>
              <p className="text-2xl font-bold">{availableUnitsCount}</p>
            </div>
            <div className="p-3 rounded-lg bg-primary/10">
              <Home className="h-5 w-5 text-primary" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
