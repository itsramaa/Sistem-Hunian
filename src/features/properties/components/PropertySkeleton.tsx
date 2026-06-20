import { Skeleton } from '@/shared/components/ui/skeleton';

export function StatsCardsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="glass-stat-card p-5">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-16" />
            </div>
            <Skeleton className="h-12 w-12 rounded-xl" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function PropertyCardSkeleton() {
  return (
    <div className="rounded-2xl border border-border/40 bg-card/90 overflow-hidden">
      <Skeleton className="h-32 w-full rounded-none" />
      <div className="p-4 space-y-3">
        <div className="flex items-center gap-2.5">
          <Skeleton className="w-9 h-9 rounded-xl" />
          <div className="space-y-1.5">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-3.5 w-3.5 rounded" />
          <Skeleton className="h-3 w-28" />
        </div>
        <div className="flex gap-1">
          {[1, 2, 3].map((i) => (<Skeleton key={i} className="h-5 w-16 rounded-full" />))}
        </div>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-4 w-20" />
          </div>
          <Skeleton className="h-5 w-14 rounded-full" />
        </div>
        <div className="flex gap-1">
          {[1, 2, 3, 4].map((i) => (<Skeleton key={i} className="h-1.5 flex-1 rounded-full" />))}
        </div>
      </div>
    </div>
  );
}

export function PropertyGridSkeleton({ count = 9 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="animate-in fade-in-0" style={{ animationDelay: `${i * 60}ms`, animationFillMode: 'both' }}>
          <PropertyCardSkeleton />
        </div>
      ))}
    </div>
  );
}

export function PropertiesPageSkeleton() {
  return (
    <div className="space-y-6">
      <StatsCardsSkeleton />
      <div className="glass-filter-bar flex flex-col md:flex-row gap-3">
        <Skeleton className="h-10 flex-1 rounded-xl" />
        <Skeleton className="h-10 w-[160px] rounded-xl" />
        <Skeleton className="h-10 w-[160px] rounded-xl" />
        <Skeleton className="h-10 w-[170px] rounded-xl" />
        <Skeleton className="h-10 w-20 rounded-full" />
      </div>
      <PropertyGridSkeleton />
    </div>
  );
}
