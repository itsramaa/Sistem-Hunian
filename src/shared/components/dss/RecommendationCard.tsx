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

const priorityConfig: Record<RecommendationPriority, { label: string; borderClass: string; iconClass: string; bgClass: string }> = {
  high: { label: "Prioritas Tinggi", borderClass: "border-l-destructive", iconClass: "text-destructive", bgClass: "bg-gradient-to-br from-destructive/15 to-destructive/5" },
  medium: { label: "Prioritas Sedang", borderClass: "border-l-warning", iconClass: "text-warning", bgClass: "bg-gradient-to-br from-warning/15 to-warning/5" },
  low: { label: "Prioritas Rendah", borderClass: "border-l-info", iconClass: "text-info", bgClass: "bg-gradient-to-br from-info/15 to-info/5" },
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
    <Card className={cn("rounded-2xl border-l-4 bg-card/90 backdrop-blur-sm border border-border/40", config.borderClass, className)} role="article" aria-label={`Rekomendasi: ${title}`}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className={cn("h-8 w-8 rounded-xl flex items-center justify-center shrink-0", config.bgClass)}>
              <Lightbulb className={cn("h-4 w-4", config.iconClass)} />
            </div>
            <h3 className="text-sm font-bold leading-tight">{title}</h3>
          </div>
          <ConfidenceBadge confidence={confidence} size="sm" />
        </div>
        <div className="flex items-center gap-2 mt-1.5 ml-[42px]">
          <span className={cn("text-xs font-semibold", config.iconClass)}>{config.label}</span>
          {category && <span className="text-xs text-muted-foreground">• {category}</span>}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
        {impact && (
          <p className="text-xs text-foreground/80 bg-muted/30 backdrop-blur-sm rounded-xl px-3 py-2 border border-border/30">
            <strong>Dampak:</strong> {impact}
          </p>
        )}
        {onAction && (
          <div className="flex items-center gap-2 pt-1">
            <Button size="sm" onClick={() => onAction("accept")} disabled={isLoading} className="gap-1.5 rounded-xl bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-sm">
              <Check className="h-3 w-3" /> Terima
            </Button>
            <Button size="sm" variant="outline" onClick={() => onAction("defer")} disabled={isLoading} className="gap-1.5 rounded-xl">
              <Clock className="h-3 w-3" /> Tunda
            </Button>
            <Button size="sm" variant="ghost" onClick={() => onAction("reject")} disabled={isLoading} className="gap-1.5 rounded-xl text-muted-foreground">
              <X className="h-3 w-3" /> Tolak
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
