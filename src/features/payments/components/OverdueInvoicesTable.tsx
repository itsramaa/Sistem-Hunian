import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/components/ui/table';
import { formatCurrency } from '@/shared/utils/currency';
import { format } from 'date-fns';
import { AlertTriangle, CheckCircle, ChevronLeft, ChevronRight, CreditCard } from 'lucide-react';
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
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground">
          <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
          <p>No overdue invoices! All payments are on track.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-destructive" />
          Overdue Invoices - Payment Plan Options
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Invoice #</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Late Fee</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead>Days Overdue</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoices.map((invoice) => {
              const daysOverdue = Math.floor(
                (new Date().getTime() - new Date(invoice.due_date).getTime()) / (1000 * 60 * 60 * 24)
              );
              return (
                <TableRow key={invoice.id}>
                  <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
                  <TableCell>{formatCurrency(Number(invoice.amount))}</TableCell>
                  <TableCell>
                    {invoice.late_fee > 0 ? (
                      <Badge variant="destructive">+{formatCurrency(Number(invoice.late_fee))}</Badge>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="font-semibold">{formatCurrency(Number(invoice.total_amount))}</TableCell>
                  <TableCell>{format(new Date(invoice.due_date), 'MMM d, yyyy')}</TableCell>
                  <TableCell>
                    <Badge variant={daysOverdue > 7 ? 'destructive' : 'secondary'}>
                      {daysOverdue} days
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
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

        {/* Pagination Controls */}
        <div className="flex items-center justify-between px-4 py-4 border-t">
          <div className="flex-1 text-sm text-muted-foreground">
            Showing {((page - 1) * itemsPerPage) + 1} to {Math.min(page * itemsPerPage, totalInvoices)} of {totalInvoices} invoices
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <div className="text-sm font-medium">
              Page {page} of {totalPages}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
