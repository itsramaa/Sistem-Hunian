import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AdminLayout } from "@/components/layouts/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from "recharts";
import { TrendingUp, Users, Building2, DollarSign, Loader2, Wrench, Home, Download, FileText, Activity, UserCheck, CreditCard, TrendingDown, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { exportToCSV, exportToPDF } from "@/lib/exportUtils";
import { RealTimeAnalytics } from "@/components/admin/RealTimeAnalytics";
import { format, subMonths, startOfMonth, endOfMonth, differenceInMonths } from "date-fns";

const AdminAnalytics = () => {
  const [activeTab, setActiveTab] = useState("realtime");
  
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin-analytics'],
    queryFn: async () => {
      const [merchants, properties, units, payments, maintenanceRequests, invoices, contracts] = await Promise.all([
        supabase.from('merchants').select('id, created_at, verification_status'),
        supabase.from('properties').select('id, created_at, status, property_type'),
        supabase.from('units').select('id, status, rent_amount'),
        supabase.from('payments').select('id, amount, status, created_at, paid_at, due_date'),
        supabase.from('maintenance_requests').select('id, status, created_at'),
        supabase.from('invoices').select('id, total_amount, status, created_at'),
        supabase.from('contracts').select('id, status, created_at, start_date, end_date, churn_reason, tenant_user_id, unit_id, units(properties(property_type))'),
      ]);

      return {
        merchants: merchants.data || [],
        properties: properties.data || [],
        units: units.data || [],
        payments: payments.data || [],
        maintenanceRequests: maintenanceRequests.data || [],
        invoices: invoices.data || [],
        contracts: contracts.data || [],
      };
    },
  });

  // Tenant analytics calculations
  const { data: tenantAnalytics } = useQuery({
    queryKey: ['tenant-analytics'],
    queryFn: async () => {
      const sixMonthsAgo = subMonths(new Date(), 6);
      
      const [contractsRes, paymentsRes] = await Promise.all([
        supabase
          .from('contracts')
          .select('id, created_at, status, churn_reason, unit_id, units(properties(property_type))')
          .gte('created_at', sixMonthsAgo.toISOString()),
        supabase
          .from('payments')
          .select('id, status, due_date, paid_at, amount')
          .gte('created_at', sixMonthsAgo.toISOString()),
      ]);

      return {
        contracts: contractsRes.data || [],
        payments: paymentsRes.data || [],
      };
    },
  });

  // Subscription analytics (MRR/Churn)
  const { data: subscriptionAnalytics } = useQuery({
    queryKey: ['subscription-analytics'],
    queryFn: async () => {
      const [subscriptionsRes, tiersRes] = await Promise.all([
        supabase
          .from('merchant_subscriptions')
          .select('*, subscription_tiers(name, display_name, price_monthly, price_yearly)'),
        supabase.from('subscription_tiers').select('*'),
      ]);

      return {
        subscriptions: subscriptionsRes.data || [],
        tiers: tiersRes.data || [],
      };
    },
  });

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  const totalRevenue = stats?.payments
    ?.filter(p => p.status === 'completed' || p.status === 'paid')
    .reduce((sum, p) => sum + Number(p.amount), 0) || 0;

  const totalProperties = stats?.properties?.length || 0;
  const totalUnits = stats?.units?.length || 0;
  const occupiedUnits = stats?.units?.filter(u => u.status === 'occupied').length || 0;
  const occupancyRate = totalUnits > 0 ? Math.round((occupiedUnits / totalUnits) * 100) : 0;

  // Active tenants count
  const activeTenants = stats?.contracts?.filter(c => c.status === 'active').length || 0;

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

      const churnedTenants = stats?.contracts?.filter(c => {
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

  // Tenants by property type
  const tenantsByPropertyType = () => {
    const typeCount: Record<string, number> = {};
    stats?.contracts?.forEach((contract: any) => {
      const type = contract.units?.properties?.property_type || 'Unknown';
      typeCount[type] = (typeCount[type] || 0) + 1;
    });
    return Object.entries(typeCount).map(([name, value]) => ({
      name,
      value,
      fill: name === 'apartment' ? 'hsl(var(--primary))' : 
            name === 'kost' ? 'hsl(var(--success))' : 
            name === 'house' ? 'hsl(var(--warning))' : 'hsl(var(--muted))',
    }));
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

  // Churn analytics
  const churnReasons = () => {
    const reasons: Record<string, number> = {};
    stats?.contracts?.filter(c => c.churn_reason).forEach((c: any) => {
      const reason = c.churn_reason || 'Unknown';
      reasons[reason] = (reasons[reason] || 0) + 1;
    });
    return Object.entries(reasons).map(([name, count]) => ({ name, count }));
  };

  // Monthly revenue data
  const monthlyData = [
    { month: 'Jul', revenue: 125000000, properties: 12 },
    { month: 'Aug', revenue: 142000000, properties: 14 },
    { month: 'Sep', revenue: 158000000, properties: 15 },
    { month: 'Oct', revenue: 165000000, properties: 18 },
    { month: 'Nov', revenue: 178000000, properties: 20 },
    { month: 'Dec', revenue: 195000000, properties: 22 },
  ];

  // Merchant status distribution
  const merchantStatus = [
    { name: 'Verified', value: stats?.merchants?.filter(m => m.verification_status === 'verified').length || 0, fill: 'hsl(var(--success))' },
    { name: 'Pending', value: stats?.merchants?.filter(m => m.verification_status === 'pending').length || 0, fill: 'hsl(var(--warning))' },
    { name: 'Rejected', value: stats?.merchants?.filter(m => m.verification_status === 'rejected').length || 0, fill: 'hsl(var(--destructive))' },
  ];

  // Unit status distribution
  const unitStatus = [
    { name: 'Occupied', value: occupiedUnits, fill: 'hsl(var(--success))' },
    { name: 'Available', value: stats?.units?.filter(u => u.status === 'available').length || 0, fill: 'hsl(var(--primary))' },
    { name: 'Maintenance', value: stats?.units?.filter(u => u.status === 'maintenance').length || 0, fill: 'hsl(var(--warning))' },
  ];

  // Maintenance request status
  const maintenanceData = [
    { name: 'Pending', count: stats?.maintenanceRequests?.filter(m => m.status === 'pending').length || 0 },
    { name: 'In Progress', count: stats?.maintenanceRequests?.filter(m => m.status === 'in_progress').length || 0 },
    { name: 'Completed', count: stats?.maintenanceRequests?.filter(m => m.status === 'completed').length || 0 },
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

  const handleExportCSV = () => {
    const data = [
      { metric: 'Total Revenue', value: formatCurrency(totalRevenue) },
      { metric: 'Total Merchants', value: stats?.merchants?.length || 0 },
      { metric: 'Total Properties', value: totalProperties },
      { metric: 'Total Units', value: totalUnits },
      { metric: 'Active Tenants', value: activeTenants },
      { metric: 'Occupancy Rate', value: `${occupancyRate}%` },
    ];
    exportToCSV(data, 'platform-analytics');
  };

  const handleExportPDF = () => {
    const data = [
      { metric: 'Total Revenue', value: formatCurrency(totalRevenue) },
      { metric: 'Total Merchants', value: stats?.merchants?.length || 0 },
      { metric: 'Active Tenants', value: activeTenants },
      { metric: 'Occupancy Rate', value: `${occupancyRate}%` },
    ];
    exportToPDF(data, 'Platform Analytics Report', 'platform-analytics');
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Platform Analytics</h1>
            <p className="text-muted-foreground">Overview of platform performance and metrics</p>
          </div>
          <div className="flex gap-2">
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
                      <p className="text-2xl font-bold">{stats?.merchants?.length || 0}</p>
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
                </CardHeader>
                <CardContent>
                  <ChartContainer config={chartConfig} className="h-[300px]">
                    <AreaChart data={monthlyData}>
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
                    <div className="p-3 rounded-lg bg-warning/10">
                      <Users className="h-6 w-6 text-warning" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Churned</p>
                      <p className="text-2xl font-bold">{stats?.contracts?.filter(c => c.churn_reason).length || 0}</p>
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
                      <p className="text-sm text-muted-foreground">Occupancy</p>
                      <p className="text-2xl font-bold">{occupancyRate}%</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Tenant Growth Chart */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Tenant Growth</CardTitle>
                  <CardDescription>New vs churned tenants over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={chartConfig} className="h-[300px]">
                    <BarChart data={monthlyTenantData}>
                      <XAxis dataKey="month" />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="newTenants" fill="hsl(var(--success))" radius={[4, 4, 0, 0]} name="New" />
                      <Bar dataKey="churnedTenants" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} name="Churned" />
                    </BarChart>
                  </ChartContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Tenants by Property Type</CardTitle>
                  <CardDescription>Distribution across property types</CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={chartConfig} className="h-[250px]">
                    <PieChart>
                      <Pie data={tenantsByPropertyType()} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80}>
                        {tenantsByPropertyType().map((entry, index) => (
                          <Cell key={index} fill={entry.fill} />
                        ))}
                      </Pie>
                      <ChartTooltip content={<ChartTooltipContent />} />
                    </PieChart>
                  </ChartContainer>
                  <div className="flex flex-wrap justify-center gap-4 mt-2">
                    {tenantsByPropertyType().map((item, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.fill }} />
                        <span className="text-sm text-muted-foreground capitalize">{item.name}: {item.value}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Payment Behavior */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Payment Behavior</CardTitle>
                  <CardDescription>On-time vs late payment analysis</CardDescription>
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

              <Card>
                <CardHeader>
                  <CardTitle>Churn Reasons</CardTitle>
                  <CardDescription>Why tenants are leaving</CardDescription>
                </CardHeader>
                <CardContent>
                  {churnReasons().length === 0 ? (
                    <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                      No churn data available
                    </div>
                  ) : (
                    <ChartContainer config={chartConfig} className="h-[250px]">
                      <BarChart data={churnReasons()} layout="vertical">
                        <XAxis type="number" />
                        <YAxis dataKey="name" type="category" width={100} />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Bar dataKey="count" fill="hsl(var(--warning))" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ChartContainer>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="subscriptions" className="mt-6 space-y-6">
            {/* MRR/Churn Analytics */}
            {(() => {
              const subscriptions = subscriptionAnalytics?.subscriptions || [];
              const tiers = subscriptionAnalytics?.tiers || [];
              
              // Calculate MRR
              const activeSubscriptions = subscriptions.filter(
                (s: any) => s.status === 'active' || s.status === 'trialing'
              );
              const mrr = activeSubscriptions.reduce((sum: number, s: any) => {
                return sum + Number(s.subscription_tiers?.price_monthly || 0);
              }, 0);

              // Calculate ARR
              const arr = mrr * 12;

              // Calculate Churn
              const canceledThisMonth = subscriptions.filter((s: any) => {
                if (!s.canceled_at) return false;
                const cancelDate = new Date(s.canceled_at);
                const now = new Date();
                return cancelDate.getMonth() === now.getMonth() && cancelDate.getFullYear() === now.getFullYear();
              }).length;

              const churnRate = activeSubscriptions.length > 0
                ? ((canceledThisMonth / (activeSubscriptions.length + canceledThisMonth)) * 100).toFixed(1)
                : '0';

              // Subscription status distribution
              const statusData = [
                { name: 'Active', value: subscriptions.filter((s: any) => s.status === 'active').length, fill: 'hsl(var(--success))' },
                { name: 'Trialing', value: subscriptions.filter((s: any) => s.status === 'trialing').length, fill: 'hsl(var(--info))' },
                { name: 'Past Due', value: subscriptions.filter((s: any) => s.status === 'past_due').length, fill: 'hsl(var(--warning))' },
                { name: 'Canceled', value: subscriptions.filter((s: any) => s.status === 'canceled').length, fill: 'hsl(var(--destructive))' },
              ];

              // Tier distribution
              const tierData = tiers.map((tier: any) => ({
                name: tier.display_name,
                count: subscriptions.filter((s: any) => s.tier_id === tier.id && (s.status === 'active' || s.status === 'trialing')).length,
                revenue: subscriptions
                  .filter((s: any) => s.tier_id === tier.id && (s.status === 'active' || s.status === 'trialing'))
                  .length * Number(tier.price_monthly),
              }));

              // Monthly MRR trend (last 6 months simulation based on created_at)
              const mrrTrend = [];
              for (let i = 5; i >= 0; i--) {
                const date = subMonths(new Date(), i);
                const monthStart = startOfMonth(date);
                const monthEnd = endOfMonth(date);
                
                const activeAtMonth = subscriptions.filter((s: any) => {
                  const created = new Date(s.created_at);
                  const canceled = s.canceled_at ? new Date(s.canceled_at) : null;
                  return created <= monthEnd && (!canceled || canceled > monthStart);
                });

                const monthMrr = activeAtMonth.reduce((sum: number, s: any) => {
                  return sum + Number(s.subscription_tiers?.price_monthly || 0);
                }, 0);

                mrrTrend.push({
                  month: format(date, 'MMM'),
                  mrr: monthMrr,
                  subscribers: activeAtMonth.length,
                });
              }

              // Trial conversion rate
              const trialSubs = subscriptions.filter((s: any) => s.trial_ends_at);
              const convertedTrials = trialSubs.filter((s: any) => s.status === 'active' && s.payment_status === 'paid').length;
              const conversionRate = trialSubs.length > 0 ? ((convertedTrials / trialSubs.length) * 100).toFixed(1) : '0';

              return (
                <>
                  {/* Key Metrics */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                          <div className="p-3 rounded-lg bg-success/10">
                            <DollarSign className="h-6 w-6 text-success" />
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">MRR</p>
                            <p className="text-2xl font-bold">{formatCurrency(mrr)}</p>
                            <p className="text-xs text-muted-foreground">Monthly Recurring Revenue</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                          <div className="p-3 rounded-lg bg-primary/10">
                            <TrendingUp className="h-6 w-6 text-primary" />
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">ARR</p>
                            <p className="text-2xl font-bold">{formatCurrency(arr)}</p>
                            <p className="text-xs text-muted-foreground">Annual Recurring Revenue</p>
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
                            <p className="text-sm text-muted-foreground">Churn Rate</p>
                            <p className="text-2xl font-bold">{churnRate}%</p>
                            <p className="text-xs text-muted-foreground">{canceledThisMonth} canceled this month</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                          <div className="p-3 rounded-lg bg-info/10">
                            <ArrowUpRight className="h-6 w-6 text-info" />
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Trial Conversion</p>
                            <p className="text-2xl font-bold">{conversionRate}%</p>
                            <p className="text-xs text-muted-foreground">{convertedTrials} of {trialSubs.length} trials</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Charts */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>MRR Trend</CardTitle>
                        <CardDescription>Monthly recurring revenue over time</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <ChartContainer config={chartConfig} className="h-[300px]">
                          <AreaChart data={mrrTrend}>
                            <XAxis dataKey="month" />
                            <YAxis tickFormatter={(v) => `${v/1000000}M`} />
                            <ChartTooltip content={<ChartTooltipContent />} />
                            <Area type="monotone" dataKey="mrr" stroke="hsl(var(--success))" fill="hsl(var(--success) / 0.2)" strokeWidth={2} />
                          </AreaChart>
                        </ChartContainer>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>Subscription Status</CardTitle>
                        <CardDescription>Distribution by status</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <ChartContainer config={chartConfig} className="h-[250px]">
                          <PieChart>
                            <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80}>
                              {statusData.map((entry, index) => (
                                <Cell key={index} fill={entry.fill} />
                              ))}
                            </Pie>
                            <ChartTooltip content={<ChartTooltipContent />} />
                          </PieChart>
                        </ChartContainer>
                        <div className="flex flex-wrap justify-center gap-4 mt-2">
                          {statusData.map((item, i) => (
                            <div key={i} className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.fill }} />
                              <span className="text-sm text-muted-foreground">{item.name}: {item.value}</span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Tier Distribution */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Revenue by Tier</CardTitle>
                        <CardDescription>MRR contribution by subscription tier</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <ChartContainer config={chartConfig} className="h-[300px]">
                          <BarChart data={tierData}>
                            <XAxis dataKey="name" />
                            <YAxis tickFormatter={(v) => `${v/1000}K`} />
                            <ChartTooltip content={<ChartTooltipContent />} />
                            <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ChartContainer>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>Subscribers by Tier</CardTitle>
                        <CardDescription>Active subscribers per tier</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {tierData.map((tier: any, i: number) => (
                            <div key={i} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                              <div>
                                <p className="font-medium">{tier.name}</p>
                                <p className="text-sm text-muted-foreground">{formatCurrency(tier.revenue)}/month</p>
                              </div>
                              <div className="text-right">
                                <p className="text-2xl font-bold">{tier.count}</p>
                                <p className="text-xs text-muted-foreground">subscribers</p>
                              </div>
                            </div>
                          ))}
                          {tierData.length === 0 && (
                            <div className="text-center py-8 text-muted-foreground">
                              No subscription tiers found
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Subscriber Growth */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Subscriber Growth</CardTitle>
                      <CardDescription>Active subscribers over time</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ChartContainer config={chartConfig} className="h-[300px]">
                        <LineChart data={mrrTrend}>
                          <XAxis dataKey="month" />
                          <YAxis />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <Line type="monotone" dataKey="subscribers" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ fill: 'hsl(var(--primary))' }} />
                        </LineChart>
                      </ChartContainer>
                    </CardContent>
                  </Card>
                </>
              );
            })()}
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default AdminAnalytics;
