import { useAuth } from "@/features/auth/hooks/useAuth";
import { useOnboardingJourney, OnboardingStatus } from "@/features/launch/hooks/useOnboardingJourney";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Progress } from "@/shared/components/ui/progress";
import { Button } from "@/shared/components/ui/button";
import { CheckCircle2, Circle, ChevronRight, Rocket, X, Clock, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";

const statusConfig: Record<OnboardingStatus, {
  icon: typeof CheckCircle2;
  iconClass: string;
  bgClass: string;
  textClass: string;
  clickable: boolean;
}> = {
  completed: {
    icon: CheckCircle2,
    iconClass: 'text-success',
    bgClass: 'bg-success/5 hover:bg-success/10',
    textClass: 'line-through text-muted-foreground',
    clickable: false,
  },
  active: {
    icon: Circle,
    iconClass: 'text-primary',
    bgClass: 'hover:bg-primary/5 border border-transparent hover:border-border/40',
    textClass: 'text-foreground',
    clickable: true,
  },
  blocking: {
    icon: Clock,
    iconClass: 'text-warning animate-pulse',
    bgClass: 'bg-warning/5',
    textClass: 'text-muted-foreground',
    clickable: false,
  },
  pending: {
    icon: Circle,
    iconClass: 'text-muted-foreground/30',
    bgClass: 'opacity-50',
    textClass: 'text-muted-foreground/60',
    clickable: false,
  },
};

export function MerchantQuickStartChecklist() {
  const { merchant } = useAuth();
  const { steps, completedCount, totalSteps, progress, allDone } = useOnboardingJourney();
  const navigate = useNavigate();
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (merchant?.id) {
      const key = `quickstart_dismissed_${merchant.id}`;
      setDismissed(localStorage.getItem(key) === 'true');
    }
  }, [merchant?.id]);

  const handleDismiss = () => {
    if (merchant?.id) {
      localStorage.setItem(`quickstart_dismissed_${merchant.id}`, 'true');
    }
    setDismissed(true);
  };

  if (dismissed || allDone) return null;

  return (
    <Card className="bg-card/90 backdrop-blur-sm rounded-2xl border border-border/40 relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-accent to-success" />
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
              <Rocket className="h-4 w-4 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base">Quick Start</CardTitle>
              <CardDescription>
                {completedCount}/{totalSteps} langkah selesai
              </CardDescription>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={handleDismiss} className="h-8 w-8">
            <X className="h-4 w-4" />
          </Button>
        </div>
        <Progress value={progress} className="h-2 mt-2 rounded-full [&>div]:bg-primary" />
      </CardHeader>
      <CardContent>
        <div className="space-y-1.5">
          {steps.map(step => {
            const config = statusConfig[step.status];
            const Icon = config.icon;

            return (
              <div
                key={step.id}
                className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                  config.clickable ? 'cursor-pointer' : ''
                } ${config.bgClass}`}
                onClick={() => config.clickable && step.path && navigate(step.path)}
              >
                <Icon className={`h-5 w-5 shrink-0 ${config.iconClass}`} />
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${config.textClass}`}>
                    {step.label}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {step.blockingLabel || step.description}
                  </p>
                </div>
                {config.clickable && step.path && (
                  <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
