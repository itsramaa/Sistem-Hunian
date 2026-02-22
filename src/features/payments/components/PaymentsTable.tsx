import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent } from '@/shared/components/ui/card';
import { EmptyState } from '@/shared/components/ui/EmptyState';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/components/ui/table';
import { TablePagination } from '@/shared/components/ui/TablePagination';
import { formatCurrency } from '@/shared/utils/currency';
import { format } from 'date-fns';
import { Bell, Calendar, CheckCircle, Clock, DollarSign, Loader2, XCircle } from 'lucide-react';
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

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'pending': return <Clock className="h-4 w-4" />;
    case 'paid': return <CheckCircle className="h-4 w-4" />;
    case 'overdue': return <XCircle className="h-4 w-4" />;
    default: return <Calendar className="h-4 w-4" />;
  }
};

const getStatusColor = (status: string): "default" | "secondary" | "destructive" | "outline" => {
  switch (status) {
    case 'pending': return 'secondary';
    case 'paid': return 'default';
    case 'overdue': return 'destructive';
    default: return 'secondary';
  }
};

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
  if (loading) {
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
              {Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-16 rounded-full" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-20" /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
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
                <TableCell colSpan={8} className="p-0">
                  <EmptyState
                    icon={DollarSign}
                    title="No payments found"
                    description="Payments will appear here once invoices are created."
                  />
                </TableCell>
              </TableRow>
            ) : (
              payments.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell className="font-medium capitalize">{payment.payment_type}</TableCell>
                  <TableCell>{formatCurrency(Number(payment.amount))}</TableCell>
                  <TableCell>{format(new Date(payment.due_date), 'MMM d, yyyy')}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusColor(payment.status)} className="gap-1">
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
                            aria-label="Send payment reminder"
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

        <TablePagination
          page={page}
          totalPages={totalPages}
          totalItems={totalPayments}
          itemsPerPage={itemsPerPage}
          onPageChange={onPageChange}
          itemLabel="payments"
        />
      </CardContent>
    </Card>
  );
}
