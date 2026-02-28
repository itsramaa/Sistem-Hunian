import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { useMerchantDashboardStats } from '@/features/dashboard/hooks/useMerchantDashboardStats';
import { formatCurrency } from '@/shared/utils/currency';
import { Wallet, Clock, AlertCircle, TrendingUp, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function CashFlowWidget() {
  const { data: stats } = useMerchantDashboardStats();
  const navigate = useNavigate();

  const available = stats?.financials.balance || 0;
  const pending = stats?.financials.pendingBalance || 0;
  const receivables = stats?.financials.outstandingReceivables || 0;
  const receivableCount = stats?.financials.outstandingInvoiceCount || 0;
  const forecast = available + pending + receivables;

  const metrics = [
    {
      icon: Wallet,
      label: 'Saldo Tersedia',
      value: formatCurrency(available),
      color: 'text-success',
      bgColor: 'from-success/20 to-success/5',
      badge: null,
      onClick: () => navigate('/merchant/payments'),
    },
    {
      icon: Clock,
      label: 'Transfer Pending',
      value: formatCurrency(pending),
      color: 'text-warning',
      bgColor: 'from-warning/20 to-warning/5',
      badge: pending > 0 ? 'PROSES' : null,
      onClick: () => navigate('/merchant/payments'),
    },
    {
      icon: AlertCircle,
      label: 'Piutang',
      value: formatCurrency(receivables),
      color: 'text-destructive',
      bgColor: 'from-destructive/20 to-destructive/5',
      badge: receivableCount > 0 ? `${receivableCount} tagihan` : null,
      onClick: () => navigate('/merchant/collections'),
    },
    {
      icon: TrendingUp,
      label: 'Proyeksi 7 Hari',
      value: formatCurrency(forecast),
      color: 'text-primary',
      bgColor: 'from-primary/20 to-primary/5',
      badge: 'OPTIMIS',
      onClick: undefined,
    },
  ];

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold tracking-tight">💰 Arus Kas</h2>
      <Card className="bg-card/90 backdrop-blur-sm rounded-2xl border border-border/40">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-success/20 to-success/5 flex items-center justify-center">
              <Wallet className="h-4 w-4 text-success" />
            </div>
            <div>
              <CardTitle>Ringkasan Arus Kas</CardTitle>
              <CardDescription>Posisi keuangan Anda minggu ini</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {metrics.map((m) => (
              <div
                key={m.label}
                className={`rounded-xl border border-border/40 p-4 space-y-2 ${m.onClick ? 'cursor-pointer hover:bg-muted/50 transition-colors' : ''}`}
                onClick={m.onClick}
              >
                <div className="flex items-center gap-2">
                  <div className={`h-8 w-8 rounded-lg bg-gradient-to-br ${m.bgColor} flex items-center justify-center`}>
                    <m.icon className={`h-4 w-4 ${m.color}`} />
                  </div>
                  <span className="text-xs text-muted-foreground">{m.label}</span>
                </div>
                <div className="text-lg font-bold">{m.value}</div>
                {m.badge && (
                  <Badge variant="outline" className="text-[9px]">
                    {m.badge}
                  </Badge>
                )}
              </div>
            ))}
          </div>
          <p className="text-[10px] text-muted-foreground mt-3 italic">
            *Proyeksi 7 hari = Saldo + Pending + Piutang (jika semua terbayar)
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-3 gap-2 rounded-xl"
            onClick={() => navigate('/merchant/financial-reports')}
          >
            Lihat Laporan Keuangan
            <ArrowRight className="h-3 w-3" />
          </Button>
        </CardContent>
      </Card>
    </section>
  );
}
