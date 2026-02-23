import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu';
import { EmptyState } from '@/shared/components/ui/EmptyState';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/components/ui/table';
import { TablePagination } from '@/shared/components/ui/TablePagination';
import { formatCurrency } from '@/shared/utils/currency';
import { getInvoiceStatusColor } from '@/shared/utils/statusColors';
import { format } from 'date-fns';
import { Bell, Download, Eye, FileText, Loader2, MoreHorizontal, Send } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Invoice } from '../types';

interface InvoicesTableProps {
  invoices: Invoice[];
  isLoading: boolean;
  onView: (invoice: Invoice) => void;
  onDownload: (id: string) => void;
  onSend: (id: string) => void;
  onRemind: (id: string, tenantUserId: string) => void;
  sendingId?: string | null;
  remindingId?: string | null;
  page: number;
  totalPages: number;
  totalInvoices: number;
  onPageChange: (page: number) => void;
  itemsPerPage: number;
}

export const InvoicesTable = ({
  invoices,
  isLoading,
  onView,
  onDownload,
  onSend,
  onRemind,
  sendingId = null,
  remindingId = null,
  page,
  totalPages,
  totalInvoices,
  onPageChange,
  itemsPerPage
}: InvoicesTableProps) => {
  const navigate = useNavigate();
  if (isLoading) {
    return (
      <div className="glass-table">
        <Table>
          <TableHeader>
            <TableRow className="bg-gradient-to-r from-muted/80 to-muted/40 border-b-0">
              <TableHead className="font-semibold text-xs uppercase tracking-wider">Invoice #</TableHead>
              <TableHead className="font-semibold text-xs uppercase tracking-wider">Description</TableHead>
              <TableHead className="font-semibold text-xs uppercase tracking-wider">Amount</TableHead>
              <TableHead className="font-semibold text-xs uppercase tracking-wider">Due Date</TableHead>
              <TableHead className="font-semibold text-xs uppercase tracking-wider">Status</TableHead>
              <TableHead className="text-right font-semibold text-xs uppercase tracking-wider">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>
                <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                <TableCell><Skeleton className="h-5 w-16 rounded-full" /></TableCell>
                <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  if (invoices.length === 0) {
    return (
      <div className="glass-table">
        <EmptyState
          icon={FileText}
          title="No invoices found"
          description="Create a new invoice to get started."
        />
      </div>
    );
  }

  return (
    <div className="glass-table">
      <Table>
        <TableHeader>
          <TableRow className="bg-gradient-to-r from-muted/80 to-muted/40 border-b-0">
            <TableHead className="font-semibold text-xs uppercase tracking-wider">Invoice #</TableHead>
            <TableHead className="font-semibold text-xs uppercase tracking-wider">Description</TableHead>
            <TableHead className="font-semibold text-xs uppercase tracking-wider">Amount</TableHead>
            <TableHead className="font-semibold text-xs uppercase tracking-wider">Due Date</TableHead>
            <TableHead className="font-semibold text-xs uppercase tracking-wider">Status</TableHead>
            <TableHead className="text-right font-semibold text-xs uppercase tracking-wider">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {invoices.map((invoice) => (
            <TableRow key={invoice.id} className="hover:bg-primary/5 cursor-pointer transition-colors" onClick={() => navigate(`/merchant/invoices/${invoice.id}`)}>
              <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
              <TableCell className="max-w-[200px] truncate">
                {invoice.description || '-'}
              </TableCell>
              <TableCell>{formatCurrency(Number(invoice.total_amount))}</TableCell>
              <TableCell>{format(new Date(invoice.due_date), 'MMM d, yyyy')}</TableCell>
              <TableCell>
                <Badge variant={getInvoiceStatusColor(invoice.status)}>
                  {invoice.status}
                </Badge>
              </TableCell>
              <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <span className="sr-only">Open menu</span>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => onView(invoice)}>
                      <Eye className="mr-2 h-4 w-4" />
                      View Details
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onDownload(invoice.id)}>
                      <Download className="mr-2 h-4 w-4" />
                      Download PDF
                    </DropdownMenuItem>
                    
                    {(invoice.status === 'draft' || invoice.status === 'sent' || invoice.status === 'overdue') && (
                      <DropdownMenuSeparator />
                    )}

                    {invoice.status === 'draft' && (
                      <DropdownMenuItem 
                        onClick={() => onSend(invoice.id)}
                        disabled={sendingId === invoice.id}
                      >
                        {sendingId === invoice.id ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Send className="mr-2 h-4 w-4" />
                        )}
                        Send Invoice
                      </DropdownMenuItem>
                    )}

                    {(invoice.status === 'sent' || invoice.status === 'overdue') && (
                      <DropdownMenuItem 
                        onClick={() => onRemind(invoice.id, invoice.tenant_user_id)}
                        disabled={remindingId === invoice.id}
                      >
                        {remindingId === invoice.id ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Bell className="mr-2 h-4 w-4" />
                        )}
                        Send Reminder
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      
      <TablePagination
        page={page}
        totalPages={totalPages}
        totalItems={totalInvoices}
        itemsPerPage={itemsPerPage}
        onPageChange={onPageChange}
        itemLabel="invoices"
      />
    </div>
  );
};
