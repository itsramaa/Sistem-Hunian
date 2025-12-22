import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { MerchantLayout } from '@/components/layouts/MerchantLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useState } from 'react';
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
import { TrendingUp, TrendingDown, Building2, Users, DollarSign, Wrench } from 'lucide-react';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';

const COLORS = ['hsl(var(--primary))', 'hsl(var(--accent))', 'hsl(var(--muted))', '#10b981', '#f59e0b'];

export default function MerchantReports() {
  const { merchant } = useAuth();
  const [timeRange, setTimeRange] = useState('6');

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

  // Fetch payments
  const { data: payments = [] } = useQuery({
    queryKey: ['payment-analytics', merchant?.id, timeRange],
    queryFn: async () => {
      if (!merchant?.id) return [];
      const startDate = subMonths(new Date(), parseInt(timeRange));
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('merchant_id', merchant.id)
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!merchant?.id,
  });

  // Fetch maintenance requests
  const { data: maintenanceRequests = [] } = useQuery({
    queryKey: ['maintenance-analytics', merchant?.id, timeRange],
    queryFn: async () => {
      if (!merchant?.id) return [];
      const startDate = subMonths(new Date(), parseInt(timeRange));
      const { data, error } = await supabase
        .from('maintenance_requests')
        .select('*')
        .eq('merchant_id', merchant.id)
        .gte('created_at', startDate.toISOString());
      if (error) throw error;
      return data;
    },
    enabled: !!merchant?.id,
  });

  // Calculate stats
  const totalUnits = properties.reduce((sum, p) => sum + (p.units?.length || 0), 0);
  const occupiedUnits = properties.reduce(
    (sum, p) => sum + (p.units?.filter((u: { status: string }) => u.status === 'occupied').length || 0),
    0
  );
  const occupancyRate = totalUnits > 0 ? Math.round((occupiedUnits / totalUnits) * 100) : 0;

  const totalRevenue = payments
    .filter(p => p.status === 'paid')
    .reduce((sum, p) => sum + Number(p.amount), 0);

  const pendingPayments = payments
    .filter(p => p.status === 'pending')
    .reduce((sum, p) => sum + Number(p.amount), 0);

  // Generate monthly revenue data
  const getMonthlyRevenueData = () => {
    const months: { [key: string]: number } = {};
    const numMonths = parseInt(timeRange);
    
    for (let i = numMonths - 1; i >= 0; i--) {
      const date = subMonths(new Date(), i);
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
  };

  // Occupancy by property type
  const getOccupancyByType = () => {
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
  };

  // Maintenance by category
  const getMaintenanceByCategory = () => {
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
  };

  // Maintenance trend
  const getMaintenanceTrend = () => {
    const months: { [key: string]: { pending: number; completed: number } } = {};
    const numMonths = parseInt(timeRange);
    
    for (let i = numMonths - 1; i >= 0; i--) {
      const date = subMonths(new Date(), i);
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
  };

  const revenueData = getMonthlyRevenueData();
  const occupancyByType = getOccupancyByType();
  const maintenanceByCategory = getMaintenanceByCategory();
  const maintenanceTrend = getMaintenanceTrend();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 0,
    }).format(value);
  };

  return (
    <MerchantLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-display font-bold">Reports & Analytics</h1>
            <p className="text-muted-foreground">Track your property performance</p>
          </div>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="3">Last 3 months</SelectItem>
              <SelectItem value="6">Last 6 months</SelectItem>
              <SelectItem value="12">Last 12 months</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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
              <div className="flex items-center gap-1 mt-2 text-sm text-green-600">
                <TrendingUp className="h-4 w-4" />
                <span>+12% from last period</span>
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
        </div>

        {/* Charts */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Revenue Chart */}
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
                    <YAxis 
                      tickFormatter={(value) => `R${(value / 1000).toFixed(0)}k`}
                      className="text-xs"
                    />
                    <Tooltip 
                      formatter={(value: number) => [formatCurrency(value), 'Revenue']}
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="revenue" 
                      stroke="hsl(var(--primary))" 
                      fill="hsl(var(--primary) / 0.2)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Occupancy by Type */}
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
                      formatter={(value: number, name: string) => [`${value}%`, 'Occupancy']}
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                    <Bar dataKey="occupancy" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Maintenance by Category */}
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
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Maintenance Trend */}
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
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                    <Legend />
                    <Bar dataKey="pending" name="Pending" fill="hsl(var(--muted-foreground))" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="completed" name="Completed" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MerchantLayout>
  );
}
