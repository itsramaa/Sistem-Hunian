import { useState } from 'react';
import { Shield, Play, CheckCircle, AlertTriangle, XCircle, History, RotateCcw, Info, Loader2 } from 'lucide-react';
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

interface DataQualityHistoryProps {
  propertyId?: string;
}

export default function DataQualityHistory({ propertyId: propPropertyId }: DataQualityHistoryProps = {}) {
  const { merchant } = useAuth();
  const merchantId = merchant?.id;
  const showPropertySelector = !propPropertyId;
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>(propPropertyId || '');
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
      // TODO: Go endpoint not yet implemented — was: supabase.from('units').select('id, unit_number').eq('property_id', selectedPropertyId)
      return [];
    },
    enabled: !!selectedPropertyId,
  });

  // Fetch versions for selected entity
  const versions = useDataVersions(selectedEntity?.type, selectedEntity?.id);

  // Fetch audit logs for history tab
  const { data: auditLogs } = useQuery({
    queryKey: ['audit-logs-property', selectedPropertyId],
    queryFn: async () => {
      // TODO: Go endpoint not yet implemented — was: supabase.from('audit_logs').select('*').in('entity_id', entityIds)
      return [];
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
        <div className="p-2 rounded-lg bg-primary/10" aria-hidden="true">
          <Shield className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Kualitas Data & Riwayat</h1>
          <p className="text-muted-foreground text-sm">Validasi, versi, dan jejak audit data properti Anda</p>
        </div>
        <Badge variant="outline" className="ml-auto rounded-full">Tata Kelola Data</Badge>
      </div>

      {/* Property Selector */}
      {showPropertySelector && (
        <Card className="rounded-2xl border-border/40 bg-card/90 backdrop-blur-sm shadow-sm">
          <CardContent className="pt-4">
            <Label htmlFor="property-select" className="text-sm font-medium mb-1.5 block">Pilih Properti</Label>
            <Select value={selectedPropertyId} onValueChange={(v) => { setSelectedPropertyId(v); setResult(null); setSelectedEntity(null); }}>
              <SelectTrigger id="property-select" className="rounded-xl bg-background/50" aria-label="Pilih properti untuk pemeriksaan kualitas">
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
      )}

      {selectedPropertyId && (
        <Tabs defaultValue="validation" className="space-y-4">
          <TabsList className="pill-tab-list" aria-label="Menu kualitas data">
            <TabsTrigger value="validation" className="pill-tab-trigger">Validasi & Kualitas</TabsTrigger>
            <TabsTrigger value="history" className="pill-tab-trigger">Riwayat Perubahan</TabsTrigger>
            <TabsTrigger value="restore" className="pill-tab-trigger">Pulihkan Data</TabsTrigger>
          </TabsList>

          {/* TAB 1: Validation */}
          <TabsContent value="validation" className="space-y-4">
            <div className="flex flex-wrap gap-3 items-center">
              <Button onClick={handleRunValidation} disabled={qualityCheck.isPending} className="rounded-xl gradient-cta shadow-sm">
                {qualityCheck.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" aria-hidden="true" /> : <Play className="h-4 w-4 mr-2" aria-hidden="true" />}
                {qualityCheck.isPending ? 'Memproses...' : 'Jalankan Validasi'}
              </Button>
              {currentCheck && !currentCheck.is_final_validated && !hasCriticalErrors && (
                <Button variant="outline" onClick={() => markFinal.mutate(currentCheck.id)} disabled={markFinal.isPending} className="rounded-xl border-primary/30 hover:bg-primary/5">
                  <CheckCircle className="h-4 w-4 mr-2" aria-hidden="true" />
                  Tandai Validasi Final
                </Button>
              )}
              {currentCheck?.is_final_validated && (
                <Badge className="bg-success/20 text-success border-success/30 rounded-full px-3 py-1">✓ Validasi Final Selesai</Badge>
              )}
            </div>

            {displayResult && (
              <>
                {/* Score Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="rounded-2xl border-border/40 bg-card/90 backdrop-blur-sm shadow-sm">
                    <CardHeader className="pb-2"><CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Skor Properti</CardTitle></CardHeader>
                    <CardContent>
                      <span className={`text-3xl font-bold ${scoreColor(displayResult.property_score)}`}>
                        {displayResult.property_score}
                      </span>
                      <span className="text-muted-foreground text-sm">/100</span>
                    </CardContent>
                  </Card>
                  <Card className="rounded-2xl border-border/40 bg-card/90 backdrop-blur-sm shadow-sm">
                    <CardHeader className="pb-2"><CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Skor Agregat</CardTitle></CardHeader>
                    <CardContent>
                      <span className={`text-3xl font-bold ${scoreColor(displayResult.aggregate_score)}`}>
                        {displayResult.aggregate_score}
                      </span>
                      <span className="text-muted-foreground text-sm">/100</span>
                    </CardContent>
                  </Card>
                  <Card className="rounded-2xl border-border/40 bg-card/90 backdrop-blur-sm shadow-sm">
                    <CardHeader className="pb-2"><CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total Temuan</CardTitle></CardHeader>
                    <CardContent>
                      <div className="flex gap-4 text-sm">
                        <div className="flex flex-col">
                          <span className="text-destructive font-bold text-lg">
                            {displayResult.validations.filter(v => v.status === 'error').length}
                          </span>
                          <span className="text-muted-foreground text-xs">Error</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-warning font-bold text-lg">
                            {displayResult.validations.filter(v => v.status === 'warning').length}
                          </span>
                          <span className="text-muted-foreground text-xs">Peringatan</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {displayResult.summary && (
                  <Card className="rounded-xl border-primary/20 bg-primary/5">
                    <CardContent className="pt-4 flex gap-3 items-start">
                      <Info className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" aria-hidden="true" />
                      <p className="text-sm text-muted-foreground">{displayResult.summary}</p>
                    </CardContent>
                  </Card>
                )}

                {/* Validation Table */}
                <Card className="rounded-2xl border-border/40 bg-card/90 backdrop-blur-sm shadow-sm overflow-hidden" role="region" aria-label="Hasil Rincian Validasi">
                  <CardHeader className="bg-muted/30 border-b border-border/40"><CardTitle className="text-base">Rincian Validasi</CardTitle></CardHeader>
                  <CardContent className="p-0">
                    {displayResult.validations.length === 0 ? (
                      <div className="p-8 text-center" role="status">
                        <CheckCircle className="h-10 w-10 text-success/40 mx-auto mb-3" aria-hidden="true" />
                        <p className="text-muted-foreground text-sm font-medium">Semua data valid. Tidak ada masalah ditemukan.</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-border/30">
                        {displayResult.validations.map((v, i) => {
                          const isOverridden = currentCheck?.overrides?.some((o: any) => o.rule === v.rule);
                          return (
                            <div key={i} className={`flex items-start gap-4 p-4 transition-colors hover:bg-muted/20 ${isOverridden ? 'opacity-60 grayscale-[0.5]' : ''}`}>
                              <div className="mt-0.5" aria-hidden="true">
                                {v.status === 'error' ? <XCircle className="h-5 w-5 text-destructive" /> : 
                                 v.status === 'warning' ? <AlertTriangle className="h-5 w-5 text-warning" /> : 
                                 <CheckCircle className="h-5 w-5 text-success" />}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex flex-wrap items-center gap-2 mb-1.5">
                                  <Badge variant="outline" className="text-[10px] font-mono tracking-tighter rounded-md uppercase px-1.5">{v.rule}</Badge>
                                  <Badge className={`text-[10px] font-bold uppercase rounded-md px-1.5 ${
                                    v.severity === 'critical' ? 'bg-destructive text-destructive-foreground' :
                                    v.severity === 'high' ? 'bg-destructive/15 text-destructive border-destructive/20' :
                                    v.severity === 'medium' ? 'bg-warning/15 text-warning border-warning/20' :
                                    'bg-muted text-muted-foreground'
                                  }`}>
                                    {v.severity === 'critical' ? 'Kritis' : v.severity === 'high' ? 'Tinggi' : v.severity === 'medium' ? 'Sedang' : 'Rendah'}
                                  </Badge>
                                  {isOverridden && <Badge variant="secondary" className="text-[10px] font-medium rounded-md px-1.5">Ditimpa</Badge>}
                                </div>
                                <p className="text-sm font-medium text-foreground leading-relaxed">{v.message}</p>
                                {v.suggestion && (
                                  <div className="flex items-center gap-1.5 mt-1.5 text-xs text-muted-foreground bg-muted/40 p-1.5 rounded-lg border border-border/20 w-fit">
                                    <span aria-hidden="true">💡</span>
                                    <span className="font-medium">Saran:</span> {v.suggestion}
                                  </div>
                                )}
                              </div>
                              {v.status === 'error' && currentCheck && !isOverridden && (
                                <Button size="sm" variant="ghost" onClick={() => setOverrideDialog({ checkId: currentCheck.id, rule: v.rule })} className="text-xs h-8 rounded-lg hover:bg-primary/5 hover:text-primary">
                                  Timpa (Override)
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
            <Card className="rounded-2xl border-border/40 bg-card/90 backdrop-blur-sm shadow-sm overflow-hidden" role="region" aria-label="Riwayat Jejak Audit">
              <CardHeader className="bg-muted/30 border-b border-border/40"><CardTitle className="text-base flex items-center gap-2"><History className="h-4 w-4" aria-hidden="true" /> Jejak Audit</CardTitle></CardHeader>
              <CardContent className="p-0">
                {(!auditLogs || auditLogs.length === 0) ? (
                  <div className="p-12 text-center" role="status">
                    <History className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" aria-hidden="true" />
                    <p className="text-muted-foreground text-sm">Belum ada riwayat perubahan yang tercatat.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-border/30">
                    {auditLogs.map((log: any) => (
                      <div key={log.id} className="p-4 transition-colors hover:bg-muted/20">
                        <div className="flex items-center gap-3 mb-2">
                          <Badge variant="outline" className="text-[10px] font-bold uppercase rounded-md bg-background/50">{log.action === 'insert' ? 'Tambah' : log.action === 'update' ? 'Ubah' : 'Hapus'}</Badge>
                          <Badge variant="secondary" className="text-[10px] font-bold uppercase rounded-md px-1.5">{log.entity_type === 'property' ? 'Properti' : 'Unit'}</Badge>
                          <span className="text-xs text-muted-foreground ml-auto font-medium">
                            {format(new Date(log.created_at), 'dd MMM yyyy HH:mm', { locale: idLocale })}
                          </span>
                        </div>
                        {log.old_data && log.new_data && (
                          <details className="group">
                            <summary className="text-xs text-primary font-medium cursor-pointer hover:underline list-none flex items-center gap-1">
                              <span className="group-open:rotate-90 transition-transform">▶</span> Lihat detail perubahan
                            </summary>
                            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 text-[10px]">
                              <div className="space-y-1.5">
                                <p className="font-bold text-muted-foreground uppercase tracking-tight pl-1">Sebelum:</p>
                                <pre className="bg-muted/60 p-3 rounded-xl border border-border/30 overflow-auto max-h-48 font-mono shadow-inner">
                                  {JSON.stringify(log.old_data, null, 2)}
                                </pre>
                              </div>
                              <div className="space-y-1.5">
                                <p className="font-bold text-muted-foreground uppercase tracking-tight pl-1">Sesudah:</p>
                                <pre className="bg-muted/60 p-3 rounded-xl border border-border/30 overflow-auto max-h-48 font-mono shadow-inner">
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
            <Card className="rounded-2xl border-border/40 bg-card/90 backdrop-blur-sm shadow-sm">
              <CardContent className="pt-4 space-y-4">
                <Label className="text-sm font-semibold mb-1 block">Pilih Entitas untuk Dipulihkan</Label>
                <div className="flex gap-2 flex-wrap">
                  <Button
                    size="sm"
                    variant={selectedEntity?.type === 'property' && selectedEntity?.id === selectedPropertyId ? 'default' : 'outline'}
                    onClick={() => setSelectedEntity({ type: 'property', id: selectedPropertyId })}
                    className="rounded-lg h-9"
                  >
                    Properti Utama
                  </Button>
                  {units?.map(u => (
                    <Button
                      key={u.id}
                      size="sm"
                      variant={selectedEntity?.id === u.id ? 'default' : 'outline'}
                      onClick={() => setSelectedEntity({ type: 'unit', id: u.id })}
                      className="rounded-lg h-9"
                    >
                      Unit {u.unit_number}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {selectedEntity && (
              <Card className="rounded-2xl border-border/40 bg-card/90 backdrop-blur-sm shadow-sm overflow-hidden" role="region" aria-label="Daftar Versi Tersedia">
                <CardHeader className="bg-muted/30 border-b border-border/40"><CardTitle className="text-base flex items-center gap-2"><RotateCcw className="h-4 w-4" aria-hidden="true" /> Versi Tersimpan</CardTitle></CardHeader>
                <CardContent className="p-0">
                  {versions.isLoading ? (
                    <div className="p-12 text-center" role="status">
                      <Loader2 className="h-8 w-8 animate-spin text-primary/40 mx-auto" aria-hidden="true" />
                      <p className="text-muted-foreground text-sm mt-3">Memuat daftar versi...</p>
                    </div>
                  ) : !versions.data?.length ? (
                    <div className="p-12 text-center" role="status">
                      <RotateCcw className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" aria-hidden="true" />
                      <p className="text-muted-foreground text-sm">Belum ada snapshot versi yang tersimpan untuk entitas ini.</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-border/30">
                      {versions.data.map(v => (
                        <div key={v.id} className="p-4 transition-colors hover:bg-muted/20">
                          <div className="flex items-center gap-3 mb-2">
                            <Badge variant="outline" className="font-mono text-xs rounded-md bg-background/50">v{v.version_number}</Badge>
                            <span className="text-xs text-muted-foreground font-medium">
                              {format(new Date(v.created_at), 'dd MMM yyyy HH:mm', { locale: idLocale })}
                            </span>
                            <Button size="sm" variant="outline" className="ml-auto rounded-lg h-8 text-xs border-primary/30 hover:bg-primary/5 hover:text-primary gap-1.5" onClick={() => setRestoreConfirm(v.id)}>
                              <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                              Pulihkan
                            </Button>
                          </div>
                          {v.change_summary && <p className="text-sm font-medium mb-1">{v.change_summary}</p>}
                          {v.change_reason && (
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-3">
                              <span className="font-bold uppercase text-[9px] tracking-tight text-muted-foreground/60">Alasan:</span>
                              {v.change_reason}
                            </div>
                          )}
                          <details className="group">
                            <summary className="text-[10px] text-primary font-bold uppercase tracking-wider cursor-pointer hover:underline list-none flex items-center gap-1">
                              <span className="group-open:rotate-90 transition-transform">▶</span> Preview Data Snapshot
                            </summary>
                            <pre className="mt-3 bg-muted/60 p-3 rounded-xl border border-border/30 text-[10px] overflow-auto max-h-48 font-mono shadow-inner">
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
        <DialogContent className="rounded-2xl max-w-md">
          <DialogHeader><DialogTitle>Override Validasi</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="p-3 bg-warning/10 border border-warning/20 rounded-xl flex gap-3 items-start">
              <AlertTriangle className="h-5 w-5 text-warning shrink-0" aria-hidden="true" />
              <p className="text-xs text-warning leading-relaxed">
                Tindakan ini akan mengabaikan kesalahan validasi. Pastikan data benar-benar valid secara manual sebelum melanjutkan.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="override-reason" className="text-sm font-semibold">Alasan Penimpaan</Label>
              <Textarea 
                id="override-reason"
                value={overrideReason} 
                onChange={e => setOverrideReason(e.target.value)} 
                placeholder="Jelaskan mengapa validasi ini dapat diabaikan (misal: pengecualian khusus bisnis)..." 
                className="rounded-xl min-h-[100px] bg-muted/30 focus:bg-background transition-colors"
                aria-required="true"
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="ghost" onClick={() => { setOverrideDialog(null); setOverrideReason(''); }} className="rounded-xl">Batal</Button>
            <Button onClick={handleOverride} disabled={!overrideReason.trim() || overrideMutation.isPending} className="rounded-xl gradient-cta shadow-sm">
              {overrideMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Simpan & Abaikan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Restore Confirmation */}
      <AlertDialog open={!!restoreConfirm} onOpenChange={() => setRestoreConfirm(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-warning">
              <RotateCcw className="h-5 w-5" aria-hidden="true" />
              Pulihkan Data ke Versi Ini?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm leading-relaxed pt-2">
              Data saat ini akan digantikan sepenuhnya oleh data dari snapshot versi yang dipilih. 
              Sistem akan secara otomatis membuat versi baru (backup) dari data Anda saat ini sebelum proses pemulihan dilakukan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4 gap-2 sm:gap-0">
            <AlertDialogCancel className="rounded-xl">Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleRestore} disabled={restoreMutation.isPending} className="rounded-xl gradient-cta border-none shadow-sm">
              {restoreMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Ya, Pulihkan Sekarang
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
