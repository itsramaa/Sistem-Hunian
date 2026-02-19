import { logConfigChange } from "@/shared/utils/auditLog";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { platformSettingsService } from "../services/platformSettingsService";

export function usePlatformSettings() {
  const queryClient = useQueryClient();

  const { data: settings, isLoading, error } = useQuery({
    queryKey: ['platform-settings'],
    queryFn: platformSettingsService.fetchSettings,
  });

  const saveMutation = useMutation({
    mutationFn: async ({ key, value, description }: { key: string; value: Record<string, any>; description?: string }) => {
      const oldValue = settings?.find(s => s.setting_key === key)?.setting_value || {};
      await platformSettingsService.upsertSetting(key, value, description);
      await logConfigChange(key, oldValue, value);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platform-settings'] });
      toast.success('Configuration saved successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to save settings: ${error.message}`);
    },
  });

  return {
    settings,
    isLoading,
    error,
    updateSetting: saveMutation.mutate,
    isUpdating: saveMutation.isPending,
  };
}
