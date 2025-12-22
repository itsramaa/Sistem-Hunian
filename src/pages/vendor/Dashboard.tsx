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
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function VendorDashboard() {
  const { vendor, profile } = useAuth();
  const navigate = useNavigate();

  // For now, we'll show placeholder stats since we need a vendor_jobs table
  // In a real implementation, you'd fetch actual job data

  const stats = [
    {
      title: 'Total Jobs',
      value: vendor?.total_jobs || 0,
      icon: Briefcase,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      title: 'Rating',
      value: vendor?.rating ? `${vendor.rating.toFixed(1)} ⭐` : 'N/A',
      icon: Star,
      color: 'text-warning',
      bgColor: 'bg-warning/10',
    },
    {
      title: 'Pending Jobs',
      value: 0,
      icon: Clock,
      color: 'text-muted-foreground',
      bgColor: 'bg-muted',
    },
    {
      title: 'Completed Jobs',
      value: vendor?.total_jobs || 0,
      icon: CheckCircle2,
      color: 'text-success',
      bgColor: 'bg-success/10',
    },
  ];

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
            <CardHeader>
              <CardTitle>Recent Jobs</CardTitle>
              <CardDescription>Your latest job assignments</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Briefcase className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No jobs yet</p>
                <p className="text-sm">Jobs assigned to you will appear here</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Earnings Overview</CardTitle>
              <CardDescription>Your income this month</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Wallet className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-2xl font-bold text-foreground">Rp 0</p>
                <p className="text-sm">Total earnings this month</p>
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
