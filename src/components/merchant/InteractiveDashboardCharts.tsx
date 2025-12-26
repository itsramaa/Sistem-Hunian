import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend,
  AreaChart,
  Area
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TrendingUp, TrendingDown, DollarSign, Home, Users, ArrowUpRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { format, subMonths, startOfMonth, endOfMonth, eachMonthOfInterval } from 'date-fns';
import { cn } from '@/lib/utils';

interface InteractiveDashboardChartsProps {
  className?: string;
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--success))', 'hsl(var(--warning))', 'hsl(var(--destructive))', 'hsl(var(--muted-foreground))'];

export function InteractiveDashboardCharts({ className }: InteractiveDashboardChartsProps) {
  const { merchant } = useAuth();
  const [timeRange, setTimeRange] = useState<'6m' | '12m' | 'all'>('6m');
  const [selectedMetric, setSelectedMetric] = useState<string | null>(null);

  // Calculate date range
  const dateRange = useMemo(() => {
    const now = new Date();
    const months = timeRange === '6m' ? 6 : timeRange === '12m' ? 12 : 24;
    return {
      start: startOfMonth(subMonths(now, months - 1)),
      end: endOfMonth(now),
    };
  }, [timeRange]);

  // Fetch revenue data
  const { data: revenueData = [] } = useQuery({
    queryKey: ['revenue-chart', merchant?.id, timeRange],
    queryFn: async () => {
      if (!merchant?.id) return [];
      
      const { data: payments } = await supabase
        .from('payments')
        .select('amount, paid_at, status')
        .eq('merchant_id', merchant.id)
        .eq('status', 'paid')
        .gte('paid_at', dateRange.start.toISOString())
        .lte('paid_at', dateRange.end.toISOString());

      // Group by month
      const months = eachMonthOfInterval({ start: dateRange.start, end: dateRange.end });
      
      return months.map(month => {
        const monthPayments = payments?.filter(p => {
          const paidDate = new Date(p.paid_at!);
          return paidDate.getMonth() === month.getMonth() && 
                 paidDate.getFullYear() === month.getFullYear();
        }) || [];
        
        return {
          month: format(month, 'MMM yyyy'),
          revenue: monthPayments.reduce((sum, p) => sum + Number(p.amount), 0),
          count: monthPayments.length,
        };
      });
    },
    enabled: !!merchant?.id,
  });

  // Fetch occupancy data
  const { data: occupancyData = [] } = useQuery({
    queryKey: ['occupancy-chart', merchant?.id],
    queryFn: async () => {
      if (!merchant?.id) return [];
      
      const { data: properties } = await supabase
        .from('properties')
        .select('id, name, total_units, occupied_units')
        .eq('merchant_id', merchant.id);

      return properties?.map(p => ({
        name: p.name.length > 15 ? p.name.substring(0, 15) + '...' : p.name,
        fullName: p.name,
        occupied: p.occupied_units || 0,
        vacant: (p.total_units || 0) - (p.occupied_units || 0),
        total: p.total_units || 0,
        rate: p.total_units > 0 ? Math.round(((p.occupied_units || 0) / p.total_units) * 100) : 0,
      })) || [];
    },
    enabled: !!merchant?.id,
  });

  // Payment status distribution
  const { data: paymentStatusData = [] } = useQuery({
    queryKey: ['payment-status-chart', merchant?.id],
    queryFn: async () => {
      if (!merchant?.id) return [];
      
      const { data: payments } = await supabase
        .from('payments')
        .select('status, amount')
        .eq('merchant_id', merchant.id)
        .gte('created_at', dateRange.start.toISOString());

      const statusMap = new Map<string, { count: number; amount: number }>();
      
      payments?.forEach(p => {
        const existing = statusMap.get(p.status) || { count: 0, amount: 0 };
        statusMap.set(p.status, {
          count: existing.count + 1,
          amount: existing.amount + Number(p.amount),
        });
      });

      return Array.from(statusMap.entries()).map(([status, data]) => ({
        name: status.charAt(0).toUpperCase() + status.slice(1),
        value: data.count,
        amount: data.amount,
      }));
    },
    enabled: !!merchant?.id,
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      notation: 'compact',
    }).format(value);
  };

  // Calculate trends
  const revenueTrend = useMemo(() => {
    if (revenueData.length < 2) return 0;
    const current = revenueData[revenueData.length - 1]?.revenue || 0;
    const previous = revenueData[revenueData.length - 2]?.revenue || 1;
    return Math.round(((current - previous) / previous) * 100);
  }, [revenueData]);

  const totalRevenue = revenueData.reduce((sum, d) => sum + d.revenue, 0);
  const avgOccupancy = occupancyData.length > 0 
    ? Math.round(occupancyData.reduce((sum, d) => sum + d.rate, 0) / occupancyData.length)
    : 0;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;

    return (
      <div className="bg-popover border rounded-lg shadow-lg p-3">
        <p className="font-medium mb-1">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} style={{ color: entry.color }} className="text-sm">
            {entry.name}: {entry.name === 'Revenue' ? formatCurrency(entry.value) : entry.value}
          </p>
        ))}
      </div>
    );
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card 
          className={cn(
            "cursor-pointer transition-all hover:shadow-md",
            selectedMetric === 'revenue' && "ring-2 ring-primary"
          )}
          onClick={() => setSelectedMetric(selectedMetric === 'revenue' ? null : 'revenue')}
        >
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <DollarSign className="h-8 w-8 text-primary" />
              {revenueTrend !== 0 && (
                <Badge variant={revenueTrend > 0 ? 'default' : 'destructive'} className="gap-1">
                  {revenueTrend > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  {Math.abs(revenueTrend)}%
                </Badge>
              )}
            </div>
            <p className="text-2xl font-bold mt-2">{formatCurrency(totalRevenue)}</p>
            <p className="text-sm text-muted-foreground">Total Revenue</p>
          </CardContent>
        </Card>

        <Card 
          className={cn(
            "cursor-pointer transition-all hover:shadow-md",
            selectedMetric === 'occupancy' && "ring-2 ring-primary"
          )}
          onClick={() => setSelectedMetric(selectedMetric === 'occupancy' ? null : 'occupancy')}
        >
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <Home className="h-8 w-8 text-success" />
              <Badge variant="secondary">{occupancyData.length} properties</Badge>
            </div>
            <p className="text-2xl font-bold mt-2">{avgOccupancy}%</p>
            <p className="text-sm text-muted-foreground">Avg Occupancy</p>
          </CardContent>
        </Card>

        <Card 
          className={cn(
            "cursor-pointer transition-all hover:shadow-md",
            selectedMetric === 'payments' && "ring-2 ring-primary"
          )}
          onClick={() => setSelectedMetric(selectedMetric === 'payments' ? null : 'payments')}
        >
          <CardContent className="pt-6">
            <Users className="h-8 w-8 text-warning" />
            <p className="text-2xl font-bold mt-2">
              {revenueData.reduce((sum, d) => sum + d.count, 0)}
            </p>
            <p className="text-sm text-muted-foreground">Total Payments</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <ArrowUpRight className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-2xl font-bold mt-2">
              {formatCurrency(revenueData[revenueData.length - 1]?.revenue || 0)}
            </p>
            <p className="text-sm text-muted-foreground">This Month</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="revenue" className="space-y-4">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="revenue">Revenue</TabsTrigger>
            <TabsTrigger value="occupancy">Occupancy</TabsTrigger>
            <TabsTrigger value="status">Payment Status</TabsTrigger>
          </TabsList>
          <Select value={timeRange} onValueChange={(v: any) => setTimeRange(v)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="6m">Last 6 months</SelectItem>
              <SelectItem value="12m">Last 12 months</SelectItem>
              <SelectItem value="all">All time</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <TabsContent value="revenue">
          <Card>
            <CardHeader>
              <CardTitle>Revenue Trend</CardTitle>
              <CardDescription>Monthly revenue over time</CardDescription>
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
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      name="Revenue"
                      stroke="hsl(var(--primary))"
                      fill="url(#revenueGradient)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="occupancy">
          <Card>
            <CardHeader>
              <CardTitle>Property Occupancy</CardTitle>
              <CardDescription>Occupied vs vacant units by property</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={occupancyData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={100} className="text-xs" />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Bar dataKey="occupied" name="Occupied" stackId="a" fill="hsl(var(--success))" />
                    <Bar dataKey="vacant" name="Vacant" stackId="a" fill="hsl(var(--muted-foreground))" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="status">
          <Card>
            <CardHeader>
              <CardTitle>Payment Status Distribution</CardTitle>
              <CardDescription>Breakdown of payment statuses</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={paymentStatusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                    >
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
