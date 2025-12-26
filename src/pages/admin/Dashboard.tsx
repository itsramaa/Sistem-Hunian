import { useState, useEffect } from 'react';
import { 
  Users, 
  Building2, 
  Wallet, 
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Loader2,
  RefreshCw,
  Calendar
} from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AdminLayout } from '@/components/layouts/AdminLayout';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useAdminGuard } from '@/hooks/useAdminGuard';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';

export default function AdminDashboard() {
  const { isLoading: guardLoading, isAdmin } = useAdminGuard();
  const queryClient = useQueryClient();
  useAnalytics();
  
  const [dateRange, setDateRange] = useState<'today' | '7d' | '30d' | 'all'>('7d');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Real-time subscription for updates
  useEffect(() => {
    if (!isAdmin) return;

    const channel = supabase
      .channel('admin-dashboard-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'payments' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['admin-dashboard-stats'] });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'merchants' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['admin-dashboard-stats'] });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'vendor_verifications' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['admin-pending-verifications'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isAdmin, queryClient]);

  const getDateFilter = () => {
    const now = new Date();
    switch (dateRange) {
      case 'today':
        return { from: startOfDay(now), to: endOfDay(now) };
      case '7d':
        return { from: startOfDay(subDays(now, 7)), to: endOfDay(now) };
      case '30d':
        return { from: startOfDay(subDays(now, 30)), to: endOfDay(now) };
      default:
        return null;
    }
  };

  const { data: statsData, isLoading, error } = useQuery({
    queryKey: ['admin-dashboard-stats', dateRange],
    queryFn: async () => {
      const dateFilter = getDateFilter();
      
      let paymentsQuery = supabase.from('payments').select('amount').eq('status', 'paid');
      if (dateFilter) {
        paymentsQuery = paymentsQuery
          .gte('created_at', dateFilter.from.toISOString())
          .lte('created_at', dateFilter.to.toISOString());
      }

      const [merchantsRes, paymentsRes, escrowRes, verificationsRes] = await Promise.all([
        supabase.from('merchants').select('id', { count: 'exact' }),
        paymentsQuery,
        supabase.from('escrow_accounts').select('balance'),
        supabase.from('vendor_verifications').select('id', { count: 'exact' }).eq('status', 'pending'),
      ]);
      
      if (merchantsRes.error) throw new Error(`Merchants query failed: ${merchantsRes.error.message}`);
      if (paymentsRes.error) throw new Error(`Payments query failed: ${paymentsRes.error.message}`);
      if (escrowRes.error) throw new Error(`Escrow query failed: ${escrowRes.error.message}`);
      if (verificationsRes.error) throw new Error(`Verifications query failed: ${verificationsRes.error.message}`);

      const totalGMV = paymentsRes.data?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;
      const totalEscrow = escrowRes.data?.reduce((sum, e) => sum + Number(e.balance), 0) || 0;
      
      return {
        totalMerchants: merchantsRes.count || 0,
        totalGMV,
        totalEscrow,
        pendingVerifications: verificationsRes.count || 0,
      };
    },
    enabled: isAdmin,
  });

  const { data: pendingVerifications = [] } = useQuery({
    queryKey: ['admin-pending-verifications'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vendor_verifications')
        .select('id, document_type, created_at, vendor_id, vendors(business_name)')
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(4);
      if (error) throw new Error(`Failed to load verifications: ${error.message}`);
      return data || [];
    },
    enabled: isAdmin,
  });

  const { data: recentActivity = [] } = useQuery({
    queryKey: ['admin-recent-activity'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('analytics_events')
        .select('id, event_type, event_data, created_at')
        .order('created_at', { ascending: false })
        .limit(4);
      if (error) throw new Error(`Failed to load activity: ${error.message}`);
      return data || [];
    },
    enabled: isAdmin,
  });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard-stats'] }),
      queryClient.invalidateQueries({ queryKey: ['admin-pending-verifications'] }),
      queryClient.invalidateQueries({ queryKey: ['admin-recent-activity'] }),
    ]);
    setIsRefreshing(false);
  };

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000000) return `Rp ${(amount / 1000000000).toFixed(1)}B`;
    if (amount >= 1000000) return `Rp ${(amount / 1000000).toFixed(0)}M`;
    return `Rp ${amount.toLocaleString('id-ID')}`;
  };

  if (guardLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AdminLayout>
    );
  }

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
      description: dateRange === 'today' ? 'Today' : dateRange === '7d' ? 'Last 7 days' : dateRange === '30d' ? 'Last 30 days' : 'All time',
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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-display font-bold">Dashboard</h1>
            <p className="text-muted-foreground">Welcome back! Here's what's happening today.</p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={dateRange} onValueChange={(v: typeof dateRange) => setDateRange(v)}>
              <SelectTrigger className="w-[140px]">
                <Calendar className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="all">All time</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" onClick={handleRefresh} disabled={isRefreshing}>
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>

        {error && (
          <Card className="border-destructive bg-destructive/10">
            <CardContent className="py-4">
              <p className="text-sm text-destructive">{(error as Error).message}</p>
            </CardContent>
          </Card>
        )}

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
                        {format(new Date(item.created_at), 'HH:mm')}
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
