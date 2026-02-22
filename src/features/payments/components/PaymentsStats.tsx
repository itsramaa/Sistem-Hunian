import { StatCard } from '@/shared/components/ui/StatCard';
import { formatCurrency } from '@/shared/utils/currency';
import { Payment } from '../types';
import { AlertTriangle, Calendar, CheckCircle, Clock } from 'lucide-react';

interface PaymentsStatsProps {
  payments: Payment[];
  loading?: boolean;
}

export function PaymentsStats({ payments, loading = false }: PaymentsStatsProps) {
  const stats = {
    totalCollected: payments
      .filter(p => p.status === 'paid')
      .reduce((sum, p) => sum + Number(p.amount), 0),
    pending: payments
      .filter(p => p.status === 'pending')
      .reduce((sum, p) => sum + Number(p.amount), 0),
    overdue: payments
      .filter(p => p.status === 'overdue')
      .reduce((sum, p) => sum + Number(p.amount), 0),
    thisMonth: payments
      .filter(p => {
        const dueDate = new Date(p.due_date);
        const now = new Date();
        return dueDate.getMonth() === now.getMonth() && dueDate.getFullYear() === now.getFullYear();
      })
      .reduce((sum, p) => sum + Number(p.amount), 0),
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <StatCard
        title="Total Collected"
        value={formatCurrency(stats.totalCollected)}
        icon={CheckCircle}
        accentColor="hsl(var(--success))"
        loading={loading}
        index={0}
      />
      <StatCard
        title="Pending"
        value={formatCurrency(stats.pending)}
        icon={Clock}
        accentColor="hsl(var(--warning))"
        loading={loading}
        index={1}
      />
      <StatCard
        title="Overdue"
        value={formatCurrency(stats.overdue)}
        icon={AlertTriangle}
        accentColor="hsl(var(--destructive))"
        loading={loading}
        index={2}
      />
      <StatCard
        title="This Month"
        value={formatCurrency(stats.thisMonth)}
        icon={Calendar}
        accentColor="hsl(var(--primary))"
        loading={loading}
        index={3}
      />
    </div>
  );
}
