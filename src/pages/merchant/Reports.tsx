import { useAuth } from '@/features/auth/hooks/useAuth';
import { useReportsData } from '@/features/analytics/hooks/useReportsData';
import { useReportExports } from '@/features/analytics/hooks/useReportExports';
import { formatCurrency } from '@/shared/utils/currency';

import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { Button } from '@/shared/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/shared/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { Alert, AlertDescription } from '@/shared/components/ui/alert';
import { DateRangePicker } from '@/shared/components/ui/date-range-picker';
import { useMemo, useState } from 'react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { TrendingUp, TrendingDown, Building2, DollarSign, Wrench, Download, FileText, Table2, UserMinus, BarChart3, AlertTriangle, Loader2, RefreshCw, PieChart as PieChartIcon } from 'lucide-react';
import { PageHeader } from '@/shared/components/ui/PageHeader';
import { StatsRowSkeleton, ChartSkeleton } from '@/shared/components/ui/PageSkeleton';
import { subMonths } from 'date-fns';
import { TenantChurnAnalytics } from '@/features/analytics/components/TenantChurnAnalytics';
import { OnTimePaymentRate } from '@/features/analytics/components/OnTimePaymentRate';
import { RevenueForecast } from '@/features/analytics/components/RevenueForecast';
import { ContractNoticePeriod } from '@/features/contracts/components/ContractNoticePeriod';
import { AnalyticsDashboardTab } from '@/features/analytics/components/AnalyticsDashboardTab';

const COLORS = ['hsl(var(--primary))', 'hsl(var(--accent))', 'hsl(var(--muted))', 'hsl(var(--success))', 'hsl(var(--warning))'];

const tooltipStyle = {
  backgroundColor: 'hsl(var(--card))',
  border: '1px solid hsl(var(--border) / 0.4)',
  borderRadius: '16px',
  backdropFilter: 'blur(8px)',
  boxShadow: '0 8px 32px -8px hsl(var(--foreground) / 0.1)',
};

