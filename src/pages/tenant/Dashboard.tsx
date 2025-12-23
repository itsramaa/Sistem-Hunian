import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { TenantLayout } from '@/components/layouts/TenantLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { 
  Wrench, 
  DollarSign, 
  FileText, 
  ShoppingBag,
  MessageSquare,
  Gift,
  ChevronRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { useAnalytics } from '@/hooks/useAnalytics';

// Quick action items for homepage (like Shopee/Tokopedia)
const quickActions = [
  { path: "/tenant/orders", icon: ShoppingBag, label: "Pesanan", color: "bg-orange-500/10 text-orange-600" },
  { path: "/tenant/invoices", icon: FileText, label: "Tagihan", color: "bg-purple-500/10 text-purple-600" },
  { path: "/tenant/contracts", icon: FileText, label: "Kontrak", color: "bg-blue-500/10 text-blue-600" },
  { path: "/tenant/forum", icon: MessageSquare, label: "Forum", color: "bg-green-500/10 text-green-600" },
  { path: "/tenant/referrals", icon: Gift, label: "Referral", color: "bg-pink-500/10 text-pink-600" },
];

export default function TenantDashboard() {
  const { user, profile } = useAuth();
  useAnalytics(); // Track page views automatically

  const { data: contracts = [] } = useQuery({
    queryKey: ['tenant-contracts', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('contracts')
        .select('*')
        .eq('tenant_user_id', user.id);
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const { data: payments = [] } = useQuery({
    queryKey: ['tenant-payments', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('tenant_user_id', user.id)
        .order('due_date', { ascending: false })
        .limit(5);
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const { data: maintenanceRequests = [] } = useQuery({
    queryKey: ['tenant-maintenance', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('maintenance_requests')
        .select('*')
        .eq('tenant_user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const pendingPayments = payments.filter(p => p.status === 'pending');
  const activeMaintenanceRequests = maintenanceRequests.filter(
    r => r.status === 'pending' || r.status === 'in_progress'
  );

  return (
    <TenantLayout 
      title={`Halo, ${profile?.full_name || 'Tenant'}`}
      description="Kelola hunian & kebutuhanmu"
      showBack={false}
    >
      {/* Quick Actions - Horizontal Scroll like Shopee/Tokopedia */}
      <div className="mb-6">
        <ScrollArea className="w-full whitespace-nowrap">
          <div className="flex gap-3 pb-2">
            {quickActions.map((action) => (
              <Link 
                key={action.path} 
                to={action.path}
                className="flex flex-col items-center gap-2 min-w-[72px]"
              >
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${action.color}`}>
                  <action.icon className="h-5 w-5" />
                </div>
                <span className="text-xs font-medium text-muted-foreground">{action.label}</span>
              </Link>
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <Link to="/tenant/maintenance">
          <Card className="hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-primary">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold">{activeMaintenanceRequests.length}</p>
                  <p className="text-xs text-muted-foreground">Laporan Aktif</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Wrench className="h-5 w-5 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link to="/tenant/payments">
          <Card className="hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-destructive">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold">{pendingPayments.length}</p>
                  <p className="text-xs text-muted-foreground">Tagihan Belum Bayar</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center">
                  <DollarSign className="h-5 w-5 text-destructive" />
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Recent Payments */}
      <Card className="mb-4">
        <CardHeader className="flex flex-row items-center justify-between py-3 px-4">
          <CardTitle className="text-base font-semibold">Pembayaran Terbaru</CardTitle>
          <Link to="/tenant/payments" className="text-xs text-primary flex items-center gap-1">
            Lihat Semua <ChevronRight className="h-3 w-3" />
          </Link>
        </CardHeader>
        <CardContent className="px-4 pb-4 pt-0">
          {payments.length === 0 ? (
            <p className="text-muted-foreground text-center py-4 text-sm">Belum ada pembayaran</p>
          ) : (
            <div className="space-y-2">
              {payments.slice(0, 3).map((payment) => (
                <div key={payment.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-background flex items-center justify-center">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium text-sm capitalize">{payment.payment_type}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(payment.due_date), 'dd MMM yyyy')}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-sm">
                      Rp {Number(payment.amount).toLocaleString('id-ID')}
                    </p>
                    <Badge 
                      variant={payment.status === 'paid' ? 'default' : 'secondary'}
                      className="text-[10px] px-1.5 py-0"
                    >
                      {payment.status === 'paid' ? 'Lunas' : 'Pending'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Maintenance Requests */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between py-3 px-4">
          <CardTitle className="text-base font-semibold">Laporan Maintenance</CardTitle>
          <Link to="/tenant/maintenance" className="text-xs text-primary flex items-center gap-1">
            Buat Laporan <ChevronRight className="h-3 w-3" />
          </Link>
        </CardHeader>
        <CardContent className="px-4 pb-4 pt-0">
          {maintenanceRequests.length === 0 ? (
            <p className="text-muted-foreground text-center py-4 text-sm">Belum ada laporan</p>
          ) : (
            <div className="space-y-2">
              {maintenanceRequests.slice(0, 3).map((request) => (
                <Link 
                  key={request.id} 
                  to={`/tenant/maintenance/${request.id}`}
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-xl hover:bg-muted transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-background flex items-center justify-center">
                      <Wrench className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{request.title}</p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {request.category}
                      </p>
                    </div>
                  </div>
                  <Badge variant={
                    request.status === 'completed' ? 'default' :
                    request.status === 'in_progress' ? 'secondary' : 'outline'
                  } className="text-[10px] px-1.5 py-0">
                    {request.status === 'completed' ? 'Selesai' : 
                     request.status === 'in_progress' ? 'Dikerjakan' : 'Pending'}
                  </Badge>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </TenantLayout>
  );
}
