import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent } from '@/shared/components/ui/card';
import { EmptyState } from '@/shared/components/ui/EmptyState';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/components/ui/table';
import { TablePagination } from '@/shared/components/ui/TablePagination';
import { formatCurrency } from '@/shared/utils/currency';
import { format } from 'date-fns';
import { Bell, Calendar, CheckCircle, Clock, DollarSign, ImageIcon, Loader2, XCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Payment } from '../types';
import { formatLabel } from '@/shared/utils/utils';

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
  const navigate = useNavigate();
  if (loading) {
    return (
      <div className="glass-table">
        <Table>
          <TableHeader>
            <TableRow className="bg-gradient-to-r from-muted/80 to-muted/40 border-b-0">
              <TableHead className="font-semibold text-xs uppercase tracking-wider">Tipe</TableHead>
              <TableHead className="font-semibold text-xs uppercase tracking-wider">Jumlah</TableHead>
              <TableHead className="font-semibold text-xs uppercase tracking-wider">Jatuh Tempo</TableHead>
              <TableHead className="font-semibold text-xs uppercase tracking-wider">Status</TableHead>
              <TableHead className="font-semibold text-xs uppercase tracking-wider">Metode</TableHead>
              <TableHead className="font-semibold text-xs uppercase tracking-wider">Referensi</TableHead>
              <TableHead className="font-semibold text-xs uppercase tracking-wider">Dibayar Pada</TableHead>
              <TableHead className="font-semibold text-xs uppercase tracking-wider">Bukti</TableHead>
              <TableHead className="font-semibold text-xs uppercase tracking-wider">Aksi</TableHead>
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
      </div>
    );
  }

  return (
    <div className="glass-table">
      <Table>
        <TableHeader>
          <TableRow className="bg-gradient-to-r from-muted/80 to-muted/40 border-b-0">
            <TableHead className="font-semibold text-xs uppercase tracking-wider">Tipe</TableHead>
            <TableHead className="font-semibold text-xs uppercase tracking-wider">Jumlah</TableHead>
            <TableHead className="font-semibold text-xs uppercase tracking-wider">Jatuh Tempo</TableHead>
            <TableHead className="font-semibold text-xs uppercase tracking-wider">Status</TableHead>
            <TableHead className="font-semibold text-xs uppercase tracking-wider">Metode</TableHead>
            <TableHead className="font-semibold text-xs uppercase tracking-wider">Referensi</TableHead>
            <TableHead className="font-semibold text-xs uppercase tracking-wider">Dibayar Pada</TableHead>
            <TableHead className="font-semibold text-xs uppercase tracking-wider">Bukti</TableHead>
            <TableHead className="font-semibold text-xs uppercase tracking-wider text-right">Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {payments.length === 0 ? (
            <TableRow>
              <TableCell colSpan={9} className="p-0">
                <EmptyState
                  icon={DollarSign}
                  title="Pembayaran tidak ditemukan"
                  description="Pembayaran akan muncul di sini setelah tagihan dibuat."
                />
              </TableCell>
            </TableRow>
          ) : (
            payments.map((payment) => (
              <TableRow key={payment.id} className="hover:bg-primary/5 cursor-pointer transition-colors" onClick={() => navigate(`/merchant/payments/${payment.id}`)}>
                <TableCell className="font-medium">{formatLabel(payment.payment_type)}</TableCell>
                  <TableCell>{formatCurrency(Number(payment.amount))}</TableCell>
                  <TableCell>{format(new Date(payment.due_date), 'dd MMM yyyy')}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusColor(payment.status)} className="gap-1">
                      {getStatusIcon(payment.status)}
                      {formatLabel(payment.status)}
                    </Badge>
                  </TableCell>
                <TableCell>{formatLabel(payment.payment_method) || '-'}</TableCell>
                  <TableCell>{payment.reference || '-'}</TableCell>
                  <TableCell>
                     {payment.paid_at ? format(new Date(payment.paid_at), 'dd MMM yyyy') : '-'}
                  </TableCell>
                  <TableCell>
                    {payment.proof_photo_url ? (
                      <a href={payment.proof_photo_url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="inline-flex items-center gap-1 text-primary hover:underline text-xs">
                        <ImageIcon className="h-3.5 w-3.5" />Bukti
                      </a>
                    ) : '-'}
                  </TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-2">
                      {(payment.status === 'pending' || payment.status === 'overdue') && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            className="rounded-xl"
                            onClick={() => onMarkPaid(payment)}
                          >
                            Tandai Lunas
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="rounded-xl"
                            onClick={() => onSendReminder(payment.id)}
                            disabled={sendingReminderId === payment.id}
                            aria-label="Kirim pengingat pembayaran"
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
          itemLabel="pembayaran"
        />
    </div>
  );
}
