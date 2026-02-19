import { RealTimeAnalytics } from "@/features/analytics/components/RealTimeAnalytics";
import { useAdminAnalytics } from "@/features/analytics/hooks/useAdminAnalytics";
import { useAdminGuard } from "@/features/auth/hooks/useAdminGuard";
import { AdminLayout } from "@/shared/components/layouts/AdminLayout";
import { Alert, AlertDescription, AlertTitle } from "@/shared/components/ui/alert";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/shared/components/ui/chart";
import { DateRangePicker } from "@/shared/components/ui/date-range-picker";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
import { logExport } from "@/shared/utils/auditLog";
import { exportToCSV, exportToPDF } from "@/shared/utils/exportUtils";
import { endOfMonth, format, startOfMonth, subMonths } from "date-fns";
import { Activity, AlertCircle, Building2, CreditCard, DollarSign, Download, FileText, Home, Loader2, TrendingDown, TrendingUp, UserCheck, Users, Wrench } from "lucide-react";
import { useState } from "react";
import { DateRange } from "react-day-picker";
import { Area, AreaChart, Bar, BarChart, Cell, Pie, PieChart, XAxis, YAxis } from "recharts";

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
  const occupiedUnits = dashboardStats?.occupiedUnits || 0;
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

  // Churn analytics
  const churnReasons = () => {
    if (!distributionStats?.churnReasons) return [];
    return Object.entries(distributionStats.churnReasons).map(([name, count]) => ({ name, count }));
  };

  // Merchant status distribution
  const merchantStatus = [
    { name: 'Verified', value: distributionStats?.merchantStatus?.verified || 0, fill: 'hsl(var(--success))' },
    { name: 'Pending', value: distributionStats?.merchantStatus?.pending || 0, fill: 'hsl(var(--warning))' },
    { name: 'Rejected', value: distributionStats?.merchantStatus?.rejected || 0, fill: 'hsl(var(--destructive))' },
  ];

  // Unit status distribution
  const unitStatus = [
    { name: 'Occupied', value: occupiedUnits, fill: 'hsl(var(--success))' },
    { name: 'Available', value: distributionStats?.unitStatus?.available || 0, fill: 'hsl(var(--primary))' },
    { name: 'Maintenance', value: distributionStats?.unitStatus?.maintenance || 0, fill: 'hsl(var(--warning))' },
  ];

  // Maintenance request status
  const maintenanceData = [
    { name: 'Pending', count: distributionStats?.maintenanceStatus?.pending || 0 },
    { name: 'In Progress', count: distributionStats?.maintenanceStatus?.in_progress || 0 },
    { name: 'Completed', count: distributionStats?.maintenanceStatus?.completed || 0 },
  ];

  const chartConfig = {
    revenue: { label: "Revenue", color: "hsl(var(--primary))" },
    properties: { label: "Properties", color: "hsl(var(--accent))" },
    count: { label: "Count", color: "hsl(var(--chart-1))" },
    newTenants: { label: "New Tenants", color: "hsl(var(--success))" },
    churnedTenants: { label: "Churned", color: "hsl(var(--destructive))" },
  };

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
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Platform Analytics</h1>
            <p className="text-muted-foreground">Overview of platform performance and metrics</p>
          </div>
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
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full max-w-2xl grid-cols-4">
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-lg bg-success/10">
                      <DollarSign className="h-6 w-6 text-success" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Revenue</p>
                      <p className="text-2xl font-bold">{formatCurrency(totalRevenue)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-lg bg-primary/10">
                      <Users className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Merchants</p>
                      <p className="text-2xl font-bold">{totalMerchants}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-lg bg-accent/10">
                      <Building2 className="h-6 w-6 text-accent-foreground" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Properties</p>
                      <p className="text-2xl font-bold">{totalProperties}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-lg bg-info/10">
                      <Home className="h-6 w-6 text-info" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Occupancy Rate</p>
                      <p className="text-2xl font-bold">{occupancyRate}%</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    Revenue Trend
                  </CardTitle>
                  <CardDescription>Monthly revenue from database</CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={chartConfig} className="h-[300px]">
                    <AreaChart data={monthlyRevenueData}>
                      <XAxis dataKey="month" />
                      <YAxis tickFormatter={(v) => `${v/1000000}M`} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Area type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" fill="hsl(var(--primary) / 0.2)" strokeWidth={2} />
                    </AreaChart>
                  </ChartContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Merchant Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={chartConfig} className="h-[250px]">
                    <PieChart>
                      <Pie data={merchantStatus} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80}>
                        {merchantStatus.map((entry, index) => (
                          <Cell key={index} fill={entry.fill} />
                        ))}
                      </Pie>
                      <ChartTooltip content={<ChartTooltipContent />} />
                    </PieChart>
                  </ChartContainer>
                  <div className="flex justify-center gap-4 mt-2">
                    {merchantStatus.map((item, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.fill }} />
                        <span className="text-sm text-muted-foreground">{item.name}: {item.value}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="tenants" className="mt-6 space-y-6">
            {tenantLoading ? (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {[...Array(4)].map((_, i) => (
                    <Skeleton key={i} className="h-[120px] rounded-xl" />
                  ))}
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Skeleton className="h-[400px] rounded-xl" />
                  <Skeleton className="h-[400px] rounded-xl" />
                </div>
              </div>
            ) : (
              <>
                {/* Tenant Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4">
                        <div className="p-3 rounded-lg bg-primary/10">
                          <UserCheck className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Active Tenants</p>
                          <p className="text-2xl font-bold">{activeTenants}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4">
                        <div className="p-3 rounded-lg bg-success/10">
                          <TrendingUp className="h-6 w-6 text-success" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">New This Month</p>
                          <p className="text-2xl font-bold">{monthlyTenantData[5]?.newTenants || 0}</p>
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
                          <p className="text-sm text-muted-foreground">Churned This Month</p>
                          <p className="text-2xl font-bold">{monthlyTenantData[5]?.churnedTenants || 0}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4">
                        <div className="p-3 rounded-lg bg-warning/10">
                          <Wrench className="h-6 w-6 text-warning" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Pending Maintenance</p>
                          <p className="text-2xl font-bold">{maintenanceData[0]?.count || 0}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Tenant Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Tenant Growth vs Churn</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ChartContainer config={chartConfig} className="h-[300px]">
                        <BarChart data={monthlyTenantData}>
                          <XAxis dataKey="month" />
                          <YAxis />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <Bar dataKey="newTenants" fill="hsl(var(--success))" name="New Tenants" />
                          <Bar dataKey="churnedTenants" fill="hsl(var(--destructive))" name="Churned" />
                        </BarChart>
                      </ChartContainer>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Payment Behavior</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ChartContainer config={chartConfig} className="h-[250px]">
                        <PieChart>
                          <Pie data={paymentBehavior()} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80}>
                            {paymentBehavior().map((entry, index) => (
                              <Cell key={index} fill={entry.fill} />
                            ))}
                          </Pie>
                          <ChartTooltip content={<ChartTooltipContent />} />
                        </PieChart>
                      </ChartContainer>
                      <div className="flex justify-center gap-4 mt-2">
                        {paymentBehavior().map((item, i) => (
                          <div key={i} className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.fill }} />
                            <span className="text-sm text-muted-foreground">{item.name}: {item.value}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </>
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