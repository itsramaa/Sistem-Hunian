import { useQuery } from "@tanstack/react-query";
import { AdminLayout } from "@/components/layouts/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from "recharts";
import { TrendingUp, Users, Building2, DollarSign, Loader2, Wrench, Home, Download, FileText } from "lucide-react";
import { exportToCSV, exportToPDF } from "@/lib/exportUtils";

const AdminAnalytics = () => {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin-analytics'],
    queryFn: async () => {
      const [merchants, properties, units, payments, maintenanceRequests, invoices] = await Promise.all([
        supabase.from('merchants').select('id, created_at, verification_status'),
        supabase.from('properties').select('id, created_at, status'),
        supabase.from('units').select('id, status, rent_amount'),
        supabase.from('payments').select('id, amount, status, created_at, paid_at'),
        supabase.from('maintenance_requests').select('id, status, created_at'),
        supabase.from('invoices').select('id, total_amount, status, created_at'),
      ]);

      return {
        merchants: merchants.data || [],
        properties: properties.data || [],
        units: units.data || [],
        payments: payments.data || [],
        maintenanceRequests: maintenanceRequests.data || [],
        invoices: invoices.data || [],
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
    ?.filter(p => p.status === 'completed')
    .reduce((sum, p) => sum + Number(p.amount), 0) || 0;

  const totalProperties = stats?.properties?.length || 0;
  const totalUnits = stats?.units?.length || 0;
  const occupiedUnits = stats?.units?.filter(u => u.status === 'occupied').length || 0;
  const occupancyRate = totalUnits > 0 ? Math.round((occupiedUnits / totalUnits) * 100) : 0;

  // Monthly revenue data (simulated for demo)
  const monthlyData = [
    { month: 'Jul', revenue: 125000, properties: 12 },
    { month: 'Aug', revenue: 142000, properties: 14 },
    { month: 'Sep', revenue: 158000, properties: 15 },
    { month: 'Oct', revenue: 165000, properties: 18 },
    { month: 'Nov', revenue: 178000, properties: 20 },
    { month: 'Dec', revenue: 195000, properties: 22 },
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
  };

  const handleExportCSV = () => {
    const data = [
      { metric: 'Total Revenue', value: `R ${totalRevenue.toLocaleString()}` },
      { metric: 'Total Merchants', value: stats?.merchants?.length || 0 },
      { metric: 'Total Properties', value: totalProperties },
      { metric: 'Total Units', value: totalUnits },
      { metric: 'Occupied Units', value: occupiedUnits },
      { metric: 'Occupancy Rate', value: `${occupancyRate}%` },
      { metric: 'Pending Maintenance', value: stats?.maintenanceRequests?.filter(m => m.status === 'pending').length || 0 },
    ];
    exportToCSV(data, 'platform-analytics');
  };

  const handleExportPDF = () => {
    const data = [
      { metric: 'Total Revenue', value: `R ${totalRevenue.toLocaleString()}` },
      { metric: 'Total Merchants', value: stats?.merchants?.length || 0 },
      { metric: 'Total Properties', value: totalProperties },
      { metric: 'Total Units', value: totalUnits },
      { metric: 'Occupied Units', value: occupiedUnits },
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
                  <p className="text-2xl font-bold">R {totalRevenue.toLocaleString()}</p>
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
                  <Building2 className="h-6 w-6 text-accent" />
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

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Revenue Trend
              </CardTitle>
              <CardDescription>Monthly revenue over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[300px]">
                <AreaChart data={monthlyData}>
                  <XAxis dataKey="month" />
                  <YAxis tickFormatter={(v) => `R${v/1000}k`} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="hsl(var(--primary))"
                    fill="hsl(var(--primary) / 0.2)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-accent" />
                Property Growth
              </CardTitle>
              <CardDescription>New properties added each month</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[300px]">
                <BarChart data={monthlyData}>
                  <XAxis dataKey="month" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="properties" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Merchant Status</CardTitle>
              <CardDescription>Verification status breakdown</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[200px]">
                <PieChart>
                  <Pie
                    data={merchantStatus}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                  >
                    {merchantStatus.map((entry, index) => (
                      <Cell key={index} fill={entry.fill} />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                </PieChart>
              </ChartContainer>
              <div className="flex justify-center gap-4 mt-4">
                {merchantStatus.map((item, i) => (
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
              <CardTitle>Unit Status</CardTitle>
              <CardDescription>Current occupancy breakdown</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[200px]">
                <PieChart>
                  <Pie
                    data={unitStatus}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                  >
                    {unitStatus.map((entry, index) => (
                      <Cell key={index} fill={entry.fill} />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                </PieChart>
              </ChartContainer>
              <div className="flex justify-center gap-4 mt-4">
                {unitStatus.map((item, i) => (
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
              <CardTitle className="flex items-center gap-2">
                <Wrench className="h-5 w-5 text-warning" />
                Maintenance
              </CardTitle>
              <CardDescription>Request status breakdown</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[200px]">
                <BarChart data={maintenanceData} layout="vertical">
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={80} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="count" fill="hsl(var(--chart-1))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminAnalytics;
