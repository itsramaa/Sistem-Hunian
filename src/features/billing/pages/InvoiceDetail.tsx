import { useAuth } from '@/features/auth/hooks/useAuth';
import { useMerchantInvoices } from '@/features/payments/hooks/useMerchantInvoices';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { PageHeader } from '@/shared/components/ui/PageHeader';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { formatCurrency } from '@/shared/utils/currency';
import { getInvoiceStatusColor } from '@/shared/utils/statusColors';
import { apiClient } from '@/lib/axios';
import { useQuery } from '@tanstack/react-query';
import { format, differenceInDays } from 'date-fns';
import { ArrowLeft, Bell, Calendar, CheckCircle, Clock, Download, FileText, Loader2, Mail, MapPin, Phone, Send, User, AlertTriangle } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';

export default function MerchantInvoiceDetail() {
  const { invoiceId } = useParams<{ invoiceId: string }>();
  const navigate = useNavigate();
  const { merchant } = useAuth();
  const {
    sendInvoiceMutation,
    markAsPaidMutation,
    sendReminderMutation,
    generatePdfMutation,
  } = useMerchantInvoices(merchant?.id);

  const { data: invoice, isLoading } = useQuery({
    queryKey: ['invoice-detail', invoiceId],
    queryFn: async () => {
      if (!invoiceId) return null;
      const response = await apiClient.get(`/v1/billing/invoices/${invoiceId}`);
      return response.data.data as any;
    },
    enabled: !!invoiceId,
  });

  const { data: tenant } = useQuery({
    queryKey: ['invoice-tenant', invoice?.tenant_user_id],
    queryFn: async () => {
      const response = await apiClient.get(`/profiles/${invoice!.tenant_user_id}`);
      const d = response.data.data;
      return d ? { full_name: d.full_name, email: d.email, phone: d.phone } as { full_name: string; email: string; phone: string | null } : null;
    },
    enabled: !!invoice?.tenant_user_id,
  });

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
          <div className="lg:col-span-2 space-y-6"><Skeleton className="h-48 rounded-2xl" /><Skeleton className="h-64 rounded-2xl" /></div>
          <Skeleton className="h-80 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => navigate('/merchant/invoices')} className="gap-2"><ArrowLeft className="h-4 w-4" /> Kembali</Button>
        <div className="text-center py-16">
          <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold">Faktur tidak ditemukan</h2>
        </div>
      </div>
    );
  }

  const contract = invoice.contracts;
  const unit = contract?.units;
  const property = unit?.properties;
  const lineItems = invoice.line_items as Array<{ item: string; qty: number; price: number }> | null;
  const overdueDays = invoice.overdue_since ? differenceInDays(new Date(), new Date(invoice.overdue_since)) : 0;

  const timelineSteps = [
    { label: 'Dibuat', date: invoice.created_at, icon: Calendar, done: true },
    { label: 'Diterbitkan', date: invoice.issued_at, icon: Send, done: !!invoice.issued_at },
    { label: 'Jatuh Tempo', date: invoice.due_date, icon: Clock, done: true },
    { label: 'Dibayar', date: invoice.paid_at, icon: CheckCircle, done: !!invoice.paid_at },
  ];

  const statusLabels: Record<string, string> = {
    pending: 'Tertunda',
    issued: 'Diterbitkan',
    paid: 'Lunas',
    void: 'Dibatalkan',
    overdue: 'Terlambat',
  };

  return (
    <div className="space-y-6">
      <Button 
        variant="ghost" 
        onClick={() => navigate('/merchant/invoices')}
        className="gap-2 px-3 py-1.5 rounded-full bg-card/80 backdrop-blur-sm border border-border/40 hover:bg-card"
        aria-label="Kembali ke daftar faktur"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Kembali ke Faktur
      </Button>

      <div className="flex items-center justify-between flex-wrap gap-4">
        <PageHeader icon={FileText} title={invoice.invoice_number} description="Detail Faktur" />
        <div className="flex items-center gap-2" role="status" aria-label="Status faktur">
          {invoice.grace_period_active && <Badge variant="outline" className="rounded-full">Masa Tenggang</Badge>}
          {overdueDays > 0 && <Badge variant="destructive" className="rounded-full gap-1"><AlertTriangle className="h-3 w-3" aria-hidden="true" /> Terlambat {overdueDays} hari</Badge>}
          <Badge variant={getInvoiceStatusColor(invoice.status)} className="text-sm px-4 py-1.5 rounded-full capitalize">{statusLabels[invoice.status] || invoice.status}</Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {tenant && (
            <div className="bg-card/90 backdrop-blur-sm rounded-2xl border border-border/40 p-6">
              <h3 className="font-semibold text-lg mb-4 flex items-center gap-2"><User className="h-5 w-5 text-primary" aria-hidden="true" /> Info Penyewa</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="flex items-center gap-3">
                  <User className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                  <div>
                    <p className="text-xs text-muted-foreground">Nama</p>
                    <Link to={`/merchant/tenants/${invoice.tenant_user_id}`} className="font-medium hover:underline text-primary">
                      {tenant.full_name || '-'}
                    </Link>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                  <div>
                    <p className="text-xs text-muted-foreground">Email</p>
                    <p className="font-medium">{tenant.email || '-'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                  <div>
                    <p className="text-xs text-muted-foreground">Telepon</p>
                    <p className="font-medium">{tenant.phone || '-'}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {contract && (
            <div className="bg-card/90 backdrop-blur-sm rounded-2xl border border-border/40 p-6">
              <h3 className="font-semibold text-lg mb-4 flex items-center gap-2"><MapPin className="h-5 w-5 text-primary" aria-hidden="true" /> Info Kontrak & Unit</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-3 rounded-xl bg-muted/30">
                  <p className="text-xs text-muted-foreground">Properti</p>
                  {property?.id ? (
                    <Link to={`/merchant/properties/${property.id}`} className="font-medium mt-0.5 text-sm hover:underline text-primary">
                      {property.name}
                    </Link>
                  ) : (
                    <p className="font-medium mt-0.5 text-sm">{property?.name || '-'}</p>
                  )}
                </div>
                <div className="p-3 rounded-xl bg-muted/30">
                  <p className="text-xs text-muted-foreground">Unit</p>
                  {unit?.id ? (
                    <Link to={`/merchant/units/${unit.id}`} className="font-medium mt-0.5 text-sm hover:underline text-primary">
                      {unit.unit_number}
                    </Link>
                  ) : (
                    <p className="font-medium mt-0.5 text-sm">{unit?.unit_number || '-'}</p>
                  )}
                </div>
                <div className="p-3 rounded-xl bg-muted/30">
                  <p className="text-xs text-muted-foreground">Kontrak</p>
                  <Link to={`/merchant/contracts/${contract.id}`} className="font-medium mt-0.5 text-sm hover:underline text-primary">
                    Lihat Kontrak
                  </Link>
                </div>
                <div className="p-3 rounded-xl bg-muted/30">
                  <p className="text-xs text-muted-foreground">Periode</p>
                  <p className="font-medium mt-0.5 text-sm">{format(new Date(contract.start_date), 'dd/MM/yy')} - {format(new Date(contract.end_date), 'dd/MM/yy')}</p>
                </div>
              </div>
            </div>
          )}

          <div className="bg-card/90 backdrop-blur-sm rounded-2xl border border-border/40 p-6 space-y-4">
            <h3 className="font-semibold text-lg">Rincian Jumlah</h3>
            <div className="space-y-3">
              {invoice.original_amount && invoice.original_amount !== invoice.amount && (
                <div className="flex justify-between items-center py-2 text-muted-foreground line-through">
                  <span>Jumlah Awal</span>
                  <span>{formatCurrency(Number(invoice.original_amount))}</span>
                </div>
              )}
              <div className="flex justify-between items-center py-2">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium">{formatCurrency(Number(invoice.amount))}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-muted-foreground">Pajak</span>
                <span className="font-medium">{formatCurrency(Number(invoice.tax_amount || 0))}</span>
              </div>
              {invoice.late_fee > 0 && (
                <div className="flex justify-between items-center py-2 text-destructive">
                  <span>Denda Keterlambatan</span>
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

          {lineItems && lineItems.length > 0 && (
            <div className="bg-card/90 backdrop-blur-sm rounded-2xl border border-border/40 p-6">
              <h3 className="font-semibold text-lg mb-4">Item Baris</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/40">
                      <th className="text-left py-2 text-muted-foreground font-medium">Item</th>
                      <th className="text-right py-2 text-muted-foreground font-medium">Qty</th>
                      <th className="text-right py-2 text-muted-foreground font-medium">Harga</th>
                      <th className="text-right py-2 text-muted-foreground font-medium">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lineItems.map((li, i) => (
                      <tr key={i} className="border-b border-border/20">
                        <td className="py-2">{li.item}</td>
                        <td className="py-2 text-right">{li.qty}</td>
                        <td className="py-2 text-right">{formatCurrency(li.price)}</td>
                        <td className="py-2 text-right font-medium">{formatCurrency(li.qty * li.price)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {invoice.description && (
            <div className="bg-card/90 backdrop-blur-sm rounded-2xl border border-border/40 p-6">
              <h3 className="font-semibold text-lg mb-3">Deskripsi</h3>
              <p className="text-muted-foreground">{invoice.description}</p>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-card/90 backdrop-blur-sm rounded-2xl border border-border/40 p-6">
            <h3 className="font-semibold text-lg mb-4">Timeline</h3>
            <div className="space-y-4" role="list" aria-label="Riwayat status faktur">
              {timelineSteps.map((step, i) => (
                <div key={i} className={`flex items-start gap-3 ${!step.done ? 'opacity-40' : ''}`} role="listitem">
                  <div className={`mt-0.5 p-1.5 rounded-full ${step.done ? 'bg-primary/10' : 'bg-muted/30'}`} aria-hidden="true">
                    <step.icon className={`h-3.5 w-3.5 ${step.done ? 'text-primary' : 'text-muted-foreground'}`} />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{step.label}</p>
                    <p className="text-xs text-muted-foreground">
                      {step.date ? format(new Date(step.date), 'dd MMM yyyy, HH:mm') : 'Belum'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-card/90 backdrop-blur-sm rounded-2xl border border-border/40 p-6 space-y-3">
            <h3 className="font-semibold text-lg mb-2">Aksi</h3>
            <Button 
              variant="outline" 
              className="w-full rounded-xl gap-2" 
              onClick={handleDownload} 
              disabled={generatePdfMutation.isPending}
            >
              {generatePdfMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" aria-hidden="true" />}
              Unduh PDF
            </Button>
            {invoice.status === 'draft' && (
              <Button 
                className="w-full rounded-xl gap-2 gradient-cta text-primary-foreground" 
                onClick={handleSend} 
                disabled={sendInvoiceMutation.isPending}
              >
                {sendInvoiceMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" aria-hidden="true" />}
                Kirim Faktur
              </Button>
            )}
            {(invoice.status === 'sent' || invoice.status === 'overdue') && (
              <>
                <Button 
                  variant="outline" 
                  className="w-full rounded-xl gap-2" 
                  onClick={handleRemind} 
                  disabled={sendReminderMutation.isPending}
                >
                  {sendReminderMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bell className="h-4 w-4" aria-hidden="true" />}
                  Kirim Pengingat
                </Button>
                <Button 
                  className="w-full rounded-xl gap-2 gradient-cta text-primary-foreground" 
                  onClick={handleMarkPaid} 
                  disabled={markAsPaidMutation.isPending}
                >
                  {markAsPaidMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" aria-hidden="true" />}
                  Tandai Sudah Bayar
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
