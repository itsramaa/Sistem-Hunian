import { StatCard } from '@/shared/components/ui/StatCard';
import { Wrench, ChevronDown, ChevronUp, AlertTriangle, Flame } from 'lucide-react';

interface MaintenanceStatsProps {
  total: number;
  low: number;
  medium: number;
  high: number;
  urgent: number;
  loading?: boolean;
}

export function MaintenanceStats({
  total,
  low,
  medium,
  high,
  urgent,
  loading = false,
}: MaintenanceStatsProps) {
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
        title="Rendah"
        value={low}
        icon={ChevronDown}
        accentColor="hsl(var(--muted-foreground))"
        loading={loading}
        index={1}
        compact
      />
      <StatCard
        title="Sedang"
        value={medium}
        icon={ChevronUp}
        accentColor="hsl(var(--info))"
        loading={loading}
        index={2}
        compact
      />
      <StatCard
        title="Tinggi"
        value={high}
        icon={AlertTriangle}
        accentColor="hsl(var(--warning))"
        loading={loading}
        index={3}
        compact
      />
      <StatCard
        title="Mendesak"
        value={urgent}
        icon={Flame}
        accentColor="hsl(var(--destructive))"
        loading={loading}
        index={4}
        compact
      />
    </div>
  );
}
