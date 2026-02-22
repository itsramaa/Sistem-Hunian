import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Invoice } from '../types';
import { formatCurrency } from '@/shared/utils/currency';
import { format } from 'date-fns';
import { getInvoiceStatusColor } from '@/shared/utils/statusColors';
import { Loader2, Send, Bell } from 'lucide-react';

interface InvoiceDetailsDialogProps {
  invoice: Invoice | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSend: (id: string) => void;
  onMarkPaid: (id: string, currentStatus: string) => void;
  onRemind: (id: string, tenantUserId: string) => void;
  isSending?: boolean;
  isReminding?: boolean;
  remindingId?: string | null;
}

export const InvoiceDetailsDialog = ({
  invoice,
  open,
  onOpenChange,
  onSend,
  onMarkPaid,
  onRemind,
  isSending = false,
  isReminding = false,
  remindingId = null
}: InvoiceDetailsDialogProps) => {
  if (!invoice) return null;


  const isCurrentReminding = isReminding && remindingId === invoice.id;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Invoice Details</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Invoice Number</p>
              <p className="text-xl font-bold">{invoice.invoice_number}</p>
            </div>
            <Badge variant={getInvoiceStatusColor(invoice.status)}>
              {invoice.status}
            </Badge>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Due Date</p>
              <p className="font-medium">{format(new Date(invoice.due_date), 'MMM d, yyyy')}</p>
            </div>
            {invoice.issued_at && (
              <div>
                <p className="text-sm text-muted-foreground">Issued</p>
                <p className="font-medium">{format(new Date(invoice.issued_at), 'MMM d, yyyy')}</p>
              </div>
            )}
          </div>

          {invoice.description && (
            <div>
              <p className="text-sm text-muted-foreground">Description</p>
              <p>{invoice.description}</p>
            </div>
          )}

          <div className="border-t pt-4 space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatCurrency(Number(invoice.amount))}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tax</span>
              <span>{formatCurrency(Number(invoice.tax_amount || 0))}</span>
            </div>
            {invoice.late_fee > 0 && (
              <div className="flex justify-between text-destructive">
                <span>Late Fee</span>
                <span>{formatCurrency(invoice.late_fee)}</span>
              </div>
            )}
            <div className="flex justify-between text-lg font-bold border-t pt-2">
              <span>Total</span>
              <span>{formatCurrency(Number(invoice.total_amount))}</span>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            {invoice.status === 'draft' && (
              <Button 
                onClick={() => onSend(invoice.id)}
                disabled={isSending}
              >
                {isSending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Send Invoice
                  </>
                )}
              </Button>
            )}
            
            {(invoice.status === 'sent' || invoice.status === 'overdue') && (
              <>
                <Button 
                  variant="outline"
                  onClick={() => onRemind(invoice.id, invoice.tenant_user_id)}
                  disabled={isCurrentReminding}
                >
                  {isCurrentReminding ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Bell className="mr-2 h-4 w-4" />
                      Send Reminder
                    </>
                  )}
                </Button>
                <Button onClick={() => onMarkPaid(invoice.id, invoice.status)}>
                  Mark as Paid
                </Button>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
