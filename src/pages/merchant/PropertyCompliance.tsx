import { useAuth } from '@/features/auth/hooks/useAuth';
import { useComplianceSummary } from '@/features/compliance/hooks/useCompliance';
import { useMerchantProperties } from '@/features/properties/hooks/useMerchantProperties';
import { DISASTER_TYPES, DOC_TYPE_LABELS, DOC_TYPES, INCIDENT_TYPES, POLICY_TYPES, RISK_LABEL, RISK_LEVELS, SEVERITY_LEVELS } from '@/features/compliance/types';
import type { ComplianceDocument, DisasterRiskProfile, InsurancePolicy, SecurityIncident } from '@/features/compliance/types';
import { complianceService } from '@/features/compliance/services/complianceService';
import { RiskScoreIndicator } from '@/shared/components/dss/RiskScoreIndicator';
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
import { useState } from 'react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

export default function PropertyCompliance() {
  const { merchant } = useAuth();
  const { properties, loading: propsLoading } = useMerchantProperties(merchant?.id || '');
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('');

  const { data: summary, isLoading } = useComplianceSummary(selectedPropertyId || undefined);

  if (propsLoading) return <div className="flex items-center justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Risiko & Kepatuhan</h1>
          <p className="text-muted-foreground">Kelola risiko bencana, asuransi, dokumen & keamanan properti</p>
        </div>
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

  const handleSave = async () => {
    setSaving(true);
    try {
      await complianceService.upsertDisasterProfile({ ...form, property_id: propertyId, merchant_id: merchantId, disaster_history: profile?.disaster_history || [], mitigation_systems: profile?.mitigation_systems || [] });
      qc.invalidateQueries({ queryKey: ['compliance-summary', propertyId] });
      toast.success('Profil risiko diperbarui');
    } catch { toast.error('Gagal menyimpan'); }
    setSaving(false);
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
              <Label className="text-xs capitalize">{field.replace(/_/g, ' ')}</Label>
              <Select value={form[field]} onValueChange={v => setForm(f => ({ ...f, [field]: v }))}>
                <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {RISK_LEVELS.map(l => <SelectItem key={l} value={l}>{RISK_LABEL[l]}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          ))}
          <div className="space-y-1.5">
            <Label className="text-xs">Skor Risiko (0-100)</Label>
            <Input type="number" min={0} max={100} className="rounded-xl" value={form.overall_risk_score} onChange={e => setForm(f => ({ ...f, overall_risk_score: Number(e.target.value) }))} />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Catatan</Label>
          <Textarea className="rounded-xl" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
        </div>
        <Button onClick={handleSave} disabled={saving} className="rounded-xl gradient-cta">
          {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}Simpan Profil Risiko
        </Button>

        {/* Disaster History */}
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

  return (
    <Card className="rounded-2xl">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-lg">Polis Asuransi</CardTitle>
          <CardDescription>Kelola polis dan coverage properti</CardDescription>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button size="sm" className="rounded-xl"><Plus className="h-4 w-4 mr-1" />Tambah Polis</Button></DialogTrigger>
          <DialogContent className="rounded-2xl">
            <DialogHeader><DialogTitle>Tambah Polis Asuransi</DialogTitle></DialogHeader>
            <div className="grid gap-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><Label className="text-xs">No. Polis</Label><Input className="rounded-xl" value={form.policy_number} onChange={e => setForm(f => ({ ...f, policy_number: e.target.value }))} /></div>
                <div className="space-y-1"><Label className="text-xs">Provider</Label><Input className="rounded-xl" value={form.provider} onChange={e => setForm(f => ({ ...f, provider: e.target.value }))} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Tipe</Label>
                  <Select value={form.policy_type} onValueChange={v => setForm(f => ({ ...f, policy_type: v }))}>
                    <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                    <SelectContent>{POLICY_TYPES.map(t => <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>)}</SelectContent>
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
                  <p className="text-xs text-muted-foreground capitalize">{p.policy_type} • {p.start_date} s/d {p.end_date}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold">Rp {p.coverage_amount.toLocaleString('id-ID')}</p>
                  <Badge variant="outline" className={p.status === 'active' ? 'text-success border-success/30' : 'text-destructive border-destructive/30'}>{p.status}</Badge>
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

  const isExpired = (d: ComplianceDocument) => d.expiry_date && new Date(d.expiry_date) < new Date();

  return (
    <Card className="rounded-2xl">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-lg">Dokumen Kepatuhan</CardTitle>
          <CardDescription>IMB, PBB, sertifikat, polis</CardDescription>
        </div>
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
                    <SelectContent>{INCIDENT_TYPES.map(t => <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Severity</Label>
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
                <div className="space-y-1"><Label className="text-xs">Dilaporkan Oleh</Label><Input className="rounded-xl" value={form.reported_by} onChange={e => setForm(f => ({ ...f, reported_by: e.target.value }))} /></div>
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
                  <p className="font-medium capitalize">{i.incident_type}</p>
                  <p className="text-xs text-muted-foreground">{new Date(i.incident_date).toLocaleDateString('id-ID')} • {i.location_detail || 'Lokasi tidak dicatat'}</p>
                  {i.description && <p className="text-xs mt-1">{i.description}</p>}
                </div>
                <div className="text-right space-y-1">
                  <Badge variant="outline" className={severityColor[i.severity]}>{RISK_LABEL[i.severity]}</Badge>
                  {i.damage_cost > 0 && <p className="text-xs text-destructive font-medium">Rp {i.damage_cost.toLocaleString('id-ID')}</p>}
                  <Badge variant="secondary" className="text-xs">{i.status}</Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
