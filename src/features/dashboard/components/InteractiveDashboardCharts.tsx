import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, AreaChart, Area
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { TrendingUp, TrendingDown, DollarSign, Home, Users, ArrowUpRight } from 'lucide-react';
import { supabase } from '@/lib/integrations/supabase/client';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { format, subMonths, startOfMonth, endOfMonth, eachMonthOfInterval } from 'date-fns';
import { cn, formatLabel } from '@/shared/utils/utils';

interface InteractiveDashboardChartsProps {
  className?: string;
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--success))', 'hsl(var(--warning))', 'hsl(var(--destructive))', 'hsl(var(--muted-foreground))'];

export function InteractiveDashboardCharts({ className }: InteractiveDashboardChartsProps) {
  const { merchant } = useAuth();
  const [timeRange, setTimeRange] = useState<'6m' | '12m' | 'all'>('6m');
  const [selectedMetric, setSelectedMetric] = useState<string | null>(null);

  const dateRange = useMemo(() => {
    const now = new Date();
    const months = timeRange === '6m' ? 6 : timeRange === '12m' ? 12 : 24;
    return { start: startOfMonth(subMonths(now, months - 1)), end: endOfMonth(now) };
  }, [timeRange]);

  const { data: revenueData = [] } = useQuery({
    queryKey: ['revenue-chart', merchant?.id, timeRange],
    queryFn: async () => {
      if (!merchant?.id) return [];
      const { data: payments } = await supabase
        .from('payments').select('amount, paid_at, status')
        .eq('merchant_id', merchant.id).eq('status', 'paid')
        .gte('paid_at', dateRange.start.toISOString()).lte('paid_at', dateRange.end.toISOString());
      const months = eachMonthOfInterval({ start: dateRange.start, end: dateRange.end });
      return months.map(month => {
        const monthPayments = payments?.filter(p => {
          const paidDate = new Date(p.paid_at!);
          return paidDate.getMonth() === month.getMonth() && paidDate.getFullYear() === month.getFullYear();
        }) || [];
        return { month: format(month, 'MMM yyyy'), revenue: monthPayments.reduce((sum, p) => sum + Number(p.amount), 0), count: monthPayments.length };
      });
    },
    enabled: !!merchant?.id,
  });

  const { data: occupancyData = [] } = useQuery({
    queryKey: ['occupancy-chart', merchant?.id],
    queryFn: async () => {
      if (!merchant?.id) return [];
      const { data: properties } = await supabase.from('properties').select('id, name, total_units, occupied_units').eq('merchant_id', merchant.id);
      return properties?.map(p => ({
        name: p.name.length > 15 ? p.name.substring(0, 15) + '...' : p.name,
        fullName: p.name, occupied: p.occupied_units || 0,
        vacant: (p.total_units || 0) - (p.occupied_units || 0), total: p.total_units || 0,
        rate: p.total_units > 0 ? Math.round(((p.occupied_units || 0) / p.total_units) * 100) : 0,
      })) || [];
    },
    enabled: !!merchant?.id,
  });

  const { data: paymentStatusData = [] } = useQuery({
    queryKey: ['payment-status-chart', merchant?.id],
    queryFn: async () => {
      if (!merchant?.id) return [];
      const { data: payments } = await supabase.from('payments').select('status, amount').eq('merchant_id', merchant.id).gte('created_at', dateRange.start.toISOString());
      const statusMap = new Map<string, { count: number; amount: number }>();
      payments?.forEach(p => {
        const existing = statusMap.get(p.status) || { count: 0, amount: 0 };
        statusMap.set(p.status, { count: existing.count + 1, amount: existing.amount + Number(p.amount) });
      });
      return Array.from(statusMap.entries()).map(([status, data]) => ({
        name: formatLabel(status), value: data.count, amount: data.amount,
      }));
    },
    enabled: !!merchant?.id,
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0, notation: 'compact' }).format(value);
  };

  const revenueTrend = useMemo(() => {
    if (revenueData.length < 2) return 0;
    const current = revenueData[revenueData.length - 1]?.revenue || 0;
    const previous = revenueData[revenueData.length - 2]?.revenue || 1;
    return Math.round(((current - previous) / previous) * 100);
  }, [revenueData]);

  const totalRevenue = revenueData.reduce((sum, d) => sum + d.revenue, 0);
  const avgOccupancy = occupancyData.length > 0 ? Math.round(occupancyData.reduce((sum, d) => sum + d.rate, 0) / occupancyData.length) : 0;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-popover/95 backdrop-blur-sm border border-border/40 rounded-xl shadow-lg p-3" role="tooltip">
        <p className="font-medium mb-1">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} style={{ color: entry.color }} className="text-sm">
            {entry.name === 'Revenue' ? 'Pendapatan' : entry.name === 'Occupied' ? 'Terisi' : entry.name === 'Vacant' ? 'Kosong' : entry.name}: {entry.name === 'Revenue' ? formatCurrency(entry.value) : entry.value}
          </p>
        ))}
      </div>
    );
  };

  return (
    <div className={cn("space-y-6", className)} role="region" aria-label="Grafik Analitik Performa">
      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card 
          className={cn(
            "bg-card/90 backdrop-blur-sm rounded-2xl border border-border/40 cursor-pointer transition-all hover:shadow-md",
            selectedMetric === 'revenue' && "ring-2 ring-primary"
          )}
          onClick={() => setSelectedMetric(selectedMetric === 'revenue' ? null : 'revenue')}
          role="button"
          aria-pressed={selectedMetric === 'revenue'}
          aria-label="Filter grafik berdasarkan Total Pendapatan"
        >
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center" aria-hidden="true">
                <DollarSign className="h-5 w-5 text-primary" />
              </div>
              {revenueTrend !== 0 && (
                <Badge variant={revenueTrend > 0 ? 'default' : 'destructive'} className="rounded-full gap-1">
                  {revenueTrend > 0 ? <TrendingUp className="h-3 w-3" aria-hidden="true" /> : <TrendingDown className="h-3 w-3" aria-hidden="true" />}
                  {Math.abs(revenueTrend)}%
                </Badge>
              )}
            </div>
            <p className="text-2xl font-bold mt-2">{formatCurrency(totalRevenue)}</p>
            <p className="text-sm text-muted-foreground">Total Pendapatan</p>
          </CardContent>
        </Card>

        <Card 
          className={cn(
            "bg-card/90 backdrop-blur-sm rounded-2xl border border-border/40 cursor-pointer transition-all hover:shadow-md",
            selectedMetric === 'occupancy' && "ring-2 ring-primary"
          )}
          onClick={() => setSelectedMetric(selectedMetric === 'occupancy' ? null : 'occupancy')}
          role="button"
          aria-pressed={selectedMetric === 'occupancy'}
          aria-label="Filter grafik berdasarkan Rata-rata Hunian"
        >
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-success/20 to-success/5 flex items-center justify-center" aria-hidden="true">
                <Home className="h-5 w-5 text-success" />
              </div>
              <Badge variant="secondary" className="rounded-full">{occupancyData.length} properti</Badge>
            </div>
            <p className="text-2xl font-bold mt-2">{avgOccupancy}%</p>
            <p className="text-sm text-muted-foreground">Rata-rata Hunian</p>
          </CardContent>
        </Card>

        <Card 
          className={cn(
            "bg-card/90 backdrop-blur-sm rounded-2xl border border-border/40 cursor-pointer transition-all hover:shadow-md",
            selectedMetric === 'payments' && "ring-2 ring-primary"
          )}
          onClick={() => setSelectedMetric(selectedMetric === 'payments' ? null : 'payments')}
          role="button"
          aria-pressed={selectedMetric === 'payments'}
          aria-label="Filter grafik berdasarkan Total Pembayaran"
        >
          <CardContent className="pt-6">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-warning/20 to-warning/5 flex items-center justify-center" aria-hidden="true">
              <Users className="h-5 w-5 text-warning" />
            </div>
            <p className="text-2xl font-bold mt-2">
              {revenueData.reduce((sum, d) => sum + d.count, 0)}
            </p>
            <p className="text-sm text-muted-foreground">Total Pembayaran</p>
          </CardContent>
        </Card>

        <Card className="bg-card/90 backdrop-blur-sm rounded-2xl border border-border/40">
          <CardContent className="pt-6">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-accent/20 to-accent/5 flex items-center justify-center" aria-hidden="true">
              <ArrowUpRight className="h-5 w-5 text-accent" />
            </div>
            <p className="text-2xl font-bold mt-2">
              {formatCurrency(revenueData[revenueData.length - 1]?.revenue || 0)}
            </p>
            <p className="text-sm text-muted-foreground">Bulan Ini</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="revenue" className="space-y-4">
        <div className="flex items-center justify-between">
          <TabsList className="rounded-full bg-card/80 backdrop-blur-sm border border-border/40 p-1">
            <TabsTrigger value="revenue" className="rounded-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Pendapatan</TabsTrigger>
            <TabsTrigger value="occupancy" className="rounded-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Hunian</TabsTrigger>
            <TabsTrigger value="status" className="rounded-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Status Pembayaran</TabsTrigger>
          </TabsList>
          <Select value={timeRange} onValueChange={(v: any) => setTimeRange(v)}>
            <SelectTrigger className="w-40 rounded-xl bg-background/60 border-border/50" aria-label="Pilih rentang waktu">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="6m">6 bulan terakhir</SelectItem>
              <SelectItem value="12m">12 bulan terakhir</SelectItem>
              <SelectItem value="all">Semua waktu</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <TabsContent value="revenue">
          <Card className="bg-card/90 backdrop-blur-sm rounded-2xl border border-border/40">
            <CardHeader>
              <CardTitle>Tren Pendapatan</CardTitle>
              <CardDescription>Pendapatan bulanan dari waktu ke waktu</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={revenueData}>
                    <defs>
                      <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="month" className="text-xs" />
                    <YAxis tickFormatter={formatCurrency} className="text-xs" />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="revenue" name="Revenue" stroke="hsl(var(--primary))" fill="url(#revenueGradient)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="occupancy">
          <Card className="bg-card/90 backdrop-blur-sm rounded-2xl border border-border/40">
            <CardHeader>
              <CardTitle>Hunian Properti</CardTitle>
              <CardDescription>Unit terisi vs kosong per properti</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={occupancyData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={100} className="text-xs" />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend formatter={(value) => value === 'Occupied' ? 'Terisi' : 'Kosong'} />
                    <Bar dataKey="occupied" name="Occupied" stackId="a" fill="hsl(var(--success))" />
                    <Bar dataKey="vacant" name="Vacant" stackId="a" fill="hsl(var(--muted-foreground))" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="status">
          <Card className="bg-card/90 backdrop-blur-sm rounded-2xl border border-border/40">
            <CardHeader>
              <CardTitle>Distribusi Status Pembayaran</CardTitle>
              <CardDescription>Rincian status pembayaran tagihan</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={paymentStatusData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={2} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                      {paymentStatusData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}