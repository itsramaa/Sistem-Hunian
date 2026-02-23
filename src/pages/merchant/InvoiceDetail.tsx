import { useAuth } from '@/features/auth/hooks/useAuth';
import { useMerchantInvoices } from '@/features/payments/hooks/useMerchantInvoices';
import { Invoice } from '@/features/payments/types';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { PageHeader } from '@/shared/components/ui/PageHeader';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { formatCurrency } from '@/shared/utils/currency';
import { getInvoiceStatusColor } from '@/shared/utils/statusColors';
import { format } from 'date-fns';
import { ArrowLeft, Bell, CheckCircle, Download, FileText, Loader2, Send } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';

export default function MerchantInvoiceDetail() {
  const { invoiceId } = useParams<{ invoiceId: string }>();
  const navigate = useNavigate();
  const { merchant } = useAuth();
  const {
    invoices,
    isLoading,
    sendInvoiceMutation,
    markAsPaidMutation,
    sendReminderMutation,
    generatePdfMutation,
  } = useMerchantInvoices(merchant?.id);

  const invoice = invoices.find((i: Invoice) => i.id === invoiceId);

  const handleSend = async () => {
    if (!invoice) return;
    await sendInvoiceMutation.mutateAsync({ invoiceId: invoice.id, merchantName: merchant?.business_name || 'Landlord' });
  };

  const handleMarkPaid = async () => {
    if (!invoice) return;
    await markAsPaidMutation.mutateAsync({ invoiceId: invoice.id, currentStatus: invoice.status });
  };

  const handleRemind = async () => {
    if (!invoice) return;
    await sendReminderMutation.mutateAsync({ invoiceId: invoice.id, tenantUserId: invoice.tenant_user_id });
  };

  const handleDownload = async () => {
    if (!invoice) return;
    const result = await generatePdfMutation.mutateAsync(invoice.id);
    const w = window.open('', '_blank');
    if (w) { w.document.write(result.html); w.document.close(); w.onload = () => w.print(); }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-48 rounded-2xl" />
            <Skeleton className="h-64 rounded-2xl" />
          </div>
          <Skeleton className="h-80 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => navigate('/merchant/invoices')} className="gap-2">
          <ArrowLeft className="h-4 w-4" /> Back to Invoices
        </Button>
        <div className="text-center py-16">
          <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold">Invoice not found</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={() => navigate('/merchant/invoices')} className="gap-2 rounded-xl">
        <ArrowLeft className="h-4 w-4" /> Back to Invoices
      </Button>

      <div className="flex items-center justify-between">
        <PageHeader icon={FileText} title={invoice.invoice_number} description="Invoice Details" />
        <Badge variant={getInvoiceStatusColor(invoice.status)} className="text-sm px-4 py-1.5 rounded-full capitalize">
          {invoice.status}
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Amount Breakdown */}
          <div className="bg-card/90 backdrop-blur-sm rounded-2xl border border-border/40 p-6 space-y-4">
            <h3 className="font-semibold text-lg">Amount Breakdown</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium">{formatCurrency(Number(invoice.amount))}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-muted-foreground">Tax</span>
                <span className="font-medium">{formatCurrency(Number(invoice.tax_amount || 0))}</span>
              </div>
              {invoice.late_fee > 0 && (
                <div className="flex justify-between items-center py-2 text-destructive">
                  <span>Late Fee</span>
                  <span className="font-medium">{formatCurrency(invoice.late_fee)}</span>
                </div>
              )}
              <div className="border-t border-border/40 pt-3 flex justify-between items-center">
                <span className="text-lg font-semibold">Total</span>
                <span className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                  {formatCurrency(Number(invoice.total_amount))}
                </span>
              </div>
            </div>
          </div>

          {/* Description */}
          {invoice.description && (
            <div className="bg-card/90 backdrop-blur-sm rounded-2xl border border-border/40 p-6">
              <h3 className="font-semibold text-lg mb-3">Description</h3>
              <p className="text-muted-foreground">{invoice.description}</p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Key Info */}
          <div className="bg-card/90 backdrop-blur-sm rounded-2xl border border-border/40 p-6 space-y-4">
            <h3 className="font-semibold text-lg">Details</h3>
            {[
              { label: 'Due Date', value: format(new Date(invoice.due_date), 'MMMM dd, yyyy') },
              ...(invoice.issued_at ? [{ label: 'Issued', value: format(new Date(invoice.issued_at), 'MMMM dd, yyyy') }] : []),
              ...(invoice.paid_at ? [{ label: 'Paid', value: format(new Date(invoice.paid_at), 'MMMM dd, yyyy') }] : []),
            ].map((item, i) => (
              <div key={i} className="p-3 rounded-xl bg-muted/30">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">{item.label}</p>
                <p className="font-medium mt-0.5">{item.value}</p>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="bg-card/90 backdrop-blur-sm rounded-2xl border border-border/40 p-6 space-y-3">
            <h3 className="font-semibold text-lg mb-2">Actions</h3>
            
            <Button variant="outline" className="w-full rounded-xl gap-2" onClick={handleDownload} disabled={generatePdfMutation.isPending}>
              {generatePdfMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              Download PDF
            </Button>

            {invoice.status === 'draft' && (
              <Button className="w-full rounded-xl gap-2 gradient-cta text-primary-foreground" onClick={handleSend} disabled={sendInvoiceMutation.isPending}>
                {sendInvoiceMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Send Invoice
              </Button>
            )}

            {(invoice.status === 'sent' || invoice.status === 'overdue') && (
              <>
                <Button variant="outline" className="w-full rounded-xl gap-2" onClick={handleRemind} disabled={sendReminderMutation.isPending}>
                  {sendReminderMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bell className="h-4 w-4" />}
                  Send Reminder
                </Button>
                <Button className="w-full rounded-xl gap-2 gradient-cta text-primary-foreground" onClick={handleMarkPaid} disabled={markAsPaidMutation.isPending}>
                  {markAsPaidMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                  Mark as Paid
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}