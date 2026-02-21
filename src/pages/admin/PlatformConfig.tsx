import { useAdminGuard } from "@/features/auth/hooks/useAdminGuard";
import { FeatureToggles } from "@/features/platform-config/components/FeatureToggles";
import { FeesConfig } from "@/features/platform-config/components/FeesConfig";
import { usePlatformSettings } from "@/features/platform-config/hooks/usePlatformSettings";
import { AdminLayout } from "@/shared/components/layouts/AdminLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
import { DollarSign, Loader2, Settings } from "lucide-react";

const PlatformConfig = () => {
  const { isLoading: guardLoading } = useAdminGuard();
  const { isLoading } = usePlatformSettings();
  
  if (guardLoading || isLoading) {
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
      title="Platform Configuration"
      description="Manage platform fees, commissions, and global settings"
    >
      <div className="space-y-6">
        <Tabs defaultValue="fees" className="space-y-4">
          <TabsList>
            <TabsTrigger value="fees" className="gap-2">
              <DollarSign className="h-4 w-4" />
              Fees & Commissions
            </TabsTrigger>
            <TabsTrigger value="features" className="gap-2">
              <Settings className="h-4 w-4" />
              Feature Toggles
            </TabsTrigger>
          </TabsList>

          <TabsContent value="fees">
            <FeesConfig />
          </TabsContent>

          <TabsContent value="features">
            <FeatureToggles />
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default PlatformConfig;
