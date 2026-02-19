import { useState } from 'react';
import { VendorLayout } from '@/shared/components/layouts/VendorLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { Textarea } from '@/shared/components/ui/textarea';
import { Label } from '@/shared/components/ui/label';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/shared/components/ui/alert-dialog';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/integrations/supabase/client';
import type { Tables } from '@/lib/integrations/supabase/types';
import { 
  Briefcase, 
  Clock, 
  CheckCircle2, 
  MapPin,
  Calendar,
  Building2,
  AlertCircle,
  Play,
  Check,
  ImageIcon
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { CompletionDialog } from '@/features/maintenance/components/CompletionDialog';
import { SLABadge } from '@/features/maintenance/components/SLABadge';
import { formatCurrency } from '@/shared/utils/currency';
import { getPriorityColor, getJobStatusColor } from '@/shared/utils/statusColors';
import { isValidJobStatusTransition, declineReasonSchema } from '@/features/users/utils/vendor-validations';
import { VENDOR_PLATFORM_FEE_PERCENT, calculatePlatformFee, calculateNetAmount } from '@/constants/platformFees';

// Use generated types from Supabase with relationships
type VendorJobRow = Tables<'vendor_jobs'>;
type MaintenanceRequestRow = Tables<'maintenance_requests'>;
type UnitRow = Tables<'units'>;
type PropertyRow = Tables<'properties'>;

interface VendorJob extends VendorJobRow {
  maintenance_requests: (MaintenanceRequestRow & {
    units: (UnitRow & {
      properties: Pick<PropertyRow, 'name' | 'address' | 'city'>;
    }) | null;
  }) | null;
}

export default function VendorJobs() {
  const { vendor, user } = useAuth();
  const queryClient = useQueryClient();
  const [completionDialogOpen, setCompletionDialogOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<VendorJob | null>(null);
  
  // Confirmation dialogs state
  const [acceptDialogOpen, setAcceptDialogOpen] = useState(false);
  const [startDialogOpen, setStartDialogOpen] = useState(false);
  const [declineDialogOpen, setDeclineDialogOpen] = useState(false);
  const [declineReason, setDeclineReason] = useState('');
  const [declineError, setDeclineError] = useState('');

  // Fetch vendor jobs from vendor_jobs table
  const { data: jobs = [], isLoading } = useQuery({
    queryKey: ['vendor-jobs', vendor?.id],
    queryFn: async () => {
      if (!vendor) return [];
      
      const { data, error } = await supabase
        .from('vendor_jobs')
        .select(`
          *,
          maintenance_requests (
            id,
            title,
            description,
            category,
            priority,
            status,
            images,
            sla_deadline,
            created_at,
            tenant_user_id,
            merchant_id,
            units (
              unit_number,
              properties (
                name,
                address,
                city
              )
            )
          )
        `)
        .eq('vendor_id', vendor.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as VendorJob[];
    },
    enabled: !!vendor,
  });

  const updateJobMutation = useMutation({
    mutationFn: async ({ 
      jobId, 
      status,
      completionNotes,
      completionPhotos,
      declineReason
    }: { 
      jobId: string; 
      status: string;
      completionNotes?: string;
      completionPhotos?: string[];
      declineReason?: string;
    }) => {
      const job = jobs.find(j => j.id === jobId);
      if (!job) throw new Error('Job not found');

      // Validate status transition
      if (!isValidJobStatusTransition(job.status, status)) {
        throw new Error(`Invalid status transition from ${job.status} to ${status}`);
      }

      // Validate vendor is verified for accept/start
      if (['accepted', 'in_progress'].includes(status) && vendor?.verification_status !== 'verified') {
        throw new Error('You must be verified to accept or start jobs');
      }

      // Validate decline reason
      if (status === 'rejected') {
        const result = declineReasonSchema.safeParse(declineReason);
        if (!result.success) {
          throw new Error(result.error.errors[0]?.message || 'Please provide a valid decline reason');
        }
      }

      const jobUpdateData: Record<string, unknown> = { status };
      const maintenanceUpdateData: Record<string, unknown> = {};
      let newMaintenanceStatus = '';
      
      if (status === 'accepted') {
        jobUpdateData.accepted_at = new Date().toISOString();
        maintenanceUpdateData.accepted_at = new Date().toISOString();
        maintenanceUpdateData.status = 'assigned';
        newMaintenanceStatus = 'assigned';
      } else if (status === 'in_progress') {
        jobUpdateData.started_at = new Date().toISOString();
        maintenanceUpdateData.started_at = new Date().toISOString();
        maintenanceUpdateData.status = 'in_progress';
        newMaintenanceStatus = 'in_progress';
      } else if (status === 'completed') {
        jobUpdateData.completed_at = new Date().toISOString();
        maintenanceUpdateData.resolved_at = new Date().toISOString();
        maintenanceUpdateData.status = 'completed';
        maintenanceUpdateData.completion_notes = completionNotes || null;
        maintenanceUpdateData.completion_photos = completionPhotos || null;
        newMaintenanceStatus = 'completed';
      } else if (status === 'rejected') {
        jobUpdateData.decline_reason = declineReason;
        maintenanceUpdateData.assigned_vendor_id = null;
        maintenanceUpdateData.assigned_to = null;
        maintenanceUpdateData.status = 'pending';
        newMaintenanceStatus = 'pending';
      }

      // Update vendor_jobs
      const { error: jobError } = await supabase
        .from('vendor_jobs')
        .update(jobUpdateData)
        .eq('id', jobId);

      if (jobError) throw jobError;

      // Sync with maintenance_requests
      if (job.maintenance_request_id && Object.keys(maintenanceUpdateData).length > 0) {
        const { error: maintenanceError } = await supabase
          .from('maintenance_requests')
          .update(maintenanceUpdateData)
          .eq('id', job.maintenance_request_id);

        if (maintenanceError) throw maintenanceError;
      }

      // Insert timeline entry
      if (job.maintenance_request_id && user) {
        const statusMessages: Record<string, string> = {
          accepted: 'Vendor accepted the job',
          in_progress: 'Work has started',
          completed: 'Job completed',
          rejected: `Vendor declined the job: ${declineReason || 'No reason provided'}`,
        };

        await supabase.from('maintenance_timeline').insert({
          maintenance_request_id: job.maintenance_request_id,
          status: newMaintenanceStatus || status,
          message: statusMessages[status] || `Status changed to ${status}`,
          actor_id: user.id,
          actor_role: 'vendor',
          metadata: completionNotes ? { notes: completionNotes } : (declineReason ? { decline_reason: declineReason } : {}),
        });
      }

      // If job is completed, create an earning record and notify
      if (status === 'completed') {
        if (job.agreed_price) {
          const feeAmount = calculatePlatformFee(job.agreed_price);
          const netAmount = calculateNetAmount(job.agreed_price);

          const { error: earningError } = await supabase
            .from('vendor_earnings')
            .insert({
              vendor_id: vendor!.id,
              vendor_job_id: jobId,
              amount: job.agreed_price,
              fee_amount: feeAmount,
              net_amount: netAmount,
              status: 'pending',
            });

          if (earningError) throw earningError;
        }

        // Notify tenant
        if (job.maintenance_requests) {
          const mr = job.maintenance_requests as MaintenanceRequestRow;
          await supabase.from('notifications').insert({
            user_id: mr.tenant_user_id,
            title: 'Maintenance Completed',
            message: `Your maintenance request "${mr.title}" has been completed`,
            type: 'success',
            link: `/tenant/maintenance/${job.maintenance_request_id}`,
          });

          // Notify merchant
          const { data: merchantData } = await supabase
            .from('merchants')
            .select('user_id')
            .eq('id', mr.merchant_id)
            .single();

          if (merchantData) {
            await supabase.from('notifications').insert({
              user_id: merchantData.user_id,
              title: 'Maintenance Completed',
              message: `Maintenance request "${mr.title}" has been completed by vendor`,
              type: 'info',
              link: `/merchant/maintenance/${job.maintenance_request_id}`,
            });
          }
        }
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['vendor-jobs'] });
      queryClient.invalidateQueries({ queryKey: ['vendor-earnings'] });
      
      const messages: Record<string, string> = {
        accepted: 'Job accepted successfully',
        in_progress: 'Job started',
        completed: 'Job completed successfully',
        rejected: 'Job declined',
      };
      
      toast.success(messages[variables.status] || 'Job status updated');
      setCompletionDialogOpen(false);
      setAcceptDialogOpen(false);
      setStartDialogOpen(false);
      setDeclineDialogOpen(false);
      setSelectedJob(null);
      setDeclineReason('');
      setDeclineError('');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update job');
    },
  });

  const activeJobs = jobs.filter(j => ['pending', 'accepted', 'in_progress'].includes(j.status));
  const completedJobs = jobs.filter(j => j.status === 'completed');

  const handleAcceptClick = (job: VendorJob) => {
    setSelectedJob(job);
    setAcceptDialogOpen(true);
  };

  const handleStartClick = (job: VendorJob) => {
    setSelectedJob(job);
    setStartDialogOpen(true);
  };

  const handleDeclineClick = (job: VendorJob) => {
    setSelectedJob(job);
    setDeclineReason('');
    setDeclineError('');
    setDeclineDialogOpen(true);
  };

  const handleAcceptConfirm = () => {
    if (selectedJob) {
      updateJobMutation.mutate({ jobId: selectedJob.id, status: 'accepted' });
    }
  };

  const handleStartConfirm = () => {
    if (selectedJob) {
      updateJobMutation.mutate({ jobId: selectedJob.id, status: 'in_progress' });
    }
  };

  const handleDeclineConfirm = () => {
    const result = declineReasonSchema.safeParse(declineReason);
    if (!result.success) {
      setDeclineError(result.error.errors[0]?.message || 'Please provide a valid reason');
      return;
    }
    
    if (selectedJob) {
      updateJobMutation.mutate({ 
        jobId: selectedJob.id, 
        status: 'rejected',
        declineReason: declineReason,
      });
    }
  };

  const handleOpenCompletionDialog = (job: VendorJob) => {
    setSelectedJob(job);
    setCompletionDialogOpen(true);
  };

  const handleCompleteJob = (notes: string, photos: string[]) => {
    if (selectedJob) {
      updateJobMutation.mutate({ 
        jobId: selectedJob.id, 
        status: 'completed',
        completionNotes: notes,
        completionPhotos: photos,
      });
    }
  };

  const JobCard = ({ job }: { job: VendorJob }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg">{job.maintenance_requests?.title}</CardTitle>
            <CardDescription className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              {job.maintenance_requests?.units?.properties?.name} - Unit {job.maintenance_requests?.units?.unit_number}
            </CardDescription>
          </div>
          <div className="flex gap-2 flex-wrap justify-end">
            <Badge variant={getPriorityColor(job.maintenance_requests?.priority || '')} className="capitalize">
              {job.maintenance_requests?.priority}
            </Badge>
            <Badge variant={getJobStatusColor(job.status)} className="capitalize">
              {job.status.replace('_', ' ')}
            </Badge>
            <SLABadge 
              slaDeadline={job.maintenance_requests?.sla_deadline || null} 
              status={job.maintenance_requests?.status || ''} 
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {job.maintenance_requests?.description && (
          <p className="text-sm text-muted-foreground">{job.maintenance_requests.description}</p>
        )}

        {/* Issue Photos */}
        {job.maintenance_requests?.images && job.maintenance_requests.images.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <ImageIcon className="h-4 w-4" />
              <span>Issue Photos</span>
            </div>
            <div className="flex gap-2 flex-wrap">
              {job.maintenance_requests.images.map((img, index) => (
                <img
                  key={index}
                  src={img}
                  alt={`Issue photo ${index + 1}`}
                  className="h-16 w-16 object-cover rounded-lg border cursor-pointer hover:opacity-80"
                  onClick={() => window.open(img, '_blank')}
                />
              ))}
            </div>
          </div>
        )}
        
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span>{job.maintenance_requests?.units?.properties?.address}, {job.maintenance_requests?.units?.properties?.city}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>{format(new Date(job.created_at), 'dd MMM yyyy')}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="outline" className="capitalize">
            {job.maintenance_requests?.category}
          </Badge>
          {job.agreed_price && (
            <Badge variant="secondary">
              {formatCurrency(job.agreed_price)}
            </Badge>
          )}
        </div>

        {job.status !== 'completed' && job.status !== 'rejected' && (
          <div className="flex gap-2 pt-2">
            {job.status === 'pending' && (
              <>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1"
                  onClick={() => handleDeclineClick(job)}
                  disabled={updateJobMutation.isPending}
                >
                  Decline
                </Button>
                <Button 
                  size="sm" 
                  className="flex-1"
                  onClick={() => handleAcceptClick(job)}
                  disabled={updateJobMutation.isPending || vendor?.verification_status !== 'verified'}
                >
                  <Check className="h-4 w-4 mr-1" />
                  Accept
                </Button>
              </>
            )}
            {job.status === 'accepted' && (
              <Button 
                size="sm" 
                className="flex-1"
                onClick={() => handleStartClick(job)}
                disabled={updateJobMutation.isPending}
              >
                <Play className="h-4 w-4 mr-1" />
                Start Job
              </Button>
            )}
            {job.status === 'in_progress' && (
              <Button 
                size="sm" 
                className="flex-1"
                onClick={() => handleOpenCompletionDialog(job)}
                disabled={updateJobMutation.isPending}
              >
                <CheckCircle2 className="h-4 w-4 mr-1" />
                Mark Complete
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );

  const EmptyState = ({ message }: { message: string }) => (
    <div className="text-center py-12 text-muted-foreground">
      <Briefcase className="h-12 w-12 mx-auto mb-4 opacity-50" />
      <p>{message}</p>
    </div>
  );

  return (
    <VendorLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Jobs</h1>
            <p className="text-muted-foreground">Manage your maintenance assignments</p>
          </div>
        </div>

        {vendor?.verification_status !== 'verified' && (
          <Card className="border-warning bg-warning/5">
            <CardContent className="py-4">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-warning" />
                <div>
                  <p className="font-medium text-warning">Complete Verification</p>
                  <p className="text-sm text-muted-foreground">
                    You need to be verified to accept job assignments from merchants.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="active" className="w-full">
          <TabsList>
            <TabsTrigger value="active" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Active ({activeJobs.length})
            </TabsTrigger>
            <TabsTrigger value="completed" className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Completed ({completedJobs.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="mt-6">
            {isLoading ? (
              <div className="grid gap-4 md:grid-cols-2">
                {[1, 2].map(i => (
                  <Card key={i} className="h-48 animate-pulse bg-muted" />
                ))}
              </div>
            ) : activeJobs.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2">
                {activeJobs.map(job => (
                  <JobCard key={job.id} job={job} />
                ))}
              </div>
            ) : (
              <EmptyState message="No active jobs. New assignments will appear here." />
            )}
          </TabsContent>

          <TabsContent value="completed" className="mt-6">
            {isLoading ? (
              <div className="grid gap-4 md:grid-cols-2">
                {[1, 2].map(i => (
                  <Card key={i} className="h-48 animate-pulse bg-muted" />
                ))}
              </div>
            ) : completedJobs.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2">
                {completedJobs.map(job => (
                  <JobCard key={job.id} job={job} />
                ))}
              </div>
            ) : (
              <EmptyState message="No completed jobs yet." />
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Accept Confirmation Dialog */}
      <AlertDialog open={acceptDialogOpen} onOpenChange={setAcceptDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Accept Job</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to accept this job? You will be responsible for completing the work as described.
              {selectedJob?.agreed_price && (
                <span className="block mt-2 font-medium text-foreground">
                  Agreed Price: {formatCurrency(selectedJob.agreed_price)}
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleAcceptConfirm} disabled={updateJobMutation.isPending}>
              Accept Job
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Start Job Confirmation Dialog */}
      <AlertDialog open={startDialogOpen} onOpenChange={setStartDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Start Job</AlertDialogTitle>
            <AlertDialogDescription>
              Are you ready to start working on this job? The tenant and merchant will be notified.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleStartConfirm} disabled={updateJobMutation.isPending}>
              Start Working
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Decline Confirmation Dialog with Required Reason */}
      <AlertDialog open={declineDialogOpen} onOpenChange={setDeclineDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Decline Job</AlertDialogTitle>
            <AlertDialogDescription>
              Please provide a reason for declining this job. This will be shared with the merchant.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Label htmlFor="decline-reason">Reason for declining *</Label>
            <Textarea
              id="decline-reason"
              value={declineReason}
              onChange={(e) => {
                setDeclineReason(e.target.value);
                setDeclineError('');
              }}
              placeholder="Please explain why you cannot accept this job (minimum 10 characters)..."
              className="mt-2"
              rows={3}
            />
            {declineError && (
              <p className="text-sm text-destructive mt-1">{declineError}</p>
            )}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeclineConfirm} 
              disabled={updateJobMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Decline Job
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Completion Dialog */}
      {selectedJob && (
        <CompletionDialog
          open={completionDialogOpen}
          onOpenChange={setCompletionDialogOpen}
          onConfirm={handleCompleteJob}
          isLoading={updateJobMutation.isPending}
          jobTitle={selectedJob.maintenance_requests?.title}
        />
      )}
    </VendorLayout>
  );
}
