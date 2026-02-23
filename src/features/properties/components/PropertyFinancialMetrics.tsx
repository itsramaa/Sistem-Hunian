import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { TrendingUp, TrendingDown, Clock, DollarSign, BarChart3, AlertTriangle } from 'lucide-react';

interface FinancialMetricsProps {
  property: {
    construction_cost?: number;
    renovation_cost?: number;
    monthly_amortization?: number;
    monthly_maintenance_cost?: number;
    avg_annual_unexpected_cost?: number;
    marketing_cost?: number;
  };
  monthlyRevenue: number;
  occupancyRate: number;
}

export function PropertyFinancialMetrics({ property, monthlyRevenue, occupancyRate }: FinancialMetricsProps) {
  const fmt = (v: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(v);

  const totalInvestment = (property.construction_cost || 0) + (property.renovation_cost || 0);
  const monthlyAmortization = property.monthly_amortization || 0;
  const monthlyMaintenance = property.monthly_maintenance_cost || 0;
  const monthlyUnexpected = (property.avg_annual_unexpected_cost || 0) / 12;
  const monthlyMarketing = property.marketing_cost || 0;

  const totalMonthlyCost = monthlyAmortization + monthlyMaintenance + monthlyUnexpected + monthlyMarketing;
  const netProfitMonthly = monthlyRevenue - totalMonthlyCost;
  const annualNetProfit = netProfitMonthly * 12;
  const roiAnnual = totalInvestment > 0 ? (annualNetProfit / totalInvestment) * 100 : 0;
  const paybackYears = annualNetProfit > 0 ? totalInvestment / annualNetProfit : Infinity;

  const isDataComplete = totalInvestment > 0 && monthlyRevenue > 0;

  const metrics = [
    { label: 'Total Investasi', value: fmt(totalInvestment), icon: DollarSign, color: 'text-primary' },
    { label: 'Revenue Rata-rata/bulan', value: fmt(monthlyRevenue), icon: TrendingUp, color: 'text-success' },
    { label: 'Total Biaya/bulan', value: fmt(totalMonthlyCost), icon: TrendingDown, color: 'text-destructive' },
    { label: 'Net Profit/bulan', value: fmt(netProfitMonthly), icon: BarChart3, color: netProfitMonthly >= 0 ? 'text-success' : 'text-destructive' },
    { label: 'ROI Tahunan', value: `${roiAnnual.toFixed(1)}%`, icon: TrendingUp, color: roiAnnual >= 0 ? 'text-success' : 'text-destructive' },
    { label: 'Payback Period', value: paybackYears === Infinity ? '-' : `${paybackYears.toFixed(1)} tahun`, icon: Clock, color: 'text-warning' },
  ];

  return (
    <Card className="rounded-2xl">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Metrik Keuangan DSS</CardTitle>
            <CardDescription>Auto-kalkulasi berdasarkan data investasi & revenue</CardDescription>
          </div>
          {!isDataComplete && (
            <Badge variant="outline" className="text-warning border-warning/30 gap-1">
              <AlertTriangle className="h-3 w-3" /> Data belum lengkap
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {metrics.map((m) => (
            <div key={m.label} className="p-3 rounded-xl bg-muted/30 border border-border/30">
              <div className="flex items-center gap-1.5 mb-1">
                <m.icon className={`h-4 w-4 ${m.color}`} />
                <span className="text-xs text-muted-foreground">{m.label}</span>
              </div>
              <p className="text-sm font-bold text-foreground">{isDataComplete ? m.value : '-'}</p>
            </div>
          ))}
        </div>

        {isDataComplete && (
          <div className="mt-4 p-3 rounded-xl bg-muted/30 border border-border/30 space-y-1 text-sm">
            <p className="font-medium text-foreground">Rincian Biaya Bulanan:</p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-muted-foreground">
              <span>Amortisasi</span><span className="text-right">{fmt(monthlyAmortization)}</span>
              <span>Maintenance Rutin</span><span className="text-right">{fmt(monthlyMaintenance)}</span>
              <span>Biaya Tak Terduga</span><span className="text-right">{fmt(monthlyUnexpected)}</span>
              <span>Marketing</span><span className="text-right">{fmt(monthlyMarketing)}</span>
            </div>
          </div>
        )}

        <div className="mt-3 p-2.5 rounded-xl bg-primary/5 border border-primary/10">
          <p className="text-xs text-muted-foreground">
            Occupancy Rate: <span className="font-semibold text-foreground">{(occupancyRate * 100).toFixed(0)}%</span>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
