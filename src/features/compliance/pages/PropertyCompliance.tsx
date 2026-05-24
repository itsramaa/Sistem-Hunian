import { useAuth } from '@/features/auth/hooks/useAuth';
import { useComplianceSummary } from '@/features/compliance/hooks/useCompliance';
import { useOcrCompliance } from '@/features/compliance/hooks/useOcrCompliance';
import { useMerchantProperties } from '@/features/properties/hooks/useMerchantProperties';
import { DISASTER_TYPES, DOC_TYPE_LABELS, DOC_TYPES, INCIDENT_TYPES, POLICY_TYPES, RISK_LABEL, RISK_LEVELS, SEVERITY_LEVELS } from '@/features/compliance/types';
import type { ComplianceDocument, DisasterRiskProfile, InsurancePolicy, SecurityIncident } from '@/features/compliance/types';
import { complianceService } from '@/features/compliance/services/complianceService';
import { RiskScoreIndicator } from '@/features/compliance/components/dss/RiskScoreIndicator';
import { OcrCameraButton } from '@/shared/components/forms/OcrCameraButton';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/shared/components/ui/dialog';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { Textarea } from '@/shared/components/ui/textarea';
import { AlertTriangle, FileText, Loader2, Plus, Shield, ShieldAlert, Umbrella } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useQuery, useQueryClient } from '@tanstack/react-query';

interface PropertyComplianceProps {
  propertyId?: string;
}

