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

import { Alert, AlertDescription, AlertTitle } from '@/shared/components/ui/alert';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Label } from '@/shared/components/ui/label';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { useToast } from '@/shared/hooks/use-toast';
import { format } from 'date-fns';
import { AlertTriangle, ArrowLeft, Calendar, CheckCircle, FileText, MapPin, Phone, User, XCircle } from 'lucide-react';
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
        <Skeleton className="h-10 w-48" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-64" />
            <Skeleton className="h-96" />
          </div>
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Maintenance request not found</p>
        <Button asChild className="mt-4">
          <Link to="/merchant/maintenance">Back to Maintenance</Link>
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/merchant/maintenance">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-display font-bold">{request.title}</h1>
              <MaintenancePriorityBadge priority={request.priority} />
            </div>
            <p className="text-muted-foreground">#{id?.slice(0, 8)} • SLA: {getSLAText(request.priority)}</p>
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
            <Card>
              <CardHeader>
                <CardTitle>Request Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-muted-foreground">Description</Label>
                  <p className="mt-1">{request.description || 'No description provided'}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Category</Label>
                    <p className="mt-1 capitalize">{request.category}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Priority</Label>
                    <p className="mt-1 capitalize">{request.priority}</p>
                  </div>
                </div>

                {request.images && request.images.length > 0 && (
                  <div>
                    <Label className="text-muted-foreground">Attached Photos</Label>
                    <div className="grid grid-cols-3 gap-2 mt-2">
                      {request.images.map((img, idx) => (
                        <a key={idx} href={img} target="_blank" rel="noopener noreferrer">
                          <img
                            src={img}
                            alt={`Attachment ${idx + 1}`}
                            className="w-full h-24 object-cover rounded-lg border hover:opacity-80 transition-opacity"
                          />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Activity Timeline</CardTitle>
                <CardDescription>Communication and status updates</CardDescription>
              </CardHeader>
              <CardContent>
                <UpdateTimeline
                  maintenanceRequestId={request.id}
                  authorRole="merchant"
                  canAddUpdate={request.status !== 'completed' && request.status !== 'cancelled'}
                />
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Tenant Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Tenant Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
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
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{request.tenant.phone_number}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Unit Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Unit Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{request.unit?.property?.name}</p>
                    <p className="text-sm text-muted-foreground">Unit {request.unit?.unit_number}</p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">{request.unit?.property?.address}</p>
                {contract && (
                  <div className={`mt-2 p-2 rounded text-sm flex items-center gap-2 ${
                    contract.status === 'active' ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'
                  }`}>
                    <FileText className="h-4 w-4" />
                    <span className="capitalize">Contract: {contract.status.replace('_', ' ')}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Status Update */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Update Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>Created {format(new Date(request.created_at), 'MMM d, yyyy')}</span>
                </div>

                {!isContractActive && contract && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Contract Warning</AlertTitle>
                    <AlertDescription>
                      The contract for this unit is currently <strong>{contract.status}</strong>. 
                      Proceed with caution when assigning vendors.
                    </AlertDescription>
                  </Alert>
                )}

                {contract && !isContractValidDate && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Date Mismatch</AlertTitle>
                    <AlertDescription>
                      This request was created outside the active contract period ({format(new Date(contract.start_date), 'MMM d, yyyy')} - {contract.end_date ? format(new Date(contract.end_date), 'MMM d, yyyy') : 'Indefinite'}).
                    </AlertDescription>
                  </Alert>
                )}

                {!contract && request.tenant && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>No Active Contract</AlertTitle>
                    <AlertDescription>
                      There is no active contract found for this unit. Please verify tenant status.
                    </AlertDescription>
                  </Alert>
                )}

                {request.status !== 'completed' && request.status !== 'cancelled' && (
                  <Button 
                    className="w-full" 
                    onClick={() => setIsUpdateDialogOpen(true)}
                  >
                    Update Status / Assign Vendor
                  </Button>
                )}
                
                {request.status === 'completed' && (
                  <div className="p-4 bg-success/10 rounded-lg text-center">
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
                      className="mt-4 w-full"
                      onClick={() => setIsUpdateDialogOpen(true)}
                    >
                      Update Details
                    </Button>
                  </div>
                )}

                {request.status === 'cancelled' && (
                  <div className="p-4 bg-destructive/10 rounded-lg text-center">
                    <p className="text-destructive font-medium flex items-center justify-center gap-2">
                      <XCircle className="h-5 w-5" />
                      Cancelled
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
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
