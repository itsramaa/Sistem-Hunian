import { useAnalytics } from '@/features/analytics/hooks/useAnalytics';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { SubscriptionWidget } from '@/features/subscriptions/components/SubscriptionWidget';
import { TrialCountdownWidget } from '@/features/subscriptions/components/TrialCountdownWidget';
import { supabase } from '@/lib/integrations/supabase/client';
import { MerchantLayout } from '@/shared/components/layouts/MerchantLayout';
import { Alert, AlertDescription } from '@/shared/components/ui/alert';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Progress } from '@/shared/components/ui/progress';
import { MerchantDashboardSkeleton } from '@/shared/components/ui/skeletons';
import { formatCurrency } from '@/shared/utils/currency';
import { formatDisplayDate, getCurrentMonthDateRange, getLastNDaysRange, getNextNDaysRange, getPreviousMonthDateRange } from '@/shared/utils/dateUtils';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertCircle,
  ArrowDownRight,
  ArrowUpRight,
  Bell,
  Calendar,
  Home,
  Minus,
  RefreshCw,
  TrendingDown,
  TrendingUp,
  Users,
  Wallet
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function MerchantDashboard() {
  const { merchant } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  useAnalytics();

  // Get date ranges
  const currentMonth = getCurrentMonthDateRange();
  const lastMonth = getPreviousMonthDateRange();
  const next7Days = getNextNDaysRange(7);
  const last7Days = getLastNDaysRange(7);

  // Refresh handler
  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['merchant-dashboard', merchant?.id] });
  };

  // Fetch real dashboard stats
  const { data: dashboardData, isLoading, error, isRefetching } = useQuery({
    queryKey: ['merchant-dashboard', merchant?.id],
    queryFn: async () => {
      if (!merchant?.id) return null;

      // Fetch properties with units
      const { data: properties } = await supabase
        .from('properties')
        .select(`
          id,
          name,
          total_units,
          occupied_units
        `)
        .eq('merchant_id', merchant.id);

      // Fetch escrow balance - use maybeSingle() as account may not exist
      const { data: escrowAccount } = await supabase
        .from('escrow_accounts')
        .select('balance, pending_balance')
        .eq('merchant_id', merchant.id)
        .maybeSingle();

      // Fetch active contracts count (active tenants)
      const { count: activeTenants } = await supabase
        .from('contracts')
        .select('id', { count: 'exact', head: true })
        .eq('merchant_id', merchant.id)
        .eq('status', 'active');

      // Fetch this month's payments - use pre-calculated date ranges
      const { data: monthlyPayments } = await supabase
        .from('payments')
        .select('amount, status')
        .eq('merchant_id', merchant.id)
        .gte('created_at', currentMonth.start.toISOString());

      // Fetch last month's payments for comparison
      const { data: lastMonthPayments } = await supabase
        .from('payments')
        .select('amount, status')
        .eq('merchant_id', merchant.id)
        .gte('created_at', lastMonth.start.toISOString())
        .lte('created_at', lastMonth.end.toISOString());

      // Fetch last month's active tenants count
      const { count: lastMonthTenantCount } = await supabase
        .from('contracts')
        .select('id', { count: 'exact', head: true })
        .eq('merchant_id', merchant.id)
        .eq('status', 'active')
        .lte('created_at', lastMonth.end.toISOString());

      // Fetch upcoming payments (next 7 days)
      const { data: upcomingPayments } = await supabase
        .from('payments')
        .select(`
          id,
          amount,
          due_date,
          status,
          tenant_user_id,
          contract:contracts (
            unit:units (
              unit_number
            )
          )
        `)
        .eq('merchant_id', merchant.id)
        .eq('status', 'pending')
        .gte('due_date', next7Days.start.toISOString().split('T')[0])
        .lte('due_date', next7Days.end.toISOString().split('T')[0])
        .order('due_date', { ascending: true })
        .limit(5);

      // Fetch tenant profiles for upcoming payments
      const tenantIds = upcomingPayments?.map(p => p.tenant_user_id) || [];
      const { data: tenantProfiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, email')
        .in('user_id', tenantIds);

      // Fetch recent payments (last 7 days, paid)
      const { data: recentPayments } = await supabase
        .from('payments')
        .select(`
          id,
          amount,
          paid_at,
          status,
          tenant_user_id,
          contract:contracts (
            unit:units (
              unit_number
            )
          )
        `)
        .eq('merchant_id', merchant.id)
        .eq('status', 'paid')
        .gte('paid_at', last7Days.start.toISOString())
        .order('paid_at', { ascending: false })
        .limit(5);

      // Fetch tenant profiles for recent payments
      const recentTenantIds = recentPayments?.map(p => p.tenant_user_id) || [];
      const { data: recentTenantProfiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, email')
        .in('user_id', recentTenantIds);

      // Calculate stats
      const totalUnits = properties?.reduce((sum, p) => sum + (p.total_units || 0), 0) || 0;
      const occupiedUnits = properties?.reduce((sum, p) => sum + (p.occupied_units || 0), 0) || 0;
      const occupancyRate = totalUnits > 0 ? Math.round((occupiedUnits / totalUnits) * 100) : 0;

      const paidPayments = monthlyPayments?.filter(p => p.status === 'paid') || [];
      const monthlyRevenue = paidPayments.reduce((sum, p) => sum + Number(p.amount), 0);

      // Calculate last month stats for comparison
      const lastMonthPaidPayments = lastMonthPayments?.filter(p => p.status === 'paid') || [];
      const lastMonthRevenue = lastMonthPaidPayments.reduce((sum, p) => sum + Number(p.amount), 0);

      // Calculate percentage changes
      const revenueChange = lastMonthRevenue > 0 
        ? Math.round(((monthlyRevenue - lastMonthRevenue) / lastMonthRevenue) * 100) 
        : monthlyRevenue > 0 ? 100 : 0;

      const tenantChange = (lastMonthTenantCount || 0) > 0
        ? (activeTenants || 0) - (lastMonthTenantCount || 0)
        : 0;

      // Map tenant names
      const profileMap = new Map(tenantProfiles?.map(p => [p.user_id, p]) || []);
      const recentProfileMap = new Map(recentTenantProfiles?.map(p => [p.user_id, p]) || []);

      const upcomingWithNames = upcomingPayments?.map(p => ({
        ...p,
        tenantName: profileMap.get(p.tenant_user_id)?.full_name || profileMap.get(p.tenant_user_id)?.email || 'Unknown',
        unitNumber: p.contract?.unit?.unit_number || 'N/A',
      })) || [];

      const recentWithNames = recentPayments?.map(p => ({
        ...p,
        tenantName: recentProfileMap.get(p.tenant_user_id)?.full_name || recentProfileMap.get(p.tenant_user_id)?.email || 'Unknown',
        unitNumber: p.contract?.unit?.unit_number || 'N/A',
      })) || [];

      return {
        occupancyRate,
        totalUnits,
        occupiedUnits,
        monthlyRevenue,
        lastMonthRevenue,
        revenueChange,
        tenantChange,
        escrowBalance: escrowAccount?.balance || 0,
        pendingBalance: escrowAccount?.pending_balance || 0,
        activeTenants: activeTenants || 0,
        lastMonthTenants: lastMonthTenantCount || 0,
        propertyCount: properties?.length || 0,
        properties: properties || [],
        upcomingPayments: upcomingWithNames,
        recentPayments: recentWithNames,
      };
    },
    enabled: !!merchant?.id,
  });

  const revenueChange = dashboardData?.revenueChange || 0;
  const tenantChange = dashboardData?.tenantChange || 0;

  const stats = [
    {
      title: 'Occupancy Rate',
      value: isLoading ? '-' : `${dashboardData?.occupancyRate || 0}%`,
      change: '',
      changeType: 'neutral' as const,
      icon: Home,
      description: isLoading ? 'Loading...' : `${dashboardData?.occupiedUnits || 0} of ${dashboardData?.totalUnits || 0} units occupied`,
    },
    {
      title: 'Monthly Revenue',
      value: isLoading ? '-' : formatCurrency(dashboardData?.monthlyRevenue || 0),
      change: revenueChange !== 0 ? `${revenueChange > 0 ? '+' : ''}${revenueChange}%` : '',
      changeType: revenueChange > 0 ? 'positive' as const : revenueChange < 0 ? 'negative' as const : 'neutral' as const,
      icon: revenueChange >= 0 ? TrendingUp : TrendingDown,
      description: 'vs last month',
    },
    {
      title: 'Escrow Balance',
      value: isLoading ? '-' : formatCurrency(dashboardData?.escrowBalance || 0),
      change: dashboardData?.pendingBalance ? `${formatCurrency(dashboardData.pendingBalance)} pending` : '',
      changeType: 'neutral' as const,
      icon: Wallet,
      description: 'Available for disbursement',
    },
    {
      title: 'Active Tenants',
      value: isLoading ? '-' : String(dashboardData?.activeTenants || 0),
      change: tenantChange !== 0 ? `${tenantChange > 0 ? '+' : ''}${tenantChange}` : '',
      changeType: tenantChange > 0 ? 'positive' as const : tenantChange < 0 ? 'negative' as const : 'neutral' as const,
      icon: Users,
      description: tenantChange !== 0 ? 'vs last month' : `Across ${dashboardData?.propertyCount || 0} properties`,
    },
  ];

  // Error state
  if (error) {
    return (
      <MerchantLayout description="Welcome back! Here's an overview of your properties.">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load dashboard data. Please try again.
            <Button variant="link" onClick={handleRefresh} className="p-0 h-auto ml-2">
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      </MerchantLayout>
    );
  }

  if (isLoading) {
    return (
      <MerchantLayout description="Welcome back! Here's an overview of your properties.">
        <MerchantDashboardSkeleton />
      </MerchantLayout>
    );
  }

  return (
    <MerchantLayout description="Welcome back! Here's an overview of your properties.">
      <div className="space-y-6">
        {/* Refresh Button */}
        <div className="flex justify-end">
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefetching}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefetching ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Trial Countdown Widget */}
        <TrialCountdownWidget />

        {/* Verification Banner */}
        {merchant?.verification_status === 'pending' && (
          <Card className="border-warning/50 bg-warning/5">
            <CardContent className="flex items-center justify-between py-4">
              <div className="flex items-center gap-3">
                <Bell className="h-5 w-5 text-warning" />
                <div>
                  <p className="font-medium">Complete your verification</p>
                  <p className="text-sm text-muted-foreground">Upload required documents to start receiving payments</p>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={() => navigate('/merchant/profile')}>
                Complete Now
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Stats Grid */}
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
                  {stat.change && stat.changeType === 'positive' && (
                    <span className="flex items-center text-sm text-success font-medium">
                      <ArrowUpRight className="h-4 w-4" />
                      {stat.change}
                    </span>
                  )}
                  {stat.change && stat.changeType === 'negative' && (
                    <span className="flex items-center text-sm text-destructive font-medium">
                      <ArrowDownRight className="h-4 w-4" />
                      {stat.change}
                    </span>
                  )}
                  {stat.change && stat.changeType === 'neutral' && (
                    <span className="flex items-center text-sm text-muted-foreground font-medium">
                      <Minus className="h-4 w-4" />
                      {stat.change}
                    </span>
                  )}
                  <span className="text-xs text-muted-foreground">{stat.description}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Occupancy Progress */}
        <Card>
          <CardHeader>
            <CardTitle>Property Occupancy</CardTitle>
            <CardDescription>Current occupancy across all your properties</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {dashboardData?.properties.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No properties yet</p>
            ) : (
              dashboardData?.properties.map((property) => {
                const rate = property.total_units > 0 
                  ? Math.round((property.occupied_units || 0) / property.total_units * 100) 
                  : 0;
                return (
                  <div key={property.id}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">{property.name}</span>
                      <span className="text-sm text-muted-foreground">
                        {property.occupied_units || 0}/{property.total_units || 0} units
                      </span>
                    </div>
                    <Progress value={rate} className="h-2" />
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Subscription Widget */}
          <div className="lg:col-span-1">
            <SubscriptionWidget />
          </div>

          {/* Upcoming & Recent Payments */}
          <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Upcoming Payments */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Upcoming Payments</CardTitle>
                  <CardDescription>Expected payments this week</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={() => navigate('/merchant/payments')}>
                  View All
                </Button>
              </CardHeader>
              <CardContent>
                {dashboardData?.upcomingPayments.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">No upcoming payments</p>
                ) : (
                  <div className="space-y-4">
                    {dashboardData?.upcomingPayments.map((payment) => (
                      <div key={payment.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                        <div>
                          <p className="font-medium text-sm">{payment.tenantName}</p>
                          <p className="text-xs text-muted-foreground">Unit {payment.unitNumber}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-sm">{formatCurrency(Number(payment.amount))}</p>
                          <div className="flex items-center gap-1 mt-0.5">
                            <Calendar className="h-3 w-3 text-muted-foreground" />
                            <p className="text-xs text-muted-foreground">
                              {formatDisplayDate(payment.due_date, 'dd MMM yyyy')}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Payments */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Recent Payments</CardTitle>
                  <CardDescription>Latest received payments</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={() => navigate('/merchant/payments')}>
                  View All
                </Button>
              </CardHeader>
              <CardContent>
                {dashboardData?.recentPayments.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">No recent payments</p>
                ) : (
                  <div className="space-y-4">
                    {dashboardData?.recentPayments.map((payment) => (
                      <div key={payment.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                        <div>
                          <p className="font-medium text-sm">{payment.tenantName}</p>
                          <p className="text-xs text-muted-foreground">Unit {payment.unitNumber}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-sm text-success">{formatCurrency(Number(payment.amount))}</p>
                          <p className="text-xs text-muted-foreground">Paid</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MerchantLayout>
  );
}
