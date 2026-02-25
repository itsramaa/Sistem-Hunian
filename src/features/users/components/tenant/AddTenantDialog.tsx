import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { Badge } from '@/shared/components/ui/badge';
import { addTenantSchema, AddTenantFormData } from '@/features/users/types/addTenantSchema';
import { Property } from '@/features/properties/types';
import { ArrowLeft, ArrowRight, Building2, Check, Home, KeyRound, Loader2, User } from 'lucide-react';
import { cn } from '@/shared/utils/utils';

interface AddTenantDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  properties: Property[];
  onSubmit: (data: AddTenantFormData) => void;
  isLoading: boolean;
}

const STEPS = [
  { label: 'Buat Akun', icon: KeyRound, description: 'Info login tenant' },
  { label: 'Unit', icon: Home, description: 'Property & unit' },
  { label: 'Kontrak', icon: Building2, description: 'Tanggal & harga' },
];

export function AddTenantDialog({ open, onOpenChange, properties, onSubmit, isLoading }: AddTenantDialogProps) {
  const [step, setStep] = useState(0);

  const { register, handleSubmit, setValue, watch, reset, formState: { errors }, trigger } = useForm<AddTenantFormData>({
    resolver: zodResolver(addTenantSchema),
    defaultValues: {
      full_name: '',
      email: '',
      password: '',
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
      ['full_name', 'email', 'password'],
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

  const inputCls = "rounded-xl bg-background/60 border-border/50";

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg w-[95vw] rounded-2xl">
        <DialogHeader>
          <DialogTitle>Tambah Tenant Baru</DialogTitle>
          <DialogDescription>Buat akun tenant baru dan hubungkan ke unit properti</DialogDescription>
        </DialogHeader>

        {/* Connected Dots Stepper */}
        <div className="flex items-center justify-between px-4">
          {STEPS.map((s, i) => (
            <div key={i} className="flex items-center">
              <div className="flex flex-col items-center gap-1.5">
                <div className={cn(
                  'flex items-center justify-center w-9 h-9 rounded-full text-xs font-bold transition-all duration-300 border-2',
                  i < step ? 'bg-success border-success text-success-foreground shadow-[0_0_12px_rgba(var(--success),0.3)]' :
                  i === step ? 'bg-primary border-primary text-primary-foreground shadow-[0_0_12px_rgba(var(--primary),0.3)]' :
                  'bg-muted/50 border-border/50 text-muted-foreground'
                )}>
                  {i < step ? <Check className="h-4 w-4" /> : <s.icon className="h-4 w-4" />}
                </div>
                <p className={cn('text-[10px] font-medium', i === step ? 'text-foreground' : 'text-muted-foreground')}>{s.label}</p>
              </div>
              {i < STEPS.length - 1 && (
                <div className={cn('w-12 h-0.5 mx-1 mb-5 rounded-full transition-colors', i < step ? 'bg-success' : 'bg-border/50')} />
              )}
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4 mt-2">
          {/* Step 1: Create Account */}
          {step === 0 && (
            <div className="space-y-4">
              <div className="p-3 rounded-xl bg-info/10 border border-info/20 text-sm text-info">
                Buat akun login untuk tenant baru. Tenant bisa mengisi detail profil setelah login.
              </div>
              <div>
                <Label htmlFor="full_name">Nama Lengkap *</Label>
                <Input id="full_name" placeholder="Nama lengkap tenant" {...register('full_name')} className={cn(inputCls, errors.full_name && 'border-destructive')} />
                {errors.full_name && <p className="text-sm text-destructive mt-1">{errors.full_name.message}</p>}
              </div>
              <div>
                <Label htmlFor="email">Email *</Label>
                <Input id="email" type="email" placeholder="tenant@example.com" {...register('email')} className={cn(inputCls, errors.email && 'border-destructive')} />
                {errors.email && <p className="text-sm text-destructive mt-1">{errors.email.message}</p>}
              </div>
              <div>
                <Label htmlFor="password">Password *</Label>
                <Input id="password" type="password" placeholder="Minimal 12 karakter" {...register('password')} className={cn(inputCls, errors.password && 'border-destructive')} />
                {errors.password && <p className="text-sm text-destructive mt-1">{errors.password.message}</p>}
                <p className="text-xs text-muted-foreground mt-1">Minimal 12 karakter</p>
              </div>
              <div>
                <Label htmlFor="phone">Telepon (Opsional)</Label>
                <Input id="phone" placeholder="08xxxxxxxxxx" {...register('phone')} className={inputCls} />
              </div>
            </div>
          )}

          {/* Step 2: Unit Selection */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="p-3 rounded-xl bg-card/80 backdrop-blur-sm border border-border/40 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">{watch('full_name')}</p>
                  <p className="text-xs text-muted-foreground">{watch('email')}</p>
                </div>
              </div>
              <div>
                <Label>Property *</Label>
                <Select value={selectedPropertyId} onValueChange={(v) => { setValue('property_id', v, { shouldValidate: true }); setValue('unit_id', ''); }}>
                  <SelectTrigger className={inputCls}><SelectValue placeholder="Pilih property" /></SelectTrigger>
                  <SelectContent>
                    {properties.map(p => (
                      <SelectItem key={p.id} value={p.id}>
                        <div className="flex items-center gap-2">
                          <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                          {p.name}
                          <Badge variant="secondary" className="text-[10px] ml-1 rounded-full">{p.property_type}</Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.property_id && <p className="text-sm text-destructive mt-1">{errors.property_id.message}</p>}
              </div>
              <div>
                <Label>Unit Tersedia *</Label>
                <Select value={watch('unit_id')} onValueChange={(v) => {
                  setValue('unit_id', v, { shouldValidate: true });
                  const unit = availableUnits.find((u: any) => u.id === v);
                  if (unit) {
                    setValue('rent_amount', unit.rent_amount || 0);
                    setValue('deposit_amount', unit.deposit_amount || 0);
                  }
                }} disabled={!selectedPropertyId}>
                  <SelectTrigger className={inputCls}><SelectValue placeholder={selectedPropertyId ? "Pilih unit" : "Pilih property dulu"} /></SelectTrigger>
                  <SelectContent>
                    {availableUnits.length === 0 ? (
                      <div className="px-3 py-2 text-sm text-muted-foreground">Tidak ada unit tersedia</div>
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="start_date">Tanggal Mulai *</Label>
                  <Input id="start_date" type="date" {...register('start_date')} className={inputCls} />
                  {errors.start_date && <p className="text-sm text-destructive mt-1">{errors.start_date.message}</p>}
                </div>
                <div>
                  <Label htmlFor="end_date">Tanggal Selesai *</Label>
                  <Input id="end_date" type="date" {...register('end_date')} className={inputCls} />
                  {errors.end_date && <p className="text-sm text-destructive mt-1">{errors.end_date.message}</p>}
                </div>
              </div>
              <div>
                <Label htmlFor="rent_amount">Sewa Bulanan (Rp) *</Label>
                <Input id="rent_amount" type="number" {...register('rent_amount', { valueAsNumber: true })} className={inputCls} />
                {errors.rent_amount && <p className="text-sm text-destructive mt-1">{errors.rent_amount.message}</p>}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="deposit_amount">Deposit (Rp)</Label>
                  <Input id="deposit_amount" type="number" {...register('deposit_amount', { valueAsNumber: true })} className={inputCls} />
                </div>
                <div>
                  <Label htmlFor="billing_day">Hari Tagihan (1-28)</Label>
                  <Input id="billing_day" type="number" min={1} max={28} {...register('billing_day', { valueAsNumber: true })} className={inputCls} />
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 flex-col-reverse sm:flex-row">
            {step > 0 && (
              <Button type="button" variant="outline" onClick={handleBack} className="rounded-xl">
                <ArrowLeft className="h-4 w-4 mr-1" />Kembali
              </Button>
            )}
            {step < 2 ? (
              <Button type="button" onClick={handleNext} className="rounded-xl bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-md">
                Lanjut<ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            ) : (
              <Button type="submit" disabled={isLoading} className="rounded-xl bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-md">
                {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Buat Akun & Tambah Tenant
              </Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
