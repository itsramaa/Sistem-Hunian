import { VendorLayout } from '@/components/layouts/VendorLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/hooks/useAuth';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useState, useEffect, useMemo } from 'react';
import { 
  User, 
  Lock, 
  Bell, 
  CreditCard, 
  Save,
  Trash2,
  Shield,
  Calendar,
  Eye,
  EyeOff,
  AlertTriangle
} from 'lucide-react';
import { VerificationUpload } from '@/components/vendor/VerificationUpload';
import { DisbursementSettings } from '@/components/vendor/DisbursementSettings';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { validatePhoneNumber, validatePassword } from '@/lib/vendorValidations';

interface VendorBankAccount {
  id: string;
  vendor_id: string;
  bank_name: string;
  account_name: string;
  account_number: string;
  branch_code: string | null;
  is_primary: boolean;
}

// Mask bank account number - show only last 4 digits
const maskAccountNumber = (accountNumber: string): string => {
  if (!accountNumber || accountNumber.length <= 4) return accountNumber;
  const masked = '*'.repeat(accountNumber.length - 4);
  return masked + accountNumber.slice(-4);
};

// Calculate password strength
const getPasswordStrength = (password: string): { score: number; label: string; color: string } => {
  let score = 0;
  
  if (password.length >= 6) score += 20;
  if (password.length >= 8) score += 20;
  if (/[a-z]/.test(password)) score += 15;
  if (/[A-Z]/.test(password)) score += 15;
  if (/[0-9]/.test(password)) score += 15;
  if (/[^a-zA-Z0-9]/.test(password)) score += 15;
  
  if (score < 40) return { score, label: 'Weak', color: 'bg-destructive' };
  if (score < 70) return { score, label: 'Medium', color: 'bg-warning' };
  return { score, label: 'Strong', color: 'bg-success' };
};

