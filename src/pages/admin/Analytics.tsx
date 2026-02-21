import { RealTimeAnalytics } from "@/features/analytics/components/RealTimeAnalytics";
import { AdminMerchantDistribution } from "@/features/analytics/components/admin/AdminMerchantDistribution";
import { AdminPaymentBehaviorChart } from "@/features/analytics/components/admin/AdminPaymentBehaviorChart";
import { AdminPlatformStats } from "@/features/analytics/components/admin/AdminPlatformStats";
import { AdminRevenueTrend } from "@/features/analytics/components/admin/AdminRevenueTrend";
import { AdminTenantAnalyticsStats } from "@/features/analytics/components/admin/AdminTenantAnalyticsStats";
import { AdminTenantGrowthChart } from "@/features/analytics/components/admin/AdminTenantGrowthChart";
import { useAdminAnalytics } from "@/features/analytics/hooks/useAdminAnalytics";
import { useAdminGuard } from "@/features/auth/hooks/useAdminGuard";
import { AdminLayout } from "@/shared/components/layouts/AdminLayout";
import { Alert, AlertDescription, AlertTitle } from "@/shared/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/shared/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis } from "recharts";
import { Button } from "@/shared/components/ui/button";
import { DateRangePicker } from "@/shared/components/ui/date-range-picker";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
import { logExport } from "@/shared/utils/auditLog";
import { exportToCSV, exportToPDF } from "@/shared/utils/exportUtils";
import { endOfMonth, format, startOfMonth, subMonths } from "date-fns";
import { Activity, AlertCircle, CreditCard, DollarSign, Download, FileText, Loader2, TrendingDown, TrendingUp, UserCheck } from "lucide-react";
import { useState } from "react";
import { DateRange } from "react-day-picker";

