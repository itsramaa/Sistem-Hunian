import { StatCard } from '@/shared/components/ui/StatCard';
import { CheckCircle, FileText, PenLine, Users } from 'lucide-react';

interface ContractStatsProps {
  totalContracts: number;
  activeCount: number;
  pendingSignatureCount: number;
  pastCount: number;
  loading?: boolean;
}

export function ContractStats({
  totalContracts,
  activeCount,
  pendingSignatureCount,
  pastCount,
  loading = false,
}: ContractStatsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <StatCard
        title="Total Contracts"
        value={totalContracts}
        icon={FileText}
        accentColor="hsl(var(--primary))"
        loading={loading}
        index={0}
      />
      <StatCard
        title="Active"
        value={activeCount}
        icon={CheckCircle}
        accentColor="hsl(var(--success))"
        loading={loading}
        index={1}
      />
      <StatCard
        title="Awaiting Signature"
        value={pendingSignatureCount}
        icon={PenLine}
        accentColor="hsl(var(--warning))"
        loading={loading}
        index={2}
      />
      <StatCard
        title="Past Contracts"
        value={pastCount}
        icon={Users}
        accentColor="hsl(var(--muted-foreground))"
        loading={loading}
        index={3}
      />
    </div>
  );
}
