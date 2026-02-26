import { useState } from 'react';
import { Plus, Search, Trash2, Wallet, TrendingDown, TrendingUp, Receipt } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/components/ui/table';
import { Badge } from '@/shared/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/shared/components/ui/dialog';
import { Label } from '@/shared/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { StatCard } from '@/shared/components/ui/StatCard';
import { useExpenses } from '@/features/expenses/hooks/useExpenses';
import { EXPENSE_CATEGORIES } from '@/features/expenses/services/expenseService';

const CATEGORY_LABELS: Record<string, string> = {
  utilities: 'Utilitas',
  maintenance: 'Pemeliharaan',
  insurance: 'Asuransi',
  tax: 'Pajak',
  marketing: 'Pemasaran',
  admin: 'Administrasi',
  payroll: 'Gaji',
  other: 'Lainnya',
};

export default function MerchantExpenses() {
  const { summary, expenses, createExpense, deleteExpense } = useExpenses();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({
    category: 'utilities',
    description: '',
    amount: '',
    expenseDate: new Date().toISOString().split('T')[0],
    paymentMethod: 'bank_transfer',
    notes: '',
  });

  const handleSubmit = () => {
    if (!form.amount || Number(form.amount) <= 0) return;
    createExpense.mutate({
      category: form.category,
      description: form.description,
      amount: Number(form.amount),
      expenseDate: form.expenseDate,
      paymentMethod: form.paymentMethod,
      notes: form.notes,
    }, {
      onSuccess: () => {
        setDialogOpen(false);
        setForm({ category: 'utilities', description: '', amount: '', expenseDate: new Date().toISOString().split('T')[0], paymentMethod: 'bank_transfer', notes: '' });
      },
    });
  };

  const filtered = (expenses.data || []).filter(e =>
    !search ||
    e.category.toLowerCase().includes(search.toLowerCase()) ||
    e.description?.toLowerCase().includes(search.toLowerCase())
  );

  const summaryData = summary.data;
  const trendIcon = (summaryData?.trend || 0) >= 0 ? TrendingUp : TrendingDown;
  const trendColor = (summaryData?.trend || 0) >= 0 ? 'hsl(0 84% 60%)' : 'hsl(142 71% 45%)';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Pengeluaran</h1>
          <p className="text-muted-foreground">Catat dan lacak semua biaya operasional</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-1" /> Tambah Pengeluaran</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Tambah Pengeluaran Baru</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Kategori</Label>
                <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {EXPENSE_CATEGORIES.map(c => (
                      <SelectItem key={c} value={c}>{CATEGORY_LABELS[c]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Jumlah (Rp)</Label>
                <Input type="number" placeholder="0" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} />
              </div>
              <div>
                <Label>Tanggal</Label>
                <Input type="date" value={form.expenseDate} onChange={e => setForm(f => ({ ...f, expenseDate: e.target.value }))} />
              </div>
              <div>
                <Label>Deskripsi</Label>
                <Input placeholder="Listrik bulan Februari..." value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
              </div>
              <div>
                <Label>Catatan</Label>
                <Input placeholder="Catatan tambahan..." value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
              </div>
              <Button onClick={handleSubmit} disabled={createExpense.isPending} className="w-full">
                {createExpense.isPending ? 'Menyimpan...' : 'Simpan'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Pengeluaran Bulan Ini"
          value={`Rp ${(summaryData?.totalThisMonth || 0).toLocaleString('id-ID')}`}
          subtitle={`${summaryData?.countThisMonth || 0} transaksi`}
          icon={Wallet}
          accentColor="hsl(var(--primary))"
          loading={summary.isLoading}
          index={0}
        />
        <StatCard
          title="Tren vs Bulan Lalu"
          value={`${summaryData?.trend || 0}%`}
          subtitle={`Bulan lalu: Rp ${(summaryData?.lastMonthTotal || 0).toLocaleString('id-ID')}`}
          icon={trendIcon}
          accentColor={trendColor}
          loading={summary.isLoading}
          index={1}
        />
        <StatCard
          title="Kategori Terbesar"
          value={summaryData?.byCategory?.[0] ? CATEGORY_LABELS[summaryData.byCategory[0].category] : '-'}
          subtitle={summaryData?.byCategory?.[0] ? `Rp ${summaryData.byCategory[0].total.toLocaleString('id-ID')}` : undefined}
          icon={Receipt}
          accentColor="hsl(38 92% 50%)"
          loading={summary.isLoading}
          index={2}
        />
        <StatCard
          title="Jumlah Kategori"
          value={summaryData?.byCategory?.length || 0}
          subtitle="kategori aktif"
          icon={Receipt}
          accentColor="hsl(262 83% 58%)"
          loading={summary.isLoading}
          index={3}
        />
      </div>

      {/* Category breakdown */}
      {summaryData?.byCategory && summaryData.byCategory.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Breakdown Kategori</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {summaryData.byCategory.map(cat => {
                const pct = summaryData.totalThisMonth > 0
                  ? Math.round((cat.total / summaryData.totalThisMonth) * 100)
                  : 0;
                return (
                  <div key={cat.category} className="flex items-center gap-3">
                    <div className="w-28 text-sm font-medium">{CATEGORY_LABELS[cat.category] || cat.category}</div>
                    <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                    <div className="w-12 text-right text-sm font-semibold">{pct}%</div>
                    <div className="w-32 text-right text-sm text-muted-foreground">
                      Rp {cat.total.toLocaleString('id-ID')}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Daftar Pengeluaran</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Cari pengeluaran..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
          </div>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Kategori</TableHead>
                  <TableHead>Deskripsi</TableHead>
                  <TableHead className="text-right">Jumlah</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-center">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      Belum ada pengeluaran tercatat
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map(e => (
                    <TableRow key={e.id}>
                      <TableCell className="text-sm">{new Date(e.expenseDate).toLocaleDateString('id-ID')}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{CATEGORY_LABELS[e.category] || e.category}</Badge>
                      </TableCell>
                      <TableCell className="text-sm">{e.description || '-'}</TableCell>
                      <TableCell className="text-right font-semibold">Rp {e.amount.toLocaleString('id-ID')}</TableCell>
                      <TableCell>
                        <Badge variant={e.approvalStatus === 'approved' ? 'default' : 'secondary'}>
                          {e.approvalStatus}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Button size="sm" variant="ghost" onClick={() => deleteExpense.mutate(e.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
