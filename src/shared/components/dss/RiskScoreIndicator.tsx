import { cn } from "@/shared/utils/utils";
import { Progress } from "@/shared/components/ui/progress";

interface RiskScoreIndicatorProps {
  score: number; // 0-100
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

function getRiskLevel(score: number) {
  if (score <= 25) return { label: "Rendah", colorClass: "text-success", progressClass: "[&>div]:bg-gradient-to-r [&>div]:from-success [&>div]:to-success/70" };
  if (score <= 50) return { label: "Sedang", colorClass: "text-warning", progressClass: "[&>div]:bg-gradient-to-r [&>div]:from-warning [&>div]:to-warning/70" };
  if (score <= 75) return { label: "Tinggi", colorClass: "text-destructive", progressClass: "[&>div]:bg-gradient-to-r [&>div]:from-destructive [&>div]:to-destructive/70" };
  return { label: "Kritis", colorClass: "text-destructive", progressClass: "[&>div]:bg-gradient-to-r [&>div]:from-destructive [&>div]:to-red-400" };
}

export function RiskScoreIndicator({ score, showLabel = true, size = "md", className }: RiskScoreIndicatorProps) {
  const clamped = Math.max(0, Math.min(100, Math.round(score)));
  const { label, colorClass, progressClass } = getRiskLevel(clamped);

  const heightClasses = { sm: "h-1.5 rounded-full", md: "h-2.5 rounded-full", lg: "h-4 rounded-full" };
  const textClasses = { sm: "text-xs", md: "text-sm", lg: "text-base" };

  return (
    <div className={cn("flex flex-col gap-1.5", className)} role="meter" aria-valuenow={clamped} aria-valuemin={0} aria-valuemax={100} aria-label={`Skor risiko: ${clamped} (${label})`}>
      <div className="flex items-center justify-between">
        <span className={cn("font-bold", colorClass, textClasses[size])}>{clamped}</span>
        {showLabel && <span className={cn("text-muted-foreground font-medium", textClasses[size])}>{label}</span>}
      </div>
      <Progress value={clamped} className={cn(heightClasses[size], "bg-muted/50", progressClass)} />
    </div>
  );
}
