import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { StatCard } from '@/shared/components/ui/StatCard';
import { CheckCircle, XCircle, TrendingUp, DollarSign } from 'lucide-react';
import type { PaymentMatch } from '../services/reconciliationService';
import type { UnmatchedPayment } from '../services/reconciliationService';

interface Props {
  matchHistory?: PaymentMatch[];
  unmatchedPayments?: UnmatchedPayment[];
  loading?: boolean;
}

export function ReconciliationReport({ matchHistory, unmatchedPayments, loading }: Props) {
  const matches = matchHistory || [];
  const unmatched = unmatchedPayments || [];

  const totalMatched = matches.reduce((s, m) => s + m.matchedAmount, 0);
  const totalUnmatched = unmatched.reduce((s, p) => s + p.amount, 0);
  const matchRate = matches.length + unmatched.length > 0
    ? Math.round(matches.length / (matches.length + unmatched.length) * 100)
    : 0;
  const avgConfidence = matches.length > 0
    ? Math.round(matches.reduce((s, m) => s + m.matchConfidence, 0) / matches.length * 100)
    : 0;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Dicocokkan"
          value={`Rp ${totalMatched.toLocaleString('id-ID')}`}
          icon={CheckCircle}
          accentColor="hsl(142 76% 36%)"
          loading={loading}
          index={0}
        />
        <StatCard
          title="Total Belum Cocok"
          value={`Rp ${totalUnmatched.toLocaleString('id-ID')}`}
          icon={XCircle}
          accentColor="hsl(0 84% 60%)"
          loading={loading}
          index={1}
        />
        <StatCard
          title="Match Rate"
          value={`${matchRate}%`}
          icon={TrendingUp}
          accentColor="hsl(var(--primary))"
          loading={loading}
          index={2}
        />
        <StatCard
          title="Rata-rata Keyakinan"
          value={`${avgConfidence}%`}
          icon={DollarSign}
          accentColor="hsl(38 92% 50%)"
          loading={loading}
          index={3}
        />
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Ringkasan</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-1">
          <p><span className="text-muted-foreground">Total pembayaran diproses:</span> <strong>{matches.length + unmatched.length}</strong></p>
          <p><span className="text-muted-foreground">Otomatis:</span> <strong>{matches.filter(m => m.matchType === 'auto').length}</strong></p>
          <p><span className="text-muted-foreground">Manual:</span> <strong>{matches.filter(m => m.matchType === 'manual').length}</strong></p>
          <p><span className="text-muted-foreground">Belum dicocokkan:</span> <strong>{unmatched.length}</strong></p>
        </CardContent>
      </Card>
    </div>
  );
}
