import { useState } from "react";
import { Card, CardContent } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Progress } from "@/shared/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/shared/components/ui/dialog";
import { CheckCircle2, ChevronRight, Shield } from "lucide-react";
import { DssReadinessChecklist } from "./DssReadinessChecklist";
import type { DssReadinessResult } from "@/features/dss/hooks/useDssReadiness";

interface DssReadinessCardProps {
  readiness: DssReadinessResult;
}

export function DssReadinessCard({ readiness }: DssReadinessCardProps) {
  const [showChecklist, setShowChecklist] = useState(false);

  if (readiness.isLoading) return null;

  return (
    <>
      <Card className="rounded-2xl bg-card/90 backdrop-blur-sm border border-border/40 overflow-hidden">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              readiness.isDssReady
                ? "bg-gradient-to-br from-success/20 to-success/5"
                : "bg-gradient-to-br from-primary/20 to-primary/5"
            }`}>
              {readiness.isDssReady ? (
                <CheckCircle2 className="h-5 w-5 text-success" />
              ) : (
                <Shield className="h-5 w-5 text-primary" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold">DSS Readiness</span>
                {readiness.isDssReady ? (
                  <Badge className="rounded-full bg-success/15 text-success border-success/30 text-[10px]">Ready</Badge>
                ) : (
                  <Badge variant="outline" className="rounded-full text-[10px]">{readiness.overallScore}%</Badge>
                )}
              </div>
              <Progress
                value={readiness.overallScore}
                className={`h-1.5 mt-1.5 rounded-full ${readiness.isDssReady ? "[&>div]:bg-success" : ""}`}
              />
              {!readiness.isDssReady && (
                <p className="text-xs text-muted-foreground mt-1">{readiness.missingItems.length} item perlu dilengkapi</p>
              )}
            </div>
            <Button variant="ghost" size="sm" onClick={() => setShowChecklist(true)} className="rounded-xl shrink-0 text-xs gap-1">
              Detail <ChevronRight className="h-3 w-3" />
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={showChecklist} onOpenChange={setShowChecklist}>
        <DialogContent className="max-w-lg w-[95vw] rounded-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>DSS Readiness Checklist</DialogTitle>
          </DialogHeader>
          <DssReadinessChecklist readiness={readiness} />
        </DialogContent>
      </Dialog>
    </>
  );
}
