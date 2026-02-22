import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { Badge } from "@/shared/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
import { toast } from "sonner";
import { supabase } from "@/lib/integrations/supabase/client";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { FileUpload } from "@/shared/components/FileUpload";
import { BankAccountManager } from "@/features/payments/components/BankAccountManager";
import { Building2, Shield, CreditCard, Loader2, Save, CheckCircle, Clock, XCircle, Trash2, Copy } from "lucide-react";
import { ProfileFormSkeleton } from "@/shared/components/ui/skeletons";

const MerchantProfile = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: merchant, isLoading } = useQuery({
    queryKey: ['merchant-profile', user?.id],
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
      queryClient.invalidateQueries({ queryKey: ['merchant-profile'] });
      toast.success('Business profile updated');
    },
    onError: () => toast.error('Failed to update profile'),
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
      toast.success('Contact info updated');
    },
    onError: () => toast.error('Failed to update contact info'),
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

  const copyMerchantCode = () => {
    if (merchant?.merchant_code) {
      navigator.clipboard.writeText(merchant.merchant_code);
      toast.success('Merchant code copied to clipboard');
    }
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

  const documentTypes = [
    { value: 'ktp', label: 'KTP (National ID)' },
    { value: 'npwp', label: 'NPWP (Tax ID)' },
    { value: 'surat_kepemilikan', label: 'Surat Kepemilikan (Ownership Certificate)' },
    { value: 'siup', label: 'SIUP (Business License)' },
    { value: 'akta_perusahaan', label: 'Akta Perusahaan (Company Deed)' },
    { value: 'proof_of_address', label: 'Bukti Alamat (Utility Bill)' },
  ];

  const [selectedDocType, setSelectedDocType] = useState('ktp');

  if (isLoading) {
    return <ProfileFormSkeleton />;
  }

  return (
    <>
      <Tabs defaultValue="business" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
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
        </TabsList>

        <TabsContent value="business" className="space-y-6">
          {/* Merchant Code Card */}
          <Card>
            <CardHeader>
              <CardTitle>Merchant Code</CardTitle>
              <CardDescription>Share this code with tenants to link them to your property</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <div className="flex-1 p-4 bg-muted rounded-lg font-mono text-2xl font-bold tracking-widest text-center">
                  {merchant?.merchant_code || 'Loading...'}
                </div>
                <Button variant="outline" size="icon" onClick={copyMerchantCode}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Tenants will use this code when registering to be linked to your properties.
              </p>
            </CardContent>
          </Card>

          {/* Business Profile */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                <CardTitle>Business Profile</CardTitle>
              </div>
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

          {/* Contact Information */}
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
                Save Contact Info
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="verification" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  <CardTitle>Verification Status</CardTitle>
                </div>
                {getVerificationBadge(merchant?.verification_status || 'pending')}
              </div>
              <CardDescription>
                Verification helps build trust with tenants
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-4 rounded-lg bg-muted/50">
                <h4 className="font-medium mb-2">Required Documents</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    {verifications.some(v => v.document_type === 'ktp') ? (
                      <CheckCircle className="h-4 w-4 text-success" />
                    ) : (
                      <Clock className="h-4 w-4 text-muted-foreground" />
                    )}
                    KTP (Kartu Tanda Penduduk)
                  </li>
                  <li className="flex items-center gap-2">
                    {verifications.some(v => v.document_type === 'npwp') ? (
                      <CheckCircle className="h-4 w-4 text-success" />
                    ) : (
                      <Clock className="h-4 w-4 text-muted-foreground" />
                    )}
                    NPWP (Nomor Pokok Wajib Pajak)
                  </li>
                  <li className="flex items-center gap-2">
                    {verifications.some(v => v.document_type === 'surat_kepemilikan') ? (
                      <CheckCircle className="h-4 w-4 text-success" />
                    ) : (
                      <Clock className="h-4 w-4 text-muted-foreground" />
                    )}
                    Surat Kepemilikan (Ownership Certificate)
                  </li>
                  {businessForm.business_type !== 'individual' && (
                    <>
                      <li className="flex items-center gap-2">
                        {verifications.some(v => v.document_type === 'siup') ? (
                          <CheckCircle className="h-4 w-4 text-success" />
                        ) : (
                          <Clock className="h-4 w-4 text-muted-foreground" />
                        )}
                        SIUP (Surat Izin Usaha Perdagangan)
                      </li>
                      <li className="flex items-center gap-2">
                        {verifications.some(v => v.document_type === 'akta_perusahaan') ? (
                          <CheckCircle className="h-4 w-4 text-success" />
                        ) : (
                          <Clock className="h-4 w-4 text-muted-foreground" />
                        )}
                        Akta Perusahaan (Company Deed)
                      </li>
                    </>
                  )}
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
                    <div key={doc.id} className="flex items-center justify-between p-3 rounded-lg border">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-muted">
                          <Shield className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-sm font-medium capitalize">
                            {doc.document_type.replace(/_/g, ' ')}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(doc.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getVerificationBadge(doc.status || 'pending')}
                        {doc.status === 'pending' && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive"
                            onClick={() => deleteVerification(doc.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="banking" className="space-y-6">
          <BankAccountManager />
        </TabsContent>
      </Tabs>
    </>
  );
};

export default MerchantProfile;
