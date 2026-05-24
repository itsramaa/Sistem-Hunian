import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { apiClient } from '@/lib/axios';
import { TenantLayout } from '@/shared/components/layouts/TenantLayout';
import { UpdateTimeline } from '@/features/maintenance/components/UpdateTimeline';
import { MaintenanceReviewForm } from '@/features/maintenance/components/MaintenanceReviewForm';
import { SLABadge } from '@/features/maintenance/components/SLABadge';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { ArrowLeft, Wrench, Clock, CheckCircle, AlertTriangle, Calendar, MapPin, Loader2, Star, X } from 'lucide-react';
import { format } from 'date-fns';

export default function MaintenanceDetail() {
  const { requestId } = useParams<{ requestId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data: request, isLoading } = useQuery({
    queryKey: ['maintenance-request', requestId],
    queryFn: async () => {
      if (!requestId) return null;
      // TODO: Go endpoint not yet implemented — was: supabase.from('maintenance_requests').select('*, unit:units(...)').eq('id', requestId).eq('tenant_user_id', user.id)
      return null;
    },
    enabled: !!requestId && !!user?.id,
  });

  const { data: existingReview } = useQuery({
    queryKey: ['maintenance-review', requestId],
    queryFn: async () => {
      if (!requestId) return null;
      // TODO: Go endpoint not yet implemented — was: supabase.from('maintenance_reviews').select('*, vendors(business_name)').eq('maintenance_request_id', requestId)
      return null;
    },
    enabled: !!requestId && request?.status === 'completed',
  });

  const getStatusBadge = (status: string) => {
    const configs: Record<string, { icon: React.ReactNode; label: string; className: string }> = {
      pending: { icon: <Clock className="h-3.5 w-3.5" />, label: 'Pending', className: 'bg-muted/60 text-muted-foreground border-border/40' },
      in_progress: { icon: <Wrench className="h-3.5 w-3.5" />, label: 'In Progress', className: 'bg-primary/10 text-primary border-primary/20' },
      completed: { icon: <CheckCircle className="h-3.5 w-3.5" />, label: 'Completed', className: 'bg-success/10 text-success border-success/20' },
      cancelled: { icon: <X className="h-3.5 w-3.5" />, label: 'Cancelled', className: 'bg-destructive/10 text-destructive border-destructive/20' },
    };
    const c = configs[status] || { icon: <AlertTriangle className="h-3.5 w-3.5" />, label: status, className: '' };
    return <Badge variant="outline" className={`rounded-full gap-1 ${c.className}`}>{c.icon} {c.label}</Badge>;
  };

  const getPriorityBadge = (priority: string) => {
    const configs: Record<string, string> = {
      urgent: 'bg-destructive/10 text-destructive border-destructive/20',
      high: 'bg-warning/10 text-warning border-warning/20',
      medium: 'bg-muted/60 text-muted-foreground border-border/40',
      low: 'bg-muted/40 text-muted-foreground border-border/30',
    };
    return <Badge variant="outline" className={`rounded-full capitalize ${configs[priority] || ''}`}>{priority}</Badge>;
  };

  if (isLoading) {
    return (
      <TenantLayout title="Maintenance Request">
        <div className="space-y-6">
          <Skeleton className="h-10 w-32 rounded-xl" />
          <Skeleton className="h-20 rounded-2xl" />
          <div className="grid gap-6 lg:grid-cols-3">
            <Skeleton className="h-64 rounded-2xl" />
            <div className="lg:col-span-2"><Skeleton className="h-96 rounded-2xl" /></div>
          </div>
        </div>
      </TenantLayout>
    );
  }

  if (!request) {
    return (
      <TenantLayout title="Maintenance Request">
        <div className="text-center py-16">
          <AlertTriangle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">Request Not Found</h3>
          <p className="text-muted-foreground mb-4">This maintenance request doesn't exist or you don't have access.</p>
          <Button className="rounded-xl" onClick={() => navigate('/tenant/maintenance')}>Back to Maintenance</Button>
        </div>
      </TenantLayout>
    );
  }

  return (
    <TenantLayout 
      title="Maintenance Request"
      description="View request details and updates"
      actions={
        <Button variant="ghost" onClick={() => navigate('/tenant/maintenance')} className="gap-2 rounded-xl">
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
      }
    >
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Request Details Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          {/* Header Card */}
          <div className="bg-card/90 backdrop-blur-sm rounded-2xl border border-border/40 p-6 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <h2 className="text-lg font-semibold">{request.title}</h2>
                <p className="text-sm text-muted-foreground capitalize">{request.category}</p>
              </div>
              <div className="flex flex-col gap-1.5 items-end">
                {getStatusBadge(request.status)}
                <SLABadge slaDeadline={request.sla_deadline} status={request.status} />
              </div>
            </div>

            {request.description && (
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Description</p>
                <p className="text-sm">{request.description}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-muted/20 rounded-xl p-3">
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Priority</p>
                {getPriorityBadge(request.priority)}
              </div>
              <div className="bg-muted/20 rounded-xl p-3">
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Category</p>
                <p className="text-sm capitalize font-medium">{request.category}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              Submitted {format(new Date(request.created_at), 'MMM d, yyyy')}
            </div>

            {request.unit && (
              <div className="flex items-start gap-2 text-sm bg-muted/20 rounded-xl p-3">
                <MapPin className="h-4 w-4 text-primary mt-0.5" />
                <div>
                  <p className="font-medium">{request.unit.property?.name} - Unit {request.unit.unit_number}</p>
                  <p className="text-muted-foreground">{request.unit.property?.address}</p>
                </div>
              </div>
            )}

            {request.assigned_to && (
              <div className="bg-muted/20 rounded-xl p-3">
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Assigned To</p>
                <p className="text-sm font-medium">{request.assigned_to}</p>
              </div>
            )}

            {request.resolved_at && (
              <div className="p-3 rounded-xl bg-success/10 border border-success/20">
                <p className="text-sm text-success flex items-center gap-2 font-medium">
                  <CheckCircle className="h-4 w-4" />
                  Resolved {format(new Date(request.resolved_at), 'MMM d, yyyy')}
                </p>
              </div>
            )}

            {/* Request Images */}
            {request.images && request.images.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Attached Images</p>
                <div className="grid grid-cols-2 gap-2">
                  {request.images.map((image: string, index: number) => (
                    <img
                      key={index}
                      src={image}
                      alt={`Issue photo ${index + 1}`}
                      className="w-full h-24 object-cover rounded-xl border border-border/40 cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => window.open(image, '_blank')}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Timeline & Review */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-card/90 backdrop-blur-sm rounded-2xl border border-border/40 p-6 space-y-4">
            <h3 className="font-semibold text-lg">Activity Timeline</h3>
            <UpdateTimeline 
              maintenanceRequestId={requestId!}
              canAddUpdate={request.status !== 'completed'}
              authorRole="tenant"
            />
          </div>

          {/* Review Section */}
          {request.status === 'completed' && request.assigned_vendor_id && !existingReview && (
            <MaintenanceReviewForm
              maintenanceRequestId={requestId!}
              vendorId={request.assigned_vendor_id}
              vendorName={request.assigned_to || 'Vendor'}
              tenantUserId={user!.id}
            />
          )}

          {/* Existing Review Display */}
          {existingReview && (
            <div className="bg-card/90 backdrop-blur-sm rounded-2xl border border-border/40 p-6 space-y-3">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Star className="h-5 w-5 text-yellow-400 fill-yellow-400" />
                Your Review
              </h3>
              <div className="flex items-center gap-1 mb-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`h-5 w-5 ${
                      star <= existingReview.rating
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-muted-foreground'
                    }`}
                  />
                ))}
              </div>
              {existingReview.review_text && (
                <p className="text-sm text-muted-foreground">{existingReview.review_text}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Submitted on {format(new Date(existingReview.created_at), 'MMM d, yyyy')}
              </p>
            </div>
          )}
        </div>
      </div>
    </TenantLayout>
  );
}
