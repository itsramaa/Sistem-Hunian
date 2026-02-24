import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/integrations/supabase/client';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { Separator } from '@/shared/components/ui/separator';
import { Progress } from '@/shared/components/ui/progress';
import { ArrowLeft, Building, Calendar, DollarSign, FileText, Home, Loader2, Mail, Phone, User, Wrench } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { formatCurrency } from '@/shared/utils/currency';

const statusColors: Record<string, string> = {
  active: 'bg-success/10 text-success border-success/30',
  linked: 'bg-info/10 text-info border-info/30',
  draft: 'bg-muted text-muted-foreground border-muted',
  pending_signature: 'bg-warning/10 text-warning border-warning/30',
  expired: 'bg-muted text-muted-foreground border-muted',
  terminated: 'bg-destructive/10 text-destructive border-destructive/30',
};

const maintenanceStatusColors: Record<string, string> = {
  pending: 'bg-warning/10 text-warning border-warning/30',
  in_progress: 'bg-info/10 text-info border-info/30',
  resolved: 'bg-success/10 text-success border-success/30',
  closed: 'bg-muted text-muted-foreground border-muted',
};

function getInitials(name: string | null | undefined): string {
  if (!name) return '?';
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

function getAvatarColor(name: string | null | undefined): string {
  if (!name) return 'bg-muted';
  const colors = ['bg-primary', 'bg-info', 'bg-success', 'bg-warning', 'bg-accent'];
  return colors[name.charCodeAt(0) % colors.length];
}

export default function TenantDetail() {
  const { tenantId } = useParams<{ tenantId: string }>();
  const navigate = useNavigate();

  // tenantId here is actually the contract ID from PropertyDetail mapping
  const { data, isLoading } = useQuery({
    queryKey: ['tenant-detail', tenantId],
    queryFn: async () => {
      if (!tenantId) return null;

      // Try as contract ID first
      const { data: contract } = await supabase
        .from('contracts')
        .select('*, unit:units(id, unit_number, property:properties(id, name))')
        .eq('id', tenantId)
        .maybeSingle();

      if (contract) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, email, phone')
          .eq('user_id', contract.tenant_user_id)
          .maybeSingle();

        // Get all contracts for this tenant
        const { data: allContracts } = await supabase
          .from('contracts')
          .select('id, status, start_date, end_date, rent_amount, deposit_amount, unit:units(unit_number, property:properties(name))')
          .eq('tenant_user_id', contract.tenant_user_id)
          .order('created_at', { ascending: false });

        // Get payments
        const { data: payments } = await supabase
          .from('invoices')
          .select('id, invoice_number, status, amount, total_amount, due_date, paid_at')
          .eq('tenant_user_id', contract.tenant_user_id)
          .order('due_date', { ascending: false })
          .limit(20);

        // Get maintenance
        const { data: maintenance } = await supabase
          .from('maintenance_requests')
          .select('id, title, status, priority, created_at, unit:units(unit_number)')
          .eq('tenant_user_id', contract.tenant_user_id)
          .order('created_at', { ascending: false })
          .limit(20);

        return {
          contract,
          profile,
          allContracts: allContracts || [],
          payments: payments || [],
          maintenance: maintenance || [],
        };
      }
      return null;
    },
    enabled: !!tenantId,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <User className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
        <h3 className="text-lg font-medium mb-2">Tenant tidak ditemukan</h3>
        <Button asChild variant="outline" className="rounded-xl">
          <Link to="/merchant/tenants">Kembali</Link>
        </Button>
      </div>
    );
  }

  const { contract, profile, allContracts, payments, maintenance } = data;
  const unit = contract.unit as any;
  const startDate = new Date(contract.start_date);
  const endDate = new Date(contract.end_date);
  const now = new Date();
  const totalDays = differenceInDays(endDate, startDate);
  const elapsedDays = differenceInDays(now, startDate);
  const progressPercent = totalDays > 0 ? Math.min(Math.max((elapsedDays / totalDays) * 100, 0), 100) : 0;

  const paidInvoices = payments.filter((p: any) => p.status === 'paid').length;
  const totalInvoices = payments.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Button variant="ghost" size="icon" className="shrink-0 rounded-full bg-card/80 backdrop-blur-sm border border-border/40" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1 min-w-0 flex items-center gap-4">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-lg font-bold text-primary-foreground ring-2 ring-primary/20 ring-offset-2 ring-offset-background ${getAvatarColor(profile?.full_name)}`}>
            {getInitials(profile?.full_name)}
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold">{profile?.full_name || 'Unknown Tenant'}</h1>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <Badge variant="outline" className={`rounded-full ${statusColors[contract.status] || ''}`}>{contract.status}</Badge>
              {unit && <span className="text-sm text-muted-foreground">{unit.property?.name} • Unit {unit.unit_number}</span>}
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left: Main Info */}
        <div className="lg:col-span-2 space-y-4">
          {/* Personal Info */}
          <Card className="rounded-2xl bg-card/90 backdrop-blur-sm border border-border/40">
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><User className="h-4 w-4 text-primary" />Info Pribadi</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center gap-2"><Mail className="h-3.5 w-3.5 text-muted-foreground" /><span>{profile?.email || '—'}</span></div>
              <div className="flex items-center gap-2"><Phone className="h-3.5 w-3.5 text-muted-foreground" /><span>{profile?.phone || 'Belum diset'}</span></div>
              <div className="flex items-center gap-2"><Building className="h-3.5 w-3.5 text-muted-foreground" />{unit?.property?.id ? <Link to={`/merchant/properties/${unit.property.id}`} className="hover:underline text-primary">{unit.property.name}</Link> : <span>{unit?.property?.name || '—'}</span>}</div>
              <div className="flex items-center gap-2"><Home className="h-3.5 w-3.5 text-muted-foreground" />{unit?.id ? <Link to={`/merchant/units/${unit.id}`} className="hover:underline text-primary">Unit {unit.unit_number}</Link> : <span>Unit {unit?.unit_number || '—'}</span>}</div>
            </CardContent>
          </Card>

          {/* Contract Timeline */}
          <Card className="rounded-2xl bg-card/90 backdrop-blur-sm border border-border/40">
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><Calendar className="h-4 w-4 text-warning" />Timeline Kontrak Aktif</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{format(startDate, 'dd MMM yyyy')}</span>
                <span className="font-medium text-foreground">{Math.round(progressPercent)}%</span>
                <span>{format(endDate, 'dd MMM yyyy')}</span>
              </div>
              <Progress value={progressPercent} className="h-2" />
              <p className="text-xs text-muted-foreground text-center">
                {elapsedDays > 0 ? `${elapsedDays} hari berlalu` : 'Belum dimulai'}{' • '}{totalDays - elapsedDays > 0 ? `${totalDays - elapsedDays} hari tersisa` : 'Kontrak selesai'}
              </p>
              <Separator />
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 rounded-xl bg-muted/50 border border-border/30">
                  <p className="text-xs text-muted-foreground">Sewa Bulanan</p>
                  <p className="text-lg font-bold">{formatCurrency(contract.rent_amount)}</p>
                </div>
                <div className="text-center p-3 rounded-xl bg-muted/50 border border-border/30">
                  <p className="text-xs text-muted-foreground">Deposit</p>
                  <p className="text-lg font-bold">{contract.deposit_amount ? formatCurrency(contract.deposit_amount) : '—'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Riwayat Kontrak */}
          <Card className="rounded-2xl bg-card/90 backdrop-blur-sm border border-border/40">
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><FileText className="h-4 w-4 text-info" />Riwayat Kontrak</CardTitle></CardHeader>
            <CardContent>
              {allContracts.length > 0 ? (
                <div className="space-y-2">
                  {allContracts.map((c: any) => (
                    <div key={c.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/50 hover:bg-muted/70 transition-colors cursor-pointer" onClick={() => navigate(`/merchant/contracts/${c.id}`)}>
                      <div>
                        <p className="text-sm font-medium">{(c.unit as any)?.property?.name} - Unit {(c.unit as any)?.unit_number}</p>
                        <p className="text-xs text-muted-foreground">{format(new Date(c.start_date), 'dd MMM yyyy')} – {format(new Date(c.end_date), 'dd MMM yyyy')}</p>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline" className={`rounded-full text-xs ${statusColors[c.status] || ''}`}>{c.status}</Badge>
                        <p className="text-xs font-medium mt-1">{formatCurrency(c.rent_amount)}/bln</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : <p className="text-sm text-muted-foreground text-center py-4">Tidak ada riwayat kontrak</p>}
            </CardContent>
          </Card>

          {/* Maintenance Requests */}
          <Card className="rounded-2xl bg-card/90 backdrop-blur-sm border border-border/40">
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><Wrench className="h-4 w-4 text-warning" />Permintaan Maintenance</CardTitle></CardHeader>
            <CardContent>
              {maintenance.length > 0 ? (
                <div className="space-y-2">
                  {maintenance.map((m: any) => (
                    <div key={m.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/50 hover:bg-muted/70 transition-colors cursor-pointer" onClick={() => navigate(`/merchant/maintenance/${m.id}`)}>
                      <div>
                        <p className="text-sm font-medium">{m.title}</p>
                        <p className="text-xs text-muted-foreground">Unit {(m.unit as any)?.unit_number} • {format(new Date(m.created_at), 'dd MMM yyyy')}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="capitalize text-xs rounded-full">{m.priority}</Badge>
                        <Badge variant="outline" className={`capitalize text-xs rounded-full ${maintenanceStatusColors[m.status] || ''}`}>{m.status}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : <p className="text-sm text-muted-foreground text-center py-4">Tidak ada permintaan maintenance</p>}
            </CardContent>
          </Card>
        </div>

        {/* Right: Sidebar Stats */}
        <div className="space-y-4">
          <Card className="rounded-2xl bg-card/90 backdrop-blur-sm border border-border/40">
            <CardHeader><CardTitle className="text-base">Ringkasan Pembayaran</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Total Invoice</span><span className="font-medium">{totalInvoices}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Sudah Dibayar</span><span className="font-medium text-success">{paidInvoices}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Belum Dibayar</span><span className="font-medium text-warning">{totalInvoices - paidInvoices}</span></div>
              <Separator />
              <div className="flex justify-between"><span className="text-muted-foreground">Maintenance</span><span className="font-medium">{maintenance.length}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Kontrak</span><span className="font-medium">{allContracts.length}</span></div>
            </CardContent>
          </Card>

          {/* Recent Invoices */}
          <Card className="rounded-2xl bg-card/90 backdrop-blur-sm border border-border/40">
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><DollarSign className="h-4 w-4 text-success" />Invoice Terbaru</CardTitle></CardHeader>
            <CardContent>
              {payments.length > 0 ? (
                <div className="space-y-2">
                  {payments.slice(0, 5).map((inv: any) => (
                    <Link key={inv.id} to={`/merchant/invoices/${inv.id}`} className="flex items-center justify-between p-2 rounded-lg bg-muted/50 text-sm hover:bg-muted/70 transition-colors">
                      <div>
                        <p className="font-medium text-xs">{inv.invoice_number}</p>
                        <p className="text-xs text-muted-foreground">{format(new Date(inv.due_date), 'dd MMM yyyy')}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-medium">{formatCurrency(inv.total_amount)}</p>
                        <Badge variant="outline" className={`text-[10px] rounded-full ${inv.status === 'paid' ? 'text-success border-success/30' : 'text-warning border-warning/30'}`}>{inv.status}</Badge>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : <p className="text-xs text-muted-foreground text-center py-4">Belum ada invoice</p>}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}