import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AdminLayout } from "@/components/layouts/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { supabase } from "@/integrations/supabase/client";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { BarChart, Bar, XAxis, YAxis, PieChart, Pie, Cell, AreaChart, Area, LineChart, Line } from "recharts";
import { 
  ShoppingCart, 
  Package, 
  TrendingUp, 
  AlertTriangle, 
  Search, 
  Loader2,
  DollarSign,
  Star,
  Clock,
  CheckCircle
} from "lucide-react";

const AdminOrders = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: async () => {
      const [ordersRes, vendorsRes, reviewsRes] = await Promise.all([
        supabase
          .from("orders")
          .select("*, products(name, vendor_id), vendors(business_name)")
          .order("created_at", { ascending: false }),
        supabase.from("vendors").select("id, business_name, rating, total_jobs, verification_status"),
        supabase.from("order_reviews").select("*"),
      ]);

      return {
        orders: ordersRes.data || [],
        vendors: vendorsRes.data || [],
        reviews: reviewsRes.data || [],
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

  const orders = data?.orders || [];
  const vendors = data?.vendors || [];
  const reviews = data?.reviews || [];

  // Calculate stats
  const totalOrders = orders.length;
  const completedOrders = orders.filter((o) => o.status === "completed").length;
  const pendingOrders = orders.filter((o) => o.status === "pending").length;
  const canceledOrders = orders.filter((o) => o.status === "canceled").length;
  const totalRevenue = orders
    .filter((o) => o.status === "completed")
    .reduce((sum, o) => sum + Number(o.total_price), 0);
  const totalServiceFees = orders
    .filter((o) => o.status === "completed")
    .reduce((sum, o) => sum + Number(o.service_fee || 0), 0);

  // Order status distribution
  const orderStatusData = [
    { name: "Pending", value: pendingOrders, fill: "hsl(var(--warning))" },
    { name: "Confirmed", value: orders.filter((o) => o.status === "confirmed").length, fill: "hsl(var(--info))" },
    { name: "In Progress", value: orders.filter((o) => o.status === "in_progress").length, fill: "hsl(var(--primary))" },
    { name: "Completed", value: completedOrders, fill: "hsl(var(--success))" },
    { name: "Canceled", value: canceledOrders, fill: "hsl(var(--destructive))" },
  ];

  // Monthly order trend
  const getMonthlyOrderData = () => {
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const date = subMonths(new Date(), i);
      const monthStart = startOfMonth(date);
      const monthEnd = endOfMonth(date);

      const monthOrders = orders.filter((o) => {
        const createdAt = new Date(o.created_at);
        return createdAt >= monthStart && createdAt <= monthEnd;
      });

      const monthRevenue = monthOrders
        .filter((o) => o.status === "completed")
        .reduce((sum, o) => sum + Number(o.total_price), 0);

      months.push({
        month: format(date, "MMM"),
        orders: monthOrders.length,
        revenue: monthRevenue,
      });
    }
    return months;
  };

  const monthlyData = getMonthlyOrderData();

  // Top vendors by orders
  const vendorOrderCounts: Record<string, { name: string; orders: number; revenue: number; rating: number }> = {};
  orders.forEach((order) => {
    const vendorId = order.vendor_id;
    const vendor = vendors.find((v) => v.id === vendorId);
    if (!vendorOrderCounts[vendorId]) {
      vendorOrderCounts[vendorId] = {
        name: vendor?.business_name || "Unknown",
        orders: 0,
        revenue: 0,
        rating: vendor?.rating || 0,
      };
    }
    vendorOrderCounts[vendorId].orders++;
    if (order.status === "completed") {
      vendorOrderCounts[vendorId].revenue += Number(order.total_price);
    }
  });

  const topVendors = Object.values(vendorOrderCounts)
    .sort((a, b) => b.orders - a.orders)
    .slice(0, 5);

  // Filter orders
  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (order.vendors as any)?.business_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      pending: "secondary",
      confirmed: "outline",
      in_progress: "default",
      completed: "default",
      canceled: "destructive",
    };
    const colors: Record<string, string> = {
      pending: "bg-warning/10 text-warning border-warning/20",
      confirmed: "bg-info/10 text-info border-info/20",
      in_progress: "bg-primary/10 text-primary border-primary/20",
      completed: "bg-success/10 text-success border-success/20",
      canceled: "bg-destructive/10 text-destructive border-destructive/20",
    };
    return (
      <Badge variant="outline" className={colors[status] || ""}>
        {status.replace("_", " ")}
      </Badge>
    );
  };

  const chartConfig = {
    orders: { label: "Orders", color: "hsl(var(--primary))" },
    revenue: { label: "Revenue", color: "hsl(var(--success))" },
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <ShoppingCart className="h-8 w-8 text-primary" />
            Vendor Order Monitoring
          </h1>
          <p className="text-muted-foreground">Monitor marketplace orders and vendor performance</p>
        </div>

        <Tabs defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="vendors">Vendor Performance</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6 mt-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Package className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Orders</p>
                      <p className="text-xl font-bold">{totalOrders}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-success/10">
                      <DollarSign className="h-5 w-5 text-success" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total GMV</p>
                      <p className="text-xl font-bold">{formatCurrency(totalRevenue)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-info/10">
                      <TrendingUp className="h-5 w-5 text-info" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Platform Fees</p>
                      <p className="text-xl font-bold">{formatCurrency(totalServiceFees)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-warning/10">
                      <Clock className="h-5 w-5 text-warning" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Pending</p>
                      <p className="text-xl font-bold">{pendingOrders}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Order Trend</CardTitle>
                  <CardDescription>Monthly order volume and revenue</CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={chartConfig} className="h-[300px]">
                    <AreaChart data={monthlyData}>
                      <XAxis dataKey="month" />
                      <YAxis yAxisId="left" />
                      <YAxis yAxisId="right" orientation="right" tickFormatter={(v) => `${v / 1000000}M`} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Area
                        yAxisId="left"
                        type="monotone"
                        dataKey="orders"
                        stroke="hsl(var(--primary))"
                        fill="hsl(var(--primary) / 0.2)"
                      />
                      <Area
                        yAxisId="right"
                        type="monotone"
                        dataKey="revenue"
                        stroke="hsl(var(--success))"
                        fill="hsl(var(--success) / 0.2)"
                      />
                    </AreaChart>
                  </ChartContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Order Status Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={chartConfig} className="h-[250px]">
                    <PieChart>
                      <Pie data={orderStatusData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80}>
                        {orderStatusData.map((entry, index) => (
                          <Cell key={index} fill={entry.fill} />
                        ))}
                      </Pie>
                      <ChartTooltip content={<ChartTooltipContent />} />
                    </PieChart>
                  </ChartContainer>
                  <div className="flex flex-wrap justify-center gap-4 mt-2">
                    {orderStatusData.map((item, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.fill }} />
                        <span className="text-sm text-muted-foreground">
                          {item.name}: {item.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="orders" className="space-y-6 mt-6">
            {/* Filters */}
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by order number or vendor..."
                      className="pl-10"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full md:w-48">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="confirmed">Confirmed</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="canceled">Canceled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Orders Table */}
            <Card>
              <CardHeader>
                <CardTitle>All Orders</CardTitle>
                <CardDescription>View and monitor marketplace orders</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order #</TableHead>
                      <TableHead>Vendor</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Service Fee</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredOrders.slice(0, 50).map((order) => (
                      <TableRow key={order.id}>
                        <TableCell className="font-mono">{order.order_number}</TableCell>
                        <TableCell>{(order.vendors as any)?.business_name || "-"}</TableCell>
                        <TableCell>{(order.products as any)?.name || "-"}</TableCell>
                        <TableCell>{formatCurrency(Number(order.total_price))}</TableCell>
                        <TableCell>{formatCurrency(Number(order.service_fee || 0))}</TableCell>
                        <TableCell>{getStatusBadge(order.status)}</TableCell>
                        <TableCell>{format(new Date(order.created_at), "dd MMM yyyy")}</TableCell>
                      </TableRow>
                    ))}
                    {filteredOrders.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          No orders found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="vendors" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top Vendors */}
              <Card>
                <CardHeader>
                  <CardTitle>Top Vendors by Orders</CardTitle>
                  <CardDescription>Vendors with most orders this period</CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={chartConfig} className="h-[300px]">
                    <BarChart data={topVendors} layout="vertical">
                      <XAxis type="number" />
                      <YAxis dataKey="name" type="category" width={100} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="orders" fill="hsl(var(--primary))" radius={4} />
                    </BarChart>
                  </ChartContainer>
                </CardContent>
              </Card>

              {/* Vendor Stats Table */}
              <Card>
                <CardHeader>
                  <CardTitle>Vendor Performance</CardTitle>
                  <CardDescription>Order volume and ratings</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Vendor</TableHead>
                        <TableHead>Orders</TableHead>
                        <TableHead>Revenue</TableHead>
                        <TableHead>Rating</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {topVendors.map((vendor, i) => (
                        <TableRow key={i}>
                          <TableCell className="font-medium">{vendor.name}</TableCell>
                          <TableCell>{vendor.orders}</TableCell>
                          <TableCell>{formatCurrency(vendor.revenue)}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Star className="h-4 w-4 text-warning fill-warning" />
                              {vendor.rating.toFixed(1)}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>

            {/* Review Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Review Analytics</CardTitle>
                <CardDescription>Customer feedback overview</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-muted/30 rounded-lg">
                    <p className="text-3xl font-bold">{reviews.length}</p>
                    <p className="text-sm text-muted-foreground">Total Reviews</p>
                  </div>
                  <div className="text-center p-4 bg-muted/30 rounded-lg">
                    <p className="text-3xl font-bold">
                      {reviews.length > 0 ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : "0"}
                    </p>
                    <p className="text-sm text-muted-foreground">Avg Rating</p>
                  </div>
                  <div className="text-center p-4 bg-muted/30 rounded-lg">
                    <p className="text-3xl font-bold">{reviews.filter((r) => r.rating >= 4).length}</p>
                    <p className="text-sm text-muted-foreground">Positive (4-5★)</p>
                  </div>
                  <div className="text-center p-4 bg-muted/30 rounded-lg">
                    <p className="text-3xl font-bold">{reviews.filter((r) => r.rating <= 2).length}</p>
                    <p className="text-sm text-muted-foreground">Negative (1-2★)</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default AdminOrders;
