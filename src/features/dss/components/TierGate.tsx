import { Card, CardContent } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { Loader2, Lock } from "lucide-react";
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
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-10 text-center">
          <Lock className="h-10 w-10 text-muted-foreground mb-3" />
          <p className="text-muted-foreground">This feature requires a higher subscription tier.</p>
          <Badge variant="outline" className="mt-2">{tierName}</Badge>
        </CardContent>
      </Card>
    );
  }

  return <>{children}</>;
}