export default function PropertyCompliance({ propertyId: propPropertyId }: PropertyComplianceProps = {}) {
  const { merchant } = useAuth();
  const showPropertySelector = !propPropertyId;
  const { properties, loading: propsLoading } = useMerchantProperties(showPropertySelector ? (merchant?.id || '') : '');
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>(propPropertyId || '');

  const { data: summary, isLoading } = useComplianceSummary(selectedPropertyId || undefined);

  if (showPropertySelector && propsLoading) return <div className="flex items-center justify-center p-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Risiko & Kepatuhan</h1>
          <p className="text-muted-foreground">Kelola risiko bencana, asuransi, dokumen & keamanan properti</p>
        </div>
        {showPropertySelector && (
          <Select value={selectedPropertyId} onValueChange={setSelectedPropertyId}>
            <SelectTrigger className="w-64 rounded-xl">
              <SelectValue placeholder="Pilih Properti" />
            </SelectTrigger>
            <SelectContent>
              {properties?.map(p => (
                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {!selectedPropertyId ? (
        <Card className="rounded-2xl border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Shield className="h-12 w-12 mb-4 opacity-40" />
            <p className="text-lg font-medium">Pilih properti untuk melihat data compliance</p>
          </CardContent>
        </Card>
      ) : isLoading ? (
        <div className="flex items-center justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <KpiCard icon={<AlertTriangle className="h-5 w-5" />} label="Skor Risiko" value={summary?.riskProfile?.overall_risk_score ?? 0} suffix="/100" color={getScoreColor(summary?.riskProfile?.overall_risk_score ?? 0)} />
            <KpiCard icon={<Umbrella className="h-5 w-5" />} label="Polis Aktif" value={summary?.activePolicies ?? 0} suffix={`/ ${summary?.policies?.length ?? 0}`} color="text-primary" />
            <KpiCard icon={<FileText className="h-5 w-5" />} label="Dokumen Expired" value={summary?.expiredDocs ?? 0} suffix={`/ ${summary?.totalDocs ?? 0}`} color={summary?.expiredDocs ? 'text-destructive' : 'text-success'} />
            <KpiCard icon={<ShieldAlert className="h-5 w-5" />} label="Insiden Terbuka" value={summary?.openIncidents ?? 0} suffix={`/ ${summary?.totalIncidents ?? 0}`} color={summary?.openIncidents ? 'text-warning' : 'text-success'} />
          </div>

          <Tabs defaultValue="risk" className="space-y-4">
            <TabsList className="bg-muted/50 rounded-xl">
              <TabsTrigger value="risk" className="rounded-lg">🌊 Risiko Bencana</TabsTrigger>
              <TabsTrigger value="insurance" className="rounded-lg">🛡️ Asuransi</TabsTrigger>
              <TabsTrigger value="docs" className="rounded-lg">📄 Dokumen</TabsTrigger>
              <TabsTrigger value="security" className="rounded-lg">🔒 Keamanan</TabsTrigger>
            </TabsList>

            <TabsContent value="risk">
              <DisasterRiskTab propertyId={selectedPropertyId} merchantId={merchant!.id} profile={summary?.riskProfile ?? null} />
            </TabsContent>
            <TabsContent value="insurance">
              <InsuranceTab propertyId={selectedPropertyId} merchantId={merchant!.id} policies={summary?.policies ?? []} />
            </TabsContent>
            <TabsContent value="docs">
              <ComplianceDocsTab propertyId={selectedPropertyId} merchantId={merchant!.id} docs={summary?.docs ?? []} />
            </TabsContent>
            <TabsContent value="security">
              <SecurityTab propertyId={selectedPropertyId} merchantId={merchant!.id} incidents={summary?.incidents ?? []} />
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}

function KpiCard({ icon, label, value, suffix, color }: { icon: React.ReactNode; label: string; value: number; suffix?: string; color: string }) {
  return (
    <Card className="rounded-2xl">
      <CardContent className="p-4 flex items-center gap-3">
        <div className={`p-2 rounded-xl bg-muted/50 ${color}`}>{icon}</div>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className={`text-xl font-bold ${color}`}>{value}<span className="text-sm font-normal text-muted-foreground ml-1">{suffix}</span></p>
        </div>
      </CardContent>
    </Card>
  );
}

function getScoreColor(score: number) {
  if (score <= 25) return 'text-success';
  if (score <= 50) return 'text-warning';
  return 'text-destructive';
}

// ====== Disaster Risk Tab ======
function calculateRiskScore(form: { risk_zone: string; flood_risk: string; earthquake_risk: string; landslide_risk: string; fire_risk: string }): number {
  const WEIGHTS: Record<string, number> = { risk_zone: 0.30, flood_risk: 0.25, earthquake_risk: 0.20, landslide_risk: 0.15, fire_risk: 0.10 };
  const SCORES: Record<string, number> = { low: 15, medium: 45, high: 75, critical: 95 };
  return Math.round(
    (SCORES[form.risk_zone] || 0) * WEIGHTS.risk_zone +
    (SCORES[form.flood_risk] || 0) * WEIGHTS.flood_risk +
    (SCORES[form.earthquake_risk] || 0) * WEIGHTS.earthquake_risk +
    (SCORES[form.landslide_risk] || 0) * WEIGHTS.landslide_risk +
    (SCORES[form.fire_risk] || 0) * WEIGHTS.fire_risk
  );
}

function DisasterRiskTab({ propertyId, merchantId, profile }: { propertyId: string; merchantId: string; profile: DisasterRiskProfile | null }) {
  const qc = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    risk_zone: profile?.risk_zone || 'low',
    flood_risk: profile?.flood_risk || 'low',
    earthquake_risk: profile?.earthquake_risk || 'low',
    landslide_risk: profile?.landslide_risk || 'low',
    fire_risk: profile?.fire_risk || 'low',
    overall_risk_score: profile?.overall_risk_score || 0,
    notes: profile?.notes || '',
  });

  useEffect(() => {
    const score = calculateRiskScore(form);
    setForm(f => ({ ...f, overall_risk_score: score }));
  }, [form.risk_zone, form.flood_risk, form.earthquake_risk, form.landslide_risk, form.fire_risk]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await complianceService.upsertDisasterProfile({ ...form, property_id: propertyId, merchant_id: merchantId, disaster_history: profile?.disaster_history || [], mitigation_systems: profile?.mitigation_systems || [] });
      qc.invalidateQueries({ queryKey: ['compliance-summary', propertyId] });
      toast.success('Profil risiko diperbarui');
    } catch { toast.error('Gagal menyimpan'); }
    setSaving(false);
  };

  const riskFields: Record<string, string> = {
    risk_zone: 'Zona Risiko', flood_risk: 'Risiko Banjir', earthquake_risk: 'Risiko Gempa', landslide_risk: 'Risiko Tanah Longsor', fire_risk: 'Risiko Kebakaran',
  };

  return (
    <Card className="rounded-2xl">
      <CardHeader>
        <CardTitle className="text-lg">Profil Risiko Bencana</CardTitle>
        <CardDescription>Penilaian zona risiko dan mitigasi</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {profile && <RiskScoreIndicator score={profile.overall_risk_score} size="lg" />}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {(['risk_zone', 'flood_risk', 'earthquake_risk', 'landslide_risk', 'fire_risk'] as const).map(field => (
            <div key={field} className="space-y-1.5">
              <Label className="text-xs">{riskFields[field]}</Label>
              <Select value={form[field]} onValueChange={v => setForm(f => ({ ...f, [field]: v }))}>
                <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>{RISK_LEVELS.map(l => <SelectItem key={l} value={l}>{RISK_LABEL[l]}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          ))}
          <div className="space-y-1.5">
            <Label className="text-xs">Skor Risiko (otomatis)</Label>
            <div className="flex items-center gap-2">
              <div className={`text-2xl font-bold ${getScoreColor(form.overall_risk_score)}`}>{form.overall_risk_score}</div>
              <span className="text-xs text-muted-foreground">/ 100</span>
            </div>
          </div>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Catatan</Label>
          <Textarea className="rounded-xl" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
        </div>
        <Button onClick={handleSave} disabled={saving} className="rounded-xl gradient-cta">
          {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}Simpan Profil Risiko
        </Button>

        {profile?.disaster_history && profile.disaster_history.length > 0 && (
          <div className="mt-6 space-y-2">
            <h4 className="font-semibold text-sm">Riwayat Bencana</h4>
            {profile.disaster_history.map((d, i) => (
              <div key={i} className="flex justify-between items-center p-3 rounded-xl bg-muted/50 text-sm">
                <div>
                  <span className="font-medium">{d.type}</span> — {d.description}
                  <span className="text-xs text-muted-foreground ml-2">{d.date}</span>
                </div>
                <Badge variant="outline" className="text-destructive">Rp {d.damage_cost?.toLocaleString('id-ID')}</Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ====== Insurance Tab ======
function InsuranceTab({ propertyId, merchantId, policies }: { propertyId: string; merchantId: string; policies: InsurancePolicy[] }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ policy_number: '', provider: '', policy_type: 'comprehensive', coverage_amount: 0, premium_amount: 0, premium_frequency: 'annual', start_date: '', end_date: '' });

  const handleCreate = async () => {
    setSaving(true);
    try {
      await complianceService.createInsurancePolicy({ ...form, property_id: propertyId, merchant_id: merchantId, status: 'active', coverage_details: {} });
      qc.invalidateQueries({ queryKey: ['compliance-summary', propertyId] });
      setOpen(false);
      toast.success('Polis ditambahkan');
    } catch { toast.error('Gagal'); }
    setSaving(false);
  };

  const handleOcrExtracted = (data: Record<string, any>) => {
    if (data.policy_number) setForm(f => ({ ...f, policy_number: String(data.policy_number) }));
    if (data.provider) setForm(f => ({ ...f, provider: String(data.provider) }));
    if (data.coverage_amount) setForm(f => ({ ...f, coverage_amount: Number(data.coverage_amount) || 0 }));
    if (data.premium_amount) setForm(f => ({ ...f, premium_amount: Number(data.premium_amount) || 0 }));
    if (data.start_date) setForm(f => ({ ...f, start_date: String(data.start_date) }));
    if (data.end_date) setForm(f => ({ ...f, end_date: String(data.end_date) }));
  };

  const policyTypeLabels: Record<string, string> = {
    comprehensive: 'Komprehensif', fire: 'Kebakaran', flood: 'Banjir', earthquake: 'Gempa Bumi', liability: 'Tanggung Jawab Hukum',
  };

  return (
    <Card className="rounded-2xl">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-lg">Polis Asuransi</CardTitle>
          <CardDescription>Kelola polis dan cakupan asuransi properti</CardDescription>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button size="sm" className="rounded-xl"><Plus className="h-4 w-4 mr-1" />Tambah Polis</Button></DialogTrigger>
          <DialogContent className="rounded-2xl">
            <DialogHeader><DialogTitle>Tambah Polis Asuransi</DialogTitle></DialogHeader>
            <div className="grid gap-3">
              <OcrCameraButton
                label="Scan Dokumen Polis"
                bucket="verification-documents"
                edgeFunction="ocr-compliance-document"
                extraPayload={{ property_id: propertyId, expected_type: 'insurance_policy' }}
                onExtracted={handleOcrExtracted}
                size="sm"
              />
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><Label className="text-xs">No. Polis</Label><Input className="rounded-xl" value={form.policy_number} onChange={e => setForm(f => ({ ...f, policy_number: e.target.value }))} /></div>
                <div className="space-y-1"><Label className="text-xs">Provider</Label><Input className="rounded-xl" value={form.provider} onChange={e => setForm(f => ({ ...f, provider: e.target.value }))} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Tipe</Label>
                  <Select value={form.policy_type} onValueChange={v => setForm(f => ({ ...f, policy_type: v }))}>
                    <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                    <SelectContent>{POLICY_TYPES.map(t => <SelectItem key={t} value={t} className="capitalize">{policyTypeLabels[t] || t}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Frekuensi Premi</Label>
                  <Select value={form.premium_frequency} onValueChange={v => setForm(f => ({ ...f, premium_frequency: v }))}>
                    <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">Bulanan</SelectItem>
                      <SelectItem value="quarterly">Triwulan</SelectItem>
                      <SelectItem value="annual">Tahunan</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><Label className="text-xs">Coverage (Rp)</Label><Input type="number" className="rounded-xl" value={form.coverage_amount} onChange={e => setForm(f => ({ ...f, coverage_amount: Number(e.target.value) }))} /></div>
                <div className="space-y-1"><Label className="text-xs">Premi (Rp)</Label><Input type="number" className="rounded-xl" value={form.premium_amount} onChange={e => setForm(f => ({ ...f, premium_amount: Number(e.target.value) }))} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><Label className="text-xs">Mulai</Label><Input type="date" className="rounded-xl" value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} /></div>
                <div className="space-y-1"><Label className="text-xs">Berakhir</Label><Input type="date" className="rounded-xl" value={form.end_date} onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))} /></div>
              </div>
              <Button onClick={handleCreate} disabled={saving} className="rounded-xl gradient-cta">{saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}Simpan</Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {policies.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">Belum ada polis asuransi</p>
        ) : (
          <div className="space-y-3">
            {policies.map(p => (
              <div key={p.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/50">
                <div>
                  <p className="font-medium">{p.provider} — {p.policy_number}</p>
                  <p className="text-xs text-muted-foreground">{policyTypeLabels[p.policy_type] || p.policy_type} • {p.start_date} s/d {p.end_date}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold">Rp {p.coverage_amount.toLocaleString('id-ID')}</p>
                  <Badge variant="outline" className={p.status === 'active' ? 'text-success border-success/30' : 'text-destructive border-destructive/30'}>{p.status === 'active' ? 'Aktif' : p.status}</Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ====== Compliance Docs Tab ======
function ComplianceDocsTab({ propertyId, merchantId, docs }: { propertyId: string; merchantId: string; docs: ComplianceDocument[] }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ document_type: 'imb', document_name: '', issue_date: '', expiry_date: '', notes: '' });

  const handleCreate = async () => {
    setSaving(true);
    try {
      await complianceService.createComplianceDoc({ ...form, property_id: propertyId, merchant_id: merchantId, status: 'valid', document_url: null });
      qc.invalidateQueries({ queryKey: ['compliance-summary', propertyId] });
      setOpen(false);
      toast.success('Dokumen ditambahkan');
    } catch { toast.error('Gagal'); }
    setSaving(false);
  };

  const handleOcrExtracted = (data: Record<string, any>) => {
    if (data.document_name) setForm(f => ({ ...f, document_name: String(data.document_name) }));
    if (data.document_type) setForm(f => ({ ...f, document_type: String(data.document_type) }));
    if (data.issue_date) setForm(f => ({ ...f, issue_date: String(data.issue_date) }));
    if (data.expiry_date) setForm(f => ({ ...f, expiry_date: String(data.expiry_date) }));
    if (data.notes) setForm(f => ({ ...f, notes: String(data.notes) }));
  };

  const isExpired = (d: ComplianceDocument) => d.expiry_date && new Date(d.expiry_date) < new Date();

  return (
    <Card className="rounded-2xl">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-lg">Dokumen Kepatuhan</CardTitle>
          <CardDescription>IMB, PBB, sertifikat, polis</CardDescription>
        </div>
        <div className="flex gap-2">
          <OcrCameraButton
            label="Scan Dokumen"
            bucket="verification-documents"
            edgeFunction="ocr-compliance-document"
            extraPayload={{ property_id: propertyId, expected_type: 'compliance_document' }}
            onExtracted={handleOcrExtracted}
            size="sm"
          />
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button size="sm" className="rounded-xl"><Plus className="h-4 w-4 mr-1" />Tambah</Button></DialogTrigger>
          <DialogContent className="rounded-2xl">
            <DialogHeader><DialogTitle>Tambah Dokumen</DialogTitle></DialogHeader>
            <div className="grid gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Tipe Dokumen</Label>
                <Select value={form.document_type} onValueChange={v => setForm(f => ({ ...f, document_type: v }))}>
                  <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>{DOC_TYPES.map(t => <SelectItem key={t} value={t}>{DOC_TYPE_LABELS[t]}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1"><Label className="text-xs">Nama Dokumen</Label><Input className="rounded-xl" value={form.document_name} onChange={e => setForm(f => ({ ...f, document_name: e.target.value }))} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><Label className="text-xs">Tanggal Terbit</Label><Input type="date" className="rounded-xl" value={form.issue_date} onChange={e => setForm(f => ({ ...f, issue_date: e.target.value }))} /></div>
                <div className="space-y-1"><Label className="text-xs">Tanggal Expired</Label><Input type="date" className="rounded-xl" value={form.expiry_date} onChange={e => setForm(f => ({ ...f, expiry_date: e.target.value }))} /></div>
              </div>
              <div className="space-y-1"><Label className="text-xs">Catatan</Label><Textarea className="rounded-xl" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} /></div>
              <Button onClick={handleCreate} disabled={saving} className="rounded-xl gradient-cta">{saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}Simpan</Button>
            </div>
          </DialogContent>
        </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {docs.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">Belum ada dokumen</p>
        ) : (
          <div className="space-y-3">
            {docs.map(d => (
              <div key={d.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/50">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium">{d.document_name}</p>
                    <p className="text-xs text-muted-foreground">{DOC_TYPE_LABELS[d.document_type] || d.document_type}</p>
                  </div>
                </div>
                <div className="text-right">
                  {d.expiry_date && <p className="text-xs text-muted-foreground">Exp: {d.expiry_date}</p>}
                  <Badge variant="outline" className={isExpired(d) ? 'text-destructive border-destructive/30' : 'text-success border-success/30'}>
                    {isExpired(d) ? 'Expired' : d.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ====== Security Tab ======
function SecurityTab({ propertyId, merchantId, incidents }: { propertyId: string; merchantId: string; incidents: SecurityIncident[] }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ incident_date: '', incident_type: 'theft', severity: 'low', description: '', location_detail: '', reported_by: '', damage_cost: 0 });
  const [reportedByMode, setReportedByMode] = useState<'select' | 'custom'>('select');

  const { data: guardians = [] } = useQuery({
    queryKey: ['property-guardians-list', propertyId],
    queryFn: async () => {
      // TODO: Go endpoint not yet implemented — was: supabase.from('property_guardians').select(...)
      return [];
    },
    enabled: !!propertyId,
  });

  const { data: tenants = [] } = useQuery({
    queryKey: ['property-tenants-list', propertyId],
    queryFn: async () => {
      // TODO: Go endpoint not yet implemented — was: supabase.from('units'/'contracts'/'profiles').select(...)
      return [];
    },
    enabled: !!propertyId,
  });

  const handleCreate = async () => {
    setSaving(true);
    try {
      await complianceService.createSecurityIncident({
        ...form, property_id: propertyId, merchant_id: merchantId, status: 'open',
        police_report_number: null, resolution: null, resolved_at: null,
      });
      qc.invalidateQueries({ queryKey: ['compliance-summary', propertyId] });
      setOpen(false);
      toast.success('Insiden dicatat');
    } catch { toast.error('Gagal'); }
    setSaving(false);
  };

  const severityColor: Record<string, string> = { low: 'text-muted-foreground', medium: 'text-warning', high: 'text-destructive', critical: 'text-destructive' };

  const incidentTypeLabels: Record<string, string> = {
    theft: 'Pencurian', vandalism: 'Vandalisme', fire: 'Kebakaran', flood: 'Banjir', break_in: 'Pembobolan', harassment: 'Pelecehan', other: 'Lainnya',
  };

  const statusLabels: Record<string, string> = {
    open: 'Terbuka', investigating: 'Investigasi', resolved: 'Selesai', closed: 'Ditutup',
  };

  return (
    <Card className="rounded-2xl">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-lg">Insiden Keamanan</CardTitle>
          <CardDescription>Catat dan pantau insiden keamanan</CardDescription>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button size="sm" className="rounded-xl"><Plus className="h-4 w-4 mr-1" />Catat Insiden</Button></DialogTrigger>
          <DialogContent className="rounded-2xl">
            <DialogHeader><DialogTitle>Catat Insiden Keamanan</DialogTitle></DialogHeader>
            <div className="grid gap-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><Label className="text-xs">Tanggal</Label><Input type="datetime-local" className="rounded-xl" value={form.incident_date} onChange={e => setForm(f => ({ ...f, incident_date: e.target.value }))} /></div>
                <div className="space-y-1">
                  <Label className="text-xs">Tipe</Label>
                  <Select value={form.incident_type} onValueChange={v => setForm(f => ({ ...f, incident_type: v }))}>
                    <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                    <SelectContent>{INCIDENT_TYPES.map(t => <SelectItem key={t} value={t} className="capitalize">{incidentTypeLabels[t] || t}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Tingkat Keparahan</Label>
                  <Select value={form.severity} onValueChange={v => setForm(f => ({ ...f, severity: v }))}>
                    <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                    <SelectContent>{SEVERITY_LEVELS.map(l => <SelectItem key={l} value={l}>{RISK_LABEL[l]}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1"><Label className="text-xs">Biaya Kerusakan (Rp)</Label><Input type="number" className="rounded-xl" value={form.damage_cost} onChange={e => setForm(f => ({ ...f, damage_cost: Number(e.target.value) }))} /></div>
              </div>
              <div className="space-y-1"><Label className="text-xs">Deskripsi</Label><Textarea className="rounded-xl" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><Label className="text-xs">Lokasi Detail</Label><Input className="rounded-xl" value={form.location_detail} onChange={e => setForm(f => ({ ...f, location_detail: e.target.value }))} /></div>
                <div className="space-y-1">
                  <Label className="text-xs">Dilaporkan Oleh</Label>
                  {reportedByMode === 'select' ? (
                    <Select value={form.reported_by} onValueChange={v => {
                      if (v === '__custom__') { setReportedByMode('custom'); setForm(f => ({ ...f, reported_by: '' })); }
                      else setForm(f => ({ ...f, reported_by: v }));
                    }}>
                      <SelectTrigger className="rounded-xl"><SelectValue placeholder="Pilih pelapor" /></SelectTrigger>
                      <SelectContent>
                        {guardians.length > 0 && (
                          <>
                            <div className="px-2 py-1 text-[10px] font-semibold text-muted-foreground uppercase">Penjaga</div>
                            {guardians.map((g: any) => <SelectItem key={`g-${g.id}`} value={g.name}>{g.name}</SelectItem>)}
                          </>
                        )}
                        {tenants.length > 0 && (
                          <>
                            <div className="px-2 py-1 text-[10px] font-semibold text-muted-foreground uppercase">Penyewa</div>
                            {tenants.map((t: any) => <SelectItem key={`t-${t.user_id}`} value={t.full_name || 'Penyewa'}>{t.full_name || 'Penyewa'}</SelectItem>)}
                          </>
                        )}
                        <div className="px-2 py-1 text-[10px] font-semibold text-muted-foreground uppercase">Lainnya</div>
                        <SelectItem value="__custom__">Ketik manual...</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="flex gap-1">
                      <Input className="rounded-xl flex-1" placeholder="Nama pelapor" value={form.reported_by} onChange={e => setForm(f => ({ ...f, reported_by: e.target.value }))} />
                      <Button type="button" variant="ghost" size="sm" className="rounded-xl text-xs" onClick={() => setReportedByMode('select')}>List</Button>
                    </div>
                  )}
                </div>
              </div>
              <Button onClick={handleCreate} disabled={saving} className="rounded-xl gradient-cta">{saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}Simpan</Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {incidents.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">Belum ada insiden tercatat</p>
        ) : (
          <div className="space-y-3">
            {incidents.map(i => (
              <div key={i.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/50">
                <div>
                  <p className="font-medium capitalize">{incidentTypeLabels[i.incident_type] || i.incident_type}</p>
                  <p className="text-xs text-muted-foreground">{new Date(i.incident_date).toLocaleDateString('id-ID')} • {i.location_detail || 'Lokasi tidak dicatat'}</p>
                  {i.description && <p className="text-xs mt-1">{i.description}</p>}
                </div>
                <div className="text-right space-y-1">
                  <Badge variant="outline" className={severityColor[i.severity]}>{RISK_LABEL[i.severity]}</Badge>
                  {i.damage_cost > 0 && <p className="text-xs text-destructive font-medium">Rp {i.damage_cost.toLocaleString('id-ID')}</p>}
                  <Badge variant="secondary" className="text-xs">{statusLabels[i.status] || i.status}</Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
