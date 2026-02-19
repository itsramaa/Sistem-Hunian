import { Card, CardContent } from '@/shared/components/ui/card';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { AlertCircle, Building2, Clock, DollarSign, Home, TrendingUp, Users } from 'lucide-react';
import { useMerchantAnalytics } from '../hooks/useMerchantAnalytics';

interface MerchantAnalyticsTabProps {
  merchantId: string;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export function MerchantAnalyticsTab({ merchantId }: MerchantAnalyticsTabProps) {
  const { analytics, loading, error } = useMerchantAnalytics(merchantId);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-destructive">
        <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p>Gagal memuat data analytics</p>
        <p className="text-xs text-muted-foreground mt-1">{(error as Error).message}</p>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Tidak dapat memuat data analytics
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Revenue & Tenants */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="bg-success/5 border-success/20">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-success/10">
                <DollarSign className="h-4 w-4 text-success" />
              </div>
              <div>
                <p className="text-lg font-bold text-success">{formatCurrency(analytics.totalRevenue)}</p>
                <p className="text-xs text-muted-foreground">Total Revenue</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-primary/10">
                <Users className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-lg font-bold">{analytics.totalTenants}</p>
                <p className="text-xs text-muted-foreground">Total Tenants</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Properties & Units */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-primary/10">
                <Home className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-lg font-bold">{analytics.totalProperties}</p>
                <p className="text-xs text-muted-foreground">Properties</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-primary/10">
                <Building2 className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-lg font-bold">{analytics.occupiedUnits}/{analytics.totalUnits}</p>
                <p className="text-xs text-muted-foreground">Units Occupied</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-primary/10">
                <TrendingUp className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-lg font-bold">{analytics.occupancyRate.toFixed(0)}%</p>
                <p className="text-xs text-muted-foreground">Occupancy</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Invoice Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="bg-success/5 border-success/20">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-success/10">
                <TrendingUp className="h-4 w-4 text-success" />
              </div>
              <div>
                <p className="text-lg font-bold text-success">{analytics.paidInvoices}</p>
                <p className="text-xs text-muted-foreground">Paid Invoices</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-warning/5 border-warning/20">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-warning/10">
                <Clock className="h-4 w-4 text-warning" />
              </div>
              <div>
                <p className="text-lg font-bold text-warning">{analytics.pendingInvoices}</p>
                <p className="text-xs text-muted-foreground">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-destructive/5 border-destructive/20">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-destructive/10">
                <AlertCircle className="h-4 w-4 text-destructive" />
              </div>
              <div>
                <p className="text-lg font-bold text-destructive">{analytics.overdueInvoices}</p>
                <p className="text-xs text-muted-foreground">Overdue</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* On-time Payment Rate */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-primary/10">
                <TrendingUp className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">On-Time Payment Rate</p>
                <p className="text-xs text-muted-foreground">Persentase invoice dibayar tepat waktu</p>
              </div>
            </div>
            <div className="text-right">
              <p className={`text-2xl font-bold ${analytics.onTimePaymentRate >= 80 ? 'text-success' : analytics.onTimePaymentRate >= 50 ? 'text-warning' : 'text-destructive'}`}>
                {analytics.onTimePaymentRate.toFixed(0)}%
              </p>
            </div>
          </div>
          {/* Progress bar */}
          <div className="mt-3 h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all ${analytics.onTimePaymentRate >= 80 ? 'bg-success' : analytics.onTimePaymentRate >= 50 ? 'bg-warning' : 'bg-destructive'}`}
              style={{ width: `${analytics.onTimePaymentRate}%` }}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
