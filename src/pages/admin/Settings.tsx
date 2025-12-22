import { useState } from "react";
import { AdminLayout } from "@/components/layouts/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Settings as SettingsIcon, Shield, Bell, Globe, Database, Save, RefreshCw } from "lucide-react";

const AdminSettings = () => {
  const [platformSettings, setPlatformSettings] = useState({
    platformName: 'SiHuni',
    supportEmail: 'support@sihuni.com',
    maxPropertiesPerMerchant: 100,
    defaultCurrency: 'ZAR',
  });

  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    paymentReminders: true,
    maintenanceAlerts: true,
    weeklyReports: true,
    newMerchantAlerts: true,
  });

  const handleSave = () => {
    toast.success('Settings saved successfully');
  };

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
                      value={platformSettings.platformName}
                      onChange={(e) => setPlatformSettings({ ...platformSettings, platformName: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Support Email</Label>
                    <Input
                      type="email"
                      value={platformSettings.supportEmail}
                      onChange={(e) => setPlatformSettings({ ...platformSettings, supportEmail: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Max Properties per Merchant</Label>
                    <Input
                      type="number"
                      value={platformSettings.maxPropertiesPerMerchant}
                      onChange={(e) => setPlatformSettings({ ...platformSettings, maxPropertiesPerMerchant: parseInt(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Default Currency</Label>
                    <Input
                      value={platformSettings.defaultCurrency}
                      onChange={(e) => setPlatformSettings({ ...platformSettings, defaultCurrency: e.target.value })}
                    />
                  </div>
                </div>
                <Button onClick={handleSave}>
                  <Save className="h-4 w-4 mr-2" />
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
                      checked={notificationSettings[item.key as keyof typeof notificationSettings]}
                      onCheckedChange={(checked) => 
                        setNotificationSettings({ ...notificationSettings, [item.key]: checked })
                      }
                    />
                  </div>
                ))}
                <Button onClick={handleSave}>
                  <Save className="h-4 w-4 mr-2" />
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
                  <div className="flex items-center justify-between p-4 rounded-lg border">
                    <div>
                      <p className="font-medium">Two-Factor Authentication</p>
                      <p className="text-sm text-muted-foreground">Require 2FA for admin accounts</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-lg border">
                    <div>
                      <p className="font-medium">Session Timeout</p>
                      <p className="text-sm text-muted-foreground">Automatically log out after inactivity</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-lg border">
                    <div>
                      <p className="font-medium">IP Whitelist</p>
                      <p className="text-sm text-muted-foreground">Restrict admin access to specific IPs</p>
                    </div>
                    <Switch />
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-lg border">
                    <div>
                      <p className="font-medium">Audit Logging</p>
                      <p className="text-sm text-muted-foreground">Log all admin actions</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </div>
                <Button onClick={handleSave}>
                  <Save className="h-4 w-4 mr-2" />
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
