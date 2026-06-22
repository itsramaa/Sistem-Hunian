import React, { useState } from 'react';
import {
  useConfirmations,
  useCreateConfirmation,
  useConfirmDP,
  useExpireConfirmation,
} from '../hooks/useConfirmations';
import { useProperties } from '@/features/properties/hooks/useProperties';
import { useRooms } from '@/features/rooms/hooks/useRooms';
import { Confirmation, ConfirmDPPayload, CreateConfirmationPayload } from '../types';
import { Button } from '@/shared/components/ui/button';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/shared/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/shared/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/shared/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/shared/components/ui/alert-dialog';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import {
  Plus, Loader2, Clock, ChevronLeft, ChevronRight, CheckCircle2, XCircle,
} from 'lucide-react';
import { useToast } from '@/shared/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format, differenceInDays } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { DataCard } from '@/shared/components/DataCard';
import { useIsMobile } from '@/shared/hooks/useBreakpoint';

const statusColors: Record<string, { label: string; className: string }> = {
  pending: {
    label: 'Menunggu',
    className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  },
  confirmed: {
    label: 'Dikonfirmasi',
    className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  },
  expired: {
    label: 'Expired',
    className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  },
};

const createSchema = z.object({
  room_id: z.string().min(1, 'Pilih kamar'),
  nama_calon_penghuni: z.string().min(2).max(255),
  nominal_dp: z.coerce.number().positive('Nominal harus > 0'),
  batas_tanggal_konfirmasi: z.string().min(1, 'Tanggal wajib'),
});

const confirmSchema = z.object({
  nama: z.string().min(2).max(255),
  nomor_identitas: z.string().min(1).max(100),
  nomor_telepon: z.string().min(1).max(30),
  tanggal_masuk: z.string().min(1),
  durasi_sewa: z.coerce.number().int().positive(),
});

type CreateForm = z.infer<typeof createSchema>;
type ConfirmForm = z.infer<typeof confirmSchema>;

