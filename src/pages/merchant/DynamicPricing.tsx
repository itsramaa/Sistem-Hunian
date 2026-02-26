import { useAuth } from "@/features/auth/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useDynamicPricingRules } from "@/features/pricing/hooks/useDynamicPricing";
import { PricingRulesTable } from "@/features/pricing/components/PricingRulesTable";
import { CreatePricingRuleDialog } from "@/features/pricing/components/CreatePricingRuleDialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Loader2, TrendingUp } from "lucide-react";

function useMerchantId(userId?: string) {
  return useQuery({
    queryKey: ["merchant-id", userId],
    queryFn: async () => {
      const { data } = await supabase.from("merchants").select("id").eq("user_id", userId!).single();
      return data?.id as string;
    },
    enabled: !!userId,
  });
}

function useProperties(merchantId?: string) {
  return useQuery({
    queryKey: ["properties-simple", merchantId],
    queryFn: async () => {
      const { data } = await supabase.from("properties").select("id, name").eq("merchant_id", merchantId!);
      return (data || []) as { id: string; name: string }[];
    },
    enabled: !!merchantId,
  });
}

export default function DynamicPricing() {
  const { user } = useAuth();
  const { data: merchantId } = useMerchantId(user?.id);
  const { data: rules, isLoading } = useDynamicPricingRules(merchantId);
  const { data: properties = [] } = useProperties(merchantId);

  const activeRules = rules?.filter((r) => r.is_active).length || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-primary" />
            Aturan Harga Dinamis
          </h1>
          <p className="text-muted-foreground">Kelola aturan penyesuaian harga otomatis berdasarkan okupansi, musim, dan permintaan.</p>
        </div>
        {merchantId && <CreatePricingRuleDialog merchantId={merchantId} properties={properties} />}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total Aturan</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{rules?.length || 0}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Aturan Aktif</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold text-green-600">{activeRules}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Properti Tercakup</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{new Set(rules?.filter(r => r.property_id).map(r => r.property_id)).size || "Semua"}</p></CardContent>
        </Card>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>
      ) : (
        <PricingRulesTable rules={rules || []} properties={properties} />
      )}
    </div>
  );
}
