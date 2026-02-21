import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent } from '@/shared/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/components/ui/table';
import { formatCurrency } from '@/shared/utils/currency';
import { format } from 'date-fns';
import { Bell, Calendar, CheckCircle, ChevronLeft, ChevronRight, Clock, DollarSign, Loader2, XCircle } from 'lucide-react';
import { Payment } from '../types';

interface PaymentsTableProps {
  payments: Payment[];
  loading: boolean;
  onMarkPaid: (payment: Payment) => void;
  onSendReminder: (paymentId: string) => void;
  sendingReminderId: string | null;
  page: number;
  totalPages: number;
  totalPayments: number;
  onPageChange: (page: number) => void;
  itemsPerPage: number;
}

export function PaymentsTable({ 
  payments, 
  loading, 
  onMarkPaid, 
  onSendReminder,
  sendingReminderId,
  page,
  totalPages,
  totalPayments,
  onPageChange,
  itemsPerPage
}: PaymentsTableProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'paid': return <CheckCircle className="h-4 w-4" />;
      case 'overdue': return <XCircle className="h-4 w-4" />;
      default: return <Calendar className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'secondary';
      case 'paid': return 'default';
      case 'overdue': return 'destructive';
      default: return 'secondary';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading payments...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Type</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Method</TableHead>
              <TableHead>Reference</TableHead>
              <TableHead>Paid At</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                  <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No payments found</p>
                </TableCell>
              </TableRow>
            ) : (
              payments.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell className="font-medium capitalize">{payment.payment_type}</TableCell>
                  <TableCell>{formatCurrency(Number(payment.amount))}</TableCell>
                  <TableCell>{format(new Date(payment.due_date), 'MMM d, yyyy')}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusColor(payment.status) as "default" | "secondary" | "destructive" | "outline"} className="gap-1">
                      {getStatusIcon(payment.status)}
                      {payment.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="capitalize">{payment.payment_method || '-'}</TableCell>
                  <TableCell>{payment.reference || '-'}</TableCell>
                  <TableCell>
                    {payment.paid_at ? format(new Date(payment.paid_at), 'MMM d, yyyy') : '-'}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {(payment.status === 'pending' || payment.status === 'overdue') && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onMarkPaid(payment)}
                          >
                            Mark Paid
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onSendReminder(payment.id)}
                            disabled={sendingReminderId === payment.id}
                            title="Send payment reminder"
                          >
                            {sendingReminderId === payment.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Bell className="h-4 w-4" />
                            )}
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

      {/* Pagination Controls */}
      <div className="flex items-center justify-between px-4 py-4 border-t">
        <div className="flex-1 text-sm text-muted-foreground">
          Showing {((page - 1) * itemsPerPage) + 1} to {Math.min(page * itemsPerPage, totalPayments)} of {totalPayments} payments
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
