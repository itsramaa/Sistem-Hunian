import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/components/ui/table';
import { TablePagination } from '@/shared/components/ui/TablePagination';
import { formatCurrency } from '@/shared/utils/currency';
import { format } from 'date-fns';
import { AlertTriangle, CheckCircle, CreditCard } from 'lucide-react';
import { Invoice } from '../types';


interface OverdueInvoicesTableProps {
  invoices: Invoice[];
  onSetupPaymentPlan: (invoice: Invoice) => void;
  page: number;
  totalPages: number;
  totalInvoices: number;
  onPageChange: (page: number) => void;
  itemsPerPage: number;
}

export function OverdueInvoicesTable({ 
  invoices, 
  onSetupPaymentPlan,
  page,
  totalPages,
  totalInvoices,
  onPageChange,
  itemsPerPage
}: OverdueInvoicesTableProps) {
  if (invoices.length === 0) {
    return (
      <Card className="rounded-2xl bg-card/90 backdrop-blur-sm border border-border/40">
        <CardContent className="p-8 text-center text-muted-foreground">
          <CheckCircle className="h-12 w-12 mx-auto mb-4 text-success" />
          <p className="font-medium">No overdue invoices!</p>
          <p className="text-sm">All payments are on track.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-2xl bg-card/90 backdrop-blur-sm border border-border/40 overflow-hidden">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-destructive/10">
            <AlertTriangle className="h-5 w-5 text-destructive" />
          </div>
          Overdue Invoices - Payment Plan Options
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="bg-gradient-to-r from-muted/80 to-muted/40 hover:from-muted/80">
              <TableHead className="text-xs uppercase tracking-wider font-semibold">Invoice #</TableHead>
              <TableHead className="text-xs uppercase tracking-wider font-semibold">Amount</TableHead>
              <TableHead className="text-xs uppercase tracking-wider font-semibold">Late Fee</TableHead>
              <TableHead className="text-xs uppercase tracking-wider font-semibold">Total</TableHead>
              <TableHead className="text-xs uppercase tracking-wider font-semibold">Due Date</TableHead>
              <TableHead className="text-xs uppercase tracking-wider font-semibold">Days Overdue</TableHead>
              <TableHead className="text-xs uppercase tracking-wider font-semibold">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoices.map((invoice) => {
              const daysOverdue = Math.floor(
                (new Date().getTime() - new Date(invoice.due_date).getTime()) / (1000 * 60 * 60 * 24)
              );
              return (
                <TableRow key={invoice.id} className="hover:bg-primary/5 transition-colors">
                  <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
                  <TableCell>{formatCurrency(Number(invoice.amount))}</TableCell>
                  <TableCell>
                    {invoice.late_fee > 0 ? (
                      <Badge variant="destructive" className="rounded-full">+{formatCurrency(Number(invoice.late_fee))}</Badge>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="font-semibold">{formatCurrency(Number(invoice.total_amount))}</TableCell>
                  <TableCell>{format(new Date(invoice.due_date), 'MMM d, yyyy')}</TableCell>
                  <TableCell>
                    <Badge 
                      variant={daysOverdue > 7 ? 'destructive' : 'secondary'} 
                      className="rounded-full"
                    >
                      {daysOverdue} days
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-xl"
                      onClick={() => onSetupPaymentPlan(invoice)}
                    >
                      <CreditCard className="h-4 w-4 mr-1" />
                      Setup Payment Plan
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>

        <div className="px-6 pb-4">
          <TablePagination
            page={page}
            totalPages={totalPages}
            totalItems={totalInvoices}
            itemsPerPage={itemsPerPage}
            onPageChange={onPageChange}
            itemLabel="invoices"
          />
        </div>
      </CardContent>
    </Card>
  );
}
