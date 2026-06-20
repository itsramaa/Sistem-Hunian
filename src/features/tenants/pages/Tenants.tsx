import React, { useState } from 'react';
import { useTenants, useActiveTenants, useTenantHistory, useCreateTenant, useCheckoutTenant } from '../hooks/useTenants';
import { useProperties } from '@/features/properties/hooks/useProperties';
import { TenantForm } from '../components/TenantForm';
import { CheckoutForm } from '../components/CheckoutForm';
import { Tenant } from '../types';
import { Button } from '@/shared/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/components/ui/table';
import { Badge } from '@/shared/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { Plus, Loader2, Users, LogOut, ChevronLeft, ChevronRight, History } from 'lucide-react';
import { useToast } from '@/shared/hooks/use-toast';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';

export default function TenantsPage() {
  const [tab, setTab] = useState('active');
  const [page, setPage] = useState(1);
  const [propertyFilter, setPropertyFilter] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const { toast } = useToast();

  const limit = 20;

  const { data: activeData, isLoading: activeLoading } = useActiveTenants(page, limit, propertyFilter || undefined);
  const { data: historyData, isLoading: historyLoading } = useTenantHistory(page, limit, propertyFilter || undefined);
  const { data: propsData } = useProperties('', 1, 100);

  const createMutation = useCreateTenant();
  const checkoutMutation = useCheckoutTenant();

  const isActive = tab === 'active';
  const rawData = isActive ? activeData : historyData;
  const isLoading = isActive ? activeLoading : historyLoading;
  const tenants: Tenant[] = rawData?.tenants ?? [];
  const total = rawData?.pagination?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const properties = propsData?.properties ?? [];

  const handleCreate = async (payload: any) => {
    try {
      await createMutation.mutateAsync(payload);
      setFormOpen(false);
      toast({ title: 'Penghuni berhasil ditambahkan' });
    } catch { toast({ variant: 'destructive', title: 'Gagal menambahkan penghuni' }); }
  };

  const handleCheckout = async (tanggal_keluar: string) => {
    if (!selectedTenant) return;
    try {
      await checkoutMutation.mutateAsync({ id: selectedTenant.id, tanggal_keluar });
      setCheckoutOpen(false);
      setSelectedTenant(null);
      toast({ title: 'Checkout berhasil' });
    } catch { toast({ variant: 'destructive', title: 'Gagal checkout' }); }
  };

  const openCheckout = (t: Tenant) => {
    setSelectedTenant(t);
    setCheckoutOpen(true);
  };

  const formatDate = (d: string) => {
    try { return format(new Date(d), 'dd MMM yyyy', { locale: localeId }); }
    catch { return d; }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Penghuni</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Data penghuni dan histori hunian</p>
        </div>
        <Button onClick={() => setFormOpen(true)} className="shrink-0 gap-2 rounded-xl">
          <Plus className="h-4 w-4" /> Tambah Penghuni
        </Button>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-3">
        <Select value={propertyFilter} onValueChange={(v) => { setPropertyFilter(v); setPage(1); }}>
          <SelectTrigger className="w-[200px] rounded-xl h-10">
            <SelectValue placeholder="Semua properti" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value=" ">Semua properti</SelectItem>
            {properties.map((p: any) => (
              <SelectItem key={p.id} value={p.id}>{p.nama}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Tabs + Table */}
      <Tabs value={tab} onValueChange={(v) => { setTab(v); setPage(1); }}>
        <TabsList className="rounded-xl">
          <TabsTrigger value="active" className="rounded-lg gap-2"><Users className="h-4 w-4" /> Penghuni Aktif</TabsTrigger>
          <TabsTrigger value="history" className="rounded-lg gap-2"><History className="h-4 w-4" /> Histori</TabsTrigger>
        </TabsList>

        <TabsContent value={tab} className="mt-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-16 gap-2 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" /> <span className="text-sm">Memuat...</span>
            </div>
          ) : (
            <div className="glass-table overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gradient-to-r from-muted/80 to-muted/40 border-b-0">
                    <TableHead className="font-semibold text-xs uppercase">Nama</TableHead>
                    <TableHead className="font-semibold text-xs uppercase">Kamar</TableHead>
                    <TableHead className="font-semibold text-xs uppercase">Properti</TableHead>
                    <TableHead className="font-semibold text-xs uppercase">Tanggal Masuk</TableHead>
                    <TableHead className="font-semibold text-xs uppercase text-right">Durasi</TableHead>
                    {!isActive && <TableHead className="font-semibold text-xs uppercase">Tanggal Keluar</TableHead>}
                    <TableHead className="font-semibold text-xs uppercase text-right">Status</TableHead>
                    {isActive && <TableHead className="font-semibold text-xs uppercase text-right">Aksi</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tenants.length === 0 ? (
                    <TableRow><TableCell colSpan={isActive ? 8 : 8} className="h-32 text-center text-muted-foreground">
                      {isActive ? 'Belum ada penghuni aktif.' : 'Belum ada histori penghuni.'}
                    </TableCell></TableRow>
                  ) : tenants.map((t) => (
                    <TableRow key={t.id} className="group hover:bg-primary/5 transition-colors">
                      <TableCell className="text-sm font-medium">{t.nama}</TableCell>
                      <TableCell className="text-sm">{t.nomor_kamar}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{t.nama_properti}</TableCell>
                      <TableCell className="text-sm">{formatDate(t.tanggal_masuk)}</TableCell>
                      <TableCell className="text-sm text-right">{t.durasi_sewa} bln</TableCell>
                      {!isActive && <TableCell className="text-sm">{t.tanggal_keluar ? formatDate(t.tanggal_keluar) : '—'}</TableCell>}
                      <TableCell className="text-right">
                        <Badge variant={t.status === 'active' ? 'default' : 'secondary'} className="rounded-full">
                          {t.status === 'active' ? 'Aktif' : 'Checkout'}
                        </Badge>
                      </TableCell>
                      {isActive && (
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-xs rounded-lg" onClick={() => openCheckout(t)}>
                            <LogOut className="h-3.5 w-3.5" /> Checkout
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-between text-sm text-muted-foreground pt-2">
              <span>{(page-1)*limit+1}–{Math.min(page*limit, total)} dari {total}</span>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full" disabled={page <= 1} onClick={() => setPage(p => p-1)}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-xs tabular-nums">{page}/{totalPages}</span>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full" disabled={page >= totalPages} onClick={() => setPage(p => p+1)}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Create form modal */}
      {formOpen && (
        <TenantForm
          open={formOpen}
          onOpenChange={setFormOpen}
          onSubmit={handleCreate}
          isLoading={createMutation.isPending}
        />
      )}

      {/* Checkout form modal */}
      {checkoutOpen && selectedTenant && (
        <CheckoutForm
          open={checkoutOpen}
          onOpenChange={setCheckoutOpen}
          tenantName={selectedTenant.nama}
          roomNumber={selectedTenant.nomor_kamar}
          onSubmit={handleCheckout}
          isLoading={checkoutMutation.isPending}
        />
      )}
    </div>
  );
}
