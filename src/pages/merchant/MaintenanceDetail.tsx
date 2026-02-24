import { useAuth } from '@/features/auth/hooks/useAuth';
import { getRelevantContract } from '@/features/contracts/utils/contract-utils';
import { MaintenancePriorityBadge } from '@/features/maintenance/components/MaintenancePriorityBadge';
import { MaintenanceStatusBadge } from '@/features/maintenance/components/MaintenanceStatusBadge';
import { SLABadge, getSLAText } from '@/features/maintenance/components/SLABadge';
import { UpdateMaintenanceDialog } from '@/features/maintenance/components/UpdateMaintenanceDialog';
import { UpdateTimeline } from '@/features/maintenance/components/UpdateTimeline';
import {
  useMaintenanceRequest,
  useUpdateMaintenanceRequest,
  useVerifiedVendors
} from '@/features/maintenance/hooks/useMaintenance';
import { UpdateMaintenanceStatusPayload } from '@/features/maintenance/types';

import { OcrCameraButton } from '@/shared/components/OcrCameraButton';
import { Button } from '@/shared/components/ui/button';
import { Progress } from '@/shared/components/ui/progress';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { useToast } from '@/shared/hooks/use-toast';
import { formatCurrency } from '@/shared/utils/currency';
import { format, differenceInHours, differenceInMinutes } from 'date-fns';
import {
  AlertTriangle, ArrowLeft, Calendar, CheckCircle, Clock, DollarSign, FileText,
  ImageIcon, MapPin, Phone, Receipt, Star, User, Wrench, XCircle
} from 'lucide-react';
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/integrations/supabase/client';

function PhotoGallery({ images, title }: { images: string[]; title: string }) {
  const [selectedImg, setSelectedImg] = useState<string | null>(null);

  return (
    <div>
      <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">{title}</p>
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
        {images.map((img, idx) => (
          <button
            key={idx}
            onClick={() => setSelectedImg(img)}
            className="aspect-square rounded-xl overflow-hidden border border-border/40 hover:ring-2 hover:ring-primary/30 transition-all"
          >
            <img src={img} alt={`${title} ${idx + 1}`} className="w-full h-full object-cover" />
          </button>
        ))}
      </div>

      {/* Lightbox */}
      {selectedImg && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setSelectedImg(null)}
        >
          <img
            src={selectedImg}
            alt="Full size"
            className="max-w-full max-h-[90vh] object-contain rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            onClick={() => setSelectedImg(null)}
            className="absolute top-4 right-4 bg-white/10 text-white rounded-full p-2 hover:bg-white/20"
          >
            <XCircle className="h-6 w-6" />
          </button>
        </div>
      )}
    </div>
  );
}

function SLAProgressBar({ createdAt, slaDeadline, status }: { createdAt: string; slaDeadline: string | null; status: string }) {
  if (!slaDeadline || status === 'completed' || status === 'cancelled') return null;

  const now = new Date();
  const created = new Date(createdAt);
  const deadline = new Date(slaDeadline);
  const totalMinutes = differenceInMinutes(deadline, created);
  const elapsedMinutes = differenceInMinutes(now, created);
  const progress = Math.min(100, Math.max(0, (elapsedMinutes / totalMinutes) * 100));
  const hoursLeft = differenceInHours(deadline, now);
  const isOverdue = now > deadline;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground flex items-center gap-1">
          <Clock className="h-3 w-3" /> SLA Progress
        </span>
        <span className={isOverdue ? 'text-destructive font-medium' : hoursLeft <= 4 ? 'text-warning font-medium' : 'text-muted-foreground'}>
          {isOverdue ? `Overdue ${Math.abs(hoursLeft)}j` : `${hoursLeft}j tersisa`}
        </span>
      </div>
      <Progress
        value={progress}
        className={`h-2 ${isOverdue ? '[&>div]:bg-destructive' : progress > 75 ? '[&>div]:bg-warning' : '[&>div]:bg-success'}`}
      />
    </div>
  );
}

