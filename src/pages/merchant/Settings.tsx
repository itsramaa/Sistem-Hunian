import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MerchantLayout } from "@/components/layouts/MerchantLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { FileUpload } from "@/components/FileUpload";
import { BankAccountManager } from "@/components/merchant/BankAccountManager";
import { Building2, Shield, Bell, Loader2, Save, CheckCircle, Clock, XCircle, FileText, Trash2, CreditCard } from "lucide-react";

const Settings = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: merchant, isLoading } = useQuery({
    queryKey: ['merchant-settings', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('merchants')
        .select('*')
        .eq('user_id', user?.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const { data: profile } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user?.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const { data: verifications = [], refetch: refetchVerifications } = useQuery({
    queryKey: ['merchant-verifications', merchant?.id],
    queryFn: async () => {
      if (!merchant?.id) return [];
      const { data, error } = await supabase
        .from('merchant_verifications')
        .select('*')
        .eq('merchant_id', merchant.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!merchant?.id,
  });

  const [businessForm, setBusinessForm] = useState({
    business_name: '',
    business_type: '',
    address: '',
    city: '',
    province: '',
    postal_code: '',
  });

  const [profileForm, setProfileForm] = useState({
    full_name: '',
    phone: '',
  });

  useEffect(() => {
    if (merchant) {
      setBusinessForm({
        business_name: merchant.business_name || '',
        business_type: merchant.business_type || 'individual',
        address: merchant.address || '',
        city: merchant.city || '',
        province: merchant.province || '',
        postal_code: merchant.postal_code || '',
      });
    }
    if (profile) {
      setProfileForm({
        full_name: profile.full_name || '',
        phone: profile.phone || '',
      });
    }
  }, [merchant, profile]);

  const updateMerchant = useMutation({
    mutationFn: async (data: typeof businessForm) => {
      const { error } = await supabase
        .from('merchants')
        .update(data)
        .eq('user_id', user?.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['merchant-settings'] });
      toast.success('Business settings updated');
    },
    onError: () => toast.error('Failed to update settings'),
  });

  const updateProfile = useMutation({
    mutationFn: async (data: typeof profileForm) => {
      const { error } = await supabase
        .from('profiles')
        .update(data)
        .eq('user_id', user?.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast.success('Profile updated');
    },
    onError: () => toast.error('Failed to update profile'),
  });

  const uploadVerificationDocument = async (url: string, documentType: string) => {
    if (!merchant?.id) return;
    
    const { error } = await supabase
      .from('merchant_verifications')
      .insert({
        merchant_id: merchant.id,
        document_type: documentType,
        document_url: url,
        status: 'pending',
      });
    
    if (error) {
      toast.error('Failed to save document');
      return;
    }
    
    toast.success('Document uploaded successfully');
    refetchVerifications();
  };

  const deleteVerification = async (id: string) => {
    const { error } = await supabase
      .from('merchant_verifications')
      .delete()
      .eq('id', id);
    
    if (error) {
      toast.error('Failed to delete document');
      return;
    }
    
    toast.success('Document deleted');
    refetchVerifications();
  };

  const getVerificationBadge = (status: string) => {
    switch (status) {
      case 'verified':
        return <Badge className="bg-success text-success-foreground"><CheckCircle className="h-3 w-3 mr-1" /> Verified</Badge>;
      case 'pending':
        return <Badge variant="secondary" className="bg-warning/10 text-warning"><Clock className="h-3 w-3 mr-1" /> Pending</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" /> Rejected</Badge>;
      default:
        return <Badge variant="outline">Not Submitted</Badge>;
    }
  };

  const getSubscriptionBadge = (tier: string) => {
    switch (tier) {
      case 'premium':
        return <Badge className="bg-accent text-accent-foreground">Premium</Badge>;
      case 'professional':
        return <Badge className="bg-primary text-primary-foreground">Professional</Badge>;
      default:
        return <Badge variant="secondary">Free</Badge>;
    }
  };

  const documentTypes = [
    { value: 'national_id', label: 'National ID / Passport' },
    { value: 'proof_of_address', label: 'Proof of Address' },
    { value: 'business_registration', label: 'Business Registration' },
  ];

  const [selectedDocType, setSelectedDocType] = useState('national_id');

  if (isLoading) {
    return (
      <MerchantLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MerchantLayout>
    );
  }

  return (
    <MerchantLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground">Manage your business profile and preferences</p>
        </div>

        <Tabs defaultValue="business" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="business" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Business
            </TabsTrigger>
            <TabsTrigger value="verification" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Verification
            </TabsTrigger>
            <TabsTrigger value="banking" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Banking
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Notifications
            </TabsTrigger>
          </TabsList>

          <TabsContent value="business" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Business Profile</CardTitle>
                <CardDescription>Update your business information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Business Name</Label>
                    <Input
                      value={businessForm.business_name}
                      onChange={(e) => setBusinessForm({ ...businessForm, business_name: e.target.value })}
                      placeholder="Your business name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Business Type</Label>
                    <Select
                      value={businessForm.business_type}
                      onValueChange={(value) => setBusinessForm({ ...businessForm, business_type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="individual">Individual</SelectItem>
                        <SelectItem value="company">Company</SelectItem>
                        <SelectItem value="partnership">Partnership</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>Address</Label>
                    <Input
                      value={businessForm.address}
                      onChange={(e) => setBusinessForm({ ...businessForm, address: e.target.value })}
                      placeholder="Street address"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>City</Label>
                    <Input
                      value={businessForm.city}
                      onChange={(e) => setBusinessForm({ ...businessForm, city: e.target.value })}
                      placeholder="City"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Province</Label>
                    <Input
                      value={businessForm.province}
                      onChange={(e) => setBusinessForm({ ...businessForm, province: e.target.value })}
                      placeholder="Province"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Postal Code</Label>
                    <Input
                      value={businessForm.postal_code}
                      onChange={(e) => setBusinessForm({ ...businessForm, postal_code: e.target.value })}
                      placeholder="Postal code"
                    />
                  </div>
                </div>
                <Button 
                  onClick={() => updateMerchant.mutate(businessForm)}
                  disabled={updateMerchant.isPending}
                >
                  {updateMerchant.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                  Save Changes
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
                <CardDescription>Update your personal contact details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Full Name</Label>
                    <Input
                      value={profileForm.full_name}
                      onChange={(e) => setProfileForm({ ...profileForm, full_name: e.target.value })}
                      placeholder="Your full name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Phone</Label>
                    <Input
                      value={profileForm.phone}
                      onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                      placeholder="Phone number"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input value={profile?.email || ''} disabled />
                  </div>
                </div>
                <Button 
                  onClick={() => updateProfile.mutate(profileForm)}
                  disabled={updateProfile.isPending}
                >
                  {updateProfile.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                  Save Profile
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="verification" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Verification Status
                  {getVerificationBadge(merchant?.verification_status || 'pending')}
                </CardTitle>
                <CardDescription>
                  Verification helps build trust with tenants
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="p-4 rounded-lg bg-muted/50">
                  <h4 className="font-medium mb-2">Required Documents</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-center gap-2">
                      {verifications.some(v => v.document_type === 'national_id') ? (
                        <CheckCircle className="h-4 w-4 text-success" />
                      ) : (
                        <Clock className="h-4 w-4 text-muted-foreground" />
                      )}
                      Valid ID (Passport or National ID)
                    </li>
                    <li className="flex items-center gap-2">
                      {verifications.some(v => v.document_type === 'proof_of_address') ? (
                        <CheckCircle className="h-4 w-4 text-success" />
                      ) : (
                        <Clock className="h-4 w-4 text-muted-foreground" />
                      )}
                      Proof of Address
                    </li>
                    <li className="flex items-center gap-2">
                      {verifications.some(v => v.document_type === 'business_registration') ? (
                        <CheckCircle className="h-4 w-4 text-success" />
                      ) : (
                        <Clock className="h-4 w-4 text-muted-foreground" />
                      )}
                      Business Registration (for companies)
                    </li>
                  </ul>
                </div>

                {/* Upload New Document */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Document Type</Label>
                    <Select value={selectedDocType} onValueChange={setSelectedDocType}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {documentTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <FileUpload
                    bucket="verification-documents"
                    folder="verifications"
                    accept="image/*,application/pdf"
                    maxSize={10}
                    onUploadComplete={(url) => uploadVerificationDocument(url, selectedDocType)}
                  />
                </div>

                {/* Uploaded Documents */}
                {verifications.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-medium">Uploaded Documents</h4>
                    {verifications.map((doc) => (
                      <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <FileText className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium">
                              {documentTypes.find(t => t.value === doc.document_type)?.label || doc.document_type}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Uploaded {new Date(doc.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {getVerificationBadge(doc.status || 'pending')}
                          {doc.status === 'pending' && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => deleteVerification(doc.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Subscription
                  {getSubscriptionBadge(merchant?.subscription_tier || 'free')}
                </CardTitle>
                <CardDescription>Your current plan and features</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="p-4 rounded-lg bg-muted/50">
                  <h4 className="font-medium mb-2">Current Plan: {merchant?.subscription_tier || 'Free'}</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    Upgrade to unlock more features like advanced analytics, priority support, and more.
                  </p>
                  <Button className="gradient-primary">Upgrade Plan</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="banking" className="space-y-6">
            <BankAccountManager />
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Payment Reminder Settings</CardTitle>
                <CardDescription>Configure automatic payment reminders for tenants</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  {[
                    { label: 'Remind 7 days before due', description: 'Send reminder a week before payment is due', days: 7 },
                    { label: 'Remind 3 days before due', description: 'Send reminder 3 days before payment is due', days: 3 },
                    { label: 'Remind 1 day before due', description: 'Send reminder the day before payment is due', days: 1 },
                    { label: 'Remind on due date', description: 'Send reminder on the day payment is due', days: 0 },
                    { label: 'Overdue reminder (daily)', description: 'Send daily reminders for overdue payments', days: -1 },
                  ].map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-4 rounded-lg border">
                      <div>
                        <p className="font-medium">{item.label}</p>
                        <p className="text-sm text-muted-foreground">{item.description}</p>
                      </div>
                      <input type="checkbox" defaultChecked={item.days >= 0} className="h-4 w-4 rounded border-input accent-primary" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>Choose how you want to be notified</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  {[
                    { label: 'Payment Received', description: 'Get notified when a tenant makes a payment' },
                    { label: 'Maintenance Requests', description: 'New maintenance requests from tenants' },
                    { label: 'Contract Expiry', description: 'Reminders before contracts expire' },
                    { label: 'Weekly Reports', description: 'Weekly summary of your properties' },
                  ].map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-4 rounded-lg border">
                      <div>
                        <p className="font-medium">{item.label}</p>
                        <p className="text-sm text-muted-foreground">{item.description}</p>
                      </div>
                      <input type="checkbox" defaultChecked className="h-4 w-4 rounded border-input accent-primary" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MerchantLayout>
  );
};

export default Settings;
