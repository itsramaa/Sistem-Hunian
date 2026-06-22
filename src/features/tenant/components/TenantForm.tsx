import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/shared/components/ui/dialog';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { Loader2, Users } from 'lucide-react';
import { useProperties } from '@/features/properties/hooks/useProperties';
import { useRooms } from '@/features/rooms/hooks/useRooms';

const createSchema = z.object({
  room_id: z.string().min(1, 'Pilih kamar'),
  nama: z.string().min(2, 'Nama minimal 2 karakter').max(255),
  nomor_identitas: z.string().min(1, 'Nomor identitas wajib').max(100),
  nomor_telepon: z.string().min(1, 'Nomor telepon wajib').max(30),
  tanggal_masuk: z.string().min(1, 'Tanggal masuk wajib'),
  durasi_sewa: z.coerce.number().int().positive('Durasi harus > 0'),
});

const editSchema = z.object({
  nomor_identitas: z.string().min(1, 'Nomor identitas wajib').max(100),
  nomor_telepon: z.string().min(1, 'Nomor telepon wajib').max(30),
});

type CreateFormData = z.infer<typeof createSchema>;
type EditFormData = z.infer<typeof editSchema>;

interface TenantFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: any) => Promise<void>;
  isLoading: boolean;
  initialData?: {
    nomor_identitas: string;
    nomor_telepon: string;
  };
}

export function TenantForm({ open, onOpenChange, onSubmit, isLoading, initialData }: TenantFormProps) {
  const isEdit = !!initialData;

  const { data: propsData } = useProperties('', 1, 100);
  const properties = propsData?.properties ?? [];
  const [selectedProp, setSelectedProp] = React.useState('');

  const { data: roomsData } = useRooms('', 1, 200, selectedProp || undefined, 'available');
  const availableRooms = roomsData?.rooms ?? [];

  const createForm = useForm<CreateFormData>({
    resolver: zodResolver(createSchema),
    defaultValues: { room_id: '', nama: '', nomor_identitas: '', nomor_telepon: '', tanggal_masuk: '', durasi_sewa: 1 },
  });

  const editForm = useForm<EditFormData>({
    resolver: zodResolver(editSchema),
    defaultValues: { nomor_identitas: '', nomor_telepon: '' },
  });

  useEffect(() => {
    if (open) {
      if (isEdit && initialData) {
        editForm.reset({ nomor_identitas: initialData.nomor_identitas, nomor_telepon: initialData.nomor_telepon });
      } else {
        createForm.reset({ room_id: '', nama: '', nomor_identitas: '', nomor_telepon: '', tanggal_masuk: '', durasi_sewa: 1 });
        setSelectedProp('');
      }
    }
  }, [open, isEdit]);

  if (isEdit) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <DialogTitle>Edit Data Penghuni</DialogTitle>
                <p className="text-sm text-muted-foreground mt-0.5">Ubah data kontak penghuni</p>
              </div>
            </div>
          </DialogHeader>
          <form onSubmit={editForm.handleSubmit(onSubmit)} className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="nomor_identitas">No. Identitas</Label>
              <Input id="nomor_identitas" placeholder="3271..." disabled={isLoading} {...editForm.register('nomor_identitas')} />
              {editForm.formState.errors.nomor_identitas && (
                <p className="text-sm text-destructive">{editForm.formState.errors.nomor_identitas.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="nomor_telepon">No. Telepon</Label>
              <Input id="nomor_telepon" placeholder="0812..." disabled={isLoading} {...editForm.register('nomor_telepon')} />
              {editForm.formState.errors.nomor_telepon && (
                <p className="text-sm text-destructive">{editForm.formState.errors.nomor_telepon.message}</p>
              )}
            </div>
            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>Batal</Button>
              <Button type="submit" disabled={isLoading} className="gap-2 rounded-xl">
                {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                Simpan
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg rounded-2xl">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle>Tambah Penghuni</DialogTitle>
              <p className="text-sm text-muted-foreground mt-0.5">Masukkan data penghuni baru</p>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={createForm.handleSubmit(onSubmit)} className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Properti</Label>
            <Select value={selectedProp} onValueChange={(v) => { setSelectedProp(v); createForm.setValue('room_id', ''); }}>
              <SelectTrigger className="rounded-xl h-12"><SelectValue placeholder="Pilih properti" /></SelectTrigger>
              <SelectContent>
                {properties.map((p: any) => (
                  <SelectItem key={p.id} value={p.id}>{p.nama}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="room_id">Kamar Tersedia</Label>
            <Select disabled={!selectedProp || isLoading} onValueChange={(v) => createForm.setValue('room_id', v)}>
              <SelectTrigger id="room_id" className="rounded-xl h-12">
                <SelectValue placeholder={selectedProp ? 'Pilih kamar' : 'Pilih properti dulu'} />
              </SelectTrigger>
              <SelectContent>
                {availableRooms.map((r: any) => (
                  <SelectItem key={r.id} value={r.id}>{r.nomor_kamar} — Rp{r.harga_sewa?.toLocaleString('id-ID')}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {createForm.formState.errors.room_id && <p className="text-sm text-destructive">{createForm.formState.errors.room_id.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="nama">Nama</Label>
            <Input id="nama" placeholder="Budi Santoso" disabled={isLoading} {...createForm.register('nama')} />
            {createForm.formState.errors.nama && <p className="text-sm text-destructive">{createForm.formState.errors.nama.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="nomor_identitas">No. Identitas</Label>
              <Input id="nomor_identitas" placeholder="3271..." disabled={isLoading} {...createForm.register('nomor_identitas')} />
              {createForm.formState.errors.nomor_identitas && <p className="text-sm text-destructive">{createForm.formState.errors.nomor_identitas.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="nomor_telepon">No. Telepon</Label>
              <Input id="nomor_telepon" placeholder="0812..." disabled={isLoading} {...createForm.register('nomor_telepon')} />
              {createForm.formState.errors.nomor_telepon && <p className="text-sm text-destructive">{createForm.formState.errors.nomor_telepon.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="tanggal_masuk">Tanggal Masuk</Label>
              <Input id="tanggal_masuk" type="date" disabled={isLoading} {...createForm.register('tanggal_masuk')} />
              {createForm.formState.errors.tanggal_masuk && <p className="text-sm text-destructive">{createForm.formState.errors.tanggal_masuk.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="durasi_sewa">Durasi (bulan)</Label>
              <Input id="durasi_sewa" type="number" min={1} placeholder="6" disabled={isLoading} {...createForm.register('durasi_sewa')} />
              {createForm.formState.errors.durasi_sewa && <p className="text-sm text-destructive">{createForm.formState.errors.durasi_sewa.message}</p>}
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>Batal</Button>
            <Button type="submit" disabled={isLoading} className="gap-2 rounded-xl">
              {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              Tambah Penghuni
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
