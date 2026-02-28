import { useBulkMoveOutData } from '@/features/contracts/hooks/useBulkMoveOutData';
import { Button } from '@/shared/components/ui/button';
import { Checkbox } from '@/shared/components/ui/checkbox';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/shared/components/ui/collapsible';
import { PageHeader } from '@/shared/components/ui/PageHeader';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/components/ui/table';
import { formatCurrency } from '@/shared/utils/currency';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import {
  Calendar,
  CheckCircle2,
  ChevronDown,
  ClipboardCheck,
  DoorOpen,
  Loader2,
  Trash2,
  Users,
  Wallet,
} from 'lucide-react';
import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

export function BulkMoveOutProcessor() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const idsParam = searchParams.get('ids') || '';
  const initialIds = idsParam.split(',').filter(Boolean);

  const [activeIds, setActiveIds] = useState<string[]>(initialIds);
  const [inspectionDate, setInspectionDate] = useState('');
  const [inspectionInclude, setInspectionInclude] = useState<Set<string>>(new Set(initialIds));
  const [openSections, setOpenSections] = useState({ summary: true, acknowledge: true, inspection: true, settle: true });

  const {
    notices, inspections, depositRefunds, tenantProfiles, isLoading,
    bulkAcknowledge, bulkScheduleInspection, bulkApproveRefunds, bulkTerminateContracts,
  } = useBulkMoveOutData(activeIds);

  const contractIds = notices.map(n => (n.contract as any)?.id).filter(Boolean) as string[];

  const removeNotice = (nId: string) => {
    setActiveIds(prev => prev.filter(x => x !== nId));
    setInspectionInclude(prev => { const n = new Set(prev); n.delete(nId); return n; });
  };

  const unacknowledgedIds = notices.filter(n => n.status === 'submitted').map(n => n.id);
  const noInspectionIds = activeIds.filter(nId => !inspections.some((i: any) => i.move_out_notice_id === nId));

  if (!activeIds.length) {
    return (
      <div className="space-y-6">
        <PageHeader icon={DoorOpen} title="Proses Massal" description="Tidak ada pemberitahuan dipilih" />
        <Button onClick={() => navigate('/merchant/move-outs')}>Kembali</Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const toggle = (key: keyof typeof openSections) => setOpenSections(p => ({ ...p, [key]: !p[key] }));

  return (
    <div className="space-y-6">
      <PageHeader
        icon={DoorOpen}
        title={`Proses Massal (${activeIds.length} Penyewa)`}
        description="Kelola pindah keluar secara massal"
      />

      {/* Section 1: Tenant Summary */}
      <Collapsible open={openSections.summary} onOpenChange={() => toggle('summary')}>
        <div className="border border-border/40 rounded-xl overflow-hidden">
          <CollapsibleTrigger className="flex w-full items-center justify-between p-4 bg-muted/30 hover:bg-muted/50 transition-colors">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">Ringkasan Penyewa</h3>
            </div>
            <ChevronDown className={`h-4 w-4 transition-transform ${openSections.summary ? 'rotate-180' : ''}`} />
          </CollapsibleTrigger>
          <CollapsibleContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Penyewa</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead>Tanggal Pindah</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Hapus</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {notices.map(n => {
                  const t = tenantProfiles[n.tenant_user_id];
                  const contract = n.contract as any;
                  return (
                    <TableRow key={n.id}>
                      <TableCell>{t?.full_name || 'N/A'}</TableCell>
                      <TableCell>{contract?.unit?.unit_number} — {contract?.unit?.property?.name}</TableCell>
                      <TableCell>{format(new Date(n.intended_move_out_date), 'dd MMM yyyy', { locale: localeId })}</TableCell>
                      <TableCell>
                        <span className={`text-xs px-2 py-1 rounded-full ${n.status === 'acknowledged' ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'}`}>
                          {n.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => removeNotice(n.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CollapsibleContent>
        </div>
      </Collapsible>

      {/* Section 2: Bulk Acknowledge */}
      <Collapsible open={openSections.acknowledge} onOpenChange={() => toggle('acknowledge')}>
        <div className="border border-border/40 rounded-xl overflow-hidden">
          <CollapsibleTrigger className="flex w-full items-center justify-between p-4 bg-muted/30 hover:bg-muted/50 transition-colors">
            <div className="flex items-center gap-2">
              <ClipboardCheck className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">Konfirmasi Pemberitahuan</h3>
              {unacknowledgedIds.length > 0 && (
                <span className="text-xs bg-warning/10 text-warning px-2 py-0.5 rounded-full">{unacknowledgedIds.length} belum dikonfirmasi</span>
              )}
            </div>
            <ChevronDown className={`h-4 w-4 transition-transform ${openSections.acknowledge ? 'rotate-180' : ''}`} />
          </CollapsibleTrigger>
          <CollapsibleContent className="p-4 space-y-3">
            {notices.map(n => (
              <div key={n.id} className="flex items-center justify-between py-2 border-b border-border/20 last:border-0">
                <span className="text-sm">{(n.contract as any)?.unit?.unit_number} — {tenantProfiles[n.tenant_user_id]?.full_name}</span>
                {n.status === 'acknowledged' || n.status === 'completed' ? (
                  <CheckCircle2 className="h-4 w-4 text-success" />
                ) : (
                  <span className="text-xs text-muted-foreground">Menunggu</span>
                )}
              </div>
            ))}
            {unacknowledgedIds.length > 0 && (
              <Button
                onClick={() => bulkAcknowledge.mutate(unacknowledgedIds)}
                disabled={bulkAcknowledge.isPending}
                className="w-full"
              >
                {bulkAcknowledge.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Konfirmasi Semua ({unacknowledgedIds.length})
              </Button>
            )}
          </CollapsibleContent>
        </div>
      </Collapsible>

      {/* Section 3: Bulk Schedule Inspection */}
      <Collapsible open={openSections.inspection} onOpenChange={() => toggle('inspection')}>
        <div className="border border-border/40 rounded-xl overflow-hidden">
          <CollapsibleTrigger className="flex w-full items-center justify-between p-4 bg-muted/30 hover:bg-muted/50 transition-colors">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">Jadwal Inspeksi</h3>
            </div>
            <ChevronDown className={`h-4 w-4 transition-transform ${openSections.inspection ? 'rotate-180' : ''}`} />
          </CollapsibleTrigger>
          <CollapsibleContent className="p-4 space-y-4">
            <div>
              <label className="text-sm font-medium block mb-1">Tanggal & Waktu Inspeksi</label>
              <input
                type="datetime-local"
                value={inspectionDate}
                onChange={e => setInspectionDate(e.target.value)}
                className="border border-border rounded-lg px-3 py-2 text-sm bg-background w-full max-w-xs"
              />
            </div>
            <div className="space-y-2">
              {notices.map(n => {
                const hasInspection = inspections.some((i: any) => i.move_out_notice_id === n.id);
                return (
                  <div key={n.id} className="flex items-center gap-3">
                    <Checkbox
                      checked={inspectionInclude.has(n.id) && !hasInspection}
                      disabled={hasInspection}
                      onCheckedChange={() => {
                        setInspectionInclude(prev => {
                          const next = new Set(prev);
                          next.has(n.id) ? next.delete(n.id) : next.add(n.id);
                          return next;
                        });
                      }}
                    />
                    <span className="text-sm">
                      {(n.contract as any)?.unit?.unit_number}
                      {hasInspection && <span className="text-success ml-2 text-xs">(sudah dijadwalkan)</span>}
                    </span>
                  </div>
                );
              })}
            </div>
            {noInspectionIds.length > 0 && (
              <Button
                disabled={!inspectionDate || bulkScheduleInspection.isPending}
                onClick={() => {
                  const toSchedule = noInspectionIds.filter(id => inspectionInclude.has(id));
                  if (toSchedule.length) bulkScheduleInspection.mutate({ ids: toSchedule, scheduledDate: inspectionDate });
                }}
                className="w-full"
              >
                {bulkScheduleInspection.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Jadwalkan Semua ({noInspectionIds.filter(id => inspectionInclude.has(id)).length})
              </Button>
            )}
          </CollapsibleContent>
        </div>
      </Collapsible>

      {/* Section 4: Bulk Settle */}
      <Collapsible open={openSections.settle} onOpenChange={() => toggle('settle')}>
        <div className="border border-border/40 rounded-xl overflow-hidden">
          <CollapsibleTrigger className="flex w-full items-center justify-between p-4 bg-muted/30 hover:bg-muted/50 transition-colors">
            <div className="flex items-center gap-2">
              <Wallet className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">Selesaikan Deposit & Kontrak</h3>
            </div>
            <ChevronDown className={`h-4 w-4 transition-transform ${openSections.settle ? 'rotate-180' : ''}`} />
          </CollapsibleTrigger>
          <CollapsibleContent className="p-4 space-y-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Penyewa</TableHead>
                  <TableHead>Deposit</TableHead>
                  <TableHead>Potongan</TableHead>
                  <TableHead>Refund</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {notices.map(n => {
                  const contract = n.contract as any;
                  const refund = depositRefunds.find(r => r.contract_id === contract?.id);
                  return (
                    <TableRow key={n.id}>
                      <TableCell>{tenantProfiles[n.tenant_user_id]?.full_name || 'N/A'}</TableCell>
                      <TableCell>{formatCurrency(contract?.deposit_amount || 0)}</TableCell>
                      <TableCell>{formatCurrency(refund?.deductions || 0)}</TableCell>
                      <TableCell>{formatCurrency(refund?.refund_amount || contract?.deposit_amount || 0)}</TableCell>
                      <TableCell>
                        <span className={`text-xs px-2 py-1 rounded-full ${refund?.status === 'approved' ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'}`}>
                          {refund?.status || 'Belum ada'}
                        </span>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            <div className="flex gap-3">
              <Button
                variant="outline"
                disabled={bulkApproveRefunds.isPending || !contractIds.length}
                onClick={() => bulkApproveRefunds.mutate(contractIds)}
                className="flex-1"
              >
                {bulkApproveRefunds.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Setujui Semua Refund
              </Button>
              <Button
                variant="destructive"
                disabled={bulkTerminateContracts.isPending || !contractIds.length}
                onClick={() => bulkTerminateContracts.mutate(contractIds)}
                className="flex-1"
              >
                {bulkTerminateContracts.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Akhiri Semua Kontrak
              </Button>
            </div>
          </CollapsibleContent>
        </div>
      </Collapsible>

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={() => navigate('/merchant/move-outs')}>Kembali</Button>
      </div>
    </div>
  );
}