export default function MerchantReports() {
  const { merchant } = useAuth();
  const [timeRange, setTimeRange] = useState('6');
  const [customDateRange, setCustomDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({ from: undefined, to: undefined });

  const effectiveDateRange = useMemo(() => {
    if (customDateRange.from && customDateRange.to) {
      return { from: customDateRange.from, to: customDateRange.to };
    }
    const to = new Date();
    const from = subMonths(to, parseInt(timeRange));
    return { from, to };
  }, [timeRange, customDateRange]);

  const {
    properties, payments, maintenanceRequests,
    isLoading, hasError,
    totalUnits, occupiedUnits, occupancyRate,
    totalRevenue, revenueChange, pendingPayments,
    revenueData, occupancyByType, maintenanceByCategory, maintenanceTrend,
  } = useReportsData(merchant?.id, effectiveDateRange as { from: Date; to: Date });

  const { exportLoading, handleExportPaymentsCSV, handleExportMaintenanceCSV, handleExportPDF } = useReportExports({
    payments, maintenanceRequests, totalRevenue, pendingPayments, occupancyRate,
    propertiesCount: properties.length,
    effectiveDateRange: effectiveDateRange as { from: Date; to: Date },
  });

  const handleClearDateRange = () => {
    setCustomDateRange({ from: undefined, to: undefined });
  };

  const kpiCards = [
    {
      label: "Total Revenue",
      value: formatCurrency(totalRevenue),
      icon: DollarSign,
      iconBg: "from-success/20 to-success/5",
      iconColor: "text-success",
      trend: revenueChange,
      trendLabel: `${revenueChange >= 0 ? '+' : ''}${revenueChange}% from previous period`,
    },
    {
      label: "Occupancy Rate",
      value: `${occupancyRate}%`,
      icon: Building2,
      iconBg: "from-info/20 to-info/5",
      iconColor: "text-info",
      subtext: `${occupiedUnits} of ${totalUnits} units`,
    },
    {
      label: "Pending Payments",
      value: formatCurrency(pendingPayments),
      icon: DollarSign,
      iconBg: "from-warning/20 to-warning/5",
      iconColor: "text-warning",
      subtext: `${payments.filter(p => p.status === 'pending').length} invoices due`,
    },
    {
      label: "Active Requests",
      value: `${maintenanceRequests.filter(r => r.status !== 'completed').length}`,
      icon: Wrench,
      iconBg: "from-accent/20 to-accent/5",
      iconColor: "text-accent-foreground",
      subtext: `${maintenanceRequests.filter(r => r.status === 'completed').length} completed`,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader icon={BarChart3} title="Reports & Analytics" description="Track your property performance">
        <div className="flex items-center gap-2 flex-wrap">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" disabled={!!exportLoading} className="rounded-xl">
                {exportLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="rounded-xl">
              <DropdownMenuItem onClick={handleExportPDF} disabled={!!exportLoading}>
                <FileText className="h-4 w-4 mr-2" />
                Export as PDF
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExportPaymentsCSV} disabled={!!exportLoading}>
                <Table2 className="h-4 w-4 mr-2" />
                Export Payments (CSV)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExportMaintenanceCSV} disabled={!!exportLoading}>
                <Table2 className="h-4 w-4 mr-2" />
                Export Maintenance (CSV)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <DateRangePicker
            value={customDateRange}
            onChange={(range) => setCustomDateRange({ from: range?.from, to: range?.to })}
          />
          {customDateRange.from && (
            <Button variant="ghost" size="sm" onClick={handleClearDateRange} className="rounded-xl">
              <RefreshCw className="h-4 w-4 mr-1" />
              Reset
            </Button>
          )}
          <Select value={timeRange} onValueChange={setTimeRange} disabled={!!customDateRange.from}>
            <SelectTrigger className="w-[140px] rounded-xl bg-background/60 border-border/50">
              <SelectValue placeholder="Time range" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="3">Last 3 months</SelectItem>
              <SelectItem value="6">Last 6 months</SelectItem>
              <SelectItem value="12">Last 12 months</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </PageHeader>

      {hasError && (
        <Alert variant="destructive" className="mb-4 rounded-xl">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Failed to load some data. Please refresh the page to try again.
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="pill-tab-list">
          <TabsTrigger value="overview" className="pill-tab-trigger">Overview</TabsTrigger>
          <TabsTrigger value="dashboard" className="pill-tab-trigger flex items-center gap-1.5">
            <BarChart3 className="h-3.5 w-3.5" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="roi" className="pill-tab-trigger flex items-center gap-1.5">
            <PieChartIcon className="h-3.5 w-3.5" />
            ROI & Ringkasan
          </TabsTrigger>
          <TabsTrigger value="forecasting" className="pill-tab-trigger flex items-center gap-1.5">
            <BarChart3 className="h-3.5 w-3.5" />
            Forecasting
          </TabsTrigger>
          <TabsTrigger value="churn" className="pill-tab-trigger flex items-center gap-1.5">
            <UserMinus className="h-3.5 w-3.5" />
            Tenant Churn
          </TabsTrigger>
          <TabsTrigger value="maintenance" className="pill-tab-trigger flex items-center gap-1.5">
            <Wrench className="h-3.5 w-3.5" />
            Maintenance
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          <AnalyticsDashboardTab />
        </TabsContent>

        <TabsContent value="overview" className="space-y-6">
          {isLoading ? (
            <>
              <StatsRowSkeleton count={5} />
              <div className="grid lg:grid-cols-2 gap-6">
                <ChartSkeleton />
                <ChartSkeleton />
              </div>
            </>
          ) : (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                {kpiCards.map((kpi) => (
                  <Card key={kpi.label} className="glass-stat-card hover-lift">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-muted-foreground font-medium">{kpi.label}</p>
                          <p className="text-2xl font-bold mt-1">{kpi.value}</p>
                        </div>
                        <div className={`gradient-icon-box bg-gradient-to-br ${kpi.iconBg}`}>
                          <kpi.icon className={`h-5 w-5 ${kpi.iconColor}`} />
                        </div>
                      </div>
                      {kpi.trend !== undefined && (
                        <div className={`flex items-center gap-1 mt-2 text-sm ${kpi.trend >= 0 ? 'text-success' : 'text-destructive'}`}>
                          {kpi.trend >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                          <span>{kpi.trendLabel}</span>
                        </div>
                      )}
                      {kpi.subtext && (
                        <p className="text-xs text-muted-foreground mt-2">{kpi.subtext}</p>
                      )}
                    </CardContent>
                  </Card>
                ))}

                <OnTimePaymentRate timeRange={timeRange} />
              </div>

              <div className="grid lg:grid-cols-2 gap-6">
                <Card className="rounded-2xl bg-card/90 backdrop-blur-sm border border-border/40">
                  <CardHeader className="flex flex-row items-center gap-3">
                    <div className="gradient-icon-box">
                      <TrendingUp className="h-5 w-5 text-primary" />
                    </div>
                    <CardTitle>Revenue Trend</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={revenueData}>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-muted/50" />
                          <XAxis dataKey="month" className="text-xs" />
                          <YAxis tickFormatter={(value) => `Rp${(value / 1000000).toFixed(0)}jt`} className="text-xs" />
                          <Tooltip
                            formatter={(value: number) => [formatCurrency(value), 'Revenue']}
                            contentStyle={tooltipStyle}
                          />
                          <Area type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" fill="hsl(var(--primary) / 0.15)" strokeWidth={2} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                <Card className="rounded-2xl bg-card/90 backdrop-blur-sm border border-border/40">
                  <CardHeader className="flex flex-row items-center gap-3">
                    <div className="gradient-icon-box">
                      <Building2 className="h-5 w-5 text-primary" />
                    </div>
                    <CardTitle>Occupancy by Property Type</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={occupancyByType} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" className="stroke-muted/50" />
                          <XAxis type="number" domain={[0, 100]} className="text-xs" />
                          <YAxis dataKey="name" type="category" width={100} className="text-xs capitalize" />
                          <Tooltip
                            formatter={(value: number) => [`${value}%`, 'Occupancy']}
                            contentStyle={tooltipStyle}
                          />
                          <Bar dataKey="occupancy" fill="hsl(var(--primary))" radius={[0, 8, 8, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </TabsContent>

        <TabsContent value="roi" className="space-y-6">
          {isLoading ? (
            <StatsRowSkeleton count={4} />
          ) : (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {(() => {
                  const totalCosts = properties.reduce((sum: number, p: any) => 
                    sum + Number(p.construction_cost || 0) + Number(p.renovation_cost || 0), 0);
                  const netIncome = totalRevenue - properties.reduce((sum: number, p: any) => 
                    sum + (Number(p.monthly_maintenance_cost || 0) * 12), 0);
                  const roi = totalCosts > 0 ? ((netIncome / totalCosts) * 100) : 0;
                  const yieldRate = totalCosts > 0 ? ((totalRevenue / totalCosts) * 100) : 0;
                  return [
                    { label: 'ROI', value: `${roi.toFixed(1)}%`, sub: 'Return on Investment', icon: TrendingUp, color: 'text-success' },
                    { label: 'Yield', value: `${yieldRate.toFixed(1)}%`, sub: 'Annual Yield Rate', icon: DollarSign, color: 'text-info' },
                    { label: 'Net Operating Income', value: formatCurrency(netIncome), sub: 'Revenue - Maintenance', icon: DollarSign, color: 'text-primary' },
                    { label: 'Total Investasi', value: formatCurrency(totalCosts), sub: 'Konstruksi + Renovasi', icon: Building2, color: 'text-warning' },
                  ].map((item) => (
                    <Card key={item.label} className="glass-stat-card hover-lift">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs text-muted-foreground font-medium">{item.label}</p>
                            <p className="text-2xl font-bold mt-1">{item.value}</p>
                          </div>
                          <div className="gradient-icon-box">
                            <item.icon className={`h-5 w-5 ${item.color}`} />
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">{item.sub}</p>
                      </CardContent>
                    </Card>
                  ));
                })()}
              </div>

              <Card className="rounded-2xl bg-card/90 backdrop-blur-sm border border-border/40">
                <CardHeader className="flex flex-row items-center gap-3">
                  <div className="gradient-icon-box"><TrendingUp className="h-5 w-5 text-primary" /></div>
                  <CardTitle>ROI per Properti</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {properties.map((p: any) => {
                      const cost = Number(p.construction_cost || 0) + Number(p.renovation_cost || 0);
                      const propRevenue = totalRevenue / Math.max(properties.length, 1);
                      const maintenanceCost = Number(p.monthly_maintenance_cost || 0) * 12;
                      const propRoi = cost > 0 ? (((propRevenue - maintenanceCost) / cost) * 100) : 0;
                      const yieldVal = cost > 0 ? ((propRevenue / cost) * 100) : 0;
                      return (
                        <div key={p.id} className="p-4 rounded-xl bg-muted/30 space-y-2">
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="font-medium">{p.name}</p>
                              <p className="text-xs text-muted-foreground capitalize">{p.property_type} · {p.units?.length || 0} unit</p>
                            </div>
                            <div className="text-right">
                              <p className={`text-lg font-bold ${propRoi >= 0 ? 'text-success' : 'text-destructive'}`}>{propRoi.toFixed(1)}%</p>
                              <p className="text-xs text-muted-foreground">ROI</p>
                            </div>
                          </div>
                          <div className="grid grid-cols-3 gap-2 text-xs">
                            <div><span className="text-muted-foreground">Investasi:</span> {formatCurrency(cost)}</div>
                            <div><span className="text-muted-foreground">Yield:</span> {yieldVal.toFixed(1)}%</div>
                            <div><span className="text-muted-foreground">Maintenance:</span> {formatCurrency(maintenanceCost)}/thn</div>
                          </div>
                        </div>
                      );
                    })}
                    {properties.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Tidak ada data properti</p>}
                  </div>
                </CardContent>
              </Card>

              <div className="grid lg:grid-cols-2 gap-6">
                <Card className="rounded-2xl bg-card/90 backdrop-blur-sm border border-border/40">
                  <CardHeader><CardTitle className="text-base">Ringkasan Okupansi</CardTitle></CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between"><span className="text-muted-foreground">Total Unit</span><span className="font-bold">{totalUnits}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Terisi</span><span className="font-bold text-success">{occupiedUnits}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Kosong</span><span className="font-bold text-warning">{totalUnits - occupiedUnits}</span></div>
                    <div className="flex justify-between border-t border-border/40 pt-3"><span className="font-medium">Tingkat Okupansi</span><span className="text-lg font-bold">{occupancyRate}%</span></div>
                  </CardContent>
                </Card>
                <Card className="rounded-2xl bg-card/90 backdrop-blur-sm border border-border/40">
                  <CardHeader><CardTitle className="text-base">Ringkasan Pembayaran</CardTitle></CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between"><span className="text-muted-foreground">Total Revenue</span><span className="font-bold text-success">{formatCurrency(totalRevenue)}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Pending</span><span className="font-bold text-warning">{formatCurrency(pendingPayments)}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Maintenance Requests</span><span className="font-bold">{maintenanceRequests.length}</span></div>
                    {(() => {
                      const mCost = properties.reduce((sum: number, p: any) => sum + (Number(p.monthly_maintenance_cost || 0) * 12), 0);
                      const ratio = totalRevenue > 0 ? ((mCost / totalRevenue) * 100) : 0;
                      return <div className="flex justify-between border-t border-border/40 pt-3"><span className="font-medium">Rasio Biaya Maintenance</span><span className="text-lg font-bold">{ratio.toFixed(1)}%</span></div>;
                    })()}
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </TabsContent>

        <TabsContent value="forecasting" className="space-y-6">
          <RevenueForecast />
          <ContractNoticePeriod />
        </TabsContent>

        <TabsContent value="churn" className="space-y-6">
          <TenantChurnAnalytics />
        </TabsContent>

        <TabsContent value="maintenance" className="space-y-6">
          <div className="grid lg:grid-cols-2 gap-6">
            <Card className="rounded-2xl bg-card/90 backdrop-blur-sm border border-border/40">
              <CardHeader className="flex flex-row items-center gap-3">
                <div className="gradient-icon-box">
                  <Wrench className="h-5 w-5 text-primary" />
                </div>
                <CardTitle>Maintenance by Category</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={maintenanceByCategory}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={2}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {maintenanceByCategory.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={tooltipStyle} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl bg-card/90 backdrop-blur-sm border border-border/40">
              <CardHeader className="flex flex-row items-center gap-3">
                <div className="gradient-icon-box">
                  <BarChart3 className="h-5 w-5 text-primary" />
                </div>
                <CardTitle>Maintenance Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={maintenanceTrend}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted/50" />
                      <XAxis dataKey="month" className="text-xs" />
                      <YAxis className="text-xs" />
                      <Tooltip contentStyle={tooltipStyle} />
                      <Legend />
                      <Bar dataKey="pending" name="Pending" fill="hsl(var(--muted-foreground))" radius={[6, 6, 0, 0]} />
                      <Bar dataKey="completed" name="Completed" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
