import { StatCard } from '@/shared/components/ui/StatCard';
import { Wrench, Clock, Loader, CheckCircle } from 'lucide-react';

interface MaintenanceStatsProps {
  total: number;
  pending: number;
  inProgress: number;
  completed: number;
  loading?: boolean;
}

export function MaintenanceStats({
  total,
  pending,
  inProgress,
  completed,
  loading = false,
}: MaintenanceStatsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <StatCard
        title="Total Requests"
        value={total}
        icon={Wrench}
        accentColor="hsl(var(--primary))"
        loading={loading}
        index={0}
      />
      <StatCard
        title="Pending"
        value={pending}
        icon={Clock}
        accentColor="hsl(var(--warning))"
        loading={loading}
        index={1}
      />
      <StatCard
        title="In Progress"
        value={inProgress}
        icon={Loader}
        accentColor="hsl(var(--info))"
        loading={loading}
        index={2}
      />
      <StatCard
        title="Completed"
        value={completed}
        icon={CheckCircle}
        accentColor="hsl(var(--success))"
        loading={loading}
        index={3}
      />
    </div>
  );
}
