import { useAuth } from '@/features/auth/hooks/useAuth';
import { SLABadge, getSLAText } from '@/features/maintenance/components/SLABadge';
import { UpdateTimeline } from '@/features/maintenance/components/UpdateTimeline';
import {
  useMaintenanceRequest,
  useUpdateMaintenanceRequest,
  useVerifiedVendors
} from '@/features/maintenance/hooks/useMaintenance';
import { MerchantLayout } from '@/shared/components/layouts/MerchantLayout';
import { Alert, AlertDescription, AlertTitle } from '@/shared/components/ui/alert';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { useToast } from '@/shared/hooks/use-toast';
import { format } from 'date-fns';
import { AlertTriangle, ArrowLeft, Calendar, CheckCircle, Clock, FileText, MapPin, Phone, Star, User, Wrench, XCircle } from 'lucide-react';
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';

export default function MerchantMaintenanceDetail() {
  const { id } = useParams<{ id: string }>();
  const { merchant } = useAuth();
  const { toast } = useToast();
  const [selectedVendorId, setSelectedVendorId] = useState('');
  const [agreedPrice, setAgreedPrice] = useState('');

  const { data: request, isLoading } = useMaintenanceRequest(id);
  const { data: vendors = [] } = useVerifiedVendors();
  const updateStatusMutation = useUpdateMaintenanceRequest();

  const contract = getRelevantContract(request?.unit?.contracts, request?.tenant_user_id);

  const isContractActive = contract?.status === 'active' || contract?.status === 'notice';
  const isContractValidDate = contract && request && 
    new Date(request.created_at) >= new Date(contract.start_date) &&
    (!contract.end_date || new Date(request.created_at) <= new Date(contract.end_date));

  const handleUpdateStatus = (status: string) => {
    if (!request || !merchant) return;

    updateStatusMutation.mutate(
      {
        id: request.id,
        status,
        merchant_id: merchant.id,
        assigned_vendor_id: selectedVendorId || undefined,
        agreed_price: agreedPrice ? parseFloat(agreedPrice) : undefined,
        actor_id: merchant.user_id,
        actor_role: 'merchant'
      },
      {
        onSuccess: () => {
          toast({ title: 'Status updated successfully' });
          setSelectedVendorId('');
          setAgreedPrice('');
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-5 w-5" />;
      case 'in_progress': return <Wrench className="h-5 w-5" />;
      case 'completed': return <CheckCircle className="h-5 w-5" />;
      case 'cancelled': return <XCircle className="h-5 w-5" />;
      default: return <AlertTriangle className="h-5 w-5" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-warning/10 text-warning border-warning/30';
      case 'in_progress': return 'bg-info/10 text-info border-info/30';
      case 'completed': return 'bg-success/10 text-success border-success/30';
      case 'cancelled': return 'bg-destructive/10 text-destructive border-destructive/30';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'destructive';
      case 'high': return 'default';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'secondary';
    }
  };

  if (isLoading) {
    return (
      <MerchantLayout>
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
      </MerchantLayout>
    );
  }

  if (!request) {
    return (
      <MerchantLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Maintenance request not found</p>
          <Button asChild className="mt-4">
            <Link to="/merchant/maintenance">Back to Maintenance</Link>
          </Button>
        </div>
      </MerchantLayout>
    );
  }

  return (
    <MerchantLayout>
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
              <Badge variant={getPriorityColor(request.priority) as "default" | "secondary" | "destructive" | "outline"}>
                {request.priority}
              </Badge>
            </div>
            <p className="text-muted-foreground">#{id?.slice(0, 8)} • SLA: {getSLAText(request.priority)}</p>
          </div>
          <div className="flex items-center gap-2">
            <SLABadge slaDeadline={request.sla_deadline} status={request.status} />
            <Badge variant="outline" className={`gap-1 ${getStatusColor(request.status)}`}>
              {getStatusIcon(request.status)}
              {request.status.replace('_', ' ')}
            </Badge>
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
                  <>
                    <div className="space-y-2">
                      <Label>Assign to Vendor</Label>
                      <Select value={selectedVendorId} onValueChange={setSelectedVendorId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a vendor" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No vendor</SelectItem>
                          {vendors.map(vendor => (
                            <SelectItem key={vendor.id} value={vendor.id}>
                              <div className="flex items-center gap-2">
                                <span>{vendor.business_name}</span>
                                {vendor.rating && vendor.rating > 0 && (
                                  <span className="flex items-center gap-0.5 text-xs text-warning">
                                    <Star className="h-3 w-3 fill-current" />
                                    {vendor.rating.toFixed(1)}
                                  </span>
                                )}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {selectedVendorId && selectedVendorId !== 'none' && (
                      <div className="space-y-2">
                        <Label>Agreed Price (IDR)</Label>
                        <Input
                          type="number"
                          value={agreedPrice}
                          onChange={(e) => setAgreedPrice(e.target.value)}
                          placeholder="Enter agreed price"
                        />
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUpdateStatus('in_progress')}
                        disabled={updateStatusMutation.isPending}
                      >
                        In Progress
                      </Button>
                      <Button
                        size="sm"
                        className="bg-success text-success-foreground hover:bg-success/90"
                        onClick={() => handleUpdateStatus('completed')}
                        disabled={updateStatusMutation.isPending}
                      >
                        Complete
                      </Button>
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="w-full"
                      onClick={() => handleUpdateStatus('cancelled')}
                      disabled={updateStatusMutation.isPending}
                    >
                      Cancel Request
                    </Button>
                  </>
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
    </MerchantLayout>
  );
}
