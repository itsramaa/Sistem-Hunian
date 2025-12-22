import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { TenantLayout } from "@/components/layouts/TenantLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { User, Bell, Shield, Loader2, Save, CreditCard, AlertCircle, Upload, Calendar, Wallet, Banknote } from "lucide-react";
import { format } from "date-fns";

interface NotificationPreferences {
  payment_reminders: boolean;
  maintenance_updates: boolean;
  new_invoices: boolean;
  contract_updates: boolean;
}

const TenantSettings = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: profile, isLoading: profileLoading } = useQuery({
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

  // Fetch tenant data
  const { data: tenant, isLoading: tenantLoading } = useQuery({
    queryKey: ['tenant', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tenants')
        .select('*')
        .eq('user_id', user?.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const isLoading = profileLoading || tenantLoading;

  const [profileForm, setProfileForm] = useState({
    full_name: '',
    phone: '',
  });

  const [tenantForm, setTenantForm] = useState({
    ktp_number: '',
    date_of_birth: '',
    gender: '',
    occupation: '',
    income_range: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    emergency_contact_relation: '',
  });

  const [notificationPrefs, setNotificationPrefs] = useState<NotificationPreferences>({
    payment_reminders: true,
    maintenance_updates: true,
    new_invoices: true,
    contract_updates: true,
  });

  const [autoPaySettings, setAutoPaySettings] = useState({
    enabled: false,
    day: 1,
  });

  const [ktpFile, setKtpFile] = useState<File | null>(null);
  const [ktpPreview, setKtpPreview] = useState<string | null>(null);

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // Initialize tenant form when data loads
  useEffect(() => {
    if (tenant) {
      setTenantForm({
        ktp_number: tenant.ktp_number || '',
        date_of_birth: tenant.date_of_birth || '',
        gender: tenant.gender || '',
        occupation: tenant.occupation || '',
        income_range: tenant.income_range || '',
        emergency_contact_name: tenant.emergency_contact_name || '',
        emergency_contact_phone: tenant.emergency_contact_phone || '',
        emergency_contact_relation: tenant.emergency_contact_relation || '',
      });
      if (tenant.ktp_photo_url) {
        setKtpPreview(tenant.ktp_photo_url);
      }
      // Load notification preferences
      const prefs = tenant.notification_preferences as unknown as NotificationPreferences | null;
      if (prefs) {
        setNotificationPrefs(prefs);
      }
      // Load auto-pay settings
      setAutoPaySettings({
        enabled: (tenant as { auto_pay_enabled?: boolean }).auto_pay_enabled || false,
        day: (tenant as { auto_pay_day?: number }).auto_pay_day || 1,
      });
    }
  }, [tenant]);

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
      toast.success('Profile updated successfully');
    },
    onError: () => toast.error('Failed to update profile'),
  });

  const changePassword = useMutation({
    mutationFn: async () => {
      if (passwordForm.newPassword !== passwordForm.confirmPassword) {
        throw new Error('Passwords do not match');
      }
      const { error } = await supabase.auth.updateUser({
        password: passwordForm.newPassword,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Password changed successfully');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  // Update tenant profile mutation
  const updateTenantProfile = useMutation({
    mutationFn: async () => {
      let ktpPhotoUrl = tenant?.ktp_photo_url || null;

      // Upload KTP photo if new file selected
      if (ktpFile) {
        const fileExt = ktpFile.name.split('.').pop();
        const fileName = `${user?.id}-ktp-${Date.now()}.${fileExt}`;
        const filePath = `ktp/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('verification-documents')
          .upload(filePath, ktpFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('verification-documents')
          .getPublicUrl(filePath);

        ktpPhotoUrl = publicUrl;
      }

      const tenantData = {
        ktp_number: tenantForm.ktp_number || null,
        ktp_photo_url: ktpPhotoUrl,
        date_of_birth: tenantForm.date_of_birth || null,
        gender: tenantForm.gender || null,
        occupation: tenantForm.occupation || null,
        income_range: tenantForm.income_range || null,
        emergency_contact_name: tenantForm.emergency_contact_name || null,
        emergency_contact_phone: tenantForm.emergency_contact_phone || null,
        emergency_contact_relation: tenantForm.emergency_contact_relation || null,
      };

      if (tenant) {
        const { error } = await supabase
          .from('tenants')
          .update(tenantData)
          .eq('user_id', user?.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('tenants')
          .insert({ user_id: user?.id, ...tenantData });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenant'] });
      toast.success('Profile updated successfully');
      setKtpFile(null);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  // Update notification preferences mutation
  const updateNotificationPrefs = useMutation({
    mutationFn: async (prefs: NotificationPreferences) => {
      if (!user?.id) throw new Error('User not found');
      
      // Use raw SQL update to handle the new column that's not in types yet
      const { error } = await supabase
        .from('tenants')
        .update({ 
          notification_preferences: JSON.parse(JSON.stringify(prefs))
        } as any)
        .eq('user_id', user.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenant'] });
      toast.success('Notification preferences saved');
    },
    onError: () => toast.error('Failed to save preferences'),
  });

  // Update auto-pay settings mutation
  const updateAutoPaySettings = useMutation({
    mutationFn: async (settings: { enabled: boolean; day: number }) => {
      if (!user?.id) throw new Error('User not found');
      
      const { error } = await supabase
        .from('tenants')
        .update({ 
          auto_pay_enabled: settings.enabled, 
          auto_pay_day: settings.day 
        } as any)
        .eq('user_id', user.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenant'] });
      toast.success('Auto-pay settings saved');
    },
    onError: () => toast.error('Failed to save auto-pay settings'),
  });

  const handleKtpFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size must be less than 5MB');
        return;
      }
      setKtpFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setKtpPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  if (isLoading) {
    return (
      <TenantLayout title="Settings">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </TenantLayout>
    );
  }

  return (
    <TenantLayout 
      title="Settings"
      description="Manage your profile and preferences"
    >
      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">Profile</span>
          </TabsTrigger>
          <TabsTrigger value="identity" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            <span className="hidden sm:inline">Identity</span>
          </TabsTrigger>
          <TabsTrigger value="payments" className="flex items-center gap-2">
            <Banknote className="h-4 w-4" />
            <span className="hidden sm:inline">Payments</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            <span className="hidden sm:inline">Security</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            <span className="hidden sm:inline">Alerts</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>Update your personal details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Full Name</Label>
                  <Input
                    value={profileForm.full_name || profile?.full_name || ''}
                    onChange={(e) => setProfileForm({ ...profileForm, full_name: e.target.value })}
                    placeholder="Your full name"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Phone Number</Label>
                  <Input
                    value={profileForm.phone || profile?.phone || ''}
                    onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                    placeholder="Your phone number"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input value={profile?.email || ''} disabled />
                  <p className="text-xs text-muted-foreground">Contact support to change your email</p>
                </div>
              </div>
              <Button 
                onClick={() => updateProfile.mutate(profileForm)}
                disabled={updateProfile.isPending}
              >
                {updateProfile.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                Save Changes
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="identity" className="space-y-6">
          {/* KTP Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Identity Information
              </CardTitle>
              <CardDescription>Your KTP and personal details for verification</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>KTP Number (NIK)</Label>
                  <Input
                    value={tenantForm.ktp_number}
                    onChange={(e) => setTenantForm({ ...tenantForm, ktp_number: e.target.value })}
                    placeholder="16 digit NIK"
                    maxLength={16}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Date of Birth</Label>
                  <Input
                    type="date"
                    value={tenantForm.date_of_birth}
                    onChange={(e) => setTenantForm({ ...tenantForm, date_of_birth: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Gender</Label>
                  <Select
                    value={tenantForm.gender}
                    onValueChange={(value) => setTenantForm({ ...tenantForm, gender: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Occupation</Label>
                  <Input
                    value={tenantForm.occupation}
                    onChange={(e) => setTenantForm({ ...tenantForm, occupation: e.target.value })}
                    placeholder="e.g., Software Engineer"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Income Range (Monthly)</Label>
                <Select
                  value={tenantForm.income_range}
                  onValueChange={(value) => setTenantForm({ ...tenantForm, income_range: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select income range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="< 5 Juta">{"< Rp 5.000.000"}</SelectItem>
                    <SelectItem value="5-10 Juta">Rp 5.000.000 - Rp 10.000.000</SelectItem>
                    <SelectItem value="10-20 Juta">Rp 10.000.000 - Rp 20.000.000</SelectItem>
                    <SelectItem value="20-50 Juta">Rp 20.000.000 - Rp 50.000.000</SelectItem>
                    <SelectItem value="> 50 Juta">{"> Rp 50.000.000"}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* KTP Photo Upload */}
              <div className="space-y-2">
                <Label>KTP Photo</Label>
                <div className="border-2 border-dashed rounded-lg p-4">
                  {ktpPreview ? (
                    <div className="space-y-3">
                      <img
                        src={ktpPreview}
                        alt="KTP Preview"
                        className="max-h-40 mx-auto rounded-lg object-contain"
                      />
                      <div className="flex justify-center">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setKtpFile(null);
                            setKtpPreview(null);
                          }}
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <label className="cursor-pointer block text-center">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleKtpFileChange}
                        className="hidden"
                      />
                      <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
                      <p className="text-sm mt-2">Click to upload KTP photo</p>
                      <p className="text-xs text-muted-foreground">PNG, JPG up to 5MB</p>
                    </label>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Emergency Contact */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                Emergency Contact
              </CardTitle>
              <CardDescription>Contact information for emergencies</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Contact Name</Label>
                  <Input
                    value={tenantForm.emergency_contact_name}
                    onChange={(e) => setTenantForm({ ...tenantForm, emergency_contact_name: e.target.value })}
                    placeholder="Full name"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Contact Phone</Label>
                  <Input
                    value={tenantForm.emergency_contact_phone}
                    onChange={(e) => setTenantForm({ ...tenantForm, emergency_contact_phone: e.target.value })}
                    placeholder="+62..."
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Relationship</Label>
                <Select
                  value={tenantForm.emergency_contact_relation}
                  onValueChange={(value) => setTenantForm({ ...tenantForm, emergency_contact_relation: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select relationship" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="parent">Parent</SelectItem>
                    <SelectItem value="spouse">Spouse</SelectItem>
                    <SelectItem value="sibling">Sibling</SelectItem>
                    <SelectItem value="child">Child</SelectItem>
                    <SelectItem value="friend">Friend</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button 
                onClick={() => updateTenantProfile.mutate()}
                disabled={updateTenantProfile.isPending}
              >
                {updateTenantProfile.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                Save Identity & Emergency Info
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Saved Payment Methods Tab */}
        <TabsContent value="payments" className="space-y-6">
          <SavedPaymentMethodsSection userId={user?.id} />
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Change Password</CardTitle>
              <CardDescription>Update your password to keep your account secure</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4 max-w-md">
                <div className="space-y-2">
                  <Label>New Password</Label>
                  <Input
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    placeholder="Enter new password"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Confirm Password</Label>
                  <Input
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                    placeholder="Confirm new password"
                  />
                </div>
              </div>
              <Button 
                onClick={() => changePassword.mutate()}
                disabled={changePassword.isPending || !passwordForm.newPassword}
              >
                {changePassword.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Shield className="h-4 w-4 mr-2" />}
                Change Password
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notification Preferences
              </CardTitle>
              <CardDescription>Choose what notifications you receive</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { key: 'payment_reminders', label: 'Payment Reminders', description: 'Get reminders before rent is due' },
                { key: 'maintenance_updates', label: 'Maintenance Updates', description: 'Updates on your maintenance requests' },
                { key: 'new_invoices', label: 'New Invoices', description: 'Notifications when new invoices are created' },
                { key: 'contract_updates', label: 'Contract Updates', description: 'Important updates about your lease' },
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between p-4 rounded-lg border">
                  <div>
                    <p className="font-medium">{item.label}</p>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </div>
                  <Switch
                    checked={notificationPrefs[item.key as keyof NotificationPreferences]}
                    onCheckedChange={(checked) => {
                      const newPrefs = { ...notificationPrefs, [item.key]: checked };
                      setNotificationPrefs(newPrefs);
                      // Save immediately
                      updateNotificationPrefs.mutate(newPrefs);
                    }}
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Auto-Pay Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wallet className="h-5 w-5" />
                Auto-Pay Settings
              </CardTitle>
              <CardDescription>Set up automatic payment for your rent</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg border">
                <div>
                  <p className="font-medium">Enable Auto-Pay</p>
                  <p className="text-sm text-muted-foreground">
                    Automatically pay rent on the scheduled day each month
                  </p>
                </div>
                <Switch
                  checked={autoPaySettings.enabled}
                  onCheckedChange={(checked) => {
                    const newSettings = { ...autoPaySettings, enabled: checked };
                    setAutoPaySettings(newSettings);
                    updateAutoPaySettings.mutate(newSettings);
                  }}
                />
              </div>

              {autoPaySettings.enabled && (
                <div className="space-y-2 p-4 rounded-lg border bg-muted/50">
                  <Label className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Payment Day of Month
                  </Label>
                  <Select
                    value={autoPaySettings.day.toString()}
                    onValueChange={(value) => {
                      const newSettings = { ...autoPaySettings, day: parseInt(value) };
                      setAutoPaySettings(newSettings);
                      updateAutoPaySettings.mutate(newSettings);
                    }}
                  >
                    <SelectTrigger className="w-full max-w-xs">
                      <SelectValue placeholder="Select day" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 28 }, (_, i) => i + 1).map((day) => (
                        <SelectItem key={day} value={day.toString()}>
                          {day === 1 ? '1st' : day === 2 ? '2nd' : day === 3 ? '3rd' : `${day}th`} of each month
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-2">
                    Your payment will be processed automatically on this day every month.
                    Make sure your payment method is up to date.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </TenantLayout>
  );
};

// Saved Payment Methods Component
function SavedPaymentMethodsSection({ userId }: { userId?: string }) {
  const { data: paymentMethods, isLoading } = useQuery({
    queryKey: ["saved-payment-methods", userId],
    queryFn: async () => {
      // Get distinct payment methods from successful xendit transactions
      const { data, error } = await supabase
        .from("xendit_transactions")
        .select("payment_method, payment_channel, created_at")
        .eq("user_id", userId)
        .eq("status", "paid")
        .not("payment_method", "is", null)
        .order("created_at", { ascending: false })
        .limit(10);
      
      if (error) throw error;
      
      // Deduplicate by payment method + channel
      const seen = new Set<string>();
      const unique = data?.filter(pm => {
        const key = `${pm.payment_method}-${pm.payment_channel}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      }) || [];
      
      return unique;
    },
    enabled: !!userId,
  });

  const formatMethodName = (method: string | null, channel: string | null) => {
    if (channel) {
      return channel.replace(/_/g, ' ').toUpperCase();
    }
    if (method) {
      return method.replace(/_/g, ' ').toUpperCase();
    }
    return 'Unknown Method';
  };

  const getMethodIcon = (method: string | null) => {
    switch (method?.toLowerCase()) {
      case 'virtual_account':
        return '🏦';
      case 'ewallet':
        return '📱';
      case 'qr_code':
        return '📷';
      case 'credit_card':
        return '💳';
      default:
        return '💰';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Banknote className="h-5 w-5" />
          Payment Methods
        </CardTitle>
        <CardDescription>Your recently used payment methods</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : paymentMethods && paymentMethods.length > 0 ? (
          <div className="space-y-3">
            {paymentMethods.map((pm, index) => (
              <div key={index} className="flex items-center justify-between p-4 rounded-lg border">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{getMethodIcon(pm.payment_method)}</span>
                  <div>
                    <p className="font-medium">{formatMethodName(pm.payment_method, pm.payment_channel)}</p>
                    <p className="text-sm text-muted-foreground">
                      Last used: {format(new Date(pm.created_at), 'dd MMM yyyy')}
                    </p>
                  </div>
                </div>
                <Badge variant="secondary">Available</Badge>
              </div>
            ))}
            <p className="text-xs text-muted-foreground mt-4">
              These payment methods can be used for faster checkout on future payments.
            </p>
          </div>
        ) : (
          <div className="text-center py-8">
            <Banknote className="h-12 w-12 mx-auto text-muted-foreground" />
            <h3 className="mt-4 font-medium">No payment methods yet</h3>
            <p className="text-sm text-muted-foreground mt-2">
              Your payment methods will appear here after your first successful payment.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default TenantSettings;
