import { CustomerInsights } from "@/features/analytics/components/CustomerInsights";
import { SalesAnalytics } from '@/features/analytics/components/SalesAnalytics';
import { useAnalytics } from '@/features/analytics/hooks/useAnalytics';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { VendorChatbot } from '@/features/chatbot/components/VendorChatbot';
import { VendorEarningsWidget } from '@/features/vendor/components/VendorEarningsWidget';
import { supabase } from '@/lib/integrations/supabase/client';
import { Tables } from '@/lib/integrations/supabase/types';
import { VendorLayout } from '@/shared/components/layouts/VendorLayout';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { getJobStatusColor, getPriorityColor } from '@/shared/utils/statusColors';
import { useQuery } from '@tanstack/react-query';
import {
  AlertCircle,
  ArrowRight,
  Briefcase,
  CheckCircle2,
  Clock,
  RefreshCcw,
  Star
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

// Type for vendor job with joined maintenance request data
type VendorJobWithDetails = Tables<'vendor_jobs'> & {
  maintenance_requests: Pick<Tables<'maintenance_requests'>, 'title' | 'priority'> & {
    units: Pick<Tables<'units'>, 'unit_number'> & {
      properties: Pick<Tables<'properties'>, 'name'>;
    };
  };
};

export default function VendorDashboard() {
  const { vendor, profile } = useAuth();
  const navigate = useNavigate();
  useAnalytics(); // Track page views automatically

  // Fetch ALL vendor jobs stats (removed limit)
  const { data: jobs = [], isLoading: isLoadingJobs, error: jobsError, refetch: refetchJobs } = useQuery({
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
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as VendorJobWithDetails[];
    },
    enabled: !!vendor,
  });

  // Fetch earnings stats
  const { data: earningsStats, isLoading: isLoadingEarnings, error: earningsError } = useQuery({
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

  // Calculate stats from ALL jobs
  const pendingJobs = jobs.filter(j => j.status === 'pending').length;
  const activeJobs = jobs.filter(j => ['accepted', 'in_progress'].includes(j.status)).length;
  const completedJobs = jobs.filter(j => j.status === 'completed').length;

  const isLoading = isLoadingJobs || isLoadingEarnings;
  const hasError = jobsError || earningsError;

  const handleRefresh = () => {
    refetchJobs();
    toast.success('Dashboard diperbarui');
  };

  const stats = [
    {
      title: 'Pekerjaan Tertunda',
      value: pendingJobs,
      icon: Clock,
      color: 'text-warning',
      bgColor: 'bg-warning/10',
    },
    {
      title: 'Pekerjaan Aktif',
      value: activeJobs,
      icon: Briefcase,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      title: 'Selesai',
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

  // Loading skeleton for stats
  const StatsSkeleton = () => (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {[1, 2, 3, 4].map(i => (
        <Card key={i}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-8 rounded-lg" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-16" />
          </CardContent>
        </Card>
      ))}
    </div>
  );

  return (
    <VendorLayout>
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Selamat datang kembali, {profile?.full_name || vendor?.business_name || 'Vendor'}!
            </h1>
            <p className="text-muted-foreground">
              Kelola pekerjaan dan pantau pendapatan Anda
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleRefresh}>
              <RefreshCcw className="h-4 w-4 mr-2" />
              Segarkan
            </Button>
            {vendor?.verification_status !== 'verified' && (
              <Button 
                variant="outline" 
                className="border-warning text-warning hover:bg-warning/10"
                onClick={() => navigate('/vendor/profile')}
              >
                <AlertCircle className="h-4 w-4 mr-2" />
                Lengkapi Verifikasi
              </Button>
            )}
          </div>
        </div>

        {/* Error State */}
        {hasError && (
          <Card className="border-destructive bg-destructive/5">
            <CardContent className="py-4">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-destructive" />
                <div>
                  <p className="font-medium text-destructive">Gagal memuat data dashboard</p>
                  <p className="text-sm text-muted-foreground">
                    Silakan coba segarkan halaman atau hubungi dukungan jika masalah berlanjut.
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={handleRefresh} className="ml-auto">
                  Coba Lagi
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Verification Warning */}
        {vendor?.verification_status === 'pending' && (
          <Card className="border-warning bg-warning/5">
            <CardContent className="py-4">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-warning" />
                <div>
                  <p className="font-medium text-warning">Verifikasi Tertunda</p>
                  <p className="text-sm text-muted-foreground">
                    Profil Anda sedang ditinjau. Anda akan dapat menerima pekerjaan setelah diverifikasi.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats Grid */}
        {isLoading ? (
          <StatsSkeleton />
        ) : (
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
        )}

        {/* Quick Actions */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Pekerjaan Terbaru</CardTitle>
                <CardDescription>Tugas pekerjaan terbaru Anda</CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={() => navigate('/vendor/jobs')}>
                Lihat Semua <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </CardHeader>
            <CardContent>
              {isLoadingJobs ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : jobs.length > 0 ? (
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
                        <Badge variant={getPriorityColor(job.maintenance_requests?.priority || '')} className="capitalize text-xs">
                          {job.maintenance_requests?.priority}
                        </Badge>
                        <Badge variant={getJobStatusColor(job.status)} className="capitalize text-xs">
                          {job.status.replace('_', ' ')}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Briefcase className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Belum ada pekerjaan</p>
                  <p className="text-sm">Pekerjaan yang ditugaskan kepada Anda akan muncul di sini</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Earnings Widget */}
          {vendor && <VendorEarningsWidget vendorId={vendor.id} />}
        </div>

        {/* AI Business Assistant */}
        {vendor && <VendorChatbot vendorId={vendor.id} businessName={vendor.business_name} />}

        {/* Sales Analytics */}
        {vendor && <SalesAnalytics vendorId={vendor.id} />}

        {/* Customer Insights */}
        {vendor && <CustomerInsights vendorId={vendor.id} />}

        {/* Service Categories */}
        <Card>
          <CardHeader>
            <CardTitle>Layanan Anda</CardTitle>
            <CardDescription>Kategori spesialisasi Anda</CardDescription>
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
                <p>Belum ada kategori layanan yang diatur</p>
                <Button 
                  variant="link" 
                  className="mt-2"
                  onClick={() => navigate('/vendor/profile')}
                >
                  Tambahkan spesialisasi Anda
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </VendorLayout>
  );
}
