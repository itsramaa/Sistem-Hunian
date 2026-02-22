import { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/shared/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/shared/components/ui/tooltip';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { useEffect, useRef, useState } from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  accentColor?: string;
  tooltip?: string;
  loading?: boolean;
  index?: number;
}

function useCountUp(target: number, duration = 600, enabled = true) {
  const [count, setCount] = useState(0);
  const prevTarget = useRef(0);

  useEffect(() => {
    if (!enabled || target === prevTarget.current) return;
    prevTarget.current = target;
    
    const start = 0;
    const startTime = performance.now();
    
    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
      setCount(Math.round(start + (target - start) * eased));
      if (progress < 1) requestAnimationFrame(animate);
    };
    
    requestAnimationFrame(animate);
  }, [target, duration, enabled]);

  return count;
}

export function StatCard({ title, value, subtitle, icon: Icon, accentColor = 'hsl(var(--primary))', tooltip, loading, index = 0 }: StatCardProps) {
  const numericValue = typeof value === 'number' ? value : null;
  const displayCount = useCountUp(numericValue ?? 0, 600, numericValue !== null && !loading);

  if (loading) {
    return (
      <Card className="animate-fade-in" style={{ animationDelay: `${index * 80}ms`, animationFillMode: 'both' }}>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-lg" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-6 w-16" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const content = (
    <Card 
      className="transition-[transform,box-shadow] duration-200 hover:shadow-md hover:-translate-y-0.5 animate-fade-in border-l-4"
      style={{ 
        borderLeftColor: accentColor, 
        animationDelay: `${index * 80}ms`,
        animationFillMode: 'both'
      }}
    >
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `color-mix(in srgb, ${accentColor} 12%, transparent)` }}>
            <Icon className="h-5 w-5" style={{ color: accentColor }} />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide truncate">{title}</p>
            <p className="text-2xl font-bold leading-tight">
              {numericValue !== null ? displayCount : value}
            </p>
            {subtitle && (
              <p className="text-xs text-muted-foreground truncate">{subtitle}</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (tooltip) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>{content}</TooltipTrigger>
          <TooltipContent><p>{tooltip}</p></TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return content;
}
