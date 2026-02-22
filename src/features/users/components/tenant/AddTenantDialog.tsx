import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { Badge } from '@/shared/components/ui/badge';
import { Separator } from '@/shared/components/ui/separator';
import { addTenantSchema, AddTenantFormData } from '@/features/users/types/addTenantSchema';
import { Property } from '@/features/properties/types';
import { ArrowLeft, ArrowRight, Building2, Check, Home, Loader2, User } from 'lucide-react';
import { cn } from '@/shared/utils/utils';

interface AddTenantDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  properties: Property[];
  onSubmit: (data: AddTenantFormData) => void;
  isLoading: boolean;
}

const STEPS = [
  { label: 'Tenant Info', icon: User, description: 'Name, email & phone' },
  { label: 'Unit Selection', icon: Home, description: 'Property & unit' },
  { label: 'Contract', icon: Building2, description: 'Dates & amounts' },
];

export function AddTenantDialog({ open, onOpenChange, properties, onSubmit, isLoading }: AddTenantDialogProps) {
  const [step, setStep] = useState(0);

  const { register, handleSubmit, setValue, watch, reset, formState: { errors }, trigger } = useForm<AddTenantFormData>({
    resolver: zodResolver(addTenantSchema),
    defaultValues: {
      full_name: '',
      email: '',
      phone: '',
      property_id: '',
      unit_id: '',
      start_date: '',
      end_date: '',
      rent_amount: 0,
      deposit_amount: 0,
      billing_day: 1,
    },
  });

  const selectedPropertyId = watch('property_id');
  const selectedProperty = properties.find(p => p.id === selectedPropertyId);
  const availableUnits = (selectedProperty as any)?.units?.filter((u: any) => u.status === 'available') || [];

  const handleNext = async () => {
    const fieldsPerStep: (keyof AddTenantFormData)[][] = [
      ['full_name', 'email'],
      ['property_id', 'unit_id'],
      ['start_date', 'end_date', 'rent_amount'],
    ];
    const valid = await trigger(fieldsPerStep[step]);
    if (valid) setStep(s => Math.min(s + 1, 2));
  };

  const handleBack = () => setStep(s => Math.max(s - 1, 0));

  const handleFormSubmit = (data: AddTenantFormData) => {
    onSubmit(data);
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      reset();
      setStep(0);
    }
    onOpenChange(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Tenant</DialogTitle>
          <DialogDescription>Add a new tenant and create their contract</DialogDescription>
        </DialogHeader>

        {/* Step Indicator */}
        <div className="flex items-center justify-between px-2">
          {STEPS.map((s, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className={cn(
                'flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold transition-colors',
                i < step ? 'bg-success text-success-foreground' :
                i === step ? 'bg-primary text-primary-foreground' :
                'bg-muted text-muted-foreground'
              )}>
                {i < step ? <Check className="h-4 w-4" /> : i + 1}
              </div>
              <div className="hidden sm:block">
                <p className={cn('text-xs font-medium', i === step ? 'text-foreground' : 'text-muted-foreground')}>{s.label}</p>
              </div>
              {i < STEPS.length - 1 && (
                <Separator className={cn('w-8 mx-2', i < step ? 'bg-success' : 'bg-muted')} />
              )}
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4 mt-2">
          {/* Step 1: Tenant Info */}
          {step === 0 && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="full_name">Full Name *</Label>
                <Input id="full_name" placeholder="Tenant's full name" {...register('full_name')} />
                {errors.full_name && <p className="text-sm text-destructive mt-1">{errors.full_name.message}</p>}
              </div>
              <div>
                <Label htmlFor="email">Email *</Label>
                <Input id="email" type="email" placeholder="tenant@example.com" {...register('email')} />
                {errors.email && <p className="text-sm text-destructive mt-1">{errors.email.message}</p>}
              </div>
              <div>
                <Label htmlFor="phone">Phone (optional)</Label>
                <Input id="phone" placeholder="+62..." {...register('phone')} />
              </div>
            </div>
          )}

          {/* Step 2: Unit Selection */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <Label>Property *</Label>
                <Select value={selectedPropertyId} onValueChange={(v) => { setValue('property_id', v, { shouldValidate: true }); setValue('unit_id', ''); }}>
                  <SelectTrigger><SelectValue placeholder="Select property" /></SelectTrigger>
                  <SelectContent>
                    {properties.map(p => (
                      <SelectItem key={p.id} value={p.id}>
                        <div className="flex items-center gap-2">
                          <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                          {p.name}
                          <Badge variant="secondary" className="text-[10px] ml-1">{p.property_type}</Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.property_id && <p className="text-sm text-destructive mt-1">{errors.property_id.message}</p>}
              </div>
              <div>
                <Label>Available Unit *</Label>
                <Select value={watch('unit_id')} onValueChange={(v) => {
                  setValue('unit_id', v, { shouldValidate: true });
                  const unit = availableUnits.find((u: any) => u.id === v);
                  if (unit) {
                    setValue('rent_amount', unit.rent_amount || 0);
                    setValue('deposit_amount', unit.deposit_amount || 0);
                  }
                }} disabled={!selectedPropertyId}>
                  <SelectTrigger><SelectValue placeholder={selectedPropertyId ? "Select unit" : "Select a property first"} /></SelectTrigger>
                  <SelectContent>
                    {availableUnits.length === 0 ? (
                      <div className="px-3 py-2 text-sm text-muted-foreground">No available units</div>
                    ) : (
                      availableUnits.map((u: any) => (
                        <SelectItem key={u.id} value={u.id}>
                          <div className="flex items-center gap-2">
                            Unit {u.unit_number}
                            {u.rent_amount > 0 && <span className="text-muted-foreground text-xs">• Rp {u.rent_amount.toLocaleString()}</span>}
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                {errors.unit_id && <p className="text-sm text-destructive mt-1">{errors.unit_id.message}</p>}
              </div>
            </div>
          )}

          {/* Step 3: Contract Details */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="start_date">Start Date *</Label>
                  <Input id="start_date" type="date" {...register('start_date')} />
                  {errors.start_date && <p className="text-sm text-destructive mt-1">{errors.start_date.message}</p>}
                </div>
                <div>
                  <Label htmlFor="end_date">End Date *</Label>
                  <Input id="end_date" type="date" {...register('end_date')} />
                  {errors.end_date && <p className="text-sm text-destructive mt-1">{errors.end_date.message}</p>}
                </div>
              </div>
              <div>
                <Label htmlFor="rent_amount">Monthly Rent (Rp) *</Label>
                <Input id="rent_amount" type="number" {...register('rent_amount', { valueAsNumber: true })} />
                {errors.rent_amount && <p className="text-sm text-destructive mt-1">{errors.rent_amount.message}</p>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="deposit_amount">Deposit (Rp)</Label>
                  <Input id="deposit_amount" type="number" {...register('deposit_amount', { valueAsNumber: true })} />
                </div>
                <div>
                  <Label htmlFor="billing_day">Billing Day (1-28)</Label>
                  <Input id="billing_day" type="number" min={1} max={28} {...register('billing_day', { valueAsNumber: true })} />
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            {step > 0 && (
              <Button type="button" variant="outline" onClick={handleBack}>
                <ArrowLeft className="h-4 w-4 mr-1" />Back
              </Button>
            )}
            {step < 2 ? (
              <Button type="button" onClick={handleNext}>
                Next<ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            ) : (
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Add Tenant
              </Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
