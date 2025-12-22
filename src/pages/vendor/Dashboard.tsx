import { VendorLayout } from '@/components/layouts/VendorLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { 
  Briefcase, 
  Wallet, 
  Star, 
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';

interface VendorJob {
  id: string;
  status: string;
  agreed_price: number | null;
  created_at: string;
  maintenance_requests: {
    title: string;
    priority: string;
    units: {
      unit_number: string;
      properties: {
        name: string;
      };
    };
  };
}

export default function VendorDashboard() {
  const { vendor, profile } = useAuth();
  const navigate = useNavigate();

  // Fetch vendor jobs stats
  const { data: jobs = [] } = useQuery({
    queryKey: ['vendor-dashboard-jobs', vendor?.id],
    queryFn: async () => {
      if (!vendor) return [];
      
      const { data, error } = await supabase
        .from('vendor_jobs')
        .select(`
          id,
          status,
          agreed_price,
          created_at,
          maintenance_requests (
            title,
            priority,
            units (
              unit_number,
              properties (
                name
              )
            )
          )
        `)
        .eq('vendor_id', vendor.id)
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (error) throw error;
      return data as VendorJob[];
    },
    enabled: !!vendor,
  });

  // Fetch earnings stats
  const { data: earningsStats } = useQuery({
    queryKey: ['vendor-dashboard-earnings', vendor?.id],
    queryFn: async () => {
      if (!vendor) return { total: 0, thisMonth: 0 };
      
      const { data, error } = await supabase
        .from('vendor_earnings')
        .select('net_amount, created_at')
        .eq('vendor_id', vendor.id);
      
      if (error) throw error;
      
      const total = data.reduce((sum, e) => sum + e.net_amount, 0);
      const thisMonthStart = new Date();
      thisMonthStart.setDate(1);
      thisMonthStart.setHours(0, 0, 0, 0);
      
      const thisMonth = data
        .filter(e => new Date(e.created_at) >= thisMonthStart)
        .reduce((sum, e) => sum + e.net_amount, 0);
      
      return { total, thisMonth };
    },
    enabled: !!vendor,
  });

  const pendingJobs = jobs.filter(j => j.status === 'pending').length;
  const activeJobs = jobs.filter(j => ['accepted', 'in_progress'].includes(j.status)).length;
  const completedJobs = jobs.filter(j => j.status === 'completed').length;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const stats = [
    {
      title: 'Pending Jobs',
      value: pendingJobs,
      icon: Clock,
      color: 'text-warning',
      bgColor: 'bg-warning/10',
    },
    {
      title: 'Active Jobs',
      value: activeJobs,
      icon: Briefcase,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      title: 'Completed',
      value: completedJobs,
      icon: CheckCircle2,
      color: 'text-success',
      bgColor: 'bg-success/10',
    },
    {
      title: 'Rating',
      value: vendor?.rating ? `${vendor.rating.toFixed(1)} ⭐` : 'N/A',
      icon: Star,
      color: 'text-warning',
      bgColor: 'bg-warning/10',
    },
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'outline';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'secondary';
      case 'accepted': return 'default';
      case 'in_progress': return 'default';
      case 'completed': return 'outline';
      default: return 'secondary';
    }
  };

  return (
    <VendorLayout>
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Welcome back, {profile?.full_name || vendor?.business_name || 'Vendor'}!
            </h1>
            <p className="text-muted-foreground">
              Manage your jobs and track your earnings
            </p>
          </div>
          {vendor?.verification_status !== 'verified' && (
            <Button 
              variant="outline" 
              className="border-warning text-warning hover:bg-warning/10"
              onClick={() => navigate('/vendor/profile')}
            >
              <AlertCircle className="h-4 w-4 mr-2" />
              Complete Verification
            </Button>
          )}
        </div>

        {/* Verification Warning */}
        {vendor?.verification_status === 'pending' && (
          <Card className="border-warning bg-warning/5">
            <CardContent className="py-4">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-warning" />
                <div>
                  <p className="font-medium text-warning">Verification Pending</p>
                  <p className="text-sm text-muted-foreground">
                    Your profile is under review. You'll be able to receive jobs once verified.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <stat.icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Recent Jobs</CardTitle>
                <CardDescription>Your latest job assignments</CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={() => navigate('/vendor/jobs')}>
                View All <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </CardHeader>
            <CardContent>
              {jobs.length > 0 ? (
                <div className="space-y-3">
                  {jobs.slice(0, 3).map(job => (
                    <div key={job.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div className="space-y-1">
                        <p className="font-medium text-sm">{job.maintenance_requests?.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {job.maintenance_requests?.units?.properties?.name} - Unit {job.maintenance_requests?.units?.unit_number}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={getPriorityColor(job.maintenance_requests?.priority)} className="capitalize text-xs">
                          {job.maintenance_requests?.priority}
                        </Badge>
                        <Badge variant={getStatusColor(job.status)} className="capitalize text-xs">
                          {job.status.replace('_', ' ')}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Briefcase className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No jobs yet</p>
                  <p className="text-sm">Jobs assigned to you will appear here</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Earnings Overview</CardTitle>
                <CardDescription>Your income this month</CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={() => navigate('/vendor/earnings')}>
                View All <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-center py-4">
                  <p className="text-3xl font-bold text-foreground">
                    {formatCurrency(earningsStats?.thisMonth || 0)}
                  </p>
                  <p className="text-sm text-muted-foreground">This month's earnings</p>
                </div>
                <div className="p-4 rounded-lg bg-muted/50">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Total Earnings</span>
                    <span className="font-medium">{formatCurrency(earningsStats?.total || 0)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Service Categories */}
        <Card>
          <CardHeader>
            <CardTitle>Your Services</CardTitle>
            <CardDescription>Categories you specialize in</CardDescription>
          </CardHeader>
          <CardContent>
            {vendor?.service_categories && vendor.service_categories.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {vendor.service_categories.map((category) => (
                  <Badge key={category} variant="secondary" className="capitalize">
                    {category}
                  </Badge>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                <p>No service categories set</p>
                <Button 
                  variant="link" 
                  className="mt-2"
                  onClick={() => navigate('/vendor/profile')}
                >
                  Add your specializations
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </VendorLayout>
  );
}
