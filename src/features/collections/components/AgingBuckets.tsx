import { Card, CardContent } from '@/shared/components/ui/card';
import { Skeleton } from '@/shared/components/ui/skeleton';
import type { AgingBucketSummary } from '../services/collectionsService';
import { cn } from '@/shared/utils/utils';

const BUCKET_CONFIG: Record<string, { label: string; colorClass: string; borderClass: string }> = {
  '< 7 hari': { label: '< 7 Hari', colorClass: 'text-yellow-700 dark:text-yellow-400', borderClass: 'border-l-yellow-500' },
  '7-14 hari': { label: '7-14 Hari', colorClass: 'text-orange-700 dark:text-orange-400', borderClass: 'border-l-orange-500' },
  '14-30 hari': { label: '14-30 Hari', colorClass: 'text-red-600 dark:text-red-400', borderClass: 'border-l-red-500' },
  '> 30 hari': { label: '> 30 Hari', colorClass: 'text-red-800 dark:text-red-300', borderClass: 'border-l-red-800' },
};

const ALL_BUCKETS = ['< 7 hari', '7-14 hari', '14-30 hari', '> 30 hari'];

interface Props {
  buckets: AgingBucketSummary[] | undefined;
  loading: boolean;
  selectedBucket: string | null;
  onSelect: (bucket: string | null) => void;
}

export function AgingBuckets({ buckets, loading, selectedBucket, onSelect }: Props) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[0, 1, 2, 3].map(i => (
          <Card key={i}><CardContent className="p-4"><Skeleton className="h-16 w-full" /></CardContent></Card>
        ))}
      </div>
    );
  }

  const bucketMap = new Map((buckets || []).map(b => [b.bucket, b]));

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {ALL_BUCKETS.map(key => {
        const config = BUCKET_CONFIG[key];
        const data = bucketMap.get(key);
        const isSelected = selectedBucket === key;

        return (
          <Card
            key={key}
            className={cn(
              'cursor-pointer border-l-4 transition-all hover:shadow-md hover:-translate-y-0.5',
              config.borderClass,
              isSelected && 'ring-2 ring-primary shadow-md'
            )}
            onClick={() => onSelect(isSelected ? null : key)}
          >
            <CardContent className="p-4">
              <p className={cn('text-sm font-semibold', config.colorClass)}>{config.label}</p>
              <p className="text-2xl font-bold mt-1">{data?.count || 0}</p>
              <p className="text-xs text-muted-foreground">
                Rp {(data?.totalAmount || 0).toLocaleString('id-ID')}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
