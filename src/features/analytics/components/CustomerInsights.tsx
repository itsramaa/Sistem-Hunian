import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { Alert, AlertDescription } from "@/shared/components/ui/alert";
import { Users, ShoppingCart, Clock, MapPin, TrendingUp, Repeat, AlertTriangle } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { subDays } from "date-fns";
import { formatCurrency } from "@/shared/utils/currency";

interface CustomerInsightsProps {
  vendorId: string;
  dateRange?: '7d' | '30d' | '90d' | 'all';
}

const COLORS = ["hsl(var(--primary))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];

export function CustomerInsights({ vendorId, dateRange = '30d' }: CustomerInsightsProps) {
  // Calculate date filter
  const getDateFilter = () => {
    const now = new Date();
    switch (dateRange) {
      case '7d':
        return subDays(now, 7);
      case '30d':
        return subDays(now, 30);
      case '90d':
        return subDays(now, 90);
      default:
        return null;
    }
  };

  const dateFilter = getDateFilter();

  // Fetch orders data for analytics
  const { data: ordersData, isLoading, error } = useQuery({
    queryKey: ["vendor-customer-insights", vendorId, dateRange],
    queryFn: async () => {
      let query = supabase
        .from("orders")
        .select(`
          id,
          tenant_user_id,
          total_price,
          created_at,
          status,
          scheduled_date,
          unit_id,
          units (
            properties (
              city
            )
          )
        `)
        .eq("vendor_id", vendorId)
        .eq("status", "completed");

      if (dateFilter) {
        query = query.gte("created_at", dateFilter.toISOString());
      }

      const { data, error } = await query;
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!vendorId,
  });

  // Calculate insights
  const insights = (() => {
    if (!ordersData || ordersData.length === 0) {
      return {
        repeatCustomerRate: 0,
        avgOrderValue: 0,
        totalCustomers: 0,
        repeatCustomers: 0,
        locationData: [],
        peakHours: [],
        peakDays: [],
      };
    }

    // Count orders per customer
    const customerOrders: Record<string, number> = {};
    ordersData.forEach(order => {
      customerOrders[order.tenant_user_id] = (customerOrders[order.tenant_user_id] || 0) + 1;
    });

    const totalCustomers = Object.keys(customerOrders).length;
    const repeatCustomers = Object.values(customerOrders).filter(count => count > 1).length;
    const repeatCustomerRate = totalCustomers > 0 ? (repeatCustomers / totalCustomers) * 100 : 0;

    // Average order value
    const totalRevenue = ordersData.reduce((sum, order) => sum + (order.total_price || 0), 0);
    const avgOrderValue = ordersData.length > 0 ? totalRevenue / ordersData.length : 0;

    // Location distribution
    const locationCounts: Record<string, number> = {};
    ordersData.forEach(order => {
      const city = (order as any).units?.properties?.city || "Unknown";
      locationCounts[city] = (locationCounts[city] || 0) + 1;
    });
    const locationData = Object.entries(locationCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    // Peak hours
    const hourCounts: Record<number, number> = {};
    ordersData.forEach(order => {
      const hour = new Date(order.created_at).getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });
    const peakHours = Array.from({ length: 24 }, (_, i) => ({
      hour: `${i}:00`,
      orders: hourCounts[i] || 0,
    })).filter(h => h.orders > 0);

    // Peak days
    const dayCounts: Record<string, number> = {};
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    ordersData.forEach(order => {
      const day = dayNames[new Date(order.created_at).getDay()];
      dayCounts[day] = (dayCounts[day] || 0) + 1;
    });
    const peakDays = dayNames.map(name => ({
      name,
      orders: dayCounts[name] || 0,
    }));

    return {
      repeatCustomerRate,
      avgOrderValue,
      totalCustomers,
      repeatCustomers,
      locationData,
      peakHours,
      peakDays,
    };
  })();

  const stats = [
    {
      title: "Total Customers",
      value: insights.totalCustomers,
      icon: Users,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      title: "Repeat Customers",
      value: `${insights.repeatCustomerRate.toFixed(1)}%`,
      subtitle: `${insights.repeatCustomers} of ${insights.totalCustomers}`,
      icon: Repeat,
      color: "text-success",
      bgColor: "bg-success/10",
    },
    {
      title: "Avg Order Value",
      value: formatCurrency(insights.avgOrderValue),
      icon: ShoppingCart,
      color: "text-chart-2",
      bgColor: "bg-chart-2/10",
    },
    {
      title: "Total Orders",
      value: ordersData?.length || 0,
      icon: TrendingUp,
      color: "text-warning",
      bgColor: "bg-warning/10",
    },
  ];

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold">Customer Insights</h2>
          <p className="text-sm text-muted-foreground">Understand your customer behavior and patterns</p>
        </div>
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Failed to load customer insights. Please try again.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Customer Insights</h2>
        <p className="text-sm text-muted-foreground">Understand your customer behavior and patterns</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {isLoading ? (
          <>
            {[...Array(4)].map((_, i) => (
              <Card key={i}>
                <CardHeader className="pb-2">
                  <Skeleton className="h-4 w-24" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-20" />
                </CardContent>
              </Card>
            ))}
          </>
        ) : (
          stats.map((stat) => (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <stat.icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                {stat.subtitle && (
                  <p className="text-xs text-muted-foreground mt-1">{stat.subtitle}</p>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Charts Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Peak Days */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Orders by Day
            </CardTitle>
            <CardDescription>When your customers order</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[200px] w-full" />
            ) : insights.peakDays.some(d => d.orders > 0) ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={insights.peakDays}>
                  <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Bar 
                    dataKey="orders" 
                    fill="hsl(var(--primary))" 
                    radius={[4, 4, 0, 0]} 
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                No order data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Location Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Customer Locations
            </CardTitle>
            <CardDescription>Where your orders come from</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[200px] w-full" />
            ) : insights.locationData.length > 0 ? (
              <div className="flex items-center gap-4">
                <ResponsiveContainer width="50%" height={200}>
                  <PieChart>
                    <Pie
                      data={insights.locationData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={70}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {insights.locationData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex-1 space-y-2">
                  {insights.locationData.map((loc, index) => (
                    <div key={loc.name} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div 
                          className="h-3 w-3 rounded-full" 
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <span className="truncate">{loc.name}</span>
                      </div>
                      <span className="font-medium">{loc.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                No location data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}