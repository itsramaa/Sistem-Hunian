import { Badge } from "@/shared/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/components/ui/table";
import { formatCurrency } from "@/shared/utils/currency";
import { cn } from "@/shared/utils/utils";
import { format } from "date-fns";

interface Order {
  id: string;
  order_number: string;
  vendors?: { business_name: string };
  products?: { name: string };
  total_price: number;
  service_fee?: number;
  status: string;
  created_at: string;
}

interface AdminOrdersTableProps {
  orders: Order[];
}

export function AdminOrdersTable({ orders }: AdminOrdersTableProps) {
  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      pending: "bg-warning/10 text-warning border-warning/20",
      confirmed: "bg-info/10 text-info border-info/20",
      in_progress: "bg-primary/10 text-primary border-primary/20",
      completed: "bg-success/10 text-success border-success/20",
      canceled: "bg-destructive/10 text-destructive border-destructive/20",
    };
    return (
      <Badge variant="outline" className={cn(colors[status] || "")}>
        {status.replace("_", " ")}
      </Badge>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>All Orders</CardTitle>
        <CardDescription>View and monitor marketplace orders</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order</TableHead>
              <TableHead className="hidden md:table-cell">Vendor</TableHead>
              <TableHead className="hidden sm:table-cell">Product</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead className="hidden lg:table-cell">Service Fee</TableHead>
              <TableHead className="hidden sm:table-cell">Status</TableHead>
              <TableHead className="hidden lg:table-cell">Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.slice(0, 50).map((order) => (
              <TableRow key={order.id}>
                <TableCell>
                  <div className="flex flex-col gap-1">
                    <span className="font-mono text-sm font-medium">{order.order_number}</span>
                    
                    {/* Mobile Fallbacks */}
                    <div className="sm:hidden text-xs text-muted-foreground line-clamp-1">
                      {order.products?.name || "-"}
                    </div>
                    <div className="md:hidden text-xs text-muted-foreground">
                      {order.vendors?.business_name || "-"}
                    </div>
                    <div className="lg:hidden text-[10px] text-muted-foreground">
                       {format(new Date(order.created_at), "dd MMM yyyy")}
                    </div>
                    
                    {/* Mobile Status Badge */}
                    <div className="sm:hidden mt-1 scale-90 origin-left">
                       {getStatusBadge(order.status)}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="hidden md:table-cell">{order.vendors?.business_name || "-"}</TableCell>
                <TableCell className="hidden sm:table-cell">{order.products?.name || "-"}</TableCell>
                <TableCell>{formatCurrency(Number(order.total_price))}</TableCell>
                <TableCell className="hidden lg:table-cell">{formatCurrency(Number(order.service_fee || 0))}</TableCell>
                <TableCell className="hidden sm:table-cell">{getStatusBadge(order.status)}</TableCell>
                <TableCell className="hidden lg:table-cell">{format(new Date(order.created_at), "dd MMM yyyy")}</TableCell>
              </TableRow>
            ))}
            {orders.length === 0 && (
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
  );
}
