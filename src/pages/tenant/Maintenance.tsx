import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { TenantLayout } from '@/components/layouts/TenantLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Plus, Wrench, Clock, CheckCircle, AlertTriangle, ChevronRight, Loader2 } from 'lucide-react';
import { MaintenanceCardSkeleton } from "@/components/ui/skeletons";
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';
import { MaintenancePhotoUpload } from '@/components/maintenance/MaintenancePhotoUpload';
import { SLABadge, getSLAText } from '@/components/maintenance/SLABadge';

export default function TenantMaintenance() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('general');
  const [priority, setPriority] = useState('medium');
  const [photos, setPhotos] = useState<string[]>([]);
  const [preferredSchedule, setPreferredSchedule] = useState('');

  // Get tenant's contract to find unit and merchant
  const { data: contract } = useQuery({
    queryKey: ['tenant-contract', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('contracts')
        .select('*, units(*, properties(merchant_id))')
        .eq('tenant_user_id', user.id)
        .eq('status', 'active')
        .single();
      if (error) return null;
      return data;
    },
    enabled: !!user?.id,
  });

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ['tenant-maintenance-requests', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('maintenance_requests')
        .select('*')
        .eq('tenant_user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id || !contract) throw new Error('No active contract');
      
      const unitData = contract.units as { id: string; properties: { merchant_id: string } };
      
      const { data: newRequest, error } = await supabase
        .from('maintenance_requests')
        .insert({
          title,
          description,
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
        message: `Request submitted: ${title}`,
        actor_id: user.id,
        actor_role: 'tenant',
      });

      // Create notification for merchant
      const { data: merchantData } = await supabase
        .from('merchants')
        .select('user_id')
        .eq('id', unitData.properties.merchant_id)
        .single();

      if (merchantData) {
        await supabase.from('notifications').insert({
          user_id: merchantData.user_id,
          title: 'New Maintenance Request',
          message: `${title} - Priority: ${priority}`,
          type: 'warning',
          link: `/merchant/maintenance/${newRequest.id}`,
        });
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
    onError: () => {
      toast({ title: 'Failed to submit request', variant: 'destructive' });
    },
  });

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
      default: return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'secondary';
      case 'in_progress': return 'default';
      case 'completed': return 'outline';
      default: return 'secondary';
    }
  };

  const isMobile = useIsMobile();

  // Dialog content component to reuse
  const MaintenanceDialogContent = (
    <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>Submit Maintenance Request</DialogTitle>
        <DialogDescription>
          Describe the issue and we'll assign someone to help
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Title *</Label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Brief description of the issue"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
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
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              SLA: {getSLAText(priority)}
            </p>
          </div>
        </div>
        <div className="space-y-2">
          <Label>Preferred Schedule (Optional)</Label>
          <Input
            type="datetime-local"
            value={preferredSchedule}
            onChange={(e) => setPreferredSchedule(e.target.value)}
            min={new Date().toISOString().slice(0, 16)}
          />
          <p className="text-xs text-muted-foreground">
            When would you prefer the maintenance to be done?
          </p>
        </div>
        <div className="space-y-2">
          <Label>Description</Label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Provide details about the issue..."
            rows={3}
          />
        </div>
        
        {/* Photo Upload */}
        <MaintenancePhotoUpload
          photos={photos}
          onChange={setPhotos}
          maxPhotos={5}
        />

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={resetForm}>
            Cancel
          </Button>
          <Button 
            onClick={() => createMutation.mutate()} 
            disabled={!title || createMutation.isPending}
          >
            {createMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Submit Request
          </Button>
        </div>
      </div>
    </DialogContent>
  );

  return (
    <TenantLayout 
      title="Maintenance Requests"
      description="Submit and track maintenance issues"
      actions={
        // Only show button in header on desktop
        !isMobile ? (
          <Button disabled={!contract} onClick={() => setIsDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Request
          </Button>
        ) : undefined
      }
      floatingAction={
        // On mobile, use floating button
        isMobile ? {
          type: 'create' as const,
          onClick: () => contract && setIsDialogOpen(true)
        } : undefined
      }
    >
      {!contract && (
        <Card className="mb-6">
          <CardContent className="p-6 text-center">
            <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-yellow-500" />
            <p className="font-medium">No Active Contract</p>
            <p className="text-muted-foreground text-sm">
              You need an active rental contract to submit maintenance requests.
            </p>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => <MaintenanceCardSkeleton key={i} />)}
        </div>
      ) : requests.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Wrench className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-muted-foreground">No maintenance requests yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {requests.map((request) => (
            <Card 
              key={request.id} 
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => navigate(`/tenant/maintenance/${request.id}`)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="font-medium">{request.title}</h3>
                      <Badge variant={getStatusColor(request.status) as "default" | "secondary" | "destructive" | "outline"} className="gap-1">
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
                          <img key={i} src={img} alt="" className="h-10 w-10 rounded object-cover" />
                        ))}
                        {request.images.length > 3 && (
                          <div className="h-10 w-10 rounded bg-muted flex items-center justify-center text-xs">
                            +{request.images.length - 3}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog for creating maintenance request - rendered outside layout */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        {MaintenanceDialogContent}
      </Dialog>
    </TenantLayout>
  );
}
