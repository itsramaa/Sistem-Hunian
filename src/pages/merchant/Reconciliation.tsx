import { useReconciliation } from '@/features/reconciliation/hooks/useReconciliation';
import { UnmatchedPaymentsTable } from '@/features/reconciliation/components/UnmatchedPaymentsTable';
import { MatchHistoryTable } from '@/features/reconciliation/components/MatchHistoryTable';
import { ReconciliationReport } from '@/features/reconciliation/components/ReconciliationReport';
import { PaymentReviewCard } from '@/features/reconciliation/components/PaymentReviewCard';
import { StatCard } from '@/shared/components/ui/StatCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { CheckCircle, Clock, AlertTriangle } from 'lucide-react';

export default function MerchantReconciliation() {
  const { unmatched, manualMatch, autoMatch, matchHistory } = useReconciliation();

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

      <Tabs defaultValue="review">
        <TabsList>
          <TabsTrigger value="review">Perlu Review</TabsTrigger>
          <TabsTrigger value="history">Riwayat Cocok</TabsTrigger>
          <TabsTrigger value="report">Laporan</TabsTrigger>
        </TabsList>

        <TabsContent value="review" className="space-y-4">
          {payments.length > 0 && payments.length <= 10 ? (
            payments.map(p => (
              <PaymentReviewCard
                key={p.id}
                payment={p}
                onManualMatch={(paymentId, invoiceId, amount) => manualMatch.mutate({ paymentId, invoiceId, amount })}
                onAutoMatch={(paymentId) => autoMatch.mutate(paymentId)}
                isMatching={manualMatch.isPending || autoMatch.isPending}
              />
            ))
          ) : (
            <UnmatchedPaymentsTable
              payments={unmatched.data}
              loading={unmatched.isLoading}
              onManualMatch={(paymentId, invoiceId, amount) => manualMatch.mutate({ paymentId, invoiceId, amount })}
              onAutoMatch={(paymentId) => autoMatch.mutate(paymentId)}
              isMatching={manualMatch.isPending || autoMatch.isPending}
            />
          )}
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Riwayat Pencocokan</CardTitle>
            </CardHeader>
            <CardContent>
              <MatchHistoryTable matches={matchHistory.data} loading={matchHistory.isLoading} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="report">
          <ReconciliationReport
            matchHistory={matchHistory.data}
            unmatchedPayments={unmatched.data}
            loading={unmatched.isLoading || matchHistory.isLoading}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
