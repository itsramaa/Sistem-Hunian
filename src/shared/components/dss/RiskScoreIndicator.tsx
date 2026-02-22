import { cn } from "@/shared/utils/utils";
import { Progress } from "@/shared/components/ui/progress";

interface RiskScoreIndicatorProps {
  score: number; // 0-100
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

function getRiskLevel(score: number) {
  if (score <= 25) return { label: "Rendah", colorClass: "text-success", progressClass: "[&>div]:bg-success" };
  if (score <= 50) return { label: "Sedang", colorClass: "text-warning", progressClass: "[&>div]:bg-warning" };
  if (score <= 75) return { label: "Tinggi", colorClass: "text-destructive", progressClass: "[&>div]:bg-destructive" };
  return { label: "Kritis", colorClass: "text-destructive", progressClass: "[&>div]:bg-destructive" };
}

export function RiskScoreIndicator({ score, showLabel = true, size = "md", className }: RiskScoreIndicatorProps) {
  const clamped = Math.max(0, Math.min(100, Math.round(score)));
  const { label, colorClass, progressClass } = getRiskLevel(clamped);

  const heightClasses = { sm: "h-1.5", md: "h-2.5", lg: "h-4" };
  const textClasses = { sm: "text-xs", md: "text-sm", lg: "text-base" };

  return (
    <div className={cn("flex flex-col gap-1", className)} role="meter" aria-valuenow={clamped} aria-valuemin={0} aria-valuemax={100} aria-label={`Skor risiko: ${clamped} (${label})`}>
      <div className="flex items-center justify-between">
        <span className={cn("font-semibold", colorClass, textClasses[size])}>{clamped}</span>
        {showLabel && <span className={cn("text-muted-foreground", textClasses[size])}>{label}</span>}
      </div>
      <Progress value={clamped} className={cn(heightClasses[size], progressClass)} />
    </div>
  );
}
