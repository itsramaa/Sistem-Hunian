import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Plus } from 'lucide-react';
import { useWaitingList } from '@/features/waiting-list/hooks/useWaitingList';
import { WaitingListTable } from '@/features/waiting-list/components/WaitingListTable';
import { AddApplicantDialog } from '@/features/waiting-list/components/AddApplicantDialog';
import { SendOfferDialog } from '@/features/waiting-list/components/SendOfferDialog';

export default function MerchantWaitingList() {
  const [addOpen, setAddOpen] = useState(false);
  const [offerApplicantId, setOfferApplicantId] = useState<string | null>(null);
  const { list, addApplicant, updateStatus, sendOffer } = useWaitingList();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Daftar Tunggu</h1>
          <p className="text-muted-foreground">Kelola calon penyewa dan kirim penawaran</p>
        </div>
        <Button onClick={() => setAddOpen(true)}><Plus className="h-4 w-4 mr-2" />Tambah Pelamar</Button>
      </div>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-lg">Pelamar</CardTitle></CardHeader>
        <CardContent>
          <WaitingListTable
            applicants={list.data}
            loading={list.isLoading}
            onUpdateStatus={(id, cur, next) => updateStatus.mutate({ id, currentStatus: cur, newStatus: next })}
            onSendOffer={id => setOfferApplicantId(id)}
          />
        </CardContent>
      </Card>

      <AddApplicantDialog open={addOpen} onOpenChange={setAddOpen} onSubmit={p => addApplicant.mutate(p)} loading={addApplicant.isPending} />
      <SendOfferDialog
        open={!!offerApplicantId}
        onOpenChange={open => { if (!open) setOfferApplicantId(null); }}
        applicantId={offerApplicantId}
        onSubmit={(aId, uId) => sendOffer.mutate({ applicantId: aId, unitId: uId })}
        loading={sendOffer.isPending}
      />
    </div>
  );
}
