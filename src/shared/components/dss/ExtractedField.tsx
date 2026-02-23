import { cn } from "@/shared/utils/utils";
import { ConfidenceBadge } from "./ConfidenceBadge";
import { CheckCircle, AlertTriangle } from "lucide-react";

interface ExtractedFieldProps {
  label: string;
  value: string;
  confidence: number; // 0-100
  isVerified?: boolean;
  originalText?: string;
  className?: string;
}

export function ExtractedField({ label, value, confidence, isVerified, originalText, className }: ExtractedFieldProps) {
  const needsReview = confidence < 70;

  return (
    <div
      className={cn(
        "flex flex-col gap-1.5 p-3 rounded-xl border transition-colors",
        needsReview
          ? "border-warning/40 bg-warning/5 backdrop-blur-sm"
          : "border-border/40 bg-card/80 backdrop-blur-sm",
        className
      )}
      role="group"
      aria-label={`${label}: ${value}`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{label}</span>
        <div className="flex items-center gap-1.5">
          <ConfidenceBadge confidence={confidence} size="sm" showLabel={false} />
          {isVerified !== undefined && (
            isVerified
              ? <CheckCircle className="h-3.5 w-3.5 text-success" aria-label="Terverifikasi" />
              : <AlertTriangle className="h-3.5 w-3.5 text-warning" aria-label="Perlu verifikasi" />
          )}
        </div>
      </div>
      <span className="text-sm font-semibold text-foreground">{value}</span>
      {originalText && needsReview && (
        <span className="text-xs text-muted-foreground italic">Teks asli: "{originalText}"</span>
      )}
    </div>
  );
}