// ─── Tandai Hangus — AlertDialog standar (BUG-005 fix) ───────────────────────
function ExpireButton({ id, nama }: { id: string; nama: string }) {
  const expireMutation = useExpireConfirmation();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);

  const handleExpire = async () => {
    try {
      await expireMutation.mutateAsync(id);
      toast({ title: `DP ${nama} berhasil ditandai hangus` });
    } catch {
      toast({ variant: 'destructive', title: 'Gagal menghanguskan DP' });
    }
    setOpen(false);
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="h-8 gap-1.5 text-xs rounded-lg text-destructive border-destructive/30 hover:bg-destructive/5"
        onClick={() => setOpen(true)}
      >
        <XCircle className="h-3.5 w-3.5" /> Tandai Hangus
      </Button>

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tandai DP Hangus?</AlertDialogTitle>
            <AlertDialogDescription>
              DP atas nama <strong>{nama}</strong> akan ditandai hangus. Kamar akan
              dikembalikan ke status tersedia. Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={expireMutation.isPending}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleExpire}
              disabled={expireMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {expireMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Ya, Hanguskan
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export default function ConfirmationsPage() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [propertyFilter, setPropertyFilter] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState<Confirmation | null>(null);
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const limit = 20;

  const { data, isLoading } = useConfirmations(
    page, limit, statusFilter || undefined, propertyFilter || undefined
  );
  const { data: propsData } = useProperties('', 1, 100);
  const { data: roomsData } = useRooms('', 1, 200, propertyFilter || undefined, 'available');

  const createMutation = useCreateConfirmation();
  const confirmMutation = useConfirmDP();

  const confirmations: Confirmation[] = data?.confirmations ?? [];
  const total = data?.pagination?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const properties = propsData?.properties ?? [];
  const rooms = roomsData?.rooms ?? [];

  const createForm = useForm<CreateForm>({ resolver: zodResolver(createSchema) });
  const confirmForm = useForm<ConfirmForm>({ resolver: zodResolver(confirmSchema) });

  const handleCreate = async (payload: CreateForm) => {
    try {
      await createMutation.mutateAsync(payload as CreateConfirmationPayload);
      setCreateOpen(false);
      createForm.reset();
      toast({ title: 'Konfirmasi DP berhasil dicatat' });
    } catch {
      toast({ variant: 'destructive', title: 'Gagal mencatat konfirmasi DP' });
    }
  };

  const handleConfirm = async (payload: ConfirmForm) => {
    if (!confirmTarget) return;
    try {
      await confirmMutation.mutateAsync({ id: confirmTarget.id, payload: payload as ConfirmDPPayload });
      setConfirmTarget(null);
      confirmForm.reset();
      toast({ title: 'Penghuni berhasil dikonfirmasi masuk' });
    } catch {
      toast({ variant: 'destructive', title: 'Gagal konfirmasi' });
    }
  };

  const fmt = (d: string) => {
    try { return format(new Date(d), 'dd MMM yyyy', { locale: localeId }); }
    catch { return d; }
  };

  const sisaHari = (d: string) => {
    try { return differenceInDays(new Date(d), new Date()); }
    catch { return null; }
  };

  const Pagination = () => totalPages > 1 ? (
    <div className="flex items-center justify-between text-sm text-muted-foreground">
      <span>{(page - 1) * limit + 1}–{Math.min(page * limit, total)} dari {total}</span>
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-xs">{page}/{totalPages}</span>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  ) : null;

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Konfirmasi DP</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Kelola konfirmasi down payment calon penghuni</p>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="shrink-0 gap-2 rounded-xl">
          <Plus className="h-4 w-4" /> Catat Konfirmasi DP
        </Button>
      </div>

      <div className="flex flex-wrap gap-3">
        <Select value={propertyFilter || '_all'} onValueChange={v => { setPropertyFilter(v === '_all' ? '' : v); setPage(1); }}>
          <SelectTrigger className="w-[180px] rounded-xl h-10"><SelectValue placeholder="Semua properti" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="_all">Semua properti</SelectItem>
            {properties.map((p: any) => <SelectItem key={p.id} value={p.id}>{p.nama}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={statusFilter || '_all'} onValueChange={v => { setStatusFilter(v === '_all' ? '' : v); setPage(1); }}>
          <SelectTrigger className="w-[150px] rounded-xl h-10"><SelectValue placeholder="Semua status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="_all">Semua status</SelectItem>
            <SelectItem value="pending">Menunggu</SelectItem>
            <SelectItem value="confirmed">Dikonfirmasi</SelectItem>
            <SelectItem value="expired">Expired</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16 gap-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" /><span className="text-sm">Memuat...</span>
        </div>
      ) : isMobile ? (
        <div className="space-y-3">
          {confirmations.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-16">Belum ada konfirmasi DP.</p>
          ) : confirmations.map(c => {
            const sc = statusColors[c.status] || { label: c.status, className: '' };
            const sisa = sisaHari(c.batas_tanggal_konfirmasi);
            const isExpired = sisa !== null && sisa < 0;
            return (
              <DataCard key={c.id}
                header={
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-sm">{c.nomor_kamar} · {c.nama_calon_penghuni}</p>
                      <p className="text-xs text-muted-foreground">{fmt(c.batas_tanggal_konfirmasi)}</p>
                    </div>
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${sc.className}`}>{sc.label}</span>
                  </div>
                }
                fields={[
                  { label: 'Nominal DP', value: `Rp${c.nominal_dp.toLocaleString('id-ID')}` },
                  { label: 'Sisa Hari', value: sisa !== null ? (isExpired ? 'Expired' : `${sisa} hari`) : '—' },
                ]}
                actions={c.status === 'pending' ? (
                  <div className="flex gap-1.5 flex-wrap">
                    <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs rounded-lg min-h-[44px]"
                      onClick={() => { setConfirmTarget(c); confirmForm.reset({ nama: c.nama_calon_penghuni, nomor_identitas: '', nomor_telepon: '', tanggal_masuk: '', durasi_sewa: 1 }); }}>
                      <CheckCircle2 className="h-3.5 w-3.5 text-green-600" /> Konfirmasi Masuk
                    </Button>
                    <ExpireButton id={c.id} nama={c.nama_calon_penghuni} />
                  </div>
                ) : undefined}
              />
            );
          })}
          <Pagination />
        </div>
      ) : (
        <>
          <div className="glass-table overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gradient-to-r from-muted/80 to-muted/40 border-b-0">
                  <TableHead className="font-semibold text-xs uppercase">Kamar</TableHead>
                  <TableHead className="font-semibold text-xs uppercase">Calon Penghuni</TableHead>
                  <TableHead className="font-semibold text-xs uppercase text-right">Nominal DP</TableHead>
                  <TableHead className="font-semibold text-xs uppercase">Batas Tanggal</TableHead>
                  <TableHead className="font-semibold text-xs uppercase text-center">Sisa Hari</TableHead>
                  <TableHead className="font-semibold text-xs uppercase">Status</TableHead>
                  <TableHead className="font-semibold text-xs uppercase text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {confirmations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">Belum ada konfirmasi DP.</TableCell>
                  </TableRow>
                ) : confirmations.map(c => {
                  const sc = statusColors[c.status] || { label: c.status, className: '' };
                  const sisa = sisaHari(c.batas_tanggal_konfirmasi);
                  const isExpired = sisa !== null && sisa < 0;
                  return (
                    <TableRow key={c.id} className="hover:bg-primary/5 transition-colors">
                      <TableCell className="text-sm font-medium">{c.nomor_kamar}</TableCell>
                      <TableCell className="text-sm">{c.nama_calon_penghuni}</TableCell>
                      <TableCell className="text-sm font-medium tabular-nums text-right">Rp{c.nominal_dp.toLocaleString('id-ID')}</TableCell>
                      <TableCell className="text-sm">{fmt(c.batas_tanggal_konfirmasi)}</TableCell>
                      <TableCell className="text-center">
                        {sisa !== null ? (
                          <span className={`text-sm font-medium tabular-nums ${isExpired ? 'text-destructive' : sisa <= 3 ? 'text-warning' : 'text-foreground'}`}>
                            {isExpired ? 'Expired' : `${sisa} hari`}
                          </span>
                        ) : '—'}
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${sc.className}`}>{sc.label}</span>
                      </TableCell>
                      <TableCell className="text-right">
                        {c.status === 'pending' && (
                          <div className="flex items-center justify-end gap-1.5 flex-wrap">
                            <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs rounded-lg"
                              onClick={() => { setConfirmTarget(c); confirmForm.reset({ nama: c.nama_calon_penghuni, nomor_identitas: '', nomor_telepon: '', tanggal_masuk: '', durasi_sewa: 1 }); }}>
                              <CheckCircle2 className="h-3.5 w-3.5 text-green-600" /> Konfirmasi Masuk
                            </Button>
                            <ExpireButton id={c.id} nama={c.nama_calon_penghuni} />
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
          <Pagination />
        </>
      )}

      {/* Create DP modal */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-lg rounded-2xl">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Clock className="h-5 w-5 text-primary" />
              </div>
              <div>
                <DialogTitle>Catat Konfirmasi DP</DialogTitle>
                <p className="text-sm text-muted-foreground">Kamar berstatus available</p>
              </div>
            </div>
          </DialogHeader>
          <form onSubmit={createForm.handleSubmit(handleCreate)} className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Kamar Tersedia</Label>
              <Select onValueChange={v => createForm.setValue('room_id', v)}>
                <SelectTrigger className="rounded-xl h-12"><SelectValue placeholder="Pilih kamar" /></SelectTrigger>
                <SelectContent>
                  {rooms.map((r: any) => <SelectItem key={r.id} value={r.id}>{r.nomor_kamar} — {r.nama_properti}</SelectItem>)}
                </SelectContent>
              </Select>
              {createForm.formState.errors.room_id && <p className="text-sm text-destructive">{createForm.formState.errors.room_id.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Nama Calon Penghuni</Label>
              <Input placeholder="Sari Dewi" {...createForm.register('nama_calon_penghuni')} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Nominal DP (Rp)</Label>
                <Input type="number" min={0} placeholder="600000" {...createForm.register('nominal_dp')} />
              </div>
              <div className="space-y-2">
                <Label>Batas Tanggal</Label>
                <Input type="date" {...createForm.register('batas_tanggal_konfirmasi')} />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>Batal</Button>
              <Button type="submit" disabled={createMutation.isPending} className="gap-2 rounded-xl">
                {createMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />} Catat DP
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Konfirmasi masuk modal */}
      <Dialog open={!!confirmTarget} onOpenChange={v => !v && setConfirmTarget(null)}>
        <DialogContent className="sm:max-w-lg rounded-2xl">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <DialogTitle>Konfirmasi Masuk</DialogTitle>
                <p className="text-sm text-muted-foreground">{confirmTarget?.nama_calon_penghuni} — Kamar {confirmTarget?.nomor_kamar}</p>
              </div>
            </div>
          </DialogHeader>
          <form onSubmit={confirmForm.handleSubmit(handleConfirm)} className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Nama Lengkap</Label>
              <Input defaultValue={confirmTarget?.nama_calon_penghuni} {...confirmForm.register('nama')} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>No. Identitas</Label>
                <Input placeholder="3271..." {...confirmForm.register('nomor_identitas')} />
              </div>
              <div className="space-y-2">
                <Label>No. Telepon</Label>
                <Input placeholder="0812..." {...confirmForm.register('nomor_telepon')} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Tanggal Masuk</Label>
                <Input type="date" {...confirmForm.register('tanggal_masuk')} />
              </div>
              <div className="space-y-2">
                <Label>Durasi (bulan)</Label>
                <Input type="number" min={1} placeholder="6" {...confirmForm.register('durasi_sewa')} />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setConfirmTarget(null)}>Batal</Button>
              <Button type="submit" disabled={confirmMutation.isPending} className="gap-2 rounded-xl">
                {confirmMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />} Konfirmasi Masuk
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
