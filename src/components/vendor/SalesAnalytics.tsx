import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingUp, 
  ShoppingCart, 
  Star, 
  Package,
  BarChart3
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
import { startOfMonth, startOfWeek, subDays, format, eachDayOfInterval, isAfter } from "date-fns";

interface SalesAnalyticsProps {
  vendorId: string;
}

export const SalesAnalytics = ({ vendorId }: SalesAnalyticsProps) => {
  // Fetch orders for the vendor
  const { data: orders = [] } = useQuery({
    queryKey: ["vendor-analytics-orders", vendorId],
    queryFn: async () => {
      const { data, error } = await supabase
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

      if (error) throw error;
      return data;
    },
    enabled: !!vendorId,
  });

  // Fetch reviews for rating trend
  const { data: reviews = [] } = useQuery({
    queryKey: ["vendor-analytics-reviews", vendorId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("order_reviews")
        .select("rating, created_at")
        .eq("vendor_id", vendorId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!vendorId,
  });

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

  // Generate daily revenue data for last 7 days
  const last7Days = eachDayOfInterval({
    start: subDays(new Date(), 6),
    end: new Date()
  });

  const dailyRevenueData = last7Days.map(day => {
    const dayOrders = completedOrders.filter(o => 
      format(new Date(o.created_at), "yyyy-MM-dd") === format(day, "yyyy-MM-dd")
    );
    return {
      date: format(day, "EEE"),
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

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
        </div>

        <Tabs defaultValue="revenue" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="revenue">Revenue Trend</TabsTrigger>
            <TabsTrigger value="products">Top Products</TabsTrigger>
          </TabsList>

          <TabsContent value="revenue" className="pt-4">
            <div className="h-[200px]">
              {dailyRevenueData.some(d => d.revenue > 0) ? (
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
            {topProducts.length > 0 ? (
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