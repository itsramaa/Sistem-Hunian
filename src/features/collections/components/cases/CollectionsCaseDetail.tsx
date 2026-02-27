import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { EscalationPathIndicator } from '../EscalationPathIndicator';
import { InteractionTimeline } from '../InteractionTimeline';
import { InteractionLogDialog } from '../InteractionLogDialog';
import { CollectionsTemplateSelector } from '../templates/CollectionsTemplateSelector';
import { useCollectionsInteractions } from '../../hooks/useCollectionsInteractions';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { CalendarDays, Plus } from 'lucide-react';
import { addDays, format } from 'date-fns';
import type { CollectionsCase } from '../../services/collectionsCaseService';

interface PaymentPlanInstallment {
  number: number;
  amount: number;
  dueDate: string;
  status: 'pending' | 'paid';
}

interface Props {
  caseData: CollectionsCase;
}

export function CollectionsCaseDetail({ caseData }: Props) {
  const { data: interactions, isLoading } = useCollectionsInteractions(caseData.id);
  const [showPlanForm, setShowPlanForm] = useState(false);
  const [installments, setInstallments] = useState(3);
  const [saving, setSaving] = useState(false);

  // Parse existing payment plan from resolution_notes
  const existingPlan: PaymentPlanInstallment[] | null = (() => {
    try {
      if (!caseData.notes) return null;
      const parsed = JSON.parse(caseData.notes);
      if (parsed?.payment_plan) return parsed.payment_plan;
    } catch { /* not JSON */ }
    return null;
  })();

  const handleCreatePlan = async () => {
    setSaving(true);
    try {
      const amountPerInstallment = Math.ceil(caseData.totalDue / installments);
      const plan: PaymentPlanInstallment[] = Array.from({ length: installments }, (_, i) => ({
        number: i + 1,
        amount: i === installments - 1 ? caseData.totalDue - amountPerInstallment * (installments - 1) : amountPerInstallment,
        dueDate: format(addDays(new Date(), (i + 1) * 14), 'yyyy-MM-dd'),
        status: 'pending',
      }));

      const notesJson = JSON.stringify({ payment_plan: plan, created_at: new Date().toISOString() });
      const { error } = await (supabase as any)
        .from('collections_cases')
        .update({ notes: notesJson, resolution_type: 'payment_plan' })
        .eq('id', caseData.id);

      if (error) throw error;
      toast.success('Rencana pembayaran berhasil dibuat');
      setShowPlanForm(false);
      window.location.reload();
    } catch (err) {
      toast.error('Gagal membuat rencana pembayaran');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4 pt-2">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Jalur Eskalasi</CardTitle>
        </CardHeader>
        <CardContent>
          <EscalationPathIndicator currentStatus={caseData.status} />
        </CardContent>
      </Card>

      <div className="flex items-center gap-2 flex-wrap">
        <InteractionLogDialog caseId={caseData.id} />
        <CollectionsTemplateSelector caseData={caseData} />
      </div>

      {/* Payment Plan Section */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <CalendarDays className="h-4 w-4" />
              Rencana Pembayaran
            </CardTitle>
            {!existingPlan && !showPlanForm && (
              <Button variant="outline" size="sm" onClick={() => setShowPlanForm(true)} className="gap-1 text-xs">
                <Plus className="h-3 w-3" /> Buat Rencana
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {existingPlan ? (
            <div className="space-y-2">
              {existingPlan.map((inst) => (
                <div key={inst.number} className="flex items-center justify-between p-2 rounded-lg border border-border/40">
                  <div className="text-sm">
                    <span className="font-medium">Cicilan #{inst.number}</span>
                    <span className="text-muted-foreground ml-2">{inst.dueDate}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Rp {inst.amount.toLocaleString('id-ID')}</span>
                    <Badge variant={inst.status === 'paid' ? 'secondary' : 'destructive'} className="text-[10px]">
                      {inst.status === 'paid' ? 'Lunas' : 'Pending'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : showPlanForm ? (
            <div className="space-y-3">
              <div>
                <Label className="text-xs">Jumlah Cicilan</Label>
                <Input type="number" min={2} max={12} value={installments} onChange={e => setInstallments(Number(e.target.value))} className="mt-1" />
              </div>
              <p className="text-xs text-muted-foreground">
                Total: Rp {caseData.totalDue.toLocaleString('id-ID')} → {installments}x Rp {Math.ceil(caseData.totalDue / installments).toLocaleString('id-ID')}
              </p>
              <div className="flex gap-2">
                <Button size="sm" onClick={handleCreatePlan} disabled={saving}>{saving ? 'Menyimpan...' : 'Simpan Rencana'}</Button>
                <Button size="sm" variant="ghost" onClick={() => setShowPlanForm(false)}>Batal</Button>
              </div>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">Belum ada rencana pembayaran. Buat rencana untuk membagi tunggakan menjadi cicilan.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Riwayat Interaksi</CardTitle>
        </CardHeader>
        <CardContent>
          <InteractionTimeline interactions={interactions} loading={isLoading} />
        </CardContent>
      </Card>
    </div>
  );
}
