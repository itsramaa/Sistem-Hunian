import { StatusBadge, TierBadge } from "@/features/subscriptions/components/SubscriptionBadges";
import { SubscriptionInvoice } from "@/features/subscriptions/types/subscriptions";
import { ScrollArea } from "@/shared/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/components/ui/table";
import { formatCurrency } from "@/shared/utils/currency";
import { format } from "date-fns";
import { Loader2, Receipt } from "lucide-react";

interface AdminSubscriptionInvoicesTableProps {
  invoices: SubscriptionInvoice[] | undefined;
  isLoading: boolean;
}

export function AdminSubscriptionInvoicesTable({ invoices, isLoading }: AdminSubscriptionInvoicesTableProps) {
  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!invoices || invoices.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Receipt className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>No invoices found</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[600px]">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Merchant</TableHead>
            <TableHead className="hidden md:table-cell">Tier</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead className="hidden sm:table-cell">Due Date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="hidden lg:table-cell">Created</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {invoices.map((invoice) => (
            <TableRow key={invoice.id}>
              <TableCell className="font-medium">
                {invoice.merchants?.business_name || 'Unknown'}
              </TableCell>
              <TableCell className="hidden md:table-cell">
                <TierBadge tierName={invoice.subscription_tiers?.name} />
              </TableCell>
              <TableCell>{formatCurrency(invoice.amount)}</TableCell>
              <TableCell className="hidden sm:table-cell">{format(new Date(invoice.due_date), 'MMM dd, yyyy')}</TableCell>
              <TableCell>
                <StatusBadge status={invoice.status} />
              </TableCell>
              <TableCell className="hidden lg:table-cell">{format(new Date(invoice.created_at), 'MMM dd, yyyy')}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </ScrollArea>
  );
}
