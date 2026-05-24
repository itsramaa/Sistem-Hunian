import { useAuth } from '@/features/auth/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/integrations/supabase/client';
import { MoveOutStatusBadge } from '@/features/contracts/components/MoveOutStatusBadge';
import { Button } from '@/shared/components/ui/button';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { formatCurrency } from '@/shared/utils/currency';
import { differenceInDays, format } from 'date-fns';
import { id } from 'date-fns/locale';
import { ArrowLeft, AlertTriangle, Calendar, CheckCircle, ClipboardCheck, DoorOpen, Home, User, Wallet } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';

export default function MerchantMoveOutDetail() {
  const { noticeId } = useParams<{ noticeId: string }>();
  const navigate = useNavigate();
  const { merchant } = useAuth();

  const { data: notice, isLoading } = useQuery({
    queryKey: ['move-out-notice', noticeId],
    queryFn: async () => {
      if (!noticeId) return null;
      const { data, error } = await supabase
        .from('move_out_notices')
        .select(`*, contract:contracts(*, unit:units(*, property:properties(*)))`)
        .eq('id', noticeId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!noticeId,
  });

  const { data: inspection } = useQuery({
    queryKey: ['move-out-inspection', noticeId],
    queryFn: async () => {
      if (!noticeId) return null;
      const { data } = await supabase.from('move_out_inspections').select('*').eq('move_out_notice_id', noticeId).maybeSingle();
      return data;
    },
    enabled: !!noticeId,
  });

  const { data: tenantProfile } = useQuery({
    queryKey: ['tenant-profile', notice?.tenant_user_id],
    queryFn: async () => {
      if (!notice?.tenant_user_id) return null;
      const { data } = await supabase.from('profiles').select('full_name, email, phone').eq('user_id', notice.tenant_user_id).single();
      return data;
    },
    enabled: !!notice?.tenant_user_id,
  });

  if (isLoading) {
    return (
      <div className="space-y-6" role="status" aria-label="Memuat detail pindah keluar">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-48 rounded-2xl" />
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    );
  }

  if (!notice) {
    return (
      <div className="space-y-6">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/merchant/move-outs')} 
          className="gap-2 rounded-xl"
          aria-label="Kembali ke daftar pindah keluar"
        >
          <ArrowLeft className="h-4 w-4" /> Kembali
        </Button>
        <div className="text-center py-16" role="alert">
          <DoorOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold">Pemberitahuan pindah keluar tidak ditemukan</h2>
        </div>
      </div>
    );
  }

  const contract = notice.contract as any;
  const unit = contract?.unit;
  const property = unit?.property;
  const daysUntil = differenceInDays(new Date(notice.intended_move_out_date), new Date());

  const inspectionForBadge = inspection ? {
    id: inspection.id,
    move_out_notice_id: inspection.move_out_notice_id,
    status: inspection.status as 'scheduled' | 'completed' | 'pending',
    scheduled_date: inspection.scheduled_date,
    notes: null as string | null,
  } : undefined;

  const inspectionStatusLabels: Record<string, string> = {
    scheduled: 'Terjadwal',
    completed: 'Selesai',
    pending: 'Menunggu',
  };

  return (
    <div className="space-y-6">
      <Button 
        variant="ghost" 
        onClick={() => navigate('/merchant/move-outs')} 
        className="gap-2 rounded-xl"
        aria-label="Kembali ke daftar pindah keluar"
      >
        <ArrowLeft className="h-4 w-4" /> Kembali ke Pindah Keluar
      </Button>

      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="gradient-icon-box w-12 h-12" aria-hidden="true">
            <DoorOpen className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold">Detail Pindah Keluar</h1>
            <p className="text-sm text-muted-foreground">{property?.name} - Unit {unit?.unit_number}</p>
          </div>
        </div>
        <MoveOutStatusBadge notice={notice as any} inspection={inspectionForBadge} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <section className="bg-card/90 backdrop-blur-sm rounded-2xl border border-border/40 p-6 space-y-4" aria-labelledby="notice-info-title">
            <h3 id="notice-info-title" className="font-semibold text-lg">Informasi Pemberitahuan</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div className="bg-muted/20 rounded-xl p-4">
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Tanggal Pindah</p>
                <p className="font-semibold">{format(new Date(notice.intended_move_out_date), 'dd MMM yyyy', { locale: id })}</p>
              </div>
              <div className="bg-muted/20 rounded-xl p-4">
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Hari Tersisa</p>
                <p className={`font-semibold ${daysUntil <= 7 ? 'text-destructive' : ''}`}>{daysUntil} hari</p>
              </div>
              <div className="bg-muted/20 rounded-xl p-4">
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Deposit</p>
                <p className="font-semibold">{formatCurrency(contract?.deposit_amount || 0)}</p>
              </div>
            </div>
            {notice.reason && (
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Alasan</p>
                <p className="text-sm">{notice.reason}</p>
              </div>
            )}
            {notice.is_early_termination && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-warning/10 border border-warning/20" role="status">
                <AlertTriangle className="h-4 w-4 text-warning" aria-hidden="true" />
                <span className="text-sm font-medium text-warning">Terminasi Dini</span>
              </div>
            )}
          </section>

          <section className="bg-card/90 backdrop-blur-sm rounded-2xl border border-border/40 p-6 space-y-4" aria-labelledby="inspection-title">
            <h3 id="inspection-title" className="font-semibold text-lg flex items-center gap-2">
              <ClipboardCheck className="h-5 w-5 text-primary" aria-hidden="true" /> Inspeksi
            </h3>
            {inspection ? (
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-muted/20 rounded-xl p-4">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Tanggal Terjadwal</p>
                  <p className="font-semibold">
                    {inspection.scheduled_date ? format(new Date(inspection.scheduled_date), 'dd MMM yyyy', { locale: id }) : 'N/A'}
                  </p>
                </div>
                <div className="bg-muted/20 rounded-xl p-4">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Status</p>
                  <p className="font-semibold capitalize">{inspectionStatusLabels[inspection.status] || inspection.status}</p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic">Belum ada inspeksi yang dijadwalkan</p>
            )}
          </section>
        </div>

        <aside className="space-y-6">
          <section className="bg-card/90 backdrop-blur-sm rounded-2xl border border-border/40 p-6 space-y-4" aria-labelledby="tenant-title">
            <h3 id="tenant-title" className="font-semibold flex items-center gap-2">
              <User className="h-4 w-4 text-primary" aria-hidden="true" /> Penyewa
            </h3>
            <div className="space-y-2">
              <p className="font-medium">{tenantProfile?.full_name || 'Tidak diketahui'}</p>
              <p className="text-sm text-muted-foreground">{tenantProfile?.email}</p>
              {tenantProfile?.phone && <p className="text-sm text-muted-foreground">{tenantProfile.phone}</p>}
            </div>
          </section>

          <section className="bg-card/90 backdrop-blur-sm rounded-2xl border border-border/40 p-6 space-y-4" aria-labelledby="property-title">
            <h3 id="property-title" className="font-semibold flex items-center gap-2">
              <Home className="h-4 w-4 text-primary" aria-hidden="true" /> Properti
            </h3>
            <div className="space-y-2">
              <p className="font-medium">{property?.name}</p>
              <p className="text-sm text-muted-foreground">Unit {unit?.unit_number}</p>
              <p className="text-sm text-muted-foreground">{property?.address}, {property?.city}</p>
            </div>
          </section>

          <section className="bg-card/90 backdrop-blur-sm rounded-2xl border border-border/40 p-6 space-y-3" aria-labelledby="actions-title">
            <h3 id="actions-title" className="font-semibold">Info Cepat</h3>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" aria-hidden="true" />
              <span>Pemberitahuan diajukan {format(new Date(notice.created_at), 'dd MMM yyyy', { locale: id })}</span>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
