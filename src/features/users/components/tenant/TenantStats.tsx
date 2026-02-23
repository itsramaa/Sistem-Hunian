import { Card, CardContent } from '@/shared/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/shared/components/ui/tooltip';
import { Skeleton } from '@/shared/components/ui/skeleton';
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4 sm:pt-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-8 w-12" />
                </div>
                <Skeleton className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const stats = [
    {
      label: 'Undangan Pending',
      value: pendingInvitationsCount,
      icon: Clock,
      accentClass: 'border-l-warning',
      iconBg: 'bg-warning/10',
      iconColor: 'text-warning',
      tooltip: 'Undangan yang menunggu respon tenant',
    },
    {
      label: 'Tenant Aktif',
      value: activeTenantsCount,
      icon: CheckCircle,
      accentClass: 'border-l-success',
      iconBg: 'bg-success/10',
      iconColor: 'text-success',
      tooltip: 'Tenant yang aktif terhubung',
    },
    {
      label: 'Unit Tersedia',
      value: availableUnitsCount,
      icon: Home,
      accentClass: 'border-l-primary',
      iconBg: 'bg-primary/10',
      iconColor: 'text-primary',
      tooltip: 'Unit yang siap untuk tenant baru',
    },
  ];

  return (
    <TooltipProvider delayDuration={200}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
        {stats.map((stat) => (
          <Card key={stat.label} className={`border-l-4 ${stat.accentClass}`}>
            <CardContent className="p-4 sm:pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="text-2xl sm:text-3xl font-bold">{stat.value}</p>
                </div>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className={`p-2.5 sm:p-3 rounded-lg ${stat.iconBg}`}>
                      <stat.icon className={`h-4 w-4 sm:h-5 sm:w-5 ${stat.iconColor}`} />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>{stat.tooltip}</TooltipContent>
                </Tooltip>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </TooltipProvider>
  );
}
