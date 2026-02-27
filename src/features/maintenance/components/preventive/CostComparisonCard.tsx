import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { TrendingDown, TrendingUp, ShieldCheck } from 'lucide-react';

interface Props {
  preventiveCost: number;
  emergencyCost: number;
  loading?: boolean;
}

export function CostComparisonCard({ preventiveCost, emergencyCost, loading }: Props) {
  if (loading) return <Card className="rounded-xl animate-pulse h-32" />;

  const savings = emergencyCost - preventiveCost;
  const savingsPercent = emergencyCost > 0 ? ((savings / emergencyCost) * 100).toFixed(0) : '0';

  return (
    <Card className="rounded-xl">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-success" />
          Perbandingan Biaya
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="rounded-lg bg-success/5 p-3">
            <p className="text-xs text-muted-foreground">Preventif/Tahun</p>
            <p className="text-lg font-bold text-success">Rp {preventiveCost.toLocaleString('id-ID')}</p>
          </div>
          <div className="rounded-lg bg-destructive/5 p-3">
            <p className="text-xs text-muted-foreground">Darurat/Tahun</p>
            <p className="text-lg font-bold text-destructive">Rp {emergencyCost.toLocaleString('id-ID')}</p>
          </div>
          <div className={`rounded-lg p-3 ${savings > 0 ? 'bg-success/10' : 'bg-muted/50'}`}>
            <p className="text-xs text-muted-foreground">Estimasi Hemat</p>
            <div className="flex items-center justify-center gap-1">
              {savings > 0 ? <TrendingDown className="h-4 w-4 text-success" /> : <TrendingUp className="h-4 w-4 text-destructive" />}
              <p className={`text-lg font-bold ${savings > 0 ? 'text-success' : 'text-destructive'}`}>{savingsPercent}%</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
