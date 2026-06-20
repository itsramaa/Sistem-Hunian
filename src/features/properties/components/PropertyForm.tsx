import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/shared/components/ui/dialog';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Textarea } from '@/shared/components/ui/textarea';
import { Loader2, Building2 } from 'lucide-react';
import { Property, CreatePropertyPayload, UpdatePropertyPayload } from '../types';

const propertySchema = z.object({
  nama: z.string().min(2, 'Nama minimal 2 karakter').max(255),
  alamat: z.string().min(5, 'Alamat minimal 5 karakter').max(500),
  deskripsi: z.string().max(1000).optional(),
});

type FormData = z.infer<typeof propertySchema>;

interface PropertyFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  property: Property | null;
  onSubmit: (data: FormData) => Promise<void>;
  isLoading: boolean;
}

export function PropertyForm({ open, onOpenChange, property, onSubmit, isLoading }: PropertyFormProps) {
  const isEdit = !!property;

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(propertySchema),
    defaultValues: { nama: '', alamat: '', deskripsi: '' },
  });

  useEffect(() => {
    if (property) {
      reset({
        nama: property.nama,
        alamat: property.alamat,
        deskripsi: property.deskripsi || '',
      });
    } else {
      reset({ nama: '', alamat: '', deskripsi: '' });
    }
  }, [property, open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg rounded-2xl">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle>{isEdit ? 'Ubah Properti' : 'Tambah Properti'}</DialogTitle>
              <p className="text-sm text-muted-foreground mt-0.5">
                {isEdit ? 'Ubah data properti yang sudah ada' : 'Masukkan data properti baru'}
              </p>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="nama">Nama Properti</Label>
            <Input
              id="nama"
              placeholder="Kos Melati"
              disabled={isLoading}
              autoComplete="off"
              {...register('nama')}
            />
            {errors.nama && <p className="text-sm text-destructive">{errors.nama.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="alamat">Alamat</Label>
            <Input
              id="alamat"
              placeholder="Jl. MM2100 Blok A No. 1"
              disabled={isLoading}
              {...register('alamat')}
            />
            {errors.alamat && <p className="text-sm text-destructive">{errors.alamat.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="deskripsi">Deskripsi (opsional)</Label>
            <Textarea
              id="deskripsi"
              placeholder="Kos 3 lantai dekat pintu gerbang"
              rows={3}
              disabled={isLoading}
              {...register('deskripsi')}
            />
            {errors.deskripsi && <p className="text-sm text-destructive">{errors.deskripsi.message}</p>}
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
              Batal
            </Button>
            <Button type="submit" disabled={isLoading} className="gap-2 rounded-xl">
              {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              {isEdit ? 'Simpan Perubahan' : 'Tambah Properti'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
