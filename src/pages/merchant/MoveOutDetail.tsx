import { useAuth } from '@/features/auth/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/integrations/supabase/client';
import { MoveOutStatusBadge } from '@/features/contracts/components/MoveOutStatusBadge';
import { Button } from '@/shared/components/ui/button';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { formatCurrency } from '@/shared/utils/currency';
import { differenceInDays, format } from 'date-fns';
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
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-48 rounded-2xl" />
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    );
  }

  if (!notice) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => navigate('/merchant/move-outs')} className="gap-2 rounded-xl"><ArrowLeft className="h-4 w-4" /> Back</Button>
        <div className="text-center py-16">
          <DoorOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold">Move-out notice not found</h2>
        </div>
      </div>
    );
  }

  const contract = notice.contract as any;
  const unit = contract?.unit;
  const property = unit?.property;
  const daysUntil = differenceInDays(new Date(notice.intended_move_out_date), new Date());

  // Build a simplified inspection object for the badge
  const inspectionForBadge = inspection ? {
    id: inspection.id,
    move_out_notice_id: inspection.move_out_notice_id,
    status: inspection.status as 'scheduled' | 'completed' | 'pending',
    scheduled_date: inspection.scheduled_date,
    notes: null as string | null,
  } : undefined;

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={() => navigate('/merchant/move-outs')} className="gap-2 rounded-xl">
        <ArrowLeft className="h-4 w-4" /> Back to Move-Outs
      </Button>

      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="gradient-icon-box w-12 h-12"><DoorOpen className="h-6 w-6 text-primary" /></div>
          <div>
            <h1 className="text-2xl font-display font-bold">Move-Out Details</h1>
            <p className="text-sm text-muted-foreground">{property?.name} - Unit {unit?.unit_number}</p>
          </div>
        </div>
        <MoveOutStatusBadge notice={notice as any} inspection={inspectionForBadge} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Notice Info */}
          <div className="bg-card/90 backdrop-blur-sm rounded-2xl border border-border/40 p-6 space-y-4">
            <h3 className="font-semibold text-lg">Notice Information</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div className="bg-muted/20 rounded-xl p-4">
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Move-Out Date</p>
                <p className="font-semibold">{format(new Date(notice.intended_move_out_date), 'MMM dd, yyyy')}</p>
              </div>
              <div className="bg-muted/20 rounded-xl p-4">
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Days Left</p>
                <p className={`font-semibold ${daysUntil <= 7 ? 'text-destructive' : ''}`}>{daysUntil} days</p>
              </div>
              <div className="bg-muted/20 rounded-xl p-4">
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Deposit</p>
                <p className="font-semibold">{formatCurrency(contract?.deposit_amount || 0)}</p>
              </div>
            </div>
            {notice.reason && (
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Reason</p>
                <p className="text-sm">{notice.reason}</p>
              </div>
            )}
            {notice.is_early_termination && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-warning/10 border border-warning/20">
                <AlertTriangle className="h-4 w-4 text-warning" />
                <span className="text-sm font-medium text-warning">Early Termination</span>
              </div>
            )}
          </div>

          {/* Inspection */}
          <div className="bg-card/90 backdrop-blur-sm rounded-2xl border border-border/40 p-6 space-y-4">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <ClipboardCheck className="h-5 w-5 text-primary" /> Inspection
            </h3>
            {inspection ? (
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-muted/20 rounded-xl p-4">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Scheduled Date</p>
                  <p className="font-semibold">{inspection.scheduled_date ? format(new Date(inspection.scheduled_date), 'MMM dd, yyyy') : 'N/A'}</p>
                </div>
                <div className="bg-muted/20 rounded-xl p-4">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Status</p>
                  <p className="font-semibold capitalize">{inspection.status}</p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic">No inspection scheduled yet</p>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="bg-card/90 backdrop-blur-sm rounded-2xl border border-border/40 p-6 space-y-4">
            <h3 className="font-semibold flex items-center gap-2"><User className="h-4 w-4 text-primary" /> Tenant</h3>
            <div className="space-y-2">
              <p className="font-medium">{tenantProfile?.full_name || 'Unknown'}</p>
              <p className="text-sm text-muted-foreground">{tenantProfile?.email}</p>
              {tenantProfile?.phone && <p className="text-sm text-muted-foreground">{tenantProfile.phone}</p>}
            </div>
          </div>

          <div className="bg-card/90 backdrop-blur-sm rounded-2xl border border-border/40 p-6 space-y-4">
            <h3 className="font-semibold flex items-center gap-2"><Home className="h-4 w-4 text-primary" /> Property</h3>
            <div className="space-y-2">
              <p className="font-medium">{property?.name}</p>
              <p className="text-sm text-muted-foreground">Unit {unit?.unit_number}</p>
              <p className="text-sm text-muted-foreground">{property?.address}, {property?.city}</p>
            </div>
          </div>

          <div className="bg-card/90 backdrop-blur-sm rounded-2xl border border-border/40 p-6 space-y-3">
            <h3 className="font-semibold">Quick Actions</h3>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>Notice filed {format(new Date(notice.created_at), 'MMM d, yyyy')}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}