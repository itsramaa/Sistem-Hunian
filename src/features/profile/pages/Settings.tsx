import { MerchantNotificationSettings as NotificationSettingsComponent } from "@/features/notifications/components/MerchantNotificationSettings";
import { BankAccountManager } from "@/features/payments/components/BankAccountManager";
import { DisbursementScheduleSettings } from "@/features/payments/components/DisbursementScheduleSettings";

import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { PageHeader } from "@/shared/components/ui/PageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
import { Bell, CreditCard, Settings as SettingsIcon } from "lucide-react";
import { useSearchParams } from "react-router-dom";

const Settings = () => {
  const [searchParams] = useSearchParams();
  const defaultTab = searchParams.get("tab") || "notifications";

  return (
    <div className="space-y-6">
      <PageHeader icon={SettingsIcon} title="Pengaturan" description="Konfigurasi preferensi akun Anda" />
      <Tabs defaultValue={defaultTab} className="space-y-6">
        <TabsList className="inline-flex rounded-full bg-card/80 backdrop-blur-sm border border-border/40 p-1">
          <TabsTrigger value="notifications" className="rounded-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex items-center gap-2">
            <Bell className="h-4 w-4" />
            <span className="hidden sm:inline">Notifikasi</span>
          </TabsTrigger>
          <TabsTrigger value="banking" className="rounded-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            <span className="hidden sm:inline">Perbankan</span>
          </TabsTrigger>
          <TabsTrigger value="disbursement" className="rounded-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            <span className="hidden sm:inline">Pencairan</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="notifications" className="space-y-6">
          <NotificationSettingsComponent />
        </TabsContent>

        <TabsContent value="banking" className="space-y-6">
          <BankAccountManager />
        </TabsContent>

        <TabsContent value="disbursement" className="space-y-6">
          <DisbursementScheduleSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;
