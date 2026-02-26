import { useReconciliation } from '@/features/reconciliation/hooks/useReconciliation';
import { UnmatchedPaymentsTable } from '@/features/reconciliation/components/UnmatchedPaymentsTable';
import { StatCard } from '@/shared/components/ui/StatCard';
import { CheckCircle, Clock, AlertTriangle } from 'lucide-react';

export default function MerchantReconciliation() {
  const { unmatched, manualMatch, autoMatch } = useReconciliation();

  const payments = unmatched.data || [];
  const pendingReview = payments.filter(p => p.reconciliationStatus === 'pending_review').length;
  const unmatchedCount = payments.filter(p => p.reconciliationStatus === 'unmatched').length;
  const totalAmount = payments.reduce((s, p) => s + p.amount, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Rekonsiliasi Pembayaran</h1>
        <p className="text-muted-foreground">Cocokkan pembayaran dengan tagihan secara otomatis atau manual</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Belum Dicocokkan"
          value={unmatchedCount}
          subtitle="pembayaran"
          icon={Clock}
          accentColor="hsl(38 92% 50%)"
          loading={unmatched.isLoading}
          index={0}
        />
        <StatCard
          title="Perlu Review"
          value={pendingReview}
          subtitle="pembayaran"
          icon={AlertTriangle}
          accentColor="hsl(0 84% 60%)"
          loading={unmatched.isLoading}
          index={1}
        />
        <StatCard
          title="Total Belum Cocok"
          value={`Rp ${totalAmount.toLocaleString('id-ID')}`}
          icon={CheckCircle}
          accentColor="hsl(var(--primary))"
          loading={unmatched.isLoading}
          index={2}
        />
      </div>

      <UnmatchedPaymentsTable
        payments={unmatched.data}
        loading={unmatched.isLoading}
        onManualMatch={(paymentId, invoiceId, amount) =>
          manualMatch.mutate({ paymentId, invoiceId, amount })
        }
        onAutoMatch={(paymentId) => autoMatch.mutate(paymentId)}
        isMatching={manualMatch.isPending || autoMatch.isPending}
      />
    </div>
  );
}
