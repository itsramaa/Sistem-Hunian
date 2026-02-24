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

import { Button } from '@/shared/components/ui/button';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { useToast } from '@/shared/hooks/use-toast';
import { format } from 'date-fns';
import { AlertTriangle, ArrowLeft, Calendar, CheckCircle, FileText, MapPin, Phone, User, Wrench, XCircle } from 'lucide-react';
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';

export default function MerchantMaintenanceDetail() {
  const { id } = useParams<{ id: string }>();
  const { merchant } = useAuth();
  const { toast } = useToast();
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);

  const { data: request, isLoading } = useMaintenanceRequest(id);
  const { data: vendors = [] } = useVerifiedVendors();
  const updateStatusMutation = useUpdateMaintenanceRequest();

  const contract = getRelevantContract(request?.unit?.contracts, request?.tenant_user_id);

  const isContractActive = contract?.status === 'active' || contract?.status === 'notice';
  const isContractValidDate = contract && request && 
    new Date(request.created_at) >= new Date(contract.start_date) &&
    (!contract.end_date || new Date(request.created_at) <= new Date(contract.end_date));

  const handleUpdateStatus = (data: UpdateMaintenanceStatusPayload) => {
    if (!request || !merchant) return;

    updateStatusMutation.mutate(
      {
        ...data,
        actor_id: merchant.user_id,
        actor_role: 'merchant'
      },
      {
        onSuccess: () => {
          toast({ title: 'Status updated successfully' });
          setIsUpdateDialogOpen(false);
        },
        onError: (error) => {
          toast({ 
            title: 'Failed to update status', 
            description: error.message,
            variant: 'destructive' 
          });
        },
      }
    );
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
          <Link to="/merchant/maintenance"><ArrowLeft className="h-4 w-4" /> Back to Maintenance</Link>
        </Button>

        <div className="flex items-center justify-between flex-wrap gap-4">
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
          <div className="flex items-center gap-2">
            <SLABadge slaDeadline={request.sla_deadline} status={request.status} />
            <MaintenanceStatusBadge status={request.status} />
          </div>
        </div>

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

              {request.images && request.images.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Foto Terlampir</p>
                  <div className="grid grid-cols-3 gap-2">
                    {request.images.map((img, idx) => (
                      <a key={idx} href={img} target="_blank" rel="noopener noreferrer">
                        <img
                          src={img}
                          alt={`Attachment ${idx + 1}`}
                          className="w-full h-24 object-cover rounded-xl border border-border/40 hover:opacity-80 transition-opacity"
                        />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Activity Timeline */}
            <div className="bg-card/90 backdrop-blur-sm rounded-2xl border border-border/40 p-6 space-y-4">
              <h3 className="font-semibold text-lg">Activity Timeline</h3>
              <p className="text-sm text-muted-foreground">Communication and status updates</p>
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
                  <p className="font-medium">{request.tenant?.full_name || 'Unknown'}</p>
                  <p className="text-sm text-muted-foreground">{request.tenant?.email}</p>
                </div>
              </div>
              {request.tenant?.phone_number && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="h-4 w-4" />
                  <span>{request.tenant.phone_number}</span>
                </div>
              )}
            </div>

            {/* Unit Info */}
            <div className="bg-card/90 backdrop-blur-sm rounded-2xl border border-border/40 p-6 space-y-4">
              <h3 className="font-semibold flex items-center gap-2"><MapPin className="h-4 w-4 text-primary" /> Unit</h3>
              <div className="space-y-2">
                <p className="font-medium">{request.unit?.property?.name}</p>
                <p className="text-sm text-muted-foreground">Unit {request.unit?.unit_number}</p>
                <p className="text-sm text-muted-foreground">{request.unit?.property?.address}</p>
              </div>
              {contract && (
                <div className={`p-3 rounded-xl text-sm flex items-center gap-2 ${
                  contract.status === 'active' ? 'bg-success/10 text-success border border-success/20' : 'bg-warning/10 text-warning border border-warning/20'
                }`}>
                  <FileText className="h-4 w-4" />
                  <span className="capitalize font-medium">Contract: {contract.status.replace('_', ' ')}</span>
                </div>
              )}
            </div>

            {/* Status Update */}
            <div className="bg-card/90 backdrop-blur-sm rounded-2xl border border-border/40 p-6 space-y-4">
              <h3 className="font-semibold">Update Status</h3>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>Created {format(new Date(request.created_at), 'MMM d, yyyy')}</span>
              </div>

              {!isContractActive && contract && (
                <div className="flex items-start gap-2 p-3 rounded-xl bg-destructive/10 border border-destructive/20">
                  <AlertTriangle className="h-4 w-4 text-destructive mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-destructive">Contract Warning</p>
                    <p className="text-muted-foreground">
                      Contract is currently <strong>{contract.status}</strong>. Proceed with caution.
                    </p>
                  </div>
                </div>
              )}

              {contract && !isContractValidDate && (
                <div className="flex items-start gap-2 p-3 rounded-xl bg-destructive/10 border border-destructive/20">
                  <AlertTriangle className="h-4 w-4 text-destructive mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-destructive">Date Mismatch</p>
                    <p className="text-muted-foreground">
                      Request created outside contract period ({format(new Date(contract.start_date), 'MMM d, yyyy')} - {contract.end_date ? format(new Date(contract.end_date), 'MMM d, yyyy') : 'Indefinite'}).
                    </p>
                  </div>
                </div>
              )}

              {!contract && request.tenant && (
                <div className="flex items-start gap-2 p-3 rounded-xl bg-destructive/10 border border-destructive/20">
                  <AlertTriangle className="h-4 w-4 text-destructive mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-destructive">No Active Contract</p>
                    <p className="text-muted-foreground">Please verify tenant status.</p>
                  </div>
                </div>
              )}

              {request.status !== 'completed' && request.status !== 'cancelled' && (
                <Button 
                  className="w-full gradient-cta rounded-xl" 
                  onClick={() => setIsUpdateDialogOpen(true)}
                >
                  Update Status / Assign Vendor
                </Button>
              )}
              
              {request.status === 'completed' && (
                <div className="p-4 bg-success/10 rounded-xl border border-success/20 text-center">
                  <p className="text-success font-medium flex items-center justify-center gap-2">
                    <CheckCircle className="h-5 w-5" />
                    Completed
                  </p>
                  {request.resolved_at && (
                    <p className="text-sm text-muted-foreground mt-1">
                      on {format(new Date(request.resolved_at), 'MMM d, yyyy')}
                    </p>
                  )}
                  <Button 
                    variant="outline" 
                    className="mt-4 w-full rounded-xl"
                    onClick={() => setIsUpdateDialogOpen(true)}
                  >
                    Update Details
                  </Button>
                </div>
              )}

              {request.status === 'cancelled' && (
                <div className="p-4 bg-destructive/10 rounded-xl border border-destructive/20 text-center">
                  <p className="text-destructive font-medium flex items-center justify-center gap-2">
                    <XCircle className="h-5 w-5" />
                    Cancelled
                  </p>
                </div>
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