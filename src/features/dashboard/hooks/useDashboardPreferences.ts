import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchDashboardPreferences, saveDashboardPreferences, DashboardPreferences } from '../services/dashboardPreferencesService';
import { toast } from 'sonner';

export function useDashboardPreferences(merchantId: string | undefined) {
  return useQuery({
    queryKey: ['dashboard-preferences', merchantId],
    queryFn: () => fetchDashboardPreferences(merchantId!),
    enabled: !!merchantId,
  });
}

export function useSaveDashboardPreferences() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: { merchantId: string; widgetOrder: string[]; hiddenWidgets: string[] }) =>
      saveDashboardPreferences(params.merchantId, params.widgetOrder, params.hiddenWidgets),
    onMutate: async (params) => {
      await queryClient.cancelQueries({ queryKey: ['dashboard-preferences', params.merchantId] });
      const previous = queryClient.getQueryData<DashboardPreferences>(['dashboard-preferences', params.merchantId]);
      queryClient.setQueryData(['dashboard-preferences', params.merchantId], {
        ...previous,
        widget_order: params.widgetOrder,
        hidden_widgets: params.hiddenWidgets,
      });
      return { previous };
    },
    onError: (_err, params, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['dashboard-preferences', params.merchantId], context.previous);
      }
      toast.error('Gagal menyimpan preferensi dashboard');
    },
    onSuccess: (_data, params) => {
      queryClient.invalidateQueries({ queryKey: ['dashboard-preferences', params.merchantId] });
      toast.success('Preferensi dashboard disimpan');
    },
  });
}
