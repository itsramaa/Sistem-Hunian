import { useAuth } from '@/features/auth/hooks/useAuth';
import { MarkPaidDialog } from '@/features/payments/components/MarkPaidDialog';
import { Payment } from '@/features/payments/types';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Dialog, DialogContent } from '@/shared/components/ui/dialog';
import { PageHeader } from '@/shared/components/ui/PageHeader';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { formatCurrency } from '@/shared/utils/currency';
import { supabase } from '@/lib/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ArrowLeft, Bell, Calendar, CheckCircle, Clock, CreditCard, FileImage, Loader2, Mail, MapPin, Phone, User, XCircle } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMerchantPayments } from '@/features/payments/hooks/useMerchantPayments';

const getStatusVariant = (status: string): "default" | "secondary" | "destructive" => {
  switch (status) {
    case 'paid': return 'default';
    case 'overdue': return 'destructive';
    default: return 'secondary';
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'pending': return <Clock className="h-4 w-4" />;
    case 'paid': return <CheckCircle className="h-4 w-4" />;
    case 'overdue': return <XCircle className="h-4 w-4" />;
    default: return <Calendar className="h-4 w-4" />;
  }
};

export default function MerchantPaymentDetail() {
  const { paymentId } = useParams<{ paymentId: string }>();
  const navigate = useNavigate();
  const { merchant } = useAuth();
  const { markPaid, sendReminder, isMarkingPaid, isSendingReminder } = useMerchantPayments(merchant?.id);
  const [isMarkPaidOpen, setIsMarkPaidOpen] = useState(false);
  const [showProofLightbox, setShowProofLightbox] = useState(false);

  // Fetch payment with contract relation
  const { data: payment, isLoading } = useQuery({
    queryKey: ['payment-detail', paymentId],
    queryFn: async () => {
      if (!paymentId) return null;
      const { data, error } = await supabase
        .from('payments')
        .select(`
          *,
          contracts(
            id, start_date, end_date, rent_amount,
            units(id, unit_number, properties(id, name))
          )
        `)
        .eq('id', paymentId)
        .maybeSingle();
      if (error) throw error;
      return data as any;
    },
    enabled: !!paymentId,
  });

  // Fetch tenant profile separately
  const { data: tenant } = useQuery({
    queryKey: ['payment-tenant', payment?.tenant_user_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('full_name, email, phone')
        .eq('user_id', payment!.tenant_user_id)
        .maybeSingle();
      if (error) throw error;
      return data as { full_name: string; email: string; phone: string | null } | null;
    },
    enabled: !!payment?.tenant_user_id,
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6"><Skeleton className="h-48 rounded-2xl" /><Skeleton className="h-64 rounded-2xl" /></div>
          <Skeleton className="h-80 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!payment) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => navigate('/merchant/payments')} className="gap-2"><ArrowLeft className="h-4 w-4" /> Kembali</Button>
        <div className="text-center py-16">
          <CreditCard className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold">Pembayaran tidak ditemukan</h2>
        </div>
      </div>
    );
  }

  const contract = payment.contracts;
  const unit = contract?.units;
  const property = unit?.properties;

  const timelineItems = [
    { label: 'Dibuat', date: payment.created_at, icon: Calendar, active: true },
    { label: 'Jatuh Tempo', date: payment.due_date, icon: Clock, active: true },
    ...(payment.paid_at ? [{ label: 'Dibayar', date: payment.paid_at, icon: CheckCircle, active: true }] : []),
  ];

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={() => navigate('/merchant/payments')}
        className="gap-2 px-3 py-1.5 rounded-full bg-card/80 backdrop-blur-sm border border-border/40 hover:bg-card">
        <ArrowLeft className="h-4 w-4" /> Kembali ke Pembayaran
      </Button>

      <div className="flex items-center justify-between flex-wrap gap-4">
        <PageHeader icon={CreditCard} title="Detail Pembayaran" description={`Pembayaran ${payment.payment_type}`} />
        <Badge variant={getStatusVariant(payment.status)} className="text-sm px-4 py-1.5 rounded-full capitalize gap-2">
          {getStatusIcon(payment.status)} {payment.status}
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Amount Card */}
          <div className="bg-card/90 backdrop-blur-sm rounded-2xl border border-border/40 p-8 text-center">
            <p className="text-sm text-muted-foreground uppercase tracking-wider mb-2">Jumlah</p>
            <p className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              {formatCurrency(Number(payment.amount))}
            </p>
          </div>

          {/* Tenant Info */}
          {tenant && (
            <div className="bg-card/90 backdrop-blur-sm rounded-2xl border border-border/40 p-6">
              <h3 className="font-semibold text-lg mb-4 flex items-center gap-2"><User className="h-5 w-5 text-primary" /> Info Penyewa</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="flex items-center gap-3"><User className="h-4 w-4 text-muted-foreground" /><div><p className="text-xs text-muted-foreground">Nama</p><Link to={`/merchant/tenants/${payment.tenant_user_id}`} className="font-medium hover:underline text-primary">{tenant.full_name || '-'}</Link></div></div>
                <div className="flex items-center gap-3"><Mail className="h-4 w-4 text-muted-foreground" /><div><p className="text-xs text-muted-foreground">Email</p><p className="font-medium">{tenant.email || '-'}</p></div></div>
                <div className="flex items-center gap-3"><Phone className="h-4 w-4 text-muted-foreground" /><div><p className="text-xs text-muted-foreground">Telepon</p><p className="font-medium">{tenant.phone || '-'}</p></div></div>
              </div>
            </div>
          )}

          {/* Contract & Unit Info */}
          {contract && (
            <div className="bg-card/90 backdrop-blur-sm rounded-2xl border border-border/40 p-6">
              <h3 className="font-semibold text-lg mb-4 flex items-center gap-2"><MapPin className="h-5 w-5 text-primary" /> Info Kontrak & Unit</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-3 rounded-xl bg-muted/30">
                  <p className="text-xs text-muted-foreground">Properti</p>
                  {property?.id ? (
                    <Link to={`/merchant/properties/${property.id}`} className="font-medium mt-0.5 text-sm hover:underline text-primary">{property.name}</Link>
                  ) : (
                    <p className="font-medium mt-0.5 text-sm">{property?.name || '-'}</p>
                  )}
                </div>
                <div className="p-3 rounded-xl bg-muted/30">
                  <p className="text-xs text-muted-foreground">Unit</p>
                  {unit?.id ? (
                    <Link to={`/merchant/units/${unit.id}`} className="font-medium mt-0.5 text-sm hover:underline text-primary">{unit.unit_number}</Link>
                  ) : (
                    <p className="font-medium mt-0.5 text-sm">{unit?.unit_number || '-'}</p>
                  )}
                </div>
                <div className="p-3 rounded-xl bg-muted/30">
                  <p className="text-xs text-muted-foreground">Kontrak</p>
                  <Link to={`/merchant/contracts/${contract.id}`} className="font-medium mt-0.5 text-sm hover:underline text-primary">Lihat Kontrak</Link>
                </div>
                <div className="p-3 rounded-xl bg-muted/30">
                  <p className="text-xs text-muted-foreground">Periode</p>
                  <p className="font-medium mt-0.5 text-sm">{format(new Date(contract.start_date), 'dd/MM/yy')} - {format(new Date(contract.end_date), 'dd/MM/yy')}</p>
                </div>
              </div>
            </div>
          )}

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Tipe', value: payment.payment_type, capitalize: true },
              { label: 'Jatuh Tempo', value: format(new Date(payment.due_date), 'dd MMMM yyyy') },
              { label: 'Metode', value: payment.payment_method || 'Belum ditentukan', capitalize: true },
              { label: 'Referensi', value: payment.reference || '-' },
              { label: 'Dibuat', value: format(new Date(payment.created_at), 'dd MMM yyyy HH:mm') },
              ...(payment.paid_at ? [{ label: 'Dibayar', value: format(new Date(payment.paid_at), 'dd MMM yyyy HH:mm'), capitalize: false }] : []),
            ].map((item, i) => (
              <div key={i} className="bg-card/90 backdrop-blur-sm rounded-2xl border border-border/40 p-4 hover:bg-primary/5 transition-all">
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">{item.label}</p>
                <p className={`font-medium ${item.capitalize ? 'capitalize' : ''}`}>{item.value}</p>
              </div>
            ))}
          </div>

          {/* Proof Photo */}
          {payment.proof_photo_url && (
            <div className="bg-card/90 backdrop-blur-sm rounded-2xl border border-border/40 p-6">
              <h3 className="font-semibold text-lg mb-4 flex items-center gap-2"><FileImage className="h-5 w-5 text-primary" /> Bukti Pembayaran</h3>
              <div className="cursor-pointer rounded-xl overflow-hidden border border-border/50 hover:border-primary/50 transition-all"
                onClick={() => setShowProofLightbox(true)}>
                <img src={payment.proof_photo_url} alt="Bukti pembayaran" className="w-full max-h-64 object-contain bg-muted/20" />
              </div>
              <p className="text-xs text-muted-foreground mt-2">Klik gambar untuk memperbesar</p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Timeline */}
          <div className="bg-card/90 backdrop-blur-sm rounded-2xl border border-border/40 p-6">
            <h3 className="font-semibold text-lg mb-4">Timeline</h3>
            <div className="space-y-4">
              {timelineItems.map((item, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="mt-0.5 p-1.5 rounded-full bg-primary/10">
                    <item.icon className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{item.label}</p>
                    <p className="text-xs text-muted-foreground">{format(new Date(item.date), 'dd MMM yyyy, HH:mm')}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="bg-card/90 backdrop-blur-sm rounded-2xl border border-border/40 p-6 space-y-3">
            <h3 className="font-semibold text-lg mb-2">Aksi</h3>
            {(payment.status === 'pending' || payment.status === 'overdue') && (
              <>
                <Button className="w-full rounded-xl gap-2 gradient-cta text-primary-foreground" onClick={() => setIsMarkPaidOpen(true)}>
                  <CheckCircle className="h-4 w-4" /> Tandai Lunas
                </Button>
                <Button variant="outline" className="w-full rounded-xl gap-2" onClick={() => sendReminder(payment.id)} disabled={isSendingReminder}>
                  {isSendingReminder ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bell className="h-4 w-4" />}
                  Kirim Pengingat
                </Button>
              </>
            )}
            {payment.status === 'paid' && (
              <div className="text-center py-4">
                <CheckCircle className="h-8 w-8 mx-auto text-success mb-2" />
                <p className="text-sm text-muted-foreground">Pembayaran ini sudah selesai</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Lightbox */}
      <Dialog open={showProofLightbox} onOpenChange={setShowProofLightbox}>
        <DialogContent className="max-w-3xl p-2 rounded-2xl">
          <img src={payment.proof_photo_url || ''} alt="Bukti pembayaran" className="w-full rounded-xl" />
        </DialogContent>
      </Dialog>

      <MarkPaidDialog
        open={isMarkPaidOpen}
        onOpenChange={setIsMarkPaidOpen}
        payment={payment}
        onConfirm={({ paymentId: pid, method, reference: ref, proofPhotoUrl }) => {
          markPaid({ id: pid, payment_method: method, reference: ref, proof_photo_url: proofPhotoUrl }, {
            onSuccess: () => setIsMarkPaidOpen(false),
          });
        }}
        loading={isMarkingPaid}
      />
    </div>
  );
}
