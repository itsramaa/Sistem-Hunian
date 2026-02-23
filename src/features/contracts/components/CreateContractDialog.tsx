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
import { contractSchema, ContractFormData } from '../types/schema';
import { useEffect } from 'react';

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
    defaultValues: { unit_id: '', tenant_user_id: '', start_date: '', end_date: '', rent_amount: 0, deposit_amount: 0, billing_day: undefined, terms: '' },
  });

  useEffect(() => { if (open) form.reset(); }, [open, form]);

  const handleSubmit = (data: ContractFormData) => { onSubmit(data, form.reset); };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg rounded-2xl">
        <DialogHeader>
          <DialogTitle>Create Contract</DialogTitle>
          <DialogDescription>Create a new rental contract for a tenant</DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <div>
            <Label>Select Unit</Label>
            <Select value={form.watch('unit_id')} onValueChange={(v) => form.setValue('unit_id', v, { shouldValidate: true })}>
              <SelectTrigger className="rounded-xl bg-background/60 border-border/50"><SelectValue placeholder="Choose a unit" /></SelectTrigger>
              <SelectContent className="rounded-xl">
                {availableUnits.map((unit) => (
                  <SelectItem key={unit.id} value={unit.id}>{unit.propertyName} - Unit {unit.unit_number}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.unit_id && <p className="text-sm text-destructive mt-1">{form.formState.errors.unit_id.message}</p>}
          </div>
          <div>
            <Label>Select Tenant</Label>
            <Select value={form.watch('tenant_user_id')} onValueChange={(v) => form.setValue('tenant_user_id', v, { shouldValidate: true })}>
              <SelectTrigger className="rounded-xl bg-background/60 border-border/50"><SelectValue placeholder="Select tenant" /></SelectTrigger>
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
              <Label>Start Date</Label>
              <Input type="date" {...form.register('start_date')} className="rounded-xl bg-background/60 border-border/50" />
              {form.formState.errors.start_date && <p className="text-sm text-destructive mt-1">{form.formState.errors.start_date.message}</p>}
            </div>
            <div>
              <Label>End Date</Label>
              <Input type="date" {...form.register('end_date')} className="rounded-xl bg-background/60 border-border/50" />
              {form.formState.errors.end_date && <p className="text-sm text-destructive mt-1">{form.formState.errors.end_date.message}</p>}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Monthly Rent (IDR)</Label>
              <Input type="number" {...form.register('rent_amount')} className="rounded-xl bg-background/60 border-border/50" />
              {form.formState.errors.rent_amount && <p className="text-sm text-destructive mt-1">{form.formState.errors.rent_amount.message}</p>}
            </div>
            <div>
              <Label>Deposit (IDR)</Label>
              <Input type="number" {...form.register('deposit_amount')} className="rounded-xl bg-background/60 border-border/50" />
              {form.formState.errors.deposit_amount && <p className="text-sm text-destructive mt-1">{form.formState.errors.deposit_amount.message}</p>}
            </div>
          </div>
          <div>
            <Label>Terms & Conditions</Label>
            <Textarea placeholder="Contract terms..." {...form.register('terms')} rows={3} className="rounded-xl bg-background/60 border-border/50" />
            {form.formState.errors.terms && <p className="text-sm text-destructive mt-1">{form.formState.errors.terms.message}</p>}
          </div>
          <DialogFooter className="flex-col-reverse sm:flex-row">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="rounded-xl">Cancel</Button>
            <Button type="submit" disabled={loading} className="gradient-cta rounded-xl">{loading ? 'Creating...' : 'Create Contract'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
