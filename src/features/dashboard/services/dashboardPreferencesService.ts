import { supabase } from '@/integrations/supabase/client';
import { DEFAULT_WIDGET_ORDER } from '../constants/widgetRegistry';

export interface DashboardPreferences {
  id: string;
  merchant_id: string;
  widget_order: string[];
  hidden_widgets: string[];
}

export async function fetchDashboardPreferences(merchantId: string): Promise<DashboardPreferences> {
  const { data, error } = await supabase
    .from('dashboard_preferences')
    .select('*')
    .eq('merchant_id', merchantId)
    .maybeSingle();

  if (error) throw error;

  if (!data) {
    return {
      id: '',
      merchant_id: merchantId,
      widget_order: DEFAULT_WIDGET_ORDER,
      hidden_widgets: [],
    };
  }

  return {
    id: data.id,
    merchant_id: data.merchant_id,
    widget_order: (data.widget_order as string[]) || DEFAULT_WIDGET_ORDER,
    hidden_widgets: (data.hidden_widgets as string[]) || [],
  };
}

export async function saveDashboardPreferences(
  merchantId: string,
  widgetOrder: string[],
  hiddenWidgets: string[]
): Promise<void> {
  const { error } = await supabase
    .from('dashboard_preferences')
    .upsert(
      {
        merchant_id: merchantId,
        widget_order: widgetOrder as any,
        hidden_widgets: hiddenWidgets as any,
      },
      { onConflict: 'merchant_id' }
    );

  if (error) throw error;
}
