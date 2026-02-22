import { cn } from "@/shared/utils/utils";
import { Card, CardContent, CardHeader } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { ConfidenceBadge } from "./ConfidenceBadge";
import { Check, X, Clock, Lightbulb } from "lucide-react";

type RecommendationPriority = "high" | "medium" | "low";
type RecommendationAction = "accept" | "reject" | "defer";

interface RecommendationCardProps {
  title: string;
  description: string;
  confidence: number;
  priority: RecommendationPriority;
  category?: string;
  impact?: string;
  onAction?: (action: RecommendationAction) => void;
  isLoading?: boolean;
  className?: string;
}

const priorityConfig: Record<RecommendationPriority, { label: string; borderClass: string; iconClass: string }> = {
  high: { label: "Prioritas Tinggi", borderClass: "border-l-destructive", iconClass: "text-destructive" },
  medium: { label: "Prioritas Sedang", borderClass: "border-l-warning", iconClass: "text-warning" },
  low: { label: "Prioritas Rendah", borderClass: "border-l-info", iconClass: "text-info" },
};

export function RecommendationCard({
  title,
  description,
  confidence,
  priority,
  category,
  impact,
  onAction,
  isLoading,
  className,
}: RecommendationCardProps) {
  const config = priorityConfig[priority];

  return (
    <Card className={cn("border-l-4", config.borderClass, className)} role="article" aria-label={`Rekomendasi: ${title}`}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <Lightbulb className={cn("h-4 w-4 shrink-0", config.iconClass)} />
            <h3 className="text-sm font-semibold leading-tight">{title}</h3>
          </div>
          <ConfidenceBadge confidence={confidence} size="sm" />
        </div>
        <div className="flex items-center gap-2 mt-1">
          <span className={cn("text-xs font-medium", config.iconClass)}>{config.label}</span>
          {category && <span className="text-xs text-muted-foreground">• {category}</span>}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">{description}</p>
        {impact && (
          <p className="text-xs text-foreground/80 bg-muted/50 rounded px-2 py-1">
            <strong>Dampak:</strong> {impact}
          </p>
        )}
        {onAction && (
          <div className="flex items-center gap-2 pt-1">
            <Button size="sm" variant="default" onClick={() => onAction("accept")} disabled={isLoading} className="gap-1">
              <Check className="h-3 w-3" /> Terima
            </Button>
            <Button size="sm" variant="outline" onClick={() => onAction("defer")} disabled={isLoading} className="gap-1">
              <Clock className="h-3 w-3" /> Tunda
            </Button>
            <Button size="sm" variant="ghost" onClick={() => onAction("reject")} disabled={isLoading} className="gap-1 text-muted-foreground">
              <X className="h-3 w-3" /> Tolak
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
