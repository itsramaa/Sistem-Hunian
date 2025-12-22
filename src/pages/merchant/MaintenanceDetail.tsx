import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { MerchantLayout } from '@/components/layouts/MerchantLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { UpdateTimeline } from '@/components/maintenance/UpdateTimeline';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Clock, Wrench, CheckCircle, XCircle, AlertTriangle, User, MapPin, Calendar, Phone } from 'lucide-react';
import { format } from 'date-fns';

type MaintenanceRequest = {
  id: string;
  title: string;
  description: string | null;
  category: string;
  priority: string;
  status: string;
  assigned_to: string | null;
  created_at: string;
  resolved_at: string | null;
  images: string[] | null;
  unit_id: string;
  tenant_user_id: string;
  merchant_id: string;
};

type Unit = {
  id: string;
  unit_number: string;
  property: {
    id: string;
    name: string;
    address: string;
  };
};

type Profile = {
  full_name: string | null;
  phone: string | null;
  email: string;
};

type Vendor = {
  id: string;
  business_name: string;
  service_categories: string[] | null;
};

export default function MerchantMaintenanceDetail() {
  const { id } = useParams<{ id: string }>();
  const { merchant } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedVendorId, setSelectedVendorId] = useState('');
  const [agreedPrice, setAgreedPrice] = useState('');

  const { data: request, isLoading } = useQuery({
    queryKey: ['maintenance-request', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('maintenance_requests')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data as MaintenanceRequest;
    },
    enabled: !!id,
  });

  const { data: unit } = useQuery({
    queryKey: ['unit', request?.unit_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('units')
        .select('id, unit_number, property:properties(id, name, address)')
        .eq('id', request?.unit_id)
        .single();
      if (error) throw error;
      return data as unknown as Unit;
    },
    enabled: !!request?.unit_id,
  });

  const { data: tenantProfile } = useQuery({
    queryKey: ['tenant-profile', request?.tenant_user_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('full_name, phone, email')
        .eq('user_id', request?.tenant_user_id)
        .single();
      if (error) throw error;
      return data as Profile;
    },
    enabled: !!request?.tenant_user_id,
  });

  const { data: vendors = [] } = useQuery({
    queryKey: ['verified-vendors'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vendors')
        .select('id, business_name, service_categories')
        .eq('verification_status', 'verified');
      if (error) throw error;
      return data as Vendor[];
    },
  });

  const { data: updates = [], refetch: refetchUpdates } = useQuery({
    queryKey: ['maintenance-updates', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('maintenance_updates')
        .select('*')
        .eq('maintenance_request_id', id)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ status, vendor_id, agreed_price }: { status: string; vendor_id?: string; agreed_price?: number }) => {
      const updateData: Record<string, unknown> = { status };
      
      if (status === 'completed') {
        updateData.resolved_at = new Date().toISOString();
      }

      if (vendor_id) {
        const vendor = vendors.find(v => v.id === vendor_id);
        updateData.assigned_to = vendor?.business_name || null;
      }

      const { error } = await supabase
        .from('maintenance_requests')
        .update(updateData)
        .eq('id', id);
      if (error) throw error;

      if (vendor_id && merchant) {
        const { error: jobError } = await supabase
          .from('vendor_jobs')
          .insert({
            vendor_id: vendor_id,
            maintenance_request_id: id,
            merchant_id: merchant.id,
            agreed_price: agreed_price || null,
            status: 'pending',
          });
        if (jobError) throw jobError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance-request', id] });
      toast({ title: 'Status updated successfully' });
      setSelectedVendorId('');
      setAgreedPrice('');
    },
    onError: () => {
      toast({ title: 'Failed to update status', variant: 'destructive' });
    },
  });

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
            <p className="text-muted-foreground">#{id?.slice(0, 8)}</p>
          </div>
          <Badge variant="outline" className={`gap-1 ${getStatusColor(request.status)}`}>
            {getStatusIcon(request.status)}
            {request.status.replace('_', ' ')}
          </Badge>
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
                    <p className="font-medium">{tenantProfile?.full_name || 'Unknown'}</p>
                    <p className="text-sm text-muted-foreground">{tenantProfile?.email}</p>
                  </div>
                </div>
                {tenantProfile?.phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{tenantProfile.phone}</span>
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
                    <p className="font-medium">{unit?.property?.name}</p>
                    <p className="text-sm text-muted-foreground">Unit {unit?.unit_number}</p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">{unit?.property?.address}</p>
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

                {request.status !== 'completed' && request.status !== 'cancelled' && (
                  <>
                    <div className="space-y-2">
                      <Label>Assign to Vendor</Label>
                      <Select value={selectedVendorId} onValueChange={setSelectedVendorId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a vendor" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">No vendor</SelectItem>
                          {vendors.map(vendor => (
                            <SelectItem key={vendor.id} value={vendor.id}>
                              {vendor.business_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {selectedVendorId && (
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
                        onClick={() => updateStatusMutation.mutate({ status: 'in_progress', vendor_id: selectedVendorId, agreed_price: agreedPrice ? parseFloat(agreedPrice) : undefined })}
                        disabled={updateStatusMutation.isPending}
                      >
                        In Progress
                      </Button>
                      <Button
                        size="sm"
                        className="bg-success text-success-foreground hover:bg-success/90"
                        onClick={() => updateStatusMutation.mutate({ status: 'completed' })}
                        disabled={updateStatusMutation.isPending}
                      >
                        Complete
                      </Button>
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="w-full"
                      onClick={() => updateStatusMutation.mutate({ status: 'cancelled' })}
                      disabled={updateStatusMutation.isPending}
                    >
                      Cancel Request
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MerchantLayout>
  );
}