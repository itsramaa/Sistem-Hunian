import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/shared/components/ui/dialog';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { Loader2, BedDouble } from 'lucide-react';
import { useProperties } from '@/features/properties/hooks/useProperties';
import { Room } from '../types';

const roomSchema = z.object({
  property_id: z.string().min(1, 'Pilih properti'),
  nomor_kamar: z.string().min(1, 'Nomor kamar wajib diisi').max(50),
  tipe_kamar: z.string().min(1, 'Tipe kamar wajib diisi').max(100),
  harga_sewa: z.coerce.number().positive('Harga sewa harus lebih dari 0'),
});

type FormData = z.infer<typeof roomSchema>;

interface RoomFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  room: Room | null;
  onSubmit: (data: FormData) => Promise<void>;
  isLoading: boolean;
}

export function RoomForm({ open, onOpenChange, room, onSubmit, isLoading }: RoomFormProps) {
  const isEdit = !!room;
  const { data: propsData } = useProperties('', 1, 100);
  const properties = propsData?.properties ?? [];

  const { register, handleSubmit, control, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(roomSchema),
    defaultValues: { property_id: '', nomor_kamar: '', tipe_kamar: '', harga_sewa: 0 },
  });

  useEffect(() => {
    if (room) {
      reset({
        property_id: room.property_id,
        nomor_kamar: room.nomor_kamar,
        tipe_kamar: room.tipe_kamar,
        harga_sewa: room.harga_sewa,
      });
    } else {
      reset({ property_id: '', nomor_kamar: '', tipe_kamar: '', harga_sewa: 0 });
    }
  }, [room, open, reset]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg rounded-2xl">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <BedDouble className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle>{isEdit ? 'Ubah Kamar' : 'Tambah Kamar'}</DialogTitle>
              <p className="text-sm text-muted-foreground mt-0.5">
                {isEdit ? 'Ubah data kamar' : 'Masukkan data kamar baru'}
              </p>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
          {/* Properti — controlled via Controller to fix defaultValue payload mismatch */}
          <div className="space-y-2">
            <Label htmlFor="property_id">Properti</Label>
            <Controller
              name="property_id"
              control={control}
              render={({ field }) => (
                <Select
                  disabled={isLoading || isEdit}
                  value={field.value}
                  onValueChange={field.onChange}
                >
                  <SelectTrigger id="property_id" className="rounded-xl h-12">
                    <SelectValue placeholder="Pilih properti" />
                  </SelectTrigger>
                  <SelectContent>
                    {properties.map((p: any) => (
                      <SelectItem key={p.id} value={p.id}>{p.nama}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.property_id && <p className="text-sm text-destructive">{errors.property_id.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="nomor_kamar">Nomor Kamar</Label>
            <Input id="nomor_kamar" placeholder="A01" disabled={isLoading || isEdit} {...register('nomor_kamar')} />
            {errors.nomor_kamar && <p className="text-sm text-destructive">{errors.nomor_kamar.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="tipe_kamar">Tipe Kamar</Label>
            <Input id="tipe_kamar" placeholder="Standar" disabled={isLoading} {...register('tipe_kamar')} />
            {errors.tipe_kamar && <p className="text-sm text-destructive">{errors.tipe_kamar.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="harga_sewa">Harga Sewa (Rp/bulan)</Label>
            <Input id="harga_sewa" type="number" min={0} step={1000} placeholder="1200000" disabled={isLoading} {...register('harga_sewa')} />
            {errors.harga_sewa && <p className="text-sm text-destructive">{errors.harga_sewa.message}</p>}
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>Batal</Button>
            <Button type="submit" disabled={isLoading} className="gap-2 rounded-xl">
              {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              {isEdit ? 'Simpan' : 'Tambah'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
