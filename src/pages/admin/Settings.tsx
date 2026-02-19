import { usePlatformSettings } from "@/features/platform-config/hooks/usePlatformSettings";
import { AdminLayout } from "@/shared/components/layouts/AdminLayout";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Switch } from "@/shared/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
import { Bell, Database, Globe, Loader2, RefreshCw, Save, Shield } from "lucide-react";
import { useEffect, useState } from "react";

const AdminSettings = () => {
  const { settings, isLoading, updateSetting, isUpdating } = usePlatformSettings();

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

  const handleSaveGeneral = () => {
    updateSetting({ key: 'general', value: platformSettingsForm });
  };

  const handleSaveNotifications = () => {
    updateSetting({ key: 'notifications', value: notificationSettingsForm });
  };

  const handleSaveSecurity = () => {
    updateSetting({ key: 'security', value: securitySettingsForm });
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Platform Settings</h1>
            <p className="text-muted-foreground">
              Manage global platform configuration and preferences
            </p>
          </div>
          <Button variant="outline" size="icon">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>

        <Tabs defaultValue="general" className="space-y-4">
          <TabsList>
            <TabsTrigger value="general" className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
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
            <TabsTrigger value="database" className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              Database
            </TabsTrigger>
          </TabsList>

          <TabsContent value="general">
            <Card>
              <CardHeader>
                <CardTitle>General Configuration</CardTitle>
                <CardDescription>
                  Basic platform settings and constraints.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="platformName">Platform Name</Label>
                  <Input 
                    id="platformName" 
                    value={platformSettingsForm.platformName} 
                    onChange={(e) => setPlatformSettingsForm({...platformSettingsForm, platformName: e.target.value})}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="supportEmail">Support Email</Label>
                  <Input 
                    id="supportEmail" 
                    type="email" 
                    value={platformSettingsForm.supportEmail}
                    onChange={(e) => setPlatformSettingsForm({...platformSettingsForm, supportEmail: e.target.value})}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="maxProperties">Max Properties Per Merchant (Default)</Label>
                  <Input 
                    id="maxProperties" 
                    type="number" 
                    value={platformSettingsForm.maxPropertiesPerMerchant}
                    onChange={(e) => setPlatformSettingsForm({...platformSettingsForm, maxPropertiesPerMerchant: parseInt(e.target.value)})}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="currency">Default Currency</Label>
                  <Input 
                    id="currency" 
                    value={platformSettingsForm.defaultCurrency}
                    onChange={(e) => setPlatformSettingsForm({...platformSettingsForm, defaultCurrency: e.target.value})}
                  />
                </div>
                <div className="flex justify-end pt-4">
                  <Button onClick={handleSaveGeneral} disabled={isUpdating}>
                    {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>
                  Configure system-wide notification settings.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between space-x-2">
                  <Label htmlFor="email-notif" className="flex flex-col space-y-1">
                    <span>Email Notifications</span>
                    <span className="font-normal text-xs text-muted-foreground">Enable system emails</span>
                  </Label>
                  <Switch 
                    id="email-notif" 
                    checked={notificationSettingsForm.emailNotifications}
                    onCheckedChange={(checked) => setNotificationSettingsForm({...notificationSettingsForm, emailNotifications: checked})}
                  />
                </div>
                <div className="flex items-center justify-between space-x-2">
                  <Label htmlFor="payment-reminders" className="flex flex-col space-y-1">
                    <span>Payment Reminders</span>
                    <span className="font-normal text-xs text-muted-foreground">Auto-send payment reminders</span>
                  </Label>
                  <Switch 
                    id="payment-reminders"
                    checked={notificationSettingsForm.paymentReminders}
                    onCheckedChange={(checked) => setNotificationSettingsForm({...notificationSettingsForm, paymentReminders: checked})}
                  />
                </div>
                <div className="flex items-center justify-between space-x-2">
                  <Label htmlFor="maintenance-alerts" className="flex flex-col space-y-1">
                    <span>Maintenance Alerts</span>
                    <span className="font-normal text-xs text-muted-foreground">Notify admins on urgent requests</span>
                  </Label>
                  <Switch 
                    id="maintenance-alerts"
                    checked={notificationSettingsForm.maintenanceAlerts}
                    onCheckedChange={(checked) => setNotificationSettingsForm({...notificationSettingsForm, maintenanceAlerts: checked})}
                  />
                </div>
                <div className="flex justify-end pt-4">
                  <Button onClick={handleSaveNotifications} disabled={isUpdating}>
                    {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security">
            <Card>
              <CardHeader>
                <CardTitle>Security Settings</CardTitle>
                <CardDescription>
                  Manage platform security protocols.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between space-x-2">
                  <Label htmlFor="2fa" className="flex flex-col space-y-1">
                    <span>Force 2FA for Admins</span>
                    <span className="font-normal text-xs text-muted-foreground">Require two-factor authentication</span>
                  </Label>
                  <Switch 
                    id="2fa"
                    checked={securitySettingsForm.twoFactorAuth}
                    onCheckedChange={(checked) => setSecuritySettingsForm({...securitySettingsForm, twoFactorAuth: checked})}
                  />
                </div>
                <div className="flex items-center justify-between space-x-2">
                  <Label htmlFor="session-timeout" className="flex flex-col space-y-1">
                    <span>Strict Session Timeout</span>
                    <span className="font-normal text-xs text-muted-foreground">Logout after 30 mins inactivity</span>
                  </Label>
                  <Switch 
                    id="session-timeout"
                    checked={securitySettingsForm.sessionTimeout}
                    onCheckedChange={(checked) => setSecuritySettingsForm({...securitySettingsForm, sessionTimeout: checked})}
                  />
                </div>
                <div className="flex items-center justify-between space-x-2">
                  <Label htmlFor="audit-logs" className="flex flex-col space-y-1">
                    <span>Detailed Audit Logging</span>
                    <span className="font-normal text-xs text-muted-foreground">Log all data modifications</span>
                  </Label>
                  <Switch 
                    id="audit-logs"
                    checked={securitySettingsForm.auditLogging}
                    onCheckedChange={(checked) => setSecuritySettingsForm({...securitySettingsForm, auditLogging: checked})}
                  />
                </div>
                <div className="flex justify-end pt-4">
                  <Button onClick={handleSaveSecurity} disabled={isUpdating}>
                    {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="database">
             <Card>
              <CardHeader>
                <CardTitle>Database Management</CardTitle>
                <CardDescription>
                  System maintenance and backups.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
                  <div>
                    <p className="font-medium">Cache Status</p>
                    <p className="text-sm text-muted-foreground">Redis cache is healthy</p>
                  </div>
                  <Badge variant="outline" className="bg-success/10 text-success border-success/20">Operational</Badge>
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
