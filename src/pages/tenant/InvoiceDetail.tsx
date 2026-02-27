import { useAuth } from '@/features/auth/hooks/useAuth';
import { XenditPaymentModal } from '@/features/payments/components/XenditPaymentModal';
import { useAllTenantInvoices, useDownloadInvoice } from '@/features/payments/hooks/useTenantInvoices';
import { Invoice } from '@/features/payments/types';
import { TenantLayout } from '@/shared/components/layouts/TenantLayout';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { formatCurrency } from '@/shared/utils/currency';
import { getInvoiceStatusColor } from '@/shared/utils/statusColors';
import { format } from 'date-fns';
import { ArrowLeft, CreditCard, Download, FileText, Loader2, Receipt } from 'lucide-react';
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

export default function TenantInvoiceDetail() {
  const { invoiceId } = useParams<{ invoiceId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: invoices = [], isLoading } = useAllTenantInvoices(user?.id);
  const { mutate: downloadInvoice } = useDownloadInvoice();
  const [downloading, setDownloading] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  const invoice = invoices.find((i: Invoice) => i.id === invoiceId);

  const handleDownload = () => {
    if (!invoice) return;
    setDownloading(true);
    downloadInvoice(invoice.id, {
      onSuccess: (result: any) => {
        if (result.html) {
          const w = window.open('', '_blank');
          if (w) { w.document.write(result.html); w.document.close(); w.onload = () => w.print(); }
        }
        setDownloading(false);
      },
      onError: () => setDownloading(false),
    });
  };

  if (isLoading) {
    return (
      <TenantLayout title="Invoice Details">
        <Skeleton className="h-10 w-48 mb-6" />
        <Skeleton className="h-64 rounded-2xl" />
      </TenantLayout>
    );
  }

  if (!invoice) {
    return (
      <TenantLayout title="Invoice Details">
        <Button variant="ghost" onClick={() => navigate('/tenant/invoices')} className="gap-2 mb-6"><ArrowLeft className="h-4 w-4" /> Back</Button>
        <div className="text-center py-16">
          <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold">Invoice not found</h2>
        </div>
      </TenantLayout>
    );
  }

  const canPay = ['sent', 'overdue', 'pending'].includes(invoice.status);

  return (
    <TenantLayout title="Invoice Details">
      <Button variant="ghost" onClick={() => navigate('/tenant/invoices')} className="gap-2 rounded-xl mb-6">
        <ArrowLeft className="h-4 w-4" /> Back to Invoices
      </Button>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">{invoice.invoice_number}</h1>
          <p className="text-muted-foreground">{invoice.description || 'Invoice'}</p>
        </div>
        <Badge variant={getInvoiceStatusColor(invoice.status)} className="text-sm px-4 py-1.5 rounded-full capitalize">
          {invoice.status}
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Amount Card */}
          <div className="bg-card/90 backdrop-blur-sm rounded-2xl border border-border/40 p-6 space-y-3">
            <h3 className="font-semibold text-lg">Amount Breakdown</h3>
            <div className="flex justify-between py-2"><span className="text-muted-foreground">Subtotal</span><span>{formatCurrency(Number(invoice.amount))}</span></div>
            <div className="flex justify-between py-2"><span className="text-muted-foreground">Tax</span><span>{formatCurrency(Number(invoice.tax_amount || 0))}</span></div>
            {invoice.late_fee > 0 && (
              <div className="flex justify-between py-2 text-destructive"><span>Late Fee</span><span>{formatCurrency(invoice.late_fee)}</span></div>
            )}
            <div className="border-t border-border/40 pt-3 flex justify-between">
              <span className="text-lg font-semibold">Total</span>
              <span className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                {formatCurrency(Number(invoice.total_amount))}
              </span>
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Due Date', value: format(new Date(invoice.due_date), 'MMMM dd, yyyy') },
              ...(invoice.issued_at ? [{ label: 'Issued', value: format(new Date(invoice.issued_at), 'MMMM dd, yyyy') }] : []),
              ...(invoice.paid_at ? [{ label: 'Paid', value: format(new Date(invoice.paid_at), 'MMMM dd, yyyy') }] : []),
            ].map((item, i) => (
              <div key={i} className="bg-card/90 backdrop-blur-sm rounded-2xl border border-border/40 p-4">
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">{item.label}</p>
                <p className="font-medium">{item.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar */}
        <div className="bg-card/90 backdrop-blur-sm rounded-2xl border border-border/40 p-6 space-y-3 h-fit">
          <h3 className="font-semibold text-lg mb-2">Actions</h3>
          <Button variant="outline" className="w-full rounded-xl gap-2" onClick={handleDownload} disabled={downloading}>
            {downloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            Download PDF
          </Button>
          {canPay && (
            <Button className="w-full rounded-xl gap-2 gradient-cta text-primary-foreground" onClick={() => setSelectedInvoice(invoice)}>
              <CreditCard className="h-4 w-4" /> Pay Now
            </Button>
          )}
          {invoice.status === 'paid' && (
            <Button variant="outline" className="w-full rounded-xl gap-2" onClick={() => {
              const receiptHtml = `
                <!DOCTYPE html><html><head><meta charset="utf-8"><title>Kwitansi ${invoice.invoice_number}</title>
                <style>body{font-family:system-ui,sans-serif;max-width:600px;margin:40px auto;padding:20px;color:#333}
                .header{text-align:center;border-bottom:2px solid #333;padding-bottom:16px;margin-bottom:24px}
                .header h1{font-size:24px;margin:0}.header p{color:#666;margin:4px 0}
                .row{display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #eee}
                .row.total{border-top:2px solid #333;border-bottom:none;font-weight:bold;font-size:18px;margin-top:12px;padding-top:12px}
                .footer{margin-top:32px;text-align:center;color:#999;font-size:12px}
                @media print{body{margin:0}}</style></head><body>
                <div class="header"><h1>KWITANSI PEMBAYARAN</h1><p>No: ${invoice.invoice_number}</p></div>
                <div class="row"><span>Deskripsi</span><span>${invoice.description || 'Pembayaran Sewa'}</span></div>
                <div class="row"><span>Tanggal Bayar</span><span>${invoice.paid_at ? format(new Date(invoice.paid_at), 'dd MMMM yyyy') : '-'}</span></div>
                <div class="row"><span>Subtotal</span><span>${formatCurrency(Number(invoice.amount))}</span></div>
                <div class="row"><span>Pajak</span><span>${formatCurrency(Number(invoice.tax_amount || 0))}</span></div>
                ${invoice.late_fee > 0 ? `<div class="row"><span>Denda</span><span>${formatCurrency(invoice.late_fee)}</span></div>` : ''}
                <div class="row total"><span>Total Dibayar</span><span>${formatCurrency(Number(invoice.total_amount))}</span></div>
                <div class="footer"><p>Kwitansi ini dibuat secara otomatis oleh sistem.</p><p>Dicetak: ${format(new Date(), 'dd MMMM yyyy HH:mm')}</p></div>
                </body></html>`;
              const w = window.open('', '_blank');
              if (w) { w.document.write(receiptHtml); w.document.close(); w.onload = () => w.print(); }
            }}>
              <Receipt className="h-4 w-4" /> Unduh Kwitansi
            </Button>
          )}
        </div>
      </div>

      {selectedInvoice && (
        <XenditPaymentModal
          open={!!selectedInvoice}
          onOpenChange={(open) => !open && setSelectedInvoice(null)}
          invoiceId={selectedInvoice.id}
          amount={Number(selectedInvoice.total_amount)}
          description={selectedInvoice.description || 'Invoice Payment'}
          payerEmail={user?.email || ''}
          payerName={user?.user_metadata?.full_name || ''}
          userId={user?.id || ''}
          paymentType="invoice"
        />
      )}
    </TenantLayout>
  );
}