import { Button } from '@/shared/components/ui/button';
import { TenantScreening } from '../types';
import { useApproveScreening, useRejectScreening } from '../hooks/useScreening';
import { toast } from 'sonner';
import { CheckCircle2, XCircle } from 'lucide-react';

export function ScreeningApprovalActions({ screening }: { screening: TenantScreening }) {
  const approve = useApproveScreening();
  const reject = useRejectScreening();

  if (screening.status !== 'scored') return null;

  const needsGuarantor = screening.screening_grade === 'red' && !screening.guarantor_name;

  return (
    <div className="space-y-2">
      {needsGuarantor && (
        <p className="text-sm text-destructive font-medium">
          ⚠️ Penjamin wajib diisi sebelum menyetujui kandidat risiko tinggi
        </p>
      )}
      <div className="flex gap-2">
        <Button
          variant="outline"
          className="rounded-xl border-emerald-500/50 text-emerald-700 hover:bg-emerald-500/10"
          disabled={approve.isPending || needsGuarantor}
          onClick={() => approve.mutate(screening.id, {
            onSuccess: () => toast.success('Screening disetujui'),
            onError: (e) => toast.error(e.message),
          })}
        >
          <CheckCircle2 className="h-4 w-4 mr-1" /> Setujui
        </Button>
        <Button
          variant="outline"
          className="rounded-xl border-destructive/50 text-destructive hover:bg-destructive/10"
          disabled={reject.isPending}
          onClick={() => reject.mutate({ id: screening.id }, {
            onSuccess: () => toast.success('Screening ditolak'),
            onError: (e) => toast.error(e.message),
          })}
        >
          <XCircle className="h-4 w-4 mr-1" /> Tolak
        </Button>
      </div>
    </div>
  );
}
