import { useAuth } from '@/features/auth/hooks/useAuth';
import { MaintenancePhotoUpload } from '@/features/maintenance/components/MaintenancePhotoUpload';
import { SLABadge, getSLAText } from '@/features/maintenance/components/SLABadge';
import { useCancelMaintenanceRequest, useTenantMaintenanceRequests } from '@/features/maintenance/hooks/useMaintenance';
import { supabase } from '@/lib/integrations/supabase/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { TenantLayout } from '@/shared/components/layouts/TenantLayout';
import { Alert, AlertDescription } from '@/shared/components/ui/alert';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent } from '@/shared/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { MaintenanceCardSkeleton } from "@/shared/components/ui/skeletons";
import { Textarea } from '@/shared/components/ui/textarea';
import { useIsMobile } from '@/shared/hooks/use-mobile';
import { useToast } from '@/shared/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { AlertTriangle, CheckCircle, ChevronRight, Clock, Filter, Loader2, Plus, RefreshCw, Search, Wrench, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

// Constants for validation
const MAX_TITLE_LENGTH = 100;
const MAX_DESCRIPTION_LENGTH = 2000;

// Sanitize input to prevent XSS
const sanitizeInput = (input: string): string => {
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
};

export default function TenantMaintenance() {
  const { user, role } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const queryClient = useQueryClient();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('general');
  const [priority, setPriority] = useState('medium');
  const [photos, setPhotos] = useState<string[]>([]);
  const [preferredSchedule, setPreferredSchedule] = useState('');
  
  // Filter states
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Cancel request states
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [requestToCancel, setRequestToCancel] = useState<string | null>(null);

  // Get tenant's contract to find unit and merchant - use maybeSingle() instead of single()
  const { data: contract, isLoading: contractLoading, error: contractError } = useQuery({
    queryKey: ['tenant-contract', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('contracts')
        .select('*, units(*, properties(merchant_id))')
        .eq('tenant_user_id', user.id)
        .in('status', ['active', 'notice'])
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id && role === 'tenant',
  });

  const { data: requests = [], isLoading, error: requestsError, refetch } = useTenantMaintenanceRequests(user?.id);

  // Filter requests based on status and search
  const filteredRequests = useMemo(() => {
    let filtered = requests;
    
    if (statusFilter !== 'all') {
      filtered = filtered.filter(r => r.status === statusFilter);
    }
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(r => 
        r.title.toLowerCase().includes(query) ||
        (r.description && r.description.toLowerCase().includes(query)) ||
        r.category.toLowerCase().includes(query)
      );
    }
    
    return filtered;
  }, [requests, statusFilter, searchQuery]);

  // Cancel mutation
  const cancelMutation = useCancelMaintenanceRequest();

  const handleConfirmCancel = () => {
    if (!user?.id || !requestToCancel) return;
    
    cancelMutation.mutate({ requestId: requestToCancel, userId: user.id }, {
      onSuccess: () => {
        toast({ title: 'Request cancelled successfully' });
        setCancelDialogOpen(false);
        setRequestToCancel(null);
      },
      onError: (error) => {
        toast({ 
          title: 'Failed to cancel request', 
          description: error instanceof Error ? error.message : 'Please try again',
          variant: 'destructive' 
        });
      },
    });
  };

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id || !contract) throw new Error('No active contract');
      
      // Validate inputs
      if (title.length > MAX_TITLE_LENGTH) {
        throw new Error(`Title must be ${MAX_TITLE_LENGTH} characters or less`);
      }
      if (description.length > MAX_DESCRIPTION_LENGTH) {
        throw new Error(`Description must be ${MAX_DESCRIPTION_LENGTH} characters or less`);
      }
      
      const unitData = contract.units as { id: string; properties: { merchant_id: string } };
      
      // Sanitize inputs
      const sanitizedTitle = sanitizeInput(title.trim());
      const sanitizedDescription = sanitizeInput(description.trim());
      
      const { data: newRequest, error } = await supabase
        .from('maintenance_requests')
        .insert({
          title: sanitizedTitle,
          description: sanitizedDescription,
          category,
          priority,
          unit_id: contract.unit_id,
          tenant_user_id: user.id,
          merchant_id: unitData.properties.merchant_id,
          images: photos.length > 0 ? photos : null,
          preferred_schedule: preferredSchedule ? new Date(preferredSchedule).toISOString() : null,
        })
        .select()
        .single();
      if (error) throw error;

      // Insert initial timeline entry
      await supabase.from('maintenance_timeline').insert({
        maintenance_request_id: newRequest.id,
        status: 'submitted',
        message: `Request submitted: ${sanitizedTitle}`,
        actor_id: user.id,
        actor_role: 'tenant',
      });

      // Create notification for merchant
      try {
        const { data: merchantData } = await supabase
          .from('merchants')
          .select('user_id')
          .eq('id', unitData.properties.merchant_id)
          .single();

        if (merchantData) {
          await supabase.from('notifications').insert({
            user_id: merchantData.user_id,
            title: 'New Maintenance Request',
            message: `${sanitizedTitle} - Priority: ${priority}`,
            type: 'warning',
            link: `/merchant/maintenance/${newRequest.id}`,
          });
        }
      } catch (notifError) {
        console.error('Failed to send notification:', notifError);
        // Don't fail the whole request if notification fails
      }

      return newRequest;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['tenant-maintenance-requests'] });
      toast({ 
        title: 'Maintenance request submitted',
        description: `Ticket #${data.id.slice(0, 8).toUpperCase()} - SLA: ${getSLAText(priority)}`
      });
      resetForm();
    },
    onError: (error) => {
      toast({ 
        title: 'Failed to submit request', 
        description: error instanceof Error ? error.message : 'Please try again later',
        variant: 'destructive' 
      });
    },
  });

  // Tenant role verification
  if (role && role !== 'tenant') {
    return (
      <TenantLayout title="Unauthorized" description="">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            You don't have permission to access this page.
          </AlertDescription>
        </Alert>
      </TenantLayout>
    );
  }

  const resetForm = () => {
    setIsDialogOpen(false);
    setTitle('');
    setDescription('');
    setCategory('general');
    setPriority('medium');
    setPhotos([]);
    setPreferredSchedule('');
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'in_progress': return <Wrench className="h-4 w-4" />;
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'cancelled': return <X className="h-4 w-4" />;
      default: return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'secondary';
      case 'in_progress': return 'default';
      case 'completed': return 'outline';
      case 'cancelled': return 'destructive';
      default: return 'secondary';
    }
  };

  const handleCancelRequest = (requestId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setRequestToCancel(requestId);
    setCancelDialogOpen(true);
  };

  // Dialog content component to reuse
  const MaintenanceDialogContent = (
    <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl">
      <DialogHeader>
        <DialogTitle>Submit Maintenance Request</DialogTitle>
        <DialogDescription>
          Describe the issue and we'll assign someone to help
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Title * <span className="text-xs text-muted-foreground">({title.length}/{MAX_TITLE_LENGTH})</span></Label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value.slice(0, MAX_TITLE_LENGTH))}
            placeholder="Brief description of the issue"
            maxLength={MAX_TITLE_LENGTH}
            className="rounded-xl bg-background/60 border-border/50"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="rounded-xl bg-background/60 border-border/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="general">General</SelectItem>
                <SelectItem value="plumbing">Plumbing</SelectItem>
                <SelectItem value="electrical">Electrical</SelectItem>
                <SelectItem value="appliance">Appliance</SelectItem>
                <SelectItem value="hvac">HVAC</SelectItem>
                <SelectItem value="structural">Structural</SelectItem>
                <SelectItem value="pest_control">Pest Control</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Priority</Label>
            <Select value={priority} onValueChange={setPriority}>
              <SelectTrigger className="rounded-xl bg-background/60 border-border/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              SLA: {getSLAText(priority)}
            </p>
            {priority === 'urgent' && (
              <div className="flex items-center gap-2 p-2 rounded-xl bg-destructive/10 border border-destructive/20 text-xs text-destructive">
                <AlertTriangle className="h-3 w-3" />
                Urgent: expected response within 4 hours.
              </div>
            )}
          </div>
        </div>
        <div className="space-y-2">
          <Label>Preferred Schedule (Optional)</Label>
          <Input
            type="datetime-local"
            value={preferredSchedule}
            onChange={(e) => setPreferredSchedule(e.target.value)}
            min={new Date().toISOString().slice(0, 16)}
            className="rounded-xl bg-background/60 border-border/50"
          />
          <p className="text-xs text-muted-foreground">
            When would you prefer the maintenance to be done?
          </p>
        </div>
        <div className="space-y-2">
          <Label>Description <span className="text-xs text-muted-foreground">({description.length}/{MAX_DESCRIPTION_LENGTH})</span></Label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value.slice(0, MAX_DESCRIPTION_LENGTH))}
            placeholder="Provide details about the issue..."
            rows={3}
            maxLength={MAX_DESCRIPTION_LENGTH}
            className="rounded-xl bg-background/60 border-border/50"
          />
        </div>
        
        <MaintenancePhotoUpload
          photos={photos}
          onChange={setPhotos}
          maxPhotos={5}
        />

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={resetForm} className="rounded-xl">
            Cancel
          </Button>
          <Button 
            onClick={() => createMutation.mutate()} 
            disabled={!title.trim() || createMutation.isPending}
            className="gradient-cta rounded-xl"
          >
            {createMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Submit Request
          </Button>
        </div>
      </div>
    </DialogContent>
  );

  // Error state
  if (requestsError || contractError) {
    return (
      <TenantLayout title="Maintenance Requests" description="Submit and track maintenance issues">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>Failed to load maintenance requests. Please try again.</span>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      </TenantLayout>
    );
  }

  return (
    <TenantLayout 
      title="Maintenance Requests"
      description="Submit and track maintenance issues"
      actions={
        !isMobile ? (
          <Button disabled={!contract} onClick={() => setIsDialogOpen(true)} className="gradient-cta rounded-xl">
            <Plus className="h-4 w-4 mr-2" />
            New Request
          </Button>
        ) : undefined
      }
      floatingAction={
        isMobile ? {
          type: 'create' as const,
          onClick: () => contract && setIsDialogOpen(true)
        } : undefined
      }
    >
      {!contract && !contractLoading && (
        <div className="bg-card/90 backdrop-blur-sm rounded-2xl border border-border/40 p-6 text-center mb-6">
          <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-warning" />
          <p className="font-medium">No Active Contract</p>
          <p className="text-muted-foreground text-sm">
            You need an active or notice period rental contract to submit maintenance requests.
          </p>
        </div>
      )}

      {/* Filters */}
      <div className="bg-card/80 backdrop-blur-sm rounded-2xl border border-border/40 p-4 flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search requests..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 rounded-xl bg-background/60 border-border/50"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px] rounded-xl bg-background/60 border-border/50">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => <MaintenanceCardSkeleton key={i} />)}
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="bg-card/90 backdrop-blur-sm rounded-2xl border border-border/40 p-8 text-center">
          <Wrench className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p className="text-muted-foreground">
            {searchQuery || statusFilter !== 'all' 
              ? 'No maintenance requests match your filters' 
              : 'No maintenance requests yet'}
          </p>
          {contract && !searchQuery && statusFilter === 'all' && (
            <Button variant="outline" className="mt-4 rounded-xl" onClick={() => setIsDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Submit Your First Request
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredRequests.map((request) => (
            <div 
              key={request.id} 
              className="bg-card/90 backdrop-blur-sm rounded-2xl border border-border/40 p-4 cursor-pointer hover:-translate-y-0.5 hover:shadow-lg hover:border-primary/30 transition-all duration-200"
              onClick={() => navigate(`/tenant/maintenance/${request.id}`)}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h3 className="font-medium">{request.title}</h3>
                    <Badge variant={getStatusColor(request.status) as "default" | "secondary" | "destructive" | "outline"} className="gap-1 rounded-full">
                      {getStatusIcon(request.status)}
                      {request.status.replace('_', ' ')}
                    </Badge>
                    <SLABadge slaDeadline={request.sla_deadline} status={request.status} />
                  </div>
                  {request.description && (
                    <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{request.description}</p>
                  )}
                  <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                    <span className="capitalize">{request.category}</span>
                    <span>Priority: {request.priority}</span>
                    <span>{format(new Date(request.created_at), 'MMM d, yyyy')}</span>
                    <span className="font-mono text-xs">#{request.id.slice(0, 8).toUpperCase()}</span>
                  </div>
                  {request.images && request.images.length > 0 && (
                    <div className="flex gap-1 mt-2">
                      {request.images.slice(0, 3).map((img: string, i: number) => (
                        <img key={i} src={img} alt="" className="h-10 w-10 rounded-xl object-cover border border-border/40" />
                      ))}
                      {request.images.length > 3 && (
                        <div className="h-10 w-10 rounded-xl bg-muted/40 flex items-center justify-center text-xs">
                          +{request.images.length - 3}
                        </div>
                      )}
                    </div>
                  )}
                  
                  {request.status === 'pending' && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="mt-2 text-destructive hover:text-destructive rounded-xl"
                      onClick={(e) => handleCancelRequest(request.id, e)}
                    >
                      <X className="h-4 w-4 mr-1" />
                      Cancel Request
                    </Button>
                  )}
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Dialog for creating maintenance request */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        {MaintenanceDialogContent}
      </Dialog>

      {/* Cancel confirmation dialog */}
      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>Cancel Maintenance Request?</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel this maintenance request? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelDialogOpen(false)} className="rounded-xl">
              Keep Request
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleConfirmCancel}
              disabled={cancelMutation.isPending}
              className="rounded-xl"
            >
              {cancelMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Cancel Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </TenantLayout>
  );
}
