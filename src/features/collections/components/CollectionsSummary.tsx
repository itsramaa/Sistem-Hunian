import { Banknote, Clock, CalendarCheck, TrendingUp } from 'lucide-react';
import { StatCard } from '@/shared/components/ui/StatCard';
import type { CollectionsSummaryData } from '../services/collectionsService';

interface Props {
  data: CollectionsSummaryData | undefined;
  loading: boolean;
}

export function CollectionsSummary({ data, loading }: Props) {
  const formatRp = (v: number) => `Rp ${v.toLocaleString('id-ID')}`;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        title="Penagihan Hari Ini"
        value={data ? formatRp(data.collectionsToday) : 'Rp 0'}
        subtitle={data ? `${data.collectionsTodayCount} pembayaran` : undefined}
        icon={Banknote}
        accentColor="hsl(var(--primary))"
        loading={loading}
        index={0}
      />
      <StatCard
        title="Total Tunggakan"
        value={data ? formatRp(data.totalOutstanding) : 'Rp 0'}
        subtitle={data ? `${data.totalOutstandingCount} tagihan` : undefined}
        icon={Clock}
        accentColor="hsl(0 84% 60%)"
        loading={loading}
        index={1}
      />
      <StatCard
        title="Jatuh Tempo Minggu Ini"
        value={data ? formatRp(data.expectedThisWeek) : 'Rp 0'}
        subtitle={data ? `${data.expectedThisWeekCount} tagihan` : undefined}
        icon={CalendarCheck}
        accentColor="hsl(38 92% 50%)"
        loading={loading}
        index={2}
      />
      <StatCard
        title="Tingkat Penagihan"
        value={data ? `${data.collectionRatePercent}%` : '0%'}
        subtitle="Bulan ini"
        icon={TrendingUp}
        accentColor="hsl(142 71% 45%)"
        loading={loading}
        index={3}
      />
    </div>
  );
}
