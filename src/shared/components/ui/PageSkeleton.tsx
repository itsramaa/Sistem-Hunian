import { Skeleton } from '@/shared/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/shared/components/ui/card';

export function StatsRowSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className={`grid gap-4 grid-cols-2 lg:grid-cols-${count}`}>
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} className="animate-fade-in" style={{ animationDelay: `${i * 80}ms`, animationFillMode: 'both' }}>
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
      ))}
    </div>
  );
}

export function HeaderSkeleton() {
  return (
    <div className="flex items-center gap-3 animate-fade-in">
      <Skeleton className="h-10 w-10 rounded-xl" />
      <div className="space-y-2">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-4 w-64" />
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <Card className="animate-fade-in">
      <CardHeader>
        <Skeleton className="h-5 w-32" />
      </CardHeader>
      <CardContent className="space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </CardContent>
    </Card>
  );
}

export function FiltersSkeleton() {
  return (
    <div className="flex gap-3 animate-fade-in">
      <Skeleton className="h-10 flex-1 max-w-sm" />
      <Skeleton className="h-10 w-32" />
    </div>
  );
}

export function TabsPageSkeleton({ statsCount = 4, rows = 5 }: { statsCount?: number; rows?: number }) {
  return (
    <div className="space-y-6">
      <HeaderSkeleton />
      <StatsRowSkeleton count={statsCount} />
      <FiltersSkeleton />
      <TableSkeleton rows={rows} />
    </div>
  );
}

export function ChartSkeleton() {
  return (
    <Card className="animate-fade-in">
      <CardHeader>
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-4 w-56" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-64 w-full rounded-lg" />
      </CardContent>
    </Card>
  );
}
