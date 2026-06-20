import React, { useState } from 'react';

import {
  useMaintenances,
  useCreateMaintenance,
  useUpdateMaintenance,
} from '../hooks/useMaintenance';

import { useProperties } from '@/features/properties/hooks/useProperties';

import { useRooms } from '@/features/rooms/hooks/useRooms';

import {
  Maintenance,
  CreateMaintenancePayload,
  UpdateMaintenancePayload,
} from '../types';

import { Button } from '@/shared/components/ui/button';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/components/ui/table';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/shared/components/ui/dialog';

import { Input } from '@/shared/components/ui/input';

import { Label } from '@/shared/components/ui/label';

import { Textarea } from '@/shared/components/ui/textarea';

import {
  Plus,
  Loader2,
  Wrench,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';

import { useToast } from '@/shared/hooks/use-toast';

import { useForm } from 'react-hook-form';

import { zodResolver } from '@hookform/resolvers/zod';

import { z } from 'zod';

import { format } from 'date-fns';

import { id as localeId } from 'date-fns/locale';

import { DataCard } from '@/shared/components/DataCard';

import { useIsMobile } from '@/shared/hooks/useBreakpoint';

import { EmptyState } from '@/shared/components/ui/EmptyState';

const statusColors: Record<string, { label: string; className: string }> = {
  reported: {
    label: 'Dilaporkan',

    className:
      'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  },

  in_progress: {
    label: 'Diproses',

    className:
      'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  },

  completed: {
    label: 'Selesai',

    className:
      'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  },
};

const createSchema = z.object({
  room_id: z.string().min(1, 'Pilih kamar'),

  tanggal_laporan: z.string().min(1),

  deskripsi_kerusakan: z.string().min(5, 'Deskripsi minimal 5 karakter'),
});

const updateSchema = z.object({
  tindakan_penanganan: z.string().optional(),

  biaya: z.coerce.number().min(0).optional(),

  status: z.enum(['reported', 'in_progress', 'completed']),
});

type CreateForm = z.infer<typeof createSchema>;

type UpdateForm = z.infer<typeof updateSchema>;

export default function MaintenancePage() {
  const [page, setPage] = useState(1);

  const [statusFilter, setStatusFilter] = useState('');

  const [propertyFilter, setPropertyFilter] = useState('');

  const [createOpen, setCreateOpen] = useState(false);

  const [updateTarget, setUpdateTarget] = useState<Maintenance | null>(null);

  const { toast } = useToast();

  const isMobile = useIsMobile();

  const limit = 20;

  const { data, isLoading } = useMaintenances(
    page,

    limit,

    statusFilter || undefined,

    propertyFilter || undefined
  );

  const { data: propsData } = useProperties('', 1, 100);

  const { data: roomsData } = useRooms('', 1, 200, propertyFilter || undefined);

  const createMutation = useCreateMaintenance();

  const updateMutation = useUpdateMaintenance();

  const maintenances: Maintenance[] = data?.maintenances ?? [];

  const total = data?.pagination?.total ?? 0;

  const totalPages = Math.max(1, Math.ceil(total / limit));

  const properties = propsData?.properties ?? [];

  const rooms = roomsData?.rooms ?? [];

  const getToday = () => format(new Date(), 'yyyy-MM-dd');

  const createForm = useForm<CreateForm>({
    resolver: zodResolver(createSchema),

    defaultValues: {
      room_id: '',

      tanggal_laporan: getToday(),

      deskripsi_kerusakan: '',
    },
  });

  const updateForm = useForm<UpdateForm>({
    resolver: zodResolver(updateSchema),

    defaultValues: { tindakan_penanganan: '', biaya: 0, status: 'reported' },
  });

  const handleCreate = async (payload: CreateForm) => {
    try {
      await createMutation.mutateAsync(payload as CreateMaintenancePayload);

      setCreateOpen(false);

      createForm.reset({ tanggal_laporan: getToday() });

      toast({ title: 'Laporan maintenance berhasil dicatat' });
    } catch {
      toast({ variant: 'destructive', title: 'Gagal mencatat maintenance' });
    }
  };

  const handleUpdate = async (payload: UpdateForm) => {
    if (!updateTarget) return;

    try {
      await updateMutation.mutateAsync({
        id: updateTarget.id,

        payload: payload as UpdateMaintenancePayload,
      });

      setUpdateTarget(null);

      toast({ title: 'Progress maintenance berhasil diupdate' });
    } catch {
      toast({ variant: 'destructive', title: 'Gagal update maintenance' });
    }
  };

  const openUpdate = (m: Maintenance) => {
    setUpdateTarget(m);

    updateForm.reset({
      tindakan_penanganan: m.tindakan_penanganan || '',

      biaya: m.biaya || 0,

      status: m.status,
    });
  };

  const fmt = (d: string) => {
    try {
      return format(new Date(d), 'dd MMM yyyy', { locale: localeId });
    } catch {
      return d;
    }
  };

  const Pagination = () =>
    totalPages > 1 ? (
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          {(page - 1) * limit + 1}–{Math.min(page * limit, total)} dari {total}
        </span>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 rounded-full"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <span className="text-xs">
            {page}/{totalPages}
          </span>

          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 rounded-full"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    ) : null;

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Maintenance</h1>

          <p className="text-sm text-muted-foreground mt-0.5">
            Laporan dan histori maintenance kamar
          </p>
        </div>

        <Button
          onClick={() => setCreateOpen(true)}
          className="shrink-0 gap-2 rounded-xl min-h-[44px]"
        >
          <Plus className="h-4 w-4" /> Buat Laporan
        </Button>
      </div>

      <div className="flex flex-wrap gap-3 overflow-x-auto pb-1">
        <Select
          value={propertyFilter}
          onValueChange={(v) => {
            setPropertyFilter(v);

            setPage(1);
          }}
        >
          <SelectTrigger className="w-[160px] rounded-xl h-10 shrink-0">
            <SelectValue placeholder="Semua properti" />
          </SelectTrigger>

          <SelectContent>
            <SelectItem value=" ">Semua properti</SelectItem>

            {properties.map((p: any) => (
              <SelectItem key={p.id} value={p.id}>
                {p.nama}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={statusFilter}
          onValueChange={(v) => {
            setStatusFilter(v);

            setPage(1);
          }}
        >
          <SelectTrigger className="w-[140px] rounded-xl h-10 shrink-0">
            <SelectValue placeholder="Semua status" />
          </SelectTrigger>

          <SelectContent>
            <SelectItem value=" ">Semua status</SelectItem>

            <SelectItem value="reported">Dilaporkan</SelectItem>

            <SelectItem value="in_progress">Diproses</SelectItem>

            <SelectItem value="completed">Selesai</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16 gap-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />

          <span className="text-sm">Memuat...</span>
        </div>
      ) : maintenances.length === 0 ? (
        <EmptyState
          icon={Wrench}
          title="Belum ada laporan maintenance"
          description="Buat laporan kerusakan kamar baru."
          action={{
            label: 'Buat Laporan',

            onClick: () => setCreateOpen(true),

            icon: Plus,
          }}
        />
      ) : isMobile ? (
        /* Mobile: Card view */

        <div className="space-y-3">
          {maintenances.map((m) => {
            const sc = statusColors[m.status] || {
              label: m.status,

              className: '',
            };

            return (
              <DataCard
                key={m.id}
                header={
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-sm">
                        {m.nomor_kamar || '—'} · {m.nama_properti || '—'}
                      </p>

                      <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                        {m.deskripsi_kerusakan}
                      </p>
                    </div>

                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium shrink-0 ${sc.className}`}
                    >
                      {sc.label}
                    </span>
                  </div>
                }
                fields={[
                  { label: 'Tgl Laporan', value: fmt(m.tanggal_laporan) },

                  {
                    label: 'Biaya',

                    value: m.biaya
                      ? `Rp${m.biaya.toLocaleString('id-ID')}`
                      : undefined,
                  },
                ]}
                actions={
                  m.status !== 'completed' ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-9 gap-1.5 text-xs rounded-lg min-h-[44px]"
                      onClick={() => openUpdate(m)}
                    >
                      <RefreshCw className="h-3.5 w-3.5" /> Update
                    </Button>
                  ) : undefined
                }
              />
            );
          })}

          <Pagination />
        </div>
      ) : (
        /* Desktop: Table view */

        <>
          <div className="glass-table overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gradient-to-r from-muted/80 to-muted/40 border-b-0">
                  <TableHead className="font-semibold text-xs uppercase">
                    Kamar
                  </TableHead>

                  <TableHead className="font-semibold text-xs uppercase">
                    Properti
                  </TableHead>

                  <TableHead className="font-semibold text-xs uppercase">
                    Deskripsi
                  </TableHead>

                  <TableHead className="font-semibold text-xs uppercase">
                    Tgl Laporan
                  </TableHead>

                  <TableHead className="font-semibold text-xs uppercase text-right">
                    Biaya
                  </TableHead>

                  <TableHead className="font-semibold text-xs uppercase">
                    Status
                  </TableHead>

                  <TableHead className="font-semibold text-xs uppercase text-right">
                    Aksi
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {maintenances.map((m) => {
                  const sc = statusColors[m.status] || {
                    label: m.status,

                    className: '',
                  };

                  return (
                    <TableRow
                      key={m.id}
                      className="hover:bg-primary/5 transition-colors"
                    >
                      <TableCell className="text-sm font-medium">
                        {m.nomor_kamar || '—'}
                      </TableCell>

                      <TableCell className="text-sm text-muted-foreground">
                        {m.nama_properti || '—'}
                      </TableCell>

                      <TableCell className="text-sm max-w-[200px] truncate">
                        {m.deskripsi_kerusakan}
                      </TableCell>

                      <TableCell className="text-sm">
                        {fmt(m.tanggal_laporan)}
                      </TableCell>

                      <TableCell className="text-sm tabular-nums text-right">
                        {m.biaya ? `Rp${m.biaya.toLocaleString('id-ID')}` : '—'}
                      </TableCell>

                      <TableCell>
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${sc.className}`}
                        >
                          {sc.label}
                        </span>
                      </TableCell>

                      <TableCell className="text-right">
                        {m.status !== 'completed' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 gap-1.5 text-xs rounded-lg"
                            onClick={() => openUpdate(m)}
                          >
                            <RefreshCw className="h-3.5 w-3.5" /> Update
                          </Button>
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

      {/* Create modal */}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-lg rounded-2xl">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Wrench className="h-5 w-5 text-primary" />
              </div>

              <div>
                <DialogTitle>Buat Laporan Maintenance</DialogTitle>

                <p className="text-sm text-muted-foreground">
                  Laporan kerusakan kamar
                </p>
              </div>
            </div>
          </DialogHeader>

          <form
            onSubmit={createForm.handleSubmit(handleCreate)}
            className="space-y-4 py-2"
          >
            <div className="space-y-2">
              <Label>Kamar</Label>

              <Select onValueChange={(v) => createForm.setValue('room_id', v)}>
                <SelectTrigger className="rounded-xl h-12">
                  <SelectValue placeholder="Pilih kamar" />
                </SelectTrigger>

                <SelectContent>
                  {rooms.map((r: any) => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.nomor_kamar} — {r.nama_properti}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {createForm.formState.errors.room_id && (
                <p className="text-sm text-destructive">
                  {createForm.formState.errors.room_id.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Tanggal Laporan</Label>

              <Input type="date" {...createForm.register('tanggal_laporan')} />
            </div>

            <div className="space-y-2">
              <Label>Deskripsi Kerusakan</Label>

              <Textarea
                placeholder="Kebocoran atap lantai 2..."
                rows={3}
                {...createForm.register('deskripsi_kerusakan')}
              />

              {createForm.formState.errors.deskripsi_kerusakan && (
                <p className="text-sm text-destructive">
                  {createForm.formState.errors.deskripsi_kerusakan.message}
                </p>
              )}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setCreateOpen(false)}
              >
                Batal
              </Button>

              <Button
                type="submit"
                disabled={createMutation.isPending}
                className="gap-2 rounded-xl"
              >
                {createMutation.isPending && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}{' '}
                Buat Laporan
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Update modal */}

      <Dialog
        open={!!updateTarget}
        onOpenChange={(v) => !v && setUpdateTarget(null)}
      >
        <DialogContent className="sm:max-w-lg rounded-2xl">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                <RefreshCw className="h-5 w-5 text-blue-600" />
              </div>

              <div>
                <DialogTitle>Update Progress</DialogTitle>

                <p className="text-sm text-muted-foreground">
                  {updateTarget?.nomor_kamar} —{' '}
                  {updateTarget?.deskripsi_kerusakan?.slice(0, 40)}
                </p>
              </div>
            </div>
          </DialogHeader>

          <form
            onSubmit={updateForm.handleSubmit(handleUpdate)}
            className="space-y-4 py-2"
          >
            <div className="space-y-2">
              <Label>Status</Label>

              <Select
                value={updateForm.watch('status')}
                onValueChange={(v) => updateForm.setValue('status', v as any)}
              >
                <SelectTrigger className="rounded-xl h-12">
                  <SelectValue />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="reported">Dilaporkan</SelectItem>

                  <SelectItem value="in_progress">Diproses</SelectItem>

                  <SelectItem value="completed">Selesai</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Tindakan Penanganan (opsional)</Label>

              <Textarea
                placeholder="Tambal dengan sealant waterproof..."
                rows={2}
                {...updateForm.register('tindakan_penanganan')}
              />
            </div>

            <div className="space-y-2">
              <Label>Biaya (Rp, opsional)</Label>

              <Input
                type="number"
                min={0}
                placeholder="250000"
                {...updateForm.register('biaya')}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setUpdateTarget(null)}
              >
                Batal
              </Button>

              <Button
                type="submit"
                disabled={updateMutation.isPending}
                className="gap-2 rounded-xl"
              >
                {updateMutation.isPending && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}{' '}
                Simpan
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
