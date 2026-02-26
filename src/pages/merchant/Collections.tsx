import { useCollectionsDashboard } from '@/features/collections/hooks/useCollectionsDashboard';
import { CollectionsSummary } from '@/features/collections/components/CollectionsSummary';
import { AgingBuckets } from '@/features/collections/components/AgingBuckets';
import { OutstandingTable } from '@/features/collections/components/OutstandingTable';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';

export default function MerchantCollections() {
  const { summary, invoices, selectedBucket, setSelectedBucket } = useCollectionsDashboard();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Penagihan</h1>
        <p className="text-muted-foreground">Pantau dan kelola tunggakan penyewa</p>
      </div>

      <CollectionsSummary data={summary.data} loading={summary.isLoading} />

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Aging Tunggakan</CardTitle>
        </CardHeader>
        <CardContent>
          <AgingBuckets
            buckets={summary.data?.agingBuckets}
            loading={summary.isLoading}
            selectedBucket={selectedBucket}
            onSelect={setSelectedBucket}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">
            Daftar Tagihan Tertunggak
            {selectedBucket && (
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                — {selectedBucket}
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <OutstandingTable invoices={invoices.data} loading={invoices.isLoading} />
        </CardContent>
      </Card>
    </div>
  );
}
