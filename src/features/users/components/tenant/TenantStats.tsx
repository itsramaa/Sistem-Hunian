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

export function TenantStats({ pendingInvitationsCount, activeTenantsCount, availableUnitsCount, loading }: TenantStatsProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="glass-stat-card p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <div className="space-y-2"><Skeleton className="h-4 w-24" /><Skeleton className="h-8 w-12" /></div>
              <Skeleton className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  const stats = [
    { label: 'Undangan Pending', value: pendingInvitationsCount, icon: Clock, iconBg: 'bg-warning/10', iconColor: 'text-warning', tooltip: 'Undangan yang menunggu respon tenant' },
    { label: 'Tenant Aktif', value: activeTenantsCount, icon: CheckCircle, iconBg: 'bg-success/10', iconColor: 'text-success', tooltip: 'Tenant yang aktif terhubung' },
    { label: 'Unit Tersedia', value: availableUnitsCount, icon: Home, iconBg: 'bg-primary/10', iconColor: 'text-primary', tooltip: 'Unit yang siap untuk tenant baru' },
  ];

  return (
    <TooltipProvider delayDuration={200}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="glass-stat-card p-4 sm:p-5 hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className="text-2xl sm:text-3xl font-display font-bold mt-1">{stat.value}</p>
              </div>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="gradient-icon-box w-10 h-10 sm:w-12 sm:h-12">
                    <stat.icon className={`h-5 w-5 sm:h-6 sm:w-6 ${stat.iconColor}`} />
                  </div>
                </TooltipTrigger>
                <TooltipContent>{stat.tooltip}</TooltipContent>
              </Tooltip>
            </div>
          </div>
        ))}
      </div>
    </TooltipProvider>
  );
}
