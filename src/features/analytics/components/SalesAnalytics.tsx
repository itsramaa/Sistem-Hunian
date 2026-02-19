import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { Alert, AlertDescription } from "@/shared/components/ui/alert";
import { 
  TrendingUp, 
  ShoppingCart, 
  Star, 
  Package,
  BarChart3,
  AlertTriangle
} from "lucide-react";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar
} from "recharts";
import { startOfMonth, subDays, format, eachDayOfInterval, isAfter, subMonths } from "date-fns";
import { formatCurrency } from "@/shared/utils/currency";

interface SalesAnalyticsProps {
  vendorId: string;
  dateRange?: '7d' | '30d' | '90d' | 'all';
}

export const SalesAnalytics = ({ vendorId, dateRange = '30d' }: SalesAnalyticsProps) => {
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

  // Fetch orders for the vendor
  const { data: orders = [], isLoading: ordersLoading, error: ordersError } = useQuery({
    queryKey: ["vendor-analytics-orders", vendorId, dateRange],
    queryFn: async () => {
      let query = supabase
        .from("orders")
        .select(`
          id,
          total_price,
          status,
          created_at,
          product_id,
          products (
            name
          )
        `)
        .eq("vendor_id", vendorId)
        .order("created_at", { ascending: false });

      if (dateFilter) {
        query = query.gte("created_at", dateFilter.toISOString());
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!vendorId,
  });

  // Fetch reviews for rating trend
  const { data: reviews = [], isLoading: reviewsLoading, error: reviewsError } = useQuery({
    queryKey: ["vendor-analytics-reviews", vendorId, dateRange],
    queryFn: async () => {
      let query = supabase
        .from("order_reviews")
        .select("rating, created_at")
        .eq("vendor_id", vendorId)
        .order("created_at", { ascending: false });

      if (dateFilter) {
        query = query.gte("created_at", dateFilter.toISOString());
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!vendorId,
  });

  const isLoading = ordersLoading || reviewsLoading;
  const hasError = ordersError || reviewsError;

  // Calculate stats
  const completedOrders = orders.filter(o => o.status === "completed");
  const totalRevenue = completedOrders.reduce((sum, o) => sum + o.total_price, 0);
  const thisMonthStart = startOfMonth(new Date());
  const thisMonthRevenue = completedOrders
    .filter(o => isAfter(new Date(o.created_at), thisMonthStart))
    .reduce((sum, o) => sum + o.total_price, 0);

  const orderCompletionRate = orders.length > 0 
    ? Math.round((completedOrders.length / orders.length) * 100) 
    : 0;

  const averageRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : "N/A";

  // Generate daily revenue data based on date range
  const getDaysToShow = () => {
    switch (dateRange) {
      case '7d': return 7;
      case '30d': return 30;
      case '90d': return 90;
      default: return 30;
    }
  };

  const daysToShow = getDaysToShow();
  const dateInterval = eachDayOfInterval({
    start: subDays(new Date(), daysToShow - 1),
    end: new Date()
  });

  const dailyRevenueData = dateInterval.map(day => {
    const dayOrders = completedOrders.filter(o => 
      format(new Date(o.created_at), "yyyy-MM-dd") === format(day, "yyyy-MM-dd")
    );
    return {
      date: format(day, daysToShow <= 7 ? "EEE" : "MMM d"),
      revenue: dayOrders.reduce((sum, o) => sum + o.total_price, 0) / 1000, // in thousands
      orders: dayOrders.length,
    };
  });

  // Top products by revenue
  const productRevenue = completedOrders.reduce((acc, order) => {
    const productName = order.products?.name || "Unknown";
    acc[productName] = (acc[productName] || 0) + order.total_price;
    return acc;
  }, {} as Record<string, number>);

  const topProducts = Object.entries(productRevenue)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([name, revenue]) => ({ name, revenue: revenue / 1000 }));

  if (hasError) {
    return (
      <Card>
        <CardContent className="pt-6">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Failed to load analytics data. Please try again.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Sales Analytics
        </CardTitle>
        <CardDescription>Track your sales performance and trends</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {isLoading ? (
            <>
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-24 rounded-lg" />
              ))}
            </>
          ) : (
            <>
              <div className="p-4 rounded-lg bg-primary/10">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  <span className="text-xs text-muted-foreground">Total Revenue</span>
                </div>
                <p className="text-lg font-bold">{formatCurrency(totalRevenue)}</p>
              </div>
              <div className="p-4 rounded-lg bg-success/10">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-4 w-4 text-success" />
                  <span className="text-xs text-muted-foreground">This Month</span>
                </div>
                <p className="text-lg font-bold">{formatCurrency(thisMonthRevenue)}</p>
              </div>
              <div className="p-4 rounded-lg bg-warning/10">
                <div className="flex items-center gap-2 mb-2">
                  <ShoppingCart className="h-4 w-4 text-warning" />
                  <span className="text-xs text-muted-foreground">Completion Rate</span>
                </div>
                <p className="text-lg font-bold">{orderCompletionRate}%</p>
              </div>
              <div className="p-4 rounded-lg bg-muted">
                <div className="flex items-center gap-2 mb-2">
                  <Star className="h-4 w-4 text-yellow-500" />
                  <span className="text-xs text-muted-foreground">Avg Rating</span>
                </div>
                <p className="text-lg font-bold">{averageRating} ⭐</p>
              </div>
            </>
          )}
        </div>

        <Tabs defaultValue="revenue" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="revenue">Revenue Trend</TabsTrigger>
            <TabsTrigger value="products">Top Products</TabsTrigger>
          </TabsList>

          <TabsContent value="revenue" className="pt-4">
            <div className="h-[200px]">
              {isLoading ? (
                <Skeleton className="h-full w-full" />
              ) : dailyRevenueData.some(d => d.revenue > 0) ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={dailyRevenueData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="date" className="text-xs" />
                    <YAxis className="text-xs" tickFormatter={(v) => `${v}k`} />
                    <Tooltip 
                      formatter={(value: number) => [formatCurrency(value * 1000), "Revenue"]}
                      labelFormatter={(label) => `Day: ${label}`}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="revenue" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={2}
                      dot={{ fill: "hsl(var(--primary))" }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <BarChart3 className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No sales data yet</p>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="products" className="pt-4">
            {isLoading ? (
              <Skeleton className="h-[200px] w-full" />
            ) : topProducts.length > 0 ? (
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topProducts} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis type="number" className="text-xs" tickFormatter={(v) => `${v}k`} />
                    <YAxis type="category" dataKey="name" className="text-xs" width={100} />
                    <Tooltip 
                      formatter={(value: number) => [formatCurrency(value * 1000), "Revenue"]}
                    />
                    <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No product sales yet</p>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};