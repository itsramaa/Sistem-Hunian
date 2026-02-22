import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface RlsAlertSetting {
  id: string;
  merchant_id: string | null;
  denial_threshold: number;
  window_minutes: number;
  alert_cooldown_minutes: number;
  last_alert_at: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export function useRlsAlertSettings() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["rls-alert-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("rls_alert_settings")
        .select("*")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data as RlsAlertSetting[];
    },
  });

  const updateSetting = useMutation({
    mutationFn: async (params: {
      id: string;
      denial_threshold?: number;
      window_minutes?: number;
      alert_cooldown_minutes?: number;
      is_active?: boolean;
    }) => {
      const { id, ...updates } = params;
      const { error } = await supabase
        .from("rls_alert_settings")
        .update(updates)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rls-alert-settings"] });
      toast.success("Pengaturan alert berhasil diperbarui");
    },
    onError: () => {
      toast.error("Gagal memperbarui pengaturan alert");
    },
  });

  return { ...query, updateSetting };
}
