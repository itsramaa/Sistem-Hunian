import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/layouts/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Settings as SettingsIcon, Shield, Bell, Globe, Database, Save, RefreshCw, Loader2 } from "lucide-react";

type PlatformSetting = {
  id: string;
  setting_key: string;
  setting_value: Record<string, any>;
  description: string | null;
};

const AdminSettings = () => {
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: ['platform-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('platform_settings')
        .select('*');
      if (error) throw error;
      return data as PlatformSetting[];
    },
  });

  const generalSettings = settings?.find(s => s.setting_key === 'general')?.setting_value || {
    platformName: 'SiHuni',
    supportEmail: 'support@sihuni.com',
    maxPropertiesPerMerchant: 100,
    defaultCurrency: 'IDR',
  };

  const notificationSettings = settings?.find(s => s.setting_key === 'notifications')?.setting_value || {
    emailNotifications: true,
    paymentReminders: true,
    maintenanceAlerts: true,
    weeklyReports: true,
    newMerchantAlerts: true,
  };

  const securitySettings = settings?.find(s => s.setting_key === 'security')?.setting_value || {
    twoFactorAuth: true,
    sessionTimeout: true,
    ipWhitelist: false,
    auditLogging: true,
  };

  const [platformSettingsForm, setPlatformSettingsForm] = useState(generalSettings);
  const [notificationSettingsForm, setNotificationSettingsForm] = useState(notificationSettings);
  const [securitySettingsForm, setSecuritySettingsForm] = useState(securitySettings);

  // Update form when data loads
  useEffect(() => {
    if (settings) {
      const general = settings.find(s => s.setting_key === 'general')?.setting_value;
      const notifications = settings.find(s => s.setting_key === 'notifications')?.setting_value;
      const security = settings.find(s => s.setting_key === 'security')?.setting_value;
      
      if (general) setPlatformSettingsForm(general);
      if (notifications) setNotificationSettingsForm(notifications);
      if (security) setSecuritySettingsForm(security);
    }
  }, [settings]);

  const saveMutation = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: Record<string, any> }) => {
      const { error } = await supabase
        .from('platform_settings')
        .update({ setting_value: value })
        .eq('setting_key', key);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platform-settings'] });
      toast.success('Settings saved successfully');
    },
    onError: () => {
      toast.error('Failed to save settings');
    },
  });

  const handleSaveGeneral = () => {
    saveMutation.mutate({ key: 'general', value: platformSettingsForm });
  };

  const handleSaveNotifications = () => {
    saveMutation.mutate({ key: 'notifications', value: notificationSettingsForm });
  };

  const handleSaveSecurity = () => {
    saveMutation.mutate({ key: 'security', value: securitySettingsForm });
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground">Configure platform settings and preferences</p>
        </div>

        <Tabs defaultValue="general" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="general" className="flex items-center gap-2">
              <SettingsIcon className="h-4 w-4" />
              General
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Security
            </TabsTrigger>
            <TabsTrigger value="system" className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              System
            </TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5 text-primary" />
                  Platform Configuration
                </CardTitle>
                <CardDescription>General platform settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Platform Name</Label>
                    <Input
                      value={platformSettingsForm.platformName || ''}
                      onChange={(e) => setPlatformSettingsForm({ ...platformSettingsForm, platformName: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Support Email</Label>
                    <Input
                      type="email"
                      value={platformSettingsForm.supportEmail || ''}
                      onChange={(e) => setPlatformSettingsForm({ ...platformSettingsForm, supportEmail: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Max Properties per Merchant</Label>
                    <Input
                      type="number"
                      value={platformSettingsForm.maxPropertiesPerMerchant || 100}
                      onChange={(e) => setPlatformSettingsForm({ ...platformSettingsForm, maxPropertiesPerMerchant: parseInt(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Default Currency</Label>
                    <Input
                      value={platformSettingsForm.defaultCurrency || 'IDR'}
                      onChange={(e) => setPlatformSettingsForm({ ...platformSettingsForm, defaultCurrency: e.target.value })}
                    />
                  </div>
                </div>
                <Button onClick={handleSaveGeneral} disabled={saveMutation.isPending}>
                  {saveMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                  Save Changes
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5 text-primary" />
                  Notification Preferences
                </CardTitle>
                <CardDescription>Configure admin notification settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { key: 'emailNotifications', label: 'Email Notifications', description: 'Receive notifications via email' },
                  { key: 'paymentReminders', label: 'Payment Alerts', description: 'Notifications for overdue payments' },
                  { key: 'maintenanceAlerts', label: 'Maintenance Alerts', description: 'Critical maintenance request notifications' },
                  { key: 'weeklyReports', label: 'Weekly Reports', description: 'Receive weekly platform analytics' },
                  { key: 'newMerchantAlerts', label: 'New Merchant Alerts', description: 'Notifications for new merchant registrations' },
                ].map((item) => (
                  <div key={item.key} className="flex items-center justify-between p-4 rounded-lg border">
                    <div>
                      <p className="font-medium">{item.label}</p>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    </div>
                    <Switch
                      checked={notificationSettingsForm[item.key] ?? true}
                      onCheckedChange={(checked) => 
                        setNotificationSettingsForm({ ...notificationSettingsForm, [item.key]: checked })
                      }
                    />
                  </div>
                ))}
                <Button onClick={handleSaveNotifications} disabled={saveMutation.isPending}>
                  {saveMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                  Save Changes
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  Security Settings
                </CardTitle>
                <CardDescription>Configure security and access controls</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  {[
                    { key: 'twoFactorAuth', label: 'Two-Factor Authentication', description: 'Require 2FA for admin accounts' },
                    { key: 'sessionTimeout', label: 'Session Timeout', description: 'Automatically log out after inactivity' },
                    { key: 'ipWhitelist', label: 'IP Whitelist', description: 'Restrict admin access to specific IPs' },
                    { key: 'auditLogging', label: 'Audit Logging', description: 'Log all admin actions' },
                  ].map((item) => (
                    <div key={item.key} className="flex items-center justify-between p-4 rounded-lg border">
                      <div>
                        <p className="font-medium">{item.label}</p>
                        <p className="text-sm text-muted-foreground">{item.description}</p>
                      </div>
                      <Switch
                        checked={securitySettingsForm[item.key] ?? false}
                        onCheckedChange={(checked) => 
                          setSecuritySettingsForm({ ...securitySettingsForm, [item.key]: checked })
                        }
                      />
                    </div>
                  ))}
                </div>
                <Button onClick={handleSaveSecurity} disabled={saveMutation.isPending}>
                  {saveMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                  Save Changes
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="system" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5 text-primary" />
                  System Information
                </CardTitle>
                <CardDescription>Platform system status and tools</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg bg-muted/50">
                    <p className="text-sm text-muted-foreground">Platform Version</p>
                    <p className="font-semibold">1.0.0</p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/50">
                    <p className="text-sm text-muted-foreground">Database Status</p>
                    <p className="font-semibold text-success">Connected</p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/50">
                    <p className="text-sm text-muted-foreground">Last Backup</p>
                    <p className="font-semibold">Today, 02:00 AM</p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/50">
                    <p className="text-sm text-muted-foreground">Uptime</p>
                    <p className="font-semibold">99.9%</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button variant="outline">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Clear Cache
                  </Button>
                  <Button variant="outline">
                    <Database className="h-4 w-4 mr-2" />
                    Run Backup
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default AdminSettings;
