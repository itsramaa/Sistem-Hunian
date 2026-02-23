import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { Loader2, Save } from 'lucide-react';

const financialSchema = z.object({
  construction_cost: z.coerce.number().min(0).default(0),
  renovation_cost: z.coerce.number().min(0).default(0),
  funding_source: z.string().default('modal_sendiri'),
  monthly_amortization: z.coerce.number().min(0).default(0),
  monthly_maintenance_cost: z.coerce.number().min(0).default(0),
  avg_annual_unexpected_cost: z.coerce.number().min(0).default(0),
});

export type FinancialFormData = z.infer<typeof financialSchema>;

const FUNDING_SOURCE_OPTIONS = [
  { value: 'modal_sendiri', label: 'Modal Sendiri' },
  { value: 'kredit_bank', label: 'Kredit Bank' },
  { value: 'campuran', label: 'Campuran' },
];

interface PropertyFinancialFormProps {
  initialData?: Partial<FinancialFormData>;
  onSubmit: (data: FinancialFormData) => Promise<void>;
  isLoading: boolean;
}

export function PropertyFinancialForm({ initialData, onSubmit, isLoading }: PropertyFinancialFormProps) {
  const { register, handleSubmit, setValue, watch, reset } = useForm<FinancialFormData>({
    resolver: zodResolver(financialSchema),
    defaultValues: {
      construction_cost: 0, renovation_cost: 0, funding_source: 'modal_sendiri',
      monthly_amortization: 0, monthly_maintenance_cost: 0, avg_annual_unexpected_cost: 0,
    },
  });

  useEffect(() => {
    if (initialData) {
      reset({
        construction_cost: initialData.construction_cost || 0,
        renovation_cost: initialData.renovation_cost || 0,
        funding_source: initialData.funding_source || 'modal_sendiri',
        monthly_amortization: initialData.monthly_amortization || 0,
        monthly_maintenance_cost: initialData.monthly_maintenance_cost || 0,
        avg_annual_unexpected_cost: initialData.avg_annual_unexpected_cost || 0,
      });
    }
  }, [initialData, reset]);

  const inputCls = 'rounded-xl bg-background/60 border-border/50';
  const formatCurrency = (v: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(v);

  const constructionCost = watch('construction_cost') || 0;
  const renovationCost = watch('renovation_cost') || 0;
  const totalInvestment = constructionCost + renovationCost;

  return (
    <Card className="rounded-2xl">
      <CardHeader>
        <CardTitle className="text-lg">Data Keuangan Properti</CardTitle>
        <CardDescription>Lengkapi data biaya untuk kalkulasi DSS otomatis</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>Biaya Pembangunan Total (Rp)</Label>
              <Input type="number" min={0} {...register('construction_cost')} className={inputCls} />
            </div>
            <div>
              <Label>Biaya Renovasi (Rp)</Label>
              <Input type="number" min={0} {...register('renovation_cost')} className={inputCls} />
            </div>
          </div>

          <div className="p-3 rounded-xl bg-muted/50 text-sm">
            <span className="text-muted-foreground">Total Investasi: </span>
            <span className="font-semibold text-foreground">{formatCurrency(totalInvestment)}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>Sumber Dana</Label>
              <Select value={watch('funding_source')} onValueChange={(v) => setValue('funding_source', v)}>
                <SelectTrigger className={inputCls}><SelectValue /></SelectTrigger>
                <SelectContent>
                  {FUNDING_SOURCE_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Amortisasi Pembangunan/bulan (Rp)</Label>
              <Input type="number" min={0} {...register('monthly_amortization')} className={inputCls} />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>Biaya Maintenance Rutin/bulan (Rp)</Label>
              <Input type="number" min={0} {...register('monthly_maintenance_cost')} className={inputCls} />
            </div>
            <div>
              <Label>Biaya Tak Terduga Rata-rata/tahun (Rp)</Label>
              <Input type="number" min={0} {...register('avg_annual_unexpected_cost')} className={inputCls} />
            </div>
          </div>

          <Button type="submit" disabled={isLoading} className="rounded-xl gradient-cta text-primary-foreground">
            {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            Simpan Data Keuangan
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
