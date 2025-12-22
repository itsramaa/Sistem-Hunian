import { VendorLayout } from '@/components/layouts/VendorLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { 
  Briefcase, 
  Clock, 
  CheckCircle2, 
  MapPin,
  Calendar,
  User,
  Building2,
  Phone,
  AlertCircle
} from 'lucide-react';
import { format } from 'date-fns';

interface MaintenanceJob {
  id: string;
  title: string;
  description: string | null;
  category: string;
  priority: string;
  status: string;
  created_at: string;
  unit_id: string;
  assigned_to: string | null;
  units?: {
    unit_number: string;
    properties?: {
      name: string;
      address: string;
      city: string;
    };
  };
}

export default function VendorJobs() {
  const { vendor, user } = useAuth();

  // Fetch maintenance requests assigned to this vendor
  const { data: jobs = [], isLoading } = useQuery({
    queryKey: ['vendor-jobs', vendor?.id],
    queryFn: async () => {
      if (!vendor) return [];
      
      // For now, we'll fetch maintenance requests where assigned_to matches vendor business name
      // In production, you'd have a proper vendor_jobs junction table
      const { data, error } = await supabase
        .from('maintenance_requests')
        .select(`
          *,
          units (
            unit_number,
            properties (
              name,
              address,
              city
            )
          )
        `)
        .eq('assigned_to', vendor.business_name)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as MaintenanceJob[];
    },
    enabled: !!vendor,
  });

  const pendingJobs = jobs.filter(j => j.status === 'pending' || j.status === 'in_progress');
  const completedJobs = jobs.filter(j => j.status === 'completed');

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'outline';
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

  const JobCard = ({ job }: { job: MaintenanceJob }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg">{job.title}</CardTitle>
            <CardDescription className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              {job.units?.properties?.name} - Unit {job.units?.unit_number}
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Badge variant={getPriorityColor(job.priority)} className="capitalize">
              {job.priority}
            </Badge>
            <Badge variant={getStatusColor(job.status)} className="capitalize">
              {job.status.replace('_', ' ')}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {job.description && (
          <p className="text-sm text-muted-foreground">{job.description}</p>
        )}
        
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span>{job.units?.properties?.address}, {job.units?.properties?.city}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>{format(new Date(job.created_at), 'dd MMM yyyy')}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="outline" className="capitalize">
            {job.category}
          </Badge>
        </div>

        {job.status !== 'completed' && (
          <div className="flex gap-2 pt-2">
            <Button variant="outline" size="sm" className="flex-1">
              View Details
            </Button>
            {job.status === 'pending' && (
              <Button size="sm" className="flex-1">
                Start Job
              </Button>
            )}
            {job.status === 'in_progress' && (
              <Button size="sm" className="flex-1">
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
                    You need to be verified to receive job assignments from merchants.
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
              Active ({pendingJobs.length})
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
            ) : pendingJobs.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2">
                {pendingJobs.map(job => (
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
    </VendorLayout>
  );
}