const AdminAnalytics = () => {
  const { isAdmin, isLoading: guardLoading } = useAdminGuard();
  const [activeTab, setActiveTab] = useState("realtime");
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  
  const { 
    dashboardStats,
    dashboardStatsLoading,
    dashboardStatsError,
    distributionStats,
    distributionStatsLoading,
    distributionStatsError,
    monthlyRevenueData,
    tenantAnalytics,
    subscriptionAnalytics,
    tenantLoading,
    subscriptionLoading,
  } = useAdminAnalytics(dateRange ? { from: dateRange.from, to: dateRange.to } : undefined, isAdmin);

  const isLoading = dashboardStatsLoading || distributionStatsLoading || monthlyRevenueData.length === 0;

  if (guardLoading || isLoading) {
    return (
      <AdminLayout>
        <div className="flex flex-col items-center justify-center h-64 gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading analytics data...</p>
        </div>
      </AdminLayout>
    );
  }

  if ((dashboardStatsError || distributionStatsError) && !dashboardStats) {
    return (
      <AdminLayout>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error Loading Analytics</AlertTitle>
          <AlertDescription>
            Failed to load analytics data. Please try again.
          </AlertDescription>
        </Alert>
      </AdminLayout>
    );
  }

  const totalRevenue = dashboardStats?.totalRevenue || 0;
  const totalProperties = dashboardStats?.totalProperties || 0;
  const totalUnits = dashboardStats?.totalUnits || 0;
  const occupancyRate = dashboardStats?.occupancyRate || 0;

  // Active tenants count
  const activeTenants = dashboardStats?.activeTenants || 0;

  // Calculate total merchants from distribution stats
  const totalMerchants = (distributionStats?.merchantStatus?.verified || 0) + 
                         (distributionStats?.merchantStatus?.pending || 0) + 
                         (distributionStats?.merchantStatus?.rejected || 0);

  // Monthly data for charts
  const getMonthlyData = () => {
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const date = subMonths(new Date(), i);
      const monthStart = startOfMonth(date);
      const monthEnd = endOfMonth(date);
      
      const newTenants = tenantAnalytics?.contracts?.filter(c => {
        const createdAt = new Date(c.created_at);
        return createdAt >= monthStart && createdAt <= monthEnd;
      }).length || 0;

      const churnedTenants = tenantAnalytics?.contracts?.filter(c => {
        if (c.status !== 'terminated' && c.status !== 'expired') return false;
        const endDate = new Date(c.end_date);
        return endDate >= monthStart && endDate <= monthEnd;
      }).length || 0;

      months.push({
        month: format(date, 'MMM'),
        newTenants,
        churnedTenants,
      });
    }
    return months;
  };

  const monthlyTenantData = getMonthlyData();

  const chartConfig = {
    count: { label: "Count", color: "hsl(var(--destructive))" },
  };

  const churnReasons = () => {
    const reasons: Record<string, number> = {};
    tenantAnalytics?.contracts
      ?.filter(c => c.status === 'terminated' || c.status === 'expired')
      .forEach(c => {
        const reason = (c as { churn_reason?: string }).churn_reason || 'Unknown';
        reasons[reason] = (reasons[reason] || 0) + 1;
      });
    return Object.entries(reasons).map(([name, count]) => ({ name, count }));
  };

  // Payment behavior analytics
  const paymentBehavior = () => {
    const payments = tenantAnalytics?.payments || [];
    const onTime = payments.filter(p => {
      if (p.status !== 'paid' || !p.paid_at) return false;
      return new Date(p.paid_at) <= new Date(p.due_date);
    }).length;
    const late = payments.filter(p => {
      if (p.status !== 'paid' || !p.paid_at) return false;
      return new Date(p.paid_at) > new Date(p.due_date);
    }).length;
    const pending = payments.filter(p => p.status === 'pending').length;

    return [
      { name: 'On Time', value: onTime, fill: 'hsl(var(--success))' },
      { name: 'Late', value: late, fill: 'hsl(var(--warning))' },
      { name: 'Pending', value: pending, fill: 'hsl(var(--muted))' },
    ];
  };

  // Merchant status distribution
  const merchantStatus = [
    { name: 'Verified', value: distributionStats?.merchantStatus?.verified || 0, fill: 'hsl(var(--success))' },
    { name: 'Pending', value: distributionStats?.merchantStatus?.pending || 0, fill: 'hsl(var(--warning))' },
    { name: 'Rejected', value: distributionStats?.merchantStatus?.rejected || 0, fill: 'hsl(var(--destructive))' },
  ];

  // Maintenance request status
  const maintenanceData = [
    { name: 'Pending', count: distributionStats?.maintenanceStatus?.pending || 0 },
    { name: 'In Progress', count: distributionStats?.maintenanceStatus?.in_progress || 0 },
    { name: 'Completed', count: distributionStats?.maintenanceStatus?.completed || 0 },
  ];

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000000) return `Rp ${(amount / 1000000000).toFixed(1)}B`;
    if (amount >= 1000000) return `Rp ${(amount / 1000000).toFixed(0)}M`;
    return `Rp ${amount.toLocaleString('id-ID')}`;
  };

  const handleExportCSV = async () => {
    const data = [
      { metric: 'Total Revenue', value: formatCurrency(totalRevenue) },
      { metric: 'Total Merchants', value: totalMerchants },
      { metric: 'Total Properties', value: totalProperties },
      { metric: 'Total Units', value: totalUnits },
      { metric: 'Active Tenants', value: activeTenants },
      { metric: 'Occupancy Rate', value: `${occupancyRate}%` },
    ];
    exportToCSV(data, 'platform-analytics');
    await logExport('analytics', 'csv', data.length, { dateRange });
  };

  const handleExportPDF = async () => {
    const data = [
      { metric: 'Total Revenue', value: formatCurrency(totalRevenue) },
      { metric: 'Total Merchants', value: totalMerchants },
      { metric: 'Active Tenants', value: activeTenants },
      { metric: 'Occupancy Rate', value: `${occupancyRate}%` },
    ];
    exportToPDF(data, 'Platform Analytics Report', 'platform-analytics');
    await logExport('analytics', 'pdf', data.length, { dateRange });
  };

  return (
    <AdminLayout
      title="Platform Analytics"
      description="Overview of platform performance and metrics"
      actions={
        <div className="flex gap-2 flex-wrap">
          <DateRangePicker
            value={dateRange}
            onChange={setDateRange}
          />
          <Button variant="outline" onClick={handleExportCSV}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button variant="outline" onClick={handleExportPDF}>
            <FileText className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full max-w-2xl grid-cols-2 h-auto md:grid-cols-4 gap-2">
            <TabsTrigger value="realtime" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Real-Time
            </TabsTrigger>
            <TabsTrigger value="platform" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Platform
            </TabsTrigger>
            <TabsTrigger value="tenants" className="flex items-center gap-2">
              <UserCheck className="h-4 w-4" />
              Tenants
            </TabsTrigger>
            <TabsTrigger value="subscriptions" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              MRR/Churn
            </TabsTrigger>
          </TabsList>

          <TabsContent value="realtime" className="mt-6">
            <RealTimeAnalytics />
          </TabsContent>

          <TabsContent value="platform" className="mt-6 space-y-6">
            {/* Summary Stats */}
            <AdminPlatformStats
              totalRevenue={totalRevenue}
              totalMerchants={totalMerchants}
              totalProperties={totalProperties}
              occupancyRate={occupancyRate}
            />

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <AdminRevenueTrend data={monthlyRevenueData} />
              <AdminMerchantDistribution data={merchantStatus} />
            </div>
          </TabsContent>

          <TabsContent value="tenants" className="mt-6 space-y-6">
            <AdminTenantAnalyticsStats
              activeTenants={activeTenants}
              newTenantsThisMonth={monthlyTenantData[5]?.newTenants || 0}
              churnedTenantsThisMonth={monthlyTenantData[5]?.churnedTenants || 0}
              pendingMaintenance={maintenanceData[0]?.count || 0}
              isLoading={tenantLoading}
            />

            {/* Tenant Charts */}
            {!tenantLoading && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <AdminTenantGrowthChart data={monthlyTenantData} />
                <AdminPaymentBehaviorChart data={paymentBehavior()} />
              </div>
            )}
          </TabsContent>

          <TabsContent value="subscriptions" className="mt-6 space-y-6">
            {subscriptionLoading ? (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {[...Array(4)].map((_, i) => (
                    <Skeleton key={i} className="h-[120px] rounded-xl" />
                  ))}
                </div>
                <div className="grid grid-cols-1 gap-6">
                  <Skeleton className="h-[400px] rounded-xl" />
                </div>
              </div>
            ) : (
              <>
                {/* Subscription Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4">
                        <div className="p-3 rounded-lg bg-primary/10">
                          <CreditCard className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Active Subscriptions</p>
                          <p className="text-2xl font-bold">
                            {subscriptionAnalytics?.subscriptions?.filter(s => s.status === 'active').length || 0}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4">
                        <div className="p-3 rounded-lg bg-success/10">
                          <DollarSign className="h-6 w-6 text-success" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Est. MRR</p>
                          <p className="text-2xl font-bold">
                            {formatCurrency(
                              subscriptionAnalytics?.subscriptions
                                ?.filter(s => s.status === 'active')
                                .reduce((sum, s) => sum + (s.subscription_tiers?.price_monthly || 0), 0) || 0
                            )}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4">
                        <div className="p-3 rounded-lg bg-warning/10">
                          <Activity className="h-6 w-6 text-warning" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Trialing</p>
                          <p className="text-2xl font-bold">
                            {subscriptionAnalytics?.subscriptions?.filter(s => s.status === 'trialing').length || 0}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4">
                        <div className="p-3 rounded-lg bg-destructive/10">
                          <TrendingDown className="h-6 w-6 text-destructive" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Canceled</p>
                          <p className="text-2xl font-bold">
                            {subscriptionAnalytics?.subscriptions?.filter(s => s.status === 'canceled').length || 0}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Churn Reasons */}
                {churnReasons().length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Churn Reasons</CardTitle>
                      <CardDescription>Why tenants are leaving</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ChartContainer config={chartConfig} className="h-[300px]">
                        <BarChart data={churnReasons()} layout="vertical">
                          <XAxis type="number" />
                          <YAxis dataKey="name" type="category" width={150} />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <Bar dataKey="count" fill="hsl(var(--destructive))" />
                        </BarChart>
                      </ChartContainer>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default AdminAnalytics;