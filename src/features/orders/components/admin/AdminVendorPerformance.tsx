import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/shared/components/ui/chart";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/components/ui/table";
import { Star } from "lucide-react";
import { Bar, BarChart, XAxis, YAxis } from "recharts";

interface AdminVendorPerformanceProps {
  topVendors: any[];
  reviews: any[];
}

export function AdminVendorPerformance({ topVendors, reviews }: AdminVendorPerformanceProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(amount);
  };

  const chartConfig = {
    orders: { label: "Orders", color: "hsl(var(--primary))" },
  };

  return (
    <div className="space-y-6">
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
    </div>
  );
}
