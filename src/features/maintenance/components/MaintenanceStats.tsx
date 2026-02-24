import { StatCard } from '@/shared/components/ui/StatCard';
import { Wrench, Clock, Loader, CheckCircle, AlertTriangle, ShieldAlert } from 'lucide-react';

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
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
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
      <StatCard
        title="Urgent"
        value={urgent}
        icon={AlertTriangle}
        accentColor="hsl(var(--destructive))"
        loading={loading}
        index={4}
      />
      <StatCard
        title="SLA Breach"
        value={slaBreach}
        icon={ShieldAlert}
        accentColor="hsl(var(--destructive))"
        loading={loading}
        index={5}
      />
    </div>
  );
}
