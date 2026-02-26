import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { TrendingUp, Users, AlertTriangle } from 'lucide-react';
import type { CollectionsCase } from '../../services/collectionsCaseService';

interface Props {
  cases?: CollectionsCase[];
  loading?: boolean;
}

export function CollectionsReportWidgets({ cases, loading }: Props) {
  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => <Card key={i}><CardContent className="pt-6"><Skeleton className="h-16 w-full" /></CardContent></Card>)}
      </div>
    );
  }

  const all = cases || [];
  const open = all.filter(c => c.status !== 'resolved');
  const resolved = all.filter(c => c.status === 'resolved');
  const totalDue = open.reduce((s, c) => s + c.totalDue, 0);
  const avgDays = open.length > 0 ? Math.round(open.reduce((s, c) => s + c.daysOverdue, 0) / open.length) : 0;

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader className="pb-2 flex flex-row items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-destructive" />
          <CardTitle className="text-sm font-medium">Kasus Terbuka</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">{open.length}</p>
          <p className="text-xs text-muted-foreground">Total: Rp {totalDue.toLocaleString('id-ID')}</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2 flex flex-row items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          <CardTitle className="text-sm font-medium">Kasus Selesai</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">{resolved.length}</p>
          <p className="text-xs text-muted-foreground">Dari total {all.length} kasus</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2 flex flex-row items-center gap-2">
          <Users className="h-5 w-5 text-destructive" />
          <CardTitle className="text-sm font-medium">Rata-rata Hari Tunggak</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">{avgDays} hari</p>
          <p className="text-xs text-muted-foreground">Pada kasus terbuka</p>
        </CardContent>
      </Card>
    </div>
  );
}
