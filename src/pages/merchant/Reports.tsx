import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/integrations/supabase/client';
import { useAuth } from '@/features/auth/hooks/useAuth';

import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { Button } from '@/shared/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/shared/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { Alert, AlertDescription } from '@/shared/components/ui/alert';
import { DateRangePicker } from '@/shared/components/ui/date-range-picker';
import { useMemo, useState } from 'react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { TrendingUp, TrendingDown, Building2, Users, DollarSign, Wrench, Download, FileText, Table2, UserMinus, BarChart3, AlertTriangle, Loader2, RefreshCw } from 'lucide-react';
import { PageHeader } from '@/shared/components/ui/PageHeader';
import { ChartSkeleton, StatsRowSkeleton } from '@/shared/components/ui/PageSkeleton';
import { format, subMonths, startOfMonth, endOfMonth, differenceInMonths } from 'date-fns';
import { exportToCSV, exportToPDF, generateReportHTML } from '@/shared/utils/exportUtils';
import { useToast } from '@/shared/hooks/use-toast';
import { TenantChurnAnalytics } from '@/features/analytics/components/TenantChurnAnalytics';
import { OnTimePaymentRate } from '@/features/analytics/components/OnTimePaymentRate';
import { RevenueForecast } from '@/features/analytics/components/RevenueForecast';
import { ContractNoticePeriod } from '@/features/contracts/components/ContractNoticePeriod';
import { logExport } from '@/shared/utils/auditLog';

const COLORS = ['hsl(var(--primary))', 'hsl(var(--accent))', 'hsl(var(--muted))', '#10b981', '#f59e0b'];

