import { VendorLayout } from '@/shared/components/layouts/VendorLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Textarea } from '@/shared/components/ui/textarea';
import { Checkbox } from '@/shared/components/ui/checkbox';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/integrations/supabase/client';
import { toast } from 'sonner';
import { useState, useEffect } from 'react';
import { 
  Star,
  Shield,
  CheckCircle2,
  Clock,
  AlertCircle,
  Save,
  Briefcase,
  TrendingUp,
  DollarSign,
  MapPin
} from 'lucide-react';
import { formatCurrency } from '@/shared/utils/currency';

const SERVICE_CATEGORIES = [
  'plumbing',
  'electrical',
  'hvac',
  'carpentry',
  'painting',
  'cleaning',
  'landscaping',
  'roofing',
  'appliance_repair',
  'general_maintenance',
];

export default function VendorProfile() {
  const { vendor, profile, refreshProfile } = useAuth();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    business_name: '',
    contact_email: '',
    contact_phone: '',
    address: '',
    city: '',
    province: '',
    description: '',
    service_categories: [] as string[],
  });

  useEffect(() => {
    if (vendor) {
      setFormData({
        business_name: vendor.business_name || '',
        contact_email: vendor.contact_email || '',
        contact_phone: vendor.contact_phone || '',
        address: vendor.address || '',
        city: vendor.city || '',
        province: vendor.province || '',
        description: vendor.description || '',
        service_categories: vendor.service_categories || [],
      });
    }
  }, [vendor]);

  // Fetch performance stats from vendor_jobs
  const { data: perfStats } = useQuery({
    queryKey: ['vendor-perf-stats', vendor?.id],
    queryFn: async () => {
      if (!vendor) return null;
      const { data: jobs } = await supabase
        .from('vendor_jobs')
        .select('status, agreed_price, created_at, started_at, completed_at')
        .eq('vendor_id', vendor.id);

      if (!jobs || jobs.length === 0) return null;

      const total = jobs.length;
      const completed = jobs.filter(j => j.status === 'completed');
      const completionRate = total > 0 ? Math.round((completed.length / total) * 100) : 0;
      const avgPrice = completed.length > 0
        ? completed.reduce((s, j) => s + (j.agreed_price || 0), 0) / completed.length
        : 0;

      // Avg response time (started_at - created_at) in hours
      const responseTimes = completed
        .filter(j => j.started_at && j.created_at)
        .map(j => (new Date(j.started_at!).getTime() - new Date(j.created_at).getTime()) / (1000 * 60 * 60));
      const avgResponseHrs = responseTimes.length > 0
        ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length)
        : 0;

      return { total, completed: completed.length, completionRate, avgPrice, avgResponseHrs };
    },
    enabled: !!vendor,
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (!vendor) throw new Error('Vendor not found');

      const { error } = await supabase
        .from('vendors')
        .update({
          business_name: data.business_name,
          contact_email: data.contact_email,
          contact_phone: data.contact_phone,
          address: data.address,
          city: data.city,
          province: data.province,
          description: data.description,
          service_categories: data.service_categories,
        })
        .eq('id', vendor.id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Profile updated successfully');
      refreshProfile();
      queryClient.invalidateQueries({ queryKey: ['vendor'] });
    },
    onError: (error) => {
      toast.error('Failed to update profile: ' + error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutate(formData);
  };

  const handleCategoryChange = (category: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      service_categories: checked
        ? [...prev.service_categories, category]
        : prev.service_categories.filter(c => c !== category),
    }));
  };

  const getVerificationStatusIcon = () => {
    switch (vendor?.verification_status) {
      case 'verified':
        return <CheckCircle2 className="h-5 w-5 text-success" />;
      case 'pending':
        return <Clock className="h-5 w-5 text-warning" />;
      case 'rejected':
        return <AlertCircle className="h-5 w-5 text-destructive" />;
      default:
        return <Shield className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getVerificationStatusBadge = () => {
    switch (vendor?.verification_status) {
      case 'verified':
        return <Badge className="bg-success">Verified</Badge>;
      case 'pending':
        return <Badge variant="secondary">Pending Verification</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="outline">Not Verified</Badge>;
    }
  };

  return (
    <VendorLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Profile</h1>
          <p className="text-muted-foreground">Manage your vendor profile and services</p>
        </div>

        {/* Verification Status Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {getVerificationStatusIcon()}
                <div>
                  <CardTitle>Verification Status</CardTitle>
                  <CardDescription>Your account verification status</CardDescription>
                </div>
              </div>
              {getVerificationStatusBadge()}
            </div>
          </CardHeader>
          <CardContent>
            {vendor?.verification_status === 'pending' && (
              <p className="text-sm text-muted-foreground">
                Your profile is being reviewed by our team. This usually takes 1-2 business days.
              </p>
            )}
            {vendor?.verification_status === 'verified' && (
              <p className="text-sm text-muted-foreground">
                Your account is verified. You can now receive job assignments from merchants.
              </p>
            )}
            {vendor?.verification_status === 'rejected' && (
              <p className="text-sm text-destructive">
                Your verification was rejected. Please update your profile and resubmit for verification.
              </p>
            )}
            {!vendor?.verification_status && (
              <p className="text-sm text-muted-foreground">
                Complete your profile to begin the verification process.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Performance Stats Card */}
        {perfStats && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <TrendingUp className="h-5 w-5 text-primary" />
                <div>
                  <CardTitle>Performance Summary</CardTitle>
                  <CardDescription>Computed from your completed jobs</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 rounded-xl bg-muted/50">
                  <Briefcase className="h-5 w-5 mx-auto mb-1 text-primary" />
                  <p className="text-2xl font-bold">{perfStats.total}</p>
                  <p className="text-xs text-muted-foreground">Total Jobs</p>
                </div>
                <div className="text-center p-3 rounded-xl bg-muted/50">
                  <CheckCircle2 className="h-5 w-5 mx-auto mb-1 text-success" />
                  <p className="text-2xl font-bold">{perfStats.completionRate}%</p>
                  <p className="text-xs text-muted-foreground">Completion Rate</p>
                </div>
                <div className="text-center p-3 rounded-xl bg-muted/50">
                  <Clock className="h-5 w-5 mx-auto mb-1 text-warning" />
                  <p className="text-2xl font-bold">{perfStats.avgResponseHrs}h</p>
                  <p className="text-xs text-muted-foreground">Avg Response</p>
                </div>
                <div className="text-center p-3 rounded-xl bg-muted/50">
                  <DollarSign className="h-5 w-5 mx-auto mb-1 text-primary" />
                  <p className="text-2xl font-bold text-sm">{formatCurrency(perfStats.avgPrice)}</p>
                  <p className="text-xs text-muted-foreground">Avg Job Price</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Rating Card */}
        {vendor?.rating !== null && vendor?.rating !== undefined && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Star className="h-5 w-5 text-warning" />
                <div>
                  <CardTitle>Your Rating</CardTitle>
                  <CardDescription>Based on completed jobs</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <span className="text-4xl font-bold">{vendor.rating.toFixed(1)}</span>
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-6 w-6 ${
                        star <= Math.round(vendor.rating || 0)
                          ? 'text-warning fill-warning'
                          : 'text-muted'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-muted-foreground">
                  ({vendor.total_jobs || 0} jobs completed)
                </span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Service Area Card */}
        {(vendor?.city || vendor?.province) && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <MapPin className="h-5 w-5 text-primary" />
                <div>
                  <CardTitle>Service Area</CardTitle>
                  <CardDescription>Your coverage area</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm">
                {[vendor?.address, vendor?.city, vendor?.province].filter(Boolean).join(', ')}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Profile Form */}
        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle>Business Information</CardTitle>
              <CardDescription>Update your vendor profile details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="business_name">Business Name *</Label>
                  <Input
                    id="business_name"
                    value={formData.business_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, business_name: e.target.value }))}
                    placeholder="Your business name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact_email">Contact Email *</Label>
                  <Input
                    id="contact_email"
                    type="email"
                    value={formData.contact_email}
                    onChange={(e) => setFormData(prev => ({ ...prev, contact_email: e.target.value }))}
                    placeholder="email@example.com"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact_phone">Contact Phone</Label>
                  <Input
                    id="contact_phone"
                    value={formData.contact_phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, contact_phone: e.target.value }))}
                    placeholder="+62 xxx xxxx xxxx"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                    placeholder="City"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="province">Province</Label>
                  <Input
                    id="province"
                    value={formData.province}
                    onChange={(e) => setFormData(prev => ({ ...prev, province: e.target.value }))}
                    placeholder="Province"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                    placeholder="Full address"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Business Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe your services and experience..."
                  rows={4}
                />
              </div>

              <div className="space-y-4">
                <Label>Service Categories</Label>
                <p className="text-sm text-muted-foreground">
                  Select the types of services you provide
                </p>
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                  {SERVICE_CATEGORIES.map((category) => (
                    <div key={category} className="flex items-center space-x-2">
                      <Checkbox
                        id={category}
                        checked={formData.service_categories.includes(category)}
                        onCheckedChange={(checked) => handleCategoryChange(category, !!checked)}
                      />
                      <Label htmlFor={category} className="capitalize cursor-pointer">
                        {category.replace('_', ' ')}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end">
                <Button type="submit" disabled={updateProfileMutation.isPending}>
                  <Save className="h-4 w-4 mr-2" />
                  {updateProfileMutation.isPending ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </VendorLayout>
  );
}
