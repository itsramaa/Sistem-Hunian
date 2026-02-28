import { useNavigate } from 'react-router-dom';
import { Building2, CreditCard, FileText, Bell, Users, Send, Wrench, Calendar, ScrollText, AlertTriangle } from 'lucide-react';
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
  const overdueCount = stats?.alerts?.overdueInvoices?.count || 0;
  const totalAlerts = overdueCount + (stats?.alerts?.staleMaintenance || 0) + (stats?.alerts?.expiringContracts || 0);

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
            <div className="flex items-center gap-1.5">
              <span className="text-2xl font-bold">{occupancy}%</span>
              <Badge className={`text-[9px] px-1.5 py-0 ${occupancy >= 80 ? 'bg-success/20 text-success border-success/30' : occupancy >= 50 ? 'bg-warning/20 text-warning border-warning/30' : 'bg-destructive/20 text-destructive border-destructive/30'}`}>
                {occupancy >= 80 ? 'BAIK' : occupancy >= 50 ? 'PERHATIAN' : 'KRITIS'}
              </Badge>
            </div>
            <Progress value={occupancy} className="h-1.5 mt-1" />
          </CardContent>
        </Card>

        <Card className="rounded-2xl" onClick={() => navigate('/merchant/payments')}>
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-1">
              <CreditCard className="h-4 w-4 text-success" />
              <span className="text-xs text-muted-foreground">Saldo</span>
            </div>
            <div className="text-lg font-bold">{formatCurrency(stats?.financials.balance || 0)}</div>
            <div className="flex items-center gap-1 mt-1">
              <Badge className="text-[9px] px-1.5 py-0 bg-warning/20 text-warning border-warning/30">
                Pending: {formatCurrency(stats?.financials.pendingBalance || 0)}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl" onClick={() => navigate('/merchant/invoices')}>
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-1">
              <FileText className="h-4 w-4 text-destructive" />
              <span className="text-xs text-muted-foreground">Overdue</span>
            </div>
            <div className="text-2xl font-bold">{overdueCount}</div>
            {overdueCount > 0 && (
              <p className="text-[10px] text-destructive">{formatCurrency(stats?.alerts?.overdueInvoices?.totalAmount || 0)}</p>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-2xl" onClick={() => navigate('/merchant/alerts')}>
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-1">
              <Bell className="h-4 w-4 text-warning" />
              <span className="text-xs text-muted-foreground">Alerts</span>
            </div>
            <div className="text-2xl font-bold">{totalAlerts}</div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-3 gap-2">
        <Button variant="outline" className="h-16 flex-col gap-1 rounded-xl text-xs" onClick={() => navigate('/merchant/invoices')}>
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
        <Button variant="outline" className="h-16 flex-col gap-1 rounded-xl text-xs" onClick={() => navigate('/merchant/tenants')}>
          <Users className="h-5 w-5" />
          Penyewa
        </Button>
      </div>

      {/* Critical Alerts */}
      {(overdueCount > 0 || (stats?.alerts?.staleMaintenance || 0) > 0 || (stats?.alerts?.expiringContracts || 0) > 0) && (
        <Card className="rounded-2xl border-destructive/30 bg-destructive/5">
          <CardContent className="p-3 space-y-2">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              <span className="text-sm font-semibold">Peringatan</span>
            </div>
            {overdueCount > 0 && (
              <div className="flex items-center justify-between text-sm" onClick={() => navigate('/merchant/invoices')}>
                <span>{overdueCount} tagihan overdue</span>
                <Badge variant="destructive" className="text-[9px]">KRITIS</Badge>
              </div>
            )}
            {(stats?.alerts?.staleMaintenance || 0) > 0 && (
              <div className="flex items-center justify-between text-sm" onClick={() => navigate('/merchant/maintenance')}>
                <span>{stats?.alerts?.staleMaintenance} maintenance tertunda</span>
                <Badge className="bg-warning/20 text-warning border-warning/30 text-[9px]">PERHATIAN</Badge>
              </div>
            )}
            {(stats?.alerts?.expiringContracts || 0) > 0 && (
              <div className="flex items-center justify-between text-sm" onClick={() => navigate('/merchant/contracts')}>
                <span>{stats?.alerts?.expiringContracts} kontrak segera berakhir</span>
                <Badge className="bg-warning/20 text-warning border-warning/30 text-[9px]">PERHATIAN</Badge>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Upcoming Events */}
      {(stats?.alerts?.upcomingEvents?.length || 0) > 0 && (
        <Card className="rounded-2xl">
          <CardContent className="p-3 space-y-2">
            <div className="flex items-center gap-2 mb-1">
              <Calendar className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold">Acara Mendatang</span>
            </div>
            {stats?.alerts?.upcomingEvents?.slice(0, 3).map((event, i) => (
              <div key={i} className="flex items-center justify-between text-sm" onClick={() => event.link && navigate(event.link)}>
                <div className="flex items-center gap-2">
                  {event.type === 'contract_ending' ? <ScrollText className="h-3.5 w-3.5 text-muted-foreground" /> : <Wrench className="h-3.5 w-3.5 text-muted-foreground" />}
                  <span className="text-xs">{event.description}</span>
                </div>
                <span className="text-[10px] text-muted-foreground">{new Date(event.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</span>
              </div>
            ))}
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
