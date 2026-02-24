import { useState } from 'react';
import { Shield, Play, CheckCircle, AlertTriangle, XCircle, History, RotateCcw, Info } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { Badge } from '@/shared/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/shared/components/ui/dialog';
import { Textarea } from '@/shared/components/ui/textarea';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/shared/components/ui/alert-dialog';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useDataQualityCheck, useLatestQualityCheck, useOverrideValidation, useMarkFinalValidated, useDataVersions, useRestoreVersion } from '@/features/properties/hooks/useDataQuality';
import { propertyService } from '@/features/properties/services/propertyService';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/integrations/supabase/client';
import type { ValidationResult, QualityCheckResult } from '@/features/properties/services/dataQualityService';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';

const severityColor: Record<string, string> = {
  low: 'bg-muted text-muted-foreground',
  medium: 'bg-accent text-accent-foreground',
  high: 'bg-destructive/20 text-destructive',
  critical: 'bg-destructive text-destructive-foreground',
};

const statusIcon: Record<string, React.ReactNode> = {
  pass: <CheckCircle className="h-4 w-4 text-primary" />,
  warning: <AlertTriangle className="h-4 w-4 text-accent-foreground" />,
  error: <XCircle className="h-4 w-4 text-destructive" />,
};

export default function DataQualityHistory() {
  const { merchant } = useAuth();
  const merchantId = merchant?.id;
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('');
  const [result, setResult] = useState<QualityCheckResult | null>(null);
  const [overrideDialog, setOverrideDialog] = useState<{ checkId: string; rule: string } | null>(null);
  const [overrideReason, setOverrideReason] = useState('');
  const [restoreConfirm, setRestoreConfirm] = useState<string | null>(null);
  const [selectedEntity, setSelectedEntity] = useState<{ type: string; id: string } | null>(null);

  const qualityCheck = useDataQualityCheck();
  const latestCheck = useLatestQualityCheck(selectedPropertyId || undefined);
  const overrideMutation = useOverrideValidation();
  const markFinal = useMarkFinalValidated();
  const restoreMutation = useRestoreVersion();

  const { data: properties } = useQuery({
    queryKey: ['properties-list', merchantId],
    queryFn: () => propertyService.fetchProperties(merchantId!),
    enabled: !!merchantId,
  });

  // Fetch units for selected property (for version tab)
  const { data: units } = useQuery({
    queryKey: ['units-for-property', selectedPropertyId],
    queryFn: async () => {
      const { data } = await supabase.from('units').select('id, unit_number').eq('property_id', selectedPropertyId).order('unit_number');
      return data || [];
    },
    enabled: !!selectedPropertyId,
  });

  // Fetch versions for selected entity
  const versions = useDataVersions(selectedEntity?.type, selectedEntity?.id);

  // Fetch audit logs for history tab
  const { data: auditLogs } = useQuery({
    queryKey: ['audit-logs-property', selectedPropertyId],
    queryFn: async () => {
      const entityIds = [selectedPropertyId, ...(units?.map(u => u.id) || [])];
      const { data } = await supabase
        .from('audit_logs')
        .select('*')
        .in('entity_id', entityIds)
        .in('entity_type', ['property', 'unit'])
        .order('created_at', { ascending: false })
        .limit(50);
      return data || [];
    },
    enabled: !!selectedPropertyId && !!units,
  });

  const handleRunValidation = async () => {
    if (!selectedPropertyId) return;
    const res = await qualityCheck.mutateAsync(selectedPropertyId);
    setResult(res);
  };

  const handleOverride = () => {
    if (!overrideDialog || !overrideReason.trim()) return;
    overrideMutation.mutate(
      { checkId: overrideDialog.checkId, rule: overrideDialog.rule, reason: overrideReason },
      { onSuccess: () => { setOverrideDialog(null); setOverrideReason(''); } }
    );
  };

  const handleRestore = () => {
    if (!restoreConfirm) return;
    restoreMutation.mutate(restoreConfirm, { onSuccess: () => setRestoreConfirm(null) });
  };

  const currentCheck = latestCheck.data;
  const displayResult = result || (currentCheck ? {
    aggregate_score: currentCheck.quality_score,
    validations: currentCheck.validation_results,
    property_score: currentCheck.quality_score,
    unit_scores: [],
    outliers: [],
    summary: '',
  } as QualityCheckResult : null);

  const hasCriticalErrors = displayResult?.validations?.some(
    v => v.status === 'error' && v.severity === 'critical'
  );

  const scoreColor = (score: number) =>
    score >= 80 ? 'text-primary' : score >= 50 ? 'text-accent-foreground' : 'text-destructive';

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <Shield className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Kualitas Data & Riwayat</h1>
          <p className="text-muted-foreground text-sm">Validasi, versioning, dan audit trail data properti</p>
        </div>
        <Badge variant="outline" className="ml-auto">Data Governance</Badge>
      </div>

      {/* Property Selector */}
      <Card>
        <CardContent className="pt-4">
          <Label>Pilih Properti</Label>
          <Select value={selectedPropertyId} onValueChange={(v) => { setSelectedPropertyId(v); setResult(null); setSelectedEntity(null); }}>
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Pilih properti..." />
            </SelectTrigger>
            <SelectContent>
              {properties?.map(p => (
                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {selectedPropertyId && (
        <Tabs defaultValue="validation">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="validation">Validasi & Kualitas</TabsTrigger>
            <TabsTrigger value="history">Riwayat Perubahan</TabsTrigger>
            <TabsTrigger value="restore">Restore Data</TabsTrigger>
          </TabsList>

          {/* TAB 1: Validation */}
          <TabsContent value="validation" className="space-y-4">
            <div className="flex gap-3 items-center">
              <Button onClick={handleRunValidation} disabled={qualityCheck.isPending}>
                <Play className="h-4 w-4 mr-2" />
                {qualityCheck.isPending ? 'Memproses...' : 'Jalankan Validasi'}
              </Button>
              {currentCheck && !currentCheck.is_final_validated && !hasCriticalErrors && (
                <Button variant="outline" onClick={() => markFinal.mutate(currentCheck.id)} disabled={markFinal.isPending}>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Tandai Validasi Final
                </Button>
              )}
              {currentCheck?.is_final_validated && (
                <Badge className="bg-primary/20 text-primary">✓ Final Validated</Badge>
              )}
            </div>

            {displayResult && (
              <>
                {/* Score Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm">Skor Properti</CardTitle></CardHeader>
                    <CardContent>
                      <span className={`text-3xl font-bold ${scoreColor(displayResult.property_score)}`}>
                        {displayResult.property_score}
                      </span>
                      <span className="text-muted-foreground text-sm">/100</span>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm">Skor Agregat</CardTitle></CardHeader>
                    <CardContent>
                      <span className={`text-3xl font-bold ${scoreColor(displayResult.aggregate_score)}`}>
                        {displayResult.aggregate_score}
                      </span>
                      <span className="text-muted-foreground text-sm">/100</span>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm">Total Temuan</CardTitle></CardHeader>
                    <CardContent>
                      <div className="flex gap-3 text-sm">
                        <span className="text-destructive font-medium">
                          {displayResult.validations.filter(v => v.status === 'error').length} Error
                        </span>
                        <span className="text-accent-foreground font-medium">
                          {displayResult.validations.filter(v => v.status === 'warning').length} Warning
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {displayResult.summary && (
                  <Card>
                    <CardContent className="pt-4 flex gap-2 items-start">
                      <Info className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" />
                      <p className="text-sm text-muted-foreground">{displayResult.summary}</p>
                    </CardContent>
                  </Card>
                )}

                {/* Validation Table */}
                <Card>
                  <CardHeader><CardTitle className="text-base">Hasil Validasi</CardTitle></CardHeader>
                  <CardContent>
                    {displayResult.validations.length === 0 ? (
                      <p className="text-muted-foreground text-sm">Tidak ada temuan.</p>
                    ) : (
                      <div className="space-y-2">
                        {displayResult.validations.map((v, i) => {
                          const isOverridden = currentCheck?.overrides?.some((o: any) => o.rule === v.rule);
                          return (
                            <div key={i} className={`flex items-start gap-3 p-3 rounded-lg border ${isOverridden ? 'opacity-50' : ''}`}>
                              {statusIcon[v.status]}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <Badge variant="outline" className="text-xs">{v.rule}</Badge>
                                  <Badge className={`text-xs ${severityColor[v.severity]}`}>{v.severity}</Badge>
                                  {isOverridden && <span className="text-xs text-muted-foreground ml-2">(Ditimpa)</span>}
                                </div>
                                <p className="text-sm">{v.message}</p>
                                {v.suggestion && <p className="text-xs text-muted-foreground mt-1">💡 {v.suggestion}</p>}
                              </div>
                              {v.status === 'error' && currentCheck && !isOverridden && (
                                <Button size="sm" variant="ghost" onClick={() => setOverrideDialog({ checkId: currentCheck.id, rule: v.rule })}>
                                  Override
                                </Button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          {/* TAB 2: History */}
          <TabsContent value="history" className="space-y-4">
            <Card>
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><History className="h-4 w-4" /> Riwayat Perubahan</CardTitle></CardHeader>
              <CardContent>
                {(!auditLogs || auditLogs.length === 0) ? (
                  <p className="text-muted-foreground text-sm">Belum ada riwayat perubahan.</p>
                ) : (
                  <div className="space-y-3">
                    {auditLogs.map((log: any) => (
                      <div key={log.id} className="border rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="text-xs">{log.action}</Badge>
                          <Badge variant="secondary" className="text-xs">{log.entity_type}</Badge>
                          <span className="text-xs text-muted-foreground ml-auto">
                            {format(new Date(log.created_at), 'dd MMM yyyy HH:mm', { locale: idLocale })}
                          </span>
                        </div>
                        {log.old_data && log.new_data && (
                          <details className="mt-2">
                            <summary className="text-xs text-primary cursor-pointer">Lihat detail perubahan</summary>
                            <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                              <div>
                                <p className="font-medium text-muted-foreground mb-1">Sebelum:</p>
                                <pre className="bg-muted p-2 rounded text-xs overflow-auto max-h-32">
                                  {JSON.stringify(log.old_data, null, 2)}
                                </pre>
                              </div>
                              <div>
                                <p className="font-medium text-muted-foreground mb-1">Sesudah:</p>
                                <pre className="bg-muted p-2 rounded text-xs overflow-auto max-h-32">
                                  {JSON.stringify(log.new_data, null, 2)}
                                </pre>
                              </div>
                            </div>
                          </details>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 3: Restore */}
          <TabsContent value="restore" className="space-y-4">
            <Card>
              <CardContent className="pt-4 space-y-3">
                <Label>Pilih Entity</Label>
                <div className="flex gap-2 flex-wrap">
                  <Button
                    size="sm"
                    variant={selectedEntity?.type === 'property' && selectedEntity?.id === selectedPropertyId ? 'default' : 'outline'}
                    onClick={() => setSelectedEntity({ type: 'property', id: selectedPropertyId })}
                  >
                    Properti
                  </Button>
                  {units?.map(u => (
                    <Button
                      key={u.id}
                      size="sm"
                      variant={selectedEntity?.id === u.id ? 'default' : 'outline'}
                      onClick={() => setSelectedEntity({ type: 'unit', id: u.id })}
                    >
                      Unit {u.unit_number}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {selectedEntity && (
              <Card>
                <CardHeader><CardTitle className="text-base flex items-center gap-2"><RotateCcw className="h-4 w-4" /> Daftar Versi</CardTitle></CardHeader>
                <CardContent>
                  {versions.isLoading ? (
                    <p className="text-muted-foreground text-sm">Memuat...</p>
                  ) : !versions.data?.length ? (
                    <p className="text-muted-foreground text-sm">Belum ada versi tersimpan.</p>
                  ) : (
                    <div className="space-y-3">
                      {versions.data.map(v => (
                        <div key={v.id} className="border rounded-lg p-3">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline">v{v.version_number}</Badge>
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(v.created_at), 'dd MMM yyyy HH:mm', { locale: idLocale })}
                            </span>
                            <Button size="sm" variant="outline" className="ml-auto" onClick={() => setRestoreConfirm(v.id)}>
                              <RotateCcw className="h-3 w-3 mr-1" />
                              Restore
                            </Button>
                          </div>
                          {v.change_summary && <p className="text-sm">{v.change_summary}</p>}
                          {v.change_reason && <p className="text-xs text-muted-foreground">Alasan: {v.change_reason}</p>}
                          <details className="mt-2">
                            <summary className="text-xs text-primary cursor-pointer">Preview data</summary>
                            <pre className="mt-1 bg-muted p-2 rounded text-xs overflow-auto max-h-40">
                              {JSON.stringify(v.snapshot_data, null, 2)}
                            </pre>
                          </details>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      )}

      {/* Override Dialog */}
      <Dialog open={!!overrideDialog} onOpenChange={() => { setOverrideDialog(null); setOverrideReason(''); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Override Validasi</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Berikan alasan mengapa error ini dapat diabaikan:</p>
            <Textarea value={overrideReason} onChange={e => setOverrideReason(e.target.value)} placeholder="Alasan override..." />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setOverrideDialog(null); setOverrideReason(''); }}>Batal</Button>
            <Button onClick={handleOverride} disabled={!overrideReason.trim() || overrideMutation.isPending}>Simpan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Restore Confirmation */}
      <AlertDialog open={!!restoreConfirm} onOpenChange={() => setRestoreConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Restore Data?</AlertDialogTitle>
            <AlertDialogDescription>
              Data akan dikembalikan ke versi yang dipilih. Perubahan saat ini akan disimpan sebagai versi baru sebelum restore.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleRestore} disabled={restoreMutation.isPending}>Restore</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
