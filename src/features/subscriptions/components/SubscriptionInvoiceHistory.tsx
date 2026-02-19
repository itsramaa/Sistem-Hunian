import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/components/ui/table";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { supabase } from "@/lib/integrations/supabase/client";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { ExternalLink, Receipt, FileText } from "lucide-react";

interface SubscriptionInvoice {
  id: string;
  amount: number;
  status: string;
  billing_period_start: string;
  billing_period_end: string;
  due_date: string;
  paid_at: string | null;
  xendit_payment_url: string | null;
  tier: {
    display_name: string;
  } | null;
}

export function SubscriptionInvoiceHistory() {
  const { merchant } = useAuth();

  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ["subscription-invoices", merchant?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subscription_invoices")
        .select(`*, tier:subscription_tiers(display_name)`)
        .eq("merchant_id", merchant?.id)
        .order("created_at", { ascending: false })
        .limit(10);
      
      if (error) throw error;
      return data as SubscriptionInvoice[];
    },
    enabled: !!merchant?.id,
  });

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(price);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return <Badge className="bg-success text-success-foreground">Paid</Badge>;
      case "pending":
        return <Badge variant="outline" className="border-warning text-warning">Pending</Badge>;
      case "failed":
        return <Badge variant="destructive">Failed</Badge>;
      case "expired":
        return <Badge variant="secondary">Expired</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Invoice History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (invoices.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Invoice History
          </CardTitle>
          <CardDescription>Your subscription invoices will appear here</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No invoices yet</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Receipt className="h-5 w-5" />
          Invoice History
        </CardTitle>
        <CardDescription>Your recent subscription payments</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Period</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoices.map((invoice) => (
              <TableRow key={invoice.id}>
                <TableCell className="font-medium">
                  {format(new Date(invoice.billing_period_start), "MMM yyyy", { locale: id })}
                </TableCell>
                <TableCell>{invoice.tier?.display_name || "-"}</TableCell>
                <TableCell>{formatPrice(invoice.amount)}</TableCell>
                <TableCell>
                  {format(new Date(invoice.due_date), "dd MMM yyyy", { locale: id })}
                </TableCell>
                <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                <TableCell className="text-right">
                  {invoice.status === "pending" && invoice.xendit_payment_url ? (
                    <Button
                      size="sm"
                      variant="default"
                      onClick={() => window.open(invoice.xendit_payment_url!, "_blank")}
                    >
                      <ExternalLink className="h-4 w-4 mr-1" />
                      Pay Now
                    </Button>
                  ) : invoice.status === "paid" ? (
                    <span className="text-sm text-muted-foreground">
                      {invoice.paid_at 
                        ? format(new Date(invoice.paid_at), "dd MMM yyyy", { locale: id })
                        : "Paid"
                      }
                    </span>
                  ) : null}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
