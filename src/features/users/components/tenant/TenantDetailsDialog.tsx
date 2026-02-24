import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog';
import { Button } from '@/shared/components/ui/button';
import { Separator } from '@/shared/components/ui/separator';
import { Badge } from '@/shared/components/ui/badge';
import { Card, CardContent } from '@/shared/components/ui/card';
import { Progress } from '@/shared/components/ui/progress';
import { Building, Calendar, DollarSign, Home, Mail, Phone, User } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { formatCurrency } from '@/shared/utils/currency';
import { ActiveTenant } from '@/features/users/types/tenant';

interface TenantDetailsDialogProps {
  tenant: ActiveTenant | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const contractStatusColors: Record<string, string> = {
  active: 'bg-success/10 text-success border-success/30',
  linked: 'bg-info/10 text-info border-info/30',
  draft: 'bg-muted text-muted-foreground border-muted',
  pending_signature: 'bg-warning/10 text-warning border-warning/30',
  notice: 'bg-orange-500/10 text-orange-600 border-orange-500/30',
  expired: 'bg-muted text-muted-foreground border-muted',
  terminated: 'bg-destructive/10 text-destructive border-destructive/30',
};

function getInitials(name: string | null | undefined): string {
  if (!name) return '?';
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

function getAvatarColor(name: string | null | undefined): string {
  if (!name) return 'bg-muted';
  const colors = ['bg-primary', 'bg-info', 'bg-success', 'bg-warning', 'bg-accent'];
  const index = name.charCodeAt(0) % colors.length;
  return colors[index];
}

export function TenantDetailsDialog({ tenant, open, onOpenChange }: TenantDetailsDialogProps) {
  const navigate = useNavigate();
  if (!tenant) return null;

  const isLinked = tenant.status === 'linked';
  const hasValidDates = tenant.start_date && tenant.end_date && !isLinked;

  let progressPercent = 0;
  let elapsedDays = 0;
  let totalDays = 0;
  let startDate: Date | null = null;
  let endDate: Date | null = null;

  if (hasValidDates) {
    startDate = new Date(tenant.start_date);
    endDate = new Date(tenant.end_date);
    const now = new Date();
    totalDays = differenceInDays(endDate, startDate);
    elapsedDays = differenceInDays(now, startDate);
    progressPercent = totalDays > 0 ? Math.min(Math.max((elapsedDays / totalDays) * 100, 0), 100) : 0;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl w-[95vw] rounded-2xl">
        <DialogHeader>
          <DialogTitle className="sr-only">Detail Tenant</DialogTitle>
        </DialogHeader>

        {/* Header with Avatar */}
        <div className="flex items-center gap-4">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-lg font-bold text-primary-foreground ring-2 ring-primary/20 ring-offset-2 ring-offset-background ${getAvatarColor(tenant.profile?.full_name)}`}>
            {getInitials(tenant.profile?.full_name)}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-xl font-bold truncate">{tenant.profile?.full_name || 'Unknown Tenant'}</h3>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <Badge variant="outline" className={`rounded-full ${contractStatusColors[tenant.status] || ''}`}>{tenant.status === 'linked' ? 'Terhubung' : tenant.status}</Badge>
              {tenant.unit && <span className="text-sm text-muted-foreground">{tenant.unit.property?.name} • Unit {tenant.unit.unit_number}</span>}
              {isLinked && !tenant.unit && <span className="text-sm text-muted-foreground">Belum ada unit</span>}
            </div>
          </div>
        </div>

        <Separator />

        <div className="grid gap-4 sm:grid-cols-2">
          <Card className="bg-card/80 backdrop-blur-sm rounded-2xl border border-border/40">
            <CardContent className="pt-4 space-y-3">
              <h4 className="text-sm font-semibold flex items-center gap-2"><User className="h-4 w-4 text-primary" />Info Pribadi</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2"><Mail className="h-3.5 w-3.5 text-muted-foreground" /><span className="truncate">{tenant.profile?.email || '—'}</span></div>
                <div className="flex items-center gap-2"><Phone className="h-3.5 w-3.5 text-muted-foreground" /><span>{tenant.profile?.phone || 'Belum diset'}</span></div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/80 backdrop-blur-sm rounded-2xl border border-border/40">
            <CardContent className="pt-4 space-y-3">
              <h4 className="text-sm font-semibold flex items-center gap-2"><Home className="h-4 w-4 text-info" />Info Unit</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2"><Building className="h-3.5 w-3.5 text-muted-foreground" /><span>{tenant.unit?.property?.name || '—'}</span></div>
                <div className="flex items-center gap-2"><Home className="h-3.5 w-3.5 text-muted-foreground" /><span>Unit {tenant.unit?.unit_number || '—'}</span></div>
              </div>
            </CardContent>
          </Card>
        </div>

        {hasValidDates && startDate && endDate && (
          <Card className="bg-card/80 backdrop-blur-sm rounded-2xl border border-border/40">
            <CardContent className="pt-4 space-y-4">
              <h4 className="text-sm font-semibold flex items-center gap-2"><Calendar className="h-4 w-4 text-warning" />Timeline Kontrak</h4>
              <div>
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span>{format(startDate, 'MMM d, yyyy')}</span>
                  <span className="font-medium text-foreground">{Math.round(progressPercent)}%</span>
                  <span>{format(endDate, 'MMM d, yyyy')}</span>
                </div>
                <Progress value={progressPercent} className="h-2" />
                <p className="text-xs text-muted-foreground mt-1 text-center">
                  {elapsedDays > 0 ? `${elapsedDays} hari berlalu` : 'Belum dimulai'}{' • '}{totalDays - elapsedDays > 0 ? `${totalDays - elapsedDays} hari tersisa` : 'Kontrak selesai'}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {!isLinked && (
          <Card className="bg-card/80 backdrop-blur-sm rounded-2xl border border-border/40">
            <CardContent className="pt-4">
              <h4 className="text-sm font-semibold flex items-center gap-2 mb-3"><DollarSign className="h-4 w-4 text-success" />Ringkasan Keuangan</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 rounded-xl bg-gradient-to-br from-muted/50 to-muted/30 border border-border/30">
                  <p className="text-xs text-muted-foreground">Sewa Bulanan</p>
                  <p className="text-lg font-bold">{formatCurrency(tenant.rent_amount)}</p>
                </div>
                <div className="text-center p-3 rounded-xl bg-gradient-to-br from-muted/50 to-muted/30 border border-border/30">
                  <p className="text-xs text-muted-foreground">Deposit</p>
                  <p className="text-lg font-bold">{tenant.deposit_amount ? formatCurrency(tenant.deposit_amount) : '—'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {isLinked && (
          <Card className="bg-card/80 backdrop-blur-sm rounded-2xl border border-border/40">
            <CardContent className="pt-4 text-center text-sm text-muted-foreground">
              <p>Tenant ini terhubung ke merchant Anda tapi belum memiliki kontrak aktif.</p>
              <p className="mt-1">Buat kontrak melalui menu "Add Tenant" untuk menetapkan unit dan harga sewa.</p>
            </CardContent>
          </Card>
        )}

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="rounded-xl">Tutup</Button>
          <Button className="rounded-xl gradient-cta text-primary-foreground" onClick={() => { onOpenChange(false); navigate(`/merchant/tenants/${tenant.id}`); }}>
            Lihat Detail Lengkap
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
