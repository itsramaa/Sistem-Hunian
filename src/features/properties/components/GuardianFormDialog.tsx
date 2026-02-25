import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { z } from 'zod';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Textarea } from '@/shared/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { Loader2, Trash2, Upload, User } from 'lucide-react';
import { PropertyGuardian } from '../types';
import { SALARY_FREQUENCY_OPTIONS } from '../constants';
import { cn } from '@/shared/utils/utils';
import { UnitPhotoUpload } from './UnitPhotoUpload';

const guardianSchema = z.object({
  property_id: z.string().min(1, 'Properti wajib dipilih'),
  name: z.string().min(2, 'Nama minimal 2 karakter').max(100),
  phone: z.string().max(20).optional().nullable(),
  address: z.string().max(255).optional().nullable(),
  id_number: z.string().max(30).optional().nullable(),
  salary: z.coerce.number().min(0).default(0),
  salary_frequency: z.string().default('monthly'),
  start_date: z.string().optional().nullable(),
  end_date: z.string().optional().nullable(),
  status: z.string().default('active'),
  notes: z.string().max(500).optional().nullable(),
  photo_url: z.string().optional().nullable(),
});

export type GuardianFormData = z.infer<typeof guardianSchema>;

interface GuardianFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  guardian?: PropertyGuardian | null;
  properties: { id: string; name: string }[];
  onSubmit: (data: GuardianFormData) => Promise<void>;
  isLoading: boolean;
  defaultPropertyId?: string;
}

export function GuardianFormDialog({ open, onOpenChange, guardian, properties, onSubmit, isLoading, defaultPropertyId }: GuardianFormDialogProps) {
  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<GuardianFormData>({
    resolver: zodResolver(guardianSchema),
    defaultValues: {
      property_id: defaultPropertyId || '', name: '', phone: '', address: '', id_number: '',
      salary: 0, salary_frequency: 'monthly', start_date: '', end_date: '',
      status: 'active', notes: '', photo_url: '',
    },
  });

  useEffect(() => {
    if (guardian) {
      reset({
        property_id: guardian.property_id,
        name: guardian.name,
        phone: guardian.phone || '',
        address: guardian.address || '',
        id_number: guardian.id_number || '',
        salary: guardian.salary,
        salary_frequency: guardian.salary_frequency,
        start_date: guardian.start_date || '',
        end_date: guardian.end_date || '',
        status: guardian.status,
        notes: guardian.notes || '',
        photo_url: (guardian as any).photo_url || '',
      });
    } else {
      reset({
        property_id: defaultPropertyId || properties[0]?.id || '', name: '', phone: '', address: '', id_number: '',
        salary: 0, salary_frequency: 'monthly', start_date: '', end_date: '',
        status: 'active', notes: '', photo_url: '',
      });
    }
  }, [guardian, reset, open, properties, defaultPropertyId]);

  const photoUrl = watch('photo_url');
  const photos = photoUrl ? [photoUrl] : [];

  const inputCls = 'rounded-xl bg-background/60 border-border/50';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg w-[95vw] rounded-2xl" aria-describedby="guardian-form-description">
        <DialogHeader>
          <DialogTitle>{guardian ? 'Edit Penjaga' : 'Tambah Penjaga Baru'}</DialogTitle>
          <p id="guardian-form-description" className="sr-only">Formulir untuk mengisi data diri dan detail pekerjaan penjaga properti</p>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
          {/* Photo Upload */}
          <div>
            <Label>Foto Penjaga</Label>
            <div className="mt-1.5">
              {photoUrl ? (
                <div className="relative w-24 h-24 rounded-xl overflow-hidden border border-border/40">
                  <img src={photoUrl} alt="Foto penjaga" className="w-full h-full object-cover" />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-1 right-1 h-6 w-6 rounded-full"
                    onClick={() => setValue('photo_url', '')}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <UnitPhotoUpload
                  photos={[]}
                  onPhotosChange={(p) => { if (p.length > 0) setValue('photo_url', p[0]); }}
                  maxPhotos={1}
                />
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="property-id">Properti *</Label>
            <Select value={watch('property_id')} onValueChange={(v) => setValue('property_id', v, { shouldValidate: true })}>
              <SelectTrigger id="property-id" className={cn(inputCls, errors.property_id && 'border-destructive')}>
                <SelectValue placeholder="Pilih properti" />
              </SelectTrigger>
              <SelectContent>
                {properties.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
              </SelectContent>
            </Select>
            {errors.property_id && <p className="text-sm text-destructive mt-1">{errors.property_id.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="guardian-name">Nama Penjaga *</Label>
              <Input id="guardian-name" {...register('name')} className={cn(inputCls, errors.name && 'border-destructive')} placeholder="Nama lengkap" />
              {errors.name && <p className="text-sm text-destructive mt-1">{errors.name.message}</p>}
            </div>
            <div>
              <Label htmlFor="guardian-phone">No. Telepon</Label>
              <Input id="guardian-phone" {...register('phone')} className={inputCls} placeholder="08xxxxxxxxxx" />
            </div>
          </div>

          <div>
            <Label htmlFor="guardian-address">Alamat</Label>
            <Input id="guardian-address" {...register('address')} className={inputCls} placeholder="Alamat penjaga" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="guardian-id">No. KTP</Label>
              <Input id="guardian-id" {...register('id_number')} className={inputCls} placeholder="No. KTP" />
            </div>
            <div>
              <Label htmlFor="guardian-status">Status</Label>
              <Select value={watch('status')} onValueChange={(v) => setValue('status', v)}>
                <SelectTrigger id="guardian-status" className={inputCls}><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Aktif</SelectItem>
                  <SelectItem value="inactive">Tidak Aktif</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="guardian-salary">Gaji (Rp)</Label>
              <Input id="guardian-salary" type="number" min={0} {...register('salary')} className={inputCls} />
            </div>
            <div>
              <Label htmlFor="salary-frequency">Frekuensi Gaji</Label>
              <Select value={watch('salary_frequency')} onValueChange={(v) => setValue('salary_frequency', v)}>
                <SelectTrigger id="salary-frequency" className={inputCls}><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SALARY_FREQUENCY_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="start-date">Tanggal Mulai</Label>
              <Input id="start-date" type="date" {...register('start_date')} className={inputCls} />
            </div>
            <div>
              <Label htmlFor="end-date">Tanggal Selesai</Label>
              <Input id="end-date" type="date" {...register('end_date')} className={inputCls} />
            </div>
          </div>

          <div>
            <Label htmlFor="guardian-notes">Catatan</Label>
            <Textarea id="guardian-notes" {...register('notes')} className={inputCls} placeholder="Catatan tambahan..." rows={2} />
          </div>
        </form>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="rounded-xl">Batal</Button>
          <Button onClick={handleSubmit(onSubmit)} disabled={isLoading} className="rounded-xl gradient-cta text-primary-foreground">
            {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" aria-hidden="true" />}
            {guardian ? 'Simpan Perubahan' : 'Tambah Penjaga'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
