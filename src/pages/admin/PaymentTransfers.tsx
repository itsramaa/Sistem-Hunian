import { useAdminGuard } from '@/features/auth/hooks/useAdminGuard';
import { AdminLayout } from '@/shared/components/layouts/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/components/ui/table';
import { Badge } from '@/shared/components/ui/badge';
import { formatCurrency } from '@/shared/utils/currency';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/integrations/supabase/client';
import { format } from 'date-fns';
import { ArrowUpRight, CheckCircle2, Clock, Loader2, XCircle } from 'lucide-react';

export default function AdminPaymentTransfers() {
  const { isLoading: guardLoading } = useAdminGuard();

  const { data: transfers = [], isLoading } = useQuery({
    queryKey: ['admin-payment-transfers'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('payment_transfers')
        .select('*, merchants:merchant_id(business_name), bank_accounts:bank_account_id(bank_name, account_number)')
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      return data || [];
    },
  });

  const stats = {
    total: transfers.reduce((s: number, t: any) => s + Number(t.net_amount || 0), 0),
    completed: transfers.filter((t: any) => t.status === 'completed').length,
    pending: transfers.filter((t: any) => t.status === 'pending' || t.status === 'processing').length,
    failed: transfers.filter((t: any) => t.status === 'failed').length,
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case 'completed': return <Badge variant="default" className="bg-success text-success-foreground"><CheckCircle2 className="h-3 w-3 mr-1" />Selesai</Badge>;
      case 'processing': return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Diproses</Badge>;
      case 'pending': return <Badge variant="outline"><Clock className="h-3 w-3 mr-1" />Menunggu</Badge>;
      case 'failed': return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Gagal</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (guardLoading) {
    return (
      <AdminLayout title="Transfer Dana" description="Pantau transfer pembayaran ke merchant">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Transfer Dana" description="Pantau transfer pembayaran langsung ke merchant">
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <ArrowUpRight className="h-4 w-4 text-success" />
                <p className="text-sm text-muted-foreground">Total Ditransfer</p>
              </div>
              <p className="text-2xl font-bold mt-1">{formatCurrency(stats.total)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-success" />
                <p className="text-sm text-muted-foreground">Selesai</p>
              </div>
              <p className="text-2xl font-bold mt-1">{stats.completed}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-warning" />
                <p className="text-sm text-muted-foreground">Diproses</p>
              </div>
              <p className="text-2xl font-bold mt-1">{stats.pending}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <XCircle className="h-4 w-4 text-destructive" />
                <p className="text-sm text-muted-foreground">Gagal</p>
              </div>
              <p className="text-2xl font-bold mt-1">{stats.failed}</p>
            </CardContent>
          </Card>
        </div>

        {/* Transfers Table */}
        <Card>
          <CardHeader>
            <CardTitle>Riwayat Transfer</CardTitle>
            <CardDescription>Transfer pembayaran langsung ke rekening merchant</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : transfers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">Belum ada transfer</div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tanggal</TableHead>
                      <TableHead>Merchant</TableHead>
                      <TableHead>Jumlah</TableHead>
                      <TableHead className="hidden md:table-cell">Net</TableHead>
                      <TableHead className="hidden lg:table-cell">Bank</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transfers.map((t: any) => (
                      <TableRow key={t.id}>
                        <TableCell className="text-sm">{format(new Date(t.created_at), 'dd MMM yyyy HH:mm')}</TableCell>
                        <TableCell className="font-medium">{(t.merchants as any)?.business_name || '-'}</TableCell>
                        <TableCell>{formatCurrency(t.amount)}</TableCell>
                        <TableCell className="hidden md:table-cell">{formatCurrency(t.net_amount)}</TableCell>
                        <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                          {(t.bank_accounts as any)?.bank_name} - {(t.bank_accounts as any)?.account_number}
                        </TableCell>
                        <TableCell>{statusBadge(t.status)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
