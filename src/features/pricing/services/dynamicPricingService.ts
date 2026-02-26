import { supabase } from "@/integrations/supabase/client";

export interface DynamicPricingRule {
  id: string;
  merchant_id: string;
  property_id: string | null;
  rule_name: string;
  rule_type: string;
  adjustment_type: string;
  adjustment_value: number;
  conditions: Record<string, any>;
  min_price: number | null;
  max_price: number | null;
  priority: number;
  is_active: boolean;
  valid_from: string | null;
  valid_until: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreatePricingRulePayload {
  merchant_id: string;
  property_id?: string | null;
  rule_name: string;
  rule_type: string;
  adjustment_type: string;
  adjustment_value: number;
  conditions?: Record<string, any>;
  min_price?: number | null;
  max_price?: number | null;
  priority?: number;
  is_active?: boolean;
  valid_from?: string | null;
  valid_until?: string | null;
  notes?: string | null;
}

export const RULE_TYPES = [
  { value: "occupancy", label: "Okupansi" },
  { value: "seasonal", label: "Musiman" },
  { value: "demand", label: "Permintaan" },
  { value: "duration", label: "Durasi Sewa" },
  { value: "loyalty", label: "Loyalitas" },
] as const;

export const ADJUSTMENT_TYPES = [
  { value: "percentage", label: "Persentase (%)" },
  { value: "fixed", label: "Nominal Tetap (IDR)" },
] as const;

export const dynamicPricingService = {
  async fetchRules(merchantId: string) {
    const { data, error } = await supabase
      .from("dynamic_pricing_rules")
      .select("*")
      .eq("merchant_id", merchantId)
      .order("priority", { ascending: true });
    if (error) throw error;
    return (data || []) as DynamicPricingRule[];
  },

  async createRule(payload: CreatePricingRulePayload) {
    const { data, error } = await supabase
      .from("dynamic_pricing_rules")
      .insert({
        ...payload,
        conditions: payload.conditions || {},
      })
      .select()
      .single();
    if (error) throw error;
    return data as DynamicPricingRule;
  },

  async updateRule(id: string, updates: Partial<CreatePricingRulePayload>) {
    const { error } = await supabase
      .from("dynamic_pricing_rules")
      .update(updates)
      .eq("id", id);
    if (error) throw error;
  },

  async deleteRule(id: string) {
    const { error } = await supabase
      .from("dynamic_pricing_rules")
      .delete()
      .eq("id", id);
    if (error) throw error;
  },

  async toggleRule(id: string, is_active: boolean) {
    const { error } = await supabase
      .from("dynamic_pricing_rules")
      .update({ is_active })
      .eq("id", id);
    if (error) throw error;
  },
};
