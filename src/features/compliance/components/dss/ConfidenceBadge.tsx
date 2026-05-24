import { cn } from "@/shared/utils/utils";
import { Badge } from "@/shared/components/ui/badge";

interface ConfidenceBadgeProps {
  confidence: number; // 0-100
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  className?: string;
}

function getConfidenceLevel(confidence: number) {
  if (confidence >= 90) return { label: "Tinggi", colorClass: "bg-success/15 text-success border-success/30 backdrop-blur-sm" };
  if (confidence >= 70) return { label: "Sedang", colorClass: "bg-warning/15 text-warning border-warning/30 backdrop-blur-sm" };
  if (confidence >= 50) return { label: "Rendah", colorClass: "bg-accent/15 text-accent-foreground border-accent/30 backdrop-blur-sm" };
  return { label: "Sangat Rendah", colorClass: "bg-destructive/15 text-destructive border-destructive/30 backdrop-blur-sm" };
}

export function ConfidenceBadge({ confidence, size = "md", showLabel = true, className }: ConfidenceBadgeProps) {
  const { label, colorClass } = getConfidenceLevel(confidence);
  const clampedConfidence = Math.max(0, Math.min(100, Math.round(confidence)));

  const sizeClasses = {
    sm: "text-xs px-2 py-0.5",
    md: "text-sm px-2.5 py-0.5",
    lg: "text-base px-3 py-1",
  };

  return (
    <Badge
      className={cn("rounded-full font-semibold border", colorClass, sizeClasses[size], className)}
      aria-label={`Tingkat kepercayaan: ${clampedConfidence}% (${label})`}
    >
      {clampedConfidence}%{showLabel && ` — ${label}`}
    </Badge>
  );
}
