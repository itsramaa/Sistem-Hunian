import { useState } from 'react';
import { Receipt, FileText, CheckCircle } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Input } from '@/shared/components/ui/input';
import { Badge } from '@/shared/components/ui/badge';
import { useUtilityCharges, useGenerateCharges } from '../hooks/useUtilityBilling';
import { formatCurrency } from '@/shared/utils/currency';

interface Props {
  propertyId: string;
  merchantId: string;
}

const STATUS_BADGES: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  pending: { label: 'Pending', variant: 'secondary' },
  invoiced: { label: 'Tertagih', variant: 'default' },
  paid: { label: 'Lunas', variant: 'outline' },
};

const TYPE_LABELS: Record<string, string> = {
  water: '💧 Air',
  electricity: '⚡ Listrik',
  internet: '🌐 Internet',
  cleaning: '🧹 Kebersihan',
  other: '📦 Lainnya',
};

export function UtilityChargeGenerator({ propertyId, merchantId }: Props) {
  const [period, setPeriod] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  const { data: charges, isLoading } = useUtilityCharges(propertyId, period);
  const generateCharges = useGenerateCharges();

  const handleGenerate = () => {
    generateCharges.mutate({ merchantId, propertyId, period });
  };

  const totalPending = (charges || []).filter(c => c.status === 'pending').reduce((sum, c) => sum + Number(c.unit_share), 0);
  const totalAll = (charges || []).reduce((sum, c) => sum + Number(c.unit_share), 0);

  // Group by utility type
  const grouped = (charges || []).reduce((acc, charge) => {
    const key = charge.utility_type;
    if (!acc[key]) acc[key] = [];
    acc[key].push(charge);
    return acc;
  }, {} as Record<string, typeof charges>);

  return (
    <Card className="rounded-2xl border-border/40">
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <CardTitle className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5">
                <Receipt className="h-5 w-5 text-primary" />
              </div>
              Tagihan Utilitas
            </CardTitle>
            <CardDescription>Generate dan kelola tagihan utilitas per periode</CardDescription>
          </div>
          <div className="flex gap-2">
            <Input type="month" value={period} onChange={(e) => setPeriod(e.target.value)} className="w-[160px] rounded-xl" />
            {(!charges || charges.length === 0) && (
              <Button onClick={handleGenerate} disabled={generateCharges.isPending} className="rounded-xl">
                <FileText className="h-4 w-4 mr-1" />
                {generateCharges.isPending ? 'Generating...' : 'Generate Tagihan'}
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Stats strip */}
        {charges && charges.length > 0 && (
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="p-3 rounded-xl bg-muted/50 text-center">
              <p className="text-xs text-muted-foreground">Total Tagihan</p>
              <p className="text-lg font-semibold">{formatCurrency(totalAll)}</p>
            </div>
            <div className="p-3 rounded-xl bg-muted/50 text-center">
              <p className="text-xs text-muted-foreground">Pending</p>
              <p className="text-lg font-semibold text-warning">{formatCurrency(totalPending)}</p>
            </div>
          </div>
        )}

        {isLoading ? (
          <p className="text-center py-8 text-muted-foreground">Memuat...</p>
        ) : !charges || charges.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Receipt className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Belum ada tagihan untuk periode ini</p>
            <p className="text-xs mt-1">Klik "Generate Tagihan" untuk membuat tagihan otomatis</p>
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(grouped).map(([type, items]) => (
              <div key={type} className="space-y-2">
                <h4 className="text-sm font-medium">{TYPE_LABELS[type] || type}</h4>
                <div className="space-y-1">
                  {(items || []).map((charge: any) => (
                    <div key={charge.id} className="flex items-center justify-between p-3 rounded-xl bg-card/60 border border-border/30">
                      <div>
                        <span className="text-sm font-medium">{charge.units?.unit_number || charge.unit_id}</span>
                        {charge.quantity != null && (
                          <span className="text-xs text-muted-foreground ml-2">
                            ({charge.quantity} × {formatCurrency(charge.rate)})
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold">{formatCurrency(charge.unit_share)}</span>
                        <Badge variant={STATUS_BADGES[charge.status]?.variant || 'secondary'}>
                          {STATUS_BADGES[charge.status]?.label || charge.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
