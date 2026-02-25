import { StatCard } from '@/shared/components/ui/StatCard';
import { Invoice } from '../types';
import { formatCurrency } from '@/shared/utils/currency';
import { CheckCircle, Clock, FileText } from 'lucide-react';

interface InvoicesStatsProps {
  invoices: Invoice[];
  loading?: boolean;
}

export const InvoicesStats = ({ invoices, loading = false }: InvoicesStatsProps) => {
  const stats = {
    total: invoices.reduce((sum, i) => sum + Number(i.total_amount), 0),
    paid: invoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + Number(i.total_amount), 0),
    pending: invoices.filter(i => i.status === 'sent').reduce((sum, i) => sum + Number(i.total_amount), 0),
    draft: invoices.filter(i => i.status === 'draft').length,
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <StatCard
        title="Total Ditagihkan"
        value={formatCurrency(stats.total)}
        icon={FileText}
        accentColor="hsl(var(--primary))"
        loading={loading}
        index={0}
      />
      <StatCard
        title="Lunas"
        value={formatCurrency(stats.paid)}
        icon={CheckCircle}
        accentColor="hsl(var(--success))"
        loading={loading}
        index={1}
      />
      <StatCard
        title="Menunggu"
        value={formatCurrency(stats.pending)}
        icon={Clock}
        accentColor="hsl(var(--warning))"
        loading={loading}
        index={2}
      />
      <StatCard
        title="Draf"
        value={stats.draft}
        icon={FileText}
        accentColor="hsl(var(--muted-foreground))"
        loading={loading}
        index={3}
      />
    </div>
  );
};
