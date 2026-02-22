import { ReactNode } from "react";
import { cn } from "@/shared/utils/utils";
import { Lock } from "lucide-react";
import { Button } from "@/shared/components/ui/button";

interface TierGatedFeatureProps {
  requiredTier: "starter" | "professional" | "enterprise";
  currentTier: string;
  children: ReactNode;
  featureName?: string;
  onUpgrade?: () => void;
  className?: string;
}

const TIER_ORDER = ["free", "starter", "professional", "enterprise"];

function hasTierAccess(currentTier: string, requiredTier: string): boolean {
  const currentIndex = TIER_ORDER.indexOf(currentTier.toLowerCase());
  const requiredIndex = TIER_ORDER.indexOf(requiredTier.toLowerCase());
  if (currentIndex === -1 || requiredIndex === -1) return false;
  return currentIndex >= requiredIndex;
}

export function TierGatedFeature({ requiredTier, currentTier, children, featureName, onUpgrade, className }: TierGatedFeatureProps) {
  const hasAccess = hasTierAccess(currentTier, requiredTier);

  if (hasAccess) {
    return <>{children}</>;
  }

  return (
    <div className={cn("relative", className)}>
      <div className="pointer-events-none select-none opacity-40 blur-[1px]" aria-hidden="true">
        {children}
      </div>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-background/60 backdrop-blur-sm rounded-lg border border-border">
        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
          <Lock className="h-5 w-5 text-muted-foreground" />
        </div>
        <div className="text-center px-4">
          <p className="text-sm font-semibold text-foreground">
            {featureName || "Fitur ini"} memerlukan paket {requiredTier}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Upgrade untuk mengakses fitur ini
          </p>
        </div>
        {onUpgrade && (
          <Button size="sm" onClick={onUpgrade}>
            Upgrade Sekarang
          </Button>
        )}
      </div>
    </div>
  );
}
