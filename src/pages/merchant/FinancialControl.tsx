import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/shared/components/ui/collapsible';
import { useFinancialControl } from '@/features/finance/hooks/useFinancialControl';
import { formatCurrency } from '@/shared/utils/currency';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import {
  ArrowDownRight,
  ArrowUpRight,
  Check,
  ChevronDown,
  CreditCard,
  DollarSign,
  Info,
  Loader2,
  ReceiptText,
  Shield,
  X,
} from 'lucide-react';
import { useState } from 'react';
import type { PendingApprovalItem, RecentTransaction } from '@/features/finance/services/financialControlService';

const typeLabels: Record<string, string> = {
  expense: 'Pengeluaran',
  deposit_refund: 'Refund Deposit',
  move_out: 'Move-Out',
  payment: 'Pembayaran',
  refund: 'Refund',
};

const statusColors: Record<string, string> = {
  paid: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  approved: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  verified: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  pending_approval: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  rejected: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  overdue: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
};

function formatDate(dateStr: string) {
  try {
    return format(new Date(dateStr), 'd MMM yyyy', { locale: localeId });
  } catch {
    return dateStr;
  }
}

export default function FinancialControl() {
  const {
    data,
    isLoading,
    approveExpense,
    rejectExpense,
    approveDepositRefund,
    rejectDepositRefund,
    approveMoveOut,
    rejectMoveOut,
  } = useFinancialControl();
  const [rulesOpen, setRulesOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const { cashBalance = 0, receivables = 0, payables = 0, pendingApprovals = [], recentTransactions = [] } = data || {};

  function handleApprove(item: PendingApprovalItem) {
    if (item.type === 'expense') approveExpense.mutate(item.id);
    else if (item.type === 'deposit_refund') approveDepositRefund.mutate(item.id);
    else if (item.type === 'move_out') approveMoveOut.mutate(item.id);
  }

  function handleReject(item: PendingApprovalItem) {
    if (item.type === 'expense') rejectExpense.mutate(item.id);
    else if (item.type === 'deposit_refund') rejectDepositRefund.mutate(item.id);
    else if (item.type === 'move_out') rejectMoveOut.mutate(item.id);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Kontrol Keuangan</h1>
          <p className="text-muted-foreground">Ringkasan keuangan & persetujuan dalam satu tempat</p>
        </div>
        <Shield className="h-8 w-8 text-primary" />
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Saldo Kas"
          value={formatCurrency(cashBalance)}
          subtitle="Pendapatan - Pengeluaran"
          icon={<DollarSign className="h-5 w-5" />}
          trend={cashBalance >= 0 ? 'up' : 'down'}
        />
        <KpiCard
          title="Piutang"
          value={formatCurrency(receivables)}
          subtitle="Tagihan belum dibayar"
          icon={<ArrowDownRight className="h-5 w-5" />}
          trend="neutral"
        />
        <KpiCard
          title="Hutang"
          value={formatCurrency(payables)}
          subtitle="Pengeluaran & refund pending"
          icon={<ArrowUpRight className="h-5 w-5" />}
          trend="neutral"
        />
        <KpiCard
          title="Menunggu Approve"
          value={`${pendingApprovals.length} item`}
          subtitle="Butuh persetujuan Anda"
          icon={<ReceiptText className="h-5 w-5" />}
          trend={pendingApprovals.length > 0 ? 'alert' : 'up'}
        />
      </div>

      {/* Approval Rules */}
      <Collapsible open={rulesOpen} onOpenChange={setRulesOpen}>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground">
            <Info className="h-4 w-4" />
            Aturan Persetujuan
            <ChevronDown className={`h-4 w-4 transition-transform ${rulesOpen ? 'rotate-180' : ''}`} />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <Card className="mt-2">
            <CardContent className="pt-4 text-sm space-y-2">
              <p><strong>Otomatis disetujui:</strong> Pembayaran via Xendit, pengeluaran &lt; Rp 500.000, invoice recurring terjadwal</p>
              <p><strong>Perlu persetujuan owner:</strong> Pengeluaran ≥ Rp 500.000, refund deposit, move-out notice, klaim kerusakan</p>
            </CardContent>
          </Card>
        </CollapsibleContent>
      </Collapsible>

      {/* Pending Approvals */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Perlu Persetujuan Anda</CardTitle>
          <CardDescription>
            {pendingApprovals.length === 0 ? 'Tidak ada item yang menunggu persetujuan' : `${pendingApprovals.length} item menunggu`}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {pendingApprovals.map((item) => (
            <div key={`${item.type}-${item.id}`} className="flex items-center justify-between gap-3 rounded-lg border p-3">
              <div className="flex items-center gap-3 min-w-0">
                <Badge variant="outline" className="shrink-0">{typeLabels[item.type]}</Badge>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">
                    {item.amount != null ? formatCurrency(item.amount) : ''} — {item.description}
                  </p>
                  <p className="text-xs text-muted-foreground">{formatDate(item.date)}</p>
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                <Button size="sm" variant="default" className="gap-1" onClick={() => handleApprove(item)}>
                  <Check className="h-3.5 w-3.5" /> Setuju
                </Button>
                <Button size="sm" variant="destructive" className="gap-1" onClick={() => handleReject(item)}>
                  <X className="h-3.5 w-3.5" /> Tolak
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Recent Transactions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">10 Transaksi Terakhir</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {recentTransactions.map((tx) => (
              <TransactionRow key={`${tx.type}-${tx.id}`} tx={tx} />
            ))}
            {recentTransactions.length === 0 && (
              <p className="text-sm text-muted-foreground py-4 text-center">Belum ada transaksi</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function KpiCard({ title, value, subtitle, icon, trend }: {
  title: string; value: string; subtitle: string; icon: React.ReactNode;
  trend: 'up' | 'down' | 'neutral' | 'alert';
}) {
  const borderClass = trend === 'alert' ? 'border-destructive/50' : '';
  return (
    <Card className={borderClass}>
      <CardContent className="pt-5 pb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{title}</span>
          <span className="text-muted-foreground">{icon}</span>
        </div>
        <p className="text-xl font-bold tracking-tight">{value}</p>
        <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
      </CardContent>
    </Card>
  );
}

function TransactionRow({ tx }: { tx: RecentTransaction }) {
  const colorClass = statusColors[tx.status] || 'bg-muted text-muted-foreground';
  const icon = tx.type === 'payment' ? <DollarSign className="h-4 w-4" /> : <CreditCard className="h-4 w-4" />;

  return (
    <div className="flex items-center justify-between gap-3 py-2 border-b last:border-0">
      <div className="flex items-center gap-3 min-w-0">
        <span className="text-muted-foreground shrink-0">{icon}</span>
        <div className="min-w-0">
          <p className="text-sm font-medium truncate">{tx.description}</p>
          <p className="text-xs text-muted-foreground">{formatDate(tx.date)}</p>
        </div>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <span className="text-sm font-semibold">{formatCurrency(tx.amount)}</span>
        <Badge className={`text-[10px] ${colorClass}`}>
          {tx.status.replace('_', ' ')}
        </Badge>
      </div>
    </div>
  );
}
