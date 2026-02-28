import { PaymentTransfer, TransferStats } from '../hooks/usePaymentTransfers';
import { formatCurrency } from '@/shared/utils/currency';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import {
  AlertTriangle,
  ArrowDownToLine,
  CheckCircle2,
  Clock,
  Loader2,
  RefreshCw,
  TrendingUp,
  XCircle,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface TransferStatusTabProps {
  transfers: PaymentTransfer[];
  stats: TransferStats;
  isLoading: boolean;
  onRetry: (transferId: string, bankAccountId: string | null) => Promise<void>;
}

const statusConfig = {
  completed: { label: 'Selesai', icon: CheckCircle2, variant: 'default' as const, color: 'text-green-600' },
  processing: { label: 'Diproses', icon: Clock, variant: 'secondary' as const, color: 'text-yellow-600' },
  pending: { label: 'Menunggu', icon: Clock, variant: 'outline' as const, color: 'text-muted-foreground' },
  failed: { label: 'Gagal', icon: XCircle, variant: 'destructive' as const, color: 'text-destructive' },
};

function StatusBadge({ status }: { status: PaymentTransfer['status'] }) {
  const cfg = statusConfig[status];
  const Icon = cfg.icon;
  return (
    <Badge variant={cfg.variant} className="gap-1">
      <Icon className="h-3 w-3" />
      {cfg.label}
    </Badge>
  );
}

function StatCard({ title, value, icon: Icon, iconColor }: { title: string; value: string; icon: React.ElementType; iconColor: string }) {
  return (
    <Card className="rounded-2xl bg-card/90 backdrop-blur-sm">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className={`gradient-icon-box ${iconColor}`}>
          <Icon className="h-4 w-4" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
}

function TransferCard({ transfer, onRetry }: { transfer: PaymentTransfer; onRetry: TransferStatusTabProps['onRetry'] }) {
  const [retrying, setRetrying] = useState(false);

  const handleRetry = async () => {
    setRetrying(true);
    try {
      await onRetry(transfer.id, transfer.bank_account_id);
      toast.success('Transfer sedang diproses ulang');
    } catch {
      toast.error('Gagal memproses ulang transfer');
    } finally {
      setRetrying(false);
    }
  };

  return (
    <div className="flex items-start justify-between gap-4 rounded-xl border border-border/50 bg-card/60 p-4">
      <div className="flex-1 space-y-1">
        <div className="flex items-center gap-2">
          <span className="font-semibold">{formatCurrency(transfer.net_amount)}</span>
          <StatusBadge status={transfer.status} />
        </div>
        <div className="text-sm text-muted-foreground">
          Jumlah kotor: {formatCurrency(transfer.amount)}
          {(transfer.platform_fee > 0 || transfer.gateway_fee > 0) && (
            <span> · Fee: {formatCurrency(Number(transfer.platform_fee) + Number(transfer.gateway_fee))}</span>
          )}
        </div>
        {transfer.bank_account && (
          <div className="text-sm text-muted-foreground">
            → {transfer.bank_account.bank_name} - {transfer.bank_account.account_number} ({transfer.bank_account.account_name})
          </div>
        )}
        <div className="text-xs text-muted-foreground">
          Dibuat: {format(new Date(transfer.created_at), 'dd MMM yyyy, HH:mm', { locale: id })}
          {transfer.completed_at && (
            <span> · Selesai: {format(new Date(transfer.completed_at), 'dd MMM yyyy, HH:mm', { locale: id })}</span>
          )}
        </div>
        {transfer.failure_reason && (
          <div className="mt-1 flex items-center gap-1 text-sm text-destructive">
            <AlertTriangle className="h-3 w-3" />
            {transfer.failure_reason}
          </div>
        )}
      </div>
      {transfer.status === 'failed' && (
        <Button size="sm" variant="outline" onClick={handleRetry} disabled={retrying} className="rounded-xl">
          {retrying ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          <span className="ml-1">Retry</span>
        </Button>
      )}
    </div>
  );
}

export function TransferStatusTab({ transfers, stats, isLoading, onRetry }: TransferStatusTabProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const failed = transfers.filter(t => t.status === 'failed');
  const processing = transfers.filter(t => t.status === 'processing' || t.status === 'pending');
  const completed = transfers.filter(t => t.status === 'completed');

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard title="Transfer Menunggu" value={formatCurrency(stats.pendingTotal)} icon={Clock} iconColor="text-yellow-600" />
        <StatCard title="Selesai Minggu Ini" value={formatCurrency(stats.completedThisWeek)} icon={CheckCircle2} iconColor="text-green-600" />
        <StatCard title="Gagal" value={String(stats.failedCount)} icon={XCircle} iconColor="text-destructive" />
        <StatCard title="Rata-rata 7 Hari" value={formatCurrency(stats.sevenDayAverage)} icon={TrendingUp} iconColor="text-primary" />
      </div>

      {transfers.length === 0 ? (
        <Card className="rounded-2xl bg-card/90 backdrop-blur-sm">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <ArrowDownToLine className="mb-4 h-12 w-12 text-muted-foreground/40" />
            <h3 className="text-lg font-semibold">Belum Ada Transfer</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Transfer dana dari payment gateway akan muncul di sini setelah pembayaran pertama diproses.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {failed.length > 0 && (
            <section className="space-y-3">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-destructive">
                <XCircle className="h-4 w-4" /> Gagal — Perlu Perhatian ({failed.length})
              </h3>
              <div className="space-y-2">
                {failed.map(t => <TransferCard key={t.id} transfer={t} onRetry={onRetry} />)}
              </div>
            </section>
          )}

          {processing.length > 0 && (
            <section className="space-y-3">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-yellow-600">
                <Clock className="h-4 w-4" /> Sedang Diproses ({processing.length})
              </h3>
              <div className="space-y-2">
                {processing.map(t => <TransferCard key={t.id} transfer={t} onRetry={onRetry} />)}
              </div>
            </section>
          )}

          {completed.length > 0 && (
            <section className="space-y-3">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-green-600">
                <CheckCircle2 className="h-4 w-4" /> Selesai ({completed.length})
              </h3>
              <div className="space-y-2">
                {completed.map(t => <TransferCard key={t.id} transfer={t} onRetry={onRetry} />)}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
