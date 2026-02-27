import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { EscalationPathIndicator } from '../EscalationPathIndicator';
import { InteractionTimeline } from '../InteractionTimeline';
import { InteractionLogDialog } from '../InteractionLogDialog';
import { CollectionsTemplateSelector } from '../templates/CollectionsTemplateSelector';
import { useCollectionsInteractions } from '../../hooks/useCollectionsInteractions';
import type { CollectionsCase } from '../../services/collectionsCaseService';

interface Props {
  caseData: CollectionsCase;
}

export function CollectionsCaseDetail({ caseData }: Props) {
  const { data: interactions, isLoading } = useCollectionsInteractions(caseData.id);

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
