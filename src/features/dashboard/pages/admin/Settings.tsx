import { GeneralSettingsForm } from "@/features/platform-config/components/settings/GeneralSettingsForm";
import { NotificationSettingsForm } from "@/features/platform-config/components/settings/NotificationSettingsForm";
import { SecuritySettingsForm } from "@/features/platform-config/components/settings/SecuritySettingsForm";
import { usePlatformSettings } from "@/features/platform-config/hooks/usePlatformSettings";
import { GeneralSettings, NotificationSettings, SecuritySettings } from "@/features/platform-config/types";
import { AdminLayout } from "@/shared/components/layouts/AdminLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
import { Bell, Globe, Loader2, Shield } from "lucide-react";
import { toast } from "sonner";

const AdminSettings = () => {
  const { settings, isLoading, updateSetting, isUpdating } = usePlatformSettings();

  const generalSettings: GeneralSettings = settings?.find(s => s.setting_key === 'general')?.setting_value as GeneralSettings || {
    platformName: 'SiHuni',
    supportEmail: 'support@sihuni.com',
    maxPropertiesPerMerchant: 100,
    defaultCurrency: 'IDR',
  };

  const notificationSettings: NotificationSettings = settings?.find(s => s.setting_key === 'notifications')?.setting_value as NotificationSettings || {
    emailNotifications: true,
    paymentReminders: true,
    maintenanceAlerts: true,
    weeklyReports: true,
    newMerchantAlerts: true,
  };

  const securitySettings: SecuritySettings = settings?.find(s => s.setting_key === 'security')?.setting_value as SecuritySettings || {
    twoFactorAuth: true,
    sessionTimeout: true,
    ipWhitelist: false,
    auditLogging: true,
  };

  const handleSaveGeneral = (values: GeneralSettings) => {
    updateSetting(
      { key: 'general', value: values },
      {
        onSuccess: () => toast.success("Pengaturan umum berhasil diperbarui"),
        onError: () => toast.error("Gagal memperbarui pengaturan umum")
      }
    );
  };

  const handleSaveNotifications = (values: NotificationSettings) => {
    updateSetting(
      { key: 'notifications', value: values },
      {
        onSuccess: () => toast.success("Pengaturan notifikasi berhasil diperbarui"),
        onError: () => toast.error("Gagal memperbarui pengaturan notifikasi")
      }
    );
  };

  const handleSaveSecurity = (values: SecuritySettings) => {
    updateSetting(
      { key: 'security', value: values },
      {
        onSuccess: () => toast.success("Pengaturan keamanan berhasil diperbarui"),
        onError: () => toast.error("Gagal memperbarui pengaturan keamanan")
      }
    );
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
    <AdminLayout
      title="Pengaturan Platform"
      description="Kelola konfigurasi dan preferensi platform global."
    >
      <div className="flex flex-col md:flex-row gap-8">
        <Tabs defaultValue="general" className="w-full flex flex-col md:flex-row gap-8">
          <aside className="md:w-64 flex-shrink-0">
             <TabsList className="flex md:flex-col h-auto w-full justify-start gap-2 bg-transparent p-0">
              <TabsTrigger 
                value="general" 
                className="w-full justify-start gap-3 px-4 py-3 data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-md transition-all text-muted-foreground hover:text-foreground hover:bg-muted/50"
              >
                <Globe className="h-4 w-4" />
                <div className="flex flex-col items-start text-left">
                  <span className="font-medium">Umum</span>
                  <span className="text-xs font-normal opacity-70 hidden md:block">Detail dasar platform</span>
                </div>
              </TabsTrigger>
              <TabsTrigger 
                value="notifications" 
                className="w-full justify-start gap-3 px-4 py-3 data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-md transition-all text-muted-foreground hover:text-foreground hover:bg-muted/50"
              >
                <Bell className="h-4 w-4" />
                <div className="flex flex-col items-start text-left">
                  <span className="font-medium">Notifikasi</span>
                  <span className="text-xs font-normal opacity-70 hidden md:block">Email dan peringatan</span>
                </div>
              </TabsTrigger>
              <TabsTrigger 
                value="security" 
                className="w-full justify-start gap-3 px-4 py-3 data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-md transition-all text-muted-foreground hover:text-foreground hover:bg-muted/50"
              >
                <Shield className="h-4 w-4" />
                <div className="flex flex-col items-start text-left">
                  <span className="font-medium">Keamanan</span>
                  <span className="text-xs font-normal opacity-70 hidden md:block">Kontrol akses & log</span>
                </div>
              </TabsTrigger>
            </TabsList>
          </aside>

          <div className="flex-1 space-y-6">
            <TabsContent value="general" className="mt-0">
              <GeneralSettingsForm 
                initialValues={generalSettings} 
                onSave={handleSaveGeneral} 
                isUpdating={isUpdating} 
              />
            </TabsContent>

            <TabsContent value="notifications" className="mt-0">
              <NotificationSettingsForm 
                initialValues={notificationSettings} 
                onSave={handleSaveNotifications} 
                isUpdating={isUpdating} 
              />
            </TabsContent>

            <TabsContent value="security" className="mt-0">
              <SecuritySettingsForm 
                initialValues={securitySettings} 
                onSave={handleSaveSecurity} 
                isUpdating={isUpdating} 
              />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default AdminSettings;
