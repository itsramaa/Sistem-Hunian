import { useCollectionsDashboard } from '@/features/collections/hooks/useCollectionsDashboard';
import { useCollectionsCases, useUpdateCaseStatus } from '@/features/collections/hooks/useCollectionsCases';
import { CollectionsSummary } from '@/features/collections/components/CollectionsSummary';
import { AgingBuckets } from '@/features/collections/components/AgingBuckets';
import { OutstandingTable } from '@/features/collections/components/OutstandingTable';
import { CollectionsCasesList } from '@/features/collections/components/cases/CollectionsCasesList';
import { CollectionsReportWidgets } from '@/features/collections/components/cases/CollectionsReportWidgets';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';

export default function MerchantCollections() {
  const { summary, invoices, selectedBucket, setSelectedBucket } = useCollectionsDashboard();
  const { data: cases, isLoading: casesLoading } = useCollectionsCases();
  const updateCaseStatus = useUpdateCaseStatus();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Penagihan</h1>
        <p className="text-muted-foreground">Pantau dan kelola tunggakan penyewa</p>
      </div>

      <CollectionsSummary data={summary.data} loading={summary.isLoading} />

      <Tabs defaultValue="dashboard">
        <TabsList>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="cases">Kasus</TabsTrigger>
          <TabsTrigger value="reports">Laporan</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-lg">Aging Tunggakan</CardTitle></CardHeader>
            <CardContent>
              <AgingBuckets buckets={summary.data?.agingBuckets} loading={summary.isLoading} selectedBucket={selectedBucket} onSelect={setSelectedBucket} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">
                Daftar Tagihan Tertunggak
                {selectedBucket && <span className="ml-2 text-sm font-normal text-muted-foreground">— {selectedBucket}</span>}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <OutstandingTable invoices={invoices.data} loading={invoices.isLoading} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cases">
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-lg">Kasus Penagihan</CardTitle></CardHeader>
            <CardContent>
              <CollectionsCasesList
                cases={cases}
                loading={casesLoading}
                onUpdateStatus={(id, cur, next) => updateCaseStatus.mutate({ caseId: id, currentStatus: cur, newStatus: next })}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports">
          <CollectionsReportWidgets cases={cases} loading={casesLoading} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
