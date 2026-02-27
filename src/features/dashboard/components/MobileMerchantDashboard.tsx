import { useNavigate } from 'react-router-dom';
import { Building2, CreditCard, FileText, Bell, Users, Send, Wrench } from 'lucide-react';
import { Card, CardContent } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Progress } from '@/shared/components/ui/progress';
import { useMerchantDashboardStats } from '@/features/dashboard/hooks/useMerchantDashboardStats';
import { formatCurrency } from '@/shared/utils/currency';
import { QuickExpenseSheet } from '@/features/expenses/components/QuickExpenseSheet';
import { MerchantDashboardSkeleton } from '@/shared/components/ui/skeletons';

export function MobileMerchantDashboard() {
  const navigate = useNavigate();
  const { data: stats, isLoading } = useMerchantDashboardStats();

  if (isLoading) return <MerchantDashboardSkeleton />;

  const occupancy = Math.round(stats?.properties.occupancyRate || 0);
  const overdueCount = 0; // Will be populated when stats include overdue data

  return (
    <div className="space-y-4 pb-20">
      {/* KPI Strip */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="rounded-2xl" onClick={() => navigate('/merchant/properties')}>
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-1">
              <Building2 className="h-4 w-4 text-primary" />
              <span className="text-xs text-muted-foreground">Hunian</span>
            </div>
            <div className="text-2xl font-bold">{occupancy}%</div>
            <Progress value={occupancy} className="h-1.5 mt-1" />
          </CardContent>
        </Card>

        <Card className="rounded-2xl" onClick={() => navigate('/merchant/payments')}>
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-1">
              <CreditCard className="h-4 w-4 text-success" />
              <span className="text-xs text-muted-foreground">Pendapatan</span>
            </div>
            <div className="text-lg font-bold">{formatCurrency(stats?.financials.monthlyRevenue || 0)}</div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl" onClick={() => navigate('/merchant/invoices')}>
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-1">
              <FileText className="h-4 w-4 text-destructive" />
              <span className="text-xs text-muted-foreground">Overdue</span>
            </div>
            <div className="text-2xl font-bold">{overdueCount}</div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl" onClick={() => navigate('/merchant/alerts')}>
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-1">
              <Bell className="h-4 w-4 text-warning" />
              <span className="text-xs text-muted-foreground">Alerts</span>
            </div>
            <div className="text-2xl font-bold">0</div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-3 gap-2">
        <Button
          variant="outline"
          className="h-16 flex-col gap-1 rounded-xl text-xs"
          onClick={() => navigate('/merchant/invoices')}
        >
          <Send className="h-5 w-5" />
          Kirim Reminder
        </Button>
        <QuickExpenseSheet
          trigger={
            <Button variant="outline" className="h-16 flex-col gap-1 rounded-xl text-xs">
              <CreditCard className="h-5 w-5" />
              Log Expense
            </Button>
          }
        />
        <Button
          variant="outline"
          className="h-16 flex-col gap-1 rounded-xl text-xs"
          onClick={() => navigate('/merchant/tenants')}
        >
          <Users className="h-5 w-5" />
          Penyewa
        </Button>
      </div>

      {/* Critical Alerts */}
      {overdueCount > 0 && (
        <Card className="rounded-2xl border-destructive/30 bg-destructive/5">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-destructive" />
                <span className="text-sm font-medium">{overdueCount} tagihan overdue</span>
              </div>
              <Button size="sm" variant="destructive" onClick={() => navigate('/merchant/invoices')}>
                Lihat
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Properties Overview */}
      <Card className="rounded-2xl">
        <CardContent className="p-3 space-y-2">
          <h3 className="text-sm font-semibold">Properti</h3>
          {stats?.properties.list.slice(0, 3).map(prop => (
            <div
              key={prop.id}
              className="flex items-center justify-between text-sm cursor-pointer hover:bg-muted/50 rounded-lg p-2 -mx-1"
              onClick={() => navigate(`/merchant/properties/${prop.id}`)}
            >
              <span>{prop.name}</span>
              <Badge variant="outline">
                {prop.occupied_units}/{prop.total_units}
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
