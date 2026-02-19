import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/integrations/supabase/client';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { TenantLayout } from '@/shared/components/layouts/TenantLayout';
import { UpdateTimeline } from '@/features/maintenance/components/UpdateTimeline';
import { MaintenanceReviewForm } from '@/features/maintenance/components/MaintenanceReviewForm';
import { SLABadge } from '@/features/maintenance/components/SLABadge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { ArrowLeft, Wrench, Clock, CheckCircle, AlertTriangle, Calendar, MapPin, Loader2, Star } from 'lucide-react';
import { format } from 'date-fns';

export default function MaintenanceDetail() {
  const { requestId } = useParams<{ requestId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data: request, isLoading } = useQuery({
    queryKey: ['maintenance-request', requestId],
    queryFn: async () => {
      if (!requestId) return null;
      const { data, error } = await supabase
        .from('maintenance_requests')
        .select(`
          *,
          unit:units (
            unit_number,
            property:properties (
              name,
              address
            )
          )
        `)
        .eq('id', requestId)
        .eq('tenant_user_id', user?.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!requestId && !!user?.id,
  });

  // Check if review already exists
  const { data: existingReview } = useQuery({
    queryKey: ['maintenance-review', requestId],
    queryFn: async () => {
      if (!requestId) return null;
      const { data } = await supabase
        .from('maintenance_reviews')
        .select('*, vendors(business_name)')
        .eq('maintenance_request_id', requestId)
        .maybeSingle();
      return data;
    },
    enabled: !!requestId && request?.status === 'completed',
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-5 w-5" />;
      case 'in_progress': return <Wrench className="h-5 w-5" />;
      case 'completed': return <CheckCircle className="h-5 w-5" />;
      default: return <AlertTriangle className="h-5 w-5" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="gap-1">{getStatusIcon(status)} Pending</Badge>;
      case 'in_progress':
        return <Badge className="bg-blue-500 gap-1">{getStatusIcon(status)} In Progress</Badge>;
      case 'completed':
        return <Badge className="bg-success gap-1">{getStatusIcon(status)} Completed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return <Badge variant="destructive">Urgent</Badge>;
      case 'high':
        return <Badge className="bg-orange-500">High</Badge>;
      case 'medium':
        return <Badge variant="secondary">Medium</Badge>;
      case 'low':
        return <Badge variant="outline">Low</Badge>;
      default:
        return <Badge variant="outline">{priority}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <TenantLayout title="Maintenance Request">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </TenantLayout>
    );
  }

  if (!request) {
    return (
      <TenantLayout title="Maintenance Request">
        <Card>
          <CardContent className="p-8 text-center">
            <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-destructive" />
            <h3 className="text-lg font-medium mb-2">Request Not Found</h3>
            <p className="text-muted-foreground">This maintenance request doesn't exist or you don't have access to it.</p>
            <Button className="mt-4" onClick={() => navigate('/tenant/maintenance')}>
              Back to Maintenance
            </Button>
          </CardContent>
        </Card>
      </TenantLayout>
    );
  }

  return (
    <TenantLayout 
      title="Maintenance Request"
      description="View request details and updates"
      actions={
        <Button variant="outline" onClick={() => navigate('/tenant/maintenance')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
      }
    >
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Request Details */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle>{request.title}</CardTitle>
                  <CardDescription className="capitalize">{request.category}</CardDescription>
                </div>
                <div className="flex flex-col gap-1 items-end">
                  {getStatusBadge(request.status)}
                  <SLABadge slaDeadline={request.sla_deadline} status={request.status} />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {request.description && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Description</h4>
                  <p className="text-sm">{request.description}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Priority</h4>
                  {getPriorityBadge(request.priority)}
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Category</h4>
                  <p className="text-sm capitalize">{request.category}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                Submitted on {format(new Date(request.created_at), 'MMM d, yyyy')}
              </div>

              {request.unit && (
                <div className="flex items-start gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">
                      {request.unit.property?.name} - Unit {request.unit.unit_number}
                    </p>
                    <p className="text-muted-foreground">{request.unit.property?.address}</p>
                  </div>
                </div>
              )}

              {request.assigned_to && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Assigned To</h4>
                  <p className="text-sm">{request.assigned_to}</p>
                </div>
              )}

              {request.resolved_at && (
                <div className="p-3 rounded-lg bg-success/10 border border-success/20">
                  <p className="text-sm text-success flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    Resolved on {format(new Date(request.resolved_at), 'MMM d, yyyy')}
                  </p>
                </div>
              )}

              {/* Request Images */}
              {request.images && request.images.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">Attached Images</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {request.images.map((image: string, index: number) => (
                      <img
                        key={index}
                        src={image}
                        alt={`Issue photo ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg border cursor-pointer hover:opacity-80"
                        onClick={() => window.open(image, '_blank')}
                      />
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Timeline & Review */}
        <div className="lg:col-span-2 space-y-6">
          <UpdateTimeline 
            maintenanceRequestId={requestId!}
            canAddUpdate={request.status !== 'completed'}
            authorRole="tenant"
          />

          {/* Review Section - Show for completed requests */}
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
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Star className="h-5 w-5 text-yellow-400 fill-yellow-400" />
                  Your Review
                </CardTitle>
              </CardHeader>
              <CardContent>
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
                <p className="text-xs text-muted-foreground mt-2">
                  Submitted on {format(new Date(existingReview.created_at), 'MMM d, yyyy')}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </TenantLayout>
  );
}