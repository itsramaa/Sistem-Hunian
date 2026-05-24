import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/shared/components/ui/dialog';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { Textarea } from '@/shared/components/ui/textarea';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useEffect } from 'react';

const paymentFrequencyOptions = [
  { value: 'monthly', label: 'Bulanan' },
  { value: 'semester', label: 'Per Semester (6 Bulan)' },
  { value: 'annual', label: 'Tahunan' },
] as const;

const contractSchema = z.object({
  unit_id: z.string().min(1, 'Pilih unit terlebih dahulu'),
  tenant_user_id: z.string().min(1, 'Pilih penyewa terlebih dahulu'),
  start_date: z.string().min(1, 'Tanggal mulai wajib diisi'),
  end_date: z.string().min(1, 'Tanggal berakhir wajib diisi'),
  rent_amount: z.coerce.number().positive('Harga sewa harus lebih dari 0'),
  deposit_amount: z.coerce.number().min(0, 'Deposit tidak boleh negatif'),
  payment_frequency: z.enum(['monthly', 'semester', 'annual']).default('monthly'),
  billing_day: z.coerce.number().min(1).max(28).optional(),
  terms: z.string().max(10000, 'Syarat & ketentuan tidak boleh lebih dari 10.000 karakter').optional(),
}).refine((data) => {
  const start = new Date(data.start_date);
  const end = new Date(data.end_date);
  return end > start;
}, {
  message: 'Tanggal berakhir harus setelah tanggal mulai',
  path: ['end_date'],
}).refine((data) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = new Date(data.start_date);
  return start >= today;
}, {
  message: 'Tanggal mulai tidak boleh di masa lalu',
  path: ['start_date'],
});

export type ContractFormData = z.infer<typeof contractSchema>;

interface CreateContractDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  availableUnits: { id: string; unit_number: string; propertyName: string }[];
  merchantTenants: { user_id: string; full_name: string; email: string }[];
  onSubmit: (data: ContractFormData, reset: () => void) => void;
  loading: boolean;
}

export function CreateContractDialog({
  open, onOpenChange, availableUnits, merchantTenants, onSubmit, loading,
}: CreateContractDialogProps) {
  const form = useForm<ContractFormData>({
    resolver: zodResolver(contractSchema),
    defaultValues: { unit_id: '', tenant_user_id: '', start_date: '', end_date: '', rent_amount: 0, deposit_amount: 0, payment_frequency: 'monthly', billing_day: undefined, terms: '' },
  });

  useEffect(() => { if (open) form.reset(); }, [open, form]);

  const handleSubmit = (data: ContractFormData) => { onSubmit(data, form.reset); };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg rounded-2xl">
        <DialogHeader>
          <DialogTitle>Buat Kontrak</DialogTitle>
          <DialogDescription>Buat kontrak sewa baru untuk penyewa</DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <div>
            <Label>Pilih Unit</Label>
            <Select value={form.watch('unit_id')} onValueChange={(v) => form.setValue('unit_id', v, { shouldValidate: true })}>
              <SelectTrigger className="rounded-xl bg-background/60 border-border/50"><SelectValue placeholder="Pilih unit" /></SelectTrigger>
              <SelectContent className="rounded-xl">
                {availableUnits.map((unit) => (
                  <SelectItem key={unit.id} value={unit.id}>{unit.propertyName} - Unit {unit.unit_number}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.unit_id && <p className="text-sm text-destructive mt-1">{form.formState.errors.unit_id.message}</p>}
          </div>
          <div>
            <Label>Pilih Penyewa</Label>
            <Select value={form.watch('tenant_user_id')} onValueChange={(v) => form.setValue('tenant_user_id', v, { shouldValidate: true })}>
              <SelectTrigger className="rounded-xl bg-background/60 border-border/50"><SelectValue placeholder="Pilih penyewa" /></SelectTrigger>
              <SelectContent className="rounded-xl">
                {merchantTenants.map((tenant) => (
                  <SelectItem key={tenant.user_id} value={tenant.user_id}>{tenant.full_name} ({tenant.email})</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.tenant_user_id && <p className="text-sm text-destructive mt-1">{form.formState.errors.tenant_user_id.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Tanggal Mulai</Label>
              <Input type="date" {...form.register('start_date')} className="rounded-xl bg-background/60 border-border/50" />
              {form.formState.errors.start_date && <p className="text-sm text-destructive mt-1">{form.formState.errors.start_date.message}</p>}
            </div>
            <div>
              <Label>Tanggal Berakhir</Label>
              <Input type="date" {...form.register('end_date')} className="rounded-xl bg-background/60 border-border/50" />
              {form.formState.errors.end_date && <p className="text-sm text-destructive mt-1">{form.formState.errors.end_date.message}</p>}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Harga Sewa (Rp)</Label>
              <Input type="number" {...form.register('rent_amount')} className="rounded-xl bg-background/60 border-border/50" />
              {form.formState.errors.rent_amount && <p className="text-sm text-destructive mt-1">{form.formState.errors.rent_amount.message}</p>}
            </div>
            <div>
              <Label>Deposit (Rp)</Label>
              <Input type="number" {...form.register('deposit_amount')} className="rounded-xl bg-background/60 border-border/50" />
              {form.formState.errors.deposit_amount && <p className="text-sm text-destructive mt-1">{form.formState.errors.deposit_amount.message}</p>}
            </div>
          </div>
          <div>
            <Label>Frekuensi Pembayaran</Label>
            <Select value={form.watch('payment_frequency')} onValueChange={(v) => form.setValue('payment_frequency', v as 'monthly' | 'semester' | 'annual', { shouldValidate: true })}>
              <SelectTrigger className="rounded-xl bg-background/60 border-border/50"><SelectValue placeholder="Pilih frekuensi" /></SelectTrigger>
              <SelectContent className="rounded-xl">
                {paymentFrequencyOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Syarat & Ketentuan</Label>
            <Textarea placeholder="Syarat & ketentuan kontrak..." {...form.register('terms')} rows={3} className="rounded-xl bg-background/60 border-border/50" />
            {form.formState.errors.terms && <p className="text-sm text-destructive mt-1">{form.formState.errors.terms.message}</p>}
          </div>
          <DialogFooter className="flex-col-reverse sm:flex-row">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="rounded-xl">Batal</Button>
            <Button type="submit" disabled={loading} className="gradient-cta rounded-xl">{loading ? 'Membuat...' : 'Buat Kontrak'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
