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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/components/ui/table';
import { formatCurrency } from '@/shared/utils/currency';
import { format } from 'date-fns';
import { Bell, ChevronLeft, ChevronRight, Download, Eye, FileText, Loader2, MoreHorizontal, Send } from 'lucide-react';
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
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'secondary';
      case 'sent': return 'default';
      case 'paid': return 'outline';
      case 'overdue': return 'destructive';
      default: return 'secondary';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-16 w-full bg-muted/20 animate-pulse rounded-md" />
        ))}
      </div>
    );
  }

  if (invoices.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center border rounded-md bg-card text-card-foreground shadow-sm">
        <div className="p-4 rounded-full bg-muted mb-4">
          <FileText className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-medium">No invoices found</h3>
        <p className="text-muted-foreground mt-1">
          Create a new invoice to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Invoice #</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Due Date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {invoices.map((invoice) => (
            <TableRow key={invoice.id}>
              <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
              <TableCell className="max-w-[200px] truncate">
                {invoice.description || '-'}
              </TableCell>
              <TableCell>{formatCurrency(Number(invoice.total_amount))}</TableCell>
              <TableCell>{format(new Date(invoice.due_date), 'MMM d, yyyy')}</TableCell>
              <TableCell>
                <Badge variant={getStatusColor(invoice.status) as "default" | "secondary" | "destructive" | "outline"}>
                  {invoice.status}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
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
    </div>
  );
};
