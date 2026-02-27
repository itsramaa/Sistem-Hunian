import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/components/ui/table';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/shared/components/ui/dropdown-menu';
import { CheckCircle, ChevronDown, ChevronRight, MoreHorizontal, PlayCircle, AlertTriangle, Scale, Send } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/shared/components/ui/collapsible';
import type { CollectionsCase } from '../../services/collectionsCaseService';
import { getAllowedTransitions, COLLECTIONS_CASE_TRANSITIONS } from '@/shared/constants/state-machines';
import { CollectionsCaseDetail } from './CollectionsCaseDetail';
import { ResolutionDialog } from './ResolutionDialog';

const statusLabel: Record<string, string> = {
  initiated: 'Dibuat',
  reminder_sent: 'Pengingat',
  follow_up: 'Tindak Lanjut',
  in_progress: 'Ditangani',
  escalated: 'Eskalasi',
  legal: 'Hukum',
  resolved: 'Selesai',
};
const statusVariant: Record<string, 'default' | 'secondary' | 'destructive'> = {
  initiated: 'secondary',
  reminder_sent: 'secondary',
  follow_up: 'secondary',
  in_progress: 'default',
  escalated: 'destructive',
  legal: 'destructive',
  resolved: 'default',
};

const statusIcon: Record<string, typeof PlayCircle> = {
  reminder_sent: Send,
  follow_up: AlertTriangle,
  in_progress: PlayCircle,
  escalated: AlertTriangle,
  legal: Scale,
  resolved: CheckCircle,
};

interface Props {
  cases?: CollectionsCase[];
  loading?: boolean;
  onUpdateStatus: (caseId: string, currentStatus: string, newStatus: string, resolution?: string) => void;
}

export function CollectionsCasesList({ cases, loading, onUpdateStatus }: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [resolutionCase, setResolutionCase] = useState<CollectionsCase | null>(null);

  if (loading) return <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>;
  if (!cases?.length) return <p className="text-center text-muted-foreground py-8">Belum ada kasus penagihan</p>;

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40px]" />
              <TableHead>Invoice</TableHead>
              <TableHead>Penyewa</TableHead>
              <TableHead>Unit</TableHead>
              <TableHead>Jumlah</TableHead>
              <TableHead>Hari</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[80px]">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {cases.map(c => {
              const isExpanded = expandedId === c.id;
              return (
                <Collapsible key={c.id} open={isExpanded} onOpenChange={(open) => setExpandedId(open ? c.id : null)} asChild>
                  <>
                    <TableRow className="cursor-pointer hover:bg-muted/50">
                      <TableCell>
                        <CollapsibleTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-6 w-6">
                            {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                          </Button>
                        </CollapsibleTrigger>
                      </TableCell>
                      <TableCell className="font-medium">{c.invoiceNumber}</TableCell>
                      <TableCell>{c.tenantName}</TableCell>
                      <TableCell>{c.unitNumber}</TableCell>
                      <TableCell>Rp {c.totalDue.toLocaleString('id-ID')}</TableCell>
                      <TableCell>{c.daysOverdue}</TableCell>
                      <TableCell><Badge variant={statusVariant[c.status] || 'secondary'}>{statusLabel[c.status] || c.status}</Badge></TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {getAllowedTransitions(COLLECTIONS_CASE_TRANSITIONS, c.status).map(next => {
                              const Icon = statusIcon[next] || PlayCircle;
                              return (
                                <DropdownMenuItem
                                  key={next}
                                  onClick={() => {
                                    if (next === 'resolved') {
                                      setResolutionCase(c);
                                    } else {
                                      onUpdateStatus(c.id, c.status, next);
                                    }
                                  }}
                                >
                                  <Icon className="h-4 w-4 mr-2" />
                                  {statusLabel[next] || next}
                                </DropdownMenuItem>
                              );
                            })}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                    <CollapsibleContent asChild>
                      <tr>
                        <td colSpan={8} className="p-4 bg-muted/20">
                          <CollectionsCaseDetail caseData={c} />
                        </td>
                      </tr>
                    </CollapsibleContent>
                  </>
                </Collapsible>
              );
            })}
          </TableBody>
        </Table>
      </div>
      <ResolutionDialog
        open={!!resolutionCase}
        onOpenChange={(open) => { if (!open) setResolutionCase(null); }}
        onConfirm={(resolution) => {
          if (resolutionCase) {
            onUpdateStatus(resolutionCase.id, resolutionCase.status, 'resolved', resolution);
            setResolutionCase(null);
          }
        }}
      />
    </>
  );
}
