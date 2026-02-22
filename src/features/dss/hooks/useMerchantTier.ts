import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/features/auth/hooks/useAuth";

const FEATURE_TIER_MATRIX: Record<string, string> = {
  // Feature name -> minimum required tier
  ocr_basic: "starter",
  ocr_advanced: "professional",
  risk_score: "starter",
  risk_dashboard: "professional",
  ai_recommendations: "professional",
  revenue_forecast: "enterprise",
  custom_models: "enterprise",
  bulk_ocr: "enterprise",
  api_access: "professional",
  priority_support: "enterprise",
};

const TIER_ORDER = ["free", "starter", "professional", "enterprise"];

function hasTierAccess(currentTier: string, requiredTier: string): boolean {
  const currentIndex = TIER_ORDER.indexOf(currentTier.toLowerCase());
  const requiredIndex = TIER_ORDER.indexOf(requiredTier.toLowerCase());
  if (currentIndex === -1 || requiredIndex === -1) return false;
  return currentIndex >= requiredIndex;
}

export function useMerchantTier() {
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ["merchant-tier", user?.id],
    queryFn: async () => {
      // Get merchant for this user
      const { data: merchant } = await supabase
        .from("merchants")
        .select("id")
        .eq("user_id", user!.id)
        .maybeSingle();

      if (!merchant) return { tier: "free", tierName: "Free" };

      // Get subscription with tier info
      const { data: sub } = await supabase
        .from("merchant_subscriptions")
        .select("status, tier_id, subscription_tiers(name)")
        .eq("merchant_id", merchant.id)
        .maybeSingle();

      if (!sub || sub.status === "canceled") {
        return { tier: "free", tierName: "Free" };
      }

      const tierName = (sub.subscription_tiers as any)?.name || "free";
      return { tier: tierName.toLowerCase(), tierName };
    },
    enabled: !!user?.id,
  });

  const tier = data?.tier || "free";
  const tierName = data?.tierName || "Free";

  const canAccess = (feature: string): boolean => {
    const requiredTier = FEATURE_TIER_MATRIX[feature];
    if (!requiredTier) return true; // Unknown features are allowed
    return hasTierAccess(tier, requiredTier);
  };

  return { tier, tierName, canAccess, isLoading };
}