export default function MerchantMaintenanceDetail() {
  const { id } = useParams<{ id: string }>();
  const { merchant } = useAuth();
  const { toast } = useToast();
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);

  const { data: request, isLoading } = useMaintenanceRequest(id);
  const { data: vendors = [] } = useVerifiedVendors();
  const updateStatusMutation = useUpdateMaintenanceRequest();

  // Fetch expenses for cost summary
  const { data: expenses = [] } = useQuery({
    queryKey: ['maintenance-expenses', id],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from('maintenance_expenses')
        .select('*')
        .eq('maintenance_request_id', id!)
        .order('created_at', { ascending: false });
      return (data || []) as any[];
    },
    enabled: !!id,
  });

  // Fetch vendor job for agreed price
  const { data: vendorJob } = useQuery({
    queryKey: ['vendor-job-for-maintenance', id],
    queryFn: async () => {
      const { data } = await supabase
        .from('vendor_jobs')
        .select('agreed_price, status, completed_at')
        .eq('maintenance_request_id', id!)
        .maybeSingle();
      return data;
    },
    enabled: !!id,
  });

  const contract = getRelevantContract(request?.unit?.contracts, request?.tenant_user_id);
  const isContractActive = contract?.status === 'active' || contract?.status === 'notice';

  const totalExpenses = expenses.reduce((sum: number, e: any) => sum + (e.total_amount || 0), 0);

  const handleUpdateStatus = (data: UpdateMaintenanceStatusPayload) => {
    if (!request || !merchant) return;
    updateStatusMutation.mutate(
      { ...data, actor_id: merchant.user_id, actor_role: 'merchant' },
      {
        onSuccess: () => {
          toast({ title: 'Status updated successfully' });
          setIsUpdateDialogOpen(false);
        },
        onError: (error) => {
          toast({ title: 'Failed to update status', description: error.message, variant: 'destructive' });
        },
      }
    );
  };

  const handleOcrReceiptExtracted = (data: Record<string, any>) => {
    toast({
      title: 'Struk berhasil di-scan',
      description: `Total: ${formatCurrency(data.total_amount || 0)} - ${data.vendor_name || 'Unknown vendor'}`,
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48 rounded-xl" />
        <Skeleton className="h-20 rounded-2xl" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-64 rounded-2xl" />
            <Skeleton className="h-96 rounded-2xl" />
          </div>
          <Skeleton className="h-64 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" asChild className="gap-2 rounded-xl">
          <Link to="/merchant/maintenance"><ArrowLeft className="h-4 w-4" /> Back</Link>
        </Button>
        <div className="text-center py-16">
          <Wrench className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold">Permintaan pemeliharaan tidak ditemukan</h2>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <Button variant="ghost" asChild className="gap-2 rounded-xl">
          <Link to="/merchant/maintenance"><ArrowLeft className="h-4 w-4" /> Kembali</Link>
        </Button>

        {/* Title + Quick Actions */}
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="gradient-icon-box w-12 h-12"><Wrench className="h-6 w-6 text-primary" /></div>
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-display font-bold">{request.title}</h1>
                <MaintenancePriorityBadge priority={request.priority} />
              </div>
              <p className="text-sm text-muted-foreground">#{id?.slice(0, 8)} • SLA: {getSLAText(request.priority)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <SLABadge slaDeadline={request.sla_deadline} status={request.status} />
            <MaintenanceStatusBadge status={request.status} />
            {request.status !== 'completed' && request.status !== 'cancelled' && (
              <Button className="gradient-cta rounded-xl" onClick={() => setIsUpdateDialogOpen(true)}>
                Update Status
              </Button>
            )}
          </div>
        </div>

        {/* SLA Progress */}
        <SLAProgressBar createdAt={request.created_at} slaDeadline={request.sla_deadline} status={request.status} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Request Details */}
            <div className="bg-card/90 backdrop-blur-sm rounded-2xl border border-border/40 p-6 space-y-4">
              <h3 className="font-semibold text-lg">Rincian Permintaan</h3>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Deskripsi</p>
                <p className="text-sm">{request.description || 'Tidak ada deskripsi'}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-muted/20 rounded-xl p-4">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Kategori</p>
                  <p className="font-semibold capitalize">{request.category.replace('_', ' ')}</p>
                </div>
                <div className="bg-muted/20 rounded-xl p-4">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Prioritas</p>
                  <p className="font-semibold capitalize">{request.priority}</p>
                </div>
              </div>

              {/* Photo Gallery */}
              {request.images && request.images.length > 0 && (
                <PhotoGallery images={request.images} title="Foto Masalah" />
              )}

              {/* Completion Photos */}
              {request.completion_photos && request.completion_photos.length > 0 && (
                <PhotoGallery images={request.completion_photos} title="Foto Penyelesaian" />
              )}

              {/* Completion Notes */}
              {request.completion_notes && (
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Catatan Penyelesaian</p>
                  <p className="text-sm bg-success/5 border border-success/20 rounded-xl p-3">{request.completion_notes}</p>
                </div>
              )}
            </div>

            {/* Cost Summary */}
            <div className="bg-card/90 backdrop-blur-sm rounded-2xl border border-border/40 p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-primary" /> Ringkasan Biaya
                </h3>
                <OcrCameraButton
                  label="Scan Struk"
                  bucket="maintenance-photos"
                  edgeFunction="ocr-maintenance-receipt"
                  extraPayload={{ maintenance_request_id: request.id }}
                  onExtracted={handleOcrReceiptExtracted}
                  icon={<Receipt className="h-4 w-4" />}
                  size="sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-muted/20 rounded-xl p-4">
                  <p className="text-xs text-muted-foreground mb-1">Harga Disepakati</p>
                  <p className="text-lg font-bold">{vendorJob?.agreed_price ? formatCurrency(vendorJob.agreed_price) : '—'}</p>
                </div>
                <div className="bg-muted/20 rounded-xl p-4">
                  <p className="text-xs text-muted-foreground mb-1">Total Pengeluaran</p>
                  <p className="text-lg font-bold">{totalExpenses > 0 ? formatCurrency(totalExpenses) : '—'}</p>
                </div>
              </div>

              {expenses.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Detail Pengeluaran</p>
                  {expenses.map((exp: any) => (
                    <div key={exp.id} className="flex items-center justify-between py-2 border-b border-border/20 last:border-0">
                      <div>
                        <p className="text-sm font-medium">{exp.vendor_name || 'Vendor tidak diketahui'}</p>
                        <p className="text-xs text-muted-foreground">{exp.receipt_date ? format(new Date(exp.receipt_date), 'dd MMM yyyy') : '—'}</p>
                      </div>
                      <p className="font-semibold">{formatCurrency(exp.total_amount)}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Activity Timeline */}
            <div className="bg-card/90 backdrop-blur-sm rounded-2xl border border-border/40 p-6 space-y-4">
              <h3 className="font-semibold text-lg">Timeline Aktivitas</h3>
              <UpdateTimeline
                maintenanceRequestId={request.id}
                authorRole="merchant"
                canAddUpdate={request.status !== 'completed' && request.status !== 'cancelled'}
              />
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Tenant Info */}
            <div className="bg-card/90 backdrop-blur-sm rounded-2xl border border-border/40 p-6 space-y-4">
              <h3 className="font-semibold flex items-center gap-2"><User className="h-4 w-4 text-primary" /> Tenant</h3>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div>
                  {request.tenant?.user_id ? (
                    <Link to={`/merchant/tenants/${request.tenant_user_id}`} className="font-medium hover:underline text-primary">
                      {request.tenant.full_name}
                    </Link>
                  ) : (
                    <p className="font-medium">{request.tenant?.full_name || 'Dibuat oleh Merchant'}</p>
                  )}
                  <p className="text-sm text-muted-foreground">{request.tenant?.email || '—'}</p>
                </div>
              </div>
              {request.tenant?.phone && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="h-4 w-4" />
                  <span>{request.tenant.phone}</span>
                </div>
              )}
            </div>

            {/* Unit Info */}
            <div className="bg-card/90 backdrop-blur-sm rounded-2xl border border-border/40 p-6 space-y-4">
              <h3 className="font-semibold flex items-center gap-2"><MapPin className="h-4 w-4 text-primary" /> Unit</h3>
              <div className="space-y-2">
                {request.unit?.property?.id ? (
                  <Link to={`/merchant/properties/${request.unit.property.id}`} className="font-medium hover:underline text-primary">
                    {request.unit.property.name}
                  </Link>
                ) : (
                  <p className="font-medium">{request.unit?.property?.name}</p>
                )}
                {request.unit?.id ? (
                  <Link to={`/merchant/units/${request.unit.id}`} className="text-sm hover:underline text-primary block">
                    Unit {request.unit.unit_number}
                  </Link>
                ) : (
                  <p className="text-sm text-muted-foreground">Unit {request.unit?.unit_number}</p>
                )}
                <p className="text-sm text-muted-foreground">{request.unit?.property?.address}</p>
              </div>
              {contract && (
                <div className={`p-3 rounded-xl text-sm flex items-center gap-2 ${
                  contract.status === 'active' ? 'bg-success/10 text-success border border-success/20' : 'bg-warning/10 text-warning border border-warning/20'
                }`}>
                  <FileText className="h-4 w-4" />
                  <span className="capitalize font-medium">Kontrak: {contract.status}</span>
                </div>
              )}
            </div>

            {/* Vendor Info */}
            {request.assigned_vendor && (
              <div className="bg-card/90 backdrop-blur-sm rounded-2xl border border-border/40 p-6 space-y-4">
                <h3 className="font-semibold flex items-center gap-2"><Wrench className="h-4 w-4 text-primary" /> Vendor</h3>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
                    <Wrench className="h-5 w-5 text-accent-foreground" />
                  </div>
                  <div>
                    <p className="font-medium">{request.assigned_vendor.business_name}</p>
                    {request.assigned_vendor.phone_number && (
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Phone className="h-3 w-3" /> {request.assigned_vendor.phone_number}
                      </p>
                    )}
                  </div>
                </div>
                {vendorJob && (
                  <div className="bg-muted/20 rounded-xl p-3 space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Status Pekerjaan</span>
                      <span className="font-medium capitalize">{vendorJob.status}</span>
                    </div>
                    {vendorJob.agreed_price && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Harga</span>
                        <span className="font-medium">{formatCurrency(vendorJob.agreed_price)}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Status Update */}
            <div className="bg-card/90 backdrop-blur-sm rounded-2xl border border-border/40 p-6 space-y-4">
              <h3 className="font-semibold">Info Waktu</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>Dibuat {format(new Date(request.created_at), 'dd MMM yyyy, HH:mm')}</span>
                </div>
                {request.resolved_at && (
                  <div className="flex items-center gap-2 text-success">
                    <CheckCircle className="h-4 w-4" />
                    <span>Selesai {format(new Date(request.resolved_at), 'dd MMM yyyy, HH:mm')}</span>
                  </div>
                )}
              </div>

              {!isContractActive && contract && (
                <div className="flex items-start gap-2 p-3 rounded-xl bg-destructive/10 border border-destructive/20">
                  <AlertTriangle className="h-4 w-4 text-destructive mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-destructive">Peringatan Kontrak</p>
                    <p className="text-muted-foreground">Kontrak berstatus <strong>{contract.status}</strong>.</p>
                  </div>
                </div>
              )}

              {request.status === 'completed' && (
                <div className="p-4 bg-success/10 rounded-xl border border-success/20 text-center">
                  <p className="text-success font-medium flex items-center justify-center gap-2">
                    <CheckCircle className="h-5 w-5" /> Selesai
                  </p>
                  <Button variant="outline" className="mt-3 w-full rounded-xl" onClick={() => setIsUpdateDialogOpen(true)}>
                    Update Detail
                  </Button>
                </div>
              )}

              {request.status === 'cancelled' && (
                <div className="p-4 bg-destructive/10 rounded-xl border border-destructive/20 text-center">
                  <p className="text-destructive font-medium flex items-center justify-center gap-2">
                    <XCircle className="h-5 w-5" /> Dibatalkan
                  </p>
                </div>
              )}

              {request.status !== 'completed' && request.status !== 'cancelled' && (
                <Button className="w-full gradient-cta rounded-xl" onClick={() => setIsUpdateDialogOpen(true)}>
                  Update Status / Assign Vendor
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <UpdateMaintenanceDialog
        open={isUpdateDialogOpen}
        onOpenChange={setIsUpdateDialogOpen}
        request={request}
        vendors={vendors}
        onSubmit={handleUpdateStatus}
        loading={updateStatusMutation.isPending}
      />
    </>
  );
}
