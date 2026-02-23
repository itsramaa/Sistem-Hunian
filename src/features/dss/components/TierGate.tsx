import { Card, CardContent } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { Loader2, Lock, Sparkles } from "lucide-react";
import { useMerchantTier } from "@/features/dss/hooks/useMerchantTier";

interface TierGateProps {
  feature?: string;
  children: React.ReactNode;
}

export function TierGate({ feature = "ai_recommendations", children }: TierGateProps) {
  const { canAccess, tierName, isLoading } = useMerchantTier();

  if (isLoading) return <Loader2 className="h-4 w-4 animate-spin" />;

  if (!canAccess(feature)) {
    return (
      <Card className="rounded-2xl border-dashed border-border/60 bg-card/90 backdrop-blur-sm">
        <CardContent className="flex flex-col items-center justify-center py-14 text-center">
          <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-muted/80 to-muted/30 flex items-center justify-center mb-4">
            <Lock className="h-8 w-8 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground font-medium">Fitur ini membutuhkan langganan yang lebih tinggi.</p>
          <Badge variant="outline" className="mt-3 rounded-full">{tierName}</Badge>
          <div className="flex items-center gap-1.5 mt-3 text-xs text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Upgrade untuk mengakses fitur AI premium</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return <>{children}</>;
}