export default function VendorSettings() {
  const { profile, refreshProfile, vendor, user } = useAuth();
  const queryClient = useQueryClient();
  const [showAccountNumber, setShowAccountNumber] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, label: '', color: '' });

  const [profileData, setProfileData] = useState({
    full_name: '',
    phone: '',
  });

  const [phoneError, setPhoneError] = useState<string | null>(null);

  const [notifications, setNotifications] = useState({
    email_new_jobs: true,
    email_job_updates: true,
    email_payments: true,
    push_new_jobs: true,
    push_job_updates: true,
  });

  const [bankDetails, setBankDetails] = useState({
    bank_name: '',
    account_name: '',
    account_number: '',
    branch_code: '',
  });

  // Fetch existing bank accounts
  const { data: bankAccounts = [] } = useQuery({
    queryKey: ['vendor-bank-accounts', vendor?.id],
    queryFn: async () => {
      if (!vendor) return [];
      
      const { data, error } = await supabase
        .from('vendor_bank_accounts')
        .select('*')
        .eq('vendor_id', vendor.id)
        .order('is_primary', { ascending: false });
      
      if (error) throw error;
      return data as VendorBankAccount[];
    },
    enabled: !!vendor,
  });

  // Fetch vendor notification settings
  const { data: vendorSettings } = useQuery({
    queryKey: ['vendor-notification-settings', vendor?.id],
    queryFn: async () => {
      if (!vendor) return null;
      
      const { data, error } = await supabase
        .from('vendors')
        .select('notification_settings')
        .eq('id', vendor.id)
        .single();
      
      if (error) throw error;
      return data?.notification_settings as typeof notifications | null;
    },
    enabled: !!vendor,
  });

  useEffect(() => {
    if (profile) {
      setProfileData({
        full_name: profile.full_name || '',
        phone: profile.phone || '',
      });
    }
  }, [profile]);

  // Load notification settings from database
  useEffect(() => {
    if (vendorSettings) {
      setNotifications({
        email_new_jobs: vendorSettings.email_new_jobs ?? true,
        email_job_updates: vendorSettings.email_job_updates ?? true,
        email_payments: vendorSettings.email_payments ?? true,
        push_new_jobs: vendorSettings.push_new_jobs ?? true,
        push_job_updates: vendorSettings.push_job_updates ?? true,
      });
    }
  }, [vendorSettings]);

  // Load primary bank account into form
  useEffect(() => {
    const primaryAccount = bankAccounts.find(a => a.is_primary);
    if (primaryAccount) {
      setBankDetails({
        bank_name: primaryAccount.bank_name,
        account_name: primaryAccount.account_name,
        account_number: primaryAccount.account_number,
        branch_code: primaryAccount.branch_code || '',
      });
    }
  }, [bankAccounts]);

  // Validate phone on change
  const handlePhoneChange = (value: string) => {
    setProfileData(prev => ({ ...prev, phone: value }));
    const validation = validatePhoneNumber(value);
    setPhoneError(validation.isValid ? null : validation.error || null);
  };

  const updateProfileMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('User not found');

      // Validate phone before submission
      if (profileData.phone) {
        const phoneValidation = validatePhoneNumber(profileData.phone);
        if (!phoneValidation.isValid) {
          throw new Error(phoneValidation.error);
        }
      }

      // Use user_id instead of profile.id for the update
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: profileData.full_name,
          phone: profileData.phone,
        })
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Profile updated successfully');
      refreshProfile();
    },
    onError: (error) => {
      toast.error('Failed to update profile: ' + error.message);
    },
  });

  const updatePasswordMutation = useMutation({
    mutationFn: async ({ currentPassword, newPassword }: { currentPassword: string; newPassword: string }) => {
      // First verify current password by trying to sign in
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user?.email || '',
        password: currentPassword,
      });

      if (signInError) {
        throw new Error('Current password is incorrect');
      }

      // Update to new password
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Password updated successfully');
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  // Save notification settings
  const saveNotificationsMutation = useMutation({
    mutationFn: async (newNotifications: typeof notifications) => {
      if (!vendor) throw new Error('Vendor not found');

      const { error } = await supabase
        .from('vendors')
        .update({ notification_settings: newNotifications })
        .eq('id', vendor.id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Notification settings saved');
      queryClient.invalidateQueries({ queryKey: ['vendor-notification-settings'] });
    },
    onError: (error) => {
      toast.error('Failed to save settings: ' + error.message);
    },
  });

  const handleNotificationChange = (key: keyof typeof notifications, value: boolean) => {
    const newNotifications = { ...notifications, [key]: value };
    setNotifications(newNotifications);
    saveNotificationsMutation.mutate(newNotifications);
  };

  const saveBankDetailsMutation = useMutation({
    mutationFn: async () => {
      if (!vendor) throw new Error('Vendor not found');

      // Check if there's an existing primary account
      const existingPrimary = bankAccounts.find(a => a.is_primary);

      if (existingPrimary) {
        // Update existing
        const { error } = await supabase
          .from('vendor_bank_accounts')
          .update({
            bank_name: bankDetails.bank_name,
            account_name: bankDetails.account_name,
            account_number: bankDetails.account_number,
            branch_code: bankDetails.branch_code || null,
          })
          .eq('id', existingPrimary.id);

        if (error) throw error;
      } else {
        // Insert new
        const { error } = await supabase
          .from('vendor_bank_accounts')
          .insert({
            vendor_id: vendor.id,
            bank_name: bankDetails.bank_name,
            account_name: bankDetails.account_name,
            account_number: bankDetails.account_number,
            branch_code: bankDetails.branch_code || null,
            is_primary: true,
          });

        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success('Bank details saved successfully');
      queryClient.invalidateQueries({ queryKey: ['vendor-bank-accounts'] });
    },
    onError: (error) => {
      toast.error('Failed to save bank details: ' + error.message);
    },
  });

  const deleteBankAccountMutation = useMutation({
    mutationFn: async (accountId: string) => {
      const { error } = await supabase
        .from('vendor_bank_accounts')
        .delete()
        .eq('id', accountId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Bank account deleted');
      queryClient.invalidateQueries({ queryKey: ['vendor-bank-accounts'] });
      setBankDetails({
        bank_name: '',
        account_name: '',
        account_number: '',
        branch_code: '',
      });
    },
    onError: (error) => {
      toast.error('Failed to delete bank account: ' + error.message);
    },
  });

  const handlePasswordChange = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const currentPassword = formData.get('current_password') as string;
    const newPassword = formData.get('new_password') as string;
    const confirmPassword = formData.get('confirm_password') as string;

    if (!currentPassword) {
      toast.error('Please enter your current password');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    // Validate password strength
    const validation = validatePassword(newPassword);
    if (!validation.isValid) {
      toast.error(validation.error || 'Invalid password');
      return;
    }

    updatePasswordMutation.mutate({ currentPassword, newPassword });
    e.currentTarget.reset();
    setPasswordStrength({ score: 0, label: '', color: '' });
  };

  const handleNewPasswordChange = (value: string) => {
    setPasswordStrength(getPasswordStrength(value));
  };

  const handleSaveBankDetails = () => {
    if (!bankDetails.bank_name || !bankDetails.account_name || !bankDetails.account_number) {
      toast.error('Please fill in all required bank details');
      return;
    }
    saveBankDetailsMutation.mutate();
  };

  // Get masked account number for display
  const displayAccountNumber = useMemo(() => {
    if (showAccountNumber) return bankDetails.account_number;
    return maskAccountNumber(bankDetails.account_number);
  }, [bankDetails.account_number, showAccountNumber]);

  return (
    <VendorLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground">Manage your account settings and preferences</p>
        </div>

        <Tabs defaultValue="account" className="w-full">
          <TabsList className="grid w-full grid-cols-6 lg:w-auto lg:inline-flex">
            <TabsTrigger value="account" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">Account</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2">
              <Lock className="h-4 w-4" />
              <span className="hidden sm:inline">Security</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              <span className="hidden sm:inline">Notifications</span>
            </TabsTrigger>
            <TabsTrigger value="banking" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              <span className="hidden sm:inline">Banking</span>
            </TabsTrigger>
            <TabsTrigger value="disbursement" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline">Disbursement</span>
            </TabsTrigger>
            <TabsTrigger value="verification" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">Verification</span>
            </TabsTrigger>
          </TabsList>

          {/* Account Tab */}
          <TabsContent value="account" className="mt-6 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>Update your personal details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="full_name">Full Name</Label>
                    <Input
                      id="full_name"
                      value={profileData.full_name}
                      onChange={(e) => setProfileData(prev => ({ ...prev, full_name: e.target.value }))}
                      placeholder="Your full name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      value={profile?.email || ''}
                      disabled
                      className="bg-muted"
                    />
                    <p className="text-xs text-muted-foreground">Email cannot be changed</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      value={profileData.phone}
                      onChange={(e) => handlePhoneChange(e.target.value)}
                      placeholder="+62 xxx xxxx xxxx"
                      className={phoneError ? 'border-destructive' : ''}
                    />
                    {phoneError && (
                      <p className="text-xs text-destructive">{phoneError}</p>
                    )}
                    <p className="text-xs text-muted-foreground">Format: +62xxxxxxxxxx or 08xxxxxxxxxx</p>
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button 
                    onClick={() => updateProfileMutation.mutate()}
                    disabled={updateProfileMutation.isPending || !!phoneError}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {updateProfileMutation.isPending ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security" className="mt-6 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Change Password</CardTitle>
                <CardDescription>Update your account password</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handlePasswordChange} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="current_password">Current Password</Label>
                    <Input
                      id="current_password"
                      name="current_password"
                      type="password"
                      placeholder="••••••••"
                      required
                    />
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="new_password">New Password</Label>
                      <Input
                        id="new_password"
                        name="new_password"
                        type="password"
                        placeholder="••••••••"
                        required
                        onChange={(e) => handleNewPasswordChange(e.target.value)}
                      />
                      {passwordStrength.label && (
                        <div className="space-y-1">
                          <Progress value={passwordStrength.score} className="h-2" />
                          <p className={`text-xs ${
                            passwordStrength.label === 'Weak' ? 'text-destructive' :
                            passwordStrength.label === 'Medium' ? 'text-warning' : 'text-success'
                          }`}>
                            Password strength: {passwordStrength.label}
                          </p>
                        </div>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirm_password">Confirm New Password</Label>
                      <Input
                        id="confirm_password"
                        name="confirm_password"
                        type="password"
                        placeholder="••••••••"
                        required
                      />
                    </div>
                  </div>
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription className="text-xs">
                      Password must be at least 8 characters with uppercase, lowercase, and a number.
                    </AlertDescription>
                  </Alert>
                  <div className="flex justify-end">
                    <Button type="submit" disabled={updatePasswordMutation.isPending}>
                      {updatePasswordMutation.isPending ? 'Updating...' : 'Update Password'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="mt-6 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Email Notifications</CardTitle>
                <CardDescription>Configure email notification preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>New Job Assignments</Label>
                    <p className="text-sm text-muted-foreground">
                      Get notified when you're assigned to a new job
                    </p>
                  </div>
                  <Switch
                    checked={notifications.email_new_jobs}
                    onCheckedChange={(checked) => handleNotificationChange('email_new_jobs', checked)}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Job Updates</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive updates about your ongoing jobs
                    </p>
                  </div>
                  <Switch
                    checked={notifications.email_job_updates}
                    onCheckedChange={(checked) => handleNotificationChange('email_job_updates', checked)}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Payment Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Get notified about payments and payouts
                    </p>
                  </div>
                  <Switch
                    checked={notifications.email_payments}
                    onCheckedChange={(checked) => handleNotificationChange('email_payments', checked)}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Push Notifications</CardTitle>
                <CardDescription>Configure in-app notification preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>New Job Assignments</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive push notifications for new jobs
                    </p>
                  </div>
                  <Switch
                    checked={notifications.push_new_jobs}
                    onCheckedChange={(checked) => handleNotificationChange('push_new_jobs', checked)}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Job Updates</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive push notifications for job status changes
                    </p>
                  </div>
                  <Switch
                    checked={notifications.push_job_updates}
                    onCheckedChange={(checked) => handleNotificationChange('push_job_updates', checked)}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Banking Tab */}
          <TabsContent value="banking" className="mt-6 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Bank Account Details</CardTitle>
                <CardDescription>Your bank account for receiving payments</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="bank_name">Bank Name *</Label>
                    <Input
                      id="bank_name"
                      value={bankDetails.bank_name}
                      onChange={(e) => setBankDetails(prev => ({ ...prev, bank_name: e.target.value }))}
                      placeholder="e.g., BCA, Mandiri, BNI"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="account_name">Account Name *</Label>
                    <Input
                      id="account_name"
                      value={bankDetails.account_name}
                      onChange={(e) => setBankDetails(prev => ({ ...prev, account_name: e.target.value }))}
                      placeholder="Name on bank account"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="account_number">Account Number *</Label>
                    <div className="relative">
                      <Input
                        id="account_number"
                        value={showAccountNumber ? bankDetails.account_number : displayAccountNumber}
                        onChange={(e) => setBankDetails(prev => ({ ...prev, account_number: e.target.value }))}
                        placeholder="Your bank account number"
                        className="pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full"
                        onClick={() => setShowAccountNumber(!showAccountNumber)}
                      >
                        {showAccountNumber ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Account number is masked for security
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="branch_code">Branch Code (Optional)</Label>
                    <Input
                      id="branch_code"
                      value={bankDetails.branch_code}
                      onChange={(e) => setBankDetails(prev => ({ ...prev, branch_code: e.target.value }))}
                      placeholder="Bank branch code"
                    />
                  </div>
                </div>
                <div className="flex justify-between">
                  {bankAccounts.length > 0 && (
                    <Button 
                      variant="outline" 
                      className="text-destructive hover:text-destructive"
                      onClick={() => {
                        const primaryAccount = bankAccounts.find(a => a.is_primary);
                        if (primaryAccount) {
                          deleteBankAccountMutation.mutate(primaryAccount.id);
                        }
                      }}
                      disabled={deleteBankAccountMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      {deleteBankAccountMutation.isPending ? 'Deleting...' : 'Delete Account'}
                    </Button>
                  )}
                  <Button 
                    onClick={handleSaveBankDetails}
                    disabled={saveBankDetailsMutation.isPending}
                    className="ml-auto"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {saveBankDetailsMutation.isPending ? 'Saving...' : 'Save Bank Details'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Disbursement Tab */}
          <TabsContent value="disbursement" className="mt-6 space-y-6">
            {vendor && <DisbursementSettings vendorId={vendor.id} />}
          </TabsContent>

          {/* Verification Tab */}
          <TabsContent value="verification" className="mt-6 space-y-6">
            {vendor && <VerificationUpload vendorId={vendor.id} />}
          </TabsContent>
        </Tabs>
      </div>
    </VendorLayout>
  );
}