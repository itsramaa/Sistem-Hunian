import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Textarea } from '@/shared/components/ui/textarea';
import { cn } from '@/shared/utils/utils';
import { CreateWaitinglistRequest } from '@/features/waitinglist/types/waitinglist';

const addWaitinglistSchema = z.object({
  property_id: z.string().min(1, 'Property ID wajib diisi'),
  unit_id: z.string().optional(),
  notes: z.string().optional(),
});

type AddWaitinglistFormData = z.infer<typeof addWaitinglistSchema>;

interface AddToWaitinglistModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tenantId: string;
  onSubmit: (data: CreateWaitinglistRequest) => Promise<void>;
  isLoading?: boolean;
}

export function AddToWaitinglistModal({
  open,
  onOpenChange,
  tenantId,
  onSubmit,
  isLoading = false,
}: AddToWaitinglistModalProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AddWaitinglistFormData>({
    resolver: zodResolver(addWaitinglistSchema),
    defaultValues: {
      property_id: '',
      unit_id: '',
      notes: '',
    },
  });

  const handleFormSubmit = async (data: AddWaitinglistFormData) => {
    await onSubmit({
      tenant_id: tenantId,
      property_id: data.property_id,
      unit_id: data.unit_id || undefined,
      notes: data.notes || undefined,
    });
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      reset();
    }
    onOpenChange(isOpen);
  };

  const inputCls = 'rounded-xl bg-background/60 border-border/50';

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md w-[95vw] rounded-2xl">
        <DialogHeader>
          <DialogTitle>Tambah ke Waiting List</DialogTitle>
          <DialogDescription>
            Daftarkan tenant ke waiting list untuk properti yang belum tersedia.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4 mt-2">
          {/* Tenant ID (read-only, auto-filled) */}
          <div>
            <Label htmlFor="tenant_id_display">Tenant ID</Label>
            <Input
              id="tenant_id_display"
              value={tenantId}
              readOnly
              disabled
              className={cn(inputCls, 'opacity-60 cursor-not-allowed')}
              aria-label="Tenant ID (otomatis)"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Diisi otomatis dari akun yang sedang login.
            </p>
          </div>

          {/* Property ID */}
          <div>
            <Label htmlFor="property_id">
              Property ID <span className="text-destructive">*</span>
            </Label>
            <Input
              id="property_id"
              placeholder="Masukkan ID properti"
              {...register('property_id')}
              className={cn(inputCls, errors.property_id && 'border-destructive')}
              aria-invalid={!!errors.property_id}
              aria-describedby={errors.property_id ? 'property_id_error' : undefined}
            />
            {errors.property_id && (
              <p id="property_id_error" className="text-sm text-destructive mt-1">
                {errors.property_id.message}
              </p>
            )}
          </div>

          {/* Unit ID (optional) */}
          <div>
            <Label htmlFor="unit_id">Unit ID (Opsional)</Label>
            <Input
              id="unit_id"
              placeholder="Masukkan ID unit (jika ada)"
              {...register('unit_id')}
              className={inputCls}
            />
          </div>

          {/* Notes (optional) */}
          <div>
            <Label htmlFor="notes">Catatan (Opsional)</Label>
            <Textarea
              id="notes"
              placeholder="Tambahkan catatan atau preferensi..."
              {...register('notes')}
              className={cn(inputCls, 'resize-none min-h-[80px]')}
              rows={3}
            />
          </div>

          <DialogFooter className="gap-2 flex-col-reverse sm:flex-row pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              className="rounded-xl"
              disabled={isLoading}
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="rounded-xl bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-md"
            >
              {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Tambah ke Waiting List
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
