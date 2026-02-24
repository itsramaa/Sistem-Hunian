import { StatCard } from '@/shared/components/ui/StatCard';
import { Wrench, Clock, Loader, CheckCircle, AlertTriangle } from 'lucide-react';

interface MaintenanceStatsProps {
  total: number;
  pending: number;
  inProgress: number;
  completed: number;
  urgent?: number;
  slaBreach?: number;
  loading?: boolean;
}

export function MaintenanceStats({
  total,
  pending,
  inProgress,
  completed,
  urgent = 0,
  slaBreach = 0,
  loading = false,
}: MaintenanceStatsProps) {
  const highPriority = urgent;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
      <StatCard
        title="Total"
        value={total}
        icon={Wrench}
        accentColor="hsl(var(--primary))"
        loading={loading}
        index={0}
        compact
      />
      <StatCard
        title="Pending"
        value={pending}
        icon={Clock}
        accentColor="hsl(var(--warning))"
        loading={loading}
        index={1}
        compact
        subtitle={urgent > 0 ? `${urgent} urgent` : undefined}
      />
      <StatCard
        title="In Progress"
        value={inProgress}
        icon={Loader}
        accentColor="hsl(var(--info))"
        loading={loading}
        index={2}
        compact
        subtitle={slaBreach > 0 ? `${slaBreach} SLA breach` : undefined}
      />
      <StatCard
        title="Completed"
        value={completed}
        icon={CheckCircle}
        accentColor="hsl(var(--success))"
        loading={loading}
        index={3}
        compact
      />
      <StatCard
        title="Priority"
        value={highPriority}
        icon={AlertTriangle}
        accentColor="hsl(var(--destructive))"
        loading={loading}
        index={4}
        compact
        subtitle="urgent + high"
      />
    </div>
  );
}