export default function MerchantReports() {
  const { merchant } = useAuth();
  const { toast } = useToast();
  const [timeRange, setTimeRange] = useState('6');
  const [customDateRange, setCustomDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({ from: undefined, to: undefined });
  const [exportLoading, setExportLoading] = useState<string | null>(null);

  // Calculate effective date range
  const effectiveDateRange = useMemo(() => {
    if (customDateRange.from && customDateRange.to) {
      return { from: customDateRange.from, to: customDateRange.to };
    }
    const to = new Date();
    const from = subMonths(to, parseInt(timeRange));
    return { from, to };
  }, [timeRange, customDateRange]);

  // Fetch properties with units
  const { data: properties = [] } = useQuery({
    queryKey: ['properties-with-units', merchant?.id],
    queryFn: async () => {
      if (!merchant?.id) return [];
      const { data, error } = await supabase
        .from('properties')
        .select('*, units(*)')
        .eq('merchant_id', merchant.id);
      if (error) throw error;
      return data;
    },
    enabled: !!merchant?.id,
  });

  // Fetch payments with date range filter
  const { data: payments = [], isLoading: paymentsLoading, error: paymentsError } = useQuery({
    queryKey: ['payment-analytics', merchant?.id, effectiveDateRange.from?.toISOString(), effectiveDateRange.to?.toISOString()],
    queryFn: async () => {
      if (!merchant?.id) return [];
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('merchant_id', merchant.id)
        .gte('created_at', effectiveDateRange.from!.toISOString())
        .lte('created_at', effectiveDateRange.to!.toISOString())
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!merchant?.id && !!effectiveDateRange.from,
  });

  // Fetch previous period payments for comparison
  const { data: previousPayments = [] } = useQuery({
    queryKey: ['payment-analytics-previous', merchant?.id, effectiveDateRange.from?.toISOString()],
    queryFn: async () => {
      if (!merchant?.id || !effectiveDateRange.from || !effectiveDateRange.to) return [];
      const months = differenceInMonths(effectiveDateRange.to, effectiveDateRange.from) || 1;
      const previousFrom = subMonths(effectiveDateRange.from, months);
      const previousTo = subMonths(effectiveDateRange.to, months);
      
      const { data, error } = await supabase
        .from('payments')
        .select('amount, status')
        .eq('merchant_id', merchant.id)
        .eq('status', 'paid')
        .gte('created_at', previousFrom.toISOString())
        .lte('created_at', previousTo.toISOString());
      if (error) throw error;
      return data;
    },
    enabled: !!merchant?.id && !!effectiveDateRange.from,
  });

  // Fetch maintenance requests with date filter
  const { data: maintenanceRequests = [], isLoading: maintenanceLoading, error: maintenanceError } = useQuery({
    queryKey: ['maintenance-analytics', merchant?.id, effectiveDateRange.from?.toISOString(), effectiveDateRange.to?.toISOString()],
    queryFn: async () => {
      if (!merchant?.id) return [];
      const { data, error } = await supabase
        .from('maintenance_requests')
        .select('*')
        .eq('merchant_id', merchant.id)
        .gte('created_at', effectiveDateRange.from!.toISOString())
        .lte('created_at', effectiveDateRange.to!.toISOString());
      if (error) throw error;
      return data;
    },
    enabled: !!merchant?.id && !!effectiveDateRange.from,
  });

  const isLoading = paymentsLoading || maintenanceLoading;
  const hasError = paymentsError || maintenanceError;

  // Calculate stats
  const totalUnits = properties.reduce((sum, p) => sum + (p.units?.length || 0), 0);
  const occupiedUnits = properties.reduce(
    (sum, p) => sum + (p.units?.filter((u: { status: string }) => u.status === 'occupied').length || 0),
    0
  );
  const occupancyRate = totalUnits > 0 ? Math.round((occupiedUnits / totalUnits) * 100) : 0;

  const totalRevenue = useMemo(() => 
    payments.filter(p => p.status === 'paid').reduce((sum, p) => sum + Number(p.amount), 0),
    [payments]
  );

  const previousRevenue = useMemo(() => 
    previousPayments.reduce((sum, p) => sum + Number(p.amount), 0),
    [previousPayments]
  );

  const revenueChange = useMemo(() => {
    if (previousRevenue === 0) return 0;
    return Math.round(((totalRevenue - previousRevenue) / previousRevenue) * 100);
  }, [totalRevenue, previousRevenue]);

  const pendingPayments = useMemo(() => 
    payments.filter(p => p.status === 'pending').reduce((sum, p) => sum + Number(p.amount), 0),
    [payments]
  );

  // Generate monthly revenue data - memoized
  const revenueData = useMemo(() => {
    const months: { [key: string]: number } = {};
    const numMonths = customDateRange.from && customDateRange.to 
      ? Math.max(1, differenceInMonths(customDateRange.to, customDateRange.from))
      : parseInt(timeRange);
    
    for (let i = numMonths - 1; i >= 0; i--) {
      const date = subMonths(effectiveDateRange.to || new Date(), i);
      const key = format(date, 'MMM yyyy');
      months[key] = 0;
    }

    payments
      .filter(p => p.status === 'paid' && p.paid_at)
      .forEach(p => {
        const key = format(new Date(p.paid_at!), 'MMM yyyy');
        if (months[key] !== undefined) {
          months[key] += Number(p.amount);
        }
      });

    return Object.entries(months).map(([month, revenue]) => ({
      month,
      revenue,
    }));
  }, [payments, timeRange, customDateRange, effectiveDateRange.to]);

  // Occupancy by property type - memoized
  const occupancyByType = useMemo(() => {
    const types: { [key: string]: { total: number; occupied: number } } = {};
    
    properties.forEach(p => {
      if (!types[p.property_type]) {
        types[p.property_type] = { total: 0, occupied: 0 };
      }
      const units = p.units || [];
      types[p.property_type].total += units.length;
      types[p.property_type].occupied += units.filter((u: { status: string }) => u.status === 'occupied').length;
    });

    return Object.entries(types).map(([name, data]) => ({
      name,
      occupancy: data.total > 0 ? Math.round((data.occupied / data.total) * 100) : 0,
      total: data.total,
      occupied: data.occupied,
    }));
  }, [properties]);

  // Maintenance by category - memoized
  const maintenanceByCategory = useMemo(() => {
    const categories: { [key: string]: number } = {};
    
    maintenanceRequests.forEach(r => {
      if (!categories[r.category]) {
        categories[r.category] = 0;
      }
      categories[r.category]++;
    });

    return Object.entries(categories).map(([name, value]) => ({
      name,
      value,
    }));
  }, [maintenanceRequests]);

  // Maintenance trend - memoized
  const maintenanceTrend = useMemo(() => {
    const months: { [key: string]: { pending: number; completed: number } } = {};
    const numMonths = customDateRange.from && customDateRange.to 
      ? Math.max(1, differenceInMonths(customDateRange.to, customDateRange.from))
      : parseInt(timeRange);
    
    for (let i = numMonths - 1; i >= 0; i--) {
      const date = subMonths(effectiveDateRange.to || new Date(), i);
      const key = format(date, 'MMM');
      months[key] = { pending: 0, completed: 0 };
    }

    maintenanceRequests.forEach(r => {
      const key = format(new Date(r.created_at), 'MMM');
      if (months[key]) {
        if (r.status === 'completed') {
          months[key].completed++;
        } else {
          months[key].pending++;
        }
      }
    });

    return Object.entries(months).map(([month, data]) => ({
      month,
      ...data,
    }));
  }, [maintenanceRequests, timeRange, customDateRange, effectiveDateRange.to]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(value);
  };

  // Export functions with audit logging
  const handleExportPaymentsCSV = async () => {
    setExportLoading('payments-csv');
    try {
      const exportData = payments.map(p => ({
        date: format(new Date(p.created_at), 'yyyy-MM-dd'),
        amount: p.amount,
        status: p.status,
        payment_type: p.payment_type,
        due_date: p.due_date,
        paid_at: p.paid_at || '',
      }));
      exportToCSV(exportData, 'payments_report', [
        { key: 'date', label: 'Date' },
        { key: 'amount', label: 'Amount' },
        { key: 'status', label: 'Status' },
        { key: 'payment_type', label: 'Type' },
        { key: 'due_date', label: 'Due Date' },
        { key: 'paid_at', label: 'Paid At' },
      ]);
      
      // Log export to audit
      await logExport('analytics', 'csv', exportData.length, { 
        type: 'payments',
        dateRange: { from: effectiveDateRange.from?.toISOString(), to: effectiveDateRange.to?.toISOString() }
      });
      
      toast({ title: 'Export complete', description: `${exportData.length} payment records downloaded as CSV.` });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Export failed', description: 'Failed to export payments. Please try again.' });
    } finally {
      setExportLoading(null);
    }
  };

  const handleExportMaintenanceCSV = async () => {
    setExportLoading('maintenance-csv');
    try {
      const exportData = maintenanceRequests.map(r => ({
        date: format(new Date(r.created_at), 'yyyy-MM-dd'),
        title: r.title,
        category: r.category,
        priority: r.priority,
        status: r.status,
      }));
      exportToCSV(exportData, 'maintenance_report', [
        { key: 'date', label: 'Date' },
        { key: 'title', label: 'Title' },
        { key: 'category', label: 'Category' },
        { key: 'priority', label: 'Priority' },
        { key: 'status', label: 'Status' },
      ]);
      
      await logExport('analytics', 'csv', exportData.length, { 
        type: 'maintenance',
        dateRange: { from: effectiveDateRange.from?.toISOString(), to: effectiveDateRange.to?.toISOString() }
      });
      
      toast({ title: 'Export complete', description: `${exportData.length} maintenance records downloaded as CSV.` });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Export failed', description: 'Failed to export maintenance data. Please try again.' });
    } finally {
      setExportLoading(null);
    }
  };

  const handleExportPDF = async () => {
    setExportLoading('pdf');
    try {
      const paymentData = payments.filter(p => p.status === 'paid').map(p => ({
        date: format(new Date(p.paid_at || p.created_at), 'dd MMM yyyy'),
        amount: formatCurrency(Number(p.amount)),
        type: p.payment_type,
        status: p.status,
      }));

      const content = generateReportHTML(
        paymentData,
        [
          { key: 'date', label: 'Date' },
          { key: 'amount', label: 'Amount' },
          { key: 'type', label: 'Type' },
          { key: 'status', label: 'Status' },
        ],
        [
          { label: 'Total Revenue', value: formatCurrency(totalRevenue) },
          { label: 'Pending Payments', value: formatCurrency(pendingPayments) },
          { label: 'Occupancy Rate', value: `${occupancyRate}%` },
          { label: 'Total Properties', value: String(properties.length) },
        ]
      );

      exportToPDF('Property Analytics Report', content, 'analytics_report');
      
      await logExport('analytics', 'pdf', paymentData.length, { 
        dateRange: { from: effectiveDateRange.from?.toISOString(), to: effectiveDateRange.to?.toISOString() }
      });
      
      toast({ title: 'Export complete', description: 'Report opened for printing/saving as PDF.' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Export failed', description: 'Failed to generate PDF. Please try again.' });
    } finally {
      setExportLoading(null);
    }
  };

  const handleClearDateRange = () => {
    setCustomDateRange({ from: undefined, to: undefined });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-6">
        <PageHeader icon={BarChart3} title="Reports & Analytics" description="Track your property performance">
          <div className="flex items-center gap-2 flex-wrap">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" disabled={!!exportLoading}>
                  {exportLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
                  Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
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
              <Button variant="ghost" size="sm" onClick={handleClearDateRange}>
                <RefreshCw className="h-4 w-4 mr-1" />
                Reset
              </Button>
            )}
            <Select value={timeRange} onValueChange={setTimeRange} disabled={!!customDateRange.from}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Time range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="3">Last 3 months</SelectItem>
                <SelectItem value="6">Last 6 months</SelectItem>
                <SelectItem value="12">Last 12 months</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </PageHeader>

        {hasError && (
          <Alert variant="destructive" className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Failed to load some data. Please refresh the page to try again.
            </AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="forecasting" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Forecasting
            </TabsTrigger>
            <TabsTrigger value="churn" className="flex items-center gap-2">
              <UserMinus className="h-4 w-4" />
              Tenant Churn
            </TabsTrigger>
            <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <>
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Revenue</p>
                      <p className="text-2xl font-bold">{formatCurrency(totalRevenue)}</p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
                      <DollarSign className="h-5 w-5 text-green-600" />
                    </div>
                  </div>
                  <div className={`flex items-center gap-1 mt-2 text-sm ${revenueChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {revenueChange >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                    <span>{revenueChange >= 0 ? '+' : ''}{revenueChange}% from previous period</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Occupancy Rate</p>
                      <p className="text-2xl font-bold">{occupancyRate}%</p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                      <Building2 className="h-5 w-5 text-blue-600" />
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    {occupiedUnits} of {totalUnits} units
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Pending Payments</p>
                      <p className="text-2xl font-bold">{formatCurrency(pendingPayments)}</p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-yellow-500/10 flex items-center justify-center">
                      <DollarSign className="h-5 w-5 text-yellow-600" />
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    {payments.filter(p => p.status === 'pending').length} invoices due
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Active Requests</p>
                      <p className="text-2xl font-bold">
                        {maintenanceRequests.filter(r => r.status !== 'completed').length}
                      </p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center">
                      <Wrench className="h-5 w-5 text-purple-600" />
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    {maintenanceRequests.filter(r => r.status === 'completed').length} completed
                  </p>
                </CardContent>
              </Card>

              <OnTimePaymentRate timeRange={timeRange} />
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Revenue Trend</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={revenueData}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="month" className="text-xs" />
                        <YAxis tickFormatter={(value) => `Rp${(value / 1000000).toFixed(0)}jt`} className="text-xs" />
                        <Tooltip 
                          formatter={(value: number) => [formatCurrency(value), 'Revenue']}
                          contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                        />
                        <Area type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" fill="hsl(var(--primary) / 0.2)" strokeWidth={2} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Occupancy by Property Type</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={occupancyByType} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis type="number" domain={[0, 100]} className="text-xs" />
                        <YAxis dataKey="name" type="category" width={100} className="text-xs capitalize" />
                        <Tooltip 
                          formatter={(value: number) => [`${value}%`, 'Occupancy']}
                          contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                        />
                        <Bar dataKey="occupancy" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
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
              <Card>
                <CardHeader>
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
                          {maintenanceByCategory.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Maintenance Trend</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={maintenanceTrend}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="month" className="text-xs" />
                        <YAxis className="text-xs" />
                        <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                        <Legend />
                        <Bar dataKey="pending" name="Pending" fill="hsl(var(--muted-foreground))" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="completed" name="Completed" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}