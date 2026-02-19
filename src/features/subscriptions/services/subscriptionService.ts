import { supabase } from "@/lib/integrations/supabase/client";
import { createAuditLog } from "@/shared/utils/auditLog";
import { SubscriptionTier, SubscriptionTierInput } from "../types/subscription-tier";
import {
  CancellationFeedback,
  PendingSubscriptionChange,
  SubscriptionInvoice,
  SubscriptionMerchant
} from "../types/subscriptions";

export const subscriptionService = {
  fetchTiers: async (onlyActive = false): Promise<SubscriptionTier[]> => {
    let query = supabase
      .from("subscription_tiers")
      .select("*")
      .order("sort_order", { ascending: true });
    
    if (onlyActive) {
      query = query.eq("is_active", true);
    }

    const { data, error } = await query;
    if (error) throw new Error(`Failed to load tiers: ${error.message}`);
    return data as SubscriptionTier[];
  },

  fetchMerchants: async (): Promise<SubscriptionMerchant[]> => {
    const { data, error } = await supabase
      .from('merchants')
      .select(`
        *,
        merchant_subscriptions (
          id,
          status,
          tier_id,
          current_period_end,
          trial_ends_at,
          subscription_tiers (
            name,
            display_name
          )
        )
      `)
      .order('created_at', { ascending: false });
    
    if (error) throw new Error(`Failed to load merchants: ${error.message}`);
    return data as any as SubscriptionMerchant[];
  },

  fetchInvoices: async (): Promise<SubscriptionInvoice[]> => {
    const { data, error } = await supabase
      .from('subscription_invoices')
      .select(`
        *,
        merchants (business_name),
        subscription_tiers (name, display_name)
      `)
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) throw new Error(`Failed to load invoices: ${error.message}`);
    return data as any as SubscriptionInvoice[];
  },

  fetchCancellationFeedback: async (): Promise<CancellationFeedback[]> => {
    const { data, error } = await supabase
      .from('cancellation_feedback')
      .select(`
        *,
        merchants (business_name)
      `)
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) throw new Error(`Failed to load cancellation feedback: ${error.message}`);
    return data as any as CancellationFeedback[];
  },

  fetchPendingChanges: async (): Promise<PendingSubscriptionChange[]> => {
    const { data, error } = await supabase
      .from('pending_subscription_changes')
      .select(`
        *,
        merchants (business_name),
        current_tier:subscription_tiers!pending_subscription_changes_current_tier_id_fkey (name, display_name),
        pending_tier:subscription_tiers!pending_subscription_changes_pending_tier_id_fkey (name, display_name)
      `)
      .eq('status', 'pending')
      .order('effective_date', { ascending: true });

    if (error) throw new Error(`Failed to load pending changes: ${error.message}`);
    return data as any as PendingSubscriptionChange[];
  },

  fetchStats: async () => {
    const { data: tiers } = await supabase
      .from("subscription_tiers")
      .select("id, name");

    const stats: Record<string, number> = {
      enterprise: 0,
      pro: 0,
      basic: 0,
      free: 0,
      total: 0
    };

    if (tiers) {
      for (const tier of tiers) {
        const { count } = await supabase
          .from("merchant_subscriptions")
          .select("*", { count: "exact", head: true })
          .eq("tier_id", tier.id)
          .in("status", ["active", "trialing"]);
        
        const key = tier.name.toLowerCase();
        stats[key] = count || 0;
      }
    }
    
    const { count: totalMerchants } = await supabase
      .from("merchants")
      .select("*", { count: "exact", head: true });
      
    stats.total = totalMerchants || 0;
    
    const paidCount = Object.entries(stats)
      .filter(([key]) => key !== 'free' && key !== 'total')
      .reduce((acc, [_, val]) => acc + val, 0);
      
    stats.free = Math.max(0, (stats.total || 0) - paidCount);
    
    return stats;
  },

  updateSubscription: async (merchantId: string, tierId: string, tierName: string): Promise<void> => {
    // First check if merchant has a subscription record
    const { data: existingSub } = await supabase
      .from('merchant_subscriptions')
      .select('id')
      .eq('merchant_id', merchantId)
      .maybeSingle();

    if (existingSub) {
      // Update existing subscription
      const { error } = await supabase
        .from('merchant_subscriptions')
        .update({ 
          tier_id: tierId,
          updated_at: new Date().toISOString()
        })
        .eq('merchant_id', merchantId);
      if (error) throw error;
    } else {
      // Create new subscription
      const now = new Date();
      const periodEnd = new Date(now);
      periodEnd.setMonth(periodEnd.getMonth() + 1);
      
      const { error } = await supabase
        .from('merchant_subscriptions')
        .insert({
          merchant_id: merchantId,
          tier_id: tierId,
          status: 'active',
          current_period_start: now.toISOString(),
          current_period_end: periodEnd.toISOString(),
        });
      if (error) throw error;
    }

    // Also update the legacy field for compatibility
    await supabase
      .from('merchants')
      .update({ subscription_tier: tierName })
      .eq('id', merchantId);

    await createAuditLog({
      action: 'update',
      entityType: 'merchant_subscription',
      entityId: merchantId,
      newData: { tierId, tierName }
    });
  },

  checkActiveSubscribers: async (tierId: string): Promise<number> => {
    const { count, error } = await supabase
      .from("merchant_subscriptions")
      .select("id", { count: 'exact' })
      .eq("tier_id", tierId)
      .in("status", ["active", "trialing"]);
    if (error) throw error;
    return count || 0;
  },

  createTier: async (tierData: SubscriptionTierInput): Promise<SubscriptionTier> => {
    // Check for duplicate name
    const { data: existing } = await supabase
      .from("subscription_tiers")
      .select("id")
      .eq("name", tierData.name)
      .maybeSingle();

    if (existing) {
      throw new Error("A tier with this name already exists");
    }

    // Get max sort order if not provided
    if (tierData.sort_order === undefined) {
      const { data: tiers } = await supabase
        .from("subscription_tiers")
        .select("sort_order")
        .order("sort_order", { ascending: false })
        .limit(1);
      
      const maxSortOrder = tiers?.[0]?.sort_order || 0;
      tierData.sort_order = maxSortOrder + 1;
    }

    const { data, error } = await supabase
      .from("subscription_tiers")
      .insert(tierData)
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        throw new Error("A tier with this name already exists");
      }
      throw new Error(`Failed to create tier: ${error.message}`);
    }
    return data as SubscriptionTier;
  },

  updateTier: async (id: string, tierData: Partial<SubscriptionTierInput>): Promise<void> => {
    // Check for duplicate name if name is being updated
    if (tierData.name) {
      const { data: existing } = await supabase
        .from("subscription_tiers")
        .select("id")
        .eq("name", tierData.name)
        .neq("id", id)
        .maybeSingle();

      if (existing) {
        throw new Error("A tier with this name already exists");
      }
    }

    const { error } = await supabase
      .from("subscription_tiers")
      .update(tierData)
      .eq("id", id);

    if (error) {
      if (error.code === '23505') {
        throw new Error("A tier with this name already exists");
      }
      throw new Error(`Failed to update tier: ${error.message}`);
    }
  },

  deleteTier: async (id: string): Promise<void> => {
    // Check for active subscribers
    const activeCount = await subscriptionService.checkActiveSubscribers(id);
    if (activeCount > 0) {
      throw new Error(`Cannot delete tier with ${activeCount} active subscriber(s). Please migrate them to another tier first.`);
    }

    const { error } = await supabase
      .from("subscription_tiers")
      .delete()
      .eq("id", id);

    if (error) throw new Error(`Failed to delete tier: ${error.message}`);

    // Reorder remaining tiers
    // Note: This might be heavy if there are many tiers, but typically there are few.
    const { data: remainingTiers } = await supabase
      .from("subscription_tiers")
      .select("id, sort_order")
      .order("sort_order", { ascending: true });

    if (remainingTiers) {
      for (let i = 0; i < remainingTiers.length; i++) {
        if (remainingTiers[i].sort_order !== i + 1) {
          await supabase
            .from("subscription_tiers")
            .update({ sort_order: i + 1 })
            .eq("id", remainingTiers[i].id);
        }
      }
    }
  }
};
