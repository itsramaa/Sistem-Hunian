import { useState } from "react";
import { Link } from "react-router-dom";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Progress } from "@/shared/components/ui/progress";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/shared/components/ui/collapsible";
import { ChevronDown, CheckCircle2, Circle, ExternalLink, Loader2, Zap } from "lucide-react";
import { cn } from "@/shared/utils/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import type { DssReadinessResult } from "@/features/dss/hooks/useDssReadiness";

const LEVEL_STYLES: Record<number, { bg: string; border: string; badge: string; progress: string }> = {
  1: { bg: "from-success/10 to-success/5", border: "border-success/20", badge: "bg-success/15 text-success border-success/30", progress: "[&>div]:bg-success" },
  2: { bg: "from-info/10 to-info/5", border: "border-info/20", badge: "bg-info/15 text-info border-info/30", progress: "[&>div]:bg-info" },
  3: { bg: "from-warning/10 to-warning/5", border: "border-warning/20", badge: "bg-warning/15 text-warning border-warning/30", progress: "[&>div]:bg-warning" },
  4: { bg: "from-destructive/10 to-destructive/5", border: "border-destructive/20", badge: "bg-destructive/15 text-destructive border-destructive/30", progress: "[&>div]:bg-destructive" },
};

interface DssReadinessChecklistProps {
  readiness: DssReadinessResult;
}

export function DssReadinessChecklist({ readiness }: DssReadinessChecklistProps) {
  const [openLevels, setOpenLevels] = useState<number[]>(() =>
    readiness.levels.filter(l => l.score < 100).map(l => l.level)
  );
  const [generating, setGenerating] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const toggleLevel = (level: number) => {
    setOpenLevels(prev => prev.includes(level) ? prev.filter(l => l !== level) : [...prev, level]);
  };

  const handleAutoGenerate = async (key: string) => {
    setGenerating(key);
    try {
      const fnName = key === 'occupancy' ? 'compute-occupancy-snapshots' : 'compute-tenant-payment-metrics';
      const { error } = await supabase.functions.invoke(fnName);
      if (error) throw error;
      toast.success(key === 'occupancy' ? 'Data occupancy berhasil di-generate!' : 'Data payment tenant berhasil di-generate!');
      queryClient.invalidateQueries({ queryKey: ['dss-readiness'] });
    } catch (e: any) {
      toast.error(`Gagal generate data: ${e.message || 'Unknown error'}`);
    } finally {
      setGenerating(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Overall Score */}
      <div className="flex items-center gap-4 p-4 rounded-2xl bg-card/90 backdrop-blur-sm border border-border/40">
        <div className="relative w-16 h-16 shrink-0">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
            <circle cx="18" cy="18" r="15.5" fill="none" stroke="hsl(var(--muted))" strokeWidth="3" />
            <circle cx="18" cy="18" r="15.5" fill="none" stroke="hsl(var(--primary))" strokeWidth="3"
              strokeDasharray={`${readiness.overallScore * 0.9739} 97.39`}
              strokeLinecap="round" className="transition-all duration-700" />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-sm font-bold">
            {readiness.overallScore}%
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm">DSS Readiness Score</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {readiness.isDssReady
              ? "Semua data lengkap — DSS siap digunakan! ✅"
              : `${readiness.missingItems.length} item belum dilengkapi`}
          </p>
          <Progress value={readiness.overallScore} className="h-1.5 mt-2 rounded-full" />
        </div>
      </div>

      {/* Per-level collapsible sections */}
      {readiness.levels.map(level => {
        const style = LEVEL_STYLES[level.level];
        const isOpen = openLevels.includes(level.level);
        const completedCount = level.items.filter(i => i.completed).length;

        return (
          <Collapsible key={level.level} open={isOpen} onOpenChange={() => toggleLevel(level.level)}>
            <CollapsibleTrigger className="w-full">
              <div className={cn(
                "flex items-center gap-3 p-3 rounded-xl border transition-colors hover:bg-muted/30",
                style.border, isOpen && `bg-gradient-to-r ${style.bg}`
              )}>
                <span className="text-lg">{level.level === 1 ? "✅" : level.level === 2 ? "⚡" : level.level === 3 ? "📊" : "🔒"}</span>
                <div className="flex-1 text-left min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Level {level.level}: {level.label}</span>
                    <Badge variant="outline" className={cn("text-[10px] rounded-full px-1.5 py-0", style.badge)}>
                      {level.badge}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <Progress value={level.score} className={cn("h-1 flex-1 rounded-full", style.progress)} />
                    <span className="text-xs text-muted-foreground shrink-0">{completedCount}/{level.items.length}</span>
                  </div>
                </div>
                <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", isOpen && "rotate-180")} />
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="ml-4 mt-1 space-y-0.5">
                {level.items.map(item => (
                  <div key={item.key} className="flex items-center gap-2.5 py-1.5 px-2 rounded-lg hover:bg-muted/20 transition-colors">
                    {item.completed ? (
                      <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
                    ) : (
                      <Circle className="h-4 w-4 text-muted-foreground/40 shrink-0" />
                    )}
                    <span className="text-xs mr-1">{item.icon}</span>
                    <span className={cn("text-sm flex-1", item.completed ? "text-muted-foreground line-through" : "text-foreground")}>
                      {item.label}
                    </span>
                    {!item.completed && item.action === 'auto-generate' && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-6 text-xs rounded-full px-2.5 gap-1 border-primary/30 text-primary hover:bg-primary/10"
                        disabled={generating === item.key}
                        onClick={(e) => { e.stopPropagation(); handleAutoGenerate(item.key); }}
                      >
                        {generating === item.key ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Zap className="h-3 w-3" />
                        )}
                        Generate
                      </Button>
                    )}
                    {!item.completed && !item.action && item.link && (
                      <Link to={item.link} className="text-xs text-primary hover:underline flex items-center gap-0.5 shrink-0">
                        Lengkapi <ExternalLink className="h-3 w-3" />
                      </Link>
                    )}
                  </div>
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>
        );
      })}
    </div>
  );
}
