import { 
  Users, 
  Building2, 
  Wallet, 
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AdminLayout } from '@/components/layouts/AdminLayout';
import { useAnalytics } from '@/hooks/useAnalytics';

export default function AdminDashboard() {
  useAnalytics();

  const { data: statsData, isLoading } = useQuery({
    queryKey: ['admin-dashboard-stats'],
    queryFn: async () => {
      const [merchantsRes, paymentsRes, escrowRes, verificationsRes] = await Promise.all([
        supabase.from('merchants').select('id', { count: 'exact' }),
        supabase.from('payments').select('amount').eq('status', 'paid'),
        supabase.from('escrow_accounts').select('balance'),
        supabase.from('vendor_verifications').select('id', { count: 'exact' }).eq('status', 'pending'),
      ]);
      
      const totalGMV = paymentsRes.data?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;
      const totalEscrow = escrowRes.data?.reduce((sum, e) => sum + Number(e.balance), 0) || 0;
      
      return {
        totalMerchants: merchantsRes.count || 0,
        totalGMV,
        totalEscrow,
        pendingVerifications: verificationsRes.count || 0,
      };
    },
  });

  const { data: pendingVerifications = [] } = useQuery({
    queryKey: ['admin-pending-verifications'],
    queryFn: async () => {
      const { data } = await supabase
        .from('vendor_verifications')
        .select('id, document_type, created_at, vendor_id, vendors(business_name)')
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(4);
      return data || [];
    },
  });

  const { data: recentActivity = [] } = useQuery({
    queryKey: ['admin-recent-activity'],
    queryFn: async () => {
      const { data } = await supabase
        .from('analytics_events')
        .select('id, event_type, event_data, created_at')
        .order('created_at', { ascending: false })
        .limit(4);
      return data || [];
    },
  });

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000000) return `Rp ${(amount / 1000000000).toFixed(1)}B`;
    if (amount >= 1000000) return `Rp ${(amount / 1000000).toFixed(0)}M`;
    return `Rp ${amount.toLocaleString('id-ID')}`;
  };

  const stats = [
    {
      title: 'Active Merchants',
      value: isLoading ? '...' : statsData?.totalMerchants.toString() || '0',
      change: '+12%',
      changeType: 'positive' as const,
      icon: Building2,
      description: 'From last month',
    },
    {
      title: 'Total GMV',
      value: isLoading ? '...' : formatCurrency(statsData?.totalGMV || 0),
      change: '+8.2%',
      changeType: 'positive' as const,
      icon: TrendingUp,
      description: 'Monthly transaction volume',
    },
    {
      title: 'Escrow Balance',
      value: isLoading ? '...' : formatCurrency(statsData?.totalEscrow || 0),
      change: '-2.1%',
      changeType: 'negative' as const,
      icon: Wallet,
      description: 'Total held funds',
    },
    {
      title: 'Pending Verifications',
      value: isLoading ? '...' : statsData?.pendingVerifications.toString() || '0',
      change: '+5',
      changeType: 'neutral' as const,
      icon: Clock,
      description: 'Awaiting review',
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-display font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back! Here's what's happening today.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <Card key={stat.title} className="hover:shadow-card-hover transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.title}</p>
                    <p className="text-2xl font-bold mt-1">{stat.value}</p>
                  </div>
                  <div className="p-2 rounded-lg bg-primary/10">
                    <stat.icon className="h-5 w-5 text-primary" />
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-3">
                  {stat.changeType === 'positive' && (
                    <span className="flex items-center text-sm text-success">
                      <ArrowUpRight className="h-4 w-4" />
                      {stat.change}
                    </span>
                  )}
                  {stat.changeType === 'negative' && (
                    <span className="flex items-center text-sm text-destructive">
                      <ArrowDownRight className="h-4 w-4" />
                      {stat.change}
                    </span>
                  )}
                  {stat.changeType === 'neutral' && (
                    <span className="text-sm text-muted-foreground">{stat.change}</span>
                  )}
                  <span className="text-xs text-muted-foreground">{stat.description}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Pending Verifications</CardTitle>
                <CardDescription>Review and approve vendor applications</CardDescription>
              </div>
              <Button variant="outline" size="sm">View All</Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pendingVerifications.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">No pending verifications</p>
                ) : (
                  pendingVerifications.map((item: any) => (
                    <div key={item.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <Building2 className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{item.vendors?.business_name || 'Unknown'}</p>
                          <Badge variant="secondary" className="text-xs">{item.document_type}</Badge>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" className="h-7 text-xs">Review</Button>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest platform events</CardDescription>
              </div>
              <Button variant="outline" size="sm">View All</Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">No recent activity</p>
                ) : (
                  recentActivity.map((item: any) => (
                    <div key={item.id} className="flex items-start gap-3">
                      <div className="mt-0.5 p-1.5 rounded-full bg-info/10">
                        <TrendingUp className="h-4 w-4 text-info" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{item.event_type}</p>
                        <p className="text-sm text-muted-foreground truncate">{item.event_data?.page || 'Platform event'}</p>
                      </div>
                      <p className="text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(item.created_at).toLocaleTimeString()}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
