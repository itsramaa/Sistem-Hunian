import { cn } from "@/shared/utils/utils";
import { Badge } from "@/shared/components/ui/badge";

interface ConfidenceBadgeProps {
  confidence: number; // 0-100
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  className?: string;
}

function getConfidenceLevel(confidence: number) {
  if (confidence >= 90) return { label: "Tinggi", variant: "default" as const, colorClass: "bg-success text-success-foreground" };
  if (confidence >= 70) return { label: "Sedang", variant: "secondary" as const, colorClass: "bg-warning text-warning-foreground" };
  if (confidence >= 50) return { label: "Rendah", variant: "outline" as const, colorClass: "bg-accent text-accent-foreground" };
  return { label: "Sangat Rendah", variant: "destructive" as const, colorClass: "bg-destructive text-destructive-foreground" };
}

export function ConfidenceBadge({ confidence, size = "md", showLabel = true, className }: ConfidenceBadgeProps) {
  const { label, colorClass } = getConfidenceLevel(confidence);
  const clampedConfidence = Math.max(0, Math.min(100, Math.round(confidence)));

  const sizeClasses = {
    sm: "text-xs px-1.5 py-0.5",
    md: "text-sm px-2 py-0.5",
    lg: "text-base px-3 py-1",
  };

  return (
    <Badge
      className={cn(colorClass, sizeClasses[size], "font-medium", className)}
      aria-label={`Tingkat kepercayaan: ${clampedConfidence}% (${label})`}
    >
      {clampedConfidence}%{showLabel && ` — ${label}`}
    </Badge>
  );
}
